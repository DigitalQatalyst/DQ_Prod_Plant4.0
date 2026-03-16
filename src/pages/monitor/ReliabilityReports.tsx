import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Asset } from "@/types/navigation";
import { APMPageShell } from "@/components/apm/APMPageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { reliabilityMetrics } from "@/data/apmUpstreamData";
import { 
  FileBarChart,
  Plus,
  Calendar,
  Download,
  Eye,
  Settings,
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity,
  Wrench,
  Zap,
  Users,
  Mail,
  FileText,
  Filter,
  Search
} from "lucide-react";

interface ReliabilityReport {
  id: string;
  name: string;
  type: "weekly-reliability" | "monthly-bad-actors" | "maintenance-effectiveness" | "custom";
  description: string;
  schedule: {
    frequency: "daily" | "weekly" | "monthly" | "quarterly";
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
  };
  recipients: string[];
  format: "pdf" | "excel" | "csv";
  isActive: boolean;
  lastGenerated?: string;
  nextGeneration: string;
  createdAt: string;
  parameters: {
    dateRange: string;
    assetFilter?: string[];
    includeCharts: boolean;
    includeTrends: boolean;
    includeRecommendations: boolean;
  };
}

interface ReportHistory {
  id: string;
  reportId: string;
  reportName: string;
  generatedAt: string;
  format: string;
  size: string;
  status: "completed" | "failed" | "generating";
  downloadUrl?: string;
}

const defaultReports: ReliabilityReport[] = [
  {
    id: "report-weekly-reliability",
    name: "Weekly Reliability Summary",
    type: "weekly-reliability",
    description: "Comprehensive weekly report covering MTBF, MTTR, availability, and key reliability metrics",
    schedule: {
      frequency: "weekly",
      dayOfWeek: 1, // Monday
      time: "08:00"
    },
    recipients: ["operations@company.com", "maintenance@company.com"],
    format: "pdf",
    isActive: true,
    lastGenerated: "2024-01-15T08:00:00Z",
    nextGeneration: "2024-01-22T08:00:00Z",
    createdAt: "2024-01-01T10:00:00Z",
    parameters: {
      dateRange: "7d",
      includeCharts: true,
      includeTrends: true,
      includeRecommendations: true
    }
  },
  {
    id: "report-monthly-bad-actors",
    name: "Monthly Bad Actors Analysis",
    type: "monthly-bad-actors",
    description: "Monthly analysis of worst-performing assets with root cause analysis and improvement recommendations",
    schedule: {
      frequency: "monthly",
      dayOfMonth: 1,
      time: "09:00"
    },
    recipients: ["reliability@company.com", "management@company.com"],
    format: "pdf",
    isActive: true,
    lastGenerated: "2024-01-01T09:00:00Z",
    nextGeneration: "2024-02-01T09:00:00Z",
    createdAt: "2024-01-01T10:00:00Z",
    parameters: {
      dateRange: "30d",
      includeCharts: true,
      includeTrends: true,
      includeRecommendations: true
    }
  },
  {
    id: "report-maintenance-effectiveness",
    name: "Maintenance Effectiveness Report",
    type: "maintenance-effectiveness",
    description: "Analysis of maintenance activities effectiveness, cost optimization, and performance improvements",
    schedule: {
      frequency: "monthly",
      dayOfMonth: 15,
      time: "10:00"
    },
    recipients: ["maintenance@company.com", "finance@company.com"],
    format: "excel",
    isActive: true,
    lastGenerated: "2024-01-15T10:00:00Z",
    nextGeneration: "2024-02-15T10:00:00Z",
    createdAt: "2024-01-01T10:00:00Z",
    parameters: {
      dateRange: "30d",
      includeCharts: true,
      includeTrends: false,
      includeRecommendations: true
    }
  }
];

const reportHistory: ReportHistory[] = [
  {
    id: "history-001",
    reportId: "report-weekly-reliability",
    reportName: "Weekly Reliability Summary",
    generatedAt: "2024-01-15T08:00:00Z",
    format: "PDF",
    size: "2.4 MB",
    status: "completed",
    downloadUrl: "#"
  },
  {
    id: "history-002",
    reportId: "report-monthly-bad-actors",
    reportName: "Monthly Bad Actors Analysis",
    generatedAt: "2024-01-01T09:00:00Z",
    format: "PDF",
    size: "3.1 MB",
    status: "completed",
    downloadUrl: "#"
  },
  {
    id: "history-003",
    reportId: "report-maintenance-effectiveness",
    reportName: "Maintenance Effectiveness Report",
    generatedAt: "2024-01-15T10:00:00Z",
    format: "Excel",
    size: "1.8 MB",
    status: "completed",
    downloadUrl: "#"
  },
  {
    id: "history-004",
    reportId: "report-weekly-reliability",
    reportName: "Weekly Reliability Summary",
    generatedAt: "2024-01-08T08:00:00Z",
    format: "PDF",
    size: "2.2 MB",
    status: "completed",
    downloadUrl: "#"
  },
  {
    id: "history-005",
    reportId: "report-custom-001",
    reportName: "Custom Asset Performance Report",
    generatedAt: "2024-01-14T14:30:00Z",
    format: "CSV",
    size: "0.8 MB",
    status: "completed",
    downloadUrl: "#"
  }
];

export function ReliabilityReports() {
  const { assets, selectedAsset, setSelectedAsset, sector, subsector, setIsPopPaneOpen, setPopPaneContent } = useApp();
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<Asset | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReliabilityReport | null>(null);
  const [reports, setReports] = useState<ReliabilityReport[]>(defaultReports);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isCreateReportOpen, setIsCreateReportOpen] = useState(false);

  const handleScheduleReport = () => {
    setPopPaneContent({
      type: "report-schedule-form",
      data: null
    });
    setIsPopPaneOpen(true);
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Use local state for this page, but update global context when asset is selected
  const handleAssetSelect = (asset: Asset) => {
    setSelectedAssetLocal(asset);
    setSelectedAsset(asset);
  };

  const currentAsset = selectedAssetLocal || selectedAsset;

  const getReportTypeIcon = (type: ReliabilityReport["type"]) => {
    switch (type) {
      case "weekly-reliability":
        return <BarChart3 className="h-4 w-4 text-blue-500" />;
      case "monthly-bad-actors":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "maintenance-effectiveness":
        return <Wrench className="h-4 w-4 text-green-500" />;
      case "custom":
        return <Settings className="h-4 w-4 text-purple-500" />;
    }
  };

  const getReportTypeColor = (type: ReliabilityReport["type"]) => {
    switch (type) {
      case "weekly-reliability":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "monthly-bad-actors":
        return "text-red-600 bg-red-50 border-red-200";
      case "maintenance-effectiveness":
        return "text-green-600 bg-green-50 border-green-200";
      case "custom":
        return "text-purple-600 bg-purple-50 border-purple-200";
    }
  };

  const getStatusIcon = (status: ReportHistory["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "generating":
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const formatSchedule = (schedule: ReliabilityReport["schedule"]) => {
    const { frequency, dayOfWeek, dayOfMonth, time } = schedule;
    
    switch (frequency) {
      case "daily":
        return `Daily at ${time}`;
      case "weekly":
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return `Weekly on ${days[dayOfWeek || 0]} at ${time}`;
      case "monthly":
        return `Monthly on day ${dayOfMonth} at ${time}`;
      case "quarterly":
        return `Quarterly at ${time}`;
      default:
        return "Not scheduled";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getFilteredHistory = () => {
    let filtered = reportHistory;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.reportName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    return filtered.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  };

  const filteredHistory = getFilteredHistory();

  return (
    <APMPageShell
      title="Automated Reliability Reports"
      featureSetName="Alerts, Reports & Visualisation"
      featureName="Automated Reliability Reports"
      listType="assets"
      assets={assets}
      selectedAsset={currentAsset}
      onAssetSelect={handleAssetSelect}
      actions={
        <div className="flex items-center gap-2">
          <Dialog open={isCreateReportOpen} onOpenChange={setIsCreateReportOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Custom Report</DialogTitle>
                <DialogDescription>
                  Configure a new automated reliability report
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="report-name">Report Name</Label>
                    <Input id="report-name" placeholder="Enter report name..." />
                  </div>
                  <div>
                    <Label htmlFor="report-type">Report Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly-reliability">Weekly Reliability</SelectItem>
                        <SelectItem value="monthly-bad-actors">Monthly Bad Actors</SelectItem>
                        <SelectItem value="maintenance-effectiveness">Maintenance Effectiveness</SelectItem>
                        <SelectItem value="custom">Custom Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="report-description">Description</Label>
                  <Textarea id="report-description" placeholder="Enter report description..." />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="format">Format</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input id="time" type="time" defaultValue="08:00" />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="recipients">Recipients (comma-separated emails)</Label>
                  <Input id="recipients" placeholder="user1@company.com, user2@company.com" />
                </div>
                
                <div className="space-y-2">
                  <Label>Report Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="include-charts" defaultChecked />
                      <Label htmlFor="include-charts">Include charts and visualizations</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="include-trends" defaultChecked />
                      <Label htmlFor="include-trends">Include trend analysis</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="include-recommendations" defaultChecked />
                      <Label htmlFor="include-recommendations">Include recommendations</Label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateReportOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsCreateReportOpen(false)}>
                    Create Report
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Report Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Reports</p>
                  <p className="text-2xl font-bold">{reports.filter(r => r.isActive).length}</p>
                </div>
                <FileBarChart className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Generated This Month</p>
                  <p className="text-2xl font-bold">{reportHistory.filter(h => h.status === "completed").length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Recipients</p>
                  <p className="text-2xl font-bold">
                    {new Set(reports.flatMap(r => r.recipients)).size}
                  </p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Next Report</p>
                  <p className="text-sm font-bold">
                    {new Date(Math.min(...reports.map(r => new Date(r.nextGeneration).getTime()))).toLocaleDateString()}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scheduled Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Scheduled Reports
            </CardTitle>
            <CardDescription>
              Automated reports with scheduled generation and distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.map((report) => (
                <div 
                  key={report.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getReportTypeIcon(report.type)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{report.name}</h3>
                        <Badge variant="outline" className={getReportTypeColor(report.type)}>
                          {report.type.replace("-", " ")}
                        </Badge>
                        {report.isActive ? (
                          <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600 bg-gray-50 border-gray-200">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatSchedule(report.schedule)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {report.recipients.length} recipient{report.recipients.length > 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {report.format.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-right text-xs text-muted-foreground">
                      {report.lastGenerated && (
                        <div>Last: {formatTimestamp(report.lastGenerated)}</div>
                      )}
                      <div>Next: {formatTimestamp(report.nextGeneration)}</div>
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleScheduleReport}
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Schedule
                    </Button>
                    
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                    
                    <Button size="sm" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Generate Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Report History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Report History
                </CardTitle>
                <CardDescription>
                  Previously generated reports and download history
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-[200px]"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="generating">Generating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredHistory.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <div>
                        <h4 className="font-medium">{item.reportName}</h4>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Generated: {formatTimestamp(item.generatedAt)}</span>
                          <span>Format: {item.format}</span>
                          <span>Size: {item.size}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={
                      item.status === "completed" ? "text-green-600 bg-green-50 border-green-200" :
                      item.status === "failed" ? "text-red-600 bg-red-50 border-red-200" :
                      "text-yellow-600 bg-yellow-50 border-yellow-200"
                    }>
                      {item.status}
                    </Badge>
                    
                    {item.status === "completed" && (
                      <Button size="sm" variant="outline" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    )}
                    
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
              
              {filteredHistory.length === 0 && (
                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                  No reports match the current filters
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Report Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Report Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                </div>
                <p className="text-2xl font-bold">98.5%</p>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Avg. Generation Time</span>
                </div>
                <p className="text-2xl font-bold">2.3m</p>
                <p className="text-xs text-muted-foreground">Per report</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Total Downloads</span>
                </div>
                <p className="text-2xl font-bold">1,247</p>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Storage Used</span>
                </div>
                <p className="text-2xl font-bold">156 MB</p>
                <p className="text-xs text-muted-foreground">Report archive</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </APMPageShell>
  );
}