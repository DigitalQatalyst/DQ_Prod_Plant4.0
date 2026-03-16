import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import {
  AnalysisMetric
} from "@/components/security/IdentityGovernanceMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Zap,
  AlertTriangle,
  Clock,
  Activity,
  Target,
  MapPin,
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Network,
  Gauge,
  Shield,
  Eye,
  BarChart3,
  GitBranch,
  Layers,
  Timer,
  Calculator,
} from "lucide-react";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { ThreatsDistributionChart } from "@/components/security/ThreatsDistributionChart";
import { ThreatsTopList } from "@/components/security/ThreatsTopList";
import {
  getImpactAssessments,
  getImpactAssessmentById,
  calculateBlastRadius,
  getCascadeAnalysis,
  getImpactScenarios
} from "@/lib/threatMonitoringQueries";
import type {
  ImpactAssessment,
  CascadeAnalysis,
  ImpactScenario,
  ImpactSeverity,
  ImpactAssessmentStatus
} from "@/types/security";

// Helper components for tab refinements
function getImpactHeuristics(assessment: ImpactAssessment) {
  const isHigh = assessment.overallSeverity === 'catastrophic' || assessment.overallSeverity === 'major';
  const hasMW = (assessment.mwAtRisk || 0) > 0;

  return {
    cascadeDepth: isHigh ? "L4 (Critical)" : "L1 (Localized)",
    propagationVelocity: isHigh ? "0.85 Mach" : "0.12 Mach",
    resilienceMargin: hasMW ? "12%" : "45%",
    mitigationEfficiency: "92%",
    redundancyDepth: isHigh ? "Low" : "Optimal",
    isolationConfidence: isHigh ? "Moderate" : "High",
    systemStress: isHigh ? "Elevated" : "Normal"
  };
}

export function ImpactBlastRadius() {
  const { currentTenant } = useApp();

  const getSeverityColor = (severity: ImpactSeverity) => {
    switch (severity) {
      case "catastrophic":
        return "bg-destructive/10 text-destructive";
      case "major":
        return "bg-destructive/10 text-destructive";
      case "moderate":
        return "bg-warning/10 text-warning";
      case "minor":
        return "bg-primary/10 text-primary";
      case "negligible":
        return "bg-secondary text-muted-foreground";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  const getStatusColor = (status: ImpactAssessmentStatus) => {
    switch (status) {
      case "completed":
        return "bg-success/10 text-success";
      case "approved":
        return "bg-success/10 text-success";
      case "in-progress":
        return "bg-warning/10 text-warning";
      case "reviewed":
        return "bg-primary/10 text-primary";
      case "draft":
        return "bg-secondary text-muted-foreground";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  const getSeverityIcon = (severity: ImpactSeverity) => {
    switch (severity) {
      case "catastrophic":
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case "major":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "moderate":
        return <Gauge className="w-4 h-4 text-warning" />;
      case "minor":
        return <Activity className="w-4 h-4 text-primary" />;
      case "negligible":
        return <CheckCircle2 className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  // State management
  const [assessments, setAssessments] = useState<ImpactAssessment[]>([]);
  const [scenarios, setScenarios] = useState<ImpactScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("severity");

  // Filter states
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assessmentTypeFilter, setAssessmentTypeFilter] = useState<string>("all");

  // Load impact assessment data
  useEffect(() => {
    const loadImpactData = async () => {
      try {
        setLoading(true);
        const [assessmentData, scenarioData] = await Promise.all([
          getImpactAssessments(currentTenant.id, { limit: 100 }),
          getImpactScenarios(currentTenant.id)
        ]);

        setAssessments(assessmentData);
        setScenarios(scenarioData);


      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load impact assessments');
      } finally {
        setLoading(false);
      }
    };

    loadImpactData();
  }, [currentTenant.id]);

  // Filter and sort assessments
  const filteredAndSortedAssessments = useMemo(() => {
    let result = assessments.filter((assessment) => {
      const matchesSearch =
        (assessment.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (assessment.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (assessment.assessmentType || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSeverity = severityFilter === "all" || assessment.overallSeverity === severityFilter;
      const matchesStatus = statusFilter === "all" || assessment.status === statusFilter;
      const matchesType = assessmentTypeFilter === "all" || assessment.assessmentType === assessmentTypeFilter;

      return matchesSearch && matchesSeverity && matchesStatus && matchesType;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'severity': {
          const severityOrder: Record<string, number> = { catastrophic: 0, major: 1, moderate: 2, minor: 3, negligible: 4 };
          const severityDiff = (severityOrder[a.overallSeverity] ?? 5) - (severityOrder[b.overallSeverity] ?? 5);
          if (severityDiff !== 0) return severityDiff;
          return new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime();
        }
        case 'date':
          return new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime();
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'impact':
          return (b.customersAffected || 0) - (a.customersAffected || 0);
        case 'mw':
          return (b.mwAtRisk || 0) - (a.mwAtRisk || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [assessments, searchTerm, severityFilter, statusFilter, assessmentTypeFilter, sortBy]);

  const selectedAssessment = assessments.find((a) => a.id === selectedAssessmentId);

  const tabs = selectedAssessment
    ? [
      {
        id: "overview",
        label: "Assessment Overview",
        content: <AssessmentOverview assessment={selectedAssessment} />,
      },
      {
        id: "blast-radius",
        label: "Blast Radius Analysis",
        content: <BlastRadiusAnalysis assessment={selectedAssessment} />,
      },
      {
        id: "cascade",
        label: "Cascade Analysis",
        content: <CascadeAnalysisView assessment={selectedAssessment} />,
      },
      {
        id: "mitigation",
        label: "Mitigation & Response",
        content: <MitigationResponse assessment={selectedAssessment} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Overview",
        content: (
          <IdentityOverview
            title="Impact & Blast Radius Overview"
            description="Comprehensive impact assessments and blast radius analysis for security incidents affecting transmission infrastructure."
            metrics={[
              {
                title: "Total Assessments",
                value: assessments.length,
                icon: Calculator,
                variant: "primary" as const
              },
              {
                title: "Catastrophic Impact",
                value: assessments.filter(a => a.overallSeverity === 'catastrophic').length,
                icon: AlertTriangle,
                variant: assessments.filter(a => a.overallSeverity === 'catastrophic').length > 0 ? "destructive" as const : "default" as const
              },
              {
                title: "In Progress",
                value: assessments.filter(a => a.status === 'in-progress').length,
                icon: Timer,
                variant: "warning" as const
              },
              {
                title: "Scenarios Modeled",
                value: scenarios.length,
                icon: GitBranch,
                variant: "default" as const
              }
            ]}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
              <ThreatsDistributionChart
                title="Assessments by Severity"
                icon={Gauge}
                data={[
                  { name: 'Catastrophic', value: assessments.filter(a => a.overallSeverity === 'catastrophic').length, color: 'hsl(var(--destructive))' },
                  { name: 'Major', value: assessments.filter(a => a.overallSeverity === 'major').length, color: 'hsl(var(--destructive))' },
                  { name: 'Moderate', value: assessments.filter(a => a.overallSeverity === 'moderate').length, color: 'hsl(var(--warning))' },
                  { name: 'Minor', value: assessments.filter(a => a.overallSeverity === 'minor').length, color: 'hsl(var(--primary))' },
                  { name: 'Negligible', value: assessments.filter(a => a.overallSeverity === 'negligible').length, color: 'hsl(var(--secondary))' },
                ].filter(d => d.value > 0)}
                centerText={assessments.length.toString()}
              />
              <ThreatsTopList
                title="Critical Impact Assessments"
                icon={AlertTriangle}
                items={assessments
                  .filter(a => a.overallSeverity === 'catastrophic' || a.overallSeverity === 'major')
                  .map(a => ({
                    id: a.id,
                    title: a.name,
                    subtitle: `Assessed: ${new Date(a.assessmentDate).toLocaleDateString()}`,
                    icon: getSeverityIcon(a.overallSeverity).type,
                    variant: 'destructive' as const
                  }))
                  .slice(0, 5)}
                onItemClick={(id) => setSelectedAssessmentId(id)}
                emptyMessage="No critical impact assessments"
              />
            </div>
          </IdentityOverview>
        ),
      }
    ];



  if (loading) {
    return <LoadingState loadingText="Loading impact assessments..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ListPane
        title="Impact Assessments"
        context="DEWA – Transmission"
        count={filteredAndSortedAssessments.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "severity",
            label: "Severity",
            options: [
              { value: "all", label: "All Severities" },
              { value: "catastrophic", label: "Catastrophic" },
              { value: "major", label: "Major" },
              { value: "moderate", label: "Moderate" },
              { value: "minor", label: "Minor" },
              { value: "negligible", label: "Negligible" },
            ],
            value: severityFilter,
            onChange: setSeverityFilter,
          },
          {
            key: "status",
            label: "Status",
            options: [
              { value: "all", label: "All Statuses" },
              { value: "draft", label: "Draft" },
              { value: "in-progress", label: "In Progress" },
              { value: "completed", label: "Completed" },
              { value: "reviewed", label: "Reviewed" },
              { value: "approved", label: "Approved" },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
          {
            key: "type",
            label: "Type",
            options: [
              { value: "all", label: "All Types" },
              { value: "incident", label: "Incident" },
              { value: "alert", label: "Alert" },
              { value: "scenario", label: "Scenario" },
              { value: "planned-outage", label: "Planned Outage" },
            ],
            value: assessmentTypeFilter,
            onChange: setAssessmentTypeFilter,
          },
        ]}
        sortOptions={[
          { label: 'Severity', value: 'severity' },
          { label: 'Assessment Date', value: 'date' },
          { label: 'Name', value: 'name' },
          { label: 'Customers Affected', value: 'impact' },
          { label: 'MW at Risk', value: 'mw' },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedAssessments.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No Assessments Found"
              description="No impact assessments match your current filters"
            />
          ) : (
            filteredAndSortedAssessments.map((assessment) => (
              <ListPaneItem
                key={assessment.id}
                title={assessment.name}
                description={assessment.description || `${assessment.assessmentType.toUpperCase()} assessment`}
                status={assessment.status === 'approved' || assessment.status === 'completed' ? 'online' : (assessment.status === 'draft' ? 'maintenance' : 'offline')}
                category={assessment.assessmentType.toUpperCase().replace('-', ' ')}
                value={assessment.overallSeverity.toUpperCase()}
                isSelected={selectedAssessmentId === assessment.id}
                onClick={() => setSelectedAssessmentId(assessment.id)}
              />
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedAssessment ? selectedAssessment.name : "Impact Blast Radius"}
        subtitle={selectedAssessment ? `${selectedAssessment.overallSeverity.toUpperCase()} - ${selectedAssessment.assessmentType}` : "Overview"}
        tabs={tabs}
      />
    </>
  );
}

function AssessmentOverview({ assessment }: { assessment: ImpactAssessment }) {
  return (
    <div className="space-y-6">
      {/* Assessment Summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${assessment.overallSeverity === "catastrophic" || assessment.overallSeverity === "major"
              ? "bg-destructive/10"
              : assessment.overallSeverity === "moderate"
                ? "bg-warning/10"
                : assessment.overallSeverity === "minor"
                  ? "bg-primary/10"
                  : "bg-secondary"
              }`}
          >
            <BarChart3
              className={`w-6 h-6 ${assessment.overallSeverity === "catastrophic" || assessment.overallSeverity === "major"
                ? "text-destructive"
                : assessment.overallSeverity === "moderate"
                  ? "text-warning"
                  : assessment.overallSeverity === "minor"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{assessment.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {assessment.description || `${assessment.assessmentType} impact assessment`}
            </p>
            <div className="flex items-center gap-4 mt-4">
              <span
                className={`text-xs px-3 py-1 rounded-full ${assessment.overallSeverity === "catastrophic" || assessment.overallSeverity === "major"
                  ? "bg-destructive/10 text-destructive"
                  : assessment.overallSeverity === "moderate"
                    ? "bg-warning/10 text-warning"
                    : assessment.overallSeverity === "minor"
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-muted-foreground"
                  }`}
              >
                {assessment.overallSeverity.toUpperCase()}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">
                {assessment.assessmentType.replace('-', ' ').toUpperCase()}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calculator className="w-3 h-3" />
                Confidence: {Math.round((assessment.confidenceLevel || 0) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Impact Metrics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Customers Affected</p>
            </div>
            <p className="text-2xl font-bold">{assessment.customersAffected.toLocaleString()}</p>
          </div>
          {assessment.mwAtRisk && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">MW at Risk</p>
              </div>
              <p className="text-2xl font-bold text-warning">{assessment.mwAtRisk}</p>
            </div>
          )}
          {assessment.estimatedOutageDurationHours && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Outage Duration</p>
              </div>
              <p className="text-2xl font-bold text-destructive">{assessment.estimatedOutageDurationHours}h</p>
            </div>
          )}
          {assessment.estimatedRecoveryTimeHours && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Recovery Time</p>
              </div>
              <p className="text-2xl font-bold text-primary">{assessment.estimatedRecoveryTimeHours}h</p>
            </div>
          )}
        </div>
      </div>

      {/* Financial Impact */}
      {(assessment.estimatedCostUsd || assessment.revenueLossUsd || assessment.regulatoryFinesUsd) && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Financial Impact</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {assessment.estimatedCostUsd && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Total Cost</p>
                </div>
                <p className="text-xl font-bold">${assessment.estimatedCostUsd.toLocaleString()}</p>
              </div>
            )}
            {assessment.revenueLossUsd && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Revenue Loss</p>
                </div>
                <p className="text-xl font-bold text-warning">${assessment.revenueLossUsd.toLocaleString()}</p>
              </div>
            )}
            {assessment.regulatoryFinesUsd && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Regulatory Fines</p>
                </div>
                <p className="text-xl font-bold text-destructive">${assessment.regulatoryFinesUsd.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assessment Information */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Assessment Information</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-center gap-3">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Assessment Type</p>
              <p className="text-sm font-medium">{assessment.assessmentType.replace('-', ' ')}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Assessment Date</p>
              <p className="text-sm font-medium">
                {new Date(assessment.assessmentDate).toLocaleString()}
              </p>
            </div>
          </div>
          {assessment.assessedBy && (
            <div className="p-4 flex items-center gap-3">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Assessed By</p>
                <p className="text-sm font-medium">{assessment.assessedBy}</p>
              </div>
            </div>
          )}
          <div className="p-4 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm font-medium">{assessment.status}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Impact Categories */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Impact Categories</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex flex-wrap gap-2">
            {assessment.impactCategories.map((category, index) => (
              <span key={index} className="text-xs px-3 py-1 rounded bg-primary/10 text-primary">
                {category.replace('-', ' ')}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Safety and Environmental */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h5 className="text-sm font-semibold mb-3">Safety Assessment</h5>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Safety Risk Level</span>
              <span className={`text-xs px-2 py-1 rounded ${(assessment.safetyRiskLevel || 0) >= 4 ? "bg-destructive/10 text-destructive" :
                (assessment.safetyRiskLevel || 0) >= 3 ? "bg-warning/10 text-warning" :
                  "bg-success/10 text-success"
                }`}>
                {assessment.safetyRiskLevel || 0}/5
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Public Safety Concern</span>
              <span className={`text-xs px-2 py-1 rounded ${assessment.publicSafetyConcern ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                }`}>
                {assessment.publicSafetyConcern ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>

        {assessment.environmentalImpact && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h5 className="text-sm font-semibold mb-3">Environmental Impact</h5>
            <p className="text-sm text-muted-foreground">{assessment.environmentalImpact}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BlastRadiusAnalysis({ assessment }: { assessment: ImpactAssessment }) {
  return (
    <div className="space-y-6">
      {/* Blast Radius Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
            <Target className="w-6 h-6 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Blast Radius Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Geographic and network impact assessment
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {assessment.blastRadiusKm && (
            <div className="text-center">
              <p className="text-2xl font-bold text-warning">{assessment.blastRadiusKm}km</p>
              <p className="text-xs text-muted-foreground">Blast Radius</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{(assessment.affectedSites || []).length}</p>
            <p className="text-xs text-muted-foreground">Affected Sites</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-destructive">{(assessment.affectedGridNodes || []).length}</p>
            <p className="text-xs text-muted-foreground">Grid Nodes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-warning">{(assessment.affectedGridLines || []).length}</p>
            <p className="text-xs text-muted-foreground">Grid Lines</p>
          </div>
        </div>
      </div>

      {/* Grid Topology Impact */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Grid Topology Impact</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <h5 className="text-xs font-medium text-muted-foreground mb-2">Voltage Levels Affected</h5>
            <div className="space-y-1">
              {(assessment.affectedVoltageLevels || []).map((level, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-warning" />
                  <span className="text-sm">{level}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <h5 className="text-xs font-medium text-muted-foreground mb-2">Network Characteristics</h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Cascade Potential</span>
                <span className={`text-xs px-2 py-1 rounded ${assessment.cascadePotential ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                  }`}>
                  {assessment.cascadePotential ? "High" : "Low"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Isolation Possible</span>
                <span className={`text-xs px-2 py-1 rounded ${assessment.isolationPossible ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                  }`}>
                  {assessment.isolationPossible ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Backup Paths</span>
                <span className={`text-xs px-2 py-1 rounded ${assessment.backupPathsAvailable ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  }`}>
                  {assessment.backupPathsAvailable ? "Available" : "None"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <h5 className="text-xs font-medium text-muted-foreground mb-2">Impact Scope</h5>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span>Sites</span>
                <span className="font-medium">{(assessment.affectedSites || []).length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Assets</span>
                <span className="font-medium">{(assessment.affectedAssets || []).length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Grid Nodes</span>
                <span className="font-medium">{(assessment.affectedGridNodes || []).length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Grid Lines</span>
                <span className="font-medium">{(assessment.affectedGridLines || []).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Affected Infrastructure */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Affected Infrastructure</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <h5 className="text-xs font-medium text-muted-foreground mb-2">Primary Impact Zone</h5>
            <div className="space-y-2">
              {assessment.primarySiteId && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-destructive" />
                  <span className="text-sm">Primary Site: {assessment.primarySiteId}</span>
                </div>
              )}
              {assessment.primaryGridNodeId && (
                <div className="flex items-center gap-2">
                  <Network className="w-3 h-3 text-destructive" />
                  <span className="text-sm">Primary Node: {assessment.primaryGridNodeId}</span>
                </div>
              )}
              {assessment.primaryGridLineId && (
                <div className="flex items-center gap-2">
                  <GitBranch className="w-3 h-3 text-destructive" />
                  <span className="text-sm">Primary Line: {assessment.primaryGridLineId}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <h5 className="text-xs font-medium text-muted-foreground mb-2">Secondary Impact</h5>
            <div className="space-y-1 text-sm">
              <div>Secondary sites: {Math.max(0, (assessment.affectedSites || []).length - 1)}</div>
              <div>Secondary nodes: {Math.max(0, (assessment.affectedGridNodes || []).length - 1)}</div>
              <div>Secondary lines: {Math.max(0, (assessment.affectedGridLines || []).length - 1)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Methodology */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Assessment Methodology</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-2">Methodology</h5>
              <p className="text-sm">{assessment.assessmentMethodology || "Standard grid topology analysis"}</p>
            </div>
            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-2">Confidence Level</h5>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${(assessment.confidenceLevel || 0) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{Math.round((assessment.confidenceLevel || 0) * 100)}%</span>
              </div>
            </div>
          </div>

          {assessment.assumptions && assessment.assumptions.length > 0 && (
            <div className="mt-4">
              <h5 className="text-xs font-medium text-muted-foreground mb-2">Key Assumptions</h5>
              <ul className="space-y-1 text-sm">
                {assessment.assumptions.map((assumption, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 text-primary mt-0.5" />
                    <span>{assumption}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {assessment.limitations && assessment.limitations.length > 0 && (
            <div className="mt-4">
              <h5 className="text-xs font-medium text-muted-foreground mb-2">Limitations</h5>
              <ul className="space-y-1 text-sm">
                {assessment.limitations.map((limitation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 text-warning mt-0.5" />
                    <span>{limitation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CascadeAnalysisView({ assessment }: { assessment: ImpactAssessment }) {
  const [cascadeData, setCascadeData] = useState<CascadeAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCascadeData = async () => {
      try {
        const data = await getCascadeAnalysis(assessment.tenantId, assessment.id);
        setCascadeData(data);
      } catch (err) {
        console.error('Failed to load cascade analysis:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCascadeData();
  }, [assessment.tenantId, assessment.id]);

  if (loading) {
    return <LoadingState loadingText="Loading assessment details..." />;
  }

  return (
    <div className="space-y-6">
      {/* Cascade Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
            <GitBranch className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Cascade Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Step-by-step cascade propagation analysis
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <AnalysisMetric
            label="Redundancy Depth"
            value={getImpactHeuristics(assessment).redundancyDepth}
            icon={Activity}
            variant="card"
            status={getImpactHeuristics(assessment).redundancyDepth === 'Optimal' ? 'success' : 'failed'}
          />
          <AnalysisMetric
            label="Grid Propagation Velocity"
            value={getImpactHeuristics(assessment).propagationVelocity}
            icon={Zap}
            variant="card"
            status={assessment.overallSeverity === 'catastrophic' ? 'failed' : 'warning'}
          />
          <AnalysisMetric
            label="Resilience Margin"
            value={getImpactHeuristics(assessment).resilienceMargin}
            icon={Gauge}
            variant="card"
            status={parseInt(getImpactHeuristics(assessment).resilienceMargin) < 20 ? 'warning' : 'success'}
          />
          <AnalysisMetric
            label="Isolation Confidence"
            value={getImpactHeuristics(assessment).isolationConfidence}
            icon={Shield}
            variant="card"
            status={assessment.overallSeverity === 'low' ? 'success' : 'warning'}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-destructive">{cascadeData.length}</p>
            <p className="text-xs text-muted-foreground">Cascade Steps</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-warning">
              {cascadeData.reduce((sum, step) => sum + (step.loadShedMw || 0), 0)}MW
            </p>
            <p className="text-xs text-muted-foreground">Total Load Shed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {cascadeData.reduce((sum, step) => sum + (step.customersLost || 0), 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Customers Lost</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-muted-foreground">
              {Math.max(...cascadeData.map(step => step.propagationTimeSeconds || 0))}s
            </p>
            <p className="text-xs text-muted-foreground">Max Propagation</p>
          </div>
        </div>
      </div>

      {/* Cascade Steps */}
      {cascadeData.length > 0 ? (
        <div>
          <h4 className="text-sm font-semibold mb-3">Cascade Propagation Steps</h4>
          <div className="space-y-3">
            {cascadeData.map((step, index) => (
              <div key={step.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-destructive">{step.cascadeStep}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h5 className="text-sm font-semibold">Step {step.cascadeStep}</h5>
                      <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                        {step.cascadeType}
                      </span>
                      {step.propagationTimeSeconds && (
                        <span className="text-xs text-muted-foreground">
                          {step.propagationTimeSeconds}s propagation
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      {step.loadShedMw && (
                        <div>
                          <p className="text-xs text-muted-foreground">Load Shed</p>
                          <p className="text-sm font-medium">{step.loadShedMw}MW</p>
                        </div>
                      )}
                      {step.customersLost && (
                        <div>
                          <p className="text-xs text-muted-foreground">Customers Lost</p>
                          <p className="text-sm font-medium">{step.customersLost.toLocaleString()}</p>
                        </div>
                      )}
                      {step.voltageImpact && (
                        <div>
                          <p className="text-xs text-muted-foreground">Voltage Impact</p>
                          <p className="text-sm font-medium">{step.voltageImpact}%</p>
                        </div>
                      )}
                      {step.probability && (
                        <div>
                          <p className="text-xs text-muted-foreground">Probability</p>
                          <p className="text-sm font-medium">{Math.round(step.probability * 100)}%</p>
                        </div>
                      )}
                    </div>

                    {step.protectionSystems.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-muted-foreground mb-1">Protection Systems</p>
                        <div className="flex flex-wrap gap-1">
                          {step.protectionSystems.map((system, idx) => (
                            <span key={idx} className="text-xs px-2 py-0.5 rounded bg-success/10 text-success">
                              {system}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {step.automaticControls.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Automatic Controls</p>
                        <div className="flex flex-wrap gap-1">
                          {step.automaticControls.map((control, idx) => (
                            <span key={idx} className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                              {control}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <GitBranch className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">No cascade analysis data available</p>
          <p className="text-xs text-muted-foreground mt-1">
            Cascade analysis may not be required for this assessment type
          </p>
        </div>
      )}

      {/* Cascade Prevention */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Cascade Prevention Measures</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-2">Protective Systems</h5>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-success" />
                  <span>Under-frequency load shedding (UFLS)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-success" />
                  <span>Under-voltage load shedding (UVLS)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-success" />
                  <span>Distance protection relays</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-success" />
                  <span>System integrity protection schemes (SIPS)</span>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-2">Operator Actions</h5>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <Eye className="w-3 h-3 text-primary" />
                  <span>Manual load shedding</span>
                </li>
                <li className="flex items-center gap-2">
                  <Eye className="w-3 h-3 text-primary" />
                  <span>Generation redispatch</span>
                </li>
                <li className="flex items-center gap-2">
                  <Eye className="w-3 h-3 text-primary" />
                  <span>Network reconfiguration</span>
                </li>
                <li className="flex items-center gap-2">
                  <Eye className="w-3 h-3 text-primary" />
                  <span>Emergency system separation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MitigationResponse({ assessment }: { assessment: ImpactAssessment }) {
  return (
    <div className="space-y-6">
      {/* Response Readiness Heuristics */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Response Readiness Insights
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalysisMetric label="Automation Yield" value="84%" icon={Zap} variant="card" status="success" />
          <AnalysisMetric label="Containment SLA" value="12m" icon={Timer} variant="card" status="success" />
          <AnalysisMetric label="Resource Load" value="Optimal" icon={Users} variant="card" status="default" />
          <AnalysisMetric label="Success Probability" value="98%" icon={CheckCircle2} variant="card" status="success" />
        </div>
      </div>

      {/* Mitigation Strategies */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Mitigation Strategies</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <ul className="space-y-2 text-sm">
            {(assessment.mitigationStrategies || []).map((strategy, index) => (
              <li key={index} className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-primary mt-0.5" />
                <span>{strategy}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Contingency Plans */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Contingency Plans</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <ul className="space-y-2 text-sm">
            {(assessment.contingencyPlans || []).map((plan, index) => (
              <li key={index} className="flex items-start gap-2">
                <Layers className="w-4 h-4 text-warning mt-0.5" />
                <span>{plan}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recovery Procedures */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Recovery Procedures</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <ul className="space-y-2 text-sm">
            {(assessment.recoveryProcedures || []).map((procedure, index) => (
              <li key={index} className="flex items-start gap-2">
                <Activity className="w-4 h-4 text-success mt-0.5" />
                <span>{procedure}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Response Timeline */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Response Timeline</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                <span className="text-xs font-bold text-destructive">0h</span>
              </div>
              <div>
                <p className="text-sm font-medium">Immediate Response</p>
                <p className="text-xs text-muted-foreground">Incident detection and initial containment</p>
              </div>
            </div>

            {assessment.estimatedOutageDurationHours && (
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-warning">{Math.round(assessment.estimatedOutageDurationHours / 2)}h</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Mitigation Phase</p>
                  <p className="text-xs text-muted-foreground">Execute mitigation strategies and contingency plans</p>
                </div>
              </div>
            )}

            {assessment.estimatedRecoveryTimeHours && (
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-success">{assessment.estimatedRecoveryTimeHours}h</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Full Recovery</p>
                  <p className="text-xs text-muted-foreground">Complete system restoration and normal operations</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Critical Actions */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Critical Actions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <h5 className="text-xs font-medium text-muted-foreground mb-2">Immediate (0-1 hour)</h5>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 text-destructive" />
                <span>Activate emergency response team</span>
              </li>
              <li className="flex items-center gap-2">
                <Network className="w-3 h-3 text-destructive" />
                <span>Isolate affected systems</span>
              </li>
              <li className="flex items-center gap-2">
                <Users className="w-3 h-3 text-destructive" />
                <span>Notify stakeholders and authorities</span>
              </li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <h5 className="text-xs font-medium text-muted-foreground mb-2">Short-term (1-24 hours)</h5>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <Shield className="w-3 h-3 text-warning" />
                <span>Implement backup systems</span>
              </li>
              <li className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-warning" />
                <span>Execute recovery procedures</span>
              </li>
              <li className="flex items-center gap-2">
                <Eye className="w-3 h-3 text-warning" />
                <span>Monitor system stability</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Success Criteria */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Success Criteria</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">System Restoration</span>
              <span className="text-xs px-2 py-1 rounded bg-success/10 text-success">
                {assessment.isolationPossible ? "Achievable" : "Challenging"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Customer Impact Minimized</span>
              <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                Target: &lt;{Math.round(assessment.customersAffected * 0.1).toLocaleString()} customers
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Recovery Time</span>
              <span className="text-xs px-2 py-1 rounded bg-warning/10 text-warning">
                Target: &lt;{assessment.estimatedRecoveryTimeHours || 24}h
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">No Cascade Events</span>
              <span className="text-xs px-2 py-1 rounded bg-success/10 text-success">
                Critical
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}