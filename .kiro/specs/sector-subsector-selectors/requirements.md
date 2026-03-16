# Requirements Document

## Introduction

This feature adds Sector and Subsector dropdown selectors to the Plant4.0 Platform top navigation bar. These selectors will enable users to filter and contextualize their view based on industry sectors (Oil & Gas, Power, FMCG, Water, Mining) and their respective subsectors. The selectors will be positioned immediately to the right of the existing Tenant Selector and will follow the same visual design language to maintain UI consistency.

## Glossary

- **TopBar**: The horizontal navigation component at the top of the application that contains the platform branding, tenant selector, and user controls
- **Tenant Selector**: The existing dropdown component that allows users to switch between different organizations (e.g., "Saudi Aramco")
- **Sector**: A high-level industry classification (e.g., Oil & Gas, Power, FMCG, Water, Mining)
- **Subsector**: A specific subdivision within a Sector that represents a particular operational area or business segment
- **AppContext**: The React context provider that manages global application state including current tenant, user persona, and selected asset
- **Mock Data**: Static data structures used for prototyping and demonstration purposes before backend integration

## Requirements

### Requirement 1

**User Story:** As a platform user, I want to select an industry sector from a dropdown, so that I can filter my view to assets and operations relevant to that sector.

#### Acceptance Criteria

1. WHEN the TopBar renders, THE system SHALL display a Sector Selector dropdown positioned immediately to the right of the Tenant Selector
2. WHEN a user clicks the Sector Selector, THE system SHALL display a dropdown menu containing all available sectors (Oil & Gas, Power, FMCG, Water, Mining)
3. WHEN a user selects a sector from the dropdown, THE system SHALL update the current sector in the application state
4. WHEN a sector is selected, THE system SHALL display the selected sector name in the Sector Selector button
5. THE Sector Selector SHALL use the same visual styling as the Tenant Selector including font, colors, spacing, padding, hover effects, and chevron icon

### Requirement 2

**User Story:** As a platform user, I want to select a subsector within my chosen sector, so that I can further refine my view to specific operational areas.

#### Acceptance Criteria

1. WHEN the TopBar renders, THE system SHALL display a Subsector Selector dropdown positioned immediately to the right of the Sector Selector
2. WHEN a user clicks the Subsector Selector, THE system SHALL display a dropdown menu containing subsectors relevant to the currently selected sector
3. WHEN the selected sector changes, THE system SHALL update the available subsectors in the Subsector Selector to match the new sector
4. WHEN a user selects a subsector from the dropdown, THE system SHALL update the current subsector in the application state
5. WHEN a subsector is selected, THE system SHALL display the selected subsector name in the Subsector Selector button
6. THE Subsector Selector SHALL use the same visual styling as the Tenant Selector including font, colors, spacing, padding, hover effects, and chevron icon

### Requirement 3

**User Story:** As a platform user, I want the sector and subsector selections to display in a clear format, so that I can quickly understand my current context.

#### Acceptance Criteria

1. WHEN both sector and subsector are selected, THE system SHALL display both values in a combined text format with sector name, separator, and subsector name
2. WHEN the application initializes, THE system SHALL set the default sector to Oil & Gas and default subsector to Upstream
3. THE system SHALL maintain the selected sector and subsector values in the AppContext throughout the user session
4. WHEN a user switches tenants, THE system SHALL preserve the currently selected sector and subsector

### Requirement 4

**User Story:** As a developer, I want sector and subsector data structured in a maintainable format, so that I can easily add or modify sectors and subsectors in the future.

#### Acceptance Criteria

1. THE system SHALL define sector and subsector data in a dedicated data structure within the Mock Data file
2. THE system SHALL organize subsectors as arrays associated with their parent sector
3. THE system SHALL include five sectors with their respective subsectors: Oil & Gas with Upstream, Midstream, and Downstream; Power with Generation, Transmission, and Distribution; FMCG with Food & Beverage, Personal Care & Cosmetics, Household Care, and Health & Wellness (OTC); Water with Water Supply & Treatment, Distribution & Networks, and Wastewater & Reuse; Mining with Metal Ores, Mineral Fuels, Industrial Minerals, and Gemstones
4. THE system SHALL provide TypeScript type definitions for Sector and Subsector data structures

### Requirement 5

**User Story:** As a platform user, I want the sector and subsector selectors to be interactive and responsive, so that I can efficiently navigate between different industry contexts.

#### Acceptance Criteria

1. WHEN a user hovers over the Sector Selector or Subsector Selector, THE system SHALL display the same hover effect as the Tenant Selector
2. WHEN a dropdown menu is open, THE system SHALL highlight the currently selected item
3. WHEN a user clicks outside an open dropdown, THE system SHALL close the dropdown menu
4. THE system SHALL render dropdown menus with proper z-index to appear above other UI elements
5. WHEN a user selects a new sector, THE system SHALL automatically update the Subsector Selector to show the first subsector of the newly selected sector
