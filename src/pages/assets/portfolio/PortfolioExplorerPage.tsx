/**
 * PortfolioExplorerPage Component
 * 
 * Route: /assets/portfolio/explorer
 * 
 * Three view modes: Tree, Network, Map
 * Requirements: 3.6
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  TreePine,
  Network,
  Map as MapIcon,
  Building2,
  Zap,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Search,
  Filter
} from 'lucide-react';
import { ListPane } from '@/components/layout/ListPane';
import { WorkPane } from '@/components/layout/WorkPane';
import { cn } from '@/lib/utils';
import { useDataProvider } from '@/hooks/useDataProvider';
import type {
  TransmissionAsset,
  GridNode,
  GridLine
} from '@/types/transmission';

interface Site {
  id: string;
  name: string;
}

interface AssetType {
  id: string;
  name: string;
  code: string;
  category: string;
}

interface TreeNode {
  id: string;
  name: string;
  type: 'site' | 'assetType' | 'asset';
  children: TreeNode[];
  asset?: TransmissionAsset;
  expanded?: boolean;
}

type ViewMode = 'tree' | 'network' | 'map';

export function PortfolioExplorerPage() {
  const { provider } = useDataProvider();

  // State
  const [tenantId, setTenantId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Persist view mode selection in localStorage
    return (localStorage.getItem('portfolioExplorerViewMode') as ViewMode) || 'tree';
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [assets, setAssets] = useState<TransmissionAsset[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [gridNodes, setGridNodes] = useState<GridNode[]>([]);
  const [gridLines, setGridLines] = useState<GridLine[]>([]);

  // Tree view state
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state
  const [filters, setFilters] = useState({
    assetTypeId: 'all',
    status: 'all',
    criticality: 'all',
    siteId: 'all'
  });

  // Filter assets based on search and filters
  const filteredAssets = React.useMemo(() => {
    return assets.filter(asset => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = asset.name.toLowerCase().includes(query) ||
          asset.assetTypeName?.toLowerCase().includes(query) ||
          asset.id.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Asset type filter
      if (filters.assetTypeId !== 'all' && asset.assetTypeId !== filters.assetTypeId) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all' && asset.status !== filters.status) {
        return false;
      }

      // Criticality filter
      if (filters.criticality !== 'all' && asset.criticality !== filters.criticality) {
        return false;
      }

      // Site filter
      if (filters.siteId !== 'all' && asset.siteId !== filters.siteId) {
        return false;
      }

      return true;
    });
  }, [assets, searchQuery, filters]);

  // Hover states for visualizations (must be at top level)
  const [hoveredNetworkNode, setHoveredNetworkNode] = React.useState<string | null>(null);
  const [hoveredNetworkLine, setHoveredNetworkLine] = React.useState<string | null>(null);
  const [hoveredMapNode, setHoveredMapNode] = React.useState<string | null>(null);

  // Simple circular layout for nodes (must be at top level)
  const nodePositions = React.useMemo(() => {
    const positions = new globalThis.Map<string, { x: number; y: number }>();
    const centerX = 400;
    const centerY = 300;
    const radius = 200;

    gridNodes.forEach((node, index) => {
      const angle = (index / gridNodes.length) * 2 * Math.PI;
      positions.set(node.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      });
    });

    return positions;
  }, [gridNodes]);

  const nodesWithCoords = React.useMemo(() => {
    return gridNodes.filter(node => node.geoLat && node.geoLng);
  }, [gridNodes]);

  // Calculate map bounds and projection (must be at top level)
  const mapBounds = React.useMemo(() => {
    if (nodesWithCoords.length === 0) {
      return { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0, width: 800, height: 500 };
    }

    const lats = nodesWithCoords.map(n => n.geoLat!);
    const lngs = nodesWithCoords.map(n => n.geoLng!);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return { minLat, maxLat, minLng, maxLng, width: 800, height: 500 };
  }, [nodesWithCoords]);



  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get default transmission tenant
      const defaultTenantId = await provider.getDefaultTransmissionTenantId();
      setTenantId(defaultTenantId);

      // Load all data in parallel
      const [
        assetsData,
        sitesData,
        assetTypesData,
        gridNodesData,
        gridLinesData
      ] = await Promise.all([
        provider.getTransmissionAssetsByTenant(defaultTenantId),
        provider.getSitesByTenant(defaultTenantId),
        provider.getAssetTypesByTenant(defaultTenantId),
        provider.getGridNodesByTenant(defaultTenantId),
        provider.getGridLinesByTenant(defaultTenantId)
      ]);

      setAssets(assetsData);
      setSites(sitesData);
      setAssetTypes(assetTypesData);
      setGridNodes(gridNodesData);
      setGridLines(gridLinesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [provider]);

  const buildTreeData = useCallback((assetsToUse: TransmissionAsset[]) => {
    const tree: TreeNode[] = [];

    // Group assets by site, then by asset type
    const assetsBySite = assetsToUse.reduce((acc, asset) => {
      if (!acc[asset.siteId]) {
        acc[asset.siteId] = [];
      }
      acc[asset.siteId].push(asset);
      return acc;
    }, {} as Record<string, TransmissionAsset[]>);

    // Build tree structure: Site → Asset Type → Asset
    sites.forEach(site => {
      const siteAssets = assetsBySite[site.id] || [];

      if (siteAssets.length === 0) return; // Skip sites with no assets

      // Group site assets by type
      const assetsByType = siteAssets.reduce((acc, asset) => {
        if (!acc[asset.assetTypeId]) {
          acc[asset.assetTypeId] = [];
        }
        acc[asset.assetTypeId].push(asset);
        return acc;
      }, {} as Record<string, TransmissionAsset[]>);

      // Build asset type nodes
      const typeNodes: TreeNode[] = [];
      Object.entries(assetsByType).forEach(([typeId, typeAssets]) => {
        const assetType = assetTypes.find(t => t.id === typeId);
        if (!assetType) return;

        // Build asset nodes
        const assetNodes: TreeNode[] = typeAssets.map(asset => ({
          id: asset.id,
          name: asset.name,
          type: 'asset',
          children: [],
          asset
        }));

        // Add parent-child relationships
        const rootAssets = assetNodes.filter(node => !node.asset?.parentAssetId);
        const childAssets = assetNodes.filter(node => node.asset?.parentAssetId);

        // Attach children to parents
        childAssets.forEach(child => {
          const parent = assetNodes.find(node => node.id === child.asset?.parentAssetId);
          if (parent) {
            parent.children.push(child);
          } else {
            // If parent not found, treat as root
            rootAssets.push(child);
          }
        });

        typeNodes.push({
          id: `${site.id}-${typeId}`,
          name: `${assetType.name} (${rootAssets.length})`,
          type: 'assetType',
          children: rootAssets,
          expanded: false
        });
      });

      tree.push({
        id: site.id,
        name: `${site.name} (${siteAssets.length})`,
        type: 'site',
        children: typeNodes,
        expanded: false
      });
    });

    setTreeData(tree);
  }, [sites, assetTypes]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Persist view mode selection
  useEffect(() => {
    localStorage.setItem('portfolioExplorerViewMode', viewMode);
  }, [viewMode]);

  // Build tree data when assets/sites/types/filters change
  useEffect(() => {
    if (filteredAssets.length > 0 && sites.length > 0 && assetTypes.length > 0) {
      buildTreeData(filteredAssets);
    } else if (assets.length > 0 && filteredAssets.length === 0) {
      // If we have assets but filtering resulted in empty, clear the tree
      setTreeData([]);
    }
  }, [filteredAssets, sites, assetTypes, buildTreeData, assets.length]);

  const toggleTreeNode = (nodeId: string, path: number[] = []) => {
    const updateNode = (nodes: TreeNode[], currentPath: number[]): TreeNode[] => {
      return nodes.map((node, index) => {
        const newPath = [...currentPath, index];

        if (node.id === nodeId) {
          return { ...node, expanded: !node.expanded };
        }

        if (node.children.length > 0) {
          return {
            ...node,
            children: updateNode(node.children, newPath)
          };
        }

        return node;
      });
    };

    setTreeData(prev => updateNode(prev, []));
  };

  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = node.expanded;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer rounded-md ${depth > 0 ? `ml-${depth * 4}` : ''
            }`}
          onClick={() => hasChildren && toggleTreeNode(node.id)}
          style={{ marginLeft: `${depth * 16}px` }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <div className="w-4" />
          )}

          {node.type === 'site' && <Building2 className="h-4 w-4 text-blue-600" />}
          {node.type === 'assetType' && <Zap className="h-4 w-4 text-green-600" />}
          {node.type === 'asset' && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              {node.asset && (
                <div className="flex gap-1">
                  <Badge variant={node.asset.status === 'online' ? 'default' : 'destructive'} className="text-xs">
                    {node.asset.status}
                  </Badge>
                  <Badge variant={node.asset.criticality === 'critical' ? 'destructive' : 'outline'} className="text-xs">
                    {node.asset.criticality}
                  </Badge>
                </div>
              )}
            </div>
          )}

          <span className="text-sm font-medium">{node.name}</span>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };


  const renderNetworkView = () => {

    // Get color for node type
    const getNodeColor = (nodeType: string) => {
      switch (nodeType) {
        case 'junction': return 'hsl(var(--primary))';
        case 'substation': return 'hsl(210, 70%, 50%)';
        case 'generator': return 'hsl(142, 70%, 50%)';
        default: return 'hsl(var(--muted-foreground))';
      }
    };

    return (
      <div className="space-y-6">
        {/* Network Topology Visualization */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Network className="h-4 w-4 text-primary" />
              Network Topology Diagram
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-[600px] bg-muted/20 rounded-lg border border-border/50 overflow-hidden">
              <svg width="100%" height="100%" viewBox="0 0 800 600" className="absolute inset-0">
                {/* Grid background */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
                  </pattern>
                </defs>
                <rect width="800" height="600" fill="url(#grid)" />

                {/* Draw connections first (so they appear behind nodes) */}
                {gridLines.map(line => {
                  const fromNode = gridNodes.find(n => n.id === line.fromNodeId);
                  const toNode = gridNodes.find(n => n.id === line.toNodeId);
                  if (!fromNode || !toNode) return null;

                  const fromPos = nodePositions.get(fromNode.id);
                  const toPos = nodePositions.get(toNode.id);
                  if (!fromPos || !toPos) return null;

                  const isHovered = hoveredNetworkLine === line.id;
                  const lineColor = line.status === 'active' ? 'hsl(142, 60%, 50%)' : 'hsl(var(--muted-foreground))';

                  return (
                    <g key={line.id}>
                      <line
                        x1={fromPos.x}
                        y1={fromPos.y}
                        x2={toPos.x}
                        y2={toPos.y}
                        stroke={lineColor}
                        strokeWidth={isHovered ? 3 : 1.5}
                        opacity={isHovered ? 1 : 0.6}
                        className="transition-all cursor-pointer"
                        onMouseEnter={() => setHoveredNetworkLine(line.id)}
                        onMouseLeave={() => setHoveredNetworkLine(null)}
                      />
                      {isHovered && (
                        <text
                          x={(fromPos.x + toPos.x) / 2}
                          y={(fromPos.y + toPos.y) / 2}
                          fontSize="10"
                          fill="hsl(var(--foreground))"
                          textAnchor="middle"
                          className="pointer-events-none"
                        >
                          {line.voltageKv}kV • {line.lengthKm}km
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Draw nodes */}
                {gridNodes.map(node => {
                  const pos = nodePositions.get(node.id);
                  if (!pos) return null;

                  const isHovered = hoveredNetworkNode === node.id;
                  const nodeColor = getNodeColor(node.nodeType);

                  return (
                    <g key={node.id}>
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isHovered ? 10 : 8}
                        fill={nodeColor}
                        stroke="hsl(var(--background))"
                        strokeWidth="2"
                        className="transition-all cursor-pointer"
                        onMouseEnter={() => setHoveredNetworkNode(node.id)}
                        onMouseLeave={() => setHoveredNetworkNode(null)}
                      />
                      {isHovered && (
                        <g className="pointer-events-none">
                          <rect
                            x={pos.x + 15}
                            y={pos.y - 25}
                            width="150"
                            height="50"
                            fill="hsl(var(--popover))"
                            stroke="hsl(var(--border))"
                            strokeWidth="1"
                            rx="4"
                          />
                          <text
                            x={pos.x + 20}
                            y={pos.y - 10}
                            fontSize="11"
                            fontWeight="600"
                            fill="hsl(var(--popover-foreground))"
                          >
                            {node.name}
                          </text>
                          <text
                            x={pos.x + 20}
                            y={pos.y + 5}
                            fontSize="9"
                            fill="hsl(var(--muted-foreground))"
                          >
                            {node.nodeType} • {node.voltageKv}kV
                          </text>
                          <text
                            x={pos.x + 20}
                            y={pos.y + 18}
                            fontSize="9"
                            fill="hsl(var(--muted-foreground))"
                          >
                            {node.region}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-background/90 border border-border rounded-lg p-3 space-y-1 text-[10px]">
                <div className="font-semibold text-xs mb-1">Node Types</div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getNodeColor('junction') }} />
                  <span>Junction</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getNodeColor('substation') }} />
                  <span>Substation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getNodeColor('generator') }} />
                  <span>Generator</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Grid Nodes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {gridNodes.slice(0, 10).map(node => (
                  <div key={node.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium text-sm">{node.name}</div>
                      <div className="text-xs text-muted-foreground">{node.nodeType} • {node.voltageKv}kV</div>
                    </div>
                    <Badge variant="outline">{node.region}</Badge>
                  </div>
                ))}
                {gridNodes.length > 10 && (
                  <div className="text-xs text-muted-foreground text-center">
                    ... and {gridNodes.length - 10} more nodes
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Grid Lines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {gridLines.slice(0, 10).map(line => (
                  <div key={line.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium text-sm">{line.name}</div>
                      <div className="text-xs text-muted-foreground">{line.voltageKv}kV • {line.lengthKm}km</div>
                    </div>
                    <Badge variant={line.status === 'active' ? 'default' : 'secondary'}>
                      {line.status}
                    </Badge>
                  </div>
                ))}
                {gridLines.length > 10 && (
                  <div className="text-xs text-muted-foreground text-center">
                    ... and {gridLines.length - 10} more lines
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderMapView = () => {
    // Convert lat/lng to SVG coordinates
    const projectToSVG = (lat: number, lng: number) => {
      const padding = 50;
      const { minLat, maxLat, minLng, maxLng, width, height } = mapBounds;

      const latRange = maxLat - minLat || 1;
      const lngRange = maxLng - minLng || 1;

      const x = padding + ((lng - minLng) / lngRange) * (width - 2 * padding);
      const y = height - padding - ((lat - minLat) / latRange) * (height - 2 * padding);

      return { x, y };
    };

    return (
      <div className="space-y-6">
        {/* Geographic Map Visualization */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <MapIcon className="h-4 w-4 text-primary" />
              Geographic Asset Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nodesWithCoords.length === 0 ? (
              <div className="h-96 bg-muted/20 rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <MapIcon className="h-16 w-16 mx-auto text-muted-foreground/40" />
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">No Geographic Data</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">No nodes have geographic coordinates</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative h-[500px] bg-muted/20 rounded-lg border border-border/50 overflow-hidden">
                <svg width="100%" height="100%" viewBox="0 0 800 500" className="absolute inset-0">
                  {/* Map background with subtle grid */}
                  <defs>
                    <pattern id="mapgrid" width="50" height="50" patternUnits="userSpaceOnUse">
                      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.2" />
                    </pattern>
                  </defs>
                  <rect width="800" height="500" fill="url(#mapgrid)" />

                  {/* Draw coordinate grid lines */}
                  <g opacity="0.3">
                    {[0, 1, 2, 3, 4].map(i => {
                      const lat = mapBounds.minLat + (mapBounds.maxLat - mapBounds.minLat) * (i / 4);
                      const pos1 = projectToSVG(lat, mapBounds.minLng);
                      const pos2 = projectToSVG(lat, mapBounds.maxLng);
                      return (
                        <g key={`lat-${i}`}>
                          <line
                            x1={pos1.x}
                            y1={pos1.y}
                            x2={pos2.x}
                            y2={pos2.y}
                            stroke="hsl(var(--border))"
                            strokeWidth="1"
                            strokeDasharray="4,4"
                          />
                          <text
                            x="15"
                            y={pos1.y + 4}
                            fontSize="9"
                            fill="hsl(var(--muted-foreground))"
                          >
                            {lat.toFixed(2)}°
                          </text>
                        </g>
                      );
                    })}
                    {[0, 1, 2, 3, 4].map(i => {
                      const lng = mapBounds.minLng + (mapBounds.maxLng - mapBounds.minLng) * (i / 4);
                      const pos1 = projectToSVG(mapBounds.minLat, lng);
                      const pos2 = projectToSVG(mapBounds.maxLat, lng);
                      return (
                        <g key={`lng-${i}`}>
                          <line
                            x1={pos1.x}
                            y1={pos1.y}
                            x2={pos2.x}
                            y2={pos2.y}
                            stroke="hsl(var(--border))"
                            strokeWidth="1"
                            strokeDasharray="4,4"
                          />
                          <text
                            x={pos1.x - 15}
                            y="490"
                            fontSize="9"
                            fill="hsl(var(--muted-foreground))"
                          >
                            {lng.toFixed(2)}°
                          </text>
                        </g>
                      );
                    })}
                  </g>

                  {/* Plot nodes */}
                  {nodesWithCoords.map(node => {
                    const pos = projectToSVG(node.geoLat!, node.geoLng!);
                    const isHovered = hoveredMapNode === node.id;

                    return (
                      <g key={node.id}>
                        {/* Node marker */}
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={isHovered ? 8 : 6}
                          fill="hsl(210, 70%, 50%)"
                          stroke="hsl(var(--background))"
                          strokeWidth="2"
                          className="transition-all cursor-pointer"
                          onMouseEnter={() => setHoveredMapNode(node.id)}
                          onMouseLeave={() => setHoveredMapNode(null)}
                        />
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={isHovered ? 16 : 12}
                          fill="none"
                          stroke="hsl(210, 70%, 50%)"
                          strokeWidth="2"
                          opacity="0.3"
                          className="transition-all"
                        />

                        {/* Tooltip on hover */}
                        {isHovered && (
                          <g className="pointer-events-none">
                            <rect
                              x={pos.x + 15}
                              y={pos.y - 35}
                              width="180"
                              height="70"
                              fill="hsl(var(--popover))"
                              stroke="hsl(var(--border))"
                              strokeWidth="1"
                              rx="4"
                            />
                            <text
                              x={pos.x + 20}
                              y={pos.y - 18}
                              fontSize="11"
                              fontWeight="600"
                              fill="hsl(var(--popover-foreground))"
                            >
                              {node.name}
                            </text>
                            <text
                              x={pos.x + 20}
                              y={pos.y - 4}
                              fontSize="9"
                              fill="hsl(var(--muted-foreground))"
                            >
                              {node.nodeType} • {node.voltageKv}kV
                            </text>
                            <text
                              x={pos.x + 20}
                              y={pos.y + 10}
                              fontSize="9"
                              fill="hsl(var(--muted-foreground))"
                            >
                              {node.geoLat?.toFixed(4)}°, {node.geoLng?.toFixed(4)}°
                            </text>
                            <text
                              x={pos.x + 20}
                              y={pos.y + 24}
                              fontSize="9"
                              fill="hsl(var(--muted-foreground))"
                            >
                              {node.region}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Info overlay */}
                <div className="absolute top-4 left-4 bg-background/90 border border-border rounded-lg p-3 text-[10px]">
                  <div className="font-semibold text-xs mb-1">Map Info</div>
                  <div>{nodesWithCoords.length} locations plotted</div>
                  <div className="mt-1 text-muted-foreground">
                    Lat: {mapBounds.minLat.toFixed(2)}° to {mapBounds.maxLat.toFixed(2)}°
                  </div>
                  <div className="text-muted-foreground">
                    Lng: {mapBounds.minLng.toFixed(2)}° to {mapBounds.maxLng.toFixed(2)}°
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Geographic nodes list */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Mapped Locations</CardTitle>
          </CardHeader>
          <CardContent>
            {nodesWithCoords.length === 0 ? (
              <EmptyState
                title="No geographic data"
                description="No grid nodes have geographic coordinates set."
              />
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {nodesWithCoords.map(node => (
                  <div key={node.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium text-sm">{node.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {node.geoLat?.toFixed(4)}, {node.geoLng?.toFixed(4)} • {node.region}
                      </div>
                    </div>
                    <Badge variant="outline">{node.nodeType}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unmapped nodes */}
        {gridNodes.length > nodesWithCoords.length && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Unmapped Nodes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {gridNodes
                  .filter(node => !node.geoLat || !node.geoLng)
                  .slice(0, 5)
                  .map(node => (
                    <div key={node.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium text-sm">{node.name}</div>
                        <div className="text-xs text-muted-foreground">{node.nodeType} • {node.region}</div>
                      </div>
                      <Badge variant="secondary">No coordinates</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const filterConfigs = [
    {
      key: 'viewMode',
      label: 'View Mode',
      value: viewMode,
      onChange: (val: any) => setViewMode(val),
      options: [
        { value: 'tree', label: 'Hierarchy Tree' },
        { value: 'network', label: 'Network Topology' },
        { value: 'map', label: 'Geographic Map' },
      ],
    },
    {
      key: 'site',
      label: 'Site',
      value: filters.siteId,
      onChange: (val: string) => setFilters(prev => ({ ...prev, siteId: val })),
      options: [{ value: 'all', label: 'All Sites' }, ...sites.map(s => ({ value: s.id, label: s.name }))],
    },
    {
      key: 'assetType',
      label: 'Asset Type',
      value: filters.assetTypeId,
      onChange: (val: string) => setFilters(prev => ({ ...prev, assetTypeId: val })),
      options: [{ value: 'all', label: 'All Types' }, ...assetTypes.map(t => ({ value: t.id, label: t.name }))],
    },
    {
      key: 'status',
      label: 'Status',
      value: filters.status,
      onChange: (val: string) => setFilters(prev => ({ ...prev, status: val })),
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'online', label: 'Online' },
        { value: 'offline', label: 'Offline' },
        { value: 'maintenance', label: 'Maintenance' },
      ],
    },
    {
      key: 'criticality',
      label: 'Criticality',
      value: filters.criticality,
      onChange: (val: string) => setFilters(prev => ({ ...prev, criticality: val })),
      options: [
        { value: 'all', label: 'All Levels' },
        { value: 'critical', label: 'Critical' },
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' },
      ],
    },
  ];

  const ListContent = () => {
    switch (viewMode) {
      case 'tree':
        return (
          <div className="space-y-1">
            {treeData.map(node => renderTreeNode(node))}
          </div>
        );
      case 'network':
        return (
          <div className="space-y-1">
            <div className="px-1 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Grid Nodes ({gridNodes.length})
            </div>
            {gridNodes.map(node => (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={cn(
                  "p-2 rounded-md border cursor-pointer transition-all mb-1",
                  selectedNodeId === node.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/30 bg-card/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{node.name}</span>
                  <Badge variant="outline" className="text-[10px] h-4 px-1">{node.nodeType}</Badge>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {node.voltageKv}kV • {node.region}
                </div>
              </div>
            ))}
          </div>
        );
      case 'map':
        return (
          <div className="space-y-1">
            <div className="px-1 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Mapped Locations ({nodesWithCoords.length})
            </div>
            {nodesWithCoords.map(node => (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={cn(
                  "p-2 rounded-md border cursor-pointer transition-all mb-1",
                  selectedNodeId === node.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/30 bg-card/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{node.name}</span>
                  <div className="flex gap-1">
                    <MapIcon className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {node.geoLat?.toFixed(4)}, {node.geoLng?.toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  const tabs = [
    {
      id: "visualize",
      label: "Visualization",
      content: (
        <Card className="h-full min-h-[500px] flex flex-col">
          <CardContent className="flex-1 p-6">
            {viewMode === 'tree' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Asset Hierarchy</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => buildTreeData(filteredAssets)}>Refresh Tree</Button>
                  </div>
                </div>
                <div className="p-4 border rounded-lg bg-muted/20 min-h-[400px]">
                  {/* This could be a more complex visual tree, but for now we follow old logic */}
                  <p className="text-muted-foreground text-sm mb-4">Hierarchical overview of sites and assets.</p>
                  <div className="space-y-1">
                    {treeData.slice(0, 5).map(node => renderTreeNode(node))}
                    {treeData.length > 5 && <p className="text-[10px] text-muted-foreground pt-2 italic">Tree preview limited in visualization tab. Use navigation pane for full explorer.</p>}
                  </div>
                </div>
              </div>
            ) : viewMode === 'network' ? (
              renderNetworkView()
            ) : (
              renderMapView()
            )}
          </CardContent>
        </Card>
      ),
    },
    {
      id: "details",
      label: "Selected Details",
      content: (
        <div className="space-y-6">
          {!selectedNodeId ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>Select an item from the navigation pane to view its details.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-sm">Technical Specifications</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Entity ID:</span>
                    <span>{selectedNodeId}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2 italic">Extended technical data based on selected node type would appear here.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ),
    }
  ];

  return (
    <>
      <ListPane
        title="Portfolio Explorer"
        subtitle={viewMode === 'tree' ? 'Asset Hierarchy' : viewMode === 'network' ? 'Network Topology' : 'Geographic Map'}
        searchPlaceholder="Search assets..."
        onSearch={(val) => setSearchQuery(val)}
        showExpandableFilters={true}
        filters={filterConfigs}
      >
        <ListContent />
      </ListPane>

      <WorkPane
        title={viewMode === 'tree' ? 'Hierarchy' : viewMode === 'network' ? 'Network Mapper' : 'Global Explorer'}
        subtitle={`Viewing asset portfolio in ${viewMode} mode`}
        tabs={tabs}
      />
    </>
  );
}
