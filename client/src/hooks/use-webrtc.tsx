import { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface PeerConnection {
  peer: RTCPeerConnection;
  dataChannel?: RTCDataChannel;
}

export function useWebRTC(socket: WebSocket | null, roomId: string | null, userId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const peersRef = useRef<Record<string, PeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Initialize peer connection
  const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection(configuration);
    
    // Handle incoming streams
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams(prev => ({
        ...prev,
        [peerId]: remoteStream
      }));
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket && roomId) {
        socket.send(JSON.stringify({
          type: 'webrtc-signal',
          data: {
            type: 'ice-candidate',
            candidate: event.candidate,
            from: userId,
            to: peerId,
            roomId
          }
        }));
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Peer ${peerId} connection state:`, peerConnection.connectionState);
      
      if (peerConnection.connectionState === 'failed') {
        toast({
          title: "Connection Issue",
          description: "Having trouble connecting to a participant",
          variant: "destructive"
        });
      }
    };

    return peerConnection;
  }, [socket, roomId, userId, toast]);

  // Start local video
  const startLocalVideo = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      localStreamRef.current = stream;
      
      // Add tracks to existing peer connections
      Object.values(peersRef.current).forEach(({ peer }) => {
        stream.getTracks().forEach(track => {
          peer.addTrack(track, stream);
        });
      });
      
    } catch (error) {
      console.error('Failed to start local video:', error);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera and microphone access to join the video call",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Stop local video
  const stopLocalVideo = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setIsScreenSharing(false);
    
    // Clean up peer connections
    Object.values(peersRef.current).forEach(({ peer }) => {
      peer.close();
    });
    peersRef.current = {};
    setRemoteStreams({});
  }, []);

  // Toggle microphone
  const toggleMicrophone = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }, []);

  // Start screen share
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      // Replace video track in peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      
      Object.values(peersRef.current).forEach(({ peer }) => {
        const sender = peer.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });
      
      // Update local stream
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        const newStream = new MediaStream([videoTrack]);
        if (audioTrack) {
          newStream.addTrack(audioTrack);
        }
        
        setLocalStream(newStream);
        localStreamRef.current = newStream;
      }
      
      setIsScreenSharing(true);
      
      // Handle screen share ending
      videoTrack.onended = () => {
        stopScreenShare();
      };
      
    } catch (error) {
      console.error('Failed to start screen sharing:', error);
      toast({
        title: "Screen Share Failed",
        description: "Unable to start screen sharing",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Stop screen share
  const stopScreenShare = useCallback(async () => {
    setIsScreenSharing(false);
    
    try {
      // Restart camera
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      const videoTrack = cameraStream.getVideoTracks()[0];
      
      // Replace screen share with camera in peer connections
      Object.values(peersRef.current).forEach(({ peer }) => {
        const sender = peer.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });
      
      setLocalStream(cameraStream);
      localStreamRef.current = cameraStream;
      
    } catch (error) {
      console.error('Failed to restart camera after screen share:', error);
    }
  }, []);

  // Handle WebRTC signaling
  useEffect(() => {
    if (!socket) return;

    const handleSignaling = async (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'webrtc-signal') {
          const { data } = message;
          const { type, from } = data;
          
          if (!peersRef.current[from]) {
            peersRef.current[from] = {
              peer: createPeerConnection(from)
            };
            
            // Add local stream tracks if available
            if (localStreamRef.current) {
              localStreamRef.current.getTracks().forEach(track => {
                peersRef.current[from].peer.addTrack(track, localStreamRef.current!);
              });
            }
          }
          
          const peerConnection = peersRef.current[from].peer;
          
          switch (type) {
            case 'offer':
              await peerConnection.setRemoteDescription(data.offer);
              const answer = await peerConnection.createAnswer();
              await peerConnection.setLocalDescription(answer);
              
              if (socket && roomId) {
                socket.send(JSON.stringify({
                  type: 'webrtc-signal',
                  data: {
                    type: 'answer',
                    answer,
                    from: userId,
                    to: from,
                    roomId
                  }
                }));
              }
              break;
              
            case 'answer':
              await peerConnection.setRemoteDescription(data.answer);
              break;
              
            case 'ice-candidate':
              await peerConnection.addIceCandidate(data.candidate);
              break;
          }
        }
        
        // Handle user joining - initiate call
        if (message.type === 'user-joined' && message.data.userId !== userId) {
          const peerId = message.data.userId;
          
          if (!peersRef.current[peerId]) {
            peersRef.current[peerId] = {
              peer: createPeerConnection(peerId)
            };
            
            // Add local stream tracks
            if (localStreamRef.current) {
              localStreamRef.current.getTracks().forEach(track => {
                peersRef.current[peerId].peer.addTrack(track, localStreamRef.current!);
              });
            }
            
            // Create offer
            const offer = await peersRef.current[peerId].peer.createOffer();
            await peersRef.current[peerId].peer.setLocalDescription(offer);
            
            if (socket && roomId) {
              socket.send(JSON.stringify({
                type: 'webrtc-signal',
                data: {
                  type: 'offer',
                  offer,
                  from: userId,
                  to: peerId,
                  roomId
                }
              }));
            }
          }
        }
        
        // Handle user leaving
        if (message.type === 'user-left') {
          const peerId = message.data.userId;
          if (peersRef.current[peerId]) {
            peersRef.current[peerId].peer.close();
            delete peersRef.current[peerId];
            
            setRemoteStreams(prev => {
              const newStreams = { ...prev };
              delete newStreams[peerId];
              return newStreams;
            });
          }
        }
        
      } catch (error) {
        console.error('Error handling signaling:', error);
      }
    };

    socket.addEventListener('message', handleSignaling);
    
    return () => {
      socket.removeEventListener('message', handleSignaling);
    };
  }, [socket, roomId, userId, createPeerConnection]);

  // Join room when ready
  useEffect(() => {
    if (socket && roomId && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'join-room',
        roomId
      }));
    }
  }, [socket, roomId]);

  return {
    localStream,
    remoteStreams,
    startLocalVideo,
    stopLocalVideo,
    toggleMicrophone,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    peers: peersRef.current
  };
}
