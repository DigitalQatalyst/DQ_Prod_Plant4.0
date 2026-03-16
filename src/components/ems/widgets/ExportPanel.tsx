import { Download, FileText, Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ExportJob {
  id: string;
  dataset: string;
  format: "csv" | "pdf" | "xlsx" | "api";
  requestedAt: string;
  status: "pending" | "processing" | "completed" | "failed";
  deliveredAt?: string;
  fileSize?: string;
  downloadUrl?: string;
}

interface ExportPack {
  id: string;
  name: string;
  description: string;
  datasets: string[];
  formats: string[];
}

interface ExportPanelProps {
  exportHistory?: ExportJob[];
  exportPacks?: ExportPack[];
  onExport?: (dataset: string, format: string) => void;
  onScheduleExport?: () => void;
  onDownload?: (job: ExportJob) => void;
}

export function ExportPanel({
  exportHistory = [],
  exportPacks = [],
  onExport,
  onScheduleExport,
  onDownload,
}: ExportPanelProps) {
  // Default mock data if no export history provided
  const defaultExportHistory: ExportJob[] = [
    {
      id: "exp-001",
      dataset: "Energy Consumption Report",
      format: "pdf",
      requestedAt: "2024-01-15T10:30:00Z",
      status: "completed",
      deliveredAt: "2024-01-15T10:32:00Z",
      fileSize: "2.4 MB",
      downloadUrl: "/downloads/energy-report-001.pdf"
    },
    {
      id: "exp-002", 
      dataset: "Emissions Data Export",
      format: "xlsx",
      requestedAt: "2024-01-14T16:45:00Z",
      status: "completed",
      deliveredAt: "2024-01-14T16:47:00Z",
      fileSize: "1.8 MB",
      downloadUrl: "/downloads/emissions-data-002.xlsx"
    },
    {
      id: "exp-003",
      dataset: "Power Quality Analysis",
      format: "csv",
      requestedAt: "2024-01-14T09:15:00Z",
      status: "processing",
      fileSize: undefined,
      downloadUrl: undefined
    },
    {
      id: "exp-004",
      dataset: "Cost Analysis Report",
      format: "pdf",
      requestedAt: "2024-01-13T14:20:00Z",
      status: "failed",
      fileSize: undefined,
      downloadUrl: undefined
    }
  ];

  const defaultExportPacks: ExportPack[] = [
    {
      id: "pack-001",
      name: "Energy Audit Pack",
      description: "Complete energy consumption, cost, and efficiency analysis",
      datasets: ["energy-consumption", "cost-analysis", "efficiency-metrics"],
      formats: ["pdf", "xlsx", "csv"]
    },
    {
      id: "pack-002",
      name: "Emissions Audit Pack", 
      description: "Comprehensive emissions data and compliance reporting",
      datasets: ["emissions-data", "compliance-status", "carbon-footprint"],
      formats: ["pdf", "xlsx"]
    },
    {
      id: "pack-003",
      name: "PQ Compliance Pack",
      description: "Power quality metrics and compliance documentation",
      datasets: ["power-quality", "voltage-events", "harmonic-analysis"],
      formats: ["pdf", "csv"]
    }
  ];

  const displayExportHistory = exportHistory.length > 0 ? exportHistory : defaultExportHistory;
  const displayExportPacks = exportPacks.length > 0 ? exportPacks : defaultExportPacks;
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "processing":
        return <Clock className="w-4 h-4 text-warning animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default" as const;
      case "failed":
        return "destructive" as const;
      case "processing":
        return "secondary" as const;
      default:
        return "secondary" as const;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "pdf":
        return "📄";
      case "xlsx":
        return "📊";
      case "csv":
        return "📋";
      case "api":
        return "🔗";
      default:
        return "📁";
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Controls */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          Data Export & Reporting
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Export */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold">Quick Export</h4>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Select>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="energy-consumption">Energy Consumption</SelectItem>
                    <SelectItem value="cost-analysis">Cost Analysis</SelectItem>
                    <SelectItem value="emissions-data">Emissions Data</SelectItem>
                    <SelectItem value="power-quality">Power Quality</SelectItem>
                    <SelectItem value="anomalies">Anomalies</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xlsx">Excel</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button 
                  className="flex-1 gap-2" 
                  onClick={() => onExport?.("energy-consumption", "csv")}
                >
                  <Download className="w-4 h-4" />
                  Export Now
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onScheduleExport}
                  className="gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule
                </Button>
              </div>
            </div>
          </div>

          {/* Export Packs */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold">Export Packs</h4>
            <div className="space-y-2">
              {displayExportPacks.map((pack) => (
                <div key={pack.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{pack.name}</p>
                    <p className="text-xs text-muted-foreground">{pack.description}</p>
                    <div className="flex gap-1 mt-1">
                      {pack.formats.map((format) => (
                        <span key={format} className="text-xs">
                          {getFormatIcon(format)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Export Pack
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Export History */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Export History
        </h4>
        
        {displayExportHistory.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No export history available</p>
            <p className="text-sm text-muted-foreground">Your export jobs will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayExportHistory.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{job.dataset}</p>
                      <Badge variant="outline" className="text-xs">
                        {job.format.toUpperCase()}
                      </Badge>
                      <Badge variant={getStatusVariant(job.status)} className="text-xs">
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Requested {new Date(job.requestedAt).toLocaleString()}
                      {job.deliveredAt && (
                        <> • Completed {new Date(job.deliveredAt).toLocaleString()}</>
                      )}
                      {job.fileSize && <> • {job.fileSize}</>}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {job.status === "completed" && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onDownload?.(job)}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  )}
                  {job.status === "failed" && (
                    <Button size="sm" variant="outline">
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Access */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-semibold mb-4">API Access</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Real-time Data API</p>
            <p className="text-xs text-muted-foreground font-mono bg-secondary/50 p-2 rounded">
              GET /api/v1/energy/realtime
            </p>
            <Button size="sm" variant="outline" className="w-full">
              Generate API Key
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Bulk Data Export</p>
            <p className="text-xs text-muted-foreground font-mono bg-secondary/50 p-2 rounded">
              POST /api/v1/energy/export
            </p>
            <Button size="sm" variant="outline" className="w-full">
              View Documentation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}