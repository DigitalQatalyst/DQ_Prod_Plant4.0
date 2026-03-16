import { useState, useEffect, useMemo, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, GitCommit, User, Calendar, Loader2, CheckCircle2, Clock, XCircle, Activity, ShieldCheck } from "lucide-react";
import { useDataProvider } from "@/context/DataProviderContext";
import { useTenant } from "@/context/TenantContext";
import { Version } from "@/types/processAutomation";
import { cn } from "@/lib/utils";

export function VersionsPage() {
  const { currentTenant } = useTenant();
  const dataProvider = useDataProvider();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("created-desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    async function loadVersions() {
      setIsLoading(true);
      try {
        const data = await dataProvider.getVersions(currentTenant.id);
        setVersions(data);
      } catch (error) {
        console.error("Failed to load versions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (currentTenant?.id) {
      loadVersions();
    }
  }, [currentTenant?.id, dataProvider]);

  const handleApprove = useCallback(async (version: Version) => {
    setIsApproving(true);
    try {
      const updated = await dataProvider.approveVersion(version.id, 'Current User');
      setVersions(prev => prev.map(v => v.id === updated.id ? updated : v));
      setSelectedVersion(updated);
    } catch (error) {
      console.error('Failed to approve version:', error);
    } finally {
      setIsApproving(false);
    }
  }, [dataProvider]);

  // Filter and sort versions
  const filteredVersions = useMemo(() => {
    let filtered = versions.filter((version) => {
      // Search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        const matchesSearch =
          version.version_number.toLowerCase().includes(search) ||
          version.description.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Status filter (Approval Status)
      if (statusFilter !== "all" && version.approval_status !== statusFilter) return false;

      // Type filter (Change Type)
      if (typeFilter !== "all" && version.change_type !== typeFilter) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "version-asc":
          return a.version_number.localeCompare(b.version_number);
        case "version-desc":
          return b.version_number.localeCompare(a.version_number);
        case "created-asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "created-desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [versions, searchQuery, sortBy, statusFilter, typeFilter]);

  const tabs = selectedVersion
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <OverviewTab version={selectedVersion} onApprove={handleApprove} isApproving={isApproving} />,
      },
      {
        id: "components",
        label: "Affected Components",
        content: <ComponentsTab version={selectedVersion} />,
      },
      {
        id: "json",
        label: "Raw Data",
        content: <JsonTab version={selectedVersion} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Versions Overview",
        content: <VersionsOverview versions={filteredVersions} setSelectedVersion={setSelectedVersion} />,
      },
    ];

  return (
    <div className="flex w-full h-full overflow-hidden gap-4 p-4 bg-muted/40">
      <ListPane
        title="Versions"
        subtitle="Version control history"
        count={filteredVersions.length}
        searchPlaceholder="Search versions..."
        onSearch={setSearchQuery}
        sortOptions={[
          { value: "version-asc", label: "Version (Low to High)" },
          { value: "version-desc", label: "Version (High to Low)" },
          { value: "created-asc", label: "Oldest First" },
          { value: "created-desc", label: "Newest First" },
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
              { value: "approved", label: "Approved" },
              { value: "pending", label: "Pending" },
              { value: "rejected", label: "Rejected" },
            ],
          },
          {
            key: "type",
            label: "Change Type",
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { value: "all", label: "All Types" },
              { value: "major", label: "Major" },
              { value: "minor", label: "Minor" },
              { value: "patch", label: "Patch" },
            ],
          },
        ]}
        actions={
          <Button size="sm" className="w-full mt-2 gap-2">
            <Plus className="w-4 h-4" />
            Create Version
          </Button>
        }
        className="rounded-lg border bg-background shadow-sm"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-xs font-bold tracking-tighter uppercase">Loading...</p>
          </div>
        ) : filteredVersions.length === 0 ? (
          <EmptyState />
        ) : (
          filteredVersions.map((version) => (
            <VersionListItem
              key={version.id}
              version={version}
              isSelected={selectedVersion?.id === version.id}
              onClick={() => setSelectedVersion(version)}
              onApprove={handleApprove}
            />
          ))
        )}
      </ListPane>

      <WorkPane
        title={selectedVersion ? `v${selectedVersion.version_number}` : "Versions"}
        subtitle={selectedVersion?.description || "Select a version to view details"}
        tabs={tabs}
        className="rounded-lg border bg-background shadow-sm"
      />
    </div>
  );
}

function VersionListItem({ version, isSelected, onClick, onApprove }: { version: Version; isSelected: boolean; onClick: () => void; onApprove: (v: Version) => void }) {
  const getChangeTypeBadge = () => {
    switch (version.change_type) {
      case 'major': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] h-5 font-normal">Major</Badge>;
      case 'minor': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] h-5 font-normal">Minor</Badge>;
      case 'patch': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] h-5 font-normal">Patch</Badge>;
    }
  };

  const getApprovalStatusBadge = () => {
    switch (version.approval_status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] h-5 font-normal gap-1 flex items-center"><CheckCircle2 className="w-3 h-3" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] h-5 font-normal gap-1 flex items-center"><XCircle className="w-3 h-3" />Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-[10px] h-5 font-normal gap-1 flex items-center"><Clock className="w-3 h-3" />Pending</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px] h-5 font-normal capitalize">{version.approval_status}</Badge>;
    }
  };

  const canApprove = version.approval_status !== 'approved';

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-all duration-200 mb-2 group",
        isSelected
          ? "bg-primary/10 border-primary shadow-sm"
          : "bg-card border-border hover:border-primary/30 hover:bg-accent/50"
      )}
    >
      <div className="flex items-start gap-3" onClick={onClick} role="button" tabIndex={0}>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <GitCommit className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm font-medium truncate">v{version.version_number}</span>
            {getApprovalStatusBadge()}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {version.description}
          </p>
          <div className="flex items-center justify-between">
            {getChangeTypeBadge()}
            <span className="text-[10px] text-muted-foreground">
              {new Date(version.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
      {canApprove && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <Button
            size="sm"
            variant="outline"
            className="w-full h-7 text-[11px] gap-1.5 text-green-600 border-green-500/30 hover:bg-green-500/10 hover:border-green-500/50"
            onClick={(e) => { e.stopPropagation(); onApprove(version); }}
          >
            <ShieldCheck className="w-3 h-3" />
            Approve
          </Button>
        </div>
      )}
    </div>
  );
}

function VersionsOverview({
  versions,
  setSelectedVersion,
}: {
  versions: Version[];
  setSelectedVersion: (version: Version) => void;
}) {
  const stats = useMemo(() => {
    const totalVersions = versions.length;
    const approved = versions.filter(v => v.approval_status === 'approved').length;
    const pendingApproval = versions.filter(v => v.approval_status === 'pending').length;
    const recentChanges = versions.filter(v => {
      const daysSinceCreation = (Date.now() - new Date(v.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreation <= 7;
    }).length;

    return { totalVersions, approved, pendingApproval, recentChanges };
  }, [versions]);

  const recentVersions = useMemo(() => {
    return versions
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }, [versions]);

  const approvalStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    versions.forEach(v => counts[v.approval_status] = (counts[v.approval_status] || 0) + 1);
    const statusColors: Record<string, string> = { approved: '#22c55e', rejected: '#ef4444', pending: '#eab308' };
    return Object.entries(counts)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: statusColors[name] || '#94a3b8'
      }));
  }, [versions]);

  const changeTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    versions.forEach(v => counts[v.change_type] = (counts[v.change_type] || 0) + 1);
    const typeColors: Record<string, string> = { major: '#ef4444', minor: '#3b82f6', patch: '#22c55e' };
    return Object.entries(counts)
      .map(([name, value]) => ({
        name: name.toUpperCase(),
        value,
        color: typeColors[name] || '#94a3b8'
      }));
  }, [versions]);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Versions"
          value={stats.totalVersions.toString()}
          subtitle="All versions"
          icon={GitCommit}
          variant="primary"
        />
        <KPICard
          title="Approved"
          value={stats.approved.toString()}
          subtitle="Production ready"
          icon={CheckCircle2}
          variant="success"
          trend="up"
          trendValue={`${((stats.approved / stats.totalVersions) * 100).toFixed(0)}%`}
        />
        <KPICard
          title="Pending Approval"
          value={stats.pendingApproval.toString()}
          subtitle="Awaiting review"
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="Recent Changes"
          value={stats.recentChanges.toString()}
          subtitle="Last 7 days"
          icon={Activity}
          variant="primary"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Approval Status</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={approvalStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {approvalStatusData.map((entry, index) => (
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

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Change Types</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={changeTypeData}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {changeTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Versions Table */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Recent Versions</h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Version</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Change Type</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Description</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentVersions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No versions found
                  </td>
                </tr>
              ) : (
                recentVersions.map((version) => (
                  <tr
                    key={version.id}
                    onClick={() => setSelectedVersion(version)}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-bold">{version.version_number}</td>
                    <td className="px-4 py-3">
                      {version.change_type === 'major' && <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] h-5">MAJOR</Badge>}
                      {version.change_type === 'minor' && <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] h-5">MINOR</Badge>}
                      {version.change_type === 'patch' && <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] h-5">PATCH</Badge>}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground truncate max-w-xs">
                      {version.description}
                    </td>
                    <td className="px-4 py-3">
                      {version.approval_status === 'approved' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      {version.approval_status === 'rejected' && <XCircle className="w-4 h-4 text-red-500" />}
                      {version.approval_status === 'pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(version.created_at).toLocaleDateString()}
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

function OverviewTab({ version, onApprove, isApproving }: { version: Version | null; onApprove: (v: Version) => void; isApproving: boolean }) {
  if (!version) return <EmptyWorkPaneState />;

  const canApprove = version.approval_status !== 'approved';

  const getApprovalStatusBadge = () => {
    switch (version.approval_status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 gap-1"><XCircle className="w-3.5 h-3.5" />Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 gap-1"><Clock className="w-3.5 h-3.5" />Pending Approval</Badge>;
      default:
        return <Badge variant="secondary" className="capitalize">{version.approval_status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <GitCommit className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">v{version.version_number}</h3>
              {version.change_type === 'major' && <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Major</Badge>}
              {version.change_type === 'minor' && <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Minor</Badge>}
              {version.change_type === 'patch' && <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Patch</Badge>}
              {getApprovalStatusBadge()}
            </div>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{version.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {version.created_by}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(version.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          {canApprove && (
            <Button
              size="sm"
              className="gap-2 bg-green-600 hover:bg-green-700 text-white shrink-0"
              onClick={() => onApprove(version)}
              disabled={isApproving}
            >
              {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {isApproving ? 'Approving...' : 'Approve Version'}
            </Button>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Version Details</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Version Number" value={version.version_number} />
            <InfoRow label="Change Type" value={version.change_type} />
            <InfoRow label="Approval Status" value={version.approval_status} />
            <InfoRow label="Created By" value={version.created_by} />
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Governance</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            {version.approval_status === 'approved' ? (
              <>
                <InfoRow label="Approved By" value={version.approved_by || 'N/A'} />
                <InfoRow label="Approval Date" value={version.approved_at ? new Date(version.approved_at).toLocaleString() : 'N/A'} />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center gap-2">
                <Clock className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">
                  {version.approval_status === 'pending' ? 'Awaiting approval' : `Status: ${version.approval_status}`}
                </p>
              </div>
            )}
            <InfoRow label="Created At" value={new Date(version.created_at).toLocaleString()} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ComponentsTab({ version }: { version: Version | null }) {
  if (!version) return <EmptyWorkPaneState />;

  const components = version.affected_components as Record<string, string[]>;

  return (
    <div className="space-y-4">
      {Object.entries(components).map(([type, ids]) => (
        <div key={type} className="p-5 rounded-2xl border bg-card space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-primary capitalize">{type}</h4>
            <Badge variant="secondary" className="text-[10px] font-bold">{ids.length} ITEMS</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ids.map((id) => (
              <div key={id} className="p-3 rounded-xl bg-accent/30 border border-border/50 text-[10px] font-mono truncate uppercase tracking-tighter">
                {id}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function JsonTab({ version }: { version: Version | null }) {
  if (!version) return <EmptyWorkPaneState />;

  return (
    <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
      <div className="bg-muted/50 px-4 py-3 border-b flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          Metadata Explorer
        </span>
      </div>
      <pre className="p-6 text-[11px] font-mono overflow-auto max-h-[600px] bg-black/20 leading-relaxed text-blue-400/80">
        {JSON.stringify(version, null, 2)}
      </pre>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium capitalize">{value}</span>
    </div>
  );
}

function EmptyWorkPaneState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <GitCommit className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Version Selected</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        Select a version from the list to view its details.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <GitCommit className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Versions Found</h3>
      <p className="text-sm text-muted-foreground max-w-[200px] leading-relaxed">No automation versions recorded for this tenant yet.</p>
    </div>
  );
}
