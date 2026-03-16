import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Asset } from "@/types/navigation";
import { APMPageShell } from "@/components/apm/APMPageShell";
import { HealthIndexCard } from "@/components/apm/HealthIndexCard";
import { SignalKPIGrid } from "@/components/apm/SignalKPIGrid";
import { MiniTrendChart } from "@/components/apm/MiniTrendChart";
import { AlertList } from "@/components/apm/AlertList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { upstreamAlerts } from "@/data/mockData";
import { enhancedUpstreamTelemetry, reliabilityMetrics } from "@/data/apmUpstreamData";
import { 
  LayoutDashboard,
  Plus,
  Settings,
  Eye,
  Edit,
  Trash2,
  Copy,
  Share,
  Download,
  Grid3X3,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Activity,
  Gauge,
  Clock,
  Zap,
  Target,
  Users,
  Calendar
} from "lucide-react";

interface DashboardWidget {
  id: string;
  type: "health-overview" | "kpi-grid" | "trend-chart" | "alert-list" | "reliability-metrics" | "asset-status";
  title: string;
  size: "small" | "medium" | "large";
  config: any;
  position: { x: number; y: number };
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  widgets: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
  sharedWith?: string[];
}

const defaultDashboards: Dashboard[] = [
  {
    id: "default-upstream",
    name: "Upstream Operations Overview",
    description: "Default dashboard showing key upstream asset performance metrics",
    isDefault: true,
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
    widgets: [
      {
        id: "widget-1",
        type: "health-overview",
        title: "Asset Health Overview",
        size: "large",
        config: { showTrends: true },
        position: { x: 0, y: 0 }
      },
      {
        id: "widget-2",
        type: "alert-list",
        title: "Top Alerts",
        size: "medium",
        config: { maxItems: 5, severityFilter: "Critical" },
        position: { x: 2, y: 0 }
      },
      {
        id: "widget-3",
        type: "reliability-metrics",
        title: "Reliability KPIs",
        size: "medium",
        config: { metrics: ["mtbf", "mttr", "availability"] },
        position: { x: 0, y: 1 }
      },
      {
        id: "widget-4",
        type: "asset-status",
        title: "Asset Status Summary",
        size: "small",
        config: { groupBy: "criticality" },
        position: { x: 2, y: 1 }
      }
    ]
  },
  {
    id: "maintenance-focus",
    name: "Maintenance Dashboard",
    description: "Focus on maintenance-related metrics and alerts",
    isDefault: false,
    createdAt: "2024-01-12T14:00:00Z",
    updatedAt: "2024-01-14T16:20:00Z",
    widgets: [
      {
        id: "widget-5",
        type: "reliability-metrics",
        title: "Maintenance KPIs",
        size: "large",
        config: { metrics: ["mtbf", "mttr", "mttf", "availability"] },
        position: { x: 0, y: 0 }
      },
      {
        id: "widget-6",
        type: "alert-list",
        title: "Maintenance Alerts",
        size: "medium",
        config: { maxItems: 8, categoryFilter: "Maintenance" },
        position: { x: 2, y: 0 }
      }
    ]
  },
  {
    id: "operations-focus",
    name: "Operations Dashboard",
    description: "Real-time operational metrics and performance indicators",
    isDefault: false,
    createdAt: "2024-01-13T09:30:00Z",
    updatedAt: "2024-01-15T11:45:00Z",
    widgets: [
      {
        id: "widget-7",
        type: "kpi-grid",
        title: "Live Process Data",
        size: "large",
        config: { refreshRate: 5000 },
        position: { x: 0, y: 0 }
      },
      {
        id: "widget-8",
        type: "trend-chart",
        title: "Production Trends",
        size: "medium",
        config: { timeRange: "24h", parameters: ["flow-rate", "pressure"] },
        position: { x: 2, y: 0 }
      }
    ]
  }
];

export function CustomDashboards() {
  const { assets, selectedAsset, setSelectedAsset, sector, subsector } = useApp();
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<Asset | null>(null);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard>(defaultDashboards[0]);
  const [dashboards, setDashboards] = useState<Dashboard[]>(defaultDashboards);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [isCreateDashboardOpen, setIsCreateDashboardOpen] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState("");
  const [newDashboardDescription, setNewDashboardDescription] = useState("");

  // Use local state for this page, but update global context when asset is selected
  const handleAssetSelect = (asset: Asset) => {
    setSelectedAssetLocal(asset);
    setSelectedAsset(asset);
  };

  const currentAsset = selectedAssetLocal || selectedAsset;

  const handleDashboardSelect = (dashboardId: string) => {
    const dashboard = dashboards.find(d => d.id === dashboardId);
    if (dashboard) {
      setSelectedDashboard(dashboard);
    }
  };

  const handleCreateDashboard = () => {
    if (!newDashboardName.trim()) return;

    const newDashboard: Dashboard = {
      id: `dashboard-${Date.now()}`,
      name: newDashboardName,
      description: newDashboardDescription,
      isDefault: false,
      widgets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setDashboards([...dashboards, newDashboard]);
    setSelectedDashboard(newDashboard);
    setNewDashboardName("");
    setNewDashboardDescription("");
    setIsCreateDashboardOpen(false);
  };

  const handleDuplicateDashboard = (dashboard: Dashboard) => {
    const duplicatedDashboard: Dashboard = {
      ...dashboard,
      id: `dashboard-${Date.now()}`,
      name: `${dashboard.name} (Copy)`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setDashboards([...dashboards, duplicatedDashboard]);
    setSelectedDashboard(duplicatedDashboard);
  };

  const handleDeleteDashboard = (dashboardId: string) => {
    if (dashboards.length <= 1) return; // Keep at least one dashboard
    
    const updatedDashboards = dashboards.filter(d => d.id !== dashboardId);
    setDashboards(updatedDashboards);
    
    if (selectedDashboard.id === dashboardId) {
      setSelectedDashboard(updatedDashboards[0]);
    }
  };

  const getWidgetIcon = (type: DashboardWidget["type"]) => {
    switch (type) {
      case "health-overview":
        return <Activity className="h-4 w-4" />;
      case "kpi-grid":
        return <Grid3X3 className="h-4 w-4" />;
      case "trend-chart":
        return <TrendingUp className="h-4 w-4" />;
      case "alert-list":
        return <AlertTriangle className="h-4 w-4" />;
      case "reliability-metrics":
        return <Target className="h-4 w-4" />;
      case "asset-status":
        return <Gauge className="h-4 w-4" />;
    }
  };

  const getWidgetSize = (size: DashboardWidget["size"]) => {
    switch (size) {
      case "small":
        return "col-span-1 row-span-1";
      case "medium":
        return "col-span-2 row-span-1";
      case "large":
        return "col-span-3 row-span-2";
    }
  };

  const renderWidget = (widget: DashboardWidget) => {
    const baseClasses = "h-full";
    
    switch (widget.type) {
      case "health-overview":
        return (
          <Card className={baseClasses}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {widget.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {assets.slice(0, 4).map((asset) => (
                  <div key={asset.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{asset.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {asset.criticality}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${Math.random() * 40 + 60}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.floor(Math.random() * 40 + 60)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case "alert-list":
        const topAlerts = upstreamAlerts.slice(0, widget.config.maxItems || 5);
        return (
          <Card className={baseClasses}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {widget.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AlertList 
                alerts={topAlerts}
                maxItems={widget.config.maxItems}
                showAssetName={true}
              />
            </CardContent>
          </Card>
        );

      case "reliability-metrics":
        return (
          <Card className={baseClasses}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {widget.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">MTBF</span>
                    <span className="text-lg font-semibold">720h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">MTTR</span>
                    <span className="text-lg font-semibold">4.2h</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Availability</span>
                    <span className="text-lg font-semibold">94.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Uptime</span>
                    <span className="text-lg font-semibold">98.1%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "asset-status":
        return (
          <Card className={baseClasses}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                {widget.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active</span>
                  <Badge variant="outline" className="text-green-600 bg-green-50">
                    {assets.filter(a => a.status === "active").length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Maintenance</span>
                  <Badge variant="outline" className="text-yellow-600 bg-yellow-50">
                    {assets.filter(a => a.status === "maintenance").length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Critical</span>
                  <Badge variant="outline" className="text-red-600 bg-red-50">
                    {assets.filter(a => a.criticality === "High").length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "kpi-grid":
        return (
          <Card className={baseClasses}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" />
                {widget.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentAsset ? (
                <SignalKPIGrid 
                  asset={currentAsset}
                  telemetryData={enhancedUpstreamTelemetry[currentAsset.id]}
                  assetType={currentAsset.type}
                />
              ) : (
                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                  Select an asset to view KPI data
                </div>
              )}
            </CardContent>
          </Card>
        );

      case "trend-chart":
        return (
          <Card className={baseClasses}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {widget.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentAsset ? (
                <div className="space-y-4">
                  <MiniTrendChart
                    data={enhancedUpstreamTelemetry[currentAsset.id]?.pressure || []}
                    parameter="Pressure"
                    unit="psig"
                    height={120}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                  Select an asset to view trend data
                </div>
              )}
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card className={baseClasses}>
            <CardContent className="flex items-center justify-center h-32">
              <span className="text-sm text-muted-foreground">Widget type not implemented</span>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <APMPageShell
      title="Custom Dashboards"
      featureSetName="Alerts, Reports & Visualisation"
      featureName="Custom Dashboards"
      listType="assets"
      assets={assets}
      selectedAsset={currentAsset}
      onAssetSelect={handleAssetSelect}
      actions={
        <div className="flex items-center gap-2">
          <Dialog open={isCreateDashboardOpen} onOpenChange={setIsCreateDashboardOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Dashboard
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Dashboard</DialogTitle>
                <DialogDescription>
                  Create a custom dashboard with your preferred widgets and layout
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dashboard-name">Dashboard Name</Label>
                  <Input
                    id="dashboard-name"
                    value={newDashboardName}
                    onChange={(e) => setNewDashboardName(e.target.value)}
                    placeholder="Enter dashboard name..."
                  />
                </div>
                <div>
                  <Label htmlFor="dashboard-description">Description</Label>
                  <Input
                    id="dashboard-description"
                    value={newDashboardDescription}
                    onChange={(e) => setNewDashboardDescription(e.target.value)}
                    placeholder="Enter dashboard description..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDashboardOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateDashboard}>
                    Create Dashboard
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isAddWidgetOpen} onOpenChange={setIsAddWidgetOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Widget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Widget</DialogTitle>
                <DialogDescription>
                  Choose a widget type to add to your dashboard
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { type: "health-overview", name: "Health Overview", icon: Activity },
                  { type: "kpi-grid", name: "KPI Grid", icon: Grid3X3 },
                  { type: "trend-chart", name: "Trend Chart", icon: TrendingUp },
                  { type: "alert-list", name: "Alert List", icon: AlertTriangle },
                  { type: "reliability-metrics", name: "Reliability Metrics", icon: Target },
                  { type: "asset-status", name: "Asset Status", icon: Gauge },
                ].map((widgetType) => (
                  <Button
                    key={widgetType.type}
                    variant="outline"
                    className="h-20 flex flex-col items-center gap-2"
                    onClick={() => {
                      // Mock widget addition - in real implementation would add to dashboard
                      setIsAddWidgetOpen(false);
                    }}
                  >
                    <widgetType.icon className="h-6 w-6" />
                    <span className="text-sm">{widgetType.name}</span>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Dashboard Selector */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5" />
                  Dashboard Selection
                </CardTitle>
                <CardDescription>
                  Choose from existing dashboards or create a new one
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedDashboard.id} onValueChange={handleDashboardSelect}>
                  <SelectTrigger className="w-[300px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dashboards.map((dashboard) => (
                      <SelectItem key={dashboard.id} value={dashboard.id}>
                        <div className="flex items-center gap-2">
                          {dashboard.isDefault && <Badge variant="outline" className="text-xs">Default</Badge>}
                          <span>{dashboard.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{selectedDashboard.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedDashboard.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Created: {new Date(selectedDashboard.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Updated: {new Date(selectedDashboard.updatedAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Grid3X3 className="h-3 w-3" />
                    {selectedDashboard.widgets.length} widgets
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleDuplicateDashboard(selectedDashboard)}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </Button>
                <Button size="sm" variant="outline" className="flex items-center gap-2">
                  <Share className="h-4 w-4" />
                  Share
                </Button>
                <Button size="sm" variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                {!selectedDashboard.isDefault && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDeleteDashboard(selectedDashboard.id)}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-3 gap-6 auto-rows-fr">
          {selectedDashboard.widgets.map((widget) => (
            <div 
              key={widget.id} 
              className={cn(
                "relative group",
                getWidgetSize(widget.size)
              )}
            >
              {/* Widget Actions Overlay */}
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                    <Settings className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {renderWidget(widget)}
            </div>
          ))}
          
          {/* Add Widget Placeholder */}
          <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
            <CardContent className="flex items-center justify-center h-full">
              <Button 
                variant="ghost" 
                className="flex flex-col items-center gap-2 h-full w-full"
                onClick={() => setIsAddWidgetOpen(true)}
              >
                <Plus className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Add Widget</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Dashboard Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Shared With</span>
                </div>
                <p className="text-2xl font-bold">{selectedDashboard.sharedWith?.length || 0}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Views Today</span>
                </div>
                <p className="text-2xl font-bold">{Math.floor(Math.random() * 50 + 10)}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Avg. Session</span>
                </div>
                <p className="text-2xl font-bold">{Math.floor(Math.random() * 10 + 5)}m</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                </div>
                <p className="text-sm font-medium">
                  {new Date(selectedDashboard.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </APMPageShell>
  );
}