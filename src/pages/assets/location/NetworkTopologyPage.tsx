import { useState, useEffect, useMemo } from 'react';
import { useDataProvider } from '@/hooks/useDataProvider';
import type { GridNode, GridLine } from '@/types/transmission';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Share2, Zap, Activity, MapPin, BarChart3, Network } from 'lucide-react';
import { ListPane } from '@/components/layout/ListPane';
import { WorkPane } from '@/components/layout/WorkPane';
import { NetworkGraph } from '@/components/shared/NetworkGraph';
import { cn } from '@/lib/utils';

export function NetworkTopologyPage() {
  const { provider } = useDataProvider();
  const [nodes, setNodes] = useState<GridNode[]>([]);
  const [lines, setLines] = useState<GridLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const tenantId = await provider.getDefaultTransmissionTenantId();
      const [nodesData, linesData] = await Promise.all([
        provider.getGridNodesByTenant(tenantId),
        provider.getGridLinesByTenant(tenantId)
      ]);
      setNodes(nodesData);
      setLines(linesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load network topology');
    } finally {
      setLoading(false);
    }
  };

  const filteredNodes = useMemo(() => {
    if (!searchQuery) return nodes;
    const query = searchQuery.toLowerCase();
    return nodes.filter(n => n.name.toLowerCase().includes(query) || n.nodeType.toLowerCase().includes(query));
  }, [nodes, searchQuery]);

  const filteredLines = useMemo(() => {
    if (!searchQuery) return lines;
    const query = searchQuery.toLowerCase();
    return lines.filter(l => l.name.toLowerCase().includes(query) || l.status.toLowerCase().includes(query));
  }, [lines, searchQuery]);

  const stats = useMemo(() => {
    const avgVoltage = lines.length > 0
      ? lines.reduce((acc, curr) => acc + curr.voltageKv, 0) / lines.length
      : 0;
    const totalLength = lines.reduce((acc, curr) => acc + curr.lengthKm, 0);
    return { avgVoltage, totalLength };
  }, [lines]);

  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case 'substation': return 'bg-blue-500';
      case 'junction': return 'bg-yellow-500';
      case 'plant': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

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
      id: 'graph',
      label: 'Topology Graph',
      icon: <Network className="w-4 h-4 mr-2" />,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Network Visualization</h3>
              <p className="text-sm text-muted-foreground">
                Interactive topology showing {nodes.length} nodes and {lines.length} connections
              </p>
            </div>
          </div>
          <NetworkGraph
            nodes={nodes}
            lines={lines}
            onNodeClick={(node) => setSelectedNodeId(node.id)}
            onLineClick={(line) => setSelectedLineId(line.id)}
            selectedNodeId={selectedNodeId}
            selectedLineId={selectedLineId}
          />
        </div>
      )
    },
    {
      id: 'stats',
      label: 'Network Stats',
      icon: <BarChart3 className="w-4 h-4 mr-2" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-primary/[0.03] border-primary/10">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider font-semibold">Nodes Capacity</CardDescription>
                <CardTitle className="text-3xl font-bold flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-primary" />
                  {nodes.length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Total connected grid points</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/[0.03] border-blue-500/10">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider font-semibold">Line Extensions</CardDescription>
                <CardTitle className="text-3xl font-bold flex items-center gap-2">
                  <Activity className="w-6 h-6 text-blue-500" />
                  {lines.length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Active transmission paths</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/[0.03] border-yellow-500/10">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider font-semibold">Mean Voltage</CardDescription>
                <CardTitle className="text-3xl font-bold flex items-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-500" />
                  {stats.avgVoltage.toFixed(0)} <small className="text-lg font-normal">kV</small>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">System-wide average level</p>
              </CardContent>
            </Card>
          </div>

          <div className="p-6 border rounded-xl bg-card">
            <h3 className="text-lg font-semibold mb-4">Topology Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Grid Redundancy</span>
                <span className="font-medium">High</span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div className="bg-success h-full w-[85%]" />
              </div>
              <div className="flex items-center justify-between text-sm mt-4">
                <span className="text-muted-foreground">Path Connectivity</span>
                <span className="font-medium">99.2%</span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[99%]" />
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <>
      <ListPane
        title="Network Topology"
        subtitle={`${nodes.length} nodes • ${lines.length} lines`}
        onSearch={setSearchQuery}
        searchPlaceholder="Search grid elements..."
      >
        <Tabs defaultValue="nodes" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="nodes" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Nodes</TabsTrigger>
            <TabsTrigger value="lines" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Lines</TabsTrigger>
          </TabsList>

          <TabsContent value="nodes" className="space-y-1 focus-visible:outline-none">
            {filteredNodes.map((node) => (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={cn(
                  "p-3 rounded-xl border cursor-pointer transition-all duration-200",
                  selectedNodeId === node.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-transparent hover:bg-secondary/50"
                )}
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm", getNodeTypeColor(node.nodeType))}>
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold truncate min-w-0 flex-1">{node.name}</p>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0 font-mono">
                        {node.voltageKv}kV
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {node.region} • {node.nodeType}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="lines" className="space-y-1 focus-visible:outline-none">
            {filteredLines.map((line) => (
              <div
                key={line.id}
                onClick={() => setSelectedLineId(line.id)}
                className={cn(
                  "p-3 rounded-xl border cursor-pointer transition-all duration-200",
                  selectedLineId === line.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-transparent hover:bg-secondary/50"
                )}
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm bg-primary/10">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold truncate min-w-0 flex-1">{line.name}</p>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                        {line.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {line.lengthKm} km • {line.voltageKv} kV
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </ListPane>

      <WorkPane
        key="topology-workspace"
        title="Network Analysis"
        subtitle="Visualization and statistical breakdown of grid connectivity"
        tabs={tabs}
        defaultTab="graph"
      />
    </>
  );
}
