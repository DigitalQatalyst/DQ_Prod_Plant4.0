# Design Document

## Overview

This feature implements a comprehensive Process Automation (PA) capability for the Plant4.0 Platform, organized into four standard feature groups with 13 total features. Each feature implements the full LVE (List-View-Edit) pattern with sector/subsector filtering and includes pre-configured templates for three key industrial sectors.

The four PA Feature Groups are:

1. **Integrate & Model** (3 features)
   - Tag Mapping - Map physical tags/data points to logical process variables
   - Control Models - Define state machines and process models
   - Action Bindings - Bind control actions to physical actuators

2. **Monitor & Detect** (3 features)
   - Triggers - Define event triggers based on process conditions
   - Alarm Rules - Configure alarm classification and routing
   - Event Patterns - Advanced pattern matching for complex events

3. **Automate & Control** (3 features)
   - Workflows - Multi-step automation sequences
   - Sequences - Detailed step-by-step procedures
   - Control Rules - Logic rules for automated control

4. **Govern & Assure** (4 features)
   - Versions - Version control for automation configurations
   - Approvals - Approval workflows for changes
   - Simulation - Test automation logic with simulated data
   - Audit Logs - Track all automation changes and executions

Each feature includes pre-configured templates for:
- **Oil & Gas (Upstream)**: Wells, pumps, separators, tanks
- **Power (Transmission)**: Breakers, lines, substations, FLISR
- **FMCG (Food & Beverage)**: Production lines, filling, CIP systems

## Architecture

### Component Structure

The implementation follows the established Plant4.0 Platform architecture:

```
navigation.ts (data) → MenuPane.tsx (sidebar) → App.tsx (routing) → PA Feature Pages (LVE pattern)
                                                                              ↓
                                                                    ListPane + WorkPane + (optional) PopPane
                                                                              ↓
                                                                    AppContext (sector/subsector state)
                                                                              ↓
                                                                    mockData.ts (sector templates)
```

### Data Flow

1. **Navigation**: Navigation data in `src/data/navigation.ts` defines the 13 PA features across 4 feature groups
2. **Routing**: Routes in `App.tsx` map each PA feature path to its page component
3. **Context**: `AppContext` provides current sector/subsector selections from the top bar
4. **Filtering**: PA pages read sector/subsector from context and filter displayed records
5. **Templates**: `mockData.ts` contains pre-configured template data for each sector/subsector combination
6. **LVE Pattern**: Each page uses `ListPane` (left), `WorkPane` (center), and optionally `PopPane` (right)

### Sector/Subsector Integration

PA features integrate with the existing sector/subsector context:

```typescript
// Pages read from AppContext
const { currentSector, currentSubsector } = useApp();

// Filter data based on context
const filteredRecords = useMemo(() => {
  return allRecords.filter(r => 
    r.sector === currentSector.id && 
    r.subsector === currentSubsector
  );
}, [allRecords, currentSector, currentSubsector]);
```

When the user changes sector/subsector in the top bar, all PA pages automatically update their displayed records.

## Components and Interfaces

### Navigation Data Structure

The navigation data follows the existing TypeScript interfaces:

```typescript
interface FeatureArea {
  id: string;
  name: string;
  shortName?: string;
  featureSets: FeatureSet[];
  icon: LucideIcon;
}

interface FeatureSet {
  id: string;
  name: string;
  features: Feature[];
  icon?: LucideIcon;
}

interface Feature {
  id: string;
  name: string;
  path: string;
  icon?: LucideIcon;
  description?: string;
}
```

### Updated Automate Feature Area

The "Automate" feature area will be expanded with four comprehensive feature sets:

```typescript
{
  id: "automate",
  name: "Automate (PA)",
  shortName: "Automate",
  icon: Settings2,
  featureSets: [
    {
      id: "integrate-model",
      name: "Integrate & Model",
      icon: Database,
      features: [
        { id: "tag-mapping", name: "Tag Mapping", path: "/automate/integrate/tags", icon: Tag },
        { id: "control-models", name: "Control Models", path: "/automate/integrate/models", icon: GitBranch },
        { id: "action-bindings", name: "Action Bindings", path: "/automate/integrate/bindings", icon: Link }
      ]
    },
    {
      id: "monitor-detect",
      name: "Monitor & Detect",
      icon: Eye,
      features: [
        { id: "triggers", name: "Triggers", path: "/automate/monitor/triggers", icon: Zap },
        { id: "alarm-rules", name: "Alarm Rules", path: "/automate/monitor/alarms", icon: Bell },
        { id: "event-patterns", name: "Event Patterns", path: "/automate/monitor/patterns", icon: TrendingUp }
      ]
    },
    {
      id: "automate-control",
      name: "Automate & Control",
      icon: Settings2,
      features: [
        { id: "workflows", name: "Workflows", path: "/automate/control/workflows", icon: Workflow },
        { id: "sequences", name: "Sequences", path: "/automate/control/sequences", icon: List },
        { id: "control-rules", name: "Control Rules", path: "/automate/control/rules", icon: FileCode }
      ]
    },
    {
      id: "govern-assure",
      name: "Govern & Assure",
      icon: Shield,
      features: [
        { id: "versions", name: "Versions", path: "/automate/govern/versions", icon: GitCommit },
        { id: "approvals", name: "Approvals", path: "/automate/govern/approvals", icon: CheckSquare },
        { id: "simulation", name: "Simulation", path: "/automate/govern/simulation", icon: Play },
        { id: "audit-logs", name: "Audit Logs", path: "/automate/govern/audit", icon: FileText }
      ]
    }
  ]
}
```

### Icon Selection

Icons from `lucide-react` are chosen to represent each feature's purpose:

**Integrate & Model:**
- Tag Mapping: `Tag` - represents tagging and mapping
- Control Models: `GitBranch` - represents state machines and branching logic
- Action Bindings: `Link` - represents connections and bindings

**Monitor & Detect:**
- Triggers: `Zap` - represents event triggers
- Alarm Rules: `Bell` - represents alarms and notifications
- Event Patterns: `TrendingUp` - represents pattern detection

**Automate & Control:**
- Workflows: `Workflow` - represents multi-step processes
- Sequences: `List` - represents ordered steps
- Control Rules: `FileCode` - represents logic and rules

**Govern & Assure:**
- Versions: `GitCommit` - represents version control
- Approvals: `CheckSquare` - represents approval processes
- Simulation: `Play` - represents testing and simulation
- Audit Logs: `FileText` - represents logging and documentation

### PA Data Models

Each PA feature uses a common data model structure with sector/subsector fields:

```typescript
interface PARecord {
  id: string;
  name: string;
  description: string;
  sector: string;        // e.g., "oil-gas", "power", "fmcg"
  subsector: string;     // e.g., "upstream", "transmission", "food-beverage"
  status: string;        // e.g., "active", "draft", "archived"
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  // Feature-specific fields...
}

// Example: Tag Mapping Record
interface TagMapping extends PARecord {
  sourceTag: string;
  targetVariable: string;
  dataType: string;
  unit: string;
  scalingFactor?: number;
}

// Example: Workflow Record
interface Workflow extends PARecord {
  steps: WorkflowStep[];
  triggerType: string;
  approvalRequired: boolean;
}
```

### LVE Page Component Pattern

Each PA feature page follows the full LVE pattern used in AssetPortfolio:

```typescript
export function TagMappingPage() {
  const { currentSector, currentSubsector } = useApp();
  const [selectedRecord, setSelectedRecord] = useState<TagMapping | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter records by sector/subsector
  const filteredRecords = useMemo(() => {
    return tagMappings.filter(r => 
      r.sector === currentSector.id && 
      r.subsector === currentSubsector &&
      (searchQuery === "" || r.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [currentSector, currentSubsector, searchQuery]);

  const tabs = [
    { id: "overview", label: "Overview", content: <OverviewTab record={selectedRecord} /> },
    { id: "parameters", label: "Parameters", content: <ParametersTab record={selectedRecord} /> },
    { id: "linked-assets", label: "Linked Assets", content: <LinkedAssetsTab record={selectedRecord} /> },
    { id: "history", label: "History", content: <HistoryTab record={selectedRecord} /> }
  ];

  return (
    <>
      <ListPane
        title="Tag Mapping"
        subtitle={`${currentSector.name} · ${currentSubsector}`}
        count={filteredRecords.length}
        searchPlaceholder="Search tag mappings..."
        onSearch={setSearchQuery}
        actions={<Button size="sm" className="w-full mt-2 gap-2"><Plus />Add Mapping</Button>}
      >
        {filteredRecords.map(record => (
          <RecordListItem
            key={record.id}
            record={record}
            isSelected={selectedRecord?.id === record.id}
            onClick={() => setSelectedRecord(record)}
          />
        ))}
      </ListPane>
      
      <WorkPane
        title={selectedRecord?.name || "Tag Mapping"}
        subtitle={selectedRecord?.description || "Select a mapping to view details"}
        tabs={tabs}
      />
    </>
  );
}
```

## Data Models

### Core PA Data Model

All PA records share a common base structure:

```typescript
interface PARecord {
  id: string;
  name: string;
  description: string;
  sector: string;
  subsector: string;
  status: "active" | "draft" | "archived";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
```

### Sector-Specific Template Data

Template data is organized by sector and subsector in `mockData.ts`:

#### Oil & Gas (Upstream) Templates

**Tag Mappings:**
- Wellhead tags: `WH-001.Pressure`, `WH-001.Temperature`, `WH-001.ChokePosition`
- ESP/PCP tags: `ESP-01.Speed`, `ESP-01.Current`, `ESP-01.Torque`, `ESP-01.Vibration`
- Separator tags: `SEP-A.Level`, `SEP-A.Pressure`, `SEP-A.Temperature`
- Tank tags: `TANK-01.Level`, `TANK-01.Volume`

**Control Models:**
- Well Model: States = [Shut-in, Startup, Flowing, Test, Trip]
- Pump Model (ESP/PCP): States = [Off, Starting, Running, Degraded, Trip]
- Separator Model: States = [Normal, High-Level, High-High-Level, Bypass]

**Workflows:**
- Well Startup: Pre-checks → Open choke gradually → Monitor stabilization → Normal operation
- Well Test: Route to test separator → Stabilize → Measure rates → Revert routing
- Separator Management: Monitor levels → Adjust valves → Control pumps → Prevent overflow
- Tank Transfer: Check levels → Open valves → Start pump → Monitor transfer → Auto-stop

#### Power (Transmission) Templates

**Tag Mappings:**
- Breaker tags: `BKR-101.Status`, `BKR-101.Command`, `BKR-101.TripSignal`
- Line measurements: `LINE-A.Voltage`, `LINE-A.Current`, `LINE-A.Power`, `LINE-A.Frequency`
- Relay tags: `RELAY-R1.Trip`, `RELAY-R1.Reclose`, `RELAY-R1.Alarm`

**Control Models:**
- Line Model: States = [In-service, Out-of-service, Derated]
- Busbar Model: States = [Energized, De-energized, Isolated]
- Breaker Model: States = [Open, Closed, Tagged, Locked-out]

**Workflows:**
- Fault Isolation: Detect fault → Open breakers → Isolate section → Log event
- Automatic Restoration: Identify healthy sections → Reconfigure topology → Restore loads → Verify
- Planned Switching: Lock out → Verify de-energized → Perform work → Restore → Test

#### FMCG (Food & Beverage) Templates

**Tag Mappings:**
- Machine tags: `FILLER-01.Speed`, `CAPPER-01.Status`, `LABELER-01.Count`
- Conveyor tags: `CONV-MAIN.Speed`, `CONV-MAIN.Jam`, `CONV-MAIN.Blockage`
- Process tags: `ZONE-A.Temperature`, `TANK-MIX.Level`, `SCALE-01.Weight`
- CIP tags: `CIP-01.Phase`, `CIP-01.Temperature`, `CIP-01.Conductivity`

**Control Models:**
- Machine Model: States = [Idle, Starting, Running, Blocked, Faulted]
- Line Model: States = [Stopped, Starting, Running, Changeover, CIP]
- CIP Cycle Model: States = [Pre-rinse, Wash, Rinse, Sanitize, Complete]

**Workflows:**
- Line Startup: Initialize conveyors → Start filler → Start capper → Start labeler → Start packer
- Product Changeover: Stop line → Purge → Change parameters → Small clean → Restart
- CIP Workflow: Pre-rinse → Caustic wash → Rinse → Acid wash → Final rinse → Sanitize
- Line Shutdown: Stop packer → Stop labeler → Stop capper → Stop filler → Stop conveyors → Purge

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: All PA pages implement LVE pattern

*For any* PA feature page, the page should render a ListPane component with search, filters, and an "Add New" button.

**Validates: Requirements 2.1**

### Property 2: All PA lists display sector/subsector columns

*For any* PA feature list, the table should include Sector and Subsector as columns for each record.

**Validates: Requirements 2.3, 3.3**

### Property 3: All PA pages respond to sector context changes

*For any* PA feature page, when the currentSector in AppContext changes, the displayed list should automatically update to show only records matching the new sector.

**Validates: Requirements 3.1**

### Property 4: All PA pages respond to subsector context changes

*For any* PA feature page, when the currentSubsector in AppContext changes, the displayed list should automatically update to show only records matching the new subsector.

**Validates: Requirements 3.2**

### Property 5: PA list filters are independent of top-bar context

*For any* PA feature page, when a user manually changes the local Sector/Subsector filters, the top-bar context (currentSector, currentSubsector) should remain unchanged.

**Validates: Requirements 3.5**

### Property 6: All PA features have required navigation properties

*For any* feature in the PA feature groups (Integrate & Model, Monitor & Detect, Automate & Control, Govern & Assure), the feature object should have all required properties: id, name, path, and icon.

**Validates: Requirements 8.2**

### Property 7: All PA feature paths follow URL pattern

*For any* PA feature, the path should match the pattern `/automate/{feature-group-slug}/{feature-slug}` where both slugs are non-empty strings.

**Validates: Requirements 8.3**

### Property 8: All PA features use lucide-react icons

*For any* PA feature or feature group, the icon property should reference a valid icon from the lucide-react library.

**Validates: Requirements 7.5**

### Property 9: Work pane tabs are consistent across PA features

*For any* PA feature page, when a list item is selected, the Work pane should display tabs including at least: Overview, Parameters, Linked Assets, and History.

**Validates: Requirements 2.4**

## Error Handling

### Navigation Errors

- **Missing Route**: If a user navigates to a PA feature path without a defined route, React Router falls through to the `NotFound` component
- **Invalid Feature Data**: TypeScript catches missing required properties at compile time
- **Component Errors**: React error boundaries (if implemented) catch rendering errors

### Data Validation

- **Type Safety**: TypeScript interfaces ensure navigation and PA record data conform to expected structures
- **Runtime Checks**: Components gracefully handle missing or undefined data
- **Sector/Subsector Validation**: AppContext validates sector/subsector changes and falls back to defaults if invalid

### Context Integration

- **Missing Context**: PA pages check for AppContext availability and throw descriptive errors if used outside AppProvider
- **Invalid Sector**: If currentSector is invalid, pages fall back to showing all records or display an error message
- **Filter Mismatch**: If a record's sector/subsector doesn't match any known values, it's excluded from filtered results

### User Experience

- **Loading States**: Show loading indicators when filtering large datasets
- **Empty States**: Display helpful messages when no records match the current sector/subsector
- **Feedback**: Active states in sidebar and breadcrumbs provide visual feedback for current location
- **Accessibility**: All navigation and form elements are keyboard accessible and screen reader friendly

## Testing Strategy

### Unit Testing

Unit tests verify specific examples and data structure correctness:

1. **Navigation Data Structure Tests**
   - Test that "Integrate & Model" contains exactly 3 features: Tag Mapping, Control Models, Action Bindings
   - Test that "Monitor & Detect" contains exactly 3 features: Triggers, Alarm Rules, Event Patterns
   - Test that "Automate & Control" contains exactly 3 features: Workflows, Sequences, Control Rules
   - Test that "Govern & Assure" contains exactly 4 features: Versions, Approvals, Simulation, Audit Logs
   - Test that total PA features count is 13

2. **Sector Template Tests**
   - Test that Oil & Gas Upstream has wellhead, ESP/PCP, separator, and tank tag mappings
   - Test that Power Transmission has breaker, line, and relay tag mappings
   - Test that FMCG Food & Beverage has filler, conveyor, process, and CIP tag mappings
   - Test that each sector/subsector has appropriate workflow templates

3. **Route Configuration Tests**
   - Test that all 13 PA features have corresponding routes in App.tsx
   - Test that existing routes are not affected by new routes

4. **Component Rendering Tests**
   - Test that PA page components render without errors
   - Test that ListPane and WorkPane receive correct props

### Property-Based Testing

Property-based tests verify universal properties across all PA features using **fast-check** (JavaScript/TypeScript property-based testing library):

1. **LVE Pattern Test** (Property 1)
   - Generate: All PA feature page components
   - Verify: Each renders ListPane with search, filters, and "Add New" button
   - Iterations: 100

2. **Sector Column Test** (Property 2)
   - Generate: All PA feature lists
   - Verify: Each includes Sector and Subsector columns
   - Iterations: 100

3. **Sector Context Integration Test** (Property 3)
   - Generate: All PA pages and random sector values
   - Verify: Changing currentSector filters the displayed records
   - Iterations: 100

4. **Subsector Context Integration Test** (Property 4)
   - Generate: All PA pages and random subsector values
   - Verify: Changing currentSubsector filters the displayed records
   - Iterations: 100

5. **Filter Independence Test** (Property 5)
   - Generate: All PA pages and random filter changes
   - Verify: Local filter changes don't affect top-bar context
   - Iterations: 100

6. **Feature Properties Test** (Property 6)
   - Generate: All PA features
   - Verify: Each has id, name, path, and icon properties
   - Iterations: 100

7. **Path Pattern Test** (Property 7)
   - Generate: All PA features
   - Verify: Each path matches `/automate/{group-slug}/{feature-slug}` pattern
   - Iterations: 100

8. **Icon Library Test** (Property 8)
   - Generate: All PA features and feature groups
   - Verify: Each icon is from lucide-react library
   - Iterations: 100

9. **Work Pane Tabs Test** (Property 9)
   - Generate: All PA pages with selected items
   - Verify: Work pane displays Overview, Parameters, Linked Assets, History tabs
   - Iterations: 100

### Integration Testing

Integration tests verify end-to-end flows:

1. **Sidebar Navigation Flow**
   - Navigate through all PA feature groups and features
   - Verify correct pages render for each feature
   - Verify sidebar active states update correctly

2. **Sector/Subsector Context Flow**
   - Change sector in top bar
   - Verify all PA pages update their lists
   - Change subsector in top bar
   - Verify all PA pages update their lists
   - Verify correct template data displays for each sector/subsector

3. **LVE Interaction Flow**
   - Navigate to a PA feature
   - Search and filter records
   - Select a record from the list
   - Verify Work pane displays details
   - Navigate between tabs
   - Click "Add New" and verify form appears

### Manual Testing Checklist

Visual and interaction testing:

- [ ] Verify PA pages match Assets Portfolio visual style (cards, tables, headers, breadcrumbs)
- [ ] Verify font family, size, weight, and colors match other sections
- [ ] Verify button, input, and badge styles are consistent
- [ ] Verify spacing, padding, and layout grid match other LVE pages
- [ ] Verify icons are semantically appropriate and visually consistent
- [ ] Verify hover and active states match other sections
- [ ] Verify keyboard navigation works for all interactive elements
- [ ] Verify screen reader announces navigation and content correctly
- [ ] Verify sector/subsector changes update lists smoothly
- [ ] Verify template data is appropriate for each sector/subsector

## Implementation Notes

### File Changes Required

1. **src/data/navigation.ts**
   - Add four feature sets with 13 total features to the automate feature area
   - Import additional icons from lucide-react (Tag, GitBranch, Link, Zap, Bell, TrendingUp, Workflow, List, FileCode, GitCommit, CheckSquare, Play)

2. **src/data/mockData.ts**
   - Add PA record template data for Oil & Gas (Upstream)
   - Add PA record template data for Power (Transmission)
   - Add PA record template data for FMCG (Food & Beverage)
   - Organize data by feature type (tag mappings, control models, workflows, etc.)

3. **src/pages/automate/** (new directory)
   - Create 13 new PA feature page components implementing full LVE pattern
   - Each page should follow the AssetPortfolio.tsx pattern
   - Include ListPane, WorkPane, and sector/subsector filtering

4. **src/App.tsx**
   - Add 13 new route definitions for PA features
   - Import all new page components
   - Group routes under "Automate" comment section

5. **src/types/navigation.ts** (if needed)
   - Add PARecord interface and feature-specific interfaces
   - Ensure type safety for all PA data structures

### Icon Imports

New icons needed from lucide-react:
- `Tag` - Tag Mapping
- `GitBranch` - Control Models
- `Link` - Action Bindings
- `Zap` - Triggers
- `Bell` - Alarm Rules
- `TrendingUp` - Event Patterns
- `Workflow` - Workflows
- `List` - Sequences
- `FileCode` - Control Rules
- `GitCommit` - Versions
- `CheckSquare` - Approvals
- `Play` - Simulation

Already imported: `FileText` (Audit Logs), `Database`, `Eye`, `Settings2`, `Shield`

### Code Organization

- Create `src/pages/automate/` directory for all PA feature pages
- Group related components within each page file
- Follow naming convention: `{FeatureName}Page.tsx` (e.g., `TagMappingPage.tsx`)
- Keep template data organized by sector/subsector in mockData.ts
- Use consistent naming for PA records: `{feature}Records` (e.g., `tagMappingRecords`)

### Component Patterns

Each PA page should follow this structure:

```typescript
export function TagMappingPage() {
  // 1. Get context
  const { currentSector, currentSubsector } = useApp();
  
  // 2. Local state
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // 3. Filter data
  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      r.sector === currentSector.id && 
      r.subsector === currentSubsector &&
      (searchQuery === "" || r.name.includes(searchQuery))
    );
  }, [currentSector, currentSubsector, searchQuery]);
  
  // 4. Define tabs
  const tabs = [
    { id: "overview", label: "Overview", content: <OverviewTab /> },
    { id: "parameters", label: "Parameters", content: <ParametersTab /> },
    { id: "linked-assets", label: "Linked Assets", content: <LinkedAssetsTab /> },
    { id: "history", label: "History", content: <HistoryTab /> }
  ];
  
  // 5. Render LVE pattern
  return (
    <>
      <ListPane {...listProps}>
        {filteredRecords.map(record => <RecordItem />)}
      </ListPane>
      <WorkPane {...workProps} tabs={tabs} />
    </>
  );
}
```

### Styling Considerations

- Use existing Tailwind classes from AssetPortfolio and other LVE pages
- No custom CSS required
- Maintain consistent spacing: `space-y-6` for sections, `gap-4` for grids
- Use existing badge styles: `status-badge`, `status-online`, etc.
- Follow existing table styles: `data-table` class

### Accessibility

- All interactive elements are keyboard accessible
- Use semantic HTML (button, table, form elements)
- Provide ARIA labels for icon-only buttons
- Ensure focus states are visible
- Screen readers can navigate lists and forms
- Color is not the only indicator of status (use icons + text)

## Future Enhancements

### Stage 03 - Full Functionality

When implementing full functionality:

1. **Backend Integration**
   - Connect to real PA configuration database
   - Implement CRUD operations for all PA record types
   - Add real-time updates via WebSocket or polling
   - Implement proper authentication and authorization

2. **Advanced Editors**
   - Workflow visual editor in PopPane (drag-and-drop nodes)
   - Control model state machine editor
   - Event pattern query builder
   - Tag mapping bulk import/export

3. **Execution Engine**
   - Implement workflow execution engine
   - Add trigger evaluation and alarm generation
   - Implement control rule execution
   - Add simulation engine for testing

4. **Approval Workflows**
   - Multi-step approval processes
   - Email notifications
   - Approval history and audit trail
   - Role-based approval routing

5. **Version Control**
   - Git-like versioning for all PA configurations
   - Diff viewer for comparing versions
   - Rollback capabilities
   - Branch and merge support

### Additional Sector Templates

Expand template library to include:

- **Oil & Gas**: Midstream (pipelines, compressor stations), Downstream (refineries)
- **Power**: Generation (power plants), Distribution (feeders, transformers)
- **Water**: Treatment plants, distribution networks, pump stations
- **Mining**: Extraction, processing, material handling
- **Manufacturing**: Discrete manufacturing, batch processing

### Advanced Features

- **AI-Assisted Configuration**: Suggest tag mappings, workflows, and rules based on asset types
- **Anomaly Detection**: ML-based pattern detection for triggers
- **Optimization**: Recommend control rule improvements based on historical data
- **Cross-Sector Learning**: Apply best practices from one sector to another
- **Simulation**: What-if analysis for workflow changes
- **Collaboration**: Multi-user editing with conflict resolution
- **Mobile Support**: Responsive design for tablet/mobile approval workflows
