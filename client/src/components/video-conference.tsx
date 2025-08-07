import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWebRTC } from "@/hooks/use-webrtc";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  PhoneOff, 
  MoreVertical,
  Volume2,
  VolumeX 
} from "lucide-react";

interface User {
  id: string;
  name: string;
  username: string;
  avatar?: string;
}

interface Participant {
  id: string;
  user: User;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeaking: boolean;
}

interface VideoConferenceProps {
  roomId: string | null;
  user: User;
  isConnected: boolean;
  socket: WebSocket | null;
}

export default function VideoConference({ roomId, user, isConnected, socket }: VideoConferenceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const { 
    localStream, 
    remoteStreams, 
    startLocalVideo, 
    stopLocalVideo, 
    toggleMicrophone, 
    toggleCamera, 
    startScreenShare, 
    stopScreenShare,
    peers 
  } = useWebRTC(socket, roomId, user.id);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (roomId && isConnected) {
      startLocalVideo();
    }
    
    return () => {
      stopLocalVideo();
    };
  }, [roomId, isConnected, startLocalVideo, stopLocalVideo]);

  const handleToggleMicrophone = () => {
    toggleMicrophone();
    setIsMuted(prev => !prev);
    
    // Send status update via socket
    if (socket && roomId) {
      socket.send(JSON.stringify({
        type: 'participant-status',
        data: { isMuted: !isMuted }
      }));
    }
  };

  const handleToggleCamera = () => {
    toggleCamera();
    setIsVideoOff(prev => !prev);
    
    // Send status update via socket
    if (socket && roomId) {
      socket.send(JSON.stringify({
        type: 'participant-status',
        data: { isVideoOff: !isVideoOff }
      }));
    }
  };

  const handleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      setIsScreenSharing(false);
    } else {
      try {
        await startScreenShare();
        setIsScreenSharing(true);
      } catch (error) {
        console.error('Failed to start screen sharing:', error);
      }
    }
  };

  const handleLeaveRoom = () => {
    if (socket && roomId) {
      socket.send(JSON.stringify({
        type: 'leave-room'
      }));
    }
    stopLocalVideo();
  };

  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    const showControlsHandler = () => {
      setShowControls(true);
      clearTimeout(timer);
    };

    document.addEventListener('mousemove', showControlsHandler);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousemove', showControlsHandler);
    };
  }, [showControls]);

  if (!roomId) {
    return (
      <div className="flex-1 bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Select a Room</h3>
          <p className="text-gray-400">Choose a room from the sidebar to start your video conference</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-900 relative overflow-hidden">
      {/* Video Grid */}
      <div className="h-full p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
          
          {/* User's Video (Main) */}
          <div className="relative bg-gray-800 rounded-xl overflow-hidden col-span-1 md:col-span-2">
            {isVideoOff ? (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                <div className="text-center">
                  <img 
                    src={user.avatar || `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face`}
                    alt={user.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  />
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-gray-400 text-sm">Camera is off</p>
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover mirror-video"
                data-testid="video-local-stream"
              />
            )}
            
            {/* Video Info Overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
                  <span className="text-white text-sm font-medium" data-testid="text-local-user-name">
                    {user.name} (You)
                  </span>
                </div>
                <Badge variant="secondary" className="bg-green-500/90 text-white">
                  Focus Mode
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                {isMuted ? (
                  <div className="bg-red-500/90 backdrop-blur-sm rounded-lg p-2">
                    <MicOff className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2">
                    <Mic className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-white text-xs">HD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Remote Participants */}
          {Object.entries(remoteStreams).map(([peerId, stream]) => (
            <div key={peerId} className="relative bg-gray-800 rounded-xl overflow-hidden">
              <video
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                ref={(video) => {
                  if (video && stream) {
                    video.srcObject = stream;
                  }
                }}
                data-testid={`video-remote-${peerId}`}
              />
              
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                  <span className="text-white text-xs font-medium">
                    Participant {peerId.slice(0, 8)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Volume2 className="w-3 h-3 text-white" />
                  <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}

          {/* Empty participant slots */}
          {Array.from({ length: Math.max(0, 4 - Object.keys(remoteStreams).length) }).map((_, index) => (
            <div key={`empty-${index}`} className="relative bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Video className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Waiting for participants...</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="flex items-center justify-center space-x-4">
          
          {/* Microphone Toggle */}
          <Button
            size="lg"
            variant={isMuted ? "destructive" : "secondary"}
            className="w-12 h-12 rounded-full"
            onClick={handleToggleMicrophone}
            data-testid="button-toggle-microphone"
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          {/* Camera Toggle */}
          <Button
            size="lg"
            variant={isVideoOff ? "destructive" : "secondary"}
            className="w-12 h-12 rounded-full"
            onClick={handleToggleCamera}
            data-testid="button-toggle-camera"
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </Button>

          {/* Screen Share */}
          <Button
            size="lg"
            variant={isScreenSharing ? "default" : "secondary"}
            className="w-12 h-12 rounded-full"
            onClick={handleScreenShare}
            data-testid="button-screen-share"
          >
            <Monitor className="w-5 h-5" />
          </Button>

          {/* Leave Room */}
          <Button
            size="lg"
            variant="destructive"
            className="w-12 h-12 rounded-full"
            onClick={handleLeaveRoom}
            data-testid="button-leave-room"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>

          {/* More Options */}
          <Button
            size="lg"
            variant="secondary"
            className="w-12 h-12 rounded-full"
            data-testid="button-more-options"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Connection Status Indicator */}
      <div className="absolute top-4 right-4 z-40">
        <Card className="p-3 flex items-center space-x-3 bg-white/95 backdrop-blur-sm">
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`}></div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {isConnected ? 'Connected' : 'Connecting...'}
            </p>
            <p className="text-xs text-gray-500">
              {isConnected ? 'WebRTC • Low latency' : 'Please wait...'}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}