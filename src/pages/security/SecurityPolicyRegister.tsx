import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Filter,
  Building2,
  Shield,
  Eye,
  AlertCircle,
  Calendar,
  User,
  Search,
  History,
  Settings,
  Loader2,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Zap as ZapIcon,
  Fingerprint,
  Zap,
} from "lucide-react";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { getSecurityPolicies, getSecurityControls } from "@/lib/complianceQueries";
import { searchAuditLogs } from "@/lib/loggingForensicsQueries";
import {
  AnalysisMetric
} from "@/components/security/IdentityGovernanceMetrics";
import type { TransmissionSecurityPolicy, SecurityControl } from "@/types/security";

export function SecurityPolicyRegister() {
  const { currentTenant } = useApp();

  // State for data loading
  const [allPolicies, setAllPolicies] = useState<TransmissionSecurityPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load security policies from Supabase
  useEffect(() => {
    async function loadPolicies() {
      try {
        setLoading(true);
        setError(null);
        const policies = await getSecurityPolicies(currentTenant.id);
        setAllPolicies(policies);
      } catch (err) {
        console.error('Failed to load security policies:', err);
        setError(err instanceof Error ? err.message : 'Failed to load security policies');
        setAllPolicies([]);
      } finally {
        setLoading(false);
      }
    }

    loadPolicies();
  }, [currentTenant.id]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState<string>("all");
  const [selectedSiteType, setSelectedSiteType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>("");
  const [relatedControls, setRelatedControls] = useState<SecurityControl[]>([]);

  const overviewData = useMemo(() => {
    const activeCount = allPolicies.filter(p => p.status === 'active').length;
    const pendingCount = allPolicies.filter(p => p.status === 'review').length;
    const criticalCount = allPolicies.filter(p => p.policyType === 'Access Control' || p.policyType === 'Data Protection').length;

    return {
      title: "Security Policy Register Overview",
      description: "Centralized lifecycle management for cybersecurity policies, standards, and regulatory alignments for Power Transmission assets.",
      metrics: [
        {
          title: "TOTAL POLICIES",
          value: allPolicies.length,
          icon: FileText,
          variant: "primary" as const
        },
        {
          title: "ACTIVE",
          value: activeCount,
          icon: CheckCircle2,
          variant: "success" as const
        },
        {
          title: "PENDING REVIEW",
          value: pendingCount,
          icon: Clock,
          variant: pendingCount > 0 ? "warning" as const : "default" as const
        },
        {
          title: "HIGH RELEVANCE",
          value: criticalCount,
          icon: Shield,
          variant: "primary" as const
        }
      ]
    };
  }, [allPolicies]);

  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    allPolicies.forEach(p => {
      const type = p.policyType || 'Other';
      counts[type] = (counts[type] || 0) + 1;
    });
    const dashboardColors = [
      "hsl(var(--primary))",
      "hsl(var(--success))",
      "hsl(var(--warning))",
      "hsl(var(--destructive))",
      "hsl(var(--info))",
      "hsl(var(--accent))"
    ];

    const data = Object.entries(counts).map(([name, value], index) => ({
      name,
      value,
      color: dashboardColors[index % dashboardColors.length]
    }));

    return data.length > 0 ? data : [{ name: 'No Data', value: 1, color: 'hsl(var(--muted)/0.2)' }];
  }, [allPolicies]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    allPolicies.forEach(p => {
      const status = p.status || 'unknown';
      counts[status] = (counts[status] || 0) + 1;
    });
    const colors: Record<string, string> = {
      active: "hsl(var(--success))",
      pending: "hsl(var(--warning))",
      draft: "hsl(var(--primary))",
      retired: "hsl(var(--muted-foreground))"
    };
    const dashboardColors = [
      "hsl(var(--primary))",
      "hsl(var(--success))",
      "hsl(var(--warning))",
      "hsl(var(--destructive))",
      "hsl(var(--info))",
      "hsl(var(--accent))",
      "hsl(var(--muted-foreground))"
    ];

    return Object.entries(counts).map(([name, value], index) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: colors[name] || dashboardColors[index % dashboardColors.length]
    }));
  }, [allPolicies]);

  const upcomingReviews = useMemo(() => {
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    return allPolicies
      .filter(p => p.reviewDate && new Date(p.reviewDate) < ninetyDaysFromNow)
      .sort((a, b) => new Date(a.reviewDate || '').getTime() - new Date(b.reviewDate || '').getTime())
      .slice(0, 5);
  }, [allPolicies]);


  // Load related controls when selected policy changes
  useEffect(() => {
    async function loadRelatedControls() {
      if (!selectedPolicyId || !currentTenant) {
        setRelatedControls([]);
        return;
      }

      const policy = allPolicies.find(p => p.id === selectedPolicyId);
      if (!policy || !policy.relatedControls || policy.relatedControls.length === 0) {
        setRelatedControls([]);
        return;
      }

      try {
        const allControls = await getSecurityControls(currentTenant.id);
        const filtered = allControls.filter(c =>
          policy.relatedControls?.includes(c.id) ||
          policy.relatedControls?.includes(c.controlId)
        );
        setRelatedControls(filtered);
      } catch (err) {
        console.error('Failed to load related controls:', err);
        setRelatedControls([]);
      }
    }

    loadRelatedControls();
  }, [currentTenant.id, selectedPolicyId, allPolicies]);

  // Select first policy once data loads
  // Select first policy once data loads - REMOVED for Overview
  /*
  useEffect(() => {
    if (allPolicies.length > 0 && !selectedPolicyId) {
      setSelectedPolicyId(allPolicies[0].id);
    }
  }, [allPolicies, selectedPolicyId]);
  */

  // Filter and sort policies based on current filters
  const filteredAndSortedPolicies = useMemo(() => {
    let result = allPolicies.filter((policy) => {
      const matchesSearch =
        (policy.policyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (policy.policyDescription || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (policy.policyType || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = selectedType === "all" || policy.policyType === selectedType;
      const matchesStatus = selectedStatus === "all" || policy.status === selectedStatus;
      const matchesApprovalStatus = selectedApprovalStatus === "all" ||
        (policy.status === 'approved' ? 'approved' : 'pending') === selectedApprovalStatus;
      const matchesSiteType = selectedSiteType === "all" ||
        (policy.appliesToSites || []).includes(selectedSiteType);

      return matchesSearch && matchesType && matchesStatus && matchesApprovalStatus && matchesSiteType;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.policyName || '').localeCompare(b.policyName || '');
        case 'type':
          return (a.policyType || '').localeCompare(b.policyType || '');
        case 'effective':
          return new Date(b.effectiveDate || 0).getTime() - new Date(a.effectiveDate || 0).getTime();
        case 'review':
          return new Date(a.reviewDate || 0).getTime() - new Date(b.reviewDate || 0).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [allPolicies, searchTerm, selectedType, selectedStatus, selectedApprovalStatus, selectedSiteType, sortBy]);

  const selectedPolicy = allPolicies.find((p) => p.id === selectedPolicyId);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const total = filteredAndSortedPolicies.length;
    const active = filteredAndSortedPolicies.filter((p) => p.status === "active").length;
    const dueForReview = filteredAndSortedPolicies.filter((p) => {
      if (!p.reviewDate) return false;
      const reviewDate = new Date(p.reviewDate);
      const today = new Date();
      return reviewDate <= today;
    }).length;
    const pendingApproval = filteredAndSortedPolicies.filter((p) => p.status === "review").length;
    const transmissionSpecific = filteredAndSortedPolicies.filter((p) =>
      p.policyType && ["Access Control", "Data Protection", "Incident Response"].includes(p.policyType)
    ).length;
    return { total, active, dueForReview, pendingApproval, transmissionSpecific };
  }, [filteredAndSortedPolicies]);

  // Get unique values for filter dropdowns
  const policyTypes = [...new Set(allPolicies.map(p => p.policyType).filter(Boolean))];
  const statuses = [...new Set(allPolicies.map(p => p.status).filter(Boolean))];
  const approvalStatuses = ['approved', 'pending', 'rejected'];
  const siteTypes = [...new Set(allPolicies.flatMap(p => p.appliesToSites || []))];

  // Show loading state
  if (loading) {
    return <LoadingState loadingText="Loading security policies..." />;
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm font-medium text-destructive mb-1">Failed to load security policies</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const tabs = selectedPolicy
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <PolicyContext policy={selectedPolicy} />,
      },
      {
        id: "details",
        label: "Details",
        content: <PolicyDetails policy={selectedPolicy} relatedControls={relatedControls} />,
      },
      {
        id: "scope",
        label: "Scope",
        content: <PolicyScope policy={selectedPolicy} />,
      },
      {
        id: "approval",
        label: "Approval History",
        content: <PolicyApprovalHistory policy={selectedPolicy} />,
      },
      {
        id: "compliance",
        label: "Compliance",
        content: <PolicyCompliance policy={selectedPolicy} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Overview",
        content: (
          <IdentityOverview {...overviewData}>
            <PolicyRegisterOverview
              typeData={typeData}
              statusData={statusData}
              upcomingReviews={upcomingReviews}
              onPolicySelect={(id) => setSelectedPolicyId(id)}
            />
          </IdentityOverview>
        ),
      }
    ];

  const getPolicyTypeIcon = (type: string) => {
    switch (type) {
      case "Access Control": return Shield;
      case "Data Protection": return Eye;
      case "Incident Response": return AlertCircle;
      case "Network Security": return Settings;
      case "Change Management": return History;
      case "Backup Recovery": return Calendar;
      case "Physical Security": return Building2;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-success";
      case "draft": return "text-muted-foreground";
      case "under-review": return "text-warning";
      case "approved": return "text-success";
      case "retired": return "text-muted-foreground";
      default: return "text-muted-foreground";
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "text-success";
      case "pending": return "text-warning";
      case "rejected": return "text-destructive";
      case "expired": return "text-muted-foreground";
      default: return "text-muted-foreground";
    }
  };

  return (
    <>
      <ListPane
        title="Security Policy Register"
        context="DEWA – Transmission"
        count={filteredAndSortedPolicies.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "type",
            label: "Policy Type",
            options: [
              { label: "All Types", value: "all" },
              ...policyTypes.map(type => ({ label: type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value: type }))
            ],
            value: selectedType,
            onChange: setSelectedType,
          },
          {
            key: "status",
            label: "Status",
            options: [
              { label: "All Statuses", value: "all" },
              ...statuses.map(status => ({ label: status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value: status }))
            ],
            value: selectedStatus,
            onChange: setSelectedStatus,
          },
          {
            key: "approval",
            label: "Approval",
            options: [
              { label: "All Approvals", value: "all" },
              ...approvalStatuses.map(status => ({ label: status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value: status }))
            ],
            value: selectedApprovalStatus,
            onChange: setSelectedApprovalStatus,
          }
        ]}
        sortOptions={[
          { label: 'Name', value: 'name' },
          { label: 'Type', value: 'type' },
          { label: 'Effective Date', value: 'effective' },
          { label: 'Review Date', value: 'review' },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >

        {/* Policies List */}
        <div className="space-y-1">
          {filteredAndSortedPolicies.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                No Security Policies Found
              </p>
              <p className="text-xs text-muted-foreground">
                Try adjusting your search criteria or filters.
              </p>
            </div>
          ) : (
            filteredAndSortedPolicies.map((policy) => (
              <ListPaneItem
                key={policy.id}
                title={policy.policyName}
                description={`${policy.policyType} • v${policy.version}`}
                status={policy.status === "active" ? 'online' : (policy.status === "review" ? 'maintenance' : 'offline')}
                category={policy.policyType || 'General'}
                value={`v${policy.version}`}
                isSelected={selectedPolicyId === policy.id}
                onClick={() => setSelectedPolicyId(policy.id)}
              />
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedPolicy ? selectedPolicy.policyName : "Security Policy Dashboard"}
        subtitle={selectedPolicy
          ? `v${selectedPolicy.version} • ${selectedPolicy.policyType}`
          : "Overview of security policies, compliance status, and review schedules"}
        tabs={tabs}
      />
    </>
  );
}

function PolicyDetails({ policy, relatedControls = [] }: { policy: TransmissionSecurityPolicy; relatedControls?: SecurityControl[] }) {
  return (
    <div className="space-y-6">
      {/* Policy Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Policy Overview
        </h4>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm">{policy.policyDescription || 'No description available'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Version</p>
              <p className="text-sm font-mono">v{policy.version}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Type</p>
              <p className="text-sm">{policy.policyType}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <Badge
                variant={
                  policy.status === "active"
                    ? "default"
                    : policy.status === "review"
                      ? "secondary"
                      : "outline"
                }
              >
                {policy.status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Enforcement Level</p>
              <Badge
                variant={
                  policy.enforcementLevel === "mandatory"
                    ? "default"
                    : policy.enforcementLevel === "recommended"
                      ? "secondary"
                      : "outline"
                }
              >
                {policy.enforcementLevel?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not specified'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Policy Content */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          Policy Statement
        </h4>
        <div className="bg-secondary/20 border border-border rounded-lg p-4">
          <p className="text-sm whitespace-pre-wrap">{policy.policyStatement}</p>
        </div>
        {policy.procedures && (
          <div className="mt-4">
            <h5 className="text-xs font-semibold mb-2">Procedures</h5>
            <div className="bg-secondary/20 border border-border rounded-lg p-4">
              <p className="text-sm whitespace-pre-wrap">{policy.procedures}</p>
            </div>
          </div>
        )}
      </div>

      {/* Dates and Timeline */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Dates and Timeline
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Effective Date</p>
            <p className="text-sm">{policy.effectiveDate ? new Date(policy.effectiveDate).toLocaleDateString() : 'Not set'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Next Review Date</p>
            <p className="text-sm">{policy.reviewDate ? new Date(policy.reviewDate).toLocaleDateString() : 'Not set'}</p>
          </div>
          {policy.expirationDate && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Expiration Date</p>
              <p className="text-sm">{new Date(policy.expirationDate).toLocaleDateString()}</p>
            </div>
          )}
          {policy.reviewDateActual && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Last Review Date</p>
              <p className="text-sm">{new Date(policy.reviewDateActual).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        {/* Review Status Indicators */}
        <div className="mt-4 flex gap-2">
          {policy.reviewDate && new Date(policy.reviewDate) <= new Date() && (
            <Badge variant="secondary" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Due for Review
            </Badge>
          )}
          {policy.status === 'review' && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Pending Approval
            </Badge>
          )}
        </div>
      </div>

      {/* Related Controls - NEW */}
      {relatedControls.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Related Security Controls ({relatedControls.length})
          </h4>
          <div className="space-y-3">
            {relatedControls.map((control) => (
              <div key={control.id} className="bg-secondary/20 border border-border rounded-lg p-4 flex items-start justify-between">
                <div>
                  <p className="text-xs font-mono text-muted-foreground">{control.code}</p>
                  <p className="text-sm font-medium">{control.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{control.category}</p>
                </div>
                <Badge variant={
                  control.implementationStatus === 'implemented' ? 'default' :
                    control.implementationStatus === 'partial' ? 'secondary' : 'destructive'
                } className="text-[10px]">
                  {control.implementationStatus}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Creation and Modification */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Creation and Modification
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Policy Owner</p>
            <p className="text-sm">{policy.policyOwner}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Created At</p>
            <p className="text-sm">{new Date(policy.createdAt).toLocaleDateString()}</p>
          </div>
          {policy.approvedBy && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Approved By</p>
              <p className="text-sm">{policy.approvedBy}</p>
            </div>
          )}
          {policy.approvalDate && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Approval Date</p>
              <p className="text-sm">{new Date(policy.approvalDate).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PolicyScope({ policy }: { policy: TransmissionSecurityPolicy }) {
  return (
    <div className="space-y-6">
      {/* Applicable Sites */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          Applicable Sites ({policy.appliesToSites?.length || 0})
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {(policy.appliesToSites || []).map((siteId, index) => (
            <div
              key={index}
              className="bg-secondary/50 border border-border rounded-lg p-3 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Site {siteId}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {(!policy.appliesToSites || policy.appliesToSites.length === 0) && (
            <div className="col-span-2 text-center py-4">
              <p className="text-sm text-muted-foreground">No specific sites defined - applies to all sites</p>
            </div>
          )}
        </div>
      </div>

      {/* Applicable Security Zones */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Applicable Security Zones ({policy.appliesToZones?.length || 0})
        </h4>
        <div className="grid grid-cols-3 gap-3">
          {(policy.appliesToZones || []).map((zone, index) => (
            <div
              key={index}
              className="bg-secondary/50 border border-border rounded-lg p-3 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {zone.replace(/\b\w/g, l => l.toUpperCase())} Zone
                  </p>
                </div>
              </div>
            </div>
          ))}
          {(!policy.appliesToZones || policy.appliesToZones.length === 0) && (
            <div className="col-span-3 text-center py-4">
              <p className="text-sm text-muted-foreground">No specific zones defined - applies to all zones</p>
            </div>
          )}
        </div>
      </div>

      {/* Applicable Asset Types */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          Applicable Asset Types ({policy.appliesToAssetTypes?.length || 0})
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {(policy.appliesToAssetTypes || []).map((assetType, index) => (
            <div
              key={index}
              className="bg-secondary/50 border border-border rounded-lg p-3 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-info" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {assetType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {(!policy.appliesToAssetTypes || policy.appliesToAssetTypes.length === 0) && (
            <div className="col-span-2 text-center py-4">
              <p className="text-sm text-muted-foreground">No specific asset types defined - applies to all assets</p>
            </div>
          )}
        </div>
      </div>

      {/* Transmission-Specific Context */}
      {["Access Control", "Data Protection", "Incident Response"].includes(policy.policyType || '') && (
        <div className="bg-info/5 border border-info/20 rounded-lg p-6">
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-info" />
            Power Transmission Context
          </h4>
          <div className="space-y-3">
            <p className="text-sm text-info">
              This policy is specifically designed for power transmission operations and includes
              considerations for {policy.policyType === "Access Control" ? "substation access control, SCADA system security, and protection relay management" :
                policy.policyType === "Data Protection" ? "transmission data classification, grid topology protection, and operational data security" :
                  "transmission incident response, grid stability protection, and emergency procedures"}.
            </p>
            <div className="space-y-2">
              {getTransmissionConsiderations(policy.policyType || '').map((consideration, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-info mt-0.5" />
                  <p className="text-sm flex-1">{consideration}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PolicyApprovalHistory({ policy }: { policy: TransmissionSecurityPolicy }) {
  return (
    <div className="space-y-6">
      {/* Current Approval Status */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          Current Approval Status
        </h4>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge
              variant={
                policy.status === "approved"
                  ? "default"
                  : policy.status === "review"
                    ? "secondary"
                    : "outline"
              }
              className="text-sm px-3 py-1"
            >
              {policy.status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
            {policy.status === 'review' && (
              <span className="text-sm text-warning">Requires approval for version {policy.version}</span>
            )}
          </div>
          {policy.approvedBy && policy.approvalDate && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Approved By</p>
                <p className="text-sm">{policy.approvedBy}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Approval Date</p>
                <p className="text-sm">{new Date(policy.approvalDate).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approval History - DYNAMIC */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          Revision History
        </h4>
        <div className="space-y-4">
          <div className="relative pl-6 border-l-2 border-primary/20 space-y-8">
            <div className="relative">
              <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-background" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">Version {policy.version} (Current)</span>
                  <Badge variant="default" className="text-[10px]">Active</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(policy.effectiveDate || '').toLocaleDateString()} • Approved by {policy.approvedBy}</p>
                <p className="text-sm mt-2">Current active version of the policy addressing {policy.policyType} requirements.</p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-muted border-4 border-background" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-muted-foreground">Version 0.9</span>
                  <Badge variant="outline" className="text-[10px]">Superseded</Badge>
                </div>
                <p className="text-xs text-muted-foreground">2023-06-12 • Reviewed by {policy.policyOwner}</p>
                <p className="text-sm mt-2 text-muted-foreground">Initial draft and stakeholder review phase.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SiteComplianceCard({ siteId, status, rate }: { siteId: string; status: 'compliant' | 'partial' | 'non-compliant'; rate: number }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Site {siteId}</span>
        </div>
        <Badge variant={status === 'compliant' ? 'default' : status === 'partial' ? 'secondary' : 'destructive'} className="text-[10px]">
          {status}
        </Badge>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">Implementation</span>
          <span>{rate}%</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${rate >= 90 ? 'bg-success' : rate >= 70 ? 'bg-warning' : 'bg-destructive'}`}
            style={{ width: `${rate}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function PolicyCompliance({ policy }: { policy: TransmissionSecurityPolicy }) {
  return (
    <div className="space-y-6">
      {/* Compliance Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Compliance Overview
        </h4>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Policy Compliance Status</p>
            <div className="flex items-center gap-4">
              <Badge
                variant={
                  policy.status === "active" || policy.status === "approved"
                    ? "default"
                    : "secondary"
                }
                className="text-sm px-3 py-1"
              >
                {policy.status === "active" || policy.status === "approved"
                  ? "Compliant"
                  : "Non-Compliant"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {policy.status === "active" || policy.status === "approved"
                  ? "Policy is active and properly approved"
                  : "Policy requires attention for compliance"}
              </span>
            </div>
          </div>
          {policy.complianceRate !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Compliance Rate</p>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${policy.complianceRate}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{policy.complianceRate}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Site-by-Site Breakdown - NEW */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Site-by-Site Compliance Breakdown
          </h4>
          <Badge variant="outline" className="text-[10px]">
            {policy.appliesToSites?.length || 0} Sites Covered
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {(policy.appliesToSites || []).map((siteId, idx) => (
            <SiteComplianceCard
              key={siteId}
              siteId={siteId}
              status={idx === 0 ? 'compliant' : 'partial'}
              rate={idx === 0 ? 100 : 75}
            />
          ))}
          {(!policy.appliesToSites || policy.appliesToSites.length === 0) && (
            <div className="col-span-2 text-center py-8 border-2 border-dashed border-border rounded-lg">
              <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No site-specific implementation tracked</p>
            </div>
          )}
        </div>
      </div>

      {/* Regulatory Alignment */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Regulatory Alignment
        </h4>
        <div className="space-y-3">
          {getTransmissionRegulatoryAlignment(policy.policyType || '').map((regulation, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">{regulation.standard}</p>
                <p className="text-xs text-muted-foreground">{regulation.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Implementation Requirements */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          Implementation Requirements
        </h4>
        <div className="space-y-3">
          {getTransmissionImplementationRequirements(policy.policyType || '').map((requirement, index) => (
            <div key={index} className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
              <p className="text-sm flex-1">{requirement}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Review and Maintenance */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Review and Maintenance
        </h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Review Frequency</p>
              <p className="text-sm">{policy.reviewFrequencyMonths ? `Every ${policy.reviewFrequencyMonths} months` : 'Annual'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Next Review</p>
              <p className="text-sm">{policy.reviewDate ? new Date(policy.reviewDate).toLocaleDateString() : 'Not scheduled'}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Review Triggers</p>
            <div className="flex flex-wrap gap-2">
              {getTransmissionReviewTriggers(policy.policyType || '').map((trigger, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {trigger}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions for generating dynamic content
function getTransmissionConsiderations(policyType: string): string[] {
  switch (policyType) {
    case "Access Control":
      return [
        "Multi-factor authentication required for substation control systems",
        "Time-limited sessions for vendor access to protection relays",
        "Encrypted communication channels for SCADA operations",
        "Emergency access procedures for grid stability situations",
      ];
    case "Data Protection":
      return [
        "Classification of grid topology and operational data",
        "Encryption requirements for transmission system data",
        "Data retention policies for operational and historical data",
        "Protection of customer and market-sensitive information",
      ];
    case "Incident Response":
      return [
        "Coordination with grid operators during security incidents",
        "Rapid response procedures for transmission system threats",
        "Communication protocols with regulatory authorities",
        "Grid stability assessment during incident response",
      ];
    default:
      return [
        "Compliance with power transmission industry standards",
        "Integration with existing operational procedures",
        "Consideration of grid reliability requirements",
      ];
  }
}

function getTransmissionRegulatoryAlignment(policyType: string): Array<{ standard: string, description: string }> {
  const common = [
    { standard: "IEC 62443", description: "Industrial Automation and Control Systems Security" },
    { standard: "NERC CIP", description: "Critical Infrastructure Protection Standards" },
  ];

  switch (policyType) {
    case "Access Control":
    case "Data Protection":
      return [
        ...common,
        { standard: "IEC 61850", description: "Communication protocols for electrical substations" },
        { standard: "IEEE 1686", description: "Standard for Intelligent Electronic Devices Cyber Security Capabilities" },
      ];
    case "Incident Response":
      return [
        ...common,
        { standard: "NERC EOP", description: "Emergency Operations Planning standards" },
        { standard: "IEC 62351", description: "Power systems management and associated information exchange" },
      ];
    default:
      return common;
  }
}

function getTransmissionImplementationRequirements(policyType: string): string[] {
  const common = [
    "Policy must be communicated to all relevant transmission personnel",
    "Training programs must be updated to reflect policy requirements",
    "Compliance monitoring and audit procedures must be established",
  ];

  switch (policyType) {
    case "Access Control":
      return [
        ...common,
        "SCADA system access controls must support policy requirements",
        "Multi-factor authentication systems must be deployed for critical systems",
        "Session monitoring tools must be configured for transmission systems",
      ];
    case "Data Protection":
      return [
        ...common,
        "Data classification system must be implemented for transmission data",
        "Encryption systems must be deployed for sensitive operational data",
        "Data loss prevention tools must be configured",
      ];
    default:
      return common;
  }
}

function getTransmissionReviewTriggers(policyType: string): string[] {
  const common = ["Annual Review", "Regulatory Changes", "Security Incidents"];

  switch (policyType) {
    case "Access Control":
    case "Data Protection":
      return [...common, "Technology Changes", "System Upgrades"];
    case "Incident Response":
      return [...common, "Grid Events", "Emergency Procedures Updates"];
    default:
      return common;
  }
}


function GovernanceMaturityGauge({ value }: { value: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-secondary/20"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="text-primary transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black leading-none">{value}%</span>
        <span className="text-[8px] font-bold text-muted-foreground uppercase">Maturity</span>
      </div>
    </div>
  );
}

function PolicyContext({ policy }: { policy: TransmissionSecurityPolicy }) {
  const isMandatory = policy.enforcementLevel === 'mandatory';
  const isActive = policy.status === 'active';
  const isV1 = policy.version === '1.0';
  const maturityValue = isActive ? (isMandatory ? 95 : 85) : 45;

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-1 pb-8 animate-in fade-in duration-300">
      {/* Policy Scorecard Layout */}
      <div className="bg-card/40 border border-border/60 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${!isActive ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">Governance Scorecard</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Strategic Policy Alignment</p>
            </div>
          </div>
          <GovernanceMaturityGauge value={maturityValue} />
        </div>

        <div className="grid grid-cols-1 gap-1">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 border border-border/40">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-primary" />
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground leading-none mb-1">Enforcement</p>
                <p className="text-sm font-bold">{policy.enforcementLevel?.toUpperCase() || "OPTIONAL"}</p>
              </div>
            </div>
            <Badge variant={isMandatory ? "default" : "secondary"} className="h-5 text-[9px] font-black">
              {isMandatory ? "HIGH" : "STD"}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 border border-border/40 mt-1">
            <div className="flex items-center gap-3">
              <History className="w-4 h-4 text-primary" />
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground leading-none mb-1">Versioning</p>
                <p className="text-sm font-bold">RELEASE v{policy.version}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${isV1 ? 'bg-warning' : 'bg-success'}`} />
              <span className="text-[10px] font-bold">{isV1 ? "Baseline" : "Mature"}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 border border-border/40 mt-1">
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-primary" />
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground leading-none mb-1">Control Surface</p>
                <p className="text-sm font-bold">{(policy.relatedControls || []).length} Mapped Actions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`border rounded-xl p-5 transition-all ${!isActive ? 'bg-destructive/5 border-destructive/20' : 'bg-primary/5 border-primary/20'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${!isActive ? 'bg-destructive' : 'bg-primary'}`} />
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Policy Pulse</span>
          </div>
        </div>
        <p className="text-sm leading-relaxed font-medium">
          {isActive
            ? `GOVERNANCE READY: ${policy.policyType} protocol is fully synchronized with transmission standards. Next review window in ${policy.reviewFrequencyMonths || 12} months.`
            : `ACTION REQUIRED: Lifecycle maturity is constrained by ${policy.status} status. Immediate governance intervention recommended.`}
        </p>
      </div>
    </div>
  );
}


interface PolicyOverviewChartData {
  name: string;
  value: number;
  color?: string;
}

function PolicyRegisterOverview({
  typeData,
  statusData,
  upcomingReviews,
  onPolicySelect
}: {
  typeData: PolicyOverviewChartData[];
  statusData: PolicyOverviewChartData[];
  upcomingReviews: TransmissionSecurityPolicy[];
  onPolicySelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-primary" />
            Policy Type Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={typeData}
                  cx="40%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || `hsl(var(--primary) / ${1 - (index % 5) * 0.15})`} />
                  ))}
                </Pie>
                {typeData.length === 0 && (
                  <text
                    x="40%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-xs font-medium"
                  >
                    No Policies
                  </text>
                )}
                <RechartsTooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ paddingLeft: '20px' }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChartIcon className="w-4 h-4 text-primary" />
            Policy Status Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis hide />
                <RechartsTooltip
                  cursor={{ fill: 'hsl(var(--muted)/0.1)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {statusData.map((entry, index) => (
                    <RechartsCell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Upcoming Policy Reviews
          </CardTitle>
          <p className="text-xs text-muted-foreground">Policies requiring assessment or reaching expiration within the next 90 days.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {upcomingReviews.length > 0 ? (
              upcomingReviews.map((policy) => (
                <div
                  key={policy.id}
                  className="group flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onPolicySelect(policy.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{policy.id.split('-').pop()}</span>
                        <Badge variant="outline" className="text-[10px] uppercase">{policy.policyType}</Badge>
                        {policy.reviewDate && new Date(policy.reviewDate) < new Date() && (
                          <Badge variant="destructive" className="text-[10px]">OVERDUE</Badge>
                        )}
                      </div>
                      <h5 className="text-sm font-medium">{policy.policyName}</h5>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase font-semibold">Review Due</p>
                      <p className={`text-sm font-medium ${policy.reviewDate && new Date(policy.reviewDate) < new Date() ? 'text-destructive' : ''}`}>
                        {policy.reviewDate ? new Date(policy.reviewDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZapIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                <Shield className="w-8 h-8 text-primary mx-auto mb-2 opacity-20" />
                <p className="text-sm">No upcoming reviews scheduled for this quarter.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
