import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { 
  ReportScheduleFormData, 
  ReportType, 
  ReportFrequency, 
  ReportFormat, 
  DeliveryMethod,
  ReportCustomization 
} from "@/types/workOrder";
import { 
  FileText, 
  Calendar, 
  Mail, 
  Users, 
  Settings, 
  Clock,
  Download,
  Share,
  Plus,
  X
} from "lucide-react";

interface ReportScheduleFormProps {
  onSubmit?: (data: ReportScheduleFormData) => void;
  onCancel?: () => void;
}

export function ReportScheduleForm({ onSubmit, onCancel }: ReportScheduleFormProps) {
  const [newRecipient, setNewRecipient] = useState("");
  
  const [formData, setFormData] = useState<ReportScheduleFormData>({
    name: "",
    reportType: "Weekly Reliability",
    frequency: "Weekly",
    format: "PDF",
    recipients: [],
    deliveryMethod: "Email",
    template: "standard",
    customizations: [
      { section: "Executive Summary", enabled: true },
      { section: "Asset Health Overview", enabled: true },
      { section: "Top Alerts & Issues", enabled: true },
      { section: "Performance Metrics", enabled: true },
      { section: "Maintenance Recommendations", enabled: false },
      { section: "Trend Analysis", enabled: false },
      { section: "Benchmark Comparisons", enabled: false }
    ]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Report name is required";
    }
    if (formData.recipients.length === 0) {
      newErrors.recipients = "At least one recipient is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit?.(formData);
    }
  };

  const handleAddRecipient = () => {
    if (newRecipient.trim() && !formData.recipients.includes(newRecipient.trim())) {
      setFormData(prev => ({
        ...prev,
        recipients: [...prev.recipients, newRecipient.trim()]
      }));
      setNewRecipient("");
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email)
    }));
  };

  const handleCustomizationToggle = (section: string, enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      customizations: prev.customizations.map(c => 
        c.section === section ? { ...c, enabled } : c
      )
    }));
  };

  const getReportTypeDescription = (type: ReportType) => {
    switch (type) {
      case "Weekly Reliability": return "Weekly asset reliability and performance summary";
      case "Monthly Bad Actors": return "Monthly report on worst performing assets";
      case "Maintenance Effectiveness": return "Analysis of maintenance activities and outcomes";
      case "Asset Performance": return "Comprehensive asset performance metrics";
      case "Downtime Analysis": return "Detailed analysis of downtime events and causes";
      case "Custom": return "Custom report with user-defined sections";
    }
  };

  const getFrequencyIcon = (frequency: ReportFrequency) => {
    switch (frequency) {
      case "Daily": return Clock;
      case "Weekly": return Calendar;
      case "Monthly": return Calendar;
      case "Quarterly": return Calendar;
      case "On-Demand": return Download;
    }
  };

  const getDeliveryIcon = (method: DeliveryMethod) => {
    switch (method) {
      case "Email": return Mail;
      case "SharePoint": return Share;
      case "FTP": return Download;
      case "API": return Settings;
    }
  };

  const FrequencyIcon = getFrequencyIcon(formData.frequency);
  const DeliveryIcon = getDeliveryIcon(formData.deliveryMethod);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Schedule Report</h3>
        <p className="text-sm text-muted-foreground">
          Configure automated report generation and delivery
        </p>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Report Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter report name"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reportType">Report Type</Label>
          <Select
            value={formData.reportType}
            onValueChange={(value: ReportType) => setFormData(prev => ({ ...prev, reportType: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Weekly Reliability">Weekly Reliability</SelectItem>
              <SelectItem value="Monthly Bad Actors">Monthly Bad Actors</SelectItem>
              <SelectItem value="Maintenance Effectiveness">Maintenance Effectiveness</SelectItem>
              <SelectItem value="Asset Performance">Asset Performance</SelectItem>
              <SelectItem value="Downtime Analysis">Downtime Analysis</SelectItem>
              <SelectItem value="Custom">Custom Report</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {getReportTypeDescription(formData.reportType)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select
              value={formData.frequency}
              onValueChange={(value: ReportFrequency) => setFormData(prev => ({ ...prev, frequency: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Daily">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Daily
                  </div>
                </SelectItem>
                <SelectItem value="Weekly">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    Weekly
                  </div>
                </SelectItem>
                <SelectItem value="Monthly">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    Monthly
                  </div>
                </SelectItem>
                <SelectItem value="Quarterly">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    Quarterly
                  </div>
                </SelectItem>
                <SelectItem value="On-Demand">
                  <div className="flex items-center gap-2">
                    <Download className="w-3 h-3" />
                    On-Demand
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="format">Format</Label>
            <Select
              value={formData.format}
              onValueChange={(value: ReportFormat) => setFormData(prev => ({ ...prev, format: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PDF">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    PDF
                  </div>
                </SelectItem>
                <SelectItem value="Excel">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    Excel
                  </div>
                </SelectItem>
                <SelectItem value="CSV">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    CSV
                  </div>
                </SelectItem>
                <SelectItem value="PowerBI">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    PowerBI
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deliveryMethod">Delivery Method</Label>
          <Select
            value={formData.deliveryMethod}
            onValueChange={(value: DeliveryMethod) => setFormData(prev => ({ ...prev, deliveryMethod: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Email">
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  Email
                </div>
              </SelectItem>
              <SelectItem value="SharePoint">
                <div className="flex items-center gap-2">
                  <Share className="w-3 h-3" />
                  SharePoint
                </div>
              </SelectItem>
              <SelectItem value="FTP">
                <div className="flex items-center gap-2">
                  <Download className="w-3 h-3" />
                  FTP
                </div>
              </SelectItem>
              <SelectItem value="API">
                <div className="flex items-center gap-2">
                  <Settings className="w-3 h-3" />
                  API
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Recipients */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Recipients *</Label>
          <Badge variant="secondary" className="text-xs">
            {formData.recipients.length} recipients
          </Badge>
        </div>

        {formData.recipients.length > 0 && (
          <div className="space-y-2">
            {formData.recipients.map((email, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-secondary/30 rounded border">
                <Users className="w-3 h-3 text-muted-foreground" />
                <span className="text-sm flex-1">{email}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleRemoveRecipient(email)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={newRecipient}
            onChange={(e) => setNewRecipient(e.target.value)}
            placeholder="Enter email address"
            type="email"
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddRecipient())}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRecipient}
            disabled={!newRecipient.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {errors.recipients && <p className="text-xs text-red-600">{errors.recipients}</p>}
      </div>

      <Separator />

      {/* Template Selection */}
      <div className="space-y-4">
        <Label>Report Template</Label>
        <Select
          value={formData.template}
          onValueChange={(value) => setFormData(prev => ({ ...prev, template: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard Template</SelectItem>
            <SelectItem value="executive">Executive Summary</SelectItem>
            <SelectItem value="detailed">Detailed Technical</SelectItem>
            <SelectItem value="custom">Custom Layout</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Report Customizations */}
      <div className="space-y-4">
        <Label>Report Sections</Label>
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Customize Report Content</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {formData.customizations.map((customization, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`section-${index}`}
                    checked={customization.enabled}
                    onCheckedChange={(checked) => 
                      handleCustomizationToggle(customization.section, checked as boolean)
                    }
                  />
                  <Label htmlFor={`section-${index}`} className="text-sm">
                    {customization.section}
                  </Label>
                </div>
                <Badge variant={customization.enabled ? "default" : "secondary"} className="text-xs">
                  {customization.enabled ? "Included" : "Excluded"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Summary */}
      <Card className="bg-secondary/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Schedule Summary</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className="flex items-center gap-2">
            <FrequencyIcon className="w-4 h-4" />
            <Badge variant="outline">{formData.frequency}</Badge>
            <Badge variant="outline">{formData.format}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <DeliveryIcon className="w-4 h-4" />
            <span className="text-sm">
              Delivered via {formData.deliveryMethod} to {formData.recipients.length} recipient{formData.recipients.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {formData.customizations.filter(c => c.enabled).length} of {formData.customizations.length} sections included
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          Schedule Report
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}