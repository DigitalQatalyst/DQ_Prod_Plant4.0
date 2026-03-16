# Search, Sort, and Filter Implementation Guide for PA Pages

## Overview
This guide explains how to implement collapsible search, sort, and filter functionality on all Process Automation (PA) pages. The functionality is hidden by default and revealed when the user clicks a button with search, filter, and sort icons.

## What Was Changed

### 1. ListPane Component (`src/components/layout/ListPane.tsx`)
The `ListPane` component has been enhanced with:
- **Collapsible controls**: Search/filter/sort controls are hidden by default
- **Toggle button**: A button with three icons (Search, Filter, Sort) to show/hide controls
- **Sort support**: New `sortOptions` and `onSortChange` props for sorting functionality
- **Visual feedback**: The toggle button highlights when controls are visible

### 2. Example Implementation (`ActionBindingsPage.tsx`)
The `ActionBindingsPage` demonstrates the complete pattern with:
- **Search**: Filter by name, command, or target system
- **Sort**: 6 sort options (name A-Z/Z-A, created oldest/newest, updated least/most recent)
- **Filters**: Status (all/active/inactive) and Action Type (dynamic based on data)

## Implementation Steps for Other PA Pages

### Step 1: Add State Variables
Add these state variables to your page component:

```typescript
const [sortBy, setSortBy] = useState<string>("updated-desc");
const [statusFilter, setStatusFilter] = useState<string>("all");
// Add any additional filter states specific to your page
```

### Step 2: Update the Filtering Logic
Enhance your `filteredRecords` useMemo to include sorting and filtering:

```typescript
const filteredRecords = useMemo(() => {
  let filtered = records.filter((r) => {
    // Search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const matchesSearch = 
        r.name.toLowerCase().includes(search) ||
        // Add other searchable fields
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter === "active" && !r.is_active) return false;
    if (statusFilter === "inactive" && r.is_active) return false;

    // Add other filters as needed

    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "created-asc":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "created-desc":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "updated-asc":
        return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      case "updated-desc":
      default:
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    }
  });

  return filtered;
}, [records, searchQuery, sortBy, statusFilter /* add other filter dependencies */]);
```

### Step 3: Add Sort Options to ListPane
Update your `ListPane` component to include sort options:

```typescript
<ListPane
  title="Your Page Title"
  subtitle={`${currentSector.name} · ${currentSubsector}`}
  count={filteredRecords.length}
  searchPlaceholder="Search..."
  onSearch={setSearchQuery}
  sortOptions={[
    { value: "name-asc", label: "Name (A-Z)" },
    { value: "name-desc", label: "Name (Z-A)" },
    { value: "created-asc", label: "Oldest First" },
    { value: "created-desc", label: "Newest First" },
    { value: "updated-asc", label: "Least Recently Updated" },
    { value: "updated-desc", label: "Most Recently Updated" },
  ]}
  onSortChange={setSortBy}
  // ... rest of props
>
```

### Step 4: Add Filters to ListPane
Add filter configurations based on your data:

```typescript
<ListPane
  // ... other props
  filters={[
    {
      key: "status",
      label: "Status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: "all", label: "All Status" },
        { value: "active", label: "Active Only" },
        { value: "inactive", label: "Inactive Only" },
      ],
    },
    // Add more filters as needed
  ]}
>
```

## Common Sort Options

### Standard Sort Options (for most pages)
```typescript
sortOptions={[
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "created-asc", label: "Oldest First" },
  { value: "created-desc", label: "Newest First" },
  { value: "updated-asc", label: "Least Recently Updated" },
  { value: "updated-desc", label: "Most Recently Updated" },
]}
```

### Additional Sort Options (page-specific)
- **Workflows**: Add "Last Executed" sort
- **Alarm Rules**: Add "Priority" or "Severity" sort
- **Triggers**: Add "Trigger Type" sort
- **Sequences**: Add "Step Count" sort

## Common Filter Patterns

### Status Filter (for all pages)
```typescript
{
  key: "status",
  label: "Status",
  value: statusFilter,
  onChange: setStatusFilter,
  options: [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active Only" },
    { value: "inactive", label: "Inactive Only" },
  ],
}
```

### Type Filter (dynamic based on data)
```typescript
// First, create a useMemo to get unique types
const types = useMemo(() => {
  const typeSet = new Set(records.map(r => r.type_field));
  return Array.from(typeSet).sort();
}, [records]);

// Then use in filter
{
  key: "type",
  label: "Type",
  value: typeFilter,
  onChange: setTypeFilter,
  options: [
    { value: "all", label: "All Types" },
    ...types.map(type => ({ 
      value: type, 
      label: type.charAt(0).toUpperCase() + type.slice(1) 
    })),
  ],
}
```

## Page-Specific Recommendations

### TagMappingPage
- **Sort**: Name, Created, Updated, Data Type
- **Filters**: Status, Data Type, Source System

### WorkflowsPage
- **Sort**: Name, Created, Updated, Last Executed
- **Filters**: Status, Trigger Type, Approval Status

### ControlModelsPage
- **Sort**: Name, Created, Updated, State Count
- **Filters**: Status, Current State

### TriggersPage
- **Sort**: Name, Created, Updated, Trigger Type
- **Filters**: Status, Trigger Type, Event Type

### AlarmRulesPage
- **Sort**: Name, Created, Updated, Priority, Severity
- **Filters**: Status, Priority, Severity, Alarm Type

### EventPatternsPage
- **Sort**: Name, Created, Updated, Pattern Type
- **Filters**: Status, Pattern Type, Complexity

### SequencesPage
- **Sort**: Name, Created, Updated, Step Count
- **Filters**: Status, Sequence Type

### ControlRulesPage
- **Sort**: Name, Created, Updated, Rule Type
- **Filters**: Status, Rule Type, Control Mode

### VersionsPage
- **Sort**: Version Number, Created, Updated
- **Filters**: Status, Version Type

### ApprovalsPage
- **Sort**: Created, Updated, Priority
- **Filters**: Status, Approval Status, Priority

### SimulationPage
- **Sort**: Name, Created, Updated, Scenario Type
- **Filters**: Status, Scenario Type, Simulation Status

### AuditLogsPage
- **Sort**: Timestamp, Event Type, User
- **Filters**: Event Type, User, Severity

## Testing Checklist

For each page implementation, verify:

- [ ] Toggle button appears in the list pane header
- [ ] Toggle button shows three icons (Search, Filter, Sort)
- [ ] Search/filter/sort controls are hidden by default
- [ ] Clicking toggle button reveals controls
- [ ] Toggle button highlights when controls are visible
- [ ] Search filters records correctly
- [ ] Sort options work as expected
- [ ] Filters apply correctly
- [ ] Multiple filters can be combined
- [ ] Record count updates when filters are applied
- [ ] No console errors
- [ ] Performance is acceptable with large datasets

## Benefits

1. **Cleaner UI**: Controls are hidden until needed, reducing visual clutter
2. **Consistent UX**: Same pattern across all PA pages
3. **Powerful Filtering**: Users can combine search, sort, and multiple filters
4. **Better Performance**: useMemo ensures efficient re-rendering
5. **Scalable**: Easy to add new sort options or filters

## Next Steps

Apply this pattern to the remaining PA pages in this order:

**High Priority** (Core automation features):
1. TriggersPage.tsx
2. AlarmRulesPage.tsx
3. WorkflowsPage.tsx (if not already done)
4. TagMappingPage.tsx (if not already done)

**Medium Priority** (Advanced features):
5. SequencesPage.tsx
6. ControlRulesPage.tsx
7. EventPatternsPage.tsx
8. SimulationPage.tsx

**Low Priority** (Governance/Monitoring):
9. VersionsPage.tsx
10. ApprovalsPage.tsx
11. AuditLogsPage.tsx

---

**Last Updated**: 2026-02-16
**Status**: ListPane component updated, ActionBindingsPage implemented as reference
**Reference Files**: 
- `src/components/layout/ListPane.tsx`
- `src/pages/automate/ActionBindingsPage.tsx`
