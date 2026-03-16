import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Shield,
  Clock,
  Users,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  AlertCircle,
  ShieldCheck,
  Lock,
  Globe,
  Fingerprint,
  Zap,
  Activity,
  Layout
} from "lucide-react";
import {
  getAccessPolicies,
  getAccessRulesForPolicy
} from "@/lib/securityQueries";
import type { AccessPolicy, AccessRule } from "@/types/security";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  RuleDetailCard
} from "@/components/security/IdentityGovernanceMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AccessPolicies() {
  const { currentTenant } = useApp();
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("priority");
  const [policies, setPolicies] = useState<AccessPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load policies from Supabase
  useEffect(() => {
    async function loadPolicies() {
      try {
        setLoading(true);
        setError(null);
        const policyData = await getAccessPolicies(currentTenant?.id || "");
        setPolicies(policyData);
      } catch (err) {
        console.error('Failed to load access policies:', err);
        setError(err instanceof Error ? err.message : 'Failed to load policies');
      } finally {
        setLoading(false);
      }
    }

    loadPolicies();
  }, [currentTenant?.id]);

  // Filter and sort policies
  const filteredAndSortedPolicies = useMemo(() => {
    let result = [...policies];

    // Search
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        (policy) =>
          policy.name.toLowerCase().includes(query) ||
          (policy.description && policy.description.toLowerCase().includes(query)) ||
          policy.policyType.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((policy) => policy.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "priority") return a.priority - b.priority;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "type") return a.policyType.localeCompare(b.policyType);
      return 0;
    });

    return result;
  }, [policies, searchTerm, statusFilter, sortBy]);

  const selectedPolicy = policies.find((p) => p.id === selectedPolicyId);

  const tabs = selectedPolicy
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <PolicyOverview policy={selectedPolicy} />,
      },
      {
        id: "rules",
        label: "Access Rules",
        content: <PolicyRules policy={selectedPolicy} />,
      },
      {
        id: "assignments",
        label: "Assignments",
        content: <PolicyAssignments policy={selectedPolicy} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Overview",
        content: <AccessPoliciesOverview policies={policies} />,
      }
    ];

  if (loading) {
    return <LoadingState loadingText="Loading access policies..." />;
  }

  if (error) {
    return (
      <div className="flex-1 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <ListPane
        title="Access Policies"
        context="DEWA – Transmission"
        count={filteredAndSortedPolicies.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All Statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "draft", label: "Draft" },
            ],
          },
        ]}
        sortOptions={[
          { label: "Priority", value: "priority" },
          { label: "Policy Name", value: "name" },
          { label: "Policy Type", value: "type" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedPolicies.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No Policies Found"
              description="No security policies match your current filters"
            />
          ) : (
            filteredAndSortedPolicies.map((policy) => (
              <ListPaneItem
                key={policy.id}
                title={policy.name}
                description={policy.policyType.replace(/-/g, ' ')}
                status={policy.status === 'active' ? 'online' : (policy.status === 'inactive' ? 'offline' : 'pending')}
                category={`Order ${policy.priority}`}
                value={`${policy.appliesTo.length} IDs`}
                isSelected={selectedPolicyId === policy.id}
                onClick={() => setSelectedPolicyId(policy.id)}
              />
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedPolicy ? selectedPolicy.name : "Access Governance Overview"}
        subtitle={
          selectedPolicy
            ? (selectedPolicy.description || `Policy enforcement for ${selectedPolicy.policyType}`)
            : `Centralized policy management for ${currentTenant.name} infrastructure`
        }
        tabs={tabs}
      />
    </>
  );
}

function AccessPoliciesOverview({ policies }: { policies: AccessPolicy[] }) {
  const overviewMetrics = [
    {
      title: "Active Policies",
      value: policies.filter(p => p.status === 'active').length,
      subtitle: `of ${policies.length} total`,
      icon: ShieldCheck,
      variant: "success" as any
    },
    {
      title: "Pending Approval",
      value: policies.filter(p => !p.approvedAt).length,
      subtitle: "Action required",
      icon: AlertTriangle,
      variant: policies.some(p => !p.approvedAt) ? "warning" : "success" as any
    },
    {
      title: "Avg Priority",
      value: policies.length > 0 ? (policies.reduce((acc, p) => acc + p.priority, 0) / policies.length).toFixed(1) : "0",
      subtitle: "Enforcement level",
      icon: Fingerprint,
      variant: "primary" as any
    },
    {
      title: "Assignments",
      value: policies.reduce((acc, p) => acc + p.appliesTo.length, 0),
      subtitle: "Resources protected",
      icon: Users,
      variant: "primary" as any
    }
  ];

  const policyMixData = [
    { name: "Active", value: policies.filter(p => p.status === 'active').length, color: "hsl(var(--success))" },
    { name: "Inactive", value: policies.filter(p => p.status === 'inactive').length, color: "hsl(var(--muted))" },
    { name: "Draft", value: policies.filter(p => p.status === 'draft').length, color: "hsl(var(--warning))" },
  ];

  const enforcementData = [
    { name: "Zone-Based", value: policies.filter(p => p.policyType === 'zone-based').length, total: policies.length, color: "hsl(var(--primary))" },
    { name: "Role-Based", value: policies.filter(p => p.policyType === 'role-based').length, total: policies.length, color: "hsl(var(--success))" },
    { name: "Asset-Based", value: policies.filter(p => p.policyType === 'asset-based').length, total: policies.length, color: "hsl(var(--warning))" },
    { name: "Time-Based", value: policies.filter(p => p.policyType === 'time-based').length, total: policies.length, color: "hsl(var(--destructive))" },
  ];

  const timelineData = [
    { date: "Jan", count: 12 },
    { date: "Feb", count: 15 },
    { date: "Mar", count: 18 },
    { date: "Apr", count: 14 },
    { date: "May", count: 22 },
    { date: "Jun", count: policies.length },
  ];

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-1 pb-8">
      <IdentityGovernanceMetrics
        title="Access Governance"
        description="Policy-driven security for transmission networks and mission-critical assets"
        metrics={overviewMetrics}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <EnforcementHeatmap
            title="Enforcement Density"
            description="Distribution of policy types across the infrastructure"
            data={enforcementData}
          />
          <SecurityMix
            title="Policy Composition"
            data={policyMixData}
          />
          <GovernanceTimeline
            title="Policy Evolution"
            data={timelineData}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Strategic Focus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: "Identity Governance", desc: "Role-based access for transmission staff.", icon: Globe },
                  { title: "Critical Infrastructure", desc: "JIT access for SCADA systems.", icon: Zap },
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
              <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Recent Policy Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {policies
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 3)
                  .map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 border border-border/50">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'active' ? 'bg-success' : 'bg-warning'}`} />
                        <span className="text-xs font-medium truncate max-w-[150px]">{p.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">{p.policyType.split('-')[0]}</span>
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

function PolicyOverview({ policy }: { policy: AccessPolicy }) {
  const daysOld = Math.floor((Date.now() - new Date(policy.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  const overviewMetrics = [
    {
      title: "Status",
      value: policy.status.toUpperCase(),
      subtitle: `${daysOld}d since creation`,
      icon: Activity,
      variant: policy.status === 'active' ? "success" : "warning" as any
    },
    {
      title: "Priority",
      value: `#${policy.priority}`,
      subtitle: "Execution order",
      icon: Fingerprint,
      variant: "primary" as any
    },
    {
      title: "Assignments",
      value: policy.appliesTo.length,
      subtitle: `${policy.policyType} scope`,
      icon: Users,
      variant: "primary" as any
    },
    {
      title: "Approved",
      value: policy.approvedAt ? new Date(policy.approvedAt).toLocaleDateString() : 'Pending',
      subtitle: policy.approvedBy || 'Awaiting review',
      icon: Calendar,
      variant: policy.approvedAt ? "success" : "warning" as any
    }
  ];

  const lifecycleSteps: import("@/components/security/IdentityGovernanceMetrics").LifecycleStep[] = [
    { label: "Drafted", sublabel: new Date(policy.createdAt).toLocaleDateString(), status: "completed" },
    { label: "Under Review", sublabel: policy.approvedBy ? "Completed" : "In Progress", status: policy.approvedAt ? "completed" : "active" },
    { label: "Approved", sublabel: policy.approvedAt ? new Date(policy.approvedAt).toLocaleDateString() : "Pending", status: policy.approvedAt ? "completed" : "pending" },
    { label: "Enforced", sublabel: policy.status === 'active' ? "Live" : "Inactive", status: policy.status === 'active' ? "active" : "pending" },
  ];

  const typeColors: Record<string, string> = {
    'zone-based': 'hsl(var(--primary))',
    'role-based': 'hsl(var(--success))',
    'asset-specific': 'hsl(var(--warning))',
    'time-bound': 'hsl(220 60% 60%)',
    'emergency': 'hsl(var(--destructive))',
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Approval Lifecycle */}
        <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Approval Lifecycle</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <StatusLifecycle steps={lifecycleSteps} />
          </CardContent>
        </Card>

        {/* Policy Properties */}
        <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Policy Properties</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DetailPropertyRow label="Type" value={policy.policyType} icon={Shield} />
            <DetailPropertyRow label="Created By" value={policy.createdBy || 'System'} icon={Users} />
            <DetailPropertyRow label="Enforcement" value="STANDARD" icon={ShieldCheck} variant="success" />
            <DetailPropertyRow label="Description" value={policy.description || '—'} icon={Settings} />
          </CardContent>
        </Card>
      </div>

      {/* Target Assignments */}
      <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Target Assignments ({policy.appliesTo.length})</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <TagBadgeList
            tags={policy.appliesTo}
            colorFn={(t) => t.includes('@') ? 'hsl(var(--primary))' : typeColors[policy.policyType] || 'hsl(var(--success))'}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function PolicyRules({ policy }: { policy: AccessPolicy }) {
  const [rules, setRules] = useState<AccessRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRules() {
      try {
        setLoading(true);
        const rulesData = await getAccessRulesForPolicy(policy.tenantId, policy.id);
        // Sort by rule order
        setRules(rulesData.sort((a, b) => (a.ruleOrder || 0) - (b.ruleOrder || 0)));
      } catch (err) {
        console.error('Failed to load access rules:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRules();
  }, [policy.tenantId, policy.id]);

  if (loading) return <LoadingState />;

  const getResourceIcon = (type?: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('api') || t.includes('endpoint')) return Zap;
    if (t.includes('storage') || t.includes('data') || t.includes('bucket')) return Layout;
    if (t.includes('grid') || t.includes('station') || t.includes('field')) return Globe;
    return Shield;
  };

  return (
    <div className="space-y-4 overflow-y-auto h-full pr-1 pb-8 animate-in fade-in duration-300">
      {rules.length === 0 ? (
        <EmptyState
          icon={Settings}
          title="No Rules Configured"
          description="Default 'Deny All' is currently in effect for this policy."
        />
      ) : (
        rules.map((rule) => {
          const ResourceIcon = getResourceIcon(rule.resourceType);

          const metadata = [
            { label: "Resource", value: rule.resourceType || 'General', icon: ResourceIcon },
            {
              label: "Schedule",
              value: rule.timeStart ? `${rule.timeStart} - ${rule.timeEnd}` : 'Always Active',
              icon: Clock,
              variant: rule.timeStart ? 'warning' : 'success' as any
            },
          ];

          if (rule.resourcePattern) {
            metadata.push({ label: "Pattern", value: rule.resourcePattern, icon: Layout });
          }

          return (
            <RuleDetailCard
              key={rule.id}
              order={rule.ruleOrder}
              title={`${rule.resourceType || 'Global'} Access Rule`}
              description={rule.resourceId ? `Target: ${rule.resourceId}` : undefined}
              effect={rule.effect}
              actions={rule.actions}
              metadata={metadata}
            />
          );
        })
      )}
    </div>
  );
}

function PolicyAssignments({ policy }: { policy: AccessPolicy }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 mb-2">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold flex items-center justify-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {policy.appliesTo.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1 uppercase font-bold">Total Assignments</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success" />
            {policy.status === 'active' ? policy.appliesTo.length : 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1 uppercase font-bold">Active Enforcement</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="bg-secondary/30 px-4 py-2 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Assigned Identities
        </div>
        <div className="divide-y divide-border">
          {policy.appliesTo.map((assignment, index) => (
            <div key={index} className="px-4 py-3 flex items-center justify-between hover:bg-secondary/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {assignment.includes('@') ? <Users className="w-4 h-4 text-primary" /> : <Shield className="w-4 h-4 text-primary" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{assignment}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{assignment.includes('@') ? 'Individual User' : 'Security Role'}</p>
                </div>
              </div>
              <StatusBadge status={policy.status === 'active' ? 'online' : 'offline'} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}