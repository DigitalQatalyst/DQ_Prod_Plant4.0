/**
 * Identity & Access Management Types
 * 
 * Defines interfaces for directory integrations, MFA rules, session rules, etc.
 */

export interface DirectoryIntegration {
    id: string;
    tenantId: string;
    name: string;
    type: string;
    status: string;
    description?: string;
    domain: string;
    serverUrl: string;
    port?: number;
    useSsl: boolean;
    baseDn?: string;
    bindDn?: string;
    userSearchBase?: string;
    groupSearchBase?: string;
    userFilter?: string;
    groupFilter?: string;
    attributeMapping?: Record<string, string>;
    roleMapping?: Record<string, string>;
    lastSync?: string;
    lastTest?: string;
    testResult?: string;
    testMessage?: string;
    syncedUsers: number;
    syncedGroups: number;
    errorCount: number;
    createdBy?: string;
    createdAt: string;
    updatedAt: string;
}

export interface MfaRule {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    status: string;
    priority: number;
    conditions: Record<string, any>;
    requirements: Record<string, any>;
    exemptions: Record<string, any>;
    enforcement: string;
    createdBy?: string;
    lastApplied?: string;
    applicationsCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface SessionRule {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    status: string;
    sessionType: string;
    maxDuration: number;
    idleTimeout: number;
    maxConcurrentSessions: number;
    allowedLocations: string[];
    allowedIpRanges: string[];
    deviceRestrictions: Record<string, any>;
    activeSessions: number;
    createdBy?: string;
    createdAt: string;
    updatedAt: string;
}

export interface EndpointBaseline {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    assetType: string;
    category: string;
    baselineVersion: string;
    status: string;
    complianceScore: number;
    totalEndpoints: number;
    compliantEndpoints: number;
    deviatingEndpoints: number;
    criticalDeviations: number;
    highDeviations: number;
    mediumDeviations: number;
    lowDeviations: number;
    baselineRules: any[];
    applicableZones: string[];
    applicableSites: string[];
    lastAssessment?: string;
    nextAssessment?: string;
    approvedBy?: string;
    approvedAt?: string;
    createdBy?: string;
    createdAt: string;
    updatedAt: string;
}
