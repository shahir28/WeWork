import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, Settings, Plus, ChevronRight } from "lucide-react";

interface Room {
  id: string;
  name: string;
  type: string;
  participantCount: number;
  isPublic: boolean;
}

interface User {
  id: string;
  name: string;
  username: string;
  avatar?: string;
}

interface SidebarProps {
  user: User;
  publicRooms: Room[];
  userRooms: Room[];
  currentRoom: Room | null;
  onRoomSelect: (room: Room) => void;
}

export default function Sidebar({ user, publicRooms, userRooms, currentRoom, onRoomSelect }: SidebarProps) {
  const [, setLocation] = useLocation();
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: "",
    description: "",
    type: "focus",
    isPublic: true
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createRoomMutation = useMutation({
    mutationFn: (roomData: any) => 
      apiRequest("POST", "/api/rooms", { ...roomData, createdBy: user.id }),
    onSuccess: (response) => {
      return response.json().then((room) => {
        queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
        setShowCreateRoom(false);
        setNewRoom({ name: "", description: "", type: "focus", isPublic: true });
        onRoomSelect(room);
        setLocation(`/room/${room.id}`);
        toast({
          title: "Room Created",
          description: "Your new room has been created successfully!"
        });
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleRoomClick = (room: Room) => {
    onRoomSelect(room);
    setLocation(`/room/${room.id}`);
  };

  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case 'focus':
        return 'bg-green-500';
      case 'casual':
        return 'bg-blue-500';
      case 'meeting':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const isActiveRoom = (roomId: string) => {
    return currentRoom?.id === roomId;
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Users className="text-white w-4 h-4" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">CoWork</h1>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => {
            alert('Settings panel coming soon! This will include theme toggle, notification preferences, and account settings.');
          }}
          data-testid="button-settings"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* User Profile */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <img 
            src={user.avatar || `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face`}
            alt="User profile" 
            className="w-10 h-10 rounded-full object-cover"
            data-testid="img-user-avatar"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white" data-testid="text-user-name">
              {user.name}
            </p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Room Navigation */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* My Rooms */}
          {userRooms.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                My Rooms
              </h3>
              <div className="space-y-2">
                {userRooms.map((room) => (
                  <Card
                    key={room.id}
                    className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      isActiveRoom(room.id) 
                        ? 'bg-primary/10 border-primary/20 dark:bg-primary/20' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => handleRoomClick(room)}
                    data-testid={`card-user-room-${room.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 ${getRoomTypeColor(room.type)} rounded-full`}></div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {room.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {room.participantCount} online
                        </span>
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Public Rooms */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Public Rooms
            </h3>
            <div className="space-y-2">
              {publicRooms.map((room) => (
                <Card
                  key={room.id}
                  className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    isActiveRoom(room.id) 
                      ? 'bg-primary/10 border-primary/20 dark:bg-primary/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => handleRoomClick(room)}
                  data-testid={`card-public-room-${room.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 ${getRoomTypeColor(room.type)} rounded-full`}></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {room.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {room.participantCount} online
                      </span>
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Create Room Button */}
          <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
            <DialogTrigger asChild>
              <Button 
                className="w-full" 
                size="lg"
                data-testid="button-create-room"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Room
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-create-room">
              <DialogHeader>
                <DialogTitle>Create New Room</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="room-name">Room Name</Label>
                  <Input
                    id="room-name"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter room name"
                    data-testid="input-room-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="room-description">Description (Optional)</Label>
                  <Textarea
                    id="room-description"
                    value={newRoom.description}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your room's purpose"
                    data-testid="input-room-description"
                  />
                </div>

                <div>
                  <Label htmlFor="room-type">Room Type</Label>
                  <Select 
                    value={newRoom.type} 
                    onValueChange={(value) => setNewRoom(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger data-testid="select-room-type">
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="focus">Focus Room</SelectItem>
                      <SelectItem value="casual">Casual Chat</SelectItem>
                      <SelectItem value="meeting">Meeting Room</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="room-public"
                    checked={newRoom.isPublic}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="rounded"
                    data-testid="input-room-public"
                  />
                  <Label htmlFor="room-public">Make room public</Label>
                </div>

                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowCreateRoom(false)}
                    data-testid="button-cancel-create"
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => createRoomMutation.mutate(newRoom)}
                    disabled={!newRoom.name.trim() || createRoomMutation.isPending}
                    data-testid="button-submit-create"
                  >
                    {createRoomMutation.isPending ? "Creating..." : "Create Room"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}