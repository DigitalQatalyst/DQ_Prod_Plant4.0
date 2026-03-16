import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckSquare, Clock, CheckCircle2, XCircle, User, Calendar, FileText, ShieldAlert, Loader2, Activity } from "lucide-react";
import { useDataProvider } from "@/context/DataProviderContext";
import { useTenant } from "@/context/TenantContext";
import { Approval } from "@/types/processAutomation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ApprovalsPage() {
  const { currentTenant } = useTenant();
  const dataProvider = useDataProvider();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("requested-desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadApprovals();
  }, [currentTenant?.id, dataProvider]);

  async function loadApprovals() {
    setIsLoading(true);
    try {
      const data = await dataProvider.getApprovals(currentTenant.id);
      setApprovals(data);
    } catch (error) {
      console.error("Failed to load approvals:", error);
      toast.error("Failed to load approvals");
    } finally {
      setIsLoading(false);
    }
  }

  const handleApprove = async () => {
    if (!selectedApproval) return;
    setIsProcessing(true);
    try {
      const updated = await dataProvider.approveApproval(selectedApproval.id, "Manager Admin");
      setSelectedApproval(updated);
      setApprovals(prev => prev.map(a => a.id === updated.id ? updated : a));
      toast.success("Approval granted successfully");
    } catch (error) {
      toast.error("Failed to approve");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!selectedApproval) return;
    if (!reason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    setIsProcessing(true);
    try {
      const updated = await dataProvider.rejectApproval(selectedApproval.id, "Manager Admin", reason);
      setSelectedApproval(updated);
      setApprovals(prev => prev.map(a => a.id === updated.id ? updated : a));
      toast.success("Record rejected");
    } catch (error) {
      toast.error("Failed to reject");
    } finally {
      setIsProcessing(false);
    }
  };

  // Get unique record types for filter
  const recordTypes = useMemo(() => {
    const types = new Set(approvals.map(a => a.record_type));
    return Array.from(types).sort();
  }, [approvals]);

  // Filter and sort approvals
  const filteredApprovals = useMemo(() => {
    let filtered = approvals.filter((approval) => {
      // Search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        const matchesSearch =
          approval.requested_by.toLowerCase().includes(search) ||
          approval.record_type.toLowerCase().includes(search) ||
          approval.record_id.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== "all" && approval.status !== statusFilter) return false;

      // Type filter
      if (typeFilter !== "all" && approval.record_type !== typeFilter) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "requester-asc":
          return a.requested_by.localeCompare(b.requested_by);
        case "requester-desc":
          return b.requested_by.localeCompare(a.requested_by);
        case "type-asc":
          return a.record_type.localeCompare(b.record_type);
        case "type-desc":
          return b.record_type.localeCompare(a.record_type);
        case "requested-asc":
          return new Date(a.requested_at).getTime() - new Date(b.requested_at).getTime();
        case "requested-desc":
          return new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime();
        default:
          return new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime();
      }
    });

    return filtered;
  }, [approvals, searchQuery, sortBy, statusFilter, typeFilter]);

  const tabs = selectedApproval
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <OverviewTab
          approval={selectedApproval}
          onApprove={handleApprove}
          onReject={handleReject}
          isProcessing={isProcessing}
        />,
      },
      {
        id: "details",
        label: "Manifest",
        content: <DetailsTab approval={selectedApproval} />,
      },
      {
        id: "history",
        label: "Timeline",
        content: <HistoryTab approval={selectedApproval} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Approvals Overview",
        content: <ApprovalsOverview approvals={filteredApprovals} setSelectedApproval={setSelectedApproval} />,
      },
    ];

  return (
    <div className="flex w-full h-full overflow-hidden gap-4 p-4 bg-muted/40">
      <ListPane
        title="Approvals"
        subtitle="Governance safety board"
        count={filteredApprovals.length}
        searchPlaceholder="Search approvals..."
        onSearch={setSearchQuery}
        sortOptions={[
          { value: "requester-asc", label: "Requester (A-Z)" },
          { value: "requester-desc", label: "Requester (Z-A)" },
          { value: "type-asc", label: "Type (A-Z)" },
          { value: "type-desc", label: "Type (Z-A)" },
          { value: "requested-asc", label: "Oldest First" },
          { value: "requested-desc", label: "Newest First" },
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
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
            ],
          },
          {
            key: "type",
            label: "Request Type",
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { value: "all", label: "All Types" },
              ...recordTypes.map(type => ({ value: type, label: type.toUpperCase() })),
            ],
          },
        ]}
        actions={
          <Button size="sm" className="w-full mt-2 gap-2">
            <Plus className="w-4 h-4" />
            Request Approval
          </Button>
        }
        className="rounded-lg border bg-background shadow-sm"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest">Verifying Identity...</p>
          </div>
        ) : filteredApprovals.length === 0 ? (
          <EmptyState />
        ) : (
          filteredApprovals.map((approval) => (
            <ApprovalListItem
              key={approval.id}
              approval={approval}
              isSelected={selectedApproval?.id === approval.id}
              onClick={() => setSelectedApproval(approval)}
            />
          ))
        )}
      </ListPane>

      <WorkPane
        title={selectedApproval ? `${selectedApproval.record_type.toUpperCase()} REQUEST` : "Approvals"}
        subtitle={selectedApproval ? `Tracking ID: ${selectedApproval.id.slice(0, 8)}...` : "Select a request to review"}
        tabs={tabs}
        className="rounded-lg border bg-background shadow-sm"
      />
    </div>
  );
}

function ApprovalListItem({ approval, isSelected, onClick }: { approval: Approval; isSelected: boolean; onClick: () => void }) {
  const getStatusColor = () => {
    switch (approval.status) {
      case "approved": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "rejected": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    }
  };

  const statusLabel = approval.status.charAt(0).toUpperCase() + approval.status.slice(1);

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all duration-200 mb-2",
        isSelected
          ? "bg-primary/10 border-primary shadow-sm"
          : "bg-card border-border hover:border-primary/30 hover:bg-accent/50"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm font-medium capitalize truncate">{approval.record_type}</span>
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-normal", getStatusColor())}>
              {statusLabel}
            </span>
          </div>
          <p className="text-xs text-muted-foreground break-words mb-2 line-clamp-1">
            Requested by {approval.requested_by}
          </p>
          <div className="flex items-center justify-between">
            <code className="text-[10px] text-muted-foreground bg-secondary px-1 py-0.5 rounded">
              {approval.record_id.slice(0, 8)}...
            </code>
            <span className="text-[10px] text-muted-foreground">
              {new Date(approval.requested_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApprovalsOverview({
  approvals,
  setSelectedApproval,
}: {
  approvals: Approval[];
  setSelectedApproval: (approval: Approval) => void;
}) {
  const stats = useMemo(() => {
    const totalRequests = approvals.length;
    const pending = approvals.filter(a => a.status === 'pending').length;
    const approved = approvals.filter(a => a.status === 'approved').length;
    const rejected = approvals.filter(a => a.status === 'rejected').length;

    return { totalRequests, pending, approved, rejected };
  }, [approvals]);

  const recentApprovals = useMemo(() => {
    return approvals
      .sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime())
      .slice(0, 10);
  }, [approvals]);

  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    approvals.forEach(a => counts[a.record_type] = (counts[a.record_type] || 0) + 1);
    return Object.entries(counts)
      .map(([name, value]) => ({ name: name.toUpperCase(), value }))
      .sort((a, b) => b.value - a.value);
  }, [approvals]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    approvals.forEach(a => counts[a.status] = (counts[a.status] || 0) + 1);
    const statusColors: Record<string, string> = { approved: '#22c55e', rejected: '#ef4444', pending: '#eab308' };
    return Object.entries(counts)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: statusColors[name] || '#94a3b8'
      }));
  }, [approvals]);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Requests"
          value={stats.totalRequests.toString()}
          subtitle="All approval requests"
          icon={ShieldAlert}
          variant="primary"
        />
        <KPICard
          title="Pending"
          value={stats.pending.toString()}
          subtitle="Awaiting review"
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="Approved"
          value={stats.approved.toString()}
          subtitle="Authorized changes"
          icon={CheckCircle2}
          variant="success"
          trend="up"
          trendValue={`${((stats.approved / stats.totalRequests) * 100).toFixed(0)}%`}
        />
        <KPICard
          title="Rejected"
          value={stats.rejected.toString()}
          subtitle="Denied requests"
          icon={XCircle}
          variant="destructive"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Request Types</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData}>
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

      {/* Recent Approvals Table */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Recent Approval Requests</h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Request Type</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Requester</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Reviewer</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentApprovals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No approval requests found
                  </td>
                </tr>
              ) : (
                recentApprovals.map((approval) => (
                  <tr
                    key={approval.id}
                    onClick={() => setSelectedApproval(approval)}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium uppercase">{approval.record_type}</td>
                    <td className="px-4 py-3 text-sm">{approval.requested_by}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {approval.reviewed_by || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {approval.status === 'approved' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      {approval.status === 'rejected' && <XCircle className="w-4 h-4 text-red-500" />}
                      {approval.status === 'pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(approval.requested_at).toLocaleDateString()}
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

function OverviewTab({
  approval,
  onApprove,
  onReject,
  isProcessing
}: {
  approval: Approval | null;
  onApprove: () => void;
  onReject: (reason: string) => void;
  isProcessing: boolean;
}) {
  const [rejectionReason, setRejectionReason] = useState("");

  if (!approval) return <EmptyWorkPaneState />;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold capitalize">{approval.record_type} Approval</h3>
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-full border font-normal",
                approval.status === 'approved' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                  approval.status === 'rejected' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                    "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
              )}>
                {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Requested by {approval.requested_by}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(approval.requested_at).toLocaleString()}
              </span>
              <span>·</span>
              <code className="text-[10px] bg-secondary px-1 py-0.5 rounded">{approval.record_id.slice(0, 12)}...</code>
            </div>
          </div>
        </div>
      </div>

      {/* Details + Review Grid */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Request Details</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Record Type" value={approval.record_type} />
            <InfoRow label="Requested By" value={approval.requested_by} />
            <InfoRow label="Record ID" value={approval.record_id.slice(0, 12) + '...'} />
          </div>
          {approval.approver_list?.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Required Approvers</p>
              <div className="flex flex-wrap gap-1">
                {approval.approver_list.map(a => <Badge key={a} variant="outline" className="text-xs">{a}</Badge>)}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Review</h4>
          {approval.status === 'pending' ? (
            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              <textarea
                placeholder="Justification or rejection reason (optional)..."
                className="w-full h-20 p-3 rounded-lg border bg-background text-sm focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button className="flex-1" onClick={onApprove} disabled={isProcessing}>
                  {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Approve
                </Button>
                <Button variant="outline" className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10" onClick={() => onReject(rejectionReason)} disabled={isProcessing}>
                  Reject
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <InfoRow label="Reviewed By" value={approval.reviewed_by || '-'} />
              <InfoRow label="Reviewed At" value={approval.reviewed_at ? new Date(approval.reviewed_at).toLocaleString() : '-'} />
              {approval.rejection_reason && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Rejection Reason</p>
                  <p className="text-sm text-foreground bg-secondary rounded-lg p-2">{approval.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailsTab({ approval }: { approval: Approval | null }) {
  if (!approval) return <EmptyWorkPaneState />;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
        <div className="bg-muted/50 px-4 py-3 border-b">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Technical Traceability Manifest</span>
        </div>
        <pre className="p-6 text-[11px] font-mono overflow-auto max-h-[600px] bg-black/20 leading-relaxed text-blue-400/80">
          {JSON.stringify(approval, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function HistoryTab({ approval }: { approval: Approval | null }) {
  if (!approval) return <EmptyWorkPaneState />;

  return (
    <div className="relative pl-8 space-y-10 py-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-border before:border-dashed before:border-r">
      <div className="relative">
        <div className="absolute -left-8 mt-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-4 border-background shadow-sm">
          <Plus className="w-2 h-2 text-white" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-black tracking-tighter uppercase">Governance Request Initiated</p>
          <p className="text-xs text-muted-foreground">{new Date(approval.requested_at).toLocaleString()}</p>
          <p className="text-[9px] font-bold text-primary tracking-widest uppercase">AUTHOR: {approval.requested_by}</p>
        </div>
      </div>

      {approval.reviewed_at && (
        <div className="relative">
          <div className={cn(
            "absolute -left-8 mt-1 w-6 h-6 rounded-full flex items-center justify-center border-4 border-background shadow-sm",
            approval.status === 'approved' ? "bg-green-500" : "bg-red-500"
          )}>
            {approval.status === 'approved' ? <CheckCircle2 className="w-2 h-2 text-white" /> : <XCircle className="w-2 h-2 text-white" />}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black tracking-tighter uppercase">{approval.status === 'approved' ? 'Request Authorized' : 'Request Terminated'}</p>
            <p className="text-xs text-muted-foreground">{new Date(approval.reviewed_at).toLocaleString()}</p>
            <p className={cn(
              "text-[9px] font-bold tracking-widest uppercase",
              approval.status === 'approved' ? "text-green-500" : "text-red-500"
            )}>REVIEWER: {approval.reviewed_by}</p>
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
      <span className="text-sm font-medium capitalize">{value}</span>
    </div>
  );
}

function EmptyWorkPaneState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Approval Selected</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        Select an approval request from the list to review and action it.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <CheckSquare className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Approvals Found</h3>
      <p className="text-sm text-muted-foreground max-w-[200px] leading-relaxed">No pending authorization requests found for this tenant.</p>
    </div>
  );
}
