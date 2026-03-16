import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard } from "@/components/shared/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Shield,
  AlertTriangle,
  Network,
  Activity,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  FileText,
  Zap,
  MapPin,
} from "lucide-react";
import {
  getNetworkExposureAssessments,
  getNetworkExposureAssessmentsByLevel,
  getSecurityZones,
} from "@/lib/otSecurityQueries";
import { getDataBackend } from "@/lib/supabase";
import type {
  NetworkExposureAssessment,
  SecurityZone,
  ExposureLevel,
  AssessmentType,
  MitigationStatus,
  SecurityZoneType,
  ComplianceStatus,
} from "@/types/security";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import {
  PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer,
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  Cell as RechartsCell
} from "recharts";

// Helper function to format assessment type
function formatAssessmentType(type: AssessmentType): string {
  return type
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to format exposure level
function formatExposureLevel(level: ExposureLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function NetworkExposureView() {
  const { currentTenant } = useApp();
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [exposureLevelFilter, setExposureLevelFilter] = useState<string>("all");
  const [assessmentTypeFilter, setAssessmentTypeFilter] = useState<string>("all");
  const [mitigationStatusFilter, setMitigationStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("riskScore");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for Supabase data
  const [assessments, setAssessments] = useState<NetworkExposureAssessment[]>([]);
  const [zones, setZones] = useState<SecurityZone[]>([]);

  const dataBackend = getDataBackend();
  const useSupabase = dataBackend === 'supabase' || dataBackend === 'hybrid';

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        if (useSupabase) {
          // Fetch from Supabase
          const [assessmentsData, zonesData] = await Promise.all([
            getNetworkExposureAssessments(currentTenant.id),
            getSecurityZones(currentTenant.id)
          ]);

          setAssessments(assessmentsData);
          setZones(zonesData);
        } else {
          // Fallback to mock data
          const mockAssessments = generateMockAssessments(currentTenant.id);
          const mockZones = generateMockZones(currentTenant.id);
          setAssessments(mockAssessments);
          setZones(mockZones);
        }
      } catch (err) {
        console.error('Error fetching network exposure data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');

        // Fallback to mock data on error
        const mockAssessments = generateMockAssessments(currentTenant.id);
        const mockZones = generateMockZones(currentTenant.id);
        setAssessments(mockAssessments);
        setZones(mockZones);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentTenant.id, useSupabase]);

  // Filter assessments
  const filteredAssessments = useMemo(() => {
    let filtered = assessments;

    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.assessmentType.toLowerCase().includes(query) ||
        (a.assessor && a.assessor.toLowerCase().includes(query)) ||
        (a.findingsSummary && a.findingsSummary.toLowerCase().includes(query))
      );
    }

    if (exposureLevelFilter !== "all") {
      filtered = filtered.filter((a) => a.exposureLevel === exposureLevelFilter);
    }

    if (assessmentTypeFilter !== "all") {
      filtered = filtered.filter((a) => a.assessmentType === assessmentTypeFilter);
    }

    if (mitigationStatusFilter !== "all") {
      filtered = filtered.filter((a) => a.mitigationStatus === mitigationStatusFilter);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'riskScore':
          return b.riskScore - a.riskScore;
        case 'date':
          return new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime();
        case 'type':
          return a.assessmentType.localeCompare(b.assessmentType);
        case 'findings':
          return (b.findingsCount || 0) - (a.findingsCount || 0);
        default:
          return 0;
      }
    });
  }, [assessments, exposureLevelFilter, assessmentTypeFilter, mitigationStatusFilter, searchTerm, sortBy]);

  // Set initial selection
  /*
  useEffect(() => {
    if (!selectedAssessmentId && filteredAssessments.length > 0) {
      setSelectedAssessmentId(filteredAssessments[0].id);
    }
  }, [filteredAssessments, selectedAssessmentId]);
  */

  const selectedAssessment = assessments.find((a) => a.id === selectedAssessmentId);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = assessments.length;
    const critical = assessments.filter(a => a.exposureLevel === 'critical').length;
    const high = assessments.filter(a => a.exposureLevel === 'high').length;
    const avgRiskScore = total > 0
      ? Math.round(assessments.reduce((sum, a) => sum + a.riskScore, 0) / total)
      : 0;
    const totalFindings = assessments.reduce((sum, a) => sum + a.findingsCount, 0);
    const criticalFindings = assessments.reduce((sum, a) => sum + a.criticalFindings, 0);
    const mitigated = assessments.filter(a => a.mitigationStatus === 'completed').length;

    return {
      total,
      critical,
      high,
      avgRiskScore,
      totalFindings,
      criticalFindings,
      mitigated,
      mitigationRate: total > 0 ? Math.round((mitigated / total) * 100) : 0
    };
  }, [assessments]);

  // Filter options
  const exposureLevelOptions = [
    { value: "all", label: "All Exposure Levels" },
    { value: "critical", label: "Critical" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
    { value: "none", label: "None" },
  ];

  const assessmentTypeOptions = [
    { value: "all", label: "All Assessment Types" },
    { value: "vulnerability-scan", label: "Vulnerability Scan" },
    { value: "penetration-test", label: "Penetration Test" },
    { value: "configuration-audit", label: "Configuration Audit" },
    { value: "network-scan", label: "Network Scan" },
    { value: "protocol-analysis", label: "Protocol Analysis" },
  ];

  const mitigationStatusOptions = [
    { value: "all", label: "All Mitigation Status" },
    { value: "pending", label: "Pending" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "accepted-risk", label: "Accepted Risk" },
  ];

  const filters = [
    {
      key: "exposureLevel",
      label: "Exposure Level",
      value: exposureLevelFilter,
      onChange: setExposureLevelFilter,
      options: exposureLevelOptions,
    },
    {
      key: "assessmentType",
      label: "Assessment Type",
      value: assessmentTypeFilter,
      onChange: setAssessmentTypeFilter,
      options: assessmentTypeOptions,
    },
    {
      key: "mitigationStatus",
      label: "Mitigation Status",
      value: mitigationStatusFilter,
      onChange: setMitigationStatusFilter,
      options: mitigationStatusOptions,
    },
  ];

  // Loading state
  if (loading) {
    return (
      <>
        <ListPane
          title="Network Exposure Assessments"
          subtitle="Loading assessments..."
          count={0}
          searchPlaceholder="Search assessments..."
        >
          <LoadingState loadingText="Loading exposure data..." />
        </ListPane>
        <WorkPane title="Loading..." subtitle="" tabs={[]} />
      </>
    );
  }

  // Error state with fallback
  if (error && assessments.length === 0) {
    return (
      <>
        <ListPane
          title="Network Exposure Assessments"
          subtitle="Error loading assessments"
          count={0}
          searchPlaceholder="Search assessments..."
        >
          <EmptyState
            icon={AlertTriangle}
            title="Failed to Load Assessments"
            description={error}
          />
        </ListPane>
        <WorkPane title="Error" subtitle="" tabs={[]} />
      </>
    );
  }

  const tabs = selectedAssessment
    ? [
      {
        id: "overview",
        label: "Overview",
        content: <AssessmentOverview assessment={selectedAssessment} zones={zones} />,
      },
      {
        id: "findings",
        label: "Findings",
        content: <AssessmentFindings assessment={selectedAssessment} />,
      },
      {
        id: "exposure",
        label: "Exposure Details",
        content: <ExposureDetails assessment={selectedAssessment} />,
      },
      {
        id: "mitigation",
        label: "Mitigation",
        content: <MitigationRecommendations assessment={selectedAssessment} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Overview",
        content: <NetworkExposureOverview assessments={assessments} summaryStats={summaryStats} />,
      }
    ];

  return (
    <>
      <ListPane
        title="Network Exposure Assessments"
        context="DEWA – Transmission"
        count={filteredAssessments.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={filters}
        sortOptions={[
          { label: "Risk Score", value: "riskScore" },
          { label: "Date", value: "date" },
          { label: "Type", value: "type" },
          { label: "Findings", value: "findings" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >

        {/* Assessment List */}
        <div className="space-y-1">
          {filteredAssessments.length === 0 ? (
            <EmptyState
              icon={Network}
              title="No Assessments Found"
              description="No metrics match your search criteria"
            />
          ) : (
            filteredAssessments.map((assessment) => {
              const zone = zones.find(z => z.id === assessment.zoneId);
              return (
                <ListPaneItem
                  key={assessment.id}
                  title={formatAssessmentType(assessment.assessmentType)}
                  description={`${zone?.name || 'Unknown Zone'} • ${new Date(assessment.assessmentDate).toLocaleDateString()}`}
                  status={assessment.exposureLevel === "critical" ? "offline" : (assessment.exposureLevel === "high" ? "maintenance" : "online")}
                  category={assessment.exposureLevel.toUpperCase()}
                  value={`${assessment.riskScore}`}
                  isSelected={selectedAssessmentId === assessment.id}
                  onClick={() => setSelectedAssessmentId(assessment.id)}
                />
              );
            })
          )}
        </div>
      </ListPane>

      {selectedAssessment ? (
        <WorkPane
          title={formatAssessmentType(selectedAssessment.assessmentType)}
          subtitle={`Risk Score: ${selectedAssessment.riskScore} • ${new Date(selectedAssessment.assessmentDate).toLocaleDateString()}`}
          tabs={tabs}
        />
      ) : (
        <WorkPane
          title="Network Exposure Overview"
          subtitle="Assess and monitor network exposure"
          tabs={tabs}
        />
      )}
    </>
  );
}

// Assessment Overview Tab
function AssessmentOverview({ assessment, zones }: { assessment: NetworkExposureAssessment; zones: SecurityZone[] }) {
  const zone = zones.find(z => z.id === assessment.zoneId);

  return (
    <div className="space-y-6">
      {/* Risk Score Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-16 h-16 rounded-lg flex items-center justify-center ${assessment.exposureLevel === "critical"
              ? "bg-destructive/10"
              : assessment.exposureLevel === "high"
                ? "bg-warning/10"
                : assessment.exposureLevel === "medium"
                  ? "bg-primary/10"
                  : "bg-success/10"
              }`}
          >
            <Shield
              className={`w-8 h-8 ${assessment.exposureLevel === "critical"
                ? "text-destructive"
                : assessment.exposureLevel === "high"
                  ? "text-warning"
                  : assessment.exposureLevel === "medium"
                    ? "text-primary"
                    : "text-success"
                }`}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold">{formatAssessmentType(assessment.assessmentType)}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {zone?.name || 'Unknown Zone'} • Assessed on {new Date(assessment.assessmentDate).toLocaleDateString()}
            </p>
            <div className="flex items-center gap-4 mt-4">
              <StatusBadge
                status={assessment.exposureLevel}
              />
              <StatusBadge
                status={assessment.mitigationStatus}
              />
              {assessment.automated && (
                <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">
                  Automated
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Metrics */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Risk Metrics</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Risk Score</p>
            <div className="flex items-center gap-3">
              <p className="text-2xl font-bold">{assessment.riskScore}</p>
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${assessment.riskScore >= 70
                    ? "bg-destructive"
                    : assessment.riskScore >= 40
                      ? "bg-warning"
                      : "bg-success"
                    }`}
                  style={{ width: `${assessment.riskScore}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {assessment.riskScore >= 70 ? "High Risk" : assessment.riskScore >= 40 ? "Medium Risk" : "Low Risk"}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Findings</p>
            <p className="text-2xl font-bold">{assessment.findingsCount}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {assessment.findingsCount === 0 ? "No findings" : "Security findings"}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Critical Findings</p>
            <p className="text-2xl font-bold text-destructive">{assessment.criticalFindings}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Require immediate attention
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">High Findings</p>
            <p className="text-2xl font-bold text-warning">{assessment.highFindings}</p>
            <p className="text-xs text-muted-foreground mt-2">
              High priority issues
            </p>
          </div>
        </div>
      </div>

      {/* Assessment Details */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Assessment Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Assessment Date</p>
                <p className="text-sm font-medium">
                  {new Date(assessment.assessmentDate).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          {assessment.nextAssessmentDate && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Next Assessment</p>
                  <p className="text-sm font-medium">
                    {new Date(assessment.nextAssessmentDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
          {assessment.assessor && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Assessor</p>
                  <p className="text-sm font-medium">{assessment.assessor}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Findings Summary */}
      {assessment.findingsSummary && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Findings Summary</h4>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">{assessment.findingsSummary}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Assessment Findings Tab
function AssessmentFindings({ assessment }: { assessment: NetworkExposureAssessment }) {
  return (
    <div className="space-y-6">
      {/* Findings Breakdown */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Findings Breakdown</h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-destructive" />
              <p className="text-xs text-muted-foreground">Critical</p>
            </div>
            <p className="text-2xl font-bold text-destructive">{assessment.criticalFindings}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <p className="text-xs text-muted-foreground">High</p>
            </div>
            <p className="text-2xl font-bold text-warning">{assessment.highFindings}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Medium</p>
            </div>
            <p className="text-2xl font-bold text-primary">{assessment.mediumFindings}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <p className="text-xs text-muted-foreground">Low</p>
            </div>
            <p className="text-2xl font-bold text-success">{assessment.lowFindings}</p>
          </div>
        </div>
      </div>

      {/* Detailed Findings */}
      {assessment.detailedFindings && Object.keys(assessment.detailedFindings).length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Detailed Findings</h4>
          <div className="space-y-3">
            {Object.entries(assessment.detailedFindings).map(([key, value], index) => (
              <div key={key} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="text-sm font-medium">Finding #{index + 1}</h5>
                  <StatusBadge
                    status={getSeverityFromIndex(index, assessment)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {typeof value === 'string' ? value : JSON.stringify(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Exposure Details Tab
function ExposureDetails({ assessment }: { assessment: NetworkExposureAssessment }) {
  return (
    <div className="space-y-6">
      {/* Exposed Services */}
      {assessment.exposedServices.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Exposed Services</h4>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="space-y-2">
              {assessment.exposedServices.map((service: any, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Network className="w-4 h-4 text-warning" />
                  <span className="font-medium">
                    {typeof service === 'object' ? `${service.service} (Port ${service.port})` : service}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Exposed Ports */}
      {assessment.exposedPorts.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Exposed Ports</h4>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex flex-wrap gap-2">
              {assessment.exposedPorts.map((port: any, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium"
                >
                  Port {typeof port === 'object' ? port.port : port}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vulnerable Protocols */}
      {assessment.vulnerableProtocols.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Vulnerable Protocols</h4>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="space-y-3">
              {assessment.vulnerableProtocols.map((protocol: any, index) => (
                <div key={index} className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <div>
                    <p className="text-sm font-medium">
                      {typeof protocol === 'object' ? protocol.protocol : protocol}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {typeof protocol === 'object' ? protocol.vulnerability : 'Protocol requires security review'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Exposure */}
      {assessment.exposedServices.length === 0 &&
        assessment.exposedPorts.length === 0 &&
        assessment.vulnerableProtocols.length === 0 && (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
            <p className="text-sm font-medium">No Exposure Detected</p>
            <p className="text-xs text-muted-foreground mt-1">
              No exposed services, ports, or vulnerable protocols found
            </p>
          </div>
        )}
    </div>
  );
}

// Mitigation Recommendations Tab
function MitigationRecommendations({ assessment }: { assessment: NetworkExposureAssessment }) {
  return (
    <div className="space-y-6">
      {/* Mitigation Status */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Mitigation Status</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Current progress on addressing identified risks
            </p>
          </div>
          <StatusBadge
            status={assessment.mitigationStatus}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${assessment.mitigationStatus === "completed"
                ? "bg-success"
                : assessment.mitigationStatus === "in-progress"
                  ? "bg-primary"
                  : "bg-secondary"
                }`}
              style={{
                width: `${assessment.mitigationStatus === "completed"
                  ? 100
                  : assessment.mitigationStatus === "in-progress"
                    ? 50
                    : 0
                  }%`,
              }}
            />
          </div>
          <span className="text-sm font-medium">
            {assessment.mitigationStatus === "completed"
              ? "100%"
              : assessment.mitigationStatus === "in-progress"
                ? "50%"
                : "0%"}
          </span>
        </div>
      </div>

      {/* Recommendations */}
      {assessment.mitigationRecommendations.length > 0 ? (
        <div>
          <h4 className="text-sm font-semibold mb-3">Recommended Actions</h4>
          <div className="space-y-3">
            {assessment.mitigationRecommendations.map((recommendation: any, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">Action Item</p>
                      {typeof recommendation === 'object' && recommendation.priority && (
                        <StatusBadge status={recommendation.priority} />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {typeof recommendation === 'object' ? recommendation.recommendation : recommendation}
                    </p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">No Recommendations</p>
          <p className="text-xs text-muted-foreground mt-1">
            No mitigation recommendations available for this assessment
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function to get severity from finding index
function getSeverityFromIndex(index: number, assessment: NetworkExposureAssessment): string {
  if (index < assessment.criticalFindings) return "critical";
  if (index < assessment.criticalFindings + assessment.highFindings) return "high";
  if (index < assessment.criticalFindings + assessment.highFindings + assessment.mediumFindings) return "medium";
  return "low";
}

// Mock data generators for fallback
function generateMockAssessments(tenantId: string): NetworkExposureAssessment[] {
  const assessmentTypes: AssessmentType[] = [
    'vulnerability-scan',
    'penetration-test',
    'configuration-audit',
    'network-scan',
    'protocol-analysis'
  ];

  const exposureLevels: ExposureLevel[] = ['critical', 'high', 'medium', 'low', 'none'];
  const mitigationStatuses: MitigationStatus[] = ['pending', 'in-progress', 'completed', 'accepted-risk'];

  return Array.from({ length: 12 }, (_, i) => {
    const criticalFindings = Math.floor(Math.random() * 5);
    const highFindings = Math.floor(Math.random() * 8);
    const mediumFindings = Math.floor(Math.random() * 12);
    const lowFindings = Math.floor(Math.random() * 15);
    const findingsCount = criticalFindings + highFindings + mediumFindings + lowFindings;
    const riskScore = Math.min(100, criticalFindings * 20 + highFindings * 10 + mediumFindings * 5 + lowFindings * 2);

    return {
      id: `assessment-${i + 1}`,
      tenantId,
      siteId: `site-${(i % 3) + 1}`,
      assetId: i % 2 === 0 ? `asset-${i + 1}` : undefined,
      zoneId: `zone-${(i % 4) + 1}`,
      assessmentType: assessmentTypes[i % assessmentTypes.length],
      exposureLevel: exposureLevels[Math.min(Math.floor(riskScore / 25), 4)],
      riskScore,
      findingsCount,
      criticalFindings,
      highFindings,
      mediumFindings,
      lowFindings,
      exposedServices: i % 3 === 0 ? ['HTTP', 'Telnet', 'FTP'] : i % 3 === 1 ? ['SSH', 'SNMP'] : [],
      exposedPorts: i % 2 === 0 ? [80, 23, 21, 22] : [443, 161],
      vulnerableProtocols: i % 4 === 0 ? ['DNP3', 'Modbus'] : [],
      mitigationStatus: mitigationStatuses[i % mitigationStatuses.length],
      mitigationRecommendations: [
        'Disable unnecessary services',
        'Update firmware to latest version',
        'Implement network segmentation',
        'Enable encryption for all protocols'
      ].slice(0, (i % 3) + 1),
      assessmentDate: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
      nextAssessmentDate: new Date(Date.now() + (30 - i) * 24 * 60 * 60 * 1000).toISOString(),
      assessor: i % 2 === 0 ? 'Security Team' : 'External Auditor',
      automated: i % 3 === 0,
      findingsSummary: `Assessment identified ${findingsCount} security findings requiring attention.`,
      detailedFindings: {
        finding1: 'Unencrypted communication detected',
        finding2: 'Outdated firmware version',
        finding3: 'Weak authentication mechanism'
      },
      metadata: {},
      createdAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  });
}

function generateMockZones(tenantId: string): SecurityZone[] {
  const zoneTypes: SecurityZoneType[] = [
    'substation-control',
    'protection-systems',
    'scada-network',
    'field-devices'
  ];

  return Array.from({ length: 4 }, (_, i) => ({
    id: `zone-${i + 1}`,
    tenantId,
    siteId: `site-${(i % 3) + 1}`,
    name: `${zoneTypes[i]} Zone`,
    zoneType: zoneTypes[i],
    securityLevel: (i % 4) + 1,
    parentZoneId: undefined,
    description: `Security zone for ${zoneTypes[i]}`,
    assetCount: Math.floor(Math.random() * 50) + 10,
    complianceStatus: (i % 3 === 0 ? 'compliant' : i % 3 === 1 ? 'partial' : 'non-compliant') as ComplianceStatus,
    policies: ['policy-1', 'policy-2'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as any)) as SecurityZone[];
}

function NetworkExposureOverview({ assessments, summaryStats }: { assessments: NetworkExposureAssessment[], summaryStats: any }) {
  const assessmentsByLevel = assessments.reduce((acc, assessment) => {
    const level = assessment.exposureLevel || 'unknown';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const assessmentsByType = assessments.reduce((acc, assessment) => {
    const type = assessment.assessmentType || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const criticalAssessments = [...assessments]
    .filter(a => a.exposureLevel === 'critical' || (a.criticalFindings && a.criticalFindings > 0))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  const levelData = [
    { name: 'Critical', value: assessmentsByLevel['critical'] || 0, color: 'hsl(var(--destructive))' },
    { name: 'High', value: assessmentsByLevel['high'] || 0, color: 'hsl(var(--warning))' },
    { name: 'Medium', value: assessmentsByLevel['medium'] || 0, color: 'hsl(var(--primary))' },
    { name: 'Low', value: assessmentsByLevel['low'] || 0, color: 'hsl(var(--success))' },
  ].filter(d => d.value > 0);

  const typeData = Object.entries(assessmentsByType)
    .map(([type, count]) => ({
      name: formatAssessmentType(type as AssessmentType),
      value: count
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
      {/* Exposure Level Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary" />
          Exposure Level Distribution
        </h4>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={levelData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {levelData.map((entry, index) => (
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
      </div>

      {/* Assessments Type Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Network className="w-4 h-4 text-primary" />
          Assessments by Type
        </h4>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={typeData} layout="vertical" margin={{ left: 120, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
              <XAxis type="number" hide domain={[0, 'auto']} />
              <YAxis
                dataKey="name"
                type="category"
                width={140}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip
                cursor={{ fill: 'hsl(var(--muted)/0.1)' }}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {typeData.map((_entry, index) => (
                  <RechartsCell key={`cell-${index}`} fill={`hsl(var(--primary) / ${1 - index * 0.15})`} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Exposure Area Info */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Key Exposure Controls
        </h4>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Network className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Network Segmentation</p>
              <p className="text-xs text-muted-foreground">Isolate critical systems from untrusted networks.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Firewall Rules</p>
              <p className="text-xs text-muted-foreground">Implement strict firewall policies to control traffic.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Regular Assessments</p>
              <p className="text-xs text-muted-foreground">Conduct periodic vulnerability scans and penetration tests.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Assessments List */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <XCircle className="w-4 h-4 text-primary" />
          Critical Assessments
        </h4>
        <div className="space-y-4">
          {criticalAssessments.length > 0 ? (
            criticalAssessments.map((assessment) => (
              <div
                key={assessment.id}
                className="group flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${assessment.exposureLevel === 'critical' ? 'bg-destructive' : 'bg-warning'
                    }`} />
                  <span className="text-sm font-medium truncate max-w-[120px]">
                    {formatAssessmentType(assessment.assessmentType)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{assessment.criticalFindings} critical</span>
                  <span className="text-xs font-bold">Risk: {assessment.riskScore}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic">No critical exposure assessments found.</p>
          )}
          <div className="pt-2 border-t border-border mt-2">
            <p className="text-xs text-muted-foreground italic">Select an assessment from the list to view detailed findings and mitigation recommendations.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

