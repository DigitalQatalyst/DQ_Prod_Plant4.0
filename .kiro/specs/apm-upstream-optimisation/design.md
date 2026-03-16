# Design Document

## Overview

This design document outlines the technical approach for contextualizing the existing APM (Asset Performance Management) feature sets for the Oil & Gas Upstream subsector. The implementation extends the Plant4.0 platform's existing APM capabilities by adding upstream-specific mock data, telemetry examples, and contextual UI metadata while preserving the generic, reusable APM architecture.

The solution leverages and extends the existing architecture:
- Multi-tenant system with new upstream tenant
- Existing APM navigation structure under Monitor area
- Enhanced mock data system with upstream assets and telemetry
- Upstream-specific nLVE page implementations
- Sector/subsector metadata integration

## Architecture

### Component Hierarchy

```
AppShell
├── TopBar (Enhanced tenant selector with upstream tenant)
├── MenuPane (Existing APM navigation with upstream context)
│   └── Monitor (APM) Feature Area
│       ├── Asset Health & Diagnostics (upstream context)
│       ├── Predictive & Prescriptive Maintenance (upstream context)
│       ├── Asset Performance & Utilisation (upstream context)
│       ├── Asset Inventory & Criticality (upstream context)
│       └── Alerts, Reports & Visualisation (upstream context)
└── Main Content Area
    └── Router (Enhanced with upstream-specific page implementations)
        └── APM Pages (nLVE pattern with upstream data)
```

### Data Flow Enhancement

1. Upstream tenant selection filters to upstream assets
2. Enhanced context provides sector/subsector metadata
3. APM pages consume upstream-specific mock data
4. Telemetry system provides realistic upstream measurements
5. KPI cards display upstream-relevant parameters

## Components and Interfaces

### Enhanced Tenant Interface

```typescript
interface Tenant {
  id: string;           // "t-upstream"
  name: string;         // "GulfUpstream Demo"
  industry: string;     // "Oil & Gas – Upstream"
  sector?: string;      // "Oil & Gas"
  subsector?: string;   // "Upstream"
}
```

### Upstream Asset Interface

```typescript
interface UpstreamAsset extends Asset {
  type: "Wellhead" | "ESP Pump" | "Gas Compressor" | "Crude Transfer Pump" | "Flare KO Drum";
  location: "Pad A" | "Pad B" | "Central Facility";
  healthIndex: number;  // 0-100
  anomalyState: "Normal" | "Warning" | "Critical";
}
```

### Telemetry Data Interface

```typescript
interface UpstreamTelemetry {
  [assetId: string]: {
    [parameter: string]: {
      value: number;
      timestamp: string;
      unit: string;
      status: "Normal" | "Warning" | "Critical";
    }[];
  };
}
```

### Enhanced App Context

```typescript
interface AppContextType {
  // Existing properties
  currentTenant: Tenant;
  userPersona: UserPersona;
  selectedAsset: Asset | null;
  assets: Asset[];
  
  // Enhanced properties
  sector?: string;      // "Oil & Gas"
  subsector?: string;   // "Upstream"
  telemetryData?: UpstreamTelemetry;
  healthIndices?: Record<string, number>;
}
```

## Data Models

### Upstream Tenant Definition

```typescript
const upstreamTenant: Tenant = {
  id: "t-upstream",
  name: "GulfUpstream Demo",
  industry: "Oil & Gas – Upstream",
  sector: "Oil & Gas",
  subsector: "Upstream"
};
```

### Upstream Assets

```typescript
const upstreamAssets: UpstreamAsset[] = [
  {
    id: "WH-01",
    name: "Wellhead WH-01",
    type: "Wellhead",
    site: "Production Field",
    area: "Pad A",
    location: "Pad A",
    status: "online",
    criticality: "high",
    healthIndex: 87,
    anomalyState: "Normal",
    lastSeen: "1 min ago"
  },
  {
    id: "ESP-07",
    name: "ESP Pump ESP-07",
    type: "ESP Pump",
    site: "Production Field",
    area: "Pad B",
    location: "Pad B",
    status: "online",
    criticality: "high",
    healthIndex: 92,
    anomalyState: "Normal",
    lastSeen: "30 sec ago"
  },
  {
    id: "GC-11",
    name: "Gas Compressor GC-11",
    type: "Gas Compressor",
    site: "Production Field",
    area: "Central Facility",
    location: "Central Facility",
    status: "online",
    criticality: "high",
    healthIndex: 78,
    anomalyState: "Warning",
    lastSeen: "2 min ago"
  },
  {
    id: "P-21",
    name: "Crude Transfer Pump P-21",
    type: "Crude Transfer Pump",
    site: "Production Field",
    area: "Pad A",
    location: "Pad A",
    status: "online",
    criticality: "medium",
    healthIndex: 85,
    anomalyState: "Normal",
    lastSeen: "1 min ago"
  },
  {
    id: "KO-03",
    name: "Flare Knock-Out Drum KO-03",
    type: "Flare KO Drum",
    site: "Production Field",
    area: "Central Facility",
    location: "Central Facility",
    status: "maintenance",
    criticality: "medium",
    healthIndex: 65,
    anomalyState: "Critical",
    lastSeen: "4 hours ago"
  }
];
```

### Upstream Telemetry Data

```typescript
const upstreamTelemetry: UpstreamTelemetry = {
  "WH-01": {
    pressure: [
      { value: 2850, timestamp: "2024-01-15T10:00:00Z", unit: "psi", status: "Normal" },
      { value: 2845, timestamp: "2024-01-15T10:01:00Z", unit: "psi", status: "Normal" },
      // ... more data points
    ],
    temperature: [
      { value: 185, timestamp: "2024-01-15T10:00:00Z", unit: "°F", status: "Normal" },
      // ... more data points
    ],
    flowRate: [
      { value: 1250, timestamp: "2024-01-15T10:00:00Z", unit: "bbl/day", status: "Normal" },
      // ... more data points
    ]
  },
  "ESP-07": {
    motorCurrent: [
      { value: 45.2, timestamp: "2024-01-15T10:00:00Z", unit: "A", status: "Normal" },
      // ... more data points
    ],
    intakePressure: [
      { value: 1850, timestamp: "2024-01-15T10:00:00Z", unit: "psi", status: "Normal" },
      // ... more data points
    ],
    dischargePressure: [
      { value: 3200, timestamp: "2024-01-15T10:00:00Z", unit: "psi", status: "Normal" },
      // ... more data points
    ],
    vibration: [
      { value: 2.1, timestamp: "2024-01-15T10:00:00Z", unit: "mm/s", status: "Normal" },
      // ... more data points
    ]
  },
  "GC-11": {
    suctionPressure: [
      { value: 850, timestamp: "2024-01-15T10:00:00Z", unit: "psi", status: "Normal" },
      // ... more data points
    ],
    dischargePressure: [
      { value: 1450, timestamp: "2024-01-15T10:00:00Z", unit: "psi", status: "Warning" },
      // ... more data points
    ],
    gasTemp: [
      { value: 165, timestamp: "2024-01-15T10:00:00Z", unit: "°F", status: "Normal" },
      // ... more data points
    ],
    vibration: [
      { value: 4.8, timestamp: "2024-01-15T10:00:00Z", unit: "mm/s", status: "Warning" },
      // ... more data points
    ]
  }
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Tenant selection filters assets correctly

*For any* tenant selection, when a user selects a tenant, the system should filter all asset data to show only assets belonging to that tenant.
**Validates: Requirements 1.2**

### Property 2: Asset type determines telemetry parameters

*For any* upstream asset of a specific type, when the asset is selected, the system should display telemetry parameters appropriate for that asset type (wellheads show pressure/temperature/flow, ESP pumps show motor current/pressures/vibration, compressors show suction/discharge pressures/temperature/vibration).
**Validates: Requirements 3.2, 3.3, 3.4**

### Property 3: Sector and subsector badges display consistently

*For any* asset telemetry view in upstream context, the system should display sector badge "Oil & Gas" and subsector badge "Upstream".
**Validates: Requirements 3.5**

### Property 4: Alert selection displays fault information

*For any* alert selection in root cause diagnostics, the system should display the fault title, likely causes, and corrective actions in the right panel.
**Validates: Requirements 4.2, 4.3, 4.4**

### Property 5: nLVE pattern maintained across features

*For any* APM feature page, the system should maintain the Navigate-List-View-Edit pattern with appropriate navigation, list pane, and view pane components.
**Validates: Requirements 4.5, 9.3**

### Property 6: Failure prediction data completeness

*For any* upstream asset in ML failure prediction view, the system should display failure probability percentage, RUL estimate, and color-coded risk level.
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 7: Mock data usage consistency

*For any* predictive or analytical feature, the system should use mock data without requiring actual ML implementation or backend integration.
**Validates: Requirements 5.4, 6.4**

### Property 8: Context preservation across features

*For any* APM feature access, the system should maintain upstream asset context and metadata throughout the user session.
**Validates: Requirements 5.5, 6.5**

### Property 9: RUL estimation data completeness

*For any* upstream asset in RUL estimation view, the system should display RUL trend cards, confidence interval placeholders, and degradation markers.
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 10: Navigation structure preservation

*For any* APM feature access, the system should preserve all existing feature sets under the Monitor area and maintain canonical routing patterns.
**Validates: Requirements 7.1, 7.2**

### Property 11: Metadata application consistency

*For any* APM feature navigation, the system should apply sector metadata "Oil & Gas" and subsector metadata "Upstream" along with appropriate icons and industry tags.
**Validates: Requirements 7.3, 7.4, 7.5**

### Property 12: Asset-specific KPI display

*For any* upstream asset view, the system should display KPI cards appropriate for the asset type (wellheads: flow/pressure/temperature, ESP pumps: current/pressures/vibration, compressors: pressures/temperature/vibration).
**Validates: Requirements 8.1, 8.2, 8.3**

### Property 13: Chart and condition display

*For any* upstream asset view, the system should display mock time-series line charts for key process variables and condition summary with Normal/Warning/Critical states.
**Validates: Requirements 8.4, 8.5**

### Property 14: Page loading reliability

*For any* APM feature page under upstream tenant context, the system should load without errors and display appropriate content.
**Validates: Requirements 9.5**

## Error Handling

### Tenant Context Errors

- **Missing Upstream Tenant**: If upstream tenant data is not found, system should gracefully fall back to default tenant
- **Invalid Asset Data**: If upstream asset data is malformed, system should display error state with fallback content
- **Telemetry Data Errors**: If telemetry data is missing or invalid, system should show "No data available" message

### Navigation Errors

- **Invalid APM Routes**: If user navigates to non-existent APM route, system should redirect to default APM page
- **Context Loss**: If upstream context is lost during navigation, system should restore from tenant selection

### Data Validation

- **Asset Type Validation**: System should validate asset types against upstream asset type enum
- **Telemetry Parameter Validation**: System should validate telemetry parameters match asset type requirements
- **Health Index Validation**: System should ensure health indices are within 0-100 range

## Testing Strategy

### Unit Testing

Unit tests will verify specific upstream implementations:

1. **Upstream Tenant Integration**
   - Verify upstream tenant appears in tenant selector
   - Verify tenant selection filters to upstream assets
   - Verify sector/subsector metadata application

2. **Asset Type Handling**
   - Verify each upstream asset type displays correct telemetry parameters
   - Verify KPI cards match asset type requirements
   - Verify health indices and anomaly states display correctly

3. **Page Component Functionality**
   - Verify condition monitoring displays upstream assets with health data
   - Verify root cause diagnostics shows upstream alerts and fault information
   - Verify failure prediction and RUL estimation display mock data correctly

### Property-Based Testing

Property-based tests will verify universal behaviors using **fast-check** (JavaScript/TypeScript PBT library). Each test will run a minimum of 100 iterations.

1. **Property 1: Tenant selection filters assets correctly**
   - Generate: Random tenant selections
   - Test: Asset filtering works correctly for each tenant
   - **Feature: apm-upstream-optimisation, Property 1: Tenant selection filters assets correctly**

2. **Property 2: Asset type determines telemetry parameters**
   - Generate: Random upstream assets of different types
   - Test: Correct telemetry parameters display for each asset type
   - **Feature: apm-upstream-optimisation, Property 2: Asset type determines telemetry parameters**

3. **Property 5: nLVE pattern maintained across features**
   - Generate: All APM feature pages
   - Test: Each page maintains Navigate-List-View-Edit pattern
   - **Feature: apm-upstream-optimisation, Property 5: nLVE pattern maintained across features**

4. **Property 14: Page loading reliability**
   - Generate: All APM feature routes under upstream tenant
   - Test: Each page loads without errors
   - **Feature: apm-upstream-optimisation, Property 14: Page loading reliability**

### Integration Testing

Integration tests will verify the complete upstream workflow:

1. **End-to-End Upstream Flow**
   - Select upstream tenant
   - Navigate through all APM features
   - Verify upstream context maintained
   - Verify appropriate data displayed

2. **Cross-Feature Context**
   - Verify sector/subsector metadata consistent across features
   - Verify asset selection context preserved during navigation
   - Verify telemetry data accessible from multiple features

### Manual Testing Checklist

- [ ] Upstream tenant appears in tenant selector
- [ ] Selecting upstream tenant filters to upstream assets only
- [ ] All 5 upstream assets display with correct properties
- [ ] Condition monitoring shows health indices and anomaly states
- [ ] Asset selection displays appropriate telemetry parameters
- [ ] Sector/subsector badges appear on all relevant pages
- [ ] Root cause diagnostics shows upstream alerts and fault details
- [ ] Failure prediction displays mock probabilities and RUL estimates
- [ ] RUL estimation shows trend cards and degradation markers
- [ ] All APM pages load without errors under upstream tenant
- [ ] Navigation structure remains unchanged
- [ ] KPI cards display asset-type-appropriate parameters
- [ ] Time-series charts display for key process variables
- [ ] Condition summaries show Normal/Warning/Critical states