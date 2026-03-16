import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { useDataProvider } from "@/hooks/useDataProvider";
import { cn } from "@/lib/utils";
import { WorkPane } from "@/components/layout/WorkPane";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Calendar,
  FileText,
  Gauge,
  History,
  MapPin,
  Network,
  Settings,
  Shield,
  Thermometer,
  Zap,
  Droplets,
  Cpu,
  ExternalLink,
  Download,
  Edit,
  Search,
} from "lucide-react";
import {
  UpstreamAsset,
} from "@/types/assets";
import {
  upstreamAssetTypes,
  fields,
  pads,
  wells,
  basins,
  dataPoints
} from "@/data/upstreamMockData";

export function AssetDetailPage() {
  const { selectedAsset, setSelectedAsset, currentTenant } = useApp();
  const { provider } = useDataProvider();
  const navigate = useNavigate();

  const [assets, setAssets] = useState<UpstreamAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    const loadAssets = async () => {
      setLoading(true);
      try {
        const data = await provider.getUpstreamAssetsByTenant(currentTenant.id);
        setAssets(data);
      } catch (error) {
        console.error("Failed to load assets:", error);
      } finally {
        setLoading(false);
      }
    };
    loadAssets();
  }, [provider, currentTenant.id]);

  const filterConfigs = [
    {
      key: "status",
      label: "Status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { label: "All Statuses", value: "all" },
        { label: "Active", value: "active" },
        { label: "Maintenance", value: "maintenance" },
        { label: "Inactive", value: "inactive" },
        { label: "Shut-in", value: "shut-in" },
      ],
    },
    {
      key: "type",
      label: "Asset Type",
      value: typeFilter,
      onChange: setTypeFilter,
      options: [
        { label: "All Types", value: "all" },
        ...upstreamAssetTypes.map(t => ({ label: t.name, value: t.id })),
      ],
    },
  ];

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      const matchesType = typeFilter === "all" || a.typeId === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [assets, searchQuery, statusFilter, typeFilter]);

  // Cast to UpstreamAsset if it exists
  const asset = selectedAsset as UpstreamAsset | null;

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      content: asset ? <OverviewTab asset={asset} /> : null,
    },
    {
      id: "telemetry",
      label: "Telemetry",
      content: asset ? <TelemetryTab asset={asset} /> : null,
    },
    {
      id: "relationships",
      label: "Relationships",
      content: asset ? <RelationshipsTab asset={asset} /> : null,
    },
    {
      id: "documents",
      label: "Documents",
      content: asset ? <DocumentsTab asset={asset} /> : null,
    },
    {
      id: "history",
      label: "History",
      content: asset ? <HistoryTab asset={asset} /> : null,
    },
    {
      id: "compliance",
      label: "Compliance/Safety",
      content: asset ? <ComplianceTab asset={asset} /> : null,
    },
  ];

  return (
    <>
      <ListPane
        title="Assets"
        subtitle={`${filteredAssets.length} total assets`}
        showFilters={true}
        showExpandableFilters={true}
        filters={filterConfigs}
        onSearch={setSearchQuery}
        searchPlaceholder="Search assets..."
      >
        <div className="space-y-1 w-full overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : filteredAssets.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedAsset(item)}
              className={cn(
                "p-3 rounded-xl border cursor-pointer transition-all duration-200 w-full max-w-[286px] overflow-hidden block",
                selectedAsset?.id === item.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-transparent hover:bg-secondary/50 shadow-none border"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className={cn(
                    "p-1.5 rounded-lg shrink-0",
                    selectedAsset?.id === item.id ? "bg-primary/10" : "bg-secondary/50"
                  )}>
                    {getAssetIcon({
                      typeId: item.typeId,
                      className: cn(
                        "w-4 h-4",
                        selectedAsset?.id === item.id ? "text-primary" : "text-muted-foreground"
                      )
                    })}
                  </div>
                  <span className="font-medium truncate text-sm">{item.name}</span>
                </div>
                <StatusBadge status={item.status} size="xs" />
              </div>

              <div className="flex items-center gap-3 text-[10px] text-muted-foreground ml-9">
                <div className="flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  <span className="truncate max-w-[80px]">{getAssetTypeName(item.typeId)}</span>
                </div>
                {item.criticality && (
                  <Badge variant="outline" className="h-4 text-[9px] px-1 py-0 leading-none">
                    {item.criticality}
                  </Badge>
                )}
              </div>
            </div>
          ))}

          {!loading && filteredAssets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center mb-2">
                <Search className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No assets found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </ListPane>

      <WorkPane
        key={asset?.id || "no-selection"}
        title={asset?.name || "Asset Detail"}
        subtitle={asset ? `Asset 360 View • ${getAssetTypeName(asset.typeId)}` : "No asset selected"}
        tabs={asset ? tabs : []}
        actions={
          asset ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button size="sm" className="gap-2">
                <Edit className="w-4 h-4" />
                Edit Asset
              </Button>
            </div>
          ) : undefined
        }
      >
        {!asset && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
              <Settings className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Asset Selected</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Please select an asset from the list on the left or browse the Portfolio to view detailed information.
            </p>
            <Button variant="outline" onClick={() => navigate("/assets/portfolio/overview")}>
              Go to Portfolio
            </Button>
          </div>
        )}
      </WorkPane>
    </>
  );
}

function OverviewTab({ asset }: { asset: UpstreamAsset }) {
  const assetType = upstreamAssetTypes.find(t => t.id === asset.typeId);
  const hierarchyInfo = getHierarchyInfo(asset);

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Asset Type</label>
              <div className="text-sm font-medium">{assetType?.name || "Unknown"}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="flex items-center gap-2">
                <StatusBadge status={asset.status} size="sm" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Criticality</label>
              <div>
                {asset.criticality ? (
                  <Badge
                    variant={asset.criticality === "High" ? "destructive" : asset.criticality === "Medium" ? "secondary" : "outline"}
                    className="text-xs"
                  >
                    {asset.criticality}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">Not specified</span>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Role</label>
              <div className="text-sm capitalize">{asset.role}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Hazardous Area Class</label>
              <div className="text-sm">
                {asset.hazardousAreaClass ? (
                  <Badge variant={asset.hazardousAreaClass.includes("Zone 0") ? "destructive" : "secondary"} className="text-xs">
                    {asset.hazardousAreaClass}
                  </Badge>
                ) : (
                  "Not specified"
                )}
              </div>
            </div>
            {asset.geoLocation && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <div className="text-sm flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {asset.geoLocation.lat.toFixed(4)}, {asset.geoLocation.lng.toFixed(4)}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hierarchy Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            Hierarchy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            {hierarchyInfo.basin && (
              <>
                <span className="font-medium">{hierarchyInfo.basin.name}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
              </>
            )}
            {hierarchyInfo.field && (
              <>
                <span className="font-medium">{hierarchyInfo.field.name}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
              </>
            )}
            {hierarchyInfo.pad && (
              <>
                <span className="font-medium">{hierarchyInfo.pad.name}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
              </>
            )}
            {hierarchyInfo.well && (
              <>
                <span className="font-medium">{hierarchyInfo.well.name}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
              </>
            )}
            <span className="font-medium text-primary">{asset.name}</span>
          </div>
        </CardContent>
      </Card>

      {/* Production Context */}
      {asset.productionContext && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="w-5 h-5" />
              Production Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {asset.productionContext.wellType && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Well Type</label>
                  <div className="text-sm font-medium capitalize">{asset.productionContext.wellType}</div>
                </div>
              )}
              {asset.productionContext.fluid && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fluid Type</label>
                  <div className="text-sm font-medium capitalize">{asset.productionContext.fluid}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {asset.description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{asset.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TelemetryTab({ asset }: { asset: UpstreamAsset }) {
  const assetDataPoints = dataPoints.filter(dp => dp.assetId === asset.id);

  // Mock telemetry data based on asset type
  const mockTelemetryData = generateMockTelemetryData(asset);

  return (
    <div className="space-y-6">
      {/* Live Data Points */}
      {assetDataPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Live Data Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assetDataPoints.map(dp => (
                <div key={dp.id} className="p-3 bg-secondary/20 rounded-lg">
                  <div className="text-sm font-medium mb-1">{dp.logicalName}</div>
                  <div className="text-lg font-bold text-primary">
                    {generateMockValue(dp.unit)} {dp.unit}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mock Charts/Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockTelemetryData.map((chart, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {chart.icon}
                {chart.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {chart.data.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-secondary/10 rounded">
                    <span className="text-sm">{item.label}</span>
                    <span className="font-medium">{item.value} {item.unit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Telemetry Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Telemetry Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>Polling Interval: 30 seconds</p>
            <p>Data Retention: 90 days</p>
            <p>Alarm Thresholds: Configured</p>
            <p>Historical Trending: Enabled</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RelationshipsTab({ asset }: { asset: UpstreamAsset }) {
  const relationships = generateAssetRelationships(asset);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            Equipment Chain
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {relationships.upstream.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Upstream Equipment</h4>
                <div className="space-y-2">
                  {relationships.upstream.map((rel, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-secondary/10 rounded">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                        {getAssetIcon({ typeId: rel.typeId, className: "w-4 h-4 text-primary" })}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{rel.name}</div>
                        <div className="text-xs text-muted-foreground">{rel.type}</div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center py-2">
              <div className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                {asset.name}
              </div>
            </div>

            {relationships.downstream.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Downstream Equipment</h4>
                <div className="space-y-2">
                  {relationships.downstream.map((rel, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-secondary/10 rounded">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                        {getAssetIcon({ typeId: rel.typeId, className: "w-4 h-4 text-primary" })}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{rel.name}</div>
                        <div className="text-xs text-muted-foreground">{rel.type}</div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentsTab({ asset }: { asset: UpstreamAsset }) {
  const mockDocuments = generateMockDocuments(asset);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Asset Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockDocuments.map((doc, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-secondary/20 cursor-pointer">
                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                  <doc.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{doc.name}</div>
                  <div className="text-xs text-muted-foreground">{doc.type} • {doc.size} • {doc.date}</div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HistoryTab({ asset }: { asset: UpstreamAsset }) {
  const mockHistory = generateMockHistory(asset);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Asset History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockHistory.map((event, index) => (
              <div key={index} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <event.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{event.title}</div>
                  <div className="text-xs text-muted-foreground mb-1">{event.description}</div>
                  <div className="text-xs text-muted-foreground">{event.date} • {event.user}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ComplianceTab({ asset }: { asset: UpstreamAsset }) {
  const mockCompliance = generateMockCompliance(asset);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Safety & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockCompliance.map((item, index) => (
            <div key={index} className="p-3 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">{item.title}</div>
                <Badge variant={item.status === "Current" ? "default" : item.status === "Due Soon" ? "secondary" : "destructive"}>
                  {item.status}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>{item.description}</div>
                <div>Next Due: {item.nextDue}</div>
                {item.reference && <div>Reference: {item.reference}</div>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function getAssetTypeName(typeId: string): string {
  const assetType = upstreamAssetTypes.find(t => t.id === typeId);
  return assetType?.name || "Unknown Asset Type";
}

function getHierarchyInfo(asset: UpstreamAsset) {
  const basin = basins.find(b => b.id === asset.hierarchyIds.basinId);
  const field = fields.find(f => f.id === asset.hierarchyIds.fieldId);
  const pad = pads.find(p => p.id === asset.hierarchyIds.padId);
  const well = wells.find(w => w.id === asset.hierarchyIds.wellId);

  return { basin, field, pad, well };
}

function getAssetIcon({ typeId, className }: { typeId: string; className?: string }) {
  const iconProps = { className };

  if (typeId.includes('wellhead') || typeId.includes('well')) return <Droplets {...iconProps} />;
  if (typeId.includes('separator')) return <Settings {...iconProps} />;
  if (typeId.includes('compressor')) return <Gauge {...iconProps} />;
  if (typeId.includes('pump')) return <Zap {...iconProps} />;
  if (typeId.includes('rtu') || typeId.includes('plc')) return <Cpu {...iconProps} />;
  return <Network {...iconProps} />;
}

function generateMockValue(unit?: string): string {
  if (!unit) return "N/A";

  switch (unit.toLowerCase()) {
    case "psig":
      return (Math.random() * 1000 + 500).toFixed(1);
    case "°f":
      return (Math.random() * 50 + 150).toFixed(1);
    case "bopd":
      return (Math.random() * 500 + 100).toFixed(0);
    case "scfm":
      return (Math.random() * 1000 + 200).toFixed(0);
    default:
      return (Math.random() * 100).toFixed(1);
  }
}

function generateMockTelemetryData(asset: UpstreamAsset) {
  const data = [];

  if (asset.typeId.includes('wellhead')) {
    data.push({
      title: "Wellhead Pressures",
      icon: <Gauge className="w-5 h-5" />,
      data: [
        { label: "Tubing Head Pressure", value: "1,245", unit: "psig" },
        { label: "Casing Head Pressure", value: "890", unit: "psig" },
        { label: "Flowing Pressure", value: "1,180", unit: "psig" },
      ]
    });
    data.push({
      title: "Production Data",
      icon: <Droplets className="w-5 h-5" />,
      data: [
        { label: "Oil Rate", value: "285", unit: "BOPD" },
        { label: "Gas Rate", value: "450", unit: "SCFM" },
        { label: "Water Cut", value: "15", unit: "%" },
      ]
    });
  }

  if (asset.typeId.includes('separator')) {
    data.push({
      title: "Process Conditions",
      icon: <Thermometer className="w-5 h-5" />,
      data: [
        { label: "Operating Pressure", value: "125", unit: "psig" },
        { label: "Temperature", value: "185", unit: "°F" },
        { label: "Liquid Level", value: "65", unit: "%" },
      ]
    });
  }

  if (asset.typeId.includes('compressor')) {
    data.push({
      title: "Compressor Performance",
      icon: <Activity className="w-5 h-5" />,
      data: [
        { label: "Suction Pressure", value: "45", unit: "psig" },
        { label: "Discharge Pressure", value: "250", unit: "psig" },
        { label: "Vibration", value: "2.1", unit: "mm/s" },
      ]
    });
  }

  return data;
}

function generateAssetRelationships(asset: UpstreamAsset) {
  const upstream = [];
  const downstream = [];

  // Mock relationships based on asset type and hierarchy
  if (asset.typeId.includes('separator')) {
    upstream.push(
      { name: "NP-01-01H Wellhead", type: "Wellhead", typeId: "type-wellhead" },
      { name: "NP-01-02H Wellhead", type: "Wellhead", typeId: "type-wellhead" }
    );
    downstream.push(
      { name: "Central Processing Pipeline", type: "Pipeline", typeId: "type-pipeline" }
    );
  }

  if (asset.typeId.includes('wellhead')) {
    downstream.push(
      { name: "NP-01 Test Separator", type: "Separator", typeId: "type-separator" }
    );
  }

  return { upstream, downstream };
}

function generateMockDocuments(asset: UpstreamAsset) {
  return [
    {
      name: `${asset.name} P&ID`,
      type: "Process & Instrumentation Diagram",
      size: "2.4 MB",
      date: "2024-01-10",
      icon: FileText
    },
    {
      name: `${asset.name} Datasheet`,
      type: "Equipment Datasheet",
      size: "856 KB",
      date: "2024-01-08",
      icon: FileText
    },
    {
      name: `${asset.name} Installation Drawing`,
      type: "Technical Drawing",
      size: "1.2 MB",
      date: "2024-01-05",
      icon: FileText
    },
    {
      name: "Maintenance Manual",
      type: "Operations Manual",
      size: "4.1 MB",
      date: "2023-12-15",
      icon: FileText
    }
  ];
}

function generateMockHistory(_asset: UpstreamAsset) {
  return [
    {
      title: "Status Changed to Active",
      description: "Asset status updated from maintenance to active",
      date: "2024-01-15 09:30",
      user: "John Smith",
      icon: Activity
    },
    {
      title: "Maintenance Completed",
      description: "Scheduled maintenance work completed successfully",
      date: "2024-01-14 16:45",
      user: "Maintenance Team",
      icon: Settings
    },
    {
      title: "Alarm Threshold Updated",
      description: "High pressure alarm threshold changed from 1500 to 1400 psig",
      date: "2024-01-12 11:20",
      user: "Sarah Johnson",
      icon: AlertTriangle
    },
    {
      title: "Asset Created",
      description: "Asset added to system during field commissioning",
      date: "2023-11-20 14:00",
      user: "System Admin",
      icon: Calendar
    }
  ];
}

function generateMockCompliance(asset: UpstreamAsset) {
  const compliance = [
    {
      title: "API 14C Certification",
      description: "Surface safety valve certification per API 14C standard",
      status: "Current",
      nextDue: "2024-06-15",
      reference: "API-14C-2024-001"
    },
    {
      title: "Pressure Vessel Inspection",
      description: "ASME Section VIII pressure vessel inspection",
      status: "Due Soon",
      nextDue: "2024-02-28",
      reference: "ASME-VIII-2024-045"
    }
  ];

  if (asset.hazardousAreaClass && asset.hazardousAreaClass !== "Non-hazardous") {
    compliance.push({
      title: "Hazardous Area Classification",
      description: `Equipment certified for ${asset.hazardousAreaClass} operation`,
      status: "Current",
      nextDue: "2025-01-15",
      reference: "IEC-60079-2024"
    });
  }

  if (asset.typeId.includes('sis')) {
    compliance.push({
      title: "SIL Verification",
      description: "Safety Integrity Level verification and testing",
      status: "Current",
      nextDue: "2024-07-20",
      reference: "IEC-61508-SIL2"
    });
  }

  return compliance;
}