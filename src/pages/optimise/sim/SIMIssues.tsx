import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useSectorContentFilter } from "@/hooks/use-sector-switching";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard, StatusBadge, DataTable, TableConfigs, EmptyStates, ListItemVariants, SearchFilterSort } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Plus,
  Download,
  Sparkles,
  FileText,
  User,
} from "lucide-react";
import { useDataProvider } from "@/hooks/useDataProvider";
import { useQuery } from "@tanstack/react-query";
import { SimIssue as Issue } from "@/types/optimise";
import { cn } from "@/lib/utils";
import { getSectorSpecificModalContent } from "@/lib/sectorModalUtils";

export function SIMIssues() {
  const { currentTenant, selectedAsset, setSelectedAsset, setIsPopPaneOpen, setPopPaneContent } = useApp();
  const { provider } = useDataProvider();
  const { currentSectorName, currentSubsectorName } = useSectorContentFilter();
  const [searchQuery, setSearchQuery] = useState("");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");

  // Fetch sites for filter
  const { data: sites = [] } = useQuery({
    queryKey: ['sites', currentTenant.id],
    queryFn: () => provider.getSiteSummaryByTenant(currentTenant.id),
    enabled: !!currentTenant.id,
  });

  // Clear selection on unmount
  useEffect(() => {
    return () => {
      setSelectedAsset(null);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedIssue = selectedAsset as unknown as Issue | null;

  // Fetch issues data
  const {
    data: issues = [],
    isLoading: issuesLoading,
    error: issuesError,
  } = useQuery({
    queryKey: ['sim-issues', currentTenant?.id, siteFilter, statusFilter, priorityFilter],
    queryFn: () => provider.listSimIssues(currentTenant?.id!, {
      siteId: (siteFilter && siteFilter !== "all") ? siteFilter : undefined,
      status: (statusFilter && statusFilter !== "all") ? statusFilter : undefined,
      priority: (priorityFilter && priorityFilter !== "all") ? priorityFilter : undefined,
    }),
    enabled: !!currentTenant?.id,
  });

  // Filter and sort issues based on search query
  const filteredIssues = useMemo(() => {
    let issueList = filterItems(issues);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      issueList = issueList.filter(
        (issue) =>
          issue.title.toLowerCase().includes(query) ||
          (issue.category && issue.category.toLowerCase().includes(query)) ||
          (issue.assignee && issue.assignee.toLowerCase().includes(query)) ||
          (issue.assignedOwner && issue.assignedOwner.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    const sorted = [...issueList];
    switch (sortBy) {
      case "recent":
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case "priority":
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return sorted.sort((a, b) => (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 9) - (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 9));
      case "status":
        return sorted.sort((a, b) => a.status.localeCompare(b.status));
      default:
        return sorted;
    }
  }, [issues, searchQuery, sortBy, filterItems]);


  const stats = useMemo(() => {
    const openCount = filteredIssues.filter(i => i.status === "open").length;
    const inProgressCount = filteredIssues.filter(i => i.status === "in-progress").length;
    const resolvedCount = filteredIssues.filter(i => i.status === "resolved").length;
    const totalIssues = filteredIssues.length;
    return { openCount, inProgressCount, resolvedCount, totalIssues };
  }, [filteredIssues]);

  const openAIAssist = () => {
    setPopPaneContent({ type: null, data: null });
    setIsPopPaneOpen(true);
  };

  const openCreateModal = () => {
    const modalContent = getSectorSpecificModalContent('sim-issue', currentSectorName, currentSubsectorName);
    setPopPaneContent(modalContent);
    setIsPopPaneOpen(true);
  };

  const tabs = selectedIssue
    ? [
      {
        id: "details",
        label: "Details",
        content: <IssueDetailsTab issue={selectedIssue} />,
      },
      {
        id: "analysis",
        label: "Analysis",
        content: <IssueAnalysisTab issue={selectedIssue} />,
      },
      {
        id: "actions",
        label: "Actions",
        content: <IssueActionsTab issue={selectedIssue} />,
      },
      {
        id: "history",
        label: "History",
        content: <IssueHistoryTab issue={selectedIssue} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Issues Overview",
        content: <IssuesOverview stats={stats} issues={filteredIssues} onCreateIssue={openCreateModal} />,
      },
    ];

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane
        title="Issues"
        subtitle={currentTenant.name}
        count={filteredIssues.length}
        showFilters={false}
        isLoading={issuesLoading}
        actions={
          <Button size="sm" className="gap-2 w-full" onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            Log Issue
          </Button>
        }
      >
        <div className="px-2 pb-2">
          <SearchFilterSort
            searchPlaceholder="Search issues..."
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
                      {sites.map(site => (
                        <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                      ))}
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
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Priority</label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
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
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="priority">Priority (High to Low)</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
          />
        </div>

        {filteredIssues.length > 0 ? (
          filteredIssues.map((issue) => (
            <ListItemVariants.Alert
              key={issue.id}
              alert={issue}
              isSelected={selectedIssue?.id === issue.id}
              onClick={() => setSelectedAsset(issue as unknown as any)}
            />
          ))
        ) : (
          <EmptyStates.NoIssues
            size="sm"
            className="py-8"
          />
        )}
      </ListPane>

      <WorkPane
        key={selectedIssue ? `issue-${selectedIssue.id}` : 'issues-overview'}
        title={selectedIssue ? selectedIssue.title : "Issues"}
        subtitle={selectedIssue ? `${selectedIssue.category} · ${selectedIssue.priority} priority` : `${filteredIssues.length} issues`}
        tabs={tabs}
        defaultTab={selectedIssue ? "details" : "overview"}
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



function IssuesOverview({
  stats,
  issues,
  onCreateIssue,
}: {
  stats: { openCount: number; inProgressCount: number; resolvedCount: number; totalIssues: number };
  issues: Issue[];
  onCreateIssue: () => void;
}) {
  const recentIssues = issues
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

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
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Issues"
          value={stats.totalIssues.toString()}
          subtitle="All logged issues"
          icon={AlertTriangle}
          variant="primary"
        />
        <KPICard
          title="Open"
          value={stats.openCount.toString()}
          subtitle="Awaiting action"
          icon={XCircle}
          variant="destructive"
        />
        <KPICard
          title="In Progress"
          value={stats.inProgressCount.toString()}
          subtitle="Being addressed"
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="Resolved"
          value={stats.resolvedCount.toString()}
          subtitle="Completed"
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* Recent Issues */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Recent Issues</h3>
          <Button size="sm" className="gap-2" onClick={onCreateIssue}>
            <Plus className="w-4 h-4" />
            Log Issue
          </Button>
        </div>
        <DataTable
          columns={TableConfigs.alerts.columns.map(col => {
            if (col.key === 'priority') {
              return {
                ...col,
                render: (priority) => (
                  <StatusBadge
                    status={priority === "high" ? "offline" : priority === "medium" ? "maintenance" : "online"}
                    size="sm"
                  />
                ),
              };
            }
            if (col.key === 'status') {
              return {
                ...col,
                render: (status) => (
                  <StatusBadge
                    status={status === "resolved" ? "online" : status === "in-progress" ? "maintenance" : "offline"}
                    size="sm"
                  />
                ),
              };
            }
            return col;
          })}
          data={recentIssues}
          onRowClick={(issue) => setSelectedAsset(issue as unknown as any)}
          emptyState={
            <EmptyStates.NoIssues
              size="sm"
              description="No recent issues to display."
            />
          }
        />
      </div>
    </div>
  );
}

function IssueDetailsTab({ issue }: { issue: Issue }) {
  return (
    <div className="space-y-6">
      {/* Issue Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">{issue.title}</h3>
              <StatusBadge status={issue.status === "resolved" ? "online" : issue.status === "in-progress" ? "maintenance" : "offline"} />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{issue.category}</span>
              <span>·</span>
              <span className="capitalize">{issue.priority} Priority</span>
              <span>·</span>
              <span>Created {new Date(issue.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Issue Information */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Issue Description
          </h4>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Equipment malfunction causing production line slowdown. The conveyor belt system is experiencing intermittent
              stoppages that are impacting overall throughput. Initial investigation suggests mechanical wear in the drive
              mechanism requiring immediate attention.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Assignment & Impact
          </h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Assigned to</span>
              <span className="text-sm font-medium">{issue.assignee}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Impact Level</span>
              <span className="text-sm font-medium">Medium</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estimated Downtime</span>
              <span className="text-sm font-medium">2-4 hours</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Production Impact</span>
              <span className="text-sm font-medium">15% reduction</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Current Status</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">1</div>
            <div className="flex-1">
              <div className="text-sm font-medium">Issue Logged</div>
              <div className="text-xs text-muted-foreground">Initial report submitted and categorized</div>
            </div>
            <div className="text-xs text-muted-foreground">{new Date(issue.createdAt).toLocaleDateString()}</div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-warning flex items-center justify-center text-white text-sm font-medium">2</div>
            <div className="flex-1">
              <div className="text-sm font-medium">Investigation Started</div>
              <div className="text-xs text-muted-foreground">Maintenance team assigned and investigating</div>
            </div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg opacity-50">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground text-sm font-medium">3</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-muted-foreground">Resolution Implementation</div>
              <div className="text-xs text-muted-foreground">Pending investigation completion</div>
            </div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IssueAnalysisTab({ issue }: { issue: Issue }) {
  return (
    <div className="space-y-6">
      {/* Root Cause Analysis */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Root Cause Analysis</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Primary Causes</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-destructive"></div>
                  <span>Mechanical wear in drive belt</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning"></div>
                  <span>Insufficient lubrication</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning"></div>
                  <span>Misaligned conveyor rollers</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Contributing Factors</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                  <span>Extended operation without maintenance</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                  <span>Environmental dust accumulation</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                  <span>Increased production load</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Impact Assessment */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Impact Assessment</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="text-2xl font-bold text-destructive">15%</div>
            <div className="text-sm text-muted-foreground">Production Loss</div>
          </div>
          <div className="text-center p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="text-2xl font-bold text-warning">$2,400</div>
            <div className="text-sm text-muted-foreground">Estimated Cost</div>
          </div>
          <div className="text-center p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="text-2xl font-bold text-primary">4 hrs</div>
            <div className="text-sm text-muted-foreground">Downtime</div>
          </div>
        </div>
      </div>

      {/* Investigation Timeline */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Investigation Timeline</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
            <div className="text-xs text-muted-foreground w-16">09:30</div>
            <div className="flex-1">
              <div className="text-sm font-medium">Initial inspection completed</div>
              <div className="text-xs text-muted-foreground">Visual inspection revealed belt wear and misalignment</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
            <div className="text-xs text-muted-foreground w-16">10:15</div>
            <div className="flex-1">
              <div className="text-sm font-medium">Detailed measurements taken</div>
              <div className="text-xs text-muted-foreground">Belt tension and roller alignment measured</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
            <div className="text-xs text-muted-foreground w-16">11:00</div>
            <div className="flex-1">
              <div className="text-sm font-medium">Root cause identified</div>
              <div className="text-xs text-muted-foreground">Confirmed mechanical wear and maintenance requirements</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IssueActionsTab({ issue }: { issue: Issue }) {
  const mockActions = [
    {
      id: "action-001",
      title: "Replace conveyor belt",
      status: "pending",
      assignee: "Maintenance Team A",
      dueDate: "2024-12-17",
      priority: "high"
    },
    {
      id: "action-002",
      title: "Realign conveyor rollers",
      status: "in-progress",
      assignee: "John Smith",
      dueDate: "2024-12-16",
      priority: "high"
    },
    {
      id: "action-003",
      title: "Update maintenance schedule",
      status: "pending",
      assignee: "Maintenance Supervisor",
      dueDate: "2024-12-20",
      priority: "medium"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Actions Summary */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Actions"
          value={mockActions.length.toString()}
          subtitle="Corrective actions"
          icon={CheckCircle}
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

      {/* Corrective Actions */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Corrective Actions</h3>
        <div className="space-y-3">
          {mockActions.map((action) => (
            <div key={action.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{action.title}</h4>
                  <p className="text-xs text-muted-foreground">Assigned to {action.assignee}</p>
                </div>
                <StatusBadge
                  status={action.status === "completed" ? "online" : action.status === "in-progress" ? "maintenance" : "offline"}
                  size="sm"
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Priority:</span>
                  <StatusBadge
                    status={action.priority === "high" ? "offline" : action.priority === "medium" ? "maintenance" : "online"}
                    size="sm"
                  />
                </div>
                <span className="text-muted-foreground">Due: {action.dueDate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prevention Measures */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Prevention Measures</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
            <div className="w-4 h-4 rounded border border-border"></div>
            <div className="flex-1">
              <div className="text-sm font-medium">Implement weekly belt tension checks</div>
              <div className="text-xs text-muted-foreground">Add to preventive maintenance schedule</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
            <div className="w-4 h-4 rounded border border-border"></div>
            <div className="flex-1">
              <div className="text-sm font-medium">Install vibration monitoring sensors</div>
              <div className="text-xs text-muted-foreground">Early detection of mechanical issues</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
            <div className="w-4 h-4 rounded border border-border"></div>
            <div className="flex-1">
              <div className="text-sm font-medium">Update operator training on early warning signs</div>
              <div className="text-xs text-muted-foreground">Improve issue identification and reporting</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IssueHistoryTab({ issue }: { issue: Issue }) {
  const mockHistory = [
    {
      id: "hist-001",
      timestamp: "2024-12-16 14:30",
      action: "Issue Created",
      user: "Operator Smith",
      details: "Initial issue report submitted with production impact assessment"
    },
    {
      id: "hist-002",
      timestamp: "2024-12-16 14:45",
      action: "Assigned",
      user: "Supervisor Johnson",
      details: "Issue assigned to Maintenance Team A for investigation"
    },
    {
      id: "hist-003",
      timestamp: "2024-12-16 15:00",
      action: "Investigation Started",
      user: "Tech Lead Wilson",
      details: "On-site investigation initiated, equipment inspection in progress"
    },
    {
      id: "hist-004",
      timestamp: "2024-12-16 15:30",
      action: "Root Cause Identified",
      user: "Tech Lead Wilson",
      details: "Mechanical wear in drive belt confirmed as primary cause"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Issue Timeline */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Issue Timeline</h3>
        <div className="space-y-4">
          {mockHistory.map((entry, index) => (
            <div key={entry.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-medium">
                  {index + 1}
                </div>
                {index < mockHistory.length - 1 && (
                  <div className="w-px h-8 bg-border mt-2"></div>
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{entry.action}</span>
                  <span className="text-xs text-muted-foreground">by {entry.user}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">{entry.timestamp}</div>
                <div className="text-sm text-muted-foreground">{entry.details}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Related Issues */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Related Issues</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div className="flex-1">
              <div className="text-sm font-medium">Conveyor belt maintenance overdue</div>
              <div className="text-xs text-muted-foreground">Equipment · Resolved · 2024-11-15</div>
            </div>
            <StatusBadge status="online" size="sm" />
          </div>
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div className="flex-1">
              <div className="text-sm font-medium">Production line vibration detected</div>
              <div className="text-xs text-muted-foreground">Equipment · In Progress · 2024-12-10</div>
            </div>
            <StatusBadge status="maintenance" size="sm" />
          </div>
        </div>
      </div>

      {/* Comments & Notes */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Comments & Notes</h3>
        <div className="space-y-3">
          <div className="p-3 border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Tech Lead Wilson</span>
              <span className="text-xs text-muted-foreground">2024-12-16 15:30</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Belt wear is more extensive than initially thought. Recommend replacing entire belt assembly
              rather than just tensioning. This will prevent similar issues in the near future.
            </div>
          </div>
          <div className="p-3 border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Supervisor Johnson</span>
              <span className="text-xs text-muted-foreground">2024-12-16 14:50</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Production impact is significant. Prioritizing this issue for immediate resolution.
              Coordinating with procurement for replacement parts.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}