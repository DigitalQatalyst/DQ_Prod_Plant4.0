import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Asset } from "@/types/navigation";
import { 
  Download,
  FileText,
  FileSpreadsheet,
  Database,
  Calendar,
  Clock,
  Settings,
  Share,
  Mail,
  Printer,
  Filter,
  CheckCircle
} from "lucide-react";

interface ExportOption {
  id: string;
  name: string;
  description: string;
  format: "PDF" | "CSV" | "Excel" | "JSON" | "API";
  icon: React.ComponentType<{ className?: string }>;
  size?: string;
  lastGenerated?: string;
}

interface ScheduledExport {
  id: string;
  name: string;
  format: string;
  frequency: "Daily" | "Weekly" | "Monthly";
  recipients: string[];
  nextRun: string;
  status: "Active" | "Paused" | "Failed";
}

interface ExportActionsPanelProps {
  selectedAsset?: Asset | null;
  availableDatasets?: string[];
  scheduledExports?: ScheduledExport[];
  onExport?: (format: string, dataset: string, options: any) => void;
  onScheduleExport?: (config: any) => void;
  showScheduling?: boolean;
}

export function ExportActionsPanel({
  selectedAsset,
  availableDatasets = [
    "Telemetry Data",
    "Alert History", 
    "Downtime Events",
    "Reliability KPIs",
    "Performance Metrics",
    "Maintenance Records"
  ],
  scheduledExports = [],
  onExport,
  onScheduleExport,
  showScheduling = true,
}: ExportActionsPanelProps) {
  const exportOptions: ExportOption[] = [
    {
      id: "pdf-report",
      name: "PDF Report",
      description: "Comprehensive asset performance report with charts and analysis",
      format: "PDF",
      icon: FileText,
      size: "2.3 MB",
      lastGenerated: "2 hours ago"
    },
    {
      id: "csv-data",
      name: "CSV Data Export",
      description: "Raw telemetry and performance data in CSV format",
      format: "CSV",
      icon: FileSpreadsheet,
      size: "1.8 MB",
      lastGenerated: "1 day ago"
    },
    {
      id: "excel-workbook",
      name: "Excel Workbook",
      description: "Multi-sheet workbook with data, charts, and pivot tables",
      format: "Excel",
      icon: FileSpreadsheet,
      size: "4.1 MB",
      lastGenerated: "3 days ago"
    },
    {
      id: "json-api",
      name: "JSON API Export",
      description: "Structured data export via REST API endpoint",
      format: "JSON",
      icon: Database,
      size: "Variable",
      lastGenerated: "Real-time"
    }
  ];

  const getFormatColor = (format: string) => {
    switch (format) {
      case "PDF":
        return "text-red-600 bg-red-50 border-red-200";
      case "CSV":
        return "text-green-600 bg-green-50 border-green-200";
      case "Excel":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "JSON":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "API":
        return "text-orange-600 bg-orange-50 border-orange-200";
      default:
        return "text-muted-foreground bg-secondary border-border";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "text-green-600 bg-green-50 border-green-200";
      case "Paused":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Failed":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-muted-foreground bg-secondary border-border";
    }
  };

  const formatNextRun = (nextRun: string) => {
    const date = new Date(nextRun);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      return "soon";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Download className="w-4 h-4" />
          Data Export & Reports
          {selectedAsset && (
            <span className="text-xs text-muted-foreground">
              • {selectedAsset.name}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Quick Export Options */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Quick Export</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exportOptions.map((option) => {
              const IconComponent = option.icon;
              
              return (
                <div
                  key={option.id}
                  className="p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:bg-secondary/50"
                  onClick={() => onExport?.(option.format, "default", {})}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{option.name}</span>
                    </div>
                    <Badge variant="outline" className={cn("text-xs", getFormatColor(option.format))}>
                      {option.format}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    {option.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Size: {option.size}</span>
                    <span>Last: {option.lastGenerated}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Custom Export Configuration */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Custom Export</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Dataset</label>
              <Select>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select dataset" />
                </SelectTrigger>
                <SelectContent>
                  {availableDatasets.map((dataset) => (
                    <SelectItem key={dataset} value={dataset.toLowerCase().replace(/\s+/g, '-')}>
                      {dataset}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Format</label>
              <Select>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                  <SelectItem value="csv">CSV Data</SelectItem>
                  <SelectItem value="excel">Excel Workbook</SelectItem>
                  <SelectItem value="json">JSON Export</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Time Range</label>
              <Select>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Options</label>
              <Select>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Export options" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Include All Data</SelectItem>
                  <SelectItem value="summary">Summary Only</SelectItem>
                  <SelectItem value="filtered">Apply Current Filters</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="sm">
              <Download className="w-4 h-4 mr-2" />
              Generate Export
            </Button>
            <Button size="sm" variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Advanced Options
            </Button>
          </div>
        </div>

        {/* Scheduled Exports */}
        {showScheduling && (
          <>
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Scheduled Exports</h4>
                <Button size="sm" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  New Schedule
                </Button>
              </div>
              
              {scheduledExports.length > 0 ? (
                <div className="space-y-2">
                  {scheduledExports.map((schedule) => (
                    <div key={schedule.id} className="p-3 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{schedule.name}</span>
                            <Badge variant="outline" className={cn("text-xs", getFormatColor(schedule.format))}>
                              {schedule.format}
                            </Badge>
                            <Badge variant="outline" className={cn("text-xs", getStatusColor(schedule.status))}>
                              {schedule.status}
                            </Badge>
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            {schedule.frequency} • {schedule.recipients.length} recipient{schedule.recipients.length > 1 ? 's' : ''}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>Next: {formatNextRun(schedule.nextRun)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="h-6 text-xs">
                          <Settings className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 text-xs">
                          <Mail className="w-3 h-3 mr-1" />
                          Test
                        </Button>
                        {schedule.status === "Active" ? (
                          <Button size="sm" variant="ghost" className="h-6 text-xs">
                            Pause
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-6 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Resume
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-20 text-sm text-muted-foreground border rounded-lg">
                  No scheduled exports configured
                </div>
              )}
            </div>
          </>
        )}

        <Separator />

        {/* Export History */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Recent Exports</h4>
          
          <div className="space-y-2">
            {[
              { name: "Asset Performance Report", format: "PDF", time: "2 hours ago", size: "2.3 MB" },
              { name: "Telemetry Data Export", format: "CSV", time: "1 day ago", size: "1.8 MB" },
              { name: "Monthly Reliability Report", format: "Excel", time: "3 days ago", size: "4.1 MB" },
            ].map((export_, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs font-medium">{export_.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {export_.format} • {export_.size} • {export_.time}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <Share className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <Button variant="ghost" size="sm" className="w-full text-xs">
            View All Export History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}