import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { useDataProvider } from "@/hooks/useDataProvider";
import { useSectorContentFilter } from "@/hooks/use-sector-switching";
import { ErrorAwareListPane } from "@/components/layout/ErrorAwareListPane";
import { ErrorAwareWorkPane } from "@/components/layout/ErrorAwareWorkPane";
import { KPICard, StatusBadge, DataTable, TableConfigs, EmptyStates, ListItemVariants, SearchFilterSort } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Lightbulb,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  BarChart3,
  Users,
  Calendar,
  Download,
  Sparkles,
  Plus,
  Search,
  Filter,
  GripVertical,
  X,
  Edit,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { CIProject, CIStage, CreateCIProjectRequest, UpdateCIProjectRequest, CIProjectFilters, RootCauseAnalysis, Countermeasure, CIKPI, CIImpact, CIDocument } from "@/types/optimise";
import { cn } from "@/lib/utils";
import { getSectorSpecificModalContent } from "@/lib/sectorModalUtils";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Legend } from "recharts";

export function CIProjects() {
  const { currentTenant, selectedAsset, setSelectedAsset, setIsPopPaneOpen, setPopPaneContent } = useApp();
  const { provider } = useDataProvider();

  useEffect(() => {
    setIsPopPaneOpen(false);
  }, [setIsPopPaneOpen]);
  // Clear any previous selection from other pages on mount
  useEffect(() => {
    // Clear selection on unmount to ensure we don't carry over state
    return () => {
      setSelectedAsset(null);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const { filterItems, currentSectorName, currentSubsectorName } = useSectorContentFilter();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("priority");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Use selectedAsset from AppContext for CIProject selection
  const selectedProject = selectedAsset as unknown as CIProject | null;

  // Fetch CI stages
  const {
    data: stages = [],
    isLoading: stagesLoading,
    error: stagesError,
  } = useQuery({
    queryKey: ['ci-stages', currentTenant.id],
    queryFn: () => provider.getCiStages(currentTenant.id),
    enabled: !!currentTenant.id,
  });

  // Fetch CI projects
  const {
    data: projects = [],
    isLoading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ['ci-projects', currentTenant.id, ownerFilter, priorityFilter, siteFilter, statusFilter],
    queryFn: () => provider.listCiProjects(currentTenant.id, {
      owner: (ownerFilter && ownerFilter !== "all") ? ownerFilter : undefined,
      priority: (priorityFilter && priorityFilter !== "all") ? priorityFilter as any : undefined,
      siteId: (siteFilter && siteFilter !== "all") ? siteFilter : undefined,
      status: (statusFilter && statusFilter !== "all") ? statusFilter as any : undefined,
    }),
    enabled: !!currentTenant.id,
  });

  // Fetch selected project details
  const {
    data: selectedProjectDetails,
    isLoading: projectDetailsLoading,
  } = useQuery({
    queryKey: ['ci-project', selectedProject?.id],
    queryFn: () => provider.getCiProject(selectedProject!.id),
    enabled: !!selectedProject?.id,
  });

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    // Apply sector-specific filtering using the hook
    const filtered = filterItems(projects);

    // Apply search filtering

    if (!searchQuery) return filtered;
    const query = searchQuery.toLowerCase();
    return filtered.filter(
      (project) =>
        project.title.toLowerCase().includes(query) ||
        project.projectRef.toLowerCase().includes(query) ||
        project.owner.toLowerCase().includes(query) ||
        project.summary?.toLowerCase().includes(query)
    );
  }, [searchQuery, projects, filterItems]);


  // Group projects by stage
  const projectsByStage = useMemo(() => {
    const stageMap: Record<string, CIProject[]> = {};

    // Initialize with all stages
    stages.forEach(stage => {
      stageMap[stage.id] = [];
    });

    // Group projects by stage
    filteredProjects.forEach(project => {
      if (stageMap[project.stageId]) {
        stageMap[project.stageId].push(project);
      }
    });

    return stageMap;
  }, [filteredProjects, stages]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalProjects = filteredProjects.length;
    const completedProjects = filteredProjects.filter(p =>
      p.status === "completed" || stages.find(s => s.id === p.stageId)?.code === "CLOSED"
    ).length;
    const inProgressProjects = filteredProjects.filter(p => p.status === "active").length;
    const highPriorityProjects = filteredProjects.filter(p => p.priority === "high").length;
    return { totalProjects, completedProjects, inProgressProjects, highPriorityProjects };
  }, [filteredProjects, stages]);

  // Move project to different stage mutation
  const moveProjectMutation = useMutation({
    mutationFn: async ({ projectId, stageId }: { projectId: string; stageId: string }) => {
      return provider.moveCiProjectStage(projectId, stageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ci-projects'] });
      queryClient.invalidateQueries({ queryKey: ['ci-project'] });
      toast.success("Project moved successfully");
    },
    onError: (error) => {
      toast.error(`Failed to move project: ${error.message}`);
    },
  });

  const handleMoveProject = (projectId: string, stageId: string) => {
    moveProjectMutation.mutate({ projectId, stageId });
  };

  const openAIAssist = () => {
    setPopPaneContent({ type: null, data: null });
    setIsPopPaneOpen(true);
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    refetchProjects();
    toast.success("CI project created successfully");
  };

  // Prepare list items for ErrorAwareListPane
  const listItems = filteredProjects.map(project => ({
    title: project.title,
    subtitle: project.projectRef,
    status: getStatusForListItem(project.status),
    priority: project.priority,
    metadata: [
      { label: "Stage", value: stages.find(s => s.id === project.stageId)?.name || "Unknown" },
      { label: "Owner", value: project.owner },
    ],
    isSelected: selectedProject?.id === project.id,
    onClick: () => setSelectedAsset(project as any),
    variant: "compact" as const,
  }));

  // Prepare tabs for ErrorAwareWorkPane
  const workPaneTabs = selectedProject ? [
    {
      id: "overview",
      label: "Overview",
      content: <OverviewTab project={selectedProjectDetails || selectedProject} isLoading={projectDetailsLoading} />,
    },
    {
      id: "rca",
      label: "RCA",
      content: <RCATab project={selectedProjectDetails || selectedProject} isLoading={projectDetailsLoading} />,
    },
    {
      id: "countermeasures",
      label: "Countermeasures",
      content: <CountermeasuresTab project={selectedProjectDetails || selectedProject} isLoading={projectDetailsLoading} />,
    },
    {
      id: "kpis",
      label: "KPIs",
      content: <KPIsTab project={selectedProjectDetails || selectedProject} isLoading={projectDetailsLoading} />,
    },
    {
      id: "impact",
      label: "Impact",
      content: <ImpactTab project={selectedProjectDetails || selectedProject} isLoading={projectDetailsLoading} />,
    },
    {
      id: "documents",
      label: "Documents",
      content: <DocumentsTab project={selectedProjectDetails || selectedProject} isLoading={projectDetailsLoading} />,
    },
  ] : [
    {
      id: "overview",
      label: "Overview",
      content: (
        <CIProjectsOverview
          stats={stats}
          projects={filteredProjects}
          setSelectedAsset={setSelectedAsset}
        />
      ),
    },
    {
      id: "lifecycle",
      label: "Lifecycle Workspace",
      content: (
        <div className="h-full overflow-y-auto p-2">
          <KanbanBoard
            stages={stages}
            projectsByStage={projectsByStage}
            selectedProject={selectedProject}
            onSelectProject={(project) => setSelectedAsset(project as any)}
            onMoveProject={handleMoveProject}
          />
        </div>
      ),
    }
  ];

  const isLoading = stagesLoading || projectsLoading;
  const error = stagesError || projectsError;

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ErrorAwareListPane
        title="CI Projects"
        subtitle={currentTenant.name}
        count={filteredProjects.length}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          refetchProjects();
        }}
        contentType="CI projects"
        showFilters={false}
        actions={
          <Button size="sm" className="gap-2 w-full" onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        }
      >
        {filteredProjects.length === 0 && !isLoading && !error ? (
          <div className="p-6 text-center">
            <EmptyStates.NoData
              title="No CI Projects"
              description="Create your first continuous improvement project to get started."
            />
            <Button onClick={openCreateModal} className="gap-2 mt-4">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </div>
        ) : (
          <>
            {/* Search, Filter, and Sort */}
            <div className="px-2 pb-2">
              <SearchFilterSort
                searchPlaceholder="Search CI projects..."
                onSearchChange={setSearchQuery}
                filterContent={
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Owner</Label>
                      <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="All owners" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All owners</SelectItem>
                          {Array.from(new Set(projects.map(p => p.owner))).map(owner => (
                            <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Priority</Label>
                      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="All priorities" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All priorities</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="on-hold">On Hold</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                        <SelectItem value="priority">Priority (High to Low)</SelectItem>
                        <SelectItem value="dueDate">Due Date (Soonest First)</SelectItem>
                        <SelectItem value="created">Created Date (Newest First)</SelectItem>
                        <SelectItem value="name">Name (A-Z)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                }
              />
            </div>

            {/* Kanban Board */}
            {/* Project List */}
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
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
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
        key={selectedProject ? `project-${selectedProject.id}` : 'ci-projects-overview'}
        title={selectedProject ? selectedProject.title : "CI Projects"}
        subtitle={selectedProject ? `${stages.find(s => s.id === selectedProject.stageId)?.name || 'Unknown'} · ${selectedProject.owner}` : `${filteredProjects.length} CI projects`}
        tabs={workPaneTabs}
        defaultTab="overview"
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          refetchProjects();
        }}
        contentType="project details"
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

      <CreateProjectModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleCreateSuccess}
        stages={stages}
      />
    </div>
  );
}

// Helper function to map status to list item status
function getStatusForListItem(status: string): "online" | "offline" | "maintenance" | "warning" {
  switch (status) {
    case "completed":
      return "online";
    case "cancelled":
      return "offline";
    case "on-hold":
      return "warning";
    default:
      return "maintenance";
  }
}

function KanbanBoard({
  stages,
  projectsByStage,
  selectedProject,
  onSelectProject,
  onMoveProject,
}: {
  stages: CIStage[];
  projectsByStage: Record<string, CIProject[]>;
  selectedProject: CIProject | null;
  onSelectProject: (project: CIProject) => void;
  onMoveProject: (projectId: string, stageId: string) => void;
}) {
  const [draggedProject, setDraggedProject] = useState<CIProject | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, project: CIProject) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(null);

    if (draggedProject && draggedProject.stageId !== stageId) {
      onMoveProject(draggedProject.id, stageId);
    }

    setDraggedProject(null);
  };

  const handleDragEnd = () => {
    setDraggedProject(null);
    setDragOverStage(null);
  };

  // Sort stages by sort_order
  const sortedStages = [...stages].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-2">
      {sortedStages.map((stage) => (
        <div
          key={stage.id}
          className={cn(
            "w-80 flex-shrink-0 flex flex-col bg-secondary/10 rounded-xl border border-border/50 transition-colors h-full",
            dragOverStage === stage.id && "bg-primary/5 ring-2 ring-primary/20 border-primary/50"
          )}
          onDragOver={(e) => handleDragOver(e, stage.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, stage.id)}
        >
          <div className="flex items-center justify-between p-3 border-b border-border/50 bg-secondary/20 rounded-t-xl">
            <h4 className="text-sm font-semibold uppercase tracking-wide">
              {stage.name}
            </h4>
            <Badge variant="secondary" className="ml-2">
              {projectsByStage[stage.id]?.length || 0}
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
            {projectsByStage[stage.id]?.map((project) => (
              <CIProjectCard
                key={project.id}
                project={project}
                isSelected={selectedProject?.id === project.id}
                isDragging={draggedProject?.id === project.id}
                onClick={() => onSelectProject(project)}
                onDragStart={(e) => handleDragStart(e, project)}
                onDragEnd={handleDragEnd}
              />
            ))}
            {(!projectsByStage[stage.id] || projectsByStage[stage.id].length === 0) && (
              <div className="h-full min-h-[100px] rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center m-1">
                <p className="text-xs text-muted-foreground">Drop here</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CIProjectCard({
  project,
  isSelected,
  isDragging,
  onClick,
  onDragStart,
  onDragEnd,
}: {
  project: CIProject;
  isSelected: boolean;
  isDragging?: boolean;
  onClick: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg border cursor-move transition-all",
        isSelected ? "bg-primary/5 border-primary" : "bg-card border-border hover:border-primary/50",
        isDragging && "opacity-50 cursor-grabbing"
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h5 className="text-sm font-medium truncate">{project.title}</h5>
            <StatusBadge
              status={getStatusForListItem(project.status)}
              size="sm"
            />
          </div>
          <p className="text-xs text-muted-foreground mb-2">{project.projectRef}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant={project.priority === "high" ? "destructive" : project.priority === "medium" ? "default" : "secondary"} className="text-xs">
              {project.priority}
            </Badge>
            <span>·</span>
            <span>{project.owner}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CIProjectsOverview({
  stats,
  projects,
  setSelectedAsset,
}: {
  stats: { totalProjects: number; completedProjects: number; inProgressProjects: number; highPriorityProjects: number };
  projects: CIProject[];
  setSelectedAsset: (asset: any) => void;
}) {
  const recentProjects = projects
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Prepare data for the chart
  const statusData = [
    { name: 'Active', value: stats.inProgressProjects, fill: 'hsl(var(--primary))' },
    { name: 'Completed', value: stats.completedProjects, fill: 'hsl(var(--success))' },
    { name: 'On Hold', value: projects.filter(p => p.status === 'on-hold').length, fill: 'hsl(var(--warning))' },
    { name: 'Cancelled', value: projects.filter(p => p.status === 'cancelled').length, fill: 'hsl(var(--destructive))' },
  ];

  // Import Recharts components dynamically or assume they are available since we saw them in package.json
  // We need to add imports to the top of the file first, but since I am replacing only this function, I will add the imports in a separate edit or use full module path if possible? 
  // No, I need to add imports at the top properly. 
  // So I will pause this Edit and do a MultiReplace to add imports AND update the component.

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Projects"
          value={stats.totalProjects.toString()}
          subtitle="All CI initiatives"
          icon={Lightbulb}
          variant="primary"
        />
        <KPICard
          title="In Progress"
          value={stats.inProgressProjects.toString()}
          subtitle="Active projects"
          icon={TrendingUp}
          variant="warning"
          trend="up"
          trendValue={`${stats.totalProjects > 0 ? ((stats.inProgressProjects / stats.totalProjects) * 100).toFixed(0) : 0}%`}
        />
        <KPICard
          title="Completed"
          value={stats.completedProjects.toString()}
          subtitle="Verified improvements"
          icon={CheckCircle}
          variant="success"
          trend="up"
          trendValue={`${stats.totalProjects > 0 ? ((stats.completedProjects / stats.totalProjects) * 100).toFixed(0) : 0}%`}
        />
        <KPICard
          title="High Priority"
          value={stats.highPriorityProjects.toString()}
          subtitle="Critical initiatives"
          icon={AlertTriangle}
          variant="destructive"
          trend="neutral"
          trendValue={`${stats.totalProjects > 0 ? ((stats.highPriorityProjects / stats.totalProjects) * 100).toFixed(0) : 0}%`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Section */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
            <CardDescription>Overview of project statuses</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution or another chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest project updates</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={TableConfigs.projects.columns.map(col => {
                if (col.key === 'stage') {
                  return {
                    ...col,
                    render: (stage: any) => ( // fix type any
                      <StatusBadge
                        status={stage === "verified" ? "online" : stage === "backlog" ? "offline" : "maintenance"}
                        size="sm"
                      />
                    ),
                  };
                }
                if (col.key === 'priority') {
                  return {
                    ...col,
                    render: (priority: any) => (
                      <Badge
                        variant={priority === "high" ? "destructive" : priority === "medium" ? "secondary" : "outline"}
                        className="uppercase text-[10px]"
                      >
                        {priority}
                      </Badge>
                    ),
                  };
                }
                return col;
              })}
              data={recentProjects}
              onRowClick={(project) => setSelectedAsset(project as unknown as any)}
              emptyState={
                <EmptyStates.NoProjects
                  size="sm"
                  description="No recent CI projects to display."
                />
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OverviewTab({ project, isLoading }: { project: CIProject; isLoading: boolean }) {
  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Loading project details...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <Lightbulb className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">{project.title}</h3>
              <StatusBadge
                status={getStatusForListItem(project.status)}
              />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Owner: {project.owner}</span>
              <span>·</span>
              <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
              <span>·</span>
              <span className="capitalize">{project.priority} Priority</span>
            </div>
          </div>
        </div>
      </div>

      {/* Project Details */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Project Information
          </h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Project Reference" value={project.projectRef} />
            <InfoRow label="Site" value={project.site?.name || "N/A"} />
            <InfoRow label="Current Stage" value={project.stage?.name || "Unknown"} />
            <InfoRow label="Priority Level" value={project.priority ? project.priority.charAt(0).toUpperCase() + project.priority.slice(1) : 'N/A'} />
            <InfoRow label="Status" value={project.status ? project.status.charAt(0).toUpperCase() + project.status.slice(1) : 'N/A'} />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Timeline
          </h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Start Date" value={project.startDate ? new Date(project.startDate).toLocaleDateString() : "Not set"} />
            <InfoRow label="Due Date" value={project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "Not set"} />
            <InfoRow label="Created" value={new Date(project.createdAt).toLocaleDateString()} />
            <InfoRow label="Last Updated" value={new Date(project.updatedAt).toLocaleDateString()} />
          </div>
        </div>
      </div>

      {/* Project Summary */}
      {project.summary && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Summary
          </h4>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">{project.summary}</p>
          </div>
        </div>
      )}

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Linked Items */}
      {project.links && project.links.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Linked Items
          </h4>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="space-y-2">
              {project.links.map((link) => (
                <div key={link.id} className="text-sm">
                  {link.assetId && <span>Asset: {link.asset?.name || link.assetId}</span>}
                  {link.nodeId && <span>Node: {link.node?.name || link.nodeId}</span>}
                  {link.lineId && <span>Line: {link.line?.name || link.lineId}</span>}
                  {link.alertId && <span>Alert: {link.alertId}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RCATab({ project, isLoading }: { project: CIProject; isLoading: boolean }) {
  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Loading RCA data...</div>;
  }

  const rcaRecords = project.rca || [];

  if (rcaRecords.length === 0) {
    return (
      <EmptyStates.NoData
        title="No Root Cause Analysis"
        description="No RCA has been conducted for this project yet."
      />
    );
  }

  return (
    <div className="space-y-6">
      {rcaRecords.map((rca) => (
        <div key={rca.id} className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold capitalize">{rca.rcaType.replace('-', ' ')}</h3>
            <Badge variant="secondary">{new Date(rca.createdAt).toLocaleDateString()}</Badge>
          </div>
          <div className="space-y-4">
            {rca.rcaType === '5-whys' && (
              <div className="space-y-2">
                {Object.entries(rca.content).map(([key, value]) => (
                  <div key={key} className="pl-4 border-l-2 border-primary/20">
                    <p className="text-sm font-medium">{key}</p>
                    <p className="text-sm text-muted-foreground">{String(value)}</p>
                  </div>
                ))}
              </div>
            )}
            {rca.rcaType === 'fishbone' && (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(rca.content).map(([category, causes]) => (
                  <div key={category} className="bg-secondary/10 rounded-lg p-4">
                    <h4 className="text-sm font-semibold mb-2 capitalize">{category}</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {Array.isArray(causes) ? causes.map((cause, idx) => (
                        <li key={idx}>• {String(cause)}</li>
                      )) : <li>• {String(causes)}</li>}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {rca.rcaType === 'fault-tree' && (
              <pre className="text-sm bg-secondary/10 rounded-lg p-4 overflow-auto">
                {JSON.stringify(rca.content, null, 2)}
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CountermeasuresTab({ project, isLoading }: { project: CIProject; isLoading: boolean }) {
  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Loading countermeasures...</div>;
  }

  const countermeasures = project.countermeasures || [];

  if (countermeasures.length === 0) {
    return (
      <EmptyStates.NoData
        title="No Countermeasures"
        description="No countermeasures have been defined for this project yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      {countermeasures.map((cm) => (
        <div key={cm.id} className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-semibold">{cm.cmRef}</h4>
                <StatusBadge
                  status={cm.status === "completed" || cm.status === "verified" ? "online" : cm.status === "planned" ? "offline" : "maintenance"}
                  size="sm"
                />
              </div>
              <p className="text-sm text-muted-foreground">{cm.summary}</p>
            </div>
            {cm.effectivenessScore !== undefined && cm.effectivenessScore !== null && (
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{cm.effectivenessScore}%</div>
                <div className="text-xs text-muted-foreground">Effectiveness</div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Owner: {cm.owner}</span>
            {cm.dueDate && (
              <>
                <span>·</span>
                <span>Due: {new Date(cm.dueDate).toLocaleDateString()}</span>
              </>
            )}
            <span>·</span>
            <span className="capitalize">{cm.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function KPIsTab({ project, isLoading }: { project: CIProject; isLoading: boolean }) {
  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Loading KPIs...</div>;
  }

  const kpis = project.kpis || [];

  if (kpis.length === 0) {
    return (
      <EmptyStates.NoData
        title="No KPIs"
        description="No KPIs have been linked to this project yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.id}>
            <CardHeader>
              <CardTitle className="text-sm">{kpi.name}</CardTitle>
              <CardDescription className="text-xs">{kpi.kpiCode}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                {kpi.unit && <span>Unit: {kpi.unit}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ImpactTab({ project, isLoading }: { project: CIProject; isLoading: boolean }) {
  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Loading impact data...</div>;
  }

  const impacts = project.impacts || [];

  if (impacts.length === 0) {
    return (
      <EmptyStates.NoData
        title="No Impact Measurements"
        description="No impact measurements have been recorded for this project yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      {impacts.map((impact) => (
        <div key={impact.id} className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <h4 className="text-sm font-semibold">{impact.kpi?.name || "Unknown KPI"}</h4>
            {impact.impactValue !== undefined && impact.impactValue !== null && (
              <div className="text-right">
                <div className={cn(
                  "text-2xl font-bold",
                  impact.impactValue >= 100 ? "text-green-600" : impact.impactValue >= 50 ? "text-yellow-600" : "text-red-600"
                )}>
                  {impact.impactValue.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Impact</div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Baseline</div>
              <div className="text-sm font-medium">{impact.baseline !== undefined ? impact.baseline : "N/A"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Target</div>
              <div className="text-sm font-medium">{impact.target !== undefined ? impact.target : "N/A"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Actual</div>
              <div className="text-sm font-medium">{impact.actual !== undefined ? impact.actual : "N/A"}</div>
            </div>
          </div>
          {impact.notes && (
            <div className="text-sm text-muted-foreground border-t border-border pt-3">
              {impact.notes}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DocumentsTab({ project, isLoading }: { project: CIProject; isLoading: boolean }) {
  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Loading documents...</div>;
  }

  const documents = project.documents || [];

  if (documents.length === 0) {
    return (
      <EmptyStates.NoData
        title="No Documents"
        description="No documents have been attached to this project yet."
      />
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div key={doc.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <div>
              <h4 className="text-sm font-medium">{doc.name}</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-xs">{doc.docType}</Badge>
                <span>·</span>
                <span>{doc.docRef}</span>
              </div>
            </div>
          </div>
          {doc.url && (
            <Button variant="ghost" size="sm" asChild>
              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4" />
              </a>
            </Button>
          )}
        </div>
      ))}
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


function CreateProjectModal({
  open,
  onOpenChange,
  onSuccess,
  stages,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  stages: CIStage[];
}) {
  const { currentTenant } = useApp();
  const { provider } = useDataProvider();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    projectRef: "",
    title: "",
    stageId: "",
    owner: "",
    priority: "medium" as "high" | "medium" | "low",
    summary: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const request: CreateCIProjectRequest = {
        projectRef: formData.projectRef,
        title: formData.title,
        stageId: formData.stageId,
        owner: formData.owner,
        priority: formData.priority,
        summary: formData.summary || undefined,
      };

      await provider.createCiProject(request);
      onSuccess();

      // Reset form
      setFormData({
        projectRef: "",
        title: "",
        stageId: "",
        owner: "",
        priority: "medium",
        summary: "",
      });
    } catch (error: any) {
      toast.error(`Failed to create project: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sort stages by sort_order
  const sortedStages = [...stages].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create CI Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectRef">Project Reference *</Label>
              <Input
                id="projectRef"
                value={formData.projectRef}
                onChange={(e) => setFormData({ ...formData, projectRef: e.target.value })}
                placeholder="e.g., CI-2024-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner">Owner *</Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                placeholder="e.g., John Doe"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Reduce Relay Misoperations"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stageId">Stage *</Label>
              <Select value={formData.stageId} onValueChange={(value) => setFormData({ ...formData, stageId: value })}>
                <SelectTrigger id="stageId">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {sortedStages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Brief description of the project..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
