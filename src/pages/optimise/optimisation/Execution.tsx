import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useDataProvider } from "@/hooks/useDataProvider";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard, StatusBadge, DataTable, EmptyStates, SearchFilterSort } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Send,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  FileText,
  AlertCircle,
  Plus,
  ExternalLink,
  Filter,
  Search
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PublishEvent, PublishEventFilters, PublishToSimRequest, PublishToCiRequest } from "@/types/optimise";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function Execution() {
  const { currentTenant, selectedAsset, setSelectedAsset, setIsPopPaneOpen } = useApp();
  const { provider } = useDataProvider();
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsPopPaneOpen(false);

    // Clear selection on unmount to ensure we don't carry over state
    return () => {
      setSelectedAsset(null);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // State for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [targetSystemFilter, setTargetSystemFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");

  // State for publish modals
  const [showPublishToSimModal, setShowPublishToSimModal] = useState(false);
  const [showPublishToCiModal, setShowPublishToCiModal] = useState(false);


  // Construct filters object
  const filters: PublishEventFilters = useMemo(() => {
    const f: PublishEventFilters = {};
    if (targetSystemFilter && targetSystemFilter !== "all") f.targetSystem = targetSystemFilter as any;
    if (statusFilter && statusFilter !== "all") f.status = statusFilter as any;
    return f;
  }, [targetSystemFilter, statusFilter]);

  // Fetch publish events
  const { data: publishEvents = [], isLoading } = useQuery({
    queryKey: ['publish-events', "v2", currentTenant.id, statusFilter],
    queryFn: () => provider.listPublishEvents(currentTenant.id, filters),
    enabled: !!currentTenant.id
  });

  // Use selectedAsset from AppContext for PublishEvent selection
  const selectedEvent = (selectedAsset as unknown as PublishEvent) || null;

  // Statistics calculation
  const stats = useMemo(() => {
    const total = publishEvents.length;
    const published = publishEvents.filter(e => e.status === "published").length;
    const pending = publishEvents.filter(e => e.status === "pending").length;
    const failed = publishEvents.filter(e => e.status === "failed").length;
    const toSim = publishEvents.filter(e => e.targetSystem === "sim").length;
    const toCi = publishEvents.filter(e => e.targetSystem === "ci").length;
    return { total, published, pending, failed, toSim, toCi };
  }, [publishEvents]);

  // Publish to SIM mutation
  const publishToSimMutation = useMutation({
    mutationFn: (payload: PublishToSimRequest) => provider.publishToSim(currentTenant.id, payload),
    onSuccess: (event) => {
      toast.success("Successfully published to SIM", {
        description: `Created ${event.targetType} with ID: ${event.targetId}`
      });
      queryClient.invalidateQueries({ queryKey: ['publish-events'] });
      queryClient.invalidateQueries({ queryKey: ['switching-orders'] });
      queryClient.invalidateQueries({ queryKey: ['outages'] });
      setShowPublishToSimModal(false);
    },
    onError: (error: any) => {
      toast.error("Failed to publish to SIM", {
        description: error.message || "An error occurred"
      });
    }
  });

  // Publish to CI mutation
  const publishToCiMutation = useMutation({
    mutationFn: (payload: PublishToCiRequest) => provider.publishToCi(currentTenant.id, payload),
    onSuccess: (event) => {
      toast.success("Successfully published to CI", {
        description: `Created ${event.targetType} with ID: ${event.targetId}`
      });
      queryClient.invalidateQueries({ queryKey: ['publish-events'] });
      queryClient.invalidateQueries({ queryKey: ['ci-projects'] });
      queryClient.invalidateQueries({ queryKey: ['countermeasures'] });
      setShowPublishToCiModal(false);
    },
    onError: (error: any) => {
      toast.error("Failed to publish to CI", {
        description: error.message || "An error occurred"
      });
    }
  });

  // Tabs configuration
  const overviewTabs = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <ExecutionOverview
          stats={stats}
          publishEvents={publishEvents}
          isLoading={isLoading}
        />
      ),
    },
    {
      id: "history",
      label: "History",
      content: <PublishHistoryTab publishEvents={publishEvents} isLoading={isLoading} />,
    },
  ];

  const detailTabs = selectedEvent
    ? [
      {
        id: "details",
        label: "Details",
        content: <EventDetailsTab event={selectedEvent} />,
      },
      {
        id: "payload",
        label: "Payload",
        content: <PayloadTab event={selectedEvent} />,
      },
      {
        id: "target",
        label: "Target",
        content: <TargetTab event={selectedEvent} />,
      },
    ]
    : overviewTabs;

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane
        title="Execution & Publishing"
        subtitle={currentTenant.name}
        count={publishEvents.length}
        showFilters={false}
      >
        <div className="px-2 pb-2">
          <SearchFilterSort
            searchPlaceholder="Search publish events..."
            onSearchChange={setSearchQuery}
            filterContent={
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">System</label>
                  <Select value={targetSystemFilter} onValueChange={setTargetSystemFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Systems" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Systems</SelectItem>
                      <SelectItem value="sim">SIM</SelectItem>
                      <SelectItem value="ci">CI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            }
            sortContent={
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Sort by</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="system">Target System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
          />
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading publish events...</div>
        ) : publishEvents.length > 0 ? (
          publishEvents
            .filter(event => {
              if (!searchQuery) return true;
              const search = searchQuery.toLowerCase();
              return (
                event.eventRef.toLowerCase().includes(search) ||
                event.targetType.toLowerCase().includes(search) ||
                event.targetSystem.toLowerCase().includes(search)
              );
            })
            .sort((a, b) => {
              switch (sortBy) {
                case "recent":
                  return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
                case "status":
                  return a.status.localeCompare(b.status);
                case "system":
                  return a.targetSystem.localeCompare(b.targetSystem);
                default:
                  return 0;
              }
            })
            .map((event) => (
              <PublishEventItem
                key={event.id}
                event={event}
                isSelected={selectedEvent?.id === event.id}
                onClick={() => setSelectedAsset(event as unknown as any)}
              />
            ))
        ) : (
          <EmptyStates.NoData
            size="sm"
            title="No Publish Events"
            description="No publish events found matching your criteria."
            className="py-8"
          />
        )}
      </ListPane>

      <WorkPane
        key={selectedEvent ? `event-${selectedEvent.id}` : 'execution-overview'}
        title={selectedEvent ? `Event ${selectedEvent.eventRef}` : "Execution & Publishing"}
        subtitle={selectedEvent ? `${selectedEvent.targetSystem?.toUpperCase()} · ${selectedEvent.targetType}` : `${publishEvents.length} publish events`}
        tabs={detailTabs}
        defaultTab={selectedEvent ? "details" : "overview"}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowPublishToSimModal(true)}>
              <Send className="w-4 h-4" />
              Publish to SIM
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setShowPublishToCiModal(true)}>
              <Send className="w-4 h-4" />
              Publish to CI
            </Button>
          </div>
        }
      />

      {/* Publish to SIM Modal */}
      <PublishToSimModal
        open={showPublishToSimModal}
        onClose={() => setShowPublishToSimModal(false)}
        onPublish={(payload) => publishToSimMutation.mutate(payload)}
        isLoading={publishToSimMutation.isPending}
        tenantId={currentTenant.id}
      />

      {/* Publish to CI Modal */}
      <PublishToCiModal
        open={showPublishToCiModal}
        onClose={() => setShowPublishToCiModal(false)}
        onPublish={(payload) => publishToCiMutation.mutate(payload)}
        isLoading={publishToCiMutation.isPending}
        tenantId={currentTenant.id}
      />
    </div>
  );
}

function PublishEventItem({
  event,
  isSelected,
  onClick,
}: {
  event: PublishEvent;
  isSelected: boolean;
  onClick: () => void;
}) {
  const statusIcon = {
    published: CheckCircle,
    pending: Clock,
    failed: XCircle,
    'rolled-back': AlertCircle,
  }[event.status];

  const StatusIcon = statusIcon || Clock;

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex flex-col gap-2 p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent/50",
        isSelected
          ? "bg-accent border-primary/50 shadow-sm"
          : "bg-card border-border"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm line-clamp-1">{event.eventRef}</h4>
        <StatusIcon className={cn(
          "w-4 h-4 shrink-0",
          event.status === "published" ? "text-success" :
            event.status === "failed" ? "text-destructive" :
              event.status === "pending" ? "text-warning" : "text-muted-foreground"
        )} />
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
          {event.targetSystem?.toUpperCase()}
        </Badge>
        <span>·</span>
        <span className="capitalize">{event.targetType?.replace('-', ' ')}</span>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {event.publishedAt ? new Date(event.publishedAt).toLocaleDateString() : new Date(event.createdAt).toLocaleDateString()}
        </span>
        {event.targetId && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
            Target Created
          </Badge>
        )}
      </div>
    </div>
  );
}

function ExecutionOverview({
  stats,
  publishEvents,
  isLoading
}: {
  stats: { total: number; published: number; pending: number; failed: number; toSim: number; toCi: number };
  publishEvents: PublishEvent[];
  isLoading: boolean;
}) {
  const recentEvents = publishEvents.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Events"
          value={stats.total.toString()}
          subtitle="All publish events"
          icon={FileText}
          variant="primary"
        />
        <KPICard
          title="Published"
          value={stats.published.toString()}
          subtitle="Successfully published"
          icon={CheckCircle}
          variant="success"
        />
        <KPICard
          title="Pending"
          value={stats.pending.toString()}
          subtitle="Awaiting execution"
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="Failed"
          value={stats.failed.toString()}
          subtitle="Execution errors"
          icon={XCircle}
          variant="destructive"
        />
      </div>

      {/* System Distribution */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="text-sm font-semibold mb-3">Published to SIM</h4>
          <div className="text-3xl font-bold text-primary">{stats.toSim}</div>
          <p className="text-xs text-muted-foreground mt-1">Switching orders, outages, issues, actions</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="text-sm font-semibold mb-3">Published to CI</h4>
          <div className="text-3xl font-bold text-primary">{stats.toCi}</div>
          <p className="text-xs text-muted-foreground mt-1">CI projects, countermeasures</p>
        </div>
      </div>

      {/* Recent Events */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Recent Publish Events</h3>
        {isLoading ? (
          <div>Loading events...</div>
        ) : (
          <DataTable
            columns={[
              { key: 'eventRef', label: 'Event Ref', className: 'font-medium' },
              {
                key: 'targetSystem',
                label: 'System',
                render: (sys) => (
                  <Badge variant="outline" className="uppercase">
                    {sys}
                  </Badge>
                ),
              },
              { key: 'targetType', label: 'Type', render: (t) => <span className="capitalize">{t?.toString().replace('-', ' ')}</span> },
              {
                key: 'status',
                label: 'Status',
                render: (status) => (
                  <StatusBadge
                    status={status === "published" ? "online" :
                      status === "failed" ? "offline" :
                        status === "pending" ? "maintenance" : "maintenance"}
                    size="sm"
                  />
                ),
              },
              {
                key: 'targetId',
                label: 'Target',
                render: (id) => id ? <CheckCircle className="w-4 h-4 text-success" /> : <span className="text-muted-foreground">-</span>,
              },
              {
                key: 'publishedAt',
                label: 'Published',
                render: (date, row) => date ? new Date(date).toLocaleString() : new Date(row.createdAt).toLocaleString(),
                className: 'text-muted-foreground text-xs',
              },
            ]}
            data={recentEvents}
            emptyState={
              <EmptyStates.NoData
                size="sm"
                title="No Events"
                description="No publish events available."
              />
            }
          />
        )}
      </div>
    </div>
  );
}

function PublishHistoryTab({ publishEvents, isLoading }: { publishEvents: PublishEvent[]; isLoading: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Publish History</h3>
        <Button variant="outline" size="sm">
          Export History
        </Button>
      </div>

      {isLoading ? (
        <div>Loading history...</div>
      ) : publishEvents.length > 0 ? (
        <div className="space-y-3">
          {publishEvents.map(event => (
            <div key={event.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{event.eventRef}</h4>
                    <Badge variant="outline" className="uppercase text-xs">
                      {event.targetSystem}
                    </Badge>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground capitalize">
                      {event.targetType?.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Source: {event.sourceType}</span>
                    <span>·</span>
                    <span>{event.publishedAt ? new Date(event.publishedAt).toLocaleString() : new Date(event.createdAt).toLocaleString()}</span>
                    {event.publishedBy && (
                      <>
                        <span>·</span>
                        <span>By: {event.publishedBy}</span>
                      </>
                    )}
                  </div>
                  {event.errorMessage && (
                    <div className="mt-2 text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {event.errorMessage}
                    </div>
                  )}
                </div>
                <StatusBadge
                  status={event.status === "published" ? "online" :
                    event.status === "failed" ? "offline" :
                      event.status === "pending" ? "maintenance" : "maintenance"}
                  size="sm"
                />
              </div>
              {event.targetId && (
                <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs">
                  <ExternalLink className="w-3 h-3 text-primary" />
                  <span className="text-muted-foreground">Target ID:</span>
                  <code className="bg-muted px-2 py-0.5 rounded text-xs">{event.targetId}</code>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyStates.NoData
          title="No History"
          description="No publish events in history."
        />
      )}
    </div>
  );
}

function EventDetailsTab({ event }: { event: PublishEvent }) {
  return (
    <div className="space-y-6">
      {/* Event Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className={cn(
            "w-16 h-16 rounded-xl flex items-center justify-center",
            event.status === "published" ? "bg-success/10" :
              event.status === "failed" ? "bg-destructive/10" :
                "bg-warning/10"
          )}>
            {event.status === "published" ? (
              <CheckCircle className="w-8 h-8 text-success" />
            ) : event.status === "failed" ? (
              <XCircle className="w-8 h-8 text-destructive" />
            ) : (
              <Clock className="w-8 h-8 text-warning" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">{event.eventRef}</h3>
              <Badge variant="outline" className="uppercase">{event.targetSystem}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="capitalize">{event.targetType?.replace('-', ' ')}</span>
              <span>·</span>
              <span>{event.publishedAt ? new Date(event.publishedAt).toLocaleString() : new Date(event.createdAt).toLocaleString()}</span>
              {event.publishedBy && (
                <>
                  <span>·</span>
                  <span>Published by: {event.publishedBy}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Source Information</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Source Type" value={event.sourceType} />
            <InfoRow label="Source ID" value={event.sourceId} />
            {event.opportunity && (
              <InfoRow label="Opportunity" value={event.opportunity.title} />
            )}
            {event.recommendation && (
              <InfoRow label="Recommendation" value={event.recommendation.title} />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Target Information</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Target System" value={event.targetSystem?.toUpperCase() || ''} />
            <InfoRow label="Target Type" value={event.targetType} />
            {event.targetId ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Target ID</span>
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{event.targetId}</code>
              </div>
            ) : (
              <InfoRow label="Target ID" value="Not created yet" />
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {event.errorMessage && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-destructive mb-1">Error</h4>
              <p className="text-sm text-destructive/90">{event.errorMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PayloadTab({ event }: { event: PublishEvent }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Publish Payload</h3>
      <div className="bg-card border border-border rounded-lg p-4">
        <pre className="text-xs overflow-auto max-h-[600px]">
          {JSON.stringify(event.payload, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function TargetTab({ event }: { event: PublishEvent }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Target Entity</h3>
      {event.targetId ? (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-success" />
            <div>
              <h4 className="font-semibold">Target Created Successfully</h4>
              <p className="text-sm text-muted-foreground">
                {event.targetType} was created in {event.targetSystem?.toUpperCase()} system
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <InfoRow label="Target System" value={event.targetSystem?.toUpperCase() || ''} />
            <InfoRow label="Target Type" value={event.targetType} />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Target ID</span>
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{event.targetId}</code>
            </div>
            <div className="pt-3 border-t border-border">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <ExternalLink className="w-4 h-4" />
                View in {event.targetSystem?.toUpperCase()}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <EmptyStates.NoData
          title="No Target Created"
          description={
            event.status === "pending"
              ? "Target entity will be created when event is published."
              : event.status === "failed"
                ? "Target entity was not created due to an error."
                : "Target entity information not available."
          }
        />
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium capitalize">{value}</span>
    </div>
  );
}

// Publish to SIM Modal Component
function PublishToSimModal({
  open,
  onClose,
  onPublish,
  isLoading,
  tenantId,
}: {
  open: boolean;
  onClose: () => void;
  onPublish: (payload: PublishToSimRequest) => void;
  isLoading: boolean;
  tenantId: string;
}) {
  const [targetType, setTargetType] = useState<'switching-order' | 'outage' | 'issue' | 'action'>('switching-order');
  const [opportunityId, setOpportunityId] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [orderNo, setOrderNo] = useState("");
  const [outageRef, setOutageRef] = useState("");
  const [issueRef, setIssueRef] = useState("");
  const [actionRef, setActionRef] = useState("");

  const handleSubmit = () => {
    const basePayload: any = {
      description,
      priority,
    };

    // Add type-specific fields
    if (targetType === 'switching-order') {
      basePayload.orderNo = orderNo || `SW-${Date.now()}`;
      basePayload.plannedStart = new Date().toISOString();
    } else if (targetType === 'outage') {
      basePayload.outageRef = outageRef || `OUT-${Date.now()}`;
      basePayload.outageType = 'planned';
      basePayload.startTime = new Date().toISOString();
      basePayload.impactLevel = priority;
    } else if (targetType === 'issue') {
      basePayload.issueRef = issueRef || `ISS-${Date.now()}`;
      basePayload.title = description;
      basePayload.category = 'optimization';
    } else if (targetType === 'action') {
      basePayload.actionRef = actionRef || `ACT-${Date.now()}`;
      basePayload.owner = 'System';
      basePayload.dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    const publishPayload: PublishToSimRequest = {
      opportunityId: opportunityId || undefined,
      targetType,
      payload: basePayload,
      publishedBy: 'Current User',
    };

    onPublish(publishPayload);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Publish to SIM</DialogTitle>
          <DialogDescription>
            Create a new entity in the SIM (Shift Intelligence Management) system
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Target Type</Label>
            <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="switching-order">Switching Order</SelectItem>
                <SelectItem value="outage">Outage</SelectItem>
                <SelectItem value="issue">Issue</SelectItem>
                <SelectItem value="action">Action</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Opportunity ID (Optional)</Label>
            <Input
              placeholder="Enter opportunity ID"
              value={opportunityId}
              onChange={(e) => setOpportunityId(e.target.value)}
            />
          </div>

          {targetType === 'switching-order' && (
            <div className="space-y-2">
              <Label>Order Number</Label>
              <Input
                placeholder="Auto-generated if empty"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
              />
            </div>
          )}

          {targetType === 'outage' && (
            <div className="space-y-2">
              <Label>Outage Reference</Label>
              <Input
                placeholder="Auto-generated if empty"
                value={outageRef}
                onChange={(e) => setOutageRef(e.target.value)}
              />
            </div>
          )}

          {targetType === 'issue' && (
            <div className="space-y-2">
              <Label>Issue Reference</Label>
              <Input
                placeholder="Auto-generated if empty"
                value={issueRef}
                onChange={(e) => setIssueRef(e.target.value)}
              />
            </div>
          )}

          {targetType === 'action' && (
            <div className="space-y-2">
              <Label>Action Reference</Label>
              <Input
                placeholder="Auto-generated if empty"
                value={actionRef}
                onChange={(e) => setActionRef(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Enter description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !description}>
            {isLoading ? "Publishing..." : "Publish to SIM"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Publish to CI Modal Component
function PublishToCiModal({
  open,
  onClose,
  onPublish,
  isLoading,
  tenantId,
}: {
  open: boolean;
  onClose: () => void;
  onPublish: (payload: PublishToCiRequest) => void;
  isLoading: boolean;
  tenantId: string;
}) {
  const [targetType, setTargetType] = useState<'ci-project' | 'countermeasure'>('ci-project');
  const [opportunityId, setOpportunityId] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [owner, setOwner] = useState("");
  const [projectRef, setProjectRef] = useState("");
  const [cmRef, setCmRef] = useState("");

  const handleSubmit = () => {
    const basePayload: any = {
      title,
      summary,
      priority,
      owner: owner || 'System',
    };

    // Add type-specific fields
    if (targetType === 'ci-project') {
      basePayload.projectRef = projectRef || `CI-${Date.now()}`;
      basePayload.stageId = 'backlog'; // Will need to be resolved to actual stage ID
      basePayload.status = 'active';
    } else if (targetType === 'countermeasure') {
      basePayload.cmRef = cmRef || `CM-${Date.now()}`;
      basePayload.status = 'planned';
      basePayload.dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    const publishPayload: PublishToCiRequest = {
      opportunityId: opportunityId || undefined,
      targetType,
      payload: basePayload,
      publishedBy: 'Current User',
    };

    onPublish(publishPayload);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Publish to CI</DialogTitle>
          <DialogDescription>
            Create a new entity in the CI (Continuous Improvement) system
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Target Type</Label>
            <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ci-project">CI Project</SelectItem>
                <SelectItem value="countermeasure">Countermeasure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Opportunity ID (Optional)</Label>
            <Input
              placeholder="Enter opportunity ID"
              value={opportunityId}
              onChange={(e) => setOpportunityId(e.target.value)}
            />
          </div>

          {targetType === 'ci-project' && (
            <div className="space-y-2">
              <Label>Project Reference</Label>
              <Input
                placeholder="Auto-generated if empty"
                value={projectRef}
                onChange={(e) => setProjectRef(e.target.value)}
              />
            </div>
          )}

          {targetType === 'countermeasure' && (
            <div className="space-y-2">
              <Label>Countermeasure Reference</Label>
              <Input
                placeholder="Auto-generated if empty"
                value={cmRef}
                onChange={(e) => setCmRef(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              placeholder="Enter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Summary</Label>
            <Textarea
              placeholder="Enter summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Owner</Label>
            <Input
              placeholder="Enter owner name"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !title || !summary}>
            {isLoading ? "Publishing..." : "Publish to CI"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
