import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Eye,
  Shield,
  AlertTriangle,
  Clock,
  Activity,
  Target,
  Zap,
  Globe,
  FileText,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Hash,
  Network,
  Mail,
  Server,
  Database,
  Cpu,
  Wifi,
  Lock,
} from "lucide-react";
import { IdentityOverview } from "@/components/security/IdentityOverview";
import { ThreatsDistributionChart } from "@/components/security/ThreatsDistributionChart";
import { ThreatsTopList } from "@/components/security/ThreatsTopList";
import {
  getThreatIntelligenceFeeds,
  getThreatIntelligenceIndicators,
  getThreatIntelligenceMatches,
  getThreatCampaigns
} from "@/lib/threatMonitoringQueries";
import {
  AnalysisMetric
} from "@/components/security/IdentityGovernanceMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  ThreatIntelligenceFeed,
  ThreatIntelligenceIndicator,
  ThreatIntelligenceMatch,
  ThreatCampaign,
  ThreatType,
  ThreatConfidence
} from "@/types/security";

// Helper components for tab refinements

function getIntelHeuristics(indicator: ThreatIntelligenceIndicator) {
  const isHighSeverity = indicator.relevance === 'critical' || indicator.relevance === 'high';

  return {
    matchFidelity: isHighSeverity ? "94%" : "68%",
    historicalFrequency: isHighSeverity ? "High" : "Low",
    threatProximity: indicator.targetsOtSystems ? "Internal" : "Peripheral",
    behavioralScore: isHighSeverity ? "Critical" : "Standard"
  };
}

export function ThreatIntelligence() {
  const { currentTenant } = useApp();

  // State management
  const [indicators, setIndicators] = useState<ThreatIntelligenceIndicator[]>([]);
  const [feeds, setFeeds] = useState<ThreatIntelligenceFeed[]>([]);
  const [matches, setMatches] = useState<ThreatIntelligenceMatch[]>([]);
  const [campaigns, setCampaigns] = useState<ThreatCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(null);

  // Filter states
  const [indicatorTypeFilter, setIndicatorTypeFilter] = useState<string>("all");
  const [confidenceFilter, setConfidenceFilter] = useState<string>("all");
  const [feedFilter, setFeedFilter] = useState<string>("all");
  const [transmissionRelevantOnly, setTransmissionRelevantOnly] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("relevance");

  // Load threat intelligence data
  useEffect(() => {
    const loadThreatIntelligence = async () => {
      try {
        setLoading(true);
        const [indicatorData, feedData, matchData, campaignData] = await Promise.all([
          getThreatIntelligenceIndicators(currentTenant.id, { limit: 100 }),
          getThreatIntelligenceFeeds(currentTenant.id),
          getThreatIntelligenceMatches(currentTenant.id),
          getThreatCampaigns(currentTenant.id)
        ]);

        setIndicators(indicatorData);
        setFeeds(feedData);
        setMatches(matchData);
        setCampaigns(campaignData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load threat intelligence');
      } finally {
        setLoading(false);
      }
    };

    loadThreatIntelligence();
  }, [currentTenant.id]);

  // Filter and sort indicators
  const filteredAndSortedIndicators = useMemo(() => {
    let result = [...indicators];

    // Apply search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(indicator =>
        indicator.indicatorValue.toLowerCase().includes(query) ||
        (indicator.threatName || '').toLowerCase().includes(query) ||
        indicator.indicatorType.toLowerCase().includes(query) ||
        (indicator.description || '').toLowerCase().includes(query)
      );
    }

    // Apply indicator type filter
    if (indicatorTypeFilter !== "all") {
      result = result.filter((indicator) => indicator.indicatorType === indicatorTypeFilter);
    }

    // Apply confidence filter
    if (confidenceFilter !== "all") {
      result = result.filter((indicator) => indicator.confidence === confidenceFilter);
    }

    // Apply feed filter
    if (feedFilter !== "all") {
      result = result.filter((indicator) => indicator.feedId === feedFilter);
    }

    // Apply transmission relevance filter
    if (transmissionRelevantOnly) {
      result = result.filter((indicator) =>
        indicator.transmissionRelevanceScore && indicator.transmissionRelevanceScore >= 50
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "relevance") {
        const aRelevance = a.transmissionRelevanceScore || 0;
        const bRelevance = b.transmissionRelevanceScore || 0;
        if (aRelevance !== bRelevance) return bRelevance - aRelevance;
        return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      }
      if (sortBy === "lastSeen") {
        return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      }
      if (sortBy === "confidence") {
        const order = { high: 0, medium: 1, low: 2 };
        return order[(a.confidence as any)] - order[(b.confidence as any)];
      }
      return 0;
    });

    return result;
  }, [indicators, indicatorTypeFilter, confidenceFilter, feedFilter, transmissionRelevantOnly, searchTerm, sortBy]);

  const selectedIndicator = indicators.find((i) => i.id === selectedIndicatorId);

  // Helper functions
  const getConfidenceColor = (confidence: ThreatConfidence) => {
    switch (confidence) {
      case "high":
        return "bg-success/10 text-success";
      case "medium":
        return "bg-warning/10 text-warning";
      case "low":
        return "bg-secondary text-muted-foreground";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  const getIndicatorTypeIcon = (type: ThreatType) => {
    switch (type) {
      case "malware":
        return <Shield className="w-4 h-4" />;
      case "apt-group":
        return <Target className="w-4 h-4" />;
      case "vulnerability":
        return <AlertTriangle className="w-4 h-4" />;
      case "ioc-ip":
        return <Network className="w-4 h-4" />;
      case "ioc-domain":
        return <Globe className="w-4 h-4" />;
      case "ioc-hash":
        return <Hash className="w-4 h-4" />;
      case "attack-pattern":
        return <Activity className="w-4 h-4" />;
      case "campaign":
        return <Zap className="w-4 h-4" />;
      case "tool":
        return <Cpu className="w-4 h-4" />;
      case "infrastructure":
        return <Server className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const getIndicatorTypeLabel = (type: ThreatType) => {
    if (!type) return "Unknown";
    switch (type) {
      case "ioc-ip":
        return "IP Address";
      case "ioc-domain":
        return "Domain";
      case "ioc-hash":
        return "File Hash";
      case "apt-group":
        return "APT Group";
      case "attack-pattern":
        return "Attack Pattern";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const tabs = selectedIndicator
    ? [
      {
        id: "details",
        label: "Indicator Details",
        content: <IndicatorDetails indicator={selectedIndicator} />,
      },
      {
        id: "context",
        label: "Transmission Context",
        content: <TransmissionContext indicator={selectedIndicator} />,
      },
      {
        id: "matches",
        label: "Active Matches",
        content: <IndicatorMatches indicator={selectedIndicator} matches={matches} />,
      },
      {
        id: "mitigation",
        label: "Mitigation",
        content: <IndicatorMitigation indicator={selectedIndicator} />,
      },
    ]
    : [
      {
        id: "overview",
        label: "Overview",
        content: (
          <IdentityOverview
            title="Threat Intelligence Overview"
            description="Integrated threat intelligence from multiple feeds to identify and mitigate threats targeting transmission infrastructure."
            metrics={[
              {
                title: "Total Indicators",
                value: indicators.length,
                icon: Eye,
                variant: "primary" as const
              },
              {
                title: "Active Feeds",
                value: feeds.filter(f => f.status === 'active').length,
                icon: Globe,
                variant: "success" as const
              },
              {
                title: "Active Matches",
                value: matches.filter(m => m.responseStatus === 'active').length,
                icon: Target,
                variant: matches.filter(m => m.responseStatus === 'active').length > 0 ? "destructive" as const : "default" as const
              },
              {
                title: "Active Campaigns",
                value: campaigns.filter(c => c.isActive).length,
                icon: Zap,
                variant: "warning" as const
              }
            ]}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
              <ThreatsDistributionChart
                title="Indicators by Confidence Level"
                icon={Shield}
                data={[
                  { name: 'High', value: indicators.filter(i => i.confidence === 'high').length, color: 'hsl(var(--success))' },
                  { name: 'Medium', value: indicators.filter(i => i.confidence === 'medium').length, color: 'hsl(var(--warning))' },
                  { name: 'Low', value: indicators.filter(i => i.confidence === 'low').length, color: 'hsl(var(--secondary))' },
                ].filter(d => d.value > 0)}
                centerText={indicators.length.toString()}
              />
              <ThreatsTopList
                title="High-Confidence Transmission Threats"
                icon={AlertTriangle}
                items={indicators
                  .filter(i => i.confidence === 'high' && (i.transmissionRelevanceScore || 0) >= 70)
                  .map(i => ({
                    id: i.id,
                    title: i.indicatorValue,
                    subtitle: `Relevance: ${i.transmissionRelevanceScore}%`,
                    icon: getIndicatorTypeIcon(i.indicatorType).type,
                    variant: 'destructive' as const
                  }))
                  .slice(0, 5)}
                onItemClick={(id) => setSelectedIndicatorId(id)}
                emptyMessage="No high-confidence transmission threats"
              />
            </div>
          </IdentityOverview>
        ),
      }
    ];



  if (loading) {
    return <LoadingState loadingText="Analysing threat signals..." />;
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
        title="Threat Intelligence"
        context="DEWA – Transmission"
        count={filteredAndSortedIndicators.length}
        searchPlaceholder="Search"
        onSearch={setSearchTerm}
        filters={[
          {
            key: "type", label: "Indicator Type", value: indicatorTypeFilter, options: [
              { label: "All Types", value: "all" },
              { label: "Malware", value: "malware" },
              { label: "APT Group", value: "apt-group" },
              { label: "Vulnerability", value: "vulnerability" },
              { label: "IP Address", value: "ioc-ip" },
              { label: "Domain", value: "ioc-domain" },
              { label: "File Hash", value: "ioc-hash" },
              { label: "Attack Pattern", value: "attack-pattern" },
              { label: "Campaign", value: "campaign" },
              { label: "Tool", value: "tool" },
              { label: "Infrastructure", value: "infrastructure" },
            ], onChange: setIndicatorTypeFilter
          },
          {
            key: "confidence", label: "Confidence", value: confidenceFilter, options: [
              { label: "All Levels", value: "all" },
              { label: "High", value: "high" },
              { label: "Medium", value: "medium" },
              { label: "Low", value: "low" },
            ], onChange: setConfidenceFilter
          },
          {
            key: "feed", label: "Feed Source", value: feedFilter, options: [
              { label: "All Sources", value: "all" },
              ...feeds.map(f => ({ label: f.name, value: f.id }))
            ], onChange: setFeedFilter
          }
        ]}
        sortOptions={[
          { label: "Relevance Score", value: "relevance" },
          { label: "Last Seen", value: "lastSeen" },
          { label: "Confidence", value: "confidence" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        <div className="px-3 pb-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="transmission-relevant"
            checked={transmissionRelevantOnly}
            onChange={(e) => setTransmissionRelevantOnly(e.target.checked)}
            className="w-3 h-3 rounded border-border"
          />
          <label htmlFor="transmission-relevant" className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            Transmission Relevant Only
          </label>
        </div>

        {filteredAndSortedIndicators.length === 0 ? (
          <EmptyState
            icon={Eye}
            title="No threat intelligence found"
            description="No indicators match your current filters"
          />
        ) : (
          filteredAndSortedIndicators.map((indicator) => (
            <ListPaneItem
              key={indicator.id}
              title={indicator.indicatorValue}
              description={indicator.threatName || indicator.description || `${getIndicatorTypeLabel(indicator.indicatorType)} indicator`}
              status={indicator.confidence === 'high' ? 'offline' : (indicator.confidence === 'medium' ? 'maintenance' : 'online')}
              category={getIndicatorTypeLabel(indicator.indicatorType)}
              value={`${indicator.transmissionRelevanceScore || 0}%`}
              isSelected={selectedIndicatorId === indicator.id}
              onClick={() => setSelectedIndicatorId(indicator.id)}
            />
          ))
        )}
      </ListPane>

      <WorkPane
        title={selectedIndicator ? selectedIndicator.indicatorValue : "Threat Intelligence"}
        subtitle={selectedIndicator ? `${selectedIndicator.confidence.toUpperCase()} - ${getIndicatorTypeLabel(selectedIndicator.indicatorType)}` : "Overview"}
        tabs={tabs}
      />
    </>
  );
}

function IndicatorDetails({ indicator }: { indicator: ThreatIntelligenceIndicator }) {
  return (
    <div className="space-y-6">
      {/* Indicator Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${indicator.confidence === "high"
              ? "bg-success/10"
              : indicator.confidence === "medium"
                ? "bg-warning/10"
                : "bg-secondary"
              }`}
          >
            <Eye
              className={`w-6 h-6 ${indicator.confidence === "high"
                ? "text-success"
                : indicator.confidence === "medium"
                  ? "text-warning"
                  : "text-muted-foreground"
                }`}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold font-mono">{indicator.indicatorValue}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {indicator.threatName || indicator.description || `${indicator.indicatorType} indicator`}
            </p>
            <div className="flex items-center gap-4 mt-4">
              <span
                className={`text-xs px-3 py-1 rounded-full ${indicator.confidence === "high"
                  ? "bg-success/10 text-success"
                  : indicator.confidence === "medium"
                    ? "bg-warning/10 text-warning"
                    : "bg-secondary text-muted-foreground"
                  }`}
              >
                {indicator.confidence.toUpperCase()} CONFIDENCE
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">
                {indicator.indicatorType.replace('-', ' ').toUpperCase()}
              </span>
              {indicator.transmissionRelevanceScore && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {indicator.transmissionRelevanceScore}% Transmission Relevance
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Indicator Information */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Indicator Information</h4>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="p-4 flex items-center gap-3">
            <Database className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Indicator Type</p>
              <p className="text-sm font-medium">{indicator.indicatorType.replace('-', ' ')}</p>
            </div>
          </div>
          {indicator.threatActor && (
            <div className="p-4 flex items-center gap-3">
              <Target className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Threat Actor</p>
                <p className="text-sm font-medium">{indicator.threatActor}</p>
              </div>
            </div>
          )}
          {indicator.campaign && (
            <div className="p-4 flex items-center gap-3">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Campaign</p>
                <p className="text-sm font-medium">{indicator.campaign}</p>
              </div>
            </div>
          )}
          <div className="p-4 flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">First Seen</p>
              <p className="text-sm font-medium">
                {new Date(indicator.firstSeen).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Last Seen</p>
              <p className="text-sm font-medium">
                {new Date(indicator.lastSeen).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm font-medium">{indicator.isActive ? 'Active' : 'Inactive'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Targeted Sectors and Technologies */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Targeting Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <h5 className="text-xs font-medium text-muted-foreground mb-2">Targeted Sectors</h5>
            <ul className="space-y-1 text-sm">
              {(indicator.targetedSectors || []).map((sector, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-muted-foreground" />
                  <span>{sector}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h5 className="text-xs font-medium text-muted-foreground mb-2">Targeted Technologies</h5>
            <ul className="space-y-1 text-sm">
              {(indicator.targetedTechnologies || []).map((tech, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Cpu className="w-3 h-3 text-muted-foreground" />
                  <span>{tech}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* MITRE ATT&CK Information */}
      {((indicator.tactics || []).length > 0 || (indicator.techniques || []).length > 0) && (
        <div>
          <h4 className="text-sm font-semibold mb-3">MITRE ATT&CK Framework</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(indicator.tactics || []).length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h5 className="text-xs font-medium text-muted-foreground mb-2">Tactics</h5>
                <div className="flex flex-wrap gap-1">
                  {(indicator.tactics || []).map((tactic, index) => (
                    <span key={index} className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {tactic}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(indicator.techniques || []).length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h5 className="text-xs font-medium text-muted-foreground mb-2">Techniques</h5>
                <div className="flex flex-wrap gap-1">
                  {(indicator.techniques || []).map((technique, index) => (
                    <span key={index} className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                      {technique}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {(indicator.tags || []).length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {(indicator.tags || []).map((tag, index) => (
              <span key={index} className="text-xs px-2 py-1 rounded bg-secondary text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TransmissionContext({ indicator }: { indicator: ThreatIntelligenceIndicator }) {
  return (
    <div className="space-y-6">
      {/* Transmission Relevance Score */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Transmission Relevance</h3>
            <p className="text-sm text-muted-foreground">
              Assessment of threat relevance to power transmission infrastructure
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {indicator.transmissionRelevanceScore || 0}%
            </p>
            <p className="text-xs text-muted-foreground">Relevance Score</p>
          </div>
          <div className="text-center">
            <div className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${indicator.targetsOtSystems ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
              }`}>
              {indicator.targetsOtSystems ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
              {indicator.targetsOtSystems ? "OT Target" : "No OT Target"}
            </div>
          </div>
          <div className="text-center">
            <div className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${indicator.targetsScada ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
              }`}>
              {indicator.targetsScada ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
              {indicator.targetsScada ? "SCADA Target" : "No SCADA Target"}
            </div>
          </div>
        </div>
      </div>

      {/* Transmission System Targeting */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Transmission System Impact</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">OT Systems</p>
              <div className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${indicator.targetsOtSystems ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                }`}>
                {indicator.targetsOtSystems ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                {indicator.targetsOtSystems ? "Targeted" : "Not Targeted"}
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">SCADA Systems</p>
              <div className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${indicator.targetsScada ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                }`}>
                {indicator.targetsScada ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                {indicator.targetsScada ? "Targeted" : "Not Targeted"}
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Safety Systems Impact</p>
            <div className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${indicator.affectsSafetySystems ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
              }`}>
              {indicator.affectsSafetySystems ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
              {indicator.affectsSafetySystems ? "Safety Impact" : "No Safety Impact"}
            </div>
          </div>
        </div>
      </div>

      {/* Targeted Protocols */}
      {indicator.targetsProtocols && indicator.targetsProtocols.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Targeted Transmission Protocols</h4>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex flex-wrap gap-2">
              {indicator.targetsProtocols.map((protocol, index) => (
                <span key={index} className="text-xs px-3 py-1 rounded bg-destructive/10 text-destructive flex items-center gap-1">
                  <Wifi className="w-3 h-3" />
                  {protocol}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Risk Assessment */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Risk Assessment</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Operational Impact Risk</span>
              <span className={`text-xs px-2 py-1 rounded ${indicator.targetsOtSystems || indicator.targetsScada
                ? "bg-warning/10 text-warning"
                : "bg-success/10 text-success"
                }`}>
                {indicator.targetsOtSystems || indicator.targetsScada ? "High" : "Low"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Safety System Risk</span>
              <span className={`text-xs px-2 py-1 rounded ${indicator.affectsSafetySystems
                ? "bg-destructive/10 text-destructive"
                : "bg-success/10 text-success"
                }`}>
                {indicator.affectsSafetySystems ? "Critical" : "Low"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Protocol Security Risk</span>
              <span className={`text-xs px-2 py-1 rounded ${indicator.targetsProtocols && indicator.targetsProtocols.length > 0
                ? "bg-warning/10 text-warning"
                : "bg-success/10 text-success"
                }`}>
                {indicator.targetsProtocols && indicator.targetsProtocols.length > 0 ? "Medium" : "Low"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transmission-Specific Warning */}
      {(indicator.targetsOtSystems || indicator.targetsScada || indicator.affectsSafetySystems) && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-warning mb-2">Transmission Infrastructure Alert</h4>
              <div className="text-sm text-warning/80 space-y-1">
                {indicator.targetsOtSystems && (
                  <p>• This threat specifically targets operational technology systems used in power transmission.</p>
                )}
                {indicator.targetsScada && (
                  <p>• This threat targets SCADA systems critical for transmission operations and monitoring.</p>
                )}
                {indicator.affectsSafetySystems && (
                  <p>• This threat may impact safety-critical systems. Immediate coordination with safety personnel required.</p>
                )}
                <p>• Enhanced monitoring and protective measures should be implemented for transmission infrastructure.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IndicatorMatches({ indicator, matches }: {
  indicator: ThreatIntelligenceIndicator;
  matches: ThreatIntelligenceMatch[]
}) {
  const indicatorMatches = matches.filter(match => match.indicatorId === indicator.id);

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-warning/10 text-warning";
      case "investigating":
        return "bg-primary/10 text-primary";
      case "responded":
        return "bg-success/10 text-success";
      case "closed":
        return "bg-secondary text-muted-foreground";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Indicator Behavioral Insights */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Behavioral Insights
        </h4>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <AnalysisMetric
            label="Match Fidelity"
            value={getIntelHeuristics(indicator).matchFidelity}
            icon={Zap}
            variant="card"
            status={indicator.relevance === 'critical' ? 'failed' : 'warning'}
          />
          <AnalysisMetric
            label="Historical Frequency"
            value={getIntelHeuristics(indicator).historicalFrequency}
            icon={Activity}
            variant="card"
            status="default"
          />
          <AnalysisMetric
            label="Threat Proximity"
            value={getIntelHeuristics(indicator).threatProximity}
            icon={Globe}
            variant="card"
            status={indicator.targetsOtSystems ? 'warning' : 'default'}
          />
          <AnalysisMetric
            label="Behavioral Score"
            value={getIntelHeuristics(indicator).behavioralScore}
            icon={TrendingUp}
            variant="card"
            status={getIntelHeuristics(indicator).behavioralScore === 'Critical' ? 'failed' : 'warning'}
          />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-warning" />
          Active Matches ({indicatorMatches.length})
        </h4>

        {indicatorMatches.length > 0 ? (
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {indicatorMatches.map((match) => (
              <div key={match.id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-medium">{match.matchSource}</p>
                    <p className="text-xs text-muted-foreground font-mono">{match.matchedValue}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {match.matchType}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${getMatchStatusColor(match.responseStatus)}`}>
                      {match.responseStatus}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                  <span>Confidence: {Math.round(match.matchConfidence * 100)}%</span>
                  <span>Detected: {new Date(match.matchTimestamp).toLocaleString()}</span>
                  <span className={`px-2 py-0.5 rounded ${match.isConfirmed ? "bg-success/10 text-success" :
                    match.isFalsePositive ? "bg-secondary text-muted-foreground" :
                      "bg-warning/10 text-warning"
                    }`}>
                    {match.isConfirmed ? "Confirmed" : match.isFalsePositive ? "False Positive" : "Under Review"}
                  </span>
                </div>
                {match.analystAssessment && (
                  <div className="bg-secondary/50 rounded p-2 mt-2">
                    <p className="text-xs text-muted-foreground">{match.analystAssessment}</p>
                  </div>
                )}
                {match.actionsTaken && match.actionsTaken.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Actions Taken:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {match.actionsTaken.map((action, index) => (
                        <li key={index} className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-success" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">No active matches found</p>
            <p className="text-xs text-muted-foreground mt-1">
              This indicator has no matches in your current infrastructure
            </p>
          </div>
        )}
      </div>

      {/* Match Summary */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Match Summary</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Matches</p>
            <p className="text-2xl font-bold">{indicatorMatches.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Confirmed Matches</p>
            <p className="text-2xl font-bold text-destructive">
              {indicatorMatches.filter(m => m.isConfirmed).length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">False Positives</p>
            <p className="text-2xl font-bold text-muted-foreground">
              {indicatorMatches.filter(m => m.isFalsePositive).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function IndicatorMitigation({ indicator }: { indicator: ThreatIntelligenceIndicator }) {
  return (
    <div className="space-y-6">
      {/* Mitigation Strategies */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Mitigation Strategies</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <ul className="space-y-2 text-sm">
            {(indicator.mitigationStrategies || []).map((strategy, index) => (
              <li key={index} className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-primary mt-0.5" />
                <span>{strategy}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Detection Rules */}
      {indicator.detectionRules && indicator.detectionRules.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Detection Rules</h4>
          <div className="bg-card border border-border rounded-lg p-4">
            <ul className="space-y-2 text-sm">
              {indicator.detectionRules.map((rule, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Eye className="w-4 h-4 text-warning mt-0.5" />
                  <span className="font-mono text-xs">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Recommended Actions</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <ul className="space-y-2 text-sm">
            {(indicator.recommendedActions || []).map((action, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Transmission-Specific Recommendations */}
      {(indicator.targetsOtSystems || indicator.targetsScada || indicator.affectsSafetySystems) && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Transmission-Specific Actions</h4>
          <div className="bg-card border border-border rounded-lg p-4">
            <ul className="space-y-2 text-sm">
              {indicator.targetsOtSystems && (
                <li className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-warning mt-0.5" />
                  <span>Implement enhanced monitoring for OT network segments and asset communications</span>
                </li>
              )}
              {indicator.targetsScada && (
                <li className="flex items-start gap-2">
                  <Database className="w-4 h-4 text-destructive mt-0.5" />
                  <span>Review SCADA system access controls and implement additional authentication measures</span>
                </li>
              )}
              {indicator.affectsSafetySystems && (
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                  <span>Coordinate with safety personnel and implement emergency response procedures</span>
                </li>
              )}
              {indicator.targetsProtocols && indicator.targetsProtocols.length > 0 && (
                <li className="flex items-start gap-2">
                  <Wifi className="w-4 h-4 text-warning mt-0.5" />
                  <span>Enhance protocol security monitoring for {indicator.targetsProtocols.join(', ')}</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <Network className="w-4 h-4 text-primary mt-0.5" />
                <span>Implement network segmentation and micro-segmentation for critical transmission assets</span>
              </li>
              <li className="flex items-start gap-2">
                <Activity className="w-4 h-4 text-primary mt-0.5" />
                <span>Increase logging and monitoring for transmission control system activities</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Priority Assessment */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Priority Assessment</h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Implementation Priority</span>
              <span className={`text-xs px-2 py-1 rounded ${indicator.confidence === "high" && (indicator.targetsOtSystems || indicator.targetsScada)
                ? "bg-destructive/10 text-destructive"
                : indicator.confidence === "medium" || indicator.targetsOtSystems
                  ? "bg-warning/10 text-warning"
                  : "bg-primary/10 text-primary"
                }`}>
                {indicator.confidence === "high" && (indicator.targetsOtSystems || indicator.targetsScada)
                  ? "Critical"
                  : indicator.confidence === "medium" || indicator.targetsOtSystems
                    ? "High"
                    : "Medium"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Resource Requirements</span>
              <span className="text-xs px-2 py-1 rounded bg-secondary text-muted-foreground">
                {indicator.mitigationStrategies.length > 3 ? "High" : "Medium"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Coordination Required</span>
              <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                {indicator.affectsSafetySystems ? "Safety + Operations" : "Operations"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}