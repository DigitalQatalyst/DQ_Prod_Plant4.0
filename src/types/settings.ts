// Settings types for organizational configuration

export interface OrganizationProfile {
  tenantId: string;
  logoUrl?: string;
  region?: string;
  timezone: string;
  currencyCode: string;
  regulatoryProfile?: Record<string, any>;
}

export interface Stream {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  kind: string;
  status: "active" | "inactive" | "archived";
  isDefault: boolean;
  createdAt: string;
}

export interface Program {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
}

export interface NamingStandard {
  tenantId: string;
  rules: Record<string, any>;
}

export interface SiteHierarchyNode {
  id: string;
  tenantId: string;
  siteId: string;
  parentId?: string;
  nodeType: string;
  name: string;
  path: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface UnitSystem {
  tenantId: string;
  unitSystem: Record<string, any>;
}

export interface ScopeDefault {
  id: string;
  tenantId: string;
  principalType: string;
  principalId: string;
  defaultSiteIds?: string[];
  defaultStreamId?: string;
  defaultDashboardId?: string;
}

export interface Team {
  id: string;
  tenantId: string;
  name: string;
  onCallLabel?: string;
  createdAt: string;
}

export interface TeamMembership {
  teamId: string;
  userId: string;
  role: string;
  createdAt: string;
}

export interface UserProfile {
  userId: string;
  tenantId: string;
  displayName: string;
  personaLabel?: string;
  preferences?: Record<string, any>;
  createdAt: string;
}

export interface IntegrationType {
  code: string;
  name: string;
  category: string;
}

export interface IntegrationInstance {
  id: string;
  tenantId: string;
  typeCode: string;
  name: string;
  status: "active" | "inactive" | "degraded" | "error";
  lastSyncAt?: string;
  config?: Record<string, any>;
}

export interface IntegrationMapping {
  id: string;
  integrationId: string;
  siteId: string;
  streamId: string;
  mapping: Record<string, any>;
}

export interface IntegrationHealthEvent {
  id: string;
  tenantId: string;
  integrationId: string;
  status: "healthy" | "degraded" | "error";
  timestamp: string;
  details?: Record<string, any>;
}

export interface ModuleToggle {
  id: string;
  tenantId: string;
  streamId?: string;
  featureArea: string;
  enabled: boolean;
  readinessState?: string;
}

export interface UserPreference {
  userId: string;
  tenantId: string;
  defaults?: Record<string, any>;
}

export interface NotificationPreference {
  userId: string;
  tenantId: string;
  channels?: Record<string, any>;
  digestFrequency?: string;
  quietHours?: Record<string, any>;
}

export interface ResponsibilityLabel {
  id: string;
  tenantId: string;
  code: string;
  name: string;
}
