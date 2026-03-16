/**
 * Comprehensive APM Upstream Mock Data
 * 
 * This module provides enhanced mock data for APM (Asset Performance Management)
 * features including telemetry, reliability metrics, criticality scores, FMEA data,
 * spare parts inventory, benchmark data, and downtime events.
 */

import { TelemetryDataPoint, UpstreamTelemetry, UpstreamAlert } from "@/types/navigation";

// =============================================================================
// Enhanced Telemetry Data Generation
// =============================================================================

/**
 * Generate 24-hour realistic telemetry data with proper time intervals
 */
const generate24HourTelemetryData = (
  baseValue: number,
  variance: number,
  unit: string,
  status: "Normal" | "Warning" | "Critical" = "Normal",
  intervalMinutes: number = 5
): TelemetryDataPoint[] => {
  const data: TelemetryDataPoint[] = [];
  const now = new Date();
  const pointsCount = (24 * 60) / intervalMinutes; // 288 points for 5-minute intervals
  
  for (let i = pointsCount - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * intervalMinutes * 60 * 1000));
    
    // Add realistic daily patterns and noise
    const hourOfDay = timestamp.getHours();
    const dailyPattern = Math.sin((hourOfDay / 24) * 2 * Math.PI) * 0.1; // 10% daily variation
    const noise = (Math.random() - 0.5) * 2 * variance * 0.1; // Random noise
    const trend = status === "Critical" ? -0.02 * i : status === "Warning" ? -0.005 * i : 0; // Degradation trend
    
    const value = baseValue + (baseValue * dailyPattern) + noise + trend;
    
    data.push({
      value: Math.max(0, Number(value.toFixed(2))),
      timestamp: timestamp.toISOString(),
      unit,
      status
    });
  }
  
  return data;
};

// =============================================================================
// Enhanced Upstream Telemetry (24-hour data for all 5 assets)
// =============================================================================

export const enhancedUpstreamTelemetry: UpstreamTelemetry = {
  "WH-01": {
    // Wellhead parameters
    tubingPressure: generate24HourTelemetryData(2850, 50, "psi", "Normal"),
    casingPressure: generate24HourTelemetryData(3200, 75, "psi", "Normal"),
    temperature: generate24HourTelemetryData(185, 10, "°F", "Normal"),
    flowRate: generate24HourTelemetryData(1250, 100, "bbl/day", "Normal"),
    chokePosition: generate24HourTelemetryData(65, 5, "%", "Normal"),
    waterCut: generate24HourTelemetryData(15, 3, "%", "Normal"),
    gasOilRatio: generate24HourTelemetryData(850, 50, "scf/bbl", "Normal"),
  },
  "ESP-07": {
    // ESP Pump parameters
    motorCurrent: generate24HourTelemetryData(45.2, 3, "A", "Normal"),
    intakePressure: generate24HourTelemetryData(1850, 75, "psi", "Normal"),
    dischargePressure: generate24HourTelemetryData(3200, 150, "psi", "Normal"),
    vibration: generate24HourTelemetryData(2.1, 0.3, "mm/s", "Normal"),
    frequency: generate24HourTelemetryData(55, 2, "Hz", "Normal"),
    motorTemp: generate24HourTelemetryData(165, 8, "°F", "Normal"),
    pumpEfficiency: generate24HourTelemetryData(78, 3, "%", "Normal"),
  },
  "GC-11": {
    // Gas Compressor parameters
    suctionPressure: generate24HourTelemetryData(850, 40, "psi", "Normal"),
    dischargePressure: generate24HourTelemetryData(1450, 80, "psi", "Warning"),
    gasTemp: generate24HourTelemetryData(165, 15, "°F", "Normal"),
    vibration: generate24HourTelemetryData(4.8, 0.8, "mm/s", "Warning"),
    compressionRatio: generate24HourTelemetryData(1.7, 0.1, "ratio", "Normal"),
    powerConsumption: generate24HourTelemetryData(850, 50, "kW", "Normal"),
    efficiency: generate24HourTelemetryData(82, 2, "%", "Normal"),
  },
  "P-21": {
    // Crude Transfer Pump parameters
    flowRate: generate24HourTelemetryData(850, 60, "bbl/hr", "Normal"),
    suctionPressure: generate24HourTelemetryData(120, 15, "psi", "Normal"),
    dischargePressure: generate24HourTelemetryData(450, 30, "psi", "Normal"),
    motorCurrent: generate24HourTelemetryData(28.5, 2, "A", "Normal"),
    vibration: generate24HourTelemetryData(1.8, 0.2, "mm/s", "Normal"),
    temperature: generate24HourTelemetryData(140, 8, "°F", "Normal"),
    efficiency: generate24HourTelemetryData(75, 3, "%", "Normal"),
  },
  "KO-03": {
    // Flare KO Drum parameters
    pressure: generate24HourTelemetryData(25, 5, "psi", "Critical"),
    temperature: generate24HourTelemetryData(95, 8, "°F", "Critical"),
    level: generate24HourTelemetryData(65, 10, "%", "Critical"),
    flowRate: generate24HourTelemetryData(200, 50, "scf/min", "Critical"),
    liquidLevel: generate24HourTelemetryData(45, 8, "%", "Critical"),
    reliefValvePosition: generate24HourTelemetryData(15, 3, "%", "Critical"),
  },
};

// =============================================================================
// Reliability Metrics (MTBF, MTTR, Availability)
// =============================================================================

export interface ReliabilityMetrics {
  assetId: string;
  assetName: string;
  mtbfHours: number;
  mttrHours: number;
  mttfHours: number;
  availabilityPercent: number;
  failureCount30d: number;
  downtimeHours30d: number;
  lastFailureDate?: string;
  nextMaintenanceDue: string;
  reliabilityTrend: "improving" | "stable" | "degrading";
  targetMTBF: number;
  targetMTTR: number;
  targetAvailability: number;
}

export const reliabilityMetrics: ReliabilityMetrics[] = [
  {
    assetId: "WH-01",
    assetName: "Wellhead WH-01",
    mtbfHours: 2160, // 90 days
    mttrHours: 8,
    mttfHours: 2160,
    availabilityPercent: 99.6,
    failureCount30d: 0,
    downtimeHours30d: 2,
    nextMaintenanceDue: "2024-02-15T08:00:00Z",
    reliabilityTrend: "stable",
    targetMTBF: 2400,
    targetMTTR: 6,
    targetAvailability: 99.5,
  },
  {
    assetId: "ESP-07",
    assetName: "ESP Pump ESP-07",
    mtbfHours: 1440, // 60 days
    mttrHours: 12,
    mttfHours: 1440,
    availabilityPercent: 99.2,
    failureCount30d: 1,
    downtimeHours30d: 12,
    lastFailureDate: "2024-01-05T14:30:00Z",
    nextMaintenanceDue: "2024-02-01T10:00:00Z",
    reliabilityTrend: "degrading",
    targetMTBF: 1800,
    targetMTTR: 8,
    targetAvailability: 99.5,
  },
  {
    assetId: "GC-11",
    assetName: "Gas Compressor GC-11",
    mtbfHours: 720, // 30 days
    mttrHours: 16,
    mttfHours: 720,
    availabilityPercent: 97.8,
    failureCount30d: 2,
    downtimeHours30d: 32,
    lastFailureDate: "2024-01-10T09:15:00Z",
    nextMaintenanceDue: "2024-01-25T12:00:00Z",
    reliabilityTrend: "degrading",
    targetMTBF: 1200,
    targetMTTR: 12,
    targetAvailability: 98.5,
  },
  {
    assetId: "P-21",
    assetName: "Crude Transfer Pump P-21",
    mtbfHours: 1800, // 75 days
    mttrHours: 6,
    mttfHours: 1800,
    availabilityPercent: 99.7,
    failureCount30d: 0,
    downtimeHours30d: 4,
    nextMaintenanceDue: "2024-02-20T14:00:00Z",
    reliabilityTrend: "improving",
    targetMTBF: 1800,
    targetMTTR: 6,
    targetAvailability: 99.5,
  },
  {
    assetId: "KO-03",
    assetName: "Flare KO Drum KO-03",
    mtbfHours: 360, // 15 days
    mttrHours: 24,
    mttfHours: 360,
    availabilityPercent: 93.3,
    failureCount30d: 3,
    downtimeHours30d: 48,
    lastFailureDate: "2024-01-12T16:45:00Z",
    nextMaintenanceDue: "2024-01-20T08:00:00Z",
    reliabilityTrend: "degrading",
    targetMTBF: 720,
    targetMTTR: 16,
    targetAvailability: 97.0,
  },
];

// =============================================================================
// Criticality Scores (Safety, Production, Environmental Impact)
// =============================================================================

export interface CriticalityScore {
  assetId: string;
  assetName: string;
  safetyImpact: number; // 1-5 scale
  productionImpact: number; // 1-5 scale
  environmentalImpact: number; // 1-5 scale
  detectability: number; // 1-5 scale (lower is worse)
  overallScore: number; // Calculated composite
  criticalityTier: "A" | "B" | "C"; // A=Critical, B=Important, C=Standard
  rationale: string;
  lastReviewDate: string;
  nextReviewDue: string;
}

export const criticalityScores: CriticalityScore[] = [
  {
    assetId: "WH-01",
    assetName: "Wellhead WH-01",
    safetyImpact: 5, // High pressure system
    productionImpact: 5, // Direct production impact
    environmentalImpact: 4, // Potential hydrocarbon release
    detectability: 3, // Moderate detection capability
    overallScore: 85, // (5+5+4) * 3 * 2
    criticalityTier: "A",
    rationale: "Primary production wellhead with high pressure hydrocarbons. Failure could result in production loss, safety hazard, and environmental release.",
    lastReviewDate: "2024-01-01T00:00:00Z",
    nextReviewDue: "2024-07-01T00:00:00Z",
  },
  {
    assetId: "ESP-07",
    assetName: "ESP Pump ESP-07",
    safetyImpact: 3, // Electrical hazard
    productionImpact: 5, // Critical for production
    environmentalImpact: 2, // Limited environmental impact
    detectability: 4, // Good monitoring available
    overallScore: 60, // (3+5+2) * 4 * 1.5
    criticalityTier: "A",
    rationale: "Critical artificial lift system. Failure results in immediate production loss but limited safety/environmental impact due to downhole location.",
    lastReviewDate: "2024-01-01T00:00:00Z",
    nextReviewDue: "2024-07-01T00:00:00Z",
  },
  {
    assetId: "GC-11",
    assetName: "Gas Compressor GC-11",
    safetyImpact: 4, // High pressure gas system
    productionImpact: 4, // Significant production impact
    environmentalImpact: 3, // Gas release potential
    detectability: 3, // Moderate detection
    overallScore: 66, // (4+4+3) * 3 * 2
    criticalityTier: "A",
    rationale: "High pressure gas compression system. Failure affects gas processing capacity and poses safety risks from high pressure gas release.",
    lastReviewDate: "2024-01-01T00:00:00Z",
    nextReviewDue: "2024-07-01T00:00:00Z",
  },
  {
    assetId: "P-21",
    assetName: "Crude Transfer Pump P-21",
    safetyImpact: 2, // Lower pressure system
    productionImpact: 3, // Moderate production impact
    environmentalImpact: 3, // Crude oil spill potential
    detectability: 4, // Good monitoring
    overallScore: 32, // (2+3+3) * 4 * 1
    criticalityTier: "B",
    rationale: "Transfer pump with backup available. Moderate production impact but environmental spill risk requires attention.",
    lastReviewDate: "2024-01-01T00:00:00Z",
    nextReviewDue: "2024-07-01T00:00:00Z",
  },
  {
    assetId: "KO-03",
    assetName: "Flare KO Drum KO-03",
    safetyImpact: 5, // Safety critical system
    productionImpact: 2, // Limited production impact
    environmentalImpact: 4, // Flare system environmental impact
    detectability: 2, // Poor detection capability
    overallScore: 88, // (5+2+4) * 2 * 4
    criticalityTier: "A",
    rationale: "Safety critical flare system. Failure could compromise emergency pressure relief capability, creating significant safety hazard.",
    lastReviewDate: "2024-01-01T00:00:00Z",
    nextReviewDue: "2024-07-01T00:00:00Z",
  },
];

// =============================================================================
// FMEA Library Data (Failure Modes, Causes, RPN Scores by Asset Type)
// =============================================================================

export interface FMEAEntry {
  id: string;
  assetType: string;
  assetTypeDescription: string;
  failureMode: string;
  effect: string;
  cause: string;
  detectionMethod: string;
  severity: number; // 1-10 scale
  occurrence: number; // 1-10 scale
  detection: number; // 1-10 scale
  rpn: number; // Risk Priority Number (S × O × D)
  recommendedActions: string[];
  currentControls: string[];
}

export const fmeaLibrary: FMEAEntry[] = [
  // Wellhead FMEA
  {
    id: "fmea-wh-001",
    assetType: "wellhead",
    assetTypeDescription: "Wellhead Assembly",
    failureMode: "Tubing Head Pressure Loss",
    effect: "Production loss, potential well control issues",
    cause: "Tubing leak, packer failure, downhole equipment failure",
    detectionMethod: "Pressure monitoring, flow rate monitoring",
    severity: 8,
    occurrence: 3,
    detection: 4,
    rpn: 96,
    recommendedActions: [
      "Implement continuous pressure monitoring",
      "Regular tubing integrity testing",
      "Packer performance monitoring"
    ],
    currentControls: [
      "Daily pressure readings",
      "Monthly well tests",
      "Annual tubing inspection"
    ]
  },
  {
    id: "fmea-wh-002",
    assetType: "wellhead",
    assetTypeDescription: "Wellhead Assembly",
    failureMode: "Christmas Tree Valve Failure",
    effect: "Loss of well control, safety hazard, production loss",
    cause: "Valve seat wear, actuator failure, corrosion",
    detectionMethod: "Valve position monitoring, pressure testing",
    severity: 9,
    occurrence: 2,
    detection: 3,
    rpn: 54,
    recommendedActions: [
      "Implement valve position monitoring",
      "Regular valve testing program",
      "Corrosion monitoring and mitigation"
    ],
    currentControls: [
      "Monthly valve testing",
      "Quarterly actuator inspection",
      "Annual valve overhaul"
    ]
  },
  
  // ESP Pump FMEA
  {
    id: "fmea-esp-001",
    assetType: "esp-pump",
    assetTypeDescription: "Electric Submersible Pump",
    failureMode: "Motor Failure",
    effect: "Complete production loss, costly workover required",
    cause: "Bearing failure, winding insulation breakdown, overheating",
    detectionMethod: "Motor current monitoring, vibration analysis, temperature monitoring",
    severity: 9,
    occurrence: 4,
    detection: 3,
    rpn: 108,
    recommendedActions: [
      "Continuous motor current monitoring",
      "Vibration analysis program",
      "Temperature monitoring system"
    ],
    currentControls: [
      "Daily motor current readings",
      "Weekly vibration checks",
      "Monthly temperature monitoring"
    ]
  },
  {
    id: "fmea-esp-002",
    assetType: "esp-pump",
    assetTypeDescription: "Electric Submersible Pump",
    failureMode: "Pump Wear",
    effect: "Reduced production, decreased efficiency",
    cause: "Sand production, cavitation, impeller wear",
    detectionMethod: "Performance monitoring, pressure differential analysis",
    severity: 6,
    occurrence: 5,
    detection: 4,
    rpn: 120,
    recommendedActions: [
      "Sand monitoring program",
      "Pump performance trending",
      "Cavitation detection system"
    ],
    currentControls: [
      "Monthly performance tests",
      "Quarterly sand monitoring",
      "Semi-annual pump curves"
    ]
  },
  
  // Gas Compressor FMEA
  {
    id: "fmea-gc-001",
    assetType: "gas-compressor",
    assetTypeDescription: "Gas Compressor",
    failureMode: "Bearing Failure",
    effect: "Compressor shutdown, gas processing interruption",
    cause: "Lubrication failure, contamination, wear",
    detectionMethod: "Vibration monitoring, oil analysis, temperature monitoring",
    severity: 7,
    occurrence: 3,
    detection: 2,
    rpn: 42,
    recommendedActions: [
      "Continuous vibration monitoring",
      "Regular oil analysis program",
      "Bearing temperature monitoring"
    ],
    currentControls: [
      "Weekly vibration checks",
      "Monthly oil analysis",
      "Daily temperature readings"
    ]
  },
  {
    id: "fmea-gc-002",
    assetType: "gas-compressor",
    assetTypeDescription: "Gas Compressor",
    failureMode: "Valve Failure",
    effect: "Reduced compression efficiency, potential damage",
    cause: "Valve seat wear, spring failure, contamination",
    detectionMethod: "Performance monitoring, pressure analysis",
    severity: 6,
    occurrence: 4,
    detection: 5,
    rpn: 120,
    recommendedActions: [
      "Valve performance monitoring",
      "Regular valve inspection",
      "Gas filtration improvement"
    ],
    currentControls: [
      "Monthly performance tests",
      "Quarterly valve inspection",
      "Annual valve overhaul"
    ]
  },
  
  // Crude Pump FMEA
  {
    id: "fmea-cp-001",
    assetType: "crude-pump",
    assetTypeDescription: "Crude Transfer Pump",
    failureMode: "Seal Failure",
    effect: "Crude oil leak, environmental hazard, pump shutdown",
    cause: "Seal wear, contamination, misalignment",
    detectionMethod: "Leak detection, pressure monitoring",
    severity: 8,
    occurrence: 3,
    detection: 3,
    rpn: 72,
    recommendedActions: [
      "Seal condition monitoring",
      "Alignment verification program",
      "Contamination control measures"
    ],
    currentControls: [
      "Daily leak inspections",
      "Monthly alignment checks",
      "Quarterly seal inspection"
    ]
  },
  
  // Flare KO Drum FMEA
  {
    id: "fmea-ko-001",
    assetType: "flare-ko",
    assetTypeDescription: "Flare Knockout Drum",
    failureMode: "Level Control Failure",
    effect: "Liquid carryover to flare, safety hazard, environmental impact",
    cause: "Level transmitter failure, control valve failure, instrumentation error",
    detectionMethod: "Level monitoring, flow monitoring, visual inspection",
    severity: 9,
    occurrence: 2,
    detection: 4,
    rpn: 72,
    recommendedActions: [
      "Redundant level measurement",
      "Regular instrument calibration",
      "High level alarm system"
    ],
    currentControls: [
      "Daily level readings",
      "Monthly instrument checks",
      "Quarterly calibration"
    ]
  },
];

// =============================================================================
// Spare Parts Inventory (Compatibility Mappings and Stock Levels)
// =============================================================================

export interface SparePart {
  id: string;
  partNumber: string;
  description: string;
  compatibleAssetTypes: string[];
  compatibleAssets: string[];
  onHandQuantity: number;
  reorderPoint: number;
  maxStock: number;
  leadTimeDays: number;
  unitCost: number;
  supplier: string;
  lastOrderDate?: string;
  nextOrderDue?: string;
  criticalityLevel: "Critical" | "Important" | "Standard";
  storageLocation: string;
  condition: "New" | "Refurbished" | "Used";
}

export const sparePartsInventory: SparePart[] = [
  // Wellhead Spare Parts
  {
    id: "sp-wh-001",
    partNumber: "WH-VALVE-001",
    description: "Master Gate Valve 3-1/16\" 5000 PSI",
    compatibleAssetTypes: ["wellhead"],
    compatibleAssets: ["WH-01"],
    onHandQuantity: 2,
    reorderPoint: 1,
    maxStock: 3,
    leadTimeDays: 45,
    unitCost: 15000,
    supplier: "Cameron International",
    lastOrderDate: "2023-11-15T00:00:00Z",
    criticalityLevel: "Critical",
    storageLocation: "Warehouse A-1",
    condition: "New",
  },
  {
    id: "sp-wh-002",
    partNumber: "WH-CHOKE-001",
    description: "Adjustable Choke 2\" 5000 PSI",
    compatibleAssetTypes: ["wellhead"],
    compatibleAssets: ["WH-01"],
    onHandQuantity: 1,
    reorderPoint: 1,
    maxStock: 2,
    leadTimeDays: 30,
    unitCost: 8500,
    supplier: "Schlumberger",
    lastOrderDate: "2023-12-01T00:00:00Z",
    criticalityLevel: "Important",
    storageLocation: "Warehouse A-2",
    condition: "New",
  },
  
  // ESP Pump Spare Parts
  {
    id: "sp-esp-001",
    partNumber: "ESP-MOTOR-450",
    description: "ESP Motor 450 Series 75 HP",
    compatibleAssetTypes: ["esp-pump"],
    compatibleAssets: ["ESP-07"],
    onHandQuantity: 0,
    reorderPoint: 1,
    maxStock: 2,
    leadTimeDays: 90,
    unitCost: 45000,
    supplier: "Baker Hughes",
    nextOrderDue: "2024-01-25T00:00:00Z",
    criticalityLevel: "Critical",
    storageLocation: "Warehouse B-1",
    condition: "New",
  },
  {
    id: "sp-esp-002",
    partNumber: "ESP-PUMP-450",
    description: "ESP Pump 450 Series Centrifugal",
    compatibleAssetTypes: ["esp-pump"],
    compatibleAssets: ["ESP-07"],
    onHandQuantity: 1,
    reorderPoint: 1,
    maxStock: 2,
    leadTimeDays: 75,
    unitCost: 35000,
    supplier: "Baker Hughes",
    lastOrderDate: "2023-10-20T00:00:00Z",
    criticalityLevel: "Critical",
    storageLocation: "Warehouse B-1",
    condition: "Refurbished",
  },
  {
    id: "sp-esp-003",
    partNumber: "ESP-CABLE-450",
    description: "ESP Power Cable 450 Series 1000ft",
    compatibleAssetTypes: ["esp-pump"],
    compatibleAssets: ["ESP-07"],
    onHandQuantity: 2,
    reorderPoint: 1,
    maxStock: 3,
    leadTimeDays: 21,
    unitCost: 12000,
    supplier: "Kerite",
    lastOrderDate: "2023-12-10T00:00:00Z",
    criticalityLevel: "Important",
    storageLocation: "Warehouse B-2",
    condition: "New",
  },
  
  // Gas Compressor Spare Parts
  {
    id: "sp-gc-001",
    partNumber: "GC-BEARING-001",
    description: "Compressor Bearing Set - Main Shaft",
    compatibleAssetTypes: ["gas-compressor"],
    compatibleAssets: ["GC-11"],
    onHandQuantity: 1,
    reorderPoint: 1,
    maxStock: 2,
    leadTimeDays: 60,
    unitCost: 8500,
    supplier: "Ariel Corporation",
    lastOrderDate: "2023-09-15T00:00:00Z",
    criticalityLevel: "Critical",
    storageLocation: "Warehouse C-1",
    condition: "New",
  },
  {
    id: "sp-gc-002",
    partNumber: "GC-VALVE-SET",
    description: "Compressor Valve Set - Complete",
    compatibleAssetTypes: ["gas-compressor"],
    compatibleAssets: ["GC-11"],
    onHandQuantity: 2,
    reorderPoint: 2,
    maxStock: 4,
    leadTimeDays: 45,
    unitCost: 12000,
    supplier: "Ariel Corporation",
    lastOrderDate: "2023-11-30T00:00:00Z",
    criticalityLevel: "Important",
    storageLocation: "Warehouse C-1",
    condition: "New",
  },
  
  // Crude Pump Spare Parts
  {
    id: "sp-cp-001",
    partNumber: "CP-SEAL-001",
    description: "Mechanical Seal Assembly",
    compatibleAssetTypes: ["crude-pump"],
    compatibleAssets: ["P-21"],
    onHandQuantity: 3,
    reorderPoint: 2,
    maxStock: 5,
    leadTimeDays: 14,
    unitCost: 2500,
    supplier: "John Crane",
    lastOrderDate: "2024-01-05T00:00:00Z",
    criticalityLevel: "Important",
    storageLocation: "Warehouse D-1",
    condition: "New",
  },
  {
    id: "sp-cp-002",
    partNumber: "CP-IMPELLER-001",
    description: "Pump Impeller - Cast Iron",
    compatibleAssetTypes: ["crude-pump"],
    compatibleAssets: ["P-21"],
    onHandQuantity: 1,
    reorderPoint: 1,
    maxStock: 2,
    leadTimeDays: 30,
    unitCost: 5500,
    supplier: "Flowserve",
    lastOrderDate: "2023-08-20T00:00:00Z",
    criticalityLevel: "Critical",
    storageLocation: "Warehouse D-1",
    condition: "New",
  },
  
  // Flare KO Drum Spare Parts
  {
    id: "sp-ko-001",
    partNumber: "KO-LT-001",
    description: "Level Transmitter 4-20mA",
    compatibleAssetTypes: ["flare-ko"],
    compatibleAssets: ["KO-03"],
    onHandQuantity: 2,
    reorderPoint: 1,
    maxStock: 3,
    leadTimeDays: 21,
    unitCost: 3500,
    supplier: "Emerson",
    lastOrderDate: "2023-12-15T00:00:00Z",
    criticalityLevel: "Critical",
    storageLocation: "Warehouse E-1",
    condition: "New",
  },
  {
    id: "sp-ko-002",
    partNumber: "KO-CV-001",
    description: "Control Valve 6\" 150# RF",
    compatibleAssetTypes: ["flare-ko"],
    compatibleAssets: ["KO-03"],
    onHandQuantity: 1,
    reorderPoint: 1,
    maxStock: 2,
    leadTimeDays: 35,
    unitCost: 7500,
    supplier: "Fisher Controls",
    lastOrderDate: "2023-10-10T00:00:00Z",
    criticalityLevel: "Important",
    storageLocation: "Warehouse E-1",
    condition: "New",
  },
];

// =============================================================================
// Benchmark Data (Industry Comparisons and Targets)
// =============================================================================

export interface BenchmarkData {
  assetType: string;
  assetTypeDescription: string;
  metricName: string;
  unit: string;
  currentValue: number;
  target: number;
  bestObserved: number;
  worstObserved: number;
  industryAverage: number;
  percentileRank: number; // 0-100, where 100 is best in class
  benchmarkSource: string;
  lastUpdated: string;
  trend: "improving" | "stable" | "degrading";
}

export const benchmarkData: BenchmarkData[] = [
  // Wellhead Benchmarks
  {
    assetType: "wellhead",
    assetTypeDescription: "Wellhead Assembly",
    metricName: "Availability",
    unit: "%",
    currentValue: 99.6,
    target: 99.5,
    bestObserved: 99.9,
    worstObserved: 95.2,
    industryAverage: 98.8,
    percentileRank: 85,
    benchmarkSource: "SPE Upstream Reliability Database",
    lastUpdated: "2024-01-01T00:00:00Z",
    trend: "stable",
  },
  {
    assetType: "wellhead",
    assetTypeDescription: "Wellhead Assembly",
    metricName: "MTBF",
    unit: "hours",
    currentValue: 2160,
    target: 2400,
    bestObserved: 4380,
    worstObserved: 720,
    industryAverage: 1800,
    percentileRank: 70,
    benchmarkSource: "SPE Upstream Reliability Database",
    lastUpdated: "2024-01-01T00:00:00Z",
    trend: "stable",
  },
  
  // ESP Pump Benchmarks
  {
    assetType: "esp-pump",
    assetTypeDescription: "Electric Submersible Pump",
    metricName: "Availability",
    unit: "%",
    currentValue: 99.2,
    target: 99.5,
    bestObserved: 99.8,
    worstObserved: 92.5,
    industryAverage: 97.5,
    percentileRank: 75,
    benchmarkSource: "Artificial Lift Performance Study",
    lastUpdated: "2024-01-01T00:00:00Z",
    trend: "degrading",
  },
  {
    assetType: "esp-pump",
    assetTypeDescription: "Electric Submersible Pump",
    metricName: "Run Life",
    unit: "days",
    currentValue: 60,
    target: 75,
    bestObserved: 180,
    worstObserved: 15,
    industryAverage: 65,
    percentileRank: 45,
    benchmarkSource: "Artificial Lift Performance Study",
    lastUpdated: "2024-01-01T00:00:00Z",
    trend: "degrading",
  },
  {
    assetType: "esp-pump",
    assetTypeDescription: "Electric Submersible Pump",
    metricName: "Efficiency",
    unit: "%",
    currentValue: 78,
    target: 80,
    bestObserved: 85,
    worstObserved: 65,
    industryAverage: 75,
    percentileRank: 65,
    benchmarkSource: "Pump Performance Database",
    lastUpdated: "2024-01-01T00:00:00Z",
    trend: "stable",
  },
  
  // Gas Compressor Benchmarks
  {
    assetType: "gas-compressor",
    assetTypeDescription: "Gas Compressor",
    metricName: "Availability",
    unit: "%",
    currentValue: 97.8,
    target: 98.5,
    bestObserved: 99.5,
    worstObserved: 90.2,
    industryAverage: 96.8,
    percentileRank: 60,
    benchmarkSource: "Gas Processing Reliability Study",
    lastUpdated: "2024-01-01T00:00:00Z",
    trend: "degrading",
  },
  {
    assetType: "gas-compressor",
    assetTypeDescription: "Gas Compressor",
    metricName: "Efficiency",
    unit: "%",
    currentValue: 82,
    target: 85,
    bestObserved: 88,
    worstObserved: 75,
    industryAverage: 81,
    percentileRank: 55,
    benchmarkSource: "Compressor Performance Database",
    lastUpdated: "2024-01-01T00:00:00Z",
    trend: "stable",
  },
  
  // Crude Pump Benchmarks
  {
    assetType: "crude-pump",
    assetTypeDescription: "Crude Transfer Pump",
    metricName: "Availability",
    unit: "%",
    currentValue: 99.7,
    target: 99.5,
    bestObserved: 99.9,
    worstObserved: 96.8,
    industryAverage: 98.9,
    percentileRank: 90,
    benchmarkSource: "Pump Reliability Database",
    lastUpdated: "2024-01-01T00:00:00Z",
    trend: "improving",
  },
  {
    assetType: "crude-pump",
    assetTypeDescription: "Crude Transfer Pump",
    metricName: "MTTR",
    unit: "hours",
    currentValue: 6,
    target: 6,
    bestObserved: 3,
    worstObserved: 24,
    industryAverage: 8,
    percentileRank: 80,
    benchmarkSource: "Pump Reliability Database",
    lastUpdated: "2024-01-01T00:00:00Z",
    trend: "stable",
  },
  
  // Flare KO Drum Benchmarks
  {
    assetType: "flare-ko",
    assetTypeDescription: "Flare Knockout Drum",
    metricName: "Availability",
    unit: "%",
    currentValue: 93.3,
    target: 97.0,
    bestObserved: 99.2,
    worstObserved: 85.5,
    industryAverage: 95.8,
    percentileRank: 25,
    benchmarkSource: "Safety Systems Reliability Study",
    lastUpdated: "2024-01-01T00:00:00Z",
    trend: "degrading",
  },
];

// =============================================================================
// Downtime Events (Planned/Unplanned with Reason Codes)
// =============================================================================

export interface DowntimeEvent {
  id: string;
  assetId: string;
  assetName: string;
  eventType: "planned" | "unplanned";
  startTime: string;
  endTime?: string;
  durationHours: number;
  reasonCode: string;
  reasonDescription: string;
  category: "maintenance" | "failure" | "inspection" | "modification" | "external";
  impact: "production" | "safety" | "environmental" | "economic";
  severity: "low" | "medium" | "high" | "critical";
  rootCause?: string;
  correctiveActions?: string[];
  preventiveActions?: string[];
  costImpact?: number;
  productionLoss?: number; // barrels or MCF
  reportedBy: string;
  status: "active" | "completed" | "cancelled";
}

export const downtimeEvents: DowntimeEvent[] = [
  // Recent Unplanned Events
  {
    id: "dt-001",
    assetId: "KO-03",
    assetName: "Flare KO Drum KO-03",
    eventType: "unplanned",
    startTime: "2024-01-12T16:45:00Z",
    endTime: "2024-01-14T08:30:00Z",
    durationHours: 39.75,
    reasonCode: "INST-FAIL",
    reasonDescription: "Level transmitter failure causing control system malfunction",
    category: "failure",
    impact: "safety",
    severity: "critical",
    rootCause: "Moisture ingress in transmitter housing due to damaged cable gland",
    correctiveActions: [
      "Replace level transmitter",
      "Repair cable gland",
      "Test control system functionality"
    ],
    preventiveActions: [
      "Implement quarterly transmitter inspection",
      "Upgrade to IP67 rated transmitters",
      "Install transmitter enclosure heating"
    ],
    costImpact: 15000,
    reportedBy: "Operations Team",
    status: "completed",
  },
  {
    id: "dt-002",
    assetId: "GC-11",
    assetName: "Gas Compressor GC-11",
    eventType: "unplanned",
    startTime: "2024-01-10T09:15:00Z",
    endTime: "2024-01-10T17:30:00Z",
    durationHours: 8.25,
    reasonCode: "MECH-FAIL",
    reasonDescription: "High vibration trip due to bearing wear",
    category: "failure",
    impact: "production",
    severity: "high",
    rootCause: "Bearing lubrication contamination from water ingress",
    correctiveActions: [
      "Replace bearing assembly",
      "Flush lubrication system",
      "Repair seal leakage"
    ],
    preventiveActions: [
      "Implement oil analysis program",
      "Install moisture monitoring",
      "Upgrade bearing seals"
    ],
    costImpact: 25000,
    productionLoss: 1200, // MCF gas
    reportedBy: "Maintenance Team",
    status: "completed",
  },
  {
    id: "dt-003",
    assetId: "ESP-07",
    assetName: "ESP Pump ESP-07",
    eventType: "unplanned",
    startTime: "2024-01-05T14:30:00Z",
    endTime: "2024-01-05T22:45:00Z",
    durationHours: 8.25,
    reasonCode: "ELEC-FAIL",
    reasonDescription: "Motor current imbalance indicating winding failure",
    category: "failure",
    impact: "production",
    severity: "high",
    rootCause: "Motor winding insulation breakdown due to overheating",
    correctiveActions: [
      "Replace ESP motor",
      "Inspect power cable",
      "Test VFD operation"
    ],
    preventiveActions: [
      "Implement motor temperature monitoring",
      "Review operating parameters",
      "Upgrade motor insulation class"
    ],
    costImpact: 45000,
    productionLoss: 850, // barrels oil
    reportedBy: "Operations Team",
    status: "completed",
  },
  
  // Planned Maintenance Events
  {
    id: "dt-004",
    assetId: "WH-01",
    assetName: "Wellhead WH-01",
    eventType: "planned",
    startTime: "2024-01-08T08:00:00Z",
    endTime: "2024-01-08T10:00:00Z",
    durationHours: 2,
    reasonCode: "PM-INSP",
    reasonDescription: "Quarterly wellhead inspection and testing",
    category: "inspection",
    impact: "production",
    severity: "low",
    correctiveActions: [
      "Pressure test wellhead",
      "Inspect valve operation",
      "Calibrate pressure gauges"
    ],
    costImpact: 2000,
    productionLoss: 104, // barrels oil (2 hours at 1250 bbl/day)
    reportedBy: "Maintenance Planner",
    status: "completed",
  },
  {
    id: "dt-005",
    assetId: "P-21",
    assetName: "Crude Transfer Pump P-21",
    eventType: "planned",
    startTime: "2024-01-03T06:00:00Z",
    endTime: "2024-01-03T10:00:00Z",
    durationHours: 4,
    reasonCode: "PM-MAINT",
    reasonDescription: "Semi-annual pump maintenance and seal replacement",
    category: "maintenance",
    impact: "production",
    severity: "medium",
    correctiveActions: [
      "Replace mechanical seals",
      "Inspect impeller condition",
      "Align pump and motor",
      "Test pump performance"
    ],
    costImpact: 8000,
    reportedBy: "Maintenance Planner",
    status: "completed",
  },
  
  // Upcoming Planned Events
  {
    id: "dt-006",
    assetId: "GC-11",
    assetName: "Gas Compressor GC-11",
    eventType: "planned",
    startTime: "2024-01-25T12:00:00Z",
    durationHours: 16,
    reasonCode: "PM-OVERHAUL",
    reasonDescription: "Annual compressor overhaul and valve replacement",
    category: "maintenance",
    impact: "production",
    severity: "high",
    correctiveActions: [
      "Replace compressor valves",
      "Inspect cylinder condition",
      "Replace piston rings",
      "Test performance curves"
    ],
    costImpact: 35000,
    productionLoss: 2400, // MCF gas (16 hours)
    reportedBy: "Maintenance Planner",
    status: "active",
  },
  {
    id: "dt-007",
    assetId: "ESP-07",
    assetName: "ESP Pump ESP-07",
    eventType: "planned",
    startTime: "2024-02-01T10:00:00Z",
    durationHours: 12,
    reasonCode: "PM-REPLACE",
    reasonDescription: "Planned ESP replacement due to performance degradation",
    category: "maintenance",
    impact: "production",
    severity: "high",
    correctiveActions: [
      "Pull existing ESP system",
      "Install new ESP motor and pump",
      "Test system operation",
      "Optimize operating parameters"
    ],
    costImpact: 65000,
    productionLoss: 625, // barrels oil (12 hours at 1250 bbl/day)
    reportedBy: "Maintenance Planner",
    status: "active",
  },
];

// =============================================================================
// Export All Enhanced Data
// =============================================================================

export {
  enhancedUpstreamTelemetry as upstreamTelemetry,
};