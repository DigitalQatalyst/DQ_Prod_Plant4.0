import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Asset } from "@/types/navigation";
import { APMPageShell } from "@/components/apm/APMPageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAlerts, useAcknowledgeAlert, useCloseAlert } from "@/hooks/useAPM";
import type { Alert, AlertSeverity } from "@/types/apm";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Search,
  Filter,
  Bell,
  BellRing,
  AlertCircle,
  Info,
  Eye,
  Check,
  X,
  Loader2
} from "lucide-react";

export function RealtimeAlerts() {
  const { assets, selectedAsset, setSelectedAsset, sector, subsector } = useApp();
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<Asset | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("7d");

  const currentAsset = selectedAssetLocal || selectedAsset;

  // Memoize query params to prevent infinite loops
  const alertParams = useMemo(() => ({
    asset_id: currentAsset?.id,
    severity: selectedSeverity !== "all" ? (selectedSeverity as AlertSeverity) : undefined,
    state: selectedStatus !== "all" ? selectedStatus as any : undefined,
    from: getTimeRangeStart(timeRange),
    to: new Date().toISOString(),
  }), [currentAsset?.id, selectedSeverity, selectedStatus, timeRange]);

  // Fetch alerts with filters
  const { data: alerts, loading, error, refetch } = useAlerts(alertParams);

  // Mutation hooks
  const acknowledgeAlert = useAcknowledgeAlert();
  const closeAlert = useCloseAlert();

  // Use local state for this page, but update global context when asset is selected
  const handleAssetSelect = (asset: Asset) => {
    setSelectedAssetLocal(asset);
    setSelectedAsset(asset);
    setSelectedAlert(null); // Clear alert selection when asset changes
  };

  // Helper function to get time range start
  function getTimeRangeStart(range: string): string {
    const now = new Date();
    switch (range) {
      case "1d":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case "7d":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case "30d":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  // Filter alerts based on search
  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];

    let filtered = alerts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(alert =>
        alert.alert_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      // Sort by severity first (emergency > critical > warning > info)
      const severityOrder = { "emergency": 4, "critical": 3, "warning": 2, "info": 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;

      // Then by timestamp (newest first)
      return new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime();
    });
  }, [alerts, searchTerm]);

  // Get alert counts by severity
  const alertCounts = useMemo(() => {
    if (!alerts) return { total: 0, emergency: 0, critical: 0, warning: 0, info: 0, active: 0 };

    return {
      total: alerts.length,
      emergency: alerts.filter(a => a.severity === "emergency").length,
      critical: alerts.filter(a => a.severity === "critical").length,
      warning: alerts.filter(a => a.severity === "warning").length,
      info: alerts.filter(a => a.severity === "info").length,
      active: alerts.filter(a => a.state === "open").length,
    };
  }, [alerts]);

  const handleAlertSelect = (alert: Alert) => {
    setSelectedAlert(alert);
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await acknowledgeAlert.mutate({
        alert_id: alertId,
        acknowledged_by: "current_user", // TODO: Get from auth context
      });
      refetch();
      if (selectedAlert?.id === alertId) {
        setSelectedAlert(prev => prev ? { ...prev, state: "ack" } : null);
      }
    } catch (err) {
      console.error("Failed to acknowledge alert:", err);
    }
  };

  const handleCloseAlert = async (alertId: string, resolutionNotes: string) => {
    try {
      await closeAlert.mutate({
        alert_id: alertId,
        closed_by: "current_user", // TODO: Get from auth context
        resolution_notes: resolutionNotes,
      });
      refetch();
      setSelectedAlert(null);
    } catch (err) {
      console.error("Failed to close alert:", err);
    }
  };

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case "emergency":
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case "emergency":
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "info":
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  const getStatusIcon = (state: Alert["state"]) => {
    switch (state) {
      case "open":
        return <BellRing className="h-4 w-4 text-red-500" />;
      case "ack":
        return <Eye className="h-4 w-4 text-yellow-500" />;
      case "closed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  if (loading) {
    return (
      <APMPageShell
        title="Real-time Alerts & Severity Levels"
        featureSetName="Alerts, Reports & Visualisation"
        featureName="Real-time Alerts & Severity Levels"
        listType="assets"
        assets={assets}
        selectedAsset={currentAsset}
        onAssetSelect={handleAssetSelect}
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </APMPageShell>
    );
  }

  if (error) {
    return (
      <APMPageShell
        title="Real-time Alerts & Severity Levels"
        featureSetName="Alerts, Reports & Visualisation"
        featureName="Real-time Alerts & Severity Levels"
        listType="assets"
        assets={assets}
        selectedAsset={currentAsset}
        onAssetSelect={handleAssetSelect}
      >
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Failed to load alerts: {error.message}</p>
              <Button onClick={refetch} className="mt-4">Retry</Button>
            </div>
          </CardContent>
        </Card>
      </APMPageShell>
    );
  }

  return (
    <APMPageShell
      title="Real-time Alerts & Severity Levels"
      featureSetName="Alerts, Reports & Visualisation"
      featureName="Real-time Alerts & Severity Levels"
      listType="assets"
      assets={assets}
      selectedAsset={currentAsset}
      onAssetSelect={handleAssetSelect}
    >
      <div className="space-y-6">
        {/* Alert Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Alerts</p>
                  <p className="text-2xl font-bold">{alertCounts.total}</p>
                </div>
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Emergency</p>
                  <p className="text-2xl font-bold text-red-600">{alertCounts.emergency}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Critical</p>
                  <p className="text-2xl font-bold text-red-600">{alertCounts.critical}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Warning</p>
                  <p className="text-2xl font-bold text-yellow-600">{alertCounts.warning}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Info</p>
                  <p className="text-2xl font-bold text-blue-600">{alertCounts.info}</p>
                </div>
                <Info className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-orange-600">{alertCounts.active}</p>
                </div>
                <BellRing className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Alert Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search alerts by type or message..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="ack">Acknowledged</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Alert Feed with Severity Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({filteredAlerts.length})</TabsTrigger>
            <TabsTrigger value="emergency">Emergency ({filteredAlerts.filter(a => a.severity === "emergency").length})</TabsTrigger>
            <TabsTrigger value="critical">Critical ({filteredAlerts.filter(a => a.severity === "critical").length})</TabsTrigger>
            <TabsTrigger value="warning">Warning ({filteredAlerts.filter(a => a.severity === "warning").length})</TabsTrigger>
            <TabsTrigger value="info">Info ({filteredAlerts.filter(a => a.severity === "info").length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <AlertFeed
              alerts={filteredAlerts}
              selectedAlert={selectedAlert}
              onAlertSelect={handleAlertSelect}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              getSeverityIcon={getSeverityIcon}
              getSeverityColor={getSeverityColor}
              getStatusIcon={getStatusIcon}
              formatTimestamp={formatTimestamp}
            />
          </TabsContent>

          <TabsContent value="emergency" className="mt-6">
            <AlertFeed
              alerts={filteredAlerts.filter(a => a.severity === "emergency")}
              selectedAlert={selectedAlert}
              onAlertSelect={handleAlertSelect}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              getSeverityIcon={getSeverityIcon}
              getSeverityColor={getSeverityColor}
              getStatusIcon={getStatusIcon}
              formatTimestamp={formatTimestamp}
            />
          </TabsContent>

          <TabsContent value="critical" className="mt-6">
            <AlertFeed
              alerts={filteredAlerts.filter(a => a.severity === "critical")}
              selectedAlert={selectedAlert}
              onAlertSelect={handleAlertSelect}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              getSeverityIcon={getSeverityIcon}
              getSeverityColor={getSeverityColor}
              getStatusIcon={getStatusIcon}
              formatTimestamp={formatTimestamp}
            />
          </TabsContent>

          <TabsContent value="warning" className="mt-6">
            <AlertFeed
              alerts={filteredAlerts.filter(a => a.severity === "warning")}
              selectedAlert={selectedAlert}
              onAlertSelect={handleAlertSelect}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              getSeverityIcon={getSeverityIcon}
              getSeverityColor={getSeverityColor}
              getStatusIcon={getStatusIcon}
              formatTimestamp={formatTimestamp}
            />
          </TabsContent>

          <TabsContent value="info" className="mt-6">
            <AlertFeed
              alerts={filteredAlerts.filter(a => a.severity === "info")}
              selectedAlert={selectedAlert}
              onAlertSelect={handleAlertSelect}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              getSeverityIcon={getSeverityIcon}
              getSeverityColor={getSeverityColor}
              getStatusIcon={getStatusIcon}
              formatTimestamp={formatTimestamp}
            />
          </TabsContent>
        </Tabs>

        {/* Selected Alert Detail Panel */}
        {selectedAlert && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-2">
                    {getSeverityIcon(selectedAlert.severity)}
                    {selectedAlert.alert_type}
                  </CardTitle>
                  <CardDescription>
                    Asset ID: {selectedAlert.asset_id} • {formatTimestamp(selectedAlert.detected_at)}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getSeverityColor(selectedAlert.severity)}>
                    {selectedAlert.severity}
                  </Badge>
                  <Badge variant="outline">
                    {getStatusIcon(selectedAlert.state)}
                    <span className="ml-1">{selectedAlert.state}</span>
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Message</h4>
                <p className="text-sm text-muted-foreground">{selectedAlert.message}</p>
              </div>

              {selectedAlert.source && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Source</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedAlert.source}
                      {selectedAlert.source_event_id && ` (Event ID: ${selectedAlert.source_event_id})`}
                    </p>
                  </div>
                </>
              )}

              {selectedAlert.resolution_notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Resolution Notes</h4>
                    <p className="text-sm text-muted-foreground">{selectedAlert.resolution_notes}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex gap-2">
                {selectedAlert.state === "open" && (
                  <Button
                    onClick={() => handleAcknowledgeAlert(selectedAlert.id)}
                    disabled={acknowledgeAlert.loading}
                    className="flex items-center gap-2"
                  >
                    {acknowledgeAlert.loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Acknowledge Alert
                  </Button>
                )}
                {(selectedAlert.state === "open" || selectedAlert.state === "ack") && (
                  <Button
                    onClick={() => {
                      const notes = prompt("Enter resolution notes:");
                      if (notes) {
                        handleCloseAlert(selectedAlert.id, notes);
                      }
                    }}
                    disabled={closeAlert.loading}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {closeAlert.loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    Close Alert
                  </Button>
                )}
                <Button variant="outline" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  View Asset Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </APMPageShell>
  );
}

interface AlertFeedProps {
  alerts: Alert[];
  selectedAlert: Alert | null;
  onAlertSelect: (alert: Alert) => void;
  onAcknowledgeAlert: (alertId: string) => void;
  getSeverityIcon: (severity: AlertSeverity) => JSX.Element;
  getSeverityColor: (severity: AlertSeverity) => string;
  getStatusIcon: (state: Alert["state"]) => JSX.Element;
  formatTimestamp: (timestamp: string) => string;
}

function AlertFeed({
  alerts,
  selectedAlert,
  onAlertSelect,
  onAcknowledgeAlert,
  getSeverityIcon,
  getSeverityColor,
  getStatusIcon,
  formatTimestamp
}: AlertFeedProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No alerts match the current filters</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <Card
          key={alert.id}
          className={cn(
            "cursor-pointer transition-colors hover:bg-muted/50",
            selectedAlert?.id === alert.id && "ring-2 ring-primary",
            alert.state === "closed" && "opacity-60"
          )}
          onClick={() => onAlertSelect(alert)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  {getSeverityIcon(alert.severity)}
                  <h3 className="font-medium">{alert.alert_type}</h3>
                  {alert.state === "ack" && (
                    <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                      <Check className="h-3 w-3 mr-1" />
                      Acknowledged
                    </Badge>
                  )}
                  {alert.state === "closed" && (
                    <Badge variant="outline" className="text-gray-600 bg-gray-50 border-gray-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Closed
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">Asset ID: {alert.asset_id}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{alert.message}</p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(alert.detected_at)}
                  </span>
                  {alert.source && (
                    <span className="flex items-center gap-1">
                      Source: {alert.source}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                  {alert.severity}
                </Badge>
                <div className="flex items-center gap-1">
                  {getStatusIcon(alert.state)}
                  <span className="text-xs text-muted-foreground">{alert.state}</span>
                </div>
                {alert.state === "open" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAcknowledgeAlert(alert.id);
                    }}
                    className="text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Acknowledge
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}