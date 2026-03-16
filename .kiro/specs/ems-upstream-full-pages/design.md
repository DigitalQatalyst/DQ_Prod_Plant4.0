# Design Document

## Overview

The EMS Upstream Full Pages feature implements a comprehensive Energy Management System with 25 functional pages across 5 feature sets for Oil & Gas Upstream operations. This implementation creates a complete suite of energy monitoring, analytics, sustainability, control, and reporting capabilities while maintaining the existing Plant4.0 architecture and nLVE design patterns.

The solution extends the existing Energy (EMS) section with upstream-contextual pages that use mock data to demonstrate realistic upstream energy scenarios. All pages follow consistent UI patterns and reuse shared components to ensure maintainability and visual consistency.

## Architecture

### System Integration
The EMS Full Pages implementation leverages the existing Plant4.0 architecture:

- **Multi-tenant Context**: Utilizes the existing "GulfUpstream Demo" tenant with upstream metadata
- **Navigation Hierarchy**: Extends the existing Energy (EMS) feature area with 25 concrete page implementations
- **Component Reuse**: Maximizes reuse of existing UI components and introduces shared EMS widgets
- **Mock Data System**: Extends the current mock data approach with comprehensive upstream energy datasets

### Feature Set Organization
The implementation provides 5 feature sets with 5 pages each:

1. **Energy Monitoring & Metering** (5 pages)
   - Real-time Consumption
   - Sub-metering
   - Power Quality
   - Baseline Trends
   - Multi-fluid Monitoring

2. **Energy Analytics & Optimisation** (5 pages)
   - Efficiency KPIs
   - Load Profiling
   - Peak Demand
   - Waste Detection
   - AI Optimisation

3. **Sustainability & Emissions Tracking** (5 pages)
   - Carbon Calculation
   - Energy Intensity
   - Renewables
   - ESG Reporting
   - Compliance

4. **Energy Control Advisory & Integration** (5 pages)
   - Load Balancing
   - Demand Response
   - Asset Modes
   - Integration
   - Efficiency Curves

5. **Energy Dashboards & Reporting** (5 pages)
   - Custom Dashboards
   - Period Comparison
   - Cost Analysis
   - Anomalies
   - Audit Reports

### Shared Component Architecture
The implementation introduces a shared EMS UI kit:

- **EMSPageShell**: Consistent layout wrapper for all EMS pages
- **EMSMeterList**: Reusable meter selection component
- **EMSHeader**: Standardized page headers with context badges
- **EMS Widgets**: Library of reusable energy-specific components

## Components and Interfaces

### Data Models

#### Extended Energy Entities
```typescript
interface Submeter {
  id: string;
  name: string;
  assetId: string;
  energyType: "electricity" | "gas" | "diesel" | "steam";
  status: "Normal" | "High" | "Critical";
  currentValue: number;
  unit: string;
}

interface PowerQuality {
  meterId: string;
  powerFactor: number;
  thdPct: number;
  voltageV: number;
  frequencyHz: number;
  sagEventsCount: number;
  swellEventsCount: number;
  timestamp: string[];
  powerFactorHistory?: number[];
  thdHistory?: number[];
  voltageHistory?: number[];
}

interface EnergyAnomaly {
  id: string;
  meterId: string;
  timestamp: string;
  type: "spike" | "baseline_drift" | "power_quality" | "standby_waste";
  magnitudePct: number;
  severity: "Low" | "Medium" | "High" | "Critical";
  description: string;
  resolved: boolean;
  estimatedCostImpact?: number;
}

interface ControllableLoad {
  id: string;
  name: string;
  assetId: string;
  loadType: "pump" | "compressor" | "lighting" | "hvac";
  sheddingPriority: number;
  minOffTimeMin: number;
  maxShedMin: number;
  currentKW: number;
  status: "available" | "shedding" | "unavailable";
}

interface GeneratorUpsRenewable {
  id: string;
  name: string;
  type: "generator" | "ups" | "solar";
  capacityKw: number;
  status: "online" | "offline" | "maintenance";
  fuelType?: "diesel" | "gas" | "battery" | "solar";
  currentOutput?: number;
}

interface DemandResponseSignal {
  id: string;
  timestamp: string;
  eventType: "peak_shaving" | "load_shifting" | "emergency";
  requestedReductionKw: number;
  durationMin: number;
  status: "pending" | "active" | "completed" | "cancelled";
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly" | "quarterly";
  lastRunAt?: string;
  category: "energy" | "emissions" | "compliance" | "cost";
}

interface ExportJob {
  id: string;
  dataset: string;
  format: "csv" | "pdf" | "xlsx";
  requestedAt: string;
  status: "pending" | "processing" | "completed" | "failed";
  deliveredAt?: string;
}
```

#### Production Context
```typescript
interface ProductionContext {
  barrelsPerDay: number;
  mscfPerDay: number;
  runtimeHoursPerDay: number;
  lastUpdated: string;
}
```

### UI Components

#### EMSPageShell
Provides consistent layout for all EMS pages:
```typescript
interface EMSPageShellProps {
  title: string;
  featureSetName: string;
  featureName: string;
  listType: "meters" | "submeters" | "profiles" | "reports" | "scopes";
  listItems: any[];
  selectedItem: any;
  onItemSelect: (item: any) => void;
  workPaneContent: React.ReactNode;
  actions?: React.ReactNode;
  searchPlaceholder?: string;
}
```

#### EMS Widgets
Reusable components for consistent data presentation:

- **EnergyKPIGrid**: Standard 4-column KPI layout (kW, kWh, cost, CO2)
- **MultiStreamKPIGrid**: Energy type breakdown (electricity/gas/diesel/steam)
- **BaselineComparisonCard**: Today vs baseline with percentage delta
- **TrendChart**: Time-series visualization with Recharts
- **PowerQualityCard**: PF, THD, voltage, frequency display
- **LoadProfileChart**: 24-hour curves with forecast overlay
- **PeakDemandPanel**: Threshold warnings and recommendations
- **WasteDetectionList**: Ranked waste categories with actions
- **CarbonBreakdownTable**: Scope 1/2 emissions breakdown
- **EnergyIntensityCard**: kWh/BBL and CO2/BBL metrics
- **AdvisoryActionsList**: Grouped recommendations with timeframes
- **CostBreakdownChart**: Cost distribution visualization
- **ExportPanel**: CSV/PDF/API export controls with history
- **ReportBuilderShell**: Schedule form in PopPane

### Page Components

Each of the 25 pages follows the same structure:
- **ListPane**: Context-appropriate item selection
- **WorkPane**: Detailed view with tabs and widgets
- **PopPane**: Optional forms and detailed views
- **Header**: Consistent title, subtitle, and sector badges

## Data Models

### Mock Data Extensions

#### Comprehensive Energy Data
```typescript
// Submeters by asset
export const upstreamSubmeters: Submeter[] = [
  {
    id: "sm-esp-07",
    name: "ESP-07 Power Meter",
    assetId: "ESP-07",
    energyType: "electricity",
    status: "Normal",
    currentValue: 45.2,
    unit: "kW"
  },
  // ... additional submeters
];

// Power quality data
export const upstreamPowerQuality: Record<string, PowerQuality> = {
  "em-wh-01": {
    meterId: "em-wh-01",
    powerFactor: 0.92,
    thdPct: 3.2,
    voltageV: 480,
    frequencyHz: 60.1,
    sagEventsCount: 2,
    swellEventsCount: 0,
    timestamp: [/* 24 hours */],
    powerFactorHistory: [/* 24 values */]
  }
  // ... additional meters
};

// Energy anomalies
export const upstreamEnergyAnomalies: EnergyAnomaly[] = [
  {
    id: "anom-001",
    meterId: "em-wh-01",
    timestamp: "2024-12-16T14:30:00Z",
    type: "spike",
    magnitudePct: 25,
    severity: "Medium",
    description: "Unexpected demand spike during normal operations",
    resolved: false,
    estimatedCostImpact: 150
  }
  // ... additional anomalies
];

// Controllable loads
export const upstreamControllableLoads: ControllableLoad[] = [
  {
    id: "cl-esp-07",
    name: "ESP-07 Variable Drive",
    assetId: "ESP-07",
    loadType: "pump",
    sheddingPriority: 3,
    minOffTimeMin: 15,
    maxShedMin: 60,
    currentKW: 45.2,
    status: "available"
  }
  // ... additional loads
];

// Production context
export const upstreamProductionContext: ProductionContext = {
  barrelsPerDay: 1250,
  mscfPerDay: 850,
  runtimeHoursPerDay: 22.5,
  lastUpdated: "2024-12-16T12:00:00Z"
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After reviewing all properties identified in the prework analysis, several consolidations were identified:

- Properties 2.1-2.5 (monitoring page content) can be consolidated into page content completeness properties
- Properties 3.1-3.5 (analytics page content) can be consolidated similarly
- Properties 4.1-4.5, 5.1-5.5, 6.1-6.5 (feature set content) follow the same pattern
- Properties 7.1-7.5 (component usage) can be consolidated into component consistency properties
- Properties 8.1-8.5 (data availability) can be consolidated into data completeness properties
- Properties 9.1-9.5 (navigation) can be consolidated into navigation consistency properties
- Properties 10.1-10.5 (visual consistency) can be consolidated into UI consistency properties

The following properties represent the unique validation requirements after removing redundancy:

Property 1: EMS page structure consistency
*For any* EMS page, it should follow the nLVE pattern with ListPane and WorkPane components
**Validates: Requirements 1.2**

Property 2: Upstream context consistency
*For any* EMS page, it should display upstream sector and subsector metadata consistently
**Validates: Requirements 1.3**

Property 3: Component reuse consistency
*For any* EMS page, it should use shared components (EMSPageShell, widgets) for consistent functionality
**Validates: Requirements 7.1, 7.2, 7.4, 7.5**

Property 4: Page content completeness
*For any* EMS feature page, it should display all required content elements as specified in its feature requirements
**Validates: Requirements 2.1-2.5, 3.1-3.5, 4.1-4.5, 5.1-5.5, 6.1-6.5**

Property 5: Mock data availability
*For any* EMS page requiring data, all necessary mock datasets should be available and realistic for upstream operations
**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

Property 6: Data consistency across pages
*For any* related data displayed on multiple EMS pages, the values should be consistent across all pages
**Validates: Requirements 8.5**

Property 7: Navigation structure preservation
*For any* EMS feature route, it should map to a concrete page component and maintain existing navigation patterns
**Validates: Requirements 9.1, 9.2, 9.3**

Property 8: Navigation UI consistency
*For any* EMS navigation element, it should display appropriate icons, labels, and context information
**Validates: Requirements 9.4, 9.5**

Property 9: Visual design consistency
*For any* EMS page, it should follow Plant4.0 design standards including theme, typography, and component patterns
**Validates: Requirements 10.1, 10.3**

Property 10: Energy type iconography consistency
*For any* energy type display across EMS pages, it should use consistent iconography (bolt, flame, droplet, steam)
**Validates: Requirements 10.2**

Property 11: Context badge consistency
*For any* EMS page, sector/subsector badges should be displayed consistently with proper styling
**Validates: Requirements 10.4**

Property 12: Data presentation consistency
*For any* data presentation across EMS pages, it should maintain consistent color coding, status indicators, and interaction patterns
**Validates: Requirements 10.5**

Property 13: Mock-only operation
*For any* EMS page interaction, no backend API calls should be made and all functionality should use mock data
**Validates: Requirements 1.5**

## Error Handling

### Data Validation
- Validate all mock data structures before rendering
- Handle missing or incomplete datasets gracefully
- Provide meaningful error messages for data inconsistencies

### UI Error States
- Display appropriate empty states when no data is available
- Show loading states during data processing
- Handle component rendering errors with fallback UI

### Navigation Error Handling
- Provide fallback routes for missing or invalid EMS pages
- Handle routing errors with appropriate error pages
- Maintain navigation state consistency during errors

## Testing Strategy

### Unit Testing
The implementation will include unit tests for:
- Individual EMS widget components
- Data transformation and calculation functions
- Page routing and navigation behavior
- Mock data generation and consistency

### Property-Based Testing
Property-based tests will be implemented using a suitable TypeScript testing library to verify:
- Page structure consistency across all 25 EMS pages
- Component reuse patterns and consistency
- Data availability and consistency across related pages
- Navigation structure and UI element consistency
- Visual design consistency with Plant4.0 standards

Each property-based test will:
- Run a minimum of 100 iterations for thorough coverage
- Use smart generators that create realistic EMS page scenarios
- Focus on structural and behavioral consistency rather than specific content
- Validate cross-page relationships and data consistency

The comprehensive testing approach will ensure all 25 EMS pages work correctly and consistently while maintaining the reusable architecture for future sector extensions.