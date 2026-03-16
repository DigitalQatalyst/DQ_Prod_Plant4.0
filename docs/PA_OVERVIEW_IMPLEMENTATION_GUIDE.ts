/**
 * Process Automation Overview Pages - Implementation Guide
 * 
 * This document provides the implementation pattern for adding fleet-level overview pages
 * to all Process Automation feature pages.
 * 
 * COMPLETED:
 * ✅ TagMappingPage.tsx
 * ✅ WorkflowsPage.tsx
 * 
 * REMAINING PAGES TO UPDATE:
 * 1. ControlModelsPage.tsx
 * 2. ActionBindingsPage.tsx
 * 3. TriggersPage.tsx
 * 4. AlarmRulesPage.tsx
 * 5. EventPatternsPage.tsx
 * 6. SequencesPage.tsx
 * 7. ControlRulesPage.tsx
 * 8. VersionsPage.tsx
 * 9. ApprovalsPage.tsx
 * 10. SimulationPage.tsx
 * 11. AuditLogsPage.tsx
 */

// IMPLEMENTATION PATTERN FOR EACH PAGE:

// Step 1: Update imports to include shared components
/*
import { KPICard } from "@/components/shared";
import { [AdditionalIcons] } from "lucide-react"; // Add Activity, CheckCircle2, AlertCircle, etc.
*/

// Step 2: Make tabs conditional based on selectedRecord
/*
const tabs = selectedRecord
  ? [
      // ... existing tabs for individual record
    ]
  : [
      {
        id: "overview",
        label: "[Feature Name] Overview",
        content: <[FeatureName]Overview records={filteredRecords} setSelectedRecord={setSelectedRecord} />,
      },
    ];
*/

// Step 3: Add Overview Component (template)
/*
function [FeatureName]Overview({
  records,
  setSelectedRecord,
}: {
  records: [RecordType][];
  setSelectedRecord: (record: [RecordType]) => void;
}) {
  const stats = useMemo(() => {
    // Calculate relevant statistics
    const total = records.length;
    const active = records.filter(r => r.is_active || r.status === 'active').length;
    // Add 2-3 more relevant metrics
    
    return { total, active, ... };
  }, [records]);

  const recentRecords = useMemo(() => {
    return records
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10);
  }, [records]);

  return (
    <div className="space-y-6">
      {/* KPI Grid - 4 cards */}
<div className="grid grid-cols-4 gap-4" >
    <KPICard
          title="Total [Items]"
value = { stats.total.toString() }
subtitle = "All [items]"
icon = { [Icon]}
variant = "primary"
    />
    {/* Add 3 more KPI cards */ }
    </div>

{/* Recent Items Table */ }
<div>
    <h3 className="text-sm font-semibold mb-3" > Recent[Items] </h3>
        < div className = "bg-card border border-border rounded-lg overflow-hidden" >
            <table className="w-full" >
                <thead className="bg-secondary/50 border-b border-border" >
                    <tr>
                    {/* Add relevant column headers */ }
                    </tr>
                    </thead>
                    < tbody className = "divide-y divide-border" >
                        {
                            recentRecords.length === 0 ? (
                                <tr>
                                <td colSpan= { [n]} className="px-4 py-8 text-center text-sm text-muted-foreground" >
                                No[items] found
                                </ td >
                        </tr>
              ) : (
    recentRecords.map((record) => (
        <tr
                    key= { record.id }
                    onClick = {() => setSelectedRecord(record)}
        className = "cursor-pointer hover:bg-accent/50 transition-colors"
        >
        {/* Add table cells for each column */ }
        </tr>
    ))
              )}
</tbody>
    </table>
    </div>
    </div>
    </div>
  );
}
*/

// SPECIFIC IMPLEMENTATIONS FOR EACH PAGE:

export const pageConfigurations = {
    ControlModelsPage: {
        recordType: "ControlModel",
        icon: "GitBranch",
        stats: [
            { key: "total", label: "Total Models", icon: "GitBranch", variant: "primary" },
            { key: "active", label: "Active Models", icon: "CheckCircle2", variant: "success" },
            { key: "states", label: "Total States", icon: "Layers", variant: "info" },
            { key: "recent", label: "Recent Updates", icon: "Activity", variant: "warning" }
        ],
        tableColumns: ["Name", "States", "Current State", "Status", "Updated"]
    },

    ActionBindingsPage: {
        recordType: "ActionBinding",
        icon: "Zap",
        stats: [
            { key: "total", label: "Total Actions", icon: "Zap", variant: "primary" },
            { key: "active", label: "Active Bindings", icon: "CheckCircle2", variant: "success" },
            { key: "types", label: "Action Types", icon: "Layers", variant: "info" },
            { key: "recent", label: "Recent Executions", icon: "Activity", variant: "warning" }
        ],
        tableColumns: ["Name", "Action Type", "Actuator", "Status", "Updated"]
    },

    TriggersPage: {
        recordType: "Trigger",
        icon: "Sparkles",
        stats: [
            { key: "total", label: "Total Triggers", icon: "Sparkles", variant: "primary" },
            { key: "active", label: "Active Triggers", icon: "CheckCircle2", variant: "success" },
            { key: "critical", label: "Critical Priority", icon: "AlertTriangle", variant: "destructive" },
            { key: "recent", label: "Recent Activations", icon: "Activity", variant: "warning" }
        ],
        tableColumns: ["Name", "Condition", "Action", "Priority", "Status"]
    },

    AlarmRulesPage: {
        recordType: "AlarmRule",
        icon: "Bell",
        stats: [
            { key: "total", label: "Total Rules", icon: "Bell", variant: "primary" },
            { key: "active", label: "Active Rules", icon: "CheckCircle2", variant: "success" },
            { key: "critical", label: "Critical Alarms", icon: "AlertTriangle", variant: "destructive" },
            { key: "recent", label: "Recent Alarms", icon: "Activity", variant: "warning" }
        ],
        tableColumns: ["Name", "Classification", "Severity", "Routing", "Status"]
    },

    EventPatternsPage: {
        recordType: "EventPattern",
        icon: "TrendingUp",
        stats: [
            { key: "total", label: "Total Patterns", icon: "TrendingUp", variant: "primary" },
            { key: "active", label: "Active Patterns", icon: "CheckCircle2", variant: "success" },
            { key: "detected", label: "Patterns Detected", icon: "Target", variant: "info" },
            { key: "recent", label: "Recent Matches", icon: "Activity", variant: "warning" }
        ],
        tableColumns: ["Name", "Pattern Type", "Time Window", "Status", "Last Match"]
    },

    SequencesPage: {
        recordType: "Sequence",
        icon: "List",
        stats: [
            { key: "total", label: "Total Sequences", icon: "List", variant: "primary" },
            { key: "active", label: "Active Sequences", icon: "CheckCircle2", variant: "success" },
            { key: "running", label: "Currently Running", icon: "Play", variant: "info" },
            { key: "recent", label: "Recent Executions", icon: "Activity", variant: "warning" }
        ],
        tableColumns: ["Name", "Steps", "Execution Mode", "Status", "Duration"]
    },

    ControlRulesPage: {
        recordType: "ControlRule",
        icon: "Settings",
        stats: [
            { key: "total", label: "Total Rules", icon: "Settings", variant: "primary" },
            { key: "active", label: "Active Rules", icon: "CheckCircle2", variant: "success" },
            { key: "continuous", label: "Continuous Rules", icon: "RefreshCw", variant: "info" },
            { key: "recent", label: "Recent Updates", icon: "Activity", variant: "warning" }
        ],
        tableColumns: ["Name", "Rule Type", "Condition", "Priority", "Status"]
    },

    VersionsPage: {
        recordType: "Version",
        icon: "GitCommit",
        stats: [
            { key: "total", label: "Total Versions", icon: "GitCommit", variant: "primary" },
            { key: "approved", label: "Approved", icon: "CheckCircle2", variant: "success" },
            { key: "pending", label: "Pending Approval", icon: "Clock", variant: "warning" },
            { key: "recent", label: "Recent Changes", icon: "Activity", variant: "info" }
        ],
        tableColumns: ["Version", "Change Type", "Component", "Status", "Created"]
    },

    ApprovalsPage: {
        recordType: "Approval",
        icon: "CheckSquare",
        stats: [
            { key: "total", label: "Total Requests", icon: "CheckSquare", variant: "primary" },
            { key: "pending", label: "Pending", icon: "Clock", variant: "warning" },
            { key: "approved", label: "Approved", icon: "CheckCircle2", variant: "success" },
            { key: "rejected", label: "Rejected", icon: "XCircle", variant: "destructive" }
        ],
        tableColumns: ["Request", "Requester", "Approver", "Status", "Submitted"]
    },

    SimulationPage: {
        recordType: "Simulation",
        icon: "FlaskConical",
        stats: [
            { key: "total", label: "Total Simulations", icon: "FlaskConical", variant: "primary" },
            { key: "completed", label: "Completed", icon: "CheckCircle2", variant: "success" },
            { key: "running", label: "Running", icon: "Play", variant: "info" },
            { key: "recent", label: "Recent Runs", icon: "Activity", variant: "warning" }
        ],
        tableColumns: ["Name", "Component Type", "Status", "Duration", "Results"]
    },

    AuditLogsPage: {
        recordType: "AuditLog",
        icon: "FileText",
        stats: [
            { key: "total", label: "Total Events", icon: "FileText", variant: "primary" },
            { key: "today", label: "Today", icon: "Calendar", variant: "info" },
            { key: "critical", label: "Critical Events", icon: "AlertTriangle", variant: "destructive" },
            { key: "users", label: "Active Users", icon: "Users", variant: "success" }
        ],
        tableColumns: ["Event Type", "User", "Component", "Action", "Timestamp"]
    }
};

export default pageConfigurations;
