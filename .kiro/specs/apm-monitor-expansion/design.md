# Design Document

## Overview

This design document outlines the technical approach for expanding the Monitor (APM) section with five comprehensive Feature Sets containing 25 total features. The implementation will extend the existing navigation data structure, add route configurations, and create placeholder page components following the established Plant4.0 patterns.

The solution leverages the existing architecture:
- Navigation data structure in `src/data/navigation.ts`
- Type definitions in `src/types/navigation.ts`
- Route configuration in `src/App.tsx`
- Placeholder page pattern in `src/pages/ShellPage.tsx`
- Sidebar rendering in `src/components/layout/MenuPane.tsx`

## Architecture

### Component Hierarchy

```
AppShell
├── TopBar
├── MenuPane (Sidebar)
│   └── Navigation Items (from featureAreas data)
│       └── Monitor (APM) Feature Area
│           ├── Asset Performance (existing)
│           ├── Asset Health & Diagnostics (new)
│           ├── Predictive & Prescriptive Maintenance (new)
│           ├── Asset Performance & Utilisation (new)
│           ├── Asset Inventory & Criticality (new)
│           └── Alerts, Reports & Visualisation (new)
└── Main Content Area
    └── Router
        └── Placeholder Pages (ShellPage components)
```

### Data Flow

1. Navigation data defined in `featureAreas` array
2. MenuPane component reads and renders navigation hierarchy
3. User clicks feature → React Router navigates to path
4. Route matches → Renders corresponding ShellPage component
5. ShellPage displays placeholder content with LVE pattern



## Components and Interfaces

### Navigation Data Structure

The navigation data follows the existing TypeScript interfaces:

```typescript
interface Feature {
  id: string;           // Unique identifier (kebab-case)
  name: string;         // Display name
  path: string;         // Route path
  icon?: LucideIcon;    // Optional icon component
  description?: string; // Optional description
}

interface FeatureSet {
  id: string;           // Unique identifier (kebab-case)
  name: string;         // Display name
  features: Feature[];  // Array of features
  icon?: LucideIcon;    // Optional icon component
}

interface FeatureArea {
  id: string;           // "monitor"
  name: string;         // "Monitor (APM)"
  shortName?: string;   // "Monitor"
  featureSets: FeatureSet[];
  icon: LucideIcon;     // Activity icon
}
```

### Placeholder Page Component

All new features will use the existing `ShellPage` component pattern:

```typescript
interface ShellPageProps {
  title: string;        // Feature name
  subtitle: string;     // Feature Set name
  listTitle: string;    // List pane header
  icon: LucideIcon;     // Feature icon
  items: ShellItem[];   // Mock data items
  description: string;  // Feature description
}
```



## Data Models

### Feature Set Definitions

#### 1. Asset Health & Diagnostics
- **ID**: `health-diagnostics`
- **Icon**: `HeartPulse` (represents health monitoring)
- **Features**:
  - Real-time Condition Monitoring → `/monitor/health-diagnostics/condition-monitoring`
  - Asset Health Scoring / Index → `/monitor/health-diagnostics/health-scoring`
  - Anomaly & Fault Detection → `/monitor/health-diagnostics/anomaly-detection`
  - Root-cause Diagnostics → `/monitor/health-diagnostics/root-cause`
  - Degradation Trend Analysis → `/monitor/health-diagnostics/degradation-trends`

#### 2. Predictive & Prescriptive Maintenance
- **ID**: `predictive-maintenance`
- **Icon**: `Brain` (represents ML/intelligence)
- **Features**:
  - Machine-learning Failure Prediction → `/monitor/predictive-maintenance/failure-prediction`
  - Remaining Useful Life (RUL) Estimation → `/monitor/predictive-maintenance/rul-estimation`
  - Condition-based Maintenance Triggers → `/monitor/predictive-maintenance/cbm-triggers`
  - Prescriptive Maintenance Recommendations → `/monitor/predictive-maintenance/recommendations`
  - Maintenance Priority & Risk Scoring → `/monitor/predictive-maintenance/priority-scoring`

#### 3. Asset Performance & Utilisation
- **ID**: `performance-utilisation`
- **Icon**: `TrendingUp` (represents performance metrics)
- **Features**:
  - Uptime & Downtime Tracking → `/monitor/performance-utilisation/uptime-tracking`
  - Utilisation & Load Monitoring → `/monitor/performance-utilisation/utilisation-monitoring`
  - Performance Deviation Detection → `/monitor/performance-utilisation/deviation-detection`
  - Benchmarking of Asset Performance → `/monitor/performance-utilisation/benchmarking`
  - Availability / Reliability KPIs (A/R/M) → `/monitor/performance-utilisation/arm-kpis`

#### 4. Asset Inventory & Criticality
- **ID**: `inventory-criticality`
- **Icon**: `Database` (represents inventory/registry)
- **Features**:
  - Asset Registry & Hierarchy → `/monitor/inventory-criticality/registry`
  - Criticality Scoring → `/monitor/inventory-criticality/criticality-scoring`
  - Failure Mode Mapping (FMEA/FMECA) → `/monitor/inventory-criticality/failure-modes`
  - Lifecycle Stage Tracking → `/monitor/inventory-criticality/lifecycle-tracking`
  - Spare-Part Linkage & Metadata → `/monitor/inventory-criticality/spare-parts`

#### 5. Alerts, Reports & Visualisation
- **ID**: `alerts-reports`
- **Icon**: `FileBarChart` (represents reports and analytics)
- **Features**:
  - Real-time Alerts & Severity Levels → `/monitor/alerts-reports/realtime-alerts`
  - Event / Alert History Timeline → `/monitor/alerts-reports/alert-history`
  - Custom Dashboards → `/monitor/alerts-reports/custom-dashboards`
  - Automated Reliability Reports → `/monitor/alerts-reports/reliability-reports`
  - Data Export (PDF, CSV, APIs) → `/monitor/alerts-reports/data-export`



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Feature navigation triggers correct route

*For any* feature in the Monitor APM Feature Sets, when a user clicks that feature in the sidebar, the application should navigate to the path specified in the feature's data definition.
**Validates: Requirements 1.3, 2.3, 3.3, 4.3, 5.3**

### Property 2: Feature routes render placeholder pages

*For any* feature path in the new APM Feature Sets, when a user navigates to that path, the application should render a ShellPage component with appropriate props.
**Validates: Requirements 1.4, 2.4, 3.4, 4.4, 5.4, 8.1**

### Property 3: Icon styling consistency

*For any* new Feature Set or Feature rendered in the sidebar, the icon styling classes should match the pattern used by existing navigation items.
**Validates: Requirements 6.1**

### Property 4: Indentation consistency

*For any* new Feature Set or Feature rendered in the sidebar, the indentation level (margin/padding classes) should match the pattern used by existing navigation items at the same hierarchy level.
**Validates: Requirements 6.2**

### Property 5: Typography consistency

*For any* new Feature Set or Feature rendered in the sidebar, the text sizing and font weight classes should match the pattern used by existing navigation items at the same hierarchy level.
**Validates: Requirements 6.3**

### Property 6: Hover state consistency

*For any* new Feature Set or Feature rendered in the sidebar, the hover state styling classes should match the pattern used by existing navigation items.
**Validates: Requirements 6.4**

### Property 7: Active state consistency

*For any* new Feature rendered in the sidebar, when that feature is selected, the active state styling classes should match the pattern used by existing navigation items.
**Validates: Requirements 6.5**

### Property 8: URL pattern consistency

*For any* new feature path defined in the navigation data, the path should follow the pattern `/monitor/{feature-set-id}/{feature-id}` where both IDs are in kebab-case.
**Validates: Requirements 7.3**

### Property 9: ShellPage component pattern

*For any* new placeholder page component, it should use the ShellPage component with all required props (title, subtitle, listTitle, icon, items, description).
**Validates: Requirements 7.4**

### Property 10: Route completeness

*For any* feature defined in the Monitor APM navigation data, there should exist a corresponding route definition in the router configuration that maps the feature's path to a page component.
**Validates: Requirements 7.5**

### Property 11: Placeholder messaging

*For any* new APM feature page, the Overview tab content should contain the text "Coming in Stage 03".
**Validates: Requirements 8.2**

### Property 12: ListPane presence

*For any* new APM feature page, the rendered output should include a ListPane component.
**Validates: Requirements 8.3**

### Property 13: WorkPane with standard tabs

*For any* new APM feature page, the rendered output should include a WorkPane component with tabs for Overview, Details, and Settings.
**Validates: Requirements 8.4**

### Property 14: Icon consistency between navigation and page

*For any* new APM feature, the icon used in the page component should match the icon specified in the navigation data for that feature.
**Validates: Requirements 8.5**



## Error Handling

### Navigation Errors

- **Missing Route**: If a feature path is defined in navigation data but no route exists, React Router will render the NotFound component
- **Invalid Path**: If a user manually enters an invalid path, the catch-all route will display the NotFound page
- **Component Load Failure**: If a page component fails to load, React's error boundary should catch and display an error

### Data Validation

- **TypeScript Type Safety**: All navigation data must conform to the defined interfaces (FeatureArea, FeatureSet, Feature)
- **Build-time Validation**: TypeScript compiler will catch type mismatches before runtime
- **Missing Icons**: If an icon import is missing, the build will fail with a clear error message

### Runtime Errors

- **Navigation State**: MenuPane component maintains expanded state in React state; if state becomes inconsistent, component will re-render with default state
- **Router Errors**: React Router handles navigation errors gracefully by maintaining current location if navigation fails



## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and integration points:

1. **Navigation Data Structure**
   - Verify Monitor Feature Area contains exactly 6 Feature Sets (1 existing + 5 new)
   - Verify each new Feature Set contains exactly 5 features
   - Verify all Feature Set IDs are unique
   - Verify all Feature IDs are unique within their Feature Set

2. **Route Configuration**
   - Verify all 25 new feature paths have corresponding route definitions
   - Verify routes map to correct page components
   - Verify route paths match navigation data paths

3. **Page Components**
   - Verify each placeholder page component exports correctly
   - Verify each page component receives correct props
   - Verify each page component renders without errors

4. **Icon Imports**
   - Verify all required Lucide icons are imported
   - Verify icons are correctly assigned to Feature Sets and Features

### Property-Based Testing

Property-based tests will verify universal behaviors across all inputs using **fast-check** (JavaScript/TypeScript PBT library). Each test will run a minimum of 100 iterations.

1. **Property 1: Feature navigation triggers correct route**
   - Generate: Random feature from new APM Feature Sets
   - Test: Clicking feature navigates to feature.path
   - **Feature: apm-monitor-expansion, Property 1: Feature navigation triggers correct route**

2. **Property 2: Feature routes render placeholder pages**
   - Generate: Random feature path from new APM features
   - Test: Navigating to path renders ShellPage component
   - **Feature: apm-monitor-expansion, Property 2: Feature routes render placeholder pages**

3. **Property 8: URL pattern consistency**
   - Generate: All new feature paths
   - Test: Each path matches `/monitor/{feature-set-id}/{feature-id}` pattern with kebab-case IDs
   - **Feature: apm-monitor-expansion, Property 8: URL pattern consistency**

4. **Property 10: Route completeness**
   - Generate: All features from Monitor APM navigation data
   - Test: Each feature.path has a corresponding route in router configuration
   - **Feature: apm-monitor-expansion, Property 10: Route completeness**

### Integration Testing

Integration tests will verify the complete user flow:

1. **End-to-End Navigation Flow**
   - Expand Monitor section
   - Expand each new Feature Set
   - Click each feature
   - Verify correct page loads
   - Verify page displays placeholder content

2. **Visual Consistency**
   - Compare rendered sidebar items with existing items
   - Verify CSS classes match expected patterns
   - Verify hover and active states work correctly

### Manual Testing Checklist

- [ ] All 5 new Feature Sets appear under Monitor section
- [ ] Each Feature Set expands to show 5 features
- [ ] All 25 features are clickable and navigate correctly
- [ ] All placeholder pages display "Coming in Stage 03" message
- [ ] Sidebar styling matches existing items (icons, spacing, colors)
- [ ] Hover states work on all new items
- [ ] Active states work when features are selected
- [ ] Browser back/forward buttons work correctly
- [ ] Direct URL navigation works for all new routes

