import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { generateMeetingSummary, generateFocusInsight, suggestAmbientSound } from "./services/openai";
import { insertUserSchema, insertRoomSchema } from "@shared/schema";

interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate';
  data: any;
  from: string;
  to: string;
  roomId: string;
}

interface SocketMessage {
  type: string;
  data: any;
  userId?: string;
  roomId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active connections
  const connections = new Map<string, { ws: WebSocket, userId?: string, roomId?: string }>();

  // WebSocket handling
  wss.on('connection', (ws) => {
    const connectionId = Math.random().toString(36);
    connections.set(connectionId, { ws });

    ws.on('message', async (message) => {
      try {
        const data: SocketMessage = JSON.parse(message.toString());
        const connection = connections.get(connectionId);
        
        if (!connection) return;

        switch (data.type) {
          case 'auth':
            connection.userId = data.data.userId;
            connection.roomId = data.data.roomId;
            await storage.updateUserOnlineStatus(data.data.userId, true);
            break;

          case 'join-room':
            connection.userId = data.userId;
            connection.roomId = data.roomId;
            
            // First leave any existing room for this user
            if (connection.userId) {
              const allParticipants = await getAllParticipants();
              for (const [roomId, participants] of allParticipants) {
                if (participants.some(p => p.userId === connection.userId)) {
                  await storage.leaveRoom(roomId, connection.userId);
                }
              }
            }
            
            // Join the new room
            await storage.joinRoom({
              roomId: data.roomId!,
              userId: data.userId!
            });
            
            // Get updated participant count
            const participants = await storage.getRoomParticipants(data.roomId!);
            
            // Notify all connected clients about room update
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'room-updated',
                  roomId: data.roomId,
                  participantCount: participants.length
                }));
              }
            });
            
            console.log(`User ${data.userId} joined room ${data.roomId} (${participants.length} total)`);
            break;

          case 'leave-room':
            if (data.userId && data.roomId) {
              await storage.leaveRoom(data.roomId, data.userId);
              
              // Get updated participant count
              const participants = await storage.getRoomParticipants(data.roomId);
              
              // Notify all connected clients about room update
              wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'room-updated',
                    roomId: data.roomId,
                    participantCount: participants.length
                  }));
                }
              });
              
              console.log(`User ${data.userId} left room ${data.roomId} (${participants.length} remaining)`);
              connection.roomId = undefined;
            }
            break;

          case 'webrtc-signal':
            // Forward WebRTC signaling
            const signal: WebRTCSignal = data.data;
            const targetConnection = Array.from(connections.values())
              .find(conn => conn.userId === signal.to && conn.roomId === signal.roomId);
            
            if (targetConnection && targetConnection.ws.readyState === WebSocket.OPEN) {
              targetConnection.ws.send(JSON.stringify({
                type: 'webrtc-signal',
                data: signal
              }));
            }
            break;

          case 'participant-status':
            if (connection.userId && connection.roomId) {
              await storage.updateParticipantStatus(
                connection.roomId,
                connection.userId,
                data.data
              );
              
              // Broadcast status change
              broadcastToRoom(connection.roomId, {
                type: 'participant-status-changed',
                data: { userId: connection.userId, ...data.data }
              }, connectionId);
            }
            break;

          case 'meeting-transcript':
            // Generate AI meeting summary
            if (connection.roomId && data.data.transcript) {
              const participants = await storage.getRoomParticipants(connection.roomId);
              const participantNames = participants.map(p => p.user.name);
              
              const summary = await generateMeetingSummary(
                data.data.transcript,
                participantNames
              );
              
              await storage.createMeetingNotes({
                roomId: connection.roomId,
                summary: summary.summary,
                actionItems: summary.actionItems,
                keyDecisions: summary.keyDecisions,
                participants: summary.participants
              });
              
              // Broadcast summary to room
              broadcastToRoom(connection.roomId, {
                type: 'meeting-summary',
                data: summary
              });
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', async () => {
      const connection = connections.get(connectionId);
      if (connection?.userId) {
        await storage.updateUserOnlineStatus(connection.userId, false);
        
        if (connection.roomId) {
          await storage.leaveRoom(connection.roomId, connection.userId);
          
          // Notify others in room
          broadcastToRoom(connection.roomId, {
            type: 'user-left',
            data: { userId: connection.userId }
          }, connectionId);
        }
      }
      connections.delete(connectionId);
    });
  });

  function broadcastToRoom(roomId: string, message: SocketMessage, excludeConnection?: string) {
    connections.forEach((connection, id) => {
      if (connection.roomId === roomId && 
          id !== excludeConnection && 
          connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify(message));
      }
    });
  }

  // REST API Routes
  
  // Get public rooms
  app.get('/api/rooms/public', async (req, res) => {
    try {
      const rooms = await storage.getPublicRooms();
      const roomsWithParticipants = await Promise.all(
        rooms.map(async (room) => {
          const participants = await storage.getRoomParticipants(room.id);
          return { ...room, participantCount: participants.length };
        })
      );
      res.json(roomsWithParticipants);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch rooms' });
    }
  });

  // Get user's rooms
  app.get('/api/rooms/user/:userId', async (req, res) => {
    try {
      const rooms = await storage.getUserRooms(req.params.userId);
      const roomsWithParticipants = await Promise.all(
        rooms.map(async (room) => {
          const participants = await storage.getRoomParticipants(room.id);
          return { ...room, participantCount: participants.length };
        })
      );
      res.json(roomsWithParticipants);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user rooms' });
    }
  });

  // Create room
  app.post('/api/rooms', async (req, res) => {
    try {
      const validatedData = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(validatedData);
      res.status(201).json(room);
    } catch (error) {
      res.status(400).json({ message: 'Invalid room data' });
    }
  });

  // Get room details
  app.get('/api/rooms/:roomId', async (req, res) => {
    try {
      const room = await storage.getRoom(req.params.roomId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      const participants = await storage.getRoomParticipants(room.id);
      res.json({ ...room, participants, participantCount: participants.length });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch room' });
    }
  });

  // Get room meeting notes
  app.get('/api/rooms/:roomId/notes', async (req, res) => {
    try {
      const notes = await storage.getRoomMeetingNotes(req.params.roomId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch meeting notes' });
    }
  });

  // Create user
  app.post('/api/users', async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: 'Invalid user data' });
    }
  });

  // Get user
  app.get('/api/users/:userId', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  // Start focus session
  app.post('/api/focus-sessions', async (req, res) => {
    try {
      const session = await storage.createFocusSession(req.body);
      res.status(201).json(session);
    } catch (error) {
      res.status(400).json({ message: 'Failed to start focus session' });
    }
  });

  // End focus session
  app.patch('/api/focus-sessions/:sessionId/end', async (req, res) => {
    try {
      const { duration, quality } = req.body;
      const session = await storage.endFocusSession(req.params.sessionId, duration, quality);
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      // Generate AI insight
      const room = await storage.getRoom(session.roomId);
      const insight = await generateFocusInsight(
        duration,
        room?.type || 'focus',
        new Date().getHours()
      );
      
      res.json({ session, insight });
    } catch (error) {
      res.status(500).json({ message: 'Failed to end focus session' });
    }
  });

  // Get user focus stats
  app.get('/api/users/:userId/focus-stats', async (req, res) => {
    try {
      const stats = await storage.getUserFocusStats(req.params.userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch focus stats' });
    }
  });

  // Get ambient sound suggestion
  app.get('/api/ambient-sound/suggest', async (req, res) => {
    try {
      const { roomType, participantCount, timeOfDay } = req.query;
      const sound = await suggestAmbientSound(
        roomType as string || 'focus',
        parseInt(participantCount as string) || 1,
        parseInt(timeOfDay as string) || 12
      );
      res.json({ suggestedSound: sound });
    } catch (error) {
      res.status(500).json({ message: 'Failed to suggest ambient sound' });
    }
  });

  // Helper function to get all participants across rooms
  async function getAllParticipants() {
    const allRooms = await storage.getPublicRooms();
    const roomParticipants = new Map();
    
    for (const room of allRooms) {
      const participants = await storage.getRoomParticipants(room.id);
      roomParticipants.set(room.id, participants);
    }
    
    return roomParticipants;
  }

  return httpServer;
}
