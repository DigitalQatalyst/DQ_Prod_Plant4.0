# Implementation Plan

- [x] 1. Set up upstream tenant and energy data models





  - Add "GulfUpstream Demo" tenant to mock data with "Oil & Gas – Upstream" industry
  - Define TypeScript interfaces for UpstreamEnergyMeter, EnergyTelemetry, EnergyBaseline, UpstreamTariffs, and UpstreamEmissionFactors
  - Create mock data for upstream energy meters (Wellpad A, Compressor Station, Camp & Utilities)
  - Generate mock telemetry data with 24-hour kW and kWh time series
  - Add baseline consumption data and tariff/emission factor constants
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 8.1, 8.2_

- [ ]* 1.1 Write property test for tenant filtering
  - **Property 1: Tenant filtering consistency**
  - **Validates: Requirements 1.2, 1.4**

- [x] 2. Extend application context for upstream energy features






  - Add sector and subsector metadata fields to AppContext interface
  - Implement logic to set "Oil & Gas" and "Upstream" metadata when upstream tenant is selected
  - Expose upstream energy data (meters, telemetry, baselines, tariffs, emission factors) through context
  - Update context provider to filter energy data by selected tenant
  - _Requirements: 1.5, 3.5, 7.3_

- [ ]* 2.1 Write property test for metadata consistency
  - **Property 9: Metadata consistency**
  - **Validates: Requirements 1.5, 3.5, 7.3**

- [x] 3. Update navigation structure for EMS features








  - Verify existing Energy (EMS) feature area has all 5 feature sets defined
  - Standardize routing paths for key EMS features (real-time consumption, load profiling, carbon calculation, cost analysis)
  - Add optional sector/subsector metadata hints to EMS features for future filtering
  - Ensure navigation preserves existing structure while supporting upstream context
  - _Requirements: 7.1, 7.2, 7.4, 7.5_

- [ ]* 3.1 Write property test for navigation structure preservation
  - **Property 8: Navigation structure preservation**
  - **Validates: Requirements 7.1, 7.2**

- [x] 4. Implement real-time energy consumption page (full nLVE)





  - Create EnergyMonitoringRealTime page component following nLVE pattern
  - Implement ListPane showing upstream energy meters with filtering by tenant
  - Display meter name, scope, energy type icons, current kW, and status badges
  - Implement WorkPane with meter selection and detailed view
  - Add KPI cards for instantaneous demand, daily consumption, energy cost, and CO₂ emissions
  - Create time-series charts for kW demand and kWh accumulation using Recharts
  - Add baseline comparison section showing percentage over/under baseline
  - Display sector/subsector badges and anomaly detection snippets
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 4.1 Write property test for energy meter data completeness
  - **Property 2: Energy meter data completeness**
  - **Validates: Requirements 2.4, 2.5**

- [ ]* 4.2 Write property test for meter selection data display
  - **Property 3: Meter selection data display**
  - **Validates: Requirements 3.2, 3.3, 3.4**

- [x] 5. Implement load profiling and forecasting page (shell)














  - Create EnergyAnalyticsLoadProfiling page component
  - Implement ListPane showing load profiles for Pad A, Compressor Station, and Camp & Utilities
  - Create WorkPane displaying 24-hour load curves with peak period highlights
  - Add tomorrow's forecast chart using mock offset values
  - Display KPI cards for peak demand (kW) and load factor (%)
  - Maintain upstream facility context throughout the page
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 5.1 Write property test for load profile analytics completeness
  - **Property 4: Load profile analytics completeness**
  - **Validates: Requirements 4.2, 4.3, 4.4**

- [x] 6. Implement carbon emissions calculation page (shell)





  - Create EnergySustainabilityCarbonCalculation page component
  - Display CO₂ emissions breakdown by electricity, gas, and diesel consumption
  - Implement emissions calculation using emission factors multiplied by energy consumption
  - Show CO₂ per production unit metrics (kg CO₂ per BBL and per MSCF)
  - Use mock production figures for demonstration purposes
  - Maintain transparent calculation methods in code for demo clarity
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 6.1 Write property test for emissions calculation accuracy
  - **Property 5: Emissions calculation accuracy**
  - **Validates: Requirements 5.2**

- [x] 7. Implement energy cost analysis page (shell)





  - Create EnergyDashboardsCostAnalysis page component
  - Display cost breakdown by meter (em-wh-01, em-gc-11, em-camp) and energy type
  - Show daily or weekly energy costs for electricity, gas, and diesel
  - Create stacked bar chart or pie chart for cost distribution visualization
  - Display KPI cards for total daily energy cost (USD) and cost per BBL/MSCF
  - Identify and highlight top 3 cost-driving assets or meters
  - Use upstream tariff data for all cost calculations
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 7.1 Write property test for cost calculation accuracy
  - **Property 6: Cost calculation accuracy**
  - **Validates: Requirements 6.2, 6.5**

- [ ]* 7.2 Write property test for cost ranking correctness
  - **Property 7: Cost ranking correctness**
  - **Validates: Requirements 6.4**

- [x] 8. Update routing and page registration




  - Add new EMS page routes to App.tsx routing configuration
  - Ensure all EMS pages are accessible via canonical routing patterns
  - Update existing EMS shell page imports to include new upstream-specific pages
  - Verify routing maintains existing URL structure while supporting new functionality
  - _Requirements: 7.2_

- [x] 9. Implement consistent UI design and components




  - Ensure all EMS pages follow Plant4.0 dark theme, typography, and component patterns
  - Implement consistent energy type iconography (bolt for electricity, flame for gas, droplet for diesel)
  - Reuse existing KPICard, StatusBadge, and layout components throughout EMS features
  - Add lightweight sector/subsector badges for visual context indication
  - Maintain consistent color coding and status indicators across all EMS features
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 9.1 Write property test for energy type iconography consistency
  - **Property 11: Energy type iconography consistency**
  - **Validates: Requirements 10.2**

- [ ]* 9.2 Write property test for component reuse consistency
  - **Property 12: Component reuse consistency**
  - **Validates: Requirements 10.3**

- [ ]* 9.3 Write property test for visual theme consistency
  - **Property 13: Visual theme consistency**
  - **Validates: Requirements 10.1, 10.5**

- [x] 10. Extend existing assets with energy attributes





  - Add energy-related fields to existing upstream assets (energyConsumer, primaryEnergyType, nominalPowerKw, energyCostCenter)
  - Update asset display components to show energy consumer flags and primary energy types
  - Ensure energy attributes are displayed for wellheads, pumps, and compressors
  - Add nominal power ratings and energy cost center information to asset details
  - _Requirements: 8.1, 8.2_

- [x] 11. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 11.1 Write property test for page loading reliability
  - **Property 10: Page loading reliability**
  - **Validates: Requirements 9.3, 9.5**

- [x] 12. Final integration and validation








  - Verify all EMS pages load without errors under upstream tenant context
  - Test tenant switching functionality with energy data filtering
  - Validate that generic EMS architecture is preserved for future sector extensions
  - Ensure nLVE pattern is maintained across all new EMS pages
  - Confirm all mock data integrates seamlessly with existing system
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_