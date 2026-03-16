import { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Plus, Bell, AlertTriangle, History, Loader2, CheckCircle2, Activity } from "lucide-react";
import { AlarmRule } from "@/types/processAutomation";
import { getHybridProvider } from "@/lib/data/providers/HybridProvider";

import { SharedLinkedAssetsTab, SharedHistoryTab } from "@/components/automate/SharedDetailTabs";
import { cn } from "@/lib/utils";

// PA Status Badge Component
function PAStatusBadge({ enabled }: { enabled: boolean }) {
  if (enabled) {
    return (
      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", "bg-success/10 text-success border-success/20")}>
        Active
      </span>
    );
  }
  return (
    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", "bg-muted text-muted-foreground border-border")}>
      Disabled
    </span>
  );
}

// Severity Badge Component
function SeverityBadge({ severity }: { severity: 'critical' | 'high' | 'medium' | 'low' | 'info' }) {
  const config = {
    info: { label: "Info", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    low: { label: "Low", className: "bg-green-500/10 text-green-500 border-green-500/20" },
    medium: { label: "Medium", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    high: { label: "High", className: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
    critical: { label: "Critical", className: "bg-red-500/10 text-red-500 border-red-500/20" },
  };

  const { label, className } = config[severity] || config.info;

  return (
    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", className)}>
      {label}
    </span>
  );
}

// Token types for condition expression parsing
type ConditionToken =
  | { type: 'logical'; value: 'AND' | 'OR' }
  | { type: 'tag'; name: string }
  | { type: 'operator'; value: string }
  | { type: 'value'; value: string }
  | { type: 'func'; value: string }
  | { type: 'paren'; value: string }
  | { type: 'raw'; value: string };

function tokenizeCondition(expr: string): ConditionToken[] {
  const tokens: ConditionToken[] = [];
  // Split on logical operators AND/OR (word-boundary aware), capturing them
  const logicalParts = expr.split(/\b(AND|OR)\b/);
  logicalParts.forEach((part, i) => {
    const trimmed = part.trim();
    if (trimmed === 'AND' || trimmed === 'OR') {
      tokens.push({ type: 'logical', value: trimmed });
      return;
    }
    if (!trimmed) return;

    // Attempt structured parse: tag:x OP value (optionally wrapped in abs())
    const structuredMatch = trimmed.match(
      /^(abs\s*\(\s*)?(tag:[a-zA-Z0-9_]+(?:\s*-\s*tag:[a-zA-Z0-9_]+)?)(\s*\))?\s*([><=!]+)\s*(.+)$/
    );

    if (structuredMatch) {
      const [, funcOpen, tagExpr, funcClose, op, val] = structuredMatch;
      if (funcOpen) tokens.push({ type: 'func', value: 'abs(' });
      // tagExpr may contain subtraction of two tags
      const tagParts = tagExpr.split(/\s*-\s*/);
      tagParts.forEach((tp, ti) => {
        tokens.push({ type: 'tag', name: tp.trim().replace(/^tag:/, '') });
        if (ti < tagParts.length - 1) tokens.push({ type: 'raw', value: '−' });
      });
      if (funcClose) tokens.push({ type: 'func', value: ')' });
      tokens.push({ type: 'operator', value: op.trim() });
      // value may be a tag ref or literal
      const valTrimmed = val.trim();
      if (valTrimmed.startsWith('tag:')) {
        tokens.push({ type: 'tag', name: valTrimmed.replace(/^tag:/, '') });
      } else {
        tokens.push({ type: 'value', value: valTrimmed.replace(/^"|"$/g, '') });
      }
    } else {
      // Fallback — render as raw tag chip if it starts with tag:
      if (trimmed.startsWith('tag:')) {
        tokens.push({ type: 'tag', name: trimmed.replace(/^tag:/, '') });
      } else {
        tokens.push({ type: 'raw', value: trimmed });
      }
    }
  });
  return tokens;
}

const OPERATOR_LABELS: Record<string, string> = {
  '=': 'equals',
  '!=': 'not equals',
  '>': 'greater than',
  '<': 'less than',
  '>=': 'at least',
  '<=': 'at most',
};

function ConditionValue({ value }: { value: string | undefined }) {
  if (!value) return null;

  // Handle JSON arrays (legacy badge format)
  try {
    const trimmed = value.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
        return (
          <div className="flex flex-wrap gap-2">
            {parsed.map((item, index) => (
              <span key={index} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs font-medium border border-border">
                {item.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            ))}
          </div>
        );
      }
      if (typeof parsed === 'object' && parsed !== null) {
        return (
          <pre className="text-xs font-mono bg-background/50 p-2 rounded border border-border/50 overflow-auto whitespace-pre-wrap mt-1">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        );
      }
    }
  } catch (e) { /* not JSON */ }

  // Parse into human-readable tokens
  const tokens = tokenizeCondition(value);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tokens.map((token, i) => {
        switch (token.type) {
          case 'logical':
            return (
              <span
                key={i}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border",
                  token.value === 'AND'
                    ? "bg-blue-500/10 text-blue-500 border-blue-500/30"
                    : "bg-purple-500/10 text-purple-500 border-purple-500/30"
                )}
              >
                {token.value}
              </span>
            );
          case 'tag':
            return (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md text-xs font-medium"
              >
                <span className="text-primary/60 text-[10px] font-normal">tag:</span>
                <span>{token.name.replace(/_/g, ' ')}</span>
              </span>
            );
          case 'operator':
            return (
              <span
                key={i}
                className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-[11px] font-mono border border-border/50"
                title={OPERATOR_LABELS[token.value] || token.value}
              >
                {token.value}
              </span>
            );
          case 'value':
            return (
              <span
                key={i}
                className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-md text-xs font-medium"
              >
                {token.value}
              </span>
            );
          case 'func':
            return (
              <span key={i} className="text-xs font-mono text-muted-foreground">
                {token.value}
              </span>
            );
          case 'raw':
          default:
            return (
              <span key={i} className="text-xs text-muted-foreground font-mono">
                {(token as { type: string; value: string }).value}
              </span>
            );
        }
      })}
    </div>
  );
}

export function AlarmRulesPage() {
  const { currentSector, currentSubsector, currentTenant } = useApp();
  const [records, setRecords] = useState<AlarmRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AlarmRule | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("updated-desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [alarmTypeFilter, setAlarmTypeFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  // Fetch data when tenant changes
  useEffect(() => {
    const fetchData = async () => {
      if (!currentTenant?.id) return;

      setIsLoading(true);
      setError(null);
      try {
        const provider = getHybridProvider();
        const data = await provider.getAlarmRules(currentTenant.id);
        setRecords(data);
        setSelectedRecord(null);
      } catch (err) {
        console.error("Failed to fetch alarm rules:", err);
        setError("Failed to load alarm rules");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentTenant?.id]);

  // Get unique alarm types for filter
  const alarmTypes = useMemo(() => {
    const types = new Set(records.map(r => r.alarm_type));
    return Array.from(types).sort();
  }, [records]);

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    let filtered = records.filter((r) => {
      // Search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        const matchesSearch =
          r.name.toLowerCase().includes(search) ||
          r.alarm_type.toLowerCase().includes(search) ||
          (r.description && r.description.toLowerCase().includes(search));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter === "active" && !r.enabled) return false;
      if (statusFilter === "disabled" && r.enabled) return false;

      // Severity filter
      if (severityFilter !== "all" && r.severity !== severityFilter) return false;

      // Alarm type filter
      if (alarmTypeFilter !== "all" && r.alarm_type !== alarmTypeFilter) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "severity-asc":
          const severityOrder = { info: 1, low: 2, medium: 3, high: 4, critical: 5 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        case "severity-desc":
          const severityOrderDesc = { info: 1, low: 2, medium: 3, high: 4, critical: 5 };
          return severityOrderDesc[b.severity] - severityOrderDesc[a.severity];
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
  }, [records, searchQuery, sortBy, statusFilter, severityFilter, alarmTypeFilter]);

  const tabs = selectedRecord
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <OverviewTab record={selectedRecord} />,
      },
      {
        id: "parameters",
        label: "Parameters",
        content: <ParametersTab record={selectedRecord} />,
      },
      {
        id: "linked-assets",
        label: "Linked Assets",
        content: <SharedLinkedAssetsTab record={selectedRecord} />,
      },
      {
        id: "history",
        label: "History",
        content: <SharedHistoryTab record={selectedRecord} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Alarm Rules Overview",
        content: <AlarmRulesOverview records={filteredRecords} setSelectedRecord={setSelectedRecord} />,
      },
    ];

  return (
    <div className="flex w-full h-full overflow-hidden gap-4 p-4 bg-muted/40">
      <ListPane
        title="Alarm Rules"
        subtitle={`${currentSector.name} · ${currentSubsector}`}
        count={filteredRecords.length}
        searchPlaceholder="Search alarm rules..."
        onSearch={setSearchQuery}
        sortOptions={[
          { value: "name-asc", label: "Name (A-Z)" },
          { value: "name-desc", label: "Name (Z-A)" },
          { value: "severity-asc", label: "Severity (Low to Critical)" },
          { value: "severity-desc", label: "Severity (Critical to Low)" },
          { value: "created-asc", label: "Oldest First" },
          { value: "created-desc", label: "Newest First" },
          { value: "updated-asc", label: "Least Recently Updated" },
          { value: "updated-desc", label: "Most Recently Updated" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
        filters={[
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All Status" },
              { value: "active", label: "Active Only" },
              { value: "disabled", label: "Disabled Only" },
            ],
          },
          {
            key: "severity",
            label: "Severity",
            value: severityFilter,
            onChange: setSeverityFilter,
            options: [
              { value: "all", label: "All Severities" },
              { value: "info", label: "Info" },
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
              { value: "critical", label: "Critical" },
            ],
          },
          {
            key: "alarmType",
            label: "Alarm Type",
            value: alarmTypeFilter,
            onChange: setAlarmTypeFilter,
            options: [
              { value: "all", label: "All Types" },
              ...alarmTypes.map(type => ({ value: type, label: type.charAt(0).toUpperCase() + type.slice(1) })),
            ],
          },
        ]}
        actions={
          <Button size="sm" className="w-full mt-2 gap-2">
            <Plus className="w-4 h-4" />
            Add Alarm Rule
          </Button>
        }
        className="rounded-lg border bg-background shadow-sm"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-destructive text-center">{error}</div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">No alarm rules found</div>
        ) : (
          filteredRecords.map((record) => (
            <AlarmRuleListItem
              key={record.id}
              record={record}
              isSelected={selectedRecord?.id === record.id}
              onClick={() => setSelectedRecord(record)}
            />
          ))
        )}
      </ListPane>

      <WorkPane
        title={selectedRecord?.name || "Alarm Rules"}
        subtitle={
          selectedRecord
            ? `${selectedRecord.alarm_type} · ${selectedRecord.severity}`
            : "Select an alarm rule to view details"
        }
        tabs={tabs}
        className="rounded-lg border bg-background shadow-sm"
      />
    </div>
  );
}

function AlarmRuleListItem({
  record,
  isSelected,
  onClick,
}: {
  record: AlarmRule;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all duration-200",
        isSelected
          ? "bg-primary/10 border-primary shadow-sm"
          : "bg-card border-border hover:border-primary/30 hover:bg-accent/50"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Bell className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium truncate">{record.name}</span>
            <SeverityBadge severity={record.severity} />
            <PAStatusBadge enabled={record.enabled} />
          </div>
          <p className="text-xs text-muted-foreground truncate mb-1">
            {record.alarm_type}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{record.routing_destinations.length} routing destinations</span>
            {record.requires_acknowledgment && <span>· Requires Ack</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function AlarmRulesOverview({
  records,
  setSelectedRecord,
}: {
  records: AlarmRule[];
  setSelectedRecord: (record: AlarmRule) => void;
}) {
  const stats = useMemo(() => {
    const totalRules = records.length;
    const activeRules = records.filter(r => r.enabled).length;
    const criticalAlarms = records.filter(r => r.severity === 'critical').length;
    const recentAlarms = records.filter(r => {
      const daysSinceUpdate = (Date.now() - new Date(r.updated_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate <= 7;
    }).length;

    return { totalRules, activeRules, criticalAlarms, recentAlarms };
  }, [records]);

  const recentRules = useMemo(() => {
    return records
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10);
  }, [records]);

  const severityData = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach(r => counts[r.severity] = (counts[r.severity] || 0) + 1);
    const severityColors: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e', info: '#3b82f6' };
    return Object.entries(counts)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: severityColors[name] || '#94a3b8'
      }));
  }, [records]);

  const statusData = useMemo(() => {
    const active = records.filter(r => r.enabled).length;
    const disabled = records.length - active;
    return [
      { name: 'Active', value: active, color: '#22c55e' },
      { name: 'Disabled', value: disabled, color: '#94a3b8' },
    ];
  }, [records]);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Rules"
          value={stats.totalRules.toString()}
          subtitle="All alarm rules"
          icon={Bell}
          variant="primary"
        />
        <KPICard
          title="Active Rules"
          value={stats.activeRules.toString()}
          subtitle="Currently enabled"
          icon={CheckCircle2}
          variant="success"
          trend="up"
          trendValue={`${((stats.activeRules / stats.totalRules) * 100).toFixed(0)}%`}
        />
        <KPICard
          title="Critical Alarms"
          value={stats.criticalAlarms.toString()}
          subtitle="Severity = critical"
          icon={AlertTriangle}
          variant="destructive"
        />
        <KPICard
          title="Recent Alarms"
          value={stats.recentAlarms.toString()}
          subtitle="Last 7 days"
          icon={Activity}
          variant="warning"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Severity Distribution</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Status Overview</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Rules Table */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Recent Alarm Rules</h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Classification</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Severity</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Routing</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentRules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No alarm rules found
                  </td>
                </tr>
              ) : (
                recentRules.map((rule) => (
                  <tr
                    key={rule.id}
                    onClick={() => setSelectedRecord(rule)}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium">{rule.name}</td>
                    <td className="px-4 py-3 text-sm capitalize">{rule.alarm_type}</td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={rule.severity} />
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {rule.routing_destinations.length} destinations
                    </td>
                    <td className="px-4 py-3">
                      <PAStatusBadge enabled={rule.enabled} />
                    </td>
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

function OverviewTab({ record }: { record: AlarmRule | null }) {
  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <Bell className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Alarm Rule Selected</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Select an alarm rule from the list to view its details
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alarm Rule Header Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">{record.name}</h3>
              <SeverityBadge severity={record.severity} />
              <PAStatusBadge enabled={record.enabled} />
            </div>
            <p className="text-sm text-muted-foreground mb-3">{record.description || "No description provided"}</p>
          </div>
          <Button variant="outline" size="sm">
            Edit Rule
          </Button>
        </div>
      </div>

      {/* Condition */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary" />
          Activation Condition
        </h4>
        <div className="bg-secondary/50 border border-border rounded-lg p-4">
          <ConditionValue value={record.condition_expression} />
        </div>
      </div>

      {/* Routing */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4">Routing Destinations</h4>
        <div className="space-y-2">
          {record.routing_destinations.length > 0 ? (
            record.routing_destinations.map((dest, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-secondary/50 border border-border rounded-lg"
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                  {index + 1}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium capitalize">{dest.type}</span>
                  <span className="text-xs text-muted-foreground">{dest.destination}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">No routing destinations configured</p>
          )}
        </div>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Policy Configuration</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Alarm Type" value={record.alarm_type} />
            <InfoRow label="Ack Required" value={record.requires_acknowledgment ? "Yes" : "No"} />
            <InfoRow label="Auto Clear" value={record.auto_clear ? "Yes" : "No"} />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Metadata</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            {record.created_by && <InfoRow label="Created By" value={record.created_by} />}
            <InfoRow label="Created At" value={new Date(record.created_at).toLocaleString()} />
            <InfoRow label="Updated At" value={new Date(record.updated_at).toLocaleString()} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ParametersTab({ record }: { record: AlarmRule | null }) {
  if (!record) {
    return <EmptyState title="No Alarm Rule Selected" />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4">Logic Configuration</h4>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Condition Expression</label>
            <div className="mt-1 p-3 bg-secondary/50 border border-border rounded-lg">
              <ConditionValue value={record.condition_expression} />
            </div>
          </div>
          {record.clear_condition_expression && (
            <div>
              <label className="text-xs text-muted-foreground">Clear Condition</label>
              <div className="mt-1 p-3 bg-secondary/50 border border-border rounded-lg">
                <ConditionValue value={record.clear_condition_expression} />
              </div>
            </div>
          )}
        </div>
      </div>

      {record.tags && record.tags.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-sm font-semibold mb-4">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {record.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-secondary border border-border rounded text-[10px]">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <Bell className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        Select an alarm rule from the list to view its details
      </p>
    </div>
  );
}
