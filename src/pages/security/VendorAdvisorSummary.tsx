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
  Users,
  Activity,
  AlertTriangle,
  Clock,
  Zap,
  Building,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Server,
  Lock,
  Search,
} from "lucide-react";
import {
  getVendorSummaries,
  getVendorScorecard,
  getVendorStatistics,
} from "@/lib/vendorSecurityQueries";
import type { VendorSummary, VendorScorecard } from "@/types/security";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { FeatureOverviewCharts } from "@/components/security/FeatureOverviewCharts";
import { VendorRiskProfile } from "@/components/security/VendorRiskProfile";

export function VendorAdvisorSummary() {
  const { currentTenant } = useApp();
  const [selectedVendor, setSelectedVendor] = useState<VendorSummary | null>(null);
  const [selectedScorecard, setSelectedScorecard] = useState<VendorScorecard | null>(null);
  const [vendors, setVendors] = useState<VendorSummary[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [vendorTypeFilter, setVendorTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("score");

  // Load vendor data from Supabase
  useEffect(() => {
    async function loadVendorData() {
      try {
        setLoading(true);
        setError(null);

        const [vendorSummariesData, statsData] = await Promise.all([
          getVendorSummaries(currentTenant.id),
          getVendorStatistics(currentTenant.id),
        ]);

        setVendors(vendorSummariesData);
        setStatistics(statsData);
      } catch (err) {
        setError('Failed to load vendor security data');
      } finally {
        setLoading(false);
      }
    }

    loadVendorData();
  }, [currentTenant.id]);

  // Load scorecard when vendor is selected
  useEffect(() => {
    async function loadScorecard() {
      if (!selectedVendor || selectedVendor.systems.length === 0) {
        setSelectedScorecard(null);
        return;
      }

      try {
        const latestSystem = selectedVendor.systems[0];
        const scorecard = await getVendorScorecard(latestSystem.assessment_id);
        setSelectedScorecard(scorecard);
      } catch (err) {
        console.error('Error loading vendor scorecard:', err);
        setSelectedScorecard(null);
      }
    }

    loadScorecard();
  }, [selectedVendor]);

  // Filter and sort vendors
  const filteredAndSortedVendors = useMemo(() => {
    let result = [...vendors];

    // Search
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(v =>
        v.vendor_name.toLowerCase().includes(query) ||
        v.vendor_type.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (vendorTypeFilter !== "all") {
      result = result.filter(v => v.vendor_type === vendorTypeFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "score") return b.average_security_score - a.average_security_score;
      if (sortBy === "risk") return b.average_risk_score - a.average_risk_score;
      if (sortBy === "findings") return b.critical_findings - a.critical_findings;
      if (sortBy === "name") return a.vendor_name.localeCompare(b.vendor_name);
      return 0;
    });

    return result;
  }, [vendors, searchTerm, vendorTypeFilter, sortBy]);

  // Group vendors by company
  const vendorsByCompany = useMemo(() => {
    const grouped: Record<string, VendorSummary[]> = {};

    filteredAndSortedVendors.forEach(vendor => {
      if (!grouped[vendor.vendor_name]) {
        grouped[vendor.vendor_name] = [];
      }
      grouped[vendor.vendor_name].push(vendor);
    });

    return grouped;
  }, [filteredAndSortedVendors]);

  const tabs = selectedVendor ? [
    {
      id: "overview",
      label: "Overview",
      content: <VendorOverview vendor={selectedVendor} scorecard={selectedScorecard} />,
    },
    {
      id: "systems",
      label: "Systems",
      content: <VendorSystems vendor={selectedVendor} />,
    },
    {
      id: "findings",
      label: "Security Findings",
      content: <VendorFindings scorecard={selectedScorecard} />,
    },
  ] : [
    {
      id: "overview",
      label: "Overview",
      content: <VendorsOverview vendors={vendors} stats={statistics} />,
    },
  ];

  if (loading) {
    return <LoadingState loadingText="Loading vendor security assessments..." />;
  }

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane
        title="Vendors"
        context="DEWA – Transmission"
        count={filteredAndSortedVendors.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "type", label: "Vendor Type", value: vendorTypeFilter, options: [
              { label: "All Types", value: "all" },
              { label: "Critical Systems", value: "critical-systems" },
              { label: "Software Provider", value: "software-provider" },
              { label: "Managed Services", value: "managed-services" },
              { label: "Infrastructure", value: "infrastructure" },
              { label: "Cloud Provider", value: "cloud-provider" },
              { label: "Security Advisor", value: "security-advisor" },
            ], onChange: setVendorTypeFilter
          }
        ]}
        sortOptions={[
          { label: "Security Score", value: "score" },
          { label: "Risk Score", value: "risk" },
          { label: "Critical Findings", value: "findings" },
          { label: "Vendor Name", value: "name" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-4">
          {filteredAndSortedVendors.length === 0 ? (
            <EmptyState
              icon={Building}
              title="No Vendors Found"
              description="No vendors match the selected filters"
            />
          ) : (
            Object.entries(vendorsByCompany).map(([company, companyVendors]) => (
              <div key={company} className="mb-4">
                <div className="flex items-center gap-2 mb-2 px-2 text-[10px] bg-secondary p-1 rounded font-medium uppercase tracking-wider text-muted-foreground/70">
                  <Building className="w-3 h-3 text-primary shrink-0" />
                  <span className="truncate">{company}</span>
                </div>
                <div className="space-y-1">
                  {companyVendors.map((vendor) => {
                    const securityStatus = vendor.average_security_score >= 80 ? 'secure' : vendor.average_security_score >= 60 ? 'at-risk' : 'vulnerable';
                    return (
                      <ListPaneItem
                        key={vendor.vendor_name}
                        title={vendor.vendor_name}
                        description={vendor.vendor_type.replace('-', ' ')}
                        status={securityStatus === 'secure' ? 'online' : (securityStatus === 'at-risk' ? 'maintenance' : 'offline')}
                        category={vendor.trust_level}
                        value={`${vendor.average_security_score.toFixed(0)}%`}
                        isSelected={selectedVendor?.vendor_name === vendor.vendor_name}
                        onClick={() => setSelectedVendor(vendor)}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedVendor ? selectedVendor.vendor_name : "Vendor Security Advisor"}
        subtitle={
          selectedVendor
            ? `${selectedVendor.vendor_type.replace('-', ' ')} • Assessment for ${selectedVendor.systems.length} mission-critical systems`
            : "Strategic oversight of third-party cybersecurity and supply chain continuity"
        }
        tabs={tabs}
      />
    </div>
  );
}

function VendorsOverview({ vendors, stats }: { vendors: VendorSummary[]; stats: any }) {
  const overviewMetrics = [
    {
      title: "Supply Chain Resilience",
      value: `${stats?.averageSecurityScore || 0}%`,
      subtitle: "Fleet-wide posture",
      icon: Shield,
      variant: "primary" as any
    },
    {
      title: "Total Risk Exposure",
      value: `${stats?.averageRiskScore || 0}%`,
      subtitle: "Active systemic risk",
      icon: Activity,
      variant: stats?.averageRiskScore < 50 ? "success" : "warning" as any
    },
    {
      title: "Unresolved Findings",
      value: stats?.totalCriticalFindings || 0,
      subtitle: "Critical supply chain issues",
      icon: AlertCircle,
      variant: stats?.totalCriticalFindings === 0 ? "success" : "destructive" as any
    },
    {
      title: "Assessed Partners",
      value: stats?.totalVendors || 0,
      subtitle: `${stats?.totalAssessments || 0} active assessments`,
      icon: Building,
      variant: "primary" as any
    }
  ];

  const pieChartData = [
    { name: "Trusted", value: vendors.filter(v => v.trust_level === 'trusted').length, color: "hsl(var(--success))" },
    { name: "Conditional", value: vendors.filter(v => v.trust_level === 'conditional').length, color: "hsl(var(--warning))" },
    { name: "Untrusted", value: vendors.filter(v => v.trust_level === 'untrusted').length, color: "hsl(var(--destructive))" },
  ];

  const barChartData = vendors
    .sort((a, b) => b.average_security_score - a.average_security_score)
    .slice(0, 5)
    .map(v => ({
      name: v.vendor_name,
      value: Math.round(v.average_security_score)
    }));

  const keyAreas = [
    {
      icon: Server,
      title: "OEM Infrastructure",
      description: "Monitoring security integrity of critical protection relays and RTU manufacturers."
    },
    {
      icon: Lock,
      title: "Software Supply Chain",
      description: "Validating secure development lifecycles for SCADA and HMI software vendors."
    },
    {
      icon: Search,
      title: "Assurance & Audit",
      description: "Continuous review of SOC2, ISO 27001 and IEC 62443 vendor certifications."
    },
    {
      icon: Users,
      title: "Managed Services",
      description: "Overseeing privileged access for remote maintenance and support providers."
    }
  ];

  const attentionRequired = vendors
    .filter(v => v.critical_findings > 0 || v.average_security_score < 70)
    .sort((a, b) => b.critical_findings - a.critical_findings)
    .slice(0, 5)
    .map(v => ({
      id: v.vendor_name,
      title: v.vendor_name,
      subtitle: v.vendor_type.replace('-', ' '),
      status: v.critical_findings > 0 ? 'error' : 'warning' as any,
      value: `${Math.round(v.average_security_score)}%`
    }));

  return (
    <IdentityOverview
      title="Third-Party Risk Overview"
      description="Strategic oversight of vendor cybersecurity and strategic supply chain resiliency"
      metrics={overviewMetrics}
      showTitleCard={false}
    >
      <FeatureOverviewCharts
        pieChartTitle="Vendor Trust Profile"
        pieChartData={pieChartData}
        pieChartIcon={ShieldCheck}
        barChartTitle="Top Secure Partners"
        barChartData={barChartData}
        barChartIcon={Activity}
        keyAreas={keyAreas}
        recentActivity={attentionRequired}
        recentActivityTitle="Vendors Requiring Attention"
      />
    </IdentityOverview>
  );
}

function VendorOverview({ vendor, scorecard }: { vendor: VendorSummary; scorecard: VendorScorecard | null }) {
  const overviewMetrics = [
    {
      title: "Security Score",
      value: `${vendor.average_security_score.toFixed(0)}%`,
      subtitle: "Aggregated health",
      icon: Shield,
      variant: vendor.average_security_score >= 80 ? "success" : vendor.average_security_score >= 60 ? "warning" : "destructive" as any
    },
    {
      title: "Risk Score",
      value: `${vendor.average_risk_score.toFixed(0)}%`,
      subtitle: "Current exposure",
      icon: AlertTriangle,
      variant: vendor.average_risk_score < 30 ? "success" : vendor.average_risk_score < 50 ? "warning" : "destructive" as any
    },
    {
      title: "Critical Findings",
      value: vendor.critical_findings,
      subtitle: `${vendor.open_findings} unresolved`,
      icon: AlertCircle,
      variant: vendor.critical_findings === 0 ? "success" : "destructive" as any
    },
    {
      title: "Trust Level",
      value: vendor.trust_level || 'Unknown',
      subtitle: "Certification status",
      icon: CheckCircle,
      variant: vendor.trust_level === 'trusted' ? "success" : vendor.trust_level === 'conditional' ? "warning" : "destructive" as any
    }
  ];

  const keyAreas = [
    {
      icon: Building,
      title: "Vendor Profile",
      description: `${vendor.vendor_name} is a ${vendor.vendor_type.replace('-', ' ')} provider with ${vendor.systems.length} systems in use.`
    },
    {
      icon: Clock,
      title: "Assessment Lifecycle",
      description: `Latest review: ${vendor.latest_assessment_date ? new Date(vendor.latest_assessment_date).toLocaleDateString() : 'N/A'}. Next: ${vendor.next_assessment_date ? new Date(vendor.next_assessment_date).toLocaleDateString() : 'TBD'}.`
    }
  ];

  const systemActivity = vendor.systems.map(s => ({
    id: s.system_name,
    title: s.system_name,
    subtitle: s.system_type?.replace('-', ' ') || 'System',
    status: s.status === 'approved' ? 'success' : 'warning' as any,
    value: `${Math.round(s.security_score)}%`
  }));

  return (
    <IdentityOverview
      title={`${vendor.vendor_name} Security Profile`}
      description={`Supply chain assessment and risk scorecard for ${vendor.vendor_name}`}
      metrics={overviewMetrics}
      showTitleCard={false}
    >
      <div className="space-y-6">
        <VendorRiskProfile vendor={vendor} scorecard={scorecard} />
      </div>
    </IdentityOverview>
  );
}

function VendorSystems({ vendor }: { vendor: VendorSummary }) {
  if (vendor.systems.length === 0) {
    return (
      <EmptyState
        icon={Building}
        title="No Systems Found"
        description="No systems have been assessed for this vendor."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {vendor.systems.map((system) => (
          <div key={system.system_name} className="bg-card border border-border rounded-lg p-5 hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold">{system.system_name}</h4>
                <p className="text-xs text-muted-foreground uppercase tracking-tight mt-0.5 font-medium">
                  {system.system_type?.replace('-', ' ') || 'Unknown Type'} • {system.system_criticality.replace('-', ' ')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={system.status === 'approved' ? 'online' : 'pending'} />
                {system.system_criticality === 'safety-critical' && (
                  <Zap className="w-3.5 h-3.5 text-destructive animate-pulse" />
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 pt-4 border-t border-border">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Security Score</span>
                <p className="text-lg font-bold text-success">{system.security_score.toFixed(0)}%</p>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Risk Score</span>
                <p className="text-lg font-bold text-warning">{system.risk_score.toFixed(0)}%</p>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Last Assessment</span>
                <p className="text-sm font-medium">{new Date(system.assessment_date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VendorFindings({ scorecard }: { scorecard: VendorScorecard | null }) {
  if (!scorecard || scorecard.findings.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle}
        title="Clean Scorecard"
        description="No security findings have been identified for this vendor's systems."
      />
    );
  }

  const openFindings = scorecard.findings.filter(f => f.remediation_status !== 'resolved');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FindingStat label="Total Items" count={scorecard.findings.length} />
        <FindingStat label="Open Issues" count={openFindings.length} color="text-warning" />
        <FindingStat label="Resolved" count={scorecard.findings.length - openFindings.length} color="text-success" />
        <FindingStat label="Remediation Rate" count={`${scorecard.metrics.remediation_rate}%`} color="text-primary" />
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="data-table">
          <thead className="bg-secondary/30">
            <tr>
              <th>Finding Title</th>
              <th>Category</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {scorecard.findings.map((finding) => (
              <tr key={finding.id} className="hover:bg-secondary/10 transition-colors">
                <td>
                  <div className="font-medium text-sm">{finding.finding_title}</div>
                  <div className="text-[11px] text-muted-foreground line-clamp-1 italic">
                    {finding.finding_description}
                  </div>
                </td>
                <td className="text-xs text-muted-foreground capitalize">
                  {finding.finding_category.replace('-', ' ')}
                </td>
                <td>
                  <StatusBadge status={finding.severity === 'critical' || finding.severity === 'high' ? 'offline' : 'online'} />
                </td>
                <td className="text-xs font-medium uppercase truncate max-w-[100px]">
                  {finding.remediation_status.replace('-', ' ')}
                </td>
                <td className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {finding.remediation_due_date ? new Date(finding.remediation_due_date).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FindingStat({ label, count, color }: { label: string; count: string | number; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-center">
      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color || ''}`}>{count}</p>
    </div>
  );
}