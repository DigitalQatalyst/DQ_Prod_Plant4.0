# Design Document: Upstream O&G Assets

## Overview

This design document describes the implementation of Upstream Oil & Gas (O&G) asset management features for the Plant4.0 industrial platform. The system enables operators to manage wells, wellheads, separators, compressors, flowlines, pipelines, and related equipment through a comprehensive discovery, portfolio management, and connectivity framework.

The implementation follows the existing nLVE (Navigate → List → View → Edit) layout pattern with:
- **MenuPane** (left): Feature hierarchy navigation
- **ListPane** (middle): Lists for current feature
- **WorkPane** (right): Tabbed detail views for selected items
- **PopPane**: Quick view overlays

### Key Design Decisions

1. **Upstream O&G Focus**: All mock data, types, and UI labels are tailored for upstream oil & gas operations (wells, wellheads, separators, pipelines)
2. **Hierarchical Data Model**: Basin → Field → Pad/Platform → Well/Facility → Asset
3. **Protocol Support**: OPC-UA, Modbus-TCP, HART, FF for industrial connectivity
4. **Extensibility**: Types and structures designed to support other sectors in the future

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              AppShell                                    │
├──────────┬──────────────────────────────────────────────────────────────┤
│          │                                                               │
│  MenuPane│                    Content Area                               │
│          │  ┌─────────────────┬─────────────────────────────────────┐   │
│  Feature │  │                 │                                     │   │
│  Areas   │  │    ListPane     │           WorkPane                  │   │
│          │  │                 │                                     │   │
│  ├─Assets│  │  - Asset List   │  - Tabs (Overview, Telemetry, etc.) │   │
│  │ ├─Disc│  │  - Job List     │  - Forms                            │   │
│  │ ├─Port│  │  - Type List    │  - Tables                           │   │
│  │ ├─Cata│  │  - Endpoint List│  - Charts                           │   │
│  │ └─... │  │                 │                                     │   │
│          │  └─────────────────┴─────────────────────────────────────┘   │
│          │                                                               │
│          │  ┌───────────────────────────────────────────────────────┐   │
│          │  │                    PopPane (overlay)                   │   │
│          │  │  Quick views for jobs, endpoints, assets               │   │
│          │  └───────────────────────────────────────────────────────┘   │
└──────────┴──────────────────────────────────────────────────────────────┘
```

### State Management

- **AppContext**: Manages tenant, persona, selected asset, and PopPane state
- **Local State**: Page-specific filters, selections, and form data
- **Mock Data**: Static TypeScript data simulating backend responses

## Components and Interfaces

### Type Definitions (src/types/assets.ts)

```typescript
// Upstream O&G Tenant
interface UpstreamTenant {
  id: string;
  name: string;
  sector: "oil-gas";
  isUpstream: boolean;
}

// Site Hierarchy
interface SiteHierarchy {
  basinId?: string;
  fieldId?: string;
  padId?: string;
  facilityId?: string;
  wellId?: string;
}

interface Basin { id: string; name: string; tenantId: string; }
interface Field { id: string; name: string; basinId: string; }
interface Pad { id: string; name: string; fieldId: string; type: "pad" | "platform"; }
interface Facility { id: string; name: string; padId: string; }
interface Well { id: string; name: string; padId: string; wellType: "producer" | "injector"; }

// Asset
type AssetRole = "fixed" | "mobile" | "linear" | "networkNode";
type HazardousAreaClass = "Zone 0" | "Zone 1" | "Zone 2" | "Non-hazardous";
type Criticality = "Low" | "Medium" | "High";
type AssetStatus = "active" | "maintenance" | "shut-in" | "retired" | "planned";

interface UpstreamAsset {
  id: string;
  name: string;
  typeId: string;
  status: AssetStatus;
  tenantId: string;
  hierarchyIds: SiteHierarchy;
  role: AssetRole;
  geoLocation?: { lat: number; lng: number; zoneId?: string };
  hazardousAreaClass?: HazardousAreaClass;
  criticality?: Criticality;
  productionContext?: {
    wellType?: "producer" | "injector";
    fluid?: "oil" | "gas" | "condensate" | "water";
  };
}

// Asset Type
type AssetCategory = "well" | "process" | "pipeline" | "electrical" | "instrumentation";

interface UpstreamAssetType {
  id: string;
  name: string;
  category: AssetCategory;
  sectorTags: string[];
  role: AssetRole;
  propertySets: string[];
  defaultTelemetry?: string[];
}

// Property Set
type PropertySetType = "process" | "mechanical" | "electrical" | "safety" | "pipeline";

interface PropertyField {
  id: string;
  label: string;
  dataType: "string" | "number" | "boolean" | "date";
  unit?: string;
  required?: boolean;
}

interface PropertySet {
  id: string;
  name: string;
  type: PropertySetType;
  fields: PropertyField[];
}

// Connectivity
type Protocol = "opc-ua" | "modbus-tcp" | "hart" | "ff" | "mqtt";
type NetworkZone = "IT" | "OT" | "DMZ";

interface ConnectionEndpoint {
  id: string;
  tenantId: string;
  name: string;
  protocol: Protocol;
  address: string;
  port?: number;
  zone?: NetworkZone;
  hazardousArea?: string;
  status: "up" | "down" | "unknown";
  lastSeen?: string;
}

interface DataPoint {
  id: string;
  assetId: string;
  endpointId: string;
  logicalName: string;
  rawAddress: string;
  direction: "input" | "output" | "bidirectional";
  unit?: string;
  dataType?: string;
  protocolMetadata?: Record<string, unknown>;
}

// Discovery
type DiscoveryJobType = "network" | "field" | "pad" | "pipelineSegment";
type DiscoveryJobStatus = "pending" | "running" | "completed" | "failed";

interface DiscoveryJobScope {
  ipRange?: string;
  fieldId?: string;
  padId?: string;
  pipelineId?: string;
}

interface UpstreamDiscoveryJob {
  id: string;
  name: string;
  type: DiscoveryJobType;
  scope: DiscoveryJobScope;
  status: DiscoveryJobStatus;
  foundCount: number;
  lastRunAt?: string;
  errors?: string[];
}

// Discovery Agent
interface DiscoveryAgent {
  id: string;
  name: string;
  type: "rtu-gateway" | "opc-server" | "scada-gateway";
  protocols: Protocol[];
  status: "active" | "inactive" | "error";
  assignedScopes: { fieldId?: string; padId?: string; pipelineId?: string }[];
  lastRun?: string;
}

// Linear Asset (Pipeline/Flowline)
interface LinearAsset extends UpstreamAsset {
  startNodeId: string;
  endNodeId: string;
  length: number;
  lengthUnit: "m" | "km" | "ft" | "mi";
  maop?: number;
  diameter?: number;
  material?: string;
  issues?: { id: string; type: string; description: string; severity: string }[];
}

// Stream Configuration
interface StreamConfig {
  id: string;
  name: string;
  pollingInterval: number;
  retention: string;
  profile: "high-frequency" | "standard" | "low-frequency";
  assetTypes: string[];
}

// Lifecycle State
interface LifecycleState {
  id: string;
  name: string;
  assetCategory: string;
  order: number;
}
```

### Component Structure

```
src/
├── types/
│   └── assets.ts                    # All upstream O&G types
├── data/
│   ├── mockData.ts                  # Updated with upstream data
│   └── upstreamMockData.ts          # Upstream-specific mock data
├── context/
│   └── AppContext.tsx               # Extended for PopPane content types
├── pages/assets/
│   ├── discovery/
│   │   ├── BulkDiscoveryPage.tsx
│   │   ├── DiscoveryAgentsPage.tsx
│   │   ├── ManualAssetCapturePage.tsx
│   │   ├── AssetImportPage.tsx
│   │   └── DiscoveryReviewPage.tsx
│   ├── portfolio/
│   │   ├── AssetPortfolioPage.tsx
│   │   ├── PortfolioExplorerPage.tsx
│   │   ├── SavedViewsPage.tsx
│   │   └── CrossTenantPortfolioPage.tsx
│   ├── catalog/
│   │   ├── AssetCatalogPage.tsx
│   │   ├── PropertySetsPage.tsx
│   │   ├── LifecycleConfigPage.tsx
│   │   └── SectorProfilesPage.tsx
│   ├── connectivity/
│   │   ├── TagMappingPage.tsx
│   │   ├── ConnectionEndpointsPage.tsx
│   │   ├── StreamConfigPage.tsx
│   │   ├── ConnectionHealthPage.tsx
│   │   └── SandboxStreamsPage.tsx
│   ├── detail/
│   │   └── AssetDetailPage.tsx
│   └── location/
│       ├── GeoLocationPage.tsx
│       ├── LinearAssetsPage.tsx
│       ├── NetworkTopologyPage.tsx
│       └── MobileAssetsPage.tsx
└── components/
    └── layout/
        └── PopPane.tsx              # Extended for quick views
```

## Data Models

### Upstream Tenant and Hierarchy

```typescript
// Example tenant
const alphaUpstream: UpstreamTenant = {
  id: "alpha-upstream",
  name: "Alpha Upstream Ltd",
  sector: "oil-gas",
  isUpstream: true
};

// Example hierarchy
const permianBasin: Basin = { id: "basin-1", name: "Permian Basin", tenantId: "alpha-upstream" };
const eagleFordField: Field = { id: "field-1", name: "Eagle Ford Field", basinId: "basin-1" };
const padA: Pad = { id: "pad-1", name: "Pad A", fieldId: "field-1", type: "pad" };
```

### Asset Types for Upstream O&G

| Category | Asset Types |
|----------|-------------|
| Well | Well, Wellhead, Xmas Tree, ESP, Rod Pump |
| Process | Separator, Heater Treater, Compressor, Pump, Tank |
| Pipeline | Flowline Segment, Pipeline Segment, Manifold |
| Instrumentation | RTU, PLC, SIS Logic Solver, Flow Meter |
| Electrical | VFD, MCC, Transformer |

### Property Sets

| Property Set | Type | Fields |
|--------------|------|--------|
| Well Properties | process | reservoir, wellType, targetRate, artificialLiftType |
| Pressure/Temperature Ratings | process | designPressure, designTemp, MAOP |
| Pipeline Design | pipeline | diameter, wallThickness, material, corrosionAllowance |
| Safety/Hazard | safety | hazardousAreaClass, SIL, SISLoopId, inspectionDue |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Discovery Job Tenant Filtering
*For any* tenant and set of discovery jobs, filtering jobs by tenant should return only jobs belonging to that tenant.
**Validates: Requirements 3.1**

### Property 2: Discovery Job State Transitions
*For any* discovery job in "pending" status, running the job should transition it to "running" and then to "completed" or "failed".
**Validates: Requirements 3.3**

### Property 3: Portfolio KPI Aggregation
*For any* set of assets, the portfolio KPIs should correctly count total wells, producing wells, injecting wells, and assets by criticality.
**Validates: Requirements 4.1**

### Property 4: Portfolio Filter Consistency
*For any* combination of filters (field, pad, asset type, criticality), the filtered asset list should contain only assets matching all specified criteria.
**Validates: Requirements 4.2**

### Property 5: Tree Hierarchy Organization
*For any* set of assets with hierarchy IDs, the tree view should organize assets correctly as Basin → Field → Pad/Platform → Well/Facility → Asset.
**Validates: Requirements 4.4**

### Property 6: Asset Type Category Grouping
*For any* set of asset types, grouping by category should produce groups where every type in a group has the same category value.
**Validates: Requirements 5.1**

### Property 7: Tag Mapping Asset Type Filter
*For any* asset type filter applied to tag mapping, only assets of that type should be displayed with their data points.
**Validates: Requirements 6.1**

### Property 8: Asset Detail Field Completeness
*For any* selected asset, the overview tab should display all required fields: type, status, criticality, hierarchy, hazardous area class, role, and production context (if applicable).
**Validates: Requirements 7.3**

### Property 9: Asset Relationship Chain Integrity
*For any* asset with relationships, the relationships tab should display a valid upstream/downstream chain where each connection references existing assets.
**Validates: Requirements 7.5**

### Property 10: Asset Selection Navigation
*For any* asset click in Portfolio, Explorer, or Tag Mapping, the system should set selectedAsset in AppContext and navigate to /assets/detail/selected.
**Validates: Requirements 7.6**

### Property 11: Linear Asset Field Display
*For any* linear asset (flowline or pipeline segment), the display should include start node, end node, length, MAOP, and status.
**Validates: Requirements 8.2**

### Property 12: Network Topology Consistency
*For any* network topology view, all displayed adjacency relationships should reference valid nodes that exist in the node list.
**Validates: Requirements 8.4**

### Property 13: PopPane State Management
*For any* PopPane open/close operation, the nLVE layout should remain intact and the PopPane content should match the requested entity type.
**Validates: Requirements 9.4**

## Error Handling

### Data Loading Errors
- Display error state in ListPane/WorkPane with retry option
- Log errors to console for debugging
- Show user-friendly error messages

### Form Validation Errors
- Inline validation for required fields
- Highlight invalid fields with error messages
- Prevent form submission until valid

### Navigation Errors
- Redirect to 404 page for invalid routes
- Show "Asset not found" message for invalid asset IDs
- Graceful fallback for missing data

### State Management Errors
- Validate AppContext state before operations
- Handle null/undefined selectedAsset gracefully
- Reset PopPane state on navigation

## Testing Strategy

### Property-Based Testing Library
- **fast-check** for TypeScript property-based testing
- Minimum 100 iterations per property test
- Custom generators for upstream O&G domain types

### Unit Tests
- Component rendering tests with React Testing Library
- Hook behavior tests
- Utility function tests

### Property-Based Tests

Each correctness property will be implemented as a property-based test:

```typescript
// Example: Property 4 - Portfolio Filter Consistency
// **Feature: upstream-og-assets, Property 4: Portfolio Filter Consistency**
// **Validates: Requirements 4.2**
fc.assert(
  fc.property(
    assetArbitrary,
    filterArbitrary,
    (assets, filters) => {
      const filtered = filterAssets(assets, filters);
      return filtered.every(asset => 
        (!filters.fieldId || asset.hierarchyIds.fieldId === filters.fieldId) &&
        (!filters.padId || asset.hierarchyIds.padId === filters.padId) &&
        (!filters.typeId || asset.typeId === filters.typeId) &&
        (!filters.criticality || asset.criticality === filters.criticality)
      );
    }
  ),
  { numRuns: 100 }
);
```

### Test File Structure

```
src/
├── __tests__/
│   ├── types/
│   │   └── assets.test.ts           # Type validation tests
│   ├── utils/
│   │   ├── filterAssets.test.ts     # Filter utility tests
│   │   ├── filterAssets.property.test.ts  # Property tests
│   │   └── hierarchyUtils.test.ts   # Hierarchy utility tests
│   └── components/
│       ├── discovery/
│       │   └── BulkDiscoveryPage.test.tsx
│       ├── portfolio/
│       │   └── AssetPortfolioPage.test.tsx
│       └── detail/
│           └── AssetDetailPage.test.tsx
```

### Test Annotations
All property-based tests must include:
- Comment with format: `**Feature: upstream-og-assets, Property {number}: {property_text}**`
- Reference to requirements: `**Validates: Requirements X.Y**`
