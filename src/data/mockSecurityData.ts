/**
 * Mock Security Data for Development
 * 
 * Provides mock data for security features when VITE_DATA_BACKEND=mock
 */

import type {
  SecurityUser,
  AccessPolicy,
  AccessRule,
  PrivilegedAccessSession,
  SecurityAuditLogEntry,
} from '@/types/security';

import type {
  DirectoryIntegration,
  MfaRule,
  SessionRule,
  EndpointBaseline,
} from '@/types/identity';

// Mock Security Users
export const mockSecurityUsers: SecurityUser[] = [
  {
    id: 'user-001',
    tenantId: 'ksa-upstream-jv',
    username: 'john.operator',
    email: 'john.operator@example.com',
    fullName: 'John Operator',
    role: 'operator',
    status: 'active',
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    failedLoginAttempts: 0,
    mfaEnabled: true,
    accessZones: ['substation-control', 'field-devices'],
    permissions: ['view-transmission-assets', 'operate-substation-controls'],
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
  },
  {
    id: 'user-002',
    tenantId: 'ksa-upstream-jv',
    username: 'sarah.engineer',
    email: 'sarah.engineer@example.com',
    fullName: 'Sarah Engineer',
    role: 'engineer',
    status: 'active',
    lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    failedLoginAttempts: 0,
    mfaEnabled: true,
    accessZones: ['substation-control', 'protection-systems', 'scada-network', 'maintenance-network'],
    permissions: ['configure-transmission-systems', 'modify-protection-settings', 'access-engineering-tools'],
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-01-10').toISOString(),
  },
  {
    id: 'user-003',
    tenantId: 'ksa-upstream-jv',
    username: 'mike.supervisor',
    email: 'mike.supervisor@example.com',
    fullName: 'Mike Supervisor',
    role: 'supervisor',
    status: 'active',
    lastLogin: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    failedLoginAttempts: 0,
    mfaEnabled: true,
    accessZones: ['substation-control', 'protection-systems', 'scada-network', 'field-devices', 'maintenance-network'],
    permissions: ['supervise-transmission-operations', 'authorize-critical-operations', 'approve-switching-operations'],
    createdAt: new Date('2024-01-05').toISOString(),
    updatedAt: new Date('2024-01-05').toISOString(),
  },
  {
    id: 'user-004',
    tenantId: 'ksa-upstream-jv',
    username: 'admin.user',
    email: 'admin@example.com',
    fullName: 'Admin User',
    role: 'administrator',
    status: 'active',
    lastLogin: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    failedLoginAttempts: 0,
    mfaEnabled: true,
    accessZones: ['substation-control', 'protection-systems', 'scada-network', 'corporate-network', 'field-devices', 'maintenance-network'],
    permissions: ['manage-security-policies', 'configure-access-controls', 'manage-user-access', 'configure-system-settings'],
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
  },
  {
    id: 'user-005',
    tenantId: 'ksa-upstream-jv',
    username: 'audit.user',
    email: 'auditor@example.com',
    fullName: 'Audit User',
    role: 'auditor',
    status: 'active',
    lastLogin: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    failedLoginAttempts: 0,
    mfaEnabled: true,
    accessZones: ['substation-control', 'protection-systems', 'scada-network', 'corporate-network'],
    permissions: ['view-audit-logs', 'generate-compliance-reports', 'audit-system-configurations', 'export-audit-data'],
    createdAt: new Date('2024-01-08').toISOString(),
    updatedAt: new Date('2024-01-08').toISOString(),
  },
];

// Mock Access Policies
export const mockAccessPolicies: AccessPolicy[] = [
  {
    id: 'policy-001',
    tenantId: 'ksa-upstream-jv',
    name: 'Operator Access Policy',
    description: 'Standard access policy for operators',
    policyType: 'role-based',
    status: 'active',
    priority: 100,
    appliesTo: ['operator'],
    approvedAt: new Date('2024-01-15').toISOString(),
    approvedBy: 'admin.user',
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
    createdBy: 'admin.user',
  },
  {
    id: 'policy-002',
    tenantId: 'ksa-upstream-jv',
    name: 'Engineer Access Policy',
    description: 'Extended access policy for engineers',
    policyType: 'role-based',
    status: 'active',
    priority: 200,
    appliesTo: ['engineer'],
    approvedAt: new Date('2024-01-15').toISOString(),
    approvedBy: 'admin.user',
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
    createdBy: 'admin.user',
  },
  {
    id: 'policy-003',
    tenantId: 'ksa-upstream-jv',
    name: 'Supervisor Access Policy',
    description: 'Supervisor access with management capabilities',
    policyType: 'role-based',
    status: 'active',
    priority: 300,
    appliesTo: ['supervisor'],
    approvedAt: new Date('2024-01-15').toISOString(),
    approvedBy: 'admin.user',
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
    createdBy: 'admin.user',
  },
  {
    id: 'policy-004',
    tenantId: 'ksa-upstream-jv',
    name: 'Administrator Full Access',
    description: 'Full system access for administrators',
    policyType: 'role-based',
    status: 'active',
    priority: 400,
    appliesTo: ['administrator'],
    approvedAt: new Date('2024-01-15').toISOString(),
    approvedBy: 'admin.user',
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
    createdBy: 'admin.user',
  },
  {
    id: 'policy-005',
    tenantId: 'ksa-upstream-jv',
    name: 'Time-Based Access Policy',
    description: 'Access restricted to business hours',
    policyType: 'time-based',
    status: 'active',
    priority: 150,
    appliesTo: ['operator', 'engineer'],
    approvedAt: new Date('2024-01-15').toISOString(),
    approvedBy: 'admin.user',
    createdAt: new Date('2024-01-12').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
    createdBy: 'admin.user',
  },
  {
    id: 'policy-006',
    tenantId: 'ksa-upstream-jv',
    name: 'Draft Policy - Under Review',
    description: 'New policy pending approval',
    policyType: 'role-based',
    status: 'draft',
    priority: 250,
    appliesTo: ['engineer'],
    createdAt: new Date('2024-01-18').toISOString(),
    updatedAt: new Date('2024-01-18').toISOString(),
    createdBy: 'admin.user',
  },
];

// Mock Access Rules
export const mockAccessRules: AccessRule[] = [
  {
    id: 'rule-001',
    tenantId: 'ksa-upstream-jv',
    policyId: 'policy-001',
    ruleOrder: 1,
    effect: 'allow',
    actions: ['read'],
    resourceType: 'asset',
    zoneTypes: ['level-1', 'level-2'],
    securityLevels: [1, 2],
    conditions: {},
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-01-10').toISOString(),
  },
  {
    id: 'rule-002',
    tenantId: 'ksa-upstream-jv',
    policyId: 'policy-002',
    ruleOrder: 1,
    effect: 'allow',
    actions: ['read', 'write', 'execute'],
    resourceType: 'asset',
    zoneTypes: ['level-1', 'level-2', 'level-3'],
    securityLevels: [1, 2, 3],
    conditions: {},
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-01-10').toISOString(),
  },
  {
    id: 'rule-003',
    tenantId: 'ksa-upstream-jv',
    policyId: 'policy-005',
    ruleOrder: 1,
    effect: 'allow',
    actions: ['read'],
    timeStart: '08:00',
    timeEnd: '18:00',
    conditions: { businessHoursOnly: true },
    createdAt: new Date('2024-01-12').toISOString(),
    updatedAt: new Date('2024-01-12').toISOString(),
  },
];

// Mock Privileged Access Sessions
export const mockPrivilegedAccessSessions: PrivilegedAccessSession[] = [
  {
    id: 'session-001',
    tenantId: 'ksa-upstream-jv',
    userId: 'user-002',
    sessionType: 'maintenance',
    targetResourceType: 'asset',
    targetResourceId: 'critical-asset-xyz',
    requestedActions: ['read', 'write', 'execute'],
    approvedActions: ['read', 'write'],
    requestedBy: 'sarah.engineer',
    approvedBy: 'mike.supervisor',
    requestReason: 'Emergency maintenance required',
    approvalReason: 'Approved for critical maintenance',
    status: 'active',
    requestedStart: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    requestedEnd: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    actualStart: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    isEmergency: true,
    emergencyJustification: 'Critical system failure requiring immediate attention',
    sessionLog: [],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock Audit Log Entries
export const mockAuditLogEntries: SecurityAuditLogEntry[] = [
  {
    id: 'audit-001',
    tenantId: 'ksa-upstream-jv',
    eventType: 'authentication',
    eventCategory: 'user_authentication',
    eventName: 'User Login',
    eventDescription: 'User successfully logged in',
    severity: 'info',
    outcome: 'success',
    userId: 'user-001',
    username: 'john.operator',
    actionPerformed: 'login',
    targetType: 'user',
    targetId: 'user-001',
    sourceIp: '192.168.1.100',
    userAgent: 'Mozilla/5.0',
    additionalData: {},
    requiresInvestigation: false,
    retentionCategory: 'standard',
    archived: false,
    eventTimestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    processingTimestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'audit-002',
    tenantId: 'ksa-upstream-jv',
    eventType: 'policy_change',
    eventCategory: 'access_control',
    eventName: 'Policy Updated',
    eventDescription: 'Access policy was modified',
    severity: 'warning',
    outcome: 'success',
    userId: 'user-004',
    username: 'admin.user',
    actionPerformed: 'update',
    targetType: 'policy',
    targetId: 'policy-001',
    sourceIp: '192.168.1.101',
    userAgent: 'Mozilla/5.0',
    additionalData: {},
    requiresInvestigation: false,
    retentionCategory: 'compliance',
    archived: false,
    eventTimestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    processingTimestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock Directory Integrations
export const mockDirectoryIntegrations: DirectoryIntegration[] = [
  {
    id: 'dir-001',
    tenantId: 'ksa-upstream-jv',
    name: 'Corporate Azure AD',
    type: 'azure-ad',
    status: 'active',
    description: 'Primary corporate identity provider',
    domain: 'example.com',
    serverUrl: 'https://login.microsoftonline.com/example.onmicrosoft.com',
    port: 443,
    useSsl: true,
    syncedUsers: 1250,
    syncedGroups: 45,
    errorCount: 0,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'dir-002',
    tenantId: 'ksa-upstream-jv',
    name: 'Local LDAP',
    type: 'ldap',
    status: 'inactive',
    description: 'Legacy LDAP directory',
    domain: 'internal.local',
    serverUrl: 'ldap://10.0.5.10',
    port: 389,
    useSsl: false,
    syncedUsers: 0,
    syncedGroups: 0,
    errorCount: 0,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

// Mock MFA Rules
export const mockMfaRules: MfaRule[] = [
  {
    id: 'mfa-001',
    tenantId: 'ksa-upstream-jv',
    name: 'Critical Operations MFA',
    description: 'Require MFA for all critical transmission operations',
    status: 'active',
    priority: 1,
    conditions: { userRoles: ['operator', 'engineer'], resourceTypes: ['transmission-control', 'scada-command'] },
    requirements: { mfaMethods: ['totp', 'hardware-token'], mfaRequired: true },
    exemptions: {},
    enforcement: 'strict',
    applicationsCount: 5,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

// Mock Session Rules
export const mockSessionRules: SessionRule[] = [
  {
    id: 'sess-001',
    tenantId: 'ksa-upstream-jv',
    name: 'Interactive User Sessions',
    description: 'Standard rules for interactive access',
    status: 'active',
    sessionType: 'interactive',
    maxDuration: 480,
    idleTimeout: 30,
    maxConcurrentSessions: 3,
    allowedLocations: ['Dubai Operations Center'],
    allowedIpRanges: ['192.168.1.0/24'],
    deviceRestrictions: { allowMobile: true },
    activeSessions: 45,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

// Mock Endpoint Baselines
export const mockEndpointBaselines: EndpointBaseline[] = [
  {
    id: 'base-001',
    tenantId: 'ksa-upstream-jv',
    name: 'Protection Relay Security Baseline',
    description: 'Security hardening for protection relays',
    assetType: 'protection-relay',
    category: 'security',
    baselineVersion: 'v1.2.0',
    status: 'compliant',
    complianceScore: 96,
    totalEndpoints: 45,
    compliantEndpoints: 43,
    deviatingEndpoints: 2,
    criticalDeviations: 0,
    highDeviations: 1,
    mediumDeviations: 0,
    lowDeviations: 1,
    baselineRules: [],
    applicableZones: [],
    applicableSites: [],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

// Helper functions to filter mock data
export function getMockSecurityUsersByTenant(tenantId: string): SecurityUser[] {
  return mockSecurityUsers.filter(user => user.tenantId === tenantId);
}

export function getMockAccessPoliciesByTenant(tenantId: string): AccessPolicy[] {
  return mockAccessPolicies.filter(policy => policy.tenantId === tenantId);
}

export function getMockAccessRulesByPolicy(tenantId: string, policyId: string): AccessRule[] {
  return mockAccessRules.filter(rule => rule.tenantId === tenantId && rule.policyId === policyId);
}

export function getMockPrivilegedAccessSessionsByTenant(tenantId: string): PrivilegedAccessSession[] {
  return mockPrivilegedAccessSessions.filter(session => session.tenantId === tenantId);
}

export function getMockAuditLogEntriesByTenant(tenantId: string): SecurityAuditLogEntry[] {
  return mockAuditLogEntries.filter(entry => entry.tenantId === tenantId);
}

export function getMockDirectoryIntegrationsByTenant(tenantId: string): DirectoryIntegration[] {
  return mockDirectoryIntegrations.filter(integration => integration.tenantId === tenantId);
}

export function getMockMfaRulesByTenant(tenantId: string): MfaRule[] {
  return mockMfaRules.filter(rule => rule.tenantId === tenantId);
}

export function getMockSessionRulesByTenant(tenantId: string): SessionRule[] {
  return mockSessionRules.filter(rule => rule.tenantId === tenantId);
}

export function getMockEndpointBaselinesByTenant(tenantId: string): EndpointBaseline[] {
  return mockEndpointBaselines.filter(baseline => baseline.tenantId === tenantId);
}
