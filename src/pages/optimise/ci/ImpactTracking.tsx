import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { useDataProvider } from "@/hooks/useDataProvider";
import { useSectorContentFilter } from "@/hooks/use-sector-switching";
import { ErrorAwareListPane } from "@/components/layout/ErrorAwareListPane";
import { ErrorAwareWorkPane } from "@/components/layout/ErrorAwareWorkPane";
import { KPICard, EmptyStates, SearchFilterSort } from "@/components/shared";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart2,
  Target,
  TrendingUp,
  CheckCircle,
  Plus,
  Download,
  Sparkles,
  Activity,
  Edit,
  Save,
  LineChart,
} from "lucide-react";
import { CIProject, CIKPI, CIImpact, UpsertImpactRequest } from "@/types/optimise";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, AreaChart, Area } from "recharts";

interface ProjectWithImpact extends CIProject {
  impactData?: CIImpact;
  kpiData?: CIKPI;
}

export function ImpactTracking() {
  const { currentTenant, selectedAsset, setSelectedAsset, setIsPopPaneOpen, setPopPaneContent } = useApp();
  const { provider } = useDataProvider();
  const { filterItems } = useSectorContentFilter();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("impact");
  const [isLinkKPIModalOpen, setIsLinkKPIModalOpen] = useState(false);

  // Clear any previous selection from other pages on mount
  useEffect(() => {
    setSelectedAsset(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Use selectedAsset from AppContext for ProjectWithImpact selection
  const selectedProject = selectedAsset as unknown as ProjectWithImpact | null;

  // Fetch CI projects
  const {
    data: projects = [],
    isLoading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ['ci-projects', currentTenant.id],
    queryFn: () => provider.listCiProjects(currentTenant.id, {}),
    enabled: !!currentTenant.id,
  });

  // Fetch KPIs for selected project
  const {
    data: projectKPIs = [],
    isLoading: kpisLoading,
  } = useQuery({
    queryKey: ['ci-project-kpis', selectedProject?.id],
    queryFn: () => provider.listCiProjectKpis(selectedProject!.id),
    enabled: !!selectedProject?.id,
  });

  // Filter and sort projects based on search query and project filter
  const filteredProjects = useMemo(() => {
    let filtered = filterItems(projects);

    if (projectFilter !== "all") {
      filtered = filtered.filter(p => p.id === projectFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(query) ||
          project.projectRef.toLowerCase().includes(query) ||
          project.owner.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered];
    switch (sortBy) {
      case "impact":
        return sorted.sort((a, b) => {
          const aImpact = (a.impacts?.length || 0) > 0
            ? a.impacts!.reduce((sum, i) => sum + (i.impactValue || 0), 0) / a.impacts!.length
            : 0;
          const bImpact = (b.impacts?.length || 0) > 0
            ? b.impacts!.reduce((sum, i) => sum + (i.impactValue || 0), 0) / b.impacts!.length
            : 0;
          return bImpact - aImpact;
        });
      case "kpis":
        return sorted.sort((a, b) => (b.impacts?.length || 0) - (a.impacts?.length || 0));
      case "name":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sorted;
    }
  }, [searchQuery, projects, projectFilter, sortBy, filterItems]);


  // Calculate stats
  const stats = useMemo(() => {
    const totalProjects = filteredProjects.length;
    const projectsWithImpacts = filteredProjects.filter(p => p.impacts && p.impacts.length > 0).length;
    const totalImpacts = filteredProjects.reduce((sum, p) => sum + (p.impacts?.length || 0), 0);

    // Calculate average impact value
    const impactsWithValues = filteredProjects.flatMap(p => p.impacts || []).filter(i => i.impactValue !== undefined && i.impactValue !== null);
    const avgImpactValue = impactsWithValues.length > 0
      ? impactsWithValues.reduce((sum, i) => sum + (i.impactValue || 0), 0) / impactsWithValues.length
      : 0;

    return { totalProjects, projectsWithImpacts, totalImpacts, avgImpactValue };
  }, [filteredProjects]);

  const openAIAssist = () => {
    setPopPaneContent({ type: null, data: null });
    setIsPopPaneOpen(true);
  };

  const openLinkKPIModal = () => {
    setIsLinkKPIModalOpen(true);
  };

  const handleLinkSuccess = () => {
    setIsLinkKPIModalOpen(false);
    refetchProjects();
    queryClient.invalidateQueries({ queryKey: ['ci-project-kpis'] });
    toast.success("KPI linked successfully");
  };

  // Prepare list items for ErrorAwareListPane
  const listItems = filteredProjects.map(project => {
    const impactCount = project.impacts?.length || 0;
    const avgImpact = impactCount > 0
      ? project.impacts!.reduce((sum, i) => sum + (i.impactValue || 0), 0) / impactCount
      : 0;

    return {
      title: project.title,
      subtitle: project.projectRef,
      status: getStatusForListItem(avgImpact),
      priority: project.priority,
      metadata: [
        { label: "Owner", value: project.owner },
        { label: "KPIs", value: `${impactCount} linked` },
        { label: "Avg Impact", value: impactCount > 0 ? `${avgImpact.toFixed(0)}%` : "N/A" },
      ],
      isSelected: selectedProject?.id === project.id,
      onClick: () => setSelectedAsset(project as any),
      variant: "compact" as const,
    };
  });

  // Prepare tabs for ErrorAwareWorkPane
  const workPaneTabs = selectedProject ? [
    {
      id: "kpis",
      label: "KPIs & Impact",
      content: <KPIsTab project={selectedProject} projectKPIs={projectKPIs} isLoading={kpisLoading} onUpdate={handleLinkSuccess} />,
    },
    {
      id: "trends",
      label: "Trends",
      content: <TrendsTab project={selectedProject} projectKPIs={projectKPIs} />,
    },
    {
      id: "analysis",
      label: "Analysis",
      content: <AnalysisTab project={selectedProject} projectKPIs={projectKPIs} />,
    },
  ] : [
    {
      id: "overview",
      label: "Impact Tracking Overview",
      content: (
        <ImpactTrackingOverview
          stats={stats}
          projects={filteredProjects}
          setSelectedAsset={setSelectedAsset}
        />
      ),
    },
  ];

  const isLoading = projectsLoading;
  const error = projectsError;

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ErrorAwareListPane
        title="Impact Tracking"
        subtitle={currentTenant.name}
        count={filteredProjects.length}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          refetchProjects();
        }}
        contentType="impact tracking"
        showFilters={false}
        actions={
          selectedProject && (
            <Button size="sm" className="gap-2 w-full" onClick={openLinkKPIModal}>
              <Plus className="w-4 h-4" />
              Link KPI
            </Button>
          )
        }
      >
        {filteredProjects.length === 0 && !isLoading && !error ? (
          <div className="p-6 text-center">
            <EmptyStates.NoData
              title="No Projects"
              description="No CI projects found for impact tracking."
            />
          </div>
        ) : (
          <>
            {/* Search, Filter, and Sort */}
            <div className="px-2 pb-2">
              <SearchFilterSort
                searchPlaceholder="Search projects..."
                onSearchChange={setSearchQuery}
                filterContent={
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Project</Label>
                    <Select value={projectFilter} onValueChange={setProjectFilter}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All projects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All projects</SelectItem>
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>
                        ))}
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
                        <SelectItem value="impact">Impact (High to Low)</SelectItem>
                        <SelectItem value="kpis">KPIs Count (High to Low)</SelectItem>
                        <SelectItem value="name">Name (A-Z)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                }
              />
            </div>

            {/* List Items */}
            <div className="space-y-1">
              {listItems.map((item, index) => (
                <div
                  key={index}
                  onClick={item.onClick}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all",
                    item.isSelected ? "bg-primary/5 border-primary" : "bg-card border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="text-sm font-medium truncate">{item.title}</h5>
                        <StatusBadge status={item.status} size="sm" />
                      </div>
                      <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    {item.metadata.map((meta, idx) => (
                      <div key={idx}>
                        <span className="font-medium">{meta.label}:</span> {meta.value}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </ErrorAwareListPane>

      <ErrorAwareWorkPane
        title={selectedProject ? selectedProject.title : "Impact Tracking"}
        subtitle={selectedProject ? `${selectedProject.owner} · ${projectKPIs.length} KPIs` : `${filteredProjects.length} projects`}
        tabs={workPaneTabs}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          refetchProjects();
        }}
        contentType="impact details"
        actions={
          <div className="flex items-center gap-2">
            {selectedProject && (
              <Button variant="outline" size="sm" className="gap-2" onClick={openLinkKPIModal}>
                <Plus className="w-4 h-4" />
                Link KPI
              </Button>
            )}
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

      {selectedProject && (
        <LinkKPIModal
          open={isLinkKPIModalOpen}
          onOpenChange={setIsLinkKPIModalOpen}
          onSuccess={handleLinkSuccess}
          project={selectedProject}
        />
      )}
    </div>
  );
}

// Helper function to map impact value to list item status
function getStatusForListItem(impactValue: number): "online" | "offline" | "maintenance" | "warning" {
  if (impactValue >= 80) return "online"; // Ahead
  if (impactValue >= 50) return "maintenance"; // On track
  if (impactValue >= 0) return "warning"; // At risk
  return "offline"; // Behind
}

function ImpactTrackingOverview({
  stats,
  projects,
  setSelectedAsset,
}: {
  stats: { totalProjects: number; projectsWithImpacts: number; totalImpacts: number; avgImpactValue: number };
  projects: CIProject[];
  setSelectedAsset: (asset: any) => void;
}) {

  // Prepare data for distribution chart
  const distributionData = useMemo(() => {
    const bins = [
      { name: 'On Track (>=80%)', count: 0, fill: 'hsl(var(--success))' },
      { name: 'Concerning (50-79%)', count: 0, fill: 'hsl(var(--warning))' },
      { name: 'Behind (<50%)', count: 0, fill: 'hsl(var(--destructive))' },
      { name: 'No Data', count: 0, fill: 'hsl(var(--muted))' },
    ];

    projects.forEach(p => {
      const impactCount = p.impacts?.length || 0;
      if (impactCount === 0) {
        bins[3].count++;
        return;
      }

      const avgImpact = p.impacts!.reduce((sum, i) => sum + (i.impactValue || 0), 0) / impactCount;
      if (avgImpact >= 80) bins[0].count++;
      else if (avgImpact >= 50) bins[1].count++;
      else bins[2].count++;
    });

    return bins;
  }, [projects]);


  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Projects"
          value={stats.totalProjects.toString()}
          subtitle="CI projects"
          icon={BarChart2}
          variant="primary"
        />
        <KPICard
          title="With Impacts"
          value={stats.projectsWithImpacts.toString()}
          subtitle="Projects tracking KPIs"
          icon={Target}
          variant="warning"
          trend="up"
          trendValue={`${stats.totalProjects > 0 ? ((stats.projectsWithImpacts / stats.totalProjects) * 100).toFixed(0) : 0}%`}
        />
        <KPICard
          title="Total KPIs"
          value={stats.totalImpacts.toString()}
          subtitle="Impact measurements"
          icon={TrendingUp}
          variant="success"
        />
        <KPICard
          title="Avg Impact"
          value={`${stats.avgImpactValue.toFixed(0)}%`}
          subtitle="Overall progress"
          icon={Activity}
          variant={stats.avgImpactValue >= 80 ? "success" : stats.avgImpactValue >= 50 ? "warning" : "destructive"}
          trend={stats.avgImpactValue >= 80 ? "up" : stats.avgImpactValue >= 50 ? "neutral" : "down"}
          trendValue={`${stats.avgImpactValue.toFixed(0)}%`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Section */}
        <div className="border border-border rounded-lg p-6 bg-card">
          <h3 className="text-sm font-semibold mb-4">Impact Performance Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32} name="Projects">
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Projects with Impacts */}
        <div className="border border-border rounded-lg p-6 bg-card">
          <h3 className="text-sm font-semibold mb-4">Top Performing Projects</h3>
          <div className="space-y-2">
            {projects
              .filter(p => p.impacts && p.impacts.length > 0)
              .sort((a, b) => {
                const avgA = a.impacts!.reduce((sum, i) => sum + (i.impactValue || 0), 0) / a.impacts!.length;
                const avgB = b.impacts!.reduce((sum, i) => sum + (i.impactValue || 0), 0) / b.impacts!.length;
                return avgB - avgA;
              })
              .slice(0, 5)
              .map((project) => {
                const impactCount = project.impacts!.length;
                const avgImpact = project.impacts!.reduce((sum, i) => sum + (i.impactValue || 0), 0) / impactCount;

                return (
                  <div
                    key={project.id}
                    onClick={() => setSelectedAsset(project as unknown as any)}
                    className="bg-secondary/10 hover:bg-secondary/20 border border-transparent hover:border-primary/20 rounded-lg p-3 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold truncate">{project.title}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{project.projectRef}</p>
                      </div>
                      <div className="text-right ml-4">
                        <div className={cn(
                          "text-lg font-bold",
                          avgImpact >= 80 ? "text-green-600" :
                            avgImpact >= 50 ? "text-yellow-600" :
                              "text-red-600"
                        )}>{avgImpact.toFixed(0)}%</div>
                        <div className="text-[10px] text-muted-foreground">Impact</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{impactCount} KPIs tracked</span>
                      <span>·</span>
                      <span className="capitalize">{project.status}</span>
                    </div>
                  </div>
                );
              })}
            {projects.filter(p => p.impacts && p.impacts.length > 0).length === 0 && (
              <EmptyStates.NoData
                title="No Impact Data"
                description="No projects have impact measurements yet."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPIsTab({
  project,
  projectKPIs,
  isLoading,
  onUpdate
}: {
  project: ProjectWithImpact;
  projectKPIs: Array<CIKPI & { impact?: CIImpact }>;
  isLoading: boolean;
  onUpdate: () => void;
}) {
  const { provider } = useDataProvider();
  const [editingKPI, setEditingKPI] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    baseline: string;
    target: string;
    actual: string;
    notes: string;
  }>({
    baseline: "",
    target: "",
    actual: "",
    notes: "",
  });

  const updateImpactMutation = useMutation({
    mutationFn: async (payload: UpsertImpactRequest) => {
      return provider.upsertCiImpact(payload);
    },
    onSuccess: () => {
      toast.success("Impact values updated successfully");
      setEditingKPI(null);
      onUpdate();
    },
    onError: (error: any) => {
      toast.error(`Failed to update impact: ${error.message}`);
    },
  });

  const handleEdit = (kpi: CIKPI & { impact?: CIImpact }) => {
    setEditingKPI(kpi.id);
    setFormData({
      baseline: kpi.impact?.baseline?.toString() || "",
      target: kpi.impact?.target?.toString() || "",
      actual: kpi.impact?.actual?.toString() || "",
      notes: kpi.impact?.notes || "",
    });
  };

  const handleSave = (kpiId: string) => {
    updateImpactMutation.mutate({
      projectId: project.id,
      kpiId,
      baseline: formData.baseline ? parseFloat(formData.baseline) : undefined,
      target: formData.target ? parseFloat(formData.target) : undefined,
      actual: formData.actual ? parseFloat(formData.actual) : undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleCancel = () => {
    setEditingKPI(null);
    setFormData({ baseline: "", target: "", actual: "", notes: "" });
  };

  const calculateImpactValue = (baseline?: number, target?: number, actual?: number): number | null => {
    if (baseline === undefined || target === undefined || actual === undefined) return null;
    if (target === baseline) return 100; // Avoid division by zero
    return ((actual - baseline) / (target - baseline)) * 100;
  };

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Loading KPIs...</div>;
  }

  if (projectKPIs.length === 0) {
    return (
      <EmptyStates.NoData
        title="No KPIs Linked"
        description="Link KPIs to this project to track impact measurements."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs List */}
      {projectKPIs.map((kpi) => {
        const impact = kpi.impact;
        const impactValue = impact ? calculateImpactValue(impact.baseline, impact.target, impact.actual) : null;
        const isEditing = editingKPI === kpi.id;

        return (
          <div key={kpi.id} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{kpi.name}</h3>
                  {impactValue !== null && (
                    <StatusBadge
                      status={impactValue >= 80 ? "online" : impactValue >= 50 ? "maintenance" : "warning"}
                    />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{kpi.kpiCode}</p>
              </div>
              {!isEditing && (
                <Button variant="outline" size="sm" className="gap-2" onClick={() => handleEdit(kpi)}>
                  <Edit className="w-4 h-4" />
                  Edit Values
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm mb-2 block">Baseline {kpi.unit && `(${kpi.unit})`}</Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.baseline}
                      onChange={(e) => setFormData({ ...formData, baseline: e.target.value })}
                      placeholder="Enter baseline value"
                    />
                  </div>
                  <div>
                    <Label className="text-sm mb-2 block">Target {kpi.unit && `(${kpi.unit})`}</Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.target}
                      onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                      placeholder="Enter target value"
                    />
                  </div>
                  <div>
                    <Label className="text-sm mb-2 block">Actual {kpi.unit && `(${kpi.unit})`}</Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.actual}
                      onChange={(e) => setFormData({ ...formData, actual: e.target.value })}
                      placeholder="Enter actual value"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm mb-2 block">Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add notes about this measurement..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => handleSave(kpi.id)}
                    disabled={updateImpactMutation.isPending}
                  >
                    <Save className="w-4 h-4" />
                    {updateImpactMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-6 mb-4">
                  <div className="bg-secondary/10 rounded-lg p-4">
                    <div className="text-xs text-muted-foreground mb-1">Baseline</div>
                    <div className="text-2xl font-bold">
                      {impact?.baseline !== undefined ? `${impact.baseline}${kpi.unit || ''}` : 'Not set'}
                    </div>
                  </div>
                  <div className="bg-secondary/10 rounded-lg p-4">
                    <div className="text-xs text-muted-foreground mb-1">Target</div>
                    <div className="text-2xl font-bold">
                      {impact?.target !== undefined ? `${impact.target}${kpi.unit || ''}` : 'Not set'}
                    </div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-4">
                    <div className="text-xs text-muted-foreground mb-1">Actual</div>
                    <div className="text-2xl font-bold text-primary">
                      {impact?.actual !== undefined ? `${impact.actual}${kpi.unit || ''}` : 'Not set'}
                    </div>
                  </div>
                </div>

                {impactValue !== null && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Impact Value</span>
                      <span className={cn(
                        "text-2xl font-bold",
                        impactValue >= 80 ? "text-green-600" :
                          impactValue >= 50 ? "text-yellow-600" :
                            "text-red-600"
                      )}>
                        {impactValue.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div
                        className={cn(
                          "h-3 rounded-full transition-all",
                          impactValue >= 80 ? "bg-green-600" :
                            impactValue >= 50 ? "bg-yellow-600" :
                              "bg-red-600"
                        )}
                        style={{ width: `${Math.max(0, Math.min(100, impactValue))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Formula: (Actual - Baseline) / (Target - Baseline) × 100
                    </div>
                  </div>
                )}

                {impact?.notes && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-sm font-medium mb-2">Notes</div>
                    <p className="text-sm text-muted-foreground">{impact.notes}</p>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TrendsTab({
  project,
  projectKPIs
}: {
  project: ProjectWithImpact;
  projectKPIs: Array<CIKPI & { impact?: CIImpact }>;
}) {
  const kpisWithImpact = projectKPIs.filter(kpi => kpi.impact && kpi.impact.actual !== undefined);

  if (kpisWithImpact.length === 0) {
    return (
      <EmptyStates.NoData
        title="No Trend Data"
        description="Add actual values to KPIs to see trend analysis."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <LineChart className="w-5 h-5 text-primary" />
          Impact Trends
        </h3>
        <div className="space-y-4">
          {kpisWithImpact.map((kpi) => {
            const impact = kpi.impact!;
            const impactValue = ((impact.actual! - (impact.baseline || 0)) / ((impact.target || 0) - (impact.baseline || 0))) * 100;

            return (
              <div key={kpi.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{kpi.name}</span>
                  <span className={cn(
                    "text-sm font-bold",
                    impactValue >= 80 ? "text-green-600" :
                      impactValue >= 50 ? "text-yellow-600" :
                        "text-red-600"
                  )}>
                    {impactValue.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Baseline: {impact.baseline}{kpi.unit || ''}</span>
                  <span>→</span>
                  <span>Actual: {impact.actual}{kpi.unit || ''}</span>
                  <span>→</span>
                  <span>Target: {impact.target}{kpi.unit || ''}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      impactValue >= 80 ? "bg-green-600" :
                        impactValue >= 50 ? "bg-yellow-600" :
                          "bg-red-600"
                    )}
                    style={{ width: `${Math.max(0, Math.min(100, impactValue))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AnalysisTab({
  project,
  projectKPIs
}: {
  project: ProjectWithImpact;
  projectKPIs: Array<CIKPI & { impact?: CIImpact }>;
}) {
  const kpisWithImpact = projectKPIs.filter(kpi => kpi.impact && kpi.impact.actual !== undefined);

  const avgImpact = kpisWithImpact.length > 0
    ? kpisWithImpact.reduce((sum, kpi) => {
      const impact = kpi.impact!;
      const impactValue = ((impact.actual! - (impact.baseline || 0)) / ((impact.target || 0) - (impact.baseline || 0))) * 100;
      return sum + impactValue;
    }, 0) / kpisWithImpact.length
    : 0;

  const exceeding = kpisWithImpact.filter(kpi => {
    const impact = kpi.impact!;
    const impactValue = ((impact.actual! - (impact.baseline || 0)) / ((impact.target || 0) - (impact.baseline || 0))) * 100;
    return impactValue >= 100;
  }).length;

  const onTrack = kpisWithImpact.filter(kpi => {
    const impact = kpi.impact!;
    const impactValue = ((impact.actual! - (impact.baseline || 0)) / ((impact.target || 0) - (impact.baseline || 0))) * 100;
    return impactValue >= 50 && impactValue < 100;
  }).length;

  const atRisk = kpisWithImpact.filter(kpi => {
    const impact = kpi.impact!;
    const impactValue = ((impact.actual! - (impact.baseline || 0)) / ((impact.target || 0) - (impact.baseline || 0))) * 100;
    return impactValue < 50;
  }).length;

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Impact Analysis Summary</h3>
        <div className="space-y-4">
          <InfoRow label="Average Impact Value" value={`${avgImpact.toFixed(1)}%`} />
          <InfoRow label="KPIs Exceeding Target" value={`${exceeding} of ${kpisWithImpact.length}`} />
          <InfoRow label="KPIs On Track" value={`${onTrack} of ${kpisWithImpact.length}`} />
          <InfoRow label="KPIs At Risk" value={`${atRisk} of ${kpisWithImpact.length}`} />
          <InfoRow label="Overall Status" value={avgImpact >= 80 ? "Excellent" : avgImpact >= 50 ? "Good" : "Needs Attention"} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
        <div className="space-y-3">
          {avgImpact >= 80 && (
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium">Excellent Progress</div>
                <div className="text-xs text-muted-foreground">Project is exceeding expectations. Consider documenting best practices for replication.</div>
              </div>
            </div>
          )}
          {avgImpact >= 50 && avgImpact < 80 && (
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium">On Track</div>
                <div className="text-xs text-muted-foreground">Project is progressing well. Continue monitoring and maintain current countermeasures.</div>
              </div>
            </div>
          )}
          {avgImpact < 50 && (
            <div className="flex items-start gap-3">
              <Activity className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium">Needs Attention</div>
                <div className="text-xs text-muted-foreground">Project is below target. Review countermeasures and consider additional actions.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LinkKPIModal({
  open,
  onOpenChange,
  onSuccess,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  project: CIProject;
}) {
  const { currentTenant } = useApp();
  const { provider } = useDataProvider();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState("");
  const [formData, setFormData] = useState({
    baseline: "",
    target: "",
    actual: "",
    notes: "",
  });

  // Fetch available KPIs
  const { data: allKPIs = [] } = useQuery({
    queryKey: ['ci-kpis', currentTenant.id],
    queryFn: async () => {
      // This would need to be implemented in the provider
      // For now, return empty array
      return [];
    },
    enabled: open && !!currentTenant.id,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKPI) {
      toast.error("Please select a KPI");
      return;
    }

    setIsSubmitting(true);

    try {
      await provider.upsertCiImpact({
        projectId: project.id,
        kpiId: selectedKPI,
        baseline: formData.baseline ? parseFloat(formData.baseline) : undefined,
        target: formData.target ? parseFloat(formData.target) : undefined,
        actual: formData.actual ? parseFloat(formData.actual) : undefined,
        notes: formData.notes || undefined,
      });

      onSuccess();

      // Reset form
      setSelectedKPI("");
      setFormData({ baseline: "", target: "", actual: "", notes: "" });
    } catch (error: any) {
      toast.error(`Failed to link KPI: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Link KPI to Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm mb-2 block">KPI</Label>
            <Select value={selectedKPI} onValueChange={setSelectedKPI}>
              <SelectTrigger>
                <SelectValue placeholder="Select a KPI" />
              </SelectTrigger>
              <SelectContent>
                {allKPIs.map((kpi: CIKPI) => (
                  <SelectItem key={kpi.id} value={kpi.id}>
                    {kpi.name} ({kpi.kpiCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-sm mb-2 block">Baseline</Label>
              <Input
                type="number"
                step="any"
                value={formData.baseline}
                onChange={(e) => setFormData({ ...formData, baseline: e.target.value })}
                placeholder="Enter baseline"
              />
            </div>
            <div>
              <Label className="text-sm mb-2 block">Target</Label>
              <Input
                type="number"
                step="any"
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                placeholder="Enter target"
              />
            </div>
            <div>
              <Label className="text-sm mb-2 block">Actual</Label>
              <Input
                type="number"
                step="any"
                value={formData.actual}
                onChange={(e) => setFormData({ ...formData, actual: e.target.value })}
                placeholder="Enter actual"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm mb-2 block">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add notes about this measurement..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Linking..." : "Link KPI"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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