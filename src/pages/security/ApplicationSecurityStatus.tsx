import { useState, useMemo, useEffect } from "react";
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
  XCircle,
  Activity,
  FileText,
  Clock,
  Settings,
  Search,
  Bug,
  Code,
  Container,
  Database,
  Zap,
  Loader2,
  Monitor,
  Wrench,
  Globe,
  Server,
  Network,
} from "lucide-react";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { FeatureOverviewCharts } from "@/components/security/FeatureOverviewCharts";
import type { KeyArea, RecentActivity } from "@/components/security/FeatureOverviewCharts";
import {
  getApplicationSecurityScans,
  type ApplicationSecurityScan
} from "@/lib/applicationSecurityQueries";

export function ApplicationSecurityStatus() {
  const { currentTenant } = useApp();
  const [scans, setScans] = useState<ApplicationSecurityScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScan, setSelectedScan] = useState<ApplicationSecurityScan | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [scanTypeFilter, setScanTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("risk");

  const setSelectedScanId = (id: string) => {
    const scan = scans.find(s => s.id === id);
    if (scan) {
      setSelectedScan(scan);
    }
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = scans.length;
    const criticalScans = scans.filter(s => s.overallRiskLevel === 'critical').length;
    const totalFindings = scans.reduce((sum, s) => sum + s.totalFindings, 0);
    const criticalFindings = scans.reduce((sum, s) => sum + s.criticalFindings, 0);
    const avgScore = total > 0
      ? Math.round(scans.reduce((sum, s) => sum + (s.securityScore || 0), 0) / total)
      : 0;

    return { total, criticalScans, totalFindings, criticalFindings, avgScore };
  }, [scans]);

  // Fetch scans from Supabase
  useEffect(() => {
    async function fetchScans() {
      try {
        setLoading(true);
        setError(null);
        const data = await getApplicationSecurityScans(currentTenant.id);
        setScans(data);
        setScans(data);
        // Removed auto-selection to show overview by default
        /*
        if (data.length > 0 && !selectedScan) {
          setSelectedScan(data[0]);
        }
        */
      } catch (err) {
        console.error('Error fetching application security scans:', err);
        setError('Failed to load application security scans');
      } finally {
        setLoading(false);
      }
    }

    fetchScans();
  }, [currentTenant.id]);

  // Filter and sort scans
  const filteredAndSortedScans = useMemo(() => {
    let result = scans.filter(scan => {
      const matchesSearch = scan.applicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (scan.applicationDescription?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      const matchesType = scanTypeFilter === "all" || scan.scanType === scanTypeFilter;
      const matchesStatus = statusFilter === "all" || scan.scanStatus === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === "risk") {
        const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return (riskOrder[a.overallRiskLevel as keyof typeof riskOrder] || 4) - (riskOrder[b.overallRiskLevel as keyof typeof riskOrder] || 4);
      }
      if (sortBy === "findings") return b.totalFindings - a.totalFindings;
      if (sortBy === "date") return new Date(b.scanCompletedAt || 0).getTime() - new Date(a.scanCompletedAt || 0).getTime();
      if (sortBy === "name") return a.applicationName.localeCompare(b.applicationName);
      return 0;
    });

    return result;
  }, [scans, searchTerm, scanTypeFilter, statusFilter, sortBy]);

  const getScanTypeIcon = (type: string) => {
    switch (type) {
      case "sast":
        return <Code className="w-4 h-4 text-blue-500" />;
      case "dast":
        return <Search className="w-4 h-4 text-green-500" />;
      case "sca":
      case "dependency_scan":
        return <Database className="w-4 h-4 text-purple-500" />;
      case "container_scan":
        return <Container className="w-4 h-4 text-orange-500" />;
      case "penetration_test":
        return <Settings className="w-4 h-4 text-gray-500" />;
      default:
        return <Bug className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "running":
        return <Activity className="w-4 h-4 text-blue-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (scan: ApplicationSecurityScan) => {
    if (scan.criticalFindings > 0) return "text-destructive";
    if (scan.highFindings > 3) return "text-orange-500";
    if (scan.highFindings > 0 || scan.mediumFindings > 10) return "text-warning";
    return "text-success";
  };

  // Handle loading state
  if (loading) {
    return (
      <>
        <ListPane
          title="AppSec Status"
          context="DEWA – Transmission"
          count={0}
        >
          <div className="p-4 flex flex-col items-center justify-center opacity-50 h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-sm font-medium">Loading security scans...</p>
          </div>
        </ListPane>
        <WorkPane title="Application Security Status" subtitle="Loading..." tabs={[]} />
      </>
    );
  }

  // Handle error state
  if (error) {
    return (
      <>
        <ListPane
          title="Application Security Status"
          subtitle={`${currentTenant.name} - Power Transmission`}
          showFilters={false}
        >
          <div className="p-4 text-center">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-destructive">{error}</p>
          </div>
        </ListPane>
        <WorkPane title="Application Security Status" subtitle="Error" tabs={[]} />
      </>
    );
  }

  // Handle empty data case
  if (!scans || scans.length === 0) {
    return (
      <>
        <ListPane
          title="Application Security Status"
          subtitle={`${currentTenant.name} - Power Transmission`}
          showFilters={false}
        >
          <div className="p-4 text-center text-muted-foreground">
            No security scans available
          </div>
        </ListPane>
        <WorkPane title="Application Security Status" subtitle="No data available" tabs={[]} />
      </>
    );
  }



  const tabs = selectedScan ? [
    {
      id: "overview",
      label: "Overview",
      content: <OverviewTab scan={selectedScan} />,
    },
    {
      id: "vulnerabilities",
      label: "Vulnerabilities",
      content: <VulnerabilitiesTab scan={selectedScan} />,
    },
    {
      id: "findings",
      label: "Findings",
      content: <FindingsTab scan={selectedScan} />,
    },
    {
      id: "remediation",
      label: "Remediation",
      content: <RemediationTab scan={selectedScan} />,
    },
    {
      id: "compliance",
      label: "Compliance",
      content: <ComplianceTab scan={selectedScan} />,
    },
  ] : [
    {
      id: "overview",
      label: "Overview",
      content: <AppSecurityOverview scans={scans} onScanSelect={setSelectedScanId} />,
    }
  ];

  return (
    <>
      <ListPane
        title="AppSec Status"
        context="DEWA – Transmission"
        count={filteredAndSortedScans.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "scanType",
            label: "Scan Type",
            value: scanTypeFilter,
            onChange: setScanTypeFilter,
            options: [
              { value: "all", label: "All Scan Types" },
              { value: "sast", label: "SAST" },
              { value: "dast", label: "DAST" },
              { value: "sca", label: "SCA" },
              { value: "container_scan", label: "Container" },
              { value: "penetration_test", label: "Pen Test" },
            ],
          },
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All Status" },
              { value: "completed", label: "Completed" },
              { value: "running", label: "Running" },
              { value: "failed", label: "Failed" },
            ],
          },
        ]}
        sortOptions={[
          { label: "Risk Level", value: "risk" },
          { label: "Total Findings", value: "findings" },
          { label: "Scan Date", value: "date" },
          { label: "App Name", value: "name" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedScans.length === 0 ? (
            <EmptyState
              icon={Bug}
              title="No Scans Found"
              description="No application security scans match your current filters"
            />
          ) : (
            filteredAndSortedScans.map((scan) => (
              <ListPaneItem
                key={scan.id}
                title={scan.applicationName}
                description={`${(scan.scanType || 'unknown').toUpperCase()} • ${scan.scanTool || 'Unknown Tool'}`}
                status={scan.scanStatus === 'completed' ? 'online' : (scan.scanStatus === 'running' ? 'maintenance' : 'offline')}
                category={(scan.applicationType || 'unknown').replace(/_/g, ' ')}
                value={(scan.overallRiskLevel || 'unknown').toUpperCase()}
                isSelected={selectedScan?.id === scan.id}
                onClick={() => setSelectedScan(scan)}
              />
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedScan ? selectedScan.applicationName : "Application Security Overview"}
        subtitle={selectedScan ? `${selectedScan.scanTool || 'Unknown Tool'} • ${(selectedScan.scanType || 'unknown').toUpperCase()}` : "Comprehensive visibility into application security posture, vulnerability trends, and scan results across transmission software assets"}
        tabs={tabs}
      >
        {!selectedScan && (
          <AppSecurityOverview scans={scans} onScanSelect={setSelectedScanId} />
        )}
      </WorkPane>
    </>
  );
}
function AppSecurityOverview({
  scans,
  onScanSelect
}: {
  scans: ApplicationSecurityScan[];
  onScanSelect: (id: string) => void;
}) {
  const summaryStats = useMemo(() => {
    const totalScans = scans.length;
    const totalCriticalFindings = scans.reduce((sum, s) => sum + s.criticalFindings, 0);
    const totalHighFindings = scans.reduce((sum, s) => sum + s.highFindings, 0);
    const totalMediumFindings = scans.reduce((sum, s) => sum + s.mediumFindings, 0);
    const totalLowFindings = scans.reduce((sum, s) => sum + s.lowFindings, 0);
    const totalInfoFindings = scans.reduce((sum, s) => sum + s.infoFindings, 0);

    const criticalScans = scans.filter(s => s.overallRiskLevel === 'critical' || s.criticalFindings > 0).length;
    const avgScore = totalScans > 0 ? scans.reduce((sum, s) => sum + (s.securityScore || 0), 0) / totalScans : 0;

    return {
      totalScans,
      criticalFindings: totalCriticalFindings,
      highFindings: totalHighFindings,
      mediumFindings: totalMediumFindings,
      lowFindings: totalLowFindings,
      infoFindings: totalInfoFindings,
      criticalScans,
      avgScore: Math.round(avgScore),
    };
  }, [scans]);

  return (
    <IdentityOverview
      title="AppSec Posture Overview"
      description="Monitor the security health of transmission system software, from web interfaces to SCADA data collectors."
      showTitleCard={false}
      metrics={[
        {
          title: "Active Applications",
          value: new Set(scans.map(s => s.applicationName)).size,
          icon: Shield,
          variant: 'primary'
        },
        {
          title: "Total Vulnerabilities",
          value: scans.reduce((sum, s) => sum + s.criticalFindings + s.highFindings + s.mediumFindings, 0),
          icon: Bug,
          variant: 'destructive'
        },
        {
          title: "Critical Findings",
          value: scans.reduce((sum, s) => sum + s.criticalFindings, 0),
          icon: AlertTriangle,
          variant: 'destructive'
        },
        {
          title: "Avg. Security Score",
          value: Math.round(scans.reduce((sum, s) => sum + (s.securityScore || 0), 0) / scans.length),
          icon: Activity,
          variant: 'primary'
        }
      ]}
    >
      <FeatureOverviewCharts
        pieChartTitle="Vulnerability Severity"
        pieChartData={[
          { name: 'Critical', value: scans.reduce((sum, s) => sum + s.criticalFindings, 0), color: 'hsl(var(--destructive))' },
          { name: 'High', value: scans.reduce((sum, s) => sum + s.highFindings, 0), color: 'hsl(15 100% 50%)' }, // Assuming orange-500 is 15 100% 50%
          { name: 'Medium', value: scans.reduce((sum, s) => sum + s.mediumFindings, 0), color: 'hsl(var(--warning))' },
          { name: 'Low', value: scans.reduce((sum, s) => sum + s.lowFindings, 0), color: 'hsl(210 100% 50%)' }, // Assuming blue-500 is 210 100% 50%
        ].filter(d => d.value > 0)}
        barChartTitle="Top Vulnerable Apps"
        barChartData={(() => {
          const appVulns = scans.reduce((acc, scan) => {
            acc[scan.applicationName] = (acc[scan.applicationName] || 0) + scan.criticalFindings + scan.highFindings;
            return acc;
          }, {} as Record<string, number>);
          return Object.entries(appVulns)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value]) => ({ name, value }));
        })()}
        keyAreasTitle="AppSec Focus Areas"
        keyAreas={[
          {
            icon: Server,
            title: "SCADA & OT Apps",
            description: "Security assessments of mission-critical control system software and HMI layers."
          },
          {
            icon: Database,
            title: "Data Handlers",
            description: "Vulnerability analysis for data ingestion services and historian interfaces."
          },
          {
            icon: Network,
            title: "API Security",
            description: "Protection for integration points between transmission zones and external systems."
          },
          {
            icon: Shield,
            title: "Container Security",
            description: "Image scanning and runtime protection for containerized transmission services."
          },
        ]}
        recentActivityTitle="Recent Critical Scans"
        recentActivity={scans
          .filter(s => s.criticalFindings > 0)
          .slice(0, 3)
          .map(scan => ({
            id: scan.id,
            title: scan.applicationName,
            subtitle: `${scan.scanTool} • ${new Date(scan.scanCompletedAt).toLocaleDateString()}`,
            status: 'error',
            value: `${scan.criticalFindings} Critical`
          }))}
        onActivityClick={onScanSelect}
      />
    </IdentityOverview>
  );
}

function OverviewTab({ scan }: { scan: ApplicationSecurityScan }) {
  const totalVulns = scan.totalFindings;
  const criticalAndHigh = scan.criticalFindings + scan.highFindings;
  const scanDuration = scan.scanDurationSeconds
    ? `${Math.floor(scan.scanDurationSeconds / 60)}m ${scan.scanDurationSeconds % 60}s`
    : 'N/A';

  return (
    <div className="space-y-6">
      {/* Scan Information Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{scan.applicationName}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {scan.applicationType.replace('_', ' ')} • Version {scan.applicationVersion || 'N/A'}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg ${scan.scanStatus === "completed" ? "bg-success/10 text-success" :
            scan.scanStatus === "running" ? "bg-blue-500/10 text-blue-500" :
              scan.scanStatus === "failed" ? "bg-destructive/10 text-destructive" :
                "bg-secondary text-muted-foreground"
            }`}>
            <div className="flex items-center gap-2">
              {scan.scanStatus === "completed" ? <CheckCircle2 className="w-5 h-5" /> :
                scan.scanStatus === "running" ? <Activity className="w-5 h-5" /> :
                  scan.scanStatus === "failed" ? <XCircle className="w-5 h-5" /> :
                    <Clock className="w-5 h-5" />}
              <span className="font-medium capitalize">{scan.scanStatus}</span>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Total Vulnerabilities</p>
            <div className="flex items-center justify-between">
              <p className={`text-lg font-semibold ${scan.criticalFindings > 0 ? "text-destructive" :
                scan.highFindings > 3 ? "text-orange-500" :
                  scan.highFindings > 0 || scan.mediumFindings > 10 ? "text-warning" :
                    "text-success"
                }`}>
                {totalVulns}
              </p>
              <Bug className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Critical + High</p>
            <div className="flex items-center justify-between">
              <p className={`text-lg font-semibold ${criticalAndHigh > 0 ? "text-destructive" : "text-success"
                }`}>
                {criticalAndHigh}
              </p>
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Scan Duration</p>
            <p className="text-lg font-semibold">{scanDuration}</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Scanner</p>
            <p className="text-lg font-semibold">{scan.scanTool}</p>
          </div>
        </div>
      </div>

      {/* Vulnerability Breakdown */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary" />
          Vulnerability Breakdown
        </h3>
        <div className="grid grid-cols-5 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-destructive">{scan.criticalFindings}</p>
            <p className="text-xs text-muted-foreground">Critical</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-500">{scan.highFindings}</p>
            <p className="text-xs text-muted-foreground">High</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-warning">{scan.mediumFindings}</p>
            <p className="text-xs text-muted-foreground">Medium</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">{scan.lowFindings}</p>
            <p className="text-xs text-muted-foreground">Low</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-500">{scan.infoFindings}</p>
            <p className="text-xs text-muted-foreground">Info</p>
          </div>
        </div>
      </div>

      {/* Scan Details */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Scan Details
        </h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Scan Type</span>
            <span className="text-sm font-medium uppercase">{scan.scanType.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Environment</span>
            <span className="text-sm font-medium capitalize">{scan.deploymentEnvironment}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Application Type</span>
            <span className="text-sm font-medium">{scan.applicationType.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Triggered By</span>
            <span className="text-sm font-medium">{scan.scanTriggeredBy || 'Manual'}</span>
          </div>
          {scan.linesOfCode && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Lines of Code</span>
              <span className="text-sm font-medium">{scan.linesOfCode.toLocaleString()}</span>
            </div>
          )}
          {scan.codeCoveragePercent && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Code Coverage</span>
              <span className="text-sm font-medium">{scan.codeCoveragePercent}%</span>
            </div>
          )}
          {scan.securityScore && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Security Score</span>
              <span className={`text-sm font-medium ${scan.securityScore >= 80 ? 'text-success' :
                scan.securityScore >= 60 ? 'text-warning' :
                  'text-destructive'
                }`}>
                {scan.securityScore}/100 {scan.securityGrade && `(${scan.securityGrade})`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Transmission Context */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Transmission Context
        </h3>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Application Type</p>
            <div className="flex flex-wrap gap-1">
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                {scan.applicationType === 'scada_hmi' ? 'SCADA HMI' :
                  scan.applicationType === 'data_analytics' ? 'Data Analytics' :
                    scan.applicationType.replace('_', ' ')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className={`w-4 h-4 ${scan.overallRiskLevel === 'critical' || scan.overallRiskLevel === 'high' ? 'text-red-500' : 'text-muted-foreground'}`} />
              <span className="text-xs">Risk Level: {scan.overallRiskLevel}</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 ${scan.deploymentEnvironment === 'production' ? 'text-orange-500' : 'text-muted-foreground'}`} />
              <span className="text-xs">Environment: {scan.deploymentEnvironment}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function VulnerabilitiesTab({ scan }: { scan: ApplicationSecurityScan }) {
  const totalVulns = scan.totalFindings;

  return (
    <div className="space-y-6">
      {/* Vulnerability Summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Vulnerability Summary</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Security vulnerabilities identified in {scan.applicationName}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg ${scan.criticalFindings > 0 ? "bg-destructive/10 text-destructive" :
            scan.highFindings > 3 ? "bg-orange-500/10 text-orange-500" :
              scan.highFindings > 0 || scan.mediumFindings > 10 ? "bg-warning/10 text-warning" :
                "bg-success/10 text-success"
            }`}>
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5" />
              <span className="font-medium">{totalVulns} Total</span>
            </div>
          </div>
        </div>

        {/* Detailed Vulnerability Breakdown */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-destructive">{scan.criticalFindings}</p>
            <p className="text-xs text-muted-foreground mt-1">Critical</p>
            <p className="text-xs text-destructive mt-1">Immediate Action Required</p>
          </div>
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-orange-500">{scan.highFindings}</p>
            <p className="text-xs text-muted-foreground mt-1">High</p>
            <p className="text-xs text-orange-500 mt-1">Priority Remediation</p>
          </div>
          <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-warning">{scan.mediumFindings}</p>
            <p className="text-xs text-muted-foreground mt-1">Medium</p>
            <p className="text-xs text-warning mt-1">Scheduled Fix</p>
          </div>
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-blue-500">{scan.lowFindings}</p>
            <p className="text-xs text-muted-foreground mt-1">Low</p>
            <p className="text-xs text-blue-500 mt-1">Monitor</p>
          </div>
          <div className="bg-gray-500/5 border border-gray-500/20 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-gray-500">{scan.infoFindings}</p>
            <p className="text-xs text-muted-foreground mt-1">Info</p>
            <p className="text-xs text-gray-500 mt-1">Informational</p>
          </div>
        </div>
      </div>

      {/* Vulnerability Categories */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          Vulnerability Categories
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/20 rounded p-3">
            <p className="text-sm font-medium">Injection</p>
            <p className="text-xs text-muted-foreground">
              {scan.injectionVulnerabilities} findings
            </p>
          </div>
          <div className="bg-secondary/20 rounded p-3">
            <p className="text-sm font-medium">Authentication</p>
            <p className="text-xs text-muted-foreground">
              {scan.authenticationVulnerabilities} findings
            </p>
          </div>
          <div className="bg-secondary/20 rounded p-3">
            <p className="text-sm font-medium">Authorization</p>
            <p className="text-xs text-muted-foreground">
              {scan.authorizationVulnerabilities} findings
            </p>
          </div>
          <div className="bg-secondary/20 rounded p-3">
            <p className="text-sm font-medium">Cryptography</p>
            <p className="text-xs text-muted-foreground">
              {scan.cryptographyVulnerabilities} findings
            </p>
          </div>
          <div className="bg-secondary/20 rounded p-3">
            <p className="text-sm font-medium">Configuration</p>
            <p className="text-xs text-muted-foreground">
              {scan.configurationVulnerabilities} findings
            </p>
          </div>
          <div className="bg-secondary/20 rounded p-3">
            <p className="text-sm font-medium">Dependencies</p>
            <p className="text-xs text-muted-foreground">
              {scan.dependencyVulnerabilities} findings
            </p>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary" />
          Risk Assessment
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-secondary/20 rounded">
            <span className="text-sm">Overall Risk Level</span>
            <span className={`text-sm font-medium px-2 py-1 rounded ${scan.overallRiskLevel === 'critical' ? "bg-destructive/10 text-destructive" :
              scan.overallRiskLevel === 'high' ? "bg-orange-500/10 text-orange-500" :
                scan.overallRiskLevel === 'medium' ? "bg-warning/10 text-warning" :
                  "bg-success/10 text-success"
              }`}>
              {scan.overallRiskLevel.toUpperCase()}
            </span>
          </div>
          {scan.exploitabilityScore && (
            <div className="flex items-center justify-between p-3 bg-secondary/20 rounded">
              <span className="text-sm">Exploitability Score</span>
              <span className="text-sm font-medium">
                {scan.exploitabilityScore.toFixed(1)}/10.0
              </span>
            </div>
          )}
          {scan.impactScore && (
            <div className="flex items-center justify-between p-3 bg-secondary/20 rounded">
              <span className="text-sm">Impact Score</span>
              <span className="text-sm font-medium">
                {scan.impactScore.toFixed(1)}/10.0
              </span>
            </div>
          )}
          <div className="flex items-center justify-between p-3 bg-secondary/20 rounded">
            <span className="text-sm">Business Impact</span>
            <span className={`text-sm font-medium ${scan.deploymentEnvironment === 'production' ? "text-red-500" :
              scan.deploymentEnvironment === 'staging' ? "text-orange-500" : "text-blue-500"
              }`}>
              {scan.deploymentEnvironment === 'production' ? "Production Critical" :
                scan.deploymentEnvironment === 'staging' ? "Staging Impact" : "Development"}
            </span>
          </div>
        </div>
      </div>

      {/* Vulnerability Trends */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Vulnerability Trends
        </h3>
        <div className="space-y-2 text-sm">
          {scan.previousSecurityScore && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Previous Score</span>
              <span className="font-medium">
                {scan.previousSecurityScore}/100
              </span>
            </div>
          )}
          {scan.scoreTrend && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Trend</span>
              <span className={`font-medium ${scan.scoreTrend === 'improving' ? 'text-success' :
                scan.scoreTrend === 'declining' ? 'text-destructive' :
                  'text-muted-foreground'
                }`}>
                {scan.scoreTrend === 'improving' ? '↑ Improving' :
                  scan.scoreTrend === 'declining' ? '↓ Declining' :
                    '→ Stable'}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Open Findings</span>
            <span className="font-medium text-warning">
              {scan.findingsOpen} open
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
function FindingsTab({ scan }: { scan: ApplicationSecurityScan }) {
  return (
    <div className="space-y-6">
      {/* Findings Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Security Findings</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Detailed security findings from the {scan.scanType.toUpperCase()} scan
            </p>
          </div>
          <div className="px-4 py-2 rounded-lg bg-primary/10 text-primary">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span className="font-medium">{scan.totalFindings} Findings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Findings Summary by Category */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Bug className="w-4 h-4 text-primary" />
          Findings by Category
        </h3>
        <div className="space-y-3">
          {scan.injectionVulnerabilities > 0 && (
            <div className="bg-card border border-destructive/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">Injection Vulnerabilities</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                      {scan.injectionVulnerabilities} FINDINGS
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    SQL injection, command injection, or other injection flaws detected
                  </p>
                  <p className="text-xs text-destructive">
                    Recommended: Implement input validation and parameterized queries
                  </p>
                </div>
              </div>
            </div>
          )}

          {scan.authenticationVulnerabilities > 0 && (
            <div className="bg-card border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">Authentication Issues</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500">
                      {scan.authenticationVulnerabilities} FINDINGS
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Weak authentication mechanisms or credential management issues
                  </p>
                  <p className="text-xs text-orange-500">
                    Recommended: Implement MFA and strong password policies
                  </p>
                </div>
              </div>
            </div>
          )}

          {scan.authorizationVulnerabilities > 0 && (
            <div className="bg-card border border-warning/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">Authorization Flaws</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                      {scan.authorizationVulnerabilities} FINDINGS
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Improper access control or privilege escalation vulnerabilities
                  </p>
                  <p className="text-xs text-warning">
                    Recommended: Implement role-based access control (RBAC)
                  </p>
                </div>
              </div>
            </div>
          )}

          {scan.cryptographyVulnerabilities > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">Cryptography Issues</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                      {scan.cryptographyVulnerabilities} FINDINGS
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Weak encryption, insecure key management, or deprecated algorithms
                  </p>
                  <p className="text-xs text-blue-500">
                    Recommended: Use modern encryption standards (AES-256, TLS 1.3)
                  </p>
                </div>
              </div>
            </div>
          )}

          {scan.configurationVulnerabilities > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-purple-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">Configuration Problems</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500">
                      {scan.configurationVulnerabilities} FINDINGS
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Insecure default configurations or exposed sensitive information
                  </p>
                  <p className="text-xs text-purple-500">
                    Recommended: Review and harden application configuration
                  </p>
                </div>
              </div>
            </div>
          )}

          {scan.dependencyVulnerabilities > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Database className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">Dependency Vulnerabilities</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                      {scan.dependencyVulnerabilities} FINDINGS
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Vulnerable third-party libraries or outdated dependencies
                  </p>
                  <p className="text-xs text-green-500">
                    Recommended: Update dependencies and monitor for CVEs
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compliance Violations */}
      {(scan.owaspTop10Violations > 0 || scan.cweTop25Violations > 0) && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Compliance Violations
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {scan.owaspTop10Violations > 0 && (
              <div className="bg-secondary/20 rounded p-3">
                <p className="text-sm font-medium">OWASP Top 10</p>
                <p className="text-xs text-muted-foreground">
                  {scan.owaspTop10Violations} violations
                </p>
              </div>
            )}
            {scan.cweTop25Violations > 0 && (
              <div className="bg-secondary/20 rounded p-3">
                <p className="text-sm font-medium">CWE Top 25</p>
                <p className="text-xs text-muted-foreground">
                  {scan.cweTop25Violations} violations
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scan Report */}
      {scan.scanReportUrl && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Detailed Report
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Access the full scan report for detailed findings and recommendations
          </p>
          <a
            href={scan.scanReportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
          >
            <FileText className="w-4 h-4" />
            View Full Report
          </a>
        </div>
      )}

      {/* Finding Categories */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          Finding Categories
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/20 rounded p-3">
            <p className="text-sm font-medium">Vulnerabilities</p>
            <p className="text-xs text-muted-foreground">
              {(scan.findings || []).filter((f: any) => f.type === 'vulnerability').length} findings
            </p>
          </div>
          <div className="bg-secondary/20 rounded p-3">
            <p className="text-sm font-medium">Misconfigurations</p>
            <p className="text-xs text-muted-foreground">
              {(scan.findings || []).filter((f: any) => f.type === 'misconfiguration').length} findings
            </p>
          </div>
          <div className="bg-secondary/20 rounded p-3">
            <p className="text-sm font-medium">Missing Controls</p>
            <p className="text-xs text-muted-foreground">
              {(scan.findings || []).filter((f: any) => f.type === 'missing-control').length} findings
            </p>
          </div>
          <div className="bg-secondary/20 rounded p-3">
            <p className="text-sm font-medium">Compliance Gaps</p>
            <p className="text-xs text-muted-foreground">
              {(scan.findings || []).filter((f: any) => f.type === 'compliance-gap').length} findings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
function RemediationTab({ scan }: { scan: ApplicationSecurityScan }) {
  const totalRemediation = scan.findingsResolved +
    scan.findingsInProgress +
    scan.findingsAcceptedRisk +
    scan.findingsFalsePositive;

  return (
    <div className="space-y-6">
      {/* Remediation Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Remediation Status</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Progress on addressing security findings
            </p>
          </div>
          <div className="px-4 py-2 rounded-lg bg-primary/10 text-primary">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              <span className="font-medium">{totalRemediation} Items</span>
            </div>
          </div>
        </div>

        {/* Remediation Breakdown */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-success/5 border border-success/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-success">{scan.findingsResolved}</p>
            <p className="text-xs text-muted-foreground mt-1">Fixed</p>
          </div>
          <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-warning">{scan.findingsInProgress}</p>
            <p className="text-xs text-muted-foreground mt-1">In Progress</p>
          </div>
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{scan.findingsAcceptedRisk}</p>
            <p className="text-xs text-muted-foreground mt-1">Risk Accepted</p>
          </div>
          <div className="bg-gray-500/5 border border-gray-500/20 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-500">{scan.findingsFalsePositive}</p>
            <p className="text-xs text-muted-foreground mt-1">False Positive</p>
          </div>
        </div>
      </div>

      {/* Remediation Progress */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Remediation Progress
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Completion Rate</span>
            <span className="text-sm font-medium">
              {totalRemediation > 0 ? Math.round((scan.findingsResolved / totalRemediation) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-success h-2 rounded-full"
              style={{ width: `${totalRemediation > 0 ? (scan.findingsResolved / totalRemediation) * 100 : 0}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Time to Fix (Avg)</p>
              <p className="font-medium">
                {scan.criticalFindings > 0 ? "2-5 days" :
                  scan.highFindings > 0 ? "1-2 weeks" : "2-4 weeks"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Priority Items</p>
              <p className="font-medium text-destructive">
                {scan.criticalFindings + scan.highFindings} high priority
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Remediation Recommendations */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Remediation Recommendations
        </h3>
        <div className="space-y-3">
          {scan.criticalFindings > 0 && (
            <div className="bg-card border border-destructive/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Immediate Action Required</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {scan.criticalFindings} critical vulnerabilities require immediate remediation
                  </p>
                  <p className="text-xs text-destructive mt-2">
                    Recommended timeline: 24-48 hours
                  </p>
                </div>
              </div>
            </div>
          )}

          {scan.highFindings > 0 && (
            <div className="bg-card border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Priority Remediation</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {scan.highFindings} high severity vulnerabilities should be addressed
                  </p>
                  <p className="text-xs text-orange-500 mt-2">
                    Recommended timeline: 1-2 weeks
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Settings className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Process Improvements</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Consider implementing automated security testing in CI/CD pipeline
                </p>
                <p className="text-xs text-primary mt-2">
                  Recommended: Weekly automated scans
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function ComplianceTab({ scan }: { scan: ApplicationSecurityScan }) {
  // Generate compliance status based on scan results
  const complianceStandards = [
    {
      standard: 'IEC 62443',
      description: 'Industrial Automation and Control Systems Security',
      score: scan.securityScore || 75,
      status: (scan.securityScore || 75) >= 80 ? 'pass' : (scan.securityScore || 75) >= 60 ? 'warning' : 'fail'
    },
    {
      standard: 'NERC CIP',
      description: 'Critical Infrastructure Protection for Power Systems',
      score: scan.criticalFindings === 0 && scan.highFindings < 3 ? 85 : 65,
      status: scan.criticalFindings === 0 && scan.highFindings < 3 ? 'pass' : 'warning'
    },
    {
      standard: 'NIST 800-82',
      description: 'Guide to Industrial Control Systems Security',
      score: scan.configurationVulnerabilities < 5 ? 80 : 60,
      status: scan.configurationVulnerabilities < 5 ? 'pass' : 'warning'
    },
    {
      standard: 'OWASP Top 10',
      description: 'Web Application Security Risks',
      score: scan.owaspTop10Violations === 0 ? 90 : 70,
      status: scan.owaspTop10Violations === 0 ? 'pass' : 'warning'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Compliance Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Compliance Status</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Compliance with transmission security standards and regulations
            </p>
          </div>
          <div className="px-4 py-2 rounded-lg bg-primary/10 text-primary">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span className="font-medium">{complianceStandards.length} Standards</span>
            </div>
          </div>
        </div>

        {/* Compliance Standards */}
        <div className="space-y-3">
          {complianceStandards.map((compliance, index) => (
            <div key={index} className={`bg-secondary/30 rounded-lg p-4 border ${compliance.status === "pass" ? "border-success/30" :
              compliance.status === "warning" ? "border-warning/30" :
                "border-destructive/30"
              }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{compliance.standard}</p>
                  <p className="text-xs text-muted-foreground">
                    {compliance.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {compliance.status === "pass" ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : compliance.status === "warning" ? (
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                  <span className={`text-sm font-medium ${compliance.status === "pass" ? "text-success" :
                    compliance.status === "warning" ? "text-warning" :
                      "text-destructive"
                    }`}>
                    {compliance.score}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Details */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Compliance Requirements
        </h3>
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium">Secure Development Practices</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success">
                    MET
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Application follows secure coding guidelines and best practices
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium">Input Validation</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success">
                    MET
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Proper input validation and sanitization implemented
                </p>
              </div>
            </div>
          </div>

          {scan.criticalFindings > 0 || scan.highFindings > 2 ? (
            <div className="bg-card border border-warning/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">Vulnerability Management</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                      PARTIAL
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    High-severity vulnerabilities require remediation for full compliance
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">Vulnerability Management</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success">
                      MET
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    No critical or high-severity vulnerabilities detected
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium">Security Testing</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success">
                    MET
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Regular security testing and scanning implemented
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Recommendations */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Compliance Recommendations
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full bg-primary mt-2" />
            <p>Implement automated compliance monitoring for continuous assessment</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full bg-primary mt-2" />
            <p>Schedule regular compliance audits and assessments</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full bg-primary mt-2" />
            <p>Maintain documentation for compliance evidence and audit trails</p>
          </div>
          {scan.deploymentEnvironment === 'production' && (
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-red-500 mt-2" />
              <p className="text-red-500">
                Enhanced compliance required for production transmission applications
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
