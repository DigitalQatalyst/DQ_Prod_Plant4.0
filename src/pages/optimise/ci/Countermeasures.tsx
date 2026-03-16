import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { useDataProvider } from "@/hooks/useDataProvider";
import { useSectorContentFilter } from "@/hooks/use-sector-switching";
import { ErrorAwareListPane } from "@/components/layout/ErrorAwareListPane";
import { ErrorAwareWorkPane } from "@/components/layout/ErrorAwareWorkPane";
import { KPICard, StatusBadge, EmptyStates, SearchFilterSort } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Target,
  CheckCircle,
  TrendingUp,
  Clock,
  Zap,
  Plus,
  Download,
  Sparkles,
  BarChart3,
  Edit,
  Calendar,
  User,
  FileText,
  Award,
  AlertTriangle,
} from "lucide-react";
import { Countermeasure, CreateCountermeasureRequest, UpdateCountermeasureRequest, CountermeasureFilters } from "@/types/optimise";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";

export function Countermeasures() {
  const { currentTenant, selectedAsset, setSelectedAsset, setIsPopPaneOpen, setPopPaneContent } = useApp();
  const { provider } = useDataProvider();
  const { filterItems } = useSectorContentFilter();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Clear any previous selection from other pages on mount
  useEffect(() => {
    setSelectedAsset(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Use selectedAsset from AppContext for Countermeasure selection
  const selectedCountermeasure = selectedAsset as unknown as Countermeasure | null;

  // Fetch CI projects for dropdown
  const {
    data: projects = [],
  } = useQuery({
    queryKey: ['ci-projects', currentTenant.id],
    queryFn: () => provider.listCiProjects(currentTenant.id, {}),
    enabled: !!currentTenant.id,
  });

  // Fetch countermeasures
  const {
    data: countermeasures = [],
    isLoading: countermeasuresLoading,
    error: countermeasuresError,
    refetch: refetchCountermeasures,
  } = useQuery({
    queryKey: ['ci-countermeasures', currentTenant.id, statusFilter, ownerFilter, projectFilter],
    queryFn: () => provider.listCiCountermeasures(currentTenant.id, {
      status: (statusFilter && statusFilter !== "all") ? statusFilter as any : undefined,
      owner: (ownerFilter && ownerFilter !== "all") ? ownerFilter : undefined,
      projectId: (projectFilter && projectFilter !== "all") ? projectFilter : undefined,
    }),
    enabled: !!currentTenant.id,
  });

  const filteredCountermeasures = useMemo(() => {
    let cms = filterItems(countermeasures);

    // Apply search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      cms = cms.filter(
        (cm) =>
          cm.cmRef.toLowerCase().includes(query) ||
          cm.summary.toLowerCase().includes(query) ||
          cm.owner.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...cms];
    switch (sortBy) {
      case "recent":
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case "dueDate":
        return sorted.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
      case "effectiveness":
        return sorted.sort((a, b) => (b.effectivenessScore || 0) - (a.effectivenessScore || 0));
      case "status":
        return sorted.sort((a, b) => a.status.localeCompare(b.status));
      default:
        return sorted;
    }
  }, [searchQuery, countermeasures, sortBy, filterItems]);


  // Calculate stats
  const stats = useMemo(() => {
    const totalCountermeasures = filteredCountermeasures.length;
    const completedCountermeasures = filteredCountermeasures.filter(cm =>
      cm.status === "completed" || cm.status === "verified"
    ).length;
    const inProgressCountermeasures = filteredCountermeasures.filter(cm => cm.status === "in-progress").length;
    const avgEffectiveness = filteredCountermeasures
      .filter(cm => cm.effectivenessScore !== undefined && cm.effectivenessScore !== null)
      .reduce((sum, cm) => sum + (cm.effectivenessScore || 0), 0) /
      (filteredCountermeasures.filter(cm => cm.effectivenessScore !== undefined && cm.effectivenessScore !== null).length || 1);

    return { totalCountermeasures, completedCountermeasures, inProgressCountermeasures, avgEffectiveness };
  }, [filteredCountermeasures]);

  const openAIAssist = () => {
    setPopPaneContent({ type: null, data: null });
    setIsPopPaneOpen(true);
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const openEditModal = () => {
    setIsEditModalOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    refetchCountermeasures();
    toast.success("Countermeasure created successfully");
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ['ci-countermeasures'] });
    refetchCountermeasures();
    toast.success("Countermeasure updated successfully");
  };

  // Prepare list items for ErrorAwareListPane
  const listItems = filteredCountermeasures.map(cm => ({
    title: cm.cmRef,
    subtitle: cm.summary,
    status: getStatusForListItem(cm.status),
    priority: undefined,
    metadata: [
      { label: "Owner", value: cm.owner },
      { label: "Status", value: cm.status },
      { label: "Due", value: cm.dueDate ? new Date(cm.dueDate).toLocaleDateString() : "Not set" },
      { label: "Effectiveness", value: cm.effectivenessScore !== undefined && cm.effectivenessScore !== null ? `${cm.effectivenessScore}%` : "N/A" },
    ],
    isSelected: selectedCountermeasure?.id === cm.id,
    onClick: () => setSelectedAsset(cm as any),
  }));

  // Prepare tabs for ErrorAwareWorkPane
  const workPaneTabs = selectedCountermeasure ? [
    {
      id: "overview",
      label: "Overview",
      content: <OverviewTab countermeasure={selectedCountermeasure} />,
    },
    {
      id: "effectiveness",
      label: "Effectiveness",
      content: <EffectivenessTab countermeasure={selectedCountermeasure} onUpdate={handleEditSuccess} />,
    },
  ] : [
    {
      id: "overview",
      label: "Countermeasures Overview",
      content: (
        <CountermeasuresOverview
          stats={stats}
          countermeasures={filteredCountermeasures}
          setSelectedAsset={setSelectedAsset}
        />
      ),
    },
  ];

  const isLoading = countermeasuresLoading;
  const error = countermeasuresError;

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ErrorAwareListPane
        title="Countermeasures"
        subtitle={currentTenant.name}
        count={filteredCountermeasures.length}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          refetchCountermeasures();
        }}
        contentType="countermeasures"
        showFilters={false}
        actions={
          <Button size="sm" className="gap-2 w-full" onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            New Countermeasure
          </Button>
        }
      >
        {filteredCountermeasures.length === 0 && !isLoading && !error ? (
          <div className="p-6 text-center">
            <EmptyStates.NoData
              title="No Countermeasures"
              description="Create your first countermeasure to track improvement actions."
            />
            <Button onClick={openCreateModal} className="gap-2 mt-4">
              <Plus className="w-4 h-4" />
              New Countermeasure
            </Button>
          </div>
        ) : (
          <>
            {/* Search, Filter, and Sort */}
            <div className="px-2 pb-2">
              <SearchFilterSort
                searchPlaceholder="Search countermeasures..."
                onSearchChange={setSearchQuery}
                filterContent={
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          <SelectItem value="planned">Planned</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Owner</Label>
                      <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="All owners" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All owners</SelectItem>
                          {Array.from(new Set(countermeasures.map(cm => cm.owner))).map(owner => (
                            <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
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
                        <SelectItem value="dueDate">Due Date (Soonest First)</SelectItem>
                        <SelectItem value="effectiveness">Effectiveness (High to Low)</SelectItem>
                        <SelectItem value="status">Status (A-Z)</SelectItem>
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
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.subtitle}</p>
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
        title={selectedCountermeasure ? selectedCountermeasure.cmRef : "Countermeasures"}
        subtitle={selectedCountermeasure ? `${selectedCountermeasure.owner} · ${selectedCountermeasure.status}` : `${filteredCountermeasures.length} countermeasures`}
        tabs={workPaneTabs}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          refetchCountermeasures();
        }}
        contentType="countermeasure details"
        actions={
          <div className="flex items-center gap-2">
            {selectedCountermeasure && (
              <Button variant="outline" size="sm" className="gap-2" onClick={openEditModal}>
                <Edit className="w-4 h-4" />
                Edit
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

      <CreateCountermeasureModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleCreateSuccess}
        projects={projects}
      />

      {selectedCountermeasure && (
        <EditCountermeasureModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onSuccess={handleEditSuccess}
          countermeasure={selectedCountermeasure}
        />
      )}
    </div>
  );
}

// Helper function to map status to list item status
function getStatusForListItem(status: string): "online" | "offline" | "maintenance" | "warning" {
  switch (status) {
    case "completed":
    case "verified":
      return "online";
    case "planned":
      return "offline";
    case "in-progress":
      return "maintenance";
    default:
      return "warning";
  }
}

function CountermeasuresOverview({
  stats,
  countermeasures,
  setSelectedAsset,
}: {
  stats: { totalCountermeasures: number; completedCountermeasures: number; inProgressCountermeasures: number; avgEffectiveness: number };
  countermeasures: Countermeasure[];
  setSelectedAsset: (asset: any) => void;
}) {
  const recentCountermeasures = countermeasures
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5); // Reduced to 5 to fit better

  // Prepare data for effectiveness distribution
  const effectivenessData = useMemo(() => {
    const bins = [
      { name: 'High (80-100%)', min: 80, count: 0, fill: 'hsl(var(--success))' },
      { name: 'Moderate (50-79%)', min: 50, count: 0, fill: 'hsl(var(--warning))' },
      { name: 'Low (<50%)', min: 0, count: 0, fill: 'hsl(var(--destructive))' },
    ];

    countermeasures.forEach(cm => {
      if (cm.effectivenessScore !== undefined && cm.effectivenessScore !== null) {
        if (cm.effectivenessScore >= 80) bins[0].count++;
        else if (cm.effectivenessScore >= 50) bins[1].count++;
        else bins[2].count++;
      }
    });

    return bins;
  }, [countermeasures]);


  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Countermeasures"
          value={stats.totalCountermeasures.toString()}
          subtitle="All improvement actions"
          icon={Target}
          variant="primary"
        />
        <KPICard
          title="In Progress"
          value={stats.inProgressCountermeasures.toString()}
          subtitle="Active actions"
          icon={TrendingUp}
          variant="warning"
          trend="up"
          trendValue={`${stats.totalCountermeasures > 0 ? ((stats.inProgressCountermeasures / stats.totalCountermeasures) * 100).toFixed(0) : 0}%`}
        />
        <KPICard
          title="Completed"
          value={stats.completedCountermeasures.toString()}
          subtitle="Verified actions"
          icon={CheckCircle}
          variant="success"
          trend="up"
          trendValue={`${stats.totalCountermeasures > 0 ? ((stats.completedCountermeasures / stats.totalCountermeasures) * 100).toFixed(0) : 0}%`}
        />
        <KPICard
          title="Avg Effectiveness"
          value={`${stats.avgEffectiveness.toFixed(0)}%`}
          subtitle="Overall impact"
          icon={Award}
          variant="primary"
          trend={stats.avgEffectiveness >= 70 ? "up" : stats.avgEffectiveness >= 50 ? "neutral" : "down"}
          trendValue={`${stats.avgEffectiveness.toFixed(0)}%`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Section */}
        <div className="border border-border rounded-lg p-6 bg-card">
          <h3 className="text-sm font-semibold mb-4">Effectiveness Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={effectivenessData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32} name="Count">
                  {effectivenessData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Countermeasures */}
        <div className="border border-border rounded-lg p-6 bg-card">
          <h3 className="text-sm font-semibold mb-4">Recent Countermeasures</h3>
          <div className="space-y-4">
            {recentCountermeasures.map((cm) => (
              <div
                key={cm.id}
                onClick={() => setSelectedAsset(cm as unknown as any)}
                className="flex items-center justify-between p-3 rounded-md bg-secondary/10 hover:bg-secondary/20 cursor-pointer transition-colors border border-transparent hover:border-primary/20"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium truncate">{cm.cmRef}</h4>
                    <StatusBadge status={getStatusForListItem(cm.status)} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{cm.summary}</p>
                </div>
                {cm.effectivenessScore !== undefined && cm.effectivenessScore !== null && (
                  <div className="text-right flex-shrink-0">
                    <div className={cn(
                      "text-lg font-bold",
                      cm.effectivenessScore >= 80 ? "text-green-600" :
                        cm.effectivenessScore >= 60 ? "text-yellow-600" :
                          "text-red-600"
                    )}>{cm.effectivenessScore}%</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ countermeasure }: { countermeasure: Countermeasure }) {
  return (
    <div className="space-y-6">
      {/* Countermeasure Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">{countermeasure.cmRef}</h3>
              <StatusBadge status={getStatusForListItem(countermeasure.status)} />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Owner: {countermeasure.owner}</span>
              <span>·</span>
              <span>Created: {new Date(countermeasure.createdAt).toLocaleDateString()}</span>
              <span>·</span>
              <span className="capitalize">{countermeasure.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Countermeasure Details */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Countermeasure Information
          </h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Reference" value={countermeasure.cmRef} />
            <InfoRow label="Owner" value={countermeasure.owner} />
            <InfoRow label="Status" value={countermeasure.status ? countermeasure.status.charAt(0).toUpperCase() + countermeasure.status.slice(1) : 'N/A'} />
            <InfoRow
              label="Project"
              value={countermeasure.project ? `${countermeasure.project.projectRef} · ${countermeasure.project.title}` : "N/A"}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Timeline & Effectiveness
          </h4>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <InfoRow label="Due Date" value={countermeasure.dueDate ? new Date(countermeasure.dueDate).toLocaleDateString() : "Not set"} />
            <InfoRow label="Created" value={new Date(countermeasure.createdAt).toLocaleDateString()} />
            <InfoRow label="Last Updated" value={new Date(countermeasure.updatedAt).toLocaleDateString()} />
            <InfoRow
              label="Effectiveness Score"
              value={countermeasure.effectivenessScore !== undefined && countermeasure.effectivenessScore !== null ? `${countermeasure.effectivenessScore}%` : "Not scored"}
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Summary
        </h4>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">{countermeasure.summary}</p>
        </div>
      </div>

      {/* Effectiveness Score Visual */}
      {countermeasure.effectivenessScore !== undefined && countermeasure.effectivenessScore !== null && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            Effectiveness Score
          </h4>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Current Score</span>
              <span className={cn(
                "text-3xl font-bold",
                countermeasure.effectivenessScore >= 80 ? "text-green-600" :
                  countermeasure.effectivenessScore >= 60 ? "text-yellow-600" :
                    "text-red-600"
              )}>
                {countermeasure.effectivenessScore}%
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3">
              <div
                className={cn(
                  "h-3 rounded-full transition-all",
                  countermeasure.effectivenessScore >= 80 ? "bg-green-600" :
                    countermeasure.effectivenessScore >= 60 ? "bg-yellow-600" :
                      "bg-red-600"
                )}
                style={{ width: `${countermeasure.effectivenessScore}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EffectivenessTab({ countermeasure, onUpdate }: { countermeasure: Countermeasure; onUpdate: () => void }) {
  const { provider } = useDataProvider();
  const [effectivenessScore, setEffectivenessScore] = useState<number>(countermeasure.effectivenessScore ?? 65);
  const [isUpdating, setIsUpdating] = useState(false);

  const isNotScored = countermeasure.effectivenessScore === undefined || countermeasure.effectivenessScore === null;
  const willPromoteStatus = !['completed', 'verified'].includes(countermeasure.status);

  const handleUpdateEffectiveness = async () => {
    setIsUpdating(true);
    try {
      await provider.updateCiCountermeasure(countermeasure.id, {
        effectivenessScore,
        // Provider auto-promotes to 'completed' if needed, but signal it here too
        // so the local cache reflects the change via onUpdate/refetch
      });
      toast.success(
        willPromoteStatus
          ? `Effectiveness score saved. Status updated to Completed.`
          : `Effectiveness score updated successfully.`
      );
      onUpdate();
    } catch (error: any) {
      toast.error(`Failed to update effectiveness: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Score Display */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-1">Effectiveness Score</h3>
            <p className="text-sm text-muted-foreground">Rate the effectiveness of this countermeasure (0-100%)</p>
          </div>
          <div className="text-right">
            <div className={cn(
              "text-4xl font-bold",
              effectivenessScore >= 80 ? "text-green-600" :
                effectivenessScore >= 60 ? "text-yellow-600" :
                  "text-red-600"
            )}>
              {effectivenessScore}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {effectivenessScore >= 80 ? "Highly Effective" :
                effectivenessScore >= 60 ? "Moderately Effective" :
                  effectivenessScore >= 40 ? "Somewhat Effective" :
                    "Low Effectiveness"}
            </div>
          </div>
        </div>

        {/* Info notice about status promotion */}
        {willPromoteStatus && (
          <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <span className="text-amber-700 dark:text-amber-400">
              Saving an effectiveness score will automatically mark this countermeasure as <strong>Completed</strong>.
            </span>
          </div>
        )}

        {/* Slider */}
        <div className="space-y-4">
          <Slider
            value={[effectivenessScore]}
            onValueChange={(value) => setEffectivenessScore(value[0])}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0% - Not Effective</span>
            <span>50% - Moderate</span>
            <span>100% - Highly Effective</span>
          </div>
        </div>

        {/* Update Button */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleUpdateEffectiveness}
            disabled={isUpdating || (!isNotScored && effectivenessScore === countermeasure.effectivenessScore)}
            className="gap-2"
          >
            <Award className="w-4 h-4" />
            {isUpdating ? "Updating..." : "Update Score"}
          </Button>
        </div>
      </div>

      {/* Effectiveness Guidelines */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Effectiveness Guidelines
        </h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-green-600 mt-1.5" />
            <div>
              <div className="text-sm font-medium">80-100%: Highly Effective</div>
              <div className="text-xs text-muted-foreground">Countermeasure fully addressed the root cause and achieved expected results</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-yellow-600 mt-1.5" />
            <div>
              <div className="text-sm font-medium">60-79%: Moderately Effective</div>
              <div className="text-xs text-muted-foreground">Countermeasure partially addressed the issue with some positive impact</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-orange-600 mt-1.5" />
            <div>
              <div className="text-sm font-medium">40-59%: Somewhat Effective</div>
              <div className="text-xs text-muted-foreground">Countermeasure had limited impact, may need refinement</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-red-600 mt-1.5" />
            <div>
              <div className="text-sm font-medium">0-39%: Low Effectiveness</div>
              <div className="text-xs text-muted-foreground">Countermeasure did not achieve expected results, alternative approach needed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Status and Timeline */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Implementation Status
        </h4>
        <div className="space-y-3">
          <InfoRow label="Current Status" value={countermeasure.status ? countermeasure.status.charAt(0).toUpperCase() + countermeasure.status.slice(1) : 'N/A'} />
          <InfoRow label="Owner" value={countermeasure.owner} />
          <InfoRow label="Due Date" value={countermeasure.dueDate ? new Date(countermeasure.dueDate).toLocaleDateString() : "Not set"} />
          <InfoRow label="Last Updated" value={new Date(countermeasure.updatedAt).toLocaleDateString()} />
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

function CreateCountermeasureModal({
  open,
  onOpenChange,
  onSuccess,
  projects,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  projects: any[];
}) {
  const { currentTenant } = useApp();
  const { provider } = useDataProvider();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    cmRef: "",
    projectId: "",
    owner: "",
    dueDate: "",
    summary: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const request: CreateCountermeasureRequest = {
        cmRef: formData.cmRef,
        projectId: formData.projectId,
        owner: formData.owner,
        dueDate: formData.dueDate || undefined,
        summary: formData.summary,
      };

      await provider.createCiCountermeasure(currentTenant.id, request);
      onSuccess();

      // Reset form
      setFormData({
        cmRef: "",
        projectId: "",
        owner: "",
        dueDate: "",
        summary: "",
      });
    } catch (error: any) {
      toast.error(`Failed to create countermeasure: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Countermeasure</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cmRef">Countermeasure Reference *</Label>
              <Input
                id="cmRef"
                value={formData.cmRef}
                onChange={(e) => setFormData({ ...formData, cmRef: e.target.value })}
                placeholder="e.g., CM-2024-001"
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectId">CI Project *</Label>
              <Select value={formData.projectId} onValueChange={(value) => setFormData({ ...formData, projectId: value })}>
                <SelectTrigger id="projectId">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary *</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Describe the countermeasure action..."
              rows={4}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Countermeasure"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditCountermeasureModal({
  open,
  onOpenChange,
  onSuccess,
  countermeasure,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  countermeasure: Countermeasure;
}) {
  const { provider } = useDataProvider();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    owner: countermeasure.owner,
    status: countermeasure.status,
    dueDate: countermeasure.dueDate ? countermeasure.dueDate.split('T')[0] : "",
    summary: countermeasure.summary,
    effectivenessScore: countermeasure.effectivenessScore || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const request: UpdateCountermeasureRequest = {
        owner: formData.owner,
        status: formData.status,
        dueDate: formData.dueDate || undefined,
        summary: formData.summary,
        effectivenessScore: formData.effectivenessScore,
      };

      await provider.updateCiCountermeasure(countermeasure.id, request);
      onSuccess();
    } catch (error: any) {
      toast.error(`Failed to update countermeasure: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Countermeasure: {countermeasure.cmRef}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary *</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Describe the countermeasure action..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="effectivenessScore">Effectiveness Score (0-100)</Label>
            <div className="space-y-3">
              <Slider
                value={[formData.effectivenessScore]}
                onValueChange={(value) => setFormData({ ...formData, effectivenessScore: value[0] })}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">0% - Not Effective</span>
                <span className={cn(
                  "text-2xl font-bold",
                  formData.effectivenessScore >= 80 ? "text-green-600" :
                    formData.effectivenessScore >= 60 ? "text-yellow-600" :
                      "text-red-600"
                )}>
                  {formData.effectivenessScore}%
                </span>
                <span className="text-xs text-muted-foreground">100% - Highly Effective</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Countermeasure"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
