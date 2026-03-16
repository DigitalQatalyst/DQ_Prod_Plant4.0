import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  X, 
  Calendar, 
  Clock, 
  FileText, 
  Mail,
  Download,
  Settings,
  CheckCircle
} from "lucide-react";

interface ExportSchedulingPopPaneProps {
  exportType: "energy-audit" | "emissions-audit" | "pq-compliance" | "custom";
  onClose: () => void;
  onSchedule?: (schedule: ExportSchedule) => void;
}

interface ExportSchedule {
  name: string;
  description: string;
  frequency: "once" | "daily" | "weekly" | "monthly" | "quarterly";
  startDate: string;
  time: string;
  format: "csv" | "pdf" | "xlsx" | "json";
  recipients: string[];
  includeCharts: boolean;
  includeRawData: boolean;
  compressOutput: boolean;
  retentionDays: number;
}

const exportTypeConfig = {
  "energy-audit": {
    title: "Energy Audit Export",
    description: "Comprehensive energy consumption and efficiency data",
    defaultName: "Energy Audit Report",
    suggestedFrequency: "monthly"
  },
  "emissions-audit": {
    title: "Emissions Audit Export", 
    description: "CO2 emissions data by scope and energy type",
    defaultName: "Emissions Audit Report",
    suggestedFrequency: "monthly"
  },
  "pq-compliance": {
    title: "Power Quality Compliance Export",
    description: "Power quality events and compliance metrics",
    defaultName: "PQ Compliance Pack",
    suggestedFrequency: "weekly"
  },
  "custom": {
    title: "Custom Data Export",
    description: "User-defined dataset export",
    defaultName: "Custom Export",
    suggestedFrequency: "weekly"
  }
};

export function ExportSchedulingPopPane({ 
  exportType, 
  onClose, 
  onSchedule 
}: ExportSchedulingPopPaneProps) {
  const config = exportTypeConfig[exportType];
  const [schedule, setSchedule] = useState<ExportSchedule>({
    name: config.defaultName,
    description: config.description,
    frequency: config.suggestedFrequency as any,
    startDate: new Date().toISOString().split('T')[0],
    time: "09:00",
    format: "pdf",
    recipients: [],
    includeCharts: true,
    includeRawData: false,
    compressOutput: false,
    retentionDays: 90
  });

  const [recipientInput, setRecipientInput] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);

  const addRecipient = () => {
    if (recipientInput.trim() && !schedule.recipients.includes(recipientInput.trim())) {
      setSchedule(prev => ({
        ...prev,
        recipients: [...prev.recipients, recipientInput.trim()]
      }));
      setRecipientInput("");
    }
  };

  const removeRecipient = (email: string) => {
    setSchedule(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email)
    }));
  };

  const handleSchedule = () => {
    onSchedule?.(schedule);
    setIsScheduled(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "pdf": return "📄";
      case "csv": return "📊";
      case "xlsx": return "📈";
      case "json": return "🔧";
      default: return "📁";
    }
  };

  if (isScheduled) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card border border-border rounded-lg w-full max-w-md p-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Export Scheduled Successfully</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your {config.title.toLowerCase()} has been scheduled and will run according to your settings.
            </p>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5" />
            <div>
              <h2 className="text-xl font-semibold">{config.title}</h2>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Export Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Export Name</Label>
                  <Input
                    id="name"
                    value={schedule.name}
                    onChange={(e) => setSchedule(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter export name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format">Output Format</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {["csv", "pdf", "xlsx", "json"].map((format) => (
                      <Button
                        key={format}
                        variant={schedule.format === format ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSchedule(prev => ({ ...prev, format: format as any }))}
                        className="flex items-center gap-1"
                      >
                        <span>{getFormatIcon(format)}</span>
                        {format.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={schedule.description}
                  onChange={(e) => setSchedule(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description for this export"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Schedule Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <select
                    id="frequency"
                    value={schedule.frequency}
                    onChange={(e) => setSchedule(prev => ({ ...prev, frequency: e.target.value as any }))}
                    className="w-full p-2 border border-border rounded-md bg-background"
                  >
                    <option value="once">One-time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={schedule.startDate}
                    onChange={(e) => setSchedule(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={schedule.time}
                    onChange={(e) => setSchedule(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Recipients
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  placeholder="Enter email address"
                  onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                />
                <Button onClick={addRecipient} variant="outline">
                  Add
                </Button>
              </div>

              {schedule.recipients.length > 0 && (
                <div className="space-y-2">
                  <Label>Current Recipients</Label>
                  <div className="flex flex-wrap gap-2">
                    {schedule.recipients.map((email, idx) => (
                      <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                        {email}
                        <button
                          onClick={() => removeRecipient(email)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Export Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="includeCharts">Include Charts & Visualizations</Label>
                    <p className="text-sm text-muted-foreground">Add charts and graphs to the export</p>
                  </div>
                  <Switch
                    id="includeCharts"
                    checked={schedule.includeCharts}
                    onCheckedChange={(checked) => setSchedule(prev => ({ ...prev, includeCharts: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="includeRawData">Include Raw Data</Label>
                    <p className="text-sm text-muted-foreground">Include detailed raw telemetry data</p>
                  </div>
                  <Switch
                    id="includeRawData"
                    checked={schedule.includeRawData}
                    onCheckedChange={(checked) => setSchedule(prev => ({ ...prev, includeRawData: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="compressOutput">Compress Output</Label>
                    <p className="text-sm text-muted-foreground">Create ZIP archive for large exports</p>
                  </div>
                  <Switch
                    id="compressOutput"
                    checked={schedule.compressOutput}
                    onCheckedChange={(checked) => setSchedule(prev => ({ ...prev, compressOutput: checked }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="retention">Data Retention (days)</Label>
                <Input
                  id="retention"
                  type="number"
                  value={schedule.retentionDays}
                  onChange={(e) => setSchedule(prev => ({ ...prev, retentionDays: parseInt(e.target.value) || 90 }))}
                  min={1}
                  max={365}
                />
                <p className="text-xs text-muted-foreground">
                  How long to keep exported files available for download
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Export:</span>
                  <span>{schedule.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frequency:</span>
                  <span className="capitalize">{schedule.frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format:</span>
                  <span>{schedule.format.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipients:</span>
                  <span>{schedule.recipients.length} recipient(s)</span>
                </div>
                {schedule.frequency !== "once" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next run:</span>
                    <span>{schedule.startDate} at {schedule.time}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button 
              onClick={handleSchedule} 
              disabled={!schedule.name.trim()}
              className="flex-1"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Export
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}