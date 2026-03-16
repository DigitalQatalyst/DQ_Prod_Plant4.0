# Design Document

## Overview

This design document outlines the technical approach for implementing functional nLVE (Navigate-List-View-Edit) pages for all 25 APM (Asset Performance Management) features under the Monitor section, contextualized specifically for Oil & Gas Upstream operations. The implementation will transform existing placeholder pages into fully functional interfaces using mock-first data and reusable UI patterns.

The solution builds upon the existing APM monitor expansion foundation, which already provides:
- Navigation structure with 5 Feature Sets containing 25 features
- Basic placeholder pages using ShellPage components
- Route configurations and TypeScript interfaces
- Upstream tenant and asset data structures

The new implementation will replace these placeholders with comprehensive, upstream-specific pages that demonstrate real APM capabilities using realistic mock data for wellheads, ESP pumps, gas compressors, crude transfer pumps, and flare KO drums.

## Architecture

### Component Hierarchy

```
Monitor (APM) Feature Area
├── Asset Health & Diagnostics (5 features)
│   ├── Real-time Condition Monitoring
│   ├── Asset Health Scoring / Index  
│   ├── Anomaly & Fault Detection
│   ├── Root-cause Diagnostics
│   └── Degradation Trend Analysis
├── Predictive & Prescriptive Maintenance (5 features)
│   ├── Machine-learning Failure Prediction
│   ├── Remaining Useful Life (RUL) Estimation
│   ├── Condition-based Maintenance Triggers
│   ├── Prescriptive Maintenance Recommendations
│   └── Maintenance Priority & Risk Scoring
├── Asset Performance & Utilisation (5 features)
│   ├── Uptime & Downtime Tracking
│   ├── Utilisation & Load Monitoring
│   ├── Performance Deviation Detection
│   ├── Benchmarking of Asset Performance
│   └── Availability / Reliability KPIs (A/R/M)
├── Asset Inventory & Criticality (5 features)
│   ├── Asset Registry & Hierarchy
│   ├── Criticality Scoring
│   ├── Failure Mode Mapping (FMEA/FMECA)
│   ├── Lifecycle Stage Tracking
│   └── Spare-Part Linkage & Metadata
└── Alerts, Reports & Visualisation (5 features)
    ├── Real-time Alerts & Severity Levels
    ├── Event / Alert History Timeline
    ├── Custom Dashboards
    ├── Automated Reliability Reports
    └── Data Export (PDF, CSV, APIs)
```

### Data Flow Architecture

```
AppContext (Tenant Selection)
    ↓
Upstream Tenant ("GulfUpstream Demo")
    ↓
Asset Selection (ListPane)
    ↓ 
Mock Data Providers
    ├── upstreamTelemetry (real-time sensor data)
    ├── upstreamAlerts (fault diagnostics)
    ├── reliabilityMetrics (MTBF, MTTR, availability)
    ├── criticalityScores (safety, production, environmental)
    ├── fmeaLibrary (failure modes by asset type)
    └── benchmarkData (performance comparisons)
    ↓
Feature-Specific WorkPane Content
    ├── Health Index Cards
    ├── KPI Grids (asset-type aware)
    ├── Trend Charts (time-series)
    ├── Alert Lists & Root Cause Analysis
    ├── RUL Estimates & Failure Predictions
    └── Benchmark Comparisons
```

## Components and Interfaces

### Shared APM Components

#### APMPageShell Component
```typescript
interface APMPageShellProps {
  title: string;
  featureSetName: string;
  featureName: string;
  listType: "assets" | "events" | "workOrders";
  children: React.ReactNode;
}
```

The APMPageShell provides consistent layout structure for all APM pages:
- Standardized header with feature breadcrumbs
- Integrated ListPane and WorkPane sections
- Upstream sector/subsector badge display
- Empty state handling when no data is available

#### APMAssetList Component
```typescript
interface APMAssetListProps {
  assets: UpstreamAsset[];
  selectedAsset: UpstreamAsset | null;
  onAssetSelect: (asset: UpstreamAsset) => void;
  filterCriteria?: AssetFilterCriteria;
}

interface UpstreamAsset extends Asset {
  healthIndex: number;
  anomalyState: "Normal" | "Warning" | "Critical";
  location: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  rulDays?: number;
  failureProbability?: number;
}
```

The APMAssetList displays upstream assets with:
- Asset name, type, and location
- Criticality badge (High/Medium/Low)
- Health score chip (0-100 with color coding)
- Anomaly state indicator
- Last seen timestamp
- Click handler for asset selection

### Feature-Specific Widget Components

#### HealthIndexCard
```typescript
interface HealthIndexCardProps {
  asset: UpstreamAsset;
  breakdown?: {
    vibrationScore: number;
    temperatureScore: number;
    pressureScore: number;
    electricalScore: number;
    runtimeFactor: number;
  };
}
```

#### SignalKPIGrid
```typescript
interface SignalKPIGridProps {
  asset: UpstreamAsset;
  telemetryData: UpstreamTelemetry[string];
  assetType: string;
}
```

Asset-type-aware KPI display:
- **Wellhead**: Pressure, Temperature, Flow Rate, Choke Position
- **ESP Pump**: Motor Current, Intake/Discharge Pressure, Vibration
- **Gas Compressor**: Suction/Discharge Pressure, Gas Temperature, Vibration
- **Crude Pump**: Flow Rate, Suction/Discharge Pressure, Motor Current
- **Flare KO Drum**: Pressure, Temperature, Level, Flow Rate

#### MiniTrendChart
```typescript
interface MiniTrendChartProps {
  data: TelemetryDataPoint[];
  parameter: string;
  unit: string;
  height?: number;
  showStatus?: boolean;
}
```

#### AlertList & RootCausePanel
```typescript
interface AlertListProps {
  alerts: UpstreamAlert[];
  selectedAlert: UpstreamAlert | null;
  onAlertSelect: (alert: UpstreamAlert) => void;
}

interface RootCausePanelProps {
  alert: UpstreamAlert;
  showEvidence?: boolean;
}
```

#### RULCard & FailureProbabilityCard
```typescript
interface RULCardProps {
  asset: UpstreamAsset;
  component: string;
  rulDays: number;
  confidence: number;
  trend: "improving" | "stable" | "degrading";
}

interface FailureProbabilityCardProps {
  asset: UpstreamAsset;
  horizons: {
    "7d": number;
    "30d": number;
    "90d": number;
  };
  topFailureModes: string[];
}
```

## Data Models

### Upstream Tenant Structure
```typescript
interface UpstreamTenant extends Tenant {
  id: "t-upstream";
  name: "GulfUpstream Demo";
  industry: "Oil & Gas – Upstream";
  sector: "Oil & Gas";
  subsector: "Upstream";
}
```

### Upstream Asset Types
```typescript
interface UpstreamAssetDefinition {
  id: string;
  name: string;
  type: "Wellhead" | "ESP Pump" | "Gas Compressor" | "Crude Transfer Pump" | "Flare KO Drum";
  location: string;
  criticality: "High" | "Medium" | "Low";
  healthIndex: number; // 0-100
  anomalyState: "Normal" | "Warning" | "Critical";
  telemetryParameters: string[]; // Asset-type specific parameters
}
```

### Telemetry Data Structure
```typescript
interface UpstreamTelemetry {
  [assetId: string]: {
    [parameter: string]: TelemetryDataPoint[];
  };
}

interface TelemetryDataPoint {
  value: number;
  timestamp: string; // ISO format
  unit: string;
  status: "Normal" | "Warning" | "Critical";
}
```

### Reliability Metrics
```typescript
interface ReliabilityMetrics {
  [assetId: string]: {
    mtbfHours: number;
    mttrHours: number;
    mttfHours: number;
    availabilityPct: number;
    failureCount30d: number;
    downtimeHours30d: number;
  };
}

interface DowntimeEvent {
  id: string;
  assetId: string;
  start: string;
  end: string;
  durationMin: number;
  reason: string;
  planned: boolean;
}
```

### Criticality & FMEA Data
```typescript
interface CriticalityScore {
  [assetId: string]: {
    safetyImpact: number; // 1-5 scale
    productionImpact: number; // 1-5 scale
    environmentalImpact: number; // 1-5 scale
    detectability: number; // 1-5 scale
    overallScore: number; // Calculated composite
  };
}

interface FMEAEntry {
  assetType: string;
  failureMode: string;
  effect: string;
  cause: string;
  detectionMethod: string;
  severity: number; // 1-10
  occurrence: number; // 1-10
  detection: number; // 1-10
  rpn: number; // Risk Priority Number (S × O × D)
}
```

### Spare Parts & Benchmarks
```typescript
interface SparePart {
  partNo: string;
  description: string;
  compatibleAssetTypes: string[];
  onHandQty: number;
  reorderPoint: number;
  leadTimeDays: number;
}

interface BenchmarkData {
  [assetType: string]: {
    metricName: string;
    target: number;
    bestObserved: number;
    worstObserved: number;
    unit: string;
  }[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Asset information completeness
*For any* upstream asset displayed in the system, the asset information should include name, type, location, criticality badge, health score, and anomaly indicators
**Validates: Requirements 1.3, 8.3**

### Property 2: Sector badge consistency
*For any* interface element when upstream context is active, sector badge "Oil & Gas" and subsector badge "Upstream" should be displayed consistently
**Validates: Requirements 1.4**

### Property 3: Asset-type telemetry mapping
*For any* upstream asset, the telemetry parameters provided should match the expected parameters for that asset type (wellhead parameters for wellheads, pump parameters for pumps, etc.)
**Validates: Requirements 1.5, 2.4, 3.3**

### Property 4: Telemetry data completeness
*For any* upstream asset, telemetry data should include all required measurements (pressure, temperature, vibration, flow rate, motor current, suction pressure, discharge pressure, choke position as applicable)
**Validates: Requirements 2.1**

### Property 5: Historical data availability
*For any* upstream asset, historical telemetry should provide at least 24 hours of data points with realistic value ranges
**Validates: Requirements 2.2**

### Property 6: Current value accessibility
*For any* telemetry display, current values should provide last-value convenience fields for KPI card displays
**Validates: Requirements 2.3**

### Property 7: Telemetry pattern realism
*For any* telemetry trend display, the data should show realistic variation patterns consistent with upstream operations
**Validates: Requirements 2.5**

### Property 8: Health index and anomaly display
*For any* upstream asset on condition monitoring pages, current health index scores and anomaly indicators should be displayed
**Validates: Requirements 3.1**

### Property 9: Asset header completeness
*For any* selected asset, the asset header should show name, type, location, and sector/subsector badges
**Validates: Requirements 3.2**

### Property 10: Trend chart characteristics
*For any* trend chart display, mini time-series charts should be shown for key process variables with realistic data patterns
**Validates: Requirements 3.4**

### Property 11: Condition status calculation
*For any* condition summary display, the status (Normal/Warning/Critical) should be based on threshold-based evaluation of telemetry data
**Validates: Requirements 3.5**

### Property 12: Alert information display
*For any* selected alert in root cause diagnostics, fault title, description, and timestamp should be displayed in the WorkPane
**Validates: Requirements 4.2**

### Property 13: Root cause analysis completeness
*For any* root cause analysis display, likely causes should be provided based on upstream equipment knowledge and operational patterns
**Validates: Requirements 4.3**

### Property 14: Corrective action appropriateness
*For any* corrective action display, suggested actions should be appropriate for upstream operations and equipment types
**Validates: Requirements 4.4**

### Property 15: Supporting evidence relevance
*For any* supporting evidence display, relevant telemetry signals and operational context should be referenced
**Validates: Requirements 4.5**

### Property 16: Failure prediction horizon coverage
*For any* upstream asset on failure prediction pages, failure probability percentages should be displayed for multiple time horizons (7, 30, 90 days)
**Validates: Requirements 5.1**

### Property 17: RUL estimation completeness
*For any* RUL estimation display, remaining useful life estimates should include days and confidence intervals
**Validates: Requirements 5.2**

### Property 18: Risk level color coding
*For any* risk assessment display, risk levels should be color-coded (Low/Medium/High) based on failure probability and asset criticality
**Validates: Requirements 5.3**

### Property 19: FMEA-based failure modes
*For any* prediction detail display, top failure modes should be shown based on FMEA library data for the asset type
**Validates: Requirements 5.4**

### Property 20: Confidence metric display
*For any* confidence metric display, model confidence indicators and last update timestamps should be shown
**Validates: Requirements 5.5**

### Property 21: Performance metric completeness
*For any* upstream asset in performance tracking, uptime percentage, downtime hours, and availability metrics should be displayed for the last 30 days
**Validates: Requirements 6.1**

### Property 22: Reliability calculation provision
*For any* reliability metric display, MTBF, MTTR, MTTF calculations with trend indicators should be provided
**Validates: Requirements 6.2**

### Property 23: Downtime event categorization
*For any* downtime analysis display, events should be categorized as planned versus unplanned with duration and reason codes
**Validates: Requirements 6.3**

### Property 24: Utilization comparison display
*For any* utilization metric display, asset utilization versus rated capacity with load profile information should be shown
**Validates: Requirements 6.4**

### Property 25: Benchmark comparison accuracy
*For any* benchmark comparison display, selected asset performance should be compared against best observed and target values for similar upstream equipment
**Validates: Requirements 6.5**

### Property 26: Routing structure preservation
*For any* navigation operation, routing structure and paths should be preserved as defined in navigation.ts configuration
**Validates: Requirements 7.2**

### Property 27: Feature metadata application
*For any* APM feature, sector "Oil & Gas" and subsector "Upstream" metadata should be applied for future filtering
**Validates: Requirements 7.3**

### Property 28: URL pattern consistency
*For any* APM feature path, the URL should maintain established patterns
**Validates: Requirements 7.4**

### Property 29: Navigation preservation
*For any* navigation structure modification, all existing feature sets and features under Monitor area should be preserved
**Validates: Requirements 7.5**

### Property 30: ListPane asset filtering
*For any* APM page load, the ListPane should display upstream assets filtered by current tenant context
**Validates: Requirements 8.1**

### Property 31: WorkPane content updates
*For any* asset selection, the WorkPane content should update to show feature-specific information for the selected upstream asset
**Validates: Requirements 8.2**

### Property 32: Feature-specific widget relevance
*For any* WorkPane content display, widgets and data should be relevant to the selected asset and current APM feature
**Validates: Requirements 8.4**

### Property 33: Empty state messaging
*For any* empty state occurrence, appropriate messaging and guidance should be provided when no assets or data are available
**Validates: Requirements 8.5**

## Error Handling

### Data Availability Errors

- **Missing Telemetry Data**: When telemetry data is unavailable for an asset, display "No data available" message with last known timestamp
- **Invalid Asset Selection**: If selected asset is not found in current tenant context, reset to first available asset or show empty state
- **Malformed Mock Data**: Validate mock data structure on load and provide fallback values for missing properties

### Navigation Errors

- **Invalid Feature Routes**: If user navigates to non-existent APM feature, redirect to first available feature in the same feature set
- **Tenant Context Loss**: If upstream tenant context is lost, restore default upstream tenant and refresh asset list
- **Asset Context Mismatch**: If selected asset doesn't belong to current tenant, clear selection and show asset selection prompt

### UI Component Errors

- **Chart Rendering Failures**: If trend charts fail to render due to data issues, show static placeholder with error message
- **Widget Load Failures**: If APM widgets fail to load, display skeleton loaders with retry option
- **Empty Data States**: Provide meaningful empty states with guidance on expected data and next steps

### Performance Degradation

- **Large Dataset Handling**: Implement pagination for asset lists exceeding 50 items
- **Chart Performance**: Limit trend chart data points to last 100 readings for real-time performance
- **Memory Management**: Clear unused telemetry data when switching between assets to prevent memory leaks

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and component behavior:

1. **Component Rendering**
   - Verify APMPageShell renders with correct props and layout structure
   - Test APMAssetList displays assets with proper formatting and selection handling
   - Validate individual widget components (HealthIndexCard, SignalKPIGrid, etc.) render correctly

2. **Data Processing**
   - Test telemetry data transformation for different asset types
   - Verify health index calculation logic with known input values
   - Test alert filtering and sorting functionality

3. **Asset Type Mapping**
   - Verify wellhead assets show correct KPI parameters (pressure, temperature, flow rate)
   - Test ESP pump assets display motor current, pressures, and vibration
   - Validate gas compressor assets show suction/discharge pressures and vibration

4. **Mock Data Integration**
   - Test upstream tenant data structure and asset associations
   - Verify telemetry data generation produces realistic values within expected ranges
   - Test alert data provides appropriate upstream-specific causes and actions

### Property-Based Testing

Property-based tests will verify universal behaviors using **fast-check** (JavaScript/TypeScript PBT library). Each test will run a minimum of 100 iterations.

1. **Property 3: Asset-type telemetry mapping**
   - Generate: Random upstream assets of different types
   - Test: Telemetry parameters match expected parameters for each asset type
   - **Feature: apm-upstream-full-pages, Property 3: Asset-type telemetry mapping**

2. **Property 8: Health index and anomaly display**
   - Generate: Random upstream assets with varying health indices and anomaly states
   - Test: Health index scores and anomaly indicators are displayed for all assets
   - **Feature: apm-upstream-full-pages, Property 8: Health index and anomaly display**

3. **Property 16: Failure prediction horizon coverage**
   - Generate: Random upstream assets
   - Test: Failure probability percentages are provided for 7, 30, and 90-day horizons
   - **Feature: apm-upstream-full-pages, Property 16: Failure prediction horizon coverage**

4. **Property 21: Performance metric completeness**
   - Generate: Random upstream assets
   - Test: Performance tracking displays uptime, downtime, and availability metrics for 30-day period
   - **Feature: apm-upstream-full-pages, Property 21: Performance metric completeness**

5. **Property 26: Routing structure preservation**
   - Generate: All APM feature navigation paths
   - Test: Each path follows established routing patterns and preserves navigation structure
   - **Feature: apm-upstream-full-pages, Property 26: Routing structure preservation**

### Integration Testing

Integration tests will verify complete user workflows:

1. **End-to-End APM Workflows**
   - Navigate through all 25 APM features and verify each loads without errors
   - Test asset selection across different features maintains context
   - Verify tenant switching updates all APM pages appropriately

2. **Cross-Feature Data Consistency**
   - Test that asset health data is consistent between condition monitoring and failure prediction
   - Verify alert data appears correctly in both root cause diagnostics and alert history
   - Test that reliability metrics align between performance tracking and benchmark comparisons

3. **Responsive Layout Testing**
   - Verify nLVE layout works correctly across different screen sizes
   - Test that charts and widgets adapt to container size changes
   - Validate mobile-friendly behavior for touch interactions

### Manual Testing Checklist

- [ ] All 25 APM features load without errors for upstream tenant
- [ ] Asset selection updates WorkPane content appropriately for each feature
- [ ] Telemetry charts display realistic data patterns for all asset types
- [ ] Health indices and anomaly states reflect in condition summaries
- [ ] Root cause diagnostics provide upstream-specific causes and actions
- [ ] Failure predictions show appropriate time horizons and confidence levels
- [ ] Performance metrics calculate correctly for MTBF, MTTR, availability
- [ ] Benchmark comparisons show realistic industry targets
- [ ] Sector and subsector badges appear consistently throughout interface
- [ ] Empty states provide helpful guidance when no data is available
- [ ] Navigation preserves existing Monitor area structure
- [ ] All widgets use Plant4.0 design system consistently