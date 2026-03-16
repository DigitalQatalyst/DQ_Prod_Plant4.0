import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Shield,
  Smartphone,
  Clock,
  User,
  Settings,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Key,
  Lock,
  Unlock,
  Timer,
  Users,
  AlertCircle,
  Activity,
  Zap,
  RotateCcw,
  ShieldCheck,
  Globe,
  Fingerprint,
  Briefcase,
  Calendar,
  ShieldAlert,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMfaRules, getSessionRules } from "@/lib/identityQueries";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { FeatureOverviewCharts } from "@/components/security/FeatureOverviewCharts";
import {
  IdentityGovernanceMetrics,
  EnforcementHeatmap,
  SecurityMix,
  GovernanceTimeline,
  DetailPropertyRow,
  StatusLifecycle,
  TagBadgeList,
  AnalysisMetric
} from "@/components/security/IdentityGovernanceMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// MFA Rule Interface
interface MfaRule {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'draft';
  priority: number;
  conditions: {
    userRoles?: string[];
    resourceTypes?: string[];
    riskScore?: { min: number; max: number };
    timeOfDay?: { start: string; end: string };
    ipRanges?: string[];
    locations?: string[];
  };
  requirements: {
    mfaRequired: boolean;
    mfaMethods: string[];
    sessionTimeout: number; // minutes
    maxConcurrentSessions: number;
    requireReauth: boolean;
    reauthInterval: number; // minutes
    allowedMethods?: string[]; // Added for new StrategyOverview
  };
  exemptions?: {
    emergencyAccess: boolean;
    trustedDevices: boolean;
    serviceAccounts: boolean;
  };
  enforcement: 'strict' | 'advisory' | 'disabled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastApplied?: string;
  applicationsCount: number;
}

// Session Rule Interface
interface SessionRule {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  sessionType: 'interactive' | 'api' | 'service' | 'emergency';
  maxDuration: number; // minutes
  idleTimeout: number; // minutes
  maxConcurrentSessions: number;
  allowedLocations?: string[];
  allowedIpRanges?: string[];
  deviceRestrictions: {
    requireRegistration: boolean;
    allowMobile: boolean;
    allowDesktop: boolean;
    requireEncryption: boolean;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  activeSessions: number;
}

export function MfaSessionRules() {
  const { currentTenant } = useApp();
  const [selectedRuleId, setSelectedRuleId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [mfaRules, setMfaRules] = useState<MfaRule[]>([]);
  const [sessionRules, setSessionRules] = useState<SessionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load MFA and session rules
  useEffect(() => {
    async function loadRules() {
      try {
        setLoading(true);
        setError(null);

        const [mfaData, sessionData] = await Promise.all([
          getMfaRules(currentTenant?.id || ""),
          getSessionRules(currentTenant?.id || "")
        ]);

        setMfaRules(mfaData);
        setSessionRules(sessionData);
      } catch (err) {
        console.error('Failed to load MFA and session rules:', err);
        setError(err instanceof Error ? err.message : 'Failed to load rules');
      } finally {
        setLoading(false);
      }
    }

    loadRules();
  }, [currentTenant?.id]);

  // Filter and sort rules
  const filteredAndSortedRules = useMemo(() => {
    let rules = [
      ...mfaRules.map(r => ({ ...r, ruleType: 'mfa' as const })),
      ...sessionRules.map(r => ({ ...r, ruleType: 'session' as const }))
    ];

    // Search
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      rules = rules.filter(r =>
        r.name.toLowerCase().includes(query) ||
        (r.description && r.description.toLowerCase().includes(query))
      );
    }

    // Filter by type
    if (typeFilter !== "all") {
      rules = rules.filter(r => r.ruleType === typeFilter);
    }

    // Sort
    rules.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "type") return a.ruleType.localeCompare(b.ruleType);
      if (sortBy === "priority") {
        const aPrio = ('priority' in a) ? a.priority : 999;
        const bPrio = ('priority' in b) ? b.priority : 999;
        return aPrio - bPrio;
      }
      return 0;
    });

    return rules;
  }, [mfaRules, sessionRules, searchTerm, typeFilter, sortBy]);

  const selectedRule = filteredAndSortedRules.find((r) => r.id === selectedRuleId);

  const tabs = selectedRule
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <RuleOverview rule={selectedRule} />,
      },
      {
        id: "config",
        label: "Configuration",
        content: <RuleConfig rule={selectedRule} />,
      },
      {
        id: "context",
        label: "Policy Context",
        content: <RuleContext rule={selectedRule} />,
      }
    ]
    : [
      {
        id: "overview",
        label: "Overview",
        content: <StrategyOverview mfaRules={mfaRules} sessionRules={sessionRules} />,
      }
    ];

  if (loading) {
    return <LoadingState loadingText="Compiling conditional access policies..." />;
  }

  return (
    <>
      <ListPane
        title="Access Guards"
        context="DEWA – Transmission"
        count={filteredAndSortedRules.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "type",
            label: "Rule Type",
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { value: "all", label: "All Types" },
              { value: "mfa", label: "MFA Rules" },
              { value: "session", label: "Session Rules" },
            ],
          },
        ]}
        sortOptions={[
          { label: "Rule Name", value: "name" },
          { label: "Rule Type", value: "type" },
          { label: "Priority", value: "priority" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedRules.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No Rules Found"
              description="No access guards match your current filters"
            />
          ) : (
            filteredAndSortedRules.map((rule) => (
              <ListPaneItem
                key={rule.id}
                title={rule.name}
                description={`${rule.ruleType} enforcement`}
                status={rule.status === 'active' ? 'online' : 'offline'}
                category={('priority' in rule) ? `Prio ${rule.priority}` : rule.sessionType.toUpperCase()}
                value={('applicationsCount' in rule) ? `${rule.applicationsCount} hits` : `${rule.activeSessions} active`}
                isSelected={selectedRuleId === rule.id}
                onClick={() => setSelectedRuleId(rule.id)}
              />
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedRule ? selectedRule.name : "Conditional Access & Session Governance"}
        subtitle={
          selectedRule
            ? `${'priority' in selectedRule ? 'Multi-Factor Challenge Policy' : 'Session Lifecycle Parameters'}`
            : `Adaptive authentication and session management for ${currentTenant.name}`
        }
        tabs={tabs}
      />
    </>
  );
}

function StrategyOverview({ mfaRules, sessionRules }: { mfaRules: MfaRule[], sessionRules: SessionRule[] }) {
  const overviewMetrics = [
    {
      title: "Active MFA",
      value: mfaRules.filter(r => r.status === 'active').length,
      subtitle: `of ${mfaRules.length} rules`,
      icon: Shield,
      variant: "success" as any
    },
    {
      title: "Live Sessions",
      value: sessionRules.filter(r => r.status === 'active').length,
      subtitle: "Across all protocols",
      icon: Activity,
      variant: "primary" as any
    },
    {
      title: "Enforcement",
      value: "STRICT",
      subtitle: "Zero-Trust baseline",
      icon: Lock,
      variant: "primary" as any
    },
    {
      title: "Anomalies",
      value: 0,
      subtitle: "Last 24 hours",
      icon: AlertTriangle,
      variant: "success" as any
    }
  ];

  const mfaCoverageData = [
    { name: "Biometric", value: mfaRules.filter(r => r.requirements.mfaRequired && r.requirements.allowedMethods?.includes('biometric')).length, color: "hsl(var(--primary))" },
    { name: "Hardware", value: mfaRules.filter(r => r.requirements.mfaRequired && r.requirements.allowedMethods?.includes('hardware-token')).length, color: "hsl(var(--success))" },
    { name: "App-Auth", value: mfaRules.filter(r => r.requirements.mfaRequired && r.requirements.allowedMethods?.includes('authenticator-app')).length, color: "hsl(var(--warning))" },
    { name: "Standard", value: mfaRules.filter(r => !r.requirements.mfaRequired).length, color: "hsl(var(--muted))" },
  ];

  const strictnessMatrixData = [
    { name: "Geo-Velocity", value: 95, total: 100, color: "hsl(var(--success))" },
    { name: "IP Reputation", value: 88, total: 100, color: "hsl(var(--primary))" },
    { name: "Device Health", value: 72, total: 100, color: "hsl(var(--warning))" },
  ];

  const timelineData = [
    { date: "MON", count: 420 },
    { date: "TUE", count: 450 },
    { date: "WED", count: 480 },
    { date: "THU", count: 440 },
    { date: "FRI", count: 510 },
    { date: "SAT", count: 210 },
    { date: "SUN", count: 180 },
  ];

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-1 pb-8">
      <IdentityGovernanceMetrics
        title="Session Protection"
        description="Zero-trust access orchestration for grid operations and corporate identities"
        metrics={overviewMetrics}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <EnforcementHeatmap
            title="Strictness Matrix"
            description="Conditional access parameter enforcement health"
            data={strictnessMatrixData}
          />
          <SecurityMix
            title="MFA Coverage"
            data={mfaCoverageData}
          />
          <GovernanceTimeline
            title="Session Inventory"
            data={timelineData}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Adaptive Auth Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: "Risk-Based MFA", desc: "Challenges based on IP reputation.", icon: ShieldCheck },
                  { title: "Geo-Fencing", desc: "Restricting access to trusted regions.", icon: Globe },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold font-semibold">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Recent Enforcement Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mfaRules
                  .sort((a, b) => new Date(b.lastApplied || 0).getTime() - new Date(a.lastApplied || 0).getTime())
                  .slice(0, 3)
                  .map(r => (
                    <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 border border-border/50">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${r.status === 'active' ? 'bg-success' : 'bg-warning'}`} />
                        <span className="text-xs font-medium truncate max-w-[150px]">{r.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase">{r.enforcement}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </IdentityGovernanceMetrics>
    </div>
  );
}

function RuleOverview({ rule }: { rule: (MfaRule | SessionRule) & { ruleType: string } }) {
  const isMfa = rule.ruleType === 'mfa';
  const mfaRule = rule as MfaRule;
  const sessionRule = rule as SessionRule;
  const daysOld = Math.floor((Date.now() - new Date(rule.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  const overviewMetrics = [
    {
      title: "Status",
      value: rule.status.toUpperCase(),
      subtitle: `${daysOld}d active`,
      icon: Shield,
      variant: rule.status === 'active' ? "success" : "warning" as any
    },
    {
      title: isMfa ? "Priority" : "Sessions",
      value: isMfa ? `#${'priority' in rule ? rule.priority : '—'}` : sessionRule.activeSessions,
      subtitle: isMfa ? "Execution order" : "Active right now",
      icon: Zap,
      variant: "primary" as any
    },
    {
      title: "Enforcement",
      value: ('enforcement' in rule ? rule.enforcement : sessionRule.sessionType).toUpperCase(),
      subtitle: isMfa ? "Challenge mode" : "Protocol type",
      icon: Lock,
      variant: rule.status === 'active' ? "primary" : "warning" as any
    },
    {
      title: "Updated",
      value: new Date(rule.updatedAt).toLocaleDateString(),
      subtitle: `by ${rule.createdBy}`,
      icon: Clock,
      variant: "default" as any
    }
  ];

  const lifecycleSteps: import("@/components/security/IdentityGovernanceMetrics").LifecycleStep[] = [
    { label: "Created", sublabel: new Date(rule.createdAt).toLocaleDateString(), status: "completed" },
    { label: "Reviewed", sublabel: `By ${rule.createdBy}`, status: "completed" },
    { label: "Active", sublabel: rule.status === 'active' ? "Enforcing" : "Inactive", status: rule.status === 'active' ? "active" : "pending" },
    { label: 'lastApplied' in rule && rule.lastApplied ? "Applied" : "Evaluated", sublabel: ('lastApplied' in rule && rule.lastApplied) ? new Date(rule.lastApplied).toLocaleDateString() : "Pending", status: ('lastApplied' in rule && rule.lastApplied) ? "completed" : "pending" },
  ];

  const methodColorFn = (method: string) => {
    if (method === 'hardware-token' || method === 'biometric') return 'hsl(var(--success))';
    if (method === 'authenticator-app' || method === 'totp') return 'hsl(var(--primary))';
    if (method === 'sms' || method === 'email') return 'hsl(var(--warning))';
    return 'hsl(var(--muted-foreground))';
  };

  const conditions = isMfa && mfaRule.conditions
    ? Object.entries(mfaRule.conditions)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k]) => k.replace(/_/g, ' '))
    : [];

  return (
    <div className="space-y-5 overflow-y-auto h-full pr-1 pb-8 animate-in fade-in duration-300">
      {/* Metric strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {overviewMetrics.map((m, i) => {
          const Icon = m.icon;
          const variantColors: Record<string, string> = {
            success: 'text-success bg-success/10 border-success/20',
            warning: 'text-warning bg-warning/10 border-warning/20',
            destructive: 'text-destructive bg-destructive/10 border-destructive/20',
            primary: 'text-primary bg-primary/10 border-primary/20',
            default: 'text-muted-foreground bg-muted/20 border-muted/30',
          };
          return (
            <Card key={i} className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{m.title}</p>
                    <p className="text-xl font-bold mt-0.5">{m.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{m.subtitle}</p>
                  </div>
                  <div className={`p-2 rounded-lg border ${variantColors[m.variant as string] || variantColors.default}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Rule Lifecycle */}
      <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Rule Lifecycle</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <StatusLifecycle steps={lifecycleSteps} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rule Properties */}
        <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Rule Properties</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isMfa ? (
              <>
                <DetailPropertyRow label="MFA Required" value={mfaRule.requirements.mfaRequired ? 'YES' : 'NO'} icon={Shield} variant={mfaRule.requirements.mfaRequired ? 'success' : 'warning'} />
                <DetailPropertyRow label="Session Timeout" value={`${mfaRule.requirements.sessionTimeout}m`} icon={AlertTriangle} />
                <DetailPropertyRow label="Reauth Interval" value={`${mfaRule.requirements.reauthInterval}m`} icon={Clock} />
                <DetailPropertyRow label="Scope" value={rule.description || 'All users'} icon={Globe} />
              </>
            ) : (
              <>
                <DetailPropertyRow label="Session Type" value={sessionRule.sessionType} icon={Activity} />
                <DetailPropertyRow label="Max Duration" value={`${sessionRule.maxDuration}m`} icon={Clock} />
                <DetailPropertyRow label="Idle Timeout" value={`${sessionRule.idleTimeout}m`} icon={AlertTriangle} />
                <DetailPropertyRow label="Max Concurrent" value={sessionRule.maxConcurrentSessions} icon={Users} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Methods or Conditions */}
        <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">
              {isMfa ? `Allowed Methods (${mfaRule.requirements.mfaMethods?.length ?? 0})` : `Conditions (${conditions.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isMfa ? (
              <TagBadgeList tags={mfaRule.requirements.mfaMethods ?? []} colorFn={methodColorFn} />
            ) : (
              conditions.length > 0
                ? <TagBadgeList tags={conditions} />
                : <p className="text-xs text-muted-foreground italic">No additional conditions configured</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RuleConfig({ rule }: { rule: (MfaRule | SessionRule) & { ruleType: string } }) {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-5">
        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-4 flex items-center gap-2">
          <Settings className="w-3.5 h-3.5" />
          Technical Attributes
        </h4>
        <div className="grid grid-cols-2 gap-6">
          <ConfigItem label="Rule ID" value={rule.id} icon={Fingerprint} isMono />
          <ConfigItem label="Created By" value={rule.createdBy} icon={User} />
          <ConfigItem label="Created At" value={new Date(rule.createdAt).toLocaleString()} icon={Calendar} />
          <ConfigItem label="Lifecycle" value={rule.status.toUpperCase()} icon={Activity} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="bg-secondary/30 px-4 py-2 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {rule.ruleType === 'mfa' ? 'Required Methods' : 'Session Limits'}
        </div>
        <div className="p-4 space-y-3">
          {rule.ruleType === 'mfa' ? (
            (rule as MfaRule).requirements.mfaMethods.map(m => (
              <div key={m} className="flex items-center justify-between text-sm">
                <span className="capitalize">{m}</span>
                <Badge variant="outline">REQUIRED</Badge>
              </div>
            ))
          ) : (
            <>
              <div className="flex justify-between text-sm">
                <span>Idle Timeout</span>
                <span className="font-bold">{(rule as SessionRule).idleTimeout}m</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Max Duration</span>
                <span className="font-bold">{(rule as SessionRule).maxDuration}m</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1">
          <Settings className="w-4 h-4 mr-2" />
          Edit Properties
        </Button>
        <Button variant="outline" className="flex-1 text-destructive hover:text-destructive">
          <Trash2 className="w-4 h-4 mr-2" />
          Decommission Rule
        </Button>
      </div>
    </div>
  );
}

function RuleContext({ rule }: { rule: (MfaRule | SessionRule) & { ruleType: string } }) {
  const isMfa = rule.ruleType === 'mfa';
  const isActive = rule.status === 'active';
  const hasExceptions = 'exemptions' in rule && Object.values(rule.exemptions || {}).some(v => v === true);

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-1 pb-8 animate-in fade-in duration-300">
      {/* Advanced Policy Contextual Analysis */}
      <div className="bg-card/40 border border-border/60 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${!isActive ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
            {!isActive ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <h4 className="font-bold text-foreground">Policy Effectiveness Analysis</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Conditional Access Logic Audit</p>
          </div>
        </div>

        <div className="space-y-1">
          <AnalysisMetric
            label="Protocol Strength"
            value={isMfa ? "MULTI-FACTOR" : "SESSION LIMIT"}
            status="success"
            icon={isMfa ? Fingerprint : Timer}
          />
          <AnalysisMetric
            label="Exception Monitoring"
            value={hasExceptions ? "EXEMPTIONS DETECTED" : "NO OVERRIDES"}
            status={hasExceptions ? 'warning' : 'success'}
            icon={AlertCircle}
          />
          <AnalysisMetric
            label="Signal Strength"
            value={isActive ? "LIVE ENFORCEMENT" : "DORMANT"}
            status={isActive ? 'success' : 'failed'}
            icon={Zap}
          />
          <AnalysisMetric
            label="Bypass Analysis"
            value="ZERO BYPASS TOKENS"
            status="success"
            icon={Shield}
          />
        </div>
      </div>

      <div className={`border rounded-xl p-5 transition-all ${!isActive ? 'bg-destructive/5 border-destructive/20' : 'bg-primary/5 border-primary/20'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${!isActive ? 'bg-destructive' : 'bg-primary'}`} />
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Recommended Protocol</span>
          </div>
          <Badge variant={!isActive ? "destructive" : "secondary"} className="text-[8px] h-4 px-1 leading-none uppercase font-bold">
            {!isActive ? "IMMEDIATE ACTIVATION" : "CONTINUOUS MONITORING"}
          </Badge>
        </div>
        <p className="text-sm leading-relaxed font-medium">
          {!isActive
            ? `SECURITY ALERT: Rule ${rule.name} is currently inactive. This creates a gap in the identity perimeter. Recommended to review and activate to ensure zero-trust alignment.`
            : `ROUTINE: ${isMfa ? 'MFA' : 'Session'} policy is correctly prioritized and active. Exception list is minimal and monitored. No compliance gaps identified in current logic.`}
        </p>
      </div>

      <div className="bg-secondary/10 border border-border/40 rounded-xl p-4">
        <h5 className="text-[10px] font-bold text-muted-foreground uppercase mb-3 px-1">Enforcement Reliability</h5>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${!isActive ? 'bg-destructive' : 'bg-success'}`} style={{ width: !isActive ? '0%' : '100%' }} />
          </div>
          <span className="text-[10px] font-mono font-bold">{!isActive ? '0%' : '100%'}</span>
        </div>
      </div>
    </div>
  );
}


function ConfigItem({ label, value, icon: Icon, isMono }: { label: string; value: string; icon: any; isMono?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
        <Icon className="w-2.5 h-2.5" />
        {label}
      </p>
      <p className={`text-sm ${isMono ? 'font-mono text-xs' : 'font-medium'}`}>{value}</p>
    </div>
  );
}
