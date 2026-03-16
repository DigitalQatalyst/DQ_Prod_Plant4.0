import { Alert, AlertStatus, AlertSeverity } from "@/types/alert";
import { FeatureAreaId } from "@/types/dashboard";
import { alerts } from "@/data/alertData";

/**
 * Get all alerts for a specific tenant
 */
export function getAlertsForTenant(tenantId: string): Alert[] {
  return alerts.filter((alert) => alert.tenantId === tenantId);
}

/**
 * Get alerts filtered by feature area and tenant
 */
export function getAlertsForFeatureArea(
  featureArea: FeatureAreaId,
  tenantId: string
): Alert[] {
  return alerts.filter(
    (alert) => alert.featureArea === featureArea && alert.tenantId === tenantId
  );
}

/**
 * Filter criteria for alerts
 */
export interface AlertFilterCriteria {
  severity?: AlertSeverity | AlertSeverity[];
  status?: AlertStatus | AlertStatus[];
  featureArea?: FeatureAreaId | FeatureAreaId[];
  siteId?: string;
  assetId?: string;
  tags?: string[];
}

/**
 * Filter alerts by multiple criteria
 * All specified criteria must match (AND logic)
 */
export function filterAlertsByCriteria(
  alertList: Alert[],
  criteria: AlertFilterCriteria
): Alert[] {
  return alertList.filter((alert) => {
    // Filter by severity
    if (criteria.severity) {
      const severities = Array.isArray(criteria.severity)
        ? criteria.severity
        : [criteria.severity];
      if (!severities.includes(alert.severity)) {
        return false;
      }
    }

    // Filter by status
    if (criteria.status) {
      const statuses = Array.isArray(criteria.status)
        ? criteria.status
        : [criteria.status];
      if (!statuses.includes(alert.status)) {
        return false;
      }
    }

    // Filter by feature area
    if (criteria.featureArea) {
      const featureAreas = Array.isArray(criteria.featureArea)
        ? criteria.featureArea
        : [criteria.featureArea];
      if (!featureAreas.includes(alert.featureArea)) {
        return false;
      }
    }

    // Filter by site ID
    if (criteria.siteId && alert.siteId !== criteria.siteId) {
      return false;
    }

    // Filter by asset ID
    if (criteria.assetId && alert.assetId !== criteria.assetId) {
      return false;
    }

    // Filter by tags (alert must have at least one matching tag)
    if (criteria.tags && criteria.tags.length > 0) {
      if (!alert.tags || !criteria.tags.some((tag) => alert.tags!.includes(tag))) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort field options for alerts
 */
export type AlertSortField = "severity" | "createdAt" | "status" | "featureArea";
export type SortDirection = "asc" | "desc";

/**
 * Severity order for sorting (critical > warning > info)
 */
const severityOrder: Record<AlertSeverity, number> = {
  critical: 3,
  warning: 2,
  info: 1
};

/**
 * Status order for sorting (open > acknowledged > in-progress > closed)
 */
const statusOrder: Record<AlertStatus, number> = {
  open: 4,
  acknowledged: 3,
  "in-progress": 2,
  closed: 1
};

/**
 * Sort alerts by a specified field and direction
 */
export function sortAlerts(
  alertList: Alert[],
  sortField: AlertSortField,
  direction: SortDirection = "desc"
): Alert[] {
  const sorted = [...alertList].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case "severity":
        comparison = severityOrder[a.severity] - severityOrder[b.severity];
        break;
      case "createdAt":
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case "status":
        comparison = statusOrder[a.status] - statusOrder[b.status];
        break;
      case "featureArea":
        comparison = a.featureArea.localeCompare(b.featureArea);
        break;
    }

    return direction === "asc" ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Valid status transitions
 * open → acknowledged → in-progress → closed
 * Any status can transition directly to closed
 */
const validTransitions: Record<AlertStatus, AlertStatus[]> = {
  open: ["acknowledged", "closed"],
  acknowledged: ["in-progress", "closed"],
  "in-progress": ["closed"],
  closed: []
};

/**
 * Validate if a status transition is allowed
 */
export function validateStatusTransition(
  currentStatus: AlertStatus,
  newStatus: AlertStatus
): boolean {
  // Same status is always valid (no-op)
  if (currentStatus === newStatus) {
    return true;
  }

  // Check if transition is in the valid transitions map
  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

/**
 * Update an alert's status
 * Returns a new alert object with updated status and updatedAt timestamp
 * Throws an error if the transition is invalid
 */
export function updateAlertStatus(
  alert: Alert,
  newStatus: AlertStatus
): Alert {
  // Validate the transition
  if (!validateStatusTransition(alert.status, newStatus)) {
    throw new Error(
      `Invalid status transition from "${alert.status}" to "${newStatus}"`
    );
  }

  // Return updated alert with new status and timestamp
  return {
    ...alert,
    status: newStatus,
    updatedAt: new Date().toISOString()
  };
}
