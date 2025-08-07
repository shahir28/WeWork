import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FocusTimer from "@/components/focus-timer";
import AINotesComponent from "@/components/ai-notes";
import { Brain, CloudRain, Leaf, Flame, Coffee, Waves, Play, Pause, Volume2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  username: string;
  avatar?: string;
}

interface Room {
  id: string;
  name: string;
  type: string;
  ambientSound?: string;
}

interface AmbientSound {
  id: string;
  name: string;
  icon: any;
  description: string;
  file: string;
}

interface AmbientSoundResponse {
  suggestedSound: string;
}

interface RightSidebarProps {
  roomId: string | null;
  user: User;
  currentRoom: Room | null;
}

const ambientSounds: AmbientSound[] = [
  {
    id: "rain",
    name: "Rain Sounds",
    icon: CloudRain,
    description: "Focus enhancement",
    file: "/sounds/rain.mp3"
  },
  {
    id: "forest",
    name: "Forest Ambience",
    icon: Leaf,
    description: "Natural focus",
    file: "/sounds/forest.mp3"
  },
  {
    id: "fire",
    name: "Crackling Fire",
    icon: Flame,
    description: "Cozy atmosphere",
    file: "/sounds/fire.mp3"
  },
  {
    id: "cafe",
    name: "Coffee Shop",
    icon: Coffee,
    description: "Background chatter",
    file: "/sounds/cafe.mp3"
  },
  {
    id: "ocean",
    name: "Ocean Waves",
    icon: Waves,
    description: "Calming waves",
    file: "/sounds/ocean.mp3"
  }
];

export default function RightSidebar({ roomId, user, currentRoom }: RightSidebarProps) {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [audioElements] = useState<Map<string, HTMLAudioElement>>(new Map());

  // Get suggested ambient sound
  const { data: suggestedSound } = useQuery<AmbientSoundResponse>({
    queryKey: ['/api/ambient-sound/suggest', currentRoom?.type, 1, new Date().getHours()],
    enabled: !!currentRoom,
  });

  // Initialize audio elements
  useEffect(() => {
    ambientSounds.forEach(sound => {
      if (!audioElements.has(sound.id)) {
        const audio = new Audio(sound.file);
        audio.loop = true;
        audio.volume = volume;
        audioElements.set(sound.id, audio);
      }
    });

    return () => {
      // Cleanup audio elements
      audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
    };
  }, [audioElements, volume]);

  const toggleAmbientSound = (soundId: string) => {
    const audio = audioElements.get(soundId);
    if (!audio) return;

    if (currentlyPlaying === soundId) {
      // Stop current sound
      audio.pause();
      audio.currentTime = 0;
      setCurrentlyPlaying(null);
    } else {
      // Stop any currently playing sound
      if (currentlyPlaying) {
        const currentAudio = audioElements.get(currentlyPlaying);
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
      }
      
      // Start new sound
      audio.play().catch(console.error);
      setCurrentlyPlaying(soundId);
    }
  };

  // Update volume for all audio elements
  useEffect(() => {
    audioElements.forEach(audio => {
      audio.volume = volume;
    });
  }, [volume, audioElements]);

  return (
    <div className="bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 h-full flex flex-col">
      
      {/* AI Assistant Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Brain className="text-white w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white" data-testid="text-ai-assistant">AI Assistant</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Smart productivity insights</p>
          </div>
        </div>
      </div>

      {/* Focus Timer */}
      {roomId && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <FocusTimer userId={user.id} roomId={roomId} />
        </div>
      )}

      {/* AI Meeting Notes */}
      <div className="flex-1 overflow-y-auto">
        {roomId ? (
          <AINotesComponent roomId={roomId} userId={user.id} />
        ) : (
          <div className="p-6 text-center">
            <Brain className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Join a room to see AI-powered meeting notes and insights
            </p>
          </div>
        )}
      </div>

      {/* Ambient Sound Controls */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Ambient Sounds</h4>
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-gray-500" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              data-testid="slider-volume"
            />
          </div>
        </div>
        
        <div className="space-y-3">
          {ambientSounds.map((sound) => {
            const isPlaying = currentlyPlaying === sound.id;
            const isRecommended = suggestedSound?.suggestedSound === sound.id;
            const Icon = sound.icon;
            
            return (
              <Card
                key={sound.id}
                className={`p-3 cursor-pointer transition-colors ${
                  isPlaying 
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                } ${
                  isRecommended ? 'ring-2 ring-blue-500/20' : ''
                }`}
                onClick={() => toggleAmbientSound(sound.id)}
                data-testid={`card-ambient-sound-${sound.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isPlaying 
                        ? 'bg-green-500/20' 
                        : 'bg-primary/10'
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        isPlaying ? 'text-green-600 dark:text-green-400' : 'text-primary'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {sound.name}
                        </p>
                        {isRecommended && (
                          <Badge variant="secondary" className="text-xs">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isPlaying ? 'Currently playing' : sound.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2"
                    data-testid={`button-toggle-sound-${sound.id}`}
                  >
                    {isPlaying ? (
                      <Pause className="w-3 h-3" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
        
        {suggestedSound && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                AI suggests <strong>{ambientSounds.find(s => s.id === suggestedSound.suggestedSound)?.name}</strong> for optimal focus
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}