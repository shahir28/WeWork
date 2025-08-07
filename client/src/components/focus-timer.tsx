import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { Clock, Play, Pause, Square, RotateCcw, Award, Target } from "lucide-react";

interface FocusTimerProps {
  userId: string;
  roomId: string;
}

interface FocusSession {
  id: string;
  duration: number;
  startTime: Date;
  endTime?: Date;
  isCompleted: boolean;
}

interface FocusStats {
  totalSessions: number;
  totalDuration: number;
  averageQuality: number;
}

export default function FocusTimer({ userId, roomId }: FocusTimerProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(25); // in minutes
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  // Get focus stats
  const { data: focusStats = { totalSessions: 0, totalDuration: 0, averageQuality: 0 } } = useQuery<FocusStats>({
    queryKey: ['/api/focus/stats', userId]
  });

  // Start focus session mutation
  const startSessionMutation = useMutation({
    mutationFn: () => {
      console.log('Mutation function called with:', { userId, roomId, duration: sessionDuration });
      return apiRequest("POST", "/api/focus", { 
        userId,
        roomId,
        duration: sessionDuration
      });
    },
    onSuccess: (response) => {
      console.log('Mutation success:', response);
      response.json().then((session) => {
        console.log('Session created:', session);
        setCurrentSessionId(session.id);
        setIsRunning(true);
        queryClient.invalidateQueries({ queryKey: ['/api/focus/stats', userId] });
      });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
    }
  });

  // Complete focus session mutation
  const completeSessionMutation = useMutation({
    mutationFn: () => 
      apiRequest("PATCH", `/api/focus/${currentSessionId}`, { 
        isCompleted: true,
        actualDuration: sessionDuration * 60 - timeLeft
      }),
    onSuccess: () => {
      setCurrentSessionId(null);
      setIsRunning(false);
      setTimeLeft(sessionDuration * 60);
      queryClient.invalidateQueries({ queryKey: ['/api/focus/stats', userId] });
    }
  });

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Session completed
            if (currentSessionId) {
              completeSessionMutation.mutate();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, currentSessionId, completeSessionMutation]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getProgress = () => {
    return ((sessionDuration * 60 - timeLeft) / (sessionDuration * 60)) * 100;
  };

  const handleStartPause = () => {
    console.log('handleStartPause called!', { isRunning, currentSessionId, userId, roomId });
    if (!isRunning && !currentSessionId) {
      console.log('Starting new focus session...', { userId, roomId, sessionDuration });
      startSessionMutation.mutate();
    } else {
      console.log('Toggling pause/resume...');
      setIsRunning(!isRunning);
    }
  };

  const handleStop = () => {
    if (currentSessionId) {
      completeSessionMutation.mutate();
    } else {
      setIsRunning(false);
      setTimeLeft(sessionDuration * 60);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(sessionDuration * 60);
    setCurrentSessionId(null);
  };

  const handleDurationChange = (newDuration: number) => {
    if (!isRunning) {
      setSessionDuration(newDuration);
      setTimeLeft(newDuration * 60);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Focus Timer</h3>
        </div>
        <div className="flex items-center space-x-1">
          {[15, 25, 45, 60].map((duration) => (
            <Button
              key={duration}
              variant={sessionDuration === duration ? "default" : "outline"}
              size="sm"
              onClick={() => handleDurationChange(duration)}
              disabled={isRunning}
              className="px-2 py-1 text-xs"
              data-testid={`button-duration-${duration}`}
            >
              {duration}m
            </Button>
          ))}
        </div>
      </div>

      <div className="text-center mb-4">
        <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white mb-2" data-testid="text-timer-display">
          {formatTime(timeLeft)}
        </div>
        <Progress value={getProgress()} className="h-2 mb-4" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isRunning ? 'Focus session in progress' : 'Ready to focus'}
        </p>
      </div>

      <div className="flex items-center justify-center space-x-2 mb-4">
        <Button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Button clicked!');
            handleStartPause();
          }}
          size="lg"
          disabled={startSessionMutation.isPending}
          className={`px-6 ${isRunning ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}
          data-testid="button-timer-start-pause"
        >
          {startSessionMutation.isPending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isRunning ? (
            <>
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Start
            </>
          )}
        </Button>

        <Button 
          onClick={handleStop}
          variant="outline"
          size="lg"
          disabled={!isRunning && !currentSessionId}
          data-testid="button-timer-stop"
        >
          <Square className="w-5 h-5 mr-2" />
          Stop
        </Button>

        <Button 
          onClick={handleReset}
          variant="ghost"
          size="lg"
          disabled={isRunning}
          data-testid="button-timer-reset"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Reset
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Target className="w-4 h-4 text-green-600 dark:text-green-400 mr-1" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Sessions</span>
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white" data-testid="text-sessions-count">
            {focusStats.totalSessions}
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-1" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Time</span>
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white" data-testid="text-total-time">
            {formatDuration(focusStats.totalDuration)}
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Award className="w-4 h-4 text-purple-600 dark:text-purple-400 mr-1" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Quality</span>
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white" data-testid="text-quality-score">
            {focusStats.averageQuality > 0 ? `${Math.round(focusStats.averageQuality * 100)}%` : '--'}
          </div>
        </div>
      </div>
    </Card>
  );
}