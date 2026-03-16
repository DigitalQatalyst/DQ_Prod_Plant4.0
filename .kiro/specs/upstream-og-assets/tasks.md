# Implementation Plan

## Phase 1: Core Types and Mock Data

- [x] 1. Define Upstream O&G TypeScript types






  - [x] 1.1 Create src/types/assets.ts with all upstream types

    - Define UpstreamTenant, SiteHierarchy, Basin, Field, Pad, Facility, Well
    - Define UpstreamAsset with hierarchyIds, role, hazardousAreaClass, criticality, productionContext
    - Define UpstreamAssetType with category, sectorTags, propertySets
    - Define PropertySet and PropertyField
    - Define ConnectionEndpoint, DataPoint, Protocol types
    - Define UpstreamDiscoveryJob, DiscoveryJobScope, DiscoveryAgent
    - Define LinearAsset, StreamConfig, LifecycleState
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ]* 1.2 Write property test for type validation
    - **Property 1: Discovery Job Tenant Filtering**
    - **Validates: Requirements 3.1**

- [x] 2. Seed Upstream O&G mock data






  - [x] 2.1 Create src/data/upstreamMockData.ts


    - Add Alpha Upstream Ltd tenant
    - Add 2 basins (Permian, Eagle Ford)
    - Add 3-4 fields per basin
    - Add pads/platforms per field
    - Add wells (mix of producers/injectors)
    - Add wellheads, Xmas trees, separators, compressors
    - Add flowline and pipeline segments (linear assets)
    - Add RTUs, SIS logic solvers
    - _Requirements: 1.4_

  - [x] 2.2 Add ConnectionEndpoints and DataPoints

    - Add Modbus endpoints for RTUs and wellpads
    - Add OPC-UA endpoints for platform servers
    - Add DataPoints for wellhead pressure, casing pressure, choke position, flow rate, temperature
    - _Requirements: 1.5_

  - [x] 2.3 Add DiscoveryJobs and DiscoveryAgents

    - Add network scan job, field scan job, pipeline segment scan job
    - Add Wellpad RTU Gateway, Platform OPC-UA Server, Pipeline SCADA Gateway agents
    - _Requirements: 1.4, 1.5_

- [x] 3. Update AppContext for upstream assets




  - [x] 3.1 Extend AppContext with upstream types

    - Update imports to use new types from src/types/assets.ts
    - Add PopPane content type discriminator for quick views
    - Ensure backward compatibility with existing code
    - _Requirements: 1.1_

- [x] 4. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Navigation and Routing

- [x] 5. Update navigation structure






  - [x] 5.1 Update src/data/navigation.ts for Assets feature area

    - Add Discovery & Onboarding feature set with 5 routes
    - Add Portfolio Management feature set with 4 routes
    - Add Asset Catalog & Types feature set with 4 routes
    - Add Connectivity & Data Points feature set with 5 routes
    - Add Asset Detail & Context feature set with 1 route
    - Add Location, Topology & Linear Assets feature set with 4 routes
    - Use appropriate Lucide icons for each feature
    - Add upstream-friendly descriptions/tooltips
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 6. Update App.tsx routes




  - [x] 6.1 Add all new routes to App.tsx

    - Add Discovery routes: /assets/discovery/bulk, /agents, /manual, /import, /review
    - Add Portfolio routes: /assets/portfolio/overview, /explorer, /views, /cross-tenant
    - Add Catalog routes: /assets/catalog/types, /property-sets, /lifecycle, /sector-profiles
    - Add Connectivity routes: /assets/connectivity/mapping, /endpoints, /streams, /health, /sandbox
    - Add Detail route: /assets/detail/selected
    - Add Location routes: /assets/location/geo, /linear, /network, /mobile
    - Point unimplemented pages to ShellPage with upstream descriptions
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 7. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Discovery & Onboarding Pages

- [ ] 8. Implement BulkDiscoveryPage




  - [x] 8.1 Create src/pages/assets/discovery/BulkDiscoveryPage.tsx


    - ListPane: Display DiscoveryJobs filtered by tenant
    - Show job type (Network, Field, Pad, Pipeline Segment), status, foundCount
    - WorkPane tabs: Job Overview, Discovered Assets, Errors/Logs
    - Actions: Run job (mock state update), Duplicate job, Quick view in PopPane
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ]* 8.2 Write property test for discovery job filtering
    - **Property 1: Discovery Job Tenant Filtering**
    - **Validates: Requirements 3.1**
  - [ ]* 8.3 Write property test for job state transitions
    - **Property 2: Discovery Job State Transitions**
    - **Validates: Requirements 3.3**

- [x] 9. Implement DiscoveryAgentsPage




  - [x] 9.1 Create src/pages/assets/discovery/DiscoveryAgentsPage.tsx


    - ListPane: Display agents (Wellpad RTU Gateway, Platform OPC-UA Server, etc.)
    - Show status and assigned scope (fields/pads/pipelines)
    - WorkPane tabs: Agent Overview (protocols, last run), Assigned Scopes
    - Actions: Start/Stop (mock), Open in PopPane
    - _Requirements: 3.4_

- [x] 10. Implement ManualAssetCapturePage





  - [x] 10.1 Create src/pages/assets/discovery/ManualAssetCapturePage.tsx


    - ListPane: Recently manually created upstream assets
    - WorkPane: Add Asset form with shadcn/ui components
    - Form fields: name, assetType, Field → Pad/Platform → Well/Facility hierarchy
    - Optional fields: role, geoLocation, hazardousAreaClass, fluid, wellType, endpoint binding
    - _Requirements: 3.5_

- [x] 11. Implement AssetImportPage







  - [x] 11.1 Create src/pages/assets/discovery/AssetImportPage.tsx



    - ListPane: Past imports (Wells from Excel, Pipeline Register Import)
    - WorkPane: Stepper component
    - Steps: Upload template, Map columns, Preview summary
    - _Requirements: 3.6_

- [x] 12. Implement DiscoveryReviewPage





  - [x] 12.1 Create src/pages/assets/discovery/DiscoveryReviewPage.tsx


    - ListPane: Candidate assets from discovery
    - WorkPane: Show candidate vs existing asset comparison
    - Actions: Approve, Merge, Reject (mock)
    - _Requirements: 3.7_

- [x] 13. Checkpoint - Ensure all tests pass








  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Portfolio Management Pages

- [x] 14. Implement AssetPortfolioPage




  - [x] 14.1 Create src/pages/assets/portfolio/AssetPortfolioPage.tsx

    - ListPane: Filters for Field, Pad/Platform, asset type, criticality
    - Saved presets: "All Wells in Field A", "Top Critical Equipment"
    - WorkPane tabs: Overview (KPIs), By Field, By Status
    - KPIs: Total wells, producing vs injecting, separators, compressors, by criticality
    - _Requirements: 4.1, 4.2_
  - [ ]* 14.2 Write property test for KPI aggregation
    - **Property 3: Portfolio KPI Aggregation**
    - **Validates: Requirements 4.1**
  - [ ]* 14.3 Write property test for filter consistency
    - **Property 4: Portfolio Filter Consistency**
    - **Validates: Requirements 4.2**

- [x] 15. Implement PortfolioExplorerPage




  - [x] 15.1 Create src/pages/assets/portfolio/PortfolioExplorerPage.tsx


    - View toggle: Tree / Network / Map
    - Tree view: Basin → Field → Pad/Platform → Well/Facility → Asset
    - Network view: Placeholder showing flow path
    - Map view: Placeholder listing assets with coordinates
    - _Requirements: 4.3, 4.4_
  - [ ]* 15.2 Write property test for tree hierarchy
    - **Property 5: Tree Hierarchy Organization**
    - **Validates: Requirements 4.4**

- [x] 16. Implement SavedViewsPage







  - [x] 16.1 Create src/pages/assets/portfolio/SavedViewsPage.tsx

    - ListPane: Saved views ("High-risk wells", "Compressors in Field B")
    - WorkPane: Form to create new views with filters
    - _Requirements: 4.5_

- [x] 17. Implement CrossTenantPortfolioPage






  - [x] 17.1 Create src/pages/assets/portfolio/CrossTenantPortfolioPage.tsx


    - Display summary statistics across multiple upstream tenants
    - _Requirements: 4.6_

- [x] 18. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Asset Catalog & Types Pages

- [x] 19. Implement AssetCatalogPage





  - [x] 19.1 Create src/pages/assets/catalog/AssetCatalogPage.tsx

    - ListPane: Asset types grouped by category (Wells, Process, Pipelines, Instrumentation)
    - WorkPane tabs: Overview, Property Sets, Default Telemetry
    - _Requirements: 5.1, 5.2_
  - [ ]* 19.2 Write property test for category grouping
    - **Property 6: Asset Type Category Grouping**
    - **Validates: Requirements 5.1**

- [x] 20. Implement PropertySetsPage




  - [x] 20.1 Create src/pages/assets/catalog/PropertySetsPage.tsx


    - Display upstream property sets: Well Properties, Process Pressure/Temperature, Pipeline Design, Safety/Hazard
    - _Requirements: 5.3_

- [ ] 21. Implement LifecycleConfigPage




  - [x] 21.1 Create src/pages/assets/catalog/LifecycleConfigPage.tsx


    - Well lifecycle: Planned, Drilling, Completing, Producing, Shut-in, P&A
    - Facility lifecycle: Commissioning, Active, Under Maintenance, Mothballed, Decommissioned
    - _Requirements: 5.4_

- [x] 22. Implement SectorProfilesPage





  - [x] 22.1 Create src/pages/assets/catalog/SectorProfilesPage.tsx


    - Display Oil & Gas Upstream profile
    - Show recommended asset types, property sets, lifecycle configuration
    - _Requirements: 5.5_

- [x] 23. Checkpoint - Ensure all tests pass






  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Connectivity & Data Points Pages

- [x] 24. Implement TagMappingPage




  - [x] 24.1 Create src/pages/assets/connectivity/TagMappingPage.tsx



    - ListPane: Assets filtered by type (Wellhead, Separator, Compressor, RTU)
    - WorkPane: DataPoints table for selected asset
    - Add Mapping dialog: logicalName, rawAddress, protocol, unit, direction
    - _Requirements: 6.1, 6.2_
  - [ ]* 24.2 Write property test for asset type filtering
    - **Property 7: Tag Mapping Asset Type Filter**
    - **Validates: Requirements 6.1**

- [x] 25. Implement ConnectionEndpointsPage




  - [x] 25.1 Create src/pages/assets/connectivity/ConnectionEndpointsPage.tsx



    - ListPane: Endpoints (Pad A RTU, Platform OPC-UA Server)
    - WorkPane: Overview (address, protocol, zone, hazardousArea), Linked assets
    - _Requirements: 6.3_

- [x] 26. Implement StreamConfigPage




  - [x] 26.1 Create src/pages/assets/connectivity/StreamConfigPage.tsx


    - Streams: Realtime – Pad Networks, Slow – Pipeline Condition
    - WorkPane: Configure polling interval, retention, upstream profile
    - _Requirements: 6.4_

- [x] 27. Implement ConnectionHealthPage




  - [x] 27.1 Create src/pages/assets/connectivity/ConnectionHealthPage.tsx

    - ListPane: Endpoint status (Up/Down, Last Seen)
    - WorkPane: Timeline of connectivity, impacted wells/facilities
    - _Requirements: 6.5_

- [x] 28. Implement SandboxStreamsPage



  - [x] 28.1 Create src/pages/assets/connectivity/SandboxStreamsPage.tsx



    - Toggles: Enable Simulated Well Data, Enable Simulated Pipeline Data
    - Show which assets are driven by sandbox data
    - _Requirements: 6.6_

- [x] 29. Checkpoint - Ensure all tests pass






  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Asset Detail Page (Asset 360)

- [x] 30. Implement AssetDetailPage





  - [x] 30.1 Create src/pages/assets/detail/AssetDetailPage.tsx





    - Read selected asset from AppContext
    - Show message if no asset selected
    - WorkPane tabs: Overview, Telemetry, Relationships, Documents, History, Compliance/Safety
    - Overview: type, status, criticality, hierarchy, hazardousAreaClass, role, productionContext
    - Telemetry: Mock charts/tables for wellhead pressures, temperature, flow rate
    - Relationships: Well → Wellhead → Flowline → Manifold → Separator → Pipeline
    - Documents: Mock list of P&IDs, schematics, datasheets
    - History: Status changes, owner changes
    - Compliance: API/ASME codes, MAOP, SIS reference, inspection due
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [ ]* 30.2 Write property test for field completeness
    - **Property 8: Asset Detail Field Completeness**
    - **Validates: Requirements 7.3**
  - [ ]* 30.3 Write property test for relationship chain
    - **Property 9: Asset Relationship Chain Integrity**
    - **Validates: Requirements 7.5**

- [x] 31. Wire asset selection navigation



  - [x] 31.1 Update Portfolio, Explorer, TagMapping to navigate on asset click





    - Set AppContext.selectedAsset on click
    - Navigate to /assets/detail/selected
    - _Requirements: 7.6_
  - [ ]* 31.2 Write property test for selection navigation
    - **Property 10: Asset Selection Navigation**
    - **Validates: Requirements 7.6**

- [x] 32. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

## Phase 8: Location, Topology & Linear Assets Pages

- [x] 33. Implement GeoLocationPage



  - [x] 33.1 Create src/pages/assets/location/GeoLocationPage.tsx



    - ListPane: Fields and Pads/Platforms
    - WorkPane: Placeholder map card with wells/facilities, lat/lng, field, pad
    - Filter by asset type
    - _Requirements: 8.1_

- [x] 34. Implement LinearAssetsPage




  - [x] 34.1 Create src/pages/assets/location/LinearAssetsPage.tsx


    - ListPane: Flowlines and Pipeline segments
    - WorkPane: Segment table (startNode, endNode, length, MAOP, status)
    - Issues list (high corrosion rate, leak suspicion)
    - _Requirements: 8.2, 8.3_
  - [ ]* 34.2 Write property test for linear asset display
    - **Property 11: Linear Asset Field Display**
    - **Validates: Requirements 8.2**

- [-] 35. Implement NetworkTopologyPage


  - [x] 35.1 Create src/pages/assets/location/NetworkTopologyPage.tsx



    - ListPane: Nodes (Wells, Manifolds, Facilities, Export headers)
    - WorkPane: Adjacency table (fromNode, toNode, connectionType)
    - Simple schematic layout using cards
    - _Requirements: 8.4_
  - [ ]* 35.2 Write property test for topology consistency
    - **Property 12: Network Topology Consistency**
    - **Validates: Requirements 8.4**

- [x] 36. Implement MobileAssetsPage







  - [x] 36.1 Create src/pages/assets/location/MobileAssetsPage.tsx





    - ListPane: Mobile assets (trucks, portable pumps/generators)
    - WorkPane: Last known location, assigned field/pad
    - _Requirements: 8.5_

- [x] 37. Checkpoint - Ensure all tests pass






  - Ensure all tests pass, ask the user if questions arise.

## Phase 9: PopPane Quick Views

- [x] 38. Extend PopPane for quick views




  - [x] 38.1 Update src/components/layout/PopPane.tsx


    - Add QuickDiscoveryJobView component
    - Add QuickEndpointView component
    - Add QuickAssetView component
    - Content: name, hierarchy, status, 2-3 key fields, 1-2 telemetry values
    - _Requirements: 9.1, 9.2, 9.3_
  - [ ]* 38.2 Write property test for PopPane state management
    - **Property 13: PopPane State Management**
    - **Validates: Requirements 9.4**

- [-] 39. Wire PopPane triggers



  - [x] 39.1 Add quick view triggers to pages


    - BulkDiscoveryPage: Quick view icon on jobs
    - ConnectionEndpointsPage: Inspect endpoint action
    - PortfolioExplorer/LinearAssetsPage: Quick view action on asset/segment
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 40. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 10: Cleanup and Documentation

- [x] 41. Code cleanup




  - [x] 41.1 Resolve TypeScript errors and unused imports


    - Fix any compilation errors
    - Remove dead code and unused components
    - Verify route consistency
    - _Requirements: 10.1_

- [ ] 42. Create documentation
  - [ ] 42.1 Create src/pages/assets/README.md
    - List 6 feature sets and key screens
    - Note Upstream O&G demo context
    - Explain nLVE application to Assets
    - _Requirements: 10.3_
  - [ ] 42.2 Create docs/DESIGN_NOTES_upstream_assets.md
    - Summarize upstream hierarchy
    - Document key asset types and property sets
    - Document connectivity protocols
    - Explain Location/Topology models
    - Note extensibility to other sectors
    - _Requirements: 10.4_

- [ ] 43. Verify default route
  - [ ] 43.1 Ensure default route redirects to /overview/dashboard
    - _Requirements: 10.2_

- [ ] 44. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
