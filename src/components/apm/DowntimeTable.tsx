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
  Clock, 
  Calendar,
  AlertTriangle,
  Wrench,
  Settings,
  FileText,
  Filter
} from "lucide-react";

interface DowntimeEvent {
  id: string;
  assetId: string;
  assetName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  reason: string;
  category: "Planned" | "Unplanned";
  severity: "Low" | "Medium" | "High" | "Critical";
  status: "Ongoing" | "Completed" | "Investigating";
  workOrderId?: string;
  costImpact?: number;
}

interface DowntimeTableProps {
  events: DowntimeEvent[];
  selectedAsset?: Asset | null;
  timeRange?: "24h" | "7d" | "30d" | "90d";
  showCosts?: boolean;
  maxItems?: number;
  onEventSelect?: (event: DowntimeEvent) => void;
}

export function DowntimeTable({
  events,
  selectedAsset,
  timeRange = "30d",
  showCosts = true,
  maxItems = 10,
  onEventSelect,
}: DowntimeTableProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Planned":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "Unplanned":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-muted-foreground bg-secondary border-border";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "High":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "Medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-muted-foreground bg-secondary border-border";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ongoing":
        return "text-red-600 bg-red-50 border-red-200";
      case "Investigating":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Completed":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-muted-foreground bg-secondary border-border";
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    } else {
      const days = Math.floor(minutes / 1440);
      const remainingHours = Math.floor((minutes % 1440) / 60);
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const formatCost = (cost?: number) => {
    if (!cost) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cost);
  };

  // Filter events by selected asset if provided
  const filteredEvents = selectedAsset 
    ? events.filter(event => event.assetId === selectedAsset.id)
    : events;

  const displayEvents = filteredEvents.slice(0, maxItems);

  // Calculate summary statistics
  const totalDowntime = filteredEvents.reduce((sum, event) => sum + event.durationMinutes, 0);
  const plannedDowntime = filteredEvents
    .filter(event => event.category === "Planned")
    .reduce((sum, event) => sum + event.durationMinutes, 0);
  const unplannedDowntime = filteredEvents
    .filter(event => event.category === "Unplanned")
    .reduce((sum, event) => sum + event.durationMinutes, 0);
  const totalCost = showCosts 
    ? filteredEvents.reduce((sum, event) => sum + (event.costImpact || 0), 0)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Downtime Events
            {selectedAsset && (
              <span className="text-xs text-muted-foreground">
                • {selectedAsset.name}
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {timeRange.toUpperCase()}
            </Badge>
            <Button size="sm" variant="outline">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 rounded-lg bg-secondary/30">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">
              {formatDuration(totalDowntime)}
            </div>
            <div className="text-xs text-muted-foreground">Total Downtime</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {formatDuration(plannedDowntime)}
            </div>
            <div className="text-xs text-muted-foreground">Planned</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">
              {formatDuration(unplannedDowntime)}
            </div>
            <div className="text-xs text-muted-foreground">Unplanned</div>
          </div>
          
          {showCosts && (
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {formatCost(totalCost)}
              </div>
              <div className="text-xs text-muted-foreground">Cost Impact</div>
            </div>
          )}
        </div>

        {/* Events Table */}
        {displayEvents.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Asset</TableHead>
                  <TableHead className="text-xs">Start Time</TableHead>
                  <TableHead className="text-xs">Duration</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs">Severity</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Reason</TableHead>
                  {showCosts && <TableHead className="text-xs">Cost</TableHead>}
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayEvents.map((event) => {
                  const startDateTime = formatDateTime(event.startTime);
                  
                  return (
                    <TableRow 
                      key={event.id}
                      className="cursor-pointer hover:bg-secondary/50"
                      onClick={() => onEventSelect?.(event)}
                    >
                      <TableCell className="text-xs font-medium">
                        {event.assetName}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>
                          <div>{startDateTime.date}</div>
                          <div className="text-muted-foreground">{startDateTime.time}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {formatDuration(event.durationMinutes)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs", getCategoryColor(event.category))}>
                          {event.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs", getSeverityColor(event.severity))}>
                          {event.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs", getStatusColor(event.status))}>
                          {event.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-32 truncate" title={event.reason}>
                        {event.reason}
                      </TableCell>
                      {showCosts && (
                        <TableCell className="text-xs font-medium">
                          {formatCost(event.costImpact)}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {event.workOrderId && (
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                              <Wrench className="w-3 h-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <FileText className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No downtime events found for the selected period
          </div>
        )}

        {/* Top Reasons Analysis */}
        {filteredEvents.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Top Downtime Reasons
            </h4>
            
            {/* Calculate top reasons */}
            {(() => {
              const reasonStats = filteredEvents.reduce((acc, event) => {
                if (!acc[event.reason]) {
                  acc[event.reason] = { count: 0, totalMinutes: 0 };
                }
                acc[event.reason].count++;
                acc[event.reason].totalMinutes += event.durationMinutes;
                return acc;
              }, {} as Record<string, { count: number; totalMinutes: number }>);

              const topReasons = Object.entries(reasonStats)
                .sort((a, b) => b[1].totalMinutes - a[1].totalMinutes)
                .slice(0, 3);

              return topReasons.map(([reason, stats], index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                  <div className="flex-1">
                    <div className="text-xs font-medium">{reason}</div>
                    <div className="text-xs text-muted-foreground">
                      {stats.count} events • {formatDuration(stats.totalMinutes)}
                    </div>
                  </div>
                  <div className="text-xs font-medium">
                    {((stats.totalMinutes / totalDowntime) * 100).toFixed(1)}%
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button size="sm" variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Maintenance
          </Button>
          <Button size="sm" variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          {filteredEvents.length > maxItems && (
            <Button size="sm" variant="ghost">
              View All {filteredEvents.length} Events
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}