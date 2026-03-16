# Requirements Document

## Introduction

This document specifies the requirements for implementing a comprehensive Energy Management System (EMS) with 25 functional pages for Oil & Gas Upstream operations. The implementation will create a complete suite of energy monitoring, analytics, sustainability, control, and reporting features while maintaining the existing Plant4.0 architecture and design patterns.

## Glossary

- **EMS**: Energy Management System - comprehensive platform for monitoring, analyzing, and optimizing energy consumption
- **Upstream**: Oil & Gas sector focusing on exploration, drilling, and production activities
- **nLVE Pattern**: Navigate-List-View-Edit interaction pattern used throughout the platform
- **Wellhead**: Surface equipment controlling oil/gas flow from a well
- **ESP**: Electric Submersible Pump - downhole pump system for artificial lift
- **Gas Compressor**: Equipment that increases gas pressure for transportation
- **KO Drum**: Knock-Out Drum - vessel that separates liquids from gas streams
- **Energy Meter**: Device measuring energy consumption for specific scopes or assets
- **Submeter**: Secondary meter measuring energy consumption for specific assets
- **Load Profile**: Pattern of energy consumption over time
- **Power Quality**: Electrical characteristics including power factor, THD, voltage, frequency
- **Emission Factor**: Coefficient relating energy consumption to CO₂ emissions
- **BBL**: Barrel - standard unit of oil production measurement
- **MSCF**: Thousand Standard Cubic Feet - unit for gas volume measurement
- **Telemetry**: Real-time measurement data from sensors and instruments
- **Controllable Load**: Equipment that can be remotely controlled for demand response
- **Demand Response**: Grid service where loads are reduced during peak periods

## Requirements

### Requirement 1

**User Story:** As an upstream operations manager, I want to access a comprehensive EMS with 25 functional pages across 5 feature sets, so that I can monitor, analyze, and optimize all aspects of energy consumption in upstream operations.

#### Acceptance Criteria

1. WHEN accessing the Energy (EMS) section THEN the system SHALL display 5 feature sets with 5 pages each (25 total)
2. WHEN navigating to any EMS page THEN the system SHALL follow the nLVE pattern with ListPane and WorkPane
3. WHEN viewing EMS pages THEN the system SHALL display upstream-contextual data and metadata
4. WHEN using EMS features THEN the system SHALL maintain consistent UI patterns and components
5. WHEN accessing EMS functionality THEN the system SHALL use mock data without backend dependencies

### Requirement 2

**User Story:** As an energy engineer, I want to access Energy Monitoring & Metering features, so that I can track real-time consumption, sub-metering, power quality, baselines, and multi-fluid energy streams.

#### Acceptance Criteria

1. WHEN navigating to real-time consumption THEN the system SHALL display upstream energy meters with current kW, status, and energy types
2. WHEN accessing sub-metering THEN the system SHALL display submeters by asset with energy signatures and cost allocation
3. WHEN viewing power quality THEN the system SHALL display power factor, THD, voltage, frequency, and event counters
4. WHEN accessing baseline trends THEN the system SHALL display baseline vs actual charts and deviation explanations
5. WHEN viewing multi-fluid monitoring THEN the system SHALL display electricity, gas, diesel, and steam consumption by scope

### Requirement 3

**User Story:** As an energy analyst, I want to access Energy Analytics & Optimisation features, so that I can analyze efficiency KPIs, load profiling, peak demand, waste detection, and AI optimization recommendations.

#### Acceptance Criteria

1. WHEN accessing efficiency KPIs THEN the system SHALL display energy intensity metrics (kWh/BBL, CO2/BBL) with benchmark comparisons
2. WHEN viewing load profiling THEN the system SHALL display 24-hour load curves with forecast overlays and peak highlights
3. WHEN accessing peak demand analysis THEN the system SHALL display demand thresholds with load shifting recommendations
4. WHEN using waste detection THEN the system SHALL display waste categories ranked by cost impact with investigation actions
5. WHEN accessing AI optimization THEN the system SHALL display recommendation bundles grouped by timeframe with savings estimates

### Requirement 4

**User Story:** As a sustainability engineer, I want to access Sustainability & Emissions Tracking features, so that I can calculate carbon emissions, track energy intensity, manage renewables, generate ESG reports, and ensure compliance.

#### Acceptance Criteria

1. WHEN accessing carbon calculation THEN the system SHALL display CO₂ emissions breakdown by Scope 1 and Scope 2 with production unit metrics
2. WHEN viewing energy intensity THEN the system SHALL display kWh/BBL and CO2/BBL metrics with benchmark bands and drivers
3. WHEN accessing renewables management THEN the system SHALL display renewable contribution percentages and generation vs consumption charts
4. WHEN using ESG reporting THEN the system SHALL display report templates with generation and scheduling capabilities
5. WHEN accessing compliance features THEN the system SHALL display compliance status tables with exceptions and export capabilities

### Requirement 5

**User Story:** As a control engineer, I want to access Energy Control Advisory & Integration features, so that I can manage load balancing, demand response, asset operating modes, system integration, and efficiency curves.

#### Acceptance Criteria

1. WHEN accessing load balancing THEN the system SHALL display load distribution with balancing recommendations and simulation capabilities
2. WHEN using demand response THEN the system SHALL display DR events with suggested shed lists and application controls
3. WHEN managing asset modes THEN the system SHALL display operating mode cards with switching recommendations and savings estimates
4. WHEN accessing system integration THEN the system SHALL display generator, UPS, and solar assets with switching timelines
5. WHEN viewing efficiency curves THEN the system SHALL display asset efficiency curves with current operating points and BEP guidance

### Requirement 6

**User Story:** As an energy manager, I want to access Energy Dashboards & Reporting features, so that I can create custom dashboards, perform period comparisons, analyze costs, investigate anomalies, and generate audit reports.

#### Acceptance Criteria

1. WHEN accessing custom dashboards THEN the system SHALL display dashboard library with widget builder and default layouts
2. WHEN using period comparison THEN the system SHALL display comparison charts with delta cards and drivers analysis
3. WHEN accessing cost analysis THEN the system SHALL display cost breakdown charts with top contributors and cost/BBL metrics
4. WHEN investigating anomalies THEN the system SHALL display anomaly tables with severity ratings and drilldown capabilities
5. WHEN generating audit reports THEN the system SHALL display export panels with history tracking and scheduling forms

### Requirement 7

**User Story:** As a developer, I want reusable EMS components and shared UI kit, so that all 25 pages can be built consistently with minimal code duplication.

#### Acceptance Criteria

1. WHEN implementing EMS pages THEN the system SHALL use EMSPageShell component for consistent layout
2. WHEN displaying energy data THEN the system SHALL use shared widgets for KPIs, charts, and tables
3. WHEN showing meter information THEN the system SHALL use EMSMeterList component with consistent formatting
4. WHEN building page content THEN the system SHALL use reusable components from the shared EMS widget library
5. WHEN implementing features THEN the system SHALL maintain consistent component patterns across all pages

### Requirement 8

**User Story:** As a user, I want comprehensive mock data for all EMS features, so that I can experience realistic upstream energy scenarios without backend dependencies.

#### Acceptance Criteria

1. WHEN viewing energy data THEN the system SHALL display realistic upstream energy meters, submeters, and telemetry
2. WHEN accessing analytics THEN the system SHALL use mock baselines, benchmarks, and anomaly data
3. WHEN using control features THEN the system SHALL display mock controllable loads, generators, and demand response signals
4. WHEN generating reports THEN the system SHALL use mock export jobs and report templates
5. WHEN viewing all features THEN the system SHALL maintain data consistency across related pages and components

### Requirement 9

**User Story:** As a user navigating EMS features, I want consistent routing and navigation structure, so that I can easily access all 25 pages through the existing Energy menu.

#### Acceptance Criteria

1. WHEN accessing EMS features THEN the system SHALL maintain the existing navigation structure in navigation.ts
2. WHEN routing to EMS pages THEN the system SHALL map each feature route to a concrete page component
3. WHEN navigating between features THEN the system SHALL preserve URL patterns and breadcrumb navigation
4. WHEN using EMS navigation THEN the system SHALL display appropriate icons and labels for each feature
5. WHEN accessing any EMS page THEN the system SHALL maintain consistent header and context information

### Requirement 10

**User Story:** As a user interacting with EMS pages, I want consistent visual design and interaction patterns, so that the experience is seamless and follows Plant4.0 design standards.

#### Acceptance Criteria

1. WHEN viewing EMS pages THEN the system SHALL follow Plant4.0 dark theme, typography, and component patterns
2. WHEN displaying energy types THEN the system SHALL use consistent iconography (bolt, flame, droplet, steam)
3. WHEN showing metrics THEN the system SHALL use existing KPICard, StatusBadge, and layout components
4. WHEN indicating context THEN the system SHALL display sector/subsector badges consistently
5. WHEN presenting data THEN the system SHALL maintain consistent color coding, status indicators, and interaction patterns