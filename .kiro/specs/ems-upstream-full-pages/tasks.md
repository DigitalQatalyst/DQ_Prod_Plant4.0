# Implementation Plan

- [x] 1. Build EMS shared UI kit and components





  - Create EMSPageShell component for consistent nLVE layout across all 25 pages
  - Implement EMSMeterList component for standardized meter selection
  - Create EMSHeader component with sector badges and context information
  - Build shared EMS widgets library (EnergyKPIGrid, MultiStreamKPIGrid, BaselineComparisonCard, TrendChart, PowerQualityCard, LoadProfileChart, PeakDemandPanel, WasteDetectionList, CarbonBreakdownTable, EnergyIntensityCard, AdvisoryActionsList, CostBreakdownChart, ExportPanel, ReportBuilderShell)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 1.1 Write property test for component reuse consistency
  - **Property 3: Component reuse consistency**
  - **Validates: Requirements 7.1, 7.2, 7.4, 7.5**

- [x] 2. Extend mock data for comprehensive EMS functionality






  - Add submeter data for all upstream assets (ESP-07, GC-11, P-21)
  - Create power quality data with PF, THD, voltage, frequency, and event counters
  - Generate energy anomaly data with types, severity, and cost impact
  - Add controllable loads data for demand response functionality
  - Create generator/UPS/renewable asset data for integration features
  - Add demand response signals and events data
  - Create report templates and export job data for reporting features
  - Add production context data (barrels/day, MSCF/day, runtime hours)
  - Generate comprehensive baselines and benchmarks for all meters
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ]* 2.1 Write property test for mock data availability
  - **Property 5: Mock data availability**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [ ]* 2.2 Write property test for data consistency across pages
  - **Property 6: Data consistency across pages**
  - **Validates: Requirements 8.5**

- [x] 3. Implement Energy Monitoring & Metering pages (5 pages)





- [x] 3.1 Implement real-time consumption page (already exists - enhance if needed)


  - Verify existing EnergyMonitoringRealTime page meets requirements
  - Enhance with any missing upstream-specific features
  - _Requirements: 2.1_

- [x] 3.2 Implement sub-metering page


  - Create EnergyMonitoringSubMetering page component
  - Display submeters by asset with energy signatures and sparklines
  - Add cost allocation table by asset
  - Show top energy consumers list
  - _Requirements: 2.2_

- [x] 3.3 Implement power quality page


  - Create EnergyMonitoringPowerQuality page component
  - Display PowerQualityCard with PF, THD, voltage, frequency
  - Add PQ event counters (sag/swell events)
  - Include trend charts for power quality metrics
  - Add upstream-themed equipment risk hints
  - _Requirements: 2.3_

- [x] 3.4 Implement baseline trends page


  - Create EnergyMonitoringBaselineTrends page component
  - Display baseline vs actual comparison charts
  - Add rolling 7-day trend visualization
  - Include baseline reset log with timestamps
  - Show deviation explanations list with operations context
  - _Requirements: 2.4_

- [x] 3.5 Implement multi-fluid monitoring page


  - Create EnergyMonitoringMultiFluid page component
  - Display MultiStreamKPIGrid for electricity/gas/diesel/steam by scope
  - Add stacked totals chart or Sankey-style visualization
  - Include cross-dependency insights (compressor load vs gas usage)
  - _Requirements: 2.5_

- [ ]* 3.6 Write property test for page content completeness (monitoring)
  - **Property 4: Page content completeness (monitoring subset)**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

- [x] 4. Implement Energy Analytics & Optimisation pages (5 pages)








- [x] 4.1 Implement efficiency KPIs page


  - Create EnergyAnalyticsEfficiencyKPIs page component
  - Display EnergyIntensityCard with kWh/BBL and CO2/BBL metrics
  - Add benchmark targets vs actual comparison
  - Include efficiency trend over time charts
  - Show top opportunities list with savings potential
  - _Requirements: 3.1_

- [x] 4.2 Implement load profiling page (enhance existing if needed)


  - Verify existing EnergyAnalyticsLoadProfiling page meets requirements
  - Enhance with forecast overlay and peak window highlights
  - Add load factor KPI and peak demand KPI cards
  - _Requirements: 3.2_

- [x] 4.3 Implement peak demand page


  - Create EnergyAnalyticsPeakDemand page component
  - Display PeakDemandPanel with approaching limit warnings
  - Add suggested load shifting windows with timing recommendations
  - Include "What caused the peak?" breakdown analysis
  - _Requirements: 3.3_

- [x] 4.4 Implement waste detection page


  - Create EnergyAnalyticsWasteDetection page component
  - Display WasteDetectionList ranked by cost impact
  - Add before/after baseline comparison for waste categories
  - Include "Investigate" action that opens PopPane with checklist
  - _Requirements: 3.4_

- [x] 4.5 Implement AI optimisation page


  - Create EnergyAnalyticsAIOptimisation page component
  - Display AdvisoryActionsList grouped by timeframe (Now, Next shift, Next shutdown)
  - Include savings estimates, risk levels, and confidence scores
  - Show affected assets/meters for each recommendation
  - _Requirements: 3.5_

- [ ]* 4.6 Write property test for page content completeness (analytics)
  - **Property 4: Page content completeness (analytics subset)**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

- [x] 5. Implement Sustainability & Emissions Tracking pages (5 pages)






- [x] 5.1 Implement carbon calculation page (enhance existing if needed)





  - Verify existing EnergySustainabilityCarbonCalculation page meets requirements
  - Enhance with Scope 1/2 breakdown and production unit metrics
  - Add CO2 trend charts and CO2 per BBL calculations
  - _Requirements: 4.1_

- [x] 5.2 Implement energy intensity page





  - Create EnergySustainabilityEnergyIntensity page component
  - Display EnergyIntensityCard set with kWh/BBL, CO2/BBL, cost/BBL
  - Add benchmark bands showing target vs actual ranges
  - Include drivers list (compressor loading, pump cycling, etc.)
  - _Requirements: 4.2_

- [x] 5.3 Implement renewables page


  - Create EnergySustainabilityRenewables page component
  - Display renewable contribution percentage cards
  - Add generation vs consumption charts
  - Include placeholder integration panel for solar/genset hybrid systems
  - Show "Not configured" state with mock toggle for sites without renewables
  - _Requirements: 4.3_

- [x] 5.4 Implement ESG reporting page


  - Create EnergySustainabilityESGReporting page component
  - Display report templates (ESG monthly, emissions summary, intensity scorecard)
  - Add template preview functionality
  - Include "Generate report" button with mock job creation
  - Add "Schedule" button that opens PopPane with scheduling form
  - _Requirements: 4.4_

- [x] 5.5 Implement compliance page



  - Create EnergySustainabilityCompliance page component
  - Display compliance status table with Pass/Watch/Fail indicators
  - Add exceptions list with rationale explanations
  - Include export compliance pack button
  - Show compliance checks for power quality, emissions thresholds, reporting completeness
  - _Requirements: 4.5_

- [ ]* 5.6 Write property test for page content completeness (sustainability)
  - **Property 4: Page content completeness (sustainability subset)**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

- [-] 6. Implement Energy Control Advisory & Integration pages (5 pages)



- [x] 6.1 Implement load balancing page


  - Create EnergyControlLoadBalancing page component
  - Display load distribution view using controllableLoads data
  - Add balancing recommendations (move loads, stagger starts)
  - Include "Simulate" button that opens PopPane with scenario settings
  - _Requirements: 5.1_

- [x] 6.2 Implement demand response page






  - Create EnergyControlDemandResponse page component
  - Display DR events feed with event details
  - Show requested reduction amounts and duration
  - Add suggested shed list based on controllableLoads priority
  - Include "Apply plan" button (mock functionality)
  - _Requirements: 5.2_

- [x] 6.3 Implement asset modes page





  - Create EnergyControlAssetModes page component
  - Display operating mode cards for ESP, compressor, pumps (idle/normal/high)
  - Add recommendations to switch modes with rationale
  - Include risk notes and expected savings estimates
  - _Requirements: 5.3_

- [x] 6.4 Implement integration page





  - Create EnergyControlIntegration page component
  - Display generator, UPS, and solar assets with capacity and status
  - Add switching timeline visualization
  - Include resilience notes with runtime estimates
  - _Requirements: 5.4_

- [x] 6.5 Implement efficiency curves page








  - Create EnergyControlEfficiencyCurves page component
  - Display efficiency curve charts for compressor and pumps
  - Add current operating point markers
  - Include "Operate closer to BEP" guidance text
  - _Requirements: 5.5_

- [ ]* 6.6 Write property test for page content completeness (control)
  - **Property 4: Page content completeness (control subset)**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**


- [-] 7. Implement Energy Dashboards & Reporting pages (5 pages)


- [x] 7.1 Implement custom dashboards page


  - Create EnergyDashboardsCustom page component
  - Display dashboard library (Upstream Energy Overview, Pad A, Compressor Station)
  - Add dashboard builder shell with widget selection
  - Include default widget layout (consumption, cost, CO2, peaks, anomalies, intensity)
  - _Requirements: 6.1_

- [x] 7.2 Implement period comparison page



  - Create EnergyDashboardsPeriodComparison page component
  - Display comparison presets (Today vs yesterday, Week vs last week, Month vs last month)
  - Add comparison charts for kWh, cost, CO2
  - Include delta cards showing percentage and absolute changes
  - Show drivers list explaining changes
  - _Requirements: 6.2_

- [x] 7.3 Implement cost analysis page (enhance existing if needed)


  - Verify existing EnergyDashboardsCostAnalysis page meets requirements
  - Enhance with cost views by meter, energy type, and cost center
  - Add cost breakdown charts and top contributors table
  - Include cost/BBL KPI card
  - _Requirements: 6.3_

- [x] 7.4 Implement anomalies page







  - Create EnergyDashboardsAnomalies page component
  - Display anomaly table with types (spikes, baseline drift, PQ issues)
  - Add severity ratings and estimated cost impact
  - Include drilldown drawer (PopPane) with anomaly details and related telemetry
  - _Requirements: 6.4_

- [x] 7.5 Implement audit reports page





  - Create EnergyDashboardsAuditReports page component
  - Display ExportPanel with CSV/PDF/API export options
  - Add export history table with job status tracking
  - Include "Schedule export" PopPane form
  - Show export packs (Energy audit, Emissions audit, PQ compliance pack)
  - _Requirements: 6.5_

- [ ]* 7.6 Write property test for page content completeness (dashboards)
  - **Property 4: Page content completeness (dashboards subset)**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [x] 8. Update routing and navigation for all EMS pages





  - Update App.tsx routing configuration to include all 25 EMS page routes
  - Ensure each route maps to concrete page component (not ShellPage)
  - Verify navigation.ts maintains existing EMS structure
  - Test all EMS page routes for proper navigation
  - _Requirements: 9.1, 9.2, 9.3_

- [ ]* 8.1 Write property test for navigation structure preservation
  - **Property 7: Navigation structure preservation**
  - **Validates: Requirements 9.1, 9.2, 9.3**

- [ ]* 8.2 Write property test for navigation UI consistency
  - **Property 8: Navigation UI consistency**
  - **Validates: Requirements 9.4, 9.5**

- [x] 9. Implement consistent UI design across all EMS pages






  - Ensure all 25 EMS pages follow Plant4.0 dark theme and typography
  - Implement consistent energy type iconography across all pages
  - Verify reuse of existing KPICard, StatusBadge, and layout components
  - Add sector/subsector badges consistently across all pages
  - Maintain consistent color coding and status indicators
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 9.1 Write property test for visual design consistency
  - **Property 9: Visual design consistency**
  - **Validates: Requirements 10.1, 10.3**

- [ ]* 9.2 Write property test for energy type iconography consistency
  - **Property 10: Energy type iconography consistency**
  - **Validates: Requirements 10.2**

- [ ]* 9.3 Write property test for context badge consistency
  - **Property 11: Context badge consistency**
  - **Validates: Requirements 10.4**

- [ ]* 9.4 Write property test for data presentation consistency
  - **Property 12: Data presentation consistency**
  - **Validates: Requirements 10.5**

- [x] 10. Implement PopPane forms and modals





  - Create ReportBuilderShell PopPane for ESG report scheduling
  - Implement anomaly drilldown PopPane with detailed telemetry
  - Add load balancing simulation PopPane with scenario settings
  - Create export scheduling PopPane forms
  - _Requirements: Various pages requiring PopPane functionality_

- [x] 11. Ensure EMS page structure consistency





  - Verify all 25 EMS pages use EMSPageShell component
  - Confirm nLVE pattern implementation across all pages
  - Test ListPane selection driving WorkPane content on all pages
  - Ensure consistent header structure and context display
  - _Requirements: 1.2, 1.3, 1.4_

- [ ]* 11.1 Write property test for EMS page structure consistency
  - **Property 1: EMS page structure consistency**
  - **Validates: Requirements 1.2**

- [ ]* 11.2 Write property test for upstream context consistency
  - **Property 2: Upstream context consistency**
  - **Validates: Requirements 1.3**

- [x] 12. Validate mock-only operation





  - Verify no backend API calls are made from any EMS page
  - Ensure all functionality uses mock data exclusively
  - Test all interactive features work with mock data
  - Validate error handling for missing mock data
  - _Requirements: 1.5_

- [ ]* 12.1 Write property test for mock-only operation
  - **Property 13: Mock-only operation**
  - **Validates: Requirements 1.5**

- [x] 13. Final integration and testing





  - Test navigation between all 25 EMS pages
  - Verify consistent data display across related pages
  - Ensure all pages load without errors under upstream tenant context
  - Validate responsive design and accessibility compliance
  - Test all interactive features and PopPane functionality
  - _Requirements: All requirements_

- [x] 14. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.