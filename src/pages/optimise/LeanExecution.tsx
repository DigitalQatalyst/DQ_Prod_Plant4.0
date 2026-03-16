import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useSectorContentFilter } from "@/hooks/use-sector-switching";
import { ErrorAwareListPane } from "@/components/layout/ErrorAwareListPane";
import { ErrorAwareWorkPane } from "@/components/layout/ErrorAwareWorkPane";
import { KPICard } from "@/components/shared/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { LoadingState, useLoadingState } from "@/components/shared/LoadingState";
import { EmptyStates } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
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
  Plus,
  Download,
  Sparkles,
} from "lucide-react";
import { simBoards, simMetrics, issues } from "@/data/mockData";
import { SIMBoard, SIMMetric, Issue } from "@/types/optimise";
import { cn } from "@/lib/utils";
import { getSectorSpecificModalContent } from "@/lib/sectorModalUtils";
import { ContentErrorHandler, NavigationErrorHandler } from "@/lib/errorHandling";

// Import the individual SIM components
import { SIMBoards } from "./sim/SIMBoards";
import { SwitchingOrders } from "./sim/SwitchingOrders";
import { Outages } from "./sim/Outages";
import { ShiftPerformance } from "./sim/ShiftPerformance";
import { SIMIssues } from "./sim/SIMIssues";
import { SIMActions } from "./sim/SIMActions";

interface LeanExecutionProps {
  subFeature?: string;
}

export function LeanExecution({ subFeature }: LeanExecutionProps) {
  // If a sub-feature is specified, render the appropriate component
  switch (subFeature) {
    case "boards":
      return <SIMBoards />;
    case "switching-orders":
      return <SwitchingOrders />;
    case "outages":
      return <Outages />;
    case "shifts":
      return <ShiftPerformance />;
    case "issues":
      return <SIMIssues />;
    case "actions":
      return <SIMActions />;
    default:
      // Default behavior - show the original SIM overview
      return <LeanExecutionOverview />;
  }
}

// Original LeanExecution component renamed to LeanExecutionOverview
function LeanExecutionOverview() {
  const { currentTenant, selectedAsset, setSelectedAsset, setIsPopPaneOpen, setPopPaneContent } = useApp();
  const { filterItems, currentSectorName, currentSubsectorName } = useSectorContentFilter();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Close sidebar on mount to prevent blank sidebar
  useEffect(() => {
    setIsPopPaneOpen(false);
    // Clear selection on unmount to ensure we don't carry over state
    return () => {
      setSelectedAsset(null);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Error handling state
  const {
    isLoading: isLoadingBoards,
    error: boardsError,
    startLoading: startLoadingBoards,
    stopLoading: stopLoadingBoards,
    setError: setBoardsError,
    retry: retryLoadBoards
  } = useLoadingState();

  // Use selectedAsset from AppContext for SIMBoard selection
  const selectedBoard = selectedAsset as unknown as SIMBoard | null;

  // Filter boards based on sector/subsector selection and search query with error handling
  const filteredBoards = useMemo(() => {
    try {
      // Apply sector-specific filtering using the hook
      let boards = filterItems(simBoards);

      // Apply search filtering
      if (!searchQuery) return boards;
      const query = searchQuery.toLowerCase();
      return boards.filter(
        (board) =>
          board.name.toLowerCase().includes(query) ||
          board.shift.toLowerCase().includes(query) ||
          board.date.toLowerCase().includes(query)
      );
    } catch (error) {
      ContentErrorHandler.handleContentLoadingFailure(
        "sim_boards",
        error instanceof Error ? error : new Error(String(error)),
        () => retryLoadBoards(() => Promise.resolve())()
      );
      setBoardsError(error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }, [searchQuery, filterItems, setBoardsError, retryLoadBoards]);

  const stats = useMemo(() => {
    try {
      if (filteredBoards.length === 0) {
        return { onTrackCount: 0, atRiskCount: 0, behindCount: 0, totalBoards: 0 };
      }

      const onTrackCount = filteredBoards.filter(board => board.status === "on-track").length;
      const atRiskCount = filteredBoards.filter(board => board.status === "at-risk").length;
      const behindCount = filteredBoards.filter(board => board.status === "behind").length;
      const totalBoards = filteredBoards.length;
      return { onTrackCount, atRiskCount, behindCount, totalBoards };
    } catch (error) {
      ContentErrorHandler.handleContentLoadingFailure(
        "sim_statistics",
        error instanceof Error ? error : new Error(String(error))
      );
      return { onTrackCount: 0, atRiskCount: 0, behindCount: 0, totalBoards: 0 };
    }
  }, [filteredBoards]);

  const openAIAssist = () => {
    try {
      // setPopPaneContent({ type: null, data: null });
      // setIsPopPaneOpen(true);
      toast({
        title: "AI Assist",
        description: "AI functionality is coming soon.",
      });
    } catch (error) {
      ContentErrorHandler.handleContentLoadingFailure(
        "ai_assist_modal",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };

  const openCreateModal = () => {
    try {
      // Create sector-specific modal content for SIM issue creation
      const modalContent = getSectorSpecificModalContent('sim-issue', currentSectorName, currentSubsectorName);
      setPopPaneContent(modalContent);
      setIsPopPaneOpen(true);
    } catch (error) {
      ContentErrorHandler.handleContentLoadingFailure(
        "create_modal",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };

  const tabs = [
    {
      id: "overview",
      label: "SIM Overview",
      content: (
        <ErrorBoundary
          fallback={
            <EmptyStates.Error
              title="SIM Overview Error"
              description="Unable to load SIM overview. Please try refreshing the page."
              action={{
                label: "Retry",
                onClick: () => window.location.reload(),
                variant: "outline",
              }}
            />
          }
        >
          <SIMOverview
            stats={stats}
            boards={filteredBoards}
          />
        </ErrorBoundary>
      ),
    },
    {
      id: "metrics",
      label: "Metrics",
      content: (
        <ErrorBoundary
          fallback={
            <EmptyStates.Error
              title="Metrics Tab Error"
              description="Unable to load metrics content."
            />
          }
        >
          <ComingSoon title="SIM Metrics" description="Shift-level performance metrics and trends" />
        </ErrorBoundary>
      ),
    },
    {
      id: "escalations",
      label: "Escalations",
      content: (
        <ErrorBoundary
          fallback={
            <EmptyStates.Error
              title="Escalations Tab Error"
              description="Unable to load escalations content."
            />
          }
        >
          <ComingSoon title="Escalations" description="Issue escalation management and workflows" />
        </ErrorBoundary>
      ),
    },
  ];

  const boardTabs = selectedBoard
    ? [
      {
        id: "sim-board",
        label: "SIM Board",
        content: (
          <ErrorBoundary
            fallback={
              <EmptyStates.Error
                title="SIM Board Error"
                description="Unable to load SIM board content."
                action={{
                  label: "Retry",
                  onClick: () => window.location.reload(),
                  variant: "outline",
                }}
              />
            }
          >
            <SIMBoardTab board={selectedBoard} metrics={simMetrics} />
          </ErrorBoundary>
        ),
      },
      {
        id: "shift-summary",
        label: "Shift Summary",
        content: (
          <ErrorBoundary
            fallback={
              <EmptyStates.Error
                title="Shift Summary Error"
                description="Unable to load shift summary content."
              />
            }
          >
            <ShiftSummaryTab board={selectedBoard} />
          </ErrorBoundary>
        ),
      },
      {
        id: "issues",
        label: "Issues",
        content: (
          <ErrorBoundary
            fallback={
              <EmptyStates.Error
                title="Issues Tab Error"
                description="Unable to load issues content."
              />
            }
          >
            <IssuesTab issues={issues} onCreateIssue={openCreateModal} />
          </ErrorBoundary>
        ),
      },
      {
        id: "actions",
        label: "Actions",
        content: (
          <ErrorBoundary
            fallback={
              <EmptyStates.Error
                title="Actions Tab Error"
                description="Unable to load actions content."
              />
            }
          >
            <ActionsTab />
          </ErrorBoundary>
        ),
      },
    ]
    : tabs;

  const handleBoardSelection = (board: SIMBoard) => {
    try {
      setSelectedAsset(board as unknown as any);
    } catch (error) {
      ContentErrorHandler.handleContentLoadingFailure(
        "board_selection",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };

  const handleSearch = (query: string) => {
    try {
      setSearchQuery(query);
    } catch (error) {
      ContentErrorHandler.handleContentLoadingFailure(
        "search_operation",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };

  return (
    <ErrorBoundary
      onError={(error) => {
        NavigationErrorHandler.handleNavigationFailure(error, "/optimise/sim");
      }}
    >
      <div className="flex w-full h-full overflow-hidden gap-4 p-4 bg-muted/40">
        <ErrorAwareListPane
          title="SIM Boards"
          subtitle={currentTenant.name}
          count={boardsError ? 0 : filteredBoards.length}
          searchPlaceholder="Search SIM boards..."
          onSearch={handleSearch}
          isLoading={isLoadingBoards}
          error={boardsError}
          onRetry={retryLoadBoards(() => Promise.resolve())}
          contentType="SIM boards"
          className="rounded-lg border bg-background shadow-sm"
        >
          {filteredBoards.length > 0 ? (
            filteredBoards.map((board) => (
              <ErrorBoundary
                key={board.id}
                fallback={
                  <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                    <div className="text-sm text-destructive">Error loading board</div>
                  </div>
                }
              >
                <SIMBoardItem
                  board={board}
                  isSelected={selectedBoard?.id === board.id}
                  onClick={() => handleBoardSelection(board)}
                />
              </ErrorBoundary>
            ))
          ) : (
            <EmptyStates.NoData
              title="No SIM Boards"
              description="No SIM boards are available for your current selection."
              size="sm"
              className="py-8"
            />
          )}
        </ErrorAwareListPane>

        <ErrorAwareWorkPane
          key={selectedBoard ? `board-${selectedBoard.id}` : 'sim-overview'}
          title={selectedBoard ? selectedBoard.name : "SIM Overview"}
          subtitle={selectedBoard ? `${selectedBoard.shift} Shift · ${selectedBoard.date}` : `${filteredBoards.length} SIM boards`}
          tabs={boardTabs}
          defaultTab={selectedBoard ? "sim-board" : "overview"}
          contentType="sim_analysis"
          className="rounded-lg border bg-background shadow-sm"
          actions={
            <ErrorBoundary
              fallback={
                <div className="text-xs text-muted-foreground">Actions unavailable</div>
              }
            >
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
            </ErrorBoundary>
          }
        />
      </div>
    </ErrorBoundary>
  );
}

function SIMBoardItem({
  board,
  isSelected,
  onClick,
}: {
  board: SIMBoard;
  isSelected: boolean;
  onClick: () => void;
}) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "on-track": return "online";
      case "at-risk": return "maintenance";
      case "behind": return "offline";
      default: return "online";
    }
  };

  const getShiftIcon = (shift: string) => {
    switch (shift.toLowerCase()) {
      case "day": return "☀️";
      case "evening": return "🌅";
      case "night": return "🌙";
      default: return "⏰";
    }
  };

  return (
    <div
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:border-primary/30",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:bg-card/80"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground truncate">
            {board.name}
          </h4>
          <p className="text-xs text-muted-foreground truncate">
            {board.shift} Shift
          </p>
        </div>
        <StatusBadge status={getStatusVariant(board.status)} size="sm" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Status</span>
          <span className="text-sm font-semibold capitalize">{board.status.replace('-', ' ')}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <span>{getShiftIcon(board.shift)}</span>
            <span className="text-muted-foreground">{board.shift}</span>
          </div>
          <span className="text-muted-foreground">{board.date}</span>
        </div>
      </div>
    </div>
  );
}

function SIMOverview({
  stats,
  boards,
}: {
  stats: { onTrackCount: number; atRiskCount: number; behindCount: number; totalBoards: number };
  boards: SIMBoard[];
}) {
  const recentBoards = boards
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="data-table">
            <thead className="bg-secondary/30">
              <tr>
                <th>Board Name</th>
                <th>Shift</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBoards.map((board) => (
                <tr key={board.id} className="cursor-pointer">
                  <td className="font-medium">{board.name}</td>
                  <td className="text-muted-foreground">{board.shift}</td>
                  <td className="text-muted-foreground">{board.date}</td>
                  <td>
                    <StatusBadge
                      status={board.status === "on-track" ? "online" : board.status === "at-risk" ? "maintenance" : "offline"}
                      size="sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SIMBoardTab({ board, metrics }: { board: SIMBoard; metrics: SIMMetric[] }) {
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
              <h3 className="text-xl font-semibold">{board.name}</h3>
              <StatusBadge status={board.status === "on-track" ? "online" : board.status === "at-risk" ? "maintenance" : "offline"} />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{board.shift} Shift</span>
              <span>·</span>
              <span>{board.date}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid - Actual vs Target */}
      <div className="grid grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <KPICard
            key={index}
            title={metric.name}
            value={`${metric.actual}${metric.unit}`}
            subtitle={`Target: ${metric.target}${metric.unit}`}
            icon={Target}
            variant={metric.status === "good" ? "success" : metric.status === "warning" ? "warning" : "destructive"}
            trend={metric.actual >= metric.target ? "up" : "down"}
            trendValue={`${((metric.actual - metric.target) / metric.target * 100).toFixed(1)}%`}
          />
        ))}
      </div>

      {/* Metrics Details */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Performance Metrics
          </h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            {metrics.slice(0, 3).map((metric, index) => (
              <MetricRow key={index} metric={metric} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Quality Metrics
          </h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            {metrics.slice(3).map((metric, index) => (
              <MetricRow key={index} metric={metric} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShiftSummaryTab({ board }: { board: SIMBoard }) {
  return (
    <div className="space-y-6">
      {/* Shift Overview */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Shift Duration"
          value="8 hours"
          subtitle="Standard shift length"
          icon={Clock}
          variant="primary"
        />
        <KPICard
          title="Team Size"
          value="12"
          subtitle="Operators on shift"
          icon={Users}
          variant="default"
        />
        <KPICard
          title="Production Target"
          value="1,200"
          subtitle="Units planned"
          icon={Target}
          variant="primary"
        />
        <KPICard
          title="Actual Production"
          value="1,136"
          subtitle="Units completed"
          icon={BarChart3}
          variant={board.status === "on-track" ? "success" : "warning"}
          trend={board.status === "on-track" ? "up" : "down"}
          trendValue="94.7%"
        />
      </div>

      {/* Shift Performance Summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Shift Performance Summary</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Key Achievements</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Safety targets met - zero incidents</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Quality rate above 97%</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Equipment availability at 96.8%</span>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Areas for Improvement</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span>Cycle time 5.4% above target</span>
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span>Two minor equipment stoppages</span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-destructive" />
                <span>Scrap rate exceeded target by 0.8%</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Hourly Performance */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Hourly Performance Tracking</h3>
        <div className="h-48 bg-secondary/20 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Hourly performance chart</p>
            <p className="text-xs text-muted-foreground">Coming in Stage 03</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function IssuesTab({ issues, onCreateIssue }: { issues: Issue[]; onCreateIssue: () => void }) {

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "resolved": return "online";
      case "in-progress": return "maintenance";
      case "open": return "offline";
      default: return "offline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Issues Summary */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Issues"
          value={issues.length.toString()}
          subtitle="All logged issues"
          icon={AlertTriangle}
          variant="primary"
        />
        <KPICard
          title="Open"
          value={issues.filter(i => i.status === "open").length.toString()}
          subtitle="Awaiting action"
          icon={XCircle}
          variant="destructive"
        />
        <KPICard
          title="In Progress"
          value={issues.filter(i => i.status === "in-progress").length.toString()}
          subtitle="Being addressed"
          icon={Clock}
          variant="warning"
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
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Issue Log</h3>
          <Button size="sm" className="gap-2" onClick={onCreateIssue}>
            <Plus className="w-4 h-4" />
            Log Issue
          </Button>
        </div>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="data-table">
            <thead className="bg-secondary/30">
              <tr>
                <th>Issue</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assignee</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id} className="cursor-pointer">
                  <td className="font-medium">{issue.title}</td>
                  <td className="text-muted-foreground">{issue.category}</td>
                  <td>
                    <StatusBadge
                      status={issue.priority === "high" ? "offline" : issue.priority === "medium" ? "maintenance" : "online"}
                      size="sm"
                    />
                  </td>
                  <td>
                    <StatusBadge
                      status={getStatusVariant(issue.status)}
                      size="sm"
                    />
                  </td>
                  <td className="text-muted-foreground">{issue.assignee}</td>
                  <td className="text-muted-foreground">{new Date(issue.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ActionsTab() {
  const mockActions = [
    {
      id: "act-001",
      title: "Adjust conveyor belt tension",
      priority: "high",
      assignee: "John Doe",
      dueDate: "2024-12-10",
      status: "pending"
    },
    {
      id: "act-002",
      title: "Calibrate temperature sensor",
      priority: "medium",
      assignee: "Jane Smith",
      dueDate: "2024-12-11",
      status: "in-progress"
    },
    {
      id: "act-003",
      title: "Update operator training materials",
      priority: "low",
      assignee: "Mike Johnson",
      dueDate: "2024-12-15",
      status: "completed"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Actions Summary */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Actions"
          value={mockActions.length.toString()}
          subtitle="Assigned actions"
          icon={ClipboardList}
          variant="primary"
        />
        <KPICard
          title="Pending"
          value={mockActions.filter(a => a.status === "pending").length.toString()}
          subtitle="Not started"
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="In Progress"
          value={mockActions.filter(a => a.status === "in-progress").length.toString()}
          subtitle="Being worked on"
          icon={TrendingUp}
          variant="default"
        />
        <KPICard
          title="Completed"
          value={mockActions.filter(a => a.status === "completed").length.toString()}
          subtitle="Finished"
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* Escalation Flow */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Escalation Flow</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-3 bg-secondary/20 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">1</div>
            <div className="flex-1">
              <div className="text-sm font-medium">Shift Supervisor</div>
              <div className="text-xs text-muted-foreground">First level escalation for immediate issues</div>
            </div>
            <div className="text-xs text-muted-foreground">0-2 hours</div>
          </div>
          <div className="flex items-center gap-4 p-3 bg-secondary/20 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-warning flex items-center justify-center text-white text-sm font-medium">2</div>
            <div className="flex-1">
              <div className="text-sm font-medium">Production Manager</div>
              <div className="text-xs text-muted-foreground">Second level for unresolved issues</div>
            </div>
            <div className="text-xs text-muted-foreground">2-4 hours</div>
          </div>
          <div className="flex items-center gap-4 p-3 bg-secondary/20 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center text-white text-sm font-medium">3</div>
            <div className="flex-1">
              <div className="text-sm font-medium">Plant Manager</div>
              <div className="text-xs text-muted-foreground">Final escalation for critical issues</div>
            </div>
            <div className="text-xs text-muted-foreground">4+ hours</div>
          </div>
        </div>
      </div>

      {/* Actions Table */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Assigned Actions</h3>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="data-table">
            <thead className="bg-secondary/30">
              <tr>
                <th>Action</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {mockActions.map((action) => (
                <tr key={action.id} className="cursor-pointer">
                  <td className="font-medium">{action.title}</td>
                  <td>
                    <StatusBadge
                      status={action.priority === "high" ? "offline" : action.priority === "medium" ? "maintenance" : "online"}
                      size="sm"
                    />
                  </td>
                  <td className="text-muted-foreground">{action.assignee}</td>
                  <td className="text-muted-foreground">{action.dueDate}</td>
                  <td>
                    <StatusBadge
                      status={action.status === "completed" ? "online" : action.status === "in-progress" ? "maintenance" : "offline"}
                      size="sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ metric }: { metric: SIMMetric }) {
  const variance = ((metric.actual - metric.target) / metric.target * 100);
  const isPositive = variance >= 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="text-sm font-medium">{metric.name}</div>
        <div className="text-xs text-muted-foreground">
          Target: {metric.target}{metric.unit}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium">{metric.actual}{metric.unit}</div>
        <div className={cn(
          "text-xs",
          metric.status === "good" ? "text-success" :
            metric.status === "warning" ? "text-warning" : "text-destructive"
        )}>
          {isPositive ? "+" : ""}{variance.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">{description}</p>
      <p className="text-xs text-muted-foreground mt-4">Coming in Stage 03</p>
    </div>
  );
}