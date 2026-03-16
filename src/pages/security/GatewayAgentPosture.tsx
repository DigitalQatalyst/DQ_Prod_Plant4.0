import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard } from "@/components/shared/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Shield,
  Network,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  HardDrive,
  Wifi,
  Lock,
  Zap,
  MapPin,
  Server,
  RefreshCw,
} from "lucide-react";
import {
  getUpstreamSitesByTenant,
  getSecurityZonesByTenant,
} from "@/data/upstreamSecurityMockData";
import type { FieldGateway } from "@/types/security";

import {
  getOTAssetSecurityWithAssets,
  getSecurityZones,
} from "@/lib/otSecurityQueries";
import { getDataBackend } from "@/lib/supabase";
import {
  PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer,
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  Cell as RechartsCell
} from "recharts";

export function GatewayAgentPosture() {
  const { currentTenant } = useApp();
  const [selectedGateway, setSelectedGateway] = useState<FieldGateway | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("status");

  // State for data
  const [gateways, setGateways] = useState<FieldGateway[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [assetsData, zonesData] = await Promise.all([
          getOTAssetSecurityWithAssets(currentTenant.id),
          getSecurityZones(currentTenant.id)
        ]);

        // Filter for gateways and agents
        const gatewayAssets: FieldGateway[] = assetsData
          .filter(asset => {
            const assetType = (asset.asset as any)?.properties?.type?.toLowerCase();
            return assetType && (assetType.includes('gateway') || assetType.includes('concentrator') || assetType === 'rtu' || assetType.includes('agent'));
          })
          .map(asset => ({
            id: asset.id,
            tenantId: asset.tenantId,
            siteId: (asset.asset as any)?.siteId || '',
            name: (asset.asset as any)?.name || 'Unknown Gateway',
            type: ((asset.asset as any)?.properties?.type as any) || 'edge-gateway',
            manufacturer: asset.manufacturer || 'Unknown',
            model: asset.model || 'Unknown',
            firmwareVersion: asset.firmwareVersion || 'Unknown',
            latestFirmware: 'Latest', // Mock or extend schema
            patchStatus: asset.patchStatus as any,
            hardeningScore: asset.riskScore ? (100 - asset.riskScore) : 0, // Invert risk for hardening
            connectedDevices: (asset.metadata as any)?.connectedDevices || 0,
            protocols: (asset.metadata as any)?.protocols || [],
            lastSeen: asset.lastSecurityScan || new Date().toISOString(),
            securityStatus: asset.securityStatus as any,
            vulnerabilities: asset.vulnerabilityCount || 0,
            certificateExpiry: (asset.metadata as any)?.certificateExpiry,
          }));

        setGateways(gatewayAssets);
        setZones(zonesData);

        // Extract sites from assets
        const uniqueSites: any[] = [];
        const seenSiteIds = new Set();
        assetsData.forEach(a => {
          const siteId = (a.asset as any)?.siteId;
          const siteName = (a.asset as any)?.properties?.siteName;
          if (siteId && !seenSiteIds.has(siteId)) {
            seenSiteIds.add(siteId);
            uniqueSites.push({ id: siteId, name: siteName || 'Unknown Site' });
          }
        });
        setSites(uniqueSites);

      } catch (err) {
        console.error('Error loading gateway security data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');

        // Fallback to mock logic if needed
        if (getDataBackend() === 'mock') {
          // Keep existing mock logic here if strictly needed, but let's try to stick to Supabase
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentTenant.id]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Filter and sort gateways
  const filteredAndSortedGateways = useMemo(() => {
    let result = gateways.filter((gateway) => {
      const matchesSearch =
        (gateway.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (gateway.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (gateway.manufacturer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (gateway.model || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || gateway.securityStatus === statusFilter;
      const matchesType = typeFilter === "all" || gateway.type === typeFilter;
      const matchesSite = siteFilter === "all" || gateway.siteId === siteFilter;

      return matchesSearch && matchesStatus && matchesType && matchesSite;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'status': {
          const statusOrder: Record<string, number> = { vulnerable: 0, 'at-risk': 1, secure: 2 };
          const statusDiff = (statusOrder[a.securityStatus] ?? 3) - (statusOrder[b.securityStatus] ?? 3);
          if (statusDiff !== 0) return statusDiff;
          return (a.name || '').localeCompare(b.name || '');
        }
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'score':
          return b.hardeningScore - a.hardeningScore;
        case 'devices':
          return b.connectedDevices - a.connectedDevices;
        case 'lastSeen':
          return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [gateways, searchTerm, statusFilter, typeFilter, siteFilter, sortBy]);

  const selectedGatewayData = useMemo(() => {
    if (!selectedGateway) return null;

    const site = sites.find(s => s.id === selectedGateway.siteId);
    const siteZones = zones.filter((z: any) => z.siteId === selectedGateway.siteId);

    return {
      site,
      zones: siteZones,
    };
  }, [selectedGateway, sites, zones]);

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "secure", label: "Secure" },
    { value: "at-risk", label: "At Risk" },
    { value: "vulnerable", label: "Vulnerable" },
  ];

  const typeOptions = [
    { value: "all", label: "All Types" },
    { value: "scada-gateway", label: "SCADA Gateway" },
    { value: "rtu-concentrator", label: "RTU Concentrator" },
    { value: "protocol-converter", label: "Protocol Converter" },
    { value: "edge-gateway", label: "Edge Gateway" },
  ];

  const siteOptions = [
    { value: "all", label: "All Sites" },
    ...sites.map(site => ({ value: site.id, label: site.name }))
  ];

  const filters = [
    {
      key: "status",
      label: "Security Status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: statusOptions,
    },
    {
      key: "type",
      label: "Gateway Type",
      value: typeFilter,
      onChange: setTypeFilter,
      options: typeOptions,
    },
    {
      key: "site",
      label: "Site",
      value: siteFilter,
      onChange: setSiteFilter,
      options: siteOptions,
    },
  ];

  const tabs = selectedGateway ? [
    {
      id: "overview",
      label: "Gateway Overview",
      content: <GatewayOverview gateway={selectedGateway} data={selectedGatewayData} />,
    },
    {
      id: "health",
      label: "Health & Status",
      content: <GatewayHealth gateway={selectedGateway} />,
    },
    {
      id: "security",
      label: "Security Posture",
      content: <GatewaySecurity gateway={selectedGateway} />,
    },
    {
      id: "configuration",
      label: "Configuration",
      content: <GatewayConfiguration gateway={selectedGateway} data={selectedGatewayData} />,
    },
  ] : [
    {
      id: "overview",
      label: "Overview",
      content: <GatewaysOverview gateways={gateways} />,
    },
  ];

  // Calculate summary stats
  const vulnerableGateways = gateways.filter(g => g.securityStatus === 'vulnerable').length;
  const atRiskGateways = gateways.filter(g => g.securityStatus === 'at-risk').length;
  const overduePatches = gateways.filter(g => g.patchStatus === 'overdue').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingState loadingText="Loading gateway security data..." />
      </div>
    );
  }

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane
        title="Transmission Gateways"
        context="DEWA – Transmission"
        count={filteredAndSortedGateways.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "status",
            label: "Security Status",
            options: [
              { value: "all", label: "All Status" },
              { value: "secure", label: "Secure" },
              { value: "at-risk", label: "At Risk" },
              { value: "vulnerable", label: "Vulnerable" },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
          {
            key: "type",
            label: "Gateway Type",
            options: [
              { value: "all", label: "All Types" },
              { value: "scada-gateway", label: "SCADA Gateway" },
              { value: "rtu-concentrator", label: "RTU Concentrator" },
              { value: "protocol-converter", label: "Protocol Converter" },
              { value: "edge-gateway", label: "Edge Gateway" },
            ],
            value: typeFilter,
            onChange: setTypeFilter,
          },
          {
            key: "site",
            label: "Site",
            options: [
              { value: "all", label: "All Sites" },
              ...sites.map(site => ({ value: site.id, label: site.name }))
            ],
            value: siteFilter,
            onChange: setSiteFilter,
          },
        ]}
        sortOptions={[
          { label: 'Security Status', value: 'status' },
          { label: 'Gateway Name', value: 'name' },
          { label: 'Hardening Score', value: 'score' },
          { label: 'Connected Devices', value: 'devices' },
          { label: 'Last Seen', value: 'lastSeen' },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
        actions={selectedGateway ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs flex items-center gap-1.5 hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => setSelectedGateway(null)}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Back to Overview
          </Button>
        ) : null}
      >
        <div className="space-y-1">
          {filteredAndSortedGateways.length === 0 ? (
            <EmptyState
              icon={Server}
              title="No Gateways Found"
              description="No gateways match the selected filters"
            />
          ) : (
            filteredAndSortedGateways.map((gateway) => (
              <ListPaneItem
                key={gateway.id}
                title={gateway.name}
                description={`${gateway.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} • ${gateway.manufacturer}`}
                status={gateway.securityStatus === 'secure' ? 'online' : (gateway.securityStatus === 'at-risk' ? 'maintenance' : 'offline')}
                category={gateway.type.toUpperCase()}
                value={`Score: ${gateway.hardeningScore}`}
                isSelected={selectedGateway?.id === gateway.id}
                onClick={() => setSelectedGateway(gateway)}
              />
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedGateway ? selectedGateway.name : "Gateways Overview"}
        subtitle={
          selectedGateway && selectedGatewayData?.site
            ? `${selectedGateway.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} • ${selectedGatewayData.site.name}`
            : `${gateways.length} transmission gateways monitored`
        }
        tabs={tabs}
      />
    </div>
  );
}

function GatewaysOverview({ gateways }: { gateways: FieldGateway[] }) {
  // Calculate aggregate metrics
  const totalGateways = gateways.length;
  const secureGateways = gateways.filter(g => g.securityStatus === 'secure').length;
  const atRiskGateways = gateways.filter(g => g.securityStatus === 'at-risk').length;
  const vulnerableGateways = gateways.filter(g => g.securityStatus === 'vulnerable').length;
  const totalVulnerabilities = gateways.reduce((sum, g) => sum + g.vulnerabilities, 0);
  const overduePatches = gateways.filter(g => g.patchStatus === 'overdue').length;
  const avgHardeningScore = gateways.length > 0
    ? Math.round(gateways.reduce((sum, g) => sum + g.hardeningScore, 0) / gateways.length)
    : 0;

  // Gateways by type for chart
  const gatewaysByType = gateways.reduce((acc, gateway) => {
    const type = gateway.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Top vulnerable gateways
  const topVulnerableGateways = [...gateways]
    .filter(g => g.vulnerabilities > 0)
    .sort((a, b) => b.vulnerabilities - a.vulnerabilities)
    .slice(0, 5);

  // Prepare chart data
  const statusData = [
    { name: 'Secure', value: secureGateways, color: 'hsl(var(--success))' },
    { name: 'At Risk', value: atRiskGateways, color: 'hsl(var(--warning))' },
    { name: 'Vulnerable', value: vulnerableGateways, color: 'hsl(var(--destructive))' },
  ].filter(d => d.value > 0);

  const typeData = Object.entries(gatewaysByType)
    .map(([type, count]) => ({
      name: type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      value: count
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
      {/* Security Status Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Security Status Distribution
        </h4>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
              <Legend layout="vertical" align="right" verticalAlign="middle" />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gateways by Type Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" />
          Gateways by Type
        </h4>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={typeData} layout="vertical" margin={{ left: 80, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
              <XAxis type="number" hide domain={[0, 'auto']} />
              <YAxis
                dataKey="name"
                type="category"
                width={150}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip
                cursor={{ fill: 'hsl(var(--muted)/0.1)' }}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {typeData.map((_entry, index) => (
                  <RechartsCell key={`cell-${index}`} fill={`hsl(var(--primary) / ${1 - index * 0.15})`} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Security Areas */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Key Security Areas
        </h4>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Firmware Management</p>
              <p className="text-xs text-muted-foreground">Keep gateway firmware up-to-date with security patches.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Network className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Network Segmentation</p>
              <p className="text-xs text-muted-foreground">Isolate critical gateways from less secure networks.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Configuration Hardening</p>
              <p className="text-xs text-muted-foreground">Apply security best practices to gateway configurations.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gateways Requiring Attention */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary" />
          Gateways Requiring Attention
        </h4>
        <div className="space-y-4">
          {topVulnerableGateways.length > 0 ? (
            topVulnerableGateways.map((gateway) => (
              <div
                key={gateway.id}
                className="group flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${gateway.securityStatus === 'vulnerable' ? 'bg-destructive' : 'bg-warning'}`} />
                  <span className="text-sm font-medium truncate max-w-[150px]">{gateway.name}</span>
                </div>
                <span className="text-xs font-bold text-destructive">{gateway.vulnerabilities} vuln</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic">All gateways are secure with no critical vulnerabilities.</p>
          )}
          <div className="pt-2 border-t border-border mt-2">
            <p className="text-xs text-muted-foreground italic">Select a gateway from the list to view detailed security posture and configuration.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GatewayOverview({ gateway, data }: { gateway: FieldGateway; data: any }) {
  if (!data) return null;

  const daysUntilCertExpiry = gateway.certificateExpiry
    ? Math.floor((new Date(gateway.certificateExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6">
      {/* Gateway KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Security Status"
          value={gateway.securityStatus}
          subtitle={`Hardening score: ${gateway.hardeningScore}`}
          icon={Shield}
          variant={
            gateway.securityStatus === "secure"
              ? "success"
              : gateway.securityStatus === "at-risk"
                ? "warning"
                : "destructive"
          }
        />
        <KPICard
          title="Connected Devices"
          value={gateway.connectedDevices}
          subtitle="Active connections"
          icon={Network}
          variant="primary"
        />
        <KPICard
          title="Vulnerabilities"
          value={gateway.vulnerabilities}
          subtitle={gateway.vulnerabilities === 0 ? "No issues" : "Requires attention"}
          icon={gateway.vulnerabilities > 0 ? AlertTriangle : CheckCircle2}
          variant={gateway.vulnerabilities > 0 ? "destructive" : "success"}
        />
        <KPICard
          title="Patch Status"
          value={gateway.patchStatus}
          subtitle={`Current: ${gateway.firmwareVersion}`}
          icon={RefreshCw}
        />
      </div>

      {/* Gateway Information */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Gateway Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium">
                {gateway.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Manufacturer:</span>
              <span>{gateway.manufacturer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model:</span>
              <span>{gateway.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Firmware:</span>
              <span className="font-mono text-xs">{gateway.firmwareVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Latest Available:</span>
              <span className="font-mono text-xs">{gateway.latestFirmware}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Site:</span>
              <span>{data.site?.name}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Network & Protocols</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Supported Protocols</p>
              <div className="flex flex-wrap gap-2">
                {gateway.protocols.map((protocol, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 rounded bg-primary/10 text-primary"
                  >
                    {protocol}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Connected Devices</p>
              <p className="text-2xl font-bold">{gateway.connectedDevices}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Last Seen</p>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-success" />
                <p className="text-sm">{new Date(gateway.lastSeen).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Status */}
      {gateway.certificateExpiry && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Certificate Status</h3>
          <div className="flex items-center gap-4">
            <Lock className={`w-8 h-8 ${daysUntilCertExpiry && daysUntilCertExpiry < 30 ? 'text-destructive' :
              daysUntilCertExpiry && daysUntilCertExpiry < 60 ? 'text-warning' : 'text-success'
              }`} />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Certificate expires in {daysUntilCertExpiry} days
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Expiry date: {new Date(gateway.certificateExpiry).toLocaleDateString()}
              </p>
              {daysUntilCertExpiry && daysUntilCertExpiry < 30 && (
                <p className="text-xs text-destructive mt-2">
                  ⚠️ Certificate renewal required soon
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Security Zones */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Associated Security Zones</h4>
        <div className="grid gap-3">
          {data.zones.slice(0, 3).map((zone: any) => (
            <div key={zone.id} className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{zone.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Level {zone.securityLevel} • {zone.assetCount} assets
                    </p>
                  </div>
                </div>
                <StatusBadge
                  status={zone.complianceStatus}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GatewayHealth({ gateway }: { gateway: FieldGateway }) {
  // Mock health metrics
  const healthMetrics = {
    cpuUsage: 45 + Math.floor(Math.random() * 30),
    memoryUsage: 60 + Math.floor(Math.random() * 25),
    diskUsage: 35 + Math.floor(Math.random() * 40),
    networkThroughput: 125 + Math.floor(Math.random() * 200),
    uptime: 45 + Math.floor(Math.random() * 300), // days
    packetLoss: Math.random() * 2,
    latency: 5 + Math.floor(Math.random() * 15),
  };

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div>
        <h4 className="text-sm font-semibold mb-3">System Health</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-primary" />
              <p className="text-xs font-medium">CPU Usage</p>
            </div>
            <p className="text-2xl font-bold">{healthMetrics.cpuUsage}%</p>
            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${healthMetrics.cpuUsage > 80 ? 'bg-destructive' :
                  healthMetrics.cpuUsage > 60 ? 'bg-warning' : 'bg-success'
                  }`}
                style={{ width: `${healthMetrics.cpuUsage}%` }}
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-primary" />
              <p className="text-xs font-medium">Memory Usage</p>
            </div>
            <p className="text-2xl font-bold">{healthMetrics.memoryUsage}%</p>
            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${healthMetrics.memoryUsage > 80 ? 'bg-destructive' :
                  healthMetrics.memoryUsage > 60 ? 'bg-warning' : 'bg-success'
                  }`}
                style={{ width: `${healthMetrics.memoryUsage}%` }}
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-primary" />
              <p className="text-xs font-medium">Disk Usage</p>
            </div>
            <p className="text-2xl font-bold">{healthMetrics.diskUsage}%</p>
            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${healthMetrics.diskUsage > 80 ? 'bg-destructive' :
                  healthMetrics.diskUsage > 60 ? 'bg-warning' : 'bg-success'
                  }`}
                style={{ width: `${healthMetrics.diskUsage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Network Performance */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Network Performance</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="w-4 h-4 text-success" />
              <p className="text-xs font-medium">Throughput</p>
            </div>
            <p className="text-2xl font-bold">{healthMetrics.networkThroughput}</p>
            <p className="text-xs text-muted-foreground mt-1">Mbps</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-primary" />
              <p className="text-xs font-medium">Latency</p>
            </div>
            <p className="text-2xl font-bold">{healthMetrics.latency}</p>
            <p className="text-xs text-muted-foreground mt-1">ms average</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <p className="text-xs font-medium">Packet Loss</p>
            </div>
            <p className="text-2xl font-bold">{healthMetrics.packetLoss.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {healthMetrics.packetLoss < 1 ? 'Normal' : 'Elevated'}
            </p>
          </div>
        </div>
      </div>

      {/* Uptime & Availability */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Uptime & Availability</h3>
        <div className="flex items-center gap-4">
          <Clock className="w-8 h-8 text-success" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {healthMetrics.uptime} days uptime
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              99.{Math.floor(95 + Math.random() * 4)}% availability
            </p>
            <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full" style={{ width: '99.9%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Recent Health Events</h4>
        <div className="space-y-2">
          {gateway.vulnerabilities > 0 && (
            <div className="bg-card border border-destructive/20 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    {gateway.vulnerabilities} Vulnerabilities Detected
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Security scan completed {Math.floor(Math.random() * 24)} hours ago
                  </p>
                </div>
              </div>
            </div>
          )}

          {gateway.patchStatus === 'overdue' && (
            <div className="bg-card border border-warning/20 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <RefreshCw className="w-4 h-4 text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning">Firmware Update Available</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Version {gateway.latestFirmware} available (current: {gateway.firmwareVersion})
                  </p>
                </div>
              </div>
            </div>
          )}

          {healthMetrics.cpuUsage > 80 && (
            <div className="bg-card border border-warning/20 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <Cpu className="w-4 h-4 text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning">High CPU Usage</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    CPU usage at {healthMetrics.cpuUsage}% - consider load balancing
                  </p>
                </div>
              </div>
            </div>
          )}

          {gateway.securityStatus === 'secure' && gateway.vulnerabilities === 0 && gateway.patchStatus === 'up-to-date' && (
            <div className="bg-card border border-success/20 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-success">All Systems Operational</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No health issues detected
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GatewaySecurity({ gateway }: { gateway: FieldGateway }) {
  // Mock security findings
  const securityFindings = gateway.vulnerabilities > 0 ? [
    {
      id: 'vuln-1',
      severity: 'high',
      title: 'Outdated SSL/TLS Configuration',
      description: 'Gateway is using deprecated TLS 1.0 protocol',
      remediation: 'Update to TLS 1.2 or higher',
      cvss: 7.5,
    },
    {
      id: 'vuln-2',
      severity: 'medium',
      title: 'Weak Authentication Configuration',
      description: 'Password complexity requirements not enforced',
      remediation: 'Enable strong password policy',
      cvss: 5.3,
    },
    {
      id: 'vuln-3',
      severity: 'low',
      title: 'Unnecessary Services Running',
      description: 'Telnet service is enabled but not required',
      remediation: 'Disable unused network services',
      cvss: 3.1,
    },
  ].slice(0, gateway.vulnerabilities) : [];

  return (
    <div className="space-y-6">
      {/* Security Hardening Score */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-semibold mb-4">Security Hardening Score</h3>
        <div className="flex items-center gap-4">
          <div className={`w-20 h-20 rounded-lg flex items-center justify-center ${gateway.hardeningScore >= 80 ? 'bg-success/10' :
            gateway.hardeningScore >= 60 ? 'bg-warning/10' : 'bg-destructive/10'
            }`}>
            <span className={`text-3xl font-bold ${gateway.hardeningScore >= 80 ? 'text-success' :
              gateway.hardeningScore >= 60 ? 'text-warning' : 'text-destructive'
              }`}>
              {gateway.hardeningScore}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-2">
              {gateway.hardeningScore >= 80 ? 'Strong Security Posture' :
                gateway.hardeningScore >= 60 ? 'Moderate Security Posture' : 'Weak Security Posture'}
            </p>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${gateway.hardeningScore >= 80 ? 'bg-success' :
                  gateway.hardeningScore >= 60 ? 'bg-warning' : 'bg-destructive'
                  }`}
                style={{ width: `${gateway.hardeningScore}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on IEC 62443 security level requirements
            </p>
          </div>
        </div>
      </div>

      {/* Security Metrics */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Security Metrics</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <p className="text-xs font-medium">Vulnerabilities</p>
            </div>
            <p className="text-2xl font-bold">{gateway.vulnerabilities}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {gateway.vulnerabilities === 0 ? 'No vulnerabilities' : 'Requires remediation'}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-primary" />
              <p className="text-xs font-medium">Patch Status</p>
            </div>
            <p className="text-sm font-medium mt-1">
              <StatusBadge
                status={gateway.patchStatus}
              />
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {gateway.patchStatus === 'up-to-date' ? 'All patches applied' :
                gateway.patchStatus === 'pending' ? 'Updates available' : 'Critical updates overdue'}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-success" />
              <p className="text-xs font-medium">Encryption</p>
            </div>
            <p className="text-sm font-medium mt-1">
              <StatusBadge status="enabled" />
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              All protocols encrypted
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <p className="text-xs font-medium">Access Control</p>
            </div>
            <p className="text-sm font-medium mt-1">
              <StatusBadge status="enforced" />
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Role-based access active
            </p>
          </div>
        </div>
      </div>

      {/* Security Findings */}
      <div>
        <h4 className="text-sm font-semibold mb-3">
          Security Findings ({securityFindings.length})
        </h4>
        {securityFindings.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
            <p className="text-sm font-medium">No Security Issues</p>
            <p className="text-xs text-muted-foreground mt-1">
              Gateway passes all security checks
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {securityFindings.map((finding) => (
              <div
                key={finding.id}
                className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={`w-4 h-4 ${finding.severity === "high"
                        ? "text-destructive"
                        : finding.severity === "medium"
                          ? "text-warning"
                          : "text-primary"
                        }`}
                    />
                    <h5 className="text-sm font-medium">{finding.title}</h5>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${finding.severity === "high"
                      ? "bg-destructive/10 text-destructive"
                      : finding.severity === "medium"
                        ? "bg-warning/10 text-warning"
                        : "bg-primary/10 text-primary"
                      }`}
                  >
                    {finding.severity}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{finding.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    CVSS: <span className="font-medium">{finding.cvss}</span>
                  </span>
                  <span className="text-primary">Remediation: {finding.remediation}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Recommendations */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Security Recommendations</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {gateway.patchStatus !== 'up-to-date' && (
            <div className="p-4 flex items-start gap-3">
              <RefreshCw className="w-4 h-4 text-warning mt-0.5" />
              <div>
                <p className="text-sm font-medium">Apply Firmware Updates</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Update to version {gateway.latestFirmware} to address known vulnerabilities
                </p>
              </div>
            </div>
          )}

          {gateway.vulnerabilities > 0 && (
            <div className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium">Address Security Vulnerabilities</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {gateway.vulnerabilities} vulnerabilities require immediate attention
                </p>
              </div>
            </div>
          )}

          {gateway.hardeningScore < 80 && (
            <div className="p-4 flex items-start gap-3">
              <Shield className="w-4 h-4 text-warning mt-0.5" />
              <div>
                <p className="text-sm font-medium">Improve Security Hardening</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Review and implement additional IEC 62443 security controls
                </p>
              </div>
            </div>
          )}

          {gateway.certificateExpiry && new Date(gateway.certificateExpiry).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000 && (
            <div className="p-4 flex items-start gap-3">
              <Lock className="w-4 h-4 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium">Renew Security Certificate</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Certificate expires soon - schedule renewal
                </p>
              </div>
            </div>
          )}

          {gateway.securityStatus === 'secure' && gateway.vulnerabilities === 0 && gateway.patchStatus === 'up-to-date' && (
            <div className="p-4 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
              <div>
                <p className="text-sm font-medium">Security Posture Excellent</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Continue regular security monitoring and maintenance
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GatewayConfiguration({ gateway, data }: { gateway: FieldGateway; data: any }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Network Configuration */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Network Configuration</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IP Address:</span>
              <span className="font-mono">192.168.{Math.floor(Math.random() * 255)}.{Math.floor(Math.random() * 255)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subnet Mask:</span>
              <span className="font-mono">255.255.255.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gateway:</span>
              <span className="font-mono">192.168.{Math.floor(Math.random() * 255)}.1</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">DNS Servers:</span>
              <span className="font-mono">8.8.8.8, 8.8.4.4</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">VLAN:</span>
              <span>VLAN {100 + Math.floor(Math.random() * 50)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Protocol Configuration */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Protocol Configuration</h4>
        <div className="space-y-3">
          {gateway.protocols.map((protocol, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium">{protocol}</p>
                </div>
                <StatusBadge status="enabled" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Port:</span>
                  <span className="ml-2 font-mono">{20000 + index * 100}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Encryption:</span>
                  <span className="ml-2 text-success">Enabled</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Device Connections */}
      <div>
        <h4 className="text-sm font-semibold mb-3">
          Connected Devices ({gateway.connectedDevices})
        </h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" />
                <span>Protection Relays</span>
              </div>
              <span className="font-medium">{Math.floor(gateway.connectedDevices * 0.4)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                <span>RTUs</span>
              </div>
              <span className="font-medium">{Math.floor(gateway.connectedDevices * 0.3)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span>Meters</span>
              </div>
              <span className="font-medium">{Math.floor(gateway.connectedDevices * 0.2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-primary" />
                <span>Other Devices</span>
              </div>
              <span className="font-medium">{Math.floor(gateway.connectedDevices * 0.1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Security Settings</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-success" />
              <div>
                <p className="text-sm font-medium">Firewall</p>
                <p className="text-xs text-muted-foreground">Stateful packet inspection enabled</p>
              </div>
            </div>
            <StatusBadge status="enabled" />
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-success" />
              <div>
                <p className="text-sm font-medium">Intrusion Detection</p>
                <p className="text-xs text-muted-foreground">IDS/IPS active monitoring</p>
              </div>
            </div>
            <StatusBadge status="enabled" />
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-success" />
              <div>
                <p className="text-sm font-medium">Access Control</p>
                <p className="text-xs text-muted-foreground">Role-based authentication</p>
              </div>
            </div>
            <StatusBadge status="enforced" />
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-success" />
              <div>
                <p className="text-sm font-medium">Audit Logging</p>
                <p className="text-xs text-muted-foreground">All events logged</p>
              </div>
            </div>
            <StatusBadge status="enabled" />
          </div>
        </div>
      </div>

      {/* Maintenance Schedule */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Maintenance Schedule</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Next Firmware Update</p>
                <p className="text-xs text-muted-foreground">
                  {gateway.patchStatus === 'up-to-date' ? 'No updates scheduled' : 'Pending approval'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Configuration Backup</p>
                <p className="text-xs text-muted-foreground">
                  Last backup: {new Date(Date.now() - 24 * 3600000).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Security Scan</p>
                <p className="text-xs text-muted-foreground">
                  Next scan: {new Date(Date.now() + 7 * 24 * 3600000).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
