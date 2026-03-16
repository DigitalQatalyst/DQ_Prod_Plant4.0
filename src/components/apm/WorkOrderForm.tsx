import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { WorkOrderFormData, WorkOrderPriority, WorkOrderType } from "@/types/workOrder";
import { UpstreamAlert } from "@/types/navigation";
import { CalendarIcon, CheckCircle, Clock, AlertTriangle, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface WorkOrderFormProps {
  prefilledData?: {
    assetId?: string;
    assetName?: string;
    alert?: UpstreamAlert;
    recommendedActions?: string[];
  };
  onSubmit?: (data: WorkOrderFormData) => void;
  onCancel?: () => void;
}

export function WorkOrderForm({ prefilledData, onSubmit, onCancel }: WorkOrderFormProps) {
  const { assets } = useApp();
  const [date, setDate] = useState<Date>();
  const [customAction, setCustomAction] = useState("");
  
  const [formData, setFormData] = useState<WorkOrderFormData>({
    title: prefilledData?.alert ? `${prefilledData.alert.title} - ${prefilledData.assetName}` : "",
    description: prefilledData?.alert?.description || "",
    assetId: prefilledData?.assetId || "",
    priority: prefilledData?.alert?.severity === "Critical" ? "Critical" : 
              prefilledData?.alert?.severity === "Warning" ? "High" : "Medium",
    type: prefilledData?.alert ? "Corrective" : "Preventive",
    estimatedDuration: 4,
    scheduledDate: "",
    assignedTo: "",
    recommendedActions: prefilledData?.recommendedActions || []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.assetId) {
      newErrors.assetId = "Asset selection is required";
    }
    if (!formData.assignedTo.trim()) {
      newErrors.assignedTo = "Assigned technician is required";
    }
    if (formData.estimatedDuration <= 0) {
      newErrors.estimatedDuration = "Duration must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = {
        ...formData,
        scheduledDate: date ? format(date, "yyyy-MM-dd") : ""
      };
      onSubmit?.(submitData);
    }
  };

  const handleAddAction = () => {
    if (customAction.trim()) {
      setFormData(prev => ({
        ...prev,
        recommendedActions: [...prev.recommendedActions, customAction.trim()]
      }));
      setCustomAction("");
    }
  };

  const handleRemoveAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recommendedActions: prev.recommendedActions.filter((_, i) => i !== index)
    }));
  };

  const getPriorityColor = (priority: WorkOrderPriority) => {
    switch (priority) {
      case "Critical": return "text-red-600 bg-red-50 border-red-200";
      case "High": return "text-orange-600 bg-orange-50 border-orange-200";
      case "Medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Low": return "text-green-600 bg-green-50 border-green-200";
    }
  };

  const getPriorityIcon = (priority: WorkOrderPriority) => {
    switch (priority) {
      case "Critical": return AlertTriangle;
      case "High": return AlertTriangle;
      case "Medium": return Clock;
      case "Low": return CheckCircle;
    }
  };

  const selectedAsset = assets.find(a => a.id === formData.assetId);
  const PriorityIcon = getPriorityIcon(formData.priority);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Create Work Order</h3>
        <p className="text-sm text-muted-foreground">
          {prefilledData?.alert ? "Create corrective work order from alert" : "Create new maintenance work order"}
        </p>
      </div>

      {/* Alert Context (if applicable) */}
      {prefilledData?.alert && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              Related Alert
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {prefilledData.alert.severity}
                </Badge>
                <span className="text-sm font-medium">{prefilledData.alert.title}</span>
              </div>
              <p className="text-xs text-muted-foreground">{prefilledData.alert.description}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Work Order Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter work order title"
            className={errors.title ? "border-red-500" : ""}
          />
          {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the work to be performed"
            rows={3}
            className={errors.description ? "border-red-500" : ""}
          />
          {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="asset">Asset *</Label>
            <Select
              value={formData.assetId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, assetId: value }))}
            >
              <SelectTrigger className={errors.assetId ? "border-red-500" : ""}>
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    <div className="flex items-center gap-2">
                      <span>{asset.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {asset.type}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assetId && <p className="text-xs text-red-600">{errors.assetId}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Work Order Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: WorkOrderType) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Preventive">Preventive</SelectItem>
                <SelectItem value="Corrective">Corrective</SelectItem>
                <SelectItem value="Predictive">Predictive</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
                <SelectItem value="Inspection">Inspection</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: WorkOrderPriority) => setFormData(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Critical">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    Critical
                  </div>
                </SelectItem>
                <SelectItem value="High">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-orange-600" />
                    High
                  </div>
                </SelectItem>
                <SelectItem value="Medium">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-yellow-600" />
                    Medium
                  </div>
                </SelectItem>
                <SelectItem value="Low">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    Low
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Estimated Duration (hours) *</Label>
            <Input
              id="duration"
              type="number"
              min="0.5"
              step="0.5"
              value={formData.estimatedDuration}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: parseFloat(e.target.value) || 0 }))}
              className={errors.estimatedDuration ? "border-red-500" : ""}
            />
            {errors.estimatedDuration && <p className="text-xs text-red-600">{errors.estimatedDuration}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Scheduled Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assigned To *</Label>
            <Select
              value={formData.assignedTo}
              onValueChange={(value) => setFormData(prev => ({ ...prev, assignedTo: value }))}
            >
              <SelectTrigger className={errors.assignedTo ? "border-red-500" : ""}>
                <SelectValue placeholder="Select technician" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="john.smith">John Smith (Mechanical)</SelectItem>
                <SelectItem value="sarah.jones">Sarah Jones (Electrical)</SelectItem>
                <SelectItem value="mike.wilson">Mike Wilson (Instrumentation)</SelectItem>
                <SelectItem value="lisa.brown">Lisa Brown (Process)</SelectItem>
                <SelectItem value="team.maintenance">Maintenance Team</SelectItem>
              </SelectContent>
            </Select>
            {errors.assignedTo && <p className="text-xs text-red-600">{errors.assignedTo}</p>}
          </div>
        </div>
      </div>

      <Separator />

      {/* Recommended Actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Recommended Actions</Label>
          <Badge variant="secondary" className="text-xs">
            {formData.recommendedActions.length} actions
          </Badge>
        </div>

        {formData.recommendedActions.length > 0 && (
          <div className="space-y-2">
            {formData.recommendedActions.map((action, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-secondary/30 rounded border">
                <span className="text-xs text-muted-foreground mt-0.5">{index + 1}.</span>
                <span className="text-sm flex-1">{action}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleRemoveAction(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={customAction}
            onChange={(e) => setCustomAction(e.target.value)}
            placeholder="Add recommended action"
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAction())}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddAction}
            disabled={!customAction.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Summary */}
      {selectedAsset && (
        <Card className="bg-secondary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Work Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="flex items-center gap-2">
              <PriorityIcon className="w-4 h-4" />
              <Badge className={getPriorityColor(formData.priority)}>
                {formData.priority} Priority
              </Badge>
              <Badge variant="outline">{formData.type}</Badge>
            </div>
            <div className="text-sm">
              <span className="font-medium">{selectedAsset.name}</span>
              <span className="text-muted-foreground"> • {formData.estimatedDuration}h estimated</span>
            </div>
            {date && (
              <div className="text-sm text-muted-foreground">
                Scheduled for {format(date, "PPP")}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          Create Work Order
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}