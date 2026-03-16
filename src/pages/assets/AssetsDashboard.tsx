import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { WorkPane } from "@/components/layout/WorkPane";
import { useDataProvider } from "@/hooks/useDataProvider";
import { useApp } from "@/context/AppContext";
import { Alert, AlertStatus } from "@/types/alert";
import { PortfolioKpis } from "@/types/transmission";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Activity, Wifi, TrendingUp, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * AssetsDashboard Page
 * Displays dashboards specific to the assets feature area
 *
 * Requirements: 7.1, 7.2, 7.3
 */
export function AssetsDashboard() {
  const { provider } = useDataProvider();
  const { currentTenant } = useApp();
  const navigate = useNavigate();
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);

  // Get portfolio KPIs using existing getAssetPortfolioKpis method
  const { data: portfolioKpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['asset-portfolio-kpis', currentTenant.id],
    queryFn: () => provider.getAssetPortfolioKpis(currentTenant.id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get recent alerts (last 10 with asset/grid sources)
  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['recent-asset-alerts', currentTenant.id],
    queryFn: async () => {
      // Get alerts by tenant and filter for asset-related sources
      const allAlerts = await provider.getAlertsByTenant(currentTenant.id);
      return allAlerts
        .filter(alert => alert.featureArea === 'assets')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
    },
    staleTime: 60 * 1000, // 1 minute
  });

  useEffect(() => {
    if (alertsData) {
      setRecentAlerts(alertsData);
    }
  }, [alertsData]);

  const handleAlertClick = (alert: Alert) => {
    if (alert.assetId) {
      // Navigate to asset detail page
      navigate(`/assets/detail/360/${alert.assetId}`);
    } else if (alert.siteId) {
      // Navigate to portfolio with site filter
      navigate('/assets/portfolio', { state: { filters: { siteId: alert.siteId } } });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: AlertStatus) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'acknowledged': return 'secondary';
      case 'in-progress': return 'default';
      case 'closed': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <WorkPane
      title="Assets Dashboard"
      subtitle="Monitor asset health, performance, and connectivity"
    >
      <div className="space-y-6">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Asset Health Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Asset Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {kpisLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </div>
              ) : portfolioKpis ? (
                <>
                  <div className="text-2xl font-bold">
                    {portfolioKpis.onlineAssets}/{portfolioKpis.totalAssets}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {portfolioKpis.totalAssets > 0
                      ? `${Math.round((portfolioKpis.onlineAssets / portfolioKpis.totalAssets) * 100)}% online`
                      : 'No assets'
                    }
                  </p>
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Online</span>
                      <span className="text-green-600">{portfolioKpis.onlineAssets}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Offline</span>
                      <span className="text-red-600">{portfolioKpis.offlineAssets}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Maintenance</span>
                      <span className="text-yellow-600">{portfolioKpis.maintenanceAssets}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>

          {/* Connectivity Status Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connectivity Status</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.5%</div>
              <p className="text-xs text-muted-foreground">
                Average uptime
              </p>
              <div className="mt-4">
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +0.3% vs last month
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Alert Summary Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alert Summary</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {kpisLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </div>
              ) : portfolioKpis ? (
                <>
                  <div className="text-2xl font-bold text-red-600">
                    {portfolioKpis.criticalAlerts + portfolioKpis.warningAlerts}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active alerts
                  </p>
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Critical</span>
                      <span className="text-red-600 font-semibold">{portfolioKpis.criticalAlerts}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Warning</span>
                      <span className="text-yellow-600">{portfolioKpis.warningAlerts}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/assets/alerts')}
                      className="w-full"
                    >
                      View All Alerts
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Alerts Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Recent Alerts
            </CardTitle>
            <CardDescription>
              Latest asset-related alerts and incidents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4">
                    <div className="h-4 bg-muted rounded w-16"></div>
                    <div className="h-4 bg-muted rounded flex-1"></div>
                    <div className="h-4 bg-muted rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : recentAlerts.length > 0 ? (
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleAlertClick(alert)}
                  >
                    <div className="flex items-center space-x-3">
                      <Badge variant={getSeverityColor(alert.severity) as any} className="text-xs">
                        {alert.severity}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(alert.createdAt).toLocaleDateString()} • {alert.assetId ? 'Asset' : 'System'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(alert.status) as any} className="text-xs">
                        {alert.status}
                      </Badge>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                ))}
                {recentAlerts.length === 10 && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/assets/alerts')}
                      className="w-full"
                    >
                      View All Alerts
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent alerts</p>
                <p className="text-sm">All systems are operating normally</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </WorkPane>
  );
}
