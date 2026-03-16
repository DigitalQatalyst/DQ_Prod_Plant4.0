# Reconciliation with dashboard-alert-system Spec

## Overview

This document explains how the overview-settings-feature-areas spec has been reconciled with the existing dashboard-alert-system spec to avoid duplication and conflicts.

## Key Changes Made

### 1. Alert System Integration

**Before**: overview-settings defined its own UnifiedAlert type
**After**: Reuses Alert and Incident types from dashboard-alert-system

- The Alerts & Exceptions page (`/overview/alerts-exceptions`) now extends the existing AlertView component
- TriageItem references Alert.id from the existing alert system
- Alert filtering and status management reuses existing logic

### 2. Dashboard/Widget System Integration

**Before**: overview-settings defined its own DashboardWidget type
**After**: Reuses Dashboard and Widget types from dashboard-alert-system

- The Command Center page (`/overview/command-center`) now wraps the existing DashboardView component within nLVE layout
- Widget rendering reuses existing widget components (KPIWidget, StatusBoardWidget, etc.)
- DashboardViewPreset is a new type that references existing Dashboard.id for user preferences

### 3. Route Coordination

**Existing routes from dashboard-alert-system**:
- `/overview/dashboard` - Main overview dashboard
- `/overview/alerts` - Global alerts view
- `/assets/dashboard`, `/security/dashboard`, etc. - Domain dashboards
- `/assets/alerts`, `/security/alerts`, etc. - Domain alerts

**New routes from overview-settings**:
- `/overview/command-center` - Wraps DashboardView in nLVE layout (alternative to `/overview/dashboard`)
- `/overview/alerts-exceptions` - Extends AlertView with triage (alternative to `/overview/alerts`)
- `/overview/platform-health` - New page for system health
- `/overview/worklist` - New page for tasks and notifications
- `/overview/guidance` - New page for AI insights
- `/settings/*` - All settings pages (new)

**Recommendation**: Consider consolidating routes:
- Option A: Use `/overview/command-center` as the primary dashboard route
- Option B: Keep both routes and have `/overview/dashboard` redirect to `/overview/command-center`

### 4. Type System Alignment

**Feature Area IDs**:
- dashboard-alert-system uses: "automation", "optimization"
- overview-settings uses: "automate", "optimise"
- **Resolution**: overview-settings will import FeatureAreaId from dashboard-alert-system to maintain consistency

**Severity Levels**:
- dashboard-alert-system uses: "info", "warning", "critical"
- overview-settings uses: "critical", "high", "medium", "low", "info"
- **Resolution**: overview-settings will use AlertSeverity from dashboard-alert-system

## Implementation Strategy

### Phase 1: Extend Existing Components (Minimal Changes)

1. **Command Center Page**:
   - Create CommandCenterPage that renders DashboardView within nLVE layout
   - Add ListPane for dashboard selection
   - Reuse existing WidgetGrid and widget components

2. **Alerts & Exceptions Page**:
   - Create AlertsExceptionsPage that extends AlertView
   - Add "Triage" segment to existing "Alerts" and "Incidents" segments
   - Create TriageItem type that references Alert.id
   - Add triage workflow mutations

3. **New Overview Pages**:
   - Platform Health, Worklist, Guidance are new pages with no conflicts
   - Implement as specified in original requirements

4. **Settings Pages**:
   - All settings pages are new with no conflicts
   - Implement as specified in original requirements

### Phase 2: Consolidate Routes (Optional)

If desired, consolidate overlapping routes:
- Redirect `/overview/dashboard` → `/overview/command-center`
- Redirect `/overview/alerts` → `/overview/alerts-exceptions`
- Or keep both routes for backward compatibility

## Updated Task List Priorities

### High Priority (Extends Existing):
1. Create TriageItem type and triage workflow
2. Create CommandCenterPage wrapping DashboardView
3. Create AlertsExceptionsPage extending AlertView
4. Add "Open in Source" deep linking to existing AlertCard

### Medium Priority (New Features):
5. Create Platform Health page
6. Create Worklist page
7. Create Guidance page

### Low Priority (Settings):
8-13. Create all Settings pages (no conflicts)

## Benefits of This Approach

1. **No Duplication**: Reuses existing Alert, Dashboard, Widget types and components
2. **Backward Compatible**: Existing dashboard-alert-system routes continue to work
3. **Incremental**: Can implement in phases without breaking existing functionality
4. **Consistent**: Single source of truth for alert and dashboard data models
5. **Extensible**: New features (triage, health, worklist) build on solid foundation

## Files to Update

### Modified Files:
- `.kiro/specs/overview-settings-feature-areas/requirements.md` - Updated to reference existing types
- `.kiro/specs/overview-settings-feature-areas/design.md` - Updated to extend existing components
- `.kiro/specs/overview-settings-feature-areas/tasks.md` - Will need updates to reflect integration

### New Files (No Conflicts):
- `src/types/overview.ts` - Extends dashboard types, adds TriageItem, HealthFinding, WorkItem, etc.
- `src/types/settings.ts` - All new types
- `src/pages/overview/CommandCenterPage.tsx` - Wraps DashboardView
- `src/pages/overview/AlertsExceptionsPage.tsx` - Extends AlertView
- `src/pages/overview/PlatformHealthPage.tsx` - New
- `src/pages/overview/WorklistPage.tsx` - New
- `src/pages/overview/GuidancePage.tsx` - New
- `src/pages/settings/*` - All new

## Next Steps

1. Review this reconciliation plan
2. Update tasks.md to reflect the integration approach
3. Begin implementation with Phase 1 (extending existing components)
4. Decide on route consolidation strategy
