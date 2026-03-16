import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useDataProvider } from "@/hooks/useDataProvider";
import { useSectorContentFilter } from "@/hooks/use-sector-switching";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { KPICard, StatusBadge, EmptyStates, SearchFilterSort } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Target,
  Settings,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Plus,
  Download,
  Sparkles,
  Clock,
  LayoutTemplate,
  FileText
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { OptimisationPlaybook, PlaybookFilters } from "@/types/optimise";
import { cn } from "@/lib/utils";
import { getSectorSpecificModalContent } from "@/lib/sectorModalUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Playbooks() {
  const { currentTenant, selectedAsset, setSelectedAsset, setIsPopPaneOpen, setPopPaneContent } = useApp();
  const { provider } = useDataProvider();

  const { filterItems, currentSectorName, currentSubsectorName } = useSectorContentFilter();

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
  const [sortBy, setSortBy] = useState<string>("usage");

  const selectedPlaybook = (selectedAsset as unknown as OptimisationPlaybook) || null;

  // Fetch playbooks
  const { data: playbooks = [], isLoading } = useQuery({
    queryKey: ['playbooks', "v2", currentTenant.id, categoryFilter],
    queryFn: async () => {
      const filters: PlaybookFilters = {};
      if (categoryFilter !== 'all') filters.category = categoryFilter as any;
      return provider.listPlaybooks(currentTenant.id, filters);
    },
    enabled: !!currentTenant.id
  });

  // Client-side search and sort
  const displayedPlaybooks = useMemo(() => {
    let result = filterItems(playbooks);

    // Apply search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        (p.title || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
      );
    }

    // Apply sorting
    const sorted = [...result];
    switch (sortBy) {
      case "usage":
        // Sort by steps count as a proxy for usage/complexity
        return sorted.sort((a, b) => (b.steps?.length || 0) - (a.steps?.length || 0));
      case "updated":
        return sorted.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      case "name":
        return sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      default:
        return sorted;
    }
  }, [playbooks, searchQuery, sortBy, filterItems]);


  const stats = useMemo(() => {
    const total = displayedPlaybooks.length;
    const categories = new Set(displayedPlaybooks.map(p => p.category)).size;
    // Mock applicability for stats since real data doesn't have it explicitly
    const highApplicability = displayedPlaybooks.length > 0 ? Math.floor(total * 0.4) : 0;

    return { total, categories, highApplicability };
  }, [displayedPlaybooks]);

  const openAIAssist = () => {
    setPopPaneContent({ type: null, data: null });
    setIsPopPaneOpen(true);
  };

  const openCreateModal = () => {
    const modalContent = getSectorSpecificModalContent('optimization-playbook', currentSectorName, currentSubsectorName);
    setPopPaneContent(modalContent);
    setIsPopPaneOpen(true);
  };

  const tabs = [
    {
      id: "overview",
      label: "Playbooks Library",
      content: (
        <PlaybooksOverview
          stats={stats}
          playbooks={displayedPlaybooks}
          isLoading={isLoading}
        />
      ),
    },
    {
      id: "templates",
      label: "Templates",
      content: <ComingSoon title="Playbook Templates" description="Standardized templates for creating new optimization procedures" />,
    },
  ];

  const detailTabs = selectedPlaybook
    ? [
      {
        id: "details",
        label: "Overview",
        content: <DetailsTab playbook={selectedPlaybook} />,
      },
      {
        id: "steps",
        label: "Procedures",
        content: <ProceduresTab playbook={selectedPlaybook} />,
      },
      {
        id: "outcomes",
        label: "Outcomes",
        content: <OutcomesTab playbook={selectedPlaybook} />,
      },
    ]
    : tabs;

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane
        title="Optimization Playbooks"
        subtitle={currentTenant.name}
        count={displayedPlaybooks.length}
        showFilters={false}
      >
        <div className="px-2 pb-2">
          <SearchFilterSort
            searchPlaceholder="Search playbooks..."
            onSearchChange={setSearchQuery}
            filterContent={
              <div className="space-y-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="operational-efficiency">Operational Efficiency</SelectItem>
                    <SelectItem value="asset-health">Asset Health</SelectItem>
                    <SelectItem value="reliability">Reliability</SelectItem>
                    <SelectItem value="loss-reduction">Loss Reduction</SelectItem>
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
                    <SelectItem value="usage">Most Used</SelectItem>
                    <SelectItem value="updated">Recently Updated</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
          />
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading library...</div>
        ) : displayedPlaybooks.length > 0 ? (
          displayedPlaybooks.map((playbook) => (
            <PlaybookItem
              key={playbook.id}
              playbook={playbook}
              isSelected={selectedPlaybook?.id === playbook.id}
              onClick={() => setSelectedAsset(playbook as unknown as any)}
            />
          ))
        ) : (
          <EmptyStates.NoData
            size="sm"
            title="No Playbooks"
            description="No playbooks found matching criteria."
            className="py-8"
          />
        )}
      </ListPane>

      <WorkPane
        key={selectedPlaybook ? `playbook-${selectedPlaybook.id}` : 'playbooks-overview'}
        title={selectedPlaybook ? selectedPlaybook.title : "Playbook Library"}
        subtitle={selectedPlaybook ? `${selectedPlaybook.category} · Ref: ${selectedPlaybook.playbookRef}` : `${displayedPlaybooks.length} standard procedures available`}
        tabs={detailTabs}
        defaultTab={selectedPlaybook ? "details" : "overview"}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={openCreateModal}>
              <Plus className="w-4 h-4" />
              New Playbook
            </Button>
            <Button size="sm" className="gap-2" onClick={openAIAssist}>
              <Sparkles className="w-4 h-4" />
              AI Helper
            </Button>
          </div>
        }
      />
    </div>
  );
}

function PlaybookItem({
  playbook,
  isSelected,
  onClick,
}: {
  playbook: OptimisationPlaybook;
  isSelected: boolean;
  onClick: () => void;
}) {
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
          <BookOpen className="w-4 h-4 text-primary" />
          <Badge variant="outline" className="text-[10px] px-1.5 h-5 capitalize">
            {(playbook.category || 'Standard').replace('-', ' ')}
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium line-clamp-2">{playbook.title}</h4>
        <p className="text-xs text-muted-foreground line-clamp-2">{playbook.description}</p>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
          <FileText className="w-3 h-3" />
          <span>{playbook.steps?.length || 0} Steps</span>
        </div>
      </div>
    </div>
  );
}

function PlaybooksOverview({
  stats,
  playbooks,
  isLoading
}: {
  stats: { total: number; categories: number; highApplicability: number };
  playbooks: OptimisationPlaybook[];
  isLoading: boolean;
}) {
  const topPlaybooks = playbooks.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <KPICard
          title="Total Playbooks"
          value={stats.total.toString()}
          subtitle="Standard Procedures"
          icon={BookOpen}
          variant="primary"
        />
        <KPICard
          title="Categories"
          value={stats.categories.toString()}
          subtitle="Focus Areas"
          icon={LayoutTemplate}
          variant="default"
        />
        <KPICard
          title="Validation"
          value="High"
          subtitle="Methodology Standard"
          icon={CheckCircle}
          variant="success"
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Featured Playbooks</h3>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="space-y-3">
            {topPlaybooks.map((pb) => (
              <PlaybookItem
                key={pb.id}
                playbook={pb}
                isSelected={false}
                onClick={() => { }}
              />
            ))}
            {topPlaybooks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No playbooks found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailsTab({ playbook }: { playbook: OptimisationPlaybook }) {
  // Parsing applicability criteria if present (assuming object mostly)
  const criteria = playbook.applicabilityCriteria || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">{playbook.title}</h3>
              <StatusBadge status="active" />
            </div>
            <p className="text-muted-foreground mb-3">{playbook.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="capitalize">{(playbook.category || 'Standard').replace('-', ' ')}</span>
              <span>·</span>
              <span>Ref: {playbook.playbookRef}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard
          title="Steps"
          value={(playbook.steps?.length || 0).toString()}
          subtitle="Procedure count"
          icon={FileText}
          variant="default"
        />
        <KPICard
          title="Est. Duration"
          value="2-4 wks" // Mock value as duration isn't on root
          subtitle="Implementation time"
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="Complexity"
          value="Medium"
          subtitle="Resource needs"
          icon={Settings}
          variant="default"
        />
      </div>

      {/* Applicability */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Applicability Criteria</h3>
        <div className="prose prose-sm max-w-none text-muted-foreground">
          {Object.keys(criteria).length > 0 ? (
            <ul className="space-y-2">
              {Object.entries(criteria).map(([key, value]) => (
                <li key={key} className="flex gap-2">
                  <span className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span>{String(value)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No specific applicability criteria defined.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ProceduresTab({ playbook }: { playbook: OptimisationPlaybook }) {
  const steps = playbook.steps || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Standard Operating Procedures</h3>
        <Button size="sm" variant="outline"> <Download className="w-4 h-4 mr-2" /> Export SOP</Button>
      </div>

      {steps.length > 0 ? (
        <div className="relative border-l border-border ml-4 space-y-8 py-2">
          {steps.map((step: any, index: number) => (
            <div key={index} className="ml-8 relative">
              <div className="absolute -left-[41px] bg-background border border-border rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium z-10">
                {index + 1}
              </div>
              <div className="bg-card border border-border rounded-lg p-5">
                <h4 className="font-medium mb-2 text-base">{step.title || `Step ${index + 1}`}</h4>
                <p className="text-sm text-muted-foreground mb-3">{step.description || JSON.stringify(step)}</p>

                {/* Render sub-properties if common ones exist */}
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {step.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {step.duration}</span>}
                  {step.role && <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {step.role}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyStates.NoData title="No Steps Defined" description="This playbook does not have detailed procedural steps." />
      )}
    </div>
  );
}

function OutcomesTab({ playbook }: { playbook: OptimisationPlaybook }) {
  const outcomes = playbook.expectedOutcomes || [];
  const metrics = playbook.successMetrics || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" />
            Expected Outcomes
          </h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            {outcomes.length > 0 ? (
              <ul className="list-disc list-inside space-y-2 text-sm text-foreground">
                {outcomes.map((outcome: any, i: number) => (
                  <li key={i}>{typeof outcome === 'string' ? outcome : outcome.description || JSON.stringify(outcome)}</li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted-foreground">No specific outcomes defined.</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Success Metrics (KPIs)
          </h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            {metrics.length > 0 ? (
              <div className="space-y-3">
                {metrics.map((metric: any, i: number) => (
                  <InfoRow
                    key={i}
                    label={metric.name || metric.label || `Metric ${i + 1}`}
                    value={metric.target || metric.value || '-'}
                  />
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No success metrics defined.</div>
            )}
          </div>
        </div>
      </div>

      {/* Case Studies Placeholder if we had them */}
      {playbook.caseStudies && playbook.caseStudies.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Case Studies</h3>
          <div className="grid grid-cols-2 gap-4">
            {playbook.caseStudies.map((study: any, i: number) => (
              <div key={i} className="p-4 border border-border rounded bg-muted/20">
                <h4 className="font-medium text-sm mb-1">{study.title || `Case Study ${i + 1}`}</h4>
                <p className="text-xs text-muted-foreground">{study.summary || JSON.stringify(study)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
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
      <p className="text-xs text-muted-foreground mt-4">Coming Soon</p>
    </div>
  );
}