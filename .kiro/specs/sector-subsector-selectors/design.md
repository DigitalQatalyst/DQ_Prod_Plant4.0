# Design Document: Sector and Subsector Selectors

## Overview

This design implements two new dropdown selectors in the TopBar component that allow users to filter their view by industry sector and subsector. The implementation follows the existing design patterns established by the Tenant Selector, ensuring visual consistency and maintainability. The feature uses React Context for state management and integrates seamlessly with the existing AppContext architecture.

The selectors will be positioned in the center section of the TopBar, immediately to the right of the Tenant Selector, creating a logical flow: Organization → Sector → Subsector. This hierarchical arrangement helps users understand the filtering context at a glance.

## Architecture

### Component Structure

The implementation follows the existing component architecture:

```
TopBar (Modified)
├── Tenant Selector (Existing)
├── Sector Selector (New)
├── Subsector Selector (New)
└── Multi-Stream Placeholder (Existing)
```

### State Management

The sector and subsector state will be managed through the existing AppContext provider, following the same pattern as `currentTenant` and `userPersona`. This ensures:
- Centralized state management
- Easy access from any component
- Consistent state update patterns
- Type-safe state access

### Data Flow

1. User clicks Sector Selector → Dropdown opens with all sectors
2. User selects a sector → AppContext updates `currentSector`
3. Subsector Selector automatically updates to show subsectors for the new sector
4. User clicks Subsector Selector → Dropdown opens with filtered subsectors
5. User selects a subsector → AppContext updates `currentSubsector`

## Components and Interfaces

### Modified Components

#### TopBar Component (`src/components/layout/TopBar.tsx`)

The TopBar will be modified to include two new dropdown selectors positioned between the Tenant Selector and the Multi-Stream placeholder. The selectors will use the same `DropdownMenu` components from shadcn/ui that the Tenant Selector uses.

**New JSX Structure:**
```tsx
<div className="flex items-center gap-3">
  {/* Existing Tenant Selector */}
  <TenantSelector />
  
  {/* New Sector Selector */}
  <SectorSelector />
  
  {/* New Subsector Selector */}
  <SubsectorSelector />
  
  {/* Existing Multi-Stream Placeholder */}
  <MultiStreamPlaceholder />
</div>
```

#### AppContext (`src/context/AppContext.tsx`)

The AppContext will be extended to include sector and subsector state management.

**New Context Properties:**
```typescript
interface AppContextType {
  // ... existing properties
  currentSector: Sector;
  setCurrentSector: (sector: Sector) => void;
  currentSubsector: string;
  setCurrentSubsector: (subsector: string) => void;
  availableSubsectors: string[];
}
```

### New Type Definitions

#### Sector Type (`src/types/navigation.ts`)

```typescript
export interface Sector {
  id: string;
  name: string;
  subsectors: string[];
}
```

### Data Structures

#### Sector and Subsector Data (`src/data/mockData.ts`)

```typescript
export const sectors: Sector[] = [
  {
    id: "oil-gas",
    name: "Oil & Gas",
    subsectors: ["Upstream", "Midstream", "Downstream"]
  },
  {
    id: "power",
    name: "Power",
    subsectors: ["Generation", "Transmission", "Distribution"]
  },
  {
    id: "fmcg",
    name: "FMCG",
    subsectors: [
      "Food & Beverage",
      "Personal Care & Cosmetics",
      "Household Care",
      "Health & Wellness (OTC)"
    ]
  },
  {
    id: "water",
    name: "Water",
    subsectors: [
      "Water Supply & Treatment",
      "Distribution & Networks",
      "Wastewater & Reuse"
    ]
  },
  {
    id: "mining",
    name: "Mining",
    subsectors: ["Metal Ores", "Mineral Fuels", "Industrial Minerals", "Gemstones"]
  }
];
```

## Data Models

### Sector Model

- **id**: Unique identifier for the sector (kebab-case string)
- **name**: Display name of the sector
- **subsectors**: Array of subsector names belonging to this sector

### State Model

The application state will maintain:
- **currentSector**: The currently selected Sector object
- **currentSubsector**: The currently selected subsector name (string)
- **availableSubsectors**: Computed array of subsectors for the current sector

### Default Values

- Default Sector: Oil & Gas (id: "oil-gas")
- Default Subsector: "Upstream"

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Sector selection updates state and UI
*For any* sector in the available sectors list, when a user selects that sector, the AppContext currentSector should be updated to that sector and the Sector Selector button should display that sector's name.
**Validates: Requirements 1.3, 1.4**

### Property 2: Subsector selection updates state and UI
*For any* subsector in the available subsectors list, when a user selects that subsector, the AppContext currentSubsector should be updated to that subsector and the Subsector Selector button should display that subsector's name.
**Validates: Requirements 2.4, 2.5**

### Property 3: Subsector filtering matches selected sector
*For any* sector selection, the available subsectors in the Subsector Selector should contain only the subsectors that belong to the currently selected sector.
**Validates: Requirements 2.2, 2.3**

### Property 4: Combined display format
*For any* valid sector and subsector combination, when both are selected, the system should display both values in a formatted string containing the sector name and subsector name.
**Validates: Requirements 3.1**

### Property 5: State persistence
*For any* sector and subsector selection, the selected values should remain in the AppContext until explicitly changed by the user, regardless of other application state changes.
**Validates: Requirements 3.3, 3.4**

### Property 6: Dropdown highlighting
*For any* open dropdown menu with a currently selected item, that item should be visually highlighted in the dropdown list.
**Validates: Requirements 5.2**

### Property 7: Dropdown close on outside click
*For any* open dropdown menu, when a user clicks outside the dropdown area, the dropdown should close.
**Validates: Requirements 5.3**

### Property 8: Automatic subsector selection on sector change
*For any* sector change, the Subsector Selector should automatically update to display the first subsector of the newly selected sector.
**Validates: Requirements 5.5**

## Error Handling

### Invalid Sector Selection
- If a sector object is missing required properties (id, name, or subsectors), the system should log a warning and fall back to the default sector (Oil & Gas)
- If the sectors array is empty or undefined, the system should log an error and render the selectors in a disabled state

### Invalid Subsector Selection
- If a subsector string is empty or undefined, the system should fall back to the first subsector of the current sector
- If the current sector has no subsectors, the system should disable the Subsector Selector and log a warning

### State Synchronization Errors
- If AppContext fails to update, the UI should not change and an error should be logged to the console
- If there's a mismatch between currentSector and currentSubsector (subsector doesn't belong to sector), the system should automatically correct by setting the subsector to the first subsector of the current sector

### UI Interaction Errors
- If a dropdown fails to open due to a rendering error, the system should log the error and maintain the current state
- If a user rapidly clicks between selectors, the system should debounce the state updates to prevent race conditions

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and integration points:

**Component Rendering Tests:**
- Verify TopBar renders with Sector and Subsector Selectors in correct positions
- Verify initial state shows "Oil & Gas" and "Upstream" as defaults
- Verify dropdown menus render with correct sector/subsector lists

**User Interaction Tests:**
- Verify clicking Sector Selector opens dropdown with all five sectors
- Verify clicking Subsector Selector opens dropdown with filtered subsectors
- Verify clicking outside dropdown closes it

**Data Structure Tests:**
- Verify sectors array contains exactly five sectors with correct structure
- Verify each sector has id, name, and subsectors array properties

**Edge Cases:**
- Verify behavior when switching from a sector with many subsectors to one with few
- Verify behavior when tenant switching occurs

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** (JavaScript/TypeScript property-based testing library).

Each property-based test will:
- Run a minimum of 100 iterations with randomly generated inputs
- Be tagged with a comment referencing the specific correctness property from this design document
- Use the format: `// Feature: sector-subsector-selectors, Property {number}: {property_text}`

**Property Test Coverage:**

1. **Sector Selection Property Test**: Generate random sector selections and verify state and UI updates correctly (Property 1)
2. **Subsector Selection Property Test**: Generate random subsector selections and verify state and UI updates correctly (Property 2)
3. **Subsector Filtering Property Test**: Generate random sector selections and verify subsector list is correctly filtered (Property 3)
4. **Display Format Property Test**: Generate random sector/subsector combinations and verify display format (Property 4)
5. **State Persistence Property Test**: Generate random sequences of selections and verify state persists (Property 5)
6. **Dropdown Highlighting Property Test**: Generate random selections and verify highlighting in open dropdowns (Property 6)
7. **Outside Click Property Test**: Generate random click positions and verify dropdown closes when outside (Property 7)
8. **Auto-Selection Property Test**: Generate random sector changes and verify automatic subsector selection (Property 8)

**Test Generators:**

Custom generators will be created for:
- Valid Sector objects with random ids, names, and subsector arrays
- Valid subsector strings from the available subsectors
- Sequences of user interactions (clicks, selections, tenant switches)
- Click coordinates (inside vs outside dropdown boundaries)

The property-based tests will focus on core state management and UI synchronization logic, ensuring the selectors behave correctly across all possible user interactions and data combinations.

