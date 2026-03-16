import { LucideIcon } from "lucide-react";

export interface Feature {
  id: string;
  name: string;
  path: string;
  icon?: LucideIcon;
  description?: string;
  // Optional sector/subsector metadata hints for future filtering
  sectorHints?: string[];
  subsectorHints?: string[];
  sector?: string;
  subsector?: string;
  industryTags?: string[];
}

export interface FeatureSet {
  id: string;
  name: string;
  features: Feature[];
  icon?: LucideIcon;
  sector?: string;
  subsector?: string;
  industryTags?: string[];
  cognitivePattern?: 'analytical' | 'operational' | 'project' | 'decision';
}

export interface FeatureArea {
  id: string;
  name: string;
  shortName?: string;
  featureSets: FeatureSet[];
  icon: LucideIcon;
  sector?: string;
  subsector?: string;
  industryTags?: string[];
}

export interface Section {
  id: string;
  name: string;
  featureAreas: FeatureArea[];
}

export interface Tenant {
  id: string;
  name: string;
  industry: string;
  logo?: string;
  sector?: string;
  subsector?: string;
}

export interface UserPersona {
  type: "firm" | "vendor" | "advisor";
  label: string;
}

export type AssetStatus = "online" | "offline" | "pending" | "maintenance";

export interface Asset {
  id: string;
  name: string;
  type: string;
  site: string;
  area: string;
  status: AssetStatus;
  lastSeen: string;
  tags?: string[];
  criticality?: "low" | "medium" | "high" | "critical";
  // Energy-related extensions for upstream assets
  energyConsumer?: boolean;
  primaryEnergyType?: "electricity" | "gas" | "diesel" | "steam";
  nominalPowerKw?: number;
  energyCostCenter?: string;
  // APM-related extensions
  healthIndex?: number;
  anomalyState?: "Normal" | "Warning" | "Critical";
  location?: string;
}

export interface DiscoveryJob {
  id: string;
  name: string;
  type: "network" | "agent" | "manual";
  status: "running" | "completed" | "failed" | "pending";
  startedAt: string;
  discoveredCount: number;
  approvedCount: number;
}

export interface AssetType {
  id: string;
  name: string;
  category: string;
  icon: string;
  assetCount: number;
  properties: string[];
}

// Energy Management System interfaces
export interface UpstreamEnergyMeter {
  id: string;
  name: string;
  scope: string; // "Pad A", "Central Facility", "Camp / Common Services"
  energyTypes: string[]; // ["electricity", "gas", "diesel"]
  linkedAssets: string[];
  currentKW: number;
  status: "Normal" | "High" | "Critical";
}

export interface EnergyTelemetry {
  meterId: string;
  timestamp: string[];
  kWh: number[];
  kW: number[];
}

export interface EnergyBaseline {
  meterId: string;
  baselineKWhPerDay: number;
  baselineKWhPerBBL?: number; // kWh per barrel produced
  baselineKWhPerMSCF?: number; // kWh per thousand standard cubic feet
}

export interface UpstreamTariffs {
  electricityUsdPerKWh: number;
  gasUsdPerMMBtu: number;
  dieselUsdPerLitre: number;
}

export interface UpstreamEmissionFactors {
  electricityKgCo2PerKWh: number;
  gasKgCo2PerMMBtu: number;
  dieselKgCo2PerLitre: number;
}

export interface Sector {
  id: string;
  name: string;
  subsectors: string[];
}

export interface TelemetryDataPoint {
  value: number;
  timestamp: string;
  unit: string;
  status: "Normal" | "Warning" | "Critical";
}

export interface EventHistoryItem {
  id: string;
  assetId: string;
  assetName: string;
  title: string;
  description: string;
  category: "Alert" | "Fault" | "Downtime" | "Maintenance" | "Operational";
  severity: "Critical" | "Warning" | "Information";
  status: "Active" | "Investigating" | "Resolved";
  timestamp: string;
  duration?: number; // in minutes
  correlatedEvents?: string[]; // IDs of related events
  rootCause?: string;
  resolution?: string;
  assignedTo?: string;
}

export interface UpstreamTelemetry {
  [assetId: string]: {
    [parameter: string]: TelemetryDataPoint[];
  };
}

export interface UpstreamAlert {
  id: string;
  title: string;
  assetId: string;
  assetName: string;
  severity: "Information" | "Warning" | "Critical";
  timestamp: string;
  description: string;
  likelyCauses: string[];
  correctiveActions: string[];
  status: "Active" | "Investigating" | "Resolved";
}
