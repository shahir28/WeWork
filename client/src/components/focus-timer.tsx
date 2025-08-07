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
    mutationFn: () => 
      apiRequest("POST", "/api/focus", { 
        userId,
        roomId,
        duration: sessionDuration
      }),
    onSuccess: (response) => {
      return response.json().then((session) => {
        setCurrentSessionId(session.id);
        setIsRunning(true);
        queryClient.invalidateQueries({ queryKey: ['/api/focus/stats', userId] });
      });
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
    if (!isRunning && !currentSessionId) {
      startSessionMutation.mutate();
    } else {
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

  const presetDurations = [15, 25, 45, 60]; // in minutes

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
          <Clock className="text-white w-4 h-4" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white" data-testid="text-focus-timer">Focus Timer</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Pomodoro technique</p>
        </div>
      </div>

      {/* Timer Display */}
      <Card className="p-6 mb-6 text-center">
        <div className="mb-4">
          <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white mb-2" data-testid="text-timer-display">
            {formatTime(timeLeft)}
          </div>
          <Progress 
            value={getProgress()} 
            className="w-full h-2 mb-2"
            data-testid="progress-timer"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isRunning ? 'Focus session in progress' : timeLeft === 0 ? 'Session completed!' : 'Ready to start'}
          </p>
        </div>

        {/* Timer Controls */}
        <div className="flex items-center justify-center space-x-3">
          <Button
            size="lg"
            onClick={handleStartPause}
            disabled={startSessionMutation.isPending}
            className="w-12 h-12 rounded-full"
            data-testid="button-start-pause-timer"
          >
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={handleStop}
            className="w-12 h-12 rounded-full"
            data-testid="button-stop-timer"
          >
            <Square className="w-5 h-5" />
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={handleReset}
            className="w-12 h-12 rounded-full"
            data-testid="button-reset-timer"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>
      </Card>

      {/* Duration Presets */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Session Duration</p>
        <div className="grid grid-cols-2 gap-2">
          {presetDurations.map((duration) => (
            <Button
              key={duration}
              variant={sessionDuration === duration ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (!isRunning) {
                  setSessionDuration(duration);
                  setTimeLeft(duration * 60);
                }
              }}
              disabled={isRunning}
              data-testid={`button-duration-${duration}`}
            >
              {duration}m
            </Button>
          ))}
        </div>
      </div>

      {/* Focus Stats */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Today's Progress</p>
        
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-4 h-4 text-green-500 mr-1" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-sessions">
              {focusStats.totalSessions}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Sessions</p>
          </Card>
          
          <Card className="p-3 text-center">
            <div className="flex items-center justify-center mb-2">
              <Award className="w-4 h-4 text-blue-500 mr-1" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-duration">
              {formatDuration(focusStats.totalDuration)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Time</p>
          </Card>
        </div>

        {focusStats.totalSessions > 0 && (
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Focus Quality</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Based on completion rate</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {Math.round(focusStats.averageQuality * 100)}%
                </p>
              </div>
            </div>
            <Progress 
              value={focusStats.averageQuality * 100} 
              className="w-full h-2 mt-2"
            />
          </Card>
        )}
      </div>
    </div>
  );
}