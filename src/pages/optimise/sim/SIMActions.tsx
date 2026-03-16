import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useSectorContentFilter } from "@/hooks/use-sector-switching";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard, StatusBadge, DataTable, TableConfigs, EmptyStates, ListItemVariants, SearchFilterSort } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckSquare,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Plus,
  Download,
  Sparkles,
  User,
  Calendar,
  Target,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDataProvider } from "@/hooks/useDataProvider";
import { useQuery } from "@tanstack/react-query";
import { SimAction } from "@/types/optimise";

export function SIMActions() {
  const { currentTenant, selectedAsset, setSelectedAsset, setIsPopPaneOpen, setPopPaneContent } = useApp();
  const { provider } = useDataProvider();
  const [searchQuery, setSearchQuery] = useState("");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("dueDate");

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

  const selectedAction = selectedAsset as unknown as SimAction | null;

  // Fetch actions data
  const {
    data: actions = [],
    isLoading: actionsLoading,
    error: actionsError,
  } = useQuery({
    queryKey: ['sim-actions', currentTenant?.id, siteFilter, statusFilter],
    queryFn: () => provider.listSimActions(currentTenant?.id!, {
      siteId: (siteFilter && siteFilter !== "all") ? siteFilter : undefined,
      status: (statusFilter && statusFilter !== "all") ? statusFilter : undefined,
    }),
    enabled: !!currentTenant?.id,
  });

  // Filter and sort actions based on search query
  const filteredActions = useMemo(() => {
    let actionList = filterItems(actions);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      actionList = actionList.filter(
        (action) =>
          (action.title && action.title.toLowerCase().includes(query)) ||
          (action.category && action.category.toLowerCase().includes(query)) ||
          (action.assignee && action.assignee.toLowerCase().includes(query)) ||
          (action.description && action.description.toLowerCase().includes(query)) ||
          (action.actionRef && action.actionRef.toLowerCase().includes(query)) ||
          (action.owner && action.owner.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    const sorted = [...actionList];
    switch (sortBy) {
      case "dueDate":
        return sorted.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
      case "status":
        return sorted.sort((a, b) => a.status.localeCompare(b.status));
      default:
        return sorted;
    }
  }, [actions, searchQuery, sortBy, filterItems]);


  const stats = useMemo(() => {
    const pendingCount = filteredActions.filter(a => a.status === "pending").length;
    const inProgressCount = filteredActions.filter(a => a.status === "in-progress").length;
    const completedCount = filteredActions.filter(a => a.status === "completed").length;
    const totalActions = filteredActions.length;
    // Overdue logic simplified for now
    const overdueCount = filteredActions.filter(a => a.status !== "completed" && a.dueDate && new Date(a.dueDate) < new Date()).length;
    return { pendingCount, inProgressCount, completedCount, overdueCount, totalActions };
  }, [filteredActions]);

  const openAIAssist = () => {
    setPopPaneContent({ type: null, data: null });
    setIsPopPaneOpen(true);
  };

  const openCreateModal = () => {
    setPopPaneContent({
      type: 'sim-issue',
      data: {
        modalType: 'sim-issue',
        sector: 'Oil & Gas',
        subsector: 'Upstream',
        title: 'Create New Action',
        fields: [
          { name: 'title', label: 'Action Title', type: 'text', required: true, placeholder: 'Enter action title' },
          { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe the action to be taken' },
          { name: 'priority', label: 'Priority', type: 'select', options: ['high', 'medium', 'low'], required: true },
          { name: 'assignee', label: 'Assignee', type: 'text', required: true, placeholder: 'Assign to team member' },
          { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
          { name: 'category', label: 'Category', type: 'select', options: ['Maintenance', 'Calibration', 'Training', 'Safety'], required: true }
        ]
      }
    });
    setIsPopPaneOpen(true);
  };

  const tabs = selectedAction
    ? [
      {
        id: "details",
        label: "Details",
        content: <ActionDetailsTab action={selectedAction} />,
      },
      {
        id: "progress",
        label: "Progress",
        content: <ActionProgressTab action={selectedAction} />,
      },
      {
        id: "resources",
        label: "Resources",
        content: <ActionResourcesTab action={selectedAction} />,
      },
      {
        id: "completion",
        label: "Completion",
        content: <ActionCompletionTab action={selectedAction} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Actions Overview",
        content: <ActionsOverview stats={stats} actions={filteredActions} onCreateAction={openCreateModal} />,
      },
    ];

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane
        title="Actions"
        subtitle={currentTenant.name}
        count={filteredActions.length}
        showFilters={false}
        isLoading={actionsLoading}
        actions={
          <Button size="sm" className="gap-2 w-full" onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            Create Action
          </Button>
        }
      >
        <div className="px-2 pb-2">
          <SearchFilterSort
            searchPlaceholder="Search actions..."
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
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
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
                    <SelectItem value="dueDate">Due Date (Soonest First)</SelectItem>
                    <SelectItem value="priority">Priority (High to Low)</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
          />
        </div>

        {filteredActions.map((action) => (
          <ListItemVariants.Action
            key={action.id}
            action={action}
            isSelected={selectedAction?.id === action.id}
            onClick={() => setSelectedAsset(action as unknown as any)}
          />
        ))}
      </ListPane>

      <WorkPane
        key={selectedAction ? `action-${selectedAction.id}` : 'actions-overview'}
        title={selectedAction ? selectedAction.title : "Actions"}
        subtitle={selectedAction ? `${selectedAction.category} · ${selectedAction.priority} priority` : `${filteredActions.length} actions`}
        tabs={tabs}
        defaultTab={selectedAction ? "details" : "overview"}
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



function ActionsOverview({
  stats,
  actions,
  onCreateAction,
}: {
  stats: { pendingCount: number; inProgressCount: number; completedCount: number; overdueCount: number; totalActions: number };
  actions: SIMAction[];
  onCreateAction: () => void;
}) {
  const recentActions = actions
    .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
    .slice(0, 5);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed": return "online";
      case "in-progress": return "maintenance";
      case "pending": return "offline";
      case "overdue": return "offline";
      default: return "offline";
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Actions"
          value={stats.totalActions.toString()}
          subtitle="All assigned actions"
          icon={CheckSquare}
          variant="primary"
        />
        <KPICard
          title="Pending"
          value={stats.pendingCount.toString()}
          subtitle="Not started"
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="In Progress"
          value={stats.inProgressCount.toString()}
          subtitle="Being worked on"
          icon={TrendingUp}
          variant="default"
        />
        <KPICard
          title="Completed"
          value={stats.completedCount.toString()}
          subtitle="Finished"
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* Overdue Actions Alert */}
      {stats.overdueCount > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-destructive" />
            <h3 className="text-sm font-semibold text-destructive">Overdue Actions</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {stats.overdueCount} action{stats.overdueCount > 1 ? 's are' : ' is'} overdue and require immediate attention.
          </p>
        </div>
      )}

      {/* Recent Actions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Recent Actions</h3>
          <Button size="sm" className="gap-2" onClick={onCreateAction}>
            <Plus className="w-4 h-4" />
            Create Action
          </Button>
        </div>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="data-table">
            <thead className="bg-secondary/30">
              <tr>
                <th>Action</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assignee</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {recentActions.map((action) => (
                <tr key={action.id} className="cursor-pointer">
                  <td className="font-medium">{action.actionRef}</td>
                  <td className="text-muted-foreground">{action.description.substring(0, 50)}...</td>
                  <td>
                    <StatusBadge
                      status="maintenance"
                      size="sm"
                    />
                  </td>
                  <td>
                    <StatusBadge
                      status={getStatusVariant(action.status)}
                      size="sm"
                    />
                  </td>
                  <td className="text-muted-foreground">{action.owner}</td>
                  <td className={cn(
                    "text-muted-foreground",
                    (action.dueDate && new Date(action.dueDate) < new Date()) && "text-destructive font-medium"
                  )}>
                    {action.dueDate ? new Date(action.dueDate).toLocaleDateString() : 'N/A'}
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

function ActionDetailsTab({ action }: { action: SIMAction }) {
  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <CheckSquare className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">{action.actionRef}</h3>
              <StatusBadge status={action.status === "completed" ? "online" : action.status === "in-progress" ? "maintenance" : "offline"} />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>SIM Action</span>
              <span>·</span>
              <span className="capitalize">Medium Priority</span>
              <span>·</span>
              <span>Created {new Date(action.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Information */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Action Description
          </h4>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              {action.description}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Assignment & Timeline
          </h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Assigned to</span>
              <span className="text-sm font-medium">{action.owner}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Due Date</span>
              <span className="text-sm font-medium">{action.dueDate ? new Date(action.dueDate).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estimated Hours</span>
              <span className="text-sm font-medium">4h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="text-sm font-medium capitalize">{action.status.replace('-', ' ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Criteria */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Success Criteria</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span className="text-sm">Equipment operates within specified parameters</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span className="text-sm">No safety incidents during execution</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span className="text-sm">Documentation updated and verified</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span className="text-sm">Quality checks passed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionProgressTab({ action }: { action: SIMAction }) {
  const progressPercentage = action.completedHours ? (action.completedHours / action.estimatedHours) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard
          title="Progress"
          value={action.status === 'completed' ? '100%' : action.status === 'in-progress' ? '50%' : '0%'}
          subtitle="Completion rate"
          icon={Target}
          variant="primary"
        />
        <KPICard
          title="Hours Spent"
          value={action.status === 'completed' ? '4' : action.status === 'in-progress' ? '2' : '0'}
          subtitle={`of 4 estimated`}
          icon={Clock}
          variant="default"
        />
        <KPICard
          title="Days Remaining"
          value={action.dueDate ? Math.max(0, Math.ceil((new Date(action.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))).toString() : '0'}
          subtitle="Until due date"
          icon={Calendar}
          variant={action.status === "completed" ? "default" : (action.dueDate && new Date(action.dueDate) < new Date() ? "destructive" : "default")}
        />
      </div>

      {/* Progress Timeline */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Progress Timeline</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-success/10 border border-success/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-success" />
            <div className="flex-1">
              <div className="text-sm font-medium">Action Created</div>
              <div className="text-xs text-muted-foreground">Initial action item logged and assigned</div>
            </div>
            <div className="text-xs text-muted-foreground">{new Date(action.createdAt).toLocaleDateString()}</div>
          </div>

          {action.status !== "pending" && (
            <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <div className="text-sm font-medium">Work Started</div>
                <div className="text-xs text-muted-foreground">Action work has begun</div>
              </div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
          )}

          {action.status === "completed" && (
            <div className="flex items-center gap-3 p-3 bg-success/10 border border-success/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-success" />
              <div className="flex-1">
                <div className="text-sm font-medium">Action Completed</div>
                <div className="text-xs text-muted-foreground">All requirements met and verified</div>
              </div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          )}
        </div>
      </div>

      {/* Milestone Tracking */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Milestone Tracking</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-sm">Initial assessment completed</span>
            </div>
            <span className="text-xs text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-warning" />
              <span className="text-sm">Equipment preparation</span>
            </div>
            <span className="text-xs text-muted-foreground">In Progress</span>
          </div>
          <div className="flex items-center justify-between p-3 border border-border rounded-lg opacity-50">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Implementation</span>
            </div>
            <span className="text-xs text-muted-foreground">Pending</span>
          </div>
          <div className="flex items-center justify-between p-3 border border-border rounded-lg opacity-50">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Verification & testing</span>
            </div>
            <span className="text-xs text-muted-foreground">Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionResourcesTab({ action }: { action: SIMAction }) {
  const mockResources = [
    { type: "Personnel", name: "Maintenance Technician", status: "assigned", availability: "Available" },
    { type: "Equipment", name: "Tension Gauge", status: "reserved", availability: "Available" },
    { type: "Parts", name: "Conveyor Belt", status: "ordered", availability: "Delivery: Dec 17" },
    { type: "Documentation", name: "Maintenance Manual", status: "available", availability: "Accessible" }
  ];

  return (
    <div className="space-y-6">
      {/* Resource Summary */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Personnel"
          value="1"
          subtitle="Assigned"
          icon={User}
          variant="success"
        />
        <KPICard
          title="Equipment"
          value="2"
          subtitle="Reserved"
          icon={Target}
          variant="success"
        />
        <KPICard
          title="Parts"
          value="1"
          subtitle="On order"
          icon={CheckSquare}
          variant="warning"
        />
        <KPICard
          title="Documents"
          value="3"
          subtitle="Available"
          icon={FileText}
          variant="success"
        />
      </div>

      {/* Required Resources */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Required Resources</h3>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="data-table">
            <thead className="bg-secondary/30">
              <tr>
                <th>Type</th>
                <th>Resource</th>
                <th>Status</th>
                <th>Availability</th>
              </tr>
            </thead>
            <tbody>
              {mockResources.map((resource, index) => (
                <tr key={index} className="cursor-pointer">
                  <td className="text-muted-foreground">{resource.type}</td>
                  <td className="font-medium">{resource.name}</td>
                  <td>
                    <StatusBadge
                      status={resource.status === "assigned" || resource.status === "available" ? "online" : resource.status === "reserved" ? "maintenance" : "offline"}
                      size="sm"
                    />
                  </td>
                  <td className="text-muted-foreground">{resource.availability}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resource Assignments */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Resource Assignments</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-primary" />
              <div>
                <div className="text-sm font-medium">{action.assignee}</div>
                <div className="text-xs text-muted-foreground">Primary Assignee</div>
              </div>
            </div>
            <StatusBadge status="online" size="sm" />
          </div>
          <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-primary" />
              <div>
                <div className="text-sm font-medium">Maintenance Supervisor</div>
                <div className="text-xs text-muted-foreground">Support Role</div>
              </div>
            </div>
            <StatusBadge status="maintenance" size="sm" />
          </div>
        </div>
      </div>

      {/* Resource Availability Status */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Availability Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Available Now</h4>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-success" />
                <span>Maintenance Technician</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-success" />
                <span>Tension Gauge</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-success" />
                <span>Maintenance Manual</span>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Pending</h4>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-warning" />
                <span>Conveyor Belt (Dec 17)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionCompletionTab({ action }: { action: SIMAction }) {
  return (
    <div className="space-y-6">
      {/* Completion Status */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Completion Status</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Completion Checklist</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-sm">Safety procedures followed</span>
              </div>
              <div className="flex items-center gap-2">
                {action.status === "completed" ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : (
                  <Clock className="w-4 h-4 text-warning" />
                )}
                <span className="text-sm">Work completed as specified</span>
              </div>
              <div className="flex items-center gap-2">
                {action.status === "completed" ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : (
                  <div className="w-4 h-4 rounded border border-border"></div>
                )}
                <span className="text-sm">Quality verification passed</span>
              </div>
              <div className="flex items-center gap-2">
                {action.status === "completed" ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : (
                  <div className="w-4 h-4 rounded border border-border"></div>
                )}
                <span className="text-sm">Documentation updated</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Verification</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed by:</span>
                <span>{action.status === "completed" ? action.assignee : "Pending"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verified by:</span>
                <span>{action.status === "completed" ? "Supervisor Johnson" : "Pending"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completion date:</span>
                <span>{action.status === "completed" ? action.dueDate : "Pending"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Outcomes */}
      {action.status === "completed" && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Outcomes</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Results Achieved</h4>
              <p className="text-sm text-muted-foreground">
                Conveyor belt tension successfully adjusted to optimal specifications. Equipment now operates
                smoothly without slippage. Production efficiency improved by 3.2% following the adjustment.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Performance Impact</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-success/10 border border-success/20 rounded-lg">
                  <div className="text-lg font-bold text-success">+3.2%</div>
                  <div className="text-xs text-muted-foreground">Efficiency Gain</div>
                </div>
                <div className="text-center p-3 bg-success/10 border border-success/20 rounded-lg">
                  <div className="text-lg font-bold text-success">0</div>
                  <div className="text-xs text-muted-foreground">Safety Incidents</div>
                </div>
                <div className="text-center p-3 bg-success/10 border border-success/20 rounded-lg">
                  <div className="text-lg font-bold text-success">100%</div>
                  <div className="text-xs text-muted-foreground">Quality Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lessons Learned */}
      {action.status === "completed" && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Lessons Learned</h3>
          <div className="space-y-3">
            <div className="p-3 border border-border rounded-lg">
              <h4 className="text-sm font-semibold mb-1">What Went Well</h4>
              <p className="text-sm text-muted-foreground">
                Clear communication between shifts ensured smooth handover. Having the right tools
                available reduced completion time by 30 minutes.
              </p>
            </div>
            <div className="p-3 border border-border rounded-lg">
              <h4 className="text-sm font-semibold mb-1">Areas for Improvement</h4>
              <p className="text-sm text-muted-foreground">
                Initial assessment could have been more thorough to identify the full scope of adjustment needed.
                Consider implementing preventive maintenance schedule to avoid future issues.
              </p>
            </div>
            <div className="p-3 border border-border rounded-lg">
              <h4 className="text-sm font-semibold mb-1">Recommendations</h4>
              <p className="text-sm text-muted-foreground">
                Update maintenance procedures to include weekly tension checks. Train additional operators
                on basic tension adjustment procedures for minor corrections.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}