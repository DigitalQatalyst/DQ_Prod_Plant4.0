# Requirements Document

## Introduction

This specification defines the implementation of Upstream Oil & Gas (O&G) asset management features for the Plant4.0 industrial platform. The system enables operators to manage wells, wellheads, separators, compressors, flowlines, pipelines, and related equipment through a comprehensive discovery, portfolio management, and connectivity framework. The implementation follows the nLVE (Navigate → List → View → Edit) layout pattern with MenuPane, ListPane, and WorkPane components.

## Glossary

- **nLVE**: Navigate → List → View → Edit layout pattern used throughout the application
- **Upstream O&G**: Oil and Gas operations focused on exploration and production (wells, wellheads, separators, pipelines)
- **Basin**: Top-level geographic region containing oil/gas fields
- **Field**: A geographic area containing multiple pads/platforms and wells
- **Pad/Platform**: A physical location (onshore pad or offshore platform) containing wells and facilities
- **Well**: A borehole drilled to extract hydrocarbons (producer) or inject fluids (injector)
- **Wellhead**: Surface equipment at the top of a well controlling flow
- **Xmas Tree**: Valve assembly on a wellhead for flow control
- **ESP**: Electric Submersible Pump for artificial lift
- **Separator**: Equipment that separates oil, gas, and water
- **Compressor**: Equipment that increases gas pressure
- **Flowline**: Pipe connecting a well to a manifold or facility
- **Pipeline**: Larger pipe for transporting hydrocarbons between facilities
- **RTU**: Remote Terminal Unit for field data acquisition
- **SIS**: Safety Instrumented System
- **MAOP**: Maximum Allowable Operating Pressure
- **Hazardous Area**: Zone classification (Zone 0/1/2) for explosive atmospheres
- **OPC-UA**: Open Platform Communications Unified Architecture protocol
- **Modbus**: Industrial communication protocol
- **HART**: Highway Addressable Remote Transducer protocol
- **DataPoint**: A telemetry tag mapped from field equipment

## Requirements

### Requirement 1: Core Type System and Mock Data

**User Story:** As a developer, I want well-defined TypeScript types and realistic mock data for Upstream O&G assets, so that the application can demonstrate realistic oil and gas operations.

#### Acceptance Criteria

1. WHEN the application loads THEN the System SHALL provide TypeScript types for Tenant, Site hierarchy (Basin, Field, Pad/Platform, Facility), Asset, AssetType, PropertySet, ConnectionEndpoint, DataPoint, and DiscoveryJob
2. WHEN defining an Asset type THEN the System SHALL include fields for id, name, typeId, status, tenantId, hierarchyIds, role, geoLocation, hazardousAreaClass, criticality, and productionContext
3. WHEN defining an AssetType THEN the System SHALL include fields for id, name, category, sectorTags, role, and propertySets
4. WHEN the application initializes THEN the System SHALL seed mock data with at least one Upstream tenant containing basins, fields, pads, wells, separators, compressors, flowlines, pipelines, RTUs, and SIS equipment
5. WHEN seeding mock data THEN the System SHALL include sample ConnectionEndpoints for Modbus and OPC-UA protocols and DataPoints for wellhead pressure, choke position, flow, and temperature

### Requirement 2: Navigation Structure

**User Story:** As a user, I want organized navigation for asset management features, so that I can easily access discovery, portfolio, catalog, connectivity, detail, and location features.

#### Acceptance Criteria

1. WHEN navigating the Assets feature area THEN the System SHALL display six feature sets: Discovery & Onboarding, Portfolio Management, Asset Catalog & Types, Connectivity & Data Points, Asset Detail & Context, and Location/Topology/Linear Assets
2. WHEN viewing Discovery & Onboarding THEN the System SHALL provide routes for bulk discovery, discovery agents, manual asset capture, asset import, and discovery review
3. WHEN viewing Portfolio Management THEN the System SHALL provide routes for portfolio overview, portfolio explorer, saved views, and cross-tenant portfolio
4. WHEN viewing Asset Catalog & Types THEN the System SHALL provide routes for asset types, property sets, lifecycle configuration, and sector profiles
5. WHEN viewing Connectivity & Data Points THEN the System SHALL provide routes for tag mapping, connection endpoints, stream configuration, connection health, and sandbox streams
6. WHEN viewing Location/Topology/Linear Assets THEN the System SHALL provide routes for geo location, linear assets, network topology, and mobile assets

### Requirement 3: Discovery and Onboarding

**User Story:** As an operations engineer, I want to discover and onboard assets from field networks, so that I can populate the asset registry with wells, RTUs, and equipment.

#### Acceptance Criteria

1. WHEN viewing the Bulk Discovery page THEN the System SHALL display a list of DiscoveryJobs filtered by tenant with job type, status, and found count
2. WHEN selecting a discovery job THEN the System SHALL display tabs for Job Overview, Discovered Assets, and Errors/Logs
3. WHEN running a discovery job THEN the System SHALL update the job status from Pending to Running to Completed
4. WHEN viewing the Discovery Agents page THEN the System SHALL display agents like Wellpad RTU Gateway and Platform OPC-UA Server with status and assigned scope
5. WHEN viewing the Manual Asset Capture page THEN the System SHALL provide a form to create assets with identity, hierarchy selection, role, geo location, hazardous area class, and endpoint binding
6. WHEN viewing the Asset Import page THEN the System SHALL provide a stepper for uploading templates, mapping columns, and previewing imports
7. WHEN viewing the Discovery Review page THEN the System SHALL display candidate assets with actions to Approve, Merge, or Reject

### Requirement 4: Portfolio Management

**User Story:** As an asset manager, I want to view and organize assets by field, pad, and well hierarchy, so that I can monitor the upstream portfolio effectively.

#### Acceptance Criteria

1. WHEN viewing the Asset Portfolio Overview THEN the System SHALL display KPIs for total wells, producing vs injecting wells, separators, compressors, and assets by criticality
2. WHEN filtering the portfolio THEN the System SHALL allow filtering by Field, Pad/Platform, asset type, and criticality
3. WHEN viewing the Portfolio Explorer THEN the System SHALL provide Tree, Network, and Map view toggles
4. WHEN using Tree view THEN the System SHALL display hierarchy as Basin → Field → Pad/Platform → Well/Facility → Asset
5. WHEN viewing Saved Views THEN the System SHALL display saved filter presets and allow creating new views with field, pad, asset type, criticality, and hazardous area filters
6. WHEN viewing Cross-Tenant Portfolio THEN the System SHALL display summary statistics across multiple upstream tenants

### Requirement 5: Asset Catalog and Types

**User Story:** As a system administrator, I want to manage asset types and property sets for upstream equipment, so that assets have consistent metadata and telemetry configurations.

#### Acceptance Criteria

1. WHEN viewing the Asset Catalog THEN the System SHALL display asset types grouped by category: Wells, Well equipment, Process equipment, Pipelines/Flowlines, and Instrumentation/Control
2. WHEN selecting an asset type THEN the System SHALL display tabs for Overview, Property Sets, and Default Telemetry
3. WHEN viewing Property Sets THEN the System SHALL display upstream-specific sets including Well Properties, Process Pressure/Temperature, Pipeline Design, and Safety/Hazard
4. WHEN viewing Lifecycle Configuration THEN the System SHALL display upstream lifecycle states for wells (Planned, Drilling, Completing, Producing, Shut-in, P&A) and facilities (Commissioning, Active, Under Maintenance, Mothballed, Decommissioned)
5. WHEN viewing Sector Profiles THEN the System SHALL display Oil & Gas Upstream profile with recommended asset types, property sets, and lifecycle configuration

### Requirement 6: Connectivity and Data Points

**User Story:** As a control systems engineer, I want to configure connections to field equipment and map telemetry tags, so that real-time data flows from wells and facilities.

#### Acceptance Criteria

1. WHEN viewing Tag Mapping THEN the System SHALL display assets filtered by type with their DataPoints including logical name, raw address, protocol, unit, and direction
2. WHEN adding a tag mapping THEN the System SHALL provide a dialog to select logical name, raw address, protocol, unit, and direction
3. WHEN viewing Connection Endpoints THEN the System SHALL display endpoints with address, protocol, zone, hazardous area, and linked assets
4. WHEN viewing Stream Configuration THEN the System SHALL display streams with polling interval, retention, and upstream profile settings
5. WHEN viewing Connection Health THEN the System SHALL display endpoint status (Up/Down), last seen time, and impacted wells/facilities
6. WHEN viewing Sandbox Streams THEN the System SHALL provide toggles to enable simulated well data and pipeline data for demo purposes

### Requirement 7: Asset Detail View (Asset 360)

**User Story:** As an operations engineer, I want a comprehensive view of a selected asset, so that I can see all relevant information about a well, facility, or pipeline segment.

#### Acceptance Criteria

1. WHEN no asset is selected THEN the System SHALL display a message prompting the user to select an asset from Portfolio or Explorer
2. WHEN an asset is selected THEN the System SHALL display tabs for Overview, Telemetry, Relationships, Documents, History, and Compliance/Safety
3. WHEN viewing Overview tab THEN the System SHALL display type, status, criticality, hierarchy, hazardous area class, role, and production context
4. WHEN viewing Telemetry tab THEN the System SHALL display charts or tables for upstream tags like wellhead pressures, temperature, and flow rate
5. WHEN viewing Relationships tab THEN the System SHALL display upstream/downstream equipment chain (Well → Wellhead → Flowline → Manifold → Separator → Pipeline)
6. WHEN clicking an asset in Portfolio, Explorer, or Tag Mapping THEN the System SHALL set the selected asset in AppContext and navigate to the Asset Detail page

### Requirement 8: Location, Topology, and Linear Assets

**User Story:** As a field engineer, I want to view asset locations and pipeline topology, so that I can understand the physical layout of fields and flowlines.

#### Acceptance Criteria

1. WHEN viewing Geo Location THEN the System SHALL display a list of Fields and Pads with wells and facilities showing lat/lng coordinates
2. WHEN viewing Linear Assets THEN the System SHALL display flowlines and pipeline segments with start node, end node, length, MAOP, and status
3. WHEN viewing Linear Assets THEN the System SHALL display an Issues list for segments with problems like high corrosion rate or leak suspicion
4. WHEN viewing Network Topology THEN the System SHALL display nodes (Wells, Manifolds, Facilities, Export headers) and adjacency relationships
5. WHEN viewing Mobile Assets THEN the System SHALL display mobile equipment like maintenance trucks and portable generators with last known location and assigned field/pad

### Requirement 9: PopPane Quick Views

**User Story:** As a user, I want quick preview panels for common entities, so that I can inspect wells, endpoints, and jobs without leaving my current context.

#### Acceptance Criteria

1. WHEN clicking quick view on a discovery job THEN the System SHALL display a PopPane with job summary including type, status, scope, and found count
2. WHEN clicking inspect on a connection endpoint THEN the System SHALL display a PopPane with endpoint summary including address, protocol, zone, and linked assets
3. WHEN clicking quick view on an asset THEN the System SHALL display a PopPane with asset summary including name, hierarchy, status, and key telemetry values
4. WHEN PopPane is displayed THEN the System SHALL manage state through AppContext without breaking the nLVE layout

### Requirement 10: Code Quality and Documentation

**User Story:** As a developer, I want clean code and documentation, so that the upstream O&G implementation is maintainable and extensible.

#### Acceptance Criteria

1. WHEN building the application THEN the System SHALL compile without TypeScript errors or unused imports
2. WHEN navigating to /assets THEN the System SHALL default to /assets/portfolio/overview as the landing page
3. WHEN reviewing documentation THEN the System SHALL provide a README in src/features/assets explaining the six feature sets and nLVE application
4. WHEN reviewing documentation THEN the System SHALL provide design notes explaining upstream hierarchy, asset types, property sets, connectivity protocols, and extensibility to other sectors
