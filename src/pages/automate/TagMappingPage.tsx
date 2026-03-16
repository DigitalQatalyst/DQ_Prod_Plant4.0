import { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard, DataTable, TableConfigs, EmptyStates } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Plus, Tag, Database, Link as LinkIcon, Loader2, Activity, CheckCircle2 } from "lucide-react";
import { TagMapping } from "@/types/processAutomation";
import { getHybridProvider } from "@/lib/data/providers/HybridProvider";
import { SharedLinkedAssetsTab, SharedHistoryTab } from "@/components/automate/SharedDetailTabs";
import { cn } from "@/lib/utils";

// PA Status Badge Component
function PAStatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", "bg-success/10 text-success border-success/20")}>
        Active
      </span>
    );
  }
  return (
    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", "bg-muted text-muted-foreground border-border")}>
      Inactive
    </span>
  );
}

export function TagMappingPage() {
  const { currentSector, currentSubsector, currentTenant } = useApp();
  const [records, setRecords] = useState<TagMapping[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TagMapping | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("updated-desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dataTypeFilter, setDataTypeFilter] = useState<string>("all");
  const [sourceSystemFilter, setSourceSystemFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  // Fetch data when tenant changes
  useEffect(() => {
    const fetchData = async () => {
      if (!currentTenant?.id) return;

      setIsLoading(true);
      setError(null);
      try {
        const provider = getHybridProvider();
        const data = await provider.getTagMappings(currentTenant.id);
        setRecords(data);

        // Reset selection if the selected record is no longer in the list (or just clear it)
        setSelectedRecord(null);
      } catch (err) {
        console.error("Failed to fetch tag mappings:", err);
        setError("Failed to load tag mappings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentTenant?.id]);

  // Get unique data types and source systems for filters
  const dataTypes = useMemo(() => {
    const types = new Set(records.map(r => r.data_type));
    return Array.from(types).sort();
  }, [records]);

  const sourceSystems = useMemo(() => {
    const systems = new Set(records.map(r => r.source_system));
    return Array.from(systems).sort();
  }, [records]);

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    let filtered = records.filter((r) => {
      // Search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        const matchesSearch =
          r.source_tag.toLowerCase().includes(search) ||
          r.internal_tag.toLowerCase().includes(search) ||
          (r.description && r.description.toLowerCase().includes(search));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter === "active" && !r.is_active) return false;
      if (statusFilter === "inactive" && r.is_active) return false;

      // Data type filter
      if (dataTypeFilter !== "all" && r.data_type !== dataTypeFilter) return false;

      // Source system filter
      if (sourceSystemFilter !== "all" && r.source_system !== sourceSystemFilter) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "internal-asc":
          return a.internal_tag.localeCompare(b.internal_tag);
        case "internal-desc":
          return b.internal_tag.localeCompare(a.internal_tag);
        case "source-asc":
          return a.source_tag.localeCompare(b.source_tag);
        case "source-desc":
          return b.source_tag.localeCompare(a.source_tag);
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
  }, [records, searchQuery, sortBy, statusFilter, dataTypeFilter, sourceSystemFilter]);

  const tabs = selectedRecord
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <OverviewTab record={selectedRecord} isUpstream={currentTenant.id === 't-upstream'} />,
      },
      {
        id: "parameters",
        label: "Parameters",
        content: <ParametersTab record={selectedRecord} sectorName={currentSector.name} subsectorName={currentSubsector} />,
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
        label: "Tag Mappings Overview",
        content: <TagMappingsOverview records={filteredRecords} setSelectedRecord={setSelectedRecord} />,
      },
    ];

  return (
    <div className="flex w-full h-full overflow-hidden gap-4 p-4 bg-muted/40">
      <ListPane
        title="Tag Mapping"
        subtitle={`${currentSector.name} · ${currentSubsector}`}
        count={filteredRecords.length}
        searchPlaceholder="Search tag mappings..."
        onSearch={setSearchQuery}
        sortOptions={[
          { value: "internal-asc", label: "Internal Tag (A-Z)" },
          { value: "internal-desc", label: "Internal Tag (Z-A)" },
          { value: "source-asc", label: "Source Tag (A-Z)" },
          { value: "source-desc", label: "Source Tag (Z-A)" },
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
              { value: "inactive", label: "Inactive Only" },
            ],
          },
          {
            key: "dataType",
            label: "Data Type",
            value: dataTypeFilter,
            onChange: setDataTypeFilter,
            options: [
              { value: "all", label: "All Data Types" },
              ...dataTypes.map(type => ({ value: type, label: type })),
            ],
          },
          {
            key: "sourceSystem",
            label: "Source System",
            value: sourceSystemFilter,
            onChange: setSourceSystemFilter,
            options: [
              { value: "all", label: "All Systems" },
              ...sourceSystems.map(system => ({ value: system, label: system })),
            ],
          },
        ]}
        actions={
          <Button size="sm" className="w-full mt-2 gap-2">
            <Plus className="w-4 h-4" />
            Add Mapping
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
          <div className="p-4 text-sm text-muted-foreground text-center">No tag mappings found</div>
        ) : (
          filteredRecords.map((record) => (
            <TagMappingListItem
              key={record.id}
              record={record}
              isSelected={selectedRecord?.id === record.id}
              onClick={() => setSelectedRecord(record)}
            />
          ))
        )}
      </ListPane>

      <WorkPane
        title={selectedRecord?.internal_tag || "Tag Mapping"}
        subtitle={
          selectedRecord
            ? `${selectedRecord.source_system} : ${selectedRecord.source_tag} → ${selectedRecord.internal_tag}`
            : "Select a mapping to view details"
        }
        tabs={tabs}
        className="rounded-lg border bg-background shadow-sm"
      />
    </div>
  );
}

function formatTagName(tag: string) {
  return tag
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function TagMappingListItem({
  record,
  isSelected,
  onClick,
}: {
  record: TagMapping;
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
          <Tag className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col items-start gap-1 mb-1">
            <span className="text-sm font-medium break-words">{formatTagName(record.internal_tag)}</span>
            <PAStatusBadge isActive={record.is_active} />
          </div>
          <p className="text-xs text-muted-foreground break-words mb-1">
            {record.source_tag} ({record.source_system})
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{record.data_type}</span>
            {record.unit && (
              <>
                <span>·</span>
                <span>{record.unit}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TagMappingsOverview({
  records,
  setSelectedRecord,
}: {
  records: TagMapping[];
  setSelectedRecord: (record: TagMapping) => void;
}) {
  const stats = useMemo(() => {
    const totalMappings = records.length;
    const activeMappings = records.filter(r => r.is_active).length;
    const uniqueDataTypes = new Set(records.map(r => r.data_type)).size;
    const recentlyUpdated = records.filter(r => {
      const daysSinceUpdate = (Date.now() - new Date(r.updated_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate <= 7;
    }).length;

    return { totalMappings, activeMappings, uniqueDataTypes, recentlyUpdated };
  }, [records]);

  const recentMappings = useMemo(() => {
    return records
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10);
  }, [records]);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Mappings"
          value={stats.totalMappings.toString()}
          subtitle="All tag mappings"
          icon={Tag}
          variant="primary"
        />
        <KPICard
          title="Active Mappings"
          value={stats.activeMappings.toString()}
          subtitle="Currently in use"
          icon={CheckCircle2}
          variant="success"
          trend="up"
          trendValue={`${((stats.activeMappings / stats.totalMappings) * 100).toFixed(0)}%`}
        />
        <KPICard
          title="Data Types"
          value={stats.uniqueDataTypes.toString()}
          subtitle="Unique types"
          icon={Database}
          variant="primary"
        />
        <KPICard
          title="Recent Updates"
          value={stats.recentlyUpdated.toString()}
          subtitle="Last 7 days"
          icon={Activity}
          variant="warning"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Data Types Distribution</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={useMemo(() => {
                const counts: Record<string, number> = {};
                records.forEach(r => counts[r.data_type] = (counts[r.data_type] || 0) + 1);
                return Object.entries(counts)
                  .map(([name, value]) => ({ name, value }))
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 5);
              }, [records])}>
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
                  data={useMemo(() => {
                    const active = records.filter(r => r.is_active).length;
                    const inactive = records.length - active;
                    return [
                      { name: 'Active', value: active, color: '#22c55e' },
                      { name: 'Inactive', value: inactive, color: '#94a3b8' },
                    ];
                  }, [records])}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[
                    { name: 'Active', value: records.filter(r => r.is_active).length, color: '#22c55e' },
                    { name: 'Inactive', value: records.length - records.filter(r => r.is_active).length, color: '#94a3b8' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Mappings Table */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Recent Tag Mappings</h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Internal Tag</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Source Tag</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Data Type</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Unit</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentMappings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No tag mappings found
                  </td>
                </tr>
              ) : (
                recentMappings.map((mapping) => (
                  <tr
                    key={mapping.id}
                    onClick={() => setSelectedRecord(mapping)}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium">{mapping.internal_tag}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono text-xs">{mapping.source_tag}</td>
                    <td className="px-4 py-3 text-sm">{mapping.data_type}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{mapping.unit || "-"}</td>
                    <td className="px-4 py-3">
                      <PAStatusBadge isActive={mapping.is_active} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(mapping.updated_at).toLocaleDateString()}
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

function OverviewTab({ record, isUpstream }: { record: TagMapping | null, isUpstream: boolean }) {
  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <Tag className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Mapping Selected</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Select a tag mapping from the list to view its details
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mapping Header Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <Tag className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">{record.internal_tag}</h3>
              <PAStatusBadge isActive={record.is_active} />
            </div>
            <p className="text-sm text-muted-foreground mb-3">{record.description || "No description provided"}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {/* Display Source System as primary context */}
              <span>Source: {record.source_system}</span>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Edit Mapping
          </Button>
        </div>
      </div>

      {/* Mapping Flow */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          Mapping Flow
        </h4>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-secondary/50 border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Source Tag ({record.source_system})</p>
            <p className="text-sm font-mono font-medium">{record.source_tag}</p>
          </div>
          <LinkIcon className="w-5 h-5 text-primary" />
          <div className="flex-1 bg-secondary/50 border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Internal Tag</p>
            <p className="text-sm font-mono font-medium">{record.internal_tag}</p>
          </div>
        </div>
      </div>

      {/* Data Type Info */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Data Configuration</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Data Type" value={record.data_type} />
            <InfoRow label="Unit" value={record.unit || "-"} />
            {record.scaling_factor !== undefined && (
              <InfoRow label="Scaling Factor" value={record.scaling_factor.toString()} />
            )}
            {record.offset !== undefined && (
              <InfoRow label="Offset" value={record.offset.toString()} />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Metadata</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Created By" value={record.created_by} />
            <InfoRow label="Created At" value={new Date(record.created_at).toLocaleString()} />
            <InfoRow label="Updated At" value={new Date(record.updated_at).toLocaleString()} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ParametersTab({ record, sectorName, subsectorName }: { record: TagMapping | null, sectorName: string, subsectorName: string }) {
  if (!record) {
    return <EmptyState title="No Mapping Selected" />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4">Configuration Parameters</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Source Tag</label>
              <p className="text-sm font-mono mt-1">{record.source_tag}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Internal Tag</label>
              <p className="text-sm font-mono mt-1">{record.internal_tag}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Data Type</label>
              <p className="text-sm mt-1">{record.data_type}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Unit</label>
              <p className="text-sm mt-1">{record.unit || "-"}</p>
            </div>
            {record.scaling_factor !== undefined && (
              <div>
                <label className="text-xs text-muted-foreground">Scaling Factor</label>
                <p className="text-sm mt-1">{record.scaling_factor}</p>
              </div>
            )}
            {record.offset !== undefined && (
              <div>
                <label className="text-xs text-muted-foreground">Offset</label>
                <p className="text-sm mt-1">{record.offset}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4">Sector Configuration</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">Sector</label>
            <p className="text-sm mt-1">{sectorName}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Subsector</label>
            <p className="text-sm mt-1">{subsectorName}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Tenant ID</label>
            <p className="text-sm mt-1 font-mono text-xs">{record.tenant_id}</p>
          </div>
        </div>
      </div>
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
        <Tag className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        Select a tag mapping from the list to view its details
      </p>
    </div>
  );
}
