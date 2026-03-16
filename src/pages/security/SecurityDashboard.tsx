import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { getSecurityMetrics, getAssetCriticalityBreakdown, getSecurityStatusBreakdown, getAlertSeverityBreakdown } from "@/lib/securityDashboardQueries";
import type { SecurityMetrics, AssetCriticalityBreakdown, SecurityStatusBreakdown, AlertSeverityBreakdown } from "@/lib/securityDashboardQueries";
import { Shield, AlertTriangle, CheckCircle, Activity, Users, Lock } from "lucide-react";

/**
 * SecurityDashboard Page
 * Displays transmission-specific security dashboards with real-time metrics
 * 
 * Requirements: 1.1, 10.1
 */
export function SecurityDashboard() {
  const { currentTenant } = useApp();
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [criticalityBreakdown, setCriticalityBreakdown] = useState<AssetCriticalityBreakdown | null>(null);
  const [statusBreakdown, setStatusBreakdown] = useState<SecurityStatusBreakdown | null>(null);
  const [alertBreakdown, setAlertBreakdown] = useState<AlertSeverityBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      if (!currentTenant?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [metricsData, criticalityData, statusData, alertData] = await Promise.all([
          getSecurityMetrics(currentTenant.id),
          getAssetCriticalityBreakdown(currentTenant.id),
          getSecurityStatusBreakdown(currentTenant.id),
          getAlertSeverityBreakdown(currentTenant.id)
        ]);

        setMetrics(metricsData);
        setCriticalityBreakdown(criticalityData);
        setStatusBreakdown(statusData);
        setAlertBreakdown(alertData);
      } catch (err) {
        console.error('Error loading security dashboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load security dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [currentTenant?.id]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return (
      <WorkPane
        title="Security Dashboard"
        subtitle="Monitor security posture, policy compliance, and vulnerabilities for transmission infrastructure"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </WorkPane>
    );
  }

  if (error) {
    return (
      <WorkPane
        title="Security Dashboard"
        subtitle="Monitor security posture, policy compliance, and vulnerabilities for transmission infrastructure"
      >
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </WorkPane>
    );
  }

  if (!metrics) {
    return (
      <WorkPane
        title="Security Dashboard"
        subtitle="Monitor security posture, policy compliance, and vulnerabilities for transmission infrastructure"
      >
        <Alert>
          <AlertDescription>No security data available. Please ensure Supabase is configured and data is seeded.</AlertDescription>
        </Alert>
      </WorkPane>
    );
  }

  return (
    <WorkPane
      title="Security Dashboard"
      subtitle="Monitor security posture, policy compliance, and vulnerabilities for transmission infrastructure"
    >
      <div className="space-y-6">
        {/* Overall Security Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Overall Security Posture
            </CardTitle>
            <CardDescription>Aggregated security score across all transmission sites</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`text-5xl font-bold ${getScoreColor(metrics.overallSecurityScore)}`}>
                {metrics.overallSecurityScore}
              </div>
              <div className="text-sm text-muted-foreground">
                <Badge variant={getScoreBadgeVariant(metrics.overallSecurityScore)}>
                  {metrics.overallSecurityScore >= 80 ? 'Secure' : metrics.overallSecurityScore >= 60 ? 'At Risk' : 'Critical'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalAssets}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.criticalAssets} critical assets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Zones</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalZones}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.compliantZones} compliant zones
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalAlerts}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.criticalAlerts} critical alerts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeSessions}</div>
              <p className="text-xs text-muted-foreground">
                Remote access sessions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Asset Security Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Asset Security Status</CardTitle>
              <CardDescription>Security status breakdown for transmission assets</CardDescription>
            </CardHeader>
            <CardContent>
              {statusBreakdown && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Secure</span>
                    </div>
                    <span className="text-sm font-medium">{statusBreakdown.secure}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">At Risk</span>
                    </div>
                    <span className="text-sm font-medium">{statusBreakdown.atRisk}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm">Vulnerable</span>
                    </div>
                    <span className="text-sm font-medium">{statusBreakdown.vulnerable}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Asset Criticality</CardTitle>
              <CardDescription>Criticality breakdown for transmission assets</CardDescription>
            </CardHeader>
            <CardContent>
              {criticalityBreakdown && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Safety Critical</span>
                    <span className="text-sm font-medium">{criticalityBreakdown.safetyCritical}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Production Critical</span>
                    <span className="text-sm font-medium">{criticalityBreakdown.productionCritical}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">High</span>
                    <span className="text-sm font-medium">{criticalityBreakdown.high}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Medium</span>
                    <span className="text-sm font-medium">{criticalityBreakdown.medium}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Low</span>
                    <span className="text-sm font-medium">{criticalityBreakdown.low}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alert Severity Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Severity Distribution</CardTitle>
            <CardDescription>Active security alerts by severity level</CardDescription>
          </CardHeader>
          <CardContent>
            {alertBreakdown && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Critical</p>
                  <p className="text-2xl font-bold text-red-600">{alertBreakdown.critical}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">High</p>
                  <p className="text-2xl font-bold text-orange-600">{alertBreakdown.high}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Warning</p>
                  <p className="text-2xl font-bold text-yellow-600">{alertBreakdown.warning}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Info</p>
                  <p className="text-2xl font-bold text-blue-600">{alertBreakdown.info}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Average Risk Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getScoreColor(100 - metrics.averageRiskScore)}`}>
                {metrics.averageRiskScore}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Lower is better (0-100 scale)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">High Exposure Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.highExposureAssets}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Assets with high network exposure
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Zone Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {metrics.totalZones > 0 ? Math.round((metrics.compliantZones / metrics.totalZones) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.compliantZones} of {metrics.totalZones} zones compliant
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </WorkPane>
  );
}

