import { FeatureAreaId } from "./dashboard";

export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "open" | "acknowledged" | "in-progress" | "closed";

export interface Alert {
  id: string;
  featureArea: FeatureAreaId;
  severity: AlertSeverity;
  status: AlertStatus;
  tenantId: string;
  siteId?: string;
  assetId?: string;
  title: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

// Extended alert interface with transmission topology context
export interface AlertWithTopology extends Alert {
  // Transmission topology context (for Power/Transmission sector)
  substationId?: string;
  substationName?: string;
  substationCode?: string;
  feederId?: string;
  feederName?: string;
  feederCode?: string;
  meterId?: string;
  meterName?: string;
  meterRole?: string;
  // Source event details
  sourceType?: 'anomaly' | 'pq_event';
  sourceId?: string;
  detectedAt?: string;
  eventType?: string;
  magnitude?: number;
}

export interface Incident {
  id: string;
  featureArea: FeatureAreaId;
  title: string;
  status: AlertStatus;
  severity: AlertSeverity;
  relatedAlertIds: string[];
  tenantId: string;
  siteId?: string;
  createdAt: string;
  updatedAt: string;
  ownerUserId?: string;
}
