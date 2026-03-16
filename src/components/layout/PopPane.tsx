import React from "react";
import { X, Server, Network, Zap, CheckCircle, Clock, AlertTriangle, Database, Droplets, Settings, Cpu, Gauge, MapPin, Calendar, Activity, Search, Wifi, WifiOff, Globe, Shield } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useLayout } from "@/context/LayoutContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DiscoveryAgent, DiscoveryAgentType, DiscoveryAgentStatus, UpstreamAsset, UpstreamAssetType, UpstreamDiscoveryJob, DiscoveryJobType, DiscoveryJobStatus, ConnectionEndpoint, EndpointStatus, Protocol, LinearAsset } from "@/types/assets";
import { upstreamAssetTypes, fields, pads, dataPoints, upstreamAssets } from "@/data/upstreamMockData";
import { SectorSpecificModal } from "./SectorSpecificModal";
import { SectorSpecificModalData } from "@/context/AppContext";
import { WorkOrderFormData, ReportScheduleFormData } from "@/types/workOrder";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CollapseToggle } from "./CollapseToggle";

export function PopPane() {
  const { isPopPaneOpen, setIsPopPaneOpen, popPaneContent } = useApp();
  const { layoutState, setPopPaneVisible } = useLayout();

  const handleWorkOrderSubmit = (data: WorkOrderFormData) => {
    // Mock submission - in real app would call API
    console.log("Work Order Created:", data);
    // Show success message (could use toast)
    alert("Work order created successfully!");
    setIsPopPaneOpen(false);
  };

  const handleReportScheduleSubmit = (data: ReportScheduleFormData) => {
    // Mock submission - in real app would call API
    console.log("Report Scheduled:", data);
    // Show success message (could use toast)
    alert("Report scheduled successfully!");
    setIsPopPaneOpen(false);
  };

  // Sync with layout context
  React.useEffect(() => {
    setPopPaneVisible(isPopPaneOpen);
  }, [isPopPaneOpen, setPopPaneVisible]);

  if (!isPopPaneOpen) return null;

  // Mobile layout - overlay
  if (layoutState.layoutMode === 'mobile') {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setIsPopPaneOpen(false)}
        />

        {/* Panel */}
        <div
          className="fixed top-14 right-0 bottom-0 bg-pane-pop border-l border-border z-50 flex flex-col animate-slide-in-right shadow-2xl"
          style={{ width: `${layoutState.popPaneWidth}px` }}
        >
          {/* Header */}
          <div className="pane-header">
            <h3 className="text-base font-semibold">
              {popPaneContent.type === "discovery-agent" && "Discovery Agent"}
              {popPaneContent.type === "discovery-job" && "Discovery Job"}
              {popPaneContent.type === "connection-endpoint" && "Connection Endpoint"}
              {popPaneContent.type === "upstream-asset" && "Asset Details"}
              {popPaneContent.type === "linear-asset" && "Linear Asset"}
              {popPaneContent?.type === "sim-issue" && "Create SIM Issue"}
              {popPaneContent?.type === "ci-project" && "Create CI Project"}
              {popPaneContent?.type === "optimization-scenario" && "Create Optimization Scenario"}
              {!popPaneContent.type && "Pop Pane"}
            </h3>
            <CollapseToggle
              pane="pop"
              isCollapsed={!isPopPaneOpen}
              onToggle={() => setIsPopPaneOpen(false)}
            />
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4">
              {popPaneContent.type === "discovery-agent" && <DiscoveryAgentQuickView agent={popPaneContent.data as DiscoveryAgent} />}
              {popPaneContent.type === "discovery-job" && <QuickDiscoveryJobView job={popPaneContent.data as UpstreamDiscoveryJob} />}
              {popPaneContent.type === "connection-endpoint" && <QuickEndpointView endpoint={popPaneContent.data as ConnectionEndpoint} />}
              {popPaneContent.type === "upstream-asset" && <QuickAssetView asset={popPaneContent.data as UpstreamAsset} />}
              {popPaneContent.type === "linear-asset" && <QuickLinearAssetView asset={popPaneContent.data as LinearAsset} />}
              {(popPaneContent?.type === "sim-issue" ||
                popPaneContent?.type === "ci-project" ||
                popPaneContent?.type === "optimization-scenario") &&
                popPaneContent.data &&
                <SectorSpecificModal data={popPaneContent.data as SectorSpecificModalData} />}
            </div>
          </ScrollArea>
        </div>
      </>
    );
  }

  // Desktop/Tablet layout - integrated in grid
  return (
    <div className="bg-pane-pop border-l border-border flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="pane-header">
        <h3 className="text-base font-semibold">
          {popPaneContent.type === "discovery-agent" && "Discovery Agent"}
          {popPaneContent.type === "discovery-job" && "Discovery Job"}
          {popPaneContent.type === "connection-endpoint" && "Connection Endpoint"}
          {popPaneContent.type === "upstream-asset" && "Asset Details"}
          {popPaneContent.type === "linear-asset" && "Linear Asset"}
          {popPaneContent?.type === "sim-issue" && "Create SIM Issue"}
          {popPaneContent?.type === "ci-project" && "Create CI Project"}
          {popPaneContent?.type === "optimization-scenario" && "Create Optimization Scenario"}
          {!popPaneContent.type && "Pop Pane"}
        </h3>
        <CollapseToggle
          pane="pop"
          isCollapsed={!isPopPaneOpen}
          onToggle={() => setIsPopPaneOpen(false)}
        />
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">
          {popPaneContent.type === "discovery-agent" && <DiscoveryAgentQuickView agent={popPaneContent.data as DiscoveryAgent} />}
          {popPaneContent.type === "discovery-job" && <QuickDiscoveryJobView job={popPaneContent.data as UpstreamDiscoveryJob} />}
          {popPaneContent.type === "connection-endpoint" && <QuickEndpointView endpoint={popPaneContent.data as ConnectionEndpoint} />}
          {popPaneContent.type === "upstream-asset" && <QuickAssetView asset={popPaneContent.data as UpstreamAsset} />}
          {popPaneContent.type === "linear-asset" && <QuickLinearAssetView asset={popPaneContent.data as LinearAsset} />}
          {(popPaneContent?.type === "sim-issue" ||
            popPaneContent?.type === "ci-project" ||
            popPaneContent?.type === "optimization-scenario") &&
            popPaneContent.data &&
            <SectorSpecificModal data={popPaneContent.data as SectorSpecificModalData} />}
        </div>
      </ScrollArea>
    </div>
  );
}

function QuickDiscoveryJobView({ job }: { job: UpstreamDiscoveryJob }) {
  const getJobTypeIcon = (type: DiscoveryJobType) => {
    switch (type) {
      case "network":
        return Network;
      case "field":
        return Globe;
      case "pad":
        return Server;
      case "pipelineSegment":
        return Settings;
      default:
        return Search;
    }
  };

  const getJobTypeLabel = (type: DiscoveryJobType) => {
    switch (type) {
      case "network":
        return "Network Scan";
      case "field":
        return "Field Discovery";
      case "pad":
        return "Pad Discovery";
      case "pipelineSegment":
        return "Pipeline Segment";
      default:
        return type;
    }
  };

  const getStatusIcon = (status: DiscoveryJobStatus) => {
    switch (status) {
      case "completed":
        return CheckCircle;
      case "running":
        return Activity;
      case "pending":
        return Clock;
      case "failed":
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: DiscoveryJobStatus) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "running":
        return "text-blue-600";
      case "pending":
        return "text-yellow-600";
      case "failed":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const TypeIcon = getJobTypeIcon(job.type);
  const StatusIcon = getStatusIcon(job.status);

  return (
    <div className="space-y-6">
      {/* Job Header */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <TypeIcon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1 truncate">{job.name}</h4>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {getJobTypeLabel(job.type)}
              </Badge>
              <div className="flex items-center gap-1">
                <StatusIcon className={`w-3 h-3 ${getStatusColor(job.status)}`} />
                <span className="text-xs text-muted-foreground capitalize">{job.status}</span>
              </div>
            </div>
            {job.description && (
              <p className="text-xs text-muted-foreground">{job.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="space-y-4">
        <div>
          <h5 className="text-sm font-medium mb-2">Discovery Scope</h5>
          <div className="space-y-1 text-xs">
            {job.scope.ipRange && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">IP Range:</span>
                <span className="font-mono">{job.scope.ipRange}</span>
              </div>
            )}
            {job.scope.fieldId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Field:</span>
                <span>{job.scope.fieldId}</span>
              </div>
            )}
            {job.scope.padId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pad:</span>
                <span>{job.scope.padId}</span>
              </div>
            )}
            {job.scope.pipelineId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pipeline:</span>
                <span>{job.scope.pipelineId}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h5 className="text-sm font-medium mb-2">Results</h5>
          <div className="bg-secondary/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Assets Found:</span>
              <Badge variant="outline" className="text-xs">
                {job.foundCount}
              </Badge>
            </div>
            {job.lastRunAt && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Last Run:</span>
                <span className="text-xs font-mono">
                  {new Date(job.lastRunAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {job.errors && job.errors.length > 0 && (
          <div>
            <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Errors
            </h5>
            <div className="space-y-1">
              {job.errors.slice(0, 2).map((error, index) => (
                <div key={index} className="text-xs bg-red-50 border border-red-200 rounded p-2 text-red-800">
                  {error}
                </div>
              ))}
              {job.errors.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{job.errors.length - 2} more errors
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h5 className="text-sm font-medium">Quick Actions</h5>
        <div className="grid grid-cols-2 gap-2">
          {job.status === "pending" || job.status === "failed" ? (
            <Button variant="outline" size="sm" className="justify-start text-xs">
              Run Job
            </Button>
          ) : job.status === "running" ? (
            <Button variant="outline" size="sm" className="justify-start text-xs">
              Stop Job
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="justify-start text-xs">
              Re-run Job
            </Button>
          )}
          <Button variant="outline" size="sm" className="justify-start text-xs">
            View Results
          </Button>
          <Button variant="outline" size="sm" className="justify-start text-xs">
            Duplicate Job
          </Button>
          <Button variant="outline" size="sm" className="justify-start text-xs">
            View Logs
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuickEndpointView({ endpoint }: { endpoint: ConnectionEndpoint }) {
  const getProtocolIcon = (protocol: Protocol) => {
    switch (protocol) {
      case "opc-ua":
        return Network;
      case "modbus-tcp":
        return Server;
      case "hart":
        return Zap;
      case "ff":
        return Settings;
      case "mqtt":
        return Wifi;
      default:
        return Network;
    }
  };

  const getProtocolLabel = (protocol: Protocol) => {
    switch (protocol) {
      case "opc-ua":
        return "OPC-UA";
      case "modbus-tcp":
        return "Modbus TCP";
      case "hart":
        return "HART";
      case "ff":
        return "Foundation Fieldbus";
      case "mqtt":
        return "MQTT";
    }
  };

  const getStatusIcon = (status: EndpointStatus) => {
    switch (status) {
      case "up":
        return CheckCircle;
      case "down":
        return WifiOff;
      case "unknown":
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: EndpointStatus) => {
    switch (status) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      case "unknown":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const ProtocolIcon = getProtocolIcon(endpoint.protocol);
  const StatusIcon = getStatusIcon(endpoint.status);

  // Get linked assets count (mock data for demo)
  const linkedAssetsCount = Math.floor(Math.random() * 8) + 2; // 2-9 assets

  return (
    <div className="space-y-6">
      {/* Endpoint Header */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <ProtocolIcon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1 truncate">{endpoint.name}</h4>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {getProtocolLabel(endpoint.protocol)}
              </Badge>
              <div className="flex items-center gap-1">
                <StatusIcon className={`w-3 h-3 ${getStatusColor(endpoint.status)}`} />
                <span className="text-xs text-muted-foreground capitalize">{endpoint.status}</span>
              </div>
            </div>
            {endpoint.description && (
              <p className="text-xs text-muted-foreground">{endpoint.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Endpoint Details */}
      <div className="space-y-4">
        <div>
          <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Network className="w-4 h-4" />
            Connection Details
          </h5>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Address:</span>
              <span className="font-mono">{endpoint.address}</span>
            </div>
            {endpoint.port && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Port:</span>
                <span className="font-mono">{endpoint.port}</span>
              </div>
            )}
            {endpoint.zone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network Zone:</span>
                <Badge variant="outline" className="text-xs">
                  {endpoint.zone}
                </Badge>
              </div>
            )}
            {endpoint.hazardousArea && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hazardous Area:</span>
                <Badge variant="outline" className="text-xs">
                  {endpoint.hazardousArea}
                </Badge>
              </div>
            )}
          </div>
        </div>

        <div>
          <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Status Information
          </h5>
          <div className="bg-secondary/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Connection Status:</span>
              <div className="flex items-center gap-1">
                <StatusIcon className={`w-3 h-3 ${getStatusColor(endpoint.status)}`} />
                <span className="text-xs capitalize">{endpoint.status}</span>
              </div>
            </div>
            {endpoint.lastSeen && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Last Seen:</span>
                <span className="text-xs font-mono">
                  {new Date(endpoint.lastSeen).toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Linked Assets:</span>
              <Badge variant="outline" className="text-xs">
                {linkedAssetsCount}
              </Badge>
            </div>
          </div>
        </div>

        {/* Protocol Specific Info */}
        <div>
          <h5 className="text-sm font-medium mb-2">Protocol Information</h5>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Protocol:</span>
              <span>{getProtocolLabel(endpoint.protocol)}</span>
            </div>
            {endpoint.protocol === "modbus-tcp" && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unit ID Range:</span>
                  <span className="font-mono">1-10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Function Codes:</span>
                  <span className="font-mono">03, 04, 16</span>
                </div>
              </>
            )}
            {endpoint.protocol === "opc-ua" && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Security Mode:</span>
                  <span>SignAndEncrypt</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Namespace:</span>
                  <span className="font-mono">ns=2</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h5 className="text-sm font-medium">Quick Actions</h5>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="justify-start text-xs">
            Test Connection
          </Button>
          <Button variant="outline" size="sm" className="justify-start text-xs">
            View Assets
          </Button>
          <Button variant="outline" size="sm" className="justify-start text-xs">
            Configure
          </Button>
          <Button variant="outline" size="sm" className="justify-start text-xs">
            View Logs
          </Button>
        </div>
      </div>
    </div>
  );
}

function DiscoveryAgentContent() {
  return (
    <div className="space-y-6">
      <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
        <h4 className="text-sm font-semibold mb-2">Agent Status</h4>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-sm text-muted-foreground">Connected to Gateway</span>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="justify-start">
            Start Network Scan
          </Button>
          <Button variant="outline" size="sm" className="justify-start">
            Refresh Endpoints
          </Button>
          <Button variant="outline" size="sm" className="justify-start">
            View Discovered
          </Button>
          <Button variant="outline" size="sm" className="justify-start">
            Configure Agent
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Recent Activity</h4>
        <div className="space-y-2">
          {[
            { time: "2 min ago", action: "Discovered 3 new devices" },
            { time: "15 min ago", action: "Network scan completed" },
            { time: "1 hour ago", action: "Agent reconnected" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="text-xs text-muted-foreground w-16 shrink-0">{item.time}</span>
              <span className="text-foreground">{item.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DiscoveryAgentQuickView({ agent }: { agent: DiscoveryAgent }) {
  const getAgentTypeIcon = (type: DiscoveryAgentType) => {
    switch (type) {
      case "rtu-gateway":
        return Server;
      case "opc-server":
        return Network;
      case "scada-gateway":
        return Zap;
      default:
        return Server;
    }
  };

  const getAgentTypeLabel = (type: DiscoveryAgentType) => {
    switch (type) {
      case "rtu-gateway":
        return "RTU Gateway";
      case "opc-server":
        return "OPC-UA Server";
      case "scada-gateway":
        return "SCADA Gateway";
      default:
        return type;
    }
  };

  const getStatusIcon = (status: DiscoveryAgentStatus) => {
    switch (status) {
      case "active":
        return CheckCircle;
      case "inactive":
        return Clock;
      case "error":
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: DiscoveryAgentStatus) => {
    switch (status) {
      case "active":
        return "text-green-600";
      case "inactive":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const TypeIcon = getAgentTypeIcon(agent.type);
  const StatusIcon = getStatusIcon(agent.status);

  return (
    <div className="space-y-6">
      {/* Agent Header */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <TypeIcon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1 truncate">{agent.name}</h4>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {getAgentTypeLabel(agent.type)}
              </Badge>
              <div className="flex items-center gap-1">
                <StatusIcon className={`w-3 h-3 ${getStatusColor(agent.status)}`} />
                <span className="text-xs text-muted-foreground capitalize">{agent.status}</span>
              </div>
            </div>
            {agent.description && (
              <p className="text-xs text-muted-foreground">{agent.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Agent Details */}
      <div className="space-y-4">
        <div>
          <h5 className="text-sm font-medium mb-2">Protocols</h5>
          <div className="flex flex-wrap gap-1">
            {agent.protocols.map((protocol) => (
              <Badge key={protocol} variant="outline" className="text-xs">
                {protocol.toUpperCase()}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h5 className="text-sm font-medium mb-2">Assigned Scopes</h5>
          <div className="space-y-2">
            {agent.assignedScopes.slice(0, 3).map((scope, index) => (
              <div key={index} className="text-xs bg-secondary/30 rounded p-2">
                {scope.fieldId && <div>Field: {scope.fieldId}</div>}
                {scope.padId && <div>Pad: {scope.padId}</div>}
                {scope.pipelineId && <div>Pipeline: {scope.pipelineId}</div>}
              </div>
            ))}
            {agent.assignedScopes.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{agent.assignedScopes.length - 3} more scopes
              </div>
            )}
          </div>
        </div>

        {agent.lastRun && (
          <div>
            <h5 className="text-sm font-medium mb-2">Last Run</h5>
            <p className="text-xs text-muted-foreground">
              {new Date(agent.lastRun).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h5 className="text-sm font-medium">Quick Actions</h5>
        <div className="grid grid-cols-2 gap-2">
          {agent.status === "active" ? (
            <Button variant="outline" size="sm" className="justify-start text-xs">
              Stop Agent
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="justify-start text-xs">
              Start Agent
            </Button>
          )}
          <Button variant="outline" size="sm" className="justify-start text-xs">
            Configure
          </Button>
          <Button variant="outline" size="sm" className="justify-start text-xs">
            View Logs
          </Button>
          <Button variant="outline" size="sm" className="justify-start text-xs">
            Test Connection
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuickAssetView({ asset }: { asset: UpstreamAsset }) {
  // Get asset type information
  const assetType = upstreamAssetTypes.find(type => type.id === asset.typeId);

  // Get location information
  const field = fields.find(f => f.id === asset.hierarchyIds.fieldId);
  const pad = pads.find(p => p.id === asset.hierarchyIds.padId);

  // Get data points for this asset
  const assetDataPoints = dataPoints.filter(dp => dp.assetId === asset.id);

  // Get asset icon based on category
  const getAssetIcon = (category?: string) => {
    switch (category) {
      case "well": return Droplets;
      case "process": return Settings;
      case "pipeline": return Network;
      case "instrumentation": return Cpu;
      default: return Gauge;
    }
  };

  const Icon = getAssetIcon(assetType?.category);

  return (
    <div className="space-y-6">
      {/* Asset Header */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1 truncate">{asset.name}</h4>
            <div className="flex items-center gap-2 mb-2">
              {assetType && (
                <Badge variant="secondary" className="text-xs">
                  {assetType.name}
                </Badge>
              )}
              <StatusBadge status={asset.status} size="sm" />
            </div>
            {asset.description && (
              <p className="text-xs text-muted-foreground">{asset.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Asset Details */}
      <div className="space-y-4">
        {/* Location */}
        <div>
          <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location
          </h5>
          <div className="space-y-1 text-xs">
            {field && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Field:</span>
                <span>{field.name.replace('field-', '').replace('-', ' ')}</span>
              </div>
            )}
            {pad && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pad:</span>
                <span>{pad.name}</span>
              </div>
            )}
            {asset.geoLocation && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coordinates:</span>
                <span className="font-mono">
                  {asset.geoLocation.lat.toFixed(4)}, {asset.geoLocation.lng.toFixed(4)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Asset Information */}
        <div>
          <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Asset Information
          </h5>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Asset ID:</span>
              <span className="font-mono">{asset.id}</span>
            </div>
            {assetType && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="capitalize">{assetType.category}</span>
                </div>

              </>
            )}
            {asset.criticality && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criticality:</span>
                <span>{asset.criticality}</span>
              </div>
            )}
          </div>
        </div>

        {/* Data Points */}
        <div>
          <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Data Points
          </h5>
          <div className="bg-secondary/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Total Points:</span>
              <Badge variant="outline" className="text-xs">
                {assetDataPoints.length}
              </Badge>
            </div>
            {assetDataPoints.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Recent points:</div>
                {assetDataPoints.slice(0, 3).map((dp) => (
                  <div key={dp.id} className="flex items-center justify-between text-xs">
                    <span className="font-mono truncate">{dp.logicalName}</span>
                    <Badge variant="outline" className="text-[10px] px-1">
                      {dp.direction}
                    </Badge>
                  </div>
                ))}
                {assetDataPoints.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{assetDataPoints.length - 3} more points
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sector Tags */}
        {assetType?.sectorTags && assetType.sectorTags.length > 0 && (
          <div>
            <h5 className="text-sm font-medium mb-2">Sector Tags</h5>
            <div className="flex flex-wrap gap-1">
              {assetType.sectorTags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Additional Properties */}
        {asset.hazardousAreaClass && (
          <div>
            <h5 className="text-sm font-medium mb-2">Safety Classification</h5>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hazardous Area:</span>
                <Badge variant="outline" className="text-xs">
                  {asset.hazardousAreaClass}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h5 className="text-sm font-medium">Quick Actions</h5>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="justify-start text-xs">
            View Details
          </Button>
          <Button variant="outline" size="sm" className="justify-start text-xs">
            Edit Asset
          </Button>
          <Button variant="outline" size="sm" className="justify-start text-xs">
            View Data Points
          </Button>
          <Button variant="outline" size="sm" className="justify-start text-xs">
            Asset History
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuickLinearAssetView({ asset }: { asset: LinearAsset }) {
  // Get asset type information
  const assetType = upstreamAssetTypes.find(type => type.id === asset.typeId);

  // Get location information
  const field = fields.find(f => f.id === asset.hierarchyIds.fieldId);
  const pad = pads.find(p => p.id === asset.hierarchyIds.padId);

  // Get start and end node information
  const startNode = upstreamAssets.find(a => a.id === asset.startNodeId);
  const endNode = upstreamAssets.find(a => a.id === asset.endNodeId);

  // Count critical issues
  const criticalIssues = asset.issues?.filter(issue =>
    issue.severity === "critical" || issue.severity === "high"
  ) || [];

  return (
    <div className="space-y-6">
      {/* Asset Header */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Network className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1 truncate">{asset.name}</h4>
            <div className="flex items-center gap-2 mb-2">
              {assetType && (
                <Badge variant="secondary" className="text-xs">
                  {assetType.name}
                </Badge>
              )}
              <StatusBadge status={asset.status} size="sm" />
              {criticalIssues.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {criticalIssues.length} issues
                </Badge>
              )}
            </div>
            {asset.description && (
              <p className="text-xs text-muted-foreground">{asset.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Asset Details */}
      <div className="space-y-4">
        {/* Connection Path */}
        <div>
          <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Network className="w-4 h-4" />
            Connection Path
          </h5>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Node:</span>
              <span>{startNode?.name || asset.startNodeId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">End Node:</span>
              <span>{endNode?.name || asset.endNodeId}</span>
            </div>
          </div>
        </div>

        {/* Physical Properties */}
        <div>
          <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            Physical Properties
          </h5>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Length:</span>
              <span>{asset.length} {asset.lengthUnit}</span>
            </div>
            {asset.diameter && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Diameter:</span>
                <span>{asset.diameter}"</span>
              </div>
            )}
            {asset.maop && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">MAOP:</span>
                <span>{asset.maop} psi</span>
              </div>
            )}
            {asset.material && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Material:</span>
                <span>{asset.material}</span>
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        {(field || pad) && (
          <div>
            <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </h5>
            <div className="space-y-1 text-xs">
              {field && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Field:</span>
                  <span>{field.name.replace('field-', '').replace('-', ' ')}</span>
                </div>
              )}
              {pad && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pad:</span>
                  <span>{pad.name}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Issues */}
        {asset.issues && asset.issues.length > 0 && (
          <div>
            <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Issues ({asset.issues.length})
            </h5>
            <div className="space-y-2">
              {asset.issues.slice(0, 3).map((issue) => (
                <div key={issue.id} className="bg-secondary/30 rounded p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={issue.severity === "critical" || issue.severity === "high" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {issue.severity}
                    </Badge>
                    <span className="text-xs font-medium">{issue.type.replace('-', ' ')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{issue.description}</p>
                </div>
              ))}
              {asset.issues.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{asset.issues.length - 3} more issues
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h5 className="text-sm font-medium">Quick Actions</h5>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="justify-start text-xs">
            View Details
          </Button>
          <Button variant="outline" size="sm" className="justify-start text-xs">
            Edit Asset
          </Button>
          <Button variant="outline" size="sm" className="justify-start text-xs">
            View Issues
          </Button>
          <Button variant="outline" size="sm" className="justify-start text-xs">
            Asset History
          </Button>
        </div>
      </div>
    </div>
  );
}

function AIAssistantContent() {
  return (
    <div className="space-y-4">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          AI Assistant can help you analyze your asset portfolio, identify anomalies, and suggest optimizations.
        </p>
      </div>
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">Coming soon in Stage 03</p>
      </div>
    </div>
  );
}
