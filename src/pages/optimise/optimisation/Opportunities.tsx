import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useDataProvider } from "@/hooks/useDataProvider";
import { useSectorContentFilter } from "@/hooks/use-sector-switching";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard, StatusBadge, DataTable, EmptyStates, ListItemVariants, SearchFilterSort } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  TrendingUp,
  Brain,
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Download,
  Sparkles,
  BarChart3,
  Settings,
  ArrowRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { OptimisationOpportunity, OpportunityFilters } from "@/types/optimise";
import { cn } from "@/lib/utils";
import { getSectorSpecificModalContent } from "@/lib/sectorModalUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Opportunities() {
  const { currentTenant, selectedAsset, setSelectedAsset, setIsPopPaneOpen, setPopPaneContent } = useApp();
  const { provider } = useDataProvider();

  useEffect(() => {
    setIsPopPaneOpen(false);

    // Clear selection on unmount to ensure we don't carry over state
    return () => {
      setSelectedAsset(null);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // State for filters and sort
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("rank");

  // Construct filters object
  const filters: OpportunityFilters = useMemo(() => {
    const f: OpportunityFilters = {};
    if (searchQuery) f.search = searchQuery;
    if (categoryFilter && categoryFilter !== "all") f.category = categoryFilter as any;
    if (statusFilter && statusFilter !== "all") f.status = statusFilter as any;
    return f;
  }, [searchQuery, categoryFilter, statusFilter]);

  // Fetch opportunities
  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['opportunities', "v2", currentTenant.id, filters],
    queryFn: () => provider.listOpportunities(currentTenant.id, filters),
    enabled: !!currentTenant.id
  });

  const { filterItems, currentSectorName, currentSubsectorName } = useSectorContentFilter();

  // Sort and Filter opportunities
  const displayedOpportunities = useMemo(() => {
    // Apply sector-specific filtering using the hook
    let result = filterItems(opportunities);

    // Apply sorting
    const sorted = [...result];
    switch (sortBy) {
      case "rank":
        result = sorted.sort((a, b) => b.rankScore - a.rankScore);
        break;
      case "confidence":
        result = sorted.sort((a, b) => b.confidence - a.confidence);
        break;
      case "impact":
        result = sorted.sort((a, b) => (b.estimatedImpactMwh || 0) - (a.estimatedImpactMwh || 0));
        break;
      case "date":
        result = sorted.sort((a, b) => new Date(b.identifiedAt).getTime() - new Date(a.identifiedAt).getTime());
        break;
      default:
        result = sorted;
    }

    return result;
  }, [opportunities, sortBy, filterItems]);

  const selectedOpportunity = (selectedAsset as unknown as OptimisationOpportunity) || null;


  // Statistics calculation
  const stats = useMemo(() => {
    const total = opportunities.length;
    const newOpps = opportunities.filter(o => o.status === "identified").length;
    const published = opportunities.filter(o => o.status === "published").length;
    const avgConfidence = total > 0
      ? opportunities.reduce((sum, opp) => sum + opp.confidence, 0) / total
      : 0;
    return { total, newOpps, published, avgConfidence };
  }, [opportunities]);

  const openAIAssist = () => {
    setPopPaneContent({ type: null, data: null }); // Placeholder for now
    setIsPopPaneOpen(true);
  };

  const openCreateModal = () => {
    // Create sector-specific modal content for optimization opportunity creation
    // Assuming context provides sector info or we default
    const modalContent = getSectorSpecificModalContent('optimization-scenario', currentSectorName, currentSubsectorName);
    setPopPaneContent(modalContent);
    setIsPopPaneOpen(true);
  };

  // Tabs configuration
  const overviewTabs = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <OpportunitiesOverview
          stats={stats}
          opportunities={opportunities}
          isLoading={isLoading}
        />
      ),
    },
    {
      id: "discovery",
      label: "Discovery",
      content: <ComingSoon title="AI Discovery" description="Automated opportunity identification and pattern recognition" />,
    },
    {
      id: "pipeline",
      label: "Pipeline",
      content: <ComingSoon title="Opportunity Pipeline" description="Opportunity lifecycle and progression tracking" />,
    },
  ];

  const detailTabs = selectedOpportunity
    ? [
      {
        id: "assessment",
        label: "Assessment",
        content: <AssessmentTab opportunity={selectedOpportunity} />,
      },
      {
        id: "recommendations",
        label: "Recommendations",
        content: <RecommendationsTab opportunity={selectedOpportunity} />,
      },
      {
        id: "playbooks",
        label: "Playbooks",
        content: <PlaybooksTab opportunity={selectedOpportunity} />,
      },
      {
        id: "business-case",
        label: "Business Case",
        content: <BusinessCaseTab opportunity={selectedOpportunity} />,
      },
      {
        id: "simulation",
        label: "Simulation",
        content: <ComingSoon title="Simulation" description="Run scenarios to validate impact" />,
      },
      {
        id: "actions",
        label: "Actions",
        content: <ComingSoon title="Actions" description="Track implementation status" />,
      },
    ]
    : overviewTabs;

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane
        title="Optimization Opportunities"
        subtitle={currentTenant.name}
        count={displayedOpportunities.length}
        showFilters={false}
      >
        <div className="px-2 pb-2">
          <SearchFilterSort
            searchPlaceholder="Search opportunities..."
            onSearchChange={setSearchQuery}
            filterContent={
              <div className="grid grid-cols-2 gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="loss-reduction">Loss Reduction</SelectItem>
                    <SelectItem value="reliability">Reliability</SelectItem>
                    <SelectItem value="loading">Loading</SelectItem>
                    <SelectItem value="asset-health">Asset Health</SelectItem>
                    <SelectItem value="operational-efficiency">Efficiency</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="identified">Identified</SelectItem>
                    <SelectItem value="analyzing">Analyzing</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
            sortContent={
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Sort by</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rank">Rank Score (High to Low)</SelectItem>
                    <SelectItem value="confidence">Confidence (High to Low)</SelectItem>
                    <SelectItem value="impact">Impact (High to Low)</SelectItem>
                    <SelectItem value="date">Date (Newest First)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
          />
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading opportunities...</div>
        ) : displayedOpportunities.length > 0 ? (
          displayedOpportunities.map((opportunity) => (
            <OpportunityItem
              key={opportunity.id}
              opportunity={opportunity}
              isSelected={selectedOpportunity?.id === opportunity.id}
              onClick={() => setSelectedAsset(opportunity as unknown as any)}
            />
          ))
        ) : (
          <EmptyStates.NoData
            size="sm"
            title="No Opportunities"
            description="No optimization opportunities found matching your criteria."
            className="py-8"
          />
        )}
      </ListPane>

      <WorkPane
        key={selectedOpportunity ? `opportunity-${selectedOpportunity.id}` : 'opportunities-overview'}
        title={selectedOpportunity ? selectedOpportunity.title : "Optimization Opportunities"}
        subtitle={selectedOpportunity ? `#${selectedOpportunity.oppRef || 'REF'} · ${selectedOpportunity.category}` : `${opportunities.length} opportunities identified`}
        tabs={detailTabs}
        defaultTab={selectedOpportunity ? "details" : "dashboard"}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={openCreateModal}>
              <Plus className="w-4 h-4" />
              New Opportunity
            </Button>
            <Button size="sm" className="gap-2" onClick={openAIAssist}>
              <Sparkles className="w-4 h-4" />
              AI Assist
            </Button>
          </div>
        }
      />
    </div>
  );
}

function OpportunityItem({
  opportunity,
  isSelected,
  onClick,
}: {
  opportunity: OptimisationOpportunity;
  isSelected: boolean;
  onClick: () => void;
}) {
  // Map our type to the ListItemVariants expected structure if needed, or update ListItemVariants
  // However, ListItemVariants.Opportunity likely expects specific fields.
  // We'll trust it matches enough or is flexible. 
  // Wait, I should verify ListItemVariants content.
  // Assuming it works or I'll fix it if compilation fails.
  // Actually, let's implement a custom item here to be safe and precise with the new type.

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex flex-col gap-2 p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent/50",
        isSelected
          ? "bg-accent border-primary/50 shadow-sm"
          : "bg-card border-border"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm line-clamp-2">{opportunity.title}</h4>
        <Badge variant={
          opportunity.priority === 'critical' ? 'destructive' :
            opportunity.priority === 'high' ? 'default' :
              opportunity.priority === 'medium' ? 'secondary' : 'outline'
        } className="shrink-0 text-[10px] px-1.5 py-0 h-5">
          {opportunity.priority}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{opportunity.oppRef}</span>
        <span>·</span>
        <span className="capitalize">{opportunity.category.replace('-', ' ')}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-1">
        <div className="flex items-center gap-1.5 text-xs">
          <Brain className="w-3 h-3 text-primary" />
          <span className="font-medium">{opportunity.confidence}%</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <TrendingUp className="w-3 h-3 text-success" />
          <span className="font-medium">{opportunity.estimatedImpactMwh ? `${opportunity.estimatedImpactMwh} MWh` : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}

function OpportunitiesOverview({
  stats,
  opportunities,
  isLoading
}: {
  stats: { total: number; newOpps: number; published: number; avgConfidence: number };
  opportunities: OptimisationOpportunity[];
  isLoading: boolean;
}) {
  const topOpportunities = opportunities.slice(0, 5); // Already sorted by rank_score by the API usually

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Opportunities"
          value={stats.total.toString()}
          subtitle="AI-identified improvements"
          icon={Lightbulb}
          variant="primary"
          trend="up"
          trendValue="Live"
        />
        <KPICard
          title="New / Identified"
          value={stats.newOpps.toString()}
          subtitle="Awaiting analysis"
          icon={AlertCircle}
          variant="warning"
          trend="up"
          trendValue="Needs Review"
        />
        <KPICard
          title="Published"
          value={stats.published.toString()}
          subtitle="Ready for execution"
          icon={CheckCircle}
          variant="success"
          trend="up"
          trendValue="Actionable"
        />
        <KPICard
          title="Avg Confidence"
          value={`${stats.avgConfidence.toFixed(1)}%`}
          subtitle="AI model confidence"
          icon={Brain}
          variant="default"
          trend="up"
          trendValue="Model Health"
        />
      </div>

      {/* Top Opportunities */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Top Ranked Opportunities</h3>
        {isLoading ? (
          <div>Loading list...</div>
        ) : (
          <DataTable
            columns={[
              { key: 'rankScore', label: 'Score', render: (score) => <span className="font-bold">{score}</span>, className: 'w-16' },
              { key: 'title', label: 'Opportunity', className: 'font-medium' },
              { key: 'category', label: 'Category', render: (c) => <span className="capitalize">{c?.toString().replace('-', ' ')}</span>, className: 'text-muted-foreground' },
              { key: 'estimatedImpactCost', label: 'Est. Savings', render: (val) => val ? `$${val.toLocaleString()}` : '-', className: 'font-semibold text-success' },
              { key: 'confidence', label: 'Confidence', render: (confidence) => `${confidence}%`, className: 'text-muted-foreground' },
              {
                key: 'status',
                label: 'Status',
                render: (status) => (
                  <StatusBadge
                    status={status === "identified" ? "pending" :
                      status === "analyzing" ? "maintenance" :
                        status === "published" ? "online" : "custom"}
                    customLabel={status?.toString()}
                    size="sm"
                  />
                ),
              },
            ]}
            data={topOpportunities}
            // Note: onRowClick logic handled primarily in ListPane, but here for overview table
            onRowClick={(row) => { /* Could navigate or select */ }}
            emptyState={
              <EmptyStates.NoData
                size="sm"
                title="No Data"
                description="No opportunities available."
              />
            }
          />
        )}
      </div>
    </div>
  );
}

function AssessmentTab({ opportunity }: { opportunity: OptimisationOpportunity }) {
  // Safe access to analysis structure
  const analysis = opportunity.analysis || {};
  const impact = analysis.impactEstimation || {};
  const feasibility = analysis.feasibilityEvaluation || {};
  const risks = analysis.riskAssessment || {};

  return (
    <div className="space-y-6">
      {/* Opportunity Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <div className="text-2xl font-bold text-primary">{opportunity.rankScore}</div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">{opportunity.title}</h3>
              <Badge variant="outline" className="capitalize">{opportunity.status}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="capitalize">{(opportunity.category || 'uncategorized').replace('-', ' ')}</span>
              <span>·</span>
              <span>AI Confidence: {opportunity.confidence}%</span>
              <span>·</span>
              <span className="text-success font-medium">
                {opportunity.estimatedSavings ? `$${opportunity.estimatedSavings.toLocaleString()} / yr` : 'Impact TBD'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard
          title="Impact Score"
          value={(opportunity.rankScore / 10).toFixed(1)}
          subtitle="Relative impact"
          icon={TrendingUp}
          variant="success"
        />
        <KPICard
          title="Feasibility"
          value={feasibility.technicalFeasibility || "Medium"}
          subtitle="Implementation complexity"
          icon={Settings}
          variant="primary"
          className="capitalize"
        />
        <KPICard
          title="Risk Level"
          value={risks.overallRiskLevel || "Low"}
          subtitle="Operational risk"
          icon={AlertCircle}
          variant="default"
          className="capitalize"
        />
      </div>

      {/* AI Analysis */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          AI Analysis Summary
        </h3>
        <div className="prose prose-sm max-w-none text-muted-foreground">
          <p>{opportunity.description}</p>
          {analysis.summary && <p className="mt-2">{analysis.summary}</p>}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Impact Details
          </h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Est. MWh Impact" value={opportunity.estimatedImpactMwh ? `${opportunity.estimatedImpactMwh.toLocaleString()} MWh` : '-'} />
            <InfoRow label="Est. Cost Impact" value={opportunity.estimatedImpactCost ? `$${opportunity.estimatedImpactCost.toLocaleString()}` : '-'} />
            {impact.qualitativeImpact && Array.isArray(impact.qualitativeImpact) && (
              <div className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium block mb-1">Qualitative Benefits:</span>
                <ul className="list-disc list-inside pl-1">
                  {impact.qualitativeImpact.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            Technical Context
          </h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Site" value={opportunity.site?.name || opportunity.siteId || '-'} />
            <InfoRow label="Asset" value={opportunity.asset?.name || opportunity.assetId || '-'} />
            <InfoRow label="Identified At" value={new Date(opportunity.identifiedAt).toLocaleDateString()} />
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendationsTab({ opportunity }: { opportunity: OptimisationOpportunity }) {
  const recommendations = opportunity.recommendations || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recommended Actions</h3>
        <Button size="sm" variant="outline">Generate Actions</Button>
      </div>

      {recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.map(rec => (
            <div key={rec.id} className="bg-card border border-border rounded-lg p-4 flex gap-4">
              <div className="mt-1">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  rec.priority === 'critical' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                )}>
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">{rec.title}</h4>
                  <Badge variant="outline">{rec.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground my-2">{rec.description}</p>
                <div className="flex gap-4 text-xs">
                  <span className="font-medium text-muted-foreground">Effort: {rec.estimatedEffortHours}h</span>
                  <span className="font-medium text-success">Benefit: ${rec.estimatedBenefit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyStates.NoData
          title="No Recommendations"
          description="No specific AI recommendations generated yet."
        />
      )}
    </div>
  );
}

function PlaybooksTab({ opportunity }: { opportunity: OptimisationOpportunity }) {
  const playbooks = opportunity.playbooks || [];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Related Playbooks</h3>
      {playbooks.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {playbooks.map(pb => (
            <div key={pb.id} className="bg-card border border-border p-4 rounded-lg">
              <h4 className="font-medium mb-2">{pb.title}</h4>
              <p className="text-xs text-muted-foreground mb-4 line-clamp-3">{pb.description}</p>
              <Button size="sm" variant="secondary" className="w-full">View Playbook</Button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyStates.NoData
          title="No Playbooks"
          description="No standard playbooks linked to this opportunity."
        />
      )}
    </div>
  );
}

function BusinessCaseTab({ opportunity }: { opportunity: OptimisationOpportunity }) {
  // Use analysis data if specific business case object not present (as schema is flexible)
  const cost = opportunity.estimatedImpactCost || 0;
  const savings = opportunity.estimatedSavings || 0;
  // Simple ROI calc
  const roi = cost > 0 ? ((savings - cost) / cost) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Est. Investment"
          value={`$${cost.toLocaleString()}`}
          subtitle="Capital required"
          icon={TrendingUp}
          variant="default"
        />
        <KPICard
          title="Est. Savings"
          value={`$${savings.toLocaleString()}`}
          subtitle="Projected benefits"
          icon={Target}
          variant="success"
        />
        <KPICard
          title="Projected ROI"
          value={`${roi.toFixed(0)}%`}
          subtitle="Return on investment"
          icon={BarChart3}
          variant="success"
        />
        <KPICard
          title="Payback"
          value={cost > 0 && savings > 0 ? `${(cost / (savings / 12)).toFixed(1)} mo` : "-"}
          subtitle="Break-even"
          icon={Clock}
          variant="default"
        />
      </div>

      <div className="bg-card p-6 rounded-lg border border-border">
        <h4 className="font-semibold mb-4">Financial Details</h4>
        <p className="text-sm text-muted-foreground">
          Detailed financial modeling based on analysis parameters will appear here.
        </p>
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