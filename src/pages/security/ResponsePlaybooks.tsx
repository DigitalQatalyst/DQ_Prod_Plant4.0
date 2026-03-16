import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  FileText,
  Clock,
  Users,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  GitBranch,
  Target,
  Calendar,
  User,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Settings,
  Eye,
} from "lucide-react";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { ThreatsDistributionChart } from "@/components/security/ThreatsDistributionChart";
import { ThreatsTopList } from "@/components/security/ThreatsTopList";
import {
  getResponsePlaybooks,
  getPlaybookSteps,
  getPlaybookExecutions
} from "@/lib/threatMonitoringQueries";
import type {
  ResponsePlaybook,
  PlaybookStep,
  PlaybookExecution,
  PlaybookStatus,
  ExecutionStatus
} from "@/types/security";

export function ResponsePlaybooks() {
  const { currentTenant } = useApp();

  // State management
  const [playbooks, setPlaybooks] = useState<ResponsePlaybook[]>([]);
  const [executions, setExecutions] = useState<PlaybookExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [triggerTypeFilter, setTriggerTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("category");

  // Load playbooks and executions
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [playbooksData, executionsData] = await Promise.all([
          getResponsePlaybooks(currentTenant.id),
          getPlaybookExecutions(currentTenant.id, { limit: 50 })
        ]);
        setPlaybooks(playbooksData);
        setExecutions(executionsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load playbooks');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentTenant.id]);

  // Filter and sort playbooks
  const filteredAndSortedPlaybooks = useMemo(() => {
    let result = playbooks.filter((playbook) => {
      const matchesSearch =
        (playbook.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (playbook.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (playbook.category || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || playbook.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || playbook.category === categoryFilter;
      const matchesTrigger = triggerTypeFilter === "all" || playbook.triggerType === triggerTypeFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesTrigger;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'category': {
          const categoryOrder = {
            'grid-isolation': 0,
            'load-shedding': 1,
            'protection-coordination': 2,
            'communication-restoration': 3,
            'system-recovery': 4,
            'emergency-response': 5,
            'switching-manipulation': 6,
            'relay-tampering': 7,
            'scada-compromise': 8,
            'protocol-abuse': 9
          };
          const categoryDiff = (categoryOrder[a.category as keyof typeof categoryOrder] || 999) -
            (categoryOrder[b.category as keyof typeof categoryOrder] || 999);
          if (categoryDiff !== 0) return categoryDiff;
          return (a.name || '').localeCompare(b.name || '');
        }
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'trigger':
          return (a.triggerType || '').localeCompare(b.triggerType || '');
        case 'executions':
          return (b.executionCount || 0) - (a.executionCount || 0);
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [playbooks, searchTerm, statusFilter, categoryFilter, triggerTypeFilter, sortBy]);

  const selectedPlaybook = playbooks.find((p) => p.id === selectedPlaybookId);

  // Helper functions
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "grid-isolation":
      case "emergency-response":
        return "bg-destructive/10 text-destructive";
      case "load-shedding":
      case "switching-manipulation":
        return "bg-warning/10 text-warning";
      case "protection-coordination":
      case "relay-tampering":
        return "bg-primary/10 text-primary";
      case "communication-restoration":
      case "scada-compromise":
        return "bg-primary/10 text-primary";
      case "system-recovery":
        return "bg-success/10 text-success";
      case "protocol-abuse":
        return "bg-secondary/10 text-secondary-foreground";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "grid-isolation":
      case "emergency-response":
        return Shield;
      case "load-shedding":
      case "switching-manipulation":
        return Target;
      case "protection-coordination":
      case "relay-tampering":
        return Activity;
      case "communication-restoration":
      case "scada-compromise":
        return Activity;
      case "system-recovery":
        return CheckCircle2;
      case "protocol-abuse":
        return Zap;
      default:
        return FileText;
    }
  };

  const formatCategoryName = (category: string) => {
    return category.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return <LoadingState loadingText="Loading response playbooks..." />;
  }

  if (error) {
    return <EmptyState
      title="Error Loading Playbooks"
      description={error}
      icon={AlertTriangle}
    />;
  }

  const tabs = selectedPlaybook
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <PlaybookOverview playbook={selectedPlaybook} executions={executions} />,
      },
      {
        id: "steps",
        label: "Response Steps",
        content: <PlaybookSteps playbook={selectedPlaybook} />,
      },
      {
        id: "execution",
        label: "Execution & Tracking",
        content: <PlaybookExecution playbook={selectedPlaybook} executions={executions} />,
      },
      {
        id: "decision-tree",
        label: "Decision Tree",
        content: <PlaybookDecisionTree playbook={selectedPlaybook} />,
      },
      {
        id: "escalation",
        label: "Escalation",
        content: <PlaybookEscalation playbook={selectedPlaybook} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Overview",
        content: (
          <IdentityOverview
            title="Response Playbooks Overview"
            description="Automated and semi-automated response procedures for security incidents and operational anomalies in transmission systems."
            metrics={[
              {
                title: "Total Playbooks",
                value: playbooks.length,
                icon: FileText,
                variant: "primary" as const
              },
              {
                title: "Active Playbooks",
                value: playbooks.filter(p => p.status === 'active').length,
                icon: Play,
                variant: "success" as const
              },
              {
                title: "Recent Executions",
                value: executions.filter(e => new Date(e.startedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length,
                icon: Activity,
                variant: "warning" as const
              },
              {
                title: "Success Rate",
                value: `${Math.round((executions.filter(e => e.executionStatus === 'completed').length / Math.max(executions.length, 1)) * 100)}%`,
                icon: CheckCircle2,
                variant: "default" as const
              }
            ]}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
              <ThreatsDistributionChart
                title="Playbooks by Category"
                icon={Shield}
                data={[
                  { name: 'Grid Isolation', value: playbooks.filter(p => p.category === 'grid-isolation').length, color: 'hsl(var(--destructive))' },
                  { name: 'Load Shedding', value: playbooks.filter(p => p.category === 'load-shedding').length, color: 'hsl(var(--warning))' },
                  { name: 'Protection', value: playbooks.filter(p => p.category === 'protection-coordination').length, color: 'hsl(var(--primary))' },
                  { name: 'Communication', value: playbooks.filter(p => p.category === 'communication-restoration').length, color: 'hsl(var(--secondary))' },
                  { name: 'Recovery', value: playbooks.filter(p => p.category === 'system-recovery').length, color: 'hsl(var(--success))' },
                ].filter(d => d.value > 0)}
                centerText={playbooks.length.toString()}
              />
              <ThreatsTopList
                title="Most Executed Playbooks"
                icon={Zap}
                items={playbooks
                  .map(p => ({
                    id: p.id,
                    title: p.name,
                    value: executions.filter(e => e.playbookId === p.id).length,
                    icon: getCategoryIcon(p.category),
                    variant: 'default' as const
                  }))
                  .sort((a, b) => (b.value as number) - (a.value as number))
                  .slice(0, 5)}
                onItemClick={(id) => setSelectedPlaybookId(id)}
                emptyMessage="No playbook executions yet"
              />
            </div>
          </IdentityOverview>
        ),
      }
    ];



  return (
    <>
      <ListPane
        title="Playbooks Library"
        context="DEWA – Transmission"
        count={filteredAndSortedPlaybooks.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "all", label: "All Statuses" },
              { value: "active", label: "Active" },
              { value: "draft", label: "Draft" },
              { value: "under-review", label: "Under Review" },
              { value: "archived", label: "Archived" },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
          {
            key: "category",
            label: "Category",
            options: [
              { value: "all", label: "All Categories" },
              { value: "grid-isolation", label: "Grid Isolation" },
              { value: "load-shedding", label: "Load Shedding" },
              { value: "protection-coordination", label: "Protection Coordination" },
              { value: "communication-restoration", label: "Communication Restoration" },
              { value: "system-recovery", label: "System Recovery" },
              { value: "emergency-response", label: "Emergency Response" },
              { value: "switching-manipulation", label: "Switching Manipulation" },
              { value: "relay-tampering", label: "Relay Tampering" },
              { value: "scada-compromise", label: "SCADA Compromise" },
              { value: "protocol-abuse", label: "Protocol Abuse" },
            ],
            value: categoryFilter,
            onChange: setCategoryFilter,
          },
          {
            key: "trigger",
            label: "TriggerType",
            options: [
              { value: "all", label: "All Trigger Types" },
              { value: "security-incident", label: "Security Incident" },
              { value: "system-anomaly", label: "System Anomaly" },
              { value: "equipment-failure", label: "Equipment Failure" },
              { value: "cyber-attack", label: "Cyber Attack" },
              { value: "manual-activation", label: "Manual Activation" },
            ],
            value: triggerTypeFilter,
            onChange: setTriggerTypeFilter,
          },
        ]}
        sortOptions={[
          { label: 'Category', value: 'category' },
          { label: 'Name', value: 'name' },
          { label: 'Trigger Type', value: 'trigger' },
          { label: 'Execution Count', value: 'executions' },
          { label: 'Last Updated', value: 'updated' },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedPlaybooks.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No Playbooks Found"
              description="No response playbooks match your current filters"
            />
          ) : (
            filteredAndSortedPlaybooks.map((playbook) => (
              <ListPaneItem
                key={playbook.id}
                title={playbook.name}
                description={playbook.description}
                status={playbook.status === 'active' ? 'online' : (playbook.status === 'inactive' ? 'offline' : 'maintenance')}
                category={playbook.category?.toUpperCase().replace('-', ' ')}
                value={`${playbook.executionCount}`}
                isSelected={selectedPlaybookId === playbook.id}
                onClick={() => setSelectedPlaybookId(playbook.id)}
              />
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedPlaybook ? selectedPlaybook.name : "Response Playbooks"}
        subtitle={selectedPlaybook ? formatCategoryName(selectedPlaybook.category || '') : "Overview"}
        tabs={tabs}
      />
    </>
  );
}

function PlaybookOverview({ playbook, executions }: {
  playbook: ResponsePlaybook;
  executions: PlaybookExecution[];
}) {
  const isCritical = playbook.category === 'grid-isolation' ||
    playbook.category === 'emergency-response' ||
    playbook.category === 'switching-manipulation' ||
    playbook.category === 'relay-tampering';

  const recentExecutions = executions
    .filter(exec => exec.playbookId === playbook.id)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Playbook Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isCritical ? "bg-destructive/10" : "bg-primary/10"
            }`}>
            <FileText className={`w-6 h-6 ${isCritical ? "text-destructive" : "text-primary"
              }`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{playbook.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{playbook.description}</p>
            <div className="flex items-center gap-4 mt-4">
              <span className={`text-xs px-3 py-1 rounded-full ${isCritical
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary"
                }`}>
                {playbook.category?.split('-').map(word =>
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {playbook.status}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="w-3 h-3" />
                {playbook.triggerType?.replace('-', ' ')}
              </span>
              {playbook.autoExecute && (
                <span className="text-xs px-2 py-1 rounded bg-warning/10 text-warning">
                  Auto-Execute
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Playbook Information */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Playbook Information</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-center gap-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Last Updated</p>
              <p className="text-sm font-medium">
                {new Date(playbook.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <User className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Created By</p>
              <p className="text-sm font-medium">{playbook.createdBy || 'System'}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="text-sm font-medium">
                {playbook.category?.split('-').map(word =>
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </p>
            </div>
          </div>
          {playbook.estimatedDurationMinutes && (
            <div className="p-4 flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Estimated Duration</p>
                <p className="text-sm font-medium">{playbook.estimatedDurationMinutes} minutes</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Execution Statistics */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Execution Statistics</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Executions</p>
            <p className="text-2xl font-bold">{playbook.executionCount}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
            <p className="text-2xl font-bold text-success">
              {playbook.successRate ? `${Math.round(playbook.successRate)}%` : 'N/A'}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Last Executed</p>
            <p className="text-sm font-medium">
              {playbook.lastExecuted
                ? new Date(playbook.lastExecuted).toLocaleDateString()
                : 'Never'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Recent Executions */}
      {recentExecutions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Recent Executions</h4>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {recentExecutions.map((execution) => (
              <div key={execution.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${execution.executionStatus === 'completed' ? 'bg-success' :
                    execution.executionStatus === 'failed' ? 'bg-destructive' :
                      execution.executionStatus === 'running' ? 'bg-warning' :
                        'bg-secondary'
                    }`} />
                  <div>
                    <p className="text-sm font-medium">
                      {execution.triggeredBy === 'manual' ? 'Manual Execution' :
                        execution.triggeredBy === 'alert' ? 'Alert Triggered' :
                          execution.triggeredBy === 'incident' ? 'Incident Response' :
                            'Automated Execution'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(execution.startedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${execution.executionStatus === 'completed' ? 'bg-success/10 text-success' :
                  execution.executionStatus === 'failed' ? 'bg-destructive/10 text-destructive' :
                    execution.executionStatus === 'running' ? 'bg-warning/10 text-warning' :
                      'bg-secondary text-muted-foreground'
                  }`}>
                  {execution.executionStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Applicable Trigger Types */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Trigger Information</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Trigger Type</span>
              <span className="text-sm font-medium">
                {playbook.triggerType?.split('-').map(word =>
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ') || 'Manual'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Auto Execute</span>
              <span className="text-sm font-medium">
                {playbook.autoExecute ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="text-sm font-medium">{playbook.status}</span>
            </div>
            {playbook.requiredRoles && playbook.requiredRoles.length > 0 && (
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Required Roles</span>
                <div className="text-right">
                  {playbook.requiredRoles.map((role, index) => (
                    <span key={index} className="text-sm font-medium block">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transmission-Specific Context */}
      {(playbook.applicableAssetTypes || playbook.applicableProtocols) && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Transmission Context</h4>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="space-y-3">
              {playbook.applicableAssetTypes && playbook.applicableAssetTypes.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Applicable Asset Types</p>
                  <div className="flex flex-wrap gap-1">
                    {playbook.applicableAssetTypes.map((assetType, index) => (
                      <span key={index} className="text-xs px-2 py-1 rounded bg-secondary text-muted-foreground">
                        {assetType}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {playbook.applicableProtocols && playbook.applicableProtocols.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Applicable Protocols</p>
                  <div className="flex flex-wrap gap-1">
                    {playbook.applicableProtocols.map((protocol, index) => (
                      <span key={index} className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                        {protocol}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Critical Playbook Warning */}
      {isCritical && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-destructive mb-2">Critical Response Playbook</h4>
              <p className="text-sm text-destructive/80">
                This playbook involves critical transmission system operations. Ensure proper authorization
                and coordination with operations personnel before executing any steps. Consider grid stability
                and customer impact before proceeding.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlaybookExecution({ playbook, executions }: {
  playbook: ResponsePlaybook;
  executions: PlaybookExecution[];
}) {
  const playbookExecutions = executions.filter(exec => exec.playbookId === playbook.id);

  const getExecutionStatusColor = (status: ExecutionStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success';
      case 'failed':
        return 'bg-destructive/10 text-destructive';
      case 'running':
        return 'bg-warning/10 text-warning';
      case 'cancelled':
        return 'bg-secondary text-muted-foreground';
      default:
        return 'bg-secondary text-muted-foreground';
    }
  };

  const getExecutionIcon = (status: ExecutionStatus) => {
    switch (status) {
      case 'completed':
        return CheckCircle2;
      case 'failed':
        return AlertTriangle;
      case 'running':
        return Play;
      case 'cancelled':
        return RotateCcw;
      default:
        return Activity;
    }
  };

  return (
    <div className="space-y-6">
      {/* Execution Controls */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold">Playbook Execution</h4>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-1">
              <Play className="w-3 h-3" />
              Execute Playbook
            </button>
            <button className="px-3 py-1.5 text-xs border border-border rounded hover:bg-secondary flex items-center gap-1">
              <Eye className="w-3 h-3" />
              Simulate
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Executions</p>
            <p className="text-lg font-bold">{playbook.executionCount}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
            <p className="text-lg font-bold text-success">
              {playbook.successRate ? `${Math.round(playbook.successRate)}%` : 'N/A'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Avg Duration</p>
            <p className="text-lg font-bold">
              {playbook.estimatedDurationMinutes ? `${playbook.estimatedDurationMinutes}m` : 'N/A'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Last Executed</p>
            <p className="text-sm font-medium">
              {playbook.lastExecuted
                ? new Date(playbook.lastExecuted).toLocaleDateString()
                : 'Never'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Execution History */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Execution History ({playbookExecutions.length})
        </h4>

        {playbookExecutions.length > 0 ? (
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {playbookExecutions.map((execution) => {
              const StatusIcon = getExecutionIcon(execution.executionStatus);
              const duration = execution.completedAt
                ? Math.round((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 60000)
                : null;

              return (
                <div key={execution.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getExecutionStatusColor(execution.executionStatus)}`}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h5 className="text-sm font-medium">
                            {execution.triggeredBy === 'manual' ? 'Manual Execution' :
                              execution.triggeredBy === 'alert' ? 'Alert-Triggered Execution' :
                                execution.triggeredBy === 'incident' ? 'Incident Response Execution' :
                                  execution.triggeredBy === 'anomaly' ? 'Anomaly-Triggered Execution' :
                                    'Automated Execution'}
                          </h5>
                          <p className="text-xs text-muted-foreground">
                            Started: {new Date(execution.startedAt).toLocaleString()}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${getExecutionStatusColor(execution.executionStatus)}`}>
                          {execution.executionStatus}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {execution.executedBy && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {execution.executedBy}
                          </span>
                        )}
                        {duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {duration} minutes
                          </span>
                        )}
                        {execution.triggerSourceId && (
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            Trigger: {execution.triggerSourceId.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No executions recorded for this playbook yet.
            </p>
          </div>
        )}
      </div>

      {/* Execution Guidelines */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Execution Guidelines</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
              <div>
                <p className="text-sm font-medium">Pre-Execution Checklist</p>
                <p className="text-xs text-muted-foreground">
                  Verify prerequisites, confirm authorization, and ensure required personnel are available
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Required Roles</p>
                <p className="text-xs text-muted-foreground">
                  {playbook.requiredRoles?.join(', ') || 'Operations personnel, Security analyst'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
              <div>
                <p className="text-sm font-medium">Safety Considerations</p>
                <p className="text-xs text-muted-foreground">
                  Consider grid stability, customer impact, and safety systems before execution
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaybookSteps({ playbook }: { playbook: ResponsePlaybook }) {
  const [steps, setSteps] = useState<PlaybookStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSteps = async () => {
      try {
        const stepData = await getPlaybookSteps(playbook.tenantId, playbook.id);
        setSteps(stepData);
      } catch (err) {
        console.error('Failed to load steps:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSteps();
  }, [playbook.id, playbook.tenantId]);

  if (loading) {
    return <LoadingState loadingText="Loading playbook steps..." />;
  }
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          Response Steps ({steps.length})
        </h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {steps.map((step, index) => (
            <div key={step.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step.stepType === 'decision-point'
                  ? "bg-warning/10 text-warning border-2 border-warning/20"
                  : step.stepType === 'automated-action'
                    ? "bg-primary/10 text-primary border-2 border-primary/20"
                    : "bg-secondary/10 text-secondary-foreground"
                  }`}>
                  {step.stepNumber}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-medium">{step.name}</h5>
                      {step.stepType === 'decision-point' && (
                        <GitBranch className="w-4 h-4 text-warning" />
                      )}
                      {step.stepType === 'automated-action' && (
                        <Zap className="w-4 h-4 text-primary" />
                      )}
                      {!step.isRequired && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                          Optional
                        </span>
                      )}
                    </div>
                    {step.timeoutMinutes && (
                      <span className="text-xs px-2 py-1 rounded bg-secondary text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {step.timeoutMinutes} min timeout
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mb-3">{step.description}</p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {step.assignedRole || 'Operations'}
                    </span>
                    {step.stepType === 'decision-point' && (
                      <span className="text-warning font-medium">Decision Point</span>
                    )}
                    {step.stepType === 'automated-action' && (
                      <span className="text-primary font-medium">Automated</span>
                    )}
                    {step.isParallel && (
                      <span className="text-primary font-medium">Parallel Execution</span>
                    )}
                  </div>

                  {step.instructions && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-2">Instructions:</p>
                      <p className="text-xs bg-secondary/30 rounded p-2">{step.instructions}</p>
                    </div>
                  )}

                  {step.checklistItems && step.checklistItems.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-2">Checklist Items:</p>
                      <div className="space-y-1">
                        {step.checklistItems.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3 text-success" />
                            <span className="text-xs">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {step.successCriteria && step.successCriteria.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-2">Success Criteria:</p>
                      <div className="space-y-1">
                        {step.successCriteria.map((criteria, criteriaIndex) => (
                          <div key={criteriaIndex} className="flex items-center gap-2">
                            <Target className="w-3 h-3 text-success" />
                            <span className="text-xs">{criteria}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className="ml-4 mt-3 mb-1">
                  <div className="w-px h-4 bg-border"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Summary */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Step Summary</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Steps</p>
            <p className="text-2xl font-bold">{steps.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Decision Points</p>
            <p className="text-2xl font-bold text-warning">
              {steps.filter(step => step.stepType === 'decision-point').length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Est. Duration</p>
            <p className="text-2xl font-bold text-primary">
              {steps.reduce((total, step) => total + (step.timeoutMinutes || 0), 0)} min
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaybookDecisionTree({ playbook }: { playbook: ResponsePlaybook }) {
  const [steps, setSteps] = useState<PlaybookStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSteps = async () => {
      try {
        const stepData = await getPlaybookSteps(playbook.tenantId, playbook.id);
        setSteps(stepData);
      } catch (err) {
        console.error('Failed to load steps:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSteps();
  }, [playbook.id, playbook.tenantId]);

  if (loading) {
    return <LoadingState loadingText="Loading decision tree..." />;
  }

  const decisionSteps = steps.filter(step => step.stepType === 'decision-point');

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-warning" />
          Decision Points ({decisionSteps.length})
        </h4>

        {decisionSteps.length > 0 ? (
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {decisionSteps.map((step) => (
              <div key={step.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-warning/10 text-warning border-2 border-warning/20 flex items-center justify-center text-xs font-bold">
                    {step.stepNumber}
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-medium mb-2">{step.name}</h5>
                    <p className="text-xs text-muted-foreground mb-3">{step.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {step.assignedRole || 'Operations'}
                      </span>
                      {step.timeoutMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {step.timeoutMinutes} min timeout
                        </span>
                      )}
                    </div>

                    {step.successCriteria && step.successCriteria.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Decision Criteria:</p>
                        {step.successCriteria.map((criteria, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
                            <ArrowRight className="w-4 h-4 text-warning mt-0.5" />
                            <div>
                              <p className="text-sm">{criteria}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Proceed to next applicable step based on this decision
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <GitBranch className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              This playbook has no decision points. All steps are executed sequentially.
            </p>
          </div>
        )}
      </div>

      {/* Decision Flow Guidance */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Decision Flow Guidance</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
              <div>
                <p className="text-sm font-medium">Sequential Steps</p>
                <p className="text-xs text-muted-foreground">
                  Execute steps without decision points in order
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <GitBranch className="w-4 h-4 text-warning mt-0.5" />
              <div>
                <p className="text-sm font-medium">Decision Points</p>
                <p className="text-xs text-muted-foreground">
                  Evaluate situation and choose appropriate path
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium">Escalation Triggers</p>
                <p className="text-xs text-muted-foreground">
                  When in doubt, escalate according to escalation procedures
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaybookEscalation({ playbook }: { playbook: ResponsePlaybook }) {
  return (
    <div className="space-y-6">
      {/* Escalation Procedure */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          Escalation Procedure
        </h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm leading-relaxed">{(playbook as any).escalationProcedure || 'Standard escalation procedures apply. Contact incident commander for guidance on escalation decisions.'}</p>
        </div>
      </div>

      {/* Escalation Triggers */}
      <div>
        <h4 className="text-sm font-semibold mb-3">When to Escalate</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
            <div>
              <p className="text-sm font-medium">Critical System Impact</p>
              <p className="text-xs text-muted-foreground mt-1">
                Any indication that critical transmission systems are compromised or grid stability is at risk
              </p>
            </div>
          </div>
          <div className="p-4 flex items-start gap-3">
            <Clock className="w-4 h-4 text-warning mt-0.5" />
            <div>
              <p className="text-sm font-medium">Time Constraints</p>
              <p className="text-xs text-muted-foreground mt-1">
                Unable to complete steps within specified time limits
              </p>
            </div>
          </div>
          <div className="p-4 flex items-start gap-3">
            <Activity className="w-4 h-4 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Technical Failures</p>
              <p className="text-xs text-muted-foreground mt-1">
                Systems or procedures fail to respond as expected
              </p>
            </div>
          </div>
          <div className="p-4 flex items-start gap-3">
            <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Resource Limitations</p>
              <p className="text-xs text-muted-foreground mt-1">
                Insufficient personnel or resources to execute the playbook
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Emergency Contacts</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Control Room Operator</p>
              <span className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive">
                PRIMARY
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              First point of escalation for all transmission system incidents
            </p>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">System Operations Manager</p>
              <span className="text-xs px-2 py-1 rounded bg-warning/10 text-warning">
                OPERATIONS
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Contact for all grid stability and operational decisions
            </p>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Transmission Manager</p>
              <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                TECHNICAL
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Technical expertise and system impact assessment
            </p>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Security Manager</p>
              <span className="text-xs px-2 py-1 rounded bg-secondary text-muted-foreground">
                SECURITY
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Cybersecurity expertise and threat assessment
            </p>
          </div>
        </div>
      </div>

      {/* Communication Guidelines */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Communication Guidelines</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
              <span>Use clear, concise language when reporting incidents</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
              <span>Include current status, actions taken, and next steps</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
              <span>Specify any safety concerns or immediate risks</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
              <span>Provide estimated time for resolution or next update</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
              <span>Document all communications for post-incident review</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}