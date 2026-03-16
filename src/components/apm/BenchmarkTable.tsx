import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Asset } from "@/types/navigation";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  Award,
  AlertTriangle
} from "lucide-react";

interface BenchmarkData {
  metricName: string;
  currentValue: number;
  target: number;
  bestObserved: number;
  worstObserved: number;
  unit: string;
  trend?: "up" | "down" | "stable";
  trendPercentage?: number;
}

interface BenchmarkTableProps {
  asset: Asset;
  benchmarkData: BenchmarkData[];
  showTrends?: boolean;
  showRanking?: boolean;
  peerGroupSize?: number;
  assetRanking?: number;
}

export function BenchmarkTable({
  asset,
  benchmarkData,
  showTrends = true,
  showRanking = true,
  peerGroupSize = 25,
  assetRanking = 12,
}: BenchmarkTableProps) {
  const getPerformanceStatus = (current: number, target: number, best: number, isHigherBetter: boolean = true) => {
    const targetDiff = isHigherBetter ? current - target : target - current;
    const bestDiff = isHigherBetter ? current - best : best - current;
    
    if (targetDiff >= 0) return "exceeds";
    if (bestDiff >= (best - target) * 0.8) return "meets";
    if (bestDiff >= (best - target) * 0.5) return "below";
    return "poor";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "exceeds":
        return "text-green-600 bg-green-50 border-green-200";
      case "meets":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "below":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "poor":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-muted-foreground bg-secondary border-border";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "exceeds":
        return "Exceeds Target";
      case "meets":
        return "Meets Target";
      case "below":
        return "Below Target";
      case "poor":
        return "Poor Performance";
      default:
        return "Unknown";
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 h-3 text-green-600" />;
      case "down":
        return <TrendingDown className="w-3 h-3 text-red-600" />;
      default:
        return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getRankingColor = (ranking: number, total: number) => {
    const percentile = (total - ranking + 1) / total;
    if (percentile >= 0.8) return "text-green-600";
    if (percentile >= 0.6) return "text-blue-600";
    if (percentile >= 0.4) return "text-yellow-600";
    return "text-red-600";
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === "%") {
      return `${value.toFixed(1)}%`;
    } else if (unit === "hours" || unit === "hrs") {
      return `${value.toFixed(0)}h`;
    } else if (unit === "days") {
      return `${value.toFixed(0)}d`;
    } else {
      return `${value.toFixed(1)} ${unit}`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="w-4 h-4" />
            Performance Benchmarks
          </CardTitle>
          {showRanking && (
            <Badge variant="outline" className={cn("text-xs", getRankingColor(assetRanking, peerGroupSize))}>
              Rank #{assetRanking} of {peerGroupSize}
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {asset.name} • {asset.type}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Benchmark Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Metric</TableHead>
                <TableHead className="text-xs text-center">Current</TableHead>
                <TableHead className="text-xs text-center">Target</TableHead>
                <TableHead className="text-xs text-center">Best</TableHead>
                <TableHead className="text-xs text-center">Status</TableHead>
                {showTrends && <TableHead className="text-xs text-center">Trend</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {benchmarkData.map((metric, index) => {
                const isHigherBetter = metric.metricName.toLowerCase().includes("availability") || 
                                     metric.metricName.toLowerCase().includes("efficiency") ||
                                     metric.metricName.toLowerCase().includes("uptime");
                const status = getPerformanceStatus(metric.currentValue, metric.target, metric.bestObserved, isHigherBetter);
                
                return (
                  <TableRow key={index}>
                    <TableCell className="text-xs font-medium">
                      {metric.metricName}
                    </TableCell>
                    <TableCell className="text-xs text-center font-medium">
                      {formatValue(metric.currentValue, metric.unit)}
                    </TableCell>
                    <TableCell className="text-xs text-center text-muted-foreground">
                      {formatValue(metric.target, metric.unit)}
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Award className="w-3 h-3 text-yellow-500" />
                        <span>{formatValue(metric.bestObserved, metric.unit)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn("text-xs", getStatusColor(status))}>
                        {getStatusLabel(status)}
                      </Badge>
                    </TableCell>
                    {showTrends && (
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getTrendIcon(metric.trend)}
                          {metric.trendPercentage && (
                            <span className={cn("text-xs font-medium", getTrendColor(metric.trend))}>
                              {Math.abs(metric.trendPercentage).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {benchmarkData.filter(m => getPerformanceStatus(m.currentValue, m.target, m.bestObserved) === "exceeds").length}
            </div>
            <div className="text-xs text-muted-foreground">Exceeding Target</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {benchmarkData.filter(m => getPerformanceStatus(m.currentValue, m.target, m.bestObserved) === "meets").length}
            </div>
            <div className="text-xs text-muted-foreground">Meeting Target</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">
              {benchmarkData.filter(m => {
                const status = getPerformanceStatus(m.currentValue, m.target, m.bestObserved);
                return status === "below" || status === "poor";
              }).length}
            </div>
            <div className="text-xs text-muted-foreground">Below Target</div>
          </div>
        </div>

        {/* Improvement Opportunities */}
        <div className="space-y-2 pt-2 border-t">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Top Improvement Opportunities
          </h4>
          
          {benchmarkData
            .filter(m => {
              const status = getPerformanceStatus(m.currentValue, m.target, m.bestObserved);
              return status === "below" || status === "poor";
            })
            .slice(0, 3)
            .map((metric, index) => (
              <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-yellow-50 border border-yellow-200">
                <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs font-medium text-yellow-800">
                    {metric.metricName}
                  </div>
                  <div className="text-xs text-yellow-700">
                    Gap to target: {Math.abs(metric.currentValue - metric.target).toFixed(1)} {metric.unit}
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button size="sm" variant="outline">
            <Target className="w-4 h-4 mr-2" />
            View Detailed Analysis
          </Button>
          <Button size="sm" variant="outline">
            <Award className="w-4 h-4 mr-2" />
            Best Practice Guide
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}