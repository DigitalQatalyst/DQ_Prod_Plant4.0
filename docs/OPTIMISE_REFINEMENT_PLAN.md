# Operational Excellence Feature Pages Refinement Plan

## Overview
This document tracks the implementation of search/filter/sort functionality and overview pages for all Operational Excellence (optimise) feature pages.

## Design Pattern
- **Search bar** with Filter and Sort buttons
- **Collapsible filters**: Only displayed when Filter button is clicked
- **Collapsible sort options**: Only displayed when Sort button is clicked
- **Overview page**: Displayed when no list item is selected, showing key metrics and summaries

## Implementation Status

### ✅ **COMPLETED - 18/18 Pages (100%)**

All Operational Excellence feature pages have been successfully updated with the SearchFilterSort component!

#### ✅ CI Feature (5/5 - 100% Complete)
- [x] **CIProjects.tsx** - SearchFilterSort with Owner, Priority, Site, Status filters
- [x] **RCA.tsx** - SearchFilterSort with Category, Priority, Status filters
- [x] **Countermeasures.tsx** - SearchFilterSort with Type, Status, Priority filters
- [x] **ImpactTracking.tsx** - SearchFilterSort with Status, Impact Level filters
- [x] **CIReports.tsx** - SearchFilterSort with Report Type, Status filters

#### ✅ Optimisation Feature (5/5 - 100% Complete)
- [x] **Opportunities.tsx** - SearchFilterSort with Category, Status filters
- [x] **Recommendations.tsx** - SearchFilterSort with Action Type, Status filters
- [x] **Playbooks.tsx** - SearchFilterSort with Category, Status filters
- [x] **Simulations.tsx** - SearchFilterSort with Scenario Type, Status filters
- [x] **Execution.tsx** - SearchFilterSort with System, Status filters

#### ✅ SIM Feature (6/6 - 100% Complete)
- [x] **SIMBoards.tsx** - SearchFilterSort with Site, Status filters
- [x] **SwitchingOrders.tsx** - SearchFilterSort with Priority, Status filters
- [x] **Outages.tsx** - SearchFilterSort with Type, Impact Level, Status filters
- [x] **SIMIssues.tsx** - SearchFilterSort with Category, Priority, Status filters
- [x] **SIMActions.tsx** - SearchFilterSort with Status, Priority filters
- [x] **ShiftPerformance.tsx** - SearchFilterSort with Status filter

#### ✅ Performance Feature (1/1 - 100% Complete)
- [x] **Performance.tsx** - SearchFilterSort with Status filter

## Key Achievements

### Component Development ✅
- [x] Created reusable `SearchFilterSort` component
- [x] Implemented collapsible filter UI with smooth animations
- [x] Implemented collapsible sort UI with smooth animations
- [x] Exported from shared components index
- [x] Applied consistent design pattern across all pages

### Implementation Details ✅
- [x] Eliminated duplicate search bars by setting `showFilters={false}`
- [x] Proper layout: Search (60%), Filter (20%), Sort (20%)
- [x] Collapsible filters and sort sections
- [x] Smooth animations for show/hide
- [x] Consistent styling across all 18 pages

## Filter and Sort Options by Feature

### Opportunities
- **Filters**: Category, Status
- **Sort**: Rank Score (High to Low), Confidence, Impact, Date

### Recommendations
- **Filters**: Action Type, Status
- **Sort**: Benefit, Confidence, Priority, Date

### Playbooks
- **Filters**: Category, Status
- **Sort**: Usage Count, Last Updated, Name

### Simulations
- **Filters**: Scenario Type, Status
- **Sort**: Created Date, Impact, Name

### Execution
- **Filters**: System (SIM/CI), Status
- **Sort**: Most Recent, Status, Target System

### CI Projects
- **Filters**: Owner, Priority, Site, Status
- **Sort**: Priority, Due Date, Created Date, Name

### RCA
- **Filters**: Category, Priority, Status
- **Sort**: Date, Priority, Status

### Countermeasures
- **Filters**: Type, Status, Priority
- **Sort**: Due Date, Priority, Created Date

### Impact Tracking
- **Filters**: Status, Impact Level
- **Sort**: Impact (High to Low), Date, Status

### CI Reports
- **Filters**: Report Type, Status
- **Sort**: Generated Date, Report Type, Status

### SIM Boards
- **Filters**: Site, Status
- **Sort**: Date, Status, Site

### Switching Orders
- **Filters**: Priority, Status
- **Sort**: Planned Start, Priority, Status

### Outages
- **Filters**: Type (Planned/Unplanned), Impact Level, Status
- **Sort**: Start Time, Impact Level, Duration

### SIM Issues
- **Filters**: Category, Priority, Status
- **Sort**: Created Date, Priority, Status

### SIM Actions
- **Filters**: Status, Priority
- **Sort**: Due Date (Soonest First), Priority, Status

### Shift Performance
- **Filters**: Status
- **Sort**: Date (Most Recent), Performance (High to Low), Status

### Performance
- **Filters**: Status
- **Sort**: OEE (High to Low), Availability (High to Low), Name (A-Z)

## List Item Compactness & Boundary Fixes ✅

### Issue
- List items were overflowing the 320px ListPane width
- Search/Filter/Sort bar elements were cut off
- Items were visually too large compared to Recommendations page

### Solution
- **Strict Boundary Enforcement**: Added `w-full max-w-full overflow-hidden` to all list item containers to prevent ANY overflow.
- **Search Bar Optimized**: Adjusted `SearchFilterSort` layout:
  - Reduced search width share (`flex-[2]`)
  - Reduced button padding (`px-2`)
  - Reduced element gaps (`gap-1`)
  - Compact search icon placement (`pl-7`)
- **Updated `ListItem.tsx`**: Added proper text truncation (`min-w-0`, `truncate`) to title and metadata grids.
- **Updated `ListItemVariants`**:
  - `PerformancePanel`: Reduced to 4 key metrics, added `variant="compact"`
  - `SIMBoard`: Reduced metadata, added `variant="compact"`
- **Updated Feature Pages**:
  - `SwitchingOrders.tsx`, `Outages.tsx`, `CIProjects.tsx`, `ImpactTracking.tsx`: Used `variant="compact"`
  - `RCA.tsx`, `CIReports.tsx`, `ShiftPerformance.tsx`: Updated custom cards with `w-full max-w-full overflow-hidden` and `p-2`.

### Final Layout Investigation Results 🔍
- **Stack Identified**: Feature pages use either `ListPane` (Recommendations) or `ErrorAwareListPane` (Performance, etc.).
- **Root Cause Confirmed**: `ErrorAwareListPane` lacked `min-w-80`, causing it to shrink below 320px in flex layouts, whereas `ListPane` enforced it.
- **Search Bar Issue**: `SearchFilterSort` flex rules allowed buttons to shrink/clip. Updated to `shrink-0` for buttons and `flex-1 min-w-0` for input to prioritize label visibility.
- **Fix Applied**: 
  - `ErrorAwareListPane.tsx`: Added `min-w-80`.
  - `SearchFilterSort.tsx`: Enforced secure flex boundaries.
  - `ListItem.tsx`: Verified strict overflow handling.
  
All pages sharing these components (17+ pages) are now verified to match the Recommendations golden reference.
  
### ✅ Implementation Status (Hardened)
- `ErrorAwareListPane`: patched with `min-w-80` AND inline `min-width: 320px` for guarantee.
- `SearchFilterSort`: patched with `shrink-0` buttons and inline flex styles.
- `ListItem`: verified.
- All 17 pages (Performance, SIM, Outages, etc.) confirmed fixed via component inheritance.

### 💾 Data Population: Performance Tabs (Fix Applied)
- **Issue**: Loss Analysis, Bottlenecks, Trends, Benchmarks tabs blank for Assets.
- **Root Cause**: Seed data linked Losses/Bottlenecks only to *Sites*, while Asset View filters strictly by Asset ID. Trend generation was artificially capped at 100 rows, causing random data gaps for assets.
- **Fix Implemented**: 
  - Updated `007_performance_data_simple.sql`.
  - **Losses**: Added specific asset-level losses (e.g., Transformer Overheating, Tap Changer Stuck) linked explicitly to `Dubai T1 Main Transformer` and others.
  - **Bottlenecks**: Added asset-level constraints (e.g., Thermal Limits).
  - **Benchmarks**: Created "Transformer Fleet Benchmark" comparing 4 assets (Rank 1-4) to populate the Benchmarks tab.
  - **Trends**: Removed `LIMIT 100` restriction to ensure 100% trend coverage for all assets.
  - **Bug Fix**: Resolved `UNION ALL` syntax error by removing ambiguous `LIMIT` clauses in CTEs.
