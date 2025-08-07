import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Brain, FileText, Sparkles, MessageSquare, Download, RefreshCw } from "lucide-react";

interface AINotesProps {
  roomId: string;
  userId: string;
}

interface MeetingNote {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  summary?: string;
  actionItems?: string[];
  keyPoints?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export default function AINotesComponent({ roomId, userId }: AINotesProps) {
  const [notes, setNotes] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  const queryClient = useQueryClient();

  // Get meeting notes for the room
  const { data: meetingNotes = [] } = useQuery<MeetingNote[]>({
    queryKey: ['/api/meeting-notes', roomId],
    enabled: !!roomId,
  });

  // Save notes mutation
  const saveNotesMutation = useMutation({
    mutationFn: (content: string) => 
      apiRequest("POST", "/api/meeting-notes", {
        roomId,
        userId,
        content
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meeting-notes', roomId] });
      setNotes("");
    }
  });

  // Generate AI summary mutation
  const generateSummaryMutation = useMutation({
    mutationFn: (noteId: string) => 
      apiRequest("POST", `/api/meeting-notes/${noteId}/summary`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meeting-notes', roomId] });
    }
  });

  const handleSaveNotes = () => {
    if (notes.trim()) {
      saveNotesMutation.mutate(notes);
    }
  };

  const handleGenerateSummary = (noteId: string) => {
    setIsGeneratingSummary(true);
    generateSummaryMutation.mutate(noteId, {
      onSettled: () => setIsGeneratingSummary(false)
    });
  };

  const latestNote = meetingNotes[0];

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white" data-testid="text-ai-assistant">
              AI Meeting Assistant
            </h3>
          </div>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
            <Sparkles className="w-3 h-3 mr-1" />
            Smart
          </Badge>
        </div>

        {/* Note Taking Area */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Meeting Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Type your meeting notes here... AI will help generate summaries and action items."
              className="min-h-[120px] resize-none"
              data-testid="textarea-meeting-notes"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Button 
              onClick={handleSaveNotes}
              disabled={!notes.trim() || saveNotesMutation.isPending}
              data-testid="button-save-notes"
            >
              {saveNotesMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Save Notes
            </Button>

            {latestNote && (
              <Button 
                variant="outline"
                onClick={() => handleGenerateSummary(latestNote.id)}
                disabled={isGeneratingSummary || generateSummaryMutation.isPending}
                data-testid="button-generate-summary"
              >
                {isGeneratingSummary || generateSummaryMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate Summary
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Recent Notes and Summaries */}
      {meetingNotes.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h4 className="text-md font-semibold text-gray-900 dark:text-white">
              Recent Notes
            </h4>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {meetingNotes.slice(0, 3).map((note) => (
              <div key={note.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString()}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleGenerateSummary(note.id)}
                    data-testid={`button-summarize-${note.id}`}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Refresh
                  </Button>
                </div>

                <div className="text-sm text-gray-700 dark:text-gray-300 max-h-32 overflow-hidden">
                  {note.content}
                </div>

                {note.summary && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 space-y-2">
                    <div className="flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                        AI Summary
                      </span>
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      {note.summary}
                    </p>
                    
                    {note.actionItems && note.actionItems.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
                          Action Items:
                        </p>
                        <ul className="text-xs text-purple-600 dark:text-purple-400 space-y-1">
                          {note.actionItems.map((item, index) => (
                            <li key={index} className="flex items-start space-x-1">
                              <span className="block w-1 h-1 bg-current rounded-full mt-1.5 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {meetingNotes.length > 3 && (
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm" data-testid="button-view-all-notes">
                <Download className="w-4 h-4 mr-2" />
                View All Notes
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* AI Features Preview */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <div className="flex items-center space-x-2 mb-3">
          <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h4 className="text-md font-semibold text-gray-900 dark:text-white">
            AI-Powered Features
          </h4>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-gray-700 dark:text-gray-300">Auto Summaries</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-gray-700 dark:text-gray-300">Action Items</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            <span className="text-gray-700 dark:text-gray-300">Key Points</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
            <span className="text-gray-700 dark:text-gray-300">Smart Export</span>
          </div>
        </div>
      </Card>
    </div>
  );
}