import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Asset } from "@/types/navigation";
import { APMPageShell } from "@/components/apm/APMPageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAlertTimeline } from "@/hooks/useAPM";
import type { TimelineEvent } from "@/types/apm";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  Info,
  Eye,
  Wrench,
  Zap,
  TrendingDown,
  Activity,
  ArrowRight,
  ExternalLink,
  Loader2
} from "lucide-react";

export function AlertHistory() {
  const { assets, selectedAsset, setSelectedAsset, sector, subsector, setIsPopPaneOpen, setPopPaneContent } = useApp();
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<Asset | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEventType, setSelectedEventType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("7d");

  const currentAsset = selectedAssetLocal || selectedAsset;

  // Helper function to get time range start
  function getTimeRangeStart(range: string): string {
    const now = new Date();
    switch (range) {
      case "1d":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case "7d":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case "30d":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case "90d":
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  // Memoize query params to prevent infinite loops
  const timelineParams = useMemo(() => ({
    asset_id: currentAsset?.id,
    event_type: selectedEventType !== "all" ? selectedEventType as any : undefined,
    from: getTimeRangeStart(dateRange),
    to: new Date().toISOString(),
  }), [currentAsset?.id, selectedEventType, dateRange]);

  // Fetch timeline events with filters
  const { data: events, loading, error, refetch } = useAlertTimeline(timelineParams);

  // Use local state for this page, but update global context when asset is selected
  const handleAssetSelect = (asset: Asset) => {
    setSelectedAssetLocal(asset);
    setSelectedAsset(asset);
    setSelectedEvent(null);
  };

  const handleViewEventDetails = (event: TimelineEvent) => {
    setSelectedEvent(event);
  };

  // Filter events based on search
  const filteredEvents = useMemo(() => {
    if (!events) return [];

    let filtered = events;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [events, searchTerm]);

  // Get event counts by type
  const eventCounts = useMemo(() => {
    if (!events) return { total: 0, alert: 0, diagnostic: 0, downtime: 0 };

    return {
      total: events.length,
      alert: events.filter(e => e.event_type === "alert").length,
      diagnostic: events.filter(e => e.event_type === "diagnostic").length,
      downtime: events.filter(e => e.event_type === "downtime").length,
    };
  }, [events]);

  const handleEventSelect = (event: TimelineEvent) => {
    handleViewEventDetails(event);
  };

  const getEventTypeIcon = (eventType: TimelineEvent["event_type"]) => {
    switch (eventType) {
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "diagnostic":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "downtime":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
  };

  const getEventTypeColor = (eventType: TimelineEvent["event_type"]) => {
    switch (eventType) {
      case "alert":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "diagnostic":
        return "text-red-600 bg-red-50 border-red-200";
      case "downtime":
        return "text-red-600 bg-red-50 border-red-200";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "Ongoing";

    if (minutes < 60) {
      return `${minutes}m`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;
      return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
    } else {
      const days = Math.floor(minutes / 1440);
      const remainingHours = Math.floor((minutes % 1440) / 60);
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
  };

  if (loading) {
    return (
      <APMPageShell
        title="Event / Alert History Timeline"
        featureSetName="Alerts, Reports & Visualisation"
        featureName="Event / Alert History Timeline"
        listType="assets"
        assets={assets}
        selectedAsset={currentAsset}
        onAssetSelect={handleAssetSelect}
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </APMPageShell>
    );
  }

  if (error) {
    return (
      <APMPageShell
        title="Event / Alert History Timeline"
        featureSetName="Alerts, Reports & Visualisation"
        featureName="Event / Alert History Timeline"
        listType="assets"
        assets={assets}
        selectedAsset={currentAsset}
        onAssetSelect={handleAssetSelect}
      >
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Failed to load timeline: {error.message}</p>
              <Button onClick={refetch} className="mt-4">Retry</Button>
            </div>
          </CardContent>
        </Card>
      </APMPageShell>
    );
  }

  return (
    <APMPageShell
      title="Event / Alert History Timeline"
      featureSetName="Alerts, Reports & Visualisation"
      featureName="Event / Alert History Timeline"
      listType="assets"
      assets={assets}
      selectedAsset={currentAsset}
      onAssetSelect={handleAssetSelect}
    >
      <div className="space-y-6">
        {/* Event Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{eventCounts.total}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Alerts</p>
                  <p className="text-2xl font-bold text-yellow-600">{eventCounts.alert}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Diagnostics</p>
                  <p className="text-2xl font-bold text-red-600">{eventCounts.diagnostic}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Downtime</p>
                  <p className="text-2xl font-bold text-red-600">{eventCounts.downtime}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Event Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Event Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Event Types</SelectItem>
                  <SelectItem value="alert">Alerts</SelectItem>
                  <SelectItem value="diagnostic">Diagnostics</SelectItem>
                  <SelectItem value="downtime">Downtime</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Timeline View */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Event Timeline ({filteredEvents.length} events)
            </CardTitle>
            <CardDescription>
              Chronological view of alerts, diagnostics, and downtime events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventTimeline
              events={filteredEvents}
              selectedEvent={selectedEvent}
              onEventSelect={handleEventSelect}
              getEventTypeIcon={getEventTypeIcon}
              getEventTypeColor={getEventTypeColor}
              formatTimestamp={formatTimestamp}
              formatDuration={formatDuration}
            />
          </CardContent>
        </Card>

        {/* Event Details Drawer */}
        {selectedEvent && (
          <Sheet open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
            <SheetContent className="w-[600px] sm:w-[600px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {getEventTypeIcon(selectedEvent.event_type)}
                  {selectedEvent.title}
                </SheetTitle>
                <SheetDescription>
                  Asset ID: {selectedEvent.asset_id} • {formatTimestamp(selectedEvent.timestamp)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getEventTypeColor(selectedEvent.event_type)}>
                    {selectedEvent.event_type}
                  </Badge>
                  {selectedEvent.severity && (
                    <Badge variant="outline">
                      {selectedEvent.severity}
                    </Badge>
                  )}
                  {selectedEvent.state && (
                    <Badge variant="outline">
                      {selectedEvent.state}
                    </Badge>
                  )}
                </div>

                {selectedEvent.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                  </div>
                )}

                {selectedEvent.duration_minutes && (
                  <div>
                    <h4 className="font-medium mb-2">Duration</h4>
                    <p className="text-sm text-muted-foreground">{formatDuration(selectedEvent.duration_minutes)}</p>
                  </div>
                )}

                <Separator />

                <div className="flex gap-2">
                  <Button variant="outline" className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    View Asset Details
                  </Button>
                  {selectedEvent.event_type === "diagnostic" && (
                    <Button variant="outline" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      View Root Cause Analysis
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </APMPageShell>
  );
}

interface EventTimelineProps {
  events: TimelineEvent[];
  selectedEvent: TimelineEvent | null;
  onEventSelect: (event: TimelineEvent) => void;
  getEventTypeIcon: (eventType: TimelineEvent["event_type"]) => JSX.Element;
  getEventTypeColor: (eventType: TimelineEvent["event_type"]) => string;
  formatTimestamp: (timestamp: string) => string;
  formatDuration: (minutes?: number) => string;
}

function EventTimeline({
  events,
  selectedEvent,
  onEventSelect,
  getEventTypeIcon,
  getEventTypeColor,
  formatTimestamp,
  formatDuration
}: EventTimelineProps) {
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No events match the current filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>

      <div className="space-y-4">
        {events.map((event) => {
          const relativeTime = formatRelativeTime(event.timestamp);
          const absoluteTime = formatTimestamp(event.timestamp);

          return (
            <div
              key={event.id}
              className={cn(
                "relative flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
                selectedEvent?.id === event.id && "ring-2 ring-primary",
                getEventTypeColor(event.event_type)
              )}
              onClick={() => onEventSelect(event)}
            >
              {/* Timeline dot */}
              <div className="absolute left-[-18px] top-6 w-3 h-3 rounded-full bg-background border-2 border-primary"></div>

              {/* Event icon */}
              <div className="flex-shrink-0 mt-1">
                {getEventTypeIcon(event.event_type)}
              </div>

              {/* Event content */}
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">Asset ID: {event.asset_id}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{relativeTime}</div>
                    <div>{absoluteTime}</div>
                  </div>
                </div>

                {event.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs">
                  <Badge variant="outline" size="sm">
                    {event.event_type}
                  </Badge>
                  {event.severity && (
                    <Badge variant="outline" size="sm">
                      {event.severity}
                    </Badge>
                  )}
                  {event.state && (
                    <Badge variant="outline" size="sm">
                      {event.state}
                    </Badge>
                  )}
                  {event.duration_minutes && (
                    <span className="text-muted-foreground">
                      Duration: {formatDuration(event.duration_minutes)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}