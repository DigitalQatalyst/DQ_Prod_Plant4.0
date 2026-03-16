import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { useDataProvider } from "@/hooks/useDataProvider";
import { useSectorContentFilter } from "@/hooks/use-sector-switching";
import { ErrorAwareListPane } from "@/components/layout/ErrorAwareListPane";
import { ErrorAwareWorkPane } from "@/components/layout/ErrorAwareWorkPane";
import { KPICard, EmptyStates } from "@/components/shared";
import { SearchFilterSort } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  AlertTriangle,
  Microscope,
  Plus,
  Download,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  GitBranch,
  Network,
  Layers3,
  ClipboardList,
  ShieldCheck,
  Users,
  Wrench,
  Box,
  Leaf,
  Settings2,
  BookOpen,
  Calendar,
  Hash,
} from "lucide-react";
import { RootCauseAnalysis } from "@/types/optimise";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTypeLabel(type: string) {
  switch (type) {
    case "5-whys": return "5-Whys";
    case "fishbone": return "Fishbone";
    case "fault-tree": return "Fault Tree";
    default: return type;
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case "5-whys": return ChevronRight;
    case "fishbone": return GitBranch;
    case "fault-tree": return Network;
    default: return Layers3;
  }
}

/** Extract a human-readable one-liner title from the RCA content */
function getRcaTitle(rca: RootCauseAnalysis): string {
  const c = rca.content || {};
  if (rca.rcaType === "5-whys") {
    return c.why1 || rca.findings || "Untitled RCA";
  }
  if (rca.rcaType === "fishbone") {
    // Show the first non-empty category description as the headline
    const first = c.people || c.process || c.equipment || c.materials || c.environment || c.management;
    return first || rca.findings || "Untitled RCA";
  }
  return rca.findings || c.description || c.analysis || "Untitled RCA";
}

/** Extract the root cause conclusion string */
function getRcaConclusion(rca: RootCauseAnalysis): string {
  const c = rca.content || {};
  if (rca.rcaType === "5-whys") {
    return c.why5 || c.why4 || rca.conclusion || "";
  }
  if (rca.rcaType === "fishbone") {
    return c.management || c.environment || rca.conclusion || "";
  }
  return rca.conclusion || c.rootCause || "";
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export function RCA() {
  const { currentTenant, selectedAsset, setSelectedAsset, setIsPopPaneOpen, setPopPaneContent } = useApp();
  const { provider } = useDataProvider();
  const { filterItems } = useSectorContentFilter();
  const [searchQuery, setSearchQuery] = useState("");

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");

  useEffect(() => {
    return () => { setSelectedAsset(null); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Type-guard: only treat selectedAsset as an RCA if it looks like one
  const isValidRca = (v: any): v is RootCauseAnalysis =>
    v !== null && v !== undefined && typeof v.rcaType === "string" && typeof v.projectId === "string";

  const selectedRCA = isValidRca(selectedAsset) ? selectedAsset : null;

  // Fetch all CI projects to get their RCA data
  const {
    data: projects = [],
    isLoading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ["ci-projects", currentTenant.id],
    queryFn: () => provider.listCiProjects(currentTenant.id, {}),
    enabled: !!currentTenant.id,
  });

  // Fetch RCA data for each project and flatten
  const {
    data: allRCAs = [],
    isLoading: rcasLoading,
    error: rcasError,
  } = useQuery({
    queryKey: ["all-rcas", "v2", projects.map((p) => p.id)],
    queryFn: async () => {
      const rcaPromises = projects.map((project) =>
        provider.getCiProjectRca(project.id).catch((e) => {
          console.error("RCA fetch failed:", e);
          return [];
        })
      );
      const rcaArrays = await Promise.all(rcaPromises);
      return rcaArrays.flat();
    },
    enabled: projects.length > 0,
  });

  // Filter and sort RCA items based on search query, category, and sector
  const filteredRCAs = useMemo(() => {
    let rcas = filterItems(allRCAs);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      rcas = rcas.filter((rca) => {
        const title = getRcaTitle(rca).toLowerCase();
        const conclusion = getRcaConclusion(rca).toLowerCase();
        const project = (rca.projectTitle || "").toLowerCase();
        return title.includes(q) || conclusion.includes(q) || project.includes(q);
      });
    }

    if (categoryFilter && categoryFilter !== "all") {
      rcas = rcas.filter((rca) => rca.rcaType === categoryFilter);
    }

    const sorted = [...rcas];
    switch (sortBy) {
      case "recent":
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case "type":
        return sorted.sort((a, b) => (a.rcaType || "").localeCompare(b.rcaType || ""));
      case "project":
        return sorted.sort((a, b) => (a.projectTitle || "").localeCompare(b.projectTitle || ""));
      default:
        return sorted;
    }
  }, [searchQuery, allRCAs, categoryFilter, sortBy, filterItems]);


  const stats = useMemo(() => {
    const total = filteredRCAs.length;
    const fiveWhys = filteredRCAs.filter((r) => r.rcaType === "5-whys").length;
    const fishbone = filteredRCAs.filter((r) => r.rcaType === "fishbone").length;
    const faultTree = filteredRCAs.filter((r) => r.rcaType === "fault-tree").length;
    return { total, fiveWhys, fishbone, faultTree };
  }, [filteredRCAs]);

  const isLoading = projectsLoading || rcasLoading;
  const error = projectsError || rcasError;

  const openAIAssist = () => { setPopPaneContent({ type: null, data: null }); setIsPopPaneOpen(true); };
  const openCreateModal = () => { setPopPaneContent({ type: null, data: null }); setIsPopPaneOpen(true); };

  const rcaTabs = selectedRCA
    ? [
      { id: "problem-definition", label: "Problem Definition", content: <ProblemDefinitionTab rca={selectedRCA} /> },
      { id: "analysis", label: "Analysis", content: <AnalysisTab rca={selectedRCA} /> },
      { id: "verification", label: "Verification", content: <VerificationTab rca={selectedRCA} /> },
      { id: "documentation", label: "Documentation", content: <DocumentationTab rca={selectedRCA} /> },
    ]
    : [
      {
        id: "overview",
        label: "RCA Overview",
        content: <RCAOverview stats={stats} rcas={filteredRCAs} onSelect={(r) => setSelectedAsset(r as any)} />,
      },
    ];

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ErrorAwareListPane
        title="Root Cause Analysis"
        subtitle={currentTenant.name}
        count={filteredRCAs.length}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetchProjects()}
        contentType="RCA items"
        showFilters={false}
        actions={
          <Button size="sm" className="gap-2 w-full" onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            New RCA
          </Button>
        }
      >
        {filteredRCAs.length === 0 && !isLoading && !error ? (
          <div className="p-6 text-center">
            <EmptyStates.NoData title="No RCA Items" description="No root cause analyses found." />
          </div>
        ) : (
          <>
            <div className="px-2 pb-2">
              <SearchFilterSort
                searchPlaceholder="Search RCA items..."
                onSearchChange={setSearchQuery}
                filterContent={
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Analysis Method</label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All Methods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Methods</SelectItem>
                        <SelectItem value="5-whys">5-Whys</SelectItem>
                        <SelectItem value="fishbone">Fishbone</SelectItem>
                        <SelectItem value="fault-tree">Fault Tree</SelectItem>
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
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="type">Analysis Method</SelectItem>
                        <SelectItem value="project">Project Name</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                }
              />
            </div>

            <div className="space-y-1 px-1">
              {filteredRCAs.map((rca) => (
                <RCACard
                  key={rca.id}
                  rca={rca}
                  isSelected={selectedRCA?.id === rca.id}
                  onClick={() => setSelectedAsset(rca as unknown as any)}
                />
              ))}
            </div>
          </>
        )}
      </ErrorAwareListPane>

      <ErrorAwareWorkPane
        key={selectedRCA ? `rca-${selectedRCA.id}` : "rca-overview"}
        title={selectedRCA ? (selectedRCA.projectTitle || "Root Cause Analysis") : "Root Cause Analysis"}
        subtitle={
          selectedRCA
            ? `${selectedRCA.projectRef || ""} · ${getTypeLabel(selectedRCA.rcaType)}`
            : `${filteredRCAs.length} RCA items`
        }
        tabs={rcaTabs}
        defaultTab={selectedRCA ? "problem-definition" : "overview"}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetchProjects()}
        contentType="RCA details"
        actions={
          <div className="flex items-center gap-2">
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
    </div>
  );
}

// ─── List Item ───────────────────────────────────────────────────────────────

function RCACard({ rca, isSelected, onClick }: {
  rca: RootCauseAnalysis;
  isSelected: boolean;
  onClick: () => void;
}) {
  const TypeIcon = getTypeIcon(rca.rcaType);
  const title = getRcaTitle(rca);
  const conclusion = getRcaConclusion(rca);

  return (
    <div
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:border-primary/40 w-full max-w-full overflow-hidden",
        isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-accent/30"
      )}
      onClick={onClick}
    >
      {/* Top row: project ref + method badge */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono text-muted-foreground">
          {rca.projectRef || "RCA"}
        </span>
        <Badge
          variant="secondary"
          className={cn(
            "text-xs gap-1 flex items-center",
            rca.rcaType === "5-whys" && "bg-primary/10 text-primary border-primary/20",
            rca.rcaType === "fishbone" && "bg-amber-500/10 text-amber-600 border-amber-500/20",
            rca.rcaType === "fault-tree" && "bg-blue-500/10 text-blue-600 border-blue-500/20"
          )}
        >
          <TypeIcon className="w-3 h-3" />
          {getTypeLabel(rca.rcaType)}
        </Badge>
      </div>

      {/* Main title = actual problem / first why / fishbone cause */}
      <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-1">
        {rca.projectTitle || title}
      </h4>

      {/* Sub-line: first entry of the analysis chain */}
      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
        {title !== (rca.projectTitle || title) ? title : conclusion}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(rca.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
        <span className="text-primary/70 font-medium">{getRootCauseDepth(rca)} causes mapped</span>
      </div>
    </div>
  );
}

/** Count how many cause entries exist in the content */
function getRootCauseDepth(rca: RootCauseAnalysis): number {
  const c = rca.content || {};
  if (rca.rcaType === "5-whys") {
    return ["why1", "why2", "why3", "why4", "why5"].filter((k) => c[k]).length;
  }
  if (rca.rcaType === "fishbone") {
    return ["people", "process", "equipment", "materials", "environment", "management"].filter((k) => c[k]).length;
  }
  return Object.keys(c).length;
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function RCAOverview({
  stats,
  rcas,
  onSelect,
}: {
  stats: { total: number; fiveWhys: number; fishbone: number; faultTree: number };
  rcas: RootCauseAnalysis[];
  onSelect: (rca: RootCauseAnalysis) => void;
}) {
  const typeData = [
    { name: "5-Whys", value: stats.fiveWhys, fill: "hsl(var(--primary))" },
    { name: "Fishbone", value: stats.fishbone, fill: "hsl(220 80% 60%)" },
    { name: "Fault Tree", value: stats.faultTree, fill: "hsl(38 90% 55%)" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard title="Total RCAs" value={stats.total.toString()} subtitle="All analyses" icon={Microscope} variant="primary" />
        <KPICard title="5-Whys" value={stats.fiveWhys.toString()} subtitle="Sequential causation" icon={ChevronRight} variant="success"
          trend="neutral" trendValue={stats.total > 0 ? `${((stats.fiveWhys / stats.total) * 100).toFixed(0)}%` : "0%"} />
        <KPICard title="Fishbone" value={stats.fishbone.toString()} subtitle="Category-based" icon={GitBranch} variant="warning" />
        <KPICard title="Fault Tree" value={stats.faultTree.toString()} subtitle="Logic-tree analysis" icon={Network} variant="default" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="border border-border rounded-lg p-6 bg-card">
          <h3 className="text-sm font-semibold mb-4">Analysis Method Distribution</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value">
                  {typeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent RCAs clickable list */}
        <div className="border border-border rounded-lg p-6 bg-card">
          <h3 className="text-sm font-semibold mb-4">Recent RCA Items</h3>
          <div className="space-y-2">
            {rcas.slice(0, 6).map((rca) => {
              const TypeIcon = getTypeIcon(rca.rcaType);
              return (
                <div
                  key={rca.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/40 cursor-pointer transition-colors"
                  onClick={() => onSelect(rca)}
                >
                  <div className="mt-0.5 p-1.5 bg-secondary/30 rounded">
                    <TypeIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{rca.projectTitle || getRcaTitle(rca)}</p>
                    <p className="text-xs text-muted-foreground">{rca.projectRef} · {getTypeLabel(rca.rcaType)}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(rca.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Problem Definition Tab ────────────────────────────────────────────────────

function ProblemDefinitionTab({ rca }: { rca: RootCauseAnalysis }) {
  const c = rca.content || {};

  // For 5-whys, why1 is the incident / problem statement
  const problemStatement = rca.rcaType === "5-whys"
    ? c.why1
    : (c.people || c.process || c.equipment || "");

  const TypeIcon = getTypeIcon(rca.rcaType);

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{rca.projectTitle || "Problem Statement"}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{rca.projectRef} · Initiated {new Date(rca.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
          </div>
          <Badge variant="outline" className="gap-1.5 flex items-center text-sm">
            <TypeIcon className="w-4 h-4" />
            {getTypeLabel(rca.rcaType)}
          </Badge>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-1">Problem Statement</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">{problemStatement || "Not specified"}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InfoBlock label="Analysis Method" value={getTypeLabel(rca.rcaType)} icon={TypeIcon} />
          <InfoBlock label="Causes Identified" value={`${getRootCauseDepth(rca)} root cause factors`} icon={Layers3} />
          <InfoBlock label="Date Initiated" value={new Date(rca.createdAt).toLocaleDateString()} icon={Calendar} />
          <InfoBlock label="Project Reference" value={rca.projectRef || rca.projectId?.substring(0, 8) || "—"} icon={Hash} />
        </div>
      </div>

      {/* Scope and context */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          Scope &amp; Context
        </h3>
        <div className="space-y-3">
          <SectionRow label="System Affected" value="Transmission network — primary substation equipment" />
          <SectionRow label="Impact Severity" value="High — affects grid reliability and SAIDI/SAIFI metrics" />
          <SectionRow label="Incident Category" value={rca.rcaType === "5-whys" ? "Sequential Root Cause Chain" : rca.rcaType === "fishbone" ? "Multi-Category Cause Analysis" : "Fault Logic Tree"} />
          <SectionRow label="Analysis Status" value="Completed" valueClass="text-green-600 font-semibold" />
        </div>
      </div>

      {/* 5-Whys: show the problem chain as a visual cascade for context */}
      {rca.rcaType === "5-whys" && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-primary" />
            Incident Chain (Problem Context)
          </h3>
          <div className="space-y-2">
            {[c.why1, c.why2].filter(Boolean).map((step: string, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-foreground">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Analysis Tab ─────────────────────────────────────────────────────────────

function AnalysisTab({ rca }: { rca: RootCauseAnalysis }) {
  const c = rca.content || {};

  return (
    <div className="space-y-6">
      {rca.rcaType === "5-whys" && <FiveWhysAnalysis content={c} />}
      {rca.rcaType === "fishbone" && <FishboneAnalysis content={c} />}
      {rca.rcaType === "fault-tree" && <FaultTreeAnalysis content={c} />}

      {/* Root cause summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Microscope className="w-4 h-4 text-primary" />
          Root Cause Summary
        </h3>
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <p className="text-sm font-medium text-primary mb-1">Identified Root Cause</p>
          <p className="text-sm">{getRcaConclusion(rca) || "Under investigation"}</p>
        </div>
      </div>
    </div>
  );
}

function FiveWhysAnalysis({ content: c }: { content: Record<string, any> }) {
  const whys = [
    { label: "Why 1 — Immediate Cause", value: c.why1 },
    { label: "Why 2 — Underlying Cause", value: c.why2 },
    { label: "Why 3 — Process Cause", value: c.why3 },
    { label: "Why 4 — System Cause", value: c.why4 },
    { label: "Why 5 — Root Cause", value: c.why5 },
  ].filter((w) => w.value);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-base font-semibold mb-5 flex items-center gap-2">
        <ChevronRight className="w-4 h-4 text-primary" />
        5-Whys Analysis Chain
      </h3>
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-3.5 top-6 bottom-6 w-0.5 bg-border" />
        <div className="space-y-4">
          {whys.map((why, i) => {
            const isRoot = i === whys.length - 1;
            return (
              <div key={i} className="flex items-start gap-4 relative">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 z-10 mt-0.5",
                  isRoot
                    ? "bg-destructive text-white"
                    : "bg-primary/10 text-primary border border-primary/30"
                )}>
                  {i + 1}
                </div>
                <div className={cn(
                  "flex-1 rounded-lg p-3 border",
                  isRoot
                    ? "bg-destructive/5 border-destructive/30"
                    : "bg-secondary/20 border-border"
                )}>
                  <p className={cn("text-xs font-semibold mb-1", isRoot ? "text-destructive" : "text-muted-foreground")}>
                    {why.label}
                  </p>
                  <p className="text-sm">{why.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const FISHBONE_ICONS: Record<string, any> = {
  people: Users,
  process: Wrench,
  equipment: Box,
  materials: Layers3,
  environment: Leaf,
  management: Settings2,
};

const FISHBONE_COLORS: Record<string, string> = {
  people: "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400",
  process: "bg-violet-500/10 border-violet-500/20 text-violet-700 dark:text-violet-400",
  equipment: "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400",
  materials: "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400",
  environment: "bg-teal-500/10 border-teal-500/20 text-teal-700 dark:text-teal-400",
  management: "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400",
};

function FishboneAnalysis({ content: c }: { content: Record<string, any> }) {
  const categories = ["people", "process", "equipment", "materials", "environment", "management"];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-base font-semibold mb-5 flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-primary" />
        Fishbone (Ishikawa) Cause Categories
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {categories.filter((cat) => c[cat]).map((cat) => {
          const Icon = FISHBONE_ICONS[cat] || Layers3;
          const colorClass = FISHBONE_COLORS[cat] || "bg-secondary/20 border-border text-foreground";
          return (
            <div key={cat} className={cn("rounded-lg border p-4", colorClass)}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">{cat}</span>
              </div>
              <p className="text-sm leading-snug">{c[cat]}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FaultTreeAnalysis({ content: c }: { content: Record<string, any> }) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
        <Network className="w-4 h-4 text-primary" />
        Fault Tree Analysis
      </h3>
      <pre className="text-sm bg-secondary/10 rounded-lg p-4 overflow-auto whitespace-pre-wrap">
        {JSON.stringify(c, null, 2)}
      </pre>
    </div>
  );
}

// ─── Verification Tab ─────────────────────────────────────────────────────────

function VerificationTab({ rca }: { rca: RootCauseAnalysis }) {
  const c = rca.content || {};
  const depth = getRootCauseDepth(rca);

  // Derive a confidence level from how complete the analysis is
  const completeness = Math.round((depth / (rca.rcaType === "5-whys" ? 5 : 6)) * 100);
  const confidence = completeness >= 90 ? 92 : completeness >= 70 ? 78 : 60;

  // Derive evidence items from content
  const evidenceItems: string[] = [];
  if (rca.rcaType === "5-whys") {
    if (c.why1) evidenceItems.push(`Incident log: "${c.why1}"`);
    if (c.why3) evidenceItems.push(`Process audit finding: "${c.why3}"`);
    if (c.why5) evidenceItems.push(`Root cause confirmed: "${c.why5}"`);
  } else if (rca.rcaType === "fishbone") {
    if (c.people) evidenceItems.push(`Personnel factor: "${c.people}"`);
    if (c.equipment) evidenceItems.push(`Equipment inspection: "${c.equipment}"`);
    if (c.process) evidenceItems.push(`Process review: "${c.process}"`);
    if (c.management) evidenceItems.push(`Management review: "${c.management}"`);
  }

  return (
    <div className="space-y-6">
      {/* Confidence gauge */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          Analysis Confidence &amp; Completeness
        </h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-secondary/20 rounded-lg">
            <div className="text-3xl font-bold text-primary">{confidence}%</div>
            <div className="text-xs text-muted-foreground mt-1">Confidence Level</div>
          </div>
          <div className="text-center p-4 bg-secondary/20 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{depth}</div>
            <div className="text-xs text-muted-foreground mt-1">Causes Mapped</div>
          </div>
          <div className="text-center p-4 bg-secondary/20 rounded-lg">
            <div className="text-3xl font-bold text-amber-600">{completeness}%</div>
            <div className="text-xs text-muted-foreground mt-1">Analysis Completeness</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Analysis completeness</span>
            <span>{completeness}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>
      </div>

      {/* Evidence items */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Evidence &amp; Supporting Data
        </h3>
        {evidenceItems.length > 0 ? (
          <div className="space-y-2">
            {evidenceItems.map((ev, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-secondary/20 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{ev}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No structured evidence items extracted.</p>
        )}
      </div>

      {/* Validation checklist */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          Validation Checklist
        </h3>
        <div className="space-y-3">
          {[
            { label: "Root cause identified and documented", done: depth > 0 },
            { label: "Analysis method applied correctly", done: true },
            { label: "All cause categories covered", done: completeness >= 80 },
            { label: "Supporting evidence collected", done: evidenceItems.length > 0 },
            { label: "Countermeasures recommended", done: completeness >= 60 },
            { label: "Management review completed", done: completeness >= 90 },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                item.done ? "bg-green-100 dark:bg-green-900/40" : "bg-secondary"
              )}>
                {item.done
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  : <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                }
              </div>
              <span className={cn("text-sm", item.done ? "text-foreground" : "text-muted-foreground")}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Documentation Tab ─────────────────────────────────────────────────────────

function DocumentationTab({ rca }: { rca: RootCauseAnalysis }) {
  const c = rca.content || {};
  const rootCause = getRcaConclusion(rca);
  const problem = getRcaTitle(rca);

  return (
    <div className="space-y-6">
      {/* RCA Report header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              RCA Report
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Auto-generated from analysis data</p>
          </div>
          <Badge variant="outline">Draft</Badge>
        </div>

        <div className="space-y-4">
          <Section title="Project">
            <p className="text-sm">{rca.projectTitle || "—"} <span className="text-muted-foreground">({rca.projectRef})</span></p>
          </Section>

          <Section title="Analysis Method">
            <p className="text-sm">{getTypeLabel(rca.rcaType)}</p>
          </Section>

          <Section title="Problem Statement">
            <p className="text-sm">{problem}</p>
          </Section>

          <Section title="Root Cause">
            <p className="text-sm font-medium text-destructive">{rootCause || "Under investigation"}</p>
          </Section>
        </div>
      </div>

      {/* Full cause chain or category summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Layers3 className="w-4 h-4 text-primary" />
          {rca.rcaType === "5-whys" ? "Complete Cause Chain" : "Cause Category Summary"}
        </h3>

        {rca.rcaType === "5-whys" ? (
          <div className="space-y-2">
            {(["why1", "why2", "why3", "why4", "why5"] as const)
              .map((k, i) => ({ label: `Why ${i + 1}`, value: c[k] }))
              .filter((x) => x.value)
              .map((item, i, arr) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-muted-foreground w-14 flex-shrink-0 font-medium">{item.label}</span>
                  <span className={i === arr.length - 1 ? "font-medium text-destructive" : ""}>{item.value}</span>
                </div>
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {(["people", "process", "equipment", "materials", "environment", "management"] as const)
              .filter((k) => c[k])
              .map((k) => (
                <div key={k} className="text-sm p-2 bg-secondary/20 rounded">
                  <span className="font-medium capitalize">{k}: </span>
                  <span className="text-muted-foreground">{c[k]}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Recommended actions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary" />
          Recommended Actions
        </h3>
        <div className="space-y-2">
          {[
            "Address the identified root cause through targeted countermeasures",
            "Update relevant procedures and maintenance schedules",
            "Conduct follow-up verification after countermeasures are implemented",
            "Document lessons learned and share with relevant teams",
          ].map((action, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-primary font-medium mt-0.5">{i + 1}.</span>
              <span>{action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Metadata footer */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Hash className="w-4 h-4 text-primary" />
          Report Metadata
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <InfoBlock label="Created" value={new Date(rca.createdAt).toLocaleDateString()} icon={Calendar} />
          <InfoBlock label="Last Updated" value={new Date(rca.updatedAt).toLocaleDateString()} icon={Calendar} />
          <InfoBlock label="Record ID" value={rca.id.substring(0, 12) + "..."} icon={Hash} />
          <InfoBlock label="Project Ref" value={rca.projectRef || "—"} icon={FileText} />
        </div>
      </div>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function InfoBlock({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-secondary/20 rounded-lg">
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function SectionRow({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
      <span className={cn("text-sm font-medium text-right", valueClass)}>{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-3 border-b border-border/50 last:border-0">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
      {children}
    </div>
  );
}