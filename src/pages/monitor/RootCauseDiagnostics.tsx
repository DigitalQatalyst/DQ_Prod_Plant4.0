import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { cn } from "@/lib/utils";
import {
  useDiagnosticEvents,
  useRCARecords,
  useCreateRCARecord,
  useAcknowledgeDiagnosticEvent,
  useCloseDiagnosticEvent,
  useFMEAEntries,
  type RCARecordWithEvent,
} from "@/hooks/useAPM";
import type { DiagnosticEvent, DiagnosticEventType, EventState } from "@/types/apm";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Search,
  Lightbulb,
  Wrench,
  FileText,
  AlertCircle,
  XCircle,
  Loader2,
  Plus,
  Check,
  X,
  Lock,
  Calendar,
  Zap,
  ArrowLeft
} from "lucide-react";
import { RootCauseOverview } from "@/components/apm/RootCauseOverview";

export function RootCauseDiagnostics() {
  const { sector, subsector } = useApp();
  const [selectedEvent, setSelectedEvent] = useState<DiagnosticEvent | null>(null);
  const [showRCAForm, setShowRCAForm] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [rcaFormData, setRCAFormData] = useState({
    root_cause: '',
    contributing_factors: '',
    corrective_actions: '',
    preventive_actions: '',
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');

  // Permission check - in a real app, this would come from user context
  // For now, we'll simulate authorized roles
  const hasOperationsRole = true; // Requirement 9.9: restrict to authorized operations roles
  const hasEngineerRole = true; // Requirement 10.6: allow authorized engineers to create RCA

  // Fetch diagnostic events
  const {
    data: diagnosticEvents,
    loading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents
  } = useDiagnosticEvents({
    page: 1,
    pageSize: 50,
  });

  // Fetch RCA records
  const {
    data: rcaRecords,
    loading: rcaLoading,
    refetch: refetchRCA
  } = useRCARecords({
    page: 1,
    pageSize: 50,
  });

  // Fetch FMEA entries for selected event's asset type
  const selectedAsset = rcaRecords?.find(rca => rca.event_id === selectedEvent?.id)?.asset;
  const { data: fmeaEntries } = useFMEAEntries({
    asset_type: selectedAsset?.asset_type,
  });

  // Mutations
  const acknowledgeEvent = useAcknowledgeDiagnosticEvent();
  const closeEvent = useCloseDiagnosticEvent();
  const createRCA = useCreateRCARecord();

  // ─── Deterministic Mock Data Generation ───────────────────────────────────────
  const mockEvents = useMemo(() => {
    const events: DiagnosticEvent[] = [];
    const types: DiagnosticEventType[] = ["thermal", "electrical", "mechanical", "insulation", "comms"];
    const states: EventState[] = ["open", "ack", "closed"];

    const templates = [
      { title: "Winding temperature trend high", type: "thermal" },
      { title: "Anomaly detected in phase A current", type: "electrical" },
      { title: "Abnormal vibration signature on main bearing", type: "mechanical" },
      { title: "Dissolved gas concentration rising", type: "insulation" },
      { title: "Intermittent SCADA communication loss", type: "comms" },
      { title: "Voltage harmonic distortion exceeded limit", type: "electrical" },
      { title: "Bushing tan-delta shift detected", type: "insulation" },
      { title: "Load tap changer transition time high", type: "mechanical" }
    ];

    templates.forEach((tpl, i) => {
      const daysAgo = (i * 2) % 15;
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);

      events.push({
        id: `mock-rca-event-${i}`,
        asset_id: `mock-asset-${i % 3}`,
        event_type: tpl.type as DiagnosticEventType,
        title: tpl.title,
        description: `Automated diagnostic detected a potential issue based on ${tpl.type} parameter trends. Investigation recommended.`,
        confidence: 65 + (i * 7 % 35),
        state: states[i % 3],
        detected_at: date.toISOString(),
        created_at: date.toISOString(),
      });
    });

    return events;
  }, []);

  const mockRCARecords = useMemo(() => {
    return mockEvents.filter(e => e.state === "closed").map((event, i) => ({
      id: `mock-rca-rec-${i}`,
      event_id: event.id,
      root_cause: "Insulation degradation due to thermal cycling and moisture ingress.",
      contributing_factors: "Ambient temperature extremes, prolonged high-load operation.",
      corrective_actions: "Replaced faulty sensor and improved cooling system flow.",
      preventive_actions: "Adjusted maintenance schedule for quarterly filter inspection.",
      created_at: new Date(new Date(event.detected_at).getTime() + 86400000).toISOString(),
      created_by: "system_admin@skunkworks.ai",
      asset: {
        id: event.asset_id,
        name: `Mock Asset ${i + 1}`,
        asset_type: "Transformer"
      }
    }));
  }, [mockEvents]);

  // Fallback logic
  const effectiveDiagnosticEvents = useMemo(() => {
    if (diagnosticEvents && diagnosticEvents.length > 0) return diagnosticEvents;
    return mockEvents;
  }, [diagnosticEvents, mockEvents]);

  // Filtering logic
  const filteredEvents = useMemo(() => {
    return effectiveDiagnosticEvents.filter(event => {
      // Search query
      if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !event.event_type.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // State filter
      if (stateFilter !== 'all' && event.state !== stateFilter) {
        return false;
      }
      // Type filter
      if (eventTypeFilter !== 'all' && event.event_type !== eventTypeFilter) {
        return false;
      }
      return true;
    });
  }, [effectiveDiagnosticEvents, searchQuery, stateFilter, eventTypeFilter]);

  const effectiveRCARecords = useMemo(() => {
    if (rcaRecords && rcaRecords.length > 0) return rcaRecords;
    return mockRCARecords;
  }, [rcaRecords, mockRCARecords]);

  // Find RCA record for selected event
  const selectedEventRCA = (effectiveRCARecords as RCARecordWithEvent[])?.find(
    rca => rca.event_id === selectedEvent?.id
  );

  const handleAcknowledge = async () => {
    if (!selectedEvent || !hasOperationsRole) return; // Requirement 9.9: permission check

    await acknowledgeEvent.mutate({
      event_id: selectedEvent.id,
      acknowledged_by: 'current_user@example.com',
    });

    await refetchEvents();
    const updatedEvents = diagnosticEvents;
    const updated = updatedEvents?.find(e => e.id === selectedEvent.id);
    if (updated) {
      setSelectedEvent(updated);
    }
  };

  const handleClose = async () => {
    if (!selectedEvent || !resolutionNotes || !hasOperationsRole) return; // Requirements 9.8, 9.9

    await closeEvent.mutate({
      event_id: selectedEvent.id,
      closed_by: 'current_user@example.com',
      resolution_notes: resolutionNotes,
    });

    await refetchEvents();
    const updatedEvents = diagnosticEvents;
    const updated = updatedEvents?.find(e => e.id === selectedEvent.id);
    if (updated) {
      setSelectedEvent(updated);
    }

    setShowCloseForm(false);
    setResolutionNotes('');
  };

  const handleCreateRCA = async () => {
    if (!selectedEvent || !rcaFormData.root_cause || !hasEngineerRole) return; // Requirement 10.6: permission check

    await createRCA.mutate({
      event_id: selectedEvent.id,
      root_cause: rcaFormData.root_cause,
      contributing_factors: rcaFormData.contributing_factors,
      corrective_actions: rcaFormData.corrective_actions,
      preventive_actions: rcaFormData.preventive_actions,
      created_by: 'current_user@example.com',
    });

    await refetchRCA();

    setShowRCAForm(false);
    setRCAFormData({
      root_cause: '',
      contributing_factors: '',
      corrective_actions: '',
      preventive_actions: '',
    });
  };

  const getEventTypeIcon = (eventType: DiagnosticEventType) => {
    switch (eventType) {
      case "thermal":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case "electrical":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "mechanical":
        return <Wrench className="w-4 h-4 text-blue-500" />;
      case "insulation":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "comms":
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case "open":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "ack":
        return <Search className="w-4 h-4 text-yellow-500" />;
      case "closed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStateBadgeVariant = (state: string) => {
    switch (state) {
      case "open":
        return "destructive";
      case "ack":
        return "outline";
      case "closed":
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
  };

  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      const stateOrder = { open: 0, ack: 1, closed: 2 };
      const stateDiff = stateOrder[a.state as keyof typeof stateOrder] - stateOrder[b.state as keyof typeof stateOrder];
      if (stateDiff !== 0) return stateDiff;

      return new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime();
    });
  }, [filteredEvents]);

  return (
    <div className="flex h-full w-full">
      <ListPane
        title="Diagnostic Events"
        subtitle="Events requiring root cause analysis"
        count={sortedEvents.length}
        searchPlaceholder="Search events..."
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        statusFilter={stateFilter}
        onStatusChange={setStateFilter}
        customStatusOptions={[
          { value: "all", label: "All States" },
          { value: "open", label: "Open" },
          { value: "ack", label: "Acknowledged" },
          { value: "closed", label: "Resolved" },
        ]}
        customStatusColorMap={{
          open: "bg-red-500",
          ack: "bg-yellow-500",
          closed: "bg-green-500",
        }}
        typeFilter={eventTypeFilter}
        onTypeChange={setEventTypeFilter}
        assetTypes={["thermal", "electrical", "mechanical", "insulation", "comms"]}
      >
        {eventsLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : eventsError ? (
          <div className="flex items-center justify-center p-8 text-destructive">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="text-sm">Failed to load events</span>
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No diagnostic events found</p>
          </div>
        ) : (
          sortedEvents.map((event) => (
            <button
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className={cn(
                "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-200",
                selectedEvent?.id === event.id
                  ? "bg-primary/10 border border-primary/30"
                  : "hover:bg-secondary/50 border border-transparent"
              )}
            >
              <div className="flex items-center gap-2 mt-1">
                {getEventTypeIcon(event.event_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className={cn(
                    "text-sm font-medium line-clamp-2",
                    selectedEvent?.id === event.id ? "text-primary" : "text-foreground"
                  )}>
                    {event.title}
                  </span>
                  <Badge
                    variant={getStateBadgeVariant(event.state) as any}
                    className="text-xs shrink-0"
                  >
                    {event.state}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                  {event.event_type} • Confidence: {event.confidence}%
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimestamp(event.detected_at)}</span>
                </div>
              </div>
            </button>
          ))
        )}
      </ListPane>

      {!selectedEvent ? (
        <div className="flex-1 h-full overflow-hidden bg-background">
          <RootCauseOverview
            events={effectiveDiagnosticEvents || []}
            loading={eventsLoading}
            onSelectEvent={setSelectedEvent}
          />
        </div>
      ) : (
        <WorkPane
          title={selectedEvent.title}
          subtitle={`${selectedEvent.event_type} event • Root Cause Analysis`}
          tabs={[
            {
              id: "overview",
              label: "Overview",
              content: (
                <div className="space-y-6 -mr-4 pr-4">
                  {/* Back to overview */}
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group mb-4 print:hidden"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    Back to Overview
                  </button>

                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold">{selectedEvent.title}</h3>
                        <Badge variant={getStateBadgeVariant(selectedEvent.state) as any}>
                          {selectedEvent.state}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Confidence: {selectedEvent.confidence}%</span>
                        <span>•</span>
                        <span>{formatTimestamp(selectedEvent.detected_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {sector && (
                          <Badge variant="secondary" className="text-xs">
                            {sector}
                          </Badge>
                        )}
                        {subsector && (
                          <Badge variant="outline" className="text-xs">
                            {subsector}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {selectedEvent.event_type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStateIcon(selectedEvent.state)}
                    </div>
                  </div>

                  {selectedEvent.description && (
                    <Card className="w-full">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          Event Description
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {selectedEvent.description}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {selectedEvent.state === "open" && (
                    <Card className="w-full">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Event Actions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={handleAcknowledge}
                            disabled={acknowledgeEvent.loading || !hasOperationsRole}
                          >
                            {acknowledgeEvent.loading ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4 mr-2" />
                            )}
                            Acknowledge
                          </Button>
                          {!hasOperationsRole && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Operations role required
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedEvent.state === "ack" && !showCloseForm && (
                    <Card className="w-full">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Event Actions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => setShowCloseForm(true)}
                            disabled={!hasOperationsRole}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Close Event
                          </Button>
                          {!hasOperationsRole && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Operations role required
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {showCloseForm && selectedEvent.state === "ack" && (
                    <Card className="w-full">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Close Event</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="resolution_notes">Resolution Notes *</Label>
                            <Textarea
                              id="resolution_notes"
                              value={resolutionNotes}
                              onChange={(e) => setResolutionNotes(e.target.value)}
                              placeholder="Describe how this event was resolved..."
                              className="mt-1"
                              rows={4}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Required: Explain the resolution and any actions taken
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={handleClose}
                              disabled={closeEvent.loading || !resolutionNotes.trim()}
                            >
                              {closeEvent.loading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              Close Event
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setShowCloseForm(false);
                                setResolutionNotes('');
                              }}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          </div>

                          {closeEvent.error && (
                            <div className="text-sm text-destructive">
                              {closeEvent.error.message}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedEventRCA ? (
                    <Card className="w-full">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Lightbulb className="w-5 h-5" />
                          Root Cause Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Root Cause</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedEventRCA.root_cause}
                          </p>
                        </div>

                        {selectedEventRCA.contributing_factors && (
                          <div>
                            <Label className="text-sm font-medium">Contributing Factors</Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              {selectedEventRCA.contributing_factors}
                            </p>
                          </div>
                        )}

                        {selectedEventRCA.corrective_actions && (
                          <div>
                            <Label className="text-sm font-medium">Corrective Actions</Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              {selectedEventRCA.corrective_actions}
                            </p>
                          </div>
                        )}

                        {selectedEventRCA.preventive_actions && (
                          <div>
                            <Label className="text-sm font-medium">Preventive Actions</Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              {selectedEventRCA.preventive_actions}
                            </p>
                          </div>
                        )}

                        {selectedEventRCA.downtime_event && (
                          <div className="pt-3 border-t">
                            <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4" />
                              Linked Downtime Event
                            </Label>
                            <div className="p-3 rounded-lg bg-secondary/30 border space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                  {selectedEventRCA.downtime_event.event_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Downtime Event'}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {selectedEventRCA.downtime_event.duration_minutes ?
                                    `${Math.round(selectedEventRCA.downtime_event.duration_minutes / 60)}h ${selectedEventRCA.downtime_event.duration_minutes % 60}m` :
                                    'Ongoing'}
                                </Badge>
                              </div>
                              {selectedEventRCA.downtime_event.description && (
                                <p className="text-xs text-muted-foreground">
                                  {selectedEventRCA.downtime_event.description}
                                </p>
                              )}
                              {selectedEventRCA.downtime_event.grid_impact_mw && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Zap className="w-3 h-3" />
                                  <span>Grid Impact: {selectedEventRCA.downtime_event.grid_impact_mw} MW</span>
                                </div>
                              )}
                              {selectedEventRCA.downtime_event.outage_scope && (
                                <div className="text-xs text-muted-foreground">
                                  Scope: {selectedEventRCA.downtime_event.outage_scope}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {selectedEventRCA.asset && (
                          <div className="pt-3 border-t">
                            <Label className="text-sm font-medium mb-2 block">Asset Information</Label>
                            <div className="p-3 rounded-lg bg-secondary/30 border space-y-1">
                              <div className="text-sm font-medium">{selectedEventRCA.asset.name}</div>
                              <div className="text-xs text-muted-foreground">
                                Type: {selectedEventRCA.asset.asset_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Location: {selectedEventRCA.asset.location}
                              </div>
                              {selectedEventRCA.asset.voltage_kv && (
                                <div className="text-xs text-muted-foreground">
                                  Voltage: {selectedEventRCA.asset.voltage_kv} kV
                                </div>
                              )}
                              <Badge variant="outline" className="text-xs mt-1">
                                {selectedEventRCA.asset.criticality}
                              </Badge>
                            </div>
                          </div>
                        )}

                        <div className="pt-2 border-t text-xs text-muted-foreground">
                          Created {formatTimestamp(selectedEventRCA.created_at)}
                          {selectedEventRCA.created_by && ` by ${selectedEventRCA.created_by}`}
                        </div>
                      </CardContent>
                    </Card>
                  ) : selectedEvent.state !== "closed" && hasEngineerRole && (
                    <Card className="w-full">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Lightbulb className="w-5 h-5" />
                          Root Cause Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {showRCAForm ? (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="root_cause">Root Cause *</Label>
                              <Textarea
                                id="root_cause"
                                value={rcaFormData.root_cause}
                                onChange={(e) => setRCAFormData({ ...rcaFormData, root_cause: e.target.value })}
                                placeholder="Describe the root cause of this event..."
                                className="mt-1"
                                rows={3}
                              />
                            </div>

                            <div>
                              <Label htmlFor="contributing_factors">Contributing Factors</Label>
                              <Textarea
                                id="contributing_factors"
                                value={rcaFormData.contributing_factors}
                                onChange={(e) => setRCAFormData({ ...rcaFormData, contributing_factors: e.target.value })}
                                placeholder="List contributing factors..."
                                className="mt-1"
                                rows={3}
                              />
                            </div>

                            <div>
                              <Label htmlFor="corrective_actions">Corrective Actions</Label>
                              <Textarea
                                id="corrective_actions"
                                value={rcaFormData.corrective_actions}
                                onChange={(e) => setRCAFormData({ ...rcaFormData, corrective_actions: e.target.value })}
                                placeholder="Describe corrective actions taken..."
                                className="mt-1"
                                rows={3}
                              />
                            </div>

                            <div>
                              <Label htmlFor="preventive_actions">Preventive Actions</Label>
                              <Textarea
                                id="preventive_actions"
                                value={rcaFormData.preventive_actions}
                                onChange={(e) => setRCAFormData({ ...rcaFormData, preventive_actions: e.target.value })}
                                placeholder="Describe preventive actions to avoid recurrence..."
                                className="mt-1"
                                rows={3}
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={handleCreateRCA}
                                disabled={createRCA.loading || !rcaFormData.root_cause}
                              >
                                {createRCA.loading ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4 mr-2" />
                                )}
                                Save RCA
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setShowRCAForm(false);
                                  setRCAFormData({
                                    root_cause: '',
                                    contributing_factors: '',
                                    corrective_actions: '',
                                    preventive_actions: '',
                                  });
                                }}
                              >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                              </Button>
                            </div>

                            {createRCA.error && (
                              <div className="text-sm text-destructive">
                                {createRCA.error.message}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground mb-4">
                              No root cause analysis has been created for this event yet.
                            </p>
                            {hasEngineerRole ? (
                              <Button size="sm" onClick={() => setShowRCAForm(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create RCA
                              </Button>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <Button size="sm" disabled>
                                  <Lock className="w-4 h-4 mr-2" />
                                  Create RCA
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                  Engineer role required to create RCA
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {fmeaEntries && fmeaEntries.length > 0 && (
                    <Card className="w-full">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Recommended Checks (FMEA)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {fmeaEntries.slice(0, 5).map((fmea) => (
                            <div key={fmea.id} className="p-3 rounded-lg bg-secondary/30 border">
                              <div className="flex items-start justify-between mb-2">
                                <span className="text-sm font-medium">{fmea.failure_mode}</span>
                                <Badge variant="outline" className="text-xs">
                                  RPN: {fmea.rpn}
                                </Badge>
                              </div>
                              {fmea.failure_cause && (
                                <p className="text-xs text-muted-foreground mb-2">
                                  <strong>Cause:</strong> {fmea.failure_cause}
                                </p>
                              )}
                              {fmea.recommended_actions && (
                                <p className="text-xs text-muted-foreground">
                                  <strong>Actions:</strong> {fmea.recommended_actions}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ),
            },
            {
              id: "history",
              label: "History",
              content: (
                <div className="space-y-4 -mr-4 pr-4">
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle className="text-base">Event Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                          <div>
                            <p className="text-sm font-medium">Event Detected</p>
                            <p className="text-xs text-muted-foreground">{formatTimestamp(selectedEvent.detected_at)}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {selectedEvent.title} detected with {selectedEvent.confidence}% confidence
                            </p>
                          </div>
                        </div>

                        {selectedEvent.acknowledged_at && (
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
                            <div>
                              <p className="text-sm font-medium">Event Acknowledged</p>
                              <p className="text-xs text-muted-foreground">
                                {formatTimestamp(selectedEvent.acknowledged_at)}
                              </p>
                              {selectedEvent.acknowledged_by && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  By {selectedEvent.acknowledged_by}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {selectedEventRCA && (
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                            <div>
                              <p className="text-sm font-medium">RCA Created</p>
                              <p className="text-xs text-muted-foreground">
                                {formatTimestamp(selectedEventRCA.created_at)}
                              </p>
                              {selectedEventRCA.created_by && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  By {selectedEventRCA.created_by}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {selectedEvent.closed_at && (
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                            <div>
                              <p className="text-sm font-medium">Event Closed</p>
                              <p className="text-xs text-muted-foreground">
                                {formatTimestamp(selectedEvent.closed_at)}
                              </p>
                              {selectedEvent.closed_by && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  By {selectedEvent.closed_by}
                                </p>
                              )}
                              {selectedEvent.resolution_notes && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  <strong>Resolution:</strong> {selectedEvent.resolution_notes}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
