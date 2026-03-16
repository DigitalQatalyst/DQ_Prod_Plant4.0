/**
 * Migration utilities for converting between old and new data structures
 */

import type { 
  Tenant, 
  Site, 
  SecurityAlert, 
  Asset, 
  User, 
  ComplianceStandard,
  AuditLogEntry
} from '@/types/security';

// Import legacy types from the old mockData structure
import type { 
  Tenant as LegacyTenant,
  SecurityAlert as LegacySecurityAlert,
  User as LegacyUser,
  OtAssetSecurity,
  ComplianceStandard as LegacyComplianceStandard,
  AuditLogEntry as LegacyAuditLogEntry
} from '@/data/mockData';

// Import upstream types
import type {
  UpstreamTenant,
  UpstreamSite,
  UpstreamSecurityAlert,
  UpstreamOtAsset,
  SecurityUser,
  UpstreamComplianceStandard,
  SecurityAuditEntry
} from '@/types/security';

// Migration functions for upstream data to unified structure

export function migrateUpstreamTenant(upstreamTenant: UpstreamTenant): Tenant {
  return {
    id: upstreamTenant.id,
    name: upstreamTenant.name,
    industry: 'Oil & Gas',
    sector: 'oil-gas',
    subsector: 'Upstream',
    oilGas: {
      type: upstreamTenant.type,
      region: upstreamTenant.region,
      basin: upstreamTenant.basin
    }
  };
}

export function migrateUpstreamSite(upstreamSite: UpstreamSite): Site {
  return {
    id: upstreamSite.id,
    tenantId: upstreamSite.tenantId,
    name: upstreamSite.name,
    oilGas: {
      type: upstreamSite.type,
      region: upstreamSite.region,
      basin: upstreamSite.basin,
      field: upstreamSite.field,
      coordinates: upstreamSite.coordinates,
      securityPosture: upstreamSite.securityPosture,
      zoneCompliance: upstreamSite.zoneCompliance,
      activeRemoteSessions: upstreamSite.activeRemoteSessions,
      criticalAssetCount: upstreamSite.criticalAssetCount
    }
  };
}

export function migrateUpstreamAlert(upstreamAlert: UpstreamSecurityAlert): SecurityAlert {
  return {
    id: upstreamAlert.id,
    tenantId: upstreamAlert.tenantId,
    siteId: upstreamAlert.siteId,
    title: upstreamAlert.title,
    description: upstreamAlert.description,
    severity: upstreamAlert.severity,
    status: upstreamAlert.status,
    timestamp: upstreamAlert.timestamp,
    detectedBy: upstreamAlert.detectedBy,
    assignedTo: upstreamAlert.assignedTo,
    affectedAsset: upstreamAlert.affectedAsset,
    affectedAssetId: upstreamAlert.affectedAssetId,
    category: upstreamAlert.category,
    oilGas: {
      affectedZone: upstreamAlert.affectedZone,
      isSafetyCritical: upstreamAlert.isSafetyCritical,
      recommendedActions: upstreamAlert.recommendedActions,
      category: upstreamAlert.category
    }
  };
}

export function migrateUpstreamAsset(upstreamAsset: UpstreamOtAsset): Asset {
  return {
    id: upstreamAsset.id,
    tenantId: upstreamAsset.tenantId,
    siteId: upstreamAsset.siteId,
    name: upstreamAsset.name,
    type: upstreamAsset.type,
    manufacturer: upstreamAsset.manufacturer,
    model: upstreamAsset.model,
    status: 'online', // Default status
    criticality: upstreamAsset.criticality === 'safety-critical' || upstreamAsset.criticality === 'production-critical' ? 'critical' : upstreamAsset.criticality,
    security: {
      securityStatus: upstreamAsset.securityStatus,
      vulnerabilityCount: upstreamAsset.vulnerabilityCount,
      openAlerts: upstreamAsset.openAlerts,
      lastSecurityScan: upstreamAsset.lastSecurityScan,
      riskScore: upstreamAsset.riskScore,
      networkExposure: upstreamAsset.networkExposure,
      patchStatus: upstreamAsset.patchStatus
    },
    oilGas: {
      zoneId: upstreamAsset.zoneId,
      firmwareVersion: upstreamAsset.firmwareVersion,
      type: upstreamAsset.type,
      criticality: upstreamAsset.criticality,
      inSafetyLoop: upstreamAsset.inSafetyLoop,
      highPressure: upstreamAsset.highPressure
    }
  };
}

export function migrateSecurityUser(securityUser: SecurityUser): User {
  return {
    id: securityUser.id,
    tenantId: securityUser.tenantId,
    name: securityUser.name,
    email: securityUser.email,
    role: securityUser.role, // Add top-level role for compatibility
    status: securityUser.status,
    lastLogin: securityUser.lastLogin,
    createdAt: new Date().toISOString(), // Default creation date
    oilGas: {
      role: securityUser.role,
      siteAccess: securityUser.siteAccess,
      zoneAccess: securityUser.zoneAccess,
      mfaEnabled: securityUser.mfaEnabled,
      privilegedAccess: securityUser.privilegedAccess
    }
  };
}

export function migrateUpstreamComplianceStandard(upstreamStandard: UpstreamComplianceStandard): ComplianceStandard {
  return {
    id: upstreamStandard.id,
    tenantId: upstreamStandard.tenantId,
    name: upstreamStandard.name,
    fullName: upstreamStandard.fullName,
    description: upstreamStandard.description,
    complianceScore: upstreamStandard.complianceScore,
    status: upstreamStandard.status,
    lastAudit: upstreamStandard.lastAudit,
    nextAudit: upstreamStandard.nextAudit,
    requirements: upstreamStandard.requirements.map(req => ({
      ...req,
      lastChecked: req.lastAssessed || req.lastChecked
    })),
    // Add top-level applicableScope for compatibility
    applicableScope: {
      sites: upstreamStandard.applicableScope.siteTypes,
      assetTypes: upstreamStandard.applicableScope.assetTypes,
      departments: []
    },
    oilGas: {
      applicableScope: upstreamStandard.applicableScope
    }
  };
}

export function migrateSecurityAuditEntry(securityAuditEntry: SecurityAuditEntry): AuditLogEntry {
  return {
    id: securityAuditEntry.id,
    tenantId: securityAuditEntry.tenantId,
    timestamp: securityAuditEntry.timestamp,
    eventType: securityAuditEntry.eventType,
    category: securityAuditEntry.eventType as any, // Map event type to category
    user: securityAuditEntry.userName || 'Unknown',
    userId: securityAuditEntry.userId || 'unknown',
    action: securityAuditEntry.action,
    resource: securityAuditEntry.resource,
    resourceType: 'system', // Default resource type
    outcome: securityAuditEntry.outcome,
    ipAddress: securityAuditEntry.sourceIp,
    sessionId: `session-${securityAuditEntry.id}`,
    sourceIp: securityAuditEntry.sourceIp,
    details: securityAuditEntry.details,
    severity: securityAuditEntry.riskLevel === 'high' ? 'critical' : securityAuditEntry.riskLevel === 'medium' ? 'warning' : 'info',
    riskLevel: securityAuditEntry.riskLevel,
    siteId: securityAuditEntry.siteId,
    assetId: securityAuditEntry.assetId
  };
}

// Migration functions for legacy data to unified structure

export function migrateLegacyTenant(legacyTenant: LegacyTenant): Tenant {
  return {
    id: legacyTenant.id,
    name: legacyTenant.name,
    industry: legacyTenant.industry === 'Utilities' ? 'utilities' : 
              legacyTenant.industry === 'Agriculture' ? 'agriculture' :
              legacyTenant.industry === 'Manufacturing' ? 'manufacturing' :
              legacyTenant.industry === 'Testing' ? 'testing' : 'utilities'
  };
}

export function migrateLegacyAlert(legacyAlert: LegacySecurityAlert): SecurityAlert {
  return {
    id: legacyAlert.id,
    tenantId: legacyAlert.tenantId,
    title: legacyAlert.title,
    description: legacyAlert.description,
    severity: legacyAlert.severity,
    status: legacyAlert.status,
    timestamp: legacyAlert.timestamp,
    detectedBy: legacyAlert.detectedBy,
    assignedTo: legacyAlert.assignedTo,
    affectedAsset: legacyAlert.affectedAsset,
    affectedAssetId: legacyAlert.affectedAssetId,
    category: legacyAlert.category
  };
}

export function migrateLegacyUser(legacyUser: LegacyUser): User {
  return {
    id: legacyUser.id,
    tenantId: legacyUser.tenantId,
    name: legacyUser.name,
    email: legacyUser.email,
    status: legacyUser.status,
    lastLogin: legacyUser.lastLogin,
    createdAt: legacyUser.createdAt,
    role: legacyUser.role,
    roles: legacyUser.roles,
    sites: legacyUser.sites,
    department: legacyUser.department
  };
}

export function migrateOtAssetSecurity(otAsset: OtAssetSecurity): Asset {
  return {
    id: otAsset.assetId,
    tenantId: otAsset.tenantId,
    name: otAsset.assetName,
    type: otAsset.assetType,
    status: 'online', // Default status
    criticality: otAsset.criticality,
    site: otAsset.site,
    security: {
      securityStatus: otAsset.securityStatus,
      vulnerabilityCount: otAsset.vulnerabilityCount,
      openAlerts: otAsset.openAlerts,
      lastSecurityScan: otAsset.lastSecurityScan,
      riskScore: otAsset.riskScore,
      networkExposure: otAsset.networkExposure,
      patchStatus: otAsset.patchStatus
    }
  };
}

export function migrateLegacyComplianceStandard(legacyStandard: LegacyComplianceStandard): ComplianceStandard {
  return {
    id: legacyStandard.id,
    tenantId: legacyStandard.tenantId,
    name: legacyStandard.name,
    fullName: legacyStandard.fullName,
    description: legacyStandard.description,
    complianceScore: legacyStandard.complianceScore,
    status: legacyStandard.status,
    lastAudit: legacyStandard.lastAudit,
    nextAudit: legacyStandard.nextAudit,
    requirements: legacyStandard.requirements,
    applicableScope: legacyStandard.applicableScope
  };
}

export function migrateLegacyAuditEntry(legacyEntry: LegacyAuditLogEntry): AuditLogEntry {
  return {
    id: legacyEntry.id,
    tenantId: legacyEntry.tenantId,
    timestamp: legacyEntry.timestamp,
    eventType: legacyEntry.eventType,
    category: legacyEntry.category,
    user: legacyEntry.user,
    userId: legacyEntry.userId,
    action: legacyEntry.action,
    resource: legacyEntry.resource,
    resourceType: legacyEntry.resourceType,
    outcome: legacyEntry.outcome,
    ipAddress: legacyEntry.ipAddress,
    sessionId: legacyEntry.sessionId,
    details: legacyEntry.details,
    severity: legacyEntry.severity
  };
}