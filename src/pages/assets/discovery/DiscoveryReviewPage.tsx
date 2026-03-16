import { useState, useEffect } from "react";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Plus, CheckCircle, XCircle, GitMerge, Loader2, FileSearch, AlertCircle, Search, BarChart3, Clock, Zap, Target, Activity, ShieldCheck, Database } from "lucide-react";
import { useDataProvider } from "@/hooks/useDataProvider";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import type { CandidateAsset, DiscoveryJob, TransmissionAsset } from "@/types/transmission";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-500 border-green-500/20",
  merged: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20"
};

const confidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return "text-green-500";
  if (confidence >= 0.5) return "text-yellow-500";
  return "text-red-500";
};

const confidenceBg = (confidence: number): string => {
  if (confidence >= 0.8) return "bg-green-500";
  if (confidence >= 0.5) return "bg-yellow-500";
  return "bg-red-500";
};

interface DiscoveryOverviewProps {
  candidates: CandidateAsset[];
  jobs: DiscoveryJob[];
  onSelectJob: (id: string) => void;
}

function DiscoveryOverview({ candidates, jobs, onSelectJob }: DiscoveryOverviewProps) {
  const stats = {
    total: candidates.length,
    pending: candidates.filter(c => c.status === 'pending').length,
    approved: candidates.filter(c => c.status === 'approved' || c.status === 'merged').length,
    rejected: candidates.filter(c => c.status === 'rejected').length,
    avgConfidence: candidates.length > 0
      ? (candidates.reduce((acc, curr) => acc + curr.confidence, 0) / candidates.length) * 100
      : 0
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Scanned</span>
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Database className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-yellow-500/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-600/70">Awaiting Review</span>
            <div className="p-1.5 rounded-md bg-yellow-500/10 text-yellow-500">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-yellow-500">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-green-500/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground">
            <span className="text-[10px] font-black uppercase tracking-widest text-green-600/70">Verified Assets</span>
            <div className="p-1.5 rounded-md bg-green-500/10 text-green-500">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-500">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Avg. Confidence</span>
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Target className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.avgConfidence.toFixed(0)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Recent Discovery Sessions</h3>
        </div>
        <Card className="bg-card/50 overflow-hidden border-border/50 shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6">Session Name</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Found</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Type</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow
                  key={job.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onSelectJob(job.id)}
                >
                  <TableCell className="font-bold text-sm py-4 px-6">{job.name}</TableCell>
                  <TableCell className="text-center py-4">
                    <Badge variant="secondary" className="font-mono text-[10px] py-0 px-2">{job.foundCount}</Badge>
                  </TableCell>
                  <TableCell className="text-[10px] font-bold uppercase tracking-tighter py-4 text-muted-foreground">{job.type}</TableCell>
                  <TableCell className="py-4">
                    <Badge variant="outline" className={cn(
                      "capitalize text-[10px] border-none py-0",
                      job.status === 'completed' ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                    )}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-[10px] font-mono text-muted-foreground/60 py-4 px-6">
                    {job.id.substring(0, 8)}...
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Intelligence Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            {[
              { label: "Hardware Properties", value: 85, color: "bg-blue-500" },
              { label: "Network Configuration", value: 65, color: "bg-purple-500" },
              { label: "Protocol Mapping", value: 45, color: "bg-orange-500" },
              { label: "Security Profile", value: 30, color: "bg-red-500" },
            ].map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-foreground">{item.value}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full transition-all duration-1000", item.color)}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Verification Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span>Verified (Approved/Merged)</span>
                <span>{((stats.approved / (stats.total || 1)) * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${(stats.approved / (stats.total || 1)) * 100}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span>Pending Review</span>
                <span>{((stats.pending / (stats.total || 1)) * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 transition-all" style={{ width: `${(stats.pending / (stats.total || 1)) * 100}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function DiscoveryReviewPage() {
  const { provider } = useDataProvider();
  const [candidates, setCandidates] = useState<CandidateAsset[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateAsset | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [discoveryJobs, setDiscoveryJobs] = useState<DiscoveryJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Action states
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Merge dialog state
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [targetAssetId, setTargetAssetId] = useState<string>("");
  const [availableAssets, setAvailableAssets] = useState<TransmissionAsset[]>([]);

  // Load tenant ID and discovery jobs
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const tid = await provider.getDefaultTransmissionTenantId();
        setTenantId(tid);

        // Load discovery jobs
        const jobsResult = await provider.getTransmissionDiscoveryJobsByTenant(tid, {
          limit: 100,
          offset: 0
        });

        setDiscoveryJobs(jobsResult.data);

        // Select first completed job by default
        const completedJob = jobsResult.data.find(j => j.status === 'completed');
        if (completedJob) {
          setSelectedJobId(completedJob.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load discovery jobs");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [provider]);

  // Load candidate assets when job is selected
  useEffect(() => {
    async function loadCandidates() {
      if (discoveryJobs.length === 0) {
        setCandidates([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        if (selectedJobId) {
          // Load candidates for specific job
          const result = await provider.getTransmissionCandidateAssetsByJob(selectedJobId, {
            status: statusFilter !== "All" ? statusFilter : undefined,
            limit: 100,
            offset: 0
          });
          setCandidates(result.data);
        } else {
          // Load candidates from all jobs
          const allCandidates: CandidateAsset[] = [];
          for (const job of discoveryJobs) {
            const result = await provider.getTransmissionCandidateAssetsByJob(job.id, {
              status: statusFilter !== "All" ? statusFilter : undefined,
              limit: 100,
              offset: 0
            });
            allCandidates.push(...result.data);
          }
          setCandidates(allCandidates);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load candidate assets");
      } finally {
        setLoading(false);
      }
    }

    loadCandidates();
  }, [provider, selectedJobId, statusFilter, discoveryJobs]);

  // Load available assets for merge when merge dialog opens
  useEffect(() => {
    async function loadAssets() {
      if (!mergeDialogOpen || !tenantId) return;

      try {
        const result = await provider.getTransmissionAssetsByTenant(tenantId);
        setAvailableAssets(result);
      } catch (err) {
        console.error("Failed to load assets for merge:", err);
      }
    }

    loadAssets();
  }, [provider, mergeDialogOpen, tenantId]);

  // Handle approve candidate
  const handleApprove = async (candidateId: string) => {
    try {
      setActionInProgress(true);
      setActionError(null);

      const result = await provider.approveCandidateAsset(candidateId);

      // Update candidate in list
      setCandidates(candidates.map(c =>
        c.id === candidateId ? result.candidate : c
      ));

      if (selectedCandidate?.id === candidateId) {
        setSelectedCandidate(result.candidate);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to approve candidate");
    } finally {
      setActionInProgress(false);
    }
  };

  // Handle reject candidate
  const handleReject = async (candidateId: string) => {
    try {
      setActionInProgress(true);
      setActionError(null);

      const result = await provider.rejectCandidateAsset(candidateId);

      // Update candidate in list
      setCandidates(candidates.map(c =>
        c.id === candidateId ? result : c
      ));

      if (selectedCandidate?.id === candidateId) {
        setSelectedCandidate(result);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to reject candidate");
    } finally {
      setActionInProgress(false);
    }
  };

  // Handle merge candidate
  const handleMerge = async () => {
    if (!selectedCandidate || !targetAssetId) return;

    try {
      setActionInProgress(true);
      setActionError(null);

      const result = await provider.mergeCandidateAsset(selectedCandidate.id, targetAssetId);

      // Update candidate in list
      setCandidates(candidates.map(c =>
        c.id === selectedCandidate.id ? result.candidate : c
      ));

      setSelectedCandidate(result.candidate);
      setMergeDialogOpen(false);
      setTargetAssetId("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to merge candidate");
    } finally {
      setActionInProgress(false);
    }
  };

  const filteredCandidates = candidates.filter(c =>
    c.suggestedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.suggestedTypeName && c.suggestedTypeName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading && !selectedJobId) {
    return <LoadingState isLoading={true} loadingText="Loading discovery data..." />;
  }

  if (error && !selectedJobId) {
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

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* List Pane */}
      <ListPane
        className="w-96 min-w-96"
        title="Discovery Review"
        subtitle={`${candidates.length} candidate assets identified`}
        onSearch={setSearchQuery}
        searchPlaceholder="Filter candidates..."
        showExpandableFilters={true}
        filters={[
          {
            key: "job",
            label: "Session",
            value: selectedJobId || "all",
            onChange: (value) => setSelectedJobId(value === "all" ? null : value),
            options: [
              { value: "all", label: "All Sessions" },
              ...discoveryJobs.map(j => ({ value: j.id, label: j.name }))
            ],
          },
          {
            key: "status",
            label: "Review Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "All", label: "All Statuses" },
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "merged", label: "Merged" },
              { value: "rejected", label: "Rejected" },
            ],
          }
        ]}
      >
        {/* Candidate List */}

        {/* Candidate List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Scanning Grid...</p>
          </div>
        ) : (
          <div className="space-y-3 pb-12">
            {filteredCandidates.length === 0 ? (
              <EmptyState
                icon={FileSearch}
                title="No items found"
                description={selectedJobId ? "No candidates match your current search and filters" : "Select a session to start review"}
              />
            ) : (
              filteredCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className={cn(
                    "p-3 rounded-lg border border-border/60 hover:border-primary/30 cursor-pointer transition-all group",
                    selectedCandidate?.id === candidate.id ? "bg-primary/5 border-primary/40 shadow-sm" : "bg-card/40 hover:bg-card/60"
                  )}
                  onClick={() => setSelectedCandidate(candidate)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className={cn(
                        "text-sm font-semibold truncate leading-none transition-colors",
                        selectedCandidate?.id === candidate.id ? "text-primary" : "group-hover:text-primary"
                      )}>
                        {candidate.suggestedName}
                      </h3>
                      <p className="text-[10px] mt-1.5 font-bold text-muted-foreground/60 uppercase tracking-widest">
                        {candidate.suggestedTypeName || "Unknown type"}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn(
                      "py-0 px-2 text-[9px] border-none font-bold uppercase",
                      statusColors[candidate.status]
                    )}>
                      {candidate.status}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">Confidence</span>
                      <span className={cn("text-[10px] font-bold leading-none", confidenceColor(candidate.confidence))}>
                        {(candidate.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full transition-all duration-700", confidenceBg(candidate.confidence))}
                        style={{ width: `${candidate.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </ListPane>

      {/* Work Pane */}
      <WorkPane
        title={selectedCandidate ? selectedCandidate.suggestedName : "Discovery Review"}
        subtitle={selectedCandidate ? undefined : "Review and verify discovered assets from autonomous scans"}
      >
        {selectedCandidate ? (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
            {/* Status and Actions */}
            <div className="flex items-center gap-3 p-4 bg-muted/20 border border-border/40 rounded-2xl flex-wrap">
              <Badge variant="outline" className={cn("py-1 px-3 border-none font-bold uppercase tracking-widest", statusColors[selectedCandidate.status])}>
                {selectedCandidate.status}
              </Badge>
              <div className="flex items-center gap-2 px-3 py-1 bg-background border border-border/50 rounded-full">
                <Target className={cn("h-3.5 w-3.5", confidenceColor(selectedCandidate.confidence))} />
                <span className={cn("text-xs font-black uppercase tracking-widest", confidenceColor(selectedCandidate.confidence))}>
                  {(selectedCandidate.confidence * 100).toFixed(0)}% Review Accuracy
                </span>
              </div>

              {selectedCandidate.status === "pending" && (
                <div className="ml-auto flex gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleReject(selectedCandidate.id)}
                    disabled={actionInProgress}
                    className="font-bold text-[10px] uppercase tracking-widest text-red-500 hover:text-red-600 hover:bg-red-500/10 h-10 px-6 rounded-xl"
                  >
                    {actionInProgress ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Discard Item
                  </Button>

                  {selectedCandidate.matchedExistingAssetId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setMergeDialogOpen(true)}
                      disabled={actionInProgress}
                      className="font-bold text-[10px] uppercase tracking-widest h-10 px-6 border-border/60 rounded-xl"
                    >
                      <GitMerge className="h-4 w-4 mr-2" />
                      Merge Record
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={() => handleApprove(selectedCandidate.id)}
                    disabled={actionInProgress}
                    className="font-bold text-[10px] uppercase tracking-widest h-10 px-8 rounded-xl shadow-lg shadow-primary/20"
                  >
                    {actionInProgress ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Verify & Onboard
                  </Button>
                </div>
              )}

              {selectedCandidate && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedCandidate(null)}
                  className="underline text-[10px] font-black uppercase tracking-widest hover:bg-transparent px-2"
                >
                  Close Record
                </Button>
              )}
            </div>

            {/* Action Error */}
            {actionError && (
              <Card className="border-red-500/20 bg-red-500/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <p className="text-sm text-red-500">{actionError}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Candidate Details */}
            <Card className="bg-card/50 border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/50">
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  Candidate Profile
                </CardTitle>
                <CardDescription className="text-xs">Intelligence analysis of the discovered object</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Suggested Name</Label>
                    <p className="text-base font-bold tracking-tight">{selectedCandidate.suggestedName}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inferred Type</Label>
                    <p className="text-base font-bold tracking-tight">{selectedCandidate.suggestedTypeName || "Unknown"}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Confidence Integrity</Label>
                    <span className={cn("text-sm font-black font-mono", confidenceColor(selectedCandidate.confidence))}>
                      {(selectedCandidate.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden p-0.5 border border-border/50">
                    <div
                      className={cn("h-full rounded-full transition-all duration-1000", confidenceBg(selectedCandidate.confidence))}
                      style={{ width: `${selectedCandidate.confidence * 100}%` }}
                    />
                  </div>
                </div>

                {selectedCandidate.matchedExistingAssetId && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <GitMerge className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70">Potential Registry Match</Label>
                      <p className="text-sm font-bold tracking-tight mt-0.5">{selectedCandidate.matchedExistingAssetId}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">System Hierarchy Mapping</Label>
                  <pre className="text-[11px] p-4 bg-muted/30 rounded-xl overflow-auto font-mono text-muted-foreground border border-border/50">
                    {JSON.stringify(selectedCandidate.suggestedHierarchy, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Raw Data */}
            {selectedCandidate.rawData && Object.keys(selectedCandidate.rawData).length > 0 && (
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">Discovered Raw Data</CardTitle>
                  <CardDescription className="text-xs">Raw payload collected during scanning</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="text-[10px] p-4 bg-muted/40 rounded-xl overflow-auto max-h-96 font-mono border border-border/50">
                    {JSON.stringify(selectedCandidate.rawData, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <DiscoveryOverview
            candidates={candidates}
            jobs={discoveryJobs}
            onSelectJob={setSelectedJobId}
          />
        )}
      </WorkPane>

      {/* Merge Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Candidate Asset</DialogTitle>
            <DialogDescription>
              Select an existing asset to merge this candidate's data into
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="targetAsset">Target Asset</Label>
              <Select value={targetAssetId} onValueChange={setTargetAssetId}>
                <SelectTrigger id="targetAsset">
                  <SelectValue placeholder="Select an asset" />
                </SelectTrigger>
                <SelectContent>
                  {availableAssets.map(asset => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name} ({asset.assetTypeName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCandidate?.matchedExistingAssetId && (
              <div className="text-sm text-muted-foreground">
                <p>Suggested match: {selectedCandidate.matchedExistingAssetId}</p>
              </div>
            )}

            {actionError && (
              <div className="text-sm text-red-500">{actionError}</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMerge} disabled={actionInProgress || !targetAssetId}>
              {actionInProgress && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Merge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
