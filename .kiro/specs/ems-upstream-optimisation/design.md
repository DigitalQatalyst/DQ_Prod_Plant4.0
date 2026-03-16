# Design Document

## Overview

The EMS Upstream Optimisation feature extends the Plant4.0 platform's existing Energy Management System (EMS) capabilities to support Oil & Gas Upstream operations. This implementation adds upstream-specific mock energy data, telemetry profiles, and contextual UI metadata while preserving the generic, reusable EMS architecture.

The solution follows the established nLVE (Navigate → List → View → Edit) pattern and integrates seamlessly with the existing multi-tenant architecture. All functionality is implemented using mock data without requiring backend integration, ensuring rapid development and demonstration capabilities.

## Architecture

### System Integration
The EMS Upstream Optimisation leverages the existing Plant4.0 architecture:

- **Multi-tenant Context**: Extends the current tenant system with "GulfUpstream Demo" tenant
- **Navigation Hierarchy**: Utilizes existing Energy (EMS) feature area with 5 feature sets
- **Component Reuse**: Leverages existing UI components (KPICard, StatusBadge, layout components)
- **Mock Data System**: Extends the current mock data approach in `/src/data/mockData.ts`

### Feature Set Organization
The implementation extends the existing Energy (EMS) feature area with upstream-specific content:

1. **Energy Monitoring & Metering** - Real-time consumption tracking
2. **Energy Analytics & Optimisation** - Load profiling and forecasting
3. **Sustainability & Emissions Tracking** - Carbon emissions calculation
4. **Energy Control Advisory & Integration** - Asset energy mode recommendations
5. **Energy Dashboards & Reporting** - Cost analysis and reporting

### Tenant Context Extension
The upstream tenant context provides:
- Sector metadata: "Oil & Gas"
- Subsector metadata: "Upstream"
- Industry-specific energy meters and assets
- Upstream-specific telemetry and baselines

## Components and Interfaces

### Data Models

#### Upstream Energy Meter
```typescript
interface UpstreamEnergyMeter {
  id: string;
  name: string;
  scope: string; // "Pad A", "Central Facility", "Camp / Common Services"
  energyTypes: string[]; // ["electricity", "gas", "diesel"]
  linkedAssets: string[];
  currentKW: number;
  status: "Normal" | "High" | "Critical";
}
```

#### Energy Telemetry
```typescript
interface EnergyTelemetry {
  meterId: string;
  timestamp: string[];
  kWh: number[];
  kW: number[];
}
```

#### Energy Baseline
```typescript
interface EnergyBaseline {
  meterId: string;
  baselineKWhPerDay: number;
  baselineKWhPerBBL?: number; // kWh per barrel produced
  baselineKWhPerMSCF?: number; // kWh per thousand standard cubic feet
}
```

#### Tariff and Emission Factors
```typescript
interface UpstreamTariffs {
  electricityUsdPerKWh: number;
  gasUsdPerMMBtu: number;
  dieselUsdPerLitre: number;
}

interface UpstreamEmissionFactors {
  electricityKgCo2PerKWh: number;
  gasKgCo2PerMMBtu: number;
  dieselKgCo2PerLitre: number;
}
```

### UI Components

#### Energy Meter List Item
Displays energy meter information in the ListPane:
- Meter name and scope
- Energy type icons (bolt, flame, droplet)
- Latest kW reading
- Status badge with color coding

#### Energy KPI Cards
Reuses existing KPICard component for:
- Instantaneous demand (kW)
- Daily consumption (kWh)
- Energy cost today (USD)
- CO₂ emissions today (kg CO₂)

#### Time-Series Charts
Utilizes Recharts library for:
- kW demand over 24 hours
- kWh accumulation trends
- Load profile curves
- Forecast visualizations

### Page Components

#### Real-Time Energy Consumption Page
- **ListPane**: Upstream energy meters with filtering
- **WorkPane**: Selected meter details with KPIs and charts
- **Navigation**: Maintains EMS feature hierarchy

#### Load Profiling Page
- **ListPane**: Load profiles by facility
- **WorkPane**: 24-hour curves with peak highlights and forecasts

#### Carbon Emissions Page
- **ListPane**: Emission sources by energy type
- **WorkPane**: CO₂ breakdown and production unit metrics

#### Cost Analysis Page
- **ListPane**: Cost centers and meters
- **WorkPane**: Cost breakdown with visualizations

## Data Models

### Mock Data Extensions

#### Tenant Data
```typescript
// Addition to existing tenants array
{
  id: "t-upstream",
  name: "GulfUpstream Demo",
  industry: "Oil & Gas – Upstream"
}
```

#### Asset Extensions
Existing upstream assets (from APM spec) extended with energy attributes:
```typescript
// Extensions to existing Asset interface
interface Asset {
  // ... existing fields
  energyConsumer?: boolean;
  primaryEnergyType?: "electricity" | "gas" | "diesel" | "steam";
  nominalPowerKw?: number;
  energyCostCenter?: string;
}
```

#### Energy Meter Data
```typescript
export const upstreamEnergyMeters: UpstreamEnergyMeter[] = [
  {
    id: "em-wh-01",
    name: "Wellpad A Feeder Meter",
    scope: "Pad A",
    energyTypes: ["electricity"],
    linkedAssets: ["WH-01", "ESP-07", "P-21"],
    currentKW: 145.2,
    status: "Normal"
  },
  {
    id: "em-gc-11",
    name: "Compressor Station Meter",
    scope: "Central Facility",
    energyTypes: ["electricity", "gas"],
    linkedAssets: ["GC-11", "KO-03"],
    currentKW: 892.7,
    status: "High"
  },
  {
    id: "em-camp",
    name: "Camp & Utilities Meter",
    scope: "Camp / Common Services",
    energyTypes: ["electricity"],
    linkedAssets: [],
    currentKW: 67.3,
    status: "Normal"
  }
];
```

#### Telemetry Data Structure
```typescript
export const upstreamEnergyTelemetry: Record<string, EnergyTelemetry> = {
  "em-wh-01": {
    meterId: "em-wh-01",
    timestamp: [/* 24 hours of ISO strings */],
    kWh: [/* cumulative kWh values */],
    kW: [/* instantaneous kW values */]
  }
  // ... additional meters
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After reviewing all properties identified in the prework analysis, several redundancies were identified:

- Properties 2.1, 2.2, 2.3 (specific meter displays) can be consolidated into a single property about meter data display
- Properties 3.2, 3.3, 3.4 (meter detail displays) can be combined into a comprehensive meter details property
- Properties 8.1, 8.2, 8.3, 8.4, 8.5 (energy data displays) can be consolidated into properties about energy data completeness
- Properties 10.2, 10.3, 10.4, 10.5 (visual consistency) can be combined into comprehensive UI consistency properties

The following properties represent the unique validation requirements after removing redundancy:

Property 1: Tenant filtering consistency
*For any* tenant selection, all energy data displayed should belong only to that tenant's scope
**Validates: Requirements 1.2, 1.4**

Property 2: Energy meter data completeness
*For any* energy meter displayed, it should include name, scope, energy types, linked assets count, current kW reading, and status badge
**Validates: Requirements 2.4, 2.5**

Property 3: Meter selection data display
*For any* selected energy meter, the system should display instantaneous demand, daily consumption, energy cost, CO₂ emissions, and time-series charts
**Validates: Requirements 3.2, 3.3, 3.4**

Property 4: Load profile analytics completeness
*For any* load profile, the system should display 24-hour curves, peak highlights, forecast charts, peak demand, and load factor
**Validates: Requirements 4.2, 4.3, 4.4**

Property 5: Emissions calculation accuracy
*For any* energy consumption data and emission factors, CO₂ emissions should equal consumption multiplied by appropriate emission factors
**Validates: Requirements 5.2**

Property 6: Cost calculation accuracy
*For any* energy consumption data and tariff rates, energy costs should equal consumption multiplied by appropriate tariff rates
**Validates: Requirements 6.2, 6.5**

Property 7: Cost ranking correctness
*For any* set of cost data, the top 3 cost-driving items should be the three highest cost values in descending order
**Validates: Requirements 6.4**

Property 8: Navigation structure preservation
*For any* EMS feature access, the existing feature sets and routing patterns should remain unchanged
**Validates: Requirements 7.1, 7.2**

Property 9: Metadata consistency
*For any* EMS feature under upstream tenant context, sector metadata should be "Oil & Gas" and subsector should be "Upstream"
**Validates: Requirements 1.5, 3.5, 7.3**

Property 10: Page loading reliability
*For any* EMS page under upstream tenant context, the page should load without errors and follow nLVE pattern
**Validates: Requirements 9.3, 9.5**

Property 11: Energy type iconography consistency
*For any* energy type display, electricity should show bolt icon, gas should show flame icon, and diesel should show droplet icon
**Validates: Requirements 10.2**

Property 12: Component reuse consistency
*For any* energy metrics display, the system should use existing KPICard, StatusBadge, and layout components
**Validates: Requirements 10.3**

Property 13: Visual theme consistency
*For any* EMS page, it should follow the same dark theme, typography, and component patterns as other Plant4.0 pages
**Validates: Requirements 10.1, 10.5**

## Error Handling

### Data Validation
- Validate energy meter data structure before rendering
- Handle missing telemetry data gracefully with placeholder messages
- Validate calculation inputs for emissions and cost analysis

### UI Error States
- Display empty states when no meters are available
- Show loading states during data processing
- Handle meter selection errors with user-friendly messages

### Calculation Safeguards
- Prevent division by zero in efficiency calculations
- Validate emission factors and tariff rates before calculations
- Handle missing baseline data with appropriate fallbacks

## Testing Strategy

### Unit Testing
The implementation will include unit tests for:
- Energy meter data filtering and display logic
- Calculation functions for emissions and costs
- Component rendering with various data states
- Navigation and routing behavior

### Property-Based Testing
Property-based tests will be implemented using a suitable TypeScript testing library (such as fast-check) to verify:
- Data filtering consistency across tenant contexts
- Calculation accuracy for emissions and costs
- UI component behavior with generated test data
- Navigation structure preservation

Each property-based test will:
- Run a minimum of 100 iterations for thorough coverage
- Use smart generators that create realistic energy data
- Focus on core business logic rather than UI implementation details
- Validate mathematical relationships and data consistency

The property-based testing approach will ensure the EMS features work correctly across a wide range of input scenarios while maintaining the generic architecture for future sector extensions.