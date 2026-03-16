import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Shield,
  UserX,
  MonitorX,
  Network,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Target,
  Activity,
  History,
  Settings,
  Lock,
  Unlock,
  Ban,
  Database,
  Zap,
  Eye,
  EyeOff,
  Power,
  Wifi,
  WifiOff,
  TrendingUp,
} from "lucide-react";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { ThreatsTopList } from "@/components/security/ThreatsTopList";
import {
  AnalysisMetric
} from "@/components/security/IdentityGovernanceMetrics";
import {
  getResponsePlaybooks,
  getPlaybookExecutions,
  getTransmissionSoarActions,
  getSoarActionExecutions,
  executeSoarAction
} from "@/lib/threatMonitoringQueries";
import type {
  ResponsePlaybook,
  PlaybookExecution,
  TransmissionSoarAction,
  SoarActionExecution,
  TransmissionSoarActionType,
  TransmissionSoarTargetType
} from "@/types/security";


function getSoarHeuristics(action: TransmissionSoarAction) {
  const isCritical = action.isCritical;

  return {
    executionLatency: isCritical ? "14.2s" : "4.8s",
    autoCorrectionYield: "98.2%",
    systemStress: isCritical ? "Elevated" : "Idle",
    reliabilityScore: isCritical ? "94%" : "99%"
  };
}

export function BasicSoarActions() {
  const { currentTenant } = useApp();

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [soarActions, setSoarActions] = useState<TransmissionSoarAction[]>([]);
  const [actionExecutions, setActionExecutions] = useState<SoarActionExecution[]>([]);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("criticality");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>("all");
  const [approvalFilter, setApprovalFilter] = useState<string>("all");

  // Load SOAR actions from Supabase
  useEffect(() => {
    const loadSoarActions = async () => {
      try {
        setLoading(true);
        setError(null);

        const actions = await getTransmissionSoarActions(currentTenant.id);
        setSoarActions(actions);
      } catch (err) {
        console.error('Error loading SOAR actions:', err);
        setError('Failed to load SOAR actions');
      } finally {
        setLoading(false);
      }
    };

    loadSoarActions();
  }, [currentTenant.id]);

  // Load executions for the selected action
  useEffect(() => {
    const loadExecutions = async () => {
      if (!selectedActionId) return;

      try {
        const executions = await getSoarActionExecutions(currentTenant.id, {
          actionId: selectedActionId,
          limit: 10
        });
        setActionExecutions(executions);
      } catch (err) {
        console.error('Error loading action executions:', err);
      }
    };

    loadExecutions();
  }, [currentTenant.id, selectedActionId]);

  // Filter and sort actions
  const filteredActions = useMemo(() => {
    let filtered = [...soarActions];

    // Apply search filter
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter((action) =>
        action.name.toLowerCase().includes(query) ||
        action.description.toLowerCase().includes(query) ||
        action.type.toLowerCase().includes(query) ||
        action.targetType.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((action) => action.type === typeFilter);
    }

    // Apply target type filter
    if (targetTypeFilter !== "all") {
      filtered = filtered.filter((action) => action.targetType === targetTypeFilter);
    }

    // Apply approval filter
    if (approvalFilter !== "all") {
      if (approvalFilter === "requires-approval") {
        filtered = filtered.filter((action) => action.requiresApproval);
      } else if (approvalFilter === "no-approval") {
        filtered = filtered.filter((action) => !action.requiresApproval);
      }
    }

    // Sort actions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'criticality':
          if (a.isCritical && !b.isCritical) return -1;
          if (!a.isCritical && b.isCritical) return 1;
          return a.name.localeCompare(b.name);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'executions':
          return (b.executionCount || 0) - (a.executionCount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [soarActions, typeFilter, targetTypeFilter, approvalFilter, searchTerm, sortBy]);

  const selectedAction = soarActions.find((a) => a.id === selectedActionId);

  if (loading) {
    return <LoadingState loadingText="Loading SOAR actions..." />;
  }

  if (error) {
    return <EmptyState
      title="Error Loading SOAR Actions"
      description={error}
      icon={AlertTriangle}
    />;
  }

  const tabs = selectedAction
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <ActionOverview action={selectedAction} />,
      },
      {
        id: "execution",
        label: "Execution Details",
        content: <ActionExecution action={selectedAction} />,
      },
      {
        id: "history",
        label: "Execution History",
        content: (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ActionHistory action={selectedAction} executions={actionExecutions} />
            </div>
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Execution Insights
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <AnalysisMetric label="Avg. Latency" value={getSoarHeuristics(selectedAction).executionLatency} icon={Eye} variant="card" />
                  <AnalysisMetric label="Auto-Correction" value={getSoarHeuristics(selectedAction).autoCorrectionYield} icon={Shield} variant="card" status="success" />
                  <AnalysisMetric label="System Stress" value={getSoarHeuristics(selectedAction).systemStress} icon={Power} variant="card" status={getSoarHeuristics(selectedAction).systemStress === "Elevated" ? "warning" : "default"} />
                  <AnalysisMetric label="Reliability Score" value={getSoarHeuristics(selectedAction).reliabilityScore} icon={Database} variant="card" status={parseInt(getSoarHeuristics(selectedAction).reliabilityScore) < 95 ? "warning" : "success"} />
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "approval",
        label: "Approval Process",
        content: <ActionApproval action={selectedAction} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Overview",
        content: (
          <IdentityOverview
            title="SOAR Actions Overview"
            description="Security Orchestration, Automation, and Response (SOAR) actions for rapid threat mitigation in transmission infrastructure."
            metrics={[
              {
                title: "Total Actions",
                value: soarActions.length,
                icon: Zap,
                variant: "primary" as const
              },
              {
                title: "Critical Actions",
                value: soarActions.filter(a => a.isCritical).length,
                icon: AlertTriangle,
                variant: "destructive" as const
              },
              {
                title: "Require Approval",
                value: soarActions.filter(a => a.requiresApproval).length,
                icon: Shield,
                variant: "warning" as const
              },
              {
                title: "Recent Executions",
                value: actionExecutions.filter(e => new Date(e.executedAt).getTime() > Date.now() - 24 * 60 * 60 * 1000).length,
                icon: Activity,
                variant: "default" as const
              }
            ]}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
              <ThreatsDistributionChart
                title="Actions by Type"
                icon={Settings}
                data={[
                  { name: 'Isolate', value: soarActions.filter(a => a.type === 'isolate-substation').length, color: 'hsl(var(--destructive))' },
                  { name: 'Disconnect', value: soarActions.filter(a => a.type === 'disconnect-line').length, color: 'hsl(var(--warning))' },
                  { name: 'Shutdown', value: soarActions.filter(a => a.type === 'emergency-shutdown').length, color: 'hsl(var(--destructive))' },
                  { name: 'Block Access', value: soarActions.filter(a => a.type === 'block-scada-access').length, color: 'hsl(var(--primary))' },
                  { name: 'Reset Comm', value: soarActions.filter(a => a.type === 'reset-communication').length, color: 'hsl(var(--secondary))' },
                ].filter(d => d.value > 0)}
                centerText={soarActions.length.toString()}
              />
              <ThreatsTopList
                title="Most Executed Actions"
                icon={Zap}
                items={soarActions
                  .map(a => ({
                    id: a.id,
                    title: a.name,
                    value: actionExecutions.filter(e => e.actionId === a.id).length,
                    icon: a.isCritical ? AlertTriangle : Shield,
                    variant: a.isCritical ? 'destructive' as const : 'default' as const
                  }))
                  .sort((a, b) => (b.value as number) - (a.value as number))
                  .slice(0, 5)}
                onItemClick={(id) => setSelectedActionId(id)}
                emptyMessage="No action executions yet"
              />
            </div>
          </IdentityOverview>
        ),
      }
    ];

  const getTypeColor = (type: TransmissionSoarActionType) => {
    switch (type) {
      case "isolate-substation":
        return "bg-destructive/10 text-destructive";
      case "disconnect-line":
        return "bg-destructive/10 text-destructive";
      case "emergency-shutdown":
        return "bg-destructive/10 text-destructive";
      case "disable-relay":
        return "bg-warning/10 text-warning";
      case "block-scada-access":
        return "bg-primary/10 text-primary";
      case "reset-communication":
        return "bg-primary/10 text-primary";
      case "backup-configuration":
        return "bg-success/10 text-success";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  const getTypeIcon = (type: TransmissionSoarActionType) => {
    switch (type) {
      case "isolate-substation":
        return Shield;
      case "disconnect-line":
        return WifiOff;
      case "emergency-shutdown":
        return Power;
      case "disable-relay":
        return Ban;
      case "block-scada-access":
        return UserX;
      case "reset-communication":
        return Wifi;
      case "backup-configuration":
        return Database;
      default:
        return Activity;
    }
  };

  const formatTypeName = (type: TransmissionSoarActionType) => {
    return type.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatTargetTypeName = (targetType: TransmissionSoarTargetType) => {
    return targetType.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <>
      <ListPane
        title="SOAR Actions"
        context="DEWA – Transmission"
        count={filteredActions.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "type",
            label: "Action Type",
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { value: "all", label: "All Types" },
              { value: "isolate-substation", label: "Isolate Substation" },
              { value: "disconnect-line", label: "Disconnect Line" },
              { value: "emergency-shutdown", label: "Emergency Shutdown" },
              { value: "disable-relay", label: "Disable Relay" },
              { value: "block-scada-access", label: "Block SCADA Access" },
              { value: "reset-communication", label: "Reset Communication" },
              { value: "backup-configuration", label: "Backup Configuration" },
            ],
          },
          {
            key: "targetType",
            label: "Target Type",
            value: targetTypeFilter,
            onChange: setTargetTypeFilter,
            options: [
              { value: "all", label: "All Targets" },
              { value: "substation", label: "Substation" },
              { value: "transmission-line", label: "Transmission Line" },
              { value: "protection-relay", label: "Protection Relay" },
              { value: "scada-system", label: "SCADA System" },
              { value: "communication-link", label: "Communication Link" },
            ],
          },
          {
            key: "approval",
            label: "Approval",
            value: approvalFilter,
            onChange: setApprovalFilter,
            options: [
              { value: "all", label: "All Actions" },
              { value: "requires-approval", label: "Requires Approval" },
              { value: "no-approval", label: "No Approval" },
            ],
          },
        ]}
        sortOptions={[
          { label: "Criticality", value: "criticality" },
          { label: "Name", value: "name" },
          { label: "Type", value: "type" },
          { label: "Executions", value: "executions" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >

        {/* Action List */}
        {filteredActions.map((action) => {
          const TypeIcon = getTypeIcon(action.type);

          return (
            <div
              key={action.id}
              onClick={() => setSelectedActionId(action.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedActionId === action.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30 bg-card"
                } ${action.isCritical ? "border-l-4 border-l-destructive" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <TypeIcon className="w-5 h-5 mt-0.5 text-primary" />
                  {action.isCritical && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{action.name}</p>
                      {action.isCritical && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">
                          CRITICAL
                        </span>
                      )}
                      {action.requiresApproval && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning font-medium">
                          APPROVAL
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${getTypeColor(action.type)}`}>
                      {formatTypeName(action.type)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {action.description}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                      Target: {formatTargetTypeName(action.targetType)}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                      Level: {action.approvalLevel}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {action.executionCount} executions
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </ListPane>

      <WorkPane
        title={selectedAction ? selectedAction.name : "SOAR Actions"}
        subtitle={selectedAction ? formatTypeName(selectedAction.type) : "Overview"}
        tabs={tabs}
      />
    </>
  );
}

function ActionOverview({ action }: { action: TransmissionSoarAction }) {
  const TypeIcon = getTypeIcon(action.type);

  return (
    <div className="space-y-6">
      {/* Action Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${action.isCritical ? "bg-destructive/10" : "bg-primary/10"
            }`}>
            <TypeIcon className={`w-6 h-6 ${action.isCritical ? "text-destructive" : "text-primary"
              }`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{action.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
            <div className="flex items-center gap-4 mt-4">
              <span className={`text-xs px-3 py-1 rounded-full ${getTypeColor(action.type)}`}>
                {formatTypeName(action.type)}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="w-3 h-3" />
                {formatTargetTypeName(action.targetType)}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <History className="w-3 h-3" />
                {action.executionCount} executions
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Properties */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Action Properties</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-center gap-3">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Action Type</p>
              <p className="text-sm font-medium">{formatTypeName(action.type)}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Target className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Target Type</p>
              <p className="text-sm font-medium">{formatTargetTypeName(action.targetType)}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            {action.requiresApproval ? <Lock className="w-4 h-4 text-warning" /> : <Unlock className="w-4 h-4 text-success" />}
            <div>
              <p className="text-xs text-muted-foreground">Approval Required</p>
              <p className="text-sm font-medium">{action.requiresApproval ? "Yes" : "No"}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <User className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Approval Level</p>
              <p className="text-sm font-medium">{action.approvalLevel.charAt(0).toUpperCase() + action.approvalLevel.slice(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Action Warning */}
      {action.isCritical && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-destructive mb-2">Critical Transmission Action</h4>
              <p className="text-sm text-destructive/80">
                This action affects critical transmission system operations. Ensure proper authorization
                and coordination with operations personnel before execution.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Execution Statistics */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Execution Statistics</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Executions</p>
            <p className="text-2xl font-bold">{action.executionCount}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Estimated Duration</p>
            <p className="text-2xl font-bold text-primary">{action.estimatedDuration} min</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Last Execution</p>
            <p className="text-sm font-bold">
              {action.lastExecuted
                ? new Date(action.lastExecuted).toLocaleDateString()
                : "Never"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionExecution({ action }: { action: TransmissionSoarAction }) {
  return (
    <div className="space-y-6">
      {/* Execution Requirements */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          Execution Requirements
        </h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-start gap-3">
            <Target className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Target Specification</p>
              <p className="text-xs text-muted-foreground mt-1">
                This action targets {action.targetType} entities. Specify the exact target identifier when executing.
              </p>
            </div>
          </div>
          {action.requiresApproval && (
            <div className="p-4 flex items-start gap-3">
              <Lock className="w-4 h-4 text-warning mt-0.5" />
              <div>
                <p className="text-sm font-medium">Approval Required</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This action requires approval from a {action.approvalLevel} before execution.
                </p>
              </div>
            </div>
          )}
          {action.isCritical && (
            <div className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium">Critical System Impact</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This action may affect critical transmission systems. Coordinate with operations personnel.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Execution Steps */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Execution Process</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-medium">Identify Target</h5>
                <p className="text-xs text-muted-foreground mt-1">
                  Specify the exact {action.targetType} to be affected by this action.
                </p>
              </div>
            </div>
          </div>

          {action.requiresApproval && (
            <div className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-warning/10 text-warning flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-medium">Obtain Approval</h5>
                  <p className="text-xs text-muted-foreground mt-1">
                    Request approval from {action.approvalLevel} level personnel before proceeding.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-4">
            <div className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${action.requiresApproval ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                }`}>
                {action.requiresApproval ? "3" : "2"}
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-medium">Execute Action</h5>
                <p className="text-xs text-muted-foreground mt-1">
                  Perform the {formatTypeName(action.type).toLowerCase()} operation on the specified target.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${action.requiresApproval ? "bg-secondary text-muted-foreground" : "bg-success/10 text-success"
                }`}>
                {action.requiresApproval ? "4" : "3"}
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-medium">Verify Result</h5>
                <p className="text-xs text-muted-foreground mt-1">
                  Confirm the action was executed successfully and document the outcome.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expected Outcomes */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Expected Outcomes</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
              <div>
                <p className="text-sm font-medium">Successful Execution</p>
                <p className="text-xs text-muted-foreground">
                  {getExpectedOutcome(action.type)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Activity className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">System Impact</p>
                <p className="text-xs text-muted-foreground">
                  {getSystemImpact(action.type, action.isCritical)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <History className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Audit Trail</p>
                <p className="text-xs text-muted-foreground">
                  Execution details will be logged for compliance and forensic purposes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionHistory({ action, executions }: { action: TransmissionSoarAction; executions: SoarActionExecution[] }) {
  return (
    <div className="space-y-6">
      {/* Execution Performance Heuristics */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Performance Heuristics
        </h4>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <AnalysisMetric
            label="Execution Latency"
            value={getSoarHeuristics(action).executionLatency}
            icon={Clock}
            variant="card"
            status={getSoarHeuristics(action).executionLatency.startsWith('1') ? 'warning' : 'default'}
          />
          <AnalysisMetric
            label="Auto-Correction Yield"
            value={getSoarHeuristics(action).autoCorrectionYield}
            icon={CheckCircle2}
            variant="card"
            status="success"
          />
          <AnalysisMetric
            label="System Stress"
            value={getSoarHeuristics(action).systemStress}
            icon={Activity}
            variant="card"
            status={getSoarHeuristics(action).systemStress === 'Elevated' ? 'warning' : 'default'}
          />
          <AnalysisMetric
            label="Reliability Score"
            value={getSoarHeuristics(action).reliabilityScore}
            icon={Shield}
            variant="card"
            status="default"
          />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          Execution History ({action.executionCount})
        </h4>

        {executions.length > 0 ? (
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {executions.map((execution) => (
              <div key={execution.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h5 className="text-sm font-medium">Target: {execution.target}</h5>
                        <p className="text-xs text-muted-foreground">
                          Executed by {execution.executedBy}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">
                          Success
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(execution.executedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground bg-secondary/30 rounded p-2">
                      {execution.details}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <History className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              This action has not been executed yet.
            </p>
          </div>
        )}
      </div>

      {/* Execution Summary */}
      {action.executionCount > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Execution Summary</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
              <p className="text-2xl font-bold text-success">95%</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Executions</p>
              <p className="text-2xl font-bold">{action.executionCount}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Last Execution</p>
              <p className="text-sm font-bold">
                {action.lastExecuted ? new Date(action.lastExecuted).toLocaleDateString() : 'Never'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionApproval({ action }: { action: TransmissionSoarAction }) {
  return (
    <div className="space-y-6">
      {/* Approval Requirements */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          {action.requiresApproval ? <Lock className="w-4 h-4 text-warning" /> : <Unlock className="w-4 h-4 text-success" />}
          Approval Requirements
        </h4>

        {action.requiresApproval ? (
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            <div className="p-4 flex items-start gap-3">
              <User className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Required Approval Level</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {action.approvalLevel.charAt(0).toUpperCase() + action.approvalLevel.slice(1)} level approval is required before execution
                </p>
              </div>
            </div>
            <div className="p-4 flex items-start gap-3">
              <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Approval Process</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Submit request through incident management system with justification and target details
                </p>
              </div>
            </div>
            {action.isCritical && (
              <div className="p-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Critical System Coordination</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Additional coordination with operations personnel required due to critical system impact
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <Unlock className="w-8 h-8 text-success mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              This action can be executed immediately without prior approval.
            </p>
          </div>
        )}
      </div>

      {/* Approval Guidelines */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Approval Guidelines</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
            <div>
              <p className="text-sm font-medium">Immediate Approval</p>
              <p className="text-xs text-muted-foreground mt-1">
                Active cyber incident with confirmed threat to transmission systems
              </p>
            </div>
          </div>
          <div className="p-4 flex items-start gap-3">
            <Clock className="w-4 h-4 text-warning mt-0.5" />
            <div>
              <p className="text-sm font-medium">Standard Approval</p>
              <p className="text-xs text-muted-foreground mt-1">
                Suspicious activity requiring investigation and containment
              </p>
            </div>
          </div>
          <div className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
            <div>
              <p className="text-sm font-medium">Extended Review</p>
              <p className="text-xs text-muted-foreground mt-1">
                Actions affecting critical transmission infrastructure or grid stability
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Procedures */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Emergency Procedures</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Zap className="w-4 h-4 text-warning mt-0.5" />
              <div>
                <p className="text-sm font-medium">Emergency Override</p>
                <p className="text-xs text-muted-foreground">
                  In case of imminent safety threat, actions may be executed with post-incident approval
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Activity className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Control Room Authority</p>
                <p className="text-xs text-muted-foreground">
                  Control room operator can authorize actions during active grid incidents
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <History className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Documentation Required</p>
                <p className="text-xs text-muted-foreground">
                  All emergency executions must be documented with full justification
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getTypeColor(type: TransmissionSoarActionType) {
  switch (type) {
    case "isolate-substation":
      return "bg-destructive/10 text-destructive";
    case "disconnect-line":
      return "bg-destructive/10 text-destructive";
    case "emergency-shutdown":
      return "bg-destructive/10 text-destructive";
    case "disable-relay":
      return "bg-warning/10 text-warning";
    case "block-scada-access":
      return "bg-primary/10 text-primary";
    case "reset-communication":
      return "bg-primary/10 text-primary";
    case "backup-configuration":
      return "bg-success/10 text-success";
    default:
      return "bg-secondary text-muted-foreground";
  }
}

function getTypeIcon(type: TransmissionSoarActionType) {
  switch (type) {
    case "isolate-substation":
      return Shield;
    case "disconnect-line":
      return WifiOff;
    case "emergency-shutdown":
      return Power;
    case "disable-relay":
      return Ban;
    case "block-scada-access":
      return UserX;
    case "reset-communication":
      return Wifi;
    case "backup-configuration":
      return Database;
    default:
      return Activity;
  }
}

function formatTypeName(type: TransmissionSoarActionType) {
  return type.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function formatTargetTypeName(targetType: TransmissionSoarTargetType) {
  return targetType.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function getExpectedOutcome(type: TransmissionSoarActionType): string {
  switch (type) {
    case "isolate-substation":
      return "Substation will be isolated from the grid to prevent attack propagation";
    case "disconnect-line":
      return "Transmission line will be disconnected to prevent cascading failures";
    case "emergency-shutdown":
      return "System components will be safely shut down to prevent damage";
    case "disable-relay":
      return "Protection relay will be disabled to prevent malicious operations";
    case "block-scada-access":
      return "SCADA access will be blocked and active sessions terminated";
    case "reset-communication":
      return "Communication links will be reset and secure connections re-established";
    case "backup-configuration":
      return "Emergency backup of critical configurations will be created";
    default:
      return "Action will be executed according to defined procedures";
  }
}

function getSystemImpact(type: TransmissionSoarActionType, isCritical: boolean): string {
  const baseImpact = (() => {
    switch (type) {
      case "isolate-substation":
        return "Substation operations will be suspended";
      case "disconnect-line":
        return "Power flow through transmission line will be interrupted";
      case "emergency-shutdown":
        return "System functionality will be temporarily unavailable";
      case "disable-relay":
        return "Protection functions will be temporarily disabled";
      case "block-scada-access":
        return "SCADA operations may be interrupted";
      case "reset-communication":
        return "Communication may be briefly interrupted during reset";
      case "backup-configuration":
        return "Minimal impact, backup process initiated";
      default:
        return "System state will be modified";
    }
  })();

  return isCritical
    ? `${baseImpact}. Critical transmission systems affected - coordinate with grid operations.`
    : baseImpact;
}

