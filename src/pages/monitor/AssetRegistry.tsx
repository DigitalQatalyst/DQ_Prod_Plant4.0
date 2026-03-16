import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Asset } from "@/types/navigation";
import { APMPageShell } from "@/components/apm/APMPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SectorBadge } from "@/components/shared/SectorBadge";
import { 
  Building2, 
  MapPin, 
  Calendar, 
  FileText, 
  Network, 
  Database,
  TreePine,
  Factory,
  Wrench,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock hierarchy data based on upstream structure
const getAssetHierarchy = (asset: Asset) => {
  // Extract hierarchy from asset location and type
  const locationParts = asset.location?.split(" - ") || [];
  
  return {
    field: locationParts[0] || "North Permian Field",
    pad: locationParts[1] || "Pad NP-01",
    asset: asset.name,
    components: getAssetComponents(asset)
  };
};

const getAssetComponents = (asset: Asset) => {
  // Generate realistic components based on asset type
  switch (asset.type) {
    case "Wellhead":
      return [
        { name: "Christmas Tree", type: "Control System", status: "Active" },
        { name: "Master Valve", type: "Valve", status: "Active" },
        { name: "Wing Valve", type: "Valve", status: "Active" },
        { name: "Choke Valve", type: "Control Valve", status: "Active" },
        { name: "Pressure Transmitter", type: "Instrument", status: "Active" }
      ];
    case "ESP Pump":
      return [
        { name: "Downhole Motor", type: "Motor", status: "Active" },
        { name: "Pump Assembly", type: "Pump", status: "Active" },
        { name: "Cable System", type: "Electrical", status: "Active" },
        { name: "VFD Controller", type: "Control System", status: "Active" },
        { name: "Pressure Sensors", type: "Instrument", status: "Active" }
      ];
    case "Gas Compressor":
      return [
        { name: "Compressor Unit", type: "Compressor", status: "Active" },
        { name: "Drive Motor", type: "Motor", status: "Active" },
        { name: "Cooling System", type: "Cooling", status: "Active" },
        { name: "Vibration Sensors", type: "Instrument", status: "Warning" },
        { name: "Control Panel", type: "Control System", status: "Active" }
      ];
    case "Crude Transfer Pump":
      return [
        { name: "Centrifugal Pump", type: "Pump", status: "Active" },
        { name: "Electric Motor", type: "Motor", status: "Active" },
        { name: "Mechanical Seal", type: "Seal", status: "Active" },
        { name: "Flow Transmitter", type: "Instrument", status: "Active" },
        { name: "Pressure Transmitters", type: "Instrument", status: "Active" }
      ];
    case "Flare KO Drum":
      return [
        { name: "Pressure Vessel", type: "Vessel", status: "Critical" },
        { name: "Level Transmitter", type: "Instrument", status: "Critical" },
        { name: "Relief Valve", type: "Safety Valve", status: "Critical" },
        { name: "Drain System", type: "Piping", status: "Active" },
        { name: "Instrumentation", type: "Control System", status: "Critical" }
      ];
    default:
      return [
        { name: "Main Component", type: "Primary", status: "Active" },
        { name: "Control System", type: "Control", status: "Active" }
      ];
  }
};

const getAssetIdentity = (asset: Asset) => {
  // Generate realistic asset identity data
  const baseSerial = asset.id.replace(/[^0-9]/g, '').padStart(6, '0');
  
  return {
    serialNumber: `SN-${baseSerial}`,
    modelNumber: getModelNumber(asset.type),
    manufacturer: getManufacturer(asset.type),
    installDate: getInstallDate(asset),
    commissionDate: getCommissionDate(asset),
    warrantyExpiry: getWarrantyExpiry(asset),
    assetTag: `AT-${asset.id.slice(-4).toUpperCase()}`,
    location: asset.location || "North Permian Field - Pad NP-01"
  };
};

const getModelNumber = (assetType: string): string => {
  const models: Record<string, string> = {
    "Wellhead": "WH-5000-316",
    "ESP Pump": "ESP-450-75HP",
    "Gas Compressor": "GC-2500-850kW",
    "Crude Transfer Pump": "CTP-1200-50HP",
    "Flare KO Drum": "KOD-48-150PSI"
  };
  return models[assetType] || "MODEL-UNKNOWN";
};

const getManufacturer = (assetType: string): string => {
  const manufacturers: Record<string, string> = {
    "Wellhead": "Cameron International",
    "ESP Pump": "Baker Hughes",
    "Gas Compressor": "Siemens Energy",
    "Crude Transfer Pump": "Flowserve",
    "Flare KO Drum": "Exterran"
  };
  return manufacturers[assetType] || "Unknown Manufacturer";
};

const getInstallDate = (asset: Asset): string => {
  // Generate realistic install dates (1-3 years ago)
  const daysAgo = Math.floor(Math.random() * 1095) + 365; // 1-3 years
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

const getCommissionDate = (asset: Asset): string => {
  // Commission date is typically 30-90 days after install
  const installDate = new Date(getInstallDate(asset));
  const daysAfter = Math.floor(Math.random() * 60) + 30;
  installDate.setDate(installDate.getDate() + daysAfter);
  return installDate.toISOString().split('T')[0];
};

const getWarrantyExpiry = (asset: Asset): string => {
  // Warranty typically 2-5 years from commission
  const commissionDate = new Date(getCommissionDate(asset));
  const yearsAfter = Math.floor(Math.random() * 3) + 2;
  commissionDate.setFullYear(commissionDate.getFullYear() + yearsAfter);
  return commissionDate.toISOString().split('T')[0];
};

const getLinkedDocuments = (asset: Asset) => {
  return [
    { name: "Equipment Datasheet", type: "Technical", icon: FileText, url: "#" },
    { name: "Installation Manual", type: "Manual", icon: FileText, url: "#" },
    { name: "Maintenance Procedures", type: "Procedure", icon: Wrench, url: "#" },
    { name: "Inspection Reports", type: "Report", icon: FileText, url: "#" },
    { name: "Vendor Drawings", type: "Drawing", icon: FileText, url: "#" },
    { name: "Certification Documents", type: "Certificate", icon: FileText, url: "#" }
  ];
};

const getAssetRelationships = (asset: Asset) => {
  // Generate realistic asset relationships
  return [
    { 
      type: "Upstream", 
      assets: ["Well NP-01-01H", "Well NP-01-02H"], 
      relationship: "Feeds from" 
    },
    { 
      type: "Downstream", 
      assets: ["Central Separator", "Export Pipeline"], 
      relationship: "Feeds to" 
    },
    { 
      type: "Control", 
      assets: ["RTU NP-01", "SCADA System"], 
      relationship: "Controlled by" 
    },
    { 
      type: "Safety", 
      assets: ["Emergency Shutdown System", "Fire & Gas System"], 
      relationship: "Protected by" 
    }
  ];
};

export function AssetRegistry() {
  const { assets, selectedAsset, setSelectedAsset, sector, subsector } = useApp();
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<Asset | null>(null);

  const currentAsset = selectedAssetLocal || (selectedAsset as Asset);

  const handleAssetSelection = (asset: Asset) => {
    setSelectedAssetLocal(asset);
    setSelectedAsset(asset);
  };

  const hierarchy = currentAsset ? getAssetHierarchy(currentAsset) : null;
  const identity = currentAsset ? getAssetIdentity(currentAsset) : null;
  const documents = currentAsset ? getLinkedDocuments(currentAsset) : [];
  const relationships = currentAsset ? getAssetRelationships(currentAsset) : [];

  return (
    <APMPageShell
      title="Asset Registry & Hierarchy"
      featureSetName="Asset Inventory & Criticality"
      featureName="Asset Registry & Hierarchy"
      listType="assets"
      assets={assets}
      selectedAsset={currentAsset}
      onAssetSelect={handleAssetSelection}
    >
      {currentAsset ? (
        <div className="space-y-6">
          {/* Asset Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold">{currentAsset.name}</h3>
                <StatusBadge status={currentAsset.status} />
                {sector && subsector && <SectorBadge sector={sector} subsector={subsector} />}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{currentAsset.type}</span>
                <span>•</span>
                <span>{identity?.location}</span>
                <span>•</span>
                <span>Asset Tag: {identity?.assetTag}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Asset Identity Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Asset Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Serial Number</label>
                    <p className="text-sm font-mono">{identity?.serialNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Model Number</label>
                    <p className="text-sm font-mono">{identity?.modelNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Manufacturer</label>
                    <p className="text-sm">{identity?.manufacturer}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Asset Type</label>
                    <p className="text-sm">{currentAsset.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Install Date</label>
                    <p className="text-sm">{identity?.installDate}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Commission Date</label>
                    <p className="text-sm">{identity?.commissionDate}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Warranty Expiry</label>
                    <p className="text-sm">{identity?.warrantyExpiry}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Criticality</label>
                    <Badge variant={currentAsset.criticality === "High" ? "destructive" : 
                                  currentAsset.criticality === "Medium" ? "default" : "secondary"}>
                      {currentAsset.criticality}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hierarchy Tree */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TreePine className="w-5 h-5" />
                  Asset Hierarchy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Field Level */}
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Field:</span>
                    <span className="text-sm">{hierarchy?.field}</span>
                  </div>
                  
                  {/* Pad Level */}
                  <div className="flex items-center gap-2 ml-6">
                    <Factory className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Pad:</span>
                    <span className="text-sm">{hierarchy?.pad}</span>
                  </div>
                  
                  {/* Asset Level */}
                  <div className="flex items-center gap-2 ml-12">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-600">Asset:</span>
                    <span className="text-sm font-semibold text-blue-600">{hierarchy?.asset}</span>
                  </div>
                  
                  {/* Component Level */}
                  <div className="ml-18 space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Components:</div>
                    {hierarchy?.components.map((component, index) => (
                      <div key={index} className="flex items-center gap-2 ml-6">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                        <span className="text-sm">{component.name}</span>
                        <Badge 
                          variant={component.status === "Active" ? "default" : 
                                  component.status === "Warning" ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {component.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Linked Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Linked Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <doc.icon className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.type}</p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Asset Relationships */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                Asset Relationships & Dependencies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {relationships.map((rel, index) => (
                  <div key={index}>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{rel.type}</Badge>
                      <span className="text-sm text-muted-foreground">{rel.relationship}</span>
                    </div>
                    <div className="ml-4 space-y-1">
                      {rel.assets.map((asset, assetIndex) => (
                        <div key={assetIndex} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span>{asset}</span>
                        </div>
                      ))}
                    </div>
                    {index < relationships.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Select an asset to view its registry information and hierarchy
        </div>
      )}
    </APMPageShell>
  );
}