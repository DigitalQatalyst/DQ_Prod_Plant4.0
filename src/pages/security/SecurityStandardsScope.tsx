import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Building2,
  Package,
  Users,
  Calendar,
  Loader2,
  ShieldCheck,
  History,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ClipboardList,
} from "lucide-react";
import { getComplianceStandards, getComplianceRequirements } from "@/lib/complianceQueries";
import type { ComplianceStandard, ComplianceRequirement } from "@/types/security";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer,
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  Cell as RechartsCell
} from "recharts";

export function SecurityStandardsScope() {
  const { currentTenant } = useApp();
  const [complianceStandards, setComplianceStandards] = useState<ComplianceStandard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load compliance standards from Supabase
  useEffect(() => {
    async function loadComplianceStandards() {
      try {
        setLoading(true);
        setError(null);
        const standards = await getComplianceStandards(currentTenant.id);
        setComplianceStandards(standards);
      } catch (err) {
        console.error('Failed to load compliance standards:', err);
        setError('Failed to load compliance standards');
        setComplianceStandards([]);
      } finally {
        setLoading(false);
      }
    }

    loadComplianceStandards();
  }, [currentTenant.id]);

  const [selectedStandardId, setSelectedStandardId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<string>("score");

  const selectedStandard = complianceStandards.find((s) => s.id === selectedStandardId);

  // Filter and sort standards
  const filteredAndSortedStandards = useMemo(() => {
    let result = complianceStandards.filter((standard) => {
      const matchesSearch =
        (standard.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (standard.fullName || '').toLowerCase().includes(searchTerm.toLowerCase());

      const mappedStatus = standard.status === "compliant" ? 'online' : (standard.status === "non-compliant" ? 'offline' : 'maintenance');
      const matchesStatus = statusFilter === "all" || mappedStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.complianceScore - a.complianceScore;
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return 0;
      }
    });

    return result;
  }, [complianceStandards, searchTerm, statusFilter, sortBy]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const total = filteredAndSortedStandards.length;
    const compliant = filteredAndSortedStandards.filter((s) => s.status === "compliant").length;
    const nonCompliant = filteredAndSortedStandards.filter((s) => s.status === "non-compliant").length;
    const inProgress = filteredAndSortedStandards.filter((s) => s.status === "in-progress").length;
    const avgScore = total > 0 ? Math.round(
      filteredAndSortedStandards.reduce((sum, s) => sum + s.complianceScore, 0) / total
    ) : 0;
    return { total, compliant, nonCompliant, inProgress, avgScore };
  }, [filteredAndSortedStandards]);

  const tabs = selectedStandard
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <StandardOverview standard={selectedStandard} />,
      },
      {
        id: "scope",
        label: "Scope",
        content: <StandardScope standard={selectedStandard} />,
      },
      {
        id: "requirements",
        label: "Requirements",
        content: <StandardRequirements standard={selectedStandard} />,
      },
      {
        id: "audits",
        label: "Audits",
        content: <StandardAudits standard={selectedStandard} />,
      },
    ]
    : [];

  if (loading) {
    return <LoadingState loadingText="Analysing security standards scope..." />;
  }

  return (
    <>
      <ListPane
        title="Standards Library"
        context="DEWA – Transmission"
        count={filteredAndSortedStandards.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "all", label: "All Statuses" },
              { value: "online", label: "Compliant" },
              { value: "offline", label: "Non-Compliant" },
              { value: "maintenance", label: "In Progress" },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
        ]}
        sortOptions={[
          { label: 'Compliance Score', value: 'score' },
          { label: 'Name', value: 'name' },
          { label: 'Status', value: 'status' },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >

        {/* Error State */}
        {error && !loading && (
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <p className="text-sm font-medium text-destructive mb-1">
              Failed to Load Standards
            </p>
            <p className="text-xs text-muted-foreground">
              {error}
            </p>
          </div>
        )}

        {/* Standards List */}
        <div className="space-y-1">
          {filteredAndSortedStandards.length === 0 && !loading && !error ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <FileCheck className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                No Standards Found
              </p>
              <p className="text-xs text-muted-foreground">
                Try adjusting your search criteria.
              </p>
            </div>
          ) : (
            filteredAndSortedStandards.map((standard) => (
              <ListPaneItem
                key={standard.id}
                title={standard.name}
                description={standard.fullName}
                status={standard.status === "compliant" ? 'online' : (standard.status === "non-compliant" ? 'offline' : 'maintenance')}
                category={standard.name}
                value={`${standard.complianceScore}%`}
                isSelected={selectedStandardId === standard.id}
                onClick={() => setSelectedStandardId(standard.id)}
              />
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedStandard ? selectedStandard.name : "Standards Overview"}
        subtitle={selectedStandard ? selectedStandard.fullName : "Power Transmission Compliance & Applicable Scope"}
        tabs={tabs}
      >
        {!selectedStandard && (
          <IdentityOverview
            title="Compliance Standards & Scope"
            description="Manage and monitor compliance with power transmission security standards including IEC 62443, NERC CIP, and ISO 27001."
            metrics={[
              {
                title: "Total Standards",
                value: stats.total,
                icon: FileCheck,
                variant: 'default'
              },
              {
                title: "Avg Compliance",
                value: `${stats.avgScore}%`,
                icon: TrendingUp,
                variant: stats.avgScore >= 80 ? 'success' : stats.avgScore >= 60 ? 'warning' : 'destructive'
              },
              {
                title: "Compliant",
                value: stats.compliant,
                icon: CheckCircle2,
                variant: 'success'
              },
              {
                title: "In Progress",
                value: stats.inProgress,
                icon: Clock,
                variant: 'warning'
              }
            ]}
          >
            <StandardsOverview
              statusData={[
                { name: 'Compliant', value: stats.compliant, color: 'hsl(var(--success))' },
                { name: 'In Progress', value: stats.inProgress, color: 'hsl(var(--warning))' },
                { name: 'Non-Compliant', value: stats.nonCompliant, color: 'hsl(var(--destructive))' },
              ].filter(d => d.value > 0)}
              scoreData={complianceStandards
                .sort((a, b) => b.complianceScore - a.complianceScore)
                .slice(0, 5)
                .map(s => ({ name: s.name, value: s.complianceScore }))
              }
              recentStandards={complianceStandards.slice(0, 3)}
              onStandardSelect={(id) => setSelectedStandardId(id)}
            />
          </IdentityOverview>
        )}
      </WorkPane>
    </>
  );
}

function StandardOverview({ standard }: { standard: ComplianceStandard }) {
  // Calculate requirement statistics from the database structure
  const totalReqs = standard.totalRequirements || 0;
  const compliantReqs = standard.metRequirements || 0;
  const inProgressReqs = standard.partialRequirements || 0;
  const nonCompliantReqs = standard.unmetRequirements || 0;
  const notApplicableReqs = standard.notApplicableRequirements || 0;

  return (
    <div className="space-y-6">
      {/* Compliance Score Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Compliance Score
        </h4>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl font-bold">{standard.complianceScore}%</span>
              <span
                className={`text-xs px-3 py-1 rounded-full ${standard.status === "compliant"
                  ? "bg-success/10 text-success"
                  : standard.status === "non-compliant"
                    ? "bg-destructive/10 text-destructive"
                    : standard.status === "in-progress"
                      ? "bg-warning/10 text-warning"
                      : "bg-secondary text-muted-foreground"
                  }`}
              >
                {standard.status}
              </span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${standard.complianceScore >= 80
                  ? "bg-success"
                  : standard.complianceScore >= 60
                    ? "bg-warning"
                    : "bg-destructive"
                  }`}
                style={{ width: `${standard.complianceScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Description</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">{standard.description}</p>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs font-medium text-primary mb-1">Power Transmission Context:</p>
            <p className="text-xs text-muted-foreground">
              This standard applies to power transmission infrastructure including substations,
              grid stations, and regional hubs. Focus areas include protection systems, SCADA networks,
              IEC 61850 communications, and critical transmission assets essential for grid reliability
              and cybersecurity.
            </p>
          </div>
        </div>
      </div>

      {/* Requirements Summary */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Requirements Summary</h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Compliant</span>
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
            <p className="text-2xl font-bold text-success">{compliantReqs}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">In Progress</span>
              <Clock className="w-4 h-4 text-warning" />
            </div>
            <p className="text-2xl font-bold text-warning">{inProgressReqs}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Non-Compliant</span>
              <XCircle className="w-4 h-4 text-destructive" />
            </div>
            <p className="text-2xl font-bold text-destructive">{nonCompliantReqs}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Not Applicable</span>
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-muted-foreground">{notApplicableReqs}</p>
          </div>
        </div>
      </div>

      {/* Audit Information */}
      {(standard.lastAssessmentDate || standard.nextAuditDate) && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Audit Schedule</h4>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {standard.lastAssessmentDate && (
              <div className="p-4 flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Last Assessment</p>
                  <p className="text-sm font-medium">
                    {new Date(standard.lastAssessmentDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
            {standard.nextAuditDate && (
              <div className="p-4 flex items-center gap-3">
                <Calendar className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Next Audit</p>
                  <p className="text-sm font-medium">
                    {new Date(standard.nextAuditDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StandardScope({ standard }: { standard: ComplianceStandard }) {
  // Get scope data from the database structure
  const siteTypes = standard.appliesToSites || [];
  const zones = standard.appliesToZones || [];

  // Transmission-specific site types and zones
  const transmissionSiteTypes = [
    'substation',
    'grid-station',
    'regional-hub',
    'control-center',
    'switching-station'
  ];

  const transmissionZones = [
    'substation-control',
    'protection-systems',
    'scada-network',
    'corporate-network',
    'field-devices',
    'maintenance-network'
  ];

  // Asset types specific to power transmission
  const transmissionAssetTypes = [
    'transformer',
    'circuit-breaker',
    'bay-controller',
    'protection-relay',
    'rtu',
    'scada-node',
    'meter',
    'switch',
    'capacitor-bank'
  ];

  return (
    <div className="space-y-6">
      {/* Applicable Site Types */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          Applicable Sites ({transmissionSiteTypes.length})
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {transmissionSiteTypes.map((siteType, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {siteType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                  <p className="text-xs text-muted-foreground">Transmission Site Type</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Applicable Asset Types */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          Applicable Asset Types ({transmissionAssetTypes.length})
        </h4>
        <div className="grid grid-cols-3 gap-4">
          {transmissionAssetTypes.map((assetType, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {assetType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Applicable Security Zones */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          Applicable Security Zones ({transmissionZones.length})
        </h4>
        <div className="grid grid-cols-3 gap-4">
          {transmissionZones.map((zone, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Package className="w-4 h-4 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {zone.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Zone
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scope Summary */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Scope Summary</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Sites</span>
              <span className="text-sm font-medium">{transmissionSiteTypes.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Asset Types</span>
              <span className="text-sm font-medium">{transmissionAssetTypes.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Security Zones</span>
              <span className="text-sm font-medium">{transmissionZones.length}</span>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Standard Focus</span>
                <span className="text-sm font-medium text-primary">Power Transmission</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StandardRequirements({ standard }: { standard: ComplianceStandard }) {
  const { currentTenant } = useApp();
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRequirements() {
      if (!standard?.id) return;

      try {
        setLoading(true);
        setError(null);
        // Using the imported query function
        const data = await getComplianceRequirements(currentTenant.id, standard.id);
        setRequirements(data);
      } catch (err) {
        console.error('Failed to load standard requirements:', err);
        setError('Failed to load requirements');
      } finally {
        setLoading(false);
      }
    }

    loadRequirements();
  }, [currentTenant.id, standard?.id]);

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="p-8 text-center bg-card border border-border rounded-lg">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading requirements...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-8 text-center bg-destructive/5 border border-destructive/20 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-destructive mx-auto mb-2" />
          <p className="text-sm font-medium text-destructive mb-1">{error}</p>
          <p className="text-xs text-muted-foreground">Please try refreshing the page.</p>
        </div>
      )}

      {/* Requirements Checklist */}
      {!loading && !error && (
        <div>
          <h4 className="text-sm font-semibold mb-3">
            Requirements Checklist ({requirements.length})
          </h4>

          {requirements.length === 0 ? (
            <div className="p-8 text-center bg-muted/20 border border-dashed border-border rounded-lg">
              <ClipboardList className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No Requirements Found</p>
              <p className="text-xs text-muted-foreground mt-1">
                There are no detailed requirements linked to this standard yet.
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg divide-y divide-border">
              {requirements.map((requirement) => (
                <div key={requirement.id} className="p-4 hover:bg-muted/5 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {requirement.status === "compliant" ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : requirement.status === "non-compliant" ? (
                        <XCircle className="w-5 h-5 text-destructive" />
                      ) : requirement.status === "in-progress" ? (
                        <Clock className="w-5 h-5 text-warning" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <span className="text-xs font-mono text-muted-foreground">
                            {requirement.requirementId || requirement.id.substring(0, 8)}
                          </span>
                          <p className="text-sm font-medium mt-0.5">{requirement.title}</p>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${requirement.status === "compliant"
                            ? "bg-success/10 text-success"
                            : requirement.status === "non-compliant"
                              ? "bg-destructive/10 text-destructive"
                              : requirement.status === "in-progress"
                                ? "bg-warning/10 text-warning"
                                : "bg-secondary text-muted-foreground"
                            }`}
                        >
                          {requirement.status}
                        </span>
                      </div>

                      {requirement.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {requirement.description}
                        </p>
                      )}

                      {requirement.evidenceProvided && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-success">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Evidence Provided</span>
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                        {requirement.implementationPercentage > 0 && requirement.implementationPercentage < 100 && (
                          <span>Implementation: {requirement.implementationPercentage}%</span>
                        )}
                        {requirement.priority && (
                          <span className="capitalize">Priority: {requirement.priority}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StandardAudits({ standard }: { standard: ComplianceStandard }) {
  // Mock audit history data based on database fields
  const auditHistory = [
    {
      id: "audit1",
      date: standard.lastAssessmentDate || "2023-12-15T00:00:00Z",
      auditor: "External Auditor - Transmission Security Corp",
      result: "Passed",
      score: standard.complianceScore,
      findings: 3,
      recommendations: 5,
    },
    {
      id: "audit2",
      date: new Date(
        new Date(standard.lastAssessmentDate || "2023-12-15T00:00:00Z").getTime() -
        180 * 24 * 60 * 60 * 1000
      ).toISOString(),
      auditor: "Internal Audit Team",
      result: "Passed with Conditions",
      score: Math.max(0, standard.complianceScore - 10),
      findings: 7,
      recommendations: 8,
    },
    {
      id: "audit3",
      date: new Date(
        new Date(standard.lastAssessmentDate || "2023-12-15T00:00:00Z").getTime() -
        365 * 24 * 60 * 60 * 1000
      ).toISOString(),
      auditor: "External Auditor - Transmission Security Corp",
      result: "Passed",
      score: Math.max(0, standard.complianceScore - 5),
      findings: 4,
      recommendations: 6,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Audit Schedule */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Audit Schedule</h4>
        <div className="grid grid-cols-2 gap-4">
          {standard.lastAudit && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  Last Audit
                </span>
              </div>
              <p className="text-lg font-bold">
                {new Date(standard.lastAudit).toLocaleDateString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.floor(
                  (new Date().getTime() - new Date(standard.lastAudit).getTime()) /
                  (1000 * 60 * 60 * 24)
                )}{" "}
                days ago
              </p>
            </div>
          )}
          {standard.nextAuditDate && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  Next Audit
                </span>
              </div>
              <p className="text-lg font-bold">
                {new Date(standard.nextAuditDate).toLocaleDateString()}
              </p>
              <p className="text-xs text-primary mt-1">
                {Math.floor(
                  (new Date(standard.nextAuditDate).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
                )}{" "}
                days remaining
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Compliance Trend Visualization */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Compliance Trend
        </h4>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="space-y-4">
            {auditHistory.map((audit, index) => (
              <div key={audit.id} className="flex items-center gap-4">
                <div className="text-xs text-muted-foreground w-24">
                  {new Date(audit.date).toLocaleDateString()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{audit.score}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${audit.score >= 80
                        ? "bg-success"
                        : audit.score >= 60
                          ? "bg-warning"
                          : "bg-destructive"
                        }`}
                      style={{ width: `${audit.score}%` }}
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground w-32 text-right">
                  {index === 0 ? "Latest" : `${index * 6} months ago`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit History */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Audit History</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {auditHistory.map((audit) => (
            <div key={audit.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">
                    {new Date(audit.date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{audit.auditor}</p>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${audit.result === "Passed"
                    ? "bg-success/10 text-success"
                    : audit.result === "Passed with Conditions"
                      ? "bg-warning/10 text-warning"
                      : "bg-destructive/10 text-destructive"
                    }`}
                >
                  {audit.result}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <p className="text-xs text-muted-foreground">Score</p>
                  <p className="text-sm font-medium">{audit.score}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Findings</p>
                  <p className="text-sm font-medium">{audit.findings}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Recommendations</p>
                  <p className="text-sm font-medium">{audit.recommendations}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface OverviewChartData {
  name: string;
  value: number;
  color?: string;
}

function StandardsOverview({
  statusData,
  scoreData,
  recentStandards,
  onStandardSelect
}: {
  statusData: OverviewChartData[];
  scoreData: OverviewChartData[];
  recentStandards: ComplianceStandard[];
  onStandardSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-primary" />
            Compliance Status
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
            Top Standards by Compliance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={scoreData} layout="vertical" margin={{ left: 40, right: 20 }}>
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
                  {scoreData.map((_entry, index) => (
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
          Key Compliance Areas
        </h4>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Substation Security</p>
              <p className="text-xs text-muted-foreground">Physical and cyber security controls for transmission substations.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">SCADA Protection</p>
              <p className="text-xs text-muted-foreground">Security standards for Supervisory Control and Data Acquisition systems.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Personnel Safety</p>
              <p className="text-xs text-muted-foreground">Training and access requirements for transmission personnel.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          Recent Standards Activity
        </h4>
        <div className="space-y-4">
          {recentStandards.map(standard => (
            <div
              key={standard.id}
              className="group flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onStandardSelect(standard.id)}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${standard.status === 'compliant' ? 'bg-success' : standard.status === 'non-compliant' ? 'bg-destructive' : 'bg-warning'}`} />
                <span className="text-sm font-medium truncate max-w-[150px]">{standard.name}</span>
              </div>
              <span className="text-xs font-bold">{standard.complianceScore}%</span>
            </div>
          ))}
          <div className="pt-2 border-t border-border mt-2">
            <p className="text-xs text-muted-foreground italic">Select a standard from the list to view detailed requirements, scope, and audit history.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
