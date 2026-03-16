import { Calendar, Clock, FileText, Settings, Send, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly" | "quarterly";
  lastRunAt?: string;
  category: "energy" | "emissions" | "compliance" | "cost";
}

interface ReportBuilderShellProps {
  templates?: ReportTemplate[];
  template?: ReportTemplate; // Single template prop for compatibility
  selectedTemplate?: ReportTemplate;
  onTemplateSelect?: (template: ReportTemplate) => void;
  onSchedule?: (config: any) => void;
  onGenerate?: (template: ReportTemplate | any) => void;
  onClose?: () => void; // Add onClose prop for PopPane usage
  isPopPane?: boolean;
}

export function ReportBuilderShell({
  templates = [],
  template,
  selectedTemplate,
  onTemplateSelect,
  onSchedule,
  onGenerate,
  onClose,
  isPopPane = false,
}: ReportBuilderShellProps) {
  // Default mock templates if none provided
  const defaultTemplates: ReportTemplate[] = [
    {
      id: "esg-monthly",
      name: "ESG Monthly Report",
      description: "Comprehensive monthly ESG performance report",
      frequency: "monthly",
      lastRunAt: "2024-01-15T10:00:00Z",
      category: "emissions"
    },
    {
      id: "emissions-summary",
      name: "Emissions Summary",
      description: "Detailed emissions tracking and analysis",
      frequency: "weekly",
      lastRunAt: "2024-01-14T16:30:00Z",
      category: "emissions"
    },
    {
      id: "intensity-scorecard",
      name: "Energy Intensity Scorecard",
      description: "Energy intensity metrics and benchmarking",
      frequency: "monthly",
      lastRunAt: "2024-01-10T09:15:00Z",
      category: "energy"
    },
    {
      id: "compliance-audit",
      name: "Compliance Audit Report",
      description: "Regulatory compliance status and documentation",
      frequency: "quarterly",
      lastRunAt: "2024-01-01T08:00:00Z",
      category: "compliance"
    }
  ];

  const displayTemplates = templates.length > 0 ? templates : defaultTemplates;
  const currentTemplate = template || selectedTemplate;
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "energy":
        return "bg-blue-500/10 text-blue-500";
      case "emissions":
        return "bg-green-500/10 text-green-500";
      case "compliance":
        return "bg-orange-500/10 text-orange-500";
      case "cost":
        return "bg-purple-500/10 text-purple-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case "daily":
        return "📅";
      case "weekly":
        return "📊";
      case "monthly":
        return "📈";
      case "quarterly":
        return "📋";
      default:
        return "📄";
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      {!isPopPane && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Report Templates
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {displayTemplates.map((template) => (
              <div
                key={template.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedTemplate?.id === template.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => onTemplateSelect?.(template)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getFrequencyIcon(template.frequency)}</span>
                    <h4 className="font-medium">{template.name}</h4>
                  </div>
                  <Badge className={getCategoryColor(template.category)}>
                    {template.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground capitalize">
                    {template.frequency} report
                  </span>
                  {template.lastRunAt && (
                    <span className="text-muted-foreground">
                      Last run: {new Date(template.lastRunAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Configuration */}
      {(currentTemplate || isPopPane) && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Report Configuration
          </h4>
          
          <div className="space-y-4">
            {/* Basic Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="report-name">Report Name</Label>
                <Input 
                  id="report-name" 
                  defaultValue={currentTemplate?.name || "Custom Report"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="report-format">Format</Label>
                <Select defaultValue="pdf">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Report</SelectItem>
                    <SelectItem value="xlsx">Excel Workbook</SelectItem>
                    <SelectItem value="csv">CSV Data</SelectItem>
                    <SelectItem value="email">Email Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input 
                  id="start-date" 
                  type="date" 
                  defaultValue={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input 
                  id="end-date" 
                  type="date" 
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Data Sections */}
            <div className="space-y-2">
              <Label>Include Sections</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="energy-consumption" defaultChecked />
                  <Label htmlFor="energy-consumption" className="text-sm">Energy Consumption</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="cost-analysis" defaultChecked />
                  <Label htmlFor="cost-analysis" className="text-sm">Cost Analysis</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="emissions" defaultChecked />
                  <Label htmlFor="emissions" className="text-sm">CO₂ Emissions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="power-quality" />
                  <Label htmlFor="power-quality" className="text-sm">Power Quality</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="anomalies" />
                  <Label htmlFor="anomalies" className="text-sm">Anomalies</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="recommendations" />
                  <Label htmlFor="recommendations" className="text-sm">AI Recommendations</Label>
                </div>
              </div>
            </div>

            {/* Recipients */}
            <div className="space-y-2">
              <Label htmlFor="recipients">Email Recipients</Label>
              <Textarea 
                id="recipients"
                placeholder="Enter email addresses separated by commas"
                className="h-20"
              />
            </div>

            {/* Schedule Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="schedule-report" />
                <Label htmlFor="schedule-report" className="text-sm font-medium">
                  Schedule recurring reports
                </Label>
              </div>
              
              <div className="grid grid-cols-3 gap-4 ml-6">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select defaultValue="monthly">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="day-of-month">Day of Month</Label>
                  <Select defaultValue="1">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st</SelectItem>
                      <SelectItem value="15">15th</SelectItem>
                      <SelectItem value="last">Last day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input 
                    id="time" 
                    type="time" 
                    defaultValue="09:00"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {(selectedTemplate || isPopPane) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Save className="w-4 h-4" />
              Save Template
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => onSchedule?.({})}
              className="gap-2"
            >
              <Calendar className="w-4 h-4" />
              Schedule
            </Button>
            <Button 
              onClick={() => selectedTemplate && onGenerate?.(selectedTemplate)}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              Generate Report
            </Button>
          </div>
        </div>
      )}

      {/* Preview */}
      {selectedTemplate && !isPopPane && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-md font-semibold mb-4">Report Preview</h4>
          <div className="bg-secondary/30 rounded-lg p-6 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-2">Report preview will appear here</p>
            <p className="text-sm text-muted-foreground">
              Generate a report to see the preview
            </p>
          </div>
        </div>
      )}
    </div>
  );
}