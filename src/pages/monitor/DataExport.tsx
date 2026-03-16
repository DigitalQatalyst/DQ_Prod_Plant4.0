import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Asset } from "@/types/navigation";
import { APMPageShell } from "@/components/apm/APMPageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
  Download,
  FileText,
  Database,
  Calendar,
  Clock,
  Settings,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  FileImage,
  Code,
  Search,
  Filter,
  Trash2,
  Eye,
  Copy,
  Share,
  RefreshCw
} from "lucide-react";

interface ExportJob {
  id: string;
  name: string;
  dataset: "telemetry" | "alerts" | "downtime" | "reliability-kpis" | "maintenance" | "custom";
  format: "csv" | "excel" | "pdf" | "json" | "api";
  status: "pending" | "running" | "completed" | "failed" | "scheduled";
  progress?: number;
  createdAt: string;
  completedAt?: string;
  fileSize?: string;
  downloadUrl?: string;
  parameters: {
    dateRange: string;
    assetFilter?: string[];
    includeHeaders: boolean;
    compression?: boolean;
    schedule?: {
      frequency: "once" | "daily" | "weekly" | "monthly";
      time?: string;
      enabled: boolean;
    };
  };
  error?: string;
}

const exportHistory: ExportJob[] = [
  {
    id: "export-001",
    name: "Weekly Telemetry Data",
    dataset: "telemetry",
    format: "csv",
    status: "completed",
    progress: 100,
    createdAt: "2024-01-15T10:30:00Z",
    completedAt: "2024-01-15T10:32:15Z",
    fileSize: "12.4 MB",
    downloadUrl: "#",
    parameters: {
      dateRange: "7d",
      assetFilter: ["WH-01", "GC-11", "ESP-07"],
      includeHeaders: true,
      compression: true,
      schedule: {
        frequency: "weekly",
        time: "10:30",
        enabled: true
      }
    }
  },
  {
    id: "export-002",
    name: "Monthly Reliability KPIs",
    dataset: "reliability-kpis",
    format: "excel",
    status: "completed",
    progress: 100,
    createdAt: "2024-01-15T08:00:00Z",
    completedAt: "2024-01-15T08:01:45Z",
    fileSize: "2.8 MB",
    downloadUrl: "#",
    parameters: {
      dateRange: "30d",
      includeHeaders: true,
      compression: false,
      schedule: {
        frequency: "monthly",
        time: "08:00",
        enabled: true
      }
    }
  },
  {
    id: "export-003",
    name: "Alert History Export",
    dataset: "alerts",
    format: "json",
    status: "running",
    progress: 65,
    createdAt: "2024-01-15T14:45:00Z",
    parameters: {
      dateRange: "90d",
      includeHeaders: true,
      compression: true,
      schedule: {
        frequency: "once",
        enabled: false
      }
    }
  },
  {
    id: "export-004",
    name: "Downtime Analysis Data",
    dataset: "downtime",
    format: "csv",
    status: "failed",
    createdAt: "2024-01-15T12:20:00Z",
    fileSize: "0 MB",
    parameters: {
      dateRange: "30d",
      includeHeaders: true,
      compression: false,
      schedule: {
        frequency: "once",
        enabled: false
      }
    },
    error: "Database connection timeout"
  },
  {
    id: "export-005",
    name: "Maintenance Records",
    dataset: "maintenance",
    format: "pdf",
    status: "scheduled",
    createdAt: "2024-01-15T16:00:00Z",
    parameters: {
      dateRange: "30d",
      includeHeaders: true,
      schedule: {
        frequency: "monthly",
        time: "16:00",
        enabled: true
      }
    }
  }
];

export function DataExport() {
  const { assets, selectedAsset, setSelectedAsset, sector, subsector } = useApp();
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<Asset | null>(null);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>(exportHistory);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");

  // Export form state
  const [exportName, setExportName] = useState("");
  const [selectedDataset, setSelectedDataset] = useState<string>("telemetry");
  const [selectedFormat, setSelectedFormat] = useState<string>("csv");
  const [dateRange, setDateRange] = useState<string>("7d");
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [useCompression, setUseCompression] = useState(false);
  const [scheduleType, setScheduleType] = useState<string>("once");
  const [scheduleTime, setScheduleTime] = useState("08:00");

  // Use local state for this page, but update global context when asset is selected
  const handleAssetSelect = (asset: Asset) => {
    setSelectedAssetLocal(asset);
    setSelectedAsset(asset);
  };

  const currentAsset = selectedAssetLocal || selectedAsset;

  const getDatasetIcon = (dataset: ExportJob["dataset"]) => {
    switch (dataset) {
      case "telemetry":
        return <Database className="h-4 w-4 text-blue-500" />;
      case "alerts":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "downtime":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "reliability-kpis":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "maintenance":
        return <Settings className="h-4 w-4 text-purple-500" />;
      case "custom":
        return <Code className="h-4 w-4 text-gray-500" />;
    }
  };

  const getFormatIcon = (format: ExportJob["format"]) => {
    switch (format) {
      case "csv":
        return <FileText className="h-4 w-4 text-green-500" />;
      case "excel":
        return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
      case "pdf":
        return <FileImage className="h-4 w-4 text-red-500" />;
      case "json":
        return <Code className="h-4 w-4 text-blue-500" />;
      case "api":
        return <Database className="h-4 w-4 text-purple-500" />;
    }
  };

  const getStatusIcon = (status: ExportJob["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "running":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "scheduled":
        return <Calendar className="h-4 w-4 text-purple-500" />;
    }
  };

  const getStatusColor = (status: ExportJob["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50 border-green-200";
      case "running":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "failed":
        return "text-red-600 bg-red-50 border-red-200";
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "scheduled":
        return "text-purple-600 bg-purple-50 border-purple-200";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getFilteredJobs = () => {
    let filtered = exportJobs;

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.dataset.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    if (formatFilter !== "all") {
      filtered = filtered.filter(job => job.format === formatFilter);
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const filteredJobs = getFilteredJobs();

  const handleCreateExport = () => {
    if (!exportName.trim()) return;

    const newExport: ExportJob = {
      id: `export-${Date.now()}`,
      name: exportName,
      dataset: selectedDataset as ExportJob["dataset"],
      format: selectedFormat as ExportJob["format"],
      status: "pending",
      progress: 0,
      createdAt: new Date().toISOString(),
      parameters: {
        dateRange,
        assetFilter: selectedAssets.length > 0 ? selectedAssets : undefined,
        includeHeaders,
        compression: useCompression,
        schedule: {
          frequency: scheduleType as "once" | "daily" | "weekly" | "monthly",
          time: scheduleType !== "once" ? scheduleTime : undefined,
          enabled: scheduleType !== "once"
        }
      }
    };

    setExportJobs([newExport, ...exportJobs]);
    
    // Reset form
    setExportName("");
    setSelectedDataset("telemetry");
    setSelectedFormat("csv");
    setDateRange("7d");
    setSelectedAssets([]);
    setIncludeHeaders(true);
    setUseCompression(false);
    setScheduleType("once");
    setScheduleTime("08:00");

    // Simulate export process
    setTimeout(() => {
      setExportJobs(prev => prev.map(job => 
        job.id === newExport.id 
          ? { ...job, status: "running", progress: 10 }
          : job
      ));
    }, 1000);

    setTimeout(() => {
      setExportJobs(prev => prev.map(job => 
        job.id === newExport.id 
          ? { 
              ...job, 
              status: "completed", 
              progress: 100,
              completedAt: new Date().toISOString(),
              fileSize: `${Math.random() * 10 + 1}MB`,
              downloadUrl: "#"
            }
          : job
      ));
    }, 5000);
  };

  const handleDeleteJob = (jobId: string) => {
    setExportJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const handleRetryJob = (jobId: string) => {
    setExportJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { ...job, status: "pending", progress: 0, error: undefined }
        : job
    ));
  };

  return (
    <APMPageShell
      title="Data Export (PDF, CSV, APIs)"
      featureSetName="Alerts, Reports & Visualisation"
      featureName="Data Export (PDF, CSV, APIs)"
      listType="assets"
      assets={assets}
      selectedAsset={currentAsset}
      onAssetSelect={handleAssetSelect}
    >
      <div className="space-y-6">
        {/* Export Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Exports</p>
                  <p className="text-2xl font-bold">{exportJobs.length}</p>
                </div>
                <Download className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {exportJobs.filter(j => j.status === "completed").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Running</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {exportJobs.filter(j => j.status === "running").length}
                  </p>
                </div>
                <RefreshCw className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {exportJobs.filter(j => j.status === "scheduled").length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Create New Export
            </CardTitle>
            <CardDescription>
              Configure and schedule data exports in multiple formats
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Configuration */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="export-name">Export Name</Label>
                  <Input
                    id="export-name"
                    value={exportName}
                    onChange={(e) => setExportName(e.target.value)}
                    placeholder="Enter export name..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="dataset">Dataset</Label>
                  <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="telemetry">Telemetry Data</SelectItem>
                      <SelectItem value="alerts">Alerts & Events</SelectItem>
                      <SelectItem value="downtime">Downtime Events</SelectItem>
                      <SelectItem value="reliability-kpis">Reliability KPIs</SelectItem>
                      <SelectItem value="maintenance">Maintenance Records</SelectItem>
                      <SelectItem value="custom">Custom Query</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="format">Export Format</Label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="excel">Excel (XLSX)</SelectItem>
                      <SelectItem value="pdf">PDF Report</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="api">API Endpoint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="date-range">Date Range</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1d">Last 24 Hours</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="90d">Last 90 Days</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Advanced Configuration */}
              <div className="space-y-4">
                <div>
                  <Label>Asset Filter (Optional)</Label>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                    {assets.slice(0, 5).map((asset) => (
                      <div key={asset.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`asset-${asset.id}`}
                          checked={selectedAssets.includes(asset.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAssets([...selectedAssets, asset.id]);
                            } else {
                              setSelectedAssets(selectedAssets.filter(id => id !== asset.id));
                            }
                          }}
                        />
                        <Label htmlFor={`asset-${asset.id}`} className="text-sm">
                          {asset.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Export Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-headers"
                        checked={includeHeaders}
                        onCheckedChange={setIncludeHeaders}
                      />
                      <Label htmlFor="include-headers" className="text-sm">
                        Include column headers
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="use-compression"
                        checked={useCompression}
                        onCheckedChange={setUseCompression}
                      />
                      <Label htmlFor="use-compression" className="text-sm">
                        Compress output file
                      </Label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label>Schedule</Label>
                  <RadioGroup value={scheduleType} onValueChange={setScheduleType} className="mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="once" id="once" />
                      <Label htmlFor="once" className="text-sm">Export once now</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="daily" id="daily" />
                      <Label htmlFor="daily" className="text-sm">Daily at</Label>
                      {scheduleType === "daily" && (
                        <Input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="w-24 ml-2"
                        />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="weekly" id="weekly" />
                      <Label htmlFor="weekly" className="text-sm">Weekly at</Label>
                      {scheduleType === "weekly" && (
                        <Input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="w-24 ml-2"
                        />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="monthly" id="monthly" />
                      <Label htmlFor="monthly" className="text-sm">Monthly at</Label>
                      {scheduleType === "monthly" && (
                        <Input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="w-24 ml-2"
                        />
                      )}
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-end">
              <Button onClick={handleCreateExport} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Create Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Export History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Export History
                </CardTitle>
                <CardDescription>
                  Track and manage your data export jobs
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search exports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-[200px]"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={formatFilter} onValueChange={setFormatFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Formats</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <div 
                  key={job.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2 mt-1">
                      {getDatasetIcon(job.dataset)}
                      {getFormatIcon(job.format)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{job.name}</h3>
                        <Badge variant="outline" className={getStatusColor(job.status)}>
                          {getStatusIcon(job.status)}
                          <span className="ml-1">{job.status}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Dataset: {job.dataset}</span>
                        <span>Format: {job.format.toUpperCase()}</span>
                        <span>Created: {formatTimestamp(job.createdAt)}</span>
                        {job.fileSize && <span>Size: {job.fileSize}</span>}
                      </div>
                      {job.status === "running" && job.progress !== undefined && (
                        <div className="w-48">
                          <Progress value={job.progress} className="h-2" />
                          <span className="text-xs text-muted-foreground">{job.progress}% complete</span>
                        </div>
                      )}
                      {job.error && (
                        <div className="text-xs text-red-600">
                          Error: {job.error}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {job.status === "completed" && (
                      <Button size="sm" variant="outline" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    )}
                    
                    {job.status === "failed" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleRetryJob(job.id)}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Retry
                      </Button>
                    )}
                    
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Details
                    </Button>
                    
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeleteJob(job.id)}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
              
              {filteredJobs.length === 0 && (
                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                  No export jobs match the current filters
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* API Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              API Endpoints
            </CardTitle>
            <CardDescription>
              Programmatic access to your APM data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-green-600 bg-green-50">GET</Badge>
                    <code className="text-sm">/api/v1/telemetry</code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Retrieve telemetry data for specified assets and time range
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-green-600 bg-green-50">GET</Badge>
                    <code className="text-sm">/api/v1/alerts</code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Access alert and event history with filtering options
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-green-600 bg-green-50">GET</Badge>
                    <code className="text-sm">/api/v1/reliability</code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Retrieve reliability KPIs and performance metrics
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-green-600 bg-green-50">GET</Badge>
                    <code className="text-sm">/api/v1/downtime</code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Access downtime events and maintenance records
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  API Documentation
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Generate API Key
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </APMPageShell>
  );
}