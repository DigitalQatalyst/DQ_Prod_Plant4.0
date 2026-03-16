# Implementation Plan

- [ ] 1. Enhance upstream mock data with comprehensive APM datasets








  - Extend upstreamTelemetry with 24-hour realistic data for all 5 upstream assets
  - Add reliability metrics (MTBF, MTTR, availability) for each asset
  - Create criticality scores with safety, production, environmental impact ratings
  - Add FMEA library data with failure modes, causes, and RPN scores by asset type
  - Create spare parts inventory with compatibility mappings and stock levels
  - Add benchmark data comparing asset performance against industry targets
  - Generate downtime events with planned/unplanned categorization and reason codes
  - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2, 2.4, 2.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 1.1 Write property test for asset-type telemetry mapping
  - **Property 3: Asset-type telemetry mapping**
  - **Validates: Requirements 1.5, 2.4, 3.3**

- [ ]* 1.2 Write property test for telemetry data completeness
  - **Property 4: Telemetry data completeness**
  - **Validates: Requirements 2.1**

- [ ]* 1.3 Write property test for historical data availability
  - **Property 5: Historical data availability**
  - **Validates: Requirements 2.2**

- [x] 2. Create shared APM UI component library










  - Implement APMPageShell component with consistent header, breadcrumbs, and layout
  - Create APMAssetList component with upstream asset display and selection handling
  - Build HealthIndexCard component with breakdown factors and trend indicators
  - Implement SignalKPIGrid component with asset-type-aware parameter display
  - Create MiniTrendChart component for time-series data visualization
  - Build AlertList and RootCausePanel components for diagnostics features
  - Implement RULCard and FailureProbabilityCard for predictive maintenance
  - Create BenchmarkTable and DowntimeTable components for performance features
  - Add RecommendationList and ExportActionsPanel for reports and actions
  - _Requirements: 9.1, 9.2, 9.4, 9.5_

- [ ]* 2.1 Write property test for asset information completeness
  - **Property 1: Asset information completeness**
  - **Validates: Requirements 1.3, 8.3**

- [ ]* 2.2 Write property test for sector badge consistency
  - **Property 2: Sector badge consistency**
  - **Validates: Requirements 1.4**

- [x] 3. Implement Asset Health & Diagnostics feature pages












- [x] 3.1 Enhance condition monitoring page with upstream-specific functionality


  - Replace placeholder with full nLVE implementation using APMPageShell
  - Add asset-type-aware KPI grids showing relevant parameters for each upstream asset type
  - Implement condition summary with Normal/Warning/Critical status based on telemetry thresholds
  - Add mini trend charts for key process variables with realistic upstream data patterns
  - Integrate health index display with breakdown factors (vibration, temperature, pressure, electrical)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 3.2 Write property test for health index and anomaly display
  - **Property 8: Health index and anomaly display**
  - **Validates: Requirements 3.1**

- [ ]* 3.3 Write property test for asset header completeness
  - **Property 9: Asset header completeness**
  - **Validates: Requirements 3.2**

- [x] 3.4 Implement health scoring page with index breakdown


  - Create health score calculation display with contributing factors
  - Add health score history trend chart showing degradation over time
  - Implement "Top contributors to degradation" list with upstream-specific factors
  - Show health score breakdown by component (bearings, seals, insulation, etc.)
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [x] 3.5 Build anomaly detection page with upstream context


  - Display anomaly timeline table with detected anomalies for selected asset
  - Add anomaly details showing signal, deviation percentage, timestamp, and confidence
  - Implement toggle chips for anomaly types (vibration, pressure, electrical, thermal)
  - Show anomaly status tracking (Active, Investigating, Resolved)
  - _Requirements: 3.1, 3.2, 4.1_

- [x] 3.6 Create root cause diagnostics page with upstream expertise


  - Display recent upstream alerts list with asset associations
  - Implement alert selection showing fault details in WorkPane
  - Add root cause analysis panel with upstream equipment knowledge
  - Show likely causes based on asset type and operational patterns
  - Display corrective actions specific to upstream operations
  - Add supporting evidence section referencing relevant telemetry signals
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 3.7 Write property test for root cause analysis completeness
  - **Property 13: Root cause analysis completeness**
  - **Validates: Requirements 4.3**

- [x] 3.8 Implement degradation trends page with component tracking


  - Show degradation rate charts for critical components by asset type
  - Display component risk cards (bearings, seals, insulation) mapped to asset types
  - Add projected threshold crossing dates with confidence intervals
  - Show degradation acceleration indicators and trend analysis
  - _Requirements: 3.4, 3.5_

- [x] 4. Implement Predictive & Prescriptive Maintenance feature pages





- [x] 4.1 Create ML failure prediction page with multi-horizon forecasting


  - Display all upstream assets with failure probability percentages
  - Show failure predictions for multiple time horizons (7, 30, 90 days)
  - Add top failure modes predicted based on FMEA library data for each asset type
  - Implement confidence indicators and last model update timestamps
  - Show color-coded risk levels based on failure probability and criticality
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 4.2 Write property test for failure prediction horizon coverage
  - **Property 16: Failure prediction horizon coverage**
  - **Validates: Requirements 5.1**

- [ ]* 4.3 Write property test for RUL estimation completeness
  - **Property 17: RUL estimation completeness**
  - **Validates: Requirements 5.2**

- [x] 4.4 Build RUL estimation page with confidence bands


  - Create RUL cards showing days remaining with confidence intervals
  - Add RUL trend chart over time showing degradation progression
  - Display "Key signals driving RUL" list with contributing factors
  - Show component-level RUL estimates for critical parts
  - _Requirements: 5.2, 5.5_

- [x] 4.5 Implement CBM triggers page with upstream-specific rules


  - Display rule list with threshold triggers per asset type
  - Show trigger history when rules fired with timestamps and values
  - Add recommended maintenance window calendar strip
  - Implement trigger status tracking (Active, Triggered, Disabled)
  - _Requirements: 5.1, 5.3_

- [x] 4.6 Create prescriptive recommendations page with action prioritization


  - Show action recommendations ranked by risk reduction and impact
  - Group recommendations by urgency (What to do now/next week/next shutdown)
  - Add rationale explanations and estimated downtime avoided
  - Implement mock work order creation PopPane (no persistence)
  - _Requirements: 5.4, 5.5_

- [x] 4.7 Build priority risk scoring page with composite calculations


  - Display priority score formula breakdown (criticality × failure probability × consequence)
  - Show ranked queue of assets in table format with sortable columns
  - Add filters for High criticality only and Next 30 days timeframe
  - Implement risk score trend indicators and historical comparisons
  - _Requirements: 5.3, 5.4_

- [x] 5. Implement Asset Performance & Utilisation feature pages











- [x] 5.1 Create uptime/downtime tracking page with event analysis


  - Display uptime percentage and downtime hours for each asset over last 30 days
  - Show downtime events table with planned/unplanned categorization
  - Add Pareto chart placeholder showing top downtime reasons
  - Implement downtime trend analysis with duration and frequency metrics
  - _Requirements: 6.1, 6.3_

- [ ]* 5.2 Write property test for performance metric completeness
  - **Property 21: Performance metric completeness**
  - **Validates: Requirements 6.1**

- [ ]* 5.3 Write property test for downtime event categorization
  - **Property 23: Downtime event categorization**
  - **Validates: Requirements 6.3**

- [x] 5.4 Build utilisation monitoring page with load analysis


  - Show utilisation versus rated capacity gauge for each asset
  - Display load profile charts with historical patterns
  - Add underload/overload flags with operational guidance
  - Implement capacity optimization recommendations
  - _Requirements: 6.4_

- [x] 5.5 Implement performance deviation detection with baseline comparison


  - Display deviation score (0-100) and contributing signals
  - Show "Expected vs actual" trend charts with variance analysis
  - Add deviation events list with severity and duration
  - Implement baseline recalibration recommendations
  - _Requirements: 6.4, 6.5_

- [x] 5.6 Create benchmarking page with industry comparisons


  - Display benchmark table comparing selected asset vs best observed vs target
  - Show rank position indicator within peer group
  - Add "Why you're below benchmark" bullet summary with improvement suggestions
  - Implement benchmark trend analysis over time
  - _Requirements: 6.5_

- [ ]* 5.7 Write property test for benchmark comparison accuracy
  - **Property 25: Benchmark comparison accuracy**
  - **Validates: Requirements 6.5**

- [x] 5.8 Build ARM KPIs page with reliability metrics


  - Display MTBF, MTTR, MTTF, Availability cards for each asset
  - Add trend charts for MTBF/MTTR showing improvement/degradation
  - Show reliability notes specific to upstream assets with operational context
  - Implement reliability target tracking and variance analysis
  - _Requirements: 6.2_

- [x] 6. Implement Asset Inventory & Criticality feature pages





- [x] 6.1 Create asset registry page with hierarchy visualization


  - Display asset identity section with type, serial/model, location details
  - Show hierarchy tree: Field → Pad → Asset → Component structure
  - Add linked documents placeholder (datasheet, inspection reports)
  - Implement asset relationship mapping and dependency tracking
  - _Requirements: 1.2, 1.3, 7.5_

- [x] 6.2 Build criticality scoring page with multi-factor analysis


  - Show criticality breakdown in radar chart or table format
  - Display safety, production, environmental, detectability impact scores
  - Add overall score calculation and tier assignment (A/B/C)
  - Include criticality rationale text block with justification
  - _Requirements: 1.3, 6.5_

- [x] 6.3 Implement failure mode mapping page with FMEA integration


  - Display FMEA/FMECA table filtered by asset type
  - Show RPN ranking with severity, occurrence, detection scores
  - Add detection methods list (vibration, temperature, pressure analysis)
  - Implement failure mode trend analysis and historical data
  - _Requirements: 5.4_

- [x] 6.4 Create lifecycle tracking page with aging analysis



  - Show lifecycle timeline: commissioned → inspections → overhauls → current
  - Display next recommended overhaul window with scheduling guidance
  - Add age vs expected service life gauge with remaining life calculation
  - Implement lifecycle cost tracking and optimization recommendations
  - _Requirements: 6.1, 6.2_

- [x] 6.5 Build spare parts linkage page with inventory management


  - Display spare parts table with part numbers, descriptions, compatibility
  - Show on-hand quantity, lead times, and reorder points
  - Add compatibility tags by asset type with cross-reference mapping
  - Implement "Risk due to spares" warning for low stock conditions
  - _Requirements: 6.1, 6.3_

- [x] 7. Implement Alerts, Reports & Visualisation feature pages





- [x] 7.1 Create real-time alerts page with severity management


  - Display alert feed with severity tabs (Critical/Major/Minor)
  - Add quick acknowledge button with UI-only state management
  - Show alert detail panel with linked asset and suggested next steps
  - Implement alert filtering and search functionality
  - _Requirements: 4.1, 4.2, 8.5_

- [x] 7.2 Build event history page with timeline visualization


  - Show timeline view of alerts, faults, and downtime events
  - Add filters by category, severity, and date range
  - Implement drilldown drawer (PopPane) for event details
  - Show event correlation analysis and pattern recognition
  - _Requirements: 4.1, 4.2_

- [x] 7.3 Implement custom dashboards page with widget builder


  - Create dashboard builder shell with add widget buttons (mock)
  - Display default upstream dashboard layout with key widgets
  - Show health overview, top alerts, highest risk assets, downtime summary
  - Add widget configuration options (mock for Stage 03)
  - _Requirements: 8.1, 8.2, 8.4_

- [x] 7.4 Create reliability reports page with automated generation


  - Display report list: weekly reliability, monthly bad actors, maintenance effectiveness
  - Add report preview panel with summary statistics
  - Implement "Schedule report" button opening PopPane with mock schedule form
  - Show report history and distribution tracking
  - _Requirements: 5.5, 6.2_

- [x] 7.5 Build data export page with multiple format support


  - Create export panel with CSV, PDF, API format buttons
  - Add dataset selection: telemetry, alerts, downtime, reliability KPIs
  - Display export history table with download links (mock)
  - Implement export scheduling and automation options (mock)
  - _Requirements: 2.3, 6.1, 6.2_




- [x] 8. Integrate PopPane forms and modal interactions


- [x] 8.1 Create work order creation PopPane


  - Build mock work order form with asset selection and task details
  - Add priority selection and estimated duration fields
  - Implement recommended actions pre-population from diagnostics
  - Show form validation and submission confirmation (no persistence)
  - _Requirements: 4.4, 5.4_

- [x] 8.2 Implement report scheduling PopPane


  - Create mock report schedule form with frequency and format options
  - Add recipient selection and delivery method configuration
  - Show report template selection and customization options
  - Implement schedule confirmation and preview (no persistence)
  - _Requirements: 5.5_

- [x] 8.3 Build event details PopPane


  - Display comprehensive event information with timeline context
  - Show related events and correlation analysis
  - Add action history and resolution tracking
  - Implement event annotation and notes functionality (mock)
  - _Requirements: 4.1, 4.2, 4.5_

- [x] 9. Ensure navigation and routing compliance





- [x] 9.1 Verify all APM feature routes map to functional pages


  - Replace all remaining ShellPage placeholder components with functional implementations
  - Ensure each route renders appropriate nLVE layout with upstream context
  - Verify navigation breadcrumbs and feature identification work correctly
  - Test deep linking and browser back/forward navigation
  - _Requirements: 7.1, 7.2, 7.4, 7.5_

- [ ]* 9.2 Write property test for routing structure preservation
  - **Property 26: Routing structure preservation**
  - **Validates: Requirements 7.2**

- [ ]* 9.3 Write property test for feature metadata application
  - **Property 27: Feature metadata application**
  - **Validates: Requirements 7.3**


- [x] 9.4 Add sector and subsector metadata to all APM features

  - Apply "Oil & Gas" sector and "Upstream" subsector metadata to navigation data
  - Ensure metadata appears in feature context and filtering capabilities
  - Verify sector badges display consistently across all APM pages
  - Test metadata-based filtering functionality for future extensibility
  - _Requirements: 1.4, 7.3_

- [x] 10. Checkpoint - Comprehensive APM functionality verification





  - Verify all 25 APM features load without errors under upstream tenant context
  - Test asset selection updates WorkPane content appropriately across all features
  - Confirm telemetry data displays correctly for all upstream asset types
  - Validate health indices, anomaly states, and condition summaries reflect properly
  - Test root cause diagnostics provide upstream-specific causes and actions
  - Verify failure predictions show appropriate time horizons and confidence levels
  - Confirm performance metrics calculate correctly (MTBF, MTTR, availability)
  - Test benchmark comparisons show realistic industry targets and rankings
  - Verify sector and subsector badges appear consistently throughout interface
  - Confirm empty states provide helpful guidance when no data is available
  - Test navigation preserves existing Monitor area structure and functionality
  - Verify all widgets use Plant4.0 design system consistently
  - Ensure all tests pass, ask the user if questions ari