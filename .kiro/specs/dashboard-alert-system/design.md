# Design Document

## Overview

The Dashboard & Alert System provides a unified, cross-cutting infrastructure for visualizing metrics and managing operational events across all feature areas of the Plant4.0 platform. The system consists of two primary subsystems:

1. **Dashboard & Widget Engine**: A flexible framework for creating, configuring, and rendering dashboard layouts with reusable widget components
2. **Alert & Incident Management**: A shared model and UI for tracking, responding to, and grouping operational alerts across domains

The design emphasizes:
- **Type Safety**: Comprehensive TypeScript types ensure compile-time correctness
- **Reusability**: Shared components and data models reduce duplication across feature areas
- **Extensibility**: Generic configuration patterns allow new widget types and alert sources without core changes
- **Context Awareness**: Deep integration with AppContext for multi-tenant filtering and navigation state
- **Mock-First**: All functionality demonstrated with static TypeScript data, no backend dependencies

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         AppShell                             │
│  ┌──────────┐  ┌────────────────────────────┐  ┌─────────┐ │
│  │ MenuPane │  │       WorkPane             │  │ PopPane │ │
│  │          │  │  ┌──────────────────────┐  │  │         │ │
│  │ Feature  │  │  │  Dashboard View      │  │  │         │ │
│  │ Nav      │  │  │  - Widget Grid       │  │  │         │ │
│  │          │  │  │  - Widget Components │  │  │         │ │
│  │          │  │  └──────────────────────┘  │  │         │ │
│  │          │  │  ┌──────────────────────┐  │  │         │ │
│  │          │  │  │  Alert View          │  │  │         │ │
│  │          │  │  │  - Alert List        │  │  │         │ │
│  │          │  │  │  - Incident Groups   │  │  │         │ │
│  │          │  │  └──────────────────────┘  │  │         │ │
│  └──────────┘  └────────────────────────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  AppContext   │
                    │  - Tenant     │
                    │  - Persona    │
                    │  - Selection  │
                    └───────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │   Data Layer          │
                │  - dashboardData.ts   │
                │  - alertData.ts       │
                │  - mockData.ts        │
                └───────────────────────┘
```

### Component Hierarchy

```
DashboardView
├── DashboardHeader (title, actions)
├── WidgetGrid (responsive layout)
│   ├── KPIWidget
│   ├── StatusBoardWidget
│   ├── ListWidget
│   ├── TableWidget
│   └── CustomWidget
└── DashboardActions (pin, configure)

AlertView
├── AlertHeader (filters, view toggle)
├── AlertList (when view = "alerts")
│   └── AlertCard[]
├── IncidentList (when view = "incidents")
│   └── IncidentCard[]
│       └── AlertCard[] (related alerts)
└── AlertActions (status change, assign)
```

### Data Flow

1. **Dashboard Rendering**:
   - Route determines feature area context (e.g., `/assets/dashboard`)
   - DashboardView fetches dashboards filtered by feature area and tenant
   - For each dashboard, widgets are fetched by widgetIds
   - Each widget component receives its config and fetches data from mock sources
   - AppContext provides tenant/site filtering for all data queries

2. **Alert Display**:
   - Route determines scope (global `/overview/alerts` or domain `/assets/alerts`)
   - AlertView fetches alerts filtered by feature area (if domain) and tenant
   - User interactions (filter, sort, status change) update local state
   - Alert status changes update the mock data store (simulated persistence)

3. **Cross-Domain Navigation**:
   - "Pin to Overview" adds widget reference to overview dashboard config
   - "Open in Workspace" navigates to feature area route with widget context in URL params
   - React Router maintains navigation history for back button support

## Components and Interfaces

### Core Type Definitions

**File**: `src/types/dashboard.ts`

```typescript
export type FeatureAreaId = 
  | "overview" 
  | "assets" 
  | "security" 
  | "energy" 
  | "automation" 
  | "optimization" 
  | "monitoring" 
  | "settings";

export type WidgetType = 
  | "kpi" 
  | "timeseries" 
  | "table" 
  | "list" 
  | "statusBoard" 
  | "custom";

export interface DashboardScope {
  tenantId?: string;
  siteId?: string;
  streamId?: string;
}

export interface Dashboard {
  id: string;
  name: string;
  featureArea: FeatureAreaId | "cross";
  scope?: DashboardScope;
  widgetIds: string[];
  isGlobal?: boolean;
}

export interface WidgetConfig {
  // Generic config that can be extended by specific widget types
  metricKeys?: string[];
  filters?: Record<string, any>;
  timeRange?: { start: string; end: string };
  displayLimit?: number;
  visualization?: string;
  [key: string]: any; // Allow arbitrary config properties
}

export interface Widget {
  id: string;
  type: WidgetType;
  featureArea: FeatureAreaId | "cross";
  title: string;
  description?: string;
  config: WidgetConfig;
}
```

**File**: `src/types/alert.ts`

```typescript
export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "open" | "acknowledged" | "in-progress" | "closed";

export interface Alert {
  id: string;
  featureArea: FeatureAreaId;
  severity: AlertSeverity;
  status: AlertStatus;
  tenantId: string;
  siteId?: string;
  assetId?: string;
  title: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface Incident {
  id: string;
  featureArea: FeatureAreaId;
  title: string;
  status: AlertStatus;
  severity: AlertSeverity;
  relatedAlertIds: string[];
  tenantId: string;
  siteId?: string;
  createdAt: string;
  updatedAt: string;
  ownerUserId?: string;
}
```

### Component Interfaces

**DashboardView Component**

```typescript
interface DashboardViewProps {
  featureArea?: FeatureAreaId; // undefined = show all/overview
  dashboardId?: string; // specific dashboard or default to first
}

// Usage:
// <DashboardView /> // Overview - all dashboards
// <DashboardView featureArea="assets" /> // Assets dashboards
// <DashboardView featureArea="assets" dashboardId="asset-health" />
```

**WidgetGrid Component**

```typescript
interface WidgetGridProps {
  widgets: Widget[];
  onPinToOverview?: (widgetId: string) => void;
  onOpenInWorkspace?: (widgetId: string) => void;
}
```

**AlertView Component**

```typescript
interface AlertViewProps {
  featureArea?: FeatureAreaId; // undefined = global view
  initialView?: "alerts" | "incidents";
}

// Usage:
// <AlertView /> // Global alerts at /overview/alerts
// <AlertView featureArea="assets" /> // Assets alerts
// <AlertView featureArea="security" initialView="incidents" />
```

**AlertCard Component**

```typescript
interface AlertCardProps {
  alert: Alert;
  onStatusChange: (alertId: string, newStatus: AlertStatus) => void;
  onViewDetails: (alertId: string) => void;
  compact?: boolean; // For display within incidents
}
```

### Widget Component Interfaces

Each widget type implements a common interface:

```typescript
interface BaseWidgetProps {
  widget: Widget;
  onAction?: (action: string, payload: any) => void;
}

// Specific implementations:
// - KPIWidget: Displays single metric with trend
// - StatusBoardWidget: Shows status counts (online/offline, open/closed)
// - ListWidget: Scrollable list of items
// - TableWidget: Sortable table with columns
// - CustomWidget: Extensible for future widget types
```

## Data Models

### Mock Data Structure

**File**: `src/data/dashboardData.ts`

```typescript
export const dashboards: Dashboard[] = [
  {
    id: "main-overview",
    name: "Main Overview",
    featureArea: "cross",
    isGlobal: true,
    widgetIds: ["w-total-assets", "w-alert-summary", "w-energy-today", "w-security-score"]
  },
  {
    id: "alerts-summary",
    name: "Alerts Summary",
    featureArea: "cross",
    isGlobal: true,
    widgetIds: ["w-alerts-by-severity", "w-alerts-by-area", "w-recent-incidents"]
  },
  {
    id: "asset-health",
    name: "Asset Health",
    featureArea: "assets",
    widgetIds: ["w-asset-status", "w-critical-assets", "w-connectivity-health"]
  },
  {
    id: "security-posture",
    name: "Security Posture",
    featureArea: "security",
    widgetIds: ["w-policy-compliance", "w-open-incidents", "w-vulnerability-trend"]
  }
];

export const widgets: Widget[] = [
  {
    id: "w-total-assets",
    type: "kpi",
    featureArea: "assets",
    title: "Total Assets",
    config: {
      metricKey: "totalAssets",
      trend: "+12",
      trendLabel: "vs last month"
    }
  },
  {
    id: "w-alert-summary",
    type: "statusBoard",
    featureArea: "cross",
    title: "Alert Summary",
    config: {
      groupBy: "severity",
      statuses: ["critical", "warning", "info"]
    }
  },
  {
    id: "w-asset-status",
    type: "statusBoard",
    featureArea: "assets",
    title: "Asset Status",
    config: {
      groupBy: "status",
      statuses: ["online", "offline", "maintenance", "pending"]
    }
  },
  {
    id: "w-critical-assets",
    type: "list",
    featureArea: "assets",
    title: "Critical Assets",
    description: "Assets requiring immediate attention",
    config: {
      filters: { criticality: "critical", status: ["offline", "maintenance"] },
      displayLimit: 5,
      columns: ["name", "site", "status", "lastSeen"]
    }
  }
];
```

**File**: `src/data/alertData.ts`

```typescript
export const alerts: Alert[] = [
  {
    id: "alert-001",
    featureArea: "assets",
    severity: "critical",
    status: "open",
    tenantId: "t1",
    siteId: "site-nairobi",
    assetId: "a6",
    title: "Circuit Breaker CB-12 Offline",
    summary: "Circuit breaker has been offline for 2 hours. No heartbeat received.",
    createdAt: "2024-01-15T14:30:00Z",
    updatedAt: "2024-01-15T14:30:00Z",
    tags: ["connectivity", "critical-asset"]
  },
  {
    id: "alert-002",
    featureArea: "security",
    severity: "warning",
    status: "acknowledged",
    tenantId: "t1",
    siteId: "site-nairobi",
    title: "Unauthorized Access Attempt",
    summary: "Multiple failed login attempts detected from IP 192.168.1.45",
    createdAt: "2024-01-15T13:15:00Z",
    updatedAt: "2024-01-15T13:45:00Z",
    tags: ["security", "access-control"]
  },
  {
    id: "alert-003",
    featureArea: "energy",
    severity: "warning",
    status: "in-progress",
    tenantId: "t1",
    siteId: "site-mombasa",
    title: "High Energy Consumption Detected",
    summary: "Energy usage 35% above baseline for the past 4 hours",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T14:00:00Z",
    tags: ["energy", "anomaly"]
  },
  {
    id: "alert-004",
    featureArea: "monitoring",
    severity: "info",
    status: "closed",
    tenantId: "t1",
    assetId: "a3",
    title: "Scheduled Maintenance Completed",
    summary: "Backup Generator BG-1 maintenance completed successfully",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T12:00:00Z",
    tags: ["maintenance", "scheduled"]
  },
  {
    id: "alert-005",
    featureArea: "assets",
    severity: "critical",
    status: "open",
    tenantId: "t2",
    siteId: "site-kericho",
    assetId: "b3",
    title: "Sorting Machine SM-01 Malfunction",
    summary: "Sorting machine has stopped responding. Production line affected.",
    createdAt: "2024-01-15T15:00:00Z",
    updatedAt: "2024-01-15T15:00:00Z",
    tags: ["production", "critical-asset"]
  },
  {
    id: "alert-006",
    featureArea: "security",
    severity: "critical",
    status: "open",
    tenantId: "t3",
    siteId: "site-athi-river",
    title: "Firewall Rule Violation",
    summary: "Unexpected outbound traffic detected on port 4444",
    createdAt: "2024-01-15T14:45:00Z",
    updatedAt: "2024-01-15T14:45:00Z",
    tags: ["security", "network"]
  }
];

export const incidents: Incident[] = [
  {
    id: "incident-001",
    featureArea: "assets",
    title: "Nairobi Substation Power Disruption",
    status: "in-progress",
    severity: "critical",
    relatedAlertIds: ["alert-001"],
    tenantId: "t1",
    siteId: "site-nairobi",
    createdAt: "2024-01-15T14:30:00Z",
    updatedAt: "2024-01-15T15:00:00Z",
    ownerUserId: "user-123"
  },
  {
    id: "incident-002",
    featureArea: "security",
    title: "Security Breach Investigation",
    status: "acknowledged",
    severity: "warning",
    relatedAlertIds: ["alert-002", "alert-006"],
    tenantId: "t1",
    createdAt: "2024-01-15T13:15:00Z",
    updatedAt: "2024-01-15T14:00:00Z"
  }
];
```

### Data Access Patterns

**Filtering by Tenant**:
```typescript
function getAlertsForTenant(tenantId: string): Alert[] {
  return alerts.filter(alert => alert.tenantId === tenantId);
}
```

**Filtering by Feature Area**:
```typescript
function getAlertsForFeatureArea(featureArea: FeatureAreaId, tenantId: string): Alert[] {
  return alerts.filter(
    alert => alert.featureArea === featureArea && alert.tenantId === tenantId
  );
}
```

**Widget Data Resolution**:
```typescript
function getWidgetData(widget: Widget, tenantId: string): any {
  switch (widget.type) {
    case "kpi":
      return calculateKPIValue(widget.config, tenantId);
    case "statusBoard":
      return getStatusCounts(widget.config, tenantId);
    case "list":
      return getFilteredList(widget.config, tenantId);
    // ... other widget types
  }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties were identified as redundant or overlapping:

- **Tenant filtering properties** (2.6, 8.2, 9.2, 13.1-13.4): These all test the same core filtering logic - that data is correctly filtered by tenant context. These can be consolidated into a single comprehensive tenant filtering property.
- **Widget rendering properties** (12.1-12.4): While each widget type is different, they all follow the same pattern of rendering config-driven output. These can be combined into a single property about widget config rendering.
- **Feature area filtering properties** (3.1, 4.1, 9.1): These all test filtering by feature area in different contexts. Can be consolidated into one property.
- **UI rendering properties** (3.3, 5.1, 5.4, 6.1, 8.3, 9.4, 10.2, 11.1): Many of these test that rendered output contains expected elements. These can be grouped by component type rather than having separate properties for each field.

After consolidation, the following unique properties remain:

### Property 1: Tenant filtering consistency
*For any* tenant ID and data collection (dashboards, widgets, alerts, incidents), filtering by that tenant should only return items where the tenantId matches or is undefined (for global items)
**Validates: Requirements 2.6, 8.2, 9.2, 13.1, 13.2, 13.3, 13.4**

### Property 2: Feature area filtering consistency
*For any* feature area and data collection (dashboards, alerts), filtering by that feature area should only return items where the featureArea matches or is "cross" (for cross-domain items)
**Validates: Requirements 3.1, 4.1, 9.1**

### Property 3: Dashboard widget composition
*For any* dashboard, all widgets referenced in widgetIds should exist in the widget collection and be retrievable
**Validates: Requirements 3.2, 4.2**

### Property 4: Pin to overview idempotence
*For any* widget, pinning it to overview multiple times should result in the same state as pinning it once (the widget appears exactly once in the overview dashboard's widgetIds)
**Validates: Requirements 5.2, 5.5**

### Property 5: Widget config preservation during pinning
*For any* widget, after pinning to overview, the widget's configuration should remain identical to its original configuration
**Validates: Requirements 5.3**

### Property 6: Navigation context preservation
*For any* widget with filters in its config, opening in workspace should produce a navigation path that includes those filter parameters
**Validates: Requirements 6.2, 6.3**

### Property 7: Widget config validation
*For any* widget with invalid or missing required config properties, rendering should produce an error state without throwing exceptions
**Validates: Requirements 7.4, 7.5**

### Property 8: Alert sorting correctness
*For any* sort field (severity, createdAt, status, featureArea) and sort direction, the resulting alert list should be correctly ordered according to that field
**Validates: Requirements 8.4**

### Property 9: Alert filtering correctness
*For any* filter criteria (severity, status, featureArea), only alerts matching all specified criteria should be returned
**Validates: Requirements 8.5**

### Property 10: Incident alert grouping
*For any* incident, expanding it should return exactly the alerts whose IDs are in the incident's relatedAlertIds array
**Validates: Requirements 10.3**

### Property 11: Alert status transition validity
*For any* alert, status transitions should follow the valid state machine: open → acknowledged → in-progress → closed, with direct transitions to closed allowed from any state
**Validates: Requirements 11.3, 11.4**

### Property 12: Alert status update consistency
*For any* alert and new status, updating the status should change both the status field and set updatedAt to a timestamp later than the previous updatedAt
**Validates: Requirements 11.2**

### Property 13: Widget data retrieval consistency
*For any* widget, calling getWidgetData should return data that matches the widget's config filters and constraints
**Validates: Requirements 12.5**

### Property 14: Open alert count accuracy
*For any* feature area, the count of open alerts should equal the number of alerts where status is "open" and featureArea matches
**Validates: Requirements 9.5**

### Property 15: Cross-domain incident detection
*For any* incident, if its related alerts span multiple feature areas, the incident should be marked or identifiable as cross-domain
**Validates: Requirements 10.5**

## Error Handling

### Widget Rendering Errors

**Strategy**: Defensive rendering with error boundaries

- Each widget component wrapped in React Error Boundary
- Invalid config → display error state within widget card
- Missing data → display empty state with helpful message
- Network errors (future) → display retry button

**Example Error States**:
```typescript
interface WidgetErrorState {
  type: "config_error" | "data_error" | "render_error";
  message: string;
  widget: Widget;
}
```

### Alert Status Update Errors

**Strategy**: Optimistic updates with rollback

- UI updates immediately (optimistic)
- If update fails, revert to previous state
- Display toast notification on error
- Log error for debugging

**Error Scenarios**:
- Invalid status transition → show validation message
- Concurrent updates → last write wins (for mock data)
- Missing alert → display "Alert not found" message

### Data Filtering Errors

**Strategy**: Fail gracefully with empty results

- Invalid tenant ID → return empty array
- Invalid feature area → return empty array
- Malformed filter criteria → ignore invalid filters, apply valid ones
- Log warnings for debugging

### Navigation Errors

**Strategy**: Fallback to safe routes

- Invalid widget ID in "Open in Workspace" → navigate to feature area home
- Missing feature area → navigate to overview
- Invalid URL params → ignore and use defaults

## Testing Strategy

### Unit Testing

**Framework**: Vitest (already in project)

**Unit Test Coverage**:

1. **Data Filtering Functions**:
   - Test `getDashboardsForTenant()` with various tenant IDs
   - Test `getAlertsForFeatureArea()` with each feature area
   - Test `filterAlertsByCriteria()` with multiple filter combinations
   - Test edge cases: empty arrays, undefined values, null checks

2. **Widget Data Resolution**:
   - Test `getWidgetData()` for each widget type
   - Test with valid and invalid configs
   - Test with missing data sources

3. **Alert Status Transitions**:
   - Test `updateAlertStatus()` with valid transitions
   - Test invalid transitions are rejected
   - Test direct-to-closed from all states

4. **Pin/Unpin Operations**:
   - Test `pinWidgetToOverview()` adds widget ID
   - Test duplicate pinning is prevented
   - Test unpinning removes widget ID

5. **Component Integration**:
   - Test DashboardView renders with mock dashboards
   - Test AlertView renders with mock alerts
   - Test widget components render with various configs

**Example Unit Test**:
```typescript
describe('getDashboardsForTenant', () => {
  it('should return only dashboards for specified tenant', () => {
    const result = getDashboardsForTenant('t1');
    expect(result.every(d => !d.scope || d.scope.tenantId === 't1')).toBe(true);
  });

  it('should include global dashboards', () => {
    const result = getDashboardsForTenant('t1');
    const globalDashboards = result.filter(d => d.isGlobal);
    expect(globalDashboards.length).toBeGreaterThan(0);
  });
});
```

### Property-Based Testing

**Framework**: fast-check (TypeScript property-based testing library)

**Configuration**: Each property test should run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Property Test Coverage**:

Each correctness property from the design document will be implemented as a property-based test. Tests will be tagged with comments explicitly referencing the property they implement.

**Tag Format**: `// Feature: dashboard-alert-system, Property {number}: {property_text}`

**Generator Strategies**:

1. **Tenant ID Generator**: Generate valid tenant IDs from existing mock data
2. **Feature Area Generator**: Generate from FeatureAreaId union type
3. **Alert Generator**: Generate alerts with valid combinations of severity, status, feature area
4. **Dashboard Generator**: Generate dashboards with valid widget references
5. **Widget Generator**: Generate widgets with type-appropriate configs
6. **Filter Criteria Generator**: Generate valid filter objects

**Example Property Test**:
```typescript
import fc from 'fast-check';

// Feature: dashboard-alert-system, Property 1: Tenant filtering consistency
describe('Property 1: Tenant filtering consistency', () => {
  it('should only return items matching tenant or global items', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('t1', 't2', 't3'), // tenant ID generator
        (tenantId) => {
          const dashboards = getDashboardsForTenant(tenantId);
          return dashboards.every(
            d => !d.scope?.tenantId || d.scope.tenantId === tenantId
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: dashboard-alert-system, Property 8: Alert sorting correctness
describe('Property 8: Alert sorting correctness', () => {
  it('should correctly sort alerts by any field', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('severity', 'createdAt', 'status', 'featureArea'),
        fc.constantFrom('asc', 'desc'),
        (sortField, sortDirection) => {
          const sorted = sortAlerts(alerts, sortField, sortDirection);
          // Verify sorted order
          for (let i = 0; i < sorted.length - 1; i++) {
            const comparison = compare(sorted[i][sortField], sorted[i + 1][sortField]);
            if (sortDirection === 'asc') {
              expect(comparison).toBeLessThanOrEqual(0);
            } else {
              expect(comparison).toBeGreaterThanOrEqual(0);
            }
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: dashboard-alert-system, Property 4: Pin to overview idempotence
describe('Property 4: Pin to overview idempotence', () => {
  it('should produce same result when pinning widget multiple times', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...widgets.map(w => w.id)), // widget ID generator
        fc.integer({ min: 1, max: 5 }), // number of pin attempts
        (widgetId, pinCount) => {
          const dashboard = { ...overviewDashboard };
          
          // Pin multiple times
          for (let i = 0; i < pinCount; i++) {
            pinWidgetToOverview(dashboard, widgetId);
          }
          
          // Widget should appear exactly once
          const occurrences = dashboard.widgetIds.filter(id => id === widgetId).length;
          return occurrences === 1;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Scope**: Test component interactions and data flow

1. **Dashboard to Widget Flow**:
   - Load dashboard → fetch widgets → render each widget
   - Verify all widgets receive correct props
   - Verify tenant context is applied throughout

2. **Alert Status Update Flow**:
   - Display alert → change status → verify UI updates
   - Verify updatedAt timestamp changes
   - Verify status change persists in mock data

3. **Pin to Overview Flow**:
   - View domain dashboard → pin widget → navigate to overview
   - Verify widget appears in overview
   - Verify widget retains original config

4. **Open in Workspace Flow**:
   - View overview widget → open in workspace → verify navigation
   - Verify context is preserved
   - Verify correct feature area is displayed

### Test Data Management

**Strategy**: Use dedicated test fixtures separate from UI mock data

- Create `src/data/__tests__/fixtures.ts` with test-specific data
- Keep test data minimal and focused on test scenarios
- Use factory functions to generate test data with variations
- Reset test data between tests to ensure isolation

**Example Test Fixture**:
```typescript
export function createTestDashboard(overrides?: Partial<Dashboard>): Dashboard {
  return {
    id: 'test-dashboard-1',
    name: 'Test Dashboard',
    featureArea: 'assets',
    widgetIds: ['w1', 'w2'],
    isGlobal: false,
    ...overrides
  };
}

export function createTestAlert(overrides?: Partial<Alert>): Alert {
  return {
    id: 'test-alert-1',
    featureArea: 'assets',
    severity: 'warning',
    status: 'open',
    tenantId: 't1',
    title: 'Test Alert',
    summary: 'Test alert summary',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    ...overrides
  };
}
```

## Implementation Notes

### File Structure

```
src/
├── types/
│   ├── dashboard.ts          # Dashboard, Widget, WidgetConfig types
│   └── alert.ts              # Alert, Incident, severity/status types
├── data/
│   ├── dashboardData.ts      # Mock dashboards and widgets
│   ├── alertData.ts          # Mock alerts and incidents
│   └── __tests__/
│       └── fixtures.ts       # Test data factories
├── lib/
│   ├── dashboardUtils.ts     # Filtering, sorting, data access
│   ├── alertUtils.ts         # Alert filtering, status updates
│   └── widgetDataResolvers.ts # Widget data fetching logic
├── components/
│   ├── dashboard/
│   │   ├── DashboardView.tsx
│   │   ├── WidgetGrid.tsx
│   │   ├── widgets/
│   │   │   ├── KPIWidget.tsx
│   │   │   ├── StatusBoardWidget.tsx
│   │   │   ├── ListWidget.tsx
│   │   │   ├── TableWidget.tsx
│   │   │   └── WidgetErrorBoundary.tsx
│   │   └── __tests__/
│   │       ├── DashboardView.test.tsx
│   │       └── widgets.test.tsx
│   └── alerts/
│       ├── AlertView.tsx
│       ├── AlertList.tsx
│       ├── AlertCard.tsx
│       ├── IncidentList.tsx
│       ├── IncidentCard.tsx
│       └── __tests__/
│           ├── AlertView.test.tsx
│           └── AlertCard.test.tsx
└── pages/
    ├── overview/
    │   ├── OverviewDashboard.tsx
    │   └── OverviewAlerts.tsx
    └── [feature-area]/
        ├── [FeatureArea]Dashboard.tsx
        └── [FeatureArea]Alerts.tsx
```

### Integration with Existing Code

1. **AppContext Extension**:
   - No changes needed to AppContext interface
   - Use existing `currentTenant` for filtering
   - Use existing `selectedAsset` for asset-specific alerts

2. **Navigation Integration**:
   - Add dashboard routes to `src/data/navigation.ts`
   - Add alert routes to each feature area's feature set
   - Update `App.tsx` with new routes

3. **Component Reuse**:
   - Use existing `Card`, `Badge`, `Button` from shadcn/ui
   - Use existing `StatusBadge` for alert severity
   - Use existing `KPICard` as reference for KPIWidget
   - Use existing layout components (WorkPane, ListPane)

4. **Styling Consistency**:
   - Follow existing Tailwind patterns
   - Use existing color scheme for severity levels
   - Match existing spacing and typography

### Performance Considerations

1. **Memoization**:
   - Memoize filtered dashboard/alert lists with `useMemo`
   - Memoize widget data resolution to avoid recalculation
   - Use `React.memo` for widget components

2. **Lazy Loading**:
   - Consider lazy loading widget components if many types
   - Lazy load alert details on expansion

3. **Virtual Scrolling**:
   - If alert lists grow large, consider react-virtual
   - Not needed for initial implementation with mock data

### Accessibility

1. **Keyboard Navigation**:
   - All interactive elements keyboard accessible
   - Tab order follows visual layout
   - Enter/Space activate buttons

2. **Screen Readers**:
   - Proper ARIA labels on all controls
   - Alert severity announced
   - Status changes announced

3. **Visual Indicators**:
   - Color not sole indicator of severity (use icons)
   - Sufficient contrast ratios
   - Focus indicators visible

### Future Extensibility

1. **Backend Integration**:
   - Replace mock data functions with API calls
   - Add loading states
   - Add error handling for network failures
   - Add optimistic updates with rollback

2. **Real-time Updates**:
   - WebSocket integration for live alerts
   - Dashboard auto-refresh
   - Notification system for critical alerts

3. **User Customization**:
   - Save dashboard layouts per user
   - Custom widget configurations
   - Personalized alert filters

4. **Advanced Features**:
   - Dashboard templates
   - Widget marketplace
   - Alert rules engine
   - Incident workflows
