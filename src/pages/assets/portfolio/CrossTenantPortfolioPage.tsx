import { useMemo } from "react";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard } from "@/components/shared/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Activity,
  AlertTriangle,
  TrendingUp,
  Download,
  Sparkles,
  Droplets,
  Settings,
  Gauge,
  Zap,
  Database,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  UpstreamAsset, 
  UpstreamTenant,
  Criticality,
  AssetStatus
} from "@/types/assets";
import { 
  upstreamAssets, 
  upstreamTenants,
  upstreamAssetTypes
} from "@/data/upstreamMockData";

interface TenantSummary {
  tenant: UpstreamTenant;
  totalAssets: number;
  wellheads: number;
  processEquipment: number;
  instrumentation: number;
  criticalAssets: number;
  maintenanceAssets: number;
  activeAssets: number;
  avgCriticality: number;
}

export function CrossTenantPortfolioPage() {
  // Calculate summary statistics for each tenant
  const tenantSummaries = useMemo(() => {
    return upstreamTenants.map(tenant => {
      const tenantAssets = upstreamAssets.filter(asset => asset.tenantId === tenant.id);
      
      const wellheads = tenantAssets.filter(asset => 
        asset.typeId === "type-wellhead" || asset.typeId === "type-well"
      ).length;
      
      const processEquipment = tenantAssets.filter(asset => {
        const assetType = upstreamAssetTypes.find(t => t.id === asset.typeId);
        return assetType?.category === "process";
      }).length;
      
      const instrumentation = tenantAssets.filter(asset => {
        const assetType = upstreamAssetTypes.find(t => t.id === asset.typeId);
        return assetType?.category === "instrumentation";
      }).length;
      
      const criticalAssets = tenantAssets.filter(asset => asset.criticality === "High").length;
      const maintenanceAssets = tenantAssets.filter(asset => asset.status === "maintenance").length;
      const activeAssets = tenantAssets.filter(asset => asset.status === "active").length;
      
      // Calculate average criticality score (High=3, Medium=2, Low=1)
      const criticalityScores = tenantAssets.map(asset => {
        switch (asset.criticality) {
          case "High": return 3;
          case "Medium": return 2;
          case "Low": return 1;
          default: return 0;
        }
      });
      const avgCriticality = criticalityScores.length > 0 
        ? criticalityScores.reduce((sum, score) => sum + score, 0) / criticalityScores.length 
        : 0;

      return {
        tenant,
        totalAssets: tenantAssets.length,
        wellheads,
        processEquipment,
        instrumentation,
        criticalAssets,
        maintenanceAssets,
        activeAssets,
        avgCriticality
      };
    });
  }, []);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const totalAssets = tenantSummaries.reduce((sum, t) => sum + t.totalAssets, 0);
    const totalWellheads = tenantSummaries.reduce((sum, t) => sum + t.wellheads, 0);
    const totalProcessEquipment = tenantSummaries.reduce((sum, t) => sum + t.processEquipment, 0);
    const totalCriticalAssets = tenantSummaries.reduce((sum, t) => sum + t.criticalAssets, 0);
    const totalMaintenanceAssets = tenantSummaries.reduce((sum, t) => sum + t.maintenanceAssets, 0);
    const avgCriticalityAcrossAll = tenantSummaries.length > 0
      ? tenantSummaries.reduce((sum, t) => sum + t.avgCriticality, 0) / tenantSummaries.length
      : 0;

    return {
      totalAssets,
      totalWellheads,
      totalProcessEquipment,
      totalCriticalAssets,
      totalMaintenanceAssets,
      avgCriticalityAcrossAll,
      tenantCount: tenantSummaries.length
    };
  }, [tenantSummaries]);

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <CrossTenantOverview
          overallStats={overallStats}
          tenantSummaries={tenantSummaries}
        />
      ),
    },
    {
      id: "by-tenant",
      label: "By Tenant",
      content: (
        <ByTenantView
          tenantSummaries={tenantSummaries}
        />
      ),
    },
    {
      id: "comparison",
      label: "Comparison",
      content: (
        <TenantComparisonView
          tenantSummaries={tenantSummaries}
        />
      ),
    },
  ];

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane
        title="Cross-Tenant Portfolio"
        subtitle="Multi-tenant asset overview"
        count={overallStats.tenantCount}
        searchPlaceholder="Search tenants..."
        actions={
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4" />
                <span>Active Tenants</span>
              </div>
              <div className="space-y-1">
                {tenantSummaries.map(summary => (
                  <div key={summary.tenant.id} className="flex items-center justify-between">
                    <span className="truncate">{summary.tenant.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {summary.totalAssets}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            <Button size="sm" className="w-full gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        }
      >
        {tenantSummaries.map((summary) => (
          <TenantSummaryListItem
            key={summary.tenant.id}
            summary={summary}
          />
        ))}
      </ListPane>

      <WorkPane
        title="Cross-Tenant Analysis"
        subtitle={`${overallStats.totalAssets} total assets across ${overallStats.tenantCount} tenants`}
        tabs={tabs}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button size="sm" className="gap-2">
              <Sparkles className="w-4 h-4" />
              AI Insights
            </Button>
          </div>
        }
      />
    </div>
  );
}

function TenantSummaryListItem({ 
  summary 
}: { 
  summary: TenantSummary;
}) {
  const getCriticalityColor = (avgCriticality: number) => {
    if (avgCriticality >= 2.5) return "text-red-600";
    if (avgCriticality >= 1.5) return "text-yellow-600";
    return "text-green-600";
  };

  const getCriticalityLabel = (avgCriticality: number) => {
    if (avgCriticality >= 2.5) return "High Risk";
    if (avgCriticality >= 1.5) return "Medium Risk";
    return "Low Risk";
  };

  return (
    <div className="p-3 border border-border rounded-lg">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">{summary.tenant.name}</span>
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              {summary.totalAssets} assets
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-4">
              <span>{summary.wellheads} wellheads</span>
              <span>{summary.processEquipment} process</span>
              <span>{summary.instrumentation} instruments</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("font-medium", getCriticalityColor(summary.avgCriticality))}>
                {getCriticalityLabel(summary.avgCriticality)}
              </span>
              {summary.maintenanceAssets > 0 && (
                <>
                  <span>•</span>
                  <span className="text-yellow-600">{summary.maintenanceAssets} in maintenance</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">
            {Math.round((summary.activeAssets / summary.totalAssets) * 100)}% active
          </div>
        </div>
      </div>
    </div>
  );
}

function CrossTenantOverview({ 
  overallStats, 
  tenantSummaries 
}: { 
  overallStats: any;
  tenantSummaries: TenantSummary[];
}) {
  return (
    <div className="space-y-6">
      {/* Overall KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Assets"
          value={overallStats.totalAssets}
          subtitle={`Across ${overallStats.tenantCount} tenants`}
          icon={Database}
          variant="primary"
        />
        <KPICard
          title="Wellheads"
          value={overallStats.totalWellheads}
          subtitle="Production assets"
          icon={Droplets}
          variant="success"
        />
        <KPICard
          title="Process Equipment"
          value={overallStats.totalProcessEquipment}
          subtitle="Separators, compressors, pumps"
          icon={Settings}
          variant="default"
        />
        <KPICard
          title="Critical Assets"
          value={overallStats.totalCriticalAssets}
          subtitle={`${Math.round((overallStats.totalCriticalAssets / overallStats.totalAssets) * 100)}% of total`}
          icon={AlertTriangle}
          variant="destructive"
        />
      </div>

      {/* Tenant Performance Comparison */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Tenant Performance Overview</h3>
        <div className="space-y-3">
          {tenantSummaries.map(summary => {
            const activePercentage = Math.round((summary.activeAssets / summary.totalAssets) * 100);
            const criticalPercentage = Math.round((summary.criticalAssets / summary.totalAssets) * 100);
            
            return (
              <div key={summary.tenant.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-medium">{summary.tenant.name}</h4>
                      <div className="text-sm text-muted-foreground">
                        {summary.totalAssets} total assets
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={activePercentage >= 90 ? "default" : activePercentage >= 75 ? "secondary" : "destructive"}>
                      {activePercentage}% Active
                    </Badge>
                    {criticalPercentage > 0 && (
                      <Badge variant="outline" className="text-red-600">
                        {criticalPercentage}% Critical
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-blue-600">{summary.wellheads}</div>
                    <div className="text-xs text-muted-foreground">Wellheads</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-600">{summary.processEquipment}</div>
                    <div className="text-xs text-muted-foreground">Process</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-purple-600">{summary.instrumentation}</div>
                    <div className="text-xs text-muted-foreground">Instruments</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-red-600">{summary.maintenanceAssets}</div>
                    <div className="text-xs text-muted-foreground">Maintenance</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk Assessment */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Risk Assessment</h3>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{overallStats.totalCriticalAssets}</div>
              <div className="text-sm text-muted-foreground">High Risk Assets</div>
              <div className="text-xs text-red-600 mt-1">Require immediate attention</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{overallStats.totalMaintenanceAssets}</div>
              <div className="text-sm text-muted-foreground">Under Maintenance</div>
              <div className="text-xs text-yellow-600 mt-1">Planned downtime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(overallStats.avgCriticalityAcrossAll * 10) / 10}
              </div>
              <div className="text-sm text-muted-foreground">Avg Risk Score</div>
              <div className="text-xs text-muted-foreground mt-1">Scale: 1.0 (Low) - 3.0 (High)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ByTenantView({ 
  tenantSummaries 
}: { 
  tenantSummaries: TenantSummary[];
}) {
  return (
    <div className="space-y-6">
      {tenantSummaries.map(summary => (
        <div key={summary.tenant.id} className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-primary" />
              <div>
                <h3 className="font-semibold">{summary.tenant.name}</h3>
                <div className="text-sm text-muted-foreground">
                  Tenant ID: {summary.tenant.id}
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {summary.totalAssets} Assets
            </Badge>
          </div>

          {/* Asset Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <Droplets className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <div className="text-lg font-semibold text-blue-600">{summary.wellheads}</div>
              <div className="text-xs text-muted-foreground">Wellheads</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <Settings className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <div className="text-lg font-semibold text-green-600">{summary.processEquipment}</div>
              <div className="text-xs text-muted-foreground">Process Equipment</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <Gauge className="w-6 h-6 text-purple-600 mx-auto mb-1" />
              <div className="text-lg font-semibold text-purple-600">{summary.instrumentation}</div>
              <div className="text-xs text-muted-foreground">Instrumentation</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-1" />
              <div className="text-lg font-semibold text-red-600">{summary.criticalAssets}</div>
              <div className="text-xs text-muted-foreground">Critical Assets</div>
            </div>
          </div>

          {/* Status Summary */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{summary.activeAssets} Active</span>
              </div>
              {summary.maintenanceAssets > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>{summary.maintenanceAssets} Maintenance</span>
                </div>
              )}
            </div>
            <div className="text-muted-foreground">
              Risk Score: {Math.round(summary.avgCriticality * 10) / 10}/3.0
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TenantComparisonView({ 
  tenantSummaries 
}: { 
  tenantSummaries: TenantSummary[];
}) {
  // Sort tenants by different metrics for comparison
  const byTotalAssets = [...tenantSummaries].sort((a, b) => b.totalAssets - a.totalAssets);
  const byCriticalAssets = [...tenantSummaries].sort((a, b) => b.criticalAssets - a.criticalAssets);
  const byActivePercentage = [...tenantSummaries].sort((a, b) => 
    (b.activeAssets / b.totalAssets) - (a.activeAssets / a.totalAssets)
  );

  return (
    <div className="space-y-6">
      {/* Asset Count Comparison */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Asset Count Ranking</h3>
        <div className="space-y-2">
          {byTotalAssets.map((summary, index) => (
            <div key={summary.tenant.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium">{summary.tenant.name}</div>
                <div className="text-sm text-muted-foreground">
                  {summary.totalAssets} total assets
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">{summary.totalAssets}</div>
                <div className="text-xs text-muted-foreground">assets</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Assets Comparison */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Critical Assets Ranking</h3>
        <div className="space-y-2">
          {byCriticalAssets.map((summary, index) => (
            <div key={summary.tenant.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
              <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/20 flex items-center justify-center text-xs font-semibold text-red-600">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium">{summary.tenant.name}</div>
                <div className="text-sm text-muted-foreground">
                  {Math.round((summary.criticalAssets / summary.totalAssets) * 100)}% critical
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-red-600">{summary.criticalAssets}</div>
                <div className="text-xs text-muted-foreground">critical</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Efficiency Comparison */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Operational Efficiency Ranking</h3>
        <div className="space-y-2">
          {byActivePercentage.map((summary, index) => {
            const activePercentage = Math.round((summary.activeAssets / summary.totalAssets) * 100);
            return (
              <div key={summary.tenant.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-950/20 flex items-center justify-center text-xs font-semibold text-green-600">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{summary.tenant.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {summary.activeAssets} of {summary.totalAssets} active
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600">{activePercentage}%</div>
                  <div className="text-xs text-muted-foreground">active</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Table */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Detailed Comparison</h3>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/30">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Tenant</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Total Assets</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Wellheads</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Process</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Critical</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Active %</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tenantSummaries.map((summary) => {
                const activePercentage = Math.round((summary.activeAssets / summary.totalAssets) * 100);
                
                return (
                  <tr key={summary.tenant.id} className="hover:bg-secondary/20">
                    <td className="px-4 py-3 text-sm font-medium">{summary.tenant.name}</td>
                    <td className="px-4 py-3 text-sm">{summary.totalAssets}</td>
                    <td className="px-4 py-3 text-sm">{summary.wellheads}</td>
                    <td className="px-4 py-3 text-sm">{summary.processEquipment}</td>
                    <td className="px-4 py-3 text-sm text-red-600">{summary.criticalAssets}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={activePercentage >= 90 ? "default" : activePercentage >= 75 ? "secondary" : "destructive"}>
                        {activePercentage}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {Math.round(summary.avgCriticality * 10) / 10}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}