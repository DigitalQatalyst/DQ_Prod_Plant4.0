import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventDetails, EventTimelineItem, EventAction, EventNote } from "@/types/workOrder";
import { UpstreamAlert, EventHistoryItem } from "@/types/navigation";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  User, 
  MessageSquare, 
  Activity,
  Link,
  Plus,
  Calendar,
  FileText,
  Settings,
  Eye
} from "lucide-react";
import { format } from "date-fns";

interface EventDetailsPaneProps {
  event: EventHistoryItem | UpstreamAlert;
  onClose?: () => void;
}

export function EventDetailsPane({ event, onClose }: EventDetailsPaneProps) {
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState<"General" | "Technical" | "Resolution">("General");
  const [activeTab, setActiveTab] = useState("overview");

  // Convert alert/event to EventDetails format for consistent handling
  const eventDetails: EventDetails = {
    id: event.id,
    title: event.title,
    assetId: event.assetId,
    assetName: event.assetName,
    category: "category" in event ? event.category : "Alert",
    severity: event.severity,
    timestamp: event.timestamp,
    duration: "duration" in event ? event.duration : undefined,
    description: event.description,
    status: event.status,
    correlatedEvents: [], // Mock data - would be populated from API
    timeline: generateMockTimeline(event),
    actionHistory: generateMockActionHistory(event),
    rootCause: "rootCause" in event ? event.rootCause : undefined,
    resolution: "resolution" in event ? event.resolution : undefined,
    notes: generateMockNotes(event)
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      const note: EventNote = {
        id: `note-${Date.now()}`,
        timestamp: new Date().toISOString(),
        note: newNote.trim(),
        user: "Current User",
        type: noteType
      };
      // In real implementation, this would update the event via API
      setNewNote("");
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "Critical": return AlertTriangle;
      case "Warning": return AlertTriangle;
      case "Information": return CheckCircle;
      default: return Clock;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "text-red-600 bg-red-50 border-red-200";
      case "Warning": return "text-orange-600 bg-orange-50 border-orange-200";
      case "Information": return "text-blue-600 bg-blue-50 border-blue-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active": return AlertTriangle;
      case "Investigating": return Clock;
      case "Resolved": return CheckCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "text-red-600 bg-red-50 border-red-200";
      case "Investigating": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Resolved": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const SeverityIcon = getSeverityIcon(eventDetails.severity);
  const StatusIcon = getStatusIcon(eventDetails.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <SeverityIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold mb-2">{eventDetails.title}</h3>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getSeverityColor(eventDetails.severity)}>
                {eventDetails.severity}
              </Badge>
              <Badge className={getStatusColor(eventDetails.status)}>
                {eventDetails.status}
              </Badge>
              <Badge variant="outline">{eventDetails.category}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              <div>{eventDetails.assetName}</div>
              <div>{format(new Date(eventDetails.timestamp), "PPpp")}</div>
              {eventDetails.duration && (
                <div>{eventDetails.duration} minutes duration</div>
              )}
            </div>
          </div>
        </div>

        <Card className="bg-secondary/30">
          <CardContent className="pt-4">
            <p className="text-sm">{eventDetails.description}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="correlation">Related</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Root Cause & Resolution */}
          {eventDetails.rootCause && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Root Cause Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm">{eventDetails.rootCause}</p>
              </CardContent>
            </Card>
          )}

          {eventDetails.resolution && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Resolution
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm">{eventDetails.resolution}</p>
              </CardContent>
            </Card>
          )}

          {/* Action History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Recent Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {eventDetails.actionHistory.slice(0, 5).map((action) => (
                    <div key={action.id} className="flex items-start gap-3 text-sm">
                      <span className="text-xs text-muted-foreground w-16 shrink-0">
                        {format(new Date(action.timestamp), "HH:mm")}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium">{action.action}</div>
                        <div className="text-muted-foreground">by {action.user}</div>
                        {action.result && (
                          <div className="text-xs text-muted-foreground mt-1">{action.result}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Event Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {eventDetails.timeline.map((item, index) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">{item.type}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(item.timestamp), "MMM d, HH:mm")}
                          </span>
                        </div>
                        <p className="text-sm">{item.description}</p>
                        {item.user && (
                          <p className="text-xs text-muted-foreground mt-1">by {item.user}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlation" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Link className="w-4 h-4" />
                Correlated Events
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {eventDetails.correlatedEvents.length > 0 ? (
                <div className="space-y-2">
                  {eventDetails.correlatedEvents.map((relatedEvent) => (
                    <div key={relatedEvent.id} className="p-2 border rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {relatedEvent.severity}
                        </Badge>
                        <span className="text-sm font-medium">{relatedEvent.title}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {relatedEvent.assetName} • {format(new Date(relatedEvent.timestamp), "MMM d, HH:mm")}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Link className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No correlated events found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Correlation Analysis */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pattern Analysis</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Similar events (30 days):</span>
                  <span className="font-medium">3 occurrences</span>
                </div>
                <div className="flex justify-between">
                  <span>Average resolution time:</span>
                  <span className="font-medium">2.5 hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Recurrence pattern:</span>
                  <span className="font-medium">Weekly</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          {/* Add Note */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Note
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="noteType">Note Type</Label>
                <Select value={noteType} onValueChange={(value: any) => setNoteType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Resolution">Resolution</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Note</Label>
                <Textarea
                  id="note"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add your note here..."
                  rows={3}
                />
              </div>
              <Button 
                onClick={handleAddNote} 
                disabled={!newNote.trim()}
                size="sm"
                className="w-full"
              >
                Add Note
              </Button>
            </CardContent>
          </Card>

          {/* Existing Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Notes & Comments
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-48">
                <div className="space-y-3">
                  {eventDetails.notes.map((note) => (
                    <div key={note.id} className="p-3 border rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-3 h-3" />
                        <span className="text-xs font-medium">{note.user}</span>
                        <Badge variant="outline" className="text-xs">
                          {note.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(new Date(note.timestamp), "MMM d, HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm">{note.note}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" className="flex-1">
          <Eye className="w-4 h-4 mr-2" />
          View Full Report
        </Button>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

// Helper functions to generate mock data
function generateMockTimeline(event: EventHistoryItem | UpstreamAlert): EventTimelineItem[] {
  const baseTime = new Date(event.timestamp);
  return [
    {
      id: "timeline-1",
      timestamp: new Date(baseTime.getTime() - 30 * 60000).toISOString(),
      type: "Event",
      description: "Initial event detected by monitoring system",
    },
    {
      id: "timeline-2", 
      timestamp: new Date(baseTime.getTime() - 15 * 60000).toISOString(),
      type: "Action",
      description: "Alert notification sent to operations team",
      user: "System"
    },
    {
      id: "timeline-3",
      timestamp: baseTime.toISOString(),
      type: "Status Change",
      description: `Event status changed to ${event.status}`,
      user: "Operations Team"
    }
  ];
}

function generateMockActionHistory(event: EventHistoryItem | UpstreamAlert): EventAction[] {
  return [
    {
      id: "action-1",
      timestamp: event.timestamp,
      action: "Event acknowledged",
      user: "John Smith",
      result: "Investigation started"
    },
    {
      id: "action-2",
      timestamp: new Date(new Date(event.timestamp).getTime() + 15 * 60000).toISOString(),
      action: "Field inspection initiated",
      user: "Sarah Jones",
      result: "Visual inspection completed"
    }
  ];
}

function generateMockNotes(event: EventHistoryItem | UpstreamAlert): EventNote[] {
  return [
    {
      id: "note-1",
      timestamp: event.timestamp,
      note: "Initial assessment indicates potential equipment malfunction. Scheduling detailed inspection.",
      user: "Operations Team",
      type: "General"
    },
    {
      id: "note-2",
      timestamp: new Date(new Date(event.timestamp).getTime() + 30 * 60000).toISOString(),
      note: "Vibration analysis shows bearing wear patterns. Recommend replacement during next maintenance window.",
      user: "Maintenance Engineer",
      type: "Technical"
    }
  ];
}