/**
 * Upstream Oil & Gas Mock Data
 * 
 * This module provides comprehensive mock data for upstream O&G operations,
 * including tenants, basins, fields, pads, wells, facilities, and equipment.
 */

import {
  UpstreamTenant,
  Basin,
  Field,
  Pad,
  Well,
  Facility,
  UpstreamAsset,
  UpstreamAssetType,
  PropertySet,
  ConnectionEndpoint,
  DataPoint,
  UpstreamDiscoveryJob,
  DiscoveryAgent,
  LinearAsset,
  StreamConfig,
  LifecycleState,
  SavedView,
  TopologyNode,
  TopologyEdge,
  CandidateAsset,
  AssetImport
} from '@/types/assets';

// =============================================================================
// Upstream Tenants
// =============================================================================

export const upstreamTenant: UpstreamTenant = {
  id: "alpha-upstream",
  name: "Alpha Upstream Ltd",
  sector: "oil-gas",
  isUpstream: true
};

export const upstreamTenants: UpstreamTenant[] = [
  upstreamTenant,
  {
    id: "beta-energy",
    name: "Beta Energy Corp",
    sector: "oil-gas",
    isUpstream: true
  },
  {
    id: "gamma-petroleum",
    name: "Gamma Petroleum Inc",
    sector: "oil-gas",
    isUpstream: true
  }
];

// =============================================================================
// Basins
// =============================================================================

export const basins: Basin[] = [
  {
    id: "basin-permian",
    name: "Permian Basin",
    tenantId: "alpha-upstream",
    description: "Major unconventional oil and gas basin in West Texas and southeastern New Mexico"
  },
  {
    id: "basin-eagle-ford",
    name: "Eagle Ford Basin",
    tenantId: "alpha-upstream", 
    description: "Prolific shale oil and gas formation in South Texas"
  }
];

// =============================================================================
// Fields
// =============================================================================

export const fields: Field[] = [
  // Permian Basin Fields
  {
    id: "field-permian-north",
    name: "North Permian Field",
    basinId: "basin-permian",
    description: "Northern section of Permian operations with 45 active wells"
  },
  {
    id: "field-permian-south",
    name: "South Permian Field", 
    basinId: "basin-permian",
    description: "Southern section focusing on enhanced oil recovery"
  },
  {
    id: "field-permian-west",
    name: "West Permian Field",
    basinId: "basin-permian",
    description: "Western development area with new horizontal drilling"
  },
  {
    id: "field-permian-central",
    name: "Central Permian Field",
    basinId: "basin-permian", 
    description: "Central processing hub with major facilities"
  },
  
  // Eagle Ford Basin Fields
  {
    id: "field-eagle-east",
    name: "East Eagle Ford Field",
    basinId: "basin-eagle-ford",
    description: "Eastern Eagle Ford development with gas processing"
  },
  {
    id: "field-eagle-west",
    name: "West Eagle Ford Field",
    basinId: "basin-eagle-ford",
    description: "Western Eagle Ford area with oil-focused operations"
  },
  {
    id: "field-eagle-central",
    name: "Central Eagle Ford Field",
    basinId: "basin-eagle-ford",
    description: "Central Eagle Ford with mixed oil and gas production"
  }
];

// =============================================================================
// Pads/Platforms
// =============================================================================

export const pads: Pad[] = [
  // North Permian Field Pads
  {
    id: "pad-np-01",
    name: "North Permian Pad 01",
    fieldId: "field-permian-north",
    type: "pad",
    description: "8-well pad with central facilities"
  },
  {
    id: "pad-np-02", 
    name: "North Permian Pad 02",
    fieldId: "field-permian-north",
    type: "pad",
    description: "6-well pad with gas lift system"
  },
  {
    id: "pad-np-03",
    name: "North Permian Pad 03",
    fieldId: "field-permian-north", 
    type: "pad",
    description: "10-well pad with water injection"
  },
  
  // South Permian Field Pads
  {
    id: "pad-sp-01",
    name: "South Permian Pad 01",
    fieldId: "field-permian-south",
    type: "pad",
    description: "Enhanced recovery pad with CO2 injection"
  },
  {
    id: "pad-sp-02",
    name: "South Permian Pad 02", 
    fieldId: "field-permian-south",
    type: "pad",
    description: "Waterflood pad with 12 wells"
  },
  
  // West Permian Field Pads
  {
    id: "pad-wp-01",
    name: "West Permian Pad 01",
    fieldId: "field-permian-west",
    type: "pad",
    description: "New horizontal drilling pad"
  },
  {
    id: "pad-wp-02",
    name: "West Permian Pad 02",
    fieldId: "field-permian-west", 
    type: "pad",
    description: "Extended reach drilling pad"
  },
  
  // Central Permian Field Platform
  {
    id: "platform-cp-01",
    name: "Central Processing Platform",
    fieldId: "field-permian-central",
    type: "platform",
    description: "Main processing facility for field"
  },
  
  // Eagle Ford Field Pads
  {
    id: "pad-ee-01",
    name: "East Eagle Ford Pad 01",
    fieldId: "field-eagle-east",
    type: "pad",
    description: "Gas-focused pad with 14 wells"
  },
  {
    id: "pad-ee-02",
    name: "East Eagle Ford Pad 02",
    fieldId: "field-eagle-east",
    type: "pad", 
    description: "Condensate recovery pad"
  },
  {
    id: "pad-ew-01",
    name: "West Eagle Ford Pad 01",
    fieldId: "field-eagle-west",
    type: "pad",
    description: "Oil-focused pad with artificial lift"
  },
  {
    id: "pad-ec-01",
    name: "Central Eagle Ford Pad 01",
    fieldId: "field-eagle-central",
    type: "pad",
    description: "Mixed production pad"
  }
];

// =============================================================================
// Wells
// =============================================================================

export const wells: Well[] = [
  // North Permian Pad 01 Wells
  { id: "well-np-01-01", name: "NP-01-01H", padId: "pad-np-01", wellType: "producer", status: "producing", description: "Horizontal producer, 7500' lateral" },
  { id: "well-np-01-02", name: "NP-01-02H", padId: "pad-np-01", wellType: "producer", status: "producing", description: "Horizontal producer, 8200' lateral" },
  { id: "well-np-01-03", name: "NP-01-03H", padId: "pad-np-01", wellType: "producer", status: "producing", description: "Horizontal producer, 7800' lateral" },
  { id: "well-np-01-04", name: "NP-01-04H", padId: "pad-np-01", wellType: "producer", status: "producing", description: "Horizontal producer, 8500' lateral" },
  { id: "well-np-01-05", name: "NP-01-05H", padId: "pad-np-01", wellType: "producer", status: "shut-in", description: "Horizontal producer, workover required" },
  { id: "well-np-01-06", name: "NP-01-06H", padId: "pad-np-01", wellType: "producer", status: "producing", description: "Horizontal producer, 7200' lateral" },
  { id: "well-np-01-07", name: "NP-01-07H", padId: "pad-np-01", wellType: "producer", status: "producing", description: "Horizontal producer, 8000' lateral" },
  { id: "well-np-01-08", name: "NP-01-08H", padId: "pad-np-01", wellType: "producer", status: "producing", description: "Horizontal producer, 7600' lateral" },
  
  // North Permian Pad 02 Wells
  { id: "well-np-02-01", name: "NP-02-01H", padId: "pad-np-02", wellType: "producer", status: "producing", description: "Gas lift producer" },
  { id: "well-np-02-02", name: "NP-02-02H", padId: "pad-np-02", wellType: "producer", status: "producing", description: "Gas lift producer" },
  { id: "well-np-02-03", name: "NP-02-03H", padId: "pad-np-02", wellType: "producer", status: "producing", description: "Gas lift producer" },
  { id: "well-np-02-04", name: "NP-02-04H", padId: "pad-np-02", wellType: "producer", status: "producing", description: "Gas lift producer" },
  { id: "well-np-02-05", name: "NP-02-05H", padId: "pad-np-02", wellType: "producer", status: "producing", description: "Gas lift producer" },
  { id: "well-np-02-06", name: "NP-02-06H", padId: "pad-np-02", wellType: "producer", status: "maintenance", description: "Gas lift producer, compressor maintenance" },
  
  // North Permian Pad 03 Wells (with water injection)
  { id: "well-np-03-01", name: "NP-03-01H", padId: "pad-np-03", wellType: "producer", status: "producing", description: "Waterflood producer" },
  { id: "well-np-03-02", name: "NP-03-02H", padId: "pad-np-03", wellType: "producer", status: "producing", description: "Waterflood producer" },
  { id: "well-np-03-03", name: "NP-03-03H", padId: "pad-np-03", wellType: "producer", status: "producing", description: "Waterflood producer" },
  { id: "well-np-03-04", name: "NP-03-04H", padId: "pad-np-03", wellType: "producer", status: "producing", description: "Waterflood producer" },
  { id: "well-np-03-05", name: "NP-03-05H", padId: "pad-np-03", wellType: "producer", status: "producing", description: "Waterflood producer" },
  { id: "well-np-03-06", name: "NP-03-06H", padId: "pad-np-03", wellType: "producer", status: "producing", description: "Waterflood producer" },
  { id: "well-np-03-07", name: "NP-03-07H", padId: "pad-np-03", wellType: "producer", status: "producing", description: "Waterflood producer" },
  { id: "well-np-03-08", name: "NP-03-08H", padId: "pad-np-03", wellType: "producer", status: "producing", description: "Waterflood producer" },
  { id: "well-np-03-i01", name: "NP-03-I01", padId: "pad-np-03", wellType: "injector", status: "active", description: "Water injection well" },
  { id: "well-np-03-i02", name: "NP-03-I02", padId: "pad-np-03", wellType: "injector", status: "active", description: "Water injection well" },
  
  // South Permian Wells
  { id: "well-sp-01-01", name: "SP-01-01H", padId: "pad-sp-01", wellType: "producer", status: "producing", description: "CO2 EOR producer" },
  { id: "well-sp-01-02", name: "SP-01-02H", padId: "pad-sp-01", wellType: "producer", status: "producing", description: "CO2 EOR producer" },
  { id: "well-sp-01-i01", name: "SP-01-I01", padId: "pad-sp-01", wellType: "injector", status: "active", description: "CO2 injection well" },
  
  // Eagle Ford Wells
  { id: "well-ee-01-01", name: "EE-01-01H", padId: "pad-ee-01", wellType: "producer", status: "producing", description: "Gas producer with condensate" },
  { id: "well-ee-01-02", name: "EE-01-02H", padId: "pad-ee-01", wellType: "producer", status: "producing", description: "Gas producer with condensate" },
  { id: "well-ee-01-03", name: "EE-01-03H", padId: "pad-ee-01", wellType: "producer", status: "producing", description: "Gas producer with condensate" },
  { id: "well-ew-01-01", name: "EW-01-01H", padId: "pad-ew-01", wellType: "producer", status: "producing", description: "Oil producer with ESP" },
  { id: "well-ew-01-02", name: "EW-01-02H", padId: "pad-ew-01", wellType: "producer", status: "producing", description: "Oil producer with ESP" }
];

// =============================================================================
// Facilities
// =============================================================================

export const facilities: Facility[] = [
  // Processing Facilities
  {
    id: "facility-cp-sep-01",
    name: "Central Processing Separator 01",
    padId: "platform-cp-01",
    facilityType: "separator",
    description: "3-phase separator, 10,000 BOPD capacity"
  },
  {
    id: "facility-cp-comp-01", 
    name: "Central Processing Compressor 01",
    padId: "platform-cp-01",
    facilityType: "compressor",
    description: "Gas compression station, 50 MMSCFD"
  },
  {
    id: "facility-cp-tank-01",
    name: "Central Processing Tank Battery 01",
    padId: "platform-cp-01", 
    facilityType: "tank",
    description: "Crude oil storage, 10,000 BBL capacity"
  },
  
  // Pad Facilities
  {
    id: "facility-np-01-sep",
    name: "NP-01 Test Separator",
    padId: "pad-np-01",
    facilityType: "separator",
    description: "Pad test separator for well testing"
  },
  {
    id: "facility-np-02-comp",
    name: "NP-02 Gas Lift Compressor",
    padId: "pad-np-02",
    facilityType: "compressor", 
    description: "Gas lift compressor package"
  },
  {
    id: "facility-np-03-pump",
    name: "NP-03 Water Injection Pump",
    padId: "pad-np-03",
    facilityType: "pump",
    description: "High pressure water injection pump"
  }
];

// =============================================================================
// Asset Types
// =============================================================================

export const upstreamAssetTypes: UpstreamAssetType[] = [
  // Well Equipment
  {
    id: "type-well",
    name: "Well",
    category: "well",
    sectorTags: ["upstream", "drilling", "production"],
    role: "fixed",
    propertySets: ["well-properties", "production-data"],
    defaultTelemetry: ["wellhead-pressure", "casing-pressure", "flow-rate"],
    description: "Oil or gas well with wellhead equipment"
  },
  {
    id: "type-wellhead",
    name: "Wellhead",
    category: "well", 
    sectorTags: ["upstream", "wellhead", "surface"],
    role: "fixed",
    propertySets: ["pressure-ratings", "safety-systems"],
    defaultTelemetry: ["tubing-pressure", "casing-pressure", "temperature"],
    description: "Surface wellhead assembly"
  },
  {
    id: "type-xmas-tree",
    name: "Christmas Tree",
    category: "well",
    sectorTags: ["upstream", "wellhead", "control"],
    role: "fixed", 
    propertySets: ["pressure-ratings", "valve-config"],
    defaultTelemetry: ["wing-valve-position", "master-valve-position", "pressure"],
    description: "Wellhead valve assembly for flow control"
  },
  {
    id: "type-esp",
    name: "Electric Submersible Pump",
    category: "well",
    sectorTags: ["upstream", "artificial-lift", "electrical"],
    role: "fixed",
    propertySets: ["pump-performance", "electrical-data"],
    defaultTelemetry: ["motor-current", "intake-pressure", "discharge-pressure", "frequency"],
    description: "Downhole electric pump for artificial lift"
  },
  
  // Process Equipment
  {
    id: "type-separator",
    name: "Separator",
    category: "process",
    sectorTags: ["upstream", "processing", "separation"],
    role: "fixed",
    propertySets: ["pressure-ratings", "process-conditions"],
    defaultTelemetry: ["pressure", "temperature", "level", "flow-rate"],
    description: "Oil/gas/water separation vessel"
  },
  {
    id: "type-compressor",
    name: "Compressor", 
    category: "process",
    sectorTags: ["upstream", "compression", "gas"],
    role: "fixed",
    propertySets: ["compression-data", "performance-curves"],
    defaultTelemetry: ["suction-pressure", "discharge-pressure", "temperature", "vibration"],
    description: "Gas compression equipment"
  },
  {
    id: "type-pump",
    name: "Pump",
    category: "process",
    sectorTags: ["upstream", "fluid-handling", "injection"],
    role: "fixed",
    propertySets: ["pump-performance", "mechanical-data"],
    defaultTelemetry: ["suction-pressure", "discharge-pressure", "flow-rate", "vibration"],
    description: "Centrifugal or positive displacement pump"
  },
  {
    id: "type-tank",
    name: "Storage Tank",
    category: "process",
    sectorTags: ["upstream", "storage", "inventory"],
    role: "fixed",
    propertySets: ["tank-specifications", "inventory-data"],
    defaultTelemetry: ["level", "temperature", "pressure"],
    description: "Crude oil or water storage tank"
  },
  
  // Pipeline Equipment
  {
    id: "type-flowline",
    name: "Flowline",
    category: "pipeline",
    sectorTags: ["upstream", "transport", "linear"],
    role: "linear",
    propertySets: ["pipeline-design", "integrity-data"],
    defaultTelemetry: ["pressure", "temperature", "flow-rate"],
    description: "Pipeline connecting well to facilities"
  },
  {
    id: "type-pipeline",
    name: "Pipeline",
    category: "pipeline", 
    sectorTags: ["upstream", "transport", "linear"],
    role: "linear",
    propertySets: ["pipeline-design", "integrity-data"],
    defaultTelemetry: ["pressure", "temperature", "flow-rate"],
    description: "Main pipeline for hydrocarbon transport"
  },
  {
    id: "type-manifold",
    name: "Manifold",
    category: "pipeline",
    sectorTags: ["upstream", "distribution", "hub"],
    role: "networkNode",
    propertySets: ["pressure-ratings", "valve-config"],
    defaultTelemetry: ["pressure", "temperature"],
    description: "Pipeline distribution manifold"
  },
  
  // Instrumentation & Control
  {
    id: "type-rtu",
    name: "Remote Terminal Unit",
    category: "instrumentation",
    sectorTags: ["upstream", "scada", "control"],
    role: "fixed",
    propertySets: ["communication-config", "io-config"],
    defaultTelemetry: ["communication-status", "power-status"],
    description: "Field data acquisition and control unit"
  },
  {
    id: "type-plc",
    name: "Programmable Logic Controller",
    category: "instrumentation",
    sectorTags: ["upstream", "control", "automation"],
    role: "fixed",
    propertySets: ["control-logic", "io-config"],
    defaultTelemetry: ["cpu-status", "communication-status"],
    description: "Industrial control system"
  },
  {
    id: "type-sis",
    name: "Safety Instrumented System",
    category: "instrumentation",
    sectorTags: ["upstream", "safety", "shutdown"],
    role: "fixed",
    propertySets: ["safety-functions", "sil-ratings"],
    defaultTelemetry: ["system-status", "valve-positions", "trip-status"],
    description: "Safety shutdown system"
  },
  {
    id: "type-flow-meter",
    name: "Flow Meter",
    category: "instrumentation",
    sectorTags: ["upstream", "measurement", "flow"],
    role: "fixed",
    propertySets: ["meter-specifications", "calibration-data"],
    defaultTelemetry: ["flow-rate", "totalizer", "pressure", "temperature"],
    description: "Fluid flow measurement device"
  },

  // Mobile Equipment
  {
    id: "type-maintenance-truck",
    name: "Maintenance Truck",
    category: "electrical",
    sectorTags: ["upstream", "mobile", "maintenance"],
    role: "mobile",
    propertySets: ["vehicle-specs", "equipment-inventory"],
    defaultTelemetry: ["gps-location", "engine-status", "fuel-level"],
    description: "Mobile maintenance vehicle for field operations"
  },
  {
    id: "type-portable-generator",
    name: "Portable Generator",
    category: "electrical",
    sectorTags: ["upstream", "mobile", "power"],
    role: "mobile",
    propertySets: ["generator-specs", "fuel-data"],
    defaultTelemetry: ["power-output", "fuel-level", "runtime-hours"],
    description: "Portable diesel generator for temporary power"
  },
  {
    id: "type-portable-pump",
    name: "Portable Pump",
    category: "process",
    sectorTags: ["upstream", "mobile", "fluid-handling"],
    role: "mobile",
    propertySets: ["pump-performance", "mechanical-data"],
    defaultTelemetry: ["suction-pressure", "discharge-pressure", "flow-rate"],
    description: "Portable pump for temporary fluid transfer operations"
  },
  {
    id: "type-service-truck",
    name: "Service Truck",
    category: "electrical",
    sectorTags: ["upstream", "mobile", "service"],
    role: "mobile",
    propertySets: ["vehicle-specs", "service-equipment"],
    defaultTelemetry: ["gps-location", "engine-status", "hydraulic-pressure"],
    description: "Service truck with hydraulic equipment for well operations"
  }
];

// =============================================================================
// Property Sets
// =============================================================================

export const upstreamPropertySets: PropertySet[] = [
  {
    id: "well-properties",
    name: "Well Properties",
    type: "process",
    description: "Basic well identification and production data",
    fields: [
      { id: "reservoir", label: "Reservoir", dataType: "string", required: true, description: "Target reservoir formation" },
      { id: "wellType", label: "Well Type", dataType: "string", required: true, description: "Producer, Injector, or Disposal" },
      { id: "targetRate", label: "Target Rate", dataType: "number", unit: "BOPD", description: "Target production rate" },
      { id: "artificialLiftType", label: "Artificial Lift", dataType: "string", description: "ESP, Gas Lift, Rod Pump, etc." },
      { id: "completionDate", label: "Completion Date", dataType: "date", description: "Well completion date" }
    ]
  },
  {
    id: "pressure-ratings",
    name: "Pressure/Temperature Ratings",
    type: "process",
    description: "Equipment pressure and temperature specifications",
    fields: [
      { id: "designPressure", label: "Design Pressure", dataType: "number", unit: "psig", required: true, description: "Maximum design pressure" },
      { id: "designTemp", label: "Design Temperature", dataType: "number", unit: "°F", required: true, description: "Maximum design temperature" },
      { id: "maop", label: "MAOP", dataType: "number", unit: "psig", description: "Maximum Allowable Operating Pressure" },
      { id: "testPressure", label: "Test Pressure", dataType: "number", unit: "psig", description: "Hydrostatic test pressure" }
    ]
  },
  {
    id: "pipeline-design",
    name: "Pipeline Design",
    type: "pipeline",
    description: "Pipeline mechanical design specifications",
    fields: [
      { id: "diameter", label: "Diameter", dataType: "number", unit: "in", required: true, description: "Nominal pipe diameter" },
      { id: "wallThickness", label: "Wall Thickness", dataType: "number", unit: "in", required: true, description: "Pipe wall thickness" },
      { id: "material", label: "Material", dataType: "string", required: true, description: "Pipe material specification" },
      { id: "corrosionAllowance", label: "Corrosion Allowance", dataType: "number", unit: "in", description: "Design corrosion allowance" },
      { id: "coatingType", label: "Coating Type", dataType: "string", description: "External coating system" }
    ]
  },
  {
    id: "safety-systems",
    name: "Safety/Hazard",
    type: "safety",
    description: "Safety and hazardous area classifications",
    fields: [
      { id: "hazardousAreaClass", label: "Hazardous Area Class", dataType: "string", required: true, description: "Zone 0, 1, 2, or Non-hazardous" },
      { id: "silRating", label: "SIL Rating", dataType: "string", description: "Safety Integrity Level" },
      { id: "sisLoopId", label: "SIS Loop ID", dataType: "string", description: "Safety Instrumented System loop identifier" },
      { id: "inspectionDue", label: "Inspection Due", dataType: "date", description: "Next required inspection date" },
      { id: "certificationBody", label: "Certification Body", dataType: "string", description: "Equipment certification authority" }
    ]
  }
];

// =============================================================================
// Upstream Assets
// =============================================================================

export const upstreamAssets: UpstreamAsset[] = [
  // Wellheads
  {
    id: "asset-wh-np-01-01",
    name: "NP-01-01H Wellhead",
    typeId: "type-wellhead",
    status: "active",
    tenantId: "alpha-upstream",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-permian-north", padId: "pad-np-01", wellId: "well-np-01-01" },
    role: "fixed",
    geoLocation: { lat: 31.8457, lng: -102.3676 },
    hazardousAreaClass: "Zone 1",
    criticality: "High",
    productionContext: { wellType: "producer", fluid: "oil" },
    description: "Wellhead assembly for horizontal oil producer"
  },
  {
    id: "asset-wh-np-01-02", 
    name: "NP-01-02H Wellhead",
    typeId: "type-wellhead",
    status: "active",
    tenantId: "alpha-upstream",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-permian-north", padId: "pad-np-01", wellId: "well-np-01-02" },
    role: "fixed",
    geoLocation: { lat: 31.8459, lng: -102.3678 },
    hazardousAreaClass: "Zone 1", 
    criticality: "High",
    productionContext: { wellType: "producer", fluid: "oil" },
    description: "Wellhead assembly for horizontal oil producer"
  },
  
  // Christmas Trees
  {
    id: "asset-xt-np-01-01",
    name: "NP-01-01H Christmas Tree",
    typeId: "type-xmas-tree",
    status: "active",
    tenantId: "alpha-upstream",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-permian-north", padId: "pad-np-01", wellId: "well-np-01-01" },
    role: "fixed",
    geoLocation: { lat: 31.8457, lng: -102.3676 },
    hazardousAreaClass: "Zone 1",
    criticality: "High",
    productionContext: { wellType: "producer", fluid: "oil" },
    description: "Surface flow control tree"
  },
  
  // ESPs
  {
    id: "asset-esp-ew-01-01",
    name: "EW-01-01H ESP",
    typeId: "type-esp",
    status: "active",
    tenantId: "alpha-upstream",
    hierarchyIds: { basinId: "basin-eagle-ford", fieldId: "field-eagle-west", padId: "pad-ew-01", wellId: "well-ew-01-01" },
    role: "fixed",
    hazardousAreaClass: "Zone 2",
    criticality: "High",
    productionContext: { wellType: "producer", fluid: "oil" },
    description: "Downhole electric submersible pump"
  },
  
  // Separators
  {
    id: "asset-sep-cp-01",
    name: "Central Processing Separator 01",
    typeId: "type-separator",
    status: "active",
    tenantId: "alpha-upstream",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-permian-central", padId: "platform-cp-01", facilityId: "facility-cp-sep-01" },
    role: "fixed",
    geoLocation: { lat: 31.8500, lng: -102.3700 },
    hazardousAreaClass: "Zone 1",
    criticality: "High",
    description: "3-phase oil/gas/water separator"
  },
  {
    id: "asset-sep-np-01",
    name: "NP-01 Test Separator",
    typeId: "type-separator",
    status: "active",
    tenantId: "alpha-upstream",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-permian-north", padId: "pad-np-01", facilityId: "facility-np-01-sep" },
    role: "fixed",
    geoLocation: { lat: 31.8460, lng: -102.3680 },
    hazardousAreaClass: "Zone 1",
    criticality: "Medium",
    description: "Well testing separator"
  },
  
  // Compressors
  {
    id: "asset-comp-cp-01",
    name: "Central Processing Compressor 01",
    typeId: "type-compressor",
    status: "active",
    tenantId: "alpha-upstream",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-permian-central", padId: "platform-cp-01", facilityId: "facility-cp-comp-01" },
    role: "fixed",
    geoLocation: { lat: 31.8502, lng: -102.3702 },
    hazardousAreaClass: "Zone 1",
    criticality: "High",
    description: "Gas compression station"
  },
  {
    id: "asset-comp-np-02",
    name: "NP-02 Gas Lift Compressor",
    typeId: "type-compressor",
    status: "maintenance",
    tenantId: "alpha-upstream",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-permian-north", padId: "pad-np-02", facilityId: "facility-np-02-comp" },
    role: "fixed",
    geoLocation: { lat: 31.8470, lng: -102.3690 },
    hazardousAreaClass: "Zone 1",
    criticality: "High",
    description: "Gas lift compressor package"
  },
  
  // Pumps
  {
    id: "asset-pump-np-03",
    name: "NP-03 Water Injection Pump",
    typeId: "type-pump",
    status: "active",
    tenantId: "alpha-upstream",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-permian-north", padId: "pad-np-03", facilityId: "facility-np-03-pump" },
    role: "fixed",
    geoLocation: { lat: 31.8480, lng: -102.3700 },
    hazardousAreaClass: "Zone 2",
    criticality: "High",
    description: "High pressure water injection pump"
  },
  
  // Storage Tanks
  {
    id: "asset-tank-cp-01",
    name: "Central Processing Tank Battery 01",
    typeId: "type-tank",
    status: "active",
    tenantId: "alpha-upstream",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-permian-central", padId: "platform-cp-01", facilityId: "facility-cp-tank-01" },
    role: "fixed",
    geoLocation: { lat: 31.8505, lng: -102.3705 },
    hazardousAreaClass: "Zone 2",
    criticality: "Medium",
    description: "Crude oil storage tank battery"
  },
  
  // RTUs
  {
    id: "asset-rtu-np-01",
    name: "NP-01 Pad RTU",
    typeId: "type-rtu",
    status: "active",
    tenantId: "alpha-upstream",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-permian-north", padId: "pad-np-01" },
    role: "fixed",
    geoLocation: { lat: 31.8465, lng: -102.3685 },
    hazardousAreaClass: "Zone 2",
    criticality: "High",
    description: "Pad data acquisition and control unit"
  },
  {
    id: "asset-rtu-np-02",
    name: "NP-02 Pad RTU",
    typeId: "type-rtu",
    status: "active",
    tenantId: "alpha-upstream",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-permian-north", padId: "pad-np-02" },
    role: "fixed",
    geoLocation: { lat: 31.8475, lng: -102.3695 },
    hazardousAreaClass: "Zone 2",
    criticality: "High",
    description: "Pad data acquisition and control unit"
  },
  {
    id: "asset-rtu-cp-01",
    name: "Central Processing RTU",
    typeId: "type-rtu",
    status: "active",
    tenantId: "alpha-upstream",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-permian-central", padId: "platform-cp-01" },
    role: "fixed",
    geoLocation: { lat: 31.8510, lng: -102.3710 },
    hazardousAreaClass: "Zone 2",
    criticality: "High",
    description: "Central processing facility RTU"
  },
  
  // SIS Logic Solvers
  {
    id: "asset-sis-cp-01",
    name: "Central Processing SIS",
    typeId: "type-sis",
    status: "active",
    tenantId: "alpha-upstream",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-permian-central", padId: "platform-cp-01" },
    role: "fixed",
    geoLocation: { lat: 31.8508, lng: -102.3708 },
    hazardousAreaClass: "Zone 2",
    criticality: "High",
    description: "Safety instrumented system logic solver"
  },
  
  // Flow Meters
  {
    id: "asset-fm-cp-01",
    name: "Central Processing Flow Meter 01",
    typeId: "type-flow-meter",
    status: "active",
    tenantId: "alpha-upstream",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-permian-central", padId: "platform-cp-01" },
    role: "fixed",
    geoLocation: { lat: 31.8503, lng: -102.3703 },
    hazardousAreaClass: "Zone 1",
    criticality: "Medium",
    description: "Custody transfer flow meter"
  },

  // =============================================================================
  // Beta Energy Corp Assets
  // =============================================================================
  
  {
    id: "asset-beta-wh-01",
    name: "Beta Field WH-01",
    typeId: "type-wellhead",
    status: "active",
    tenantId: "beta-energy",
    hierarchyIds: { basinId: "basin-eagle-ford", fieldId: "field-beta-main" },
    role: "fixed",
    geoLocation: { lat: 28.5000, lng: -98.0000 },
    hazardousAreaClass: "Zone 1",
    criticality: "High",
    productionContext: { wellType: "producer", fluid: "gas" },
    description: "Beta Energy wellhead"
  },
  {
    id: "asset-beta-sep-01",
    name: "Beta Field Separator 01",
    typeId: "type-separator",
    status: "active",
    tenantId: "beta-energy",
    hierarchyIds: { basinId: "basin-eagle-ford", fieldId: "field-beta-main" },
    role: "fixed",
    geoLocation: { lat: 28.5010, lng: -98.0010 },
    hazardousAreaClass: "Zone 1",
    criticality: "High",
    description: "Beta Energy gas separator"
  },
  {
    id: "asset-beta-comp-01",
    name: "Beta Field Compressor 01",
    typeId: "type-compressor",
    status: "active",
    tenantId: "beta-energy",
    hierarchyIds: { basinId: "basin-eagle-ford", fieldId: "field-beta-main" },
    role: "fixed",
    geoLocation: { lat: 28.5020, lng: -98.0020 },
    hazardousAreaClass: "Zone 1",
    criticality: "High",
    description: "Beta Energy gas compressor"
  },
  {
    id: "asset-beta-rtu-01",
    name: "Beta Field RTU 01",
    typeId: "type-rtu",
    status: "active",
    tenantId: "beta-energy",
    hierarchyIds: { basinId: "basin-eagle-ford", fieldId: "field-beta-main" },
    role: "fixed",
    geoLocation: { lat: 28.5030, lng: -98.0030 },
    hazardousAreaClass: "Zone 2",
    criticality: "Medium",
    description: "Beta Energy RTU"
  },

  // =============================================================================
  // Gamma Petroleum Inc Assets
  // =============================================================================
  
  {
    id: "asset-gamma-wh-01",
    name: "Gamma Field WH-01",
    typeId: "type-wellhead",
    status: "active",
    tenantId: "gamma-petroleum",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-gamma-west" },
    role: "fixed",
    geoLocation: { lat: 32.0000, lng: -103.0000 },
    hazardousAreaClass: "Zone 1",
    criticality: "High",
    productionContext: { wellType: "producer", fluid: "oil" },
    description: "Gamma Petroleum wellhead"
  },
  {
    id: "asset-gamma-wh-02",
    name: "Gamma Field WH-02",
    typeId: "type-wellhead",
    status: "maintenance",
    tenantId: "gamma-petroleum",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-gamma-west" },
    role: "fixed",
    geoLocation: { lat: 32.0010, lng: -103.0010 },
    hazardousAreaClass: "Zone 1",
    criticality: "High",
    productionContext: { wellType: "producer", fluid: "oil" },
    description: "Gamma Petroleum wellhead under maintenance"
  },
  {
    id: "asset-gamma-sep-01",
    name: "Gamma Field Separator 01",
    typeId: "type-separator",
    status: "active",
    tenantId: "gamma-petroleum",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-gamma-west" },
    role: "fixed",
    geoLocation: { lat: 32.0020, lng: -103.0020 },
    hazardousAreaClass: "Zone 1",
    criticality: "High",
    description: "Gamma Petroleum oil separator"
  },
  {
    id: "asset-gamma-pump-01",
    name: "Gamma Field Pump 01",
    typeId: "type-pump",
    status: "active",
    tenantId: "gamma-petroleum",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-gamma-west" },
    role: "fixed",
    geoLocation: { lat: 32.0030, lng: -103.0030 },
    hazardousAreaClass: "Zone 2",
    criticality: "Medium",
    description: "Gamma Petroleum transfer pump"
  },
  {
    id: "asset-gamma-tank-01",
    name: "Gamma Field Tank 01",
    typeId: "type-tank",
    status: "active",
    tenantId: "gamma-petroleum",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-gamma-west" },
    role: "fixed",
    geoLocation: { lat: 32.0040, lng: -103.0040 },
    hazardousAreaClass: "Zone 2",
    criticality: "Low",
    description: "Gamma Petroleum storage tank"
  },

  // Mobile Assets
  {
    id: "asset-truck-maint-01",
    name: "Maintenance Truck MT-01",
    typeId: "type-maintenance-truck",
    status: "active",
    tenantId: "alpha-upstream",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-permian-north" },
    role: "mobile",
    geoLocation: { lat: 31.8465, lng: -102.3685 },
    hazardousAreaClass: "Non-hazardous",
    criticality: "Medium",
    description: "Mobile maintenance truck currently at North Permian Field",
    assignedLocation: { fieldId: "field-permian-north", padId: "pad-np-01" },
    lastKnownLocation: { lat: 31.8465, lng: -102.3685, timestamp: "2024-01-15T14:30:00Z" }
  },
  {
    id: "asset-truck-service-01",
    name: "Service Truck ST-01",
    typeId: "type-service-truck",
    status: "active",
    tenantId: "alpha-upstream",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-permian-central" },
    role: "mobile",
    geoLocation: { lat: 31.8500, lng: -102.3700 },
    hazardousAreaClass: "Non-hazardous",
    criticality: "Medium",
    description: "Service truck with hydraulic equipment at Central Platform",
    assignedLocation: { fieldId: "field-permian-central", padId: "platform-cp-01" },
    lastKnownLocation: { lat: 31.8500, lng: -102.3700, timestamp: "2024-01-15T16:45:00Z" }
  },
  {
    id: "asset-gen-portable-01",
    name: "Portable Generator PG-01",
    typeId: "type-portable-generator",
    status: "maintenance",
    tenantId: "alpha-upstream",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-permian-north" },
    role: "mobile",
    geoLocation: { lat: 31.8470, lng: -102.3690 },
    hazardousAreaClass: "Zone 2",
    criticality: "Low",
    description: "Portable diesel generator undergoing maintenance",
    assignedLocation: { fieldId: "field-permian-north", padId: "pad-np-02" },
    lastKnownLocation: { lat: 31.8470, lng: -102.3690, timestamp: "2024-01-15T08:15:00Z" }
  },
  {
    id: "asset-pump-portable-01",
    name: "Portable Pump PP-01",
    typeId: "type-portable-pump",
    status: "active",
    tenantId: "alpha-upstream",
    hierarchyIds: { basinId: "basin-eagle-ford", fieldId: "field-eagle-west" },
    role: "mobile",
    geoLocation: { lat: 28.4500, lng: -98.1000 },
    hazardousAreaClass: "Zone 1",
    criticality: "Medium",
    description: "Portable pump for temporary fluid transfer at Eagle Ford",
    assignedLocation: { fieldId: "field-eagle-west", padId: "pad-ew-01" },
    lastKnownLocation: { lat: 28.4500, lng: -98.1000, timestamp: "2024-01-15T12:00:00Z" }
  },
  {
    id: "asset-truck-maint-02",
    name: "Maintenance Truck MT-02",
    typeId: "type-maintenance-truck",
    status: "active",
    tenantId: "beta-energy",
    hierarchyIds: { basinId: "basin-eagle-ford", fieldId: "field-beta-main" },
    role: "mobile",
    geoLocation: { lat: 28.5005, lng: -98.0005 },
    hazardousAreaClass: "Non-hazardous",
    criticality: "Medium",
    description: "Beta Energy maintenance truck at main field",
    assignedLocation: { fieldId: "field-beta-main" },
    lastKnownLocation: { lat: 28.5005, lng: -98.0005, timestamp: "2024-01-15T10:30:00Z" }
  },
  {
    id: "asset-gen-portable-02",
    name: "Portable Generator PG-02",
    typeId: "type-portable-generator",
    status: "active",
    tenantId: "gamma-petroleum",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-gamma-west" },
    role: "mobile",
    geoLocation: { lat: 32.0015, lng: -103.0015 },
    hazardousAreaClass: "Zone 2",
    criticality: "Low",
    description: "Backup generator for Gamma Petroleum operations",
    assignedLocation: { fieldId: "field-gamma-west" },
    lastKnownLocation: { lat: 32.0015, lng: -103.0015, timestamp: "2024-01-15T13:20:00Z" }
  }
];

// =============================================================================
// Linear Assets (Flowlines and Pipelines)
// =============================================================================

export const linearAssets: LinearAsset[] = [
  // Flowlines from wells to pad facilities
  {
    id: "asset-fl-np-01-01",
    name: "NP-01-01H to Manifold Flowline",
    typeId: "type-flowline",
    status: "active",
    tenantId: "alpha-upstream",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-permian-north", padId: "pad-np-01" },
    role: "linear",
    hazardousAreaClass: "Zone 2",
    criticality: "Medium",
    productionContext: { fluid: "oil" },
    startNodeId: "asset-wh-np-01-01",
    endNodeId: "asset-sep-np-01",
    length: 500,
    lengthUnit: "ft",
    maop: 1440,
    diameter: 4,
    material: "API 5L X52",
    description: "Well to separator flowline"
  },
  {
    id: "asset-fl-np-01-02",
    name: "NP-01-02H to Manifold Flowline",
    typeId: "type-flowline",
    status: "active",
    tenantId: "alpha-upstream",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-permian-north", padId: "pad-np-01" },
    role: "linear",
    hazardousAreaClass: "Zone 2",
    criticality: "Medium",
    productionContext: { fluid: "oil" },
    startNodeId: "asset-wh-np-01-02",
    endNodeId: "asset-sep-np-01",
    length: 750,
    lengthUnit: "ft",
    maop: 1440,
    diameter: 4,
    material: "API 5L X52",
    description: "Well to separator flowline"
  },
  
  // Pipeline segments between facilities
  {
    id: "asset-pl-np-cp-01",
    name: "North Permian to Central Pipeline",
    typeId: "type-pipeline",
    status: "active",
    tenantId: "alpha-upstream",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-permian-north" },
    role: "linear",
    hazardousAreaClass: "Zone 2",
    criticality: "High",
    productionContext: { fluid: "oil" },
    startNodeId: "asset-sep-np-01",
    endNodeId: "asset-sep-cp-01",
    length: 5.2,
    lengthUnit: "mi",
    maop: 1440,
    diameter: 12,
    material: "API 5L X65",
    description: "Main oil pipeline to central processing",
    issues: [
      {
        id: "issue-pl-np-cp-01-01",
        type: "corrosion",
        description: "Elevated corrosion rate detected at mile marker 2.3",
        severity: "medium"
      }
    ]
  },
  {
    id: "asset-pl-cp-export",
    name: "Central Processing Export Pipeline",
    typeId: "type-pipeline",
    status: "active",
    tenantId: "alpha-upstream",
    hierarchyIds: { basinId: "basin-permian", fieldId: "field-permian-central" },
    role: "linear",
    hazardousAreaClass: "Zone 2",
    criticality: "High",
    productionContext: { fluid: "oil" },
    startNodeId: "asset-sep-cp-01",
    endNodeId: "export-terminal-01",
    length: 12.8,
    lengthUnit: "mi",
    maop: 1440,
    diameter: 16,
    material: "API 5L X65",
    description: "Export pipeline to terminal"
  },
  
  // Gas pipeline
  {
    id: "asset-pl-gas-01",
    name: "Eagle Ford Gas Pipeline 01",
    typeId: "type-pipeline",
    status: "active",
    tenantId: "alpha-upstream",
    hierarchyIds: { basinId: "basin-eagle-ford", fieldId: "field-eagle-east" },
    role: "linear",
    hazardousAreaClass: "Zone 2",
    criticality: "High",
    productionContext: { fluid: "gas" },
    startNodeId: "asset-comp-ee-01",
    endNodeId: "gas-plant-01",
    length: 8.5,
    lengthUnit: "mi",
    maop: 1000,
    diameter: 10,
    material: "API 5L X52",
    description: "Gas gathering pipeline to processing plant",
    issues: [
      {
        id: "issue-pl-gas-01-01",
        type: "leak-suspicion",
        description: "Pressure drop anomaly detected between stations 3 and 4",
        severity: "high"
      }
    ]
  }
];
// =============================================================================
// Connection Endpoints
// =============================================================================

export const connectionEndpoints: ConnectionEndpoint[] = [
  // RTU Modbus Endpoints
  {
    id: "endpoint-rtu-np-01",
    tenantId: "alpha-upstream",
    name: "NP-01 Pad RTU Modbus",
    protocol: "modbus-tcp",
    address: "192.168.1.101",
    port: 502,
    zone: "OT",
    hazardousArea: "Zone 2",
    status: "up",
    lastSeen: "2024-01-15T10:30:00Z",
    description: "Modbus TCP endpoint for North Permian Pad 01 RTU"
  },
  {
    id: "endpoint-rtu-np-02",
    tenantId: "alpha-upstream",
    name: "NP-02 Pad RTU Modbus",
    protocol: "modbus-tcp",
    address: "192.168.1.102",
    port: 502,
    zone: "OT",
    hazardousArea: "Zone 2",
    status: "up",
    lastSeen: "2024-01-15T10:29:45Z",
    description: "Modbus TCP endpoint for North Permian Pad 02 RTU"
  },
  {
    id: "endpoint-rtu-np-03",
    tenantId: "alpha-upstream",
    name: "NP-03 Pad RTU Modbus",
    protocol: "modbus-tcp",
    address: "192.168.1.103",
    port: 502,
    zone: "OT",
    hazardousArea: "Zone 2",
    status: "up",
    lastSeen: "2024-01-15T10:30:15Z",
    description: "Modbus TCP endpoint for North Permian Pad 03 RTU"
  },
  {
    id: "endpoint-rtu-cp-01",
    tenantId: "alpha-upstream",
    name: "Central Processing RTU Modbus",
    protocol: "modbus-tcp",
    address: "192.168.1.201",
    port: 502,
    zone: "OT",
    hazardousArea: "Zone 2",
    status: "up",
    lastSeen: "2024-01-15T10:30:30Z",
    description: "Modbus TCP endpoint for Central Processing RTU"
  },
  
  // OPC-UA Platform Servers
  {
    id: "endpoint-opc-cp-01",
    tenantId: "alpha-upstream",
    name: "Central Processing OPC-UA Server",
    protocol: "opc-ua",
    address: "192.168.1.210",
    port: 4840,
    zone: "OT",
    hazardousArea: "Zone 2",
    status: "up",
    lastSeen: "2024-01-15T10:30:00Z",
    description: "OPC-UA server for Central Processing Platform"
  },
  {
    id: "endpoint-opc-ee-01",
    tenantId: "alpha-upstream",
    name: "Eagle Ford East OPC-UA Server",
    protocol: "opc-ua",
    address: "192.168.2.101",
    port: 4840,
    zone: "OT",
    hazardousArea: "Zone 2",
    status: "up",
    lastSeen: "2024-01-15T10:29:30Z",
    description: "OPC-UA server for Eagle Ford East operations"
  },
  
  // HART Endpoints
  {
    id: "endpoint-hart-np-01",
    tenantId: "alpha-upstream",
    name: "NP-01 HART Multiplexer",
    protocol: "hart",
    address: "192.168.1.111",
    port: 5094,
    zone: "OT",
    hazardousArea: "Zone 1",
    status: "up",
    lastSeen: "2024-01-15T10:28:45Z",
    description: "HART multiplexer for field instruments"
  },
  
  // Pipeline SCADA Gateway
  {
    id: "endpoint-scada-pl-01",
    tenantId: "alpha-upstream",
    name: "Pipeline SCADA Gateway",
    protocol: "modbus-tcp",
    address: "192.168.3.101",
    port: 502,
    zone: "OT",
    status: "down",
    lastSeen: "2024-01-15T08:15:22Z",
    description: "SCADA gateway for pipeline monitoring"
  }
];

// =============================================================================
// Data Points
// =============================================================================

export const dataPoints: DataPoint[] = [
  // NP-01-01H Wellhead Data Points
  {
    id: "dp-wh-np-01-01-thp",
    assetId: "asset-wh-np-01-01",
    endpointId: "endpoint-rtu-np-01",
    logicalName: "NP-01-01H Tubing Head Pressure",
    rawAddress: "40001",
    direction: "input",
    unit: "psig",
    dataType: "float",
    protocolMetadata: { "register": 40001, "function": 3, "dataType": "float32" },
    description: "Wellhead tubing pressure measurement"
  },
  {
    id: "dp-wh-np-01-01-chp",
    assetId: "asset-wh-np-01-01",
    endpointId: "endpoint-rtu-np-01",
    logicalName: "NP-01-01H Casing Head Pressure",
    rawAddress: "40002",
    direction: "input",
    unit: "psig",
    dataType: "float",
    protocolMetadata: { "register": 40002, "function": 3, "dataType": "float32" },
    description: "Wellhead casing pressure measurement"
  },
  {
    id: "dp-wh-np-01-01-temp",
    assetId: "asset-wh-np-01-01",
    endpointId: "endpoint-rtu-np-01",
    logicalName: "NP-01-01H Wellhead Temperature",
    rawAddress: "40003",
    direction: "input",
    unit: "°F",
    dataType: "float",
    protocolMetadata: { "register": 40003, "function": 3, "dataType": "float32" },
    description: "Wellhead temperature measurement"
  },
  {
    id: "dp-wh-np-01-01-flow",
    assetId: "asset-wh-np-01-01",
    endpointId: "endpoint-rtu-np-01",
    logicalName: "NP-01-01H Flow Rate",
    rawAddress: "40004",
    direction: "input",
    unit: "BOPD",
    dataType: "float",
    protocolMetadata: { "register": 40004, "function": 3, "dataType": "float32" },
    description: "Well production flow rate"
  },
  
  // Christmas Tree Data Points
  {
    id: "dp-xt-np-01-01-mv",
    assetId: "asset-xt-np-01-01",
    endpointId: "endpoint-rtu-np-01",
    logicalName: "NP-01-01H Master Valve Position",
    rawAddress: "40011",
    direction: "input",
    unit: "%",
    dataType: "float",
    protocolMetadata: { "register": 40011, "function": 3, "dataType": "float32" },
    description: "Master valve position feedback"
  },
  {
    id: "dp-xt-np-01-01-wv",
    assetId: "asset-xt-np-01-01",
    endpointId: "endpoint-rtu-np-01",
    logicalName: "NP-01-01H Wing Valve Position",
    rawAddress: "40012",
    direction: "input",
    unit: "%",
    dataType: "float",
    protocolMetadata: { "register": 40012, "function": 3, "dataType": "float32" },
    description: "Wing valve position feedback"
  },
  {
    id: "dp-xt-np-01-01-choke",
    assetId: "asset-xt-np-01-01",
    endpointId: "endpoint-rtu-np-01",
    logicalName: "NP-01-01H Choke Position",
    rawAddress: "40013",
    direction: "bidirectional",
    unit: "%",
    dataType: "float",
    protocolMetadata: { "register": 40013, "function": 3, "dataType": "float32" },
    description: "Production choke position"
  },
  
  // ESP Data Points
  {
    id: "dp-esp-ew-01-01-current",
    assetId: "asset-esp-ew-01-01",
    endpointId: "endpoint-opc-ee-01",
    logicalName: "EW-01-01H ESP Motor Current",
    rawAddress: "ns=2;s=ESP.EW0101H.MotorCurrent",
    direction: "input",
    unit: "A",
    dataType: "float",
    protocolMetadata: { "nodeId": "ns=2;s=ESP.EW0101H.MotorCurrent" },
    description: "ESP motor current draw"
  },
  {
    id: "dp-esp-ew-01-01-intake",
    assetId: "asset-esp-ew-01-01",
    endpointId: "endpoint-opc-ee-01",
    logicalName: "EW-01-01H ESP Intake Pressure",
    rawAddress: "ns=2;s=ESP.EW0101H.IntakePressure",
    direction: "input",
    unit: "psig",
    dataType: "float",
    protocolMetadata: { "nodeId": "ns=2;s=ESP.EW0101H.IntakePressure" },
    description: "ESP pump intake pressure"
  },
  {
    id: "dp-esp-ew-01-01-discharge",
    assetId: "asset-esp-ew-01-01",
    endpointId: "endpoint-opc-ee-01",
    logicalName: "EW-01-01H ESP Discharge Pressure",
    rawAddress: "ns=2;s=ESP.EW0101H.DischargePressure",
    direction: "input",
    unit: "psig",
    dataType: "float",
    protocolMetadata: { "nodeId": "ns=2;s=ESP.EW0101H.DischargePressure" },
    description: "ESP pump discharge pressure"
  },
  {
    id: "dp-esp-ew-01-01-freq",
    assetId: "asset-esp-ew-01-01",
    endpointId: "endpoint-opc-ee-01",
    logicalName: "EW-01-01H ESP Frequency",
    rawAddress: "ns=2;s=ESP.EW0101H.Frequency",
    direction: "bidirectional",
    unit: "Hz",
    dataType: "float",
    protocolMetadata: { "nodeId": "ns=2;s=ESP.EW0101H.Frequency" },
    description: "ESP VFD frequency setpoint"
  },
  
  // Separator Data Points
  {
    id: "dp-sep-cp-01-pressure",
    assetId: "asset-sep-cp-01",
    endpointId: "endpoint-opc-cp-01",
    logicalName: "Central Sep 01 Pressure",
    rawAddress: "ns=2;s=SEP.CP01.Pressure",
    direction: "input",
    unit: "psig",
    dataType: "float",
    protocolMetadata: { "nodeId": "ns=2;s=SEP.CP01.Pressure" },
    description: "Separator operating pressure"
  },
  {
    id: "dp-sep-cp-01-temp",
    assetId: "asset-sep-cp-01",
    endpointId: "endpoint-opc-cp-01",
    logicalName: "Central Sep 01 Temperature",
    rawAddress: "ns=2;s=SEP.CP01.Temperature",
    direction: "input",
    unit: "°F",
    dataType: "float",
    protocolMetadata: { "nodeId": "ns=2;s=SEP.CP01.Temperature" },
    description: "Separator operating temperature"
  },
  {
    id: "dp-sep-cp-01-level",
    assetId: "asset-sep-cp-01",
    endpointId: "endpoint-opc-cp-01",
    logicalName: "Central Sep 01 Oil Level",
    rawAddress: "ns=2;s=SEP.CP01.OilLevel",
    direction: "input",
    unit: "%",
    dataType: "float",
    protocolMetadata: { "nodeId": "ns=2;s=SEP.CP01.OilLevel" },
    description: "Separator oil level"
  },
  {
    id: "dp-sep-cp-01-water-level",
    assetId: "asset-sep-cp-01",
    endpointId: "endpoint-opc-cp-01",
    logicalName: "Central Sep 01 Water Level",
    rawAddress: "ns=2;s=SEP.CP01.WaterLevel",
    direction: "input",
    unit: "%",
    dataType: "float",
    protocolMetadata: { "nodeId": "ns=2;s=SEP.CP01.WaterLevel" },
    description: "Separator water level"
  },
  
  // Compressor Data Points
  {
    id: "dp-comp-cp-01-suction",
    assetId: "asset-comp-cp-01",
    endpointId: "endpoint-opc-cp-01",
    logicalName: "Central Comp 01 Suction Pressure",
    rawAddress: "ns=2;s=COMP.CP01.SuctionPressure",
    direction: "input",
    unit: "psig",
    dataType: "float",
    protocolMetadata: { "nodeId": "ns=2;s=COMP.CP01.SuctionPressure" },
    description: "Compressor suction pressure"
  },
  {
    id: "dp-comp-cp-01-discharge",
    assetId: "asset-comp-cp-01",
    endpointId: "endpoint-opc-cp-01",
    logicalName: "Central Comp 01 Discharge Pressure",
    rawAddress: "ns=2;s=COMP.CP01.DischargePressure",
    direction: "input",
    unit: "psig",
    dataType: "float",
    protocolMetadata: { "nodeId": "ns=2;s=COMP.CP01.DischargePressure" },
    description: "Compressor discharge pressure"
  },
  {
    id: "dp-comp-cp-01-vibration",
    assetId: "asset-comp-cp-01",
    endpointId: "endpoint-hart-np-01",
    logicalName: "Central Comp 01 Vibration",
    rawAddress: "1",
    direction: "input",
    unit: "mm/s",
    dataType: "float",
    protocolMetadata: { "hartAddress": 1, "variable": "PV" },
    description: "Compressor vibration monitoring"
  },
  
  // Water Injection Pump Data Points
  {
    id: "dp-pump-np-03-suction",
    assetId: "asset-pump-np-03",
    endpointId: "endpoint-rtu-np-03",
    logicalName: "NP-03 Pump Suction Pressure",
    rawAddress: "40021",
    direction: "input",
    unit: "psig",
    dataType: "float",
    protocolMetadata: { "register": 40021, "function": 3, "dataType": "float32" },
    description: "Water injection pump suction pressure"
  },
  {
    id: "dp-pump-np-03-discharge",
    assetId: "asset-pump-np-03",
    endpointId: "endpoint-rtu-np-03",
    logicalName: "NP-03 Pump Discharge Pressure",
    rawAddress: "40022",
    direction: "input",
    unit: "psig",
    dataType: "float",
    protocolMetadata: { "register": 40022, "function": 3, "dataType": "float32" },
    description: "Water injection pump discharge pressure"
  },
  {
    id: "dp-pump-np-03-flow",
    assetId: "asset-pump-np-03",
    endpointId: "endpoint-rtu-np-03",
    logicalName: "NP-03 Pump Flow Rate",
    rawAddress: "40023",
    direction: "input",
    unit: "BPD",
    dataType: "float",
    protocolMetadata: { "register": 40023, "function": 3, "dataType": "float32" },
    description: "Water injection flow rate"
  },
  
  // Storage Tank Data Points
  {
    id: "dp-tank-cp-01-level",
    assetId: "asset-tank-cp-01",
    endpointId: "endpoint-opc-cp-01",
    logicalName: "Central Tank 01 Level",
    rawAddress: "ns=2;s=TANK.CP01.Level",
    direction: "input",
    unit: "%",
    dataType: "float",
    protocolMetadata: { "nodeId": "ns=2;s=TANK.CP01.Level" },
    description: "Crude oil tank level"
  },
  {
    id: "dp-tank-cp-01-temp",
    assetId: "asset-tank-cp-01",
    endpointId: "endpoint-opc-cp-01",
    logicalName: "Central Tank 01 Temperature",
    rawAddress: "ns=2;s=TANK.CP01.Temperature",
    direction: "input",
    unit: "°F",
    dataType: "float",
    protocolMetadata: { "nodeId": "ns=2;s=TANK.CP01.Temperature" },
    description: "Crude oil tank temperature"
  },
  
  // Flow Meter Data Points
  {
    id: "dp-fm-cp-01-flow",
    assetId: "asset-fm-cp-01",
    endpointId: "endpoint-opc-cp-01",
    logicalName: "Central FM 01 Flow Rate",
    rawAddress: "ns=2;s=FM.CP01.FlowRate",
    direction: "input",
    unit: "BOPD",
    dataType: "float",
    protocolMetadata: { "nodeId": "ns=2;s=FM.CP01.FlowRate" },
    description: "Custody transfer flow rate"
  },
  {
    id: "dp-fm-cp-01-totalizer",
    assetId: "asset-fm-cp-01",
    endpointId: "endpoint-opc-cp-01",
    logicalName: "Central FM 01 Totalizer",
    rawAddress: "ns=2;s=FM.CP01.Totalizer",
    direction: "input",
    unit: "BBL",
    dataType: "double",
    protocolMetadata: { "nodeId": "ns=2;s=FM.CP01.Totalizer" },
    description: "Custody transfer totalizer"
  },
  
  // Pipeline Data Points
  {
    id: "dp-pl-np-cp-01-pressure",
    assetId: "asset-pl-np-cp-01",
    endpointId: "endpoint-scada-pl-01",
    logicalName: "NP-CP Pipeline Pressure",
    rawAddress: "40101",
    direction: "input",
    unit: "psig",
    dataType: "float",
    protocolMetadata: { "register": 40101, "function": 3, "dataType": "float32" },
    description: "Pipeline operating pressure"
  },
  {
    id: "dp-pl-np-cp-01-flow",
    assetId: "asset-pl-np-cp-01",
    endpointId: "endpoint-scada-pl-01",
    logicalName: "NP-CP Pipeline Flow",
    rawAddress: "40102",
    direction: "input",
    unit: "BOPD",
    dataType: "float",
    protocolMetadata: { "register": 40102, "function": 3, "dataType": "float32" },
    description: "Pipeline flow rate"
  },
  
  // RTU System Data Points
  {
    id: "dp-rtu-np-01-status",
    assetId: "asset-rtu-np-01",
    endpointId: "endpoint-rtu-np-01",
    logicalName: "NP-01 RTU Communication Status",
    rawAddress: "10001",
    direction: "input",
    unit: "boolean",
    dataType: "boolean",
    protocolMetadata: { "register": 10001, "function": 1 },
    description: "RTU communication health status"
  },
  {
    id: "dp-rtu-np-01-power",
    assetId: "asset-rtu-np-01",
    endpointId: "endpoint-rtu-np-01",
    logicalName: "NP-01 RTU Power Status",
    rawAddress: "10002",
    direction: "input",
    unit: "boolean",
    dataType: "boolean",
    protocolMetadata: { "register": 10002, "function": 1 },
    description: "RTU power supply status"
  },
  
  // SIS Data Points
  {
    id: "dp-sis-cp-01-status",
    assetId: "asset-sis-cp-01",
    endpointId: "endpoint-opc-cp-01",
    logicalName: "Central SIS System Status",
    rawAddress: "ns=2;s=SIS.CP01.SystemStatus",
    direction: "input",
    unit: "enum",
    dataType: "int",
    protocolMetadata: { "nodeId": "ns=2;s=SIS.CP01.SystemStatus" },
    description: "SIS overall system status"
  },
  {
    id: "dp-sis-cp-01-trip",
    assetId: "asset-sis-cp-01",
    endpointId: "endpoint-opc-cp-01",
    logicalName: "Central SIS Trip Status",
    rawAddress: "ns=2;s=SIS.CP01.TripStatus",
    direction: "input",
    unit: "boolean",
    dataType: "boolean",
    protocolMetadata: { "nodeId": "ns=2;s=SIS.CP01.TripStatus" },
    description: "SIS trip activation status"
  }
];
// =============================================================================
// Discovery Jobs
// =============================================================================

export const upstreamDiscoveryJobs: UpstreamDiscoveryJob[] = [
  // Network Scan Jobs
  {
    id: "job-network-np-01",
    name: "North Permian Network Scan",
    tenantId: "alpha-upstream",
    type: "network",
    scope: { ipRange: "192.168.1.100-192.168.1.150" },
    status: "completed",
    foundCount: 12,
    lastRunAt: "2024-01-15T08:30:00Z",
    description: "Network discovery scan for North Permian field infrastructure"
  },
  {
    id: "job-network-cp-01",
    name: "Central Processing Network Scan",
    tenantId: "alpha-upstream",
    type: "network",
    scope: { ipRange: "192.168.1.200-192.168.1.220" },
    status: "completed",
    foundCount: 8,
    lastRunAt: "2024-01-15T09:15:00Z",
    description: "Network discovery for central processing platform"
  },
  {
    id: "job-network-ee-01",
    name: "Eagle Ford East Network Scan",
    tenantId: "alpha-upstream",
    type: "network",
    scope: { ipRange: "192.168.2.100-192.168.2.150" },
    status: "running",
    foundCount: 6,
    lastRunAt: "2024-01-15T10:00:00Z",
    description: "Active network scan for Eagle Ford East operations"
  },
  {
    id: "job-network-pipeline-01",
    name: "Pipeline Network Scan",
    tenantId: "alpha-upstream",
    type: "network",
    scope: { ipRange: "192.168.3.100-192.168.3.120" },
    status: "failed",
    foundCount: 0,
    lastRunAt: "2024-01-15T07:45:00Z",
    errors: ["Connection timeout to SCADA gateway", "Authentication failure on 192.168.3.101"],
    description: "Network scan for pipeline SCADA infrastructure"
  },
  
  // Field Scan Jobs
  {
    id: "job-field-np-01",
    name: "North Permian Field Discovery",
    tenantId: "alpha-upstream",
    type: "field",
    scope: { fieldId: "field-permian-north" },
    status: "completed",
    foundCount: 45,
    lastRunAt: "2024-01-14T14:20:00Z",
    description: "Comprehensive field asset discovery for North Permian"
  },
  {
    id: "job-field-sp-01",
    name: "South Permian Field Discovery",
    tenantId: "alpha-upstream",
    type: "field",
    scope: { fieldId: "field-permian-south" },
    status: "completed",
    foundCount: 28,
    lastRunAt: "2024-01-14T16:45:00Z",
    description: "Field asset discovery for South Permian EOR operations"
  },
  {
    id: "job-field-ee-01",
    name: "Eagle Ford East Field Discovery",
    tenantId: "alpha-upstream",
    type: "field",
    scope: { fieldId: "field-eagle-east" },
    status: "pending",
    foundCount: 0,
    description: "Scheduled field discovery for Eagle Ford East gas operations"
  },
  
  // Pad-specific Discovery Jobs
  {
    id: "job-pad-np-01",
    name: "NP-01 Pad Asset Discovery",
    tenantId: "alpha-upstream",
    type: "pad",
    scope: { padId: "pad-np-01" },
    status: "completed",
    foundCount: 18,
    lastRunAt: "2024-01-15T06:30:00Z",
    description: "Detailed asset discovery for North Permian Pad 01"
  },
  {
    id: "job-pad-np-02",
    name: "NP-02 Pad Asset Discovery",
    tenantId: "alpha-upstream",
    type: "pad",
    scope: { padId: "pad-np-02" },
    status: "completed",
    foundCount: 14,
    lastRunAt: "2024-01-15T07:00:00Z",
    description: "Asset discovery for North Permian Pad 02 with gas lift"
  },
  {
    id: "job-pad-np-03",
    name: "NP-03 Pad Asset Discovery",
    tenantId: "alpha-upstream",
    type: "pad",
    scope: { padId: "pad-np-03" },
    status: "running",
    foundCount: 8,
    lastRunAt: "2024-01-15T09:45:00Z",
    description: "Active discovery for North Permian Pad 03 waterflood operations"
  },
  
  // Pipeline Segment Discovery Jobs
  {
    id: "job-pipeline-np-cp",
    name: "NP to Central Pipeline Discovery",
    tenantId: "alpha-upstream",
    type: "pipelineSegment",
    scope: { pipelineId: "asset-pl-np-cp-01" },
    status: "completed",
    foundCount: 5,
    lastRunAt: "2024-01-14T11:15:00Z",
    description: "Pipeline segment asset discovery for North Permian to Central"
  },
  {
    id: "job-pipeline-export",
    name: "Export Pipeline Discovery",
    tenantId: "alpha-upstream",
    type: "pipelineSegment",
    scope: { pipelineId: "asset-pl-cp-export" },
    status: "completed",
    foundCount: 8,
    lastRunAt: "2024-01-14T13:30:00Z",
    description: "Export pipeline infrastructure discovery"
  },
  {
    id: "job-pipeline-gas-01",
    name: "Eagle Ford Gas Pipeline Discovery",
    tenantId: "alpha-upstream",
    type: "pipelineSegment",
    scope: { pipelineId: "asset-pl-gas-01" },
    status: "pending",
    foundCount: 0,
    description: "Scheduled discovery for Eagle Ford gas gathering pipeline"
  }
];

// =============================================================================
// Discovery Agents
// =============================================================================

export const discoveryAgents: DiscoveryAgent[] = [
  // RTU Gateway Agents
  {
    id: "agent-rtu-gateway-np",
    name: "Wellpad RTU Gateway - North Permian",
    tenantId: "alpha-upstream",
    type: "rtu-gateway",
    protocols: ["modbus-tcp", "hart"],
    status: "active",
    assignedScopes: [
      { fieldId: "field-permian-north", padId: "pad-np-01" },
      { fieldId: "field-permian-north", padId: "pad-np-02" },
      { fieldId: "field-permian-north", padId: "pad-np-03" }
    ],
    lastRun: "2024-01-15T10:30:00Z",
    description: "Discovery agent for North Permian wellpad RTUs and field instruments"
  },
  {
    id: "agent-rtu-gateway-sp",
    name: "Wellpad RTU Gateway - South Permian",
    tenantId: "alpha-upstream",
    type: "rtu-gateway",
    protocols: ["modbus-tcp", "hart"],
    status: "active",
    assignedScopes: [
      { fieldId: "field-permian-south", padId: "pad-sp-01" },
      { fieldId: "field-permian-south", padId: "pad-sp-02" }
    ],
    lastRun: "2024-01-15T09:45:00Z",
    description: "Discovery agent for South Permian EOR wellpad operations"
  },
  {
    id: "agent-rtu-gateway-ee",
    name: "Wellpad RTU Gateway - Eagle Ford East",
    tenantId: "alpha-upstream",
    type: "rtu-gateway",
    protocols: ["modbus-tcp", "hart"],
    status: "inactive",
    assignedScopes: [
      { fieldId: "field-eagle-east", padId: "pad-ee-01" },
      { fieldId: "field-eagle-east", padId: "pad-ee-02" }
    ],
    lastRun: "2024-01-14T16:20:00Z",
    description: "Discovery agent for Eagle Ford East gas operations (currently offline)"
  },
  
  // OPC-UA Server Agents
  {
    id: "agent-opc-server-cp",
    name: "Platform OPC-UA Server - Central Processing",
    tenantId: "alpha-upstream",
    type: "opc-server",
    protocols: ["opc-ua"],
    status: "active",
    assignedScopes: [
      { fieldId: "field-permian-central", padId: "platform-cp-01" }
    ],
    lastRun: "2024-01-15T10:25:00Z",
    description: "OPC-UA discovery agent for Central Processing Platform"
  },
  {
    id: "agent-opc-server-ee",
    name: "Platform OPC-UA Server - Eagle Ford East",
    tenantId: "alpha-upstream",
    type: "opc-server",
    protocols: ["opc-ua"],
    status: "active",
    assignedScopes: [
      { fieldId: "field-eagle-east" }
    ],
    lastRun: "2024-01-15T10:15:00Z",
    description: "OPC-UA discovery agent for Eagle Ford East operations"
  },
  {
    id: "agent-opc-server-ew",
    name: "Platform OPC-UA Server - Eagle Ford West",
    tenantId: "alpha-upstream",
    type: "opc-server",
    protocols: ["opc-ua"],
    status: "error",
    assignedScopes: [
      { fieldId: "field-eagle-west", padId: "pad-ew-01" }
    ],
    lastRun: "2024-01-15T08:30:00Z",
    description: "OPC-UA discovery agent for Eagle Ford West (connection error)"
  },
  
  // SCADA Gateway Agents
  {
    id: "agent-scada-gateway-pipeline",
    name: "Pipeline SCADA Gateway",
    tenantId: "alpha-upstream",
    type: "scada-gateway",
    protocols: ["modbus-tcp", "mqtt"],
    status: "error",
    assignedScopes: [
      { pipelineId: "asset-pl-np-cp-01" },
      { pipelineId: "asset-pl-cp-export" },
      { pipelineId: "asset-pl-gas-01" }
    ],
    lastRun: "2024-01-15T08:15:00Z",
    description: "SCADA gateway for pipeline monitoring and control (communication issues)"
  },
  {
    id: "agent-scada-gateway-flowlines",
    name: "Flowline SCADA Gateway",
    tenantId: "alpha-upstream",
    type: "scada-gateway",
    protocols: ["modbus-tcp"],
    status: "active",
    assignedScopes: [
      { fieldId: "field-permian-north" },
      { fieldId: "field-permian-south" }
    ],
    lastRun: "2024-01-15T10:00:00Z",
    description: "SCADA gateway for flowline monitoring in Permian operations"
  },
  {
    id: "agent-scada-gateway-facilities",
    name: "Facilities SCADA Gateway",
    tenantId: "alpha-upstream",
    type: "scada-gateway",
    protocols: ["modbus-tcp", "opc-ua"],
    status: "active",
    assignedScopes: [
      { fieldId: "field-permian-central", padId: "platform-cp-01" }
    ],
    lastRun: "2024-01-15T10:20:00Z",
    description: "SCADA gateway for central processing facilities"
  }
];

// =============================================================================
// Stream Configurations
// =============================================================================

export const streamConfigs: StreamConfig[] = [
  {
    id: "stream-realtime-wellheads",
    name: "Realtime Wellhead Data",
    tenantId: "alpha-upstream",
    pollingInterval: 5000, // 5 seconds
    retention: "7d",
    profile: "high-frequency",
    assetTypes: ["type-wellhead", "type-xmas-tree"],
    description: "High-frequency data collection for wellhead pressures and flow rates"
  },
  {
    id: "stream-standard-process",
    name: "Standard Process Equipment",
    tenantId: "alpha-upstream",
    pollingInterval: 30000, // 30 seconds
    retention: "30d",
    profile: "standard",
    assetTypes: ["type-separator", "type-compressor", "type-pump"],
    description: "Standard polling for process equipment monitoring"
  },
  {
    id: "stream-slow-pipeline",
    name: "Pipeline Condition Monitoring",
    tenantId: "alpha-upstream",
    pollingInterval: 300000, // 5 minutes
    retention: "1y",
    profile: "low-frequency",
    assetTypes: ["type-flowline", "type-pipeline"],
    description: "Low-frequency monitoring for pipeline integrity and flow"
  },
  {
    id: "stream-esp-monitoring",
    name: "ESP Performance Monitoring",
    tenantId: "alpha-upstream",
    pollingInterval: 10000, // 10 seconds
    retention: "90d",
    profile: "high-frequency",
    assetTypes: ["type-esp"],
    description: "High-frequency ESP monitoring for performance optimization"
  }
];

// =============================================================================
// Lifecycle States
// =============================================================================

export const lifecycleStates: LifecycleState[] = [
  // Well Lifecycle States
  { id: "well-planned", name: "Planned", assetCategory: "well", order: 1, description: "Well location planned and permitted" },
  { id: "well-drilling", name: "Drilling", assetCategory: "well", order: 2, description: "Well drilling in progress" },
  { id: "well-completing", name: "Completing", assetCategory: "well", order: 3, description: "Well completion operations" },
  { id: "well-producing", name: "Producing", assetCategory: "well", order: 4, description: "Well in production" },
  { id: "well-shut-in", name: "Shut-in", assetCategory: "well", order: 5, description: "Well temporarily shut-in" },
  { id: "well-workover", name: "Workover", assetCategory: "well", order: 6, description: "Well workover operations" },
  { id: "well-pa", name: "P&A", assetCategory: "well", order: 7, description: "Well plugged and abandoned" },
  
  // Process Equipment Lifecycle States
  { id: "process-commissioning", name: "Commissioning", assetCategory: "process", order: 1, description: "Equipment commissioning and startup" },
  { id: "process-active", name: "Active", assetCategory: "process", order: 2, description: "Equipment in normal operation" },
  { id: "process-maintenance", name: "Under Maintenance", assetCategory: "process", order: 3, description: "Scheduled or unscheduled maintenance" },
  { id: "process-mothballed", name: "Mothballed", assetCategory: "process", order: 4, description: "Equipment preserved for future use" },
  { id: "process-decommissioned", name: "Decommissioned", assetCategory: "process", order: 5, description: "Equipment permanently removed from service" },
  
  // Pipeline Lifecycle States
  { id: "pipeline-design", name: "Design", assetCategory: "pipeline", order: 1, description: "Pipeline design and engineering" },
  { id: "pipeline-construction", name: "Construction", assetCategory: "pipeline", order: 2, description: "Pipeline construction in progress" },
  { id: "pipeline-testing", name: "Testing", assetCategory: "pipeline", order: 3, description: "Hydrostatic testing and commissioning" },
  { id: "pipeline-active", name: "Active", assetCategory: "pipeline", order: 4, description: "Pipeline in service" },
  { id: "pipeline-maintenance", name: "Maintenance", assetCategory: "pipeline", order: 5, description: "Pipeline maintenance or repair" },
  { id: "pipeline-abandoned", name: "Abandoned", assetCategory: "pipeline", order: 6, description: "Pipeline abandoned in place" }
];

// =============================================================================
// Saved Views
// =============================================================================

export const savedViews: SavedView[] = [
  {
    id: "view-high-risk-wells",
    name: "High-risk Wells",
    tenantId: "alpha-upstream",
    filters: {
      tenantId: "alpha-upstream",
      criticality: "High",
      hazardousAreaClass: "Zone 1"
    },
    description: "Wells with high criticality in hazardous areas",
    createdAt: "2024-01-10T09:00:00Z",
    updatedAt: "2024-01-10T09:00:00Z"
  },
  {
    id: "view-compressors-field-b",
    name: "Compressors in South Permian",
    tenantId: "alpha-upstream",
    filters: {
      tenantId: "alpha-upstream",
      fieldId: "field-permian-south",
      typeId: "type-compressor"
    },
    description: "All compressor equipment in South Permian field",
    createdAt: "2024-01-12T14:30:00Z",
    updatedAt: "2024-01-12T14:30:00Z"
  },
  {
    id: "view-maintenance-assets",
    name: "Assets Under Maintenance",
    tenantId: "alpha-upstream",
    filters: {
      tenantId: "alpha-upstream",
      status: "maintenance"
    },
    description: "All assets currently under maintenance",
    createdAt: "2024-01-14T11:15:00Z",
    updatedAt: "2024-01-15T08:45:00Z"
  },
  {
    id: "view-eagle-ford-producers",
    name: "Eagle Ford Producers",
    tenantId: "alpha-upstream",
    filters: {
      tenantId: "alpha-upstream",
      fieldId: "field-eagle-east"
    },
    description: "All producing assets in Eagle Ford East field",
    createdAt: "2024-01-13T16:20:00Z",
    updatedAt: "2024-01-13T16:20:00Z"
  }
];

// =============================================================================
// Candidate Assets (for Discovery Review)
// =============================================================================

export const candidateAssets: CandidateAsset[] = [
  {
    id: "candidate-001",
    discoveryJobId: "job-network-np-01",
    suggestedName: "NP-01 Unknown RTU",
    suggestedTypeId: "type-rtu",
    suggestedHierarchy: { basinId: "basin-permian", fieldId: "field-permian-north", padId: "pad-np-01" },
    confidence: 0.85,
    status: "pending",
    rawData: { "ip": "192.168.1.105", "protocol": "modbus-tcp", "deviceId": "RTU-105" }
  },
  {
    id: "candidate-002",
    discoveryJobId: "job-network-np-01",
    suggestedName: "NP-01 Flow Meter",
    suggestedTypeId: "type-flow-meter",
    suggestedHierarchy: { basinId: "basin-permian", fieldId: "field-permian-north", padId: "pad-np-01" },
    matchedExistingAssetId: "asset-fm-np-01-existing",
    confidence: 0.92,
    status: "pending",
    rawData: { "ip": "192.168.1.106", "protocol": "hart", "deviceTag": "FT-101" }
  },
  {
    id: "candidate-003",
    discoveryJobId: "job-field-np-01",
    suggestedName: "NP-01-09H Wellhead",
    suggestedTypeId: "type-wellhead",
    suggestedHierarchy: { basinId: "basin-permian", fieldId: "field-permian-north", padId: "pad-np-01" },
    confidence: 0.78,
    status: "approved",
    rawData: { "wellName": "NP-01-09H", "api": "42-135-12345", "status": "producing" }
  }
];

// =============================================================================
// Asset Imports
// =============================================================================

export const assetImports: AssetImport[] = [
  {
    id: "import-wells-excel-001",
    name: "Wells from Excel Import",
    tenantId: "alpha-upstream",
    status: "completed",
    sourceType: "Excel Spreadsheet",
    recordCount: 156,
    importedCount: 142,
    createdAt: "2024-01-10T08:00:00Z",
    completedAt: "2024-01-10T08:45:00Z",
    errors: [
      "Row 23: Invalid API number format",
      "Row 67: Missing field assignment",
      "Row 89: Duplicate well name"
    ]
  },
  {
    id: "import-pipeline-register-001",
    name: "Pipeline Register Import",
    tenantId: "alpha-upstream",
    status: "completed",
    sourceType: "Pipeline Registry Database",
    recordCount: 45,
    importedCount: 45,
    createdAt: "2024-01-12T10:30:00Z",
    completedAt: "2024-01-12T11:15:00Z"
  },
  {
    id: "import-facilities-csv-001",
    name: "Facilities CSV Import",
    tenantId: "alpha-upstream",
    status: "preview",
    sourceType: "CSV File",
    recordCount: 78,
    importedCount: 0,
    createdAt: "2024-01-15T09:00:00Z",
    errors: [
      "Column mapping required for 'Equipment Type'",
      "Date format validation needed for 'Install Date'"
    ]
  }
];

// =============================================================================
// Topology Data
// =============================================================================

export const topologyNodes: TopologyNode[] = [
  // Wells as nodes
  { id: "node-well-np-01-01", assetId: "well-np-01-01", name: "NP-01-01H", nodeType: "well" },
  { id: "node-well-np-01-02", assetId: "well-np-01-02", name: "NP-01-02H", nodeType: "well" },
  
  // Facilities as nodes
  { id: "node-sep-np-01", assetId: "asset-sep-np-01", name: "NP-01 Separator", nodeType: "separator" },
  { id: "node-sep-cp-01", assetId: "asset-sep-cp-01", name: "Central Separator", nodeType: "separator" },
  { id: "node-comp-cp-01", assetId: "asset-comp-cp-01", name: "Central Compressor", nodeType: "compressor" },
  
  // Export points
  { id: "node-export-terminal", assetId: "export-terminal-01", name: "Export Terminal", nodeType: "terminal" },
  { id: "node-gas-plant", assetId: "gas-plant-01", name: "Gas Plant", nodeType: "plant" }
];

export const topologyEdges: TopologyEdge[] = [
  // Well to separator connections
  { id: "edge-001", fromNodeId: "node-well-np-01-01", toNodeId: "node-sep-np-01", connectionType: "flowline", assetId: "asset-fl-np-01-01" },
  { id: "edge-002", fromNodeId: "node-well-np-01-02", toNodeId: "node-sep-np-01", connectionType: "flowline", assetId: "asset-fl-np-01-02" },
  
  // Separator to central processing
  { id: "edge-003", fromNodeId: "node-sep-np-01", toNodeId: "node-sep-cp-01", connectionType: "pipeline", assetId: "asset-pl-np-cp-01" },
  
  // Central processing to export
  { id: "edge-004", fromNodeId: "node-sep-cp-01", toNodeId: "node-export-terminal", connectionType: "pipeline", assetId: "asset-pl-cp-export" },
  
  // Gas compression
  { id: "edge-005", fromNodeId: "node-sep-cp-01", toNodeId: "node-comp-cp-01", connectionType: "pipeline" },
  { id: "edge-006", fromNodeId: "node-comp-cp-01", toNodeId: "node-gas-plant", connectionType: "pipeline", assetId: "asset-pl-gas-01" }
];

// =============================================================================
// Export All Data
// =============================================================================

export const upstreamMockData = {
  tenant: upstreamTenant,
  tenants: upstreamTenants,
  basins,
  fields,
  pads,
  wells,
  facilities,
  assetTypes: upstreamAssetTypes,
  propertySets: upstreamPropertySets,
  assets: upstreamAssets,
  linearAssets,
  connectionEndpoints,
  dataPoints,
  discoveryJobs: upstreamDiscoveryJobs,
  discoveryAgents,
  streamConfigs,
  lifecycleStates,
  savedViews,
  candidateAssets,
  assetImports,
  topologyNodes,
  topologyEdges
};