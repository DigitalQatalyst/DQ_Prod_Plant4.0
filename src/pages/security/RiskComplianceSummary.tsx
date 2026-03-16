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
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  FileCheck,
  Activity,
  Target,
  AlertCircle,
  ShieldCheck,
  Zap,
  Lock,
  Globe,
  Dna,
} from "lucide-react";
import {
  getComplianceStandardStatusBySummary,
  getRiskComplianceTrendsByTenant,
  getRiskComplianceSummariesByTenant,
  type RiskComplianceSummary as RiskComplianceSummaryType,
  type ComplianceStandardStatus,
  type RiskComplianceTrend,
} from "@/lib/riskComplianceQueries";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { FeatureOverviewCharts } from "@/components/security/FeatureOverviewCharts";

export function RiskComplianceSummary() {
  const { currentTenant } = useApp();

  const [summaries, setSummaries] = useState<RiskComplianceSummaryType[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<RiskComplianceSummaryType | null>(null);
  const [standards, setStandards] = useState<ComplianceStandardStatus[]>([]);
  const [trends, setTrends] = useState<RiskComplianceTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  // Fetch all summaries for the tenant
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const { data: summariesData, error: summariesError } = await getRiskComplianceSummariesByTenant(currentTenant.id);

        if (summariesError) {
          throw new Error(`Failed to fetch summaries: ${summariesError.message}`);
        }

        setSummaries(summariesData || []);

        // Fetch trends
        const { data: trendsData, error: trendsError } = await getRiskComplianceTrendsByTenant(currentTenant.id);

        if (trendsError) {
          console.error('Error fetching trends:', trendsError);
        } else {
          setTrends(trendsData || []);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentTenant.id]);

  // Fetch standards when a summary is selected
  useEffect(() => {
    async function fetchStandards() {
      if (!selectedSummary) {
        setStandards([]);
        return;
      }

      try {
        const { data: standardsData, error: standardsError } = await getComplianceStandardStatusBySummary(selectedSummary.id);
        if (standardsError) {
          console.error('Error fetching standards:', standardsError);
        } else {
          setStandards(standardsData || []);
        }
      } catch (err) {
        console.error('Error in fetchStandards:', err);
      }
    }

    fetchStandards();
  }, [selectedSummary]);

  // Calculate statistics
  const currentStats = useMemo(() => {
    const summaryObj = selectedSummary || (summaries.length > 0 ? summaries[0] : null);
    if (!summaryObj) return null;

    return {
      risk: {
        total: summaryObj.total_risks,
        high: summaryObj.high_risks,
        critical: summaryObj.critical_risks,
        treated: summaryObj.mitigated_risks,
        avgScore: Math.round(summaryObj.overall_risk_score),
        trend: summaryObj.risk_trend,
      },
      compliance: {
        total: summaryObj.total_standards,
        compliant: summaryObj.compliant_standards,
        avgScore: Math.round(summaryObj.overall_compliance_score),
        trend: summaryObj.compliance_trend,
      },
      assets: {
        total: summaryObj.total_assets,
        critical: summaryObj.critical_assets,
        vulnerable: summaryObj.vulnerable_assets,
        secure: summaryObj.secure_assets,
      }
    };
  }, [selectedSummary, summaries]);

  // Filter and sort summaries
  const filteredAndSortedSummaries = useMemo(() => {
    let result = [...summaries];

    // Search
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.summary_name.toLowerCase().includes(query) ||
        (s.executive_summary || '').toLowerCase().includes(query)
      );
    }

    // Status Filter
    if (statusFilter !== "all") {
      result = result.filter(s => {
        const mappedStatus = s.status === 'published' ? 'online' : (s.status === 'in-review' ? 'maintenance' : 'offline');
        return mappedStatus === statusFilter;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.summary_date).getTime() - new Date(a.summary_date).getTime();
      }
      if (sortBy === "name") {
        return a.summary_name.localeCompare(b.summary_name);
      }
      if (sortBy === "risk") {
        return b.overall_risk_score - a.overall_risk_score;
      }
      if (sortBy === "compliance") {
        return b.overall_compliance_score - a.overall_compliance_score;
      }
      return 0;
    });

    return result;
  }, [summaries, searchTerm, statusFilter, sortBy]);

  const tabs = selectedSummary ? [
    {
      id: "overview",
      label: "Overview",
      content: (
        <RiskComplianceOverview
          summary={selectedSummary}
          stats={currentStats}
          standards={standards}
        />
      ),
    },
    {
      id: "distribution",
      label: "Risk Distribution",
      content: <RiskDistribution summary={selectedSummary} />,
    },
    {
      id: "trends",
      label: "History",
      content: <ComplianceTrends summary={selectedSummary} trends={trends} />,
    },
  ] : [
    {
      id: "overview",
      label: "Overview",
      content: <RiskComplianceGlobalOverview summaries={summaries} trends={trends} />,
    },
  ];

  if (loading) {
    return <LoadingState loadingText="Loading risk compliance summary..." />;
  }

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane
        title="Risk & Compliance"
        context="DEWA – Transmission"
        count={filteredAndSortedSummaries.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "all", label: "All Statuses" },
              { value: "online", label: "Published" },
              { value: "maintenance", label: "In Review" },
              { value: "offline", label: "Draft" },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
        ]}
        sortOptions={[
          { label: "Date (Newest)", value: "date" },
          { label: "Report Name", value: "name" },
          { label: "Risk Score", value: "risk" },
          { label: "Compliance Score", value: "compliance" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedSummaries.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title="No Summaries Found"
              description="No data available for this tenant."
            />
          ) : (
            filteredAndSortedSummaries.map((s) => (
              <ListPaneItem
                key={s.id}
                title={s.summary_name}
                description={s.summary_type.charAt(0).toUpperCase() + s.summary_type.slice(1) + " Summary"}
                status={s.status === 'published' ? 'online' : (s.status === 'in-review' ? 'maintenance' : 'offline')}
                category={`Risk: ${Math.round(s.overall_risk_score)}`}
                value={
                  <div className="flex flex-col items-end">
                    <span className="text-[13px] font-bold text-success">{Math.round(s.overall_compliance_score)}%</span>
                    <span className="text-[10px] text-muted-foreground font-normal">{new Date(s.summary_date).toLocaleDateString()}</span>
                  </div>
                }
                isSelected={selectedSummary?.id === s.id}
                onClick={() => setSelectedSummary(s)}
              />
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedSummary ? selectedSummary.summary_name : "Security Posture Overview"}
        subtitle={
          selectedSummary
            ? `${new Date(selectedSummary.reporting_period_start).toLocaleDateString()} - ${new Date(selectedSummary.reporting_period_end).toLocaleDateString()}`
            : `Aggregate risk and compliance benchmarks for ${currentTenant.name}`
        }
        tabs={tabs}
      />
    </div>
  );
}

function RiskComplianceGlobalOverview({ summaries, trends }: { summaries: RiskComplianceSummaryType[]; trends: RiskComplianceTrend[] }) {
  if (summaries.length === 0) {
    return (
      <EmptyState
        icon={Shield}
        title="No Data Available"
        description="Complete an assessment to see your security posture here."
      />
    );
  }

  const latest = summaries[0];
  const avgCompliance = Math.round(summaries.reduce((acc, s) => acc + s.overall_compliance_score, 0) / summaries.length);

  const overviewMetrics = [
    {
      title: "Avg Compliance",
      value: `${avgCompliance}%`,
      subtitle: `${summaries.length} assessments`,
      icon: FileCheck,
      variant: "primary" as any
    },
    {
      title: "Latest Risk",
      value: Math.round(latest.overall_risk_score),
      subtitle: `${latest.critical_risks} critical risks`,
      icon: AlertTriangle,
      variant: latest.overall_risk_score >= 70 ? "destructive" : latest.overall_risk_score >= 40 ? "warning" : "success" as any
    },
    {
      title: "Asset Posture",
      value: latest.total_assets > 0
        ? `${Math.round((latest.secure_assets / latest.total_assets) * 100)}%`
        : "N/A",
      subtitle: `${latest.secure_assets} secure assets`,
      icon: Shield,
      variant: "success" as any
    },
    {
      title: "Compliance Trend",
      value: latest.compliance_trend,
      subtitle: "Recent movement",
      icon: TrendingUp,
      variant: latest.compliance_trend === 'improving' ? 'success' : 'destructive' as any
    }
  ];

  const pieChartData = [
    { name: "Compliant", value: latest.compliant_standards, color: "hsl(var(--success))" },
    { name: "Non-Compliant", value: latest.total_standards - latest.compliant_standards, color: "hsl(var(--destructive))" },
  ];

  const barChartData = [
    { name: "IEC 62443", value: Math.round(latest.iec_62443_score) },
    { name: "NERC CIP", value: Math.round(latest.nerc_cip_score) },
    { name: "NIST CSF", value: 85 }, // Placeholder
    { name: "ISO 27001", value: 72 }, // Placeholder
  ];

  const keyAreas = [
    {
      icon: Globe,
      title: "Standards Coverage",
      description: "Managing alignment with international and regional power grid security standards."
    },
    {
      icon: Target,
      title: "Risk Objectives",
      description: "Reducing mean risk score across critical transmission substations."
    },
    {
      icon: Activity,
      title: "Monitoring Health",
      description: "Ensuring 100% visibility into RTU and PLC security events."
    },
    {
      icon: Lock,
      title: "Defense in Depth",
      description: "Validating multi-layered protection strategy for OT infrastructure."
    }
  ];

  const activity = summaries.slice(0, 5).map(s => ({
    id: s.id,
    title: s.summary_name,
    subtitle: new Date(s.summary_date).toLocaleDateString(),
    status: s.status === 'approved' ? 'success' : 'warning' as any,
    value: `${Math.round(s.overall_compliance_score)}%`
  }));

  return (
    <IdentityOverview
      title="Global Risk & Compliance"
      description="Aggregate security metrics and compliance benchmarks for the power grid"
      metrics={overviewMetrics}
      showTitleCard={false}
    >
      <FeatureOverviewCharts
        pieChartTitle="Standards Progress"
        pieChartData={pieChartData}
        pieChartIcon={ShieldCheck}
        barChartTitle="Framework Benchmarks"
        barChartData={barChartData}
        barChartIcon={Activity}
        keyAreas={keyAreas}
        recentActivity={activity}
        recentActivityTitle="Recent Assessments"
      />
    </IdentityOverview>
  );
}

function RiskComplianceOverview({
  summary,
  stats,
  standards,
}: {
  summary: RiskComplianceSummaryType;
  stats: any;
  standards: ComplianceStandardStatus[];
}) {
  if (!stats) return null;

  const overviewMetrics = [
    {
      title: "Risk Score",
      value: stats.risk.avgScore,
      subtitle: `${stats.risk.critical} critical`,
      icon: AlertTriangle,
      variant: stats.risk.avgScore >= 70 ? "destructive" : stats.risk.avgScore >= 40 ? "warning" : "success" as any
    },
    {
      title: "Compliance",
      value: `${stats.compliance.avgScore}%`,
      subtitle: `${stats.compliance.compliant}/${stats.compliance.total} standards`,
      icon: CheckCircle2,
      variant: "success" as any
    },
    {
      title: "Mitigation",
      value: stats.risk.total > 0
        ? `${Math.round((stats.risk.treated / stats.risk.total) * 100)}%`
        : "0%",
      subtitle: `${stats.risk.treated} treated`,
      icon: Shield,
      variant: "primary" as any
    },
    {
      title: "Asset Health",
      value: stats.assets.total > 0
        ? `${Math.round((stats.assets.secure / stats.assets.total) * 100)}%`
        : "N/A",
      subtitle: `${stats.assets.secure} secure`,
      icon: Target,
      variant: "primary" as any
    }
  ];

  const barChartData = standards.map(std => ({
    name: std.standard_name,
    value: Math.round(std.compliance_score)
  }));

  const keyAreas = (summary.key_findings && summary.key_findings.length > 0)
    ? summary.key_findings.slice(0, 4).map(finding => ({
      icon: ShieldCheck,
      title: "Key Finding",
      description: finding
    }))
    : [
      { icon: Zap, title: "Risk Mitigation", description: "Continuing focus on critical infrastructure protection." },
      { icon: Lock, title: "Access Control", description: "Standardizing MFA across all transmission zones." },
      { icon: Globe, title: "Network Visibility", description: "Monitoring external exposure for cloud assets." }
    ];

  const recommendations = (summary.recommendations && summary.recommendations.length > 0)
    ? summary.recommendations.map((rec, i) => ({
      id: `rec-${i}`,
      title: rec,
      status: 'info' as any,
      value: 'ACTION'
    }))
    : [
      { id: 'rec-1', title: 'Conduct quarterly audit of IEC 62443 compliance', status: 'warning' as any, value: 'PLAN' },
      { id: 'rec-2', title: 'Verify SCADA system patch levels in all regional hubs', status: 'info' as any, value: 'SCHEDULE' }
    ];

  return (
    <IdentityOverview
      title={summary.summary_name}
      description={summary.executive_summary || "Assessment summary and recommendations"}
      metrics={overviewMetrics}
      showTitleCard={false}
    >
      <FeatureOverviewCharts
        pieChartTitle="Asset Risk Status"
        pieChartData={[
          { name: "Secure", value: stats.assets.secure, color: "hsl(var(--success))" },
          { name: "Vulnerable", value: stats.assets.vulnerable, color: "hsl(var(--destructive))" },
          { name: "At Risk", value: Math.max(0, stats.assets.total - stats.assets.secure - stats.assets.vulnerable), color: "hsl(var(--warning))" },
        ]}
        pieChartIcon={Shield}
        barChartTitle="Standard Alignment"
        barChartData={barChartData}
        barChartIcon={Activity}
        keyAreas={keyAreas}
        recentActivity={recommendations}
        recentActivityTitle="Key Recommendations"
      />
    </IdentityOverview>
  );
}

function RiskDistribution({ summary }: { summary: RiskComplianceSummaryType }) {
  const categories = [
    { name: 'Switching Manipulation', value: 85 },
    { name: 'Relay Tampering', value: 42 },
    { name: 'SCADA Compromise', value: 68 },
    { name: 'Protocol Abuse', value: 35 },
    { name: 'Unauthorized Access', value: 82 },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          Transmission Risk Profile
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat) => (
            <div key={cat.name} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{cat.name}</span>
                <span className={cat.value >= 70 ? "text-destructive" : cat.value >= 40 ? "text-warning" : "text-success"}>
                  Score: {cat.value}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${cat.value >= 70 ? "bg-destructive" : cat.value >= 40 ? "bg-warning" : "bg-success"}`}
                  style={{ width: `${cat.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-sm font-semibold mb-4">Risk Severity</h3>
          <div className="space-y-4">
            <SeverityItem label="Critical" count={summary.critical_risks} total={summary.total_risks} color="bg-destructive" />
            <SeverityItem label="High" count={summary.high_risks} total={summary.total_risks} color="bg-warning" />
            <SeverityItem label="Medium" count={summary.medium_risks} total={summary.total_risks} color="bg-yellow-500" />
            <SeverityItem label="Low" count={summary.low_risks} total={summary.total_risks} color="bg-success" />
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-sm font-semibold mb-4">Mitigation Progress</h3>
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-4xl font-bold text-primary">
              {Math.round((summary.mitigated_risks / summary.total_risks) * 100)}%
            </div>
            <p className="text-sm text-muted-foreground mt-2">Risks Mitigated</p>
            <p className="text-xs text-muted-foreground mt-4 italic text-center">
              Maintaining target mitigation rate within regional security threshold.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SeverityItem({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percent = Math.round((count / Math.max(total, 1)) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground font-medium uppercase">{label}</span>
        <span className="font-bold">{count} ({percent}%)</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function ComplianceTrends({ summary, trends }: { summary: RiskComplianceSummaryType; trends: RiskComplianceTrend[] }) {
  const summaryDate = new Date(summary.summary_date);

  const complianceTrend = trends
    .filter(t => t.metric_category === 'compliance' && new Date(t.trend_date) <= summaryDate)
    .sort((a, b) => new Date(b.trend_date).getTime() - new Date(a.trend_date).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6 text-sm">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-semibold mb-6">Historical Compliance Benchmarks</h3>
        <div className="space-y-4">
          {complianceTrend.map((t) => (
            <div key={t.id} className="p-4 bg-secondary/10 border border-border/50 rounded-lg hover:bg-secondary/20 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-foreground">{new Date(t.trend_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{Math.round(t.metric_value)}%</span>
                  <StatusBadge status={t.status} />
                </div>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${t.metric_value}%` }}
                />
              </div>
            </div>
          ))}
          {complianceTrend.length === 0 && (
            <p className="text-center text-muted-foreground py-4 italic">No historical trend data available.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <StandardCard name="IEC 62443" score={summary.iec_62443_score} />
        <StandardCard name="NERC CIP" score={summary.nerc_cip_score} />
      </div>
    </div>
  );
}

function StandardCard({ name, score }: { name: string; score: number }) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="font-bold mb-1">{name}</h3>
      <p className="text-xs text-muted-foreground mb-4 font-medium uppercase tracking-tight">Standard Maturity</p>
      <div className="flex items-center gap-4">
        <div className="text-3xl font-bold">{Math.round(score)}%</div>
        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${score}%` }} />
        </div>
      </div>
    </div>
  );
}