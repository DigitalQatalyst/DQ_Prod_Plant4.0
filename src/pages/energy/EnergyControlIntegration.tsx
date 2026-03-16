import { useState } from "react";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { upstreamGeneratorUpsRenewable, type GeneratorUpsRenewable } from "@/data/mockData";
import { Battery, Zap, Sun, Power, AlertTriangle, CheckCircle2, Network, Activity, RefreshCw, Settings, XCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatDistanceToNow } from "date-fns";
import { EnergyListFilter, EnergyFilterState } from "@/components/ems/EnergyListFilter";

// Transmission control integration interface
interface TxControlIntegration {
  id: string;
  integration_code: string;
  system_name: string;
  description: string;
  system_type: 'scada' | 'ems' | 'derms' | 'bms' | 'plc' | 'dcs' | 'historian';
  protocol: 'iec61850' | 'dnp3' | 'modbus_tcp' | 'opcua' | 'bacnet' | 'mqtt' | 'rest_api';
  protocol_version?: string;
  endpoint_host?: string;
  endpoint_port?: number;
  connectivity_status: 'connected' | 'disconnected' | 'error' | 'maintenance';
  last_sync_at?: string;
  last_successful_sync_at?: string;
  last_error_at?: string;
  last_error_message?: string;
  sync_interval_seconds: number;
  data_point_count: number;
  substation_name?: string;
  read_only: boolean;
  auto_sync: boolean;
  active: boolean;
}

export default function EnergyControlIntegration() {
  const { sector, subsector } = useApp();
  const isTransmission = sector === 'Power' && subsector === 'Transmission';

  // Mock transmission control integrations - in production, these would come from TransmissionProvider
  const transmissionIntegrations: TxControlIntegration[] = [
    {
      id: "int-scada-dxb",
      integration_code: "INT-SCADA-DXB",
      system_name: "SCADA System - Dubai Main",
      description: "Primary SCADA system for Dubai Main substation",
      system_type: "scada",
      protocol: "iec61850",
      protocol_version: "2.0",
      endpoint_host: "scada-dxb.dewa.local",
      endpoint_port: 102,
      connectivity_status: "connected",
      last_sync_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      last_successful_sync_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      sync_interval_seconds: 60,
      data_point_count: 450,
      substation_name: "Dubai Main Substation",
      read_only: false,
      auto_sync: true,
      active: true
    },
    {
      id: "int-scada-ja",
      integration_code: "INT-SCADA-JA",
      system_name: "SCADA System - Jebel Ali",
      description: "Primary SCADA system for Jebel Ali substation",
      system_type: "scada",
      protocol: "iec61850",
      protocol_version: "2.0",
      endpoint_host: "scada-ja.dewa.local",
      endpoint_port: 102,
      connectivity_status: "connected",
      last_sync_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      last_successful_sync_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      sync_interval_seconds: 60,
      data_point_count: 520,
      substation_name: "Jebel Ali Substation",
      read_only: false,
      auto_sync: true,
      active: true
    },
    {
      id: "int-scada-aw",
      integration_code: "INT-SCADA-AW",
      system_name: "SCADA System - Al Aweer",
      description: "Primary SCADA system for Al Aweer substation",
      system_type: "scada",
      protocol: "dnp3",
      protocol_version: "3.0",
      endpoint_host: "scada-aw.dewa.local",
      endpoint_port: 20000,
      connectivity_status: "connected",
      last_sync_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      last_successful_sync_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      sync_interval_seconds: 60,
      data_point_count: 380,
      substation_name: "Al Aweer Substation",
      read_only: false,
      auto_sync: true,
      active: true
    },
    {
      id: "int-ems-central",
      integration_code: "INT-EMS-CENTRAL",
      system_name: "Central EMS",
      description: "Central Energy Management System for grid operations",
      system_type: "ems",
      protocol: "opcua",
      protocol_version: "1.04",
      endpoint_host: "ems-central.dewa.local",
      endpoint_port: 4840,
      connectivity_status: "connected",
      last_sync_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
      last_successful_sync_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
      sync_interval_seconds: 30,
      data_point_count: 1250,
      read_only: true,
      auto_sync: true,
      active: true
    },
    {
      id: "int-derms-main",
      integration_code: "INT-DERMS-MAIN",
      system_name: "DERMS Platform",
      description: "Distributed Energy Resource Management System",
      system_type: "derms",
      protocol: "rest_api",
      protocol_version: "2.0",
      endpoint_host: "derms.dewa.local",
      endpoint_port: 443,
      connectivity_status: "connected",
      last_sync_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      last_successful_sync_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      sync_interval_seconds: 300,
      data_point_count: 85,
      read_only: false,
      auto_sync: true,
      active: true
    },
    {
      id: "int-bms-dxb",
      integration_code: "INT-BMS-DXB",
      system_name: "Building Management System - Dubai",
      description: "BMS for Dubai Main control building",
      system_type: "bms",
      protocol: "bacnet",
      protocol_version: "IP",
      endpoint_host: "bms-dxb.dewa.local",
      endpoint_port: 47808,
      connectivity_status: "connected",
      last_sync_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      last_successful_sync_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      sync_interval_seconds: 120,
      data_point_count: 65,
      substation_name: "Dubai Main Substation",
      read_only: false,
      auto_sync: true,
      active: true
    },
    {
      id: "int-historian",
      integration_code: "INT-HISTORIAN",
      system_name: "PI Historian",
      description: "OSIsoft PI Historian for long-term data storage",
      system_type: "historian",
      protocol: "opcua",
      protocol_version: "1.04",
      endpoint_host: "historian.dewa.local",
      endpoint_port: 5450,
      connectivity_status: "connected",
      last_sync_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      last_successful_sync_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      sync_interval_seconds: 60,
      data_point_count: 2500,
      read_only: true,
      auto_sync: true,
      active: true
    },
    {
      id: "int-scada-error",
      integration_code: "INT-SCADA-ERROR",
      system_name: "SCADA System - Test (Error)",
      description: "Test SCADA system with connection error",
      system_type: "scada",
      protocol: "dnp3",
      protocol_version: "3.0",
      endpoint_host: "scada-test.dewa.local",
      endpoint_port: 20000,
      connectivity_status: "error",
      last_sync_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      last_successful_sync_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      last_error_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      last_error_message: "Connection timeout: Unable to reach endpoint",
      sync_interval_seconds: 60,
      data_point_count: 0,
      read_only: false,
      auto_sync: true,
      active: true
    }
  ];

  const [selectedAsset, setSelectedAsset] = useState<GeneratorUpsRenewable>(upstreamGeneratorUpsRenewable[0]);
  const [selectedIntegration, setSelectedIntegration] = useState<TxControlIntegration>(transmissionIntegrations[0]);
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState<EnergyFilterState>({
    status: "",
    role: "",
    substationId: "",
    feederId: "",
    type: ""
  });
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = isTransmission
    ? transmissionIntegrations.filter(item => {
      let matches = true;

      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        matches = matches && (
          item.system_name.toLowerCase().includes(query) ||
          item.integration_code.toLowerCase().includes(query)
        );
      }

      // Filters
      if (filters.status) {
        matches = matches && item.connectivity_status.toLowerCase() === filters.status.toLowerCase();
      }
      if (filters.type) {
        matches = matches && item.system_type.toLowerCase() === filters.type.toLowerCase();
      }

      return matches;
    })
    : upstreamGeneratorUpsRenewable.filter(item => {
      let matches = true;

      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        matches = matches && (
          item.name.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query)
        );
      }

      // Filters
      if (filters.status) {
        // Mapping upstream status (online, offline, maintenance) to filter values
        matches = matches && item.status.toLowerCase() === filters.status.toLowerCase();
      }

      if (filters.type) {
        matches = matches && item.type.toLowerCase() === filters.type.toLowerCase();
      }

      return matches;
    });

  const listItems = filteredItems.map(item => {
    if (isTransmission) {
      const txItem = item as TxControlIntegration;
      return {
        id: txItem.id,
        name: txItem.system_name,
        subtitle: `${getProtocolDisplayName(txItem.protocol)} • ${txItem.data_point_count} pts`,
        status: txItem.connectivity_status.charAt(0).toUpperCase() + txItem.connectivity_status.slice(1)
      };
    } else {
      const upItem = item as GeneratorUpsRenewable;
      return {
        id: upItem.id,
        name: upItem.name,
        subtitle: `${upItem.type.toUpperCase()} • ${upItem.capacity}`,
        status: upItem.status.charAt(0).toUpperCase() + upItem.status.slice(1)
      };
    }
  });

  const filterView = (
    <EnergyListFilter
      filters={filters}
      onFiltersChange={setFilters}
      showTypeFilter={true}
      showRoleFilter={false}
      showSubstationFilter={false}
      showFeederFilter={false}
      statusOptions={isTransmission ? [
        { label: "Connected", value: "connected" },
        { label: "Disconnected", value: "disconnected" },
        { label: "Error", value: "error" },
        { label: "Maintenance", value: "maintenance" }
      ] : [
        { label: "Online", value: "online" },
        { label: "Offline", value: "offline" },
        { label: "Maintenance", value: "maintenance" }
      ]}
      typeOptions={isTransmission ? [
        { label: "SCADA", value: "scada" },
        { label: "EMS", value: "ems" },
        { label: "DERMS", value: "derms" },
        { label: "BMS", value: "bms" },
        { label: "Historian", value: "historian" }
      ] : [
        { label: "Generators", value: "generator" },
        { label: "UPS", value: "ups" },
        { label: "Solar", value: "solar" }
      ]}
    />
  );


  // Helper functions for transmission integrations
  const getSystemTypeIcon = (systemType: string) => {
    switch (systemType) {
      case "scada":
        return <Network className="h-5 w-5" />;
      case "ems":
        return <Activity className="h-5 w-5" />;
      case "derms":
        return <Zap className="h-5 w-5" />;
      case "bms":
        return <Settings className="h-5 w-5" />;
      case "historian":
        return <Power className="h-5 w-5" />;
      default:
        return <Network className="h-5 w-5" />;
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "connected":
        return "default";
      case "disconnected":
        return "secondary";
      case "error":
        return "destructive";
      case "maintenance":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getProtocolDisplayName = (protocol: string): string => {
    const protocolMap: Record<string, string> = {
      iec61850: "IEC 61850",
      dnp3: "DNP3",
      modbus_tcp: "Modbus TCP",
      opcua: "OPC UA",
      bacnet: "BACnet",
      mqtt: "MQTT",
      rest_api: "REST API"
    };
    return protocolMap[protocol] || protocol.toUpperCase();
  };

  const handleManualSync = (integrationId: string) => {
    console.log(`Manual sync triggered for integration: ${integrationId}`);
    // In production, this would call TransmissionProvider.syncIntegration(integrationId)
  };

  // Calculate statistics for transmission integrations
  const txIntegrationStats = {
    total: transmissionIntegrations.length,
    connected: transmissionIntegrations.filter(i => i.connectivity_status === 'connected').length,
    disconnected: transmissionIntegrations.filter(i => i.connectivity_status === 'disconnected').length,
    error: transmissionIntegrations.filter(i => i.connectivity_status === 'error').length,
    totalDataPoints: transmissionIntegrations.reduce((sum, i) => sum + i.data_point_count, 0)
  };

  // Calculate total capacity by type
  const capacityByType = upstreamGeneratorUpsRenewable.reduce((acc, asset) => {
    acc[asset.type] = (acc[asset.type] || 0) + asset.capacityKw;
    return acc;
  }, {} as Record<string, number>);

  // Calculate current output
  const totalCurrentOutput = upstreamGeneratorUpsRenewable.reduce(
    (sum, asset) => sum + (asset.currentOutput || 0),
    0
  );

  // Generate switching timeline events
  const switchingTimeline = [
    {
      time: "2024-12-16T14:30:00Z",
      event: "Grid Power Normal",
      source: "Grid",
      status: "active",
      duration: "Continuous"
    },
    {
      time: "2024-12-15T22:15:00Z",
      event: "UPS Switchover",
      source: "UPS-01",
      status: "completed",
      duration: "15 min"
    },
    {
      time: "2024-12-15T18:45:00Z",
      event: "Generator Start",
      source: "GEN-02",
      status: "completed",
      duration: "3h 30min"
    },
    {
      time: "2024-12-14T09:20:00Z",
      event: "Solar Peak Production",
      source: "SOLAR-01",
      status: "completed",
      duration: "6h"
    }
  ];

  // Resilience notes with runtime estimates
  const resilienceNotes = [
    {
      scenario: "Grid Outage",
      primaryBackup: "Emergency Diesel Generator (GEN-01)",
      capacity: "500 kW",
      runtime: "48 hours at full load",
      notes: "Sufficient for critical loads (ESPs, compressors, control systems)"
    },
    {
      scenario: "Extended Outage",
      primaryBackup: "Gas-Fired Generator (GEN-02)",
      capacity: "750 kW",
      runtime: "Unlimited (field gas supply)",
      notes: "Can support full facility load with field gas as fuel source"
    },
    {
      scenario: "Control System Protection",
      primaryBackup: "Control Systems UPS (UPS-01)",
      capacity: "25 kW",
      runtime: "4 hours at current load",
      notes: "Protects SCADA, PLCs, and safety systems during brief outages"
    },
    {
      scenario: "Peak Demand Reduction",
      primaryBackup: "Camp Solar Array (SOLAR-01)",
      capacity: "100 kW peak",
      runtime: "Daylight hours (6-8h/day)",
      notes: "Reduces grid demand during peak production hours, ~30% camp load offset"
    }
  ];

  // Transmission work pane content
  const transmissionWorkPaneContent = selectedIntegration ? (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Integration Overview</TabsTrigger>
          <TabsTrigger value="protocols">Protocol Details</TabsTrigger>
          <TabsTrigger value="monitoring">Health Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{txIntegrationStats.total}</div>
                <p className="text-xs text-muted-foreground">Active systems</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Connected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{txIntegrationStats.connected}</div>
                <p className="text-xs text-muted-foreground">Online systems</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{txIntegrationStats.error}</div>
                <p className="text-xs text-muted-foreground">Requiring attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Data Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{txIntegrationStats.totalDataPoints.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Monitored signals</p>
              </CardContent>
            </Card>
          </div>

          {/* Selected Integration Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getSystemTypeIcon(selectedIntegration.system_type)}
                  <div>
                    <CardTitle>{selectedIntegration.system_name}</CardTitle>
                    <CardDescription>{selectedIntegration.description}</CardDescription>
                  </div>
                </div>
                <Badge variant={getStatusBadgeVariant(selectedIntegration.connectivity_status)}>
                  {selectedIntegration.connectivity_status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">System Type</div>
                  <div className="text-lg font-semibold uppercase">{selectedIntegration.system_type}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Protocol</div>
                  <div className="text-lg font-semibold">
                    {getProtocolDisplayName(selectedIntegration.protocol)}
                    {selectedIntegration.protocol_version && (
                      <span className="text-sm text-muted-foreground ml-2">v{selectedIntegration.protocol_version}</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Endpoint</div>
                  <div className="text-sm font-mono">
                    {selectedIntegration.endpoint_host}:{selectedIntegration.endpoint_port}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Data Points</div>
                  <div className="text-lg font-semibold">{selectedIntegration.data_point_count.toLocaleString()}</div>
                </div>
                {selectedIntegration.substation_name && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Substation</div>
                    <div className="text-sm">{selectedIntegration.substation_name}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Access Mode</div>
                  <div className="text-sm">
                    <Badge variant={selectedIntegration.read_only ? "secondary" : "default"}>
                      {selectedIntegration.read_only ? "Read Only" : "Read/Write"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Sync Interval</div>
                  <div className="text-sm">{selectedIntegration.sync_interval_seconds}s</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Auto Sync</div>
                  <div className="text-sm">
                    <Badge variant={selectedIntegration.auto_sync ? "default" : "secondary"}>
                      {selectedIntegration.auto_sync ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedIntegration.last_error_message && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-destructive">Connection Error</div>
                      <div className="text-sm text-muted-foreground mt-1">{selectedIntegration.last_error_message}</div>
                      {selectedIntegration.last_error_at && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Last error: {formatDistanceToNow(new Date(selectedIntegration.last_error_at), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleManualSync(selectedIntegration.id)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Manual Sync
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Integrations by System Type */}
          <div className="space-y-6">
            {/* SCADA Systems */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Network className="h-5 w-5" />
                SCADA Systems
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transmissionIntegrations
                  .filter(integration => integration.system_type === 'scada')
                  .map(integration => (
                    <Card
                      key={integration.id}
                      className={selectedIntegration.id === integration.id ? "border-primary cursor-pointer" : "cursor-pointer"}
                      onClick={() => setSelectedIntegration(integration)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{integration.system_name}</CardTitle>
                          <Badge variant={getStatusBadgeVariant(integration.connectivity_status)}>
                            {integration.connectivity_status}
                          </Badge>
                        </div>
                        <CardDescription>
                          {getProtocolDisplayName(integration.protocol)} • {integration.data_point_count} points
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Substation:</span>
                            <span className="font-medium">{integration.substation_name || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Last Sync:</span>
                            <span className="font-medium">
                              {integration.last_sync_at
                                ? formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true })
                                : 'Never'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Access:</span>
                            <span className="font-medium">{integration.read_only ? 'Read Only' : 'Read/Write'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>

            {/* EMS/DERMS Systems */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                EMS & DERMS Systems
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transmissionIntegrations
                  .filter(integration => integration.system_type === 'ems' || integration.system_type === 'derms')
                  .map(integration => (
                    <Card
                      key={integration.id}
                      className={selectedIntegration.id === integration.id ? "border-primary cursor-pointer" : "cursor-pointer"}
                      onClick={() => setSelectedIntegration(integration)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{integration.system_name}</CardTitle>
                          <Badge variant={getStatusBadgeVariant(integration.connectivity_status)}>
                            {integration.connectivity_status}
                          </Badge>
                        </div>
                        <CardDescription>
                          {getProtocolDisplayName(integration.protocol)} • {integration.data_point_count} points
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Type:</span>
                            <span className="font-medium uppercase">{integration.system_type}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Last Sync:</span>
                            <span className="font-medium">
                              {integration.last_sync_at
                                ? formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true })
                                : 'Never'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Sync Interval:</span>
                            <span className="font-medium">{integration.sync_interval_seconds}s</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>

            {/* Other Systems (BMS, Historian) */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Support Systems
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transmissionIntegrations
                  .filter(integration => integration.system_type === 'bms' || integration.system_type === 'historian')
                  .map(integration => (
                    <Card
                      key={integration.id}
                      className={selectedIntegration.id === integration.id ? "border-primary cursor-pointer" : "cursor-pointer"}
                      onClick={() => setSelectedIntegration(integration)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{integration.system_name}</CardTitle>
                          <Badge variant={getStatusBadgeVariant(integration.connectivity_status)}>
                            {integration.connectivity_status}
                          </Badge>
                        </div>
                        <CardDescription>
                          {getProtocolDisplayName(integration.protocol)} • {integration.data_point_count} points
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Type:</span>
                            <span className="font-medium uppercase">{integration.system_type}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Last Sync:</span>
                            <span className="font-medium">
                              {integration.last_sync_at
                                ? formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true })
                                : 'Never'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Access:</span>
                            <span className="font-medium">{integration.read_only ? 'Read Only' : 'Read/Write'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="protocols" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transmission Protocol Support</CardTitle>
              <CardDescription>Supported protocols for transmission grid integration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">IEC 61850</CardTitle>
                    <CardDescription>International standard for substation automation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Use Case:</span>
                        <span>SCADA, Protection, Control</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transport:</span>
                        <span>MMS, GOOSE, SV</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Active Integrations:</span>
                        <span className="font-semibold">
                          {transmissionIntegrations.filter(i => i.protocol === 'iec61850').length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">DNP3</CardTitle>
                    <CardDescription>Distributed Network Protocol for SCADA systems</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Use Case:</span>
                        <span>SCADA, RTU Communication</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transport:</span>
                        <span>TCP/IP, Serial</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Active Integrations:</span>
                        <span className="font-semibold">
                          {transmissionIntegrations.filter(i => i.protocol === 'dnp3').length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">OPC UA</CardTitle>
                    <CardDescription>Open Platform Communications Unified Architecture</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Use Case:</span>
                        <span>EMS, Historian, Data Exchange</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transport:</span>
                        <span>TCP/IP, HTTPS</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Active Integrations:</span>
                        <span className="font-semibold">
                          {transmissionIntegrations.filter(i => i.protocol === 'opcua').length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">BACnet</CardTitle>
                    <CardDescription>Building Automation and Control Networks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Use Case:</span>
                        <span>BMS, HVAC Control</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transport:</span>
                        <span>IP, MSTP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Active Integrations:</span>
                        <span className="font-semibold">
                          {transmissionIntegrations.filter(i => i.protocol === 'bacnet').length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">REST API</CardTitle>
                    <CardDescription>RESTful web services for modern integrations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Use Case:</span>
                        <span>DERMS, Cloud Services</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transport:</span>
                        <span>HTTPS, JSON</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Active Integrations:</span>
                        <span className="font-semibold">
                          {transmissionIntegrations.filter(i => i.protocol === 'rest_api').length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Health Status</CardTitle>
              <CardDescription>Real-time connectivity and sync status monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transmissionIntegrations.map((integration) => (
                  <div key={integration.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <div className="flex-shrink-0 mt-1">
                      {integration.connectivity_status === 'connected' ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : integration.connectivity_status === 'error' ? (
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{integration.system_name}</h4>
                        <Badge variant={getStatusBadgeVariant(integration.connectivity_status)}>
                          {integration.connectivity_status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {getProtocolDisplayName(integration.protocol)} • {integration.data_point_count} data points
                        {integration.substation_name && ` • ${integration.substation_name}`}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Last Sync: </span>
                          <span className="font-medium">
                            {integration.last_sync_at
                              ? formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true })
                              : 'Never'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last Success: </span>
                          <span className="font-medium">
                            {integration.last_successful_sync_at
                              ? formatDistanceToNow(new Date(integration.last_successful_sync_at), { addSuffix: true })
                              : 'Never'}
                          </span>
                        </div>
                      </div>
                      {integration.last_error_message && (
                        <div className="mt-2 text-xs text-destructive bg-destructive/10 p-2 rounded">
                          {integration.last_error_message}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Integration Architecture</CardTitle>
              <CardDescription>Overview of transmission control system integration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="font-semibold mb-2">Data Flow</div>
                  <div className="text-sm text-muted-foreground">
                    SCADA Systems → IEC 61850/DNP3 → EMS Platform → OPC UA → Central Database → REST API → DERMS/Applications
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium mb-1">Field Layer</div>
                    <div className="text-xs text-muted-foreground">SCADA, RTUs, IEDs</div>
                    <div className="text-2xl font-bold mt-2">
                      {transmissionIntegrations.filter(i => i.system_type === 'scada').length}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium mb-1">Control Layer</div>
                    <div className="text-xs text-muted-foreground">EMS, DERMS, BMS</div>
                    <div className="text-2xl font-bold mt-2">
                      {transmissionIntegrations.filter(i => ['ems', 'derms', 'bms'].includes(i.system_type)).length}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium mb-1">Data Layer</div>
                    <div className="text-xs text-muted-foreground">Historian, Analytics</div>
                    <div className="text-2xl font-bold mt-2">
                      {transmissionIntegrations.filter(i => i.system_type === 'historian').length}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  ) : (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Select an integration to view details</p>
    </div>
  );

  // Upstream work pane content (existing)
  const getAssetIcon = (type: string) => {
    switch (type) {
      case "generator":
        return <Power className="h-5 w-5" />;
      case "ups":
        return <Battery className="h-5 w-5" />;
      case "solar":
        return <Sun className="h-5 w-5" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "default";
      case "offline":
        return "secondary";
      case "maintenance":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const workPaneContent = selectedAsset ? (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="timeline">Switching Timeline</TabsTrigger>
          <TabsTrigger value="resilience">Resilience Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Backup Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.values(capacityByType).reduce((a, b) => a + b, 0)} kW
                </div>
                <p className="text-xs text-muted-foreground">Across {upstreamGeneratorUpsRenewable.length} assets</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Current Output</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{totalCurrentOutput.toFixed(1)} kW</div>
                <p className="text-xs text-muted-foreground">Active generation</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Online Systems</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {upstreamGeneratorUpsRenewable.filter(a => a.status === 'online').length}
                </div>
                <p className="text-xs text-muted-foreground">Ready for service</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Renewable Contribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {upstreamGeneratorUpsRenewable
                    .filter(a => a.type === 'solar')
                    .reduce((sum, a) => sum + (a.currentOutput || 0), 0)
                    .toFixed(1)} kW
                </div>
                <p className="text-xs text-muted-foreground">Solar generation</p>
              </CardContent>
            </Card>
          </div>

          {/* Asset Cards by Type */}
          <div className="space-y-6">
            {/* Generators */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Power className="h-5 w-5" />
                Generators
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upstreamGeneratorUpsRenewable
                  .filter(asset => asset.type === 'generator')
                  .map(asset => (
                    <Card key={asset.id} className={selectedAsset.id === asset.id ? "border-primary" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{asset.name}</CardTitle>
                          <Badge variant={getStatusColor(asset.status)}>
                            {asset.status}
                          </Badge>
                        </div>
                        <CardDescription>
                          Fuel: {asset.fuelType?.toUpperCase()} • Capacity: {asset.capacityKw} kW
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Current Output:</span>
                            <span className="font-medium">{asset.currentOutput || 0} kW</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Utilization:</span>
                            <span className="font-medium">
                              {((asset.currentOutput || 0) / asset.capacityKw * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>

            {/* UPS Systems */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Battery className="h-5 w-5" />
                UPS Systems
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upstreamGeneratorUpsRenewable
                  .filter(asset => asset.type === 'ups')
                  .map(asset => (
                    <Card key={asset.id} className={selectedAsset.id === asset.id ? "border-primary" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{asset.name}</CardTitle>
                          <Badge variant={getStatusColor(asset.status)}>
                            {asset.status}
                          </Badge>
                        </div>
                        <CardDescription>
                          Battery Backup • Capacity: {asset.capacityKw} kW
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Current Load:</span>
                            <span className="font-medium">{asset.currentOutput || 0} kW</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Load Factor:</span>
                            <span className="font-medium">
                              {((asset.currentOutput || 0) / asset.capacityKw * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Runtime Estimate:</span>
                            <span className="font-medium text-success">
                              {asset.currentOutput ?
                                `${(4 * asset.capacityKw / asset.currentOutput).toFixed(1)} hours` :
                                'N/A'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>

            {/* Solar Systems */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Sun className="h-5 w-5" />
                Solar Systems
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upstreamGeneratorUpsRenewable
                  .filter(asset => asset.type === 'solar')
                  .map(asset => (
                    <Card key={asset.id} className={selectedAsset.id === asset.id ? "border-primary" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{asset.name}</CardTitle>
                          <Badge variant={getStatusColor(asset.status)}>
                            {asset.status}
                          </Badge>
                        </div>
                        <CardDescription>
                          Solar PV • Peak Capacity: {asset.capacityKw} kW
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Current Output:</span>
                            <span className="font-medium">{asset.currentOutput || 0} kW</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Capacity Factor:</span>
                            <span className="font-medium">
                              {((asset.currentOutput || 0) / asset.capacityKw * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Daily Production:</span>
                            <span className="font-medium text-success">
                              ~{(asset.capacityKw * 6).toFixed(0)} kWh
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Power Source Switching Timeline</CardTitle>
              <CardDescription>Recent power source transitions and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {switchingTimeline.map((event, index) => (
                  <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <div className="flex-shrink-0 mt-1">
                      {event.status === 'active' ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{event.event}</h4>
                        <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                          {event.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Source: {event.source} • Duration: {event.duration}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(event.time).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Automatic Transfer Switch (ATS) Status</CardTitle>
              <CardDescription>Current power source and transfer readiness</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <div className="font-semibold">Primary Source</div>
                    <div className="text-sm text-muted-foreground">Grid Power</div>
                  </div>
                  <Badge variant="default" className="text-lg px-4 py-2">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Active
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium mb-1">Transfer Time</div>
                    <div className="text-2xl font-bold">{'<'}100ms</div>
                    <div className="text-xs text-muted-foreground">To UPS backup</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium mb-1">Generator Start</div>
                    <div className="text-2xl font-bold">{'<'}15s</div>
                    <div className="text-xs text-muted-foreground">Emergency start time</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resilience" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resilience Analysis</CardTitle>
              <CardDescription>Backup power capabilities and runtime estimates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resilienceNotes.map((note, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{note.scenario}</CardTitle>
                          <CardDescription className="mt-1">
                            {note.primaryBackup}
                          </CardDescription>
                        </div>
                        <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Capacity</div>
                          <div className="text-lg font-semibold">{note.capacity}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Runtime</div>
                          <div className="text-lg font-semibold text-success">{note.runtime}</div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                        <strong>Notes:</strong> {note.notes}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Critical Load Priority</CardTitle>
              <CardDescription>Load shedding sequence during extended outages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded">
                  <div>
                    <div className="font-semibold">Priority 1: Safety Systems</div>
                    <div className="text-sm text-muted-foreground">ESD, Fire & Gas, SCADA</div>
                  </div>
                  <Badge variant="destructive">Critical</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-warning/10 border border-warning/20 rounded">
                  <div>
                    <div className="font-semibold">Priority 2: Production Equipment</div>
                    <div className="text-sm text-muted-foreground">ESPs, Compressors, Separators</div>
                  </div>
                  <Badge variant="default">High</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted border rounded">
                  <div>
                    <div className="font-semibold">Priority 3: Support Systems</div>
                    <div className="text-sm text-muted-foreground">HVAC, Lighting, Communications</div>
                  </div>
                  <Badge variant="secondary">Medium</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted border rounded">
                  <div>
                    <div className="font-semibold">Priority 4: Non-Essential</div>
                    <div className="text-sm text-muted-foreground">Camp facilities, Office equipment</div>
                  </div>
                  <Badge variant="outline">Low</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  ) : (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Select an asset to view details</p>
    </div>
  );

  return (
    <EMSPageShell
      title="System Integration"
      featureSetName="Energy Control Advisory & Integration"
      featureName="System Integration"
      listType="meters"
      listItems={listItems}
      selectedItem={listItems.find(i => i.id === (isTransmission ? selectedIntegration?.id : selectedAsset?.id))}
      onItemSelect={(item) => {
        if (isTransmission) {
          const selected = transmissionIntegrations.find(i => i.id === item.id);
          if (selected) {
            setSelectedIntegration(selected);
            setActiveTab("overview");
          }
        } else {
          const selected = upstreamGeneratorUpsRenewable.find(i => i.id === item.id);
          if (selected) {
            setSelectedAsset(selected);
            setActiveTab("overview");
          }
        }
      }}
      workPaneContent={isTransmission ? transmissionWorkPaneContent : workPaneContent}
      searchPlaceholder={isTransmission ? "Search integrations..." : "Search backup systems..."}
      onSearch={setSearchQuery}
      listFilterContent={filterView}
      sector={sector}
      subsector={subsector}
      tenantName={isTransmission ? "DEWA Transmission" : "GulfUpstream Demo"}
    />
  );
}
