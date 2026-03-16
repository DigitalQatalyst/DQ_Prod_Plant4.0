# Design Document

## Overview

This design implements a comprehensive Energy Management System (EMS) section in the Plant4.0 Platform sidebar navigation. The implementation adds a new top-level Feature Area called "Energy (EMS)" with five Feature Sets, each containing multiple Features. The design follows the existing navigation architecture pattern used throughout the application, ensuring consistency in structure, styling, and behavior.

The implementation involves:
1. Extending the navigation data structure with EMS Feature Area, Feature Sets, and Features
2. Adding route definitions for all 25 EMS feature pages
3. Creating placeholder page components for each EMS feature
4. Ensuring proper icon selection and visual consistency

## Architecture

### Component Structure

The EMS navigation follows the existing three-tier hierarchy:

```
Feature Area (Energy (EMS))
  └── Feature Set (e.g., Energy Monitoring & Metering)
      └── Feature (e.g., Real-time Energy Consumption)
```

### Data Flow

1. Navigation data is defined in `src/data/navigation.ts` as a structured array
2. The `MenuPane` component reads this data and renders the hierarchical navigation
3. User interactions (clicks, expansions) update local state in `MenuPane`
4. React Router handles navigation to feature pages
5. Placeholder pages render based on the current route

### File Structure

```
src/
├── data/
│   └── navigation.ts          # Add EMS Feature Area definition
├── components/
│   └── layout/
│       └── MenuPane.tsx       # No changes needed (data-driven)
├── pages/
│   └── ShellPage.tsx          # Add EMS placeholder page components
└── App.tsx                    # Add EMS route definitions
```

## Components and Interfaces

### Navigation Data Structure

The existing `FeatureArea`, `FeatureSet`, and `Feature` interfaces in `src/types/navigation.ts` already support the required structure. No interface changes are needed.

```typescript
// Existing interfaces (no changes)
interface Feature {
  id: string;
  name: string;
  path: string;
  icon?: LucideIcon;
  description?: string;
}

interface FeatureSet {
  id: string;
  name: string;
  features: Feature[];
  icon?: LucideIcon;
}

interface FeatureArea {
  id: string;
  name: string;
  shortName?: string;
  featureSets: FeatureSet[];
  icon: LucideIcon;
}
```

### EMS Feature Area Definition

Add a new Feature Area object to the `featureAreas` array in `src/data/navigation.ts`:

```typescript
{
  id: "energy-ems",
  name: "Energy (EMS)",
  shortName: "Energy",
  icon: Zap, // or Battery, BatteryCharging
  featureSets: [
    {
      id: "monitoring-metering",
      name: "Energy Monitoring & Metering",
      icon: Gauge,
      features: [
        { id: "real-time", name: "Real-time Energy Consumption", path: "/energy/ems/monitoring/real-time", icon: Activity },
        { id: "sub-metering", name: "Sub-metering by Asset / Process / Line", path: "/energy/ems/monitoring/sub-metering", icon: Network },
        { id: "power-quality", name: "Power Quality Monitoring", path: "/energy/ems/monitoring/power-quality", icon: Zap },
        { id: "baseline-trends", name: "Baseline & Trend Tracking", path: "/energy/ems/monitoring/baseline-trends", icon: TrendingUp },
        { id: "multi-fluid", name: "Multi-fluid Monitoring", path: "/energy/ems/monitoring/multi-fluid", icon: Droplets }
      ]
    },
    {
      id: "analytics-optimisation",
      name: "Energy Analytics & Optimisation",
      icon: LineChart,
      features: [
        { id: "efficiency-kpis", name: "Energy Efficiency KPIs", path: "/energy/ems/analytics/efficiency-kpis", icon: Target },
        { id: "load-profiling", name: "Load Profiling & Forecasting", path: "/energy/ems/analytics/load-profiling", icon: BarChart3 },
        { id: "peak-demand", name: "Peak Demand Management", path: "/energy/ems/analytics/peak-demand", icon: TrendingUp },
        { id: "waste-detection", name: "Energy Waste Detection", path: "/energy/ems/analytics/waste-detection", icon: AlertTriangle },
        { id: "ai-recommendations", name: "AI-driven Optimisation Recommendations", path: "/energy/ems/analytics/ai-recommendations", icon: Sparkles }
      ]
    },
    {
      id: "sustainability-emissions",
      name: "Sustainability & Emissions Tracking",
      icon: Leaf,
      features: [
        { id: "carbon-emissions", name: "Carbon Emissions Calculation", path: "/energy/ems/sustainability/carbon-emissions", icon: Cloud },
        { id: "intensity-metrics", name: "Energy Intensity Metrics", path: "/energy/ems/sustainability/intensity-metrics", icon: BarChart3 },
        { id: "renewable-contribution", name: "Renewable Energy Contribution", path: "/energy/ems/sustainability/renewable-contribution", icon: Sun },
        { id: "esg-sdg-reporting", name: "ESG/SDG-aligned Reporting", path: "/energy/ems/sustainability/esg-sdg-reporting", icon: FileText },
        { id: "compliance-outputs", name: "Environmental Compliance Outputs", path: "/energy/ems/sustainability/compliance-outputs", icon: ClipboardCheck }
      ]
    },
    {
      id: "control-integration",
      name: "Energy Control Advisory & Integration",
      icon: Settings2,
      features: [
        { id: "load-balancing", name: "Load Balancing Advisory", path: "/energy/ems/control/load-balancing", icon: Scale },
        { id: "demand-response", name: "Demand-response Signals", path: "/energy/ems/control/demand-response", icon: Radio },
        { id: "asset-modes", name: "Asset Energy Mode Recommendations", path: "/energy/ems/control/asset-modes", icon: Cpu },
        { id: "integration", name: "Integration with Generators / UPS / Renewables", path: "/energy/ems/control/integration", icon: Plug },
        { id: "efficiency-curves", name: "Efficiency Curve Analysis", path: "/energy/ems/control/efficiency-curves", icon: TrendingUp }
      ]
    },
    {
      id: "dashboards-reporting",
      name: "Energy Dashboards & Reporting",
      icon: LayoutDashboard,
      features: [
        { id: "custom-dashboards", name: "Custom Energy Dashboards", path: "/energy/ems/dashboards/custom", icon: LayoutDashboard },
        { id: "period-comparison", name: "Period-over-period Comparison", path: "/energy/ems/dashboards/period-comparison", icon: Calendar },
        { id: "cost-analysis", name: "Energy Cost Analysis", path: "/energy/ems/dashboards/cost-analysis", icon: DollarSign },
        { id: "anomaly-charts", name: "Anomaly & Outlier Charts", path: "/energy/ems/dashboards/anomaly-charts", icon: AlertCircle },
        { id: "audit-reports", name: "Exportable Audit & Compliance Reports", path: "/energy/ems/dashboards/audit-reports", icon: Download }
      ]
    }
  ]
}
```

### Icon Selection

Icons are selected from the Lucide React library to match the semantic meaning of each feature:

- **Feature Area**: `Zap` (energy/electricity)
- **Monitoring & Metering**: `Gauge`, `Activity`, `Network`, `TrendingUp`, `Droplets`
- **Analytics & Optimisation**: `LineChart`, `Target`, `BarChart3`, `AlertTriangle`, `Sparkles`
- **Sustainability**: `Leaf`, `Cloud`, `Sun`, `FileText`, `ClipboardCheck`
- **Control & Integration**: `Settings2`, `Scale`, `Radio`, `Cpu`, `Plug`
- **Dashboards & Reporting**: `LayoutDashboard`, `Calendar`, `DollarSign`, `AlertCircle`, `Download`

### Placeholder Page Components

Create placeholder page components in `src/pages/ShellPage.tsx` following the existing pattern:

```typescript
// Energy EMS - Monitoring & Metering
export const EMSRealTime = () => <ShellPage title="Real-time Energy Consumption" />;
export const EMSSubMetering = () => <ShellPage title="Sub-metering by Asset / Process / Line" />;
export const EMSPowerQuality = () => <ShellPage title="Power Quality Monitoring" />;
export const EMSBaselineTrends = () => <ShellPage title="Baseline & Trend Tracking" />;
export const EMSMultiFluid = () => <ShellPage title="Multi-fluid Monitoring" />;

// Energy EMS - Analytics & Optimisation
export const EMSEfficiencyKPIs = () => <ShellPage title="Energy Efficiency KPIs" />;
export const EMSLoadProfiling = () => <ShellPage title="Load Profiling & Forecasting" />;
export const EMSPeakDemand = () => <ShellPage title="Peak Demand Management" />;
export const EMSWasteDetection = () => <ShellPage title="Energy Waste Detection" />;
export const EMSAIRecommendations = () => <ShellPage title="AI-driven Optimisation Recommendations" />;

// Energy EMS - Sustainability & Emissions
export const EMSCarbonEmissions = () => <ShellPage title="Carbon Emissions Calculation" />;
export const EMSIntensityMetrics = () => <ShellPage title="Energy Intensity Metrics" />;
export const EMSRenewableContribution = () => <ShellPage title="Renewable Energy Contribution" />;
export const EMSESGSDGReporting = () => <ShellPage title="ESG/SDG-aligned Reporting" />;
export const EMSComplianceOutputs = () => <ShellPage title="Environmental Compliance Outputs" />;

// Energy EMS - Control & Integration
export const EMSLoadBalancing = () => <ShellPage title="Load Balancing Advisory" />;
export const EMSDemandResponse = () => <ShellPage title="Demand-response Signals" />;
export const EMSAssetModes = () => <ShellPage title="Asset Energy Mode Recommendations" />;
export const EMSIntegration = () => <ShellPage title="Integration with Generators / UPS / Renewables" />;
export const EMSEfficiencyCurves = () => <ShellPage title="Efficiency Curve Analysis" />;

// Energy EMS - Dashboards & Reporting
export const EMSCustomDashboards = () => <ShellPage title="Custom Energy Dashboards" />;
export const EMSPeriodComparison = () => <ShellPage title="Period-over-period Comparison" />;
export const EMSCostAnalysis = () => <ShellPage title="Energy Cost Analysis" />;
export const EMSAnomalyCharts = () => <ShellPage title="Anomaly & Outlier Charts" />;
export const EMSAuditReports = () => <ShellPage title="Exportable Audit & Compliance Reports" />;
```

### Route Definitions

Add route definitions in `src/App.tsx`:

```typescript
{/* Energy EMS - Monitoring & Metering */}
<Route path="/energy/ems/monitoring/real-time" element={<EMSRealTime />} />
<Route path="/energy/ems/monitoring/sub-metering" element={<EMSSubMetering />} />
<Route path="/energy/ems/monitoring/power-quality" element={<EMSPowerQuality />} />
<Route path="/energy/ems/monitoring/baseline-trends" element={<EMSBaselineTrends />} />
<Route path="/energy/ems/monitoring/multi-fluid" element={<EMSMultiFluid />} />

{/* Energy EMS - Analytics & Optimisation */}
<Route path="/energy/ems/analytics/efficiency-kpis" element={<EMSEfficiencyKPIs />} />
<Route path="/energy/ems/analytics/load-profiling" element={<EMSLoadProfiling />} />
<Route path="/energy/ems/analytics/peak-demand" element={<EMSPeakDemand />} />
<Route path="/energy/ems/analytics/waste-detection" element={<EMSWasteDetection />} />
<Route path="/energy/ems/analytics/ai-recommendations" element={<EMSAIRecommendations />} />

{/* Energy EMS - Sustainability & Emissions */}
<Route path="/energy/ems/sustainability/carbon-emissions" element={<EMSCarbonEmissions />} />
<Route path="/energy/ems/sustainability/intensity-metrics" element={<EMSIntensityMetrics />} />
<Route path="/energy/ems/sustainability/renewable-contribution" element={<EMSRenewableContribution />} />
<Route path="/energy/ems/sustainability/esg-sdg-reporting" element={<EMSESGSDGReporting />} />
<Route path="/energy/ems/sustainability/compliance-outputs" element={<EMSComplianceOutputs />} />

{/* Energy EMS - Control & Integration */}
<Route path="/energy/ems/control/load-balancing" element={<EMSLoadBalancing />} />
<Route path="/energy/ems/control/demand-response" element={<EMSDemandResponse />} />
<Route path="/energy/ems/control/asset-modes" element={<EMSAssetModes />} />
<Route path="/energy/ems/control/integration" element={<EMSIntegration />} />
<Route path="/energy/ems/control/efficiency-curves" element={<EMSEfficiencyCurves />} />

{/* Energy EMS - Dashboards & Reporting */}
<Route path="/energy/ems/dashboards/custom" element={<EMSCustomDashboards />} />
<Route path="/energy/ems/dashboards/period-comparison" element={<EMSPeriodComparison />} />
<Route path="/energy/ems/dashboards/cost-analysis" element={<EMSCostAnalysis />} />
<Route path="/energy/ems/dashboards/anomaly-charts" element={<EMSAnomalyCharts />} />
<Route path="/energy/ems/dashboards/audit-reports" element={<EMSAuditReports />} />
```

## Data Models

No new data models are required. The implementation uses existing navigation interfaces.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Navigation routing consistency
*For any* EMS feature in the navigation data, clicking that feature should navigate to its defined path
**Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 3.2, 3.3, 3.4, 3.5, 3.6, 4.2, 4.3, 4.4, 4.5, 4.6, 5.2, 5.3, 5.4, 5.5, 5.6, 6.2, 6.3, 6.4, 6.5, 6.6**

### Property 2: Styling consistency with existing navigation
*For any* EMS navigation item (Feature Area, Feature Set, or Feature), the rendered styles (indentation, font, colors, spacing) should match the corresponding styles of non-EMS navigation items at the same hierarchy level
**Validates: Requirements 7.1, 7.2**

### Property 3: Interactive state consistency
*For any* EMS navigation item, the hover and active states should match the hover and active states of non-EMS navigation items at the same hierarchy level
**Validates: Requirements 7.3, 7.5**

### Property 4: Expand/collapse behavior consistency
*For any* EMS Feature Set, the expand/collapse behavior (chevron icons, animations, state management) should match the behavior of non-EMS Feature Sets
**Validates: Requirements 7.4, 10.1**

### Property 5: Icon presence and library consistency
*For any* EMS navigation item (Feature Area, Feature Set, or Feature), if an icon is defined in the navigation data, it should be a valid Lucide icon component
**Validates: Requirements 8.2, 8.3, 8.4**

### Property 6: Placeholder page correctness
*For any* EMS feature path, navigating to that path should render a placeholder page with the feature name as the heading and consistent layout styling
**Validates: Requirements 9.1, 9.2, 9.3**

### Property 7: Auto-expansion on navigation
*For any* EMS feature, when navigating to that feature's path, the "Energy (EMS)" Feature Area and the feature's parent Feature Set should be automatically expanded
**Validates: Requirements 10.2**

### Property 8: Active state highlighting
*For any* EMS feature, when that feature's path matches the current route, the feature should be highlighted with active state styling
**Validates: Requirements 10.3**

## Error Handling

### Navigation Errors

- **Invalid Routes**: If a user manually enters an invalid EMS route, the application's existing 404 handler will catch it and display the NotFound page
- **Missing Icons**: If an icon import fails, React will throw an error during development. All icons should be verified during implementation

### State Management Errors

- **Expansion State**: The MenuPane component manages expansion state locally. If state becomes inconsistent, refreshing the page will reset to default state
- **Route Matching**: The existing route matching logic in MenuPane handles active state detection. No additional error handling is needed

### Data Structure Errors

- **Missing Required Fields**: TypeScript interfaces ensure all required fields (id, name, path) are present at compile time
- **Duplicate IDs**: While not enforced at compile time, unique IDs should be used to prevent navigation conflicts

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and integration points:

1. **Navigation Data Structure**
   - Test that the EMS Feature Area exists in the navigation data
   - Test that each Feature Set has the correct number of features
   - Test that all paths follow the expected pattern `/energy/ems/{category}/{feature}`

2. **Component Rendering**
   - Test that MenuPane renders the EMS Feature Area
   - Test that expanding the Feature Area shows Feature Sets
   - Test that expanding a Feature Set shows Features

3. **Route Configuration**
   - Test that all EMS routes are defined in App.tsx
   - Test that each route renders the correct placeholder component

### Property-Based Testing

Property-based tests will verify universal properties across all EMS navigation items using **fast-check** (JavaScript/TypeScript property-based testing library):

1. **Property 1: Navigation routing consistency**
   - Generate: Random selection of EMS features from navigation data
   - Test: Simulate click and verify navigation to correct path
   - Iterations: 100

2. **Property 2: Styling consistency**
   - Generate: Random EMS navigation items at each hierarchy level
   - Test: Extract computed styles and compare to non-EMS items at same level
   - Iterations: 100

3. **Property 3: Interactive state consistency**
   - Generate: Random EMS navigation items
   - Test: Simulate hover/active and verify styles match non-EMS items
   - Iterations: 100

4. **Property 4: Expand/collapse behavior**
   - Generate: Random EMS Feature Sets
   - Test: Simulate expand/collapse and verify behavior matches non-EMS Feature Sets
   - Iterations: 100

5. **Property 5: Icon presence and library**
   - Generate: All EMS navigation items with icons
   - Test: Verify icon is a valid Lucide component
   - Iterations: 100

6. **Property 6: Placeholder page correctness**
   - Generate: Random EMS feature paths
   - Test: Navigate and verify page heading and layout
   - Iterations: 100

7. **Property 7: Auto-expansion**
   - Generate: Random EMS features
   - Test: Navigate and verify parent Feature Area and Feature Set are expanded
   - Iterations: 100

8. **Property 8: Active state highlighting**
   - Generate: Random EMS features
   - Test: Navigate and verify active state styling is applied
   - Iterations: 100

Each property-based test will be tagged with a comment referencing the design document property:
```typescript
// Feature: ems-sidebar-feature-groups, Property 1: Navigation routing consistency
```

### Integration Testing

Integration tests will verify the complete user flow:

1. User expands "Energy (EMS)" Feature Area
2. User expands a Feature Set
3. User clicks a Feature
4. Application navigates to the correct page
5. Sidebar shows active state on the clicked feature
6. Parent Feature Area and Feature Set remain expanded

### Manual Testing Checklist

- [ ] Verify visual consistency with existing sidebar sections
- [ ] Test keyboard navigation through EMS items
- [ ] Verify responsive behavior if sidebar is collapsible
- [ ] Test with different screen sizes
- [ ] Verify icon rendering quality
- [ ] Test deep linking (direct URL navigation to EMS pages)

## Implementation Notes

### Positioning in Navigation Array

The EMS Feature Area should be inserted after the existing "Energy (EM)" Feature Area in the `featureAreas` array. This maintains logical grouping of energy-related features.

### Icon Imports

All required Lucide icons must be imported at the top of `src/data/navigation.ts`:

```typescript
import {
  // ... existing imports
  Droplets,
  Sparkles,
  Leaf,
  Cloud,
  Sun,
  ClipboardCheck,
  Scale,
  Radio,
  Calendar,
  DollarSign,
  AlertCircle,
  Download,
} from "lucide-react";
```

### Default Expansion State

The MenuPane component's initial `expandedAreas` state should include `"energy-ems"` if we want the EMS section to be expanded by default. Otherwise, it will start collapsed like other sections.

### Placeholder Page Pattern

All placeholder pages follow the same pattern using the `ShellPage` component, which provides consistent layout and styling. No custom implementation is needed for individual pages.

### Future Enhancements

While not part of this implementation, future enhancements could include:

- Adding descriptions to features for tooltip display
- Implementing search/filter functionality for navigation
- Adding badges or indicators for new/beta features
- Implementing user preferences for default expanded sections
- Adding keyboard shortcuts for quick navigation
