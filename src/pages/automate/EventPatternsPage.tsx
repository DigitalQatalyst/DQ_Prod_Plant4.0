import { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Activity, Loader2, CheckCircle2, Target, AlertTriangle, Clock, Hash } from "lucide-react";
import { EventPattern } from "@/types/processAutomation";
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

export function EventPatternsPage() {
  const { currentSector, currentSubsector, currentTenant } = useApp();
  const [records, setRecords] = useState<EventPattern[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<EventPattern | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("updated-desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [patternTypeFilter, setPatternTypeFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  // Fetch data when tenant changes
  useEffect(() => {
    const fetchData = async () => {
      if (!currentTenant?.id) return;

      setIsLoading(true);
      setError(null);
      try {
        const provider = getHybridProvider();
        const data = await provider.getEventPatterns(currentTenant.id);
        setRecords(data);
        setSelectedRecord(null);
      } catch (err) {
        console.error("Failed to fetch event patterns:", err);
        setError("Failed to load event patterns");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentTenant?.id]);

  // Get unique pattern types for filter
  const patternTypes = useMemo(() => {
    const types = new Set(records.map(r => r.pattern_type));
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
          r.pattern_type.toLowerCase().includes(search) ||
          (r.description && r.description.toLowerCase().includes(search));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter === "active" && !r.enabled) return false;
      if (statusFilter === "disabled" && r.enabled) return false;

      // Pattern type filter
      if (patternTypeFilter !== "all" && r.pattern_type !== patternTypeFilter) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "matches-asc":
          return a.match_count - b.match_count;
        case "matches-desc":
          return b.match_count - a.match_count;
        case "last-match-asc":
          const aMatch = a.last_match_at ? new Date(a.last_match_at).getTime() : 0;
          const bMatch = b.last_match_at ? new Date(b.last_match_at).getTime() : 0;
          return aMatch - bMatch;
        case "last-match-desc":
          const aMatchDesc = a.last_match_at ? new Date(a.last_match_at).getTime() : 0;
          const bMatchDesc = b.last_match_at ? new Date(b.last_match_at).getTime() : 0;
          return bMatchDesc - aMatchDesc;
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
  }, [records, searchQuery, sortBy, statusFilter, patternTypeFilter]);

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
        label: "Event Patterns Overview",
        content: <EventPatternsOverview records={filteredRecords} setSelectedRecord={setSelectedRecord} />,
      },
    ];

  return (
    <div className="flex w-full h-full overflow-hidden gap-4 p-4 bg-muted/40">
      <ListPane
        title="Event Patterns"
        subtitle={`${currentSector.name} · ${currentSubsector}`}

        count={filteredRecords.length}
        searchPlaceholder="Search event patterns..."
        onSearch={setSearchQuery}
        sortOptions={[
          { value: "name-asc", label: "Name (A-Z)" },
          { value: "name-desc", label: "Name (Z-A)" },
          { value: "matches-asc", label: "Fewest Matches" },
          { value: "matches-desc", label: "Most Matches" },
          { value: "last-match-asc", label: "Least Recently Matched" },
          { value: "last-match-desc", label: "Most Recently Matched" },
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
            key: "patternType",
            label: "Pattern Type",
            value: patternTypeFilter,
            onChange: setPatternTypeFilter,
            options: [
              { value: "all", label: "All Types" },
              ...patternTypes.map(type => ({ value: type, label: type.charAt(0).toUpperCase() + type.slice(1) })),
            ],
          },
        ]}
        actions={
          <Button size="sm" className="w-full mt-2 gap-2">
            <Plus className="w-4 h-4" />
            Add Pattern
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
          <div className="p-4 text-sm text-muted-foreground text-center">No event patterns found</div>
        ) : (
          filteredRecords.map((record) => (
            <EventPatternListItem
              key={record.id}
              record={record}
              isSelected={selectedRecord?.id === record.id}
              onClick={() => setSelectedRecord(record)}
            />
          ))
        )}
      </ListPane>

      <WorkPane
        title={selectedRecord?.name || "Event Patterns"}
        subtitle={
          selectedRecord
            ? `${selectedRecord.pattern_type} · ${selectedRecord.match_count} matches`
            : "Select an event pattern to view details"
        }
        tabs={tabs}
        className="rounded-lg border bg-background shadow-sm"
      />
    </div>
  );
}

function EventPatternListItem({
  record,
  isSelected,
  onClick,
}: {
  record: EventPattern;
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
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium truncate">{record.name}</span>
            <PAStatusBadge enabled={record.enabled} />
          </div>
          <p className="text-xs text-muted-foreground truncate mb-1 text-capitalize">
            {record.pattern_type}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{record.match_count} matches</span>
            {record.time_window && (
              <>
                <span>·</span>
                <span>{record.time_window}s window</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EventPatternsOverview({
  records,
  setSelectedRecord,
}: {
  records: EventPattern[];
  setSelectedRecord: (record: EventPattern) => void;
}) {
  const stats = useMemo(() => {
    const totalPatterns = records.length;
    const activePatterns = records.filter(r => r.enabled).length;
    const patternsDetected = records.reduce((sum, r) => sum + r.match_count, 0);
    const recentMatches = records.filter(r => {
      if (!r.last_match_at) return false;
      const daysSinceMatch = (Date.now() - new Date(r.last_match_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceMatch <= 7;
    }).length;

    return { totalPatterns, activePatterns, patternsDetected, recentMatches };
  }, [records]);

  const recentPatterns = useMemo(() => {
    return records
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10);
  }, [records]);

  const patternTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach(r => counts[r.pattern_type] = (counts[r.pattern_type] || 0) + 1);
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
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
          title="Total Patterns"
          value={stats.totalPatterns.toString()}
          subtitle="All event patterns"
          icon={TrendingUp}
          variant="primary"
        />
        <KPICard
          title="Active Patterns"
          value={stats.activePatterns.toString()}
          subtitle="Currently enabled"
          icon={CheckCircle2}
          variant="success"
          trend="up"
          trendValue={`${((stats.activePatterns / stats.totalPatterns) * 100).toFixed(0)}%`}
        />
        <KPICard
          title="Patterns Detected"
          value={stats.patternsDetected.toString()}
          subtitle="Total matches"
          icon={Target}
          variant="primary"
        />
        <KPICard
          title="Recent Matches"
          value={stats.recentMatches.toString()}
          subtitle="Last 7 days"
          icon={Activity}
          variant="warning"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Pattern Types</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={patternTypeData}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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

      {/* Recent Patterns Table */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Recent Event Patterns</h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Pattern Type</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Time Window</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Last Match</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentPatterns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No event patterns found
                  </td>
                </tr>
              ) : (
                recentPatterns.map((pattern) => (
                  <tr
                    key={pattern.id}
                    onClick={() => setSelectedRecord(pattern)}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium">{pattern.name}</td>
                    <td className="px-4 py-3 text-sm capitalize">{pattern.pattern_type}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {pattern.time_window ? `${pattern.time_window}s` : 'No limit'}
                    </td>
                    <td className="px-4 py-3">
                      <PAStatusBadge enabled={pattern.enabled} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {pattern.last_match_at ? new Date(pattern.last_match_at).toLocaleDateString() : 'Never'}
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

function OverviewTab({ record }: { record: EventPattern | null }) {
  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <TrendingUp className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Event Pattern Selected</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Select an event pattern from the list to view its details
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Pattern Header Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">{record.name}</h3>
              <PAStatusBadge enabled={record.enabled} />
            </div>
            <p className="text-sm text-muted-foreground mb-3">{record.description || "No description provided"}</p>
          </div>
          <Button variant="outline" size="sm">
            Edit Pattern
          </Button>
        </div>
      </div>

      {/* Pattern Type */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Pattern Configuration
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/50 border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Pattern Type</p>
            <p className="text-sm font-medium capitalize">{record.pattern_type}</p>
          </div>
          <div className="bg-secondary/50 border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Time Window</p>
            <p className="text-sm font-medium">{record.time_window ? `${record.time_window}s` : "No limit"}</p>
          </div>
        </div>
      </div>

      {/* Match Stats — styled like overview KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Total Matches */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="h-1 w-full bg-primary" />
          <div className="p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold leading-none mb-1">
                {record.match_count != null ? record.match_count : 0}
              </p>
              <p className="text-xs text-muted-foreground">Total Matches</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">All-time detections</p>
            </div>
          </div>
        </div>

        {/* False Positives */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="h-1 w-full bg-warning" />
          <div className="p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold leading-none mb-1">
                {record.false_positive_count != null ? record.false_positive_count : 0}
              </p>
              <p className="text-xs text-muted-foreground">False Positives</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                {record.match_count && record.match_count > 0
                  ? `${(((record.false_positive_count ?? 0) / record.match_count) * 100).toFixed(0)}% of matches`
                  : 'No matches yet'}
              </p>
            </div>
          </div>
        </div>

        {/* Last Match */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="h-1 w-full bg-success" />
          <div className="p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-none mb-1 pt-1">
                {record.last_match_at
                  ? new Date(record.last_match_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Never'}
              </p>
              <p className="text-xs text-muted-foreground">Last Match</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                {record.last_match_at
                  ? new Date(record.last_match_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                  : 'No matches recorded'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Match Conditions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Hash className="w-4 h-4 text-primary" />
          Match Conditions (JSON)
        </h4>
        <div className="bg-secondary/50 border border-border rounded-lg p-4">
          <pre className="text-xs font-mono overflow-auto">{JSON.stringify(record.match_conditions, null, 2)}</pre>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        {record.created_by && <InfoRow label="Created By" value={record.created_by} />}
        <InfoRow label="Created At" value={new Date(record.created_at).toLocaleString()} />
        <InfoRow label="Updated At" value={new Date(record.updated_at).toLocaleString()} />
      </div>
    </div>
  );
}

function ParametersTab({ record }: { record: EventPattern | null }) {
  if (!record) {
    return <EmptyState title="No Event Pattern Selected" />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4">Detection Parameters</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Threshold</label>
              <p className="text-sm mt-1">{record.detection_threshold || "Auto"}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Confidence Level</label>
              <p className="text-sm mt-1">{record.confidence_level ? `${(record.confidence_level * 100).toFixed(0)}%` : "N/A"}</p>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Action on Match</label>
            <p className="text-sm mt-1 capitalize p-2 bg-secondary/50 border border-border rounded">{record.action_on_match || "none"}</p>
          </div>
          {record.trigger_id && (
            <div>
              <label className="text-xs text-muted-foreground">Trigger Connection</label>
              <p className="text-xs font-mono mt-1 p-2 bg-secondary/50 border border-border rounded">{record.trigger_id}</p>
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
        <TrendingUp className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        Select an event pattern from the list to view its details
      </p>
    </div>
  );
}
