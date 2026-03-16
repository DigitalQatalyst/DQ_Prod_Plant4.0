import { cn } from "@/lib/utils";
import { AssetStatus } from "@/types/navigation";
import { AssetStatus as UpstreamAssetStatus } from "@/types/assets";

// Extended status types for security features
type SecurityStatus = 'secure' | 'at-risk' | 'critical' | 'vulnerable' | 'unknown';
type ComplianceStatus = 'compliant' | 'partial' | 'non-compliant';
type CriticalityStatus = 'safety-critical' | 'production-critical' | 'high' | 'medium' | 'low';
type UserTypeStatus = 'internal' | 'vendor' | 'oem' | 'consultant';

type AllStatusTypes = AssetStatus | SecurityStatus | ComplianceStatus | CriticalityStatus | UserTypeStatus;

interface StatusBadgeProps {
  status: AssetStatus | UpstreamAssetStatus | string;
  showLabel?: boolean;
  size?: "sm" | "md";
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Navigation asset statuses
  online: { label: "Online", className: "status-online" },
  offline: { label: "Offline", className: "status-offline" },
  pending: { label: "Pending", className: "status-pending" },
  maintenance: { label: "Maintenance", className: "status-maintenance" },
  
  // Upstream asset statuses
  active: { label: "Active", className: "status-online" },
  "shut-in": { label: "Shut-in", className: "status-offline" },
  retired: { label: "Retired", className: "status-offline" },
  planned: { label: "Planned", className: "status-pending" },
  
  // Security posture statuses
  secure: { label: "Secure", className: "status-online" },
  'at-risk': { label: "At Risk", className: "status-pending" },
  critical: { label: "Critical", className: "status-offline" },
  vulnerable: { label: "Vulnerable", className: "status-offline" },
  unknown: { label: "Unknown", className: "status-maintenance" },
  
  // Energy meter statuses
  normal: { label: "Normal", className: "status-online" },
  high: { label: "High", className: "status-pending" },
  
  // Compliance statuses
  compliant: { label: "Compliant", className: "status-online" },
  partial: { label: "Partial", className: "status-pending" },
  'non-compliant': { label: "Non-Compliant", className: "status-offline" },
  'deviation-detected': { label: "Deviation Detected", className: "status-pending" },
  'not-assessed': { label: "Not Assessed", className: "status-maintenance" },
  pass: { label: "Pass", className: "status-online" },
  watch: { label: "Watch", className: "status-pending" },
  fail: { label: "Fail", className: "status-offline" },
  
  // Criticality statuses
  'safety-critical': { label: "Safety Critical", className: "status-offline" },
  'production-critical': { label: "Production Critical", className: "status-pending" },
  medium: { label: "Medium", className: "status-maintenance" },
  low: { label: "Low", className: "status-online" },
  
  // User type statuses
  internal: { label: "Internal", className: "status-online" },
  vendor: { label: "Vendor", className: "status-pending" },
  oem: { label: "OEM", className: "status-pending" },
  consultant: { label: "Consultant", className: "status-maintenance" },
  
  // Load statuses
  available: { label: "Available", className: "status-online" },
  shedding: { label: "Shedding", className: "status-offline" },
  unavailable: { label: "Unavailable", className: "status-pending" },
  
  // Remediation statuses
  'in-progress': { label: "In Progress", className: "status-pending" },
  completed: { label: "Completed", className: "status-online" },
  failed: { label: "Failed", className: "status-offline" },
  'not-started': { label: "Not Started", className: "status-maintenance" },
  deferred: { label: "Deferred", className: "status-maintenance" },
  
  // Implementation statuses
  implemented: { label: "Implemented", className: "status-online" },
  'not-implemented': { label: "Not Implemented", className: "status-offline" },
  'not-applicable': { label: "Not Applicable", className: "status-maintenance" },
  
  // Effectiveness statuses
  effective: { label: "Effective", className: "status-online" },
  'partially-effective': { label: "Partially Effective", className: "status-pending" },
  ineffective: { label: "Ineffective", className: "status-offline" },
  
  // Gap severity statuses
  info: { label: "Info", className: "status-maintenance" },
  
  // Deviation statuses
  open: { label: "Open", className: "status-offline" },
  acknowledged: { label: "Acknowledged", className: "status-pending" },
  remediated: { label: "Remediated", className: "status-online" },
  accepted: { label: "Accepted", className: "status-maintenance" },
  
  // Enable/disable statuses
  enabled: { label: "Enabled", className: "status-online" },
  disabled: { label: "Disabled", className: "status-offline" },
};

export function StatusBadge({ status, showLabel = true, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: String(status), className: "status-maintenance" };

  return (
    <span
      className={cn(
        "status-badge",
        config.className,
        size === "sm" && "text-[10px] px-1.5 py-0"
      )}
    >
      <span
        className={cn(
          "rounded-full",
          size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2",
          (status === "online" || status === "active" || status === "secure" || status === "compliant" || status === "internal" || status === "low" || status === "normal" || status === "pass" || status === "available") && "bg-success",
          (status === "offline" || status === "shut-in" || status === "retired" || status === "critical" || status === "vulnerable" || status === "non-compliant" || status === "safety-critical" || status === "fail" || status === "shedding") && "bg-destructive",
          (status === "pending" || status === "planned" || status === "at-risk" || status === "partial" || status === "production-critical" || status === "high" || status === "vendor" || status === "oem" || status === "watch" || status === "unavailable") && "bg-warning",
          (status === "maintenance" || status === "unknown" || status === "medium" || status === "consultant") && "bg-purple-500"
        )}
      />
      {showLabel && config.label}
    </span>
  );
}
