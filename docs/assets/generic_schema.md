# Generic Asset Data Schema

## Overview

This document defines a domain-independent schema for asset management systems, derived from analyzing the upstream oil & gas implementation but generalized for any industry vertical.

---

## Core Asset Schema

### 1. Asset Entity
The primary entity representing any physical or logical asset in the system.

```typescript
interface Asset {
  // Identity
  id: string;
  name: string;
  typeId: string; // Reference to AssetType

  // Status & Classification
  status: AssetStatus;
  role: AssetRole;
  criticality?: CriticalityLevel;

  // Organizational Context
  tenantId: string; // Multi-tenant support
  hierarchyIds: HierarchyReference; // Flexible hierarchy placement

  // Location
  geoLocation?: GeoLocation;

  // Safety & Compliance
  hazardClass?: string; // Industry-specific hazard classification

  // Operational Context
  operationalContext?: Record<string, any>; // Domain-specific metadata

  // Metadata
  description?: string;
  tags?: string[];

  // Mobile Asset Specific
  assignedLocation?: LocationAssignment;
  lastKnownLocation?: TrackedLocation;
}
```

#### Key Design Principles
- **Flexible Hierarchy**: `hierarchyIds` allows assets to be placed in any organizational structure.
- **Role-based Classification**: Supports fixed, mobile, linear, and network node assets.
- **Extensible Context**: `operationalContext` provides domain-specific flexibility.
- **Multi-tenant**: Built-in support for isolated tenant data.

---

### 2. Asset Type
Defines categories and templates for assets.

```typescript
interface AssetType {
  id: string;
  name: string;
  category: string; // Domain-specific category
  sectorTags: string[]; // Industry/sector identifiers
  role: AssetRole;

  // Configuration
  propertySets: string[]; // References to PropertySet definitions
  defaultTelemetry?: string[]; // Default data points for this type

  description?: string;
}
```

#### Purpose
- Standardizes asset definitions across the organization.
- Enables templating for rapid asset creation.
- Supports property inheritance and default configurations.

---

### 3. Hierarchy System
Flexible multi-level organizational structure.

```typescript
interface HierarchyReference {
  level1Id?: string; // e.g., Region, Basin, Campus
  level2Id?: string; // e.g., Site, Field, Building
  level3Id?: string; // e.g., Area, Pad, Floor
  level4Id?: string; // e.g., Unit, Well, Room
  level5Id?: string; // e.g., Sub-unit, Equipment Group
}

interface HierarchyNode {
  id: string;
  name: string;
  parentId?: string;
  level: number;
  type: string;
  description?: string;
}
```

#### Flexibility
- Supports arbitrary depth hierarchies.
- Industry-agnostic naming (level1, level2, etc.).
- Can represent: Geographic → Functional → Physical structures.

---

### 4. Property Sets
Extensible metadata framework for assets.

```typescript
interface PropertySet {
  id: string;
  name: string;
  type: PropertySetType;
  fields: PropertyField[];
  description?: string;
}

interface PropertyField {
  id: string;
  label: string;
  dataType: "string" | "number" | "boolean" | "date";
  unit?: string;
  required?: boolean;
  description?: string;
}

type PropertySetType =
  | "technical" // Technical specifications
  | "operational" // Operational parameters
  | "safety" // Safety & compliance
  | "financial" // Cost & depreciation
  | "maintenance"; // Maintenance schedules
```

#### Benefits
- Dynamic schema extension without code changes.
- Industry-specific property definitions.
- Validation and data quality enforcement.

---

### 5. Telemetry & Data Points
Real-time and historical data collection.

```typescript
interface DataPoint {
  id: string;
  assetId: string;
  endpointId: string; // Connection source

  // Naming
  logicalName: string; // Human-readable name
  rawAddress: string; // Protocol-specific address

  // Configuration
  direction: "input" | "output" | "bidirectional";
  unit?: string;
  dataType?: string;

  // Protocol Details
  protocolMetadata?: Record<string, any>;

  description?: string;
}

interface ConnectionEndpoint {
  id: string;
  tenantId: string;
  name: string;

  // Connectivity
  protocol: string; // e.g., "opc-ua", "modbus-tcp", "mqtt", "rest-api"
  address: string;
  port?: number;

  // Network Context
  zone?: string; // Network segmentation
  hazardArea?: string;

  // Status
  status: "up" | "down" | "unknown";
  lastSeen?: string;

  description?: string;
}
```

#### Use Cases
- IoT sensor data collection.
- SCADA/industrial control systems.
- Building management systems.
- Fleet telematics.
- Environmental monitoring.

---

### 6. Linear Assets
Special handling for pipeline, cable, road, or rail assets.

```typescript
interface LinearAsset extends Asset {
  // Topology
  startNodeId: string;
  endNodeId: string;

  // Physical Properties
  length: number;
  lengthUnit: "m" | "km" | "ft" | "mi";

  // Specifications (domain-specific)
  diameter?: number;
  capacity?: number;
  material?: string;

  // Integrity
  issues?: AssetIssue[];
}

interface AssetIssue {
  id: string;
  type: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
}
```

#### Applications
- Pipelines (oil, gas, water, chemicals).
- Power transmission lines.
- Fiber optic cables.
- Roads and railways.
- Conveyor systems.

---

### 7. Network Topology
Relationship mapping between assets.

```typescript
interface TopologyNode {
  id: string;
  assetId: string;
  name: string;
  nodeType: string;
}

interface TopologyEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  connectionType: string; // Domain-specific: "flowline", "electrical", "data", etc.
  assetId?: string; // Optional linear asset representing the connection
}
```

#### Purpose
- Process flow diagrams.
- Electrical distribution networks.
- Supply chain relationships.
- Dependency mapping.

---

### 8. Discovery & Import
Automated asset discovery and bulk import capabilities.

```typescript
interface DiscoveryJob {
  id: string;
  name: string;
  tenantId: string;
  type: string; // Domain-specific: "network", "site", "area"
  scope: Record<string, any>; // Flexible scope definition
  status: "pending" | "running" | "completed" | "failed";
  foundCount: number;
  lastRunAt?: string;
  errors?: string[];
  description?: string;
}

interface DiscoveryAgent {
  id: string;
  name: string;
  tenantId: string;
  type: string; // Agent type: "gateway", "scanner", "api-client"
  protocols: string[];
  status: "active" | "inactive" | "error";
  assignedScopes: Record<string, any>[];
  lastRun?: string;
  description?: string;
}

interface CandidateAsset {
  id: string;
  discoveryJobId: string;
  suggestedName: string;
  suggestedTypeId: string;
  suggestedHierarchy: HierarchyReference;
  matchedExistingAssetId?: string; // For merge scenarios
  confidence: number; // 0.0 to 1.
  status: "pending" | "approved" | "merged" | "rejected";
  rawData?: Record<string, any>;
}

interface AssetImport {
  id: string;
  name: string;
  tenantId: string;
  status: "pending" | "mapping" | "preview" | "completed" | "failed";
  sourceType: string; // "Excel", "CSV", "API", "Database"
  recordCount: number;
  importedCount: number;
  createdAt: string;
  completedAt?: string;
  errors?: string[];
}
```

#### Capabilities
- Network scanning and device discovery.
- Bulk data imports from various sources.
- Intelligent matching and deduplication.
- Review and approval workflows.

---

### 9. Lifecycle Management
Track asset states through their operational lifecycle.

```typescript
interface LifecycleState {
  id: string;
  name: string;
  assetCategory: string;
  order: number;
  description?: string;
}
```

#### Examples by Industry
- **Manufacturing**: Design → Procurement → Installation → Production → Maintenance → Decommission.
- **Real Estate**: Planning → Construction → Occupancy → Renovation → Demolition.
- **IT Assets**: Ordered → Deployed → Active → Maintenance → Retired.
- **Fleet**: Acquired → In Service → Maintenance → Disposed.

---

### 10. Stream Configuration
Data collection and retention policies.

```typescript
interface StreamConfig {
  id: string;
  name: string;
  tenantId: string;

  // Collection
  pollingInterval: number; // Milliseconds
  retention: string; // e.g., "7d", "30d", "1y"
  profile: "high-frequency" | "standard" | "low-frequency";

  // Scope
  assetTypes: string[];

  description?: string;
}
```

#### Use Cases
- **High-frequency**: Critical equipment monitoring (seconds).
- **Standard**: Normal operations (minutes).
- **Low-frequency**: Condition monitoring (hours/days).

---

### 11. Saved Views & Filters
User-defined asset collections and queries.

```typescript
interface SavedView {
  id: string;
  name: string;
  tenantId: string;
  filters: AssetFilter;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface AssetFilter {
  tenantId?: string;
  level1Id?: string; // Hierarchy filters
  level2Id?: string;
  level3Id?: string;
  typeId?: string;
  criticality?: CriticalityLevel;
  status?: AssetStatus;
  hazardClass?: string;
  tags?: string[];
}
```

---

## Enumerations & Common Types

```typescript
type AssetStatus =
  | "active" // Normal operation
  | "maintenance" // Under maintenance
  | "standby" // Ready but not operating
  | "offline" // Not operational
  | "retired" // Permanently out of service
  | "planned"; // Not yet commissioned

type AssetRole =
  | "fixed" // Stationary asset at a location
  | "mobile" // Movable asset (vehicles, portable equipment)
  | "linear" // Linear infrastructure (pipelines, cables)
  | "networkNode"; // Junction or distribution point

type CriticalityLevel =
  | "Low" // Minimal impact if failed
  | "Medium" // Moderate impact
  | "High"; // Critical to operations

interface GeoLocation {
  lat: number;
  lng: number;
  zoneId?: string; // Geographic zone/region
}

interface LocationAssignment {
  level1Id?: string;
  level2Id?: string;
  level3Id?: string;
}

interface TrackedLocation {
  lat: number;
  lng: number;
  timestamp: string;
}
```

---

## Industry Adaptations

### Manufacturing
- **Hierarchy**: Plant → Production Line → Work Center → Machine.
- **Asset Types**: CNC Machine, Robot, Conveyor, Press, Furnace.
- **Telemetry**: Cycle time, throughput, quality metrics, vibration.

### Facilities / Real Estate
- **Hierarchy**: Portfolio → Building → Floor → Zone → Room.
- **Asset Types**: HVAC, Elevator, Lighting, Access Control, Fire System.
- **Telemetry**: Temperature, occupancy, energy consumption, air quality.

### Transportation / Fleet
- **Hierarchy**: Region → Depot → Fleet Type → Vehicle.
- **Asset Types**: Truck, Bus, Rail Car, Aircraft, Vessel.
- **Telemetry**: GPS location, fuel level, engine diagnostics, cargo status.

### Utilities (Power / Water)
- **Hierarchy**: Service Area → Substation → Feeder → Transformer.
- **Asset Types**: Generator, Transformer, Switch, Meter, Pump Station.
- **Telemetry**: Voltage, current, flow rate, pressure, water quality.

### Healthcare
- **Hierarchy**: Health System → Hospital → Department → Room.
- **Asset Types**: MRI, CT Scanner, Ventilator, Infusion Pump, Bed.
- **Telemetry**: Usage hours, maintenance alerts, calibration status.

### Data Centers
- **Hierarchy**: Region → Facility → Hall → Row → Rack.
- **Asset Types**: Server, Storage, Network Switch, PDU, CRAC Unit.
- **Telemetry**: CPU utilization, temperature, power draw, network traffic.

---

## Key Design Patterns

1. **Multi-Tenancy**
   - All entities include `tenantId` for data isolation.
   - Supports SaaS deployments with multiple organizations.

2. **Flexible Hierarchy**
   - Generic level-based hierarchy (level1, level2, etc.).
   - Adaptable to any organizational structure.
   - Supports both geographic and functional hierarchies.

3. **Extensibility**
   - `operationalContext` for domain-specific data.
   - PropertySet system for custom metadata.
   - Tags for flexible categorization.

4. **Temporal Tracking**
   - `createdAt`, `updatedAt` timestamps.
   - `lastSeen`, `lastRun` for connectivity status.
   - Lifecycle state transitions.

5. **Relationship Modeling**
   - Parent-child hierarchies.
   - Network topology (nodes and edges).
   - Linear asset connectivity.

6. **Discovery & Integration**
   - Automated discovery workflows.
   - Bulk import with validation.
   - Candidate review and approval.

---

## Implementation Considerations

### Database Schema
- Use JSONB columns for flexible metadata (`operationalContext`, `protocolMetadata`).
- Index on `tenantId`, `typeId`, `status`, hierarchy IDs.
- Separate tables for time-series telemetry data.
- Consider partitioning by tenant for large deployments.

### API Design
- RESTful endpoints: `/api/assets`, `/api/asset-types`, `/api/hierarchy`.
- GraphQL for complex relationship queries.
- WebSocket/SSE for real-time telemetry streams.
- Bulk operations for imports and updates.

### Security
- Row-level security based on `tenantId`.
- Role-based access control (RBAC) for asset operations.
- Audit logging for all changes.
- Encryption for sensitive property data.

### Performance
- Caching for asset types and property sets.
- Materialized views for common queries.
- Time-series database for telemetry (InfluxDB, TimescaleDB).
- Geospatial indexing for location-based queries.

---

## Summary

This generic asset schema provides:

- **Industry Agnostic**: Adaptable to any vertical market.
- **Scalable**: Multi-tenant with flexible hierarchies.
- **Extensible**: Property sets and operational context.
- **Connected**: Telemetry, topology, and relationships.
- **Discoverable**: Automated discovery and import.
- **Lifecycle Aware**: State management and transitions.
- **Location Aware**: Fixed, mobile, and linear assets.

The schema balances structure with flexibility, providing strong typing for core concepts while allowing domain-specific customization through extensibility points.