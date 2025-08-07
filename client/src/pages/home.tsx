import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import VideoConference from "@/components/video-conference";
import RightSidebar from "@/components/right-sidebar";
import { useSocket } from "@/hooks/use-socket";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Users, Video, Brain, Settings } from "lucide-react";

// Mock user for demo - in production this would come from auth
const MOCK_USER = {
  id: "user-1",
  name: "Alex Johnson",
  username: "alex.johnson",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
};

export default function Home() {
  const [, params] = useRoute("/room/:roomId");
  const roomId = params?.roomId || null;
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [showMobileNav, setShowMobileNav] = useState<'rooms' | 'video' | 'ai' | 'settings'>('video');
  const isMobile = useIsMobile();
  
  const { socket, isConnected } = useSocket();

  // Fetch room data if we have a roomId
  const { data: room } = useQuery({
    queryKey: ['/api/rooms', roomId],
    enabled: !!roomId,
  });

  const { data: publicRooms } = useQuery({
    queryKey: ['/api/rooms/public'],
  });

  const { data: userRooms } = useQuery({
    queryKey: ['/api/rooms/user', MOCK_USER.id],
  });

  useEffect(() => {
    if (room) {
      setCurrentRoom(room);
    }
  }, [room]);

  // Mobile bottom navigation
  const MobileBottomNav = () => (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 z-50">
      <div className="flex items-center justify-around">
        <button 
          className={`flex flex-col items-center space-y-1 ${showMobileNav === 'rooms' ? 'text-primary' : 'text-gray-600 dark:text-gray-400'}`}
          onClick={() => setShowMobileNav('rooms')}
          data-testid="button-mobile-rooms"
        >
          <Users className="w-5 h-5" />
          <span className="text-xs">Rooms</span>
        </button>
        <button 
          className={`flex flex-col items-center space-y-1 ${showMobileNav === 'video' ? 'text-primary' : 'text-gray-600 dark:text-gray-400'}`}
          onClick={() => setShowMobileNav('video')}
          data-testid="button-mobile-video"
        >
          <Video className="w-5 h-5" />
          <span className="text-xs">Video</span>
        </button>
        <button 
          className={`flex flex-col items-center space-y-1 ${showMobileNav === 'ai' ? 'text-primary' : 'text-gray-600 dark:text-gray-400'}`}
          onClick={() => setShowMobileNav('ai')}
          data-testid="button-mobile-ai"
        >
          <Brain className="w-5 h-5" />
          <span className="text-xs">AI Notes</span>
        </button>
        <button 
          className={`flex flex-col items-center space-y-1 ${showMobileNav === 'settings' ? 'text-primary' : 'text-gray-600 dark:text-gray-400'}`}
          onClick={() => setShowMobileNav('settings')}
          data-testid="button-mobile-settings"
        >
          <Settings className="w-5 h-5" />
          <span className="text-xs">Settings</span>
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Mobile Content */}
        <div className="flex-1 flex flex-col">
          {/* Mobile Header */}
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {currentRoom?.name || "CoWork"}
              </h1>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <Sidebar 
                    user={MOCK_USER}
                    publicRooms={publicRooms || []}
                    userRooms={userRooms || []}
                    currentRoom={currentRoom}
                    onRoomSelect={setCurrentRoom}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Mobile Main Content */}
          <div className="flex-1 overflow-hidden pb-20">
            {showMobileNav === 'video' && (
              <VideoConference 
                roomId={roomId}
                user={MOCK_USER}
                isConnected={isConnected}
                socket={socket}
              />
            )}
            {showMobileNav === 'ai' && (
              <RightSidebar 
                roomId={roomId}
                user={MOCK_USER}
                currentRoom={currentRoom}
              />
            )}
            {(showMobileNav === 'rooms' || showMobileNav === 'settings') && (
              <div className="p-4">
                <p className="text-gray-500 dark:text-gray-400">
                  {showMobileNav === 'rooms' ? 'Use the menu button to access rooms' : 'Settings coming soon'}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-80">
        <Sidebar 
          user={MOCK_USER}
          publicRooms={publicRooms || []}
          userRooms={userRooms || []}
          currentRoom={currentRoom}
          onRoomSelect={setCurrentRoom}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white" data-testid="text-room-name">
                  {currentRoom?.name || "Select a Room"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400" data-testid="text-room-info">
                  {currentRoom ? `${currentRoom.type} Room • ${currentRoom.participantCount || 0} members online` : "Choose a room to start collaborating"}
                </p>
              </div>
              {currentRoom && (
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" data-testid="indicator-room-active"></div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {/* Connection Status */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                isConnected 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`} data-testid="indicator-connection-status">
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium">
                  {isConnected ? 'Connected' : 'Connecting...'}
                </span>
              </div>

              {currentRoom && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/20"
                    onClick={() => {
                      // Scroll to AI Notes section or show AI panel
                      const aiSection = document.querySelector('[data-testid="text-ai-assistant"]');
                      aiSection?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    data-testid="button-ai-notes"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    AI Notes
                    <div className="w-2 h-2 bg-purple-500 rounded-full ml-2"></div>
                  </Button>

                  <Button 
                    size="sm" 
                    onClick={() => {
                      const roomUrl = `${window.location.origin}/room/${roomId}`;
                      navigator.clipboard.writeText(roomUrl).then(() => {
                        alert('Room link copied to clipboard!');
                      });
                    }}
                    data-testid="button-invite"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Invite
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Video Conference Area */}
        <VideoConference 
          roomId={roomId}
          user={MOCK_USER}
          isConnected={isConnected}
          socket={socket}
        />
      </div>

      {/* Right Sidebar - AI Features & Tools */}
      <div className="hidden xl:flex xl:flex-col xl:w-80">
        <RightSidebar 
          roomId={roomId}
          user={MOCK_USER}
          currentRoom={currentRoom}
        />
      </div>
    </div>
  );
}
