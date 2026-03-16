/**
 * Work Order Types for APM PopPane Forms
 */

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  assetId: string;
  assetName: string;
  priority: WorkOrderPriority;
  type: WorkOrderType;
  estimatedDuration: number; // in hours
  scheduledDate?: string;
  assignedTo?: string;
  status: WorkOrderStatus;
  recommendedActions: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type WorkOrderPriority = "Low" | "Medium" | "High" | "Critical";
export type WorkOrderType = "Preventive" | "Corrective" | "Predictive" | "Emergency" | "Inspection";
export type WorkOrderStatus = "Draft" | "Scheduled" | "In Progress" | "Completed" | "Cancelled";

export interface WorkOrderFormData {
  title: string;
  description: string;
  assetId: string;
  priority: WorkOrderPriority;
  type: WorkOrderType;
  estimatedDuration: number;
  scheduledDate: string;
  assignedTo: string;
  recommendedActions: string[];
}

export interface ReportSchedule {
  id: string;
  name: string;
  reportType: ReportType;
  frequency: ReportFrequency;
  format: ReportFormat;
  recipients: string[];
  deliveryMethod: DeliveryMethod;
  template: string;
  customizations: ReportCustomization[];
  nextRun: string;
  status: "Active" | "Paused" | "Disabled";
  createdBy: string;
  createdAt: string;
}

export type ReportType = "Weekly Reliability" | "Monthly Bad Actors" | "Maintenance Effectiveness" | "Asset Performance" | "Downtime Analysis" | "Custom";
export type ReportFrequency = "Daily" | "Weekly" | "Monthly" | "Quarterly" | "On-Demand";
export type ReportFormat = "PDF" | "Excel" | "CSV" | "PowerBI";
export type DeliveryMethod = "Email" | "SharePoint" | "FTP" | "API";

export interface ReportCustomization {
  section: string;
  enabled: boolean;
  parameters?: Record<string, any>;
}

export interface ReportScheduleFormData {
  name: string;
  reportType: ReportType;
  frequency: ReportFrequency;
  format: ReportFormat;
  recipients: string[];
  deliveryMethod: DeliveryMethod;
  template: string;
  customizations: ReportCustomization[];
}

export interface EventDetails {
  id: string;
  title: string;
  assetId: string;
  assetName: string;
  category: "Alert" | "Fault" | "Downtime" | "Maintenance" | "Operational";
  severity: "Critical" | "Warning" | "Information";
  timestamp: string;
  duration?: number;
  description: string;
  status: "Active" | "Resolved" | "Investigating";
  correlatedEvents: EventDetails[];
  timeline: EventTimelineItem[];
  actionHistory: EventAction[];
  rootCause?: string;
  resolution?: string;
  notes: EventNote[];
}

export interface EventTimelineItem {
  id: string;
  timestamp: string;
  type: "Event" | "Action" | "Note" | "Status Change";
  description: string;
  user?: string;
}

export interface EventAction {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  result?: string;
}

export interface EventNote {
  id: string;
  timestamp: string;
  note: string;
  user: string;
  type: "General" | "Technical" | "Resolution";
}