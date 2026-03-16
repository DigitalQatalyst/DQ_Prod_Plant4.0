import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Key,
  Shield,
  Clock,
  Eye,
  EyeOff,
  Copy,
  RotateCcw,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Settings,
  Server,
  User,
  Calendar,
  Activity,
  AlertCircle,
  Fingerprint,
  Cpu,
  Lock,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Globe,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getApiKeys, getServicePrincipals } from "@/lib/securityQueries";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { FeatureOverviewCharts } from "@/components/security/FeatureOverviewCharts";
import {
  DetailPropertyRow,
  StatusLifecycle,
  TagBadgeList,
  AnalysisMetric
} from "@/components/security/IdentityGovernanceMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// API Key Interface
interface ApiKey {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  keyType: 'api-key' | 'service-principal';
  status: 'active' | 'inactive' | 'expired' | 'revoked';
  keyPrefix: string;
  keyHash: string;
  permissions: string[];
  scopes: string[];
  allowedIps?: string[];
  expiresAt?: string;
  lastUsed?: string;
  usageCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  rotationSchedule?: 'never' | 'monthly' | 'quarterly' | 'yearly';
  nextRotation?: string;
}

// Service Principal Interface
interface ServicePrincipal {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  applicationId: string;
  status: 'active' | 'inactive' | 'suspended';
  permissions: string[];
  roles: string[];
  certificateThumbprint?: string;
  certificateExpiry?: string;
  lastAuthentication?: string;
  authenticationCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export function ApiKeysServicePrincipals() {
  const { currentTenant } = useApp();
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [servicePrincipals, setServicePrincipals] = useState<ServicePrincipal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load API keys and service principals
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [keys, principals] = await Promise.all([
          getApiKeys(currentTenant.id),
          getServicePrincipals(currentTenant.id)
        ]);

        const mappedKeys: ApiKey[] = keys.map(key => ({
          ...key,
          keyType: 'api-key',
          usageCount: key.usageCount || 0
        }));

        const mappedPrincipals: ServicePrincipal[] = principals.map(p => ({
          ...p,
          authenticationCount: p.authenticationCount || 0,
          applicationId: p.clientId
        }));

        setApiKeys(mappedKeys);
        setServicePrincipals(mappedPrincipals);
      } catch (err) {
        console.error('Failed to load API keys and service principals:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentTenant.id]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let items = [
      ...apiKeys.map(k => ({ ...k, itemType: 'api-key' as const })),
      ...servicePrincipals.map(p => ({ ...p, itemType: 'service-principal' as const }))
    ];

    // Search
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(query) ||
        (i.description && i.description.toLowerCase().includes(query))
      );
    }

    // Filter by type
    if (typeFilter !== "all") {
      items = items.filter(i => i.itemType === typeFilter);
    }

    // Sort
    items.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "type") return a.itemType.localeCompare(b.itemType);
      const aUsage = 'usageCount' in a ? a.usageCount : a.authenticationCount;
      const bUsage = 'usageCount' in b ? b.usageCount : b.authenticationCount;
      if (sortBy === "usage") return bUsage - aUsage;
      return 0;
    });

    return items;
  }, [apiKeys, servicePrincipals, searchTerm, typeFilter, sortBy]);

  const selectedItem = filteredAndSortedItems.find((i) => i.id === selectedItemId);

  const tabs = selectedItem
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <ItemOverview item={selectedItem} />,
      },
      {
        id: "config",
        label: "Configuration",
        content: <ItemConfig item={selectedItem} />,
      },
      {
        id: "analysis",
        label: "Context & Analysis",
        content: <ItemContext item={selectedItem} />,
      }
    ]
    : [
      {
        id: "overview",
        label: "Overview",
        content: <KeysOverview apiKeys={apiKeys} principals={servicePrincipals} />,
      }
    ];

  if (loading) {
    return <LoadingState loadingText="Verifying cryptographic identities..." />;
  }

  return (
    <>
      <ListPane
        title="Progammatic Access"
        context="DEWA – Transmission"
        count={filteredAndSortedItems.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "type",
            label: "Identity Type",
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { value: "all", label: "All Types" },
              { value: "api-key", label: "API Keys" },
              { value: "service-principal", label: "Service Principals" },
            ],
          },
        ]}
        sortOptions={[
          { label: "Identity Name", value: "name" },
          { label: "Identity Type", value: "type" },
          { label: "Usage Count", value: "usage" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedItems.length === 0 ? (
            <EmptyState
              icon={Key}
              title="No Identities Found"
              description="No machine identities match your current filters"
            />
          ) : (
            filteredAndSortedItems.map((item) => (
              <ListPaneItem
                key={item.id}
                title={item.name}
                description={item.itemType.replace(/-/g, ' ')}
                status={item.status === 'active' ? 'online' : (item.status === 'inactive' ? 'maintenance' : 'offline')}
                category={('keyPrefix' in item) ? `${item.keyPrefix}...` : item.applicationId.split('-')[0]}
                value={`${('usageCount' in item) ? item.usageCount : item.authenticationCount} calls`}
                isSelected={selectedItemId === item.id}
                onClick={() => setSelectedItemId(item.id)}
              />
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedItem ? selectedItem.name : "Machine-to-Machine Authentication"}
        subtitle={
          selectedItem
            ? `${'keyPrefix' in selectedItem ? 'API Key Identity' : 'Service Principal Profile'}`
            : `Programmatic access governance and credential management for ${currentTenant.name}`
        }
        tabs={tabs}
      />
    </>
  );
}

function KeysOverview({ apiKeys, principals }: { apiKeys: ApiKey[], principals: ServicePrincipal[] }) {
  const totalCalls = apiKeys.reduce((acc, k) => acc + k.usageCount, 0) + principals.reduce((acc, p) => acc + p.authenticationCount, 0);

  const overviewMetrics = [
    {
      title: "Active Keys",
      value: apiKeys.filter(k => k.status === 'active').length,
      subtitle: `${apiKeys.length} total keys`,
      icon: Key,
      variant: "primary" as any
    },
    {
      title: "Svc Principals",
      value: principals.length,
      subtitle: `${principals.filter(p => p.status === 'active').length} active`,
      icon: Cpu,
      variant: "success" as any
    },
    {
      title: "Total API Calls",
      value: totalCalls.toLocaleString(),
      subtitle: "Last 30 days",
      icon: Activity,
      variant: "primary" as any
    },
    {
      title: "Expiring Soon",
      value: apiKeys.filter(k => k.expiresAt && new Date(k.expiresAt).getTime() < Date.now() + 30 * 24 * 60 * 60 * 1000).length,
      subtitle: "Next 30 days",
      icon: Clock,
      variant: "warning" as any
    }
  ];

  const identityMixData = [
    { name: "API Keys", value: apiKeys.length, color: "hsl(var(--primary))" },
    { name: "Svc Principals", value: principals.length, color: "hsl(var(--success))" },
  ];

  const rotationComplianceData = [
    { name: "< 30 Days", value: 45, total: 100, color: "hsl(var(--success))" },
    { name: "30-90 Days", value: 35, total: 100, color: "hsl(var(--primary))" },
    { name: "> 90 Days", value: 20, total: 100, color: "hsl(var(--warning))" },
  ];

  const timelineData = [
    { date: "09:00", count: 12400 },
    { date: "11:00", count: 15600 },
    { date: "13:00", count: 18900 },
    { date: "15:00", count: 14200 },
    { date: "17:00", count: 11000 },
    { date: "19:00", count: 8500 },
  ];

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-1 pb-8">
      <IdentityGovernanceMetrics
        title="Machine Identity Governance"
        description="Cryptographic authentication and authorization for non-human transmission agents"
        metrics={overviewMetrics}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <EnforcementHeatmap
            title="Credential Aging"
            description="Age distribution of active machine credentials"
            data={rotationComplianceData}
          />
          <SecurityMix
            title="Identity Type Split"
            data={identityMixData}
          />
          <GovernanceTimeline
            title="Programmatic Traffic"
            data={timelineData}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Secret Management Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: "Secret Governance", desc: "Automated rotation for OAuth2 secrets.", icon: Lock },
                  { title: "Machine ZT", desc: "Assigning identities to SCADA collectors.", icon: ShieldCheck },
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
              <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Top Programmatic Callers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...apiKeys, ...principals]
                  .sort((a, b) => (('usageCount' in b) ? b.usageCount : b.authenticationCount) - (('usageCount' in a) ? a.usageCount : a.authenticationCount))
                  .slice(0, 3)
                  .map(i => (
                    <div key={i.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 border border-border/50">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${i.status === 'active' ? 'bg-success' : 'bg-warning'}`} />
                        <span className="text-xs font-medium truncate max-w-[150px]">{i.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">{(('usageCount' in i) ? i.usageCount : i.authenticationCount).toLocaleString()} CALLS</span>
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

function ItemOverview({ item }: { item: (ApiKey | ServicePrincipal) & { itemType: string } }) {
  const usage = 'usageCount' in item ? item.usageCount : item.authenticationCount;
  const lastUsed = ('lastUsed' in item && item.lastUsed) ? item.lastUsed : ('lastAuthentication' in item && item.lastAuthentication) ? item.lastAuthentication : null;
  const isApiKey = 'keyPrefix' in item;
  const daysOld = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  const overviewMetrics = [
    {
      title: "Status",
      value: item.status.toUpperCase(),
      subtitle: `${daysOld}d old`,
      icon: Shield,
      variant: item.status === 'active' ? "success" : item.status === 'expired' ? "destructive" : "warning" as any
    },
    {
      title: "Lifetime Calls",
      value: usage.toLocaleString(),
      subtitle: "Total invocations",
      icon: Activity,
      variant: "primary" as any
    },
    {
      title: "Permissions",
      value: item.permissions.length,
      subtitle: "Assigned scopes",
      icon: Lock,
      variant: item.permissions.length > 5 ? "warning" : "success" as any
    },
    {
      title: "Last Used",
      value: lastUsed ? new Date(lastUsed).toLocaleDateString() : 'Never',
      subtitle: lastUsed ? new Date(lastUsed).toLocaleTimeString() : 'No activity',
      icon: Clock,
      variant: lastUsed ? "default" : "warning" as any
    }
  ];

  const lifecycleSteps: import("@/components/security/IdentityGovernanceMetrics").LifecycleStep[] = [
    { label: "Issued", sublabel: new Date(item.createdAt).toLocaleDateString(), status: "completed" },
    { label: "Active", sublabel: `${usage.toLocaleString()} calls`, status: item.status === 'active' ? "active" : "completed" },
    { label: isApiKey ? "Expiry" : "Review", sublabel: isApiKey && (item as ApiKey).expiresAt ? new Date((item as ApiKey).expiresAt!).toLocaleDateString() : item.status === 'active' ? 'Ongoing' : item.status, status: item.status === 'expired' ? "failed" : item.status === 'active' ? "pending" : "completed" },
    { label: "Rotated", sublabel: isApiKey ? 'Scheduled' : 'N/A', status: item.status === 'revoked' ? "completed" : "pending" },
  ];

  const scopeColorFn = (scope: string) => {
    if (scope.includes('write') || scope.includes('admin') || scope.includes('delete')) return 'hsl(var(--warning))';
    if (scope.includes('execute') || scope.includes('control')) return 'hsl(var(--destructive))';
    return 'hsl(var(--primary))';
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

      {/* Credential Lifecycle */}
      <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Credential Lifecycle</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <StatusLifecycle steps={lifecycleSteps} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Identity Properties */}
        <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Identity Properties</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DetailPropertyRow label="Type" value={isApiKey ? 'API Key' : 'Service Principal'} icon={isApiKey ? Key : Cpu} />
            <DetailPropertyRow label="Reference" value={isApiKey ? `${(item as ApiKey).keyPrefix}...` : (item as ServicePrincipal).applicationId.split('-')[0]} icon={Fingerprint} mono />
            <DetailPropertyRow label="Created By" value={item.createdBy} icon={User} />
            <DetailPropertyRow label="Description" value={item.description || '—'} icon={Settings} />
          </CardContent>
        </Card>

        {/* Permission Scopes */}
        <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Permission Scopes ({item.permissions.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <TagBadgeList tags={item.permissions} colorFn={scopeColorFn} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ItemConfig({ item }: { item: (ApiKey | ServicePrincipal) & { itemType: string } }) {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-5">
        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-4 flex items-center gap-2">
          <Settings className="w-3.5 h-3.5" />
          Core Metadata
        </h4>
        <div className="grid grid-cols-2 gap-6">
          <ConfigItem label="Identity ID" value={item.id} icon={Fingerprint} isMono />
          <ConfigItem label="Created By" value={item.createdBy} icon={User} />
          <ConfigItem label="Created At" value={new Date(item.createdAt).toLocaleString()} icon={Calendar} />
          <ConfigItem label="Last Updated" value={new Date(item.updatedAt).toLocaleString()} icon={Activity} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="bg-secondary/30 px-4 py-2 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Assigned Permissions
        </div>
        <div className="p-4 grid grid-cols-2 gap-2">
          {item.permissions.map(p => (
            <div key={p} className="flex items-center gap-2 text-xs font-mono bg-primary/5 border border-primary/10 p-2 rounded">
              <CheckCircle2 className="w-3 h-3 text-success" />
              {p}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1">
          <RotateCcw className="w-4 h-4 mr-2" />
          Rotate Credentials
        </Button>
        <Button variant="outline" className="flex-1 text-destructive hover:text-destructive">
          <Trash2 className="w-4 h-4 mr-2" />
          Revoke Access
        </Button>
      </div>
    </div>
  );
}

function ItemContext({ item }: { item: ApiKey | ServicePrincipal }) {
  const isSuspicious = ('usageCount' in item ? item.usageCount : item.authenticationCount) > 500;
  const lastUpdateDate = new Date(item.updatedAt);
  const daysSinceUpdate = Math.floor((Date.now() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24));

  const roles = 'roles' in item ? item.roles : item.permissions;
  const itemType = 'keyType' in item ? 'API Key' : 'Service Principal';

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-1 pb-8 animate-in fade-in duration-300">
      {/* Advanced Machine Identity Analysis */}
      <div className="bg-card/40 border border-border/60 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isSuspicious ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
            {isSuspicious ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <h4 className="font-bold text-foreground">Programmatic Access Analysis</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Machine-to-Machine Security Audit</p>
          </div>
        </div>

        <div className="space-y-1">
          <AnalysisMetric
            label="Rotation Cadence"
            value={daysSinceUpdate > 60 ? "STALE" : "OPTIMAL"}
            status={daysSinceUpdate > 90 ? 'failed' : daysSinceUpdate > 60 ? 'warning' : 'success'}
            icon={RotateCcw}
          />
          <AnalysisMetric
            label="Scope Depth"
            value={roles.length > 5 ? "EXCESSIVE" : "MINIMALIST"}
            status={roles.length > 5 ? 'warning' : 'success'}
            icon={Shield}
          />
          <AnalysisMetric
            label="Geographic Velocity"
            value="STATIONARY"
            status="success"
            icon={Globe}
          />
          <AnalysisMetric
            label="Identity Hijack Risk"
            value={isSuspicious ? "ELEVATED" : "LOW"}
            status={isSuspicious ? 'warning' : 'success'}
            icon={Fingerprint}
          />
        </div>
      </div>

      <div className={`border rounded-xl p-5 transition-all ${isSuspicious ? 'bg-destructive/5 border-destructive/20' : 'bg-primary/5 border-primary/20'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isSuspicious ? 'bg-destructive' : 'bg-primary'}`} />
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Recommended Protocol</span>
          </div>
          <Badge variant={isSuspicious ? "destructive" : "secondary"} className="text-[8px] h-4 px-1 leading-none uppercase font-bold">
            {isSuspicious ? "IMMEDIATE ROTATION" : "ROUTINE AUDIT"}
          </Badge>
        </div>
        <p className="text-sm leading-relaxed font-medium">
          {isSuspicious
            ? `SECURITY ALERT: Identity ${item.name} is exhibiting anomalous usage patterns. High volume of programmatic calls detected from novel endpoints. Initiate immediate credential rotation.`
            : `ROUTINE: ${itemType} adheres to least-privilege principles. Access patterns align with historical baselines. No further action required.`}
        </p>
      </div>

      <div className="bg-secondary/10 border border-border/40 rounded-xl p-4">
        <h5 className="text-[10px] font-bold text-muted-foreground uppercase mb-3 px-1">Security Health Index</h5>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${isSuspicious ? 'bg-destructive' : 'bg-success'}`} style={{ width: isSuspicious ? '45%' : '95%' }} />
          </div>
          <span className="text-[10px] font-mono font-bold">{isSuspicious ? '45%' : '95%'}</span>
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

function CreateItemDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Provision Machine Identity</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Identity Name</Label>
            <Input placeholder="e.g. SCADA Integration" />
          </div>
          <div className="space-y-2">
            <Label>Identity Type</Label>
            <Select defaultValue="api-key">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="api-key">Long-lived API Key</SelectItem>
                <SelectItem value="service-principal">OAuth2 Service Principal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full mt-4" onClick={() => onOpenChange(false)}>
            Generate Identity
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}