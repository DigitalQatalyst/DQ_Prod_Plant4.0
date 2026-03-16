import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  AlertTriangle,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Building2,
  Search,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Eye,
  Settings,
  TrendingUp,
  Target,
  Activity,
  Plus,
  Zap as ZapIcon,
  Network,
  ShieldCheck,
  History,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
} from "lucide-react";
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
import {
  getSecurityRisksByTenant,
  getRiskSummaryStats,
  type RiskSummaryStats
} from "@/lib/riskQueries";
import type {
  SecurityRisk,
  SecurityRiskCategory,
  SecurityRiskStatus,
  RiskTreatmentStrategy,
  TransmissionAssetType,
  TransmissionProtocol,
  TransmissionThreatCategory
} from "@/types/security";
import { IdentityOverview } from "@/components/security/IdentityOverview";

export function RiskRegister() {
  const { currentTenant } = useApp();

  // State for data loading
  const [risks, setRisks] = useState<SecurityRisk[]>([]);
  const [stats, setStats] = useState<RiskSummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>("all");
  const [selectedTreatmentStrategy, setSelectedTreatmentStrategy] = useState<string>("all");
  const [selectedRiskId, setSelectedRiskId] = useState<string>("");
  const [sortBy, setSortBy] = useState("risk-high");

  // Load risks and stats
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [risksData, statsData] = await Promise.all([
          getSecurityRisksByTenant(currentTenant.id),
          getRiskSummaryStats(currentTenant.id)
        ]);

        setRisks(risksData);
        setStats(statsData);
      } catch (err) {
        console.error('Error loading risk data:', err);
        setError('Failed to load risk register data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentTenant.id]);

  // Filter and sort risks
  const filteredAndSortedRisks = useMemo(() => {
    let result = risks.filter((risk) => {
      const matchesSearch =
        (risk.riskName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (risk.riskDescription || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (risk.treatmentOwner && risk.treatmentOwner.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (risk.threatScenario && risk.threatScenario.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === "all" || risk.riskCategory === selectedCategory;
      const matchesStatus = selectedStatus === "all" || risk.status === selectedStatus;
      const matchesRiskLevel = selectedRiskLevel === "all" || risk.inherentRiskLevel === selectedRiskLevel;
      const matchesTreatmentStrategy = selectedTreatmentStrategy === "all" || risk.treatmentStrategy === selectedTreatmentStrategy;

      return matchesSearch && matchesCategory && matchesStatus && matchesRiskLevel && matchesTreatmentStrategy;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === "risk-high") return b.inherentRiskScore - a.inherentRiskScore;
      if (sortBy === "risk-low") return a.inherentRiskScore - b.inherentRiskScore;
      if (sortBy === "name") return a.riskName.localeCompare(b.riskName);
      if (sortBy === "date") return new Date(b.lastAssessmentDate || 0).getTime() - new Date(a.lastAssessmentDate || 0).getTime();
      return 0;
    });

    return result;
  }, [risks, searchTerm, selectedCategory, selectedStatus, selectedRiskLevel, selectedTreatmentStrategy, sortBy]);

  const selectedRiskData = risks.find((r) => r.id === selectedRiskId);

  // Get unique values for filter dropdowns
  const categories = [...new Set(risks.map(r => r.riskCategory))];
  const statuses = [...new Set(risks.map(r => r.status))];
  const riskLevels = [...new Set(risks.map(r => r.inherentRiskLevel))];
  const treatmentStrategies = [...new Set(risks.map(r => r.treatmentStrategy))];

  const tabs = selectedRiskData
    ? [
      {
        id: "details",
        label: "Risk Details",
        content: <RiskDetails risk={selectedRiskData} />,
      },
      {
        id: "assessment",
        label: "Risk Assessment",
        content: <RiskAssessment risk={selectedRiskData} />,
      },
      {
        id: "treatment",
        label: "Treatment Plan",
        content: <TreatmentPlan risk={selectedRiskData} />,
      },
      {
        id: "impact",
        label: "Impact Analysis",
        content: <ImpactAnalysis risk={selectedRiskData} />,
      },
    ]
    : [];

  if (loading) {
    return <LoadingState loadingText="Loading risk register..." />;
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Error Loading Risk Register"
        description={error}
        action={{
          label: "Retry",
          onClick: () => window.location.reload(),
          variant: "outline"
        }}
      />
    );
  }

  const getCategoryColor = (category: SecurityRiskCategory) => {
    switch (category) {
      case "cyber-attack": return "text-destructive";
      case "insider-threat": return "text-red-600";
      case "system-vulnerability": return "text-warning";
      case "configuration-error": return "text-orange-600";
      case "physical-security": return "text-blue-600";
      case "third-party": return "text-purple-600";
      case "compliance": return "text-info";
      case "operational": return "text-yellow-600";
      case "natural-disaster": return "text-gray-600";
      case "human-error": return "text-pink-600";
      default: return "text-muted-foreground";
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return "text-destructive";
    if (score >= 60) return "text-warning";
    if (score >= 40) return "text-info";
    return "text-success";
  };

  const getStatusColor = (status: SecurityRiskStatus) => {
    switch (status) {
      case "closed": return "text-success";
      case "mitigating": return "text-warning";
      case "monitoring": return "text-info";
      case "accepted": return "text-purple-600";
      case "transferred": return "text-blue-600";
      case "assessed": return "text-orange-600";
      case "identified": return "text-red-600";
      default: return "text-muted-foreground";
    }
  };

  const getCategoryIcon = (category: SecurityRiskCategory) => {
    switch (category) {
      case "cyber-attack": return AlertTriangle;
      case "insider-threat": return User;
      case "system-vulnerability": return Shield;
      case "configuration-error": return Settings;
      case "physical-security": return Building2;
      case "third-party": return Network;
      case "compliance": return FileText;
      case "operational": return Activity;
      case "natural-disaster": return ZapIcon;
      case "human-error": return AlertCircle;
      default: return AlertTriangle;
    }
  };

  const getDaysFromLastAssessment = (lastAssessmentDate?: string) => {
    if (!lastAssessmentDate) return null;
    const now = new Date();
    const assessment = new Date(lastAssessmentDate);
    const diffTime = now.getTime() - assessment.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <>
      <ListPane
        title="Risk Register"
        context="DEWA – Transmission"
        count={filteredAndSortedRisks.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "category",
            label: "Category",
            value: selectedCategory,
            onChange: setSelectedCategory,
            options: [
              { value: "all", label: "All Categories" },
              ...categories.map(c => ({ value: c, label: c.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) })),
            ],
          },
          {
            key: "status",
            label: "Status",
            value: selectedStatus,
            onChange: setSelectedStatus,
            options: [
              { value: "all", label: "All Statuses" },
              ...statuses.map(s => ({ value: s, label: s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) })),
            ],
          },
          {
            key: "level",
            label: "Risk Level",
            value: selectedRiskLevel,
            onChange: setSelectedRiskLevel,
            options: [
              { value: "all", label: "All Risk Levels" },
              ...riskLevels.map(l => ({ value: l, label: l.replace(/\b\w/g, l => l.toUpperCase()) })),
            ],
          },
        ]}
        sortOptions={[
          { label: "Highest Risk", value: "risk-high" },
          { label: "Lowest Risk", value: "risk-low" },
          { label: "Risk Name", value: "name" },
          { label: "Last Assessed", value: "date" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="space-y-1">
          {filteredAndSortedRisks.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="No Risks Found"
              description="No security risks match your current filters"
            />
          ) : (
            filteredAndSortedRisks.map((risk) => (
              <ListPaneItem
                key={risk.id}
                title={risk.riskName}
                description={risk.riskDescription}
                status={risk.status === 'closed' || risk.status === 'mitigating' ? 'online' : (risk.status === 'assessed' ? 'maintenance' : 'offline')}
                category={(risk.riskCategory || '').replace(/-/g, ' ')}
                value={`${risk.inherentRiskScore}`}
                isSelected={selectedRiskId === risk.id}
                onClick={() => setSelectedRiskId(risk.id)}
              />
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedRiskData ? selectedRiskData.riskName : "Risks Overview"}
        subtitle={selectedRiskData ? `Risk Score: ${selectedRiskData.inherentRiskScore} • ${(selectedRiskData.status || '').toUpperCase()}` : `${currentTenant.name} • Transmission Security Risk Register`}
        tabs={tabs}
      >
        {!selectedRiskData && (
          <IdentityOverview
            title="Security Risk Management"
            description="Identify, assess, and monitor security risks affecting power transmission infrastructure, grid stability, and operational safety."
            metrics={[
              {
                title: "Total Risks",
                value: filteredAndSortedRisks.length,
                icon: AlertTriangle,
                variant: 'default'
              },
              {
                title: "Critical Risks",
                value: stats?.criticalRisks || 0,
                icon: ZapIcon,
                variant: 'destructive'
              },
              {
                title: "High Risks",
                value: stats?.highRisks || 0,
                icon: AlertCircle,
                variant: 'warning'
              },
              {
                title: "Mitigating",
                value: stats?.mitigatingRisks || 0,
                icon: Activity,
                variant: 'success'
              }
            ]}
          >
            <RiskOverviewDashboard
              statusData={[
                { name: 'Mitigated', value: stats.mitigatingRisks || 0, color: 'hsl(var(--success))' },
                { name: 'Open', value: (stats?.totalRisks || 0) - (stats?.mitigatingRisks || 0), color: 'hsl(var(--destructive))' },
              ].filter(d => d.value > 0)}
              riskData={risks
                .sort((a, b) => b.inherentRiskScore - a.inherentRiskScore)
                .slice(0, 5)
                .map(r => ({ name: r.riskName, value: r.inherentRiskScore }))
              }
              criticalRisks={risks.filter(r => r.inherentRiskScore >= 80).slice(0, 3)}
              onRiskSelect={(id) => setSelectedRiskId(id)}
            />
          </IdentityOverview>
        )}
      </WorkPane>
    </>
  );
}

function RiskDetails({ risk }: { risk: SecurityRisk }) {
  const daysFromLastAssessment = useMemo(() => {
    if (!risk.lastAssessmentDate) return null;
    const now = new Date();
    const assessment = new Date(risk.lastAssessmentDate);
    const diffTime = now.getTime() - assessment.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, [risk.lastAssessmentDate]);

  return (
    <div className="space-y-6">
      {/* Risk Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Risk Overview
        </h4>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Risk ID</p>
            <p className="text-sm font-mono">{risk.riskId}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm">{risk.riskDescription}</p>
          </div>
          {risk.threatScenario && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Threat Scenario</p>
              <p className="text-sm">{risk.threatScenario}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Category</p>
              <Badge variant="outline">
                {risk.riskCategory.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Risk Score</p>
              <Badge
                variant={
                  risk.inherentRiskScore >= 80
                    ? "destructive"
                    : risk.inherentRiskScore >= 60
                      ? "secondary"
                      : "default"
                }
              >
                {risk.inherentRiskScore} / 100
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Risk Owner</p>
              <p className="text-sm font-medium">{risk.treatmentOwner || 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Last Assessment</p>
              <span className={`text-sm font-medium ${daysFromLastAssessment && daysFromLastAssessment > 180 ? "text-warning" : "text-success"
                }`}>
                {daysFromLastAssessment ? `${daysFromLastAssessment} days ago` : 'Not assessed'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Treatment Status */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Treatment Status
        </h4>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Current Status</p>
            <Badge
              variant={
                risk.status === "closed"
                  ? "default"
                  : risk.status === "mitigating"
                    ? "secondary"
                    : "outline"
              }
            >
              {risk.status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Treatment Strategy</p>
            <Badge variant="outline">
              {risk.treatmentStrategy.replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>
          {risk.treatmentPlan && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Treatment Plan</p>
              <p className="text-sm">{risk.treatmentPlan}</p>
            </div>
          )}
        </div>
      </div>

      {/* Transmission Context */}
      <div className="bg-info/5 border border-info/20 rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-info" />
          Power Transmission Context
        </h4>
        <div className="space-y-3">
          <p className="text-sm text-info">
            This risk affects power transmission infrastructure and may impact critical
            systems including substations, grid stations, and transmission assets.
          </p>

          {risk.affectedAssetTypes && risk.affectedAssetTypes.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Affected Asset Types</p>
              <div className="flex flex-wrap gap-2">
                {risk.affectedAssetTypes.map((assetType, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {assetType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {risk.affectedProtocols && risk.affectedProtocols.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Affected Protocols</p>
              <div className="flex flex-wrap gap-2">
                {risk.affectedProtocols.map((protocol, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {protocol}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {(risk.safetyImpact || risk.gridStabilityImpact) && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive mb-1">Critical Risk</p>
                  <p className="text-sm text-destructive/80">
                    {risk.safetyImpact && "This risk has potential safety implications. "}
                    {risk.gridStabilityImpact && "This risk could impact grid stability and cause cascading failures."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RiskAssessment({ risk }: { risk: SecurityRisk }) {
  const getLikelihoodScore = (likelihood: string) => {
    switch (likelihood) {
      case "very-high": return 5;
      case "high": return 4;
      case "medium": return 3;
      case "low": return 2;
      case "very-low": return 1;
      default: return 3;
    }
  };

  const getImpactScore = (impact: string) => {
    switch (impact) {
      case "very-high": return 5;
      case "high": return 4;
      case "medium": return 3;
      case "low": return 2;
      case "very-low": return 1;
      default: return 3;
    }
  };

  const likelihoodScore = getLikelihoodScore(risk.inherentLikelihood);
  const impactScore = getImpactScore(risk.inherentImpact);
  const calculatedScore = likelihoodScore * impactScore * 4; // Scale to 100

  return (
    <div className="space-y-6">
      {/* Risk Matrix */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Risk Assessment Matrix
        </h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Likelihood</p>
              <Badge
                variant={
                  likelihoodScore >= 4 ? "destructive" :
                    likelihoodScore >= 3 ? "secondary" : "default"
                }
                className="text-sm px-3 py-1"
              >
                {risk.inherentLikelihood.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} ({likelihoodScore}/5)
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Impact</p>
              <Badge
                variant={
                  impactScore >= 4 ? "destructive" :
                    impactScore >= 3 ? "secondary" : "default"
                }
                className="text-sm px-3 py-1"
              >
                {risk.inherentImpact.replace(/\b\w/g, l => l.toUpperCase())} ({impactScore}/5)
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Calculated Risk Score</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-primary">{risk.inherentRiskScore}</span>
              <span className="text-sm text-muted-foreground">
                Risk Level: {(risk.inherentRiskLevel || '').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Level Interpretation */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary" />
          Risk Level Interpretation
        </h4>
        <div className="space-y-3">
          {risk.inherentRiskScore >= 70 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive mb-1">High Risk</p>
                  <p className="text-sm text-destructive/80">
                    Immediate action required. This risk poses significant threat to operations
                    and requires urgent treatment and continuous monitoring.
                  </p>
                </div>
              </div>
            </div>
          )}

          {risk.inherentRiskScore >= 40 && risk.inherentRiskScore < 70 && (
            <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning mb-1">Medium Risk</p>
                  <p className="text-sm text-warning/80">
                    Moderate risk requiring planned treatment. Monitor regularly and
                    implement controls within reasonable timeframe.
                  </p>
                </div>
              </div>
            </div>
          )}

          {risk.inherentRiskScore < 40 && (
            <div className="bg-success/5 border border-success/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-success mb-1">Low Risk</p>
                  <p className="text-sm text-success/80">
                    Acceptable risk level. Monitor periodically and maintain existing controls.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Risk Factors */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Risk Factors Analysis
        </h4>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Contributing Factors</p>
            <div className="space-y-2">
              {risk.riskCategory === "operational" && (
                <div className="text-sm">• Remote access to control systems</div>
              )}
              {risk.riskCategory === "cyber-attack" && (
                <div className="text-sm">• Network connectivity to SCADA systems</div>
              )}
              {risk.riskCategory === "configuration-error" && (
                <div className="text-sm">• Potential for security system override</div>
              )}
              {risk.riskCategory === "insider-threat" && (
                <div className="text-sm">• Unauthorized internal access attempts</div>
              )}
              <div className="text-sm">• Operational environment complexity</div>
              <div className="text-sm">• Critical infrastructure dependencies</div>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Potential Consequences</p>
            <div className="space-y-2">
              {risk.inherentImpact === "very-high" && (
                <>
                  <div className="text-sm text-destructive">• Grid shutdown or loss</div>
                  <div className="text-sm text-destructive">• Safety incidents or environmental impact</div>
                  <div className="text-sm text-destructive">• Regulatory violations and penalties</div>
                </>
              )}
              {risk.inherentImpact === "high" && (
                <>
                  <div className="text-sm text-warning">• Significant operational disruption</div>
                  <div className="text-sm text-warning">• Financial losses and recovery costs</div>
                  <div className="text-sm text-warning">• Reputation damage</div>
                </>
              )}
              {risk.inherentImpact === "medium" && (
                <>
                  <div className="text-sm">• Limited operational impact</div>
                  <div className="text-sm">• Manageable financial consequences</div>
                  <div className="text-sm">• Contained security incident</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TreatmentPlan({ risk }: { risk: SecurityRisk }) {
  return (
    <div className="space-y-6">
      {/* Treatment Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Treatment Plan
        </h4>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Current Status</p>
            <Badge
              variant={
                risk.status === "closed"
                  ? "default"
                  : risk.status === "mitigating"
                    ? "secondary"
                    : "outline"
              }
              className="text-sm px-3 py-1"
            >
              {risk.status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Treatment Strategy</p>
            <Badge variant="outline" className="text-sm px-3 py-1">
              {risk.treatmentStrategy.replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>
          {risk.treatmentPlan && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Treatment Plan</p>
              <p className="text-sm">{risk.treatmentPlan}</p>
            </div>
          )}
          {risk.treatmentOwner && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Treatment Owner</p>
              <p className="text-sm font-medium">{risk.treatmentOwner}</p>
            </div>
          )}
        </div>
      </div>

      {/* Treatment Progress */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Treatment Progress
        </h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Progress</p>
              <p className="text-2xl font-bold text-primary">
                {risk.status === "closed" ? "100%" :
                  risk.status === "mitigating" ? "65%" :
                    risk.status === "accepted" ? "0%" : "25%"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Expected Completion</p>
              <p className="text-sm font-medium">
                {risk.status === "closed" ? "Completed" :
                  risk.status === "mitigating" ? "Q2 2024" :
                    risk.status === "accepted" ? "Risk Accepted" : "Q3 2024"}
              </p>
            </div>
          </div>

          {risk.status === "closed" && (
            <div className="bg-success/5 border border-success/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-success mb-1">Treatment Completed</p>
                  <p className="text-sm text-success/80">
                    Risk treatment measures have been successfully implemented and are effective.
                  </p>
                </div>
              </div>
            </div>
          )}

          {risk.status === "mitigating" && (
            <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning mb-1">Treatment In Progress</p>
                  <p className="text-sm text-warning/80">
                    Risk treatment activities are currently underway. Regular monitoring required.
                  </p>
                </div>
              </div>
            </div>
          )}

          {risk.status === "accepted" && (
            <div className="bg-info/5 border border-info/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-info mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-info mb-1">Risk Accepted</p>
                  <p className="text-sm text-info/80">
                    Risk has been formally accepted with appropriate justification and approval.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Treatment Controls */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Treatment Controls
        </h4>
        <div className="space-y-3">
          {risk.riskCategory === "operational" && (
            <>
              <div className="bg-secondary/50 border border-border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <div>
                    <p className="text-sm font-medium">Enhanced Asset Monitoring</p>
                    <p className="text-xs text-muted-foreground">Continuous monitoring of transmission assets</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {risk.riskCategory === "cyber-attack" && (
            <>
              <div className="bg-secondary/50 border border-border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <div>
                    <p className="text-sm font-medium">Network Segmentation</p>
                    <p className="text-xs text-muted-foreground">Isolation of critical control networks</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {risk.riskCategory === "system-vulnerability" && (
            <>
              <div className="bg-secondary/50 border border-border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <div>
                    <p className="text-sm font-medium">Patch Management</p>
                    <p className="text-xs text-muted-foreground">Regular patching of critical systems</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ImpactAnalysis({ risk }: { risk: SecurityRisk }) {
  return (
    <div className="space-y-6">
      {/* Affected Infrastructure */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          Affected Infrastructure
        </h4>
        <div className="space-y-4">
          {risk.appliesToSites && risk.appliesToSites.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Applicable Sites ({risk.appliesToSites.length})</p>
              <div className="flex flex-wrap gap-2">
                {risk.appliesToSites.slice(0, 5).map((siteId, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    Site {siteId.slice(-8)}
                  </Badge>
                ))}
                {risk.appliesToSites.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    +{risk.appliesToSites.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {risk.affectedAssetTypes && risk.affectedAssetTypes.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Affected Asset Types ({risk.affectedAssetTypes.length})</p>
              <div className="flex flex-wrap gap-2">
                {risk.affectedAssetTypes.map((assetType, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {assetType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {risk.affectedProtocols && risk.affectedProtocols.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Affected Protocols ({risk.affectedProtocols.length})</p>
              <div className="flex flex-wrap gap-2">
                {risk.affectedProtocols.map((protocol, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {protocol}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Impact Metrics */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Impact Assessment
        </h4>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center mx-auto mb-2">
                <Building2 className="w-6 h-6 text-info" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">Sites at Risk</p>
              <p className="text-sm font-medium">{risk.appliesToSites?.length || 0}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center mx-auto mb-2">
                <Settings className="w-6 h-6 text-warning" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">Asset Types</p>
              <p className="text-sm font-medium">{risk.affectedAssetTypes?.length || 0}</p>
            </div>
            <div className="text-center">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2 ${risk.inherentRiskScore >= 80 ? "bg-destructive/10" :
                risk.inherentRiskScore >= 60 ? "bg-warning/10" :
                  risk.inherentRiskScore >= 40 ? "bg-info/10" : "bg-success/10"
                }`}>
                <AlertTriangle className={`w-6 h-6 ${risk.inherentRiskScore >= 80 ? "text-destructive" :
                  risk.inherentRiskScore >= 60 ? "text-warning" :
                    risk.inherentRiskScore >= 40 ? "text-info" : "text-success"
                  }`} />
              </div>
              <p className="text-xs text-muted-foreground mb-1">Risk Score</p>
              <p className="text-sm font-medium">{risk.inherentRiskScore}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Impact */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary" />
          Business Impact Analysis
        </h4>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Potential Consequences</p>
            <div className="space-y-2">
              {risk.inherentImpact === "very-high" && (
                <>
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="w-3 h-3" />
                    Grid instability or cascading failures
                  </div>
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="w-3 h-3" />
                    Widespread power outages affecting customers
                  </div>
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="w-3 h-3" />
                    Safety incidents with potential for injury
                  </div>
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="w-3 h-3" />
                    Regulatory violations and significant penalties
                  </div>
                </>
              )}

              {risk.inherentImpact === "high" && (
                <>
                  <div className="flex items-center gap-2 text-sm text-warning">
                    <AlertCircle className="w-3 h-3" />
                    Significant operational disruption at transmission facilities
                  </div>
                  <div className="flex items-center gap-2 text-sm text-warning">
                    <AlertCircle className="w-3 h-3" />
                    Customer service interruptions and complaints
                  </div>
                  <div className="flex items-center gap-2 text-sm text-warning">
                    <AlertCircle className="w-3 h-3" />
                    Financial losses and recovery costs
                  </div>
                </>
              )}

              {risk.inherentImpact === "medium" && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="w-3 h-3" />
                    Limited operational impact on transmission systems
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="w-3 h-3" />
                    Manageable service disruptions
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="w-3 h-3" />
                    Contained security incident
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Recovery Considerations</p>
            <div className="space-y-2">
              <div className="text-sm">• Emergency response procedures activation</div>
              <div className="text-sm">• Incident command structure deployment</div>
              <div className="text-sm">• Regulatory notification requirements</div>
              <div className="text-sm">• Business continuity plan execution</div>
              <div className="text-sm">• Stakeholder communication protocols</div>
            </div>
          </div>
        </div>
      </div>

      {/* Power Transmission Considerations */}
      <div className="bg-info/5 border border-info/20 rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-info" />
          Power Transmission Considerations
        </h4>
        <div className="space-y-3">
          <p className="text-sm text-info">
            This risk specifically affects power transmission infrastructure with unique considerations
            for grid stability, customer impact, and regulatory requirements.
          </p>

          <div className="space-y-2">
            {risk.riskCategory === "cyber-attack" && (
              <div className="text-sm text-info">
                • Cyber attacks on transmission systems can cause widespread outages
              </div>
            )}
            {risk.riskCategory === "system-vulnerability" && (
              <div className="text-sm text-info">
                • System vulnerabilities may expose critical transmission controls
              </div>
            )}
            {risk.riskCategory === "insider-threat" && (
              <div className="text-sm text-info">
                • Insider threats have privileged access to transmission operations
              </div>
            )}
            {risk.gridStabilityImpact && (
              <div className="text-sm text-info">
                • Risk could impact grid stability and cause cascading failures
              </div>
            )}
            {risk.customerImpactEstimate && (
              <div className="text-sm text-info">
                • Estimated customer impact: {risk.customerImpactEstimate.toLocaleString()} customers
              </div>
            )}
            {risk.mwAtRisk && (
              <div className="text-sm text-info">
                • Power at risk: {risk.mwAtRisk} MW
              </div>
            )}
            <div className="text-sm text-info">
              • Regulatory oversight from NERC, FERC, and state utility commissions
            </div>
            <div className="text-sm text-info">
              • Potential for cascading effects across interconnected transmission networks
            </div>
          </div>
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

function RiskOverviewDashboard({
  statusData,
  riskData,
  criticalRisks,
  onRiskSelect
}: {
  statusData: OverviewChartData[];
  riskData: OverviewChartData[];
  criticalRisks: SecurityRisk[];
  onRiskSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-primary" />
            Risk Status Distribution
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
            Highest Priority Risks (By Score)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={riskData} layout="vertical" margin={{ left: 40, right: 20 }}>
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
                  {riskData.map((_entry, index) => (
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
          Risk Assessment Pillars
        </h4>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Grid Stability Impact</p>
              <p className="text-xs text-muted-foreground">Evaluation of risks that could lead to transmission failures or cascading outages.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Cyber-Physical Security</p>
              <p className="text-xs text-muted-foreground">Integration of digital threats with physical infrastructure safety protocols.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Continuous Monitoring</p>
              <p className="text-xs text-muted-foreground">Real-time tracking of treatment plan efficacy and residual risk levels.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          Highest Priority Risks
        </h4>
        <div className="space-y-4">
          {criticalRisks.map(risk => (
            <div
              key={risk.id}
              className="group flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onRiskSelect(risk.id)}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${risk.inherentRiskScore >= 80 ? 'bg-destructive' : risk.inherentRiskScore >= 60 ? 'bg-warning' : 'bg-success'}`} />
                <span className="text-sm font-medium truncate max-w-[150px]">{risk.riskName}</span>
              </div>
              <span className="text-xs font-bold">{risk.inherentRiskScore}</span>
            </div>
          ))}
          <div className="pt-2 border-t border-border mt-2">
            <p className="text-xs text-muted-foreground italic">Select a risk from the list to view assessment details, treatment plans, and impact analysis.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
