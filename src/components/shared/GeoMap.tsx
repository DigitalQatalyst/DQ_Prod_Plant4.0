import { useState, useRef, useEffect, useMemo } from 'react';
import type { GridNode } from '@/types/transmission';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GeoMapProps {
    nodes: GridNode[];
    onNodeClick?: (node: GridNode) => void;
    selectedNodeId?: string | null;
}

export function GeoMap({
    nodes,
    onNodeClick,
    selectedNodeId
}: GeoMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Find bounds of nodes to center them initially
    const bounds = useMemo(() => {
        if (!nodes.length) return { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 };

        return nodes.reduce((acc, node) => {
            if (node.geoLat === null || node.geoLng === null) return acc;
            return {
                minLat: Math.min(acc.minLat, node.geoLat),
                maxLat: Math.max(acc.maxLat, node.geoLat),
                minLng: Math.min(acc.minLng, node.geoLng),
                maxLng: Math.max(acc.maxLng, node.geoLng),
            };
        }, {
            minLat: nodes[0].geoLat || 0,
            maxLat: nodes[0].geoLat || 0,
            minLng: nodes[0].geoLng || 0,
            maxLng: nodes[0].geoLng || 0,
        });
    }, [nodes]);

    // Handle mouse drag for panning
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPan({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Convert lat/lng to x/y for SVG
    const project = (lat: number, lng: number) => {
        const width = containerRef.current?.clientWidth || 800;
        const height = containerRef.current?.clientHeight || 600;

        // Simple equirectangular projection centered on the data
        const latSpan = Math.max(bounds.maxLat - bounds.minLat, 0.1);
        const lngSpan = Math.max(bounds.maxLng - bounds.minLng, 0.1);

        const x = ((lng - bounds.minLng) / lngSpan) * (width * 0.8) + (width * 0.1);
        const y = height - (((lat - bounds.minLat) / latSpan) * (height * 0.8) + (height * 0.1));

        return { x, y };
    };

    const getNodeColor = (type: string) => {
        switch (type) {
            case 'substation': return '#3b82f6';
            case 'junction': return '#eab308';
            case 'plant': return '#22c55e';
            default: return '#64748b';
        }
    };

    return (
        <Card className="relative w-full h-[600px] bg-muted/20 border-border/50 rounded-xl overflow-hidden group">
            {/* Controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <Button
                    variant="secondary"
                    size="icon"
                    className="w-10 h-10 rounded-full shadow-lg backdrop-blur-md bg-background/80"
                    onClick={() => setZoom(Math.min(zoom + 0.2, 5))}
                >
                    <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                    variant="secondary"
                    size="icon"
                    className="w-10 h-10 rounded-full shadow-lg backdrop-blur-md bg-background/80"
                    onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))}
                >
                    <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                    variant="secondary"
                    size="icon"
                    className="w-10 h-10 rounded-full shadow-lg backdrop-blur-md bg-background/80"
                    onClick={() => {
                        setZoom(1);
                        setPan({ x: 0, y: 0 });
                    }}
                >
                    <Maximize2 className="w-4 h-4" />
                </Button>
            </div>

            {/* Map Content */}
            <div
                ref={containerRef}
                className={cn(
                    "w-full h-full cursor-grab active:cursor-grabbing transition-colors",
                    isDragging && "cursor-grabbing"
                )}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <svg
                    className="w-full h-full"
                    viewBox={`0 0 ${containerRef.current?.clientWidth || 800} ${containerRef.current?.clientHeight || 600}`}
                >
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/10" />
                        </pattern>
                        <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                        </radialGradient>
                    </defs>

                    <rect width="100%" height="100%" fill="url(#grid)" />

                    <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                        {/* Background topographic lines or stylized elements could go here */}
                        {nodes.map((node) => {
                            if (node.geoLat === null || node.geoLng === null) return null;
                            const { x, y } = project(node.geoLat, node.geoLng);
                            const isSelected = node.id === selectedNodeId;
                            const color = getNodeColor(node.nodeType);

                            return (
                                <g
                                    key={node.id}
                                    className="cursor-pointer group/node"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onNodeClick?.(node);
                                    }}
                                >
                                    {/* Interaction Area */}
                                    <circle cx={x} cy={y} r={20 / zoom} fill="transparent" />

                                    {/* Glow */}
                                    {isSelected && (
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r={25 / zoom}
                                            fill={color}
                                            className="animate-pulse opacity-20"
                                        />
                                    )}

                                    {/* Marker Shadow */}
                                    <circle
                                        cx={x}
                                        cy={y + 2}
                                        r={6 / zoom}
                                        fill="black"
                                        fillOpacity="0.2"
                                    />

                                    {/* Node Circle */}
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r={6 / zoom}
                                        fill={color}
                                        stroke="white"
                                        strokeWidth={2 / zoom}
                                        className={cn(
                                            "transition-all duration-200",
                                            isSelected ? "r-[8/zoom]" : "hover:r-[7/zoom]"
                                        )}
                                    />

                                    {/* Label */}
                                    <g transform={`translate(${x}, ${y + 12 / zoom})`}>
                                        <text
                                            textAnchor="middle"
                                            className={cn(
                                                "text-[10px] font-medium fill-foreground transition-opacity",
                                                zoom < 1.5 && !isSelected ? "opacity-0" : "opacity-100"
                                            )}
                                            style={{ fontSize: `${10 / zoom}px` }}
                                        >
                                            {node.name}
                                        </text>
                                    </g>
                                </g>
                            );
                        })}
                    </g>
                </svg>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg pointer-events-none">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 tracking-wider">Map Legend</p>
                <div className="space-y-1.5 border-l-2 border-muted pl-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="text-[11px] font-medium">Substation</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                        <span className="text-[11px] font-medium">Junction</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="text-[11px] font-medium">Plant</span>
                    </div>
                </div>
            </div>

            {/* Stats Overlay */}
            <div className="absolute bottom-4 right-4 text-right pointer-events-none">
                <p className="text-[10px] font-mono text-muted-foreground bg-background/50 px-2 py-1 rounded backdrop-blur-sm border border-border/50">
                    NODES: {nodes.length} | ZOOM: {(zoom * 100).toFixed(0)}%
                </p>
            </div>
        </Card>
    );
}


