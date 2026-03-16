import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { useDataProvider } from "@/hooks/useDataProvider";
import { useSectorContentFilter } from "@/hooks/use-sector-switching";
import { ErrorAwareListPane } from "@/components/layout/ErrorAwareListPane";
import { ErrorAwareWorkPane } from "@/components/layout/ErrorAwareWorkPane";
import { KPICard, StatusBadge, DataTable, TableConfigs, EmptyStates, ListItemVariants, SearchFilterSort } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ClipboardList,
  Target,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Download,
  Sparkles,
  Calendar,
  Filter,
  MapPin,
} from "lucide-react";
import { SIMBoard, SIMMetric, KPIMetric, SwitchingOrder, Outage, SimIssue, SimAction } from "@/types/optimise";
import { cn } from "@/lib/utils";

export function SIMBoards() {
  const { currentTenant, selectedAsset, setSelectedAsset, setIsPopPaneOpen, setPopPaneContent } = useApp();
  const { provider } = useDataProvider();
  const { filterItems } = useSectorContentFilter();
  const [searchQuery, setSearchQuery] = useState("");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("date");

  // Close PopPane when this component mounts (no right sidebar needed on this page)
  // Close PopPane when this component mounts (no right sidebar needed on this page)
  useEffect(() => {
    setIsPopPaneOpen(false);

    // Clear selection on unmount to ensure we don't carry over state
    return () => {
      setSelectedAsset(null);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Use selectedAsset from AppContext for SIMBoard selection
  const selectedBoard = selectedAsset as unknown as SIMBoard | null;

  // Fetch sites for filter
  const { data: sites = [] } = useQuery({
    queryKey: ['sites', currentTenant.id],
    queryFn: () => provider.getSitesByTenant(currentTenant.id),
    enabled: !!currentTenant.id,
  });


  // Fetch SIM boards data
  const {
    data: boards = [],
    isLoading: boardsLoading,
    error: boardsError,
    refetch: refetchBoards,
  } = useQuery({
    queryKey: ['sim-boards', currentTenant.id, siteFilter, statusFilter, dateFromFilter, dateToFilter],
    queryFn: () => provider.getSimBoards(currentTenant.id, {
      siteId: (siteFilter && siteFilter !== "all") ? siteFilter : undefined,
      status: (statusFilter && statusFilter !== "all") ? statusFilter as any : undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
    }),
    enabled: !!currentTenant.id,
  });

  // Fetch KPIs for selected board
  const {
    data: boardKpis = [],
    isLoading: kpisLoading,
    error: kpisError,
    refetch: refetchKpis,
  } = useQuery({
    queryKey: ['sim-board-kpis', selectedBoard?.id],
    queryFn: () => provider.getSimKpis(selectedBoard!.id),
    enabled: !!selectedBoard?.id,
  });

  // Fetch switching orders for selected board
  const {
    data: switchingOrders = [],
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['switching-orders', currentTenant.id, selectedBoard?.id],
    queryFn: () => provider.listSwitchingOrders(currentTenant.id, {
      // Filter by board's site if available
      siteId: selectedBoard?.siteId || undefined,
    }),
    enabled: !!currentTenant.id && !!selectedBoard,
  });

  // Fetch outages for selected board
  const {
    data: outages = [],
    isLoading: outagesLoading,
    error: outagesError,
    refetch: refetchOutages,
  } = useQuery({
    queryKey: ['outages', currentTenant.id, selectedBoard?.id],
    queryFn: () => provider.listOutages(currentTenant.id, {
      // Filter by board's site if available
      siteId: selectedBoard?.siteId || undefined,
    }),
    enabled: !!currentTenant.id && !!selectedBoard,
  });

  // Fetch issues for selected board
  const {
    data: issues = [],
    isLoading: issuesLoading,
    error: issuesError,
    refetch: refetchIssues,
  } = useQuery({
    queryKey: ['sim-issues', currentTenant.id, selectedBoard?.id, selectedBoard?.siteId],
    queryFn: () => provider.listSimIssues(currentTenant.id, {
      siteId: selectedBoard?.siteId || undefined,
    }),
    enabled: !!currentTenant.id && !!selectedBoard,
  });

  // Fetch actions for selected board
  const {
    data: actions = [],
    isLoading: actionsLoading,
    error: actionsError,
    refetch: refetchActions,
  } = useQuery({
    queryKey: ['sim-actions', currentTenant.id, selectedBoard?.id, selectedBoard?.siteId],
    queryFn: () => provider.listSimActions(currentTenant.id, {
      siteId: selectedBoard?.siteId || undefined,
    }),
    enabled: !!currentTenant.id && !!selectedBoard,
  });

  // Filter and sort boards based on sector/subsector selection and search query
  const filteredBoards = useMemo(() => {
    // Apply sector-specific filtering using the hook
    let filteredBoards = filterItems(boards);


    // Apply search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredBoards = filteredBoards.filter(
        (board) =>
          board.boardName?.toLowerCase().includes(query) ||
          board.site?.name?.toLowerCase().includes(query) ||
          board.shift?.shiftName?.toLowerCase().includes(query) ||
          board.boardDate?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filteredBoards];
    switch (sortBy) {
      case "date":
        return sorted.sort((a, b) => new Date(b.boardDate).getTime() - new Date(a.boardDate).getTime());
      case "status":
        const statusOrder = { "on-track": 1, "at-risk": 2, "behind": 3 };
        return sorted.sort((a, b) => (statusOrder[a.status as keyof typeof statusOrder] || 99) - (statusOrder[b.status as keyof typeof statusOrder] || 99));
      case "site":
        return sorted.sort((a, b) => (a.site?.name || "").localeCompare(b.site?.name || ""));
      default:
        return sorted;
    }
  }, [boards, searchQuery, filterItems, sortBy]);

  const stats = useMemo(() => {
    const onTrackCount = filteredBoards.filter(board => board.status === "on-track").length;
    const atRiskCount = filteredBoards.filter(board => board.status === "at-risk").length;
    const behindCount = filteredBoards.filter(board => board.status === "behind").length;
    const totalBoards = filteredBoards.length;
    return { onTrackCount, atRiskCount, behindCount, totalBoards };
  }, [filteredBoards]);

  const openAIAssist = () => {
    setPopPaneContent({ type: null, data: null });
    setIsPopPaneOpen(true);
  };

  const handleRetry = () => {
    refetchBoards();
    if (selectedBoard) {
      refetchKpis();
      refetchOrders();
      refetchOutages();
      refetchIssues();
      refetchActions();
    }
  };

  const tabs = selectedBoard
    ? [
      {
        id: "board-kpis",
        label: "Board KPIs",
        content: <SIMBoardKPIs board={selectedBoard} kpis={boardKpis} />,
        isLoading: kpisLoading,
        error: kpisError,
        onRetry: () => refetchKpis(),
      },
      {
        id: "switching-orders",
        label: "Switching Orders",
        content: <SIMBoardSwitchingOrders board={selectedBoard} orders={switchingOrders} />,
        isLoading: ordersLoading,
        error: ordersError,
        onRetry: () => refetchOrders(),
      },
      {
        id: "outages",
        label: "Outages",
        content: <SIMBoardOutages board={selectedBoard} outages={outages} />,
        isLoading: outagesLoading,
        error: outagesError,
        onRetry: () => refetchOutages(),
      },
      {
        id: "issues",
        label: "Issues",
        content: <SIMBoardIssues board={selectedBoard} issues={issues} />,
        isLoading: issuesLoading,
        error: issuesError,
        onRetry: () => refetchIssues(),
      },
      {
        id: "actions",
        label: "Actions",
        content: <SIMBoardActions board={selectedBoard} actions={actions} />,
        isLoading: actionsLoading,
        error: actionsError,
        onRetry: () => refetchActions(),
      },
    ]
    : [
      {
        id: "overview",
        label: "SIM Boards Overview",
        content: <SIMBoardsOverview stats={stats} boards={filteredBoards} />,
      },
    ];

  return (
    <div className="flex w-full h-full overflow-hidden gap-4 p-4 bg-muted/40">
      <ErrorAwareListPane
        title="SIM Boards"
        subtitle={currentTenant.name}
        count={filteredBoards.length}
        isLoading={boardsLoading}
        error={boardsError}
        onRetry={handleRetry}
        contentType="SIM boards"
        showFilters={false}
        className="rounded-lg border bg-background shadow-sm"
      >
        <div className="px-2 pb-2">
          <SearchFilterSort
            searchPlaceholder="Search SIM boards..."
            onSearchChange={setSearchQuery}
            filterContent={
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Select value={siteFilter} onValueChange={setSiteFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Sites" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sites</SelectItem>
                      {sites.map(site => (
                        <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="on-track">On Track</SelectItem>
                      <SelectItem value="at-risk">At Risk</SelectItem>
                      <SelectItem value="behind">Behind</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    placeholder="From Date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    type="date"
                    placeholder="To Date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                    className="h-8 text-xs"
                  />
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
                    <SelectItem value="date">Date (Newest First)</SelectItem>
                    <SelectItem value="status">Status (On Track First)</SelectItem>
                    <SelectItem value="site">Site (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
          />
        </div>

        {filteredBoards.length > 0 ? (
          filteredBoards.map((board) => (
            <ListItemVariants.SIMBoard
              key={board.id}
              board={{
                id: board.id,
                name: board.boardName,
                shift: board.shift?.shiftName || 'Unknown',
                date: board.boardDate,
                status: board.status,
                siteName: board.site?.name,
              }}
              isSelected={selectedBoard?.id === board.id}
              onClick={() => setSelectedAsset(board as unknown as any)}
            />
          ))
        ) : (
          <EmptyStates.NoSIMBoards
            size="sm"
            className="py-8"
          />
        )}
      </ErrorAwareListPane>

      <ErrorAwareWorkPane
        key={selectedBoard ? `board-${selectedBoard.id}` : 'boards-overview'}
        title={selectedBoard ? selectedBoard.boardName : "SIM Boards"}
        subtitle={selectedBoard ? `${selectedBoard.shift?.shiftName || 'Unknown'} Shift · ${selectedBoard.boardDate}` : `${filteredBoards.length} SIM boards`}
        tabs={tabs}
        defaultTab={selectedBoard ? "board-kpis" : "overview"}
        isLoading={boardsLoading}
        error={boardsError}
        onRetry={handleRetry}
        contentType="SIM board workspace"
        className="rounded-lg border bg-background shadow-sm"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button size="sm" className="gap-2" onClick={openAIAssist}>
              <Sparkles className="w-4 h-4" />
              AI Assist
            </Button>
          </div>
        }
      />
    </div>
  );
}



function SIMBoardsOverview({
  stats,
  boards,
}: {
  stats: { onTrackCount: number; atRiskCount: number; behindCount: number; totalBoards: number };
  boards: SIMBoard[];
}) {
  const { setSelectedAsset } = useApp();
  const recentBoards = boards
    .sort((a, b) => new Date(b.boardDate).getTime() - new Date(a.boardDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Boards"
          value={stats.totalBoards.toString()}
          subtitle="Active SIM boards"
          icon={ClipboardList}
          variant="primary"
        />
        <KPICard
          title="On Track"
          value={stats.onTrackCount.toString()}
          subtitle="Meeting targets"
          icon={CheckCircle}
          variant="success"
          trend="up"
          trendValue={`${((stats.onTrackCount / stats.totalBoards) * 100).toFixed(0)}%`}
        />
        <KPICard
          title="At Risk"
          value={stats.atRiskCount.toString()}
          subtitle="Needs attention"
          icon={AlertTriangle}
          variant="warning"
          trend="neutral"
          trendValue={`${((stats.atRiskCount / stats.totalBoards) * 100).toFixed(0)}%`}
        />
        <KPICard
          title="Behind"
          value={stats.behindCount.toString()}
          subtitle="Requires action"
          icon={XCircle}
          variant="destructive"
          trend="down"
          trendValue={`${((stats.behindCount / stats.totalBoards) * 100).toFixed(0)}%`}
        />
      </div>

      {/* Recent Boards */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Recent SIM Boards</h3>
        <DataTable
          columns={[
            { key: 'boardName', label: 'Board Name' },
            { key: 'shift', label: 'Shift', render: (shift) => shift?.shiftName || 'Unknown' },
            { key: 'boardDate', label: 'Date' },
            {
              key: 'status',
              label: 'Status',
              render: (status) => (
                <StatusBadge
                  status={status === "on-track" ? "online" : status === "at-risk" ? "maintenance" : "offline"}
                  size="sm"
                />
              ),
            },
          ]}
          data={recentBoards}
          onRowClick={(board) => setSelectedAsset(board as unknown as any)}
          emptyState={
            <EmptyStates.NoSIMBoards
              size="sm"
              description="No recent SIM boards to display."
            />
          }
        />
      </div>
    </div>
  );
}

function SIMBoardKPIs({ board, kpis }: { board: SIMBoard; kpis: KPIMetric[] }) {
  return (
    <div className="space-y-6">
      {/* Board Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">{board.boardName}</h3>
              <StatusBadge status={board.status === "on-track" ? "online" : board.status === "at-risk" ? "maintenance" : "offline"} />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{board.shift?.shiftName || 'Unknown'} Shift</span>
              <span>·</span>
              <span>{board.boardDate}</span>
              {board.site && (
                <>
                  <span>·</span>
                  <span>{board.site.name}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-3 gap-4">
        {kpis.length > 0 ? (
          kpis.map((kpi, index) => (
            <KPICard
              key={index}
              title={kpi.kpiName}
              value={`${kpi.actualValue || 0}${kpi.unit && kpi.unit !== 'count' ? kpi.unit : ''}`}
              subtitle={`Target: ${kpi.targetValue || 0}${kpi.unit && kpi.unit !== 'count' ? kpi.unit : ''}`}
              icon={Target}
              variant={kpi.status === "good" ? "success" : kpi.status === "warning" ? "warning" : "destructive"}
              trend={kpi.actualValue && kpi.targetValue && kpi.actualValue >= kpi.targetValue ? "up" : "down"}
              trendValue={kpi.actualValue && kpi.targetValue ? `${(((kpi.actualValue - kpi.targetValue) / kpi.targetValue) * 100).toFixed(1)}%` : undefined}
            />
          ))
        ) : (
          <div className="col-span-3 text-center py-8 text-muted-foreground">
            No KPIs available for this board
          </div>
        )}
      </div>
    </div>
  );
}

function SIMBoardSwitchingOrders({ board, orders }: { board: SIMBoard; orders: SwitchingOrder[] }) {
  return (
    <div className="space-y-6">
      {/* Orders Summary */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Orders"
          value={orders.length.toString()}
          subtitle="Switching orders"
          icon={ClipboardList}
          variant="primary"
        />
        <KPICard
          title="Pending"
          value={orders.filter(o => o.status === "pending").length.toString()}
          subtitle="Awaiting approval"
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="In Progress"
          value={orders.filter(o => o.status === "in-progress").length.toString()}
          subtitle="Being executed"
          icon={TrendingUp}
          variant="default"
        />
        <KPICard
          title="Completed"
          value={orders.filter(o => o.status === "completed").length.toString()}
          subtitle="Finished"
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* Orders Table */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Switching Orders</h3>
        <DataTable
          columns={[
            { key: 'orderNo', label: 'Order No.' },
            { key: 'description', label: 'Description' },
            {
              key: 'priority',
              label: 'Priority',
              render: (priority) => (
                <StatusBadge
                  status={priority === "high" ? "offline" : priority === "medium" ? "maintenance" : "online"}
                  size="sm"
                />
              ),
            },
            {
              key: 'status',
              label: 'Status',
              render: (status) => (
                <StatusBadge
                  status={status === "completed" ? "online" : status === "in-progress" ? "maintenance" : "offline"}
                  size="sm"
                />
              ),
            },
            { key: 'assignedOwner', label: 'Owner' },
            { key: 'plannedStart', label: 'Planned Start', render: (date) => date ? new Date(date).toLocaleString() : '-' },
          ]}
          data={orders}
          emptyState={
            <div className="text-center py-8 text-muted-foreground">
              No switching orders for this board
            </div>
          }
        />
      </div>
    </div>
  );
}

function SIMBoardOutages({ board, outages }: { board: SIMBoard; outages: Outage[] }) {
  return (
    <div className="space-y-6">
      {/* Outages Summary */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Outages"
          value={outages.length.toString()}
          subtitle="All outages"
          icon={AlertTriangle}
          variant="primary"
        />
        <KPICard
          title="Planned"
          value={outages.filter(o => o.outageType === "planned").length.toString()}
          subtitle="Scheduled outages"
          icon={Calendar}
          variant="default"
        />
        <KPICard
          title="Unplanned"
          value={outages.filter(o => o.outageType === "unplanned").length.toString()}
          subtitle="Emergency outages"
          icon={AlertTriangle}
          variant="warning"
        />
        <KPICard
          title="Active"
          value={outages.filter(o => o.status === "active").length.toString()}
          subtitle="Currently active"
          icon={XCircle}
          variant="destructive"
        />
      </div>

      {/* Outages Table */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Outages</h3>
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
          data={outages}
          emptyState={
            <div className="text-center py-8 text-muted-foreground">
              No outages for this board
            </div>
          }
        />
      </div>
    </div>
  );
}

function SIMBoardIssues({ board, issues }: { board: SIMBoard; issues: SimIssue[] }) {
  return (
    <div className="space-y-6">
      {/* Issues Summary */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Issues"
          value={issues.length.toString()}
          subtitle="All issues"
          icon={AlertTriangle}
          variant="primary"
        />
        <KPICard
          title="Open"
          value={issues.filter(i => i.status === "open").length.toString()}
          subtitle="New issues"
          icon={AlertTriangle}
          variant="warning"
        />
        <KPICard
          title="In Progress"
          value={issues.filter(i => i.status === "in-progress").length.toString()}
          subtitle="Being worked on"
          icon={TrendingUp}
          variant="default"
        />
        <KPICard
          title="Resolved"
          value={issues.filter(i => i.status === "resolved").length.toString()}
          subtitle="Completed"
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* Issues Table */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Issues</h3>
        <DataTable
          columns={[
            { key: 'issueRef', label: 'Reference' },
            { key: 'title', label: 'Title' },
            { key: 'category', label: 'Category' },
            {
              key: 'priority',
              label: 'Priority',
              render: (priority) => (
                <StatusBadge
                  status={priority === "high" ? "offline" : priority === "medium" ? "maintenance" : "online"}
                  size="sm"
                />
              ),
            },
            {
              key: 'status',
              label: 'Status',
              render: (status) => (
                <StatusBadge
                  status={status === "resolved" ? "online" : status === "in-progress" ? "maintenance" : "offline"}
                  size="sm"
                />
              ),
            },
            { key: 'createdAt', label: 'Created', render: (date) => new Date(date).toLocaleDateString() },
          ]}
          data={issues}
          emptyState={
            <div className="text-center py-8 text-muted-foreground">
              No issues for this board
            </div>
          }
        />
      </div>
    </div>
  );
}

function SIMBoardActions({ board, actions }: { board: SIMBoard; actions: SimAction[] }) {
  return (
    <div className="space-y-6">
      {/* Actions Summary */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Actions"
          value={actions.length.toString()}
          subtitle="All actions"
          icon={ClipboardList}
          variant="primary"
        />
        <KPICard
          title="Pending"
          value={actions.filter(a => a.status === "pending").length.toString()}
          subtitle="Not started"
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="In Progress"
          value={actions.filter(a => a.status === "in-progress").length.toString()}
          subtitle="Being worked on"
          icon={TrendingUp}
          variant="default"
        />
        <KPICard
          title="Completed"
          value={actions.filter(a => a.status === "completed").length.toString()}
          subtitle="Finished"
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* Actions Table */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Actions</h3>
        <DataTable
          columns={[
            { key: 'actionRef', label: 'Reference' },
            { key: 'description', label: 'Description' },
            { key: 'owner', label: 'Owner' },
            {
              key: 'status',
              label: 'Status',
              render: (status) => (
                <StatusBadge
                  status={status === "completed" ? "online" : status === "in-progress" ? "maintenance" : "offline"}
                  size="sm"
                />
              ),
            },
            { key: 'dueDate', label: 'Due Date', render: (date) => date ? new Date(date).toLocaleDateString() : '-' },
            { key: 'createdAt', label: 'Created', render: (date) => new Date(date).toLocaleDateString() },
          ]}
          data={actions}
          emptyState={
            <div className="text-center py-8 text-muted-foreground">
              No actions for this board
            </div>
          }
        />
      </div>
    </div>
  );
}

