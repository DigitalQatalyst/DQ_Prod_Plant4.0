import { useState, useMemo, useEffect } from "react";
import { getDirectoryIntegrations } from "@/lib/identityQueries";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Shield,
  Link,
  Users,
  Settings,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Activity,
  Key,
  Building2,
  Globe,
  Server,
  Database,
  RefreshCw,
  Download,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Briefcase,
  GitBranch,
  Zap,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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

// SSO Integration Configuration Interface
interface SsoIntegration {
  id: string;
  tenantId: string;
  name: string;
  type: 'active-directory' | 'azure-ad' | 'ldap' | 'saml' | 'oauth2' | 'openid-connect' | 'okta' | 'google-workspace';
  status: 'active' | 'inactive' | 'testing' | 'error' | 'pending';
  description?: string;
  domain: string;
  serverUrl: string;
  port?: number;
  useSSL: boolean;
  baseDn?: string;
  bindDn?: string;
  userSearchBase?: string;
  groupSearchBase?: string;
  userFilter?: string;
  groupFilter?: string;
  attributeMapping: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    groups: string;
  };
  roleMapping: {
    [key: string]: string; // AD group -> transmission role
  };
  lastSync?: string;
  lastTest?: string;
  testResult?: 'success' | 'failure' | 'warning';
  testMessage?: string;
  syncedUsers: number;
  syncedGroups: number;
  errorCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export function DirectorySsoIntegration() {
  const { currentTenant } = useApp();
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [integrations, setIntegrations] = useState<SsoIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load SSO integrations
  useEffect(() => {
    async function loadIntegrations() {
      try {
        setLoading(true);
        setError(null);
        // In real app, this would fetch from Supabase
        const data = await getDirectoryIntegrations(currentTenant?.id || "");
        setIntegrations(data as any);
      } catch (err) {
        console.error('Failed to load directory integrations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load integrations');
      } finally {
        setLoading(false);
      }
    }

    loadIntegrations();
  }, [currentTenant?.id]);

  // Filter and sort integrations
  const filteredAndSortedIntegrations = useMemo(() => {
    let result = [...integrations];

    // Search
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        (integration) =>
          integration.name.toLowerCase().includes(query) ||
          integration.type.toLowerCase().includes(query) ||
          integration.domain.toLowerCase().includes(query)
      );
    }

    // Status Filter
    if (statusFilter !== "all") {
      result = result.filter(i => {
        const mappedStatus = i.status === 'active' ? 'online' : (i.status === 'error' ? 'offline' : (i.status === 'inactive' ? 'maintenance' : 'pending'));
        return mappedStatus === statusFilter;
      });
    }

    // Type Filter
    if (typeFilter !== "all") {
      result = result.filter(i => i.type === typeFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "type") return a.type.localeCompare(b.type);
      if (sortBy === "users") return b.syncedUsers - a.syncedUsers;
      return 0;
    });

    return result;
  }, [integrations, searchTerm, statusFilter, typeFilter, sortBy]);

  const selectedIntegration = integrations.find((i) => i.id === selectedIntegrationId);

  const tabs = selectedIntegration
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <IntegrationOverview integration={selectedIntegration} />,
      },
      {
        id: "config",
        label: "Configuration",
        content: <IntegrationConfiguration integration={selectedIntegration} />,
      },
      {
        id: "context",
        label: "Identity Context",
        content: <IdentityContext integration={selectedIntegration} />,
      },
      {
        id: "mapping",
        label: "Role Mapping",
        content: <IntegrationMapping integration={selectedIntegration} />,
      },
      {
        id: "sync",
        label: "Sync Status",
        content: <IntegrationSync integration={selectedIntegration} />,
      }
    ]
    : [
      {
        id: "overview",
        label: "Overview",
        content: <DirectoryOverview integrations={integrations} />,
      }
    ];

  if (loading) {
    return <LoadingState loadingText="Loading directory and SSO data..." />;
  }

  return (
    <>
      <ListPane
        title="Directory Integration"
        context="DEWA – Transmission"
        count={filteredAndSortedIntegrations.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "all", label: "All Statuses" },
              { value: "online", label: "Active" },
              { value: "pending", label: "Pending" },
              { value: "maintenance", label: "Inactive" },
              { value: "offline", label: "Error" },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
          {
            key: "type",
            label: "Source Type",
            options: [
              { value: "all", label: "All Types" },
              { value: "active-directory", label: "Active Directory" },
              { value: "azure-ad", label: "Azure AD" },
              { value: "ldap", label: "LDAP" },
              { value: "saml", label: "SAML" },
              { value: "oauth2", label: "OAuth2" },
              { value: "openid-connect", label: "OpenID Connect" },
            ],
            value: typeFilter,
            onChange: setTypeFilter,
          },
        ]}
        sortOptions={[
          { label: "Integration Name", value: "name" },
          { label: "Source Type", value: "type" },
          { label: "Synced Users", value: "users" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedIntegrations.length === 0 ? (
            <EmptyState
              icon={Globe}
              title="No Integrations Found"
              description="No directory integrations match your search"
            />
          ) : (
            filteredAndSortedIntegrations.map((integration) => (
              <ListPaneItem
                key={integration.id}
                title={integration.name}
                description={integration.type.replace(/-/g, ' ')}
                status={integration.status === 'active' ? 'online' : (integration.status === 'error' ? 'offline' : (integration.status === 'inactive' ? 'maintenance' : 'pending'))}
                category={integration.domain}
                value={`${integration.syncedUsers} users`}
                isSelected={selectedIntegrationId === integration.id}
                onClick={() => setSelectedIntegrationId(integration.id)}
              />
            ))
          )}
        </div>
      </ListPane >

      <WorkPane
        title={selectedIntegration ? selectedIntegration.name : "Federated Directory Services"}
        subtitle={
          selectedIntegration
            ? `${selectedIntegration.serverUrl} • Domain: ${selectedIntegration.domain}`
            : `Enterprise identity governance and directory synchronization for ${currentTenant.name}`
        }
        tabs={tabs}
      />
    </>
  );
}

function DirectoryOverview({ integrations }: { integrations: SsoIntegration[] }) {
  const overviewMetrics = [
    {
      title: "Active Sources",
      value: integrations.filter(i => i.status === 'active').length,
      subtitle: `of ${integrations.length} configured`,
      icon: Link,
      variant: "success" as any
    },
    {
      title: "Federated Users",
      value: integrations.reduce((acc, i) => acc + i.syncedUsers, 0).toLocaleString(),
      subtitle: "Across all sources",
      icon: Users,
      variant: "primary" as any
    },
    {
      title: "Directory Errors",
      value: integrations.filter(i => i.status === 'error').length,
      subtitle: "Sync failures",
      icon: AlertTriangle,
      variant: integrations.some(i => i.status === 'error') ? "destructive" : "success" as any
    },
    {
      title: "Avg Latency",
      value: "142ms",
      subtitle: "Authentication speed",
      icon: Zap,
      variant: "primary" as any
    }
  ];

  const integrationMixData = [
    { name: "Active Dir", value: integrations.filter(i => i.type === 'active-directory').length, color: "hsl(var(--primary))" },
    { name: "Okta", value: integrations.filter(i => i.type === 'okta').length, color: "hsl(var(--success))" },
    { name: "Azure AD", value: integrations.filter(i => i.type === 'azure-ad').length, color: "hsl(var(--warning))" },
    { name: "Google", value: integrations.filter(i => i.type === 'google-workspace').length, color: "hsl(var(--destructive))" },
  ];

  const syncIntegrityData = [
    { name: "User Sync", value: 98.4, total: 100, color: "hsl(var(--success))" },
    { name: "Group Map", value: 85.2, total: 100, color: "hsl(var(--primary))" },
    { name: "Attr Sync", value: 92.1, total: 100, color: "hsl(var(--warning))" },
  ];

  const timelineData = [
    { date: "00:00", count: 1240 },
    { date: "04:00", count: 850 },
    { date: "08:00", count: 4200 },
    { date: "12:00", count: 5120 },
    { date: "16:00", count: 4800 },
    { date: "20:00", count: 2100 },
  ];

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-1 pb-8">
      <IdentityGovernanceMetrics
        title="Directory Governance"
        description="Centralized synchronization and identity federation for distributed transmission teams"
        metrics={overviewMetrics}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <EnforcementHeatmap
            title="Sync Integrity"
            description="Success rates for various synchronization protocols"
            data={syncIntegrityData}
          />
          <SecurityMix
            title="Integration Landscape"
            data={integrationMixData}
          />
          <GovernanceTimeline
            title="Authentication Load"
            data={timelineData}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Federation Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: "Multi-Cloud Bridge", desc: "Syncing on-prem AD with Azure & AWS.", icon: Globe },
                  { title: "SAML 2.0 / OIDC", desc: "Modern web-scale authentication protocols.", icon: Activity },
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
              <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Recent Sync Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {integrations
                  .sort((a, b) => new Date(b.lastSync || 0).getTime() - new Date(a.lastSync || 0).getTime())
                  .slice(0, 3)
                  .map(i => (
                    <div key={i.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 border border-border/50">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${i.status === 'active' ? 'bg-success' : 'bg-warning'}`} />
                        <span className="text-xs font-medium truncate max-w-[150px]">{i.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">{i.syncedUsers} USERS</span>
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

function IntegrationOverview({ integration }: { integration: SsoIntegration }) {
  const totalEntities = integration.syncedUsers + integration.syncedGroups;
  const healthPct = totalEntities > 0 ? Math.round((totalEntities / (totalEntities + integration.errorCount)) * 100) : 100;

  const overviewMetrics = [
    {
      title: "Status",
      value: integration.status.toUpperCase(),
      subtitle: `${integration.type.toUpperCase()} protocol`,
      icon: Activity,
      variant: integration.status === 'active' ? "success" : integration.status === 'error' ? "destructive" : "warning" as any
    },
    {
      title: "Synced Users",
      value: integration.syncedUsers.toLocaleString(),
      subtitle: `+ ${integration.syncedGroups} groups`,
      icon: Users,
      variant: "primary" as any
    },
    {
      title: "Sync Health",
      value: `${healthPct}%`,
      subtitle: integration.errorCount > 0 ? `${integration.errorCount} errors` : 'No errors',
      icon: AlertTriangle,
      variant: integration.errorCount > 0 ? "warning" : "success" as any
    },
    {
      title: "Last Sync",
      value: integration.lastSync ? new Date(integration.lastSync).toLocaleDateString() : "Never",
      subtitle: integration.lastSync ? new Date(integration.lastSync).toLocaleTimeString() : 'Not synced',
      icon: RefreshCw,
      variant: "default" as any
    }
  ];

  const syncHealthData: import("@/components/security/IdentityGovernanceMetrics").LifecycleStep[] = [
    { label: "Discovery", sublabel: "Schema mapped", status: integration.status !== 'pending' ? "completed" : "pending" },
    { label: "Auth", sublabel: integration.useSSL ? "TLS Bound" : "Plain Bind", status: integration.status === 'active' || integration.status === 'testing' ? "completed" : integration.status === 'error' ? "failed" : "pending" },
    { label: "Sync", sublabel: integration.lastSync ? "Completed" : "Pending", status: integration.lastSync ? "completed" : "pending" },
    { label: "Active", sublabel: integration.status === 'active' ? "Live" : integration.status, status: integration.status === 'active' ? "active" : integration.status === 'error' ? "failed" : "pending" },
  ];

  const roleMappings = Object.entries(integration.roleMapping).slice(0, 6);

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

      {/* Integration Lifecycle */}
      <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Integration Status</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <StatusLifecycle steps={syncHealthData} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Connection Properties */}
        <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Connection Properties</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DetailPropertyRow label="Server" value={integration.serverUrl} icon={Server} mono />
            <DetailPropertyRow label="Port" value={integration.port?.toString() || 'Default'} icon={Globe} />
            <DetailPropertyRow label="Security" value={integration.useSSL ? 'TLS Enabled' : 'Plaintext'} icon={Shield} variant={integration.useSSL ? 'success' : 'warning'} />
            <DetailPropertyRow label="Base DN" value={integration.baseDn || 'Not set'} icon={Database} mono />
            <DetailPropertyRow label="Bind DN" value={integration.bindDn || 'Anonymous'} icon={Key} mono />
          </CardContent>
        </Card>

        {/* Role Mappings */}
        <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Role Mappings ({Object.keys(integration.roleMapping).length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {roleMappings.length === 0
                ? <p className="text-xs text-muted-foreground italic">No role mappings configured</p>
                : roleMappings.map(([group, role], i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 border border-border/40">
                    <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[55%]">{group.split(',')[0].replace('CN=', '')}</span>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">{role}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function IntegrationConfiguration({ integration }: { integration: SsoIntegration }) {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-5">
        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-4 flex items-center gap-2">
          <Settings className="w-3.5 h-3.5" />
          Core Connection Properties
        </h4>
        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
          <ConfigItem label="Server URL" value={integration.serverUrl} icon={Server} />
          <ConfigItem label="Port" value={integration.port?.toString() || "Default"} icon={Activity} />
          <ConfigItem label="Base DN" value={integration.baseDn || "N/A"} icon={Database} isMono />
          <ConfigItem label="Bind DN" value={integration.bindDn || "N/A"} icon={Key} isMono />
          <ConfigItem label="User Search" value={integration.userSearchBase || "N/A"} icon={Users} isMono />
          <ConfigItem label="Group Search" value={integration.groupSearchBase || "N/A"} icon={Building2} isMono />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="bg-secondary/30 px-4 py-2 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Attribute Mapping Schema
        </div>
        <div className="divide-y divide-border">
          {Object.entries(integration.attributeMapping).map(([key, value]) => (
            <div key={key} className="px-4 py-3 flex items-center justify-between hover:bg-secondary/10 transition-colors">
              <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <span className="text-xs font-mono text-primary bg-primary/5 px-1.5 py-0.5 rounded">{value}</span>
            </div>
          ))}
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
      <p className={`text-sm ${isMono ? 'font-mono text-xs truncate max-w-[200px]' : 'font-medium'}`}>{value}</p>
    </div>
  );
}

function IntegrationSync({ integration }: { integration: SsoIntegration }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-xl font-bold text-success">{integration.syncedUsers}</p>
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Users Synced</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-xl font-bold text-primary">{integration.syncedGroups}</p>
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Groups Synced</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-xl font-bold text-destructive">{integration.errorCount}</p>
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Failed Entities</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold">Synchronization Lifecycle</h4>
          <Button size="sm" variant="outline">
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Trigger manual sync
          </Button>
        </div>

        <div className="space-y-3">
          <SyncStep label="Last Execution" value={integration.lastSync ? new Date(integration.lastSync).toLocaleString() : "Never"} status="completed" />
          <SyncStep label="Last Connection Test" value={integration.lastTest ? new Date(integration.lastTest).toLocaleString() : "Never"} status={integration.testResult === 'success' ? 'completed' : 'failed'} />
          <SyncStep label="Next Scheduled Sync" value="Daily at 02:00 AM" status="pending" />
        </div>
      </div>
    </div>
  );
}

function SyncStep({ label, value, status }: { label: string; value: string; status: 'completed' | 'pending' | 'failed' }) {
  return (
    <div className="flex items-center justify-between p-2 rounded hover:bg-secondary/20 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${status === 'completed' ? 'bg-success' : status === 'failed' ? 'bg-destructive' : 'bg-warning'}`} />
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-xs text-muted-foreground font-medium">{value}</span>
    </div>
  );
}

function IntegrationMapping({ integration }: { integration: SsoIntegration }) {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-5">
        <h4 className="text-sm font-semibold mb-4 flex items-center justify-between">
          Role Mapping Definitions
          <Button size="sm" variant="outline">
            <Users className="w-3.5 h-3.5 mr-2" />
            Add Mapping
          </Button>
        </h4>

        <div className="space-y-3">
          {Object.entries(integration.roleMapping).map(([group, role], i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-secondary/20 border border-border rounded-lg group">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Directory Group</p>
                <p className="text-sm font-mono truncate">{group}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Operational Role</p>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="capitalize">{role.replace(/-/g, ' ')}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IdentityContext({ integration }: { integration: SsoIntegration }) {
  const isHealthy = integration.status === 'active' && (integration.errorCount || 0) === 0;
  const syncLag = integration.lastSync ? Math.floor((Date.now() - new Date(integration.lastSync).getTime()) / (1000 * 60)) : Infinity;

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-1 pb-8 animate-in fade-in duration-300">
      {/* Advanced Identity Heuristics */}
      <div className="bg-card/40 border border-border/60 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${!isHealthy ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
            {!isHealthy ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <h4 className="font-bold text-foreground">Identity Protocol Analysis</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">SSO Integrity Verification System</p>
          </div>
        </div>

        <div className="space-y-1">
          <AnalysisMetric
            label="Sync Integrity"
            value={integration.errorCount && integration.errorCount > 0 ? `${integration.errorCount} FAILURES` : "SYNCHRONIZED"}
            status={integration.errorCount && integration.errorCount > 0 ? 'failed' : 'success'}
            icon={Activity}
          />
          <AnalysisMetric
            label="Protocol Strength"
            value={integration.type === 'oauth2' || integration.type === 'openid-connect' || integration.type === 'active-directory' ? "ENTERPRISE GRADE" : "STANDARD"}
            status="success"
            icon={Key}
          />
          <AnalysisMetric
            label="Domain Trust"
            value={`VERIFIED: ${integration.domain}`}
            status="success"
            icon={Globe}
          />
          <AnalysisMetric
            label="User Gravity"
            value={`${integration.syncedUsers} IDENTITIES`}
            status={integration.syncedUsers > 500 ? 'warning' : 'success'}
            icon={Users}
          />
          <AnalysisMetric
            label="Temporal Alignment"
            value={syncLag < 60 ? "LIVE" : `${syncLag}m DRIFT`}
            status={syncLag < 60 ? 'success' : 'warning'}
            icon={Clock}
          />
        </div>
      </div>

      <div className={`border rounded-xl p-5 transition-all ${!isHealthy ? 'bg-destructive/5 border-destructive/20' : 'bg-primary/5 border-primary/20'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${!isHealthy ? 'bg-destructive' : 'bg-primary'}`} />
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Recommended Protocol</span>
          </div>
          <Badge variant={!isHealthy ? "destructive" : "secondary"} className="text-[8px] h-4 px-1 leading-none uppercase font-bold">
            {!isHealthy ? "IMMEDIATE RE-SYNC" : "NOMINAL OPERATION"}
          </Badge>
        </div>
        <p className="text-sm leading-relaxed font-medium">
          {!isHealthy
            ? `SECURITY ALERT: Directory synchronization for ${integration.name} has encountered critical failures. Authentication tokens may be stale. Manual re-synchronization and domain verification required.`
            : `ROUTINE: ${integration.type.toUpperCase()} integration is operating within standard parameters. Identity mapping aligns with current organizational hierarchy. No administrative action required.`}
        </p>
      </div>

      <div className="bg-secondary/10 border border-border/40 rounded-xl p-4">
        <h5 className="text-[10px] font-bold text-muted-foreground uppercase mb-3 px-1">Integration Health Score</h5>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${!isHealthy ? 'bg-destructive' : 'bg-success'}`} style={{ width: !isHealthy ? '65%' : '98%' }} />
          </div>
          <span className="text-[10px] font-mono font-bold">{!isHealthy ? '65%' : '98%'}</span>
        </div>
      </div>
    </div>
  );
}

