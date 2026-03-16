import { useMemo, useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Shield,
  MapPin,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Network,
  Zap,
  Power,
  Cpu,
  ShieldCheck,
  TrendingUp,
  Globe,
  Lock,
} from "lucide-react";
import { getSiteSecurityPostures } from "@/lib/securityDashboardQueries";
import type { SiteSecurityPosture } from "@/lib/securityDashboardQueries";
import { supabase } from "@/lib/supabase";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { FeatureOverviewCharts } from "@/components/security/FeatureOverviewCharts";

export function PostureBySite() {
  const { currentTenant } = useApp();
  const [selectedSite, setSelectedSite] = useState<SiteSecurityPosture | null>(null);
  const [sitePostures, setSitePostures] = useState<SiteSecurityPosture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("score");

  // Fetch site security postures from Supabase
  useEffect(() => {
    async function fetchSitePostures() {
      try {
        setLoading(true);
        setError(null);
        const postures = await getSiteSecurityPostures(currentTenant.id);
        setSitePostures(postures);
      } catch (err) {
        console.error('Error fetching site security postures:', err);
        setError(err instanceof Error ? err.message : 'Failed to load site security data');
      } finally {
        setLoading(false);
      }
    }

    fetchSitePostures();
  }, [currentTenant.id]);

  // Filter and sort site postures
  const filteredAndSortedSites = useMemo(() => {
    let result = [...sitePostures];

    // Search
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      result = result.filter(site =>
        site.siteName.toLowerCase().includes(query) ||
        (site.siteType || '').toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(site => site.siteType === filterType);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'score') return b.securityScore - a.securityScore;
      if (sortBy === 'name') return a.siteName.localeCompare(b.siteName);
      if (sortBy === 'assets') return b.totalAssets - a.totalAssets;
      return 0;
    });

    return result;
  }, [sitePostures, searchTerm, filterType, sortBy]);

  // Group sites by type (transmission-specific)
  const sitesByType = useMemo(() => {
    const grouped = filteredAndSortedSites.reduce((acc, site) => {
      const type = site.siteType || 'unknown';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(site);
      return acc;
    }, {} as Record<string, SiteSecurityPosture[]>);

    return grouped;
  }, [filteredAndSortedSites]);

  // Transmission-specific site type labels
  const siteTypeLabels: Record<string, string> = {
    'substation': 'Substations & Grid Stations',
    'transmission': 'Regional Hubs',
    'switching-station': 'Switching Stations',
    'distribution': 'Distribution Centers',
    'control-center': 'Control Centers',
    'unknown': 'Other Sites',
  };

  // Transmission-specific site type icons
  const siteTypeIcons: Record<string, any> = {
    'substation': Power,
    'grid-station': Network,
    'regional-hub': Cpu,
    'switching-station': Activity,
    'distribution-center': MapPin,
    'control-center': Shield,
    'unknown': MapPin,
  };

  const tabs = selectedSite ? [
    {
      id: "overview",
      label: "Overview",
      content: <SiteOverview site={selectedSite} />,
    },
    {
      id: "security-metrics",
      label: "Security Metrics",
      content: <SiteSecurityMetrics site={selectedSite} />,
    },
    {
      id: "compliance",
      label: "Compliance",
      content: <SiteCompliance site={selectedSite} />,
    },
    {
      id: "alerts",
      label: "Active Alerts",
      content: <SiteAlerts site={selectedSite} />,
    },
  ] : [
    {
      id: "overview",
      label: "Overview",
      content: <SitesOverview sites={sitePostures} />,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingState loadingText="Loading site postures..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          title="Error Loading Data"
          description={error}
          icon={AlertTriangle}
        />
      </div>
    );
  }

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane
        title="Transmission Sites"
        context="DEWA – Transmission"
        count={filteredAndSortedSites.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "type", label: "Site Type", value: filterType, options: [
              { label: "All Types", value: "all" },
              { label: "Substations", value: "substation" },
              { label: "Regional Hubs", value: "transmission" },
              { label: "Switching Stations", value: "switching-station" },
              { label: "Distribution Centers", value: "distribution" },
              { label: "Control Centers", value: "control-center" },
            ], onChange: setFilterType
          },
        ]}
        sortOptions={[
          { label: "Health Score", value: "score" },
          { label: "Site Name", value: "name" },
          { label: "Asset Count", value: "assets" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >

        {Object.keys(sitesByType).length === 0 ? (
          <EmptyState
            title="No Sites Found"
            description="No transmission sites found for this tenant"
            icon={MapPin}
          />
        ) : (
          Object.entries(sitesByType).map(([type, typeSites]) => {
            const Icon = siteTypeIcons[type] || MapPin;
            return (
              <div key={type} className="mb-6">
                <div className="flex items-center gap-2 mb-3 px-2">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{siteTypeLabels[type] || type}</h3>
                  <span className="text-[10px] bg-secondary px-1.5 rounded-full">({typeSites.length})</span>
                </div>
                <div className="space-y-2">
                  {typeSites.map((site) => (
                    <ListPaneItem
                      key={site.siteId}
                      title={site.siteName}
                      description={`${site.zones} zones • ${site.totalAssets} assets • ${site.openAlerts} alerts`}
                      status={site.complianceStatus}
                      category={site.siteType.replace('-', ' ')}
                      value={`${site.securityScore}%`}
                      isSelected={selectedSite?.siteId === site.siteId}
                      onClick={() => setSelectedSite(site)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </ListPane >

      <WorkPane
        title={selectedSite ? selectedSite.siteName : "Sites Overview"}
        subtitle={
          selectedSite
            ? `${siteTypeLabels[selectedSite.siteType] || selectedSite.siteType} • Security Score: ${selectedSite.securityScore}%`
            : `Comprehensive security posture across ${sitePostures.length} transmission facilities`
        }
        tabs={tabs}
      />
    </div>
  );
}

function SitesOverview({ sites }: { sites: SiteSecurityPosture[] }) {
  const totalSites = sites.length;
  const totalAssets = sites.reduce((sum, site) => sum + site.totalAssets, 0);
  const totalCriticalAssets = sites.reduce((sum, site) => sum + site.criticalAssets, 0);
  const totalAlerts = sites.reduce((sum, site) => sum + site.openAlerts, 0);
  const totalCriticalAlerts = sites.reduce((sum, site) => sum + site.criticalAlerts, 0);
  const avgSecurityScore = sites.length > 0
    ? Math.round(sites.reduce((sum, site) => sum + site.securityScore, 0) / sites.length)
    : 0;

  const overviewMetrics = [
    {
      title: "Monitored Sites",
      value: totalSites,
      subtitle: `${avgSecurityScore}% avg security`,
      icon: MapPin,
      variant: "primary" as any
    },
    {
      title: "Total Assets",
      value: totalAssets,
      subtitle: `${totalCriticalAssets} critical`,
      icon: Power,
      variant: "primary" as any
    },
    {
      title: "Active Alerts",
      value: totalAlerts,
      subtitle: `${totalCriticalAlerts} critical`,
      icon: Activity,
      variant: totalCriticalAlerts > 0 ? "destructive" : "warning" as any
    },
    {
      title: "Security Posture",
      value: `${avgSecurityScore}%`,
      subtitle: "Aggregate score",
      icon: ShieldCheck,
      variant: "success" as any
    }
  ];

  const pieChartData = [
    { name: "Compliant", value: sites.filter(s => s.complianceStatus === 'compliant').length, color: "hsl(var(--success))" },
    { name: "Partial", value: sites.filter(s => s.complianceStatus === 'partial').length, color: "hsl(var(--warning))" },
    { name: "Non-Compliant", value: sites.filter(s => s.complianceStatus === 'non-compliant').length, color: "hsl(var(--destructive))" },
  ];

  const barChartData = sites
    .sort((a, b) => b.securityScore - a.securityScore)
    .slice(0, 5)
    .map(site => ({
      name: site.siteName,
      value: site.securityScore
    }));

  const keyAreas = [
    {
      icon: Globe,
      title: "Regional Coverage",
      description: "Monitoring security health across all transmission substations and grid stations."
    },
    {
      icon: Shield,
      title: "Zone Compliance",
      description: "Tracking IEC 62443 zone and conduit segmentation health per site."
    },
    {
      icon: Lock,
      title: "Physical & Cyber",
      description: "Integrating physical security alerts with cyber monitoring for holistic posture."
    },
    {
      icon: TrendingUp,
      title: "Improvement Plan",
      description: "Addressing gaps in non-compliant sites to elevate regional security baseline."
    }
  ];

  const reqAttention = sites
    .filter(s => s.securityScore < 70 || s.criticalAlerts > 0)
    .sort((a, b) => (b.criticalAlerts - a.criticalAlerts) || (a.securityScore - b.securityScore))
    .slice(0, 5)
    .map(s => ({
      id: s.siteId,
      title: s.siteName,
      subtitle: `${s.siteType.replace('-', ' ')}`,
      status: s.criticalAlerts > 0 ? 'error' : 'warning' as any,
      value: `${s.securityScore}%`
    }));

  return (
    <IdentityOverview
      title="Fleet Security Overview"
      description="Aggregate security metrics and compliance status across the entire transmission network"
      metrics={overviewMetrics}
      showTitleCard={false}
    >
      <FeatureOverviewCharts
        pieChartTitle="Compliance Distribution"
        pieChartData={pieChartData}
        pieChartIcon={ShieldCheck}
        barChartTitle="Top Performing Sites"
        barChartData={barChartData}
        barChartIcon={Activity}
        keyAreas={keyAreas}
        recentActivity={reqAttention}
        recentActivityTitle="Sites Requiring Attention"
      />
    </IdentityOverview>
  );
}

function SiteOverview({ site }: { site: SiteSecurityPosture }) {
  const overviewMetrics = [
    {
      title: "Security Score",
      value: `${site.securityScore}%`,
      subtitle: `${site.zones} security zones`,
      icon: Shield,
      variant: site.securityScore >= 80 ? "success" : site.securityScore >= 60 ? "warning" : "destructive" as any
    },
    {
      title: "Total Assets",
      value: site.totalAssets,
      subtitle: `${site.criticalAssets} critical`,
      icon: Power,
      variant: "primary" as any
    },
    {
      title: "Vulnerable Assets",
      value: site.vulnerableAssets,
      subtitle: `Risk score: ${site.riskScore}`,
      icon: AlertTriangle,
      variant: site.vulnerableAssets > 0 ? "destructive" : "success" as any
    },
    {
      title: "Active Alerts",
      value: site.openAlerts,
      subtitle: `${site.criticalAlerts} critical`,
      icon: Activity,
      variant: site.criticalAlerts > 0 ? "destructive" : "warning" as any
    }
  ];

  // For site-specific view, we can use different charts if needed, 
  // but let's stick to the pattern for now with site-specific data.

  const zoneData = [
    { name: "Compliant", value: site.compliantZones, color: "hsl(var(--success))" },
    { name: "Non-Compliant", value: site.zones - site.compliantZones, color: "hsl(var(--destructive))" },
  ];

  // Asset type breakdown mock for bar chart
  const assetData = [
    { name: "Transformers", value: Math.floor(site.totalAssets * 0.2) },
    { name: "Relays", value: Math.floor(site.totalAssets * 0.4) },
    { name: "RTUs/PLCs", value: Math.floor(site.totalAssets * 0.25) },
    { name: "Gateways", value: Math.floor(site.totalAssets * 0.15) },
  ];

  const keyAreas = [
    {
      icon: Network,
      title: "Network Zones",
      description: `Site has ${site.zones} zones. ${site.compliantZones} are currently meeting IEC 62443 requirements.`
    },
    {
      icon: Zap,
      title: "Critical Infrastructure",
      description: `${site.criticalAssets} critical assets identified. Safety-critical loops are prioritized for protection.`
    }
  ];

  return (
    <IdentityOverview
      title={`${site.siteName} Overview`}
      description={`Security posture details for ${site.siteName} facility`}
      metrics={overviewMetrics}
      showTitleCard={false}
    >
      <FeatureOverviewCharts
        pieChartTitle="Zone Compliance"
        pieChartData={zoneData}
        pieChartIcon={Shield}
        barChartTitle="Asset Type Breakdown"
        barChartData={assetData}
        barChartIcon={Power}
        keyAreas={keyAreas}
        recentActivity={[]}
        recentActivityTitle="Recent Site Activities"
      />
    </IdentityOverview>
  );
}

function SiteSecurityMetrics({ site }: { site: SiteSecurityPosture }) {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchZones() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('security_zones')
          .select('*')
          .eq('site_id', site.siteId);

        if (error) throw error;
        setZones(data || []);
      } catch (err) {
        console.error('Error fetching zones:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchZones();
  }, [site.siteId]);

  if (loading) {
    return <LoadingState loadingText="Analysing site security postures..." />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Security Zones Configuration
        </h3>
        {zones.length === 0 ? (
          <EmptyState
            title="No Zones Configured"
            description="No security zones have been configured for this site"
            icon={Shield}
          />
        ) : (
          <div className="space-y-3">
            {zones.map((zone) => (
              <div key={zone.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                <div>
                  <p className="text-sm font-medium">{zone.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Level {zone.security_level} • {zone.zone_type}
                  </p>
                </div>
                <StatusBadge
                  status={zone.compliance_status}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SiteCompliance({ site }: { site: SiteSecurityPosture }) {
  return (
    <div className="space-y-6 text-sm">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-semibold mb-4">Compliance Standards Health</h3>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Overall Compliance Maturity</span>
              <span className="font-medium uppercase">{site.complianceStatus}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${site.complianceStatus === "compliant"
                    ? "bg-success"
                    : site.complianceStatus === "partial"
                      ? "bg-warning"
                      : "bg-destructive"
                    }`}
                  style={{
                    width: `${(site.compliantZones / Math.max(site.zones, 1)) * 100}%`
                  }}
                />
              </div>
              <span className="text-xs font-bold w-12 text-right">
                {Math.round((site.compliantZones / Math.max(site.zones, 1)) * 100)}%
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Applicable Frameworks</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 border border-border rounded-lg bg-secondary/10 flex items-center justify-between">
                <span className="font-medium">IEC 62443</span>
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
              <div className="p-3 border border-border rounded-lg bg-secondary/10 flex items-center justify-between">
                <span className="font-medium">NERC CIP</span>
                <AlertTriangle className="w-4 h-4 text-warning" />
              </div>
              <div className="p-3 border border-border rounded-lg bg-secondary/10 flex items-center justify-between">
                <span className="font-medium">IEC 61850-90-5</span>
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SiteAlerts({ site }: { site: SiteSecurityPosture }) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('security_alerts')
          .select('*')
          .eq('site_id', site.siteId)
          .in('status', ['new', 'acknowledged', 'in-progress'])
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setAlerts(data || []);
      } catch (err) {
        console.error('Error fetching alerts:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAlerts();
  }, [site.siteId]);

  if (loading) {
    return <LoadingState loadingText="Loading site security data..." />
  }

  if (alerts.length === 0) {
    return (
      <EmptyState
        title="No Active Alerts"
        description="No active security alerts for this site"
        icon={CheckCircle2}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="data-table">
          <thead className="bg-secondary/30">
            <tr>
              <th>Alert</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Detected</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.id}>
                <td>
                  <div>
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[300px]">{alert.description}</p>
                  </div>
                </td>
                <td>
                  <StatusBadge
                    status={alert.severity}
                  />
                </td>
                <td>
                  <StatusBadge
                    status={alert.status}
                  />
                </td>
                <td className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {new Date(alert.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}