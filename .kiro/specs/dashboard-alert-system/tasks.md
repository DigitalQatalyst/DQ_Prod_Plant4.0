# Implementation Plan

- [x] 1. Create core type definitions and data structures

  - Create `src/types/dashboard.ts` with FeatureAreaId, Dashboard, Widget, WidgetType, WidgetConfig interfaces
  - Create `src/types/alert.ts` with Alert, Incident, AlertSeverity, AlertStatus interfaces
  - Ensure all types are properly exported and use TypeScript union types for enums
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 15.1, 15.2, 15.3, 15.4_

- [x] 2. Create mock data for dashboards, widgets, alerts, and incidents

  - Create `src/data/dashboardData.ts` with mock dashboards (Main Overview, Alerts Summary, Asset Health, Security Posture) and widgets
  - Create `src/data/alertData.ts` with mock alerts spanning multiple feature areas and mock incidents
  - Ensure mock data uses existing tenant IDs from mockData.ts for consistency
  - Include varied severity levels, status values, and feature areas in mock data
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 15.5_

- [ ]* 2.1 Write property test for tenant data consistency
  - **Property 1: Tenant filtering consistency**
  - **Validates: Requirements 2.6**

- [x] 3. Implement data utility functions for filtering and sorting

  - Create `src/lib/dashboardUtils.ts` with functions: getDashboardsForTenant, getDashboardsForFeatureArea, getWidgetsByIds, pinWidgetToOverview, unpinWidgetFromOverview
  - Create `src/lib/alertUtils.ts` with functions: getAlertsForTenant, getAlertsForFeatureArea, filterAlertsByCriteria, sortAlerts, updateAlertStatus, validateStatusTransition
  - Implement tenant and feature area filtering logic
  - Implement alert sorting by severity, createdAt, status, featureArea
  - Implement alert status transition validation (open → acknowledged → in-progress → closed, with direct-to-closed allowed)
  - _Requirements: 3.1, 3.4, 4.1, 4.3, 8.1, 8.2, 8.4, 8.5, 9.1, 9.2, 11.2, 11.3, 11.4, 13.3, 13.4_

- [ ]* 3.1 Write property test for feature area filtering
  - **Property 2: Feature area filtering consistency**
  - **Validates: Requirements 3.1, 4.1, 9.1**

- [ ]* 3.2 Write property test for alert sorting
  - **Property 8: Alert sorting correctness**
  - **Validates: Requirements 8.4**

- [ ]* 3.3 Write property test for alert filtering
  - **Property 9: Alert filtering correctness**
  - **Validates: Requirements 8.5**

- [ ]* 3.4 Write property test for alert status transitions
  - **Property 11: Alert status transition validity**
  - **Validates: Requirements 11.3, 11.4**

- [ ]* 3.5 Write property test for alert status updates
  - **Property 12: Alert status update consistency**
  - **Validates: Requirements 11.2**

- [ ]* 3.6 Write property test for pin to overview idempotence
  - **Property 4: Pin to overview idempotence**
  - **Validates: Requirements 5.2, 5.5**

- [x] 4. Implement widget data resolution system

  - Create `src/lib/widgetDataResolvers.ts` with getWidgetData function that routes to type-specific resolvers
  - Implement resolvers for each widget type: resolveKPIWidget, resolveStatusBoardWidget, resolveListWidget, resolveTableWidget
  - Implement widget config validation with error handling for missing required properties
  - Ensure resolvers apply tenant context filtering to all data queries
  - _Requirements: 7.2, 7.4, 7.5, 12.1, 12.2, 12.3, 12.4, 12.5, 13.1_

- [ ]* 4.1 Write property test for widget config validation
  - **Property 7: Widget config validation**
  - **Validates: Requirements 7.4, 7.5**

- [ ]* 4.2 Write property test for widget data retrieval
  - **Property 13: Widget data retrieval consistency**
  - **Validates: Requirements 12.5**

- [x] 5. Create base widget components with error boundaries

  - Create `src/components/dashboard/widgets/WidgetErrorBoundary.tsx` to catch rendering errors
  - Create `src/components/dashboard/widgets/BaseWidget.tsx` with common widget wrapper (card, title, actions)
  - Implement error state display for invalid configs
  - Implement empty state display for missing data
  - _Requirements: 7.5, 14.4_

- [x] 6. Implement individual widget components

  - Create `src/components/dashboard/widgets/KPIWidget.tsx` displaying numeric value, label, and trend indicator
  - Create `src/components/dashboard/widgets/StatusBoardWidget.tsx` displaying status counts grouped by category
  - Create `src/components/dashboard/widgets/ListWidget.tsx` displaying scrollable list with configurable columns
  - Create `src/components/dashboard/widgets/TableWidget.tsx` displaying sortable table with columns from config
  - Each widget should receive config via props and call appropriate data resolver
  - Each widget should be wrapped in WidgetErrorBoundary
  - _Requirements: 7.2, 12.1, 12.2, 12.3, 12.4, 14.4_

- [x] 7. Create WidgetGrid component for dashboard layout

  - Create `src/components/dashboard/WidgetGrid.tsx` with responsive grid layout
  - Implement widget rendering loop that instantiates correct widget type based on widget.type
  - Add "Pin to Overview" action button for domain widgets (when featureArea !== "overview")
  - Add "Open in Workspace" action button for overview widgets
  - Implement visual indicator showing source feature area for each widget
  - _Requirements: 3.2, 3.3, 5.1, 5.4, 6.1_

- [ ]* 7.1 Write property test for dashboard widget composition
  - **Property 3: Dashboard widget composition**
  - **Validates: Requirements 3.2, 4.2**

- [ ]* 7.2 Write property test for widget config preservation
  - **Property 5: Widget config preservation during pinning**
  - **Validates: Requirements 5.3**

- [x] 8. Create DashboardView component

  - Create `src/components/dashboard/DashboardView.tsx` accepting featureArea and dashboardId props
  - Implement dashboard fetching logic using getDashboardsForTenant and getDashboardsForFeatureArea
  - Implement widget fetching using getWidgetsByIds
  - Render DashboardHeader with dashboard title and actions
  - Render WidgetGrid with fetched widgets
  - Apply tenant context from AppContext for filtering
  - Handle empty state when no dashboards exist for tenant/feature area
  - _Requirements: 3.1, 3.4, 3.5, 4.1, 4.3, 4.4, 4.5, 13.1, 13.3, 13.5, 14.1_

- [x] 9. Implement pin/unpin and navigation actions

  - Implement pinWidgetToOverview handler in DashboardView that updates overview dashboard config
  - Implement openInWorkspace handler that navigates to feature area route with widget context
  - Use React Router's useNavigate for navigation
  - Preserve widget filters in URL params when navigating to workspace
  - _Requirements: 5.2, 5.3, 5.5, 6.2, 6.3_

- [ ]* 9.1 Write property test for navigation context preservation
  - **Property 6: Navigation context preservation**
  - **Validates: Requirements 6.2, 6.3**

- [x] 10. Create AlertCard component

  - Create `src/components/alerts/AlertCard.tsx` displaying alert title, severity, status, feature area, created time, affected asset/site
  - Use existing StatusBadge component for severity display
  - Add status change dropdown/select control
  - Implement onStatusChange callback
  - Support compact mode for display within incidents
  - Use shadcn/ui Card, Badge, Button components
  - _Requirements: 8.3, 11.1, 14.4_

- [x] 11. Create AlertList component

  - Create `src/components/alerts/AlertList.tsx` rendering list of AlertCard components
  - Implement sorting controls (severity, createdAt, status, featureArea)
  - Implement filter controls (severity, status, featureArea)
  - Apply filters and sorting using alertUtils functions
  - Handle empty state when no alerts match filters
  - _Requirements: 8.3, 8.4, 8.5_

- [x] 12. Create IncidentCard and IncidentList components

  - Create `src/components/alerts/IncidentCard.tsx` displaying incident title, severity, status, related alert count
  - Implement expand/collapse functionality to show related alerts
  - Fetch related alerts using incident.relatedAlertIds
  - Render AlertCard components for each related alert in compact mode
  - Detect and indicate cross-domain incidents (alerts from multiple feature areas)
  - Create `src/components/alerts/IncidentList.tsx` rendering list of IncidentCard components
  - _Requirements: 10.2, 10.3, 10.4, 10.5_

- [ ]* 12.1 Write property test for incident alert grouping
  - **Property 10: Incident alert grouping**
  - **Validates: Requirements 10.3**

- [ ]* 12.2 Write property test for cross-domain incident detection
  - **Property 15: Cross-domain incident detection**
  - **Validates: Requirements 10.5**

- [x] 13. Create AlertView component

  - Create `src/components/alerts/AlertView.tsx` accepting featureArea and initialView props
  - Implement view toggle between "Alerts" and "Incidents"
  - Fetch alerts using getAlertsForTenant and getAlertsForFeatureArea based on props
  - Fetch incidents and filter by tenant
  - Render AlertList when view is "alerts"
  - Render IncidentList when view is "incidents"
  - Implement alert status change handler that calls updateAlertStatus
  - Apply tenant context from AppContext for filtering
  - Add link to global alerts view when in domain view
  - _Requirements: 8.1, 8.2, 9.1, 9.2, 9.3, 9.4, 10.1, 11.2, 13.2, 13.4, 14.2_

- [ ]* 13.1 Write property test for open alert count
  - **Property 14: Open alert count accuracy**
  - **Validates: Requirements 9.5**

- [x] 14. Create overview dashboard pages

  - Create `src/pages/overview/OverviewDashboard.tsx` rendering DashboardView with no featureArea (shows global dashboards)
  - Create `src/pages/overview/OverviewAlerts.tsx` rendering AlertView with no featureArea (shows all alerts)
  - Integrate with WorkPane layout
  - _Requirements: 3.1, 8.1, 14.1, 14.2_

- [ ] 15. Create domain-specific dashboard and alert pages

  - Create `src/pages/assets/AssetsDashboard.tsx` rendering DashboardView with featureArea="assets"
  - Create `src/pages/assets/AssetsAlerts.tsx` rendering AlertView with featureArea="assets"
  - Create `src/pages/security/SecurityDashboard.tsx` rendering DashboardView with featureArea="security"
  - Create `src/pages/security/SecurityAlerts.tsx` rendering AlertView with featureArea="security"
  - Integrate with WorkPane layout
  - _Requirements: 4.1, 4.3, 9.1, 9.2, 14.1, 14.2_

- [x] 16. Update navigation and routing

  - Update `src/data/navigation.ts` to add dashboard and alert routes to overview and feature areas
  - Update `App.tsx` to add routes for all new dashboard and alert pages
  - Ensure routes follow existing pattern (e.g., /assets/dashboard, /assets/alerts)
  - _Requirements: 3.1, 4.1, 8.1, 9.1_

- [x] 17. Implement AppContext integration for reactive filtering

  - Update DashboardView to use currentTenant from AppContext via useApp hook
  - Update AlertView to use currentTenant from AppContext via useApp hook
  - Implement useEffect to re-filter data when currentTenant changes
  - Ensure all data queries pass tenant context to utility functions
  - _Requirements: 3.4, 8.2, 9.2, 13.1, 13.2, 13.3, 13.4_

- [x] 18. Add accessibility features

  - Add ARIA labels to all interactive controls (buttons, dropdowns, toggles)
  - Ensure keyboard navigation works for all components (Tab, Enter, Space)
  - Add screen reader announcements for alert severity and status changes
  - Use icons in addition to color for severity indicators
  - Verify focus indicators are visible on all interactive elements
  - Test with keyboard-only navigation
  - _Requirements: 14.4_

- [x] 19. Checkpoint - Ensure all tests pass, ask the user if questions arise

- [ ]* 20. Create test fixtures and factory functions
  - Create `src/data/__tests__/fixtures.ts` with factory functions: createTestDashboard, createTestWidget, createTestAlert, createTestIncident
  - Implement factories with sensible defaults and override support
  - Use factories in all unit and property tests

- [ ]* 21. Write unit tests for data utility functions
  - Write unit tests for dashboardUtils: getDashboardsForTenant, getDashboardsForFeatureArea, getWidgetsByIds, pinWidgetToOverview
  - Write unit tests for alertUtils: getAlertsForTenant, getAlertsForFeatureArea, filterAlertsByCriteria, sortAlerts, updateAlertStatus, validateStatusTransition
  - Write unit tests for widgetDataResolvers: getWidgetData, resolveKPIWidget, resolveStatusBoardWidget, resolveListWidget, resolveTableWidget
  - Test edge cases: empty arrays, undefined values, null checks, invalid inputs

- [ ]* 22. Write unit tests for widget components
  - Write unit tests for KPIWidget rendering with various configs
  - Write unit tests for StatusBoardWidget rendering with various configs
  - Write unit tests for ListWidget rendering with various configs
  - Write unit tests for TableWidget rendering with various configs
  - Write unit tests for WidgetErrorBoundary catching errors

- [ ]* 23. Write unit tests for alert components
  - Write unit tests for AlertCard rendering and status change interactions
  - Write unit tests for AlertList filtering and sorting
  - Write unit tests for IncidentCard expansion and related alert display
  - Write unit tests for IncidentList rendering

- [ ]* 24. Write integration tests for dashboard flow
  - Write integration test for loading dashboard → fetching widgets → rendering widgets
  - Write integration test for pin to overview flow
  - Write integration test for open in workspace flow
  - Write integration test for tenant context changes triggering re-filtering

- [ ]* 25. Write integration tests for alert flow
  - Write integration test for displaying alerts → changing status → verifying UI updates
  - Write integration test for filtering and sorting alerts
  - Write integration test for viewing incidents → expanding → showing related alerts
  - Write integration test for tenant context changes triggering re-filtering

- [ ] 26. Final checkpoint - Ensure all tests pass, ask the user if questions arise
