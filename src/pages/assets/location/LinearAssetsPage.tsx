import { useState, useEffect, useMemo } from 'react';
import { useDataProvider } from '@/hooks/useDataProvider';
import type { GridLine, GridNode, LinearAssetIssue } from '@/types/transmission';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle2, Plus, Info, Zap, Activity } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ListPane } from '@/components/layout/ListPane';
import { WorkPane } from '@/components/layout/WorkPane';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

export function LinearAssetsPage() {
  const { provider } = useDataProvider();
  const [lines, setLines] = useState<GridLine[]>([]);
  const [nodes, setNodes] = useState<GridNode[]>([]);
  const [issues, setIssues] = useState<Record<string, LinearAssetIssue[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<GridLine | null>(null);
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [tenantId, setTenantId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  // Create issue form state
  const [issueType, setIssueType] = useState<string>('thermal_overload');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueSeverity, setIssueSeverity] = useState<string>('medium');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const tid = await provider.getDefaultTransmissionTenantId();
      setTenantId(tid);
      const [linesData, nodesData] = await Promise.all([
        provider.getGridLinesByTenant(tid),
        provider.getGridNodesByTenant(tid)
      ]);
      setLines(linesData);
      setNodes(nodesData);

      // Load issues for each line
      const issuesMap: Record<string, LinearAssetIssue[]> = {};
      for (const line of linesData) {
        const result = await provider.getLinearAssetIssues(line.id, { limit: 100 });
        issuesMap[line.id] = result.data;
      }
      setIssues(issuesMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load linear assets');
    } finally {
      setLoading(false);
    }
  };

  const getNodeById = (nodeId: string) => {
    return nodes.find(n => n.id === nodeId);
  };

  const getIssueCount = (lineId: string) => {
    return issues[lineId]?.filter(i => !i.resolvedAt).length || 0;
  };

  const filteredLines = useMemo(() => {
    let filtered = [...lines];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(line =>
        line.name.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(line => line.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'voltage') return b.voltageKv - a.voltageKv;
      if (sortBy === 'length') return b.lengthKm - a.lengthKm;
      return 0;
    });

    return filtered;
  }, [lines, searchQuery, statusFilter, sortBy]);

  // Calculate aggregate stats for overview
  const stats = useMemo(() => {
    const totalLines = lines.length;
    const totalLength = lines.reduce((acc, line) => acc + line.lengthKm, 0);
    const activeFaults = Object.values(issues).flat().filter(i => !i.resolvedAt).length;
    const highestVoltage = lines.length > 0 ? Math.max(...lines.map(l => l.voltageKv)) : 0;

    // Get 5 most recent unresolved issues
    const recentIssues = Object.values(issues)
      .flat()
      .filter(i => !i.resolvedAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return { totalLines, totalLength, activeFaults, highestVoltage, recentIssues };
  }, [lines, issues]);

  const handleCreateIssue = async () => {
    if (!selectedLine || !tenantId) return;

    if (issueDescription.length < 10) {
      toast({
        title: 'Validation Error',
        description: 'Description must be at least 10 characters',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);
      const newIssue = await provider.createLinearAssetIssue({
        tenantId,
        gridLineId: selectedLine.id,
        type: issueType as any,
        description: issueDescription,
        severity: issueSeverity as any
      });

      // Update local state
      setIssues(prev => ({
        ...prev,
        [selectedLine.id]: [...(prev[selectedLine.id] || []), newIssue]
      }));

      toast({
        title: 'Issue Created',
        description: 'Linear asset issue has been created successfully'
      });

      // Reset form
      setIssueDescription('');
      setIssueType('thermal_overload');
      setIssueSeverity('medium');
      setShowCreateIssue(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create issue',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveIssue = async (issueId: string) => {
    if (!selectedLine) return;

    try {
      const resolved = await provider.resolveLinearAssetIssue(issueId);

      // Update local state
      setIssues(prev => ({
        ...prev,
        [selectedLine.id]: prev[selectedLine.id].map(i =>
          i.id === issueId ? resolved : i
        )
      }));

      toast({
        title: 'Issue Resolved',
        description: 'Linear asset issue has been marked as resolved'
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to resolve issue',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active': return 'default';
      case 'maintenance': return 'secondary';
      case 'offline': return 'destructive';
      default: return 'outline';
    }
  };

  const getSeverityBadgeVariant = (severity: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const filterConfigs = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'All Status', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Maintenance', value: 'maintenance' },
        { label: 'Offline', value: 'offline' },
      ],
      value: statusFilter,
      onChange: setStatusFilter
    },
    {
      key: 'sortBy',
      label: 'Sort By',
      options: [
        { label: 'Name', value: 'name' },
        { label: 'Voltage', value: 'voltage' },
        { label: 'Length', value: 'length' },
      ],
      value: sortBy,
      onChange: setSortBy
    }
  ];

  if (loading) {
    return <Skeleton className="h-full w-full" />;
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadData} className="mt-4">Retry</Button>
      </div>
    );
  }

  const tabs = [
    {
      id: 'details',
      label: 'Properties',
      icon: <Info className="w-4 h-4 mr-2" />,
      content: selectedLine ? (
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Transmission Line Properties</CardTitle>
            <CardDescription>Full specifications for grid assets</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">From Node</p>
                <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg border border-border/40">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <p className="font-medium text-sm">{getNodeById(selectedLine.fromNodeId)?.name || 'Unknown'}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">To Node</p>
                <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg border border-border/40">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <p className="font-medium text-sm">{getNodeById(selectedLine.toNodeId)?.name || 'Unknown'}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Voltage Level</p>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500 shrink-0" />
                  <span className="text-lg font-bold">{selectedLine.voltageKv} <small className="text-muted-foreground font-normal">kV</small></span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Length</p>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-lg font-bold">{selectedLine.lengthKm} <small className="text-muted-foreground font-normal">km</small></span>
                </div>
              </div>
              <div className="space-y-1 border-t border-border/40 pt-4 mt-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Operational Status</p>
                <Badge variant={getStatusBadgeVariant(selectedLine.status)} className="mt-1 px-4 py-1">
                  {selectedLine.status.toUpperCase()}
                </Badge>
              </div>
              <div className="space-y-1 border-t border-border/40 pt-4 mt-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Active Issues</p>
                <p className={cn("text-lg font-bold mt-1", getIssueCount(selectedLine.id) > 0 ? "text-destructive" : "text-success")}>
                  {getIssueCount(selectedLine.id)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Select a line to view properties
        </div>
      )
    },
    {
      id: 'issues',
      label: 'Issue Management',
      icon: <AlertCircle className="w-4 h-4 mr-2" />,
      content: selectedLine ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Reported Issues</h3>
              <p className="text-sm text-muted-foreground">Manage and resolve asset faults</p>
            </div>
            <Button onClick={() => setShowCreateIssue(true)} className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-400px)] pr-4">
            <div className="space-y-3 pb-8">
              {issues[selectedLine.id]?.length > 0 ? (
                issues[selectedLine.id].map((issue) => (
                  <div key={issue.id} className="border rounded-xl p-4 bg-card shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-muted capitalize">{issue.type.replace('_', ' ')}</Badge>
                        <Badge variant={getSeverityBadgeVariant(issue.severity)}>
                          {issue.severity.toUpperCase()}
                        </Badge>
                        {issue.resolvedAt && (
                          <Badge variant="outline" className="text-success border-success/30 bg-success/5">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        )}
                      </div>
                      {!issue.resolvedAt && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleResolveIssue(issue.id)}
                          className="h-8 hover:bg-success/10 hover:text-success"
                        >
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed mb-4">{issue.description}</p>
                    <div className="flex items-center justify-between border-t border-border/40 pt-3">
                      <p className="text-[10px] text-muted-foreground italic">
                        Logged: {new Date(issue.createdAt).toLocaleString()}
                      </p>
                      {issue.resolvedAt && (
                        <p className="text-[10px] text-success font-medium">
                          Fixed: {new Date(issue.resolvedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center bg-muted/20 border border-dashed rounded-xl">
                  <AlertCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No issues reported for this line</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Select a line to manage issues
        </div>
      )
    }
  ];


  const overviewTabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Activity className="w-4 h-4 mr-2" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground font-medium mb-1">Total Assets</p>
                <h3 className="text-2xl font-bold">{stats.totalLines}</h3>
                <p className="text-[10px] text-muted-foreground mt-1 italic">Segmented grid lines</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/5 border-blue-500/10">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground font-medium mb-1">Total Length</p>
                <div className="flex items-baseline gap-1">
                  <h3 className="text-2xl font-bold">{stats.totalLength.toFixed(1)}</h3>
                  <span className="text-xs text-muted-foreground font-normal">km</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 italic">Total network span</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/5 border-yellow-500/10">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground font-medium mb-1">Max Voltage</p>
                <div className="flex items-baseline gap-1">
                  <h3 className="text-2xl font-bold">{stats.highestVoltage}</h3>
                  <span className="text-xs text-muted-foreground font-normal">kV</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 italic">Highest capacity line</p>
              </CardContent>
            </Card>
            <Card className={cn("border-2 shadow-sm animate-pulse-slow", stats.activeFaults > 0 ? "bg-destructive/5 border-destructive/20" : "bg-success/5 border-success/20")}>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground font-medium mb-1">Active Faults</p>
                <h3 className={cn("text-2xl font-bold", stats.activeFaults > 0 ? "text-destructive" : "text-success")}>{stats.activeFaults}</h3>
                <p className="text-[10px] text-muted-foreground mt-1 italic">Unresolved issues</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/40 bg-card/50">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Active Technical Issues</CardTitle>
                <CardDescription>Most recent unresolved faults across the network</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentIssues.length > 0 ? (
                    stats.recentIssues.map((issue) => (
                      <div key={issue.id} className="flex items-start justify-between p-3 rounded-xl border border-border/40 bg-background/50">
                        <div className="min-w-0 flex-1 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getSeverityBadgeVariant(issue.severity)} className="text-[9px] h-4 py-0 shrink-0">
                              {issue.severity.toUpperCase()}
                            </Badge>
                            <p className="text-[11px] text-muted-foreground font-medium truncate">
                              Line: {lines.find(l => l.id === issue.gridLineId)?.name || 'Unknown'}
                            </p>
                          </div>
                          <p className="text-xs font-medium line-clamp-1">{issue.description}</p>
                          <p className="text-[10px] text-muted-foreground italic mt-1">Logged: {new Date(issue.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Activity className={cn("w-4 h-4 shrink-0 mt-1", issue.severity === 'critical' ? 'text-destructive' : 'text-muted-foreground')} />
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-muted-foreground italic text-sm">
                      No active faults reported
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Asset Status Breakdown</CardTitle>
                <CardDescription>Distribution of operational states</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-8">
                <div className="w-full space-y-4">
                  {['active', 'maintenance', 'offline'].map((status) => {
                    const count = lines.filter(l => l.status === status).length;
                    const percentage = lines.length > 0 ? (count / lines.length) * 100 : 0;
                    return (
                      <div key={status} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="capitalize">{status}</span>
                          <span className="text-muted-foreground">{count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full transition-all duration-500",
                              status === 'active' ? 'bg-green-500' :
                                status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }
  ];

  return (
    <>
      <ListPane
        title="Linear Assets"
        subtitle={`${filteredLines.length} total lines`}
        showFilters={true}
        showExpandableFilters={true}
        filters={filterConfigs}
        onSearch={setSearchQuery}
        searchPlaceholder="Search lines..."
      >
        <div className="space-y-1 w-full overflow-hidden">
          {filteredLines.map((line) => {
            const fromNode = getNodeById(line.fromNodeId);
            const toNode = getNodeById(line.toNodeId);
            const issueCount = getIssueCount(line.id);
            return (
              <div
                key={line.id}
                onClick={() => setSelectedLine(line)}
                className={cn(
                  "p-3 rounded-xl border cursor-pointer transition-all duration-200 w-full max-w-[286px] overflow-hidden block",
                  selectedLine?.id === line.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-transparent hover:bg-secondary/50 shadow-none border"
                )}
              >
                <div className="flex items-start gap-3 w-full min-w-0">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm", getStatusColor(line.status))}>
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between gap-1 w-full mb-0.5">
                      <p className="text-sm font-semibold truncate flex-1 min-w-0" title={line.name}>
                        {line.name}
                      </p>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0 font-mono">
                        {line.voltageKv}kV
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate w-full" title={`${fromNode?.name || '?'} → ${toNode?.name || '?'}`}>
                      {fromNode?.name || '?'} → {toNode?.name || '?'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 w-full overflow-hidden">
                      <Badge variant="outline" className="text-[9px] h-4 py-0 shrink-0 flex items-center">
                        <span className="truncate max-w-[50px]">{line.lengthKm}km</span>
                      </Badge>
                      {issueCount > 0 && (
                        <Badge variant="destructive" className="text-[9px] h-4 py-0 shrink-0 flex items-center">
                          <span className="truncate">{issueCount} {issueCount === 1 ? 'FAULT' : 'FAULTS'}</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredLines.length === 0 && (
            <div className="py-12 text-center text-muted-foreground italic text-sm">
              No lines found matching filters
            </div>
          )}
        </div>
      </ListPane>

      <WorkPane
        key={selectedLine?.id || 'linear-overview'}
        title={selectedLine ? selectedLine.name : "Linear Assets Overview"}
        subtitle={selectedLine ? "Transmission line specifications and issue tracking" : "Comprehensive view of all grid lines and active fault logs"}
        tabs={selectedLine ? tabs : overviewTabs}
        defaultTab={selectedLine ? "details" : "overview"}
      />

      {/* Create Issue Dialog */}
      <Dialog open={showCreateIssue} onOpenChange={setShowCreateIssue}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle>Report Line Issue</DialogTitle>
            <DialogDescription>
              Submit a fault report for {selectedLine?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="issueType">Type of Fault</Label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger id="issueType" className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thermal_overload">Thermal Overload</SelectItem>
                  <SelectItem value="protection_fault">Protection Fault</SelectItem>
                  <SelectItem value="insulator_damage">Insulator Damage</SelectItem>
                  <SelectItem value="conductor_sag">Conductor Sag</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueDescription">Detailed Description</Label>
              <Textarea
                id="issueDescription"
                placeholder="Please provide specifics about the observed fault..."
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                rows={4}
                className="rounded-xl"
              />
              <p className={cn("text-[10px] italic mt-1", issueDescription.length < 10 ? "text-destructive" : "text-muted-foreground")}>
                Minimum 10 characters required ({issueDescription.length}/10)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueSeverity">Priority Severity</Label>
              <Select value={issueSeverity} onValueChange={setIssueSeverity}>
                <SelectTrigger id="issueSeverity" className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="critical">Critical Fault</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="pt-6 sm:justify-between items-center">
            <Button variant="ghost" onClick={() => setShowCreateIssue(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleCreateIssue} disabled={submitting} className="rounded-xl px-8">
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
