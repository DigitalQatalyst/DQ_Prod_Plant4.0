import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  ClipboardList,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  Building2,
  Shield,
  AlertCircle,
  Package,
  Eye,
  Settings,
  Target,
  Users,
  ExternalLink,
  Loader2,
  ShieldCheck,
  History,
  FileSearch,
  Zap,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  IdentityGovernanceMetrics,
  EnforcementHeatmap,
  SecurityMix,
  GovernanceTimeline,
  DetailPropertyRow,
  StatusLifecycle,
  TagBadgeList,
  AnalysisMetric
} from "@/components/security/IdentityGovernanceMetrics";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer,
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  Cell as RechartsCell
} from "recharts";
import { getAuditReadinessByTenant, getAuditRequirements, getAuditEvidence } from "@/lib/auditReadinessQueries";
import type { AuditReadiness, AuditRequirement, AuditEvidence } from "@/types/security";
import { IdentityOverview } from "@/components/security/IdentityOverview";

export function AuditReadinessView() {
  const { currentTenant } = useApp();

  // State for audit readiness data
  const [allAudits, setAllAudits] = useState<AuditReadiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load audit readiness data from Supabase
  useEffect(() => {
    async function loadAuditReadiness() {
      try {
        setLoading(true);
        setError(null);
        const audits = await getAuditReadinessByTenant(currentTenant.id);
        setAllAudits(audits);
      } catch (err) {
        console.error('Failed to load audit readiness data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load audit readiness data');
        setAllAudits([]);
      } finally {
        setLoading(false);
      }
    }

    loadAuditReadiness();
  }, [currentTenant.id]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedStandard, setSelectedStandard] = useState<string>("all");
  const [selectedAuditId, setSelectedAuditId] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("readiness");

  // Filter and sort audits
  const filteredAndSortedAudits = useMemo(() => {
    let result = allAudits.filter((audit) => {
      const matchesSearch =
        (audit.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (audit.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (audit.standard || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (audit.assignedCoordinator || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = selectedType === "all" || audit.type === selectedType;
      const matchesStatus = selectedStatus === "all" || audit.preparationStatus === selectedStatus;
      const matchesStandard = selectedStandard === "all" || audit.standard.toLowerCase().includes(selectedStandard.toLowerCase());

      return matchesSearch && matchesType && matchesStatus && matchesStandard;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'readiness':
          return b.overallReadiness - a.overallReadiness;
        case 'days':
          return a.daysUntilAudit - b.daysUntilAudit;
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'gaps':
          return (b.criticalGaps?.length || 0) - (a.criticalGaps?.length || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [allAudits, searchTerm, selectedType, selectedStatus, selectedStandard, sortBy]);

  const selectedAudit = allAudits.find((a) => a.id === selectedAuditId);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const total = filteredAndSortedAudits.length;
    const ready = filteredAndSortedAudits.filter((a) => a.preparationStatus === "ready").length;
    const inProgress = filteredAndSortedAudits.filter((a) => a.preparationStatus === "in-progress").length;
    const overdue = filteredAndSortedAudits.filter((a) => a.preparationStatus === "overdue").length;
    const upcoming = filteredAndSortedAudits.filter((a) => a.daysUntilAudit <= 90 && a.daysUntilAudit > 0).length;
    const avgReadiness = total > 0 ? Math.round(
      filteredAndSortedAudits.reduce((sum, a) => sum + a.overallReadiness, 0) / total
    ) : 0;
    return { total, ready, inProgress, overdue, upcoming, avgReadiness };
  }, [filteredAndSortedAudits]);

  // Get unique values for filter dropdowns
  const types = [...new Set(allAudits.map(a => a.type))];
  const statuses = [...new Set(allAudits.map(a => a.preparationStatus))];
  const standards = [...new Set(allAudits.map(a => a.standard))];

  const tabs = selectedAudit
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <AuditOverview audit={selectedAudit} />,
      },
      {
        id: "requirements",
        label: "Requirements",
        content: <AuditRequirements audit={selectedAudit} />,
      },
      {
        id: "evidence",
        label: "Evidence",
        content: <AuditEvidence audit={selectedAudit} />,
      },
      {
        id: "gaps",
        label: "Gaps & Actions",
        content: <AuditGaps audit={selectedAudit} />,
      },
    ]
    : [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "regulatory": return Shield;
      case "certification": return CheckCircle2;
      case "internal": return Building2;
      case "third-party": return ExternalLink;
      default: return ClipboardList;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "text-success";
      case "in-progress": return "text-warning";
      case "overdue": return "text-destructive";
      case "not-started": return "text-muted-foreground";
      default: return "text-muted-foreground";
    }
  };

  const getReadinessColor = (readiness: number) => {
    if (readiness >= 90) return "text-success";
    if (readiness >= 70) return "text-warning";
    return "text-destructive";
  };

  return (
    <>
      <ListPane
        title="Audits & Compliance"
        context="DEWA – Transmission"
        count={filteredAndSortedAudits.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "type",
            label: "Type",
            options: [
              { value: "all", label: "All Types" },
              ...types.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })),
            ],
            value: selectedType,
            onChange: setSelectedType,
          },
          {
            key: "status",
            label: "Status",
            options: [
              { value: "all", label: "All Statuses" },
              ...statuses.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ') })),
            ],
            value: selectedStatus,
            onChange: setSelectedStatus,
          },
          {
            key: "standard",
            label: "Standard",
            options: [
              { value: "all", label: "All Standards" },
              ...standards.map(s => ({ value: s, label: s })),
            ],
            value: selectedStandard,
            onChange: setSelectedStandard,
          },
        ]}
        sortOptions={[
          { label: 'Readiness Score', value: 'readiness' },
          { label: 'Days Until Audit', value: 'days' },
          { label: 'Audit Name', value: 'name' },
          { label: 'Critical Gaps', value: 'gaps' },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedAudits.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No Audits Found"
              description="No upcoming audits match your current filters"
            />
          ) : (
            filteredAndSortedAudits.map((audit) => (
              <ListPaneItem
                key={audit.id}
                title={audit.name}
                description={`${audit.standard} • ${audit.assignedCoordinator}`}
                status={audit.preparationStatus === 'ready' ? 'online' : (audit.preparationStatus === 'overdue' ? 'offline' : 'maintenance')}
                category={audit.type.toUpperCase()}
                value={`${audit.overallReadiness}%`}
                isSelected={selectedAuditId === audit.id}
                onClick={() => setSelectedAuditId(audit.id)}
              />
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedAudit ? selectedAudit.name : "Audit Overview"}
        subtitle={selectedAudit ? `${selectedAudit.standard} • ${selectedAudit.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Audit` : `${currentTenant.name} • Audit Readiness & Preparation Status`}
        tabs={tabs}
      >
        {!selectedAudit && (
          <IdentityOverview
            title="Audit Readiness & Preparation"
            description="Monitor preparation status for upcoming regulatory and certification audits. Track requirements, evidence collection, and gap remediation."
            metrics={[
              {
                title: "Total Audits",
                value: stats.total,
                icon: ClipboardList,
                variant: 'default'
              },
              {
                title: "Avg Readiness",
                value: `${stats.avgReadiness}%`,
                icon: Target,
                variant: stats.avgReadiness >= 90 ? 'success' : stats.avgReadiness >= 70 ? 'warning' : 'destructive'
              },
              {
                title: "Ready",
                value: stats.ready,
                icon: CheckCircle2,
                variant: 'success'
              },
              {
                title: "Overdue",
                value: stats.overdue,
                icon: AlertTriangle,
                variant: 'destructive'
              }
            ]}
          >
            <AuditOverviewDashboard
              statusData={[
                { name: 'Ready', value: stats.ready, color: 'hsl(var(--success))' },
                { name: 'In Progress', value: stats.inProgress, color: 'hsl(var(--warning))' },
                { name: 'Overdue', value: stats.overdue, color: 'hsl(var(--destructive))' },
              ].filter(d => d.value > 0)}
              readinessData={allAudits
                .sort((a, b) => b.overallReadiness - a.overallReadiness)
                .slice(0, 5)
                .map(a => ({ name: a.name, value: a.overallReadiness }))
              }
              upcomingAudits={allAudits.slice(0, 3)}
              onAuditSelect={(id) => setSelectedAuditId(id)}
            />
          </IdentityOverview>
        )}
      </WorkPane>
    </>
  );
}

function AuditOverview({ audit }: { audit: AuditReadiness }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Audit Information */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          Audit Information
        </h4>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm">{audit.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Audit Type</p>
              <Badge variant="outline">
                {audit.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Standard</p>
              <p className="text-sm font-medium">{audit.standard}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Scheduled Date</p>
              <p className="text-sm">{formatDate(audit.scheduledDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Days Until Audit</p>
              <p className={`text-sm font-medium ${audit.daysUntilAudit <= 30 ? "text-destructive" :
                audit.daysUntilAudit <= 60 ? "text-warning" : "text-success"
                }`}>
                {audit.daysUntilAudit > 0 ? `${audit.daysUntilAudit} days` : 'Overdue'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preparation Status */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Preparation Status
        </h4>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Readiness</span>
                <span className="text-lg font-bold">{audit.overallReadiness}%</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${audit.overallReadiness >= 90
                    ? "bg-success"
                    : audit.overallReadiness >= 70
                      ? "bg-warning"
                      : "bg-destructive"
                    }`}
                  style={{ width: `${audit.overallReadiness}%` }}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <Badge
                variant={
                  audit.preparationStatus === "ready"
                    ? "default"
                    : audit.preparationStatus === "in-progress"
                      ? "secondary"
                      : audit.preparationStatus === "overdue"
                        ? "destructive"
                        : "outline"
                }
              >
                {audit.preparationStatus.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Assigned Coordinator</p>
              <p className="text-sm">{audit.assignedCoordinator}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Scope */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          Audit Scope
        </h4>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Site Types ({audit.scope.siteTypes.length})</p>
            <div className="flex flex-wrap gap-2">
              {audit.scope.siteTypes.map((siteType, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {siteType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Asset Types ({audit.scope.assetTypes.length})</p>
            <div className="flex flex-wrap gap-2">
              {audit.scope.assetTypes.map((assetType, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {assetType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Security Zones ({audit.scope.zones.length})</p>
            <div className="flex flex-wrap gap-2">
              {audit.scope.zones.map((zone, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {zone.replace(/\b\w/g, l => l.toUpperCase())} Zone
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Departments ({audit.scope.departments.length})</p>
            <div className="flex flex-wrap gap-2">
              {audit.scope.departments.map((dept, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {dept}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Critical Gaps */}
      {audit.criticalGaps.length > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6">
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            Critical Gaps Requiring Immediate Attention ({audit.criticalGaps.length})
          </h4>
          <div className="space-y-3">
            {audit.criticalGaps.map((gap, index) => (
              <div key={index} className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                <p className="text-sm flex-1 text-destructive">{gap}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AuditRequirements({ audit }: { audit: AuditReadiness }) {
  const [requirements, setRequirements] = useState<AuditRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Load requirements from Supabase
  useEffect(() => {
    async function loadRequirements() {
      try {
        setLoading(true);
        setError(null);
        const reqs = await getAuditRequirements(audit.tenantId, audit.id);
        setRequirements(reqs);
      } catch (err) {
        console.error('Failed to load audit requirements:', err);
        setError(err instanceof Error ? err.message : 'Failed to load requirements');
        setRequirements([]);
      } finally {
        setLoading(false);
      }
    }

    loadRequirements();
  }, [audit.tenantId, audit.id]);

  const categories = [...new Set(requirements.map(r => r.category))];
  const statuses = [...new Set(requirements.map(r => r.status))];

  const filteredRequirements = requirements.filter(req => {
    const matchesCategory = selectedCategory === "all" || req.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || req.status === selectedStatus;
    return matchesCategory && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete": return CheckCircle2;
      case "in-progress": return Clock;
      case "gap-identified": return AlertTriangle;
      case "not-started": return AlertCircle;
      default: return FileText;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "documentation": return FileText;
      case "technical-control": return Settings;
      case "process": return Package;
      case "training": return Users;
      case "evidence": return Eye;
      default: return FileText;
    }
  };

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="p-6 text-center">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading requirements...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-6 text-center">
          <AlertTriangle className="w-6 h-6 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Requirements Summary */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Requirements Summary
            </h4>
            <div className="grid grid-cols-4 gap-4">
              {statuses.map(status => {
                const count = requirements.filter(r => r.status === status).length;
                const StatusIcon = getStatusIcon(status);
                return (
                  <div key={status} className="text-center">
                    <div className="w-12 h-12 rounded-lg bg-secondary/50 flex items-center justify-center mx-auto mb-2">
                      <StatusIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">
                      {status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Requirements List */}
          <div className="space-y-3">
            {filteredRequirements.length === 0 ? (
              <div className="p-6 text-center">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {requirements.length === 0
                    ? "No requirements found for this audit standard."
                    : "No requirements match the selected filters."
                  }
                </p>
              </div>
            ) : (
              filteredRequirements.map((requirement) => {
                const StatusIcon = getStatusIcon(requirement.status);
                const CategoryIcon = getCategoryIcon(requirement.category);

                return (
                  <div key={requirement.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${requirement.status === "complete"
                          ? "bg-success/10"
                          : requirement.status === "in-progress"
                            ? "bg-warning/10"
                            : requirement.status === "gap-identified"
                              ? "bg-destructive/10"
                              : "bg-secondary"
                          }`}
                      >
                        <StatusIcon
                          className={`w-5 h-5 ${requirement.status === "complete"
                            ? "text-success"
                            : requirement.status === "in-progress"
                              ? "text-warning"
                              : requirement.status === "gap-identified"
                                ? "text-destructive"
                                : "text-muted-foreground"
                            }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-muted-foreground">
                                {requirement.code}
                              </span>
                              <Badge variant="outline" className="text-[10px] px-1 py-0 uppercase">
                                {requirement.category.replace(/-/g, ' ')}
                              </Badge>
                              {requirement.priority === "critical" && (
                                <Badge variant="destructive" className="text-[10px] px-1 py-0 flex items-center gap-1">
                                  <Zap className="w-2.5 h-2.5" />
                                  CRITICAL WEIGHT
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-bold text-foreground mb-1">{requirement.title}</p>
                          </div>
                          <Badge
                            variant={requirement.status === "complete" ? "default" : requirement.status === "in-progress" ? "secondary" : requirement.status === "gap-identified" ? "destructive" : "outline"}
                            className="text-[10px] px-2 py-0.5 font-bold uppercase"
                          >
                            {requirement.status.replace(/-/g, ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-4">{requirement.description}</p>

                        <div className="grid grid-cols-1 gap-2 mb-4">
                          <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/10 border border-border/40">
                            <div className="flex items-center gap-2">
                              <Target className="w-3.5 h-3.5 text-primary" />
                              <span className="text-[10px] font-black uppercase text-muted-foreground">Compliance Weighting</span>
                            </div>
                            <Badge variant={requirement.priority === 'critical' ? 'destructive' : 'outline'} className="h-4 text-[8px] font-black uppercase">
                              {requirement.priority === 'critical' ? 'High Impact' : 'Standard'}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/10 border border-border/40">
                            <div className="flex items-center gap-2">
                              <ClipboardList className="w-3.5 h-3.5 text-primary" />
                              <span className="text-[10px] font-black uppercase text-muted-foreground">Verification Status</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${requirement.status === 'complete' ? 'bg-success' : 'bg-warning'}`} />
                              <span className="text-[10px] font-bold uppercase tracking-tighter">
                                {requirement.status === 'complete' ? 'Verified Artifact' : 'Pending Review'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {requirement.gaps.length > 0 && (
                          <div className="mt-3 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                            <p className="text-xs font-medium text-destructive mb-2">Identified Gaps:</p>
                            <ul className="space-y-1">
                              {requirement.gaps.map((gap, index) => (
                                <li key={index} className="text-xs text-destructive flex items-start gap-2">
                                  <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                  {gap}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

function AuditEvidence({ audit }: { audit: AuditReadiness }) {
  const [requirements, setRequirements] = useState<AuditRequirement[]>([]);
  const [allEvidence, setAllEvidence] = useState<(AuditEvidence & { requirementCode: string; requirementTitle: string; category: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Load requirements and evidence from Supabase
  useEffect(() => {
    async function loadEvidenceData() {
      try {
        setLoading(true);
        setError(null);

        // First load requirements
        const reqs = await getAuditRequirements(audit.tenantId, audit.id);
        setRequirements(reqs);

        // Then load evidence for each requirement
        const evidencePromises = reqs.map(async (req) => {
          const evidence = await getAuditEvidence(audit.tenantId, req.id);
          return evidence.map(ev => ({
            ...ev,
            requirementCode: req.code,
            requirementTitle: req.title,
            category: req.category
          }));
        });

        const evidenceArrays = await Promise.all(evidencePromises);
        const flatEvidence = evidenceArrays.flat();
        setAllEvidence(flatEvidence);
      } catch (err) {
        console.error('Failed to load audit evidence:', err);
        setError(err instanceof Error ? err.message : 'Failed to load evidence');
        setAllEvidence([]);
      } finally {
        setLoading(false);
      }
    }

    loadEvidenceData();
  }, [audit.tenantId, audit.id]);

  const types = [...new Set(allEvidence.map(e => e.type))];
  const statuses = [...new Set(allEvidence.map(e => e.status))];

  const filteredEvidence = allEvidence.filter(evidence => {
    const matchesType = selectedType === "all" || evidence.type === selectedType;
    const matchesStatus = selectedStatus === "all" || evidence.status === selectedStatus;
    return matchesType && matchesStatus;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "document": return FileText;
      case "screenshot": return Eye;
      case "log-export": return Package;
      case "configuration": return Settings;
      case "certificate": return Shield;
      case "report": return ClipboardList;
      default: return FileText;
    }
  };

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="p-6 text-center">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading evidence...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-6 text-center">
          <AlertTriangle className="w-6 h-6 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Evidence Summary */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Evidence Summary
            </h4>
            <div className="grid grid-cols-4 gap-4">
              {statuses.map(status => {
                const count = allEvidence.filter(e => e.status === status).length;
                return (
                  <div key={status} className="text-center">
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">
                      {status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-3">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Evidence List */}
          <div className="space-y-3">
            {filteredEvidence.length === 0 ? (
              <div className="p-6 text-center">
                <Eye className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {allEvidence.length === 0
                    ? "No evidence items found for this audit."
                    : "No evidence matches the selected filters."
                  }
                </p>
              </div>
            ) : (
              filteredEvidence.map((item) => {
                const TypeIcon = getTypeIcon(item.type);

                return (
                  <div key={item.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${item.status === "available" ? "bg-success/10 text-success" : item.status === "under-review" ? "bg-warning/10 text-warning" : item.status === "outdated" ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"}`}>
                        <TypeIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-[10px] px-1 py-0 uppercase tracking-tighter font-black">
                                {item.type}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground font-mono">{item.size || 'N/A'}</span>
                            </div>
                            <p className="text-sm font-bold text-foreground">{item.name}</p>
                          </div>
                          <Badge
                            variant={item.status === "available" ? "default" : item.status === "under-review" ? "secondary" : item.status === "outdated" ? "destructive" : "outline"}
                            className="text-[10px] px-2 py-0.5 font-black uppercase"
                          >
                            {item.status.replace(/-/g, ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4 italic line-clamp-1">{item.description}</p>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Evidence Strength</span>
                              <span className="text-[10px] font-mono font-bold text-success">
                                {item.status === "available" ? "92%" : item.status === "under-review" ? "45%" : "0%"}
                              </span>
                            </div>
                            <div className="h-1 bg-secondary rounded-full overflow-hidden">
                              <div className={`h-full ${item.status === "available" ? "bg-success w-[92%]" : item.status === "under-review" ? "bg-warning w-[45%]" : "bg-destructive w-0"}`} />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Audit Pulse</span>
                              <span className={`text-[10px] font-mono font-bold ${item.status === "available" ? "text-success" : "text-warning"}`}>
                                {item.status === "available" ? "FRESH" : "STALE"}
                              </span>
                            </div>
                            <div className="h-1 bg-secondary rounded-full overflow-hidden">
                              <div className={`h-full ${item.status === "available" ? "bg-success w-full" : "bg-warning w-full animate-pulse"}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div >
        </>
      )}
    </div >
  );
}

function AuditGaps({ audit }: { audit: AuditReadiness }) {
  const [requirements, setRequirements] = useState<AuditRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load requirements from Supabase
  useEffect(() => {
    async function loadRequirements() {
      try {
        setLoading(true);
        setError(null);
        const reqs = await getAuditRequirements(audit.tenantId, audit.id);
        setRequirements(reqs);
      } catch (err) {
        console.error('Failed to load audit requirements:', err);
        setError(err instanceof Error ? err.message : 'Failed to load requirements');
        setRequirements([]);
      } finally {
        setLoading(false);
      }
    }

    loadRequirements();
  }, [audit.tenantId, audit.id]);

  const requirementsWithGaps = requirements.filter(req => req.gaps.length > 0);

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="p-6 text-center">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading gaps analysis...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-6 text-center">
          <AlertTriangle className="w-6 h-6 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Critical Gaps Summary */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6">
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Critical Gaps Summary ({audit.criticalGaps.length})
            </h4>
            {audit.criticalGaps.length > 0 ? (
              <div className="space-y-3">
                {audit.criticalGaps.map((gap, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                    <p className="text-sm flex-1 text-destructive">{gap}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No critical gaps identified.</p>
            )}
          </div>

          {/* Requirements with Gaps */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Requirements with Gaps ({requirementsWithGaps.length})
            </h4>
            {requirementsWithGaps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requirement gaps identified.</p>
            ) : (
              <div className="space-y-4">
                {requirementsWithGaps.map((requirement) => (
                  <div key={requirement.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">
                            {requirement.code}
                          </span>
                          <Badge
                            variant={
                              requirement.priority === "critical"
                                ? "destructive"
                                : requirement.priority === "high"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-[10px] px-1 py-0"
                          >
                            {requirement.priority}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{requirement.title}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                        {requirement.gaps.length} gaps
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {requirement.gaps.map((gap, index) => (
                        <div key={index} className="flex items-start gap-3 p-2 bg-warning/5 border border-warning/20 rounded">
                          <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                          <p className="text-sm flex-1">{gap}</p>
                        </div>
                      ))}
                    </div>

                    {requirement.assignedTo && (
                      <div className="mt-3 text-xs">
                        <span className="text-muted-foreground">Assigned to:</span>
                        <span className="ml-2 font-medium">{requirement.assignedTo}</span>
                        {requirement.dueDate && (
                          <>
                            <span className="text-muted-foreground ml-4">Due:</span>
                            <span className="ml-2 font-medium">
                              {new Date(requirement.dueDate).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommended Actions */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Recommended Actions
            </h4>
            <div className="space-y-3">
              {getRecommendedActions(audit).map((action, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                  <p className="text-sm flex-1">{action}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Helper function for generating recommended actions
function getRecommendedActions(audit: AuditReadiness): string[] {
  const actions = [];

  if (audit.overallReadiness < 70) {
    actions.push("Prioritize completion of critical requirements to improve overall readiness score");
  }

  if (audit.criticalGaps.length > 0) {
    actions.push("Address all critical gaps immediately as they may prevent audit success");
  }

  if (audit.daysUntilAudit <= 30) {
    actions.push("Conduct final readiness review and prepare audit presentation materials");
  }

  // Transmission-specific recommendations
  if (audit.scope.siteTypes.includes("substation")) {
    actions.push("Ensure substation security controls are documented and tested");
  }

  if (audit.scope.siteTypes.includes("grid-station")) {
    actions.push("Verify grid station protection relay configurations and access controls");
  }

  if (audit.scope.assetTypes.includes("protection-relay")) {
    actions.push("Review protection relay security settings and communication protocols");
  }

  if (audit.scope.assetTypes.includes("scada-node")) {
    actions.push("Validate SCADA system security hardening and network segmentation");
  }

  if (audit.type === "regulatory") {
    actions.push("Ensure all regulatory-specific documentation is current and accessible for transmission operations");
  }

  if (audit.standard.includes("IEC 62443")) {
    actions.push("Verify IEC 62443 zone and conduit model implementation for transmission networks");
  }

  if (audit.standard.includes("NERC CIP")) {
    actions.push("Ensure NERC CIP compliance for bulk electric system cyber assets");
  }

  return actions.length > 0 ? actions : ["Continue monitoring progress and maintain current preparation activities"];
}

interface OverviewChartData {
  name: string;
  value: number;
  color?: string;
}

function AuditOverviewDashboard({
  statusData,
  readinessData,
  upcomingAudits,
  onAuditSelect
}: {
  statusData: OverviewChartData[];
  readinessData: OverviewChartData[];
  upcomingAudits: AuditReadiness[];
  onAuditSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-primary" />
            Audit Preparation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
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
                <RechartsTooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChartIcon className="w-4 h-4 text-primary" />
            Audit Readiness by Standard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={readinessData} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={150}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  cursor={{ fill: 'hsl(var(--muted)/0.1)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {readinessData.map((_entry, index) => (
                    <RechartsCell key={`cell-${index}`} fill={`hsl(var(--primary) / ${1 - index * 0.15})`} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          Audit Preparation Lifecycle
        </h4>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <FileSearch className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Self-Assessment</p>
              <p className="text-xs text-muted-foreground">Internal review of controls and evidence against standard requirements.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Eye className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Evidence Collection</p>
              <p className="text-xs text-muted-foreground">Gathering and linking supporting documentation to specific audit points.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <ExternalLink className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">External Audit</p>
              <p className="text-xs text-muted-foreground">Coordination with regulatory bodies and certification auditors.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          Upcoming Audits
        </h4>
        <div className="space-y-4">
          {upcomingAudits.map(audit => (
            <div
              key={audit.id}
              className="group flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onAuditSelect(audit.id)}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${audit.preparationStatus === 'ready' ? 'bg-success' : audit.preparationStatus === 'overdue' ? 'bg-destructive' : 'bg-warning'}`} />
                <span className="text-sm font-medium truncate max-w-[150px]">{audit.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(audit.scheduledDate).toLocaleDateString()}</span>
            </div>
          ))}
          <div className="pt-2 border-t border-border mt-2">
            <p className="text-xs text-muted-foreground italic">Select an audit from the list to view detailed requirements, evidence, and identified gaps.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
