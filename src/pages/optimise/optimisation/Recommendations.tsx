import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { useSectorContentFilter } from "@/hooks/use-sector-switching";
import { ListPane } from "@/components/layout/ListPane";
import { ListPaneItem } from "@/components/layout/ListPaneItem";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard, StatusBadge, DataTable, TableConfigs, EmptyStates, ListItemVariants } from "@/components/shared";
import { AssetStatus } from "@/types/navigation";
import { Button } from "@/components/ui/button";
import {
  Target,
  Brain,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  BarChart3,
  Settings,
  Plus,
  Download,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDataProvider } from "@/hooks/useDataProvider";
import { AIRecommendation, RecommendationFilters } from "@/types/optimise";
import { cn } from "@/lib/utils";
import { getSectorSpecificModalContent } from "@/lib/sectorModalUtils";

export function Recommendations() {
  const { currentTenant, selectedAsset, setSelectedAsset, setIsPopPaneOpen, setPopPaneContent } = useApp();
  const { filterItems, currentSectorName, currentSubsectorName } = useSectorContentFilter();
  const { provider } = useDataProvider();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("confidence");

  // Fetch recommendations from Supabase
  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['recommendations', currentTenant.id],
    queryFn: async () => {
      const filters: RecommendationFilters = {};
      return provider.listRecommendations(currentTenant.id, filters);
    },
    enabled: !!currentTenant.id
  });

  // Use selectedAsset from AppContext for Recommendation selection
  const selectedRecommendation = selectedAsset as unknown as AIRecommendation | null;

  // Filter and sort recommendations based on sector/subsector selection, search query and sort state
  const filteredAndSortedRecommendations = useMemo(() => {
    // Apply sector-specific filtering using the hook
    let recs = filterItems(recommendations as any) as AIRecommendation[];


    // Apply search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      recs = recs.filter(
        (rec) =>
          (rec.description || "").toLowerCase().includes(query) ||
          (rec.title || "").toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...recs];
    sorted.sort((a, b) => {
      if (sortBy === "confidence") {
        const confA = a.confidenceScore || 0;
        const confB = b.confidenceScore || 0;
        return confB - confA;
      }
      if (sortBy === "impact") {
        const valA = a.estimatedBenefit || 0;
        const valB = b.estimatedBenefit || 0;
        return valB - valA;
      }
      return 0;
    });

    return sorted;
  }, [searchQuery, filterItems, sortBy, recommendations]);

  const stats = useMemo(() => {
    const totalRecommendations = filteredAndSortedRecommendations.length;
    const highConfidence = filteredAndSortedRecommendations.filter(r => (r.confidenceScore || 0) >= 85).length;
    const mediumConfidence = filteredAndSortedRecommendations.filter(r => (r.confidenceScore || 0) >= 70 && (r.confidenceScore || 0) < 85).length;
    const avgConfidence = totalRecommendations > 0
      ? filteredAndSortedRecommendations.reduce((sum, rec) => sum + (rec.confidenceScore || 0), 0) / totalRecommendations
      : 0;
    return { totalRecommendations, highConfidence, mediumConfidence, avgConfidence };
  }, [filteredAndSortedRecommendations]);

  const openAIAssist = () => {
    setPopPaneContent({ type: null, data: null });
    setIsPopPaneOpen(true);
  };

  const openCreateModal = () => {
    // Create sector-specific modal content for recommendation creation
    const modalContent = getSectorSpecificModalContent('ai-recommendation', currentSectorName, currentSubsectorName);
    setPopPaneContent(modalContent);
    setIsPopPaneOpen(true);
  };

  const tabs = [
    {
      id: "overview",
      label: "Recommendations Overview",
      content: (
        <RecommendationsOverview
          stats={stats}
          recommendations={filteredAndSortedRecommendations}
        />
      ),
    },
    {
      id: "analytics",
      label: "Analytics",
      content: <ComingSoon title="AI Analytics" description="Advanced pattern recognition and recommendation analytics" />,
    },
    {
      id: "models",
      label: "Models",
      content: <ComingSoon title="AI Models" description="Machine learning model performance and configuration" />,
    },
  ];

  const recommendationTabs = selectedRecommendation
    ? [
      {
        id: "analysis",
        label: "Analysis",
        content: <AnalysisTab recommendation={selectedRecommendation} />,
      },
      {
        id: "rationale",
        label: "Rationale",
        content: <RationaleTab recommendation={selectedRecommendation} />,
      },
      {
        id: "implementation",
        label: "Implementation",
        content: <ImplementationTab recommendation={selectedRecommendation} />,
      },
      {
        id: "feedback",
        label: "Feedback",
        content: <FeedbackTab recommendation={selectedRecommendation} />,
      },
    ]
    : tabs;

  return (
    <>
      <ListPane
        title="AI Recommendations"
        context="DEWA – Transmission"
        count={filteredAndSortedRecommendations.length}
        searchPlaceholder="Search"
        onSearch={setSearchQuery}
        sortOptions={[
          { label: "Confidence", value: "confidence" },
          { label: "Impact", value: "impact" },
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
      >
        {filteredAndSortedRecommendations.map((recommendation) => (
          <ListPaneItem
            key={recommendation.id}
            title={recommendation.title}
            description={recommendation.description}
            status={(recommendation.confidenceScore || 0) >= 85 ? "online" : (recommendation.confidenceScore || 0) >= 70 ? "maintenance" : "offline"}
            category={recommendation.actionType.replace('-', ' ')}
            value={recommendation.estimatedBenefit ? `+$${recommendation.estimatedBenefit.toLocaleString()}` : "N/A"}
            isSelected={selectedRecommendation?.id === recommendation.id}
            onClick={() => setSelectedAsset(recommendation as unknown as any)}
          />
        ))}
      </ListPane>

      <WorkPane
        title={selectedRecommendation ? "AI Recommendation" : "AI Recommendations"}
        subtitle={selectedRecommendation ? `Confidence: ${selectedRecommendation.confidenceScore}%` : `${filteredAndSortedRecommendations.length} recommendations available`}
        loading={isLoading}
        tabs={recommendationTabs}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={openCreateModal}>
              <Plus className="w-4 h-4" />
              Generate New
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button size="sm" className="gap-2" onClick={openAIAssist}>
              <Sparkles className="w-4 h-4" />
              AI Assist
            </Button>
          </div>
        }
      />
    </>
  );
}

function RecommendationItem({
  recommendation,
  rank,
  isSelected,
  onClick,
}: {
  recommendation: AIRecommendation;
  rank: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return "text-success";
    if (confidence >= 70) return "text-warning";
    return "text-muted-foreground";
  };

  const getConfidenceVariant = (confidence: number): AssetStatus => {
    if (confidence >= 85) return "online";
    if (confidence >= 70) return "maintenance";
    return "offline";
  };

  return (
    <div
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:border-primary/30",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:bg-card/80"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
            {rank}
          </div>
          <StatusBadge
            status={getConfidenceVariant(recommendation.confidenceScore || 0)}
            size="sm"
          />
        </div>
        <div className={cn("text-xs font-medium", getConfidenceColor(recommendation.confidenceScore || 0))}>
          {recommendation.confidenceScore}%
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground line-clamp-2">
          {recommendation.title}
        </h4>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">AI Generated</span>
          <span className="font-medium text-success">${(recommendation.estimatedBenefit || 0).toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Brain className="w-3 h-3" />
          <span>Confidence: {recommendation.confidenceScore}%</span>
        </div>
      </div>
    </div>
  );
}

function RecommendationsOverview({
  stats,
  recommendations,
}: {
  stats: { totalRecommendations: number; highConfidence: number; mediumConfidence: number; avgConfidence: number };
  recommendations: AIRecommendation[];
}) {
  const topRecommendations = recommendations
    .sort((a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Recommendations"
          value={stats.totalRecommendations.toString()}
          subtitle="AI-generated suggestions"
          icon={Lightbulb}
          variant="primary"
        />
        <KPICard
          title="High Confidence"
          value={stats.highConfidence.toString()}
          subtitle="Confidence ≥ 85%"
          icon={CheckCircle}
          variant="success"
          trend="up"
          trendValue={`${((stats.highConfidence / stats.totalRecommendations) * 100).toFixed(0)}%`}
        />
        <KPICard
          title="Medium Confidence"
          value={stats.mediumConfidence.toString()}
          subtitle="Confidence 70-84%"
          icon={AlertCircle}
          variant="warning"
          trend="neutral"
          trendValue={`${((stats.mediumConfidence / stats.totalRecommendations) * 100).toFixed(0)}%`}
        />
        <KPICard
          title="Avg Confidence"
          value={`${stats.avgConfidence.toFixed(1)}%`}
          subtitle="Overall reliability"
          icon={Brain}
          variant="default"
          trend="up"
          trendValue="+2.1%"
        />
      </div>

      {/* Top Recommendations */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Top Recommendations by Confidence</h3>
        <div className="space-y-3">
          {topRecommendations.map((recommendation, index) => (
            <div
              key={recommendation.id}
              className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    Confidence: {recommendation.confidenceScore}%
                  </div>
                </div>
                <div className="text-sm font-medium text-success">
                  ${(recommendation.estimatedBenefit || 0).toLocaleString()}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-1">Recommendation</h4>
                  <p className="text-sm text-muted-foreground">{recommendation.title}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-foreground mb-1">Summary</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">{recommendation.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border/50">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                <Button size="sm" className="gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Apply
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalysisTab({ recommendation }: { recommendation: AIRecommendation }) {
  return (
    <div className="space-y-6">
      {/* Recommendation Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">AI Recommendation</h3>
              <StatusBadge
                status={(recommendation.confidenceScore || 0) >= 85 ? "online" :
                  (recommendation.confidenceScore || 0) >= 70 ? "maintenance" : "offline"}
              />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Confidence: {recommendation.confidenceScore}%</span>
              <span>·</span>
              <span className="text-success font-medium">${(recommendation.estimatedBenefit || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard
          title="Data Quality"
          value="96.8%"
          subtitle="Input data reliability"
          icon={BarChart3}
          variant="success"
        />
        <KPICard
          title="Model Accuracy"
          value="94.2%"
          subtitle="Historical validation"
          icon={Target}
          variant="success"
        />
        <KPICard
          title="Complexity"
          value="Medium"
          subtitle="Implementation difficulty"
          icon={Settings}
          variant="warning"
        />
      </div>

      {/* Data Analysis */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Data Analysis
          </h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Data Points Analyzed" value="2.4M records" />
            <InfoRow label="Time Period" value="6 months" />
            <InfoRow label="Variables Considered" value="47 parameters" />
            <InfoRow label="Pattern Confidence" value="94.2%" />
            <InfoRow label="Correlation Strength" value="0.87" />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Predictive Insights
          </h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Success Probability" value="89.3%" />
            <InfoRow label="Risk Assessment" value="Low" />
            <InfoRow label="Expected Timeline" value="2-3 weeks" />
            <InfoRow label="Resource Requirements" value="Minimal" />
            <InfoRow label="ROI Projection" value="340%" />
          </div>
        </div>
      </div>

      {/* Pattern Recognition */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Pattern Recognition Analysis
        </h3>
        <div className="prose prose-sm max-w-none text-muted-foreground">
          <p>
            The AI model has identified a strong correlation between ambient temperature, material
            quality, and optimal production speed. Analysis reveals that during specific temperature
            ranges (18-22°C), increasing line speed by 5% results in improved overall efficiency
            without quality degradation.
          </p>
          <p className="mt-3">
            Historical data shows this pattern occurs consistently during morning hours (10:00-14:00)
            when environmental conditions are most stable. The recommendation leverages this insight
            to optimize production scheduling and speed adjustments for maximum efficiency gains.
          </p>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg border border-success/20">
            <CheckCircle className="w-5 h-5 text-success mt-0.5" />
            <div>
              <div className="text-sm font-medium">Optimal Performance Window</div>
              <div className="text-xs text-muted-foreground mt-1">
                Consistent 15% efficiency improvement during 10:00-14:00 window
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <div className="text-sm font-medium">Temperature Correlation</div>
              <div className="text-xs text-muted-foreground mt-1">
                Strong correlation (r=0.87) between ambient conditions and optimal settings
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
            <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
            <div>
              <div className="text-sm font-medium">Quality Threshold</div>
              <div className="text-xs text-muted-foreground mt-1">
                Speed increases above 7% show diminishing returns with quality impact
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RationaleTab({ recommendation }: { recommendation: AIRecommendation }) {
  return (
    <div className="space-y-6">
      {/* Rationale Summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">AI Rationale</h3>
        <div className="prose prose-sm max-w-none text-muted-foreground">
          <p>{recommendation.description}</p>
        </div>
      </div>

      {/* Supporting Evidence */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Supporting Evidence</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success mt-0.5" />
              <div>
                <div className="text-sm font-medium">Historical Performance Data</div>
                <div className="text-xs text-muted-foreground mt-1">
                  6 months of production data showing consistent patterns
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success mt-0.5" />
              <div>
                <div className="text-sm font-medium">Environmental Correlation</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Strong correlation between ambient conditions and performance
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success mt-0.5" />
              <div>
                <div className="text-sm font-medium">Quality Validation</div>
                <div className="text-xs text-muted-foreground mt-1">
                  No quality degradation observed within recommended parameters
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Risk Factors</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
              <div>
                <div className="text-sm font-medium">Parameter Sensitivity</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Performance sensitive to temperature variations beyond ±2°C
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
              <div>
                <div className="text-sm font-medium">Material Quality Dependency</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Requires consistent material quality for optimal results
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
              <div>
                <div className="text-sm font-medium">Operator Training</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Staff training required for new optimization procedures
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Model Confidence Factors */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Confidence Factors</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Data Quality & Completeness</span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-secondary rounded-full">
                <div className="w-[96%] h-2 bg-success rounded-full"></div>
              </div>
              <span className="text-sm font-medium">96%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pattern Consistency</span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-secondary rounded-full">
                <div className="w-[94%] h-2 bg-success rounded-full"></div>
              </div>
              <span className="text-sm font-medium">94%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Model Validation Score</span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-secondary rounded-full">
                <div className="w-[91%] h-2 bg-success rounded-full"></div>
              </div>
              <span className="text-sm font-medium">91%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Cross-Validation Results</span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-secondary rounded-full">
                <div className="w-[88%] h-2 bg-warning rounded-full"></div>
              </div>
              <span className="text-sm font-medium">88%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImplementationTab({ recommendation }: { recommendation: AIRecommendation }) {
  return (
    <div className="space-y-6">
      {/* Implementation Overview */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard
          title="Complexity"
          value="Medium"
          subtitle="Implementation difficulty"
          icon={Settings}
          variant="warning"
        />
        <KPICard
          title="Timeline"
          value="2-3 weeks"
          subtitle="Estimated duration"
          icon={TrendingUp}
          variant="default"
        />
        <KPICard
          title="Resources"
          value="2 FTE"
          subtitle="Team requirement"
          icon={Target}
          variant="primary"
        />
      </div>

      {/* Implementation Steps */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Implementation Plan</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
              1
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">System Configuration</div>
              <div className="text-xs text-muted-foreground mt-1">
                Configure control system parameters and safety interlocks
              </div>
              <div className="text-xs text-muted-foreground">Duration: 3-5 days</div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
              2
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Operator Training</div>
              <div className="text-xs text-muted-foreground mt-1">
                Train operations team on new optimization procedures
              </div>
              <div className="text-xs text-muted-foreground">Duration: 1 week</div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
              3
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Pilot Testing</div>
              <div className="text-xs text-muted-foreground mt-1">
                Conduct controlled pilot test during optimal conditions
              </div>
              <div className="text-xs text-muted-foreground">Duration: 3-5 days</div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
              4
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Full Deployment</div>
              <div className="text-xs text-muted-foreground mt-1">
                Roll out optimization across all applicable shifts
              </div>
              <div className="text-xs text-muted-foreground">Duration: 1 week</div>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Requirements */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Required Resources</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Control Engineer" value="1 FTE, 2 weeks" />
            <InfoRow label="Operations Supervisor" value="0.5 FTE, 3 weeks" />
            <InfoRow label="Training Coordinator" value="0.5 FTE, 1 week" />
            <InfoRow label="System Administrator" value="0.25 FTE, 1 week" />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Success Criteria</h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="OEE Improvement" value="≥ 2.5%" />
            <InfoRow label="Quality Maintenance" value="≥ 97%" />
            <InfoRow label="Safety Compliance" value="100%" />
            <InfoRow label="Operator Adoption" value="≥ 90%" />
          </div>
        </div>
      </div>

      {/* Risk Mitigation */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Risk Mitigation</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
            <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
            <div>
              <div className="text-sm font-medium">Quality Risk</div>
              <div className="text-xs text-muted-foreground mt-1">
                Implement real-time quality monitoring with automatic rollback capability
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
            <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
            <div>
              <div className="text-sm font-medium">Operator Resistance</div>
              <div className="text-xs text-muted-foreground mt-1">
                Comprehensive training program with hands-on practice sessions
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
            <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
            <div>
              <div className="text-sm font-medium">System Integration</div>
              <div className="text-xs text-muted-foreground mt-1">
                Phased rollout with fallback to manual control if needed
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedbackTab({ recommendation }: { recommendation: AIRecommendation }) {
  return (
    <div className="space-y-6">
      {/* Feedback Summary */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="User Rating"
          value="4.2/5"
          subtitle="Average user score"
          icon={Target}
          variant="success"
        />
        <KPICard
          title="Implementation Rate"
          value="78%"
          subtitle="Recommendations applied"
          icon={CheckCircle}
          variant="success"
        />
        <KPICard
          title="Success Rate"
          value="85%"
          subtitle="Achieved expected results"
          icon={TrendingUp}
          variant="success"
        />
        <KPICard
          title="Model Accuracy"
          value="91%"
          subtitle="Prediction accuracy"
          icon={Brain}
          variant="primary"
        />
      </div>

      {/* User Feedback */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">User Feedback</h3>
        <div className="space-y-4">
          <div className="border-l-4 border-success pl-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Operations Manager</div>
              <div className="text-xs text-muted-foreground">2 days ago</div>
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              "Excellent recommendation. Implementation was smooth and results exceeded expectations.
              Team is very satisfied with the performance improvement."
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-success">Rating: 5/5</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">Implemented</span>
            </div>
          </div>

          <div className="border-l-4 border-warning pl-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Control Engineer</div>
              <div className="text-xs text-muted-foreground">1 day ago</div>
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              "Good recommendation overall, but required more fine-tuning than expected.
              Would benefit from more detailed implementation guidance."
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-warning">Rating: 3/5</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">Implemented with modifications</span>
            </div>
          </div>

          <div className="border-l-4 border-primary pl-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Production Supervisor</div>
              <div className="text-xs text-muted-foreground">6 hours ago</div>
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              "Very promising recommendation. Currently in pilot phase and early results look good.
              Operators are adapting well to the new procedures."
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-primary">Rating: 4/5</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">In pilot testing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Model Improvement */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Model Improvement Inputs</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg border border-success/20">
            <CheckCircle className="w-5 h-5 text-success mt-0.5" />
            <div>
              <div className="text-sm font-medium">Positive Feedback Integration</div>
              <div className="text-xs text-muted-foreground mt-1">
                Successful implementations strengthen similar pattern recognition
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
            <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
            <div>
              <div className="text-sm font-medium">Implementation Challenges</div>
              <div className="text-xs text-muted-foreground mt-1">
                Feedback on implementation difficulties improves future guidance
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <Brain className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <div className="text-sm font-medium">Model Refinement</div>
              <div className="text-xs text-muted-foreground mt-1">
                User feedback continuously improves recommendation accuracy and relevance
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Actions */}
      <div className="flex items-center gap-3">
        <Button className="gap-2">
          <CheckCircle className="w-4 h-4" />
          Mark as Helpful
        </Button>
        <Button variant="outline" className="gap-2">
          <AlertCircle className="w-4 h-4" />
          Report Issue
        </Button>
        <Button variant="outline">
          Provide Feedback
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">{description}</p>
      <p className="text-xs text-muted-foreground mt-4">Coming in Stage 03</p>
    </div>
  );
}