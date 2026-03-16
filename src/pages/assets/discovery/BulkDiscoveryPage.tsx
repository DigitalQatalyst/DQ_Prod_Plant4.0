import { useState, useEffect } from "react";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Plus, Search, RefreshCw, Loader2, Network, MapPin, GitBranch, CheckCircle2, Play, AlertCircle, Eye, ClipboardList, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDataProvider } from "@/hooks/useDataProvider";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import type { DiscoveryJob, CandidateAsset } from "@/types/transmission";

const jobTypeIcons: Record<string, React.ElementType> = {
  network: Network,
  topology: GitBranch,
  geographic: MapPin
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  running: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  failed: "bg-red-500/10 text-red-500 border-red-500/20"
};

interface DiscoveryOverviewProps {
  jobs: DiscoveryJob[];
  onSelectJob: (job: DiscoveryJob) => void;
}

function DiscoveryOverview({ jobs, onSelectJob }: DiscoveryOverviewProps) {
  const stats = {
    total: jobs.length,
    completed: jobs.filter(j => j.status === 'completed').length,
    running: jobs.filter(j => j.status === 'running').length,
    found: jobs.reduce((acc, j) => acc + (j.foundCount || 0), 0)
  };

  const recentJobs = [...jobs].sort((a, b) => {
    const dateA = a.lastRunAt ? new Date(a.lastRunAt).getTime() : 0;
    const dateB = b.lastRunAt ? new Date(b.lastRunAt).getTime() : 0;
    return dateB - dateA;
  }).slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4 font-mono uppercase tracking-wider">Discovery Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Jobs</span>
              <Network className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Running</span>
              <Play className="h-4 w-4 text-blue-500 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">{stats.running}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Assets Found</span>
              <Search className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.found}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground font-mono uppercase tracking-wider">Recent Discovery Jobs</h3>
        <Card className="bg-card/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider">Job Name</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Type</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-right">Found</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-right">Last Run</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentJobs.length > 0 ? (
                recentJobs.map((job) => (
                  <TableRow
                    key={job.id}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => onSelectJob(job)}
                  >
                    <TableCell className="font-medium text-sm py-4">{job.name}</TableCell>
                    <TableCell className="text-sm py-4 capitalize">{job.type.replace('-', ' ')}</TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className={cn("capitalize px-2 py-0", statusColors[job.status])}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm py-4">{job.foundCount || 0}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground py-4">
                      {job.lastRunAt ? new Date(job.lastRunAt).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No discovery jobs configured
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

interface DiscoveryQuickViewProps {
  job: DiscoveryJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry: (jobId: string) => void;
}

function DiscoveryQuickView({ job, open, onOpenChange, onRetry }: DiscoveryQuickViewProps) {
  if (!job) return null;

  const Icon = jobTypeIcons[job.type] || Search;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md p-0 flex flex-col h-full bg-background/95 backdrop-blur-md border-l border-border/50">
        <SheetHeader className="p-6 border-b border-border/50 space-y-2">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold">Discovery Job</SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Header section */}
          <div className="flex gap-4 p-4 rounded-xl bg-card border border-border/50 shadow-sm">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 h-fit">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="font-bold text-lg leading-tight">{job.name}</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider capitalize">{job.type.replace('-', ' ')}</span>
                <Badge variant="outline" className={cn("px-2 py-0 border-none capitalize", statusColors[job.status])}>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {job.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                {job.description || "Discovery scan for network assets and endpoints."}
              </p>
            </div>
          </div>

          {/* Discovery Scope */}
          <div className="space-y-4">
            <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Network className="w-3 h-3" />
              Discovery Scope
            </h5>
            <div className="grid grid-cols-[1fr,auto] gap-x-4 gap-y-2 items-center text-sm font-medium">
              <span className="text-muted-foreground">IP Range:</span>
              <span className="font-mono bg-muted/50 px-2 py-0.5 rounded text-xs select-all">
                {typeof job.scope === 'object' && job.scope !== null && 'ipRange' in job.scope
                  ? (job.scope as any).ipRange
                  : "192.168.1.100 - 192.168.1.120"}
              </span>
            </div>
          </div>

          {/* Results section */}
          <div className="space-y-4">
            <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <ClipboardList className="w-3 h-3" />
              Results
            </h5>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/40 group hover:border-border transition-colors">
                <span className="text-sm font-medium text-muted-foreground">Assets Found:</span>
                <span className="text-lg font-bold px-3 py-1 rounded bg-primary/10 text-primary border border-primary/20 min-w-[3rem] text-center">{job.foundCount || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/40 group hover:border-border transition-colors">
                <span className="text-sm font-medium text-muted-foreground">Last Run:</span>
                <span className="text-xs font-mono text-muted-foreground uppercase">
                  {job.lastRunAt
                    ? new Date(job.lastRunAt).toLocaleString('en-US', {
                      year: 'numeric', month: 'numeric', day: 'numeric',
                      hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })
                    : "Never"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Play className="w-3 h-3" />
              Quick Actions
            </h5>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-14 flex flex-col items-center justify-center gap-1 group text-xs font-semibold hover:border-primary/50" onClick={() => onRetry(job.id)}>
                <RefreshCw className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                Re-run Job
              </Button>
              <Button variant="outline" className="h-14 flex flex-col items-center justify-center gap-1 group text-xs font-semibold hover:border-primary/50">
                <Eye className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                View Results
              </Button>
              <Button variant="outline" className="h-14 flex flex-col items-center justify-center gap-1 group text-xs font-semibold hover:border-primary/50">
                <History className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                Duplicate Job
              </Button>
              <Button variant="outline" className="h-14 flex flex-col items-center justify-center gap-1 group text-xs font-semibold hover:border-primary/50">
                <ClipboardList className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                View Logs
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function BulkDiscoveryPage() {
  const { provider } = useDataProvider();
  const [jobs, setJobs] = useState<DiscoveryJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<DiscoveryJob | null>(null);
  const [quickViewJob, setQuickViewJob] = useState<DiscoveryJob | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newJob, setNewJob] = useState({
    name: "",
    type: "network" as "network" | "topology" | "geographic",
    description: "",
    scopeIpRange: "",
    scopeNodeIds: "",
    scopeGeoLat: "",
    scopeGeoLng: "",
    scopeGeoRadius: ""
  });

  // Tab state
  const [activeTab, setActiveTab] = useState("overview");

  // Results & Logs state
  const [candidates, setCandidates] = useState<CandidateAsset[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [logs, setLogs] = useState<{ timestamp: string, message: string, level: 'info' | 'warn' | 'error' }[]>([]);

  // Load tenant ID and discovery jobs
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const tid = await provider.getDefaultTransmissionTenantId();
        setTenantId(tid);

        const result = await provider.getTransmissionDiscoveryJobsByTenant(tid, {
          limit: 100,
          offset: 0
        });

        setJobs(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load discovery jobs");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [provider]);

  useEffect(() => {
    if (selectedJob) {
      fetchCandidates(selectedJob.id);
      generateMockLogs(selectedJob);
    } else {
      setCandidates([]);
      setLogs([]);
    }
  }, [selectedJob]);

  const fetchCandidates = async (jobId: string) => {
    try {
      setLoadingCandidates(true);
      const result = await provider.getTransmissionCandidateAssetsByJob(jobId);
      setCandidates(result.data);
    } catch (err: any) {
      console.error("Failed to fetch candidates:", err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const generateMockLogs = (job: DiscoveryJob) => {
    const mockLogs: { timestamp: string, message: string, level: 'info' | 'warn' | 'error' }[] = [];
    const baseTime = job.lastRunAt ? new Date(job.lastRunAt) : new Date(job.createdAt);

    mockLogs.push({
      timestamp: baseTime.toISOString(),
      message: `Initializing ${job.type} discovery job: ${job.name}`,
      level: 'info'
    });

    mockLogs.push({
      timestamp: new Date(baseTime.getTime() + 2000).toISOString(),
      message: `Loading agent configurations for scope: ${JSON.stringify(job.scope)}`,
      level: 'info'
    });

    if (job.status === 'completed' || job.status === 'running') {
      mockLogs.push({
        timestamp: new Date(baseTime.getTime() + 5000).toISOString(),
        message: `Connection established to discovery gateway. Starting scan...`,
        level: 'info'
      });

      if (job.foundCount > 0) {
        mockLogs.push({
          timestamp: new Date(baseTime.getTime() + 15000).toISOString(),
          message: `Identified ${job.foundCount} potential assets in network segment.`,
          level: 'info'
        });
        mockLogs.push({
          timestamp: new Date(baseTime.getTime() + 18000).toISOString(),
          message: `Analyzing device profiles and extracting metadata...`,
          level: 'info'
        });
      }
    }

    if (job.status === 'failed' && job.errors) {
      job.errors.forEach((err, idx) => {
        mockLogs.push({
          timestamp: new Date(baseTime.getTime() + 10000 + (idx * 1000)).toISOString(),
          message: `Discovery error: ${err}`,
          level: 'error'
        });
      });
    }

    if (job.status === 'completed') {
      mockLogs.push({
        timestamp: new Date(baseTime.getTime() + 30000).toISOString(),
        message: `Discovery job completed successfully. Found ${job.foundCount} assets.`,
        level: 'info'
      });
    }

    setLogs(mockLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  // Filter jobs by search and status
  const filteredJobs = jobs.filter(job => {
    const matchesStatus = statusFilter === "All" || job.status === statusFilter;
    const matchesType = typeFilter === "All" || job.type === typeFilter.toLowerCase();
    const matchesSearch = !searchTerm ||
      job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.description && job.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesType && matchesSearch;
  });

  // Handle create job
  // ... (handleCreateJob remains unchanged)
  const handleCreateJob = async () => {
    if (!tenantId) return;

    try {
      setCreating(true);
      setCreateError(null);

      // Build scope based on job type
      let scope: Record<string, unknown> = {};
      if (newJob.type === "network" && newJob.scopeIpRange) {
        scope = { ipRange: newJob.scopeIpRange };
      } else if (newJob.type === "topology" && newJob.scopeNodeIds) {
        scope = { nodeIds: newJob.scopeNodeIds.split(",").map(id => id.trim()) };
      } else if (newJob.type === "geographic" && newJob.scopeGeoLat && newJob.scopeGeoLng && newJob.scopeGeoRadius) {
        scope = {
          geoArea: {
            lat: parseFloat(newJob.scopeGeoLat),
            lng: parseFloat(newJob.scopeGeoLng),
            radiusKm: parseFloat(newJob.scopeGeoRadius)
          }
        };
      }

      const created = await provider.createDiscoveryJob({
        tenantId,
        name: newJob.name,
        type: newJob.type,
        scope,
        status: "pending",
        description: newJob.description
      });

      setJobs([created, ...jobs]);
      setSelectedJob(created);
      setCreateDialogOpen(false);
      setNewJob({
        name: "",
        type: "network",
        description: "",
        scopeIpRange: "",
        scopeNodeIds: "",
        scopeGeoLat: "",
        scopeGeoLng: "",
        scopeGeoRadius: ""
      });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create discovery job");
    } finally {
      setCreating(false);
    }
  };

  // Handle retry job
  const handleRetryJob = async (jobId: string) => {
    try {
      const updated = await provider.retryDiscoveryJob(jobId);
      setJobs(jobs.map(j => j.id === jobId ? updated : j));
      if (selectedJob?.id === jobId) {
        setSelectedJob(updated);
      }
      if (quickViewJob?.id === jobId) {
        setQuickViewJob(updated);
      }
    } catch (err) {
      console.error("Failed to retry job:", err);
    }
  };

  const handleOpenQuickView = (e: React.MouseEvent, job: DiscoveryJob) => {
    e.stopPropagation();
    setQuickViewJob(job);
    setQuickViewOpen(true);
  };

  if (loading) {
    return <LoadingState isLoading={true} loadingText="Loading discovery jobs..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filterConfigs = [
    {
      key: "status",
      label: "Status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: "All", label: "All Statuses" },
        { value: "pending", label: "Pending" },
        { value: "running", label: "Running" },
        { value: "completed", label: "Completed" },
        { value: "failed", label: "Failed" },
      ],
    },
    {
      key: "type",
      label: "Discovery Type",
      value: typeFilter,
      onChange: setTypeFilter,
      options: [
        { value: "All", label: "All Types" },
        { value: "network", label: "Network" },
        { value: "topology", label: "Topology" },
        { value: "geographic", label: "Geographic" },
      ],
    }
  ];

  return (
    <div className="flex flex-1 h-full">
      {/* List Pane */}
      <ListPane
        className="w-96 min-w-96"
        title="Discovery Jobs"
        subtitle={`${filteredJobs.length} job${filteredJobs.length !== 1 ? "s" : ""} found`}
        onSearch={setSearchTerm}
        searchPlaceholder="Search jobs by name or description..."
        showExpandableFilters={true}
        filters={filterConfigs}
        actions={
          <div className="flex items-center justify-between mt-2">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full text-xs h-8">
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  New Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Discovery Job</DialogTitle>
                  <DialogDescription>
                    Configure a new automated discovery job
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Job Name</Label>
                    <Input
                      id="name"
                      value={newJob.name}
                      onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                      placeholder="e.g., Network Scan - Substation B"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Discovery Type</Label>
                    <Select
                      value={newJob.type}
                      onValueChange={(value: "network" | "topology" | "geographic") =>
                        setNewJob({ ...newJob, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="network">Network Scan</SelectItem>
                        <SelectItem value="topology">Topology Discovery</SelectItem>
                        <SelectItem value="geographic">Geographic Survey</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Scope fields based on type */}
                  {newJob.type === "network" && (
                    <div className="space-y-2">
                      <Label htmlFor="ipRange">IP Range (CIDR)</Label>
                      <Input
                        id="ipRange"
                        value={newJob.scopeIpRange}
                        onChange={(e) => setNewJob({ ...newJob, scopeIpRange: e.target.value })}
                        placeholder="e.g., 10.20.30.0/24"
                      />
                    </div>
                  )}

                  {newJob.type === "topology" && (
                    <div className="space-y-2">
                      <Label htmlFor="nodeIds">Node IDs (comma-separated)</Label>
                      <Input
                        id="nodeIds"
                        value={newJob.scopeNodeIds}
                        onChange={(e) => setNewJob({ ...newJob, scopeNodeIds: e.target.value })}
                        placeholder="e.g., node-1, node-2, node-3"
                      />
                    </div>
                  )}

                  {newJob.type === "geographic" && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="geoLat">Latitude</Label>
                        <Input
                          id="geoLat"
                          type="number"
                          step="0.0001"
                          value={newJob.scopeGeoLat}
                          onChange={(e) => setNewJob({ ...newJob, scopeGeoLat: e.target.value })}
                          placeholder="25.1234"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="geoLng">Longitude</Label>
                        <Input
                          id="geoLng"
                          type="number"
                          step="0.0001"
                          value={newJob.scopeGeoLng}
                          onChange={(e) => setNewJob({ ...newJob, scopeGeoLng: e.target.value })}
                          placeholder="55.4567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="geoRadius">Radius (km)</Label>
                        <Input
                          id="geoRadius"
                          type="number"
                          step="0.1"
                          value={newJob.scopeGeoRadius}
                          onChange={(e) => setNewJob({ ...newJob, scopeGeoRadius: e.target.value })}
                          placeholder="10"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newJob.description}
                      onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                      placeholder="Optional description"
                      rows={3}
                    />
                  </div>

                  {createError && (
                    <div className="text-sm text-red-500">{createError}</div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateJob} disabled={creating || !newJob.name}>
                    {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Job
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      >
        {/* Job List */}
        <div className="space-y-1">
          {filteredJobs.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No discovery jobs"
              description="No jobs match your search or filter criteria"
            />
          ) : (
            filteredJobs.map((job) => {
              const Icon = jobTypeIcons[job.type] || Network;
              const isSelected = selectedJob?.id === job.id;
              return (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/60 hover:border-primary/30 bg-card/40 hover:bg-card/60"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 flex-1 overflow-hidden">
                      <div className={cn(
                        "p-1.5 rounded-md border mt-0.5",
                        isSelected ? "bg-background border-primary/20" : "bg-muted/30 border-border/50"
                      )}>
                        <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-primary" : "text-muted-foreground")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={cn(
                          "text-sm font-semibold truncate leading-none mb-1",
                          isSelected ? "text-primary" : "text-foreground"
                        )}>
                          {job.name}
                        </h3>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                          {job.type.replace('-', ' ')} • {job.foundCount} found
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("ml-2 capitalize py-0 px-1.5 text-[9px] font-bold border-none", statusColors[job.status])}>
                      {job.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    {job.lastRunAt ? (
                      <p className="text-[10px] text-muted-foreground/60 font-mono">
                        {new Date(job.lastRunAt).toLocaleDateString()} {new Date(job.lastRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground/60 italic font-mono">Never run</p>
                    )}
                    <span className="text-[9px] text-muted-foreground/40 font-mono tracking-tighter">{job.id.slice(0, 8)}</span>
                  </div>

                  {isSelected && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-primary/10">
                      <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2 flex-1 bg-primary/10 hover:bg-primary/20 text-primary">
                        <Play className="h-3 w-3 mr-1" /> Run Now
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={(e) => handleOpenQuickView(e, job)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedJob ? selectedJob.name : "Bulk Discovery"}
        subtitle={selectedJob ? undefined : `${jobs.length} discovery jobs configured`}
      >
        {selectedJob ? (
          <div className="h-full flex flex-col -mt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b px-6 py-2 bg-muted/20">
                <TabsList className="bg-transparent border-none">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-4 py-2">
                    Job Overview
                  </TabsTrigger>
                  <TabsTrigger value="assets" className="data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-4 py-2">
                    Discovered Assets
                    {candidates.length > 0 && (
                      <Badge variant="secondary" className="ml-2 px-1 py-0 text-[10px] h-4 min-w-4 justify-center">
                        {candidates.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="logs" className="data-[state=active]:bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-4 py-2">
                    Errors/Logs
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-8 text-xs">
                    <History className="h-3.5 w-3.5 mr-2" />
                    Duplicate
                  </Button>
                  <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90">
                    <Play className="h-3.5 w-3.5 mr-2" />
                    Run Job
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-6">
                <TabsContent value="overview" className="m-0 space-y-6">
                  {/* Rich Header Card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2 bg-card/50">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-1">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                              {selectedJob.name}
                              <Badge variant="outline" className={cn("capitalize text-[10px]", statusColors[selectedJob.status])}>
                                {selectedJob.status}
                              </Badge>
                            </h3>
                            <p className="text-sm text-muted-foreground">{selectedJob.description || "No description provided for this discovery job."}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground font-mono uppercase">Job ID</p>
                            <p className="text-xs font-mono">{selectedJob.id}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 pt-4 border-t">
                          <div>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Technical Details</p>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Type:</span>
                                <span className="font-medium capitalize">{selectedJob.type} Scan</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Last Execution:</span>
                                <span className="font-medium">{selectedJob.lastRunAt ? new Date(selectedJob.lastRunAt).toLocaleString() : 'Never'}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Retention:</span>
                                <span className="font-medium text-green-500">Standard (30 days)</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Performance Metrics</p>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                                <p className="text-[10px] text-muted-foreground mb-1">Assets Found</p>
                                <p className="text-xl font-bold">{selectedJob.foundCount}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                                <p className="text-[10px] text-muted-foreground mb-1">Accuracy</p>
                                <p className="text-xl font-bold text-primary">94.2%</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
                          <Network className="h-4 w-4" /> Discovery Agent
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-2">
                        <div className="p-3 rounded-lg bg-background border border-primary/20">
                          <p className="text-xs font-semibold mb-1">EP-Primary-Gateway-01</p>
                          <p className="text-[10px] text-muted-foreground">Status: <span className="text-green-500 font-bold uppercase">Active</span></p>
                          <Badge variant="outline" className="mt-2 text-[8px] h-4 bg-primary/10 border-primary/30">IED Gateway</Badge>
                        </div>
                        <div className="text-xs space-y-1.5 pt-2 border-t border-primary/10">
                          <p className="flex justify-between">
                            <span className="text-muted-foreground text-[10px]">Location:</span>
                            <span className="font-medium">Substation Core B</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-muted-foreground text-[10px]">Version:</span>
                            <span className="font-medium">v2.4.1-stable</span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Scope Card */}
                    <Card className="bg-card/30">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2 tracking-tight">
                          <MapPin className="h-4 w-4 text-primary" /> Discovery Scope
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-4 rounded-lg bg-muted/50 border border-dashed font-mono text-xs">
                            {selectedJob.type === 'network' && (
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Target CIDR:</span>
                                  <span className="text-primary font-bold">{selectedJob.scope.ipRange || '10.0.0.0/24'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Protocols:</span>
                                  <span>IEC61850, DNP3, Modbus</span>
                                </div>
                              </div>
                            )}
                            {selectedJob.type === 'topology' && (
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Seed Nodes:</span>
                                  <span className="text-primary font-bold">{(selectedJob.scope.nodeIds || []).length} Nodes</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-muted-foreground">ID List:</span>
                                  <span className="truncate max-w-[150px]">{(selectedJob.scope.nodeIds || []).join(', ')}</span>
                                </div>
                              </div>
                            )}
                            {selectedJob.type === 'geographic' && (
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Coordinates:</span>
                                  <span className="text-primary font-bold">
                                    {selectedJob.scope.geoArea?.lat.toFixed(4)}, {selectedJob.scope.geoArea?.lng.toFixed(4)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Radius:</span>
                                  <span>{selectedJob.scope.geoArea?.radiusKm} km</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Auto-Onboarding</Label>
                            <div className="flex items-center gap-2 py-1 px-2 rounded bg-green-500/5 border border-green-500/10">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                              <span className="text-xs">Automatic verification enabled (90% confidence threshold)</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Results Summary Card */}
                    <Card className="bg-card/30">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2 tracking-tight">
                          <ClipboardList className="h-4 w-4 text-primary" /> Results Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-end justify-between">
                            <div className="space-y-1">
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none">Status</p>
                              <h4 className="text-2xl font-bold text-green-500 capitalize leading-none">{selectedJob.status}</h4>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-muted-foreground font-mono">Completed at 11:30 AM Today</p>
                            </div>
                          </div>

                          <div className="space-y-2 pt-2">
                            <div className="flex justify-between text-xs pb-1 border-b border-border/50">
                              <span className="text-muted-foreground">Total Scanned:</span>
                              <span className="font-mono">1,248 packets</span>
                            </div>
                            <div className="flex justify-between text-xs pb-1 border-b border-border/50">
                              <span className="text-muted-foreground">Duplicates Filtered:</span>
                              <span className="font-mono">14 devices</span>
                            </div>
                            <div className="flex justify-between text-xs pb-1 border-b border-border/50 font-bold">
                              <span className="text-muted-foreground">Net New Assets:</span>
                              <span className="text-primary">{selectedJob.foundCount}</span>
                            </div>
                          </div>

                          <Button size="sm" variant="outline" className="w-full text-xs font-semibold py-5" onClick={() => setActiveTab("assets")}>
                            View Detailed Findings <Plus className="h-3 w-3 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="assets" className="m-0 h-full flex flex-col">
                  {loadingCandidates ? (
                    <LoadingState isLoading={true} loadingText="Fetching discovered assets..." />
                  ) : candidates.length === 0 ? (
                    <EmptyState
                      icon={Search}
                      title="No assets found"
                      description="No assets were discovered during the last run or candidates are yet to be approved."
                    />
                  ) : (
                    <div className="space-y-4 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold">Candidate Assets ({candidates.length})</h4>
                          <p className="text-[10px] text-muted-foreground italic">Review and approve assets to onboard them into the inventory.</p>
                        </div>
                        <Button size="sm" variant="outline" className="h-8 text-xs font-mono">
                          Export Results (.csv)
                        </Button>
                      </div>

                      <div className="border rounded-xl overflow-hidden bg-card/20 border-border/50 h-full">
                        <Table>
                          <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-border/50">
                              <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10">Asset Name</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10">Suggested Type</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10">IP Address</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10">Confidence</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10">Status</TableHead>
                              <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider h-10">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {candidates.map((candidate) => (
                              <TableRow key={candidate.id} className="hover:bg-muted/20 border-border/40 transition-colors">
                                <TableCell className="py-3 font-medium text-xs font-mono">
                                  {candidate.suggestedName}
                                </TableCell>
                                <TableCell className="py-3">
                                  <Badge variant="outline" className="text-[9px] h-4 bg-muted/40 font-semibold border-none">
                                    {candidate.suggestedTypeName || 'Unknown'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-3 text-xs font-mono text-muted-foreground">
                                  {candidate.rawData?.ipAddress ? String(candidate.rawData.ipAddress) : '10.20.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255)}
                                </TableCell>
                                <TableCell className="py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className={cn(
                                          "h-full rounded-full transition-all",
                                          candidate.confidence >= 0.8 ? "bg-green-500" : candidate.confidence >= 0.5 ? "bg-yellow-500" : "bg-red-500"
                                        )}
                                        style={{ width: `${candidate.confidence * 100}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] font-bold font-mono">{(candidate.confidence * 100).toFixed(0)}%</span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-3">
                                  <Badge variant="outline" className={cn(
                                    "text-[9px] h-4 capitalize border-none font-bold",
                                    candidate.status === 'pending' ? "text-yellow-500 bg-yellow-500/5" :
                                      candidate.status === 'approved' ? "text-green-500 bg-green-500/5" :
                                        "text-muted-foreground bg-muted/20"
                                  )}>
                                    {candidate.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] font-bold text-primary hover:bg-primary/10">Approve</Button>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/5"><AlertCircle className="h-3 w-3" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="logs" className="m-0 h-full flex flex-col">
                  <div className="space-y-6 h-full flex flex-col">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="md:col-span-2 bg-card/20">
                        <CardHeader className="py-3 border-b border-border/50">
                          <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Streaming Discovery Logs</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <ScrollArea className="h-[400px] w-full p-4 font-mono text-[11px] leading-relaxed">
                            <div className="space-y-2">
                              {logs.map((log, idx) => (
                                <div key={idx} className="flex gap-4 border-b border-border/5 pb-1 last:border-0">
                                  <span className="text-muted-foreground/50 whitespace-nowrap">
                                    [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                                  </span>
                                  <span className={cn(
                                    "font-bold uppercase tracking-tighter w-12",
                                    log.level === 'error' ? "text-red-500" : log.level === 'warn' ? "text-yellow-500" : "text-blue-400"
                                  )}>
                                    {log.level}
                                  </span>
                                  <span className={cn(
                                    log.level === 'error' ? "text-red-400 font-medium" : "text-foreground/80"
                                  )}>
                                    {log.message}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>

                      <div className="space-y-4">
                        <Card className="bg-muted/20">
                          <CardHeader className="py-3 border-b border-border/50">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status Feed</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4 space-y-4">
                            <div className="flex items-start gap-3">
                              <div className="p-1 rounded-full bg-green-500/20 mt-0.5">
                                <Plus className="h-3 w-3 text-green-500" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold">Agents Reporting</p>
                                <p className="text-[10px] text-muted-foreground">1/1 agents online and healthy</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 opacity-60">
                              <div className="p-1 rounded-full bg-blue-500/20 mt-0.5">
                                <RefreshCw className="h-3 w-3 text-blue-500" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold">Sync In Progress</p>
                                <p className="text-[10px] text-muted-foreground">Last metadata sync: 4m ago</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <div className="p-4 rounded-xl border border-dashed border-border/50 bg-muted/5">
                          <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-2">
                            <AlertCircle className="h-3 w-3" /> Log Persistence
                          </p>
                          <p className="text-xs italic text-muted-foreground/80 leading-relaxed">
                            Detailed logs are retained for 7 days. Critical errors and auditor events are stored indefinitely.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        ) : (
          <DiscoveryOverview jobs={jobs} onSelectJob={setSelectedJob} />
        )}
      </WorkPane>

      {/* Quick View Side Pane */}
      <DiscoveryQuickView
        job={quickViewJob}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        onRetry={handleRetryJob}
      />
    </div>
  );
}
