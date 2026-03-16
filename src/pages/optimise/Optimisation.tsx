import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useSectorContentFilter } from "@/hooks/use-sector-switching";
import { ErrorAwareListPane } from "@/components/layout/ErrorAwareListPane";
import { ErrorAwareWorkPane } from "@/components/layout/ErrorAwareWorkPane";
import { KPICard } from "@/components/shared/KPICard";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { LoadingState, useLoadingState } from "@/components/shared/LoadingState";
import { EmptyStates } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Sparkles,
  TrendingUp,
  BookOpen,
  Send,
  BarChart3,
  Target,
  Download,
  ArrowRight,
  Database,
  Lightbulb,
  Plus,
  FlaskConical,
  Rocket,
} from "lucide-react";
import { useDataProvider } from "@/hooks/useDataProvider";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { getSectorSpecificModalContent } from "@/lib/sectorModalUtils";
import { ContentErrorHandler, NavigationErrorHandler } from "@/lib/errorHandling";

// Import the individual Optimisation components
import { Opportunities } from "./optimisation/Opportunities";
import { Recommendations } from "./optimisation/Recommendations";
import { Playbooks } from "./optimisation/Playbooks";
import { Simulations } from "./optimisation/Simulations";
import { Execution } from "./optimisation/Execution";

interface OptimisationProps {
  subFeature?: string;
}

export function Optimisation({ subFeature }: OptimisationProps) {
  // If a sub-feature is specified, render the appropriate component with error boundaries
  return (
    <ErrorBoundary
      onError={(error) => {
        NavigationErrorHandler.handleNavigationFailure(error, "/optimise/optimisation");
      }}
    >
      {(() => {
        switch (subFeature) {
          case "opportunities":
            return (
              <ErrorBoundary
                fallback={
                  <EmptyStates.Error
                    title="Opportunities Component Error"
                    description="Unable to load Opportunities component."
                    action={{
                      label: "Go to Optimisation Overview",
                      onClick: () => window.location.href = "/optimise/optimisation",
                      variant: "outline",
                    }}
                  />
                }
              >
                <Opportunities />
              </ErrorBoundary>
            );
          case "recommendations":
            return (
              <ErrorBoundary
                fallback={
                  <EmptyStates.Error
                    title="Recommendations Component Error"
                    description="Unable to load Recommendations component."
                    action={{
                      label: "Go to Optimisation Overview",
                      onClick: () => window.location.href = "/optimise/optimisation",
                      variant: "outline",
                    }}
                  />
                }
              >
                <Recommendations />
              </ErrorBoundary>
            );
          case "playbooks":
            return (
              <ErrorBoundary
                fallback={
                  <EmptyStates.Error
                    title="Playbooks Component Error"
                    description="Unable to load Playbooks component."
                    action={{
                      label: "Go to Optimisation Overview",
                      onClick: () => window.location.href = "/optimise/optimisation",
                      variant: "outline",
                    }}
                  />
                }
              >
                <Playbooks />
              </ErrorBoundary>
            );
          case "simulations":
            return (
              <ErrorBoundary
                fallback={
                  <EmptyStates.Error
                    title="Simulations Component Error"
                    description="Unable to load Simulations component."
                    action={{
                      label: "Go to Optimisation Overview",
                      onClick: () => window.location.href = "/optimise/optimisation",
                      variant: "outline",
                    }}
                  />
                }
              >
                <Simulations />
              </ErrorBoundary>
            );
          case "execution":
            return (
              <ErrorBoundary
                fallback={
                  <EmptyStates.Error
                    title="Execution Component Error"
                    description="Unable to load Execution component."
                    action={{
                      label: "Go to Optimisation Overview",
                      onClick: () => window.location.href = "/optimise/optimisation",
                      variant: "outline",
                    }}
                  />
                }
              >
                <Execution />
              </ErrorBoundary>
            );
          default:
            // Default behavior - show the original Optimisation overview
            return (
              <ErrorBoundary
                fallback={
                  <EmptyStates.Error
                    title="Optimisation Overview Error"
                    description="Unable to load Optimisation overview."
                    action={{
                      label: "Refresh Page",
                      onClick: () => window.location.reload(),
                      variant: "outline",
                    }}
                  />
                }
              >
                <OptimisationOverview />
              </ErrorBoundary>
            );
        }
      })()}
    </ErrorBoundary>
  );
}

// Original Optimisation component renamed to OptimisationOverview
function OptimisationOverview() {
  const { currentTenant, setIsPopPaneOpen, setPopPaneContent } = useApp();
  const { currentSectorName, currentSubsectorName } = useSectorContentFilter();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Close sidebar on mount to prevent blank sidebar
  useEffect(() => {
    setIsPopPaneOpen(false);
  }, [setIsPopPaneOpen]);

  // Error handling state
  const {
    isLoading: isLoadingData,
    error: dataError,
    startLoading: startLoadingData,
    stopLoading: stopLoadingData,
    setError: setDataError,
    retry: retryLoadData
  } = useLoadingState();

  // This component now serves as a router for the Optimisation decision workflow
  // It displays an overview of all sub-navigation items with navigation to each

  const openAIAssist = () => {
    try {
      // setPopPaneContent({ type: null, data: null });
      // setIsPopPaneOpen(true);
      toast({
        title: "AI Assist",
        description: "AI functionality is coming soon.",
      });
    } catch (error) {
      ContentErrorHandler.handleContentLoadingFailure(
        "ai_assist_modal",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };

  const openCreateModal = () => {
    try {
      // Create sector-specific modal content for optimization scenario
      const modalContent = getSectorSpecificModalContent('optimization-scenario', currentSectorName, currentSubsectorName);
      setPopPaneContent(modalContent);
      setIsPopPaneOpen(true);
    } catch (error) {
      ContentErrorHandler.handleContentLoadingFailure(
        "create_modal",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };

  const { provider } = useDataProvider();

  // Fetch real counts from the provider instead of mock data
  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities', currentTenant.id],
    queryFn: () => provider.listOpportunities(currentTenant.id),
    enabled: !!currentTenant.id
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ['recommendations', currentTenant.id],
    queryFn: () => provider.listRecommendations(currentTenant.id),
    enabled: !!currentTenant.id
  });

  const { data: playbooks = [] } = useQuery({
    queryKey: ['playbooks', currentTenant.id],
    queryFn: () => provider.listPlaybooks(currentTenant.id),
    enabled: !!currentTenant.id
  });

  const { data: simulations = [] } = useQuery({
    queryKey: ['simulations', currentTenant.id],
    queryFn: () => provider.listSimulations(currentTenant.id),
    enabled: !!currentTenant.id
  });

  // Overview stats combining all optimization areas with error handling
  const overviewStats = useMemo(() => {
    try {
      return {
        opportunities: opportunities.length,
        recommendations: recommendations.length,
        playbooks: playbooks.length,
        simulations: simulations.length,
      };
    } catch (error) {
      ContentErrorHandler.handleContentLoadingFailure(
        "optimisation_statistics",
        error instanceof Error ? error : new Error(String(error))
      );
      setDataError(error instanceof Error ? error : new Error(String(error)));
      return {
        opportunities: 0,
        recommendations: 0,
        playbooks: 0,
        simulations: 0,
      };
    }
  }, [opportunities.length, recommendations.length, playbooks.length, simulations.length, setDataError]);

  const tabs = [
    {
      id: "overview",
      label: "Optimisation Overview",
      content: (
        <ErrorBoundary
          fallback={
            <EmptyStates.Error
              title="Overview Tab Error"
              description="Unable to load optimisation overview content."
              action={{
                label: "Retry",
                onClick: () => window.location.reload(),
                variant: "outline",
              }}
            />
          }
        >
          <OptimisationDecisionOverview stats={overviewStats} />
        </ErrorBoundary>
      ),
    },
    {
      id: "workflow",
      label: "Decision Workflow",
      content: (
        <ErrorBoundary
          fallback={
            <EmptyStates.Error
              title="Workflow Tab Error"
              description="Unable to load decision workflow content."
            />
          }
        >
          <DecisionWorkflowTab />
        </ErrorBoundary>
      ),
    },
    {
      id: "insights",
      label: "AI Insights",
      content: (
        <ErrorBoundary
          fallback={
            <EmptyStates.Error
              title="AI Insights Tab Error"
              description="Unable to load AI insights content."
            />
          }
        >
          <ComingSoon title="AI Insights" description="Advanced analytics and pattern recognition insights across all optimization areas" />
        </ErrorBoundary>
      ),
    },
  ];

  const handleSearch = (query: string) => {
    try {
      setSearchQuery(query);
    } catch (error) {
      ContentErrorHandler.handleContentLoadingFailure(
        "search_operation",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };

  const handleWorkflowNavigation = (path: string) => {
    try {
      window.location.href = path;
    } catch (error) {
      NavigationErrorHandler.handleNavigationFailure(
        error instanceof Error ? error : new Error(String(error)),
        path
      );
    }
  };

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ErrorAwareListPane
        title="Optimisation Decision Workflow"
        subtitle={currentTenant.name}
        count={dataError ? 0 : 5}
        searchPlaceholder="Search workflow areas..."
        onSearch={handleSearch}
        isLoading={isLoadingData}
        error={dataError}
        onRetry={retryLoadData(() => Promise.resolve())}
        contentType="workflow areas"
      >
        <ErrorBoundary
          fallback={
            <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5">
              <div className="text-sm text-destructive">Error loading workflow items</div>
            </div>
          }
        >
          <OptimisationWorkflowItem
            id="opportunities"
            title="Opportunities"
            description="AI-identified optimization opportunities with impact assessment"
            icon={Lightbulb}
            count={overviewStats.opportunities}
            path="/optimise/optimisation/opportunities"
            isSelected={false}
            onClick={() => handleWorkflowNavigation("/optimise/optimisation/opportunities")}
          />
          <OptimisationWorkflowItem
            id="recommendations"
            title="Recommendations"
            description="AI-generated recommendations with analysis and rationale"
            icon={Target}
            count={overviewStats.recommendations}
            path="/optimise/optimisation/recommendations"
            isSelected={false}
            onClick={() => handleWorkflowNavigation("/optimise/optimisation/recommendations")}
          />
          <OptimisationWorkflowItem
            id="playbooks"
            title="Playbooks"
            description="Standardized optimization procedures and methodologies"
            icon={BookOpen}
            count={overviewStats.playbooks}
            path="/optimise/optimisation/playbooks"
            isSelected={false}
            onClick={() => handleWorkflowNavigation("/optimise/optimisation/playbooks")}
          />
          <OptimisationWorkflowItem
            id="simulations"
            title="Simulations"
            description="Scenario modeling and optimization testing environment"
            icon={FlaskConical}
            count={overviewStats.simulations}
            path="/optimise/optimisation/simulations"
            isSelected={false}
            onClick={() => handleWorkflowNavigation("/optimise/optimisation/simulations")}
          />
          <OptimisationWorkflowItem
            id="execution"
            title="Execution"
            description="Implementation tracking and deployment management"
            icon={Rocket}
            count={12}
            path="/optimise/optimisation/execution"
            isSelected={false}
            onClick={() => handleWorkflowNavigation("/optimise/optimisation/execution")}
          />
        </ErrorBoundary>
      </ErrorAwareListPane>

      <ErrorAwareWorkPane
        title="AI-Assisted Optimisation"
        subtitle="Decision workflow for optimization initiatives"
        tabs={tabs}
        contentType="optimisation_workflow"
        actions={
          <ErrorBoundary
            fallback={
              <div className="text-xs text-muted-foreground">Actions unavailable</div>
            }
          >
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={openCreateModal}>
                <Plus className="w-4 h-4" />
                New Initiative
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
          </ErrorBoundary>
        }
      />
    </div>
  );
}

function OptimisationWorkflowItem({
  id,
  title,
  description,
  icon: Icon,
  count,
  path,
  isSelected,
  onClick,
}: {
  id: string;
  title: string;
  description: string;
  icon: any;
  count: number;
  path: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={cn(
        "p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:border-primary/30",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:bg-card/80"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-foreground">{title}</h4>
            <span className="text-xs font-medium text-muted-foreground">{count}</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{path}</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}

function OptimisationDecisionOverview({
  stats,
}: {
  stats: { opportunities: number; recommendations: number; playbooks: number; simulations: number };
}) {
  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Opportunities"
          value={stats.opportunities.toString()}
          subtitle="AI-identified improvements"
          icon={Lightbulb}
          variant="primary"
          trend="up"
          trendValue="+3 new"
        />
        <KPICard
          title="Recommendations"
          value={stats.recommendations.toString()}
          subtitle="AI-generated guidance"
          icon={Target}
          variant="success"
          trend="up"
          trendValue="+2 today"
        />
        <KPICard
          title="Playbooks"
          value={stats.playbooks.toString()}
          subtitle="Standardized procedures"
          icon={BookOpen}
          variant="default"
          trend="neutral"
          trendValue="Stable"
        />
        <KPICard
          title="Simulations"
          value={stats.simulations.toString()}
          subtitle="Scenario models"
          icon={FlaskConical}
          variant="warning"
          trend="up"
          trendValue="+1 this week"
        />
      </div>

      {/* Decision Workflow Process */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Decision Workflow Process</h3>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">1</div>
              <div className="flex-1">
                <div className="text-sm font-medium">Opportunity Discovery</div>
                <div className="text-xs text-muted-foreground">AI identifies optimization opportunities through data analysis</div>
              </div>
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>

            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center text-white text-sm font-medium">2</div>
              <div className="flex-1">
                <div className="text-sm font-medium">AI Recommendations</div>
                <div className="text-xs text-muted-foreground">Generate specific recommendations with analysis and rationale</div>
              </div>
              <Target className="w-5 h-5 text-success" />
            </div>

            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-warning flex items-center justify-center text-white text-sm font-medium">3</div>
              <div className="flex-1">
                <div className="text-sm font-medium">Playbook Selection</div>
                <div className="text-xs text-muted-foreground">Apply standardized procedures and methodologies</div>
              </div>
              <BookOpen className="w-5 h-5 text-warning" />
            </div>

            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-sm font-medium">4</div>
              <div className="flex-1">
                <div className="text-sm font-medium">Simulation & Testing</div>
                <div className="text-xs text-muted-foreground">Model scenarios and validate optimization strategies</div>
              </div>
              <FlaskConical className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">5</div>
              <div className="flex-1">
                <div className="text-sm font-medium">Execution & Tracking</div>
                <div className="text-xs text-muted-foreground">Deploy optimizations and monitor implementation progress</div>
              </div>
              <Rocket className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h4 className="text-sm font-medium">AI Discovery</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Run AI analysis to discover new optimization opportunities
            </p>
            <Button size="sm" className="w-full">
              Start Discovery
            </Button>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <BarChart3 className="w-5 h-5 text-success" />
              <h4 className="text-sm font-medium">Performance Review</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Review current optimization performance and outcomes
            </p>
            <Button variant="outline" size="sm" className="w-full">
              View Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DecisionWorkflowTab() {
  return (
    <div className="space-y-6">
      {/* Workflow Navigation */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Lightbulb className="w-6 h-6 text-primary" />
          </div>
          <h4 className="text-sm font-medium mb-1">Opportunities</h4>
          <p className="text-xs text-muted-foreground mb-3">Identify & assess optimization opportunities</p>
          <Button size="sm" variant="outline" className="w-full">
            View Opportunities
          </Button>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-success" />
          </div>
          <h4 className="text-sm font-medium mb-1">Recommendations</h4>
          <p className="text-xs text-muted-foreground mb-3">AI-generated optimization guidance</p>
          <Button size="sm" variant="outline" className="w-full">
            View Recommendations
          </Button>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6 text-warning" />
          </div>
          <h4 className="text-sm font-medium mb-1">Playbooks</h4>
          <p className="text-xs text-muted-foreground mb-3">Standardized optimization procedures</p>
          <Button size="sm" variant="outline" className="w-full">
            View Playbooks
          </Button>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="w-12 h-12 rounded-lg bg-secondary/50 flex items-center justify-center mx-auto mb-3">
            <FlaskConical className="w-6 h-6 text-muted-foreground" />
          </div>
          <h4 className="text-sm font-medium mb-1">Simulations</h4>
          <p className="text-xs text-muted-foreground mb-3">Model & test optimization scenarios</p>
          <Button size="sm" variant="outline" className="w-full">
            View Simulations
          </Button>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Rocket className="w-6 h-6 text-primary" />
          </div>
          <h4 className="text-sm font-medium mb-1">Execution</h4>
          <p className="text-xs text-muted-foreground mb-3">Deploy & track optimization implementation</p>
          <Button size="sm" variant="outline" className="w-full">
            View Execution
          </Button>
        </div>
      </div>

      {/* Workflow Description */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Optimization Decision Workflow</h3>
        <div className="prose prose-sm max-w-none text-muted-foreground">
          <p>
            The AI-Assisted Optimization workflow provides a structured approach to identifying,
            evaluating, and implementing operational improvements. Each stage builds upon the previous
            to ensure systematic and effective optimization deployment.
          </p>
          <p className="mt-3">
            Navigate through each workflow stage using the dedicated sub-navigation items. Each area
            provides specialized tools and interfaces designed for specific optimization activities,
            from initial opportunity discovery through final implementation tracking.
          </p>
        </div>
      </div>

      {/* Integration Points */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Integration with Other Systems</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg border border-success/20">
            <Send className="w-5 h-5 text-success mt-0.5" />
            <div>
              <div className="text-sm font-medium">SIM Integration</div>
              <div className="text-xs text-muted-foreground mt-1">
                Publish optimization actions directly to SIM boards for immediate implementation
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <div className="text-sm font-medium">CI Project Creation</div>
              <div className="text-xs text-muted-foreground mt-1">
                Convert optimization opportunities into formal Continuous Improvement projects
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
            <Database className="w-5 h-5 text-warning mt-0.5" />
            <div>
              <div className="text-sm font-medium">Performance Monitoring</div>
              <div className="text-xs text-muted-foreground mt-1">
                Connect with Performance analytics to validate optimization outcomes
              </div>
            </div>
          </div>
        </div>
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