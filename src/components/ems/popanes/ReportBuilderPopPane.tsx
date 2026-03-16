import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { 
  X, 
  FileText, 
  Calendar, 
  Clock, 
  Send,
  Settings,
  CheckCircle,
  Download
} from "lucide-react";
import { ReportTemplate } from "@/data/mockData";

interface ReportBuilderPopPaneProps {
  template?: ReportTemplate;
  onClose: () => void;
  onGenerate?: (config: ReportConfig) => void;
  onSchedule?: (config: ReportConfig) => void;
}

interface ReportConfig {
  name: string;
  format: "pdf" | "xlsx" | "csv" | "email";
  startDate: string;
  endDate: string;
  sections: {
    energyConsumption: boolean;
    costAnalysis: boolean;
    emissions: boolean;
    powerQuality: boolean;
    anomalies: boolean;
    recommendations: boolean;
  };
  recipients: string[];
  schedule?: {
    enabled: boolean;
    frequency: "daily" | "weekly" | "monthly" | "quarterly";
    dayOfMonth: number;
    time: string;
  };
}

export function ReportBuilderPopPane({ 
  template, 
  onClose, 
  onGenerate, 
  onSchedule 
}: ReportBuilderPopPaneProps) {
  const [config, setConfig] = useState<ReportConfig>({
    name: template?.name || "Custom ESG Report",
    format: "pdf",
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    sections: {
      energyConsumption: true,
      costAnalysis: true,
      emissions: true,
      powerQuality: false,
      anomalies: false,
      recommendations: false
    },
    recipients: [],
    schedule: {
      enabled: false,
      frequency: "monthly",
      dayOfMonth: 1,
      time: "09:00"
    }
  });

  const [recipientInput, setRecipientInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const addRecipient = () => {
    if (recipientInput.trim() && !config.recipients.includes(recipientInput.trim())) {
      setConfig(prev => ({
        ...prev,
        recipients: [...prev.recipients, recipientInput.trim()]
      }));
      setRecipientInput("");
    }
  };

  const removeRecipient = (email: string) => {
    setConfig(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email)
    }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    onGenerate?.(config);
    setIsGenerating(false);
    setIsGenerated(true);
    
    // Auto-close after showing success
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleSchedule = () => {
    onSchedule?.(config);
    onClose();
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "pdf": return "📄";
      case "xlsx": return "📈";
      case "csv": return "📊";
      case "email": return "📧";
      default: return "📁";
    }
  };

  if (isGenerated) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card border border-border rounded-lg w-full max-w-md p-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Report Generated Successfully</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your {config.name} has been generated and is ready for download.
            </p>
            <div className="flex gap-2">
              <Button className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5" />
            <div>
              <h2 className="text-xl font-semibold">Report Builder</h2>
              <p className="text-sm text-muted-foreground">
                {template ? `Configure ${template.name}` : "Create custom ESG report"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
          {/* Basic Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Report Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Report Name</Label>
                  <Input
                    id="name"
                    value={config.name}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Output Format</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {["pdf", "xlsx", "csv", "email"].map((format) => (
                      <Button
                        key={format}
                        variant={config.format === format ? "default" : "outline"}
                        size="sm"
                        onClick={() => setConfig(prev => ({ ...prev, format: format as any }))}
                        className="flex items-center gap-1"
                      >
                        <span>{getFormatIcon(format)}</span>
                        {format.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={config.startDate}
                    onChange={(e) => setConfig(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={config.endDate}
                    onChange={(e) => setConfig(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Sections */}
          <Card>
            <CardHeader>
              <CardTitle>Include Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries({
                  energyConsumption: "Energy Consumption",
                  costAnalysis: "Cost Analysis", 
                  emissions: "CO₂ Emissions",
                  powerQuality: "Power Quality",
                  anomalies: "Anomalies & Issues",
                  recommendations: "AI Recommendations"
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={config.sections[key as keyof typeof config.sections]}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({
                          ...prev,
                          sections: { ...prev.sections, [key]: checked }
                        }))
                      }
                    />
                    <Label htmlFor={key} className="text-sm">{label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recipients */}
          <Card>
            <CardHeader>
              <CardTitle>Email Recipients</CardTitle>
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

              {config.recipients.length > 0 && (
                <div className="space-y-2">
                  <Label>Current Recipients</Label>
                  <div className="flex flex-wrap gap-2">
                    {config.recipients.map((email, idx) => (
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

          {/* Schedule Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="schedule-enabled"
                  checked={config.schedule?.enabled || false}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule!, enabled: checked }
                    }))
                  }
                />
                <Label htmlFor="schedule-enabled">Enable recurring reports</Label>
              </div>

              {config.schedule?.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-6">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <select
                      value={config.schedule.frequency}
                      onChange={(e) => 
                        setConfig(prev => ({
                          ...prev,
                          schedule: { ...prev.schedule!, frequency: e.target.value as any }
                        }))
                      }
                      className="w-full p-2 border border-border rounded-md bg-background"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Day of Month</Label>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={config.schedule.dayOfMonth}
                      onChange={(e) => 
                        setConfig(prev => ({
                          ...prev,
                          schedule: { ...prev.schedule!, dayOfMonth: parseInt(e.target.value) || 1 }
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={config.schedule.time}
                      onChange={(e) => 
                        setConfig(prev => ({
                          ...prev,
                          schedule: { ...prev.schedule!, time: e.target.value }
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button 
              onClick={handleGenerate} 
              disabled={!config.name.trim() || isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
            
            {config.schedule?.enabled && (
              <Button 
                onClick={handleSchedule}
                variant="outline"
                disabled={!config.name.trim()}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            )}
            
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}