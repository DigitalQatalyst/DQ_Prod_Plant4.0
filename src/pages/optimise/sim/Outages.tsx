import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { useDataProvider } from "@/hooks/useDataProvider";
import { useSectorContentFilter } from "@/hooks/use-sector-switching";
import { ErrorAwareListPane } from "@/components/layout/ErrorAwareListPane";
import { ErrorAwareWorkPane } from "@/components/layout/ErrorAwareWorkPane";
import { StatusBadge, DataTable, TableConfigs, EmptyStates, ListItem, SearchFilterSort } from "@/components/shared";
import { KPICard } from "@/components/shared/KPICard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Plus,
  Calendar,
  Filter,
  MapPin,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Square,
  RotateCcw,
  Download,
  History,
  Link,
  Target,
  Zap,
  Activity,
  Bell,
  Timer,
} from "lucide-react";
import { Outage, OutageImpact, CreateOutageRequest, UpdateOutageRequest, OutageFilters } from "@/types/optimise";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function Outages() {
  const { currentTenant, selectedAsset, setSelectedAsset, setIsPopPaneOpen, setPopPaneContent } = useApp();
  const { provider } = useDataProvider();
  const { filterItems } = useSectorContentFilter();
  const queryClient = useQueryClient();

  // Close PopPane when this component mounts (no right sidebar needed on this page)
  useEffect(() => {
    setIsPopPaneOpen(false);

    // Clear selection on unmount to ensure we don't carry over state
    return () => {
      setSelectedAsset(null);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [searchQuery, setSearchQuery] = useState("");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [impactFilter, setImpactFilter] = useState<string>("all");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("startTime");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEtaUpdateModalOpen, setIsEtaUpdateModalOpen] = useState(false);

  // Use selectedAsset from AppContext for Outage selection
  const selectedOutage = selectedAsset as unknown as Outage | null;

  // Fetch outages data
  const {
    data: outages = [],
    isLoading: outagesLoading,
    error: outagesError,
    refetch: refetchOutages,
  } = useQuery({
    queryKey: ['outages', currentTenant.id, siteFilter, statusFilter, typeFilter, dateFromFilter, dateToFilter],
    queryFn: () => provider.listOutages(currentTenant.id, {
      siteId: (siteFilter && siteFilter !== "all") ? siteFilter : undefined,
      status: (statusFilter && statusFilter !== "all") ? statusFilter as any : undefined,
      type: (typeFilter && typeFilter !== "all") ? typeFilter as any : undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
    }),
    enabled: !!currentTenant.id,
  });

  // Filter and sort outages based on search query and impact level
  const filteredOutages = useMemo(() => {
    let filtered = outages;

    if (searchQuery) {
      filtered = filtered.filter(outage =>
        outage.outageRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
        outage.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (impactFilter && impactFilter !== "all") {
      filtered = filtered.filter(outage => outage.impactLevel === impactFilter);
    }

    // Apply sorting
    const sorted = [...filtered];
    switch (sortBy) {
      case "startTime":
        return sorted.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      case "impact":
        const impactOrder = { high: 0, medium: 1, low: 2 };
        return sorted.sort((a, b) => impactOrder[a.impactLevel || 'medium'] - impactOrder[b.impactLevel || 'medium']);
      case "status":
        return sorted.sort((a, b) => a.status.localeCompare(b.status));
      default:
        return sorted;
    }
  }, [outages, searchQuery, impactFilter, sortBy]);

  // Status transition mutation
  const statusTransitionMutation = useMutation({
    mutationFn: async ({ outageId, status }: { outageId: string; status: Outage['status'] }) => {
      const updateData: UpdateOutageRequest = { status };

      // Set timestamps based on status
      if (status === 'resolved') {
        updateData.actualRestoration = new Date().toISOString();
      }

      return provider.updateOutage(outageId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outages'] });
      toast.success("Outage status updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  // ETA update mutation
  const etaUpdateMutation = useMutation({
    mutationFn: async ({ outageId, estimatedRestoration }: { outageId: string; estimatedRestoration: string }) => {
      return provider.updateOutage(outageId, { estimatedRestoration });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outages'] });
      setIsEtaUpdateModalOpen(false);
      toast.success("ETA updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update ETA: ${error.message}`);
    },
  });

  const handleStatusTransition = (outageId: string, newStatus: Outage['status']) => {
    statusTransitionMutation.mutate({ outageId, status: newStatus });
  };

  const handleOutageSelect = (outage: Outage) => {
    setSelectedAsset(outage as any);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    refetchOutages();
    toast.success("Outage created successfully");
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    refetchOutages();
    toast.success("Outage updated successfully");
  };

  const handleEtaUpdate = (estimatedRestoration: string) => {
    if (selectedOutage) {
      etaUpdateMutation.mutate({
        outageId: selectedOutage.id,
        estimatedRestoration
      });
    }
  };

  // Prepare list items for ErrorAwareListPane
  const listItems = filteredOutages.map(outage => ({
    title: outage.outageRef,
    subtitle: outage.description || `${outage.outageType} outage`,
    status: getStatusForListItem(outage.status),
    priority: outage.impactLevel,
    metadata: [
      { label: "Type", value: outage.outageType },
      { label: "ETA", value: outage.estimatedRestoration ? new Date(outage.estimatedRestoration).toLocaleDateString() : "TBD" },
    ],
    isSelected: selectedOutage?.id === outage.id,
    onClick: () => handleOutageSelect(outage),
    variant: "compact" as const,
  }));

  // Prepare tabs for ErrorAwareWorkPane
  const workPaneTabs = selectedOutage ? [
    {
      id: "summary",
      label: "Summary",
      content: <OutageSummary outage={selectedOutage} onStatusChange={handleStatusTransition} onEtaUpdate={() => setIsEtaUpdateModalOpen(true)} />,
      isLoading: false,
      error: null,
    },
    {
      id: "impacts",
      label: "Impacts",
      content: <OutageImpacts outage={selectedOutage} />,
      isLoading: false,
      error: null,
    },
    {
      id: "timeline",
      label: "Timeline",
      content: <OutageTimeline outage={selectedOutage} />,
      isLoading: false,
      error: null,
    },
    {
      id: "actions",
      label: "Linked Actions",
      content: <OutageActions outage={selectedOutage} />,
      isLoading: false,
      error: null,
    },
    {
      id: "alerts",
      label: "Alerts",
      content: <OutageAlerts outage={selectedOutage} />,
      isLoading: false,
      error: null,
    },
  ] : [
    {
      id: "overview",
      label: "Outages Overview",
      content: <OutagesOverview outages={filteredOutages} onCreateOutage={() => setIsCreateModalOpen(true)} />,
      isLoading: false,
      error: null,
    }
  ];

  return (
    <div className="flex w-full h-full overflow-hidden gap-4 p-4 bg-muted/40">
      <ErrorAwareListPane
        title="Outages"
        subtitle="Manage transmission system outages"
        count={filteredOutages.length}
        isLoading={outagesLoading}
        error={outagesError}
        onRetry={refetchOutages}
        contentType="outages"
        showFilters={false}
        className="rounded-lg border bg-background shadow-sm"
        actions={
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 w-full">
                <Plus className="h-4 w-4" />
                New Outage
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Outage</DialogTitle>
              </DialogHeader>
              <CreateOutageForm
                tenantId={currentTenant.id}
                onSuccess={handleCreateSuccess}
                onCancel={() => setIsCreateModalOpen(false)}
              />
            </DialogContent>
          </Dialog>
        }
      >
        <div className="px-2 pb-2">
          <SearchFilterSort
            searchPlaceholder="Search outages..."
            onSearchChange={setSearchQuery}
            filterContent={
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Site</label>
                  <Select value={siteFilter} onValueChange={setSiteFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Sites" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sites</SelectItem>
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
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="unplanned">Unplanned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Impact</label>
                  <Select value={impactFilter} onValueChange={setImpactFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Impact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Impact</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
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
                    <SelectItem value="startTime">Start Time (Recent First)</SelectItem>
                    <SelectItem value="impact">Impact Level (High to Low)</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
          />
        </div>

        <div className="space-y-2">
          {listItems.length === 0 ? (
            <EmptyStates.NoData
              title="No outages found"
              description="Create your first outage record to get started"
              action={{
                label: "Create Outage",
                onClick: () => setIsCreateModalOpen(true),
                variant: "default"
              }}
            />
          ) : (
            listItems.map((item, index) => (
              <ListItem
                key={filteredOutages[index].id}
                {...item}
              />
            ))
          )}
        </div>
      </ErrorAwareListPane>

      <ErrorAwareWorkPane
        key={selectedOutage ? `outage-${selectedOutage.id}` : 'outages-overview'}
        title={selectedOutage ? `Outage ${selectedOutage.outageRef}` : "Outages"}
        subtitle={selectedOutage ? selectedOutage.description : `${filteredOutages.length} outages`}
        tabs={workPaneTabs}
        defaultTab={selectedOutage ? "summary" : "overview"}
        isLoading={outagesLoading}
        error={outagesError}
        onRetry={refetchOutages}
        contentType="outage details"
        className="rounded-lg border bg-background shadow-sm"
        actions={
          selectedOutage ? (
            <div className="flex gap-2">
              <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit Outage</DialogTitle>
                  </DialogHeader>
                  <EditOutageForm
                    outage={selectedOutage}
                    onSuccess={handleEditSuccess}
                    onCancel={() => setIsEditModalOpen(false)}
                  />
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEtaUpdateModalOpen(true)}
                disabled={selectedOutage.status === 'resolved'}
              >
                <Timer className="h-4 w-4 mr-2" />
                Update ETA
              </Button>

              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          ) : null
        }
      />

      {/* ETA Update Modal */}
      <Dialog open={isEtaUpdateModalOpen} onOpenChange={setIsEtaUpdateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Estimated Restoration Time</DialogTitle>
          </DialogHeader>
          <EtaUpdateForm
            currentEta={selectedOutage?.estimatedRestoration}
            onUpdate={handleEtaUpdate}
            onCancel={() => setIsEtaUpdateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OutagesOverview({
  outages,
  onCreateOutage,
}: {
  outages: Outage[];
  onCreateOutage: () => void;
}) {
  const { setSelectedAsset } = useApp();

  const stats = useMemo(() => {
    const totalOutages = outages.length;
    const plannedCount = outages.filter(o => o.outageType === 'planned').length;
    const unplannedCount = outages.filter(o => o.outageType === 'unplanned').length;
    const activeCount = outages.filter(o => o.status === 'active').length;
    return { totalOutages, plannedCount, unplannedCount, activeCount };
  }, [outages]);

  const recentOutages = useMemo(() => {
    return [...outages]
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 5);
  }, [outages]);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Outages"
          value={stats.totalOutages.toString()}
          subtitle="All recorded outages"
          icon={AlertTriangle}
          variant="primary"
        />
        <KPICard
          title="Planned"
          value={stats.plannedCount.toString()}
          subtitle="Scheduled maintenance"
          icon={Calendar}
          variant="default"
        />
        <KPICard
          title="Unplanned"
          value={stats.unplannedCount.toString()}
          subtitle="Unexpected events"
          icon={Zap}
          variant="warning"
        />
        <KPICard
          title="Active"
          value={stats.activeCount.toString()}
          subtitle="Currently ongoing"
          icon={Timer}
          variant="destructive"
        />
      </div>

      {/* Recent Outages */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Recent Outages</h3>
          <Button size="sm" className="gap-2" onClick={onCreateOutage}>
            <Plus className="w-4 h-4" />
            New Outage
          </Button>
        </div>
        <DataTable
          columns={[
            { key: 'outageRef', label: 'Reference' },
            {
              key: 'outageType',
              label: 'Type',
              render: (type) => (
                <StatusBadge
                  status={type === "planned" ? "online" : "offline"}
                  size="sm"
                />
              ),
            },
            {
              key: 'status',
              label: 'Status',
              render: (status) => (
                <StatusBadge
                  status={status === "resolved" ? "online" : status === "active" ? "offline" : "maintenance"}
                  size="sm"
                />
              ),
            },
            {
              key: 'impactLevel',
              label: 'Impact',
              render: (impact) => (
                <StatusBadge
                  status={impact === "high" ? "offline" : impact === "medium" ? "maintenance" : "online"}
                  size="sm"
                />
              ),
            },
            { key: 'startTime', label: 'Start Time', render: (date) => new Date(date).toLocaleString() },
            { key: 'estimatedRestoration', label: 'ETA', render: (date) => date ? new Date(date).toLocaleString() : '-' },
          ]}
          data={recentOutages}
          onRowClick={(outage) => setSelectedAsset(outage as any)}
          emptyState={
            <EmptyStates.NoData
              title="No recent outages"
              description="No outages found."
            />
          }
        />
      </div>
    </div>
  );
}

// Helper functions for styling
function getImpactVariant(impact: string): "default" | "secondary" | "destructive" | "outline" {
  switch (impact) {
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
    default: return 'default';
  }
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'resolved': return 'default';
    case 'active': return 'destructive';
    case 'scheduled': return 'secondary';
    default: return 'default';
  }
}

function getTypeVariant(type: string): "default" | "secondary" | "destructive" | "outline" {
  switch (type) {
    case 'unplanned': return 'destructive';
    case 'planned': return 'secondary';
    default: return 'default';
  }
}

function getStatusForListItem(status: string): "online" | "offline" | "maintenance" {
  switch (status) {
    case 'resolved': return 'online';
    case 'active': return 'offline';
    case 'scheduled': return 'maintenance';
    default: return 'maintenance';
  }
}

// Tab content components
function OutageSummary({
  outage,
  onStatusChange,
  onEtaUpdate
}: {
  outage: Outage;
  onStatusChange: (outageId: string, status: Outage['status']) => void;
  onEtaUpdate: () => void;
}) {
  const getStatusActions = (currentStatus: Outage['status']) => {
    const actions = [];

    switch (currentStatus) {
      case 'scheduled':
        actions.push(
          <Button key="activate" size="sm" onClick={() => onStatusChange(outage.id, 'active')}>
            <Play className="h-4 w-4 mr-2" />
            Activate
          </Button>
        );
        break;
      case 'active':
        actions.push(
          <Button key="resolve" size="sm" onClick={() => onStatusChange(outage.id, 'resolved')}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark Resolved
          </Button>
        );
        actions.push(
          <Button key="eta" variant="outline" size="sm" onClick={onEtaUpdate}>
            <Timer className="h-4 w-4 mr-2" />
            Update ETA
          </Button>
        );
        break;
    }

    return actions;
  };

  const getDuration = () => {
    const start = new Date(outage.startTime);
    const end = outage.actualRestoration ? new Date(outage.actualRestoration) : new Date();
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Outage Details
              </CardTitle>
              <CardDescription>Current status and restoration information</CardDescription>
            </div>
            <div className="flex gap-2">
              {getStatusActions(outage.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Outage Reference</label>
              <p className="text-sm font-mono">{outage.outageRef}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge variant={getStatusVariant(outage.status || 'scheduled')}>
                  {(outage.status || 'scheduled').toUpperCase()}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <div className="mt-1">
                <Badge variant={getTypeVariant(outage.outageType || 'unplanned')}>
                  {(outage.outageType || 'unplanned').toUpperCase()}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Impact Level</label>
              <div className="mt-1">
                <Badge variant={getImpactVariant(outage.impactLevel || 'medium')}>
                  {(outage.impactLevel || 'medium').toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {outage.description && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-sm mt-1">{outage.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Start Time</label>
              <p className="text-sm">{new Date(outage.startTime).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Duration</label>
              <p className="text-sm">{getDuration()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Estimated Restoration</label>
              <p className="text-sm">{outage.estimatedRestoration ? new Date(outage.estimatedRestoration).toLocaleString() : "TBD"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Actual Restoration</label>
              <p className="text-sm">{outage.actualRestoration ? new Date(outage.actualRestoration).toLocaleString() : "Not restored"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OutageImpacts({ outage }: { outage: Outage }) {
  const impacts = outage.impacts || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Impacted Equipment
          </CardTitle>
          <CardDescription>Grid nodes, lines, and assets affected by this outage</CardDescription>
        </CardHeader>
        <CardContent>
          {impacts.length === 0 ? (
            <EmptyStates.NoData
              title="No impacts defined"
              description="This outage has no defined equipment impacts"
            />
          ) : (
            <div className="space-y-4">
              {impacts.map((impact, index) => (
                <div key={impact.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Impact {index + 1}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <label className="font-medium text-muted-foreground">Grid Node</label>
                      <p>{impact.node?.name || impact.nodeId || "N/A"}</p>
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground">Grid Line</label>
                      <p>{impact.line?.name || impact.lineId || "N/A"}</p>
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground">Asset</label>
                      <p>{impact.asset?.name || impact.assetId || "N/A"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OutageTimeline({ outage }: { outage: Outage }) {
  const timelineEvents = [
    { timestamp: outage.createdAt, event: "Outage reported", user: "System", icon: AlertTriangle },
    { timestamp: outage.startTime, event: "Outage started", user: "System", icon: Zap },
    ...(outage.estimatedRestoration ? [{ timestamp: outage.estimatedRestoration, event: "Estimated restoration", user: "Operator", icon: Clock, isEstimate: true }] : []),
    ...(outage.actualRestoration ? [{ timestamp: outage.actualRestoration, event: "Service restored", user: "Operator", icon: CheckCircle }] : []),
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Outage Timeline
          </CardTitle>
          <CardDescription>Chronological events for this outage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timelineEvents.map((event, index) => {
              const IconComponent = event.icon;
              const isPast = new Date(event.timestamp) <= new Date();
              const isEstimate = event.isEstimate;

              return (
                <div key={index} className={cn(
                  "flex items-start gap-3 pb-4 border-b last:border-b-0",
                  !isPast && "opacity-60"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center mt-1",
                    isPast ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500",
                    isEstimate && "bg-orange-500"
                  )}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {event.event}
                      {isEstimate && " (Estimated)"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleString()} • {event.user}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OutageActions({ outage }: { outage: Outage }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Linked Actions
          </CardTitle>
          <CardDescription>Actions and tasks related to this outage</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyStates.NoData
            title="No linked actions"
            description="No actions have been linked to this outage yet"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function OutageAlerts({ outage }: { outage: Outage }) {
  // Mock alerts data - in real implementation, this would come from the alerts system
  const mockAlerts = [
    {
      id: "1",
      type: "System Alert",
      message: "High voltage detected on affected line",
      timestamp: outage.startTime,
      severity: "high" as const,
    },
    {
      id: "2",
      type: "Customer Impact",
      message: "Estimated 1,200 customers affected",
      timestamp: outage.startTime,
      severity: "medium" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Related Alerts
          </CardTitle>
          <CardDescription>System alerts and notifications related to this outage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockAlerts.map((alert) => (
              <div key={alert.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                        {alert.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Form components
function CreateOutageForm({
  tenantId,
  onSuccess,
  onCancel
}: {
  tenantId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { provider } = useDataProvider();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    outageRef: '',
    outageType: 'unplanned' as const,
    startTime: new Date().toISOString().slice(0, 16),
    estimatedRestoration: '',
    impactLevel: 'medium' as const,
    description: '',
    impacts: [{ nodeId: '', lineId: '', assetId: '' }]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: CreateOutageRequest = {
        outageRef: formData.outageRef,
        outageType: formData.outageType,
        startTime: formData.startTime,
        estimatedRestoration: formData.estimatedRestoration || undefined,
        impactLevel: formData.impactLevel,
        description: formData.description || undefined,
        impacts: formData.impacts.filter(impact =>
          impact.nodeId || impact.lineId || impact.assetId
        )
      };

      await provider.createOutage(tenantId, payload);
      onSuccess();
    } catch (error) {
      toast.error(`Failed to create outage: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addImpact = () => {
    setFormData(prev => ({
      ...prev,
      impacts: [...prev.impacts, { nodeId: '', lineId: '', assetId: '' }]
    }));
  };

  const removeImpact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      impacts: prev.impacts.filter((_, i) => i !== index)
    }));
  };

  const updateImpact = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      impacts: prev.impacts.map((impact, i) =>
        i === index ? { ...impact, [field]: value } : impact
      )
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Outage Reference *</label>
          <Input
            value={formData.outageRef}
            onChange={(e) => setFormData(prev => ({ ...prev, outageRef: e.target.value }))}
            placeholder="OUT-2024-001"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Type</label>
          <Select
            value={formData.outageType}
            onValueChange={(value) => setFormData(prev => ({ ...prev, outageType: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="unplanned">Unplanned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the outage..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Start Time *</label>
          <Input
            type="datetime-local"
            value={formData.startTime}
            onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Impact Level</label>
          <Select
            value={formData.impactLevel}
            onValueChange={(value) => setFormData(prev => ({ ...prev, impactLevel: value as any }))}
          >
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

      <div>
        <label className="text-sm font-medium">Estimated Restoration</label>
        <Input
          type="datetime-local"
          value={formData.estimatedRestoration}
          onChange={(e) => setFormData(prev => ({ ...prev, estimatedRestoration: e.target.value }))}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium">Equipment Impacts</label>
          <Button type="button" variant="outline" size="sm" onClick={addImpact}>
            <Plus className="h-4 w-4 mr-2" />
            Add Impact
          </Button>
        </div>
        <div className="space-y-3">
          {formData.impacts.map((impact, index) => (
            <div key={index} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Impact {index + 1}</span>
                {formData.impacts.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeImpact(index)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Grid Node ID</label>
                  <Input
                    value={impact.nodeId}
                    onChange={(e) => updateImpact(index, 'nodeId', e.target.value)}
                    placeholder="Node ID"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Grid Line ID</label>
                  <Input
                    value={impact.lineId}
                    onChange={(e) => updateImpact(index, 'lineId', e.target.value)}
                    placeholder="Line ID"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Asset ID</label>
                  <Input
                    value={impact.assetId}
                    onChange={(e) => updateImpact(index, 'assetId', e.target.value)}
                    placeholder="Asset ID"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Outage'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function EditOutageForm({
  outage,
  onSuccess,
  onCancel
}: {
  outage: Outage;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { provider } = useDataProvider();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    outageType: outage.outageType,
    impactLevel: outage.impactLevel,
    description: outage.description || '',
    estimatedRestoration: outage.estimatedRestoration ? new Date(outage.estimatedRestoration).toISOString().slice(0, 16) : '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: UpdateOutageRequest = {
        outageType: formData.outageType,
        impactLevel: formData.impactLevel,
        description: formData.description || undefined,
        estimatedRestoration: formData.estimatedRestoration || undefined,
      };

      await provider.updateOutage(outage.id, payload);
      onSuccess();
    } catch (error) {
      toast.error(`Failed to update outage: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Outage Reference</label>
          <Input value={outage.outageRef} disabled className="bg-muted" />
        </div>
        <div>
          <label className="text-sm font-medium">Type</label>
          <Select
            value={formData.outageType}
            onValueChange={(value) => setFormData(prev => ({ ...prev, outageType: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="unplanned">Unplanned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the outage..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Impact Level</label>
          <Select
            value={formData.impactLevel}
            onValueChange={(value) => setFormData(prev => ({ ...prev, impactLevel: value as any }))}
          >
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
        <div>
          <label className="text-sm font-medium">Estimated Restoration</label>
          <Input
            type="datetime-local"
            value={formData.estimatedRestoration}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedRestoration: e.target.value }))}
          />
        </div>
      </div>

      <div className="bg-muted p-3 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Equipment impacts and start time cannot be modified after creation.
          Create a new outage record if different impacts or timing are needed.
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function EtaUpdateForm({
  currentEta,
  onUpdate,
  onCancel
}: {
  currentEta?: string;
  onUpdate: (eta: string) => void;
  onCancel: () => void;
}) {
  const [eta, setEta] = useState(
    currentEta ? new Date(currentEta).toISOString().slice(0, 16) : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (eta) {
      onUpdate(eta);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">New Estimated Restoration Time</label>
        <Input
          type="datetime-local"
          value={eta}
          onChange={(e) => setEta(e.target.value)}
          required
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={!eta}>
          Update ETA
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}