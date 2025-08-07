import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Brain, ChevronDown, ChevronRight, FileText, Target, Users, Sparkles } from "lucide-react";

interface AINotesProps {
  roomId: string;
}

interface MeetingNotes {
  id: string;
  summary: string | null;
  actionItems: string[] | null;
  keyDecisions: string[] | null;
  participants: string[] | null;
  generatedBy: string | null;
  createdAt: Date;
}

export default function AINotesComponent({ roomId }: AINotesProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>("summary");

  // Get meeting notes for this room
  const { data: notes, isLoading } = useQuery<MeetingNotes[]>({
    queryKey: ['/api/meeting-notes', roomId],
    enabled: !!roomId,
  });

  const latestNotes = notes?.[0]; // Get the most recent notes

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!latestNotes) {
    return (
      <div className="p-6 text-center">
        <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No meeting notes yet</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          AI will automatically generate notes when conversation activity is detected
        </p>
        <Badge variant="secondary" className="text-xs">
          <Sparkles className="w-3 h-3 mr-1" />
          AI-Powered
        </Badge>
      </div>
    );
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Brain className="text-white w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white" data-testid="text-ai-notes">AI Meeting Notes</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Generated {new Date(latestNotes.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          <Sparkles className="w-3 h-3 mr-1" />
          Live
        </Badge>
      </div>

      <div className="space-y-4">
        
        {/* Meeting Summary */}
        {latestNotes.summary && (
          <Collapsible 
            open={expandedSection === "summary"} 
            onOpenChange={() => toggleSection("summary")}
          >
            <CollapsibleTrigger asChild>
              <Card className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Meeting Summary</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">AI-generated overview</p>
                    </div>
                  </div>
                  {expandedSection === "summary" ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="mt-2 p-4 bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed" data-testid="text-meeting-summary">
                  {latestNotes.summary}
                </p>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Action Items */}
        {latestNotes.actionItems && latestNotes.actionItems.length > 0 && (
          <Collapsible 
            open={expandedSection === "actions"} 
            onOpenChange={() => toggleSection("actions")}
          >
            <CollapsibleTrigger asChild>
              <Card className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Target className="w-5 h-5 text-green-500" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Action Items</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {latestNotes.actionItems.length} items identified
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{latestNotes.actionItems.length}</Badge>
                  {expandedSection === "actions" ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="mt-2 p-4 bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
                <ul className="space-y-2" data-testid="list-action-items">
                  {latestNotes.actionItems.map((item, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{item}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Key Decisions */}
        {latestNotes.keyDecisions && latestNotes.keyDecisions.length > 0 && (
          <Collapsible 
            open={expandedSection === "decisions"} 
            onOpenChange={() => toggleSection("decisions")}
          >
            <CollapsibleTrigger asChild>
              <Card className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-purple-500 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">D</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Key Decisions</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {latestNotes.keyDecisions.length} decisions made
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{latestNotes.keyDecisions.length}</Badge>
                  {expandedSection === "decisions" ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="mt-2 p-4 bg-purple-50/50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800">
                <ul className="space-y-2" data-testid="list-key-decisions">
                  {latestNotes.keyDecisions.map((decision, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{decision}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Participants */}
        {latestNotes.participants && latestNotes.participants.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Users className="w-5 h-5 text-gray-500" />
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Participants</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {latestNotes.participants.length} people in this session
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2" data-testid="list-participants">
              {latestNotes.participants.map((participant, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {participant}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* AI Insights Footer */}
        <div className="mt-6 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Notes are automatically updated as your meeting progresses. All content is AI-generated based on conversation patterns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}