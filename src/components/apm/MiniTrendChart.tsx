import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TelemetryDataPoint } from "@/types/navigation";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MiniTrendChartProps {
  data: TelemetryDataPoint[];
  parameter: string;
  unit: string;
  height?: number;
  showStatus?: boolean;
  title?: string;
}

export function MiniTrendChart({
  data,
  parameter,
  unit,
  height = 60,
  showStatus = true,
  title,
}: MiniTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {title || parameter}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-16 text-sm text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate trend and statistics
  const values = data.map(d => d.value).filter(v => typeof v === 'number' && isFinite(v));
  
  if (values.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {title || parameter}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-16 text-sm text-muted-foreground">
            No valid data available
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const currentValue = values[values.length - 1];
  const previousValue = values[values.length - 2] || currentValue;
  
  const trend = currentValue > previousValue ? "up" : 
               currentValue < previousValue ? "down" : "stable";
  
  const trendPercentage = previousValue !== 0 
    ? ((currentValue - previousValue) / previousValue * 100)
    : 0;

  // Generate SVG path for the trend line
  const generatePath = () => {
    if (values.length < 2) return "";
    
    const width = 200;
    const padding = 4;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);
    
    const xStep = chartWidth / (values.length - 1);
    const valueRange = maxValue - minValue || 1;
    
    let path = "";
    
    values.forEach((value, index) => {
      const x = padding + (index * xStep);
      const normalizedValue = (value - minValue) / valueRange;
      const y = padding + chartHeight - (normalizedValue * chartHeight);
      
      // Skip invalid coordinates
      if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
        return;
      }
      
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    
    return path;
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 h-3 text-green-600" />;
      case "down":
        return <TrendingDown className="w-3 h-3 text-red-600" />;
      default:
        return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusFromLatest = () => {
    const latest = data[data.length - 1];
    return latest?.status || "Normal";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Normal":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "Warning":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "Critical":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-secondary text-muted-foreground border-border";
    }
  };

  const status = getStatusFromLatest();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {title || parameter}
          </CardTitle>
          {showStatus && (
            <Badge variant="outline" className={cn("text-xs", getStatusColor(status))}>
              {status}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Current Value */}
        <div className="flex items-baseline justify-between">
          <span className="text-xl font-bold">
            {currentValue.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">
            {unit}
          </span>
        </div>

        {/* Mini Chart */}
        <div className="relative">
          <svg 
            width="100%" 
            height={height} 
            viewBox={`0 0 200 ${height}`}
            className="border rounded"
          >
            {/* Background grid lines */}
            <defs>
              <pattern id="grid" width="20" height="10" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 10" fill="none" stroke="#f1f5f9" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Trend line */}
            <path
              d={generatePath()}
              fill="none"
              stroke={trend === "up" ? "#16a34a" : trend === "down" ? "#dc2626" : "#6b7280"}
              strokeWidth="2"
              className="drop-shadow-sm"
            />
            
            {/* Data points */}
            {values.map((value, index) => {
              const chartWidth = 192;
              const chartHeight = height - 8;
              const xStep = values.length > 1 ? chartWidth / (values.length - 1) : 0;
              const x = values.length === 1 ? 100 : 4 + (index * xStep);
              const valueRange = maxValue - minValue || 1;
              const normalizedValue = (value - minValue) / valueRange;
              const y = 4 + chartHeight - (normalizedValue * chartHeight);
              
              // Skip rendering if coordinates are invalid
              if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
                return null;
              }
              
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="2"
                  fill={trend === "up" ? "#16a34a" : trend === "down" ? "#dc2626" : "#6b7280"}
                  className="drop-shadow-sm"
                />
              );
            })}
          </svg>
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            <span className={cn("font-medium", getTrendColor())}>
              {Math.abs(trendPercentage).toFixed(1)}%
            </span>
          </div>
          <span className="text-muted-foreground">
            {data.length} points
          </span>
        </div>
      </CardContent>
    </Card>
  );
}