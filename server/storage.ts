import { type User, type InsertUser, type Room, type InsertRoom, type RoomParticipant, type InsertRoomParticipant, type FocusSession, type InsertFocusSession, type MeetingNotes, type InsertMeetingNotes } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void>;
  updateUserCurrentRoom(id: string, roomId: string | null): Promise<void>;

  // Rooms
  getRoom(id: string): Promise<Room | undefined>;
  getRoomsByType(type: string): Promise<Room[]>;
  getPublicRooms(): Promise<Room[]>;
  getUserRooms(userId: string): Promise<Room[]>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: string, updates: Partial<Room>): Promise<Room | undefined>;

  // Room Participants
  getRoomParticipants(roomId: string): Promise<(RoomParticipant & { user: User })[]>;
  joinRoom(participant: InsertRoomParticipant): Promise<RoomParticipant>;
  leaveRoom(roomId: string, userId: string): Promise<void>;
  updateParticipantStatus(roomId: string, userId: string, updates: Partial<RoomParticipant>): Promise<void>;

  // Focus Sessions
  createFocusSession(session: InsertFocusSession): Promise<FocusSession>;
  endFocusSession(id: string, duration: number, quality?: number): Promise<FocusSession | undefined>;
  getUserFocusStats(userId: string): Promise<{ totalSessions: number; totalDuration: number; averageQuality: number }>;

  // Meeting Notes
  createMeetingNotes(notes: InsertMeetingNotes): Promise<MeetingNotes>;
  getRoomMeetingNotes(roomId: string): Promise<MeetingNotes[]>;
  updateMeetingNotes(id: string, updates: Partial<MeetingNotes>): Promise<MeetingNotes | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private rooms: Map<string, Room> = new Map();
  private roomParticipants: Map<string, RoomParticipant> = new Map();
  private focusSessions: Map<string, FocusSession> = new Map();
  private meetingNotes: Map<string, MeetingNotes> = new Map();

  constructor() {
    // Create some default public rooms
    this.createRoom({
      name: "Coffee Chat",
      description: "Casual conversation and networking",
      type: "casual",
      isPublic: true,
      createdBy: "system",
      ambientSound: "cafe"
    });
    
    this.createRoom({
      name: "Study Hall",
      description: "Quiet focus time with others",
      type: "focus",
      isPublic: true,
      createdBy: "system",
      ambientSound: "forest"
    });
    
    this.createRoom({
      name: "Creative Lounge",
      description: "Brainstorming and creative work",
      type: "meeting",
      isPublic: true,
      createdBy: "system",
      ambientSound: "rain"
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      isOnline: false,
      currentRoomId: null,
      avatar: insertUser.avatar || null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      this.users.set(id, { ...user, isOnline });
    }
  }

  async updateUserCurrentRoom(id: string, roomId: string | null): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      this.users.set(id, { ...user, currentRoomId: roomId });
    }
  }

  async getRoom(id: string): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async getRoomsByType(type: string): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter(room => room.type === type);
  }

  async getPublicRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter(room => room.isPublic);
  }

  async getUserRooms(userId: string): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter(room => room.createdBy === userId);
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = randomUUID();
    const room: Room = { 
      ...insertRoom, 
      id,
      description: insertRoom.description || null,
      isPublic: insertRoom.isPublic ?? true,
      maxParticipants: insertRoom.maxParticipants || null,
      ambientSound: insertRoom.ambientSound || null,
      createdAt: new Date()
    };
    this.rooms.set(id, room);
    return room;
  }

  async updateRoom(id: string, updates: Partial<Room>): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (room) {
      const updated = { ...room, ...updates };
      this.rooms.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async getRoomParticipants(roomId: string): Promise<(RoomParticipant & { user: User })[]> {
    const participants = Array.from(this.roomParticipants.values())
      .filter(p => p.roomId === roomId);
    
    return participants.map(participant => {
      const user = this.users.get(participant.userId);
      return { ...participant, user: user! };
    }).filter(p => p.user);
  }

  async joinRoom(insertParticipant: InsertRoomParticipant): Promise<RoomParticipant> {
    const id = randomUUID();
    const participant: RoomParticipant = {
      ...insertParticipant,
      id,
      joinedAt: new Date(),
      isMuted: false,
      isVideoOff: false,
      isSpeaking: false
    };
    this.roomParticipants.set(id, participant);
    await this.updateUserCurrentRoom(insertParticipant.userId, insertParticipant.roomId);
    return participant;
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const participant = Array.from(this.roomParticipants.values())
      .find(p => p.roomId === roomId && p.userId === userId);
    
    if (participant) {
      this.roomParticipants.delete(participant.id);
      await this.updateUserCurrentRoom(userId, null);
    }
  }

  async updateParticipantStatus(roomId: string, userId: string, updates: Partial<RoomParticipant>): Promise<void> {
    const participant = Array.from(this.roomParticipants.values())
      .find(p => p.roomId === roomId && p.userId === userId);
    
    if (participant) {
      const updated = { ...participant, ...updates };
      this.roomParticipants.set(participant.id, updated);
    }
  }

  async createFocusSession(insertSession: InsertFocusSession): Promise<FocusSession> {
    const id = randomUUID();
    const session: FocusSession = {
      ...insertSession,
      id,
      startTime: new Date(),
      endTime: null,
      duration: null,
      quality: null,
      notes: null
    };
    this.focusSessions.set(id, session);
    return session;
  }

  async endFocusSession(id: string, duration: number, quality?: number): Promise<FocusSession | undefined> {
    const session = this.focusSessions.get(id);
    if (session) {
      const updated = {
        ...session,
        endTime: new Date(),
        duration,
        quality: quality || null
      };
      this.focusSessions.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async getUserFocusStats(userId: string): Promise<{ totalSessions: number; totalDuration: number; averageQuality: number }> {
    const userSessions = Array.from(this.focusSessions.values())
      .filter(s => s.userId === userId && s.duration !== null);
    
    const totalSessions = userSessions.length;
    const totalDuration = userSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const avgQuality = userSessions.length > 0 
      ? userSessions.reduce((sum, s) => sum + (s.quality || 0), 0) / userSessions.length
      : 0;

    return {
      totalSessions,
      totalDuration,
      averageQuality: avgQuality
    };
  }

  async createMeetingNotes(insertNotes: InsertMeetingNotes): Promise<MeetingNotes> {
    const id = randomUUID();
    const notes: MeetingNotes = {
      ...insertNotes,
      id,
      summary: insertNotes.summary || null,
      actionItems: insertNotes.actionItems || null,
      keyDecisions: insertNotes.keyDecisions || null,
      participants: insertNotes.participants || null,
      generatedBy: insertNotes.generatedBy || "ai",
      createdAt: new Date()
    };
    this.meetingNotes.set(id, notes);
    return notes;
  }

  async getRoomMeetingNotes(roomId: string): Promise<MeetingNotes[]> {
    return Array.from(this.meetingNotes.values())
      .filter(notes => notes.roomId === roomId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async updateMeetingNotes(id: string, updates: Partial<MeetingNotes>): Promise<MeetingNotes | undefined> {
    const notes = this.meetingNotes.get(id);
    if (notes) {
      const updated = { ...notes, ...updates };
      this.meetingNotes.set(id, updated);
      return updated;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
