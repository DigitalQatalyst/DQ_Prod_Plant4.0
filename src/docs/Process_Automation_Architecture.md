# Process Automation Architecture Overview

This document provides a comprehensive overview of the Process Automation system within the application, based on the codebase analysis.

## 1. High-Level Architecture

The Process Automation module follows a React-based frontend architecture interacting with a hybrid data layer.

*   **Frontend:** Built with React (Next.js structure), utilizing functional components and hooks.
*   **State Management:** Local component state (`useState`, `useReducer`) combined with Context API (`DataProviderContext`, `AppContext`).
*   **Data Layer:** A repository pattern using a `DataProvider` interface with a `HybridProvider` implementation that routes requests between a real backend (Supabase) and a Mock backend based on the active Sector.

## 2. Key Components

### 2.1 UI Pages
The module is divided into several key pages, each corresponding to a major feature of the automation system. These pages share a common layout pattern: a **List Pane** for navigation/filtering and a **Work Pane** for details/editing.

*   **Action Bindings (`ActionBindingsPage.tsx`):** Manages links between automation actions and control operations.
*   **Triggers (`TriggersPage.tsx`):** Defines conditions (thresholds, patterns) that initiate actions.
*   **Alarm Rules (`AlarmRulesPage.tsx`):** Configures alarm generation, severity, and routing rules.
*   **Event Patterns (`EventPatternsPage.tsx`):** Handles complex event detection (trends, oscillations) over time windows.
*   **Sequences (`SequencesPage.tsx`):** Manages time-based or step-based control sequences.
*   **Approvals (`ApprovalsPage.tsx`):** Workflow for human review and approval of sensitive changes or actions.

### 2.2 Data Models (`src/types/processAutomation.ts`)
The application uses strict TypeScript interfaces to define the domain models. Key entities include:

*   **ActionBinding:** `id`, `target_system`, `command`, `parameters`, `action_type`.
*   **Trigger:** `id`, `trigger_type`, `condition_expression`, `action_binding_ids`.
*   **AlarmRule:** `id`, `alarm_type`, `gravity`, `routing_destinations`, `auto_clear`.
*   **EventPattern:** `id`, `pattern_type`, `match_conditions`, `time_window`.
*   **Sequence:** `id`, `steps` (array of actions with delays), `execution_mode`.
*   **Approval:** `id`, `record_type`, `status`, `approver_list`, `requested_by`.

### 2.3 Data Access Layer (`src/lib/data/`)

The application uses a **Hybrid Provider** strategy to support both development/demo modes and production/power-sector usage.

*   **`DataProvider` Interface:** Defines the contract for all data operations (e.g., `getTriggers`, `updateActionBinding`).
*   **`HybridProvider`:** The main entry point. It acts as a router:
    *   **Power Transmission Sector:** Requests are routed to `SupabaseProvider` (Local Supabase DB).
    *   **Other Sectors (Oil & Gas, FMCG):** Requests are routed to `MockProvider`.
*   **`MockProvider`:** Serves static data from `src/data/mockData.ts`. It handles the mapping of legacy mock data structures into the standardized TypeScript interfaces.
*   **`SupabaseProvider`:** Handles actual database interactions for the "Power Transmission" sector.

## 3. Data Flow Example: Fetching Triggers

1.  **Component:** `TriggersPage` calls `useDataProvider()` hook.
2.  **Hook:** Returns the `HybridProvider` instance.
3.  **Call:** `TriggersPage` calls `provider.getTriggers(tenantId)`.
4.  **Routing (`HybridProvider`):** 
    *   Checks if `tenantId` belongs to "Power Transmission".
    *   **If Yes:** Calls `SupabaseProvider.getTriggers()`.
    *   **If No:** Calls `MockProvider.getTriggers()`.
5.  **Mock Implementation:** `MockProvider` reads from `oilGasUpstreamTriggers` or `fmcgFoodBeverageTriggers`, maps the raw JSON to the `Trigger` interface, and returns the result.

## 4. Shared Utilities & Hooks

*   **`useDataProvider`:** The primary hook for accessing data.
*   **`useApp` / `useTenant`:** Context hooks for accessing global state like the current sector/tenant, which drives the data routing logic.
*   **`ListPane` / `WorkPane`:** specialized layout components for the master-detail view heavily used across all automation pages.

## 5. Next Steps for Development

*   **Extending Features:** To add a new feature, you typically need to:
    1.  Define the type in `processAutomation.ts`.
    2.  Add methods to the `DataProvider` interface.
    3.  Implement methods in `MockProvider` (with dummy data) and `SupabaseProvider` (with DB queries).
    4.  Create the UI Page following the List/Work pane pattern.
*   **Migration:** The Hybrid architecture allows for incremental migration to Supabase by switching specific tenants/sectors to the real backend one by one.
