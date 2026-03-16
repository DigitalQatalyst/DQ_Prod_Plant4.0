# Implementation Plan

- [ ] 1. Update mock data system with upstream tenant and assets
  - Add upstream tenant "GulfUpstream Demo" with industry "Oil & Gas – Upstream"
  - Add 5 upstream assets: Wellhead WH-01, ESP Pump ESP-07, Gas Compressor GC-11, Crude Transfer Pump P-21, Flare KO Drum KO-03
  - Add upstream telemetry data structure with realistic parameter values
  - Add health index data and anomaly flags for each asset
  - _Requirements: 1.1, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 1.1 Write property test for tenant asset filtering
  - **Property 1: Tenant selection filters assets correctly**
  - **Validates: Requirements 1.2**

- [ ] 2. Enhance application context for upstream support
  - Add sector and subsector metadata to AppContext interface
  - Update context to support upstream tenant selection
  - Set upstream tenant as default for APM development mode
  - Ensure context provides upstream-specific metadata
  - _Requirements: 1.2, 1.4, 1.5_

- [ ] 3. Update navigation system with upstream metadata
  - Add sector metadata "Oil & Gas" and subsector metadata "Upstream" to APM features
  - Ensure canonical routing patterns maintained for all APM feature paths
  - Add industry tags for future filtering capabilities
  - Verify all existing feature sets preserved under Monitor area
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 3.1 Write property test for navigation structure preservation
  - **Property 10: Navigation structure preservation**
  - **Validates: Requirements 7.1, 7.2**

- [ ]* 3.2 Write property test for metadata application consistency
  - **Property 11: Metadata application consistency**
  - **Validates: Requirements 7.3, 7.4, 7.5**

- [ ] 4. Implement upstream-specific condition monitoring page
  - Create enhanced condition monitoring page displaying upstream assets with health index and anomaly state
  - Implement asset selection functionality updating selectedAsset context
  - Add asset header with name, type, location, and sector/subsector badges
  - Create asset-type-specific KPI cards (wellhead: flow/pressure/temperature, ESP: current/pressures/vibration, compressor: pressures/temperature/vibration)
  - Add mock time-series line charts for key process variables
  - Implement condition summary with Normal/Warning/Critical states based on mock thresholds
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 4.1 Write property test for asset type telemetry parameters
  - **Property 2: Asset type determines telemetry parameters**
  - **Validates: Requirements 3.2, 3.3, 3.4**

- [ ]* 4.2 Write property test for sector badge display
  - **Property 3: Sector and subsector badges display consistently**
  - **Validates: Requirements 3.5**

- [ ]* 4.3 Write property test for asset-specific KPI display
  - **Property 12: Asset-specific KPI display**
  - **Validates: Requirements 8.1, 8.2, 8.3**

- [ ]* 4.4 Write property test for chart and condition display
  - **Property 13: Chart and condition display**
  - **Validates: Requirements 8.4, 8.5**

- [ ] 5. Implement upstream root cause diagnostics page
  - Create root cause diagnostics page with list of recent upstream alerts using mock data
  - Implement alert selection functionality displaying fault title in right panel
  - Add likely causes list based on upstream equipment knowledge
  - Add suggested corrective actions specific to upstream operations
  - Ensure nLVE pattern maintained with upstream-specific content
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 5.1 Write property test for alert selection functionality
  - **Property 4: Alert selection displays fault information**
  - **Validates: Requirements 4.2, 4.3, 4.4**

- [ ] 6. Implement upstream ML failure prediction page
  - Create failure prediction page displaying all upstream assets with failure probability percentages
  - Add RUL estimates for each asset using mock data
  - Implement risk levels with color-coded indicators
  - Ensure mock data usage without requiring actual ML implementation
  - Maintain upstream asset context and metadata throughout
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 6.1 Write property test for failure prediction data completeness
  - **Property 6: Failure prediction data completeness**
  - **Validates: Requirements 5.1, 5.2, 5.3**

- [ ]* 6.2 Write property test for mock data usage consistency
  - **Property 7: Mock data usage consistency**
  - **Validates: Requirements 5.4, 6.4**

- [ ] 7. Implement upstream RUL estimation page
  - Create RUL estimation page with RUL trend cards for upstream pumps, compressors, and wellheads
  - Add confidence interval placeholders for each estimate
  - Implement asset-level degradation markers
  - Use mock data for all calculations and predictions
  - Maintain upstream-specific asset context
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 7.1 Write property test for RUL estimation data completeness
  - **Property 9: RUL estimation data completeness**
  - **Validates: Requirements 6.1, 6.2, 6.3**

- [ ]* 7.2 Write property test for context preservation
  - **Property 8: Context preservation across features**
  - **Validates: Requirements 5.5, 6.5**

- [ ] 8. Enhance existing APM shell pages with upstream context
  - Update remaining APM pages to support upstream tenant context
  - Ensure all pages maintain nLVE pattern with upstream-specific content
  - Add upstream-themed KPI card variants for pressure, flow, vibration parameters
  - Implement sector badges (Oil & Gas, Upstream) across all relevant pages
  - Maintain neutral industrial design system while adding upstream context
  - _Requirements: 9.3, 9.5_

- [ ]* 8.1 Write property test for nLVE pattern maintenance
  - **Property 5: nLVE pattern maintained across features**
  - **Validates: Requirements 4.5, 9.3**

- [ ]* 8.2 Write property test for page loading reliability
  - **Property 14: Page loading reliability**
  - **Validates: Requirements 9.5**

- [ ] 9. Checkpoint - Ensure all tests pass and upstream functionality works
  - Verify upstream tenant appears in tenant selector
  - Test asset filtering works correctly for upstream tenant
  - Verify all APM pages load without errors under upstream context
  - Test telemetry parameter display matches asset types
  - Verify sector/subsector badges display consistently
  - Ensure navigation structure preserved and metadata applied correctly
  - Ensure all tests pass, ask the user if questions arise.
