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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Plus, Server, Loader2, Activity, Network, Zap, CheckCircle2, Play, Circle, AlertCircle, Eye, History, ClipboardList, Ban } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDataProvider } from "@/hooks/useDataProvider";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import type { DiscoveryAgent } from "@/types/transmission";

const agentTypeIcons: Record<string, React.ElementType> = {
  ied_gateway: Server,
  scada_bridge: Network,
  rtu_collector: Zap
};

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  inactive: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  error: "bg-red-500/10 text-red-500 border-red-500/20"
};

interface AgentsOverviewProps {
  agents: DiscoveryAgent[];
  onSelectAgent: (agent: DiscoveryAgent) => void;
}

function AgentsOverview({ agents, onSelectAgent }: AgentsOverviewProps) {
  const stats = {
    total: agents.length,
    active: agents.filter(a => a.status === 'active').length,
    inactive: agents.filter(a => a.status === 'inactive').length,
    error: agents.filter(a => a.status === 'error').length
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground font-mono uppercase tracking-wider">Agents Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Agents</span>
              <div className="p-1.5 rounded-md bg-primary/10">
                <Server className="h-3.5 w-3.5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-green-500/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Active</span>
              <div className="p-1.5 rounded-md bg-green-500/10 text-green-500">
                <Activity className="h-3.5 w-3.5 animate-pulse" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{stats.active}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-yellow-500/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Inactive</span>
              <div className="p-1.5 rounded-md bg-yellow-500/10 text-yellow-500">
                <Ban className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">{stats.inactive}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-red-500/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Error</span>
              <div className="p-1.5 rounded-md bg-red-500/10 text-red-500">
                <AlertCircle className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">{stats.error}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground font-mono uppercase tracking-wider">Discovery Agents</h3>
        <Card className="bg-card/50 overflow-hidden border-border/50">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider px-6">Agent Name</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Type</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Scopes</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-right px-6">Last Run</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.length > 0 ? (
                agents.map((agent) => (
                  <TableRow
                    key={agent.id}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => onSelectAgent(agent)}
                  >
                    <TableCell className="font-semibold text-sm py-4 px-6">{agent.name}</TableCell>
                    <TableCell className="text-xs py-4 capitalize text-muted-foreground">{agent.type.replace(/_/g, ' ')}</TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <Circle className={cn("h-2 w-2 fill-current",
                          agent.status === 'active' ? "text-green-500" :
                            agent.status === 'inactive' ? "text-yellow-500" : "text-red-500"
                        )} />
                        <span className="text-xs font-medium capitalize">{agent.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm py-4 font-mono">{agent.assignedScopes.length}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground py-4 px-6">
                      {agent.lastRun ? new Date(agent.lastRun).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground px-6">
                    No discovery agents configured
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

interface AgentQuickViewProps {
  agent: DiscoveryAgent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AgentQuickView({ agent, open, onOpenChange }: AgentQuickViewProps) {
  if (!agent) return null;

  const Icon = agentTypeIcons[agent.type] || Server;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md p-0 flex flex-col h-full bg-background/95 backdrop-blur-md border-l border-border/50">
        <SheetHeader className="p-6 border-b border-border/50">
          <SheetTitle className="text-lg font-bold">Agent Details</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Header section */}
          <div className="flex gap-4 p-4 rounded-xl bg-card border border-border/50 shadow-sm">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 h-fit">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="font-bold text-lg leading-tight">{agent.name}</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider capitalize">{agent.type.replace(/_/g, ' ')}</span>
                <Badge variant="outline" className={cn("px-2 py-0 border-none capitalize", statusColors[agent.status])}>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {agent.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">
                {agent.description || "Active discovery agent monitoring substation endpoints."}
              </p>
            </div>
          </div>

          {/* Protocols */}
          <div className="space-y-4">
            <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Supported Protocols
            </h5>
            <div className="flex flex-wrap gap-2">
              {agent.protocols.map(protocol => (
                <Badge key={protocol} variant="secondary" className="px-2 py-0.5 text-[10px] font-mono border-border/50">
                  {protocol}
                </Badge>
              ))}
            </div>
          </div>

          {/* Configuration Summary */}
          <div className="space-y-4">
            <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <ClipboardList className="w-3 h-3" />
              Agent Configuration
            </h5>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/40 group hover:border-border transition-colors">
                <span className="text-sm font-medium text-muted-foreground">Assigned Scopes:</span>
                <span className="text-lg font-bold px-3 py-1 rounded bg-primary/10 text-primary border border-primary/20 min-w-[3rem] text-center">{agent.assignedScopes.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/40 group hover:border-border transition-colors">
                <span className="text-sm font-medium text-muted-foreground">Last Communication:</span>
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-tighter">
                  {agent.lastRun
                    ? new Date(agent.lastRun).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })
                    : "Never connected"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4 pt-4">
            <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Play className="w-3 h-3" />
              Quick Actions
            </h5>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-14 flex flex-col items-center justify-center gap-1 group text-xs font-semibold hover:border-primary/50">
                {agent.status === 'active' ? (
                  <>
                    <Ban className="h-4 w-4 text-muted-foreground group-hover:text-yellow-500 transition-colors" />
                    Stop Agent
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 text-muted-foreground group-hover:text-green-500 transition-colors" />
                    Start Agent
                  </>
                )}
              </Button>
              <Button variant="outline" className="h-14 flex flex-col items-center justify-center gap-1 group text-xs font-semibold hover:border-primary/50">
                <Eye className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                Open View
              </Button>
              <Button variant="outline" className="h-14 flex flex-col items-center justify-center gap-1 group text-xs font-semibold hover:border-primary/50">
                <History className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                Connectivity
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

export function DiscoveryAgentsPage() {
  const { provider } = useDataProvider();
  const [agents, setAgents] = useState<DiscoveryAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<DiscoveryAgent | null>(null);
  const [quickViewAgent, setQuickViewAgent] = useState<DiscoveryAgent | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState("overview");

  // Mock Logs & Stats state
  const [logs, setLogs] = useState<{ timestamp: string, message: string, level: 'info' | 'warn' | 'error' }[]>([]);

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newAgent, setNewAgent] = useState({
    name: "",
    type: "ied_gateway" as "ied_gateway" | "scada_bridge" | "rtu_collector",
    description: "",
    protocols: [] as string[],
    status: "inactive" as "active" | "inactive" | "error"
  });

  // Load tenant ID and discovery agents
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const tid = await provider.getDefaultTransmissionTenantId();
        setTenantId(tid);

        const result = await provider.getDiscoveryAgentsByTenant(tid);
        setAgents(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load discovery agents");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [provider]);

  useEffect(() => {
    if (selectedAgent) {
      generateMockLogs(selectedAgent);
    } else {
      setLogs([]);
    }
  }, [selectedAgent]);

  const generateMockLogs = (agent: DiscoveryAgent) => {
    const mockLogs: { timestamp: string, message: string, level: 'info' | 'warn' | 'error' }[] = [];
    const baseTime = agent.lastRun ? new Date(agent.lastRun) : new Date(agent.createdAt);

    mockLogs.push({
      timestamp: baseTime.toISOString(),
      message: `Agent ${agent.name} initialized. System check: OK.`,
      level: 'info'
    });

    mockLogs.push({
      timestamp: new Date(baseTime.getTime() + 1000).toISOString(),
      message: `Loading protocol plugins: ${agent.protocols.join(', ')}`,
      level: 'info'
    });

    if (agent.status === 'active') {
      mockLogs.push({
        timestamp: new Date(baseTime.getTime() + 5000).toISOString(),
        message: `Heartbeat established with Central Controller.`,
        level: 'info'
      });
      mockLogs.push({
        timestamp: new Date(baseTime.getTime() + 12000).toISOString(),
        message: `Actively monitoring ${agent.assignedScopes.length} network scopes.`,
        level: 'info'
      });
    }

    if (agent.status === 'error') {
      mockLogs.push({
        timestamp: new Date(baseTime.getTime() + 8000).toISOString(),
        message: `Connectivity failure detected on primary interface.`,
        level: 'error'
      });
      mockLogs.push({
        timestamp: new Date(baseTime.getTime() + 9000).toISOString(),
        message: `Retrying connection (1/5)...`,
        level: 'warn'
      });
    }

    setLogs(mockLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  // Filter agents by status, type, and search
  const filteredAgents = agents.filter(agent => {
    const matchesStatus = statusFilter === "All" || agent.status === statusFilter;
    const matchesType = typeFilter === "All" || agent.type === typeFilter;
    const matchesSearch = !searchTerm ||
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agent.description && agent.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesType && matchesSearch;
  });

  // Handle create agent
  const handleCreateAgent = async () => {
    if (!tenantId) return;

    try {
      setCreating(true);
      setCreateError(null);

      const created = await provider.createDiscoveryAgent({
        tenantId,
        name: newAgent.name,
        type: newAgent.type,
        protocols: newAgent.protocols,
        status: newAgent.status,
        assignedScopes: [],
        description: newAgent.description
      });

      setAgents([created, ...agents]);
      setSelectedAgent(created);
      setCreateDialogOpen(false);
      setNewAgent({
        name: "",
        type: "ied_gateway",
        description: "",
        protocols: [],
        status: "inactive"
      });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create discovery agent");
    } finally {
      setCreating(false);
    }
  };

  // Handle protocol toggle
  const toggleProtocol = (protocol: string) => {
    setNewAgent(prev => ({
      ...prev,
      protocols: prev.protocols.includes(protocol)
        ? prev.protocols.filter(p => p !== protocol)
        : [...prev.protocols, protocol]
    }));
  };

  const handleOpenQuickView = (e: React.MouseEvent, agent: DiscoveryAgent) => {
    e.stopPropagation();
    setQuickViewAgent(agent);
    setQuickViewOpen(true);
  };

  if (loading) {
    return <LoadingState isLoading={true} loadingText="Loading discovery agents..." />;
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

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* List Pane */}
      <ListPane
        className="w-96 min-w-96"
        title="Discovery Agents"
        subtitle={`${filteredAgents.length} agent${filteredAgents.length !== 1 ? "s" : ""} found`}
        onSearch={setSearchTerm}
        searchPlaceholder="Search agents by name or protocol..."
        showExpandableFilters={true}
        filters={[
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "All", label: "All Statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "error", label: "Error" },
            ],
          },
          {
            key: "type",
            label: "Agent Type",
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { value: "All", label: "All Types" },
              { value: "ied_gateway", label: "IED Gateway" },
              { value: "scada_bridge", label: "SCADA Bridge" },
              { value: "rtu_collector", label: "RTU Collector" },
            ],
          }
        ]}
        actions={
          <div className="flex items-center justify-between mt-2">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full text-xs h-8">
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  New Agent
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Discovery Agent</DialogTitle>
                  <DialogDescription>
                    Configure a new discovery agent for asset detection
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Agent Name</Label>
                    <Input
                      id="name"
                      value={newAgent.name}
                      onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                      placeholder="e.g., IED Gateway - Substation A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Agent Type</Label>
                    <Select
                      value={newAgent.type}
                      onValueChange={(value: "ied_gateway" | "scada_bridge" | "rtu_collector") =>
                        setNewAgent({ ...newAgent, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ied_gateway">IED Gateway</SelectItem>
                        <SelectItem value="scada_bridge">SCADA Bridge</SelectItem>
                        <SelectItem value="rtu_collector">RTU Collector</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Protocols</Label>
                    <div className="flex flex-wrap gap-2">
                      {["IEC61850", "DNP3", "OPC-UA", "Modbus-TCP"].map(protocol => (
                        <Button
                          key={protocol}
                          type="button"
                          size="sm"
                          variant={newAgent.protocols.includes(protocol) ? "default" : "outline"}
                          onClick={() => toggleProtocol(protocol)}
                          className="h-7 text-[10px]"
                        >
                          {protocol}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Initial Status</Label>
                    <Select
                      value={newAgent.status}
                      onValueChange={(value: "active" | "inactive" | "error") =>
                        setNewAgent({ ...newAgent, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newAgent.description}
                      onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
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
                  <Button onClick={handleCreateAgent} disabled={creating || !newAgent.name || newAgent.protocols.length === 0}>
                    {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Agent
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      >
        <div className="space-y-1">
          {filteredAgents.length === 0 ? (
            <EmptyState
              icon={Server}
              title="No discovery agents"
              description="No agents match your search or filter criteria"
            />
          ) : (
            filteredAgents.map((agent) => {
              const Icon = agentTypeIcons[agent.type] || Server;
              const isSelected = selectedAgent?.id === agent.id;
              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
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
                          {agent.name}
                        </h3>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                          {agent.type.replace(/_/g, " ")} • {agent.assignedScopes.length} scope(s)
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("ml-2 capitalize py-0 px-1.5 text-[9px] font-bold border-none", statusColors[agent.status])}>
                      {agent.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {agent.protocols.slice(0, 3).map(p => (
                      <span key={p} className="text-[8px] px-1 py-0 rounded bg-muted/50 font-mono text-muted-foreground border border-border/30">{p}</span>
                    ))}
                    {agent.protocols.length > 3 && <span className="text-[8px] text-muted-foreground/60 p-0.5">+{agent.protocols.length - 3}</span>}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground/60 font-mono">
                      {agent.lastRun ? new Date(agent.lastRun).toLocaleDateString() : 'Never connected'}
                    </p>
                    <span className="text-[9px] text-muted-foreground/40 font-mono tracking-tighter">{agent.id.slice(0, 8)}</span>
                  </div>

                  {isSelected && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-primary/10">
                      <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2 flex-1 bg-primary/10 hover:bg-primary/20 text-primary">
                        {agent.status === 'active' ? <><Ban className="h-3 w-3 mr-1" /> Stop Agent</> : <><Play className="h-3 w-3 mr-1" /> Start Agent</>}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={(e) => handleOpenQuickView(e, agent)}
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

      {/* Work Pane */}
      <WorkPane
        title={selectedAgent ? selectedAgent.name : "Discovery Agents Overview"}
        subtitle={selectedAgent ? `System ID: ${selectedAgent.id.slice(0, 13)}...` : `${agents.length} discovery agents configured`}
      >
        {selectedAgent ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col -m-6 h-[calc(100%+3rem)]">
            <div className="px-6 pt-6 border-b border-border/50 bg-muted/20">
              <TabsList className="bg-transparent border-none p-0 h-10 gap-6">
                <TabsTrigger
                  value="overview"
                  className="px-0 pb-3 pt-0 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none text-xs font-bold uppercase tracking-wider"
                >
                  Agent Overview
                </TabsTrigger>
                <TabsTrigger
                  value="health"
                  className="px-0 pb-3 pt-0 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none text-xs font-bold uppercase tracking-wider"
                >
                  Health & Connection
                </TabsTrigger>
                <TabsTrigger
                  value="logs"
                  className="px-0 pb-3 pt-0 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none text-xs font-bold uppercase tracking-wider"
                >
                  Activity Logs
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <TabsContent value="overview" className="m-0 space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Rich Header Card */}
                  <Card className="md:col-span-2 bg-gradient-to-br from-card to-muted/20 border-border/50 shadow-sm">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="outline" className={cn("px-2 py-0.5 border-none capitalize font-bold text-[10px]", statusColors[selectedAgent.status])}>
                          {selectedAgent.status}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted-foreground">Registered: {new Date(selectedAgent.createdAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                      <CardTitle className="text-xl font-bold flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                          {(() => {
                            const Icon = agentTypeIcons[selectedAgent.type] || Server;
                            return <Icon className="h-5 w-5 text-primary" />;
                          })()}
                        </div>
                        {selectedAgent.name}
                      </CardTitle>
                      <CardDescription className="text-sm mt-2 leading-relaxed italic">
                        {selectedAgent.description || "Active discovery agent monitoring substation endpoints and protocols for automated asset updates."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 border-t border-border/30 mt-4">
                      <div className="grid grid-cols-2 gap-8 py-6">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Agent Type</p>
                          <p className="text-sm font-semibold capitalize">{selectedAgent.type.replace(/_/g, " ")}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Central Controller</p>
                          <p className="text-sm font-semibold">prod-central-v4.dq.internal</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Last Communication</p>
                          <p className="text-sm font-semibold">{selectedAgent.lastRun ? new Date(selectedAgent.lastRun).toLocaleString() : 'Never'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Active Scopes</p>
                          <p className="text-sm font-semibold font-mono">{selectedAgent.assignedScopes.length} managed endpoints</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Configuration Sidebar */}
                  <div className="space-y-4">
                    <Card className="bg-muted/20 border-dashed border-border/50">
                      <CardHeader className="py-3 px-4 border-b border-border/50">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Protocols</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 flex flex-wrap gap-2">
                        {selectedAgent.protocols.map(p => (
                          <Badge key={p} variant="secondary" className="px-2 py-0.5 text-[10px] font-mono bg-background shadow-sm border-border/40">
                            {p}
                          </Badge>
                        ))}
                      </CardContent>
                    </Card>

                    <div className="p-4 rounded-xl border border-primary/10 bg-primary/5">
                      <h5 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Auto-Recovery</h5>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Enabled. Agent will attempt to self-heal on network interruption using backup gateways.
                      </p>
                    </div>

                    <Button variant="outline" className="w-full text-xs font-bold gap-2 text-muted-foreground hover:text-foreground">
                      <History className="h-3.5 w-3.5" /> Force Metadata Sync
                    </Button>
                  </div>
                </div>

                {/* Scope Details Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Scope Configuration</h4>
                    <Button variant="ghost" className="h-7 text-[10px] font-bold text-primary px-2">Edit Scopes</Button>
                  </div>
                  <pre className="text-[11px] p-6 bg-card border border-border/50 rounded-2xl font-mono text-muted-foreground overflow-x-auto shadow-inner bg-black/[0.02] dark:bg-white/[0.02]">
                    {JSON.stringify(selectedAgent.assignedScopes, null, 2)}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="health" className="m-0 space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-card/40">
                    <CardHeader className="p-4 pb-0">
                      <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">System Health</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-lg font-bold text-green-500">99.8%</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 tracking-tight uppercase">Uptime (30 Days)</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/40">
                    <CardHeader className="p-4 pb-0">
                      <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avg. Latency</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-400" />
                        <span className="text-lg font-bold">14.2ms</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 tracking-tight uppercase">Endpoint to Hub</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/40">
                    <CardHeader className="p-4 pb-0">
                      <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Buffer Usage</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">12%</span>
                        <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-[12%]" />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 tracking-tight uppercase">4.2MB / 128MB Cache</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/40">
                    <CardHeader className="p-4 pb-0">
                      <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">CPU Load</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span className="text-lg font-bold">4.8%</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 tracking-tight uppercase">Peak Utilization</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-card/40 border-border/50">
                    <CardHeader className="border-b border-border/50 py-4">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider">Interface Status</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border/30">
                        {[
                          { name: "Primary Interface (eth0)", status: "Active", ip: "10.0.4.122", traffic: "1.2 MB/s" },
                          { name: "Management Interface (mgmt0)", status: "Active", ip: "192.168.1.15", traffic: "45 KB/s" },
                          { name: "Secondary Backup (tun0)", status: "Standby", ip: "172.16.0.4", traffic: "0 KB/s" }
                        ].map((iface, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 px-6 hover:bg-muted/10 transition-colors">
                            <div className="space-y-0.5">
                              <p className="text-sm font-semibold">{iface.name}</p>
                              <p className="text-[10px] font-mono text-muted-foreground uppercase">{iface.ip}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className={cn("text-[9px] px-1.5 font-bold uppercase border-none", iface.status === 'Active' ? "text-green-500 bg-green-500/10" : "text-muted-foreground bg-muted/30")}>
                                {iface.status}
                              </Badge>
                              <p className="text-[10px] font-mono text-muted-foreground mt-1 tracking-tighter">{iface.traffic}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/40 border-border/50">
                    <CardHeader className="border-b border-border/50 py-4">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider">Protocol Efficiency</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        {selectedAgent.protocols.map((p, idx) => (
                          <div key={p} className="space-y-2">
                            <div className="flex justify-between items-end">
                              <span className="text-xs font-bold font-mono text-muted-foreground">{p} Accuracy</span>
                              <span className="text-xs font-bold">{[98, 99.4, 95.2, 100][idx % 4]}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${[98, 99.4, 95.2, 100][idx % 4]}%` }} />
                            </div>
                          </div>
                        ))}
                        <p className="text-[10px] text-muted-foreground italic mt-4">
                          Efficiency measurements are based on discovery payload validation and response parsing success rates over the last 24h.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="logs" className="m-0 h-full flex flex-col">
                <div className="space-y-6 h-full flex flex-col">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2 bg-card/20 h-fit">
                      <CardHeader className="py-3 border-b border-border/50">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Streaming Agent Logs</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[400px] w-full p-4 font-mono text-[11px] leading-relaxed">
                          <div className="space-y-2">
                            {logs.map((log, idx) => (
                              <div key={idx} className="flex gap-4 border-b border-border/5 pb-1 last:border-0 hover:bg-muted/5 transition-colors">
                                <span className="text-muted-foreground/50 whitespace-nowrap text-[9px]">
                                  [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                                </span>
                                <span className={cn(
                                  "font-bold uppercase tracking-tighter w-12 text-[9px]",
                                  log.level === 'error' ? "text-red-500" : log.level === 'warn' ? "text-yellow-500" : "text-blue-400"
                                )}>
                                  {log.level}
                                </span>
                                <span className={cn(
                                  "flex-1",
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
                        <CardHeader className="py-3 border-b border-border/50 px-4">
                          <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                            Recent Scans
                            <History className="h-3.5 w-3.5" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                          {[
                            { time: "12m ago", assets: 4, status: "Success" },
                            { time: "1h ago", assets: 0, status: "No Change" },
                            { time: "4h ago", assets: 12, status: "Success" }
                          ].map((scan, idx) => (
                            <div key={idx} className="flex items-center justify-between group">
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold font-mono">{scan.time}</p>
                                <p className="text-[10px] text-muted-foreground uppercase">{scan.assets} NEW ASSETS FOUND</p>
                              </div>
                              <span className={cn(
                                "text-[9px] font-bold font-mono px-1.5 py-0.5 rounded",
                                scan.status === 'Success' ? "text-green-500 bg-green-500/10" : "text-muted-foreground bg-muted/20"
                              )}>{scan.status}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      <div className="p-4 rounded-xl border border-dashed border-border/50 bg-muted/5">
                        <p className="text-[10px] font-bold text-muted-foreground/60 mb-2 flex items-center gap-2 uppercase tracking-widest">
                          <AlertCircle className="h-3 w-3" /> Scan Persistence
                        </p>
                        <p className="text-xs italic text-muted-foreground/80 leading-relaxed">
                          Scan deltas are stored locally for 48h before being aggregated to the central history log.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <AgentsOverview agents={agents} onSelectAgent={setSelectedAgent} />
        )}
      </WorkPane>

      {/* Quick View Side Pane */}
      <AgentQuickView
        agent={quickViewAgent}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
      />
    </div>
  );
}
