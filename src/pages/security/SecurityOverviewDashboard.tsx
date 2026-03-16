import { useMemo, useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Shield,
  AlertTriangle,
  Users,
  Activity,
  Zap,
  MapPin,
  Database,
  TrendingUp,
  Server,
  Lock,
  Globe,
} from "lucide-react";
import {
  getSecurityMetrics,
  getSiteSecurityPostures,
  getAlertSeverityBreakdown,
  getTopCriticalAssets,
} from "@/lib/securityDashboardQueries";
import type {
  SecurityMetrics,
  SiteSecurityPosture,
  AlertSeverityBreakdown,
} from "@/lib/securityDashboardQueries";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { mapTenantIdToUUID } from "@/lib/tenantMapping";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { FeatureOverviewCharts } from "@/components/security/FeatureOverviewCharts";

export function SecurityOverviewDashboard() {
  const { currentTenant } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [sitePostures, setSitePostures] = useState<SiteSecurityPosture[]>([]);
  const [alertBreakdown, setAlertBreakdown] = useState<AlertSeverityBreakdown | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [topAssets, setTopAssets] = useState<any[]>([]);
  const [selectedSiteType, setSelectedSiteType] = useState<string | null>(null);

  // Load security data from Supabase
  useEffect(() => {
    async function loadSecurityData() {
      if (!isSupabaseConfigured()) {
        setError("Supabase not configured");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Map frontend tenant ID to Supabase UUID
        const tenantUUID = await mapTenantIdToUUID(currentTenant.id);

        if (!tenantUUID) {
          setMetrics(null);
          setSitePostures([]);
          setAlertBreakdown(null);
          setRecentAlerts([]);
          setTopAssets([]);
          setLoading(false);
          return;
        }

        // Load security data
        const [metricsData, posturesData, breakdownData, topAssetsData] = await Promise.all([
          getSecurityMetrics(currentTenant.id),
          getSiteSecurityPostures(currentTenant.id),
          getAlertSeverityBreakdown(currentTenant.id),
          getTopCriticalAssets(currentTenant.id, 5)
        ]);

        setMetrics(metricsData);
        setSitePostures(posturesData);
        setAlertBreakdown(breakdownData);
        setTopAssets(topAssetsData);

      } catch (err) {
        console.error('Error loading security data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load security data');
      } finally {
        setLoading(false);
      }
    }

    loadSecurityData();
  }, [currentTenant.id]);

  // Calculate transmission site type statistics
  const siteTypeStats = useMemo(() => {
    const substations = sitePostures.filter(s =>
      s.siteType === 'substation' || s.siteType === 'transmission-substation'
    ).length;
    const gridStations = sitePostures.filter(s =>
      s.siteType === 'grid-station' || s.siteType === 'switching-station'
    ).length;
    const regionalHubs = sitePostures.filter(s =>
      s.siteType === 'regional-hub' || s.siteType === 'control-center'
    ).length;
    const distributionPoints = sitePostures.filter(s =>
      s.siteType === 'distribution-point'
    ).length;

    return {
      substations,
      gridStations,
      regionalHubs,
      distributionPoints,
      total: sitePostures.length
    };
  }, [sitePostures]);

  // Filter site postures by selected site type
  const filteredSitePostures = useMemo(() => {
    if (!selectedSiteType) return sitePostures;

    return sitePostures.filter(s => {
      if (selectedSiteType === 'substation') {
        return s.siteType === 'substation' || s.siteType === 'transmission-substation';
      }
      if (selectedSiteType === 'grid-station') {
        return s.siteType === 'grid-station' || s.siteType === 'switching-station';
      }
      if (selectedSiteType === 'regional-hub') {
        return s.siteType === 'regional-hub' || s.siteType === 'control-center';
      }
      if (selectedSiteType === 'distribution-point') {
        return s.siteType === 'distribution-point';
      }
      return true;
    });
  }, [sitePostures, selectedSiteType]);

  // Calculate filtered statistics
  const filteredStats = useMemo(() => {
    if (!selectedSiteType || !metrics) return metrics;

    const filteredMetrics = filteredSitePostures.reduce((acc, site) => {
      return {
        totalAssets: acc.totalAssets + site.totalAssets,
        criticalAssets: acc.criticalAssets + site.criticalAssets,
        vulnerableAssets: acc.vulnerableAssets + site.vulnerableAssets,
        totalAlerts: acc.totalAlerts + site.openAlerts,
        criticalAlerts: acc.criticalAlerts + site.criticalAlerts,
      };
    }, {
      totalAssets: 0,
      criticalAssets: 0,
      vulnerableAssets: 0,
      totalAlerts: 0,
      criticalAlerts: 0,
    });

    return {
      ...metrics,
      ...filteredMetrics,
    };
  }, [metrics, selectedSiteType, filteredSitePostures]);

  const displayMetrics = filteredStats || metrics;

  const quickLinks = [
    {
      id: "alerts",
      label: "Security Alerts",
      icon: AlertTriangle,
      count: displayMetrics?.totalAlerts || 0,
      subtitle: `${displayMetrics?.criticalAlerts || 0} critical`
    },
    {
      id: "compliance",
      label: "Security Score",
      icon: Activity,
      count: `${displayMetrics?.overallSecurityScore || 0}%`,
      subtitle: "Overall posture"
    },
    {
      id: "assets",
      label: "OT Asset Posture",
      icon: Shield,
      count: displayMetrics?.criticalAssets || 0,
      subtitle: `${displayMetrics?.vulnerableAssets || 0} assets at risk`
    },
    {
      id: "sessions",
      label: "Active Sessions",
      icon: Users,
      count: displayMetrics?.activeSessions || 0,
      subtitle: "Remote access"
    },
    {
      id: "sites",
      label: "Facility Posture",
      icon: MapPin,
      count: siteTypeStats.total,
      subtitle: `${siteTypeStats.substations + siteTypeStats.gridStations} primary sites`
    },
  ];

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      content: loading ? (
        <LoadingState loadingText="Loading security overview..." />
      ) : error ? (
        <EmptyState
          icon={Database}
          title="Failed to load security data"
          description={error}
        />
      ) : (
        <PostureOverview
          metrics={displayMetrics}
          alertBreakdown={alertBreakdown}
          recentAlerts={recentAlerts}
          siteTypeStats={siteTypeStats}
          selectedSiteType={selectedSiteType}
          onSiteTypeChange={setSelectedSiteType}
          sitePostures={sitePostures}
          topAssets={topAssets}
        />
      ),
    },
    {
      id: "alerts",
      label: "Recent Alerts",
      content: loading ? (
        <LoadingState loadingText="Loading recent alerts..." />
      ) : error ? (
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load alerts"
          description={error}
        />
      ) : (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
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
                {recentAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-secondary/10 transition-colors">
                    <td>
                      <div>
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[400px]">{alert.description}</p>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={alert.severity} />
                    </td>
                    <td>
                      <StatusBadge status={alert.status} />
                    </td>
                    <td className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(alert.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {recentAlerts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-muted-foreground italic">
                      No recent security alerts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <ListPane
        title="Security Areas"
        context="DEWA – Transmission"
        showFilters={false}
        searchPlaceholder="Search"
      >
        <div className="space-y-2">
          {quickLinks.map((link) => (
            <div
              key={link.id}
              className="p-3 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer bg-card"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <link.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{link.label}</p>
                  <p className="text-xs text-muted-foreground">{typeof link.count === 'number' ? `${link.count} items` : link.count}</p>
                  {link.subtitle && (
                    <p className="text-xs text-muted-foreground mt-0.5">{link.subtitle}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ListPane>

      <WorkPane
        title="Security Overview Dashboard"
        subtitle={`Power Transmission cybersecurity posture for ${currentTenant.name}`}
        tabs={tabs}
      />
    </>
  );
}

function PostureOverview({
  metrics,
  alertBreakdown,
  recentAlerts,
  siteTypeStats,
  selectedSiteType,
  onSiteTypeChange,
  sitePostures,
  topAssets
}: {
  metrics: SecurityMetrics | null;
  alertBreakdown: AlertSeverityBreakdown | null;
  recentAlerts: any[];
  siteTypeStats: {
    substations: number;
    gridStations: number;
    regionalHubs: number;
    distributionPoints: number;
    total: number;
  };
  selectedSiteType: string | null;
  onSiteTypeChange: (siteType: string | null) => void;
  sitePostures: SiteSecurityPosture[];
  topAssets: any[];
}) {
  if (!metrics || !alertBreakdown) {
    return <EmptyState icon={Shield} title="No security data available" description="Security metrics will appear here once data is available" />;
  }

  const overviewMetrics = [
    {
      title: "Active Alerts",
      value: metrics.totalAlerts,
      subtitle: `${metrics.criticalAlerts} critical`,
      icon: AlertTriangle,
      variant: metrics.criticalAlerts > 0 ? "destructive" : "warning" as any
    },
    {
      title: "Security Score",
      value: `${metrics.overallSecurityScore}%`,
      subtitle: "IEC 62443, NERC CIP",
      icon: Activity,
      variant: "success" as any
    },
    {
      title: "Critical Assets",
      value: metrics.criticalAssets,
      subtitle: "Transformers, Relays, RTUs",
      icon: Zap,
      variant: "destructive" as any
    },
    {
      title: "Active Sessions",
      value: metrics.activeSessions,
      subtitle: "Remote access",
      icon: Users,
      variant: "primary" as any
    }
  ];

  const pieChartData = [
    { name: "Critical", value: alertBreakdown.critical, color: "hsl(var(--destructive))" },
    { name: "High", value: alertBreakdown.high, color: "hsl(var(--warning))" },
    { name: "Warning", value: alertBreakdown.warning, color: "hsl(var(--primary))" },
    { name: "Info", value: alertBreakdown.info, color: "hsl(var(--muted-foreground))" },
  ];

  const barChartData = sitePostures
    .sort((a, b) => b.securityScore - a.securityScore)
    .slice(0, 5)
    .map(site => ({
      name: site.siteName,
      value: site.securityScore
    }));

  const keyAreas = [
    {
      icon: Globe,
      title: "Transmission Sites",
      description: `${siteTypeStats.substations} Substations, ${siteTypeStats.gridStations} Grid Stations monitored across region.`
    },
    {
      icon: Server,
      title: "OT Infrastructure",
      description: "Secure monitoring of RTUs, PLCs and protection relays across HV network."
    },
    {
      icon: Lock,
      title: "Access Control",
      description: "Managing privileged remote access for maintenance and operations."
    },
    {
      icon: TrendingUp,
      title: "Posture Trends",
      description: "Security score tracking and compliance alignment with international standards."
    }
  ];

  const activity = recentAlerts.map(alert => ({
    id: alert.id,
    title: alert.title,
    subtitle: new Date(alert.created_at).toLocaleString(),
    status: alert.severity === 'critical' ? 'error' : alert.severity === 'high' ? 'warning' : 'info' as any,
    value: alert.status
  }));

  return (
    <IdentityOverview
      title="Security Overview Dashboard"
      description="Holistic view of cybersecurity health across the transmission grid"
      metrics={overviewMetrics}
      showTitleCard={false}
    >
      <div className="mb-6 flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Filter by site type:</span>
        <button
          onClick={() => onSiteTypeChange(null)}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${!selectedSiteType
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
        >
          All Sites ({siteTypeStats.total})
        </button>
        <button
          onClick={() => onSiteTypeChange('substation')}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${selectedSiteType === 'substation'
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
        >
          Substations ({siteTypeStats.substations})
        </button>
        <button
          onClick={() => onSiteTypeChange('grid-station')}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${selectedSiteType === 'grid-station'
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
        >
          Grid Stations ({siteTypeStats.gridStations})
        </button>
      </div>

      <FeatureOverviewCharts
        pieChartTitle="Alert Severity Distribution"
        pieChartData={pieChartData}
        pieChartIcon={AlertTriangle}
        barChartTitle="Top Sites by Security Score"
        barChartData={barChartData}
        barChartIcon={Activity}
        keyAreas={keyAreas}
        recentActivity={activity}
        recentActivityTitle="Recent Security Events"
      />

      {/* Top Critical Assets Section - Required by Tests */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-destructive" />
            Top 5 Critical Transmission Assets (Transformers, Breakers, Protection Relays, RTUs)
          </h4>
        </div>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="data-table w-full">
            <thead className="bg-secondary/30">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Asset Name</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Site</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Criticality</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Security Status</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Risk Score</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vulnerabilities</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-secondary/5 transition-colors">
                  <td className="py-3 px-4 font-medium text-sm">{asset.name}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{asset.type}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{asset.siteName}</td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={asset.criticality === 'safety-critical' ? 'critical' : asset.criticality === 'production-critical' ? 'high' : asset.criticality} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={asset.securityStatus === 'secure' ? 'success' : asset.securityStatus === 'at-risk' ? 'warning' : 'error'} />
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-sm">
                    <span className={asset.riskScore > 70 ? 'text-destructive' : asset.riskScore > 40 ? 'text-warning' : 'text-success'}>
                      {asset.riskScore}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-sm">{asset.vulnerabilities}</td>
                </tr>
              ))}
              {topAssets.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground italic text-sm">
                    No critical assets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </IdentityOverview>
  );
}
