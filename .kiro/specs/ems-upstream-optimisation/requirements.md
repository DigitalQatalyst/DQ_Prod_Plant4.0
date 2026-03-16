# Requirements Document

## Introduction

This document specifies the requirements for contextualizing the existing EMS (Energy Management System) feature sets for the Oil & Gas Upstream subsector. The implementation will extend the Plant4.0 platform's existing EMS capabilities by adding upstream-specific mock energy data, telemetry examples, and contextual UI metadata while preserving the generic, reusable EMS architecture.

## Glossary

- **EMS**: Energy Management System - comprehensive platform for monitoring, analyzing, and optimizing energy consumption
- **Upstream**: Oil & Gas sector focusing on exploration, drilling, and production activities
- **nLVE Pattern**: Navigate-List-View-Edit interaction pattern used throughout the platform
- **Wellhead**: Surface equipment controlling oil/gas flow from a well
- **ESP**: Electric Submersible Pump - downhole pump system for artificial lift
- **Gas Compressor**: Equipment that increases gas pressure for transportation
- **KO Drum**: Knock-Out Drum - vessel that separates liquids from gas streams
- **Energy Meter**: Device measuring energy consumption for specific scopes or assets
- **Load Profile**: Pattern of energy consumption over time
- **Emission Factor**: Coefficient relating energy consumption to CO₂ emissions
- **BBL**: Barrel - standard unit of oil production measurement
- **MSCF**: Thousand Standard Cubic Feet - unit for gas volume measurement
- **Telemetry**: Real-time measurement data from sensors and instruments

## Requirements

### Requirement 1

**User Story:** As an upstream operations manager, I want to select an Oil & Gas Upstream tenant from the tenant selector, so that I can access upstream-specific energy data and EMS features.

#### Acceptance Criteria

1. WHEN the tenant selector is opened THEN the system SHALL display "GulfUpstream Demo" as an available tenant option
2. WHEN "GulfUpstream Demo" tenant is selected THEN the system SHALL filter all energy data to show only upstream energy meters and assets
3. WHEN the upstream tenant is active THEN the system SHALL display "Oil & Gas – Upstream" as the industry classification
4. WHEN the upstream tenant is selected THEN the system SHALL set this tenant as the default for EMS development mode
5. WHEN upstream tenant context is active THEN the system SHALL apply sector metadata "Oil & Gas" and subsector metadata "Upstream" to the application context

### Requirement 2

**User Story:** As an upstream energy manager, I want to view realistic upstream energy meters in the energy monitoring lists, so that I can monitor electricity, gas, and diesel consumption across wellpads and facilities.

#### Acceptance Criteria

1. WHEN the upstream tenant is selected THEN the system SHALL display "Wellpad A Feeder Meter" with scope "Pad A" and energy types "electricity"
2. WHEN the upstream tenant is selected THEN the system SHALL display "Compressor Station Meter" with scope "Central Facility" and energy types "electricity, gas"
3. WHEN the upstream tenant is selected THEN the system SHALL display "Camp & Utilities Meter" with scope "Camp / Common Services" and energy types "electricity"
4. WHEN viewing energy meters THEN the system SHALL display linked assets count for each meter
5. WHEN viewing energy meters THEN the system SHALL display latest kW reading and status badge based on mock thresholds

### Requirement 3

**User Story:** As an upstream operations engineer, I want to access real-time energy consumption monitoring for upstream facilities, so that I can track electricity, gas, and diesel usage across wellpads and production facilities.

#### Acceptance Criteria

1. WHEN navigating to real-time energy consumption THEN the system SHALL display all upstream energy meters with current consumption data
2. WHEN selecting an energy meter THEN the system SHALL display instantaneous demand in kW, daily consumption in kWh, energy cost today in USD, and CO₂ emissions today in kg CO₂
3. WHEN viewing meter details THEN the system SHALL display time-series charts for kW demand and kWh accumulation over the last 24 hours
4. WHEN viewing meter analytics THEN the system SHALL display baseline comparison showing percentage over/under baseline consumption
5. WHEN viewing energy data THEN the system SHALL display sector/subsector badges showing "Oil & Gas" and "Upstream"

### Requirement 4

**User Story:** As an energy analyst, I want to access load profiling and forecasting for upstream facilities, so that I can understand consumption patterns and predict future energy needs.

#### Acceptance Criteria

1. WHEN navigating to load profiling THEN the system SHALL display load profiles for "Pad A", "Compressor Station", and "Camp & Utilities"
2. WHEN selecting a load profile THEN the system SHALL display a 24-hour load curve with peak period highlights
3. WHEN viewing load profiles THEN the system SHALL display tomorrow's forecast chart using mock offset values
4. WHEN viewing load analytics THEN the system SHALL display peak demand in kW and load factor percentage
5. WHEN accessing load profiling features THEN the system SHALL maintain upstream facility context and metadata

### Requirement 5

**User Story:** As a sustainability engineer, I want to view carbon emissions calculations for upstream operations, so that I can track and report environmental impact of energy consumption.

#### Acceptance Criteria

1. WHEN navigating to carbon emissions calculation THEN the system SHALL display CO₂ emissions breakdown by electricity, gas, and diesel consumption
2. WHEN viewing emissions data THEN the system SHALL calculate CO₂ emissions using upstream emission factors multiplied by energy consumption
3. WHEN viewing emissions analytics THEN the system SHALL display CO₂ per production unit using kg CO₂ per BBL and per MSCF metrics
4. WHEN accessing emissions features THEN the system SHALL use mock production figures for demonstration purposes
5. WHEN viewing carbon calculations THEN the system SHALL maintain transparent calculation methods in code for demo clarity

### Requirement 6

**User Story:** As a cost analyst, I want to view energy cost analysis for upstream operations, so that I can understand energy expenditure patterns and identify cost optimization opportunities.

#### Acceptance Criteria

1. WHEN navigating to energy cost analysis THEN the system SHALL display cost breakdown by meter and energy type
2. WHEN viewing cost data THEN the system SHALL show daily or weekly energy costs for electricity, gas, and diesel
3. WHEN viewing cost analytics THEN the system SHALL display total daily energy cost in USD and cost per BBL or per MSCF
4. WHEN viewing cost breakdown THEN the system SHALL identify top 3 cost-driving assets or meters
5. WHEN accessing cost analysis features THEN the system SHALL use upstream tariff data for cost calculations

### Requirement 7

**User Story:** As a user navigating the EMS features, I want the existing navigation structure to remain unchanged while supporting upstream context, so that the interface remains consistent and familiar.

#### Acceptance Criteria

1. WHEN accessing EMS features THEN the system SHALL preserve all existing feature sets under the Energy area
2. WHEN navigating EMS features THEN the system SHALL maintain canonical routing patterns for all feature paths
3. WHEN using EMS navigation THEN the system SHALL apply sector metadata "Oil & Gas" and subsector metadata "Upstream" to all features
4. WHEN viewing EMS features THEN the system SHALL display appropriate icons for each feature set
5. WHEN accessing any EMS feature THEN the system SHALL include industry tags for future filtering capabilities

### Requirement 8

**User Story:** As a user viewing upstream energy data, I want to see upstream-specific energy assets and telemetry, so that I can monitor the most relevant parameters for oil and gas operations.

#### Acceptance Criteria

1. WHEN viewing upstream assets THEN the system SHALL display energy consumer flags and primary energy types for wellheads, pumps, and compressors
2. WHEN viewing asset energy data THEN the system SHALL display nominal power ratings in kW and energy cost centers
3. WHEN viewing energy telemetry THEN the system SHALL display mock time-series data for kWh and kW measurements
4. WHEN viewing energy baselines THEN the system SHALL display baseline kWh per day and per production unit metrics
5. WHEN viewing energy parameters THEN the system SHALL use upstream-specific units like kWh per BBL and kWh per MSCF

### Requirement 9

**User Story:** As a developer maintaining the platform, I want the EMS architecture to remain generic and reusable, so that other sectors can be easily added without architectural changes.

#### Acceptance Criteria

1. WHEN implementing upstream features THEN the system SHALL preserve the existing generic EMS logic and architecture
2. WHEN adding upstream context THEN the system SHALL not create new Energy areas but extend the existing one
3. WHEN implementing upstream features THEN the system SHALL maintain the nLVE pattern across all new pages
4. WHEN adding upstream data THEN the system SHALL use the existing mock data system without backend integration
5. WHEN extending EMS features THEN the system SHALL ensure all pages load without errors under the upstream tenant context

### Requirement 10

**User Story:** As a user interacting with upstream energy data, I want consistent visual design and component patterns, so that the EMS features integrate seamlessly with the rest of the platform.

#### Acceptance Criteria

1. WHEN viewing EMS pages THEN the system SHALL follow the same dark theme, typography, and component patterns as the rest of Plant4.0
2. WHEN displaying energy types THEN the system SHALL use consistent iconography with bolt for electricity, flame for gas, and droplet for diesel
3. WHEN showing energy metrics THEN the system SHALL reuse existing KPICard, StatusBadge, and layout components
4. WHEN indicating sector context THEN the system SHALL display sector/subsector badges that are visual but lightweight
5. WHEN presenting energy data THEN the system SHALL maintain consistent color coding and status indicators across all EMS features