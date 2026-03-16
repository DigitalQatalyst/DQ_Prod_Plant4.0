# Batch Update Script for PA Pages

This document tracks the implementation of search/sort/filter for all remaining PA pages.

## Pages to Update

### High Priority
1. ✅ WorkflowsPage.tsx - COMPLETED
2. ⏳ TriggersPage.tsx
3. ⏳ AlarmRulesPage.tsx  
4. ⏳ ControlModelsPage.tsx

### Medium Priority
5. ⏳ SequencesPage.tsx
6. ⏳ ControlRulesPage.tsx
7. ⏳ EventPatternsPage.tsx
8. ⏳ SimulationPage.tsx

### Low Priority
9. ⏳ VersionsPage.tsx
10. ⏳ ApprovalsPage.tsx
11. ⏳ AuditLogsPage.tsx

## Implementation Checklist for Each Page

For each page, the following changes are needed:

### 1. Add useMemo import
```typescript
import { useState, useEffect, useMemo } from "react";
```

### 2. Add state variables
```typescript
const [sortBy, setSortBy] = useState<string>("updated-desc");
const [statusFilter, setStatusFilter] = useState<string>("all");
// Add page-specific filters
```

### 3. Add filter options computation
```typescript
const types = useMemo(() => {
  const typeSet = new Set(records.map(r => r.type_field));
  return Array.from(typeSet).sort();
}, [records]);
```

### 4. Add filtering and sorting logic
```typescript
const filteredRecords = useMemo(() => {
  let filtered = records.filter((r) => {
    // Search, status, and type filtering
    return true;
  });
  
  filtered.sort((a, b) => {
    // Sorting logic
  });
  
  return filtered;
}, [records, searchQuery, sortBy, ...filters]);
```

### 5. Update ListPane
```typescript
<ListPane
  count={filteredRecords.length}  // Update from records.length
  sortOptions={[...]}
  sortValue={sortBy}
  onSortChange={setSortBy}
  filters={[...]}
>
  {filteredRecords.map(...)}  // Update from records.map
</ListPane>
```

## Status

- Total Pages: 11
- Completed: 1 (WorkflowsPage)
- Remaining: 10
