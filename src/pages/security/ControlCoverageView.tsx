import { useMemo, useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Network,
  Users,
  Activity,
  Lock,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  getControlsByStandard,
  getGapAnalysis
} from "@/lib/controlCoverageQueries";
import type {
  ControlsByStandard,
  ControlCoverageDetail,
  GapAnalysis
} from "@/types/security";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { FeatureOverviewCharts } from "@/components/security/FeatureOverviewCharts";

export function ControlCoverageView() {
  const { currentTenant } = useApp();
  const [selectedControl, setSelectedControl] = useState<ControlCoverageDetail | null>(null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [controlsByStandard, setControlsByStandard] = useState<ControlsByStandard[]>([]);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [standardFilter, setStandardFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("id");

  // Load control coverage data from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await getControlsByStandard(currentTenant.id);
        setControlsByStandard(data);
      } catch (err) {
        console.error('Error loading control coverage data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load control coverage data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentTenant.id]);

  // Load gap analysis when an assessment is selected
  useEffect(() => {
    async function loadGapAnalysis() {
      if (!selectedAssessmentId) {
        setGapAnalysis(null);
        return;
      }

      try {
        const analysis = await getGapAnalysis(currentTenant.id, selectedAssessmentId);
        setGapAnalysis(analysis);
      } catch (err) {
        console.error('Error loading gap analysis:', err);
      }
    }

    loadGapAnalysis();
  }, [currentTenant.id, selectedAssessmentId]);

  // Filter and sort standards and controls
  const filteredAndSortedStandards = useMemo(() => {
    let result = controlsByStandard.map(std => ({
      ...std,
      controls: [...std.controls]
    }));

    // Filter by standard
    if (standardFilter !== "all") {
      result = result.filter(std => std.standardName === standardFilter);
    }

    // Filter controls
    result = result.map(std => {
      let filteredControls = std.controls;

      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        filteredControls = filteredControls.filter(c =>
          c.controlName.toLowerCase().includes(query) ||
          c.controlId.toLowerCase().includes(query) ||
          (c.controlDescription || '').toLowerCase().includes(query)
        );
      }

      // Status filter
      if (statusFilter !== "all") {
        filteredControls = filteredControls.filter(c => c.implementationStatus === statusFilter);
      }

      // Sort controls
      filteredControls.sort((a, b) => {
        if (sortBy === "id") return a.controlId.localeCompare(b.controlId);
        if (sortBy === "name") return a.controlName.localeCompare(b.controlName);
        if (sortBy === "status") {
          const order = { 'implemented': 0, 'partial': 1, 'not-implemented': 2 };
          return order[(a.implementationStatus as any)] - order[(b.implementationStatus as any)];
        }
        return 0;
      });

      return { ...std, controls: filteredControls };
    }).filter(std => std.controls.length > 0);

    return result;
  }, [controlsByStandard, searchTerm, standardFilter, statusFilter, sortBy]);

  // Calculate coverage statistics
  const coverageStats = useMemo(() => {
    const standards = controlsByStandard;
    const totalControls = standards.reduce((sum, std) => sum + std.totalControls, 0);
    const implementedControls = standards.reduce((sum, std) => sum + std.implementedControls, 0);
    const partialControls = standards.reduce((sum, std) => sum + std.partialControls, 0);
    const notImplementedControls = standards.reduce((sum, std) => sum + std.notImplementedControls, 0);
    const criticalGaps = standards.reduce((sum, std) => sum + std.criticalGaps, 0);
    const highGaps = standards.reduce((sum, std) => sum + std.highGaps, 0);

    const avgCoverage = standards.length > 0
      ? Math.round(standards.reduce((sum, std) => sum + std.averageCoverageScore, 0) / standards.length)
      : 0;

    return {
      totalControls,
      implementedControls,
      partialControls,
      notImplementedControls,
      criticalGaps,
      highGaps,
      avgCoverage,
      standardsCount: standards.length
    };
  }, [controlsByStandard]);

  const categoryIcons: Record<string, any> = {
    'access-control': Lock,
    'network-security': Network,
    'monitoring': Activity,
    'incident-response': AlertTriangle,
    'data-protection': Shield,
    'physical-security': Users,
    'change-management': FileCheck,
  };

  const tabs = selectedControl ? [
    {
      id: "overview",
      label: "Overview",
      content: <ControlOverview control={selectedControl} gapAnalysis={gapAnalysis} />,
    },
    {
      id: "gaps",
      label: "Gap Analysis",
      content: <ControlGapAnalysis control={selectedControl} gapAnalysis={gapAnalysis} />,
    },
    {
      id: "remediation",
      label: "Remediation",
      content: <ControlRemediation control={selectedControl} />,
    },
  ] : [
    {
      id: "overview",
      label: "Overview",
      content: <ControlsOverview standards={controlsByStandard} stats={coverageStats} />,
    },
  ];

  if (loading) {
    return <LoadingState loadingText="Loading baseline data..." />;
  }

  if (error) {
    return (
      <EmptyState
        title="Error Loading Data"
        description={error}
        icon={AlertTriangle}
      />
    );
  }

  if (controlsByStandard.length === 0) {
    return (
      <EmptyState
        title="No Control Coverage Assessments"
        description="No control coverage assessments have been created yet. Create an assessment to track IEC 62443 and NERC CIP compliance."
        icon={Shield}
      />
    );
  }

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane
        title="Security Controls"
        context="DEWA – Transmission"
        count={filteredAndSortedStandards.reduce((sum, std) => sum + std.controls.length, 0)}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "standard", label: "Standard", value: standardFilter, options: [
              { label: "All Standards", value: "all" },
              ...controlsByStandard.map(std => ({ label: std.standardName, value: std.standardName }))
            ], onChange: setStandardFilter
          },
          {
            key: "status", label: "Status", value: statusFilter, options: [
              { label: "All Status", value: "all" },
              { label: "Implemented", value: "implemented" },
              { label: "Partial", value: "partial" },
              { label: "Not Implemented", value: "not-implemented" },
            ], onChange: setStatusFilter
          }
        ]}
        sortOptions={[
          { label: "Control ID", value: "id" },
          { label: "Control Name", value: "name" },
          { label: "Implementation Status", value: "status" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-4">
          {filteredAndSortedStandards.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No controls found"
              description="No security controls match your current filters"
            />
          ) : (
            filteredAndSortedStandards.map((standard) => (
              <div key={`${standard.standardName}-${standard.standardVersion}`} className="mb-4">
                <div className="flex items-center justify-between mb-2 px-2 text-[10px] bg-secondary p-1 rounded font-medium uppercase tracking-wider text-muted-foreground/70">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FileCheck className="w-3 h-3 text-primary shrink-0" />
                    <span className="truncate">
                      {standard.standardName}
                      {standard.standardVersion && ` ${standard.standardVersion}`}
                    </span>
                  </div>
                  <span className="shrink-0">{standard.averageCoverageScore}% score</span>
                </div>
                <div className="space-y-1">
                  {standard.controls.map((control) => (
                    <ListPaneItem
                      key={control.id}
                      title={control.controlName}
                      description={control.controlId}
                      status={control.implementationStatus === 'implemented' ? 'online' : (control.implementationStatus === 'partial' ? 'maintenance' : 'offline')}
                      category={control.controlCategory?.replace('-', ' ')}
                      value={control.effectiveness === 'effective' ? '100%' : (control.effectiveness === 'partially-effective' ? '50%' : '0%')}
                      isSelected={selectedControl?.id === control.id}
                      onClick={() => {
                        setSelectedControl(control);
                        setSelectedAssessmentId(control.assessmentId);
                      }}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedControl ? selectedControl.controlName : "Controls Overview"}
        subtitle={
          selectedControl
            ? `${selectedControl.controlId} • ${selectedControl.controlCategory?.replace('-', ' ') || 'Uncategorized'}`
            : `Aggregate security control coverage across ${coverageStats.standardsCount} compliance frameworks`
        }
        tabs={tabs}
      />
    </div>
  );
}

function ControlsOverview({ standards, stats }: { standards: ControlsByStandard[]; stats: any }) {
  const overviewMetrics = [
    {
      title: "Assessed Controls",
      value: stats.totalControls,
      subtitle: `${stats.standardsCount} standards`,
      icon: Shield,
      variant: "primary" as any
    },
    {
      title: "Aggregate Coverage",
      value: `${stats.avgCoverage}%`,
      subtitle: "Across all domains",
      icon: FileCheck,
      variant: stats.avgCoverage >= 80 ? "success" : stats.avgCoverage >= 60 ? "warning" : "destructive" as any
    },
    {
      title: "Critical Gaps",
      value: stats.criticalGaps,
      subtitle: "Action required",
      icon: AlertTriangle,
      variant: stats.criticalGaps > 0 ? "destructive" : "success" as any
    },
    {
      title: "Implemented",
      value: `${Math.round((stats.implementedControls / Math.max(stats.totalControls, 1)) * 100)}%`,
      subtitle: `${stats.implementedControls} controls`,
      icon: CheckCircle2,
      variant: "success" as any
    }
  ];

  const pieChartData = [
    { name: "Implemented", value: stats.implementedControls, color: "hsl(var(--success))" },
    { name: "Partial", value: stats.partialControls, color: "hsl(var(--warning))" },
    { name: "Not Implemented", value: stats.notImplementedControls, color: "hsl(var(--destructive))" },
  ];

  // Calculate stats by category for more meaningful charts
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; totalScore: number }> = {};

    standards.forEach(std => {
      std.controls.forEach(control => {
        const cat = control.controlCategory || 'uncategorized';
        if (!stats[cat]) {
          stats[cat] = { total: 0, totalScore: 0 };
        }
        stats[cat].total++;
        const score = control.implementationStatus === 'implemented' ? 100 : (control.implementationStatus === 'partial' ? 50 : 0);
        stats[cat].totalScore += score;
      });
    });

    return Object.entries(stats).map(([name, data]) => ({
      name: name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      value: Math.round(data.totalScore / data.total)
    })).sort((a, b) => b.value - a.value);
  }, [standards]);

  const barChartData = categoryStats.length > 0 ? categoryStats : standards.map(std => ({
    name: std.standardName,
    value: std.averageCoverageScore
  }));

  const keyAreas = [
    {
      icon: Lock,
      title: "Access Control",
      description: "Managing identity, authentication, and authorization across critical transmission assets."
    },
    {
      icon: Network,
      title: "Network Security",
      description: "Segmentation and protocol protection for OT networks and control center systems."
    },
    {
      icon: Activity,
      title: "Continuous Monitoring",
      description: "Logging, auditing and real-time detection of security events in the power grid."
    },
    {
      icon: TrendingUp,
      title: "Maturity Roadmap",
      description: "Structured approach to improving control effectiveness across all sites and domains."
    }
  ];

  const criticalGaps = standards.flatMap(std =>
    std.controls.filter(c => c.implementationStatus === 'not-implemented' || c.gapSeverity === 'critical')
  ).slice(0, 5).map(c => ({
    id: c.id,
    title: c.controlName,
    subtitle: c.controlId,
    status: 'error' as any,
    value: 'GAP'
  }));

  return (
    <IdentityOverview
      title="Control Framework Overview"
      description="Holistic view of security control implementation and effectiveness across global standards"
      metrics={overviewMetrics}
      showTitleCard={false}
    >
      <FeatureOverviewCharts
        pieChartTitle="Implementation Maturity"
        pieChartData={pieChartData}
        pieChartIcon={ShieldCheck}
        barChartTitle={categoryStats.length > 0 ? "Coverage by Domain" : "Coverage by Standard"}
        barChartData={barChartData}
        barChartIcon={Activity}
        keyAreas={keyAreas}
        recentActivity={criticalGaps}
        recentActivityTitle="Critical Coverage Gaps"
      />
    </IdentityOverview>
  );
}

function ControlOverview({ control, gapAnalysis }: { control: ControlCoverageDetail; gapAnalysis: GapAnalysis | null }) {
  const overviewMetrics = [
    {
      title: "Implementation",
      value: control.implementationStatus,
      subtitle: "Current status",
      icon: CheckCircle2,
      variant: control.implementationStatus === "implemented" ? "success" : control.implementationStatus === "partial" ? "warning" : "default" as any
    },
    {
      title: "Effectiveness",
      value: control.effectiveness || "Not assessed",
      subtitle: "Control health",
      icon: Shield,
      variant: control.effectiveness === "effective" ? "success" : control.effectiveness === "partially-effective" ? "warning" : "default" as any
    },
    {
      title: "Gap Severity",
      value: control.gapSeverity || "None",
      subtitle: "Identified issues",
      icon: AlertTriangle,
      variant: control.gapSeverity === "critical" ? "destructive" : control.gapSeverity === "high" ? "warning" : "default" as any
    },
    {
      title: "Remediation",
      value: control.remediationStatus || "N/A",
      subtitle: "Action status",
      icon: Activity,
      variant: control.remediationStatus === "completed" ? "success" : control.remediationStatus === "in-progress" ? "warning" : "default" as any
    }
  ];

  const keyAreas = [
    {
      icon: FileCheck,
      title: "Control Description",
      description: control.controlDescription || "No description available"
    },
    {
      icon: ShieldCheck,
      title: "Validation Method",
      description: control.validationMethod || "No validation method documented"
    }
  ];

  const evidenceActivity = (control.evidence || []).map((e, i) => ({
    id: `ev-${i}`,
    title: e,
    status: 'success' as any,
    value: 'Artifact'
  }));

  return (
    <IdentityOverview
      title={`${control.controlId}: ${control.controlName}`}
      description="Detailed control assessment and implementation status"
      metrics={overviewMetrics}
      showTitleCard={false}
    >
      <FeatureOverviewCharts
        pieChartTitle="Implementation Status"
        pieChartData={[{ name: control.implementationStatus, value: 100, color: 'hsl(var(--primary))' }]}
        pieChartIcon={Shield}
        barChartTitle="Criticality & Status"
        barChartData={[
          { name: "Risk Criticality", value: control.gapSeverity === 'critical' ? 100 : control.gapSeverity === 'high' ? 75 : control.gapSeverity === 'medium' ? 50 : 25, color: 'hsl(var(--destructive))' },
          { name: "Implementation", value: control.implementationStatus === 'implemented' ? 100 : control.implementationStatus === 'partial' ? 50 : 0, color: 'hsl(var(--success))' },
          { name: "Effectiveness", value: control.effectiveness === 'effective' ? 100 : control.effectiveness === 'partially-effective' ? 50 : 0, color: 'hsl(var(--primary))' }
        ]}
        barChartIcon={Activity}
        keyAreas={keyAreas}
        recentActivity={evidenceActivity}
        recentActivityTitle="Attached Evidence"
      />
    </IdentityOverview>
  );
}

function ControlGapAnalysis({ control, gapAnalysis }: { control: ControlCoverageDetail; gapAnalysis: GapAnalysis | null }) {
  const hasControlGap = !!control.gapDescription;
  const hasAssessmentGaps = gapAnalysis && (
    gapAnalysis.criticalGaps.length > 0 ||
    gapAnalysis.highGaps.length > 0 ||
    gapAnalysis.mediumGaps.length > 0 ||
    gapAnalysis.lowGaps.length > 0
  );

  if (!hasControlGap && !hasAssessmentGaps) {
    return (
      <div className="text-center py-8">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No gaps identified for this control</p>
      </div>
    );
  }

  const renderGapSection = (title: string, gaps: any[], variant: 'destructive' | 'warning' | 'default') => {
    if (gaps.length === 0) return null;

    const bgColor = variant === 'destructive' ? 'bg-destructive/10 border-destructive/20' :
      variant === 'warning' ? 'bg-warning/10 border-warning/20' :
        'bg-secondary/50 border-border';

    const titleColor = variant === 'destructive' ? 'text-destructive' :
      variant === 'warning' ? 'text-warning-foreground' :
        'text-foreground';

    return (
      <div className="mt-4">
        <h4 className={`text-xs font-semibold mb-2 uppercase tracking-wider ${titleColor}`}>{title}</h4>
        <div className="space-y-2">
          {gaps.map((gap, index) => (
            <div key={index} className={`border rounded-lg p-3 ${bgColor}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">{gap.controlName}</p>
                  <p className="text-xs text-muted-foreground">{gap.controlId}</p>
                </div>
                <StatusBadge status={gap.remediationStatus} />
              </div>
              <p className="text-sm">{gap.gapDescription}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {control.gapDescription && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-sm font-medium">Primary Control Gap</h4>
              <p className="text-xs text-muted-foreground">{control.controlId}</p>
            </div>
            {control.gapSeverity && (
              <StatusBadge status={control.gapSeverity} />
            )}
          </div>
          <p className="text-sm mb-3">{control.gapDescription}</p>
          {control.remediationAction && (
            <div className="mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">Remediation Action:</span>
              <p className="text-sm mt-1">{control.remediationAction}</p>
            </div>
          )}
        </div>
      )}

      {gapAnalysis && (
        <>
          {renderGapSection("Critical Assessment Gaps", gapAnalysis.criticalGaps, 'destructive')}
          {renderGapSection("High Priority Gaps", gapAnalysis.highGaps, 'warning')}
          {renderGapSection("Medium Priority Gaps", gapAnalysis.mediumGaps, 'warning')}
          {renderGapSection("Low Priority Gaps", gapAnalysis.lowGaps, 'default')}
        </>
      )}
    </div>
  );
}

function ControlRemediation({ control }: { control: ControlCoverageDetail }) {
  const hasRemediation = control.remediationAction || control.remediationOwner || control.remediationStatus;

  if (!hasRemediation) {
    return (
      <div className="text-center py-8">
        <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No remediation plan defined for this control</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Remediation Strategy</h3>
        <div className="space-y-4 text-sm">
          {control.remediationAction ? (
            <div>
              <span className="text-muted-foreground block mb-1">Required Action:</span>
              <p className="text-foreground leading-relaxed italic border-l-2 border-primary pl-3">{control.remediationAction}</p>
            </div>
          ) : (
            <div>
              <span className="text-muted-foreground block mb-1">Required Action:</span>
              <p className="text-muted-foreground italic">No specific action defined yet.</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <span className="text-muted-foreground block text-xs">Owner:</span>
              <p className="font-semibold">{control.remediationOwner || "Unassigned"}</p>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Due Date:</span>
              <p className="font-semibold text-warning">
                {control.remediationDueDate ? new Date(control.remediationDueDate).toLocaleDateString() : "TBD"}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-muted-foreground">Current Status:</span>
            <StatusBadge status={control.remediationStatus || 'pending'} />
          </div>
        </div>
      </div>
    </div>
  );
}
