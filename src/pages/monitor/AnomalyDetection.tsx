import { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Asset } from "@/types/navigation";
import { APMPageShell } from "@/components/apm/APMPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Activity,
  Clock,
  TrendingUp,
  Zap,
  Thermometer,
  Gauge,
  Eye,
  Search,
  Filter,
  Loader2,
  Wifi,
  Cog,
  ArrowLeft
} from "lucide-react";
import { useAssets, useDiagnosticEvents, useTelemetrySeries } from "@/hooks/useAPM";
import type { DiagnosticEvent, DiagnosticEventType, EventState } from "@/types/apm";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { AnomalyDetectionOverview } from "@/components/apm/AnomalyDetectionOverview";

export function AnomalyDetection() {
  const { sector, subsector } = useApp();
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<any | null>(null);
  const [selectedEventTypes, setSelectedEventTypes] = useState<DiagnosticEventType[]>([]);
  const [selectedState, setSelectedState] = useState<EventState | "all">("all");
  const [selectedEvent, setSelectedEvent] = useState<DiagnosticEvent | null>(null);
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");

  // Fetch assets from database instead of using mock data
  const { data: assetsResponse, loading: assetsLoading } = useAssets({
    page: 1,
    pageSize: 100,
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // Convert database assets to the format expected by APMPageShell
  const assets = (assetsResponse?.data || []).map((asset: any) => ({
    id: asset.id,
    name: asset.name,
    type: asset.properties?.asset_type || 'Unknown',
    status: asset.status || 'unknown',
    sector: sector || 'power_transmission',
    subsector: subsector || 'transmission',
    site: asset.properties?.location || 'Unknown',
    area: asset.properties?.area || 'Unknown',
    lastSeen: asset.updated_at || new Date().toISOString(),
    criticality: asset.criticality || 'medium'
  }));

  // Use local state for this page — start with null so overview shows first
  const currentAsset = selectedAssetLocal;

  const handleAssetSelection = (asset: any) => {
    setSelectedAssetLocal(asset);
    setSelectedEvent(null); // Clear selected event when changing assets
  };


  // Calculate time range for query - memoized to prevent infinite re-renders
  const timeRangeParams = useMemo(() => {
    const now = new Date();
    const from = new Date(now);

    switch (timeRange) {
      case "24h":
        from.setHours(now.getHours() - 24);
        break;
      case "7d":
        from.setDate(now.getDate() - 7);
        break;
      case "30d":
        from.setDate(now.getDate() - 30);
        break;
    }

    return {
      from: from.toISOString(),
      to: now.toISOString(),
    };
  }, [timeRange]);

  // Fetch diagnostic events for the selected asset
  const diagnosticEventsParams = useMemo(() => {
    if (!currentAsset?.id) return {};
    return {
      asset_id: currentAsset.id,
      ...timeRangeParams,
    };
  }, [currentAsset?.id, timeRangeParams]);

  const { data: diagnosticEvents, loading, error, refetch } = useDiagnosticEvents(
    diagnosticEventsParams
  );

  // Fetch telemetry series for selected event's window
  const { data: telemetrySeries, loading: telemetryLoading } = useTelemetrySeries(
    selectedEvent && selectedEvent.telemetry_window_start && selectedEvent.telemetry_window_end
      ? {
        asset_id: selectedEvent.asset_id,
        parameter_ids: [], // Would need to extract from event metadata
        from: selectedEvent.telemetry_window_start,
        to: selectedEvent.telemetry_window_end,
      }
      : { asset_id: "", parameter_ids: [], from: "", to: "" }
  );

  // Event type configuration
  const eventTypes: Array<{
    id: DiagnosticEventType;
    label: string;
    icon: typeof Activity;
    color: string;
  }> = [
      { id: "thermal", label: "Thermal", icon: Thermometer, color: "bg-red-500" },
      { id: "electrical", label: "Electrical", icon: Zap, color: "bg-yellow-500" },
      { id: "mechanical", label: "Mechanical", icon: Cog, color: "bg-blue-500" },
      { id: "insulation", label: "Insulation", icon: Gauge, color: "bg-purple-500" },
      { id: "comms", label: "Communications", icon: Wifi, color: "bg-green-500" },
    ];

  const toggleEventType = (typeId: DiagnosticEventType) => {
    setSelectedEventTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const getStateColor = (state: EventState) => {
    switch (state) {
      case "open":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "ack":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "closed":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      default:
        return "bg-secondary text-muted-foreground border-border";
    }
  };

  const getStateLabel = (state: EventState) => {
    switch (state) {
      case "open":
        return "Active";
      case "ack":
        return "Acknowledged";
      case "closed":
        return "Resolved";
      default:
        return state;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-600";
    if (confidence >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getEventTypeIcon = (type: DiagnosticEventType) => {
    const eventType = eventTypes.find(t => t.id === type);
    if (!eventType) return Activity;
    return eventType.icon;
  };

  const getEventTypeColor = (type: DiagnosticEventType) => {
    const eventType = eventTypes.find(t => t.id === type);
    return eventType?.color || "bg-gray-500";
  };

  // ─── Deterministic Mock Data Generation ───────────────────────────────────────
  const mockDiagnosticEvents = useMemo(() => {
    if (!currentAsset) return [];

    const hashString = (s: string) => {
      let h = 0;
      for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i);
      return Math.abs(h);
    };

    const h = hashString(currentAsset.id);
    const count = 3 + (h % 5); // 3 to 7 events per asset
    const events: DiagnosticEvent[] = [];

    const types: DiagnosticEventType[] = ["thermal", "electrical", "mechanical", "insulation", "comms"];
    const states: EventState[] = ["open", "ack", "closed"];

    const templates = [
      { title: "Anomaly detected in phase A current", type: "electrical" },
      { title: "Winding temperature trend high", type: "thermal" },
      { title: "Abnormal vibration signature on main bearing", type: "mechanical" },
      { title: "Dissolved gas concentration rising", type: "insulation" },
      { title: "Intermittent SCADA communication loss", type: "comms" },
      { title: "Voltage harmonic distortion exceeded limit", type: "electrical" },
      { title: "Bushing tan-delta shift detected", type: "insulation" }
    ];

    for (let i = 0; i < count; i++) {
      const tpl = templates[(h + i) % templates.length];
      const daysAgo = (h + i * 3) % 15;
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);

      events.push({
        id: `mock-event-${currentAsset.id}-${i}`,
        asset_id: currentAsset.id,
        event_type: tpl.type as DiagnosticEventType,
        title: tpl.title,
        description: `Automated diagnostic detected a potential issue based on ${tpl.type} parameter trends. Level ${1 + (h % 3)} escalation may be required.`,
        confidence: 65 + ((h + i * 11) % 35),
        state: states[(h + i * 2) % 3],
        detected_at: date.toISOString(),
        created_at: date.toISOString(),
        telemetry_window_start: new Date(date.getTime() - 3600000).toISOString(),
        telemetry_window_end: new Date(date.getTime() + 1800000).toISOString()
      });
    }

    return events.sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
  }, [currentAsset]);

  // Use effective diagnostic events - fallback to mock if API fails or is empty for demo/skunkworks
  const effectiveDiagnosticEvents = useMemo(() => {
    // If we have real data from the DB, use it. Otherwise, use mock data.
    if (diagnosticEvents && diagnosticEvents.length > 0) return diagnosticEvents;
    // For skunkworks, always show SOMETHING if currentAsset is selected
    return mockDiagnosticEvents;
  }, [diagnosticEvents, mockDiagnosticEvents]);

  // Filter events based on selected filters
  const filteredEvents = effectiveDiagnosticEvents.filter(event => {
    if (selectedEventTypes.length > 0 && !selectedEventTypes.includes(event.event_type)) {
      return false;
    }
    if (selectedState !== "all" && event.state !== selectedState) {
      return false;
    }
    return true;
  });

  return (
    <APMPageShell
      title="Anomaly & Fault Detection"
      featureSetName="Asset Health & Diagnostics"
      featureName="Anomaly & Fault Detection"
      listType="assets"
      assets={assets}
      selectedAsset={currentAsset}
      onAssetSelect={handleAssetSelection}
    >
      {currentAsset ? (
        <div className="space-y-6">
          {/* Back to overview */}
          <button
            onClick={() => { setSelectedAssetLocal(null); setSelectedEvent(null); }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Overview
          </button>

          {/* Asset Header with Stats */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold">{currentAsset.name}</h3>
                {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{currentAsset.type}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={(value) => setTimeRange(value as typeof timeRange)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={refetch}>
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Event Type Filters */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Type</label>
                <div className="flex flex-wrap gap-2">
                  {eventTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedEventTypes.includes(type.id);
                    return (
                      <Button
                        key={type.id}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleEventType(type.id)}
                        className="flex items-center gap-2"
                      >
                        <div className={cn("w-3 h-3 rounded-full", type.color)} />
                        <Icon className="w-4 h-4" />
                        {type.label}
                      </Button>
                    );
                  })}
                  {selectedEventTypes.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedEventTypes([])}
                      className="text-muted-foreground"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* State Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">State</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedState === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedState("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={selectedState === "open" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedState("open")}
                  >
                    Active
                  </Button>
                  <Button
                    variant={selectedState === "ack" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedState("ack")}
                  >
                    Acknowledged
                  </Button>
                  <Button
                    variant={selectedState === "closed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedState("closed")}
                  >
                    Resolved
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events List and Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Events List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Detected Events ({filteredEvents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading diagnostic events...
                    </div>
                  ) : filteredEvents.length > 0 ? (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {filteredEvents.map((event) => {
                        const Icon = getEventTypeIcon(event.event_type);
                        return (
                          <div
                            key={event.id}
                            className={cn(
                              "p-4 rounded-lg border cursor-pointer transition-all",
                              selectedEvent?.id === event.id
                                ? "border-primary bg-primary/5"
                                : "hover:border-primary/50"
                            )}
                            onClick={() => setSelectedEvent(event)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                  <div className={cn("w-3 h-3 rounded-full", getEventTypeColor(event.event_type))} />
                                  <Icon className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">{event.title}</span>
                                </div>

                                {event.description && (
                                  <p className="text-sm text-muted-foreground pl-6">
                                    {event.description}
                                  </p>
                                )}

                                <div className="flex items-center gap-4 text-xs text-muted-foreground pl-6">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(event.detected_at).toLocaleString()}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    <span className={getConfidenceColor(event.confidence)}>
                                      {event.confidence}% confidence
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <Badge variant="outline" className={cn("text-xs", getStateColor(event.state))}>
                                {getStateLabel(event.state)}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {selectedEventTypes.length > 0 || selectedState !== "all"
                        ? "No events found for selected filters"
                        : "No diagnostic events detected for this asset"}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Event Details Panel */}
            <div>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Event Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedEvent ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">{selectedEvent.title}</h4>
                        {selectedEvent.description && (
                          <p className="text-sm text-muted-foreground">
                            {selectedEvent.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Event Type</span>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", getEventTypeColor(selectedEvent.event_type))} />
                            <span className="text-sm font-medium capitalize">{selectedEvent.event_type}</span>
                          </div>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">State</span>
                          <Badge variant="outline" className={cn("text-xs", getStateColor(selectedEvent.state))}>
                            {getStateLabel(selectedEvent.state)}
                          </Badge>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Confidence</span>
                          <span className={cn("text-sm font-medium", getConfidenceColor(selectedEvent.confidence))}>
                            {selectedEvent.confidence}%
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Detected</span>
                          <span className="text-sm">
                            {new Date(selectedEvent.detected_at).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {selectedEvent.telemetry_window_start && selectedEvent.telemetry_window_end && (
                        <div className="pt-3 border-t space-y-2">
                          <h5 className="font-medium text-sm">Telemetry Window</h5>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Start:</span>
                              <span>{new Date(selectedEvent.telemetry_window_start).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>End:</span>
                              <span>{new Date(selectedEvent.telemetry_window_end).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedEvent.state === "ack" && selectedEvent.acknowledged_by && (
                        <div className="pt-3 border-t space-y-2">
                          <h5 className="font-medium text-sm">Acknowledgement</h5>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                              <span>By:</span>
                              <span>{selectedEvent.acknowledged_by}</span>
                            </div>
                            {selectedEvent.acknowledged_at && (
                              <div className="flex justify-between">
                                <span>At:</span>
                                <span>{new Date(selectedEvent.acknowledged_at).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedEvent.state === "closed" && (
                        <div className="pt-3 border-t space-y-2">
                          <h5 className="font-medium text-sm">Resolution</h5>
                          <div className="space-y-2 text-xs">
                            {selectedEvent.resolution_notes && (
                              <p className="text-muted-foreground">{selectedEvent.resolution_notes}</p>
                            )}
                            {selectedEvent.closed_by && (
                              <div className="flex justify-between text-muted-foreground">
                                <span>Closed by:</span>
                                <span>{selectedEvent.closed_by}</span>
                              </div>
                            )}
                            {selectedEvent.closed_at && (
                              <div className="flex justify-between text-muted-foreground">
                                <span>Closed at:</span>
                                <span>{new Date(selectedEvent.closed_at).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Select an event to view details
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Telemetry Chart (if event has telemetry window) */}
              {selectedEvent && selectedEvent.telemetry_window_start && selectedEvent.telemetry_window_end && (
                <Card className="mt-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Telemetry Window
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {telemetryLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Loading telemetry data...
                      </div>
                    ) : telemetrySeries && telemetrySeries.series.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={telemetrySeries.series[0]?.datapoints || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="timestamp"
                              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                              fontSize={12}
                            />
                            <YAxis fontSize={12} />
                            <Tooltip
                              labelFormatter={(value) => new Date(value).toLocaleString()}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#8884d8"
                              name={telemetrySeries.series[0]?.parameter_name || "Value"}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No telemetry data available for this window
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-y-auto">
          <AnomalyDetectionOverview
            assets={assets}
            loading={assetsLoading}
            onSelectAsset={handleAssetSelection}
          />
        </div>
      )}
    </APMPageShell>
  );
}