import { useState, useEffect, useMemo } from 'react';
import { useDataProvider } from '@/hooks/useDataProvider';
import type { GridNode } from '@/types/transmission';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Map as MapIcon, Globe, MapPinOff } from 'lucide-react';
import { ListPane } from '@/components/layout/ListPane';
import { WorkPane } from '@/components/layout/WorkPane';
import { GeoMap } from '@/components/shared/GeoMap';
import { cn } from '@/lib/utils';

export function GeoLocationPage() {
  const { provider } = useDataProvider();
  const [nodes, setNodes] = useState<GridNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GridNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state
  const [nodeTypeFilter, setNodeTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadNodes();
  }, []);

  const loadNodes = async () => {
    try {
      setLoading(true);
      setError(null);
      const tenantId = await provider.getDefaultTransmissionTenantId();
      const data = await provider.getGridNodesByTenant(tenantId);
      setNodes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load grid nodes');
    } finally {
      setLoading(false);
    }
  };

  const filteredNodes = useMemo(() => {
    let filtered = [...nodes];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(node =>
        node.name.toLowerCase().includes(query) ||
        node.region.toLowerCase().includes(query)
      );
    }

    // Filter by node type
    if (nodeTypeFilter !== 'all') {
      filtered = filtered.filter(node => node.nodeType === nodeTypeFilter);
    }

    return filtered;
  }, [nodes, searchQuery, nodeTypeFilter]);

  const mappedNodes = filteredNodes.filter(node => node.geoLat !== null && node.geoLng !== null);
  const unmappedNodes = filteredNodes.filter(node => node.geoLat === null || node.geoLng === null);

  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case 'substation': return 'bg-blue-500';
      case 'junction': return 'bg-yellow-500';
      case 'plant': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const filterConfigs = [
    {
      key: 'nodeType',
      label: 'Node Type',
      options: [
        { label: 'All Types', value: 'all' },
        { label: 'Substation', value: 'substation' },
        { label: 'Junction', value: 'junction' },
        { label: 'Plant', value: 'plant' },
      ],
      value: nodeTypeFilter,
      onChange: setNodeTypeFilter
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
        <Button onClick={loadNodes} className="mt-4">Retry</Button>
      </div>
    );
  }

  const tabs = [
    {
      id: 'map',
      label: 'Map View',
      icon: <MapIcon className="w-4 h-4 mr-2" />,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Geographic Map</h3>
              <p className="text-sm text-muted-foreground">
                {mappedNodes.length} nodes positioned by latitude/longitude coordinates
              </p>
            </div>
          </div>
          <GeoMap
            nodes={mappedNodes}
            onNodeClick={(node) => setSelectedNode(node)}
            selectedNodeId={selectedNode?.id || null}
          />
        </div>
      )
    },
    {
      id: 'unmapped',
      label: 'Unmapped Nodes',
      icon: <MapPinOff className="w-4 h-4 mr-2" />,
      content: (
        <div className="space-y-4">
          <div className="flex flex-col gap-1 mb-4">
            <h3 className="text-lg font-semibold">Nodes without Coordinates</h3>
            <p className="text-sm text-muted-foreground">{unmappedNodes.length} nodes require coordinate assignment</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unmappedNodes.map((node) => (
              <div
                key={node.id}
                className="flex items-center justify-between p-4 border rounded-xl bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 opacity-80", getNodeTypeColor(node.nodeType))}>
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{node.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {node.region} • {node.voltageKv} kV
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0">{node.nodeType}</Badge>
              </div>
            ))}
          </div>
        </div>
      )
    }
  ];

  return (
    <>
      <ListPane
        title="Geographic Location"
        subtitle={`${filteredNodes.length} total nodes`}
        showFilters={true}
        showExpandableFilters={true}
        filters={filterConfigs}
        onSearch={setSearchQuery}
        searchPlaceholder="Search nodes or regions..."
      >
        <div className="space-y-1">
          {filteredNodes.map((node) => (
            <div
              key={node.id}
              onClick={() => setSelectedNode(node)}
              className={cn(
                "p-3 rounded-xl border cursor-pointer transition-all duration-200",
                selectedNode?.id === node.id
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
          {filteredNodes.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No nodes found matching filters</p>
            </div>
          )}
        </div>
      </ListPane>

      <WorkPane
        key={selectedNode?.id || 'geo-overview'}
        title={selectedNode ? selectedNode.name : "Map Overview"}
        subtitle={selectedNode ? `${selectedNode.nodeType} node in ${selectedNode.region}` : "Visualization of grid nodes by geographic location"}
        tabs={tabs}
        defaultTab="map"
      />
    </>
  );
}
