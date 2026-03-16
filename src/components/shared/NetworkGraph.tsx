import { useEffect, useRef, useState } from 'react';
import type { GridNode, GridLine } from '@/types/transmission';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NetworkGraphProps {
  nodes: GridNode[];
  lines: GridLine[];
  onNodeClick?: (node: GridNode) => void;
  onLineClick?: (line: GridLine) => void;
  selectedNodeId?: string | null;
  selectedLineId?: string | null;
}

interface SimulationNode extends GridNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function NetworkGraph({
  nodes,
  lines,
  onNodeClick,
  onLineClick,
  selectedNodeId,
  selectedLineId
}: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [simNodes, setSimNodes] = useState<SimulationNode[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  // Initialize simulation nodes
  useEffect(() => {
    if (!nodes.length) return;

    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    const initialized: SimulationNode[] = nodes.map((node, i) => ({
      ...node,
      x: width / 2 + (Math.random() - 0.5) * 200,
      y: height / 2 + (Math.random() - 0.5) * 200,
      vx: 0,
      vy: 0
    }));

    setSimNodes(initialized);
  }, [nodes]);

  // Force simulation
  useEffect(() => {
    if (!isRunning || !simNodes.length) return;

    const simulate = () => {
      const width = containerRef.current?.clientWidth || 800;
      const height = containerRef.current?.clientHeight || 600;

      setSimNodes(prevNodes => {
        const newNodes = [...prevNodes];
        
        // Apply forces
        newNodes.forEach((node, i) => {
          let fx = 0;
          let fy = 0;

          // Repulsion between nodes
          newNodes.forEach((other, j) => {
            if (i === j) return;
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 5000 / (dist * dist);
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
          });

          // Attraction along lines
          lines.forEach(line => {
            const isSource = line.fromNodeId === node.id;
            const isTarget = line.toNodeId === node.id;
            
            if (isSource || isTarget) {
              const otherId = isSource ? line.toNodeId : line.fromNodeId;
              const other = newNodes.find(n => n.id === otherId);
              if (other) {
                const dx = other.x - node.x;
                const dy = other.y - node.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = dist * 0.01;
                fx += (dx / dist) * force;
                fy += (dy / dist) * force;
              }
            }
          });

          // Center gravity
          const centerX = width / 2;
          const centerY = height / 2;
          fx += (centerX - node.x) * 0.001;
          fy += (centerY - node.y) * 0.001;

          // Update velocity with damping
          node.vx = (node.vx + fx) * 0.85;
          node.vy = (node.vy + fy) * 0.85;

          // Update position
          node.x += node.vx;
          node.y += node.vy;

          // Boundary constraints
          const margin = 50;
          node.x = Math.max(margin, Math.min(width - margin, node.x));
          node.y = Math.max(margin, Math.min(height - margin, node.y));
        });

        return newNodes;
      });

      animationRef.current = requestAnimationFrame(simulate);
    };

    animationRef.current = requestAnimationFrame(simulate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, simNodes.length, lines]);

  // Render to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !simNodes.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.save();

    // Apply zoom and pan
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw lines
    lines.forEach(line => {
      const source = simNodes.find(n => n.id === line.fromNodeId);
      const target = simNodes.find(n => n.id === line.toNodeId);
      
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        
        const isSelected = line.id === selectedLineId;
        ctx.strokeStyle = isSelected ? '#3b82f6' : '#64748b';
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.globalAlpha = isSelected ? 1 : 0.4;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });

    // Draw nodes
    simNodes.forEach(node => {
      const isSelected = node.id === selectedNodeId;
      const radius = isSelected ? 12 : 8;
      
      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      
      // Color by type
      let color = '#64748b';
      if (node.nodeType === 'substation') color = '#3b82f6';
      else if (node.nodeType === 'junction') color = '#eab308';
      else if (node.nodeType === 'plant') color = '#22c55e';
      
      ctx.fillStyle = color;
      ctx.fill();
      
      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Node label
      if (zoom > 0.7) {
        // Use dark text for light mode, light text for dark mode
        const isDarkMode = document.documentElement.classList.contains('dark');
        ctx.fillStyle = isDarkMode ? '#ffffff' : '#1e293b';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x, node.y + radius + 14);
      }
    });

    ctx.restore();
  }, [simNodes, lines, zoom, pan, selectedNodeId, selectedLineId]);

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    // Check if clicked on a node
    const clickedNode = simNodes.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 12;
    });

    if (clickedNode && onNodeClick) {
      onNodeClick(clickedNode);
    }
  };

  // Handle mouse drag for panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <Card className="border-none shadow-none bg-transparent">
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRunning(!isRunning)}
              className="gap-2"
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isRunning ? 'Pause' : 'Resume'}
            </Button>
            <div className="h-4 w-px bg-border" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.min(zoom + 0.2, 3))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.max(zoom - 0.2, 0.3))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            {nodes.length} nodes • {lines.length} connections • Zoom: {(zoom * 100).toFixed(0)}%
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className="relative w-full h-[600px] bg-muted/30 rounded-xl border border-border/50 overflow-hidden"
        >
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={cn(
              "w-full h-full",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
          />
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
            <p className="text-xs font-semibold mb-2">Node Types</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs">Substation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-xs">Junction</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs">Plant</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
