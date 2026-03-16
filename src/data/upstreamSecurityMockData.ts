/**
 * Upstream Oil & Gas Security Mock Data
 * 
 * This module provides comprehensive mock data for upstream O&G security operations,
 * including tenants, sites, zones, assets, alerts, incidents, and compliance data.
 */

import {
  UpstreamTenant,
  UpstreamSite,
  SecurityZone,
  Conduit,
  UpstreamOtAsset,
  RemoteSession,
  UpstreamSecurityAlert,
  IncidentCase,
  AnomalySignal,
  UpstreamComplianceStandard,
  SecurityControl,
  SecurityException,
  ThreatIntelligence,
  RiskEntry,
  ResponsePlaybook,
  SoarAction,
  ForensicSnapshot,
  FieldGateway,
  ApiKeyServicePrincipal,
  SecurityUser,
  AccessPolicy,
  SecurityPolicy,
  PolicyApproval,
  SecurityAuditEntry,
  SecretCertificate,
  SecretRotationEntry,
  AuditReadiness,
  AuditRequirement,
  AuditEvidence,
  BackupPolicy,
  PlatformWorkload,
  ApplicationSecurityScan
} from '@/types/security';

// =============================================================================
// Upstream Tenants
// =============================================================================

export const upstreamTenants: UpstreamTenant[] = [
  {
    id: "alpha-upstream",
    name: "Alpha Upstream Ltd",
    type: "upstream-operator",
    region: "North America",
    basin: "Permian Basin"
  },
  {
    id: "ksa-upstream-jv",
    name: "KSA Upstream JV",
    type: "upstream-jv",
    region: "Middle East",
    basin: "Ghawar Basin"
  },
  {
    id: "offshore-field-alpha",
    name: "Offshore Field Alpha",
    type: "national-oil-company",
    region: "North Sea",
    basin: "North Sea Basin"
  },
  {
    id: "onshore-field-bravo",
    name: "Onshore Field Bravo",
    type: "field-operator",
    region: "Permian Basin",
    basin: "Permian"
  },
  // Additional tenants for compatibility with main mock data
  {
    id: "t1",
    name: "Kenya Power",
    type: "utility-company",
    region: "East Africa",
    basin: "East African Rift"
  },
  {
    id: "t2",
    name: "Kenya Tea",
    type: "agricultural-company",
    region: "East Africa",
    basin: "East African Rift"
  },
  {
    id: "t3",
    name: "Bamburi Cement",
    type: "manufacturing-company",
    region: "East Africa",
    basin: "East African Rift"
  },
  {
    id: "tenant-1",
    name: "Test Tenant",
    type: "test-company",
    region: "Test Region",
    basin: "Test Basin"
  }
];

// =============================================================================
// Upstream Sites
// =============================================================================

export const upstreamSites: UpstreamSite[] = [
  // Well Pads
  {
    id: "well-pad-alpha-01",
    tenantId: "ksa-upstream-jv",
    name: "Alpha Well Pad 01",
    type: "well-pad",
    region: "Middle East",
    basin: "Ghawar Basin",
    field: "North Ghawar",
    coordinates: { lat: 25.5, lng: 49.6 },
    securityPosture: "secure",
    zoneCompliance: 95,
    activeRemoteSessions: 2,
    criticalAssetCount: 8
  },
  {
    id: "well-pad-bravo-02",
    tenantId: "onshore-field-bravo",
    name: "Bravo Well Pad 02",
    type: "well-pad",
    region: "Permian Basin",
    basin: "Permian",
    field: "West Permian",
    coordinates: { lat: 31.8, lng: -102.4 },
    securityPosture: "at-risk",
    zoneCompliance: 78,
    activeRemoteSessions: 1,
    criticalAssetCount: 6
  },

  // Offshore Platforms
  {
    id: "platform-alpha-north",
    tenantId: "offshore-field-alpha",
    name: "Alpha North Platform",
    type: "offshore-platform",
    region: "North Sea",
    basin: "North Sea Basin",
    field: "Alpha Field",
    coordinates: { lat: 60.5, lng: 2.3 },
    securityPosture: "secure",
    zoneCompliance: 92,
    activeRemoteSessions: 3,
    criticalAssetCount: 12
  },

  // Central Processing Facilities
  {
    id: "cpf-ghawar-central",
    tenantId: "ksa-upstream-jv",
    name: "Ghawar Central Processing Facility",
    type: "cpf",
    region: "Middle East",
    basin: "Ghawar Basin",
    field: "Central Ghawar",
    coordinates: { lat: 25.2, lng: 49.8 },
    securityPosture: "critical",
    zoneCompliance: 85,
    activeRemoteSessions: 5,
    criticalAssetCount: 24
  },

  // Pipeline Stations
  {
    id: "pipeline-station-01",
    tenantId: "ksa-upstream-jv",
    name: "Pipeline Station 01",
    type: "pipeline-station",
    region: "Middle East",
    basin: "Ghawar Basin",
    field: "North Ghawar",
    coordinates: { lat: 25.7, lng: 49.4 },
    securityPosture: "at-risk",
    zoneCompliance: 82,
    activeRemoteSessions: 1,
    criticalAssetCount: 4
  },

  // Gas Processing Facilities
  {
    id: "gpf-north-sea-alpha",
    tenantId: "offshore-field-alpha",
    name: "North Sea Alpha GPF",
    type: "gpf",
    region: "North Sea",
    basin: "North Sea Basin",
    field: "Alpha Field",
    coordinates: { lat: 60.3, lng: 2.1 },
    securityPosture: "secure",
    zoneCompliance: 90,
    activeRemoteSessions: 2,
    criticalAssetCount: 9
  },

  // Gathering Stations
  {
    id: "gathering-station-west",
    tenantId: "onshore-field-bravo",
    name: "West Gathering Station",
    type: "gathering-station",
    region: "Permian Basin",
    basin: "Permian",
    field: "West Permian",
    coordinates: { lat: 31.9, lng: -102.6 },
    securityPosture: "secure",
    zoneCompliance: 88,
    activeRemoteSessions: 2,
    criticalAssetCount: 7
  }
];

// =============================================================================
// Security Zones
// =============================================================================

export const securityZones: SecurityZone[] = [
  // Well Pad Alpha 01 Zones
  {
    id: "zone-field-alpha-01",
    tenantId: "ksa-upstream-jv",
    siteId: "well-pad-alpha-01",
    name: "Field Zone - Alpha 01",
    type: "field",
    level: 1,
    assetCount: 15,
    complianceStatus: "compliant",
    policies: ["field-access-policy", "device-hardening-policy"]
  },
  {
    id: "zone-control-alpha-01",
    tenantId: "ksa-upstream-jv",
    siteId: "well-pad-alpha-01",
    name: "Control Zone - Alpha 01",
    type: "control",
    level: 2,
    assetCount: 8,
    complianceStatus: "compliant",
    policies: ["control-access-policy", "network-segmentation-policy"]
  },
  {
    id: "zone-sis-alpha-01",
    tenantId: "ksa-upstream-jv",
    siteId: "well-pad-alpha-01",
    name: "SIS Zone - Alpha 01",
    type: "sis",
    level: 4,
    assetCount: 3,
    complianceStatus: "compliant",
    policies: ["sis-access-policy", "safety-critical-policy"]
  },
  {
    id: "zone-dmz-alpha-01",
    tenantId: "ksa-upstream-jv",
    siteId: "well-pad-alpha-01",
    name: "DMZ Zone - Alpha 01",
    type: "dmz",
    level: 2,
    assetCount: 2,
    complianceStatus: "compliant",
    policies: ["dmz-access-policy", "remote-access-policy"]
  },
  {
    id: "zone-corporate-alpha-01",
    tenantId: "ksa-upstream-jv",
    siteId: "well-pad-alpha-01",
    name: "Corporate Zone - Alpha 01",
    type: "corporate",
    level: 1,
    assetCount: 1,
    complianceStatus: "compliant",
    policies: ["corporate-access-policy", "data-protection-policy"]
  },

  // Well Pad Bravo 02 Zones
  {
    id: "zone-field-bravo-02",
    tenantId: "onshore-field-bravo",
    siteId: "well-pad-bravo-02",
    name: "Field Zone - Bravo 02",
    type: "field",
    level: 1,
    assetCount: 12,
    complianceStatus: "partial",
    policies: ["field-access-policy", "device-hardening-policy"]
  },
  {
    id: "zone-control-bravo-02",
    tenantId: "onshore-field-bravo",
    siteId: "well-pad-bravo-02",
    name: "Control Zone - Bravo 02",
    type: "control",
    level: 2,
    assetCount: 6,
    complianceStatus: "partial",
    policies: ["control-access-policy", "network-segmentation-policy"]
  },
  {
    id: "zone-dmz-bravo-02",
    tenantId: "onshore-field-bravo",
    siteId: "well-pad-bravo-02",
    name: "DMZ Zone - Bravo 02",
    type: "dmz",
    level: 2,
    assetCount: 2,
    complianceStatus: "non-compliant",
    policies: ["dmz-access-policy", "remote-access-policy"]
  },

  // Platform Alpha North Zones
  {
    id: "zone-field-platform-alpha",
    tenantId: "offshore-field-alpha",
    siteId: "platform-alpha-north",
    name: "Field Zone - Platform Alpha",
    type: "field",
    level: 1,
    assetCount: 18,
    complianceStatus: "compliant",
    policies: ["field-access-policy", "device-hardening-policy"]
  },
  {
    id: "zone-control-platform-alpha",
    tenantId: "offshore-field-alpha",
    siteId: "platform-alpha-north",
    name: "Control Zone - Platform Alpha",
    type: "control",
    level: 2,
    assetCount: 10,
    complianceStatus: "compliant",
    policies: ["control-access-policy", "network-segmentation-policy"]
  },
  {
    id: "zone-sis-platform-alpha",
    tenantId: "offshore-field-alpha",
    siteId: "platform-alpha-north",
    name: "SIS Zone - Platform Alpha",
    type: "sis",
    level: 4,
    assetCount: 6,
    complianceStatus: "compliant",
    policies: ["sis-access-policy", "safety-critical-policy"]
  },
  {
    id: "zone-dmz-platform-alpha",
    tenantId: "offshore-field-alpha",
    siteId: "platform-alpha-north",
    name: "DMZ Zone - Platform Alpha",
    type: "dmz",
    level: 2,
    assetCount: 3,
    complianceStatus: "compliant",
    policies: ["dmz-access-policy", "remote-access-policy"]
  },
  {
    id: "zone-corporate-platform-alpha",
    tenantId: "offshore-field-alpha",
    siteId: "platform-alpha-north",
    name: "Corporate Zone - Platform Alpha",
    type: "corporate",
    level: 1,
    assetCount: 2,
    complianceStatus: "compliant",
    policies: ["corporate-access-policy", "data-protection-policy"]
  },

  // CPF Ghawar Central Zones
  {
    id: "zone-field-cpf-ghawar",
    tenantId: "ksa-upstream-jv",
    siteId: "cpf-ghawar-central",
    name: "Field Zone - CPF Ghawar",
    type: "field",
    level: 1,
    assetCount: 25,
    complianceStatus: "compliant",
    policies: ["field-access-policy", "device-hardening-policy"]
  },
  {
    id: "zone-control-cpf-ghawar",
    tenantId: "ksa-upstream-jv",
    siteId: "cpf-ghawar-central",
    name: "Control Zone - CPF Ghawar",
    type: "control",
    level: 2,
    assetCount: 15,
    complianceStatus: "compliant",
    policies: ["control-access-policy", "network-segmentation-policy"]
  },
  {
    id: "zone-sis-cpf-ghawar",
    tenantId: "ksa-upstream-jv",
    siteId: "cpf-ghawar-central",
    name: "SIS Zone - CPF Ghawar",
    type: "sis",
    level: 4,
    assetCount: 8,
    complianceStatus: "compliant",
    policies: ["sis-access-policy", "safety-critical-policy"]
  },
  {
    id: "zone-dmz-cpf-ghawar",
    tenantId: "ksa-upstream-jv",
    siteId: "cpf-ghawar-central",
    name: "DMZ Zone - CPF Ghawar",
    type: "dmz",
    level: 2,
    assetCount: 4,
    complianceStatus: "partial",
    policies: ["dmz-access-policy", "remote-access-policy"]
  },
  {
    id: "zone-corporate-cpf-ghawar",
    tenantId: "ksa-upstream-jv",
    siteId: "cpf-ghawar-central",
    name: "Corporate Zone - CPF Ghawar",
    type: "corporate",
    level: 1,
    assetCount: 3,
    complianceStatus: "compliant",
    policies: ["corporate-access-policy", "data-protection-policy"]
  },

  // Pipeline Station 01 Zones
  {
    id: "zone-field-pipeline-01",
    tenantId: "ksa-upstream-jv",
    siteId: "pipeline-station-01",
    name: "Field Zone - Pipeline 01",
    type: "field",
    level: 1,
    assetCount: 8,
    complianceStatus: "partial",
    policies: ["field-access-policy", "device-hardening-policy"]
  },
  {
    id: "zone-control-pipeline-01",
    tenantId: "ksa-upstream-jv",
    siteId: "pipeline-station-01",
    name: "Control Zone - Pipeline 01",
    type: "control",
    level: 2,
    assetCount: 4,
    complianceStatus: "partial",
    policies: ["control-access-policy", "network-segmentation-policy"]
  },
  {
    id: "zone-dmz-pipeline-01",
    tenantId: "ksa-upstream-jv",
    siteId: "pipeline-station-01",
    name: "DMZ Zone - Pipeline 01",
    type: "dmz",
    level: 2,
    assetCount: 2,
    complianceStatus: "non-compliant",
    policies: ["dmz-access-policy", "remote-access-policy"]
  },

  // GPF North Sea Alpha Zones
  {
    id: "zone-field-gpf-alpha",
    tenantId: "offshore-field-alpha",
    siteId: "gpf-north-sea-alpha",
    name: "Field Zone - GPF Alpha",
    type: "field",
    level: 1,
    assetCount: 16,
    complianceStatus: "compliant",
    policies: ["field-access-policy", "device-hardening-policy"]
  },
  {
    id: "zone-control-gpf-alpha",
    tenantId: "offshore-field-alpha",
    siteId: "gpf-north-sea-alpha",
    name: "Control Zone - GPF Alpha",
    type: "control",
    level: 2,
    assetCount: 9,
    complianceStatus: "compliant",
    policies: ["control-access-policy", "network-segmentation-policy"]
  },
  {
    id: "zone-dmz-gpf-alpha",
    tenantId: "offshore-field-alpha",
    siteId: "gpf-north-sea-alpha",
    name: "DMZ Zone - GPF Alpha",
    type: "dmz",
    level: 2,
    assetCount: 3,
    complianceStatus: "compliant",
    policies: ["dmz-access-policy", "remote-access-policy"]
  },

  // Gathering Station West Zones
  {
    id: "zone-field-gathering-west",
    tenantId: "onshore-field-bravo",
    siteId: "gathering-station-west",
    name: "Field Zone - Gathering West",
    type: "field",
    level: 1,
    assetCount: 14,
    complianceStatus: "compliant",
    policies: ["field-access-policy", "device-hardening-policy"]
  },
  {
    id: "zone-control-gathering-west",
    tenantId: "onshore-field-bravo",
    siteId: "gathering-station-west",
    name: "Control Zone - Gathering West",
    type: "control",
    level: 2,
    assetCount: 7,
    complianceStatus: "compliant",
    policies: ["control-access-policy", "network-segmentation-policy"]
  },
  {
    id: "zone-dmz-gathering-west",
    tenantId: "onshore-field-bravo",
    siteId: "gathering-station-west",
    name: "DMZ Zone - Gathering West",
    type: "dmz",
    level: 2,
    assetCount: 2,
    complianceStatus: "compliant",
    policies: ["dmz-access-policy", "remote-access-policy"]
  },
  {
    id: "zone-corporate-gathering-west",
    tenantId: "onshore-field-bravo",
    siteId: "gathering-station-west",
    name: "Corporate Zone - Gathering West",
    type: "corporate",
    level: 1,
    assetCount: 1,
    complianceStatus: "compliant",
    policies: ["corporate-access-policy", "data-protection-policy"]
  }
];

// =============================================================================
// Conduits
// =============================================================================

export const conduits: Conduit[] = [
  // Well Pad Alpha 01 Conduits
  {
    id: "conduit-field-control-alpha-01",
    tenantId: "ksa-upstream-jv",
    siteId: "well-pad-alpha-01",
    name: "Field to Control - Alpha 01",
    sourceZoneId: "zone-field-alpha-01",
    targetZoneId: "zone-control-alpha-01",
    protocol: "Modbus TCP",
    encrypted: true,
    policyCompliant: true,
    dataFlowDirection: "bidirectional"
  },
  {
    id: "conduit-control-sis-alpha-01",
    tenantId: "ksa-upstream-jv",
    siteId: "well-pad-alpha-01",
    name: "Control to SIS - Alpha 01",
    sourceZoneId: "zone-control-alpha-01",
    targetZoneId: "zone-sis-alpha-01",
    protocol: "Safety Protocol",
    encrypted: true,
    policyCompliant: true,
    dataFlowDirection: "unidirectional"
  },
  {
    id: "conduit-control-dmz-alpha-01",
    tenantId: "ksa-upstream-jv",
    siteId: "well-pad-alpha-01",
    name: "Control to DMZ - Alpha 01",
    sourceZoneId: "zone-control-alpha-01",
    targetZoneId: "zone-dmz-alpha-01",
    protocol: "HTTPS",
    encrypted: true,
    policyCompliant: true,
    dataFlowDirection: "bidirectional"
  },
  {
    id: "conduit-dmz-corporate-alpha-01",
    tenantId: "ksa-upstream-jv",
    siteId: "well-pad-alpha-01",
    name: "DMZ to Corporate - Alpha 01",
    sourceZoneId: "zone-dmz-alpha-01",
    targetZoneId: "zone-corporate-alpha-01",
    protocol: "HTTPS",
    encrypted: true,
    policyCompliant: true,
    dataFlowDirection: "bidirectional"
  },

  // Well Pad Bravo 02 Conduits
  {
    id: "conduit-field-control-bravo-02",
    tenantId: "onshore-field-bravo",
    siteId: "well-pad-bravo-02",
    name: "Field to Control - Bravo 02",
    sourceZoneId: "zone-field-bravo-02",
    targetZoneId: "zone-control-bravo-02",
    protocol: "Modbus TCP",
    encrypted: false,
    policyCompliant: false,
    dataFlowDirection: "bidirectional"
  },
  {
    id: "conduit-control-dmz-bravo-02",
    tenantId: "onshore-field-bravo",
    siteId: "well-pad-bravo-02",
    name: "Control to DMZ - Bravo 02",
    sourceZoneId: "zone-control-bravo-02",
    targetZoneId: "zone-dmz-bravo-02",
    protocol: "HTTP",
    encrypted: false,
    policyCompliant: false,
    dataFlowDirection: "bidirectional"
  },

  // Platform Alpha North Conduits
  {
    id: "conduit-field-control-platform-alpha",
    tenantId: "offshore-field-alpha",
    siteId: "platform-alpha-north",
    name: "Field to Control - Platform Alpha",
    sourceZoneId: "zone-field-platform-alpha",
    targetZoneId: "zone-control-platform-alpha",
    protocol: "Modbus TCP",
    encrypted: true,
    policyCompliant: true,
    dataFlowDirection: "bidirectional"
  },
  {
    id: "conduit-control-sis-platform-alpha",
    tenantId: "offshore-field-alpha",
    siteId: "platform-alpha-north",
    name: "Control to SIS - Platform Alpha",
    sourceZoneId: "zone-control-platform-alpha",
    targetZoneId: "zone-sis-platform-alpha",
    protocol: "Safety Protocol",
    encrypted: true,
    policyCompliant: true,
    dataFlowDirection: "unidirectional"
  },
  {
    id: "conduit-control-dmz-platform-alpha",
    tenantId: "offshore-field-alpha",
    siteId: "platform-alpha-north",
    name: "Control to DMZ - Platform Alpha",
    sourceZoneId: "zone-control-platform-alpha",
    targetZoneId: "zone-dmz-platform-alpha",
    protocol: "HTTPS",
    encrypted: true,
    policyCompliant: true,
    dataFlowDirection: "bidirectional"
  },
  {
    id: "conduit-dmz-corporate-platform-alpha",
    tenantId: "offshore-field-alpha",
    siteId: "platform-alpha-north",
    name: "DMZ to Corporate - Platform Alpha",
    sourceZoneId: "zone-dmz-platform-alpha",
    targetZoneId: "zone-corporate-platform-alpha",
    protocol: "HTTPS",
    encrypted: true,
    policyCompliant: true,
    dataFlowDirection: "bidirectional"
  },

  // CPF Ghawar Central Conduits
  {
    id: "conduit-field-control-cpf-ghawar",
    tenantId: "ksa-upstream-jv",
    siteId: "cpf-ghawar-central",
    name: "Field to Control - CPF Ghawar",
    sourceZoneId: "zone-field-cpf-ghawar",
    targetZoneId: "zone-control-cpf-ghawar",
    protocol: "Modbus TCP",
    encrypted: true,
    policyCompliant: true,
    dataFlowDirection: "bidirectional"
  },
  {
    id: "conduit-control-sis-cpf-ghawar",
    tenantId: "ksa-upstream-jv",
    siteId: "cpf-ghawar-central",
    name: "Control to SIS - CPF Ghawar",
    sourceZoneId: "zone-control-cpf-ghawar",
    targetZoneId: "zone-sis-cpf-ghawar",
    protocol: "Safety Protocol",
    encrypted: true,
    policyCompliant: true,
    dataFlowDirection: "unidirectional"
  },
  {
    id: "conduit-control-dmz-cpf-ghawar",
    tenantId: "ksa-upstream-jv",
    siteId: "cpf-ghawar-central",
    name: "Control to DMZ - CPF Ghawar",
    sourceZoneId: "zone-control-cpf-ghawar",
    targetZoneId: "zone-dmz-cpf-ghawar",
    protocol: "HTTPS",
    encrypted: true,
    policyCompliant: false,
    dataFlowDirection: "bidirectional"
  },
  {
    id: "conduit-dmz-corporate-cpf-ghawar",
    tenantId: "ksa-upstream-jv",
    siteId: "cpf-ghawar-central",
    name: "DMZ to Corporate - CPF Ghawar",
    sourceZoneId: "zone-dmz-cpf-ghawar",
    targetZoneId: "zone-corporate-cpf-ghawar",
    protocol: "HTTPS",
    encrypted: true,
    policyCompliant: true,
    dataFlowDirection: "bidirectional"
  },

  // Pipeline Station 01 Conduits
  {
    id: "conduit-field-control-pipeline-01",
    tenantId: "ksa-upstream-jv",
    siteId: "pipeline-station-01",
    name: "Field to Control - Pipeline 01",
    sourceZoneId: "zone-field-pipeline-01",
    targetZoneId: "zone-control-pipeline-01",
    protocol: "Modbus TCP",
    encrypted: false,
    policyCompliant: false,
    dataFlowDirection: "bidirectional"
  },
  {
    id: "conduit-control-dmz-pipeline-01",
    tenantId: "ksa-upstream-jv",
    siteId: "pipeline-station-01",
    name: "Control to DMZ - Pipeline 01",
    sourceZoneId: "zone-control-pipeline-01",
    targetZoneId: "zone-dmz-pipeline-01",
    protocol: "HTTP",
    encrypted: false,
    policyCompliant: false,
    dataFlowDirection: "bidirectional"
  },

  // GPF North Sea Alpha Conduits
  {
    id: "conduit-field-control-gpf-alpha",
    tenantId: "offshore-field-alpha",
    siteId: "gpf-north-sea-alpha",
    name: "Field to Control - GPF Alpha",
    sourceZoneId: "zone-field-gpf-alpha",
    targetZoneId: "zone-control-gpf-alpha",
    protocol: "Modbus TCP",
    encrypted: true,
    policyCompliant: true,
    dataFlowDirection: "bidirectional"
  },
  {
    id: "conduit-control-dmz-gpf-alpha",
    tenantId: "offshore-field-alpha",
    siteId: "gpf-north-sea-alpha",
    name: "Control to DMZ - GPF Alpha",
    sourceZoneId: "zone-control-gpf-alpha",
    targetZoneId: "zone-dmz-gpf-alpha",
    protocol: "HTTPS",
    encrypted: true,
    policyCompliant: true,
    dataFlowDirection: "bidirectional"
  },

  // Gathering Station West Conduits
  {
    id: "conduit-field-control-gathering-west",
    tenantId: "onshore-field-bravo",
    siteId: "gathering-station-west",
    name: "Field to Control - Gathering West",
    sourceZoneId: "zone-field-gathering-west",
    targetZoneId: "zone-control-gathering-west",
    protocol: "Modbus TCP",
    encrypted: true,
    policyCompliant: true,
    dataFlowDirection: "bidirectional"
  },
  {
    id: "conduit-control-dmz-gathering-west",
    tenantId: "onshore-field-bravo",
    siteId: "gathering-station-west",
    name: "Control to DMZ - Gathering West",
    sourceZoneId: "zone-control-gathering-west",
    targetZoneId: "zone-dmz-gathering-west",
    protocol: "HTTPS",
    encrypted: true,
    policyCompliant: true,
    dataFlowDirection: "bidirectional"
  },
  {
    id: "conduit-dmz-corporate-gathering-west",
    tenantId: "onshore-field-bravo",
    siteId: "gathering-station-west",
    name: "DMZ to Corporate - Gathering West",
    sourceZoneId: "zone-dmz-gathering-west",
    targetZoneId: "zone-corporate-gathering-west",
    protocol: "HTTPS",
    encrypted: true,
    policyCompliant: true,
    dataFlowDirection: "bidirectional"
  }
];

// =============================================================================
// Upstream OT Assets
// =============================================================================

export const upstreamOtAssets: UpstreamOtAsset[] = [
  // Wellhead PLCs
  {
    id: "wellhead-plc-alpha-01-wh01",
    tenantId: "ksa-upstream-jv",
    siteId: "well-pad-alpha-01",
    zoneId: "zone-field-alpha-01",
    name: "Wellhead PLC Alpha-01-WH01",
    type: "wellhead-plc",
    manufacturer: "Schneider Electric",
    model: "Modicon M580",
    firmwareVersion: "3.20",
    criticality: "safety-critical",
    securityStatus: "secure",
    inSafetyLoop: true,
    highPressure: true,
    vulnerabilityCount: 0,
    openAlerts: 0,
    lastSecurityScan: "2024-01-15T08:00:00Z",
    riskScore: 25,
    networkExposure: "internal",
    patchStatus: "up-to-date"
  },

  // RTUs
  {
    id: "rtu-pipeline-01",
    tenantId: "ksa-upstream-jv",
    siteId: "pipeline-station-01",
    zoneId: "zone-field-pipeline-01",
    name: "Pipeline RTU 01",
    type: "rtu",
    manufacturer: "ABB",
    model: "RTU560",
    firmwareVersion: "2.1.5",
    criticality: "production-critical",
    securityStatus: "at-risk",
    inSafetyLoop: false,
    highPressure: true,
    vulnerabilityCount: 2,
    openAlerts: 1,
    lastSecurityScan: "2024-01-14T10:00:00Z",
    riskScore: 65,
    networkExposure: "dmz",
    patchStatus: "pending"
  },

  // SIS Controllers
  {
    id: "sis-platform-alpha-esd",
    tenantId: "offshore-field-alpha",
    siteId: "platform-alpha-north",
    zoneId: "zone-sis-platform-alpha",
    name: "Platform Alpha ESD System",
    type: "sis",
    manufacturer: "Honeywell",
    model: "FSC",
    firmwareVersion: "R510.2",
    criticality: "safety-critical",
    securityStatus: "secure",
    inSafetyLoop: true,
    highPressure: true,
    vulnerabilityCount: 0,
    openAlerts: 0,
    lastSecurityScan: "2024-01-15T06:00:00Z",
    riskScore: 15,
    networkExposure: "internal",
    patchStatus: "up-to-date"
  },

  // DCS Systems
  {
    id: "dcs-cpf-ghawar-main",
    tenantId: "ksa-upstream-jv",
    siteId: "cpf-ghawar-central",
    zoneId: "zone-control-cpf-ghawar",
    name: "CPF Ghawar Main DCS",
    type: "dcs",
    manufacturer: "Emerson",
    model: "DeltaV",
    firmwareVersion: "14.3.1",
    criticality: "production-critical",
    securityStatus: "secure",
    inSafetyLoop: false,
    highPressure: false,
    vulnerabilityCount: 1,
    openAlerts: 0,
    lastSecurityScan: "2024-01-15T12:00:00Z",
    riskScore: 35,
    networkExposure: "internal",
    patchStatus: "up-to-date"
  },

  // SCADA Masters
  {
    id: "scada-master-ghawar",
    tenantId: "ksa-upstream-jv",
    siteId: "cpf-ghawar-central",
    zoneId: "zone-control-cpf-ghawar",
    name: "Ghawar SCADA Master",
    type: "scada-master",
    manufacturer: "Wonderware",
    model: "System Platform",
    firmwareVersion: "2020R2",
    criticality: "production-critical",
    securityStatus: "at-risk",
    inSafetyLoop: false,
    highPressure: false,
    vulnerabilityCount: 3,
    openAlerts: 2,
    lastSecurityScan: "2024-01-14T14:00:00Z",
    riskScore: 72,
    networkExposure: "dmz",
    patchStatus: "overdue"
  },

  // Pipeline Valves
  {
    id: "pipeline-valve-main-01",
    tenantId: "ksa-upstream-jv",
    siteId: "pipeline-station-01",
    zoneId: "zone-field-pipeline-01",
    name: "Main Pipeline Valve 01",
    type: "pipeline-valve",
    manufacturer: "Cameron",
    model: "Ball Valve 24\"",
    firmwareVersion: "1.2.3",
    criticality: "safety-critical",
    securityStatus: "secure",
    inSafetyLoop: true,
    highPressure: true,
    vulnerabilityCount: 0,
    openAlerts: 0,
    lastSecurityScan: "2024-01-15T09:00:00Z",
    riskScore: 20,
    networkExposure: "internal",
    patchStatus: "up-to-date"
  },

  // Compressors
  {
    id: "compressor-gathering-west-01",
    tenantId: "onshore-field-bravo",
    siteId: "gathering-station-west",
    zoneId: "zone-control-gathering-west",
    name: "West Gathering Compressor 01",
    type: "compressor",
    manufacturer: "GE",
    model: "Centrifugal C20+",
    firmwareVersion: "5.1.2",
    criticality: "production-critical",
    securityStatus: "at-risk",
    inSafetyLoop: false,
    highPressure: true,
    vulnerabilityCount: 1,
    openAlerts: 1,
    lastSecurityScan: "2024-01-14T16:00:00Z",
    riskScore: 58,
    networkExposure: "internal",
    patchStatus: "pending"
  },

  // Field Gateways
  {
    id: "field-gateway-alpha-01",
    tenantId: "ksa-upstream-jv",
    siteId: "well-pad-alpha-01",
    zoneId: "zone-field-alpha-01",
    name: "Alpha 01 Field Gateway",
    type: "field-gateway",
    manufacturer: "Cisco",
    model: "IE-4000",
    firmwareVersion: "15.2(7)E",
    criticality: "high",
    securityStatus: "secure",
    inSafetyLoop: false,
    highPressure: false,
    vulnerabilityCount: 0,
    openAlerts: 0,
    lastSecurityScan: "2024-01-15T11:00:00Z",
    riskScore: 30,
    networkExposure: "dmz",
    patchStatus: "up-to-date"
  },

  // Edge Devices
  {
    id: "edge-device-platform-alpha-01",
    tenantId: "offshore-field-alpha",
    siteId: "platform-alpha-north",
    zoneId: "zone-field-platform-alpha",
    name: "Platform Alpha Edge Device 01",
    type: "edge-device",
    manufacturer: "Dell",
    model: "Edge Gateway 3001",
    firmwareVersion: "1.4.0",
    criticality: "medium",
    securityStatus: "secure",
    inSafetyLoop: false,
    highPressure: false,
    vulnerabilityCount: 0,
    openAlerts: 0,
    lastSecurityScan: "2024-01-15T13:00:00Z",
    riskScore: 25,
    networkExposure: "internal",
    patchStatus: "up-to-date"
  },

  // ESD Systems
  {
    id: "esd-cpf-ghawar-main",
    tenantId: "ksa-upstream-jv",
    siteId: "cpf-ghawar-central",
    zoneId: "zone-sis-cpf-ghawar",
    name: "CPF Ghawar Main ESD",
    type: "esd",
    manufacturer: "Honeywell",
    model: "FSC ESD",
    firmwareVersion: "R510.3",
    criticality: "safety-critical",
    securityStatus: "secure",
    inSafetyLoop: true,
    highPressure: true,
    vulnerabilityCount: 0,
    openAlerts: 0,
    lastSecurityScan: "2024-01-15T07:00:00Z",
    riskScore: 10,
    networkExposure: "internal",
    patchStatus: "up-to-date"
  },

  // Pumps
  {
    id: "pump-cpf-ghawar-export",
    tenantId: "ksa-upstream-jv",
    siteId: "cpf-ghawar-central",
    zoneId: "zone-control-cpf-ghawar",
    name: "CPF Ghawar Export Pump",
    type: "pump",
    manufacturer: "Sulzer",
    model: "API 610 OH2",
    firmwareVersion: "2.1.0",
    criticality: "production-critical",
    securityStatus: "secure",
    inSafetyLoop: false,
    highPressure: true,
    vulnerabilityCount: 0,
    openAlerts: 0,
    lastSecurityScan: "2024-01-15T10:00:00Z",
    riskScore: 30,
    networkExposure: "internal",
    patchStatus: "up-to-date"
  },

  // Separators
  {
    id: "separator-cpf-ghawar-main",
    tenantId: "ksa-upstream-jv",
    siteId: "cpf-ghawar-central",
    zoneId: "zone-control-cpf-ghawar",
    name: "CPF Ghawar Main Separator",
    type: "separator",
    manufacturer: "Cameron",
    model: "3-Phase Separator",
    firmwareVersion: "1.5.2",
    criticality: "production-critical",
    securityStatus: "secure",
    inSafetyLoop: false,
    highPressure: true,
    vulnerabilityCount: 1,
    openAlerts: 0,
    lastSecurityScan: "2024-01-15T09:30:00Z",
    riskScore: 35,
    networkExposure: "internal",
    patchStatus: "up-to-date"
  },

  // Heaters
  {
    id: "heater-cpf-ghawar-inlet",
    tenantId: "ksa-upstream-jv",
    siteId: "cpf-ghawar-central",
    zoneId: "zone-control-cpf-ghawar",
    name: "CPF Ghawar Inlet Heater",
    type: "heater",
    manufacturer: "John Zink",
    model: "Process Heater H-101",
    firmwareVersion: "3.2.1",
    criticality: "production-critical",
    securityStatus: "at-risk",
    inSafetyLoop: false,
    highPressure: false,
    vulnerabilityCount: 2,
    openAlerts: 1,
    lastSecurityScan: "2024-01-14T15:00:00Z",
    riskScore: 55,
    networkExposure: "internal",
    patchStatus: "pending"
  },

  // Flare Systems
  {
    id: "flare-system-platform-alpha",
    tenantId: "offshore-field-alpha",
    siteId: "platform-alpha-north",
    zoneId: "zone-sis-platform-alpha",
    name: "Platform Alpha Flare System",
    type: "flare-system",
    manufacturer: "Zeeco",
    model: "Elevated Flare F-101",
    firmwareVersion: "2.0.5",
    criticality: "safety-critical",
    securityStatus: "secure",
    inSafetyLoop: true,
    highPressure: true,
    vulnerabilityCount: 0,
    openAlerts: 0,
    lastSecurityScan: "2024-01-15T08:30:00Z",
    riskScore: 20,
    networkExposure: "internal",
    patchStatus: "up-to-date"
  },

  // Xmas Trees
  {
    id: "xmas-tree-alpha-01-wh01",
    tenantId: "ksa-upstream-jv",
    siteId: "well-pad-alpha-01",
    zoneId: "zone-field-alpha-01",
    name: "Alpha 01 WH01 Xmas Tree",
    type: "xmas-tree",
    manufacturer: "Cameron",
    model: "Conventional Xmas Tree",
    firmwareVersion: "1.0.3",
    criticality: "safety-critical",
    securityStatus: "secure",
    inSafetyLoop: true,
    highPressure: true,
    vulnerabilityCount: 0,
    openAlerts: 0,
    lastSecurityScan: "2024-01-15T11:30:00Z",
    riskScore: 15,
    networkExposure: "internal",
    patchStatus: "up-to-date"
  },
  {
    id: "xmas-tree-bravo-02-wh01",
    tenantId: "onshore-field-bravo",
    siteId: "well-pad-bravo-02",
    zoneId: "zone-field-bravo-02",
    name: "Bravo 02 WH01 Xmas Tree",
    type: "xmas-tree",
    manufacturer: "Cameron",
    model: "Conventional Xmas Tree",
    firmwareVersion: "1.0.1",
    criticality: "safety-critical",
    securityStatus: "at-risk",
    inSafetyLoop: true,
    highPressure: true,
    vulnerabilityCount: 1,
    openAlerts: 1,
    lastSecurityScan: "2024-01-14T09:00:00Z",
    riskScore: 45,
    networkExposure: "internal",
    patchStatus: "overdue"
  },

  // Additional RTUs for Pipeline Station
  {
    id: "rtu-pipeline-valve-control",
    tenantId: "ksa-upstream-jv",
    siteId: "pipeline-station-01",
    zoneId: "zone-control-pipeline-01",
    name: "Pipeline Valve Control RTU",
    type: "rtu",
    manufacturer: "ABB",
    model: "RTU560",
    firmwareVersion: "2.1.3",
    criticality: "safety-critical",
    securityStatus: "at-risk",
    inSafetyLoop: true,
    highPressure: true,
    vulnerabilityCount: 3,
    openAlerts: 2,
    lastSecurityScan: "2024-01-13T14:00:00Z",
    riskScore: 78,
    networkExposure: "dmz",
    patchStatus: "overdue"
  },

  // Additional Wellhead PLCs
  {
    id: "wellhead-plc-bravo-02-wh01",
    tenantId: "onshore-field-bravo",
    siteId: "well-pad-bravo-02",
    zoneId: "zone-field-bravo-02",
    name: "Wellhead PLC Bravo-02-WH01",
    type: "wellhead-plc",
    manufacturer: "Allen-Bradley",
    model: "ControlLogix 5580",
    firmwareVersion: "32.011",
    criticality: "safety-critical",
    securityStatus: "vulnerable",
    inSafetyLoop: true,
    highPressure: true,
    vulnerabilityCount: 4,
    openAlerts: 2,
    lastSecurityScan: "2024-01-13T10:00:00Z",
    riskScore: 85,
    networkExposure: "internal",
    patchStatus: "overdue"
  },

  // Additional SCADA Masters
  {
    id: "scada-master-platform-alpha",
    tenantId: "offshore-field-alpha",
    siteId: "platform-alpha-north",
    zoneId: "zone-control-platform-alpha",
    name: "Platform Alpha SCADA Master",
    type: "scada-master",
    manufacturer: "Wonderware",
    model: "System Platform",
    firmwareVersion: "2020R2",
    criticality: "production-critical",
    securityStatus: "secure",
    inSafetyLoop: false,
    highPressure: false,
    vulnerabilityCount: 0,
    openAlerts: 0,
    lastSecurityScan: "2024-01-15T14:00:00Z",
    riskScore: 25,
    networkExposure: "internal",
    patchStatus: "up-to-date"
  },

  // Additional Pipeline Valves
  {
    id: "pipeline-valve-isolation-01",
    tenantId: "ksa-upstream-jv",
    siteId: "pipeline-station-01",
    zoneId: "zone-field-pipeline-01",
    name: "Isolation Valve 01",
    type: "pipeline-valve",
    manufacturer: "Cameron",
    model: "Gate Valve 20\"",
    firmwareVersion: "1.1.5",
    criticality: "safety-critical",
    securityStatus: "at-risk",
    inSafetyLoop: true,
    highPressure: true,
    vulnerabilityCount: 2,
    openAlerts: 1,
    lastSecurityScan: "2024-01-14T11:00:00Z",
    riskScore: 65,
    networkExposure: "internal",
    patchStatus: "pending"
  },

  // Additional Compressors
  {
    id: "compressor-platform-alpha-01",
    tenantId: "offshore-field-alpha",
    siteId: "platform-alpha-north",
    zoneId: "zone-control-platform-alpha",
    name: "Platform Alpha Gas Compressor 01",
    type: "compressor",
    manufacturer: "GE",
    model: "Centrifugal C25+",
    firmwareVersion: "5.2.1",
    criticality: "production-critical",
    securityStatus: "secure",
    inSafetyLoop: false,
    highPressure: true,
    vulnerabilityCount: 0,
    openAlerts: 0,
    lastSecurityScan: "2024-01-15T12:00:00Z",
    riskScore: 30,
    networkExposure: "internal",
    patchStatus: "up-to-date"
  }
];

// =============================================================================
// Remote Sessions
// =============================================================================

export const remoteSessions: RemoteSession[] = [
  // Active Vendor Sessions
  {
    id: "session-vendor-alpha-01",
    tenantId: "ksa-upstream-jv",
    siteId: "well-pad-alpha-01",
    userId: "vendor-schneider-tech01",
    userName: "John Smith (Schneider)",
    userType: "vendor",
    vendorName: "Schneider Electric",
    sourceIp: "203.0.113.45",
    destinationAsset: "Wellhead PLC Alpha-01-WH01",
    destinationAssetId: "wellhead-plc-alpha-01-wh01",
    destinationZone: "field",
    protocol: "RDP",
    startTime: "2024-01-15T14:00:00Z",
    status: "active",
    accessLevel: "engineer",
    isSafetyCritical: true,
    commandsExecuted: 12,
    dataTransferred: "2.3 MB"
  },
  {
    id: "session-vendor-cameron-valve",
    tenantId: "ksa-upstream-jv",
    siteId: "pipeline-station-01",
    userId: "vendor-cameron-tech02",
    userName: "Mike Rodriguez (Cameron)",
    userType: "vendor",
    vendorName: "Cameron International",
    sourceIp: "198.51.100.23",
    destinationAsset: "Main Pipeline Valve 01",
    destinationAssetId: "pipeline-valve-main-01",
    destinationZone: "field",
    protocol: "SSH",
    startTime: "2024-01-15T13:45:00Z",
    status: "active",
    accessLevel: "engineer",
    isSafetyCritical: true,
    commandsExecuted: 8,
    dataTransferred: "1.8 MB"
  },
  {
    id: "session-vendor-abb-rtu",
    tenantId: "onshore-field-bravo",
    siteId: "gathering-station-west",
    userId: "vendor-abb-support01",
    userName: "Lisa Chen (ABB)",
    userType: "vendor",
    vendorName: "ABB",
    sourceIp: "203.0.113.67",
    destinationAsset: "West Gathering Compressor 01",
    destinationAssetId: "compressor-gathering-west-01",
    destinationZone: "control",
    protocol: "VNC",
    startTime: "2024-01-15T12:30:00Z",
    status: "active",
    accessLevel: "engineer",
    isSafetyCritical: false,
    commandsExecuted: 15,
    dataTransferred: "3.2 MB"
  },

  // Active Internal Sessions
  {
    id: "session-internal-platform-alpha",
    tenantId: "offshore-field-alpha",
    siteId: "platform-alpha-north",
    userId: "internal-ops-manager-02",
    userName: "Sarah Johnson",
    userType: "internal",
    sourceIp: "192.168.1.100",
    destinationAsset: "Platform Alpha ESD System",
    destinationAssetId: "sis-platform-alpha-esd",
    destinationZone: "sis",
    protocol: "SSH",
    startTime: "2024-01-15T13:30:00Z",
    endTime: "2024-01-15T14:15:00Z",
    status: "completed",
    accessLevel: "operator",
    isSafetyCritical: true,
    commandsExecuted: 5,
    dataTransferred: "1.1 MB"
  },
  {
    id: "session-internal-control-engineer",
    tenantId: "ksa-upstream-jv",
    siteId: "cpf-ghawar-central",
    userId: "internal-control-eng-01",
    userName: "Ahmed Al-Rashid",
    userType: "internal",
    sourceIp: "10.0.1.50",
    destinationAsset: "Ghawar SCADA Master",
    destinationAssetId: "scada-master-ghawar",
    destinationZone: "control",
    protocol: "RDP",
    startTime: "2024-01-15T14:20:00Z",
    status: "active",
    accessLevel: "admin",
    isSafetyCritical: false,
    commandsExecuted: 22,
    dataTransferred: "4.5 MB"
  },
  {
    id: "session-internal-field-tech",
    tenantId: "onshore-field-bravo",
    siteId: "well-pad-bravo-02",
    userId: "internal-field-tech-03",
    userName: "Robert Martinez",
    userType: "internal",
    sourceIp: "192.168.2.75",
    destinationAsset: "Wellhead PLC Bravo-02-WH01",
    destinationAssetId: "wellhead-plc-bravo-02-wh01",
    destinationZone: "field",
    protocol: "SSH",
    startTime: "2024-01-15T11:00:00Z",
    endTime: "2024-01-15T12:30:00Z",
    status: "completed",
    accessLevel: "operator",
    isSafetyCritical: true,
    commandsExecuted: 18,
    dataTransferred: "2.7 MB"
  },

  // Recent Completed Sessions
  {
    id: "session-vendor-honeywell-sis",
    tenantId: "offshore-field-alpha",
    siteId: "platform-alpha-north",
    userId: "vendor-honeywell-eng01",
    userName: "David Thompson (Honeywell)",
    userType: "vendor",
    vendorName: "Honeywell",
    sourceIp: "198.51.100.89",
    destinationAsset: "Platform Alpha Flare System",
    destinationAssetId: "flare-system-platform-alpha",
    destinationZone: "sis",
    protocol: "SSH",
    startTime: "2024-01-15T09:00:00Z",
    endTime: "2024-01-15T11:45:00Z",
    status: "completed",
    accessLevel: "engineer",
    isSafetyCritical: true,
    commandsExecuted: 35,
    dataTransferred: "6.8 MB"
  },
  {
    id: "session-consultant-security",
    tenantId: "ksa-upstream-jv",
    siteId: "cpf-ghawar-central",
    userId: "consultant-cybersec-01",
    userName: "Jennifer Park (CyberSec Consulting)",
    userType: "consultant",
    sourceIp: "203.0.113.112",
    destinationAsset: "CPF Ghawar Main DCS",
    destinationAssetId: "dcs-cpf-ghawar-main",
    destinationZone: "control",
    protocol: "HTTPS",
    startTime: "2024-01-15T08:00:00Z",
    endTime: "2024-01-15T10:30:00Z",
    status: "completed",
    accessLevel: "read-only",
    isSafetyCritical: false,
    commandsExecuted: 0,
    dataTransferred: "850 KB"
  },
  {
    id: "session-oem-ge-compressor",
    tenantId: "onshore-field-bravo",
    siteId: "gathering-station-west",
    userId: "oem-ge-support01",
    userName: "Carlos Silva (GE)",
    userType: "oem",
    vendorName: "General Electric",
    sourceIp: "198.51.100.156",
    destinationAsset: "West Gathering Compressor 01",
    destinationAssetId: "compressor-gathering-west-01",
    destinationZone: "control",
    protocol: "RDP",
    startTime: "2024-01-14T16:00:00Z",
    endTime: "2024-01-14T18:30:00Z",
    status: "completed",
    accessLevel: "engineer",
    isSafetyCritical: false,
    commandsExecuted: 42,
    dataTransferred: "8.1 MB"
  },

  // Terminated Sessions (Security Events)
  {
    id: "session-terminated-unauthorized",
    tenantId: "ksa-upstream-jv",
    siteId: "pipeline-station-01",
    userId: "unknown-user-001",
    userName: "Unknown User",
    userType: "vendor",
    sourceIp: "185.220.101.42",
    destinationAsset: "Pipeline RTU 01",
    destinationAssetId: "rtu-pipeline-01",
    destinationZone: "control",
    protocol: "SSH",
    startTime: "2024-01-15T02:15:00Z",
    endTime: "2024-01-15T02:18:00Z",
    status: "terminated",
    accessLevel: "operator",
    isSafetyCritical: false,
    commandsExecuted: 3,
    dataTransferred: "125 KB"
  },

  // Remote sessions for tenant t1 (for testing compatibility)
  {
    id: "session-vendor-t1-01",
    tenantId: "t1",
    siteId: "site-nairobi",
    userId: "vendor-schneider-t1-01",
    userName: "John Smith (Schneider Electric)",
    userType: "vendor",
    vendorName: "Schneider Electric",
    sourceIp: "203.0.113.45",
    destinationAsset: "Main Transformer T1",
    destinationAssetId: "a1",
    destinationZone: "control",
    protocol: "HTTPS",
    startTime: "2024-01-15T14:00:00Z",
    status: "active",
    accessLevel: "operator",
    isSafetyCritical: false,
    commandsExecuted: 12,
    dataTransferred: "2.3 MB"
  },
  {
    id: "session-vendor-t1-02",
    tenantId: "t1",
    siteId: "site-kisumu",
    userId: "vendor-emerson-t1-01",
    userName: "Sarah Johnson (Emerson)",
    userType: "vendor",
    vendorName: "Emerson",
    sourceIp: "198.51.100.23",
    destinationAsset: "Backup Generator BG-1",
    destinationAssetId: "a3",
    destinationZone: "field",
    protocol: "SSH",
    startTime: "2024-01-15T13:30:00Z",
    endTime: "2024-01-15T14:15:00Z",
    status: "completed",
    accessLevel: "engineer",
    isSafetyCritical: false,
    commandsExecuted: 8,
    dataTransferred: "1.1 MB"
  }
];

// =============================================================================
// Security Alerts
// =============================================================================

export const upstreamSecurityAlerts: UpstreamSecurityAlert[] = [
  {
    id: "alert-valve-manipulation-01",
    tenantId: "ksa-upstream-jv",
    siteId: "pipeline-station-01",
    title: "Unauthorized Valve Position Change",
    description: "Main pipeline valve position changed without operator command",
    severity: "critical",
    status: "investigating",
    category: "valve-manipulation",
    affectedAsset: "Main Pipeline Valve 01",
    affectedAssetId: "pipeline-valve-main-01",
    affectedZone: "field",
    isSafetyCritical: true,
    timestamp: "2024-01-15T14:23:00Z",
    detectedBy: "SCADA Monitoring System",
    assignedTo: "Security Team Lead",
    recommendedActions: ["Isolate valve controller", "Verify valve position", "Check access logs"]
  },
  {
    id: "alert-pressure-anomaly-02",
    tenantId: "ksa-upstream-jv",
    siteId: "well-pad-alpha-01",
    title: "Wellhead Pressure Anomaly Detected",
    description: "Sudden pressure drop detected on wellhead WH01",
    severity: "high",
    status: "new",
    category: "pressure-anomaly",
    affectedAsset: "Wellhead PLC Alpha-01-WH01",
    affectedAssetId: "wellhead-plc-alpha-01-wh01",
    affectedZone: "field",
    isSafetyCritical: true,
    timestamp: "2024-01-15T14:15:00Z",
    detectedBy: "Pressure Monitoring System",
    recommendedActions: ["Check wellhead integrity", "Verify sensor readings", "Inspect choke valve"]
  },
  {
    id: "alert-sis-trip-03",
    tenantId: "offshore-field-alpha",
    siteId: "platform-alpha-north",
    title: "SIS Emergency Shutdown Triggered",
    description: "Emergency shutdown system activated due to high pressure alarm",
    severity: "critical",
    status: "acknowledged",
    category: "sis-trip",
    affectedAsset: "Platform Alpha ESD System",
    affectedAssetId: "sis-platform-alpha-esd",
    affectedZone: "sis",
    isSafetyCritical: true,
    timestamp: "2024-01-15T13:45:00Z",
    detectedBy: "SIS Controller",
    assignedTo: "Platform Safety Officer",
    recommendedActions: ["Investigate trip cause", "Verify system integrity", "Coordinate restart procedure"]
  },
  {
    id: "alert-unauthorized-access-04",
    tenantId: "ksa-upstream-jv",
    siteId: "cpf-ghawar-central",
    title: "Multiple Failed Login Attempts",
    description: "Multiple failed authentication attempts detected on SCADA system",
    severity: "high",
    status: "new",
    category: "unauthorized-access",
    affectedAsset: "Ghawar SCADA Master",
    affectedAssetId: "scada-master-ghawar",
    affectedZone: "control",
    isSafetyCritical: false,
    timestamp: "2024-01-15T14:30:00Z",
    detectedBy: "Authentication System",
    recommendedActions: ["Block source IP", "Review access logs", "Check user credentials"]
  },
  {
    id: "alert-remote-session-05",
    tenantId: "onshore-field-bravo",
    siteId: "gathering-station-west",
    title: "Unusual Remote Session Activity",
    description: "Remote session accessing compressor controls outside normal hours",
    severity: "medium",
    status: "new",
    category: "remote-session",
    affectedAsset: "West Gathering Compressor 01",
    affectedAssetId: "compressor-gathering-west-01",
    affectedZone: "control",
    isSafetyCritical: false,
    timestamp: "2024-01-15T14:00:00Z",
    detectedBy: "Session Monitor",
    recommendedActions: ["Verify session legitimacy", "Contact session owner", "Monitor session activity"]
  },
  {
    id: "alert-config-change-06",
    tenantId: "ksa-upstream-jv",
    siteId: "well-pad-alpha-01",
    title: "Unauthorized Configuration Change",
    description: "PLC configuration modified without change approval",
    severity: "high",
    status: "investigating",
    category: "config-change",
    affectedAsset: "Wellhead PLC Alpha-01-WH01",
    affectedAssetId: "wellhead-plc-alpha-01-wh01",
    affectedZone: "field",
    isSafetyCritical: true,
    timestamp: "2024-01-15T13:20:00Z",
    detectedBy: "Configuration Monitor",
    assignedTo: "Control Systems Engineer",
    recommendedActions: ["Review change logs", "Verify configuration integrity", "Rollback if necessary"]
  },
  {
    id: "alert-malware-07",
    tenantId: "offshore-field-alpha",
    siteId: "platform-alpha-north",
    title: "Potential Malware Detection",
    description: "Suspicious network traffic patterns detected on platform network",
    severity: "high",
    status: "investigating",
    category: "malware",
    affectedZone: "dmz",
    isSafetyCritical: false,
    timestamp: "2024-01-15T12:45:00Z",
    detectedBy: "Network Security Monitor",
    assignedTo: "Cybersecurity Analyst",
    recommendedActions: ["Isolate affected systems", "Run malware scan", "Analyze network traffic"]
  },
  {
    id: "alert-network-anomaly-08",
    tenantId: "ksa-upstream-jv",
    siteId: "cpf-ghawar-central",
    title: "Unusual Network Traffic Pattern",
    description: "Abnormal data transfer volume detected between control zones",
    severity: "medium",
    status: "new",
    category: "network-anomaly",
    affectedZone: "control",
    isSafetyCritical: false,
    timestamp: "2024-01-15T14:10:00Z",
    detectedBy: "Network Monitor",
    recommendedActions: ["Analyze traffic patterns", "Check for data exfiltration", "Verify legitimate operations"]
  },
  {
    id: "alert-auth-failure-09",
    tenantId: "onshore-field-bravo",
    siteId: "gathering-station-west",
    title: "Authentication System Failure",
    description: "Authentication service experiencing intermittent failures",
    severity: "medium",
    status: "acknowledged",
    category: "authentication-failure",
    isSafetyCritical: false,
    timestamp: "2024-01-15T13:55:00Z",
    detectedBy: "Authentication Monitor",
    assignedTo: "IT Support",
    recommendedActions: ["Restart authentication service", "Check system logs", "Verify user directory connectivity"]
  },
  // Alerts for tenant t1 (Kenya Power) for testing
  {
    id: "alert-config-change-t1-02",
    tenantId: "t1",
    siteId: "site-kisumu",
    title: "Suspicious Configuration Change",
    description: "Unauthorized configuration change detected on control system",
    severity: "critical",
    status: "investigating",
    category: "config-change",
    affectedAsset: "Control System PLC",
    affectedAssetId: "plc-control-system",
    affectedZone: "control",
    isSafetyCritical: true,
    timestamp: "2024-01-15T16:00:00Z",
    detectedBy: "Configuration Monitor",
    assignedTo: "Control Engineer",
    recommendedActions: ["Review change logs", "Verify configuration integrity", "Rollback if necessary"]
  },
  {
    id: "alert-unauthorized-access-t1-01",
    tenantId: "t1",
    siteId: "site-nairobi",
    title: "Unauthorized Access Attempt",
    description: "Multiple failed login attempts detected on power grid SCADA system",
    severity: "critical",
    status: "new",
    category: "unauthorized-access",
    affectedAsset: "Nairobi Grid SCADA Master",
    affectedAssetId: "scada-master-nairobi",
    affectedZone: "control",
    isSafetyCritical: true,
    timestamp: "2024-01-15T14:30:00Z",
    detectedBy: "Authentication System",
    recommendedActions: ["Block source IP", "Review access logs", "Check user credentials"]
  },
  {
    id: "alert-certificate-expiry-t1-03",
    tenantId: "t1",
    siteId: "site-nairobi",
    title: "Certificate Expiring Soon",
    description: "SSL certificate for grid communication gateway expires in 7 days",
    severity: "low",
    status: "resolved",
    category: "config-change",
    affectedAsset: "Grid Communication Gateway",
    affectedAssetId: "gateway-grid-comm",
    affectedZone: "dmz",
    isSafetyCritical: false,
    timestamp: "2024-01-15T14:20:00Z",
    detectedBy: "Certificate Monitor",
    recommendedActions: ["Renew SSL certificate", "Update gateway configuration", "Test connectivity"]
  }
];

// =============================================================================
// Incident Cases
// =============================================================================

export const incidentCases: IncidentCase[] = [
  {
    id: "incident-well-control-tampering-01",
    tenantId: "ksa-upstream-jv",
    title: "Well Control System Tampering Attempt",
    description: "Unauthorized attempt to modify well control parameters detected",
    severity: "critical",
    status: "investigating",
    category: "well-control-tampering",
    affectedSites: ["well-pad-alpha-01"],
    affectedAssets: ["wellhead-plc-alpha-01-wh01"],
    impactedWells: 3,
    assignedResponders: ["Security Team Lead", "Well Operations Manager", "Control Systems Engineer"],
    createdAt: "2024-01-15T14:00:00Z",
    updatedAt: "2024-01-15T14:30:00Z",
    containmentActions: ["Isolated affected PLCs", "Enabled manual control mode", "Increased monitoring"],
    requiresRegNotification: true
  },
  {
    id: "incident-pipeline-manipulation-02",
    tenantId: "ksa-upstream-jv",
    title: "Pipeline Valve Manipulation Incident",
    description: "Unauthorized valve operations detected on main pipeline",
    severity: "critical",
    status: "contained",
    category: "pipeline-manipulation",
    affectedSites: ["pipeline-station-01"],
    affectedAssets: ["pipeline-valve-main-01", "rtu-pipeline-01"],
    impactedPipelines: ["Main Export Pipeline"],
    assignedResponders: ["Pipeline Operations Manager", "Security Analyst", "Field Technician"],
    createdAt: "2024-01-15T13:30:00Z",
    updatedAt: "2024-01-15T14:45:00Z",
    containmentActions: ["Locked valve in safe position", "Disabled remote control", "Deployed field security"],
    requiresRegNotification: true
  },
  {
    id: "incident-sis-override-03",
    tenantId: "offshore-field-alpha",
    title: "Safety System Override Attempt",
    description: "Attempt to bypass safety interlocks on platform ESD system",
    severity: "critical",
    status: "resolved",
    category: "sis-override",
    affectedSites: ["platform-alpha-north"],
    affectedAssets: ["sis-platform-alpha-esd"],
    assignedResponders: ["Platform Safety Officer", "SIS Engineer", "Security Team"],
    createdAt: "2024-01-14T16:20:00Z",
    updatedAt: "2024-01-15T08:00:00Z",
    containmentActions: ["Verified SIS integrity", "Enhanced access controls", "Conducted safety review"],
    lessonsLearned: "Need additional monitoring on SIS bypass attempts",
    requiresRegNotification: true
  },
  {
    id: "incident-unauthorized-remote-access-04",
    tenantId: "onshore-field-bravo",
    title: "Unauthorized Remote Access Incident",
    description: "Unauthorized remote access session detected on compressor controls",
    severity: "high",
    status: "investigating",
    category: "unauthorized-remote-access",
    affectedSites: ["gathering-station-west"],
    affectedAssets: ["compressor-gathering-west-01"],
    assignedResponders: ["IT Security Manager", "Operations Supervisor"],
    createdAt: "2024-01-15T12:15:00Z",
    updatedAt: "2024-01-15T14:20:00Z",
    containmentActions: ["Terminated unauthorized session", "Changed access credentials", "Reviewed access logs"],
    requiresRegNotification: false
  },
  {
    id: "incident-data-exfiltration-05",
    tenantId: "ksa-upstream-jv",
    title: "Potential Data Exfiltration",
    description: "Unusual data transfer patterns suggesting potential data theft",
    severity: "high",
    status: "investigating",
    category: "data-exfiltration",
    affectedSites: ["cpf-ghawar-central"],
    affectedAssets: ["scada-master-ghawar", "dcs-cpf-ghawar-main"],
    assignedResponders: ["Cybersecurity Analyst", "Data Protection Officer", "Network Engineer"],
    createdAt: "2024-01-15T11:30:00Z",
    updatedAt: "2024-01-15T14:15:00Z",
    containmentActions: ["Blocked suspicious network traffic", "Isolated affected systems", "Preserved forensic evidence"],
    requiresRegNotification: false
  },
  {
    id: "incident-malware-infection-06",
    tenantId: "offshore-field-alpha",
    title: "Malware Infection on Platform Network",
    description: "Malware detected on platform operational network",
    severity: "high",
    status: "contained",
    category: "malware-infection",
    affectedSites: ["platform-alpha-north"],
    affectedAssets: ["edge-device-platform-alpha-01"],
    assignedResponders: ["IT Security Team", "Platform IT Manager", "Malware Analyst"],
    createdAt: "2024-01-15T09:45:00Z",
    updatedAt: "2024-01-15T13:30:00Z",
    containmentActions: ["Quarantined infected systems", "Deployed antimalware tools", "Updated security signatures"],
    requiresRegNotification: false
  }
];

// =============================================================================
// Anomaly Signals
// =============================================================================

export const anomalySignals: AnomalySignal[] = [
  {
    id: "anomaly-pressure-spike-01",
    tenantId: "ksa-upstream-jv",
    siteId: "well-pad-alpha-01",
    assetId: "wellhead-plc-alpha-01-wh01",
    type: "pressure-spike",
    severity: "critical",
    parameter: "Wellhead Pressure",
    baselineValue: 1500,
    observedValue: 2200,
    deviation: 46.7,
    unit: "psi",
    detectedAt: "2024-01-15T14:15:00Z",
    correlatedEvents: ["valve-position-change", "flow-rate-increase"],
    potentialCause: "Choke valve malfunction or unauthorized manipulation",
    isSafetyRelated: true
  },
  {
    id: "anomaly-flow-anomaly-02",
    tenantId: "onshore-field-bravo",
    siteId: "gathering-station-west",
    assetId: "compressor-gathering-west-01",
    type: "flow-anomaly",
    severity: "high",
    parameter: "Gas Flow Rate",
    baselineValue: 50.0,
    observedValue: 35.2,
    deviation: -29.6,
    unit: "MMSCFD",
    detectedAt: "2024-01-15T13:45:00Z",
    correlatedEvents: ["compressor-speed-change", "pressure-drop"],
    potentialCause: "Compressor performance degradation or upstream blockage",
    isSafetyRelated: false
  },
  {
    id: "anomaly-valve-state-change-03",
    tenantId: "ksa-upstream-jv",
    siteId: "pipeline-station-01",
    assetId: "pipeline-valve-main-01",
    type: "valve-state-change",
    severity: "critical",
    parameter: "Valve Position",
    baselineValue: 100,
    observedValue: 75,
    deviation: -25.0,
    unit: "%",
    detectedAt: "2024-01-15T14:23:00Z",
    correlatedEvents: ["unauthorized-access-attempt", "control-signal-anomaly"],
    potentialCause: "Unauthorized valve manipulation or control system compromise",
    isSafetyRelated: true
  },
  {
    id: "anomaly-sis-trip-04",
    tenantId: "offshore-field-alpha",
    siteId: "platform-alpha-north",
    assetId: "sis-platform-alpha-esd",
    type: "sis-trip",
    severity: "critical",
    parameter: "Safety System Status",
    baselineValue: 1,
    observedValue: 0,
    deviation: -100.0,
    unit: "status",
    detectedAt: "2024-01-15T13:45:00Z",
    correlatedEvents: ["high-pressure-alarm", "emergency-shutdown"],
    potentialCause: "High pressure condition triggering safety shutdown",
    isSafetyRelated: true
  },
  {
    id: "anomaly-temperature-deviation-05",
    tenantId: "ksa-upstream-jv",
    siteId: "cpf-ghawar-central",
    assetId: "dcs-cpf-ghawar-main",
    type: "temperature-deviation",
    severity: "medium",
    parameter: "Separator Temperature",
    baselineValue: 180,
    observedValue: 205,
    deviation: 13.9,
    unit: "°F",
    detectedAt: "2024-01-15T14:00:00Z",
    correlatedEvents: ["heating-system-malfunction", "flow-rate-change"],
    potentialCause: "Heating system malfunction or process upset",
    isSafetyRelated: false
  },
  {
    id: "anomaly-vibration-anomaly-06",
    tenantId: "onshore-field-bravo",
    siteId: "gathering-station-west",
    assetId: "compressor-gathering-west-01",
    type: "vibration-anomaly",
    severity: "high",
    parameter: "Compressor Vibration",
    baselineValue: 2.5,
    observedValue: 8.2,
    deviation: 228.0,
    unit: "mm/s",
    detectedAt: "2024-01-15T13:30:00Z",
    correlatedEvents: ["bearing-temperature-increase", "performance-degradation"],
    potentialCause: "Bearing failure or rotor imbalance",
    isSafetyRelated: false
  },
  {
    id: "anomaly-communication-loss-07",
    tenantId: "ksa-upstream-jv",
    siteId: "well-pad-alpha-01",
    assetId: "field-gateway-alpha-01",
    type: "communication-loss",
    severity: "high",
    parameter: "Network Connectivity",
    baselineValue: 100,
    observedValue: 0,
    deviation: -100.0,
    unit: "%",
    detectedAt: "2024-01-15T12:20:00Z",
    correlatedEvents: ["network-equipment-failure", "power-outage"],
    potentialCause: "Network equipment failure or cyber attack",
    isSafetyRelated: false
  }
];

// =============================================================================
// Compliance Standards
// =============================================================================

export const upstreamComplianceStandards: UpstreamComplianceStandard[] = [
  {
    id: "standard-api-1164",
    tenantId: "ksa-upstream-jv",
    name: "API 1164",
    fullName: "API 1164 - Pipeline SCADA Security",
    description: "American Petroleum Institute standard for pipeline SCADA security",
    complianceScore: 88,
    status: "compliant",
    applicableScope: {
      siteTypes: ["pipeline-station", "cpf"],
      assetTypes: ["scada-master", "rtu", "pipeline-valve"],
      zones: ["control", "dmz"]
    },
    requirements: [
      {
        id: "api-1164-req-01",
        code: "4.1",
        title: "Access Control",
        description: "Implement proper access controls for pipeline SCADA systems",
        status: "compliant",
        evidence: ["Multi-factor authentication implemented"],
        lastAssessed: "2024-01-10T00:00:00Z"
      },
      {
        id: "api-1164-req-02",
        code: "4.2",
        title: "Network Security",
        description: "Ensure network security for pipeline control systems",
        status: "compliant",
        evidence: ["Network segmentation and firewalls deployed"],
        lastAssessed: "2024-01-10T00:00:00Z"
      },
      {
        id: "api-1164-req-03",
        code: "4.3",
        title: "Monitoring and Logging",
        description: "Implement comprehensive monitoring and logging capabilities",
        status: "in-progress",
        evidence: ["Enhanced logging system under deployment"],
        lastAssessed: "2024-01-12T00:00:00Z"
      }
    ],
    lastAudit: "2023-12-15T00:00:00Z",
    nextAudit: "2024-06-15T00:00:00Z"
  },
  {
    id: "standard-iec-62443",
    tenantId: "offshore-field-alpha",
    name: "IEC 62443",
    fullName: "IEC 62443 - Industrial Automation and Control Systems Security",
    description: "International standard for industrial automation and control systems security",
    complianceScore: 92,
    status: "compliant",
    applicableScope: {
      siteTypes: ["offshore-platform", "well-pad", "cpf"],
      assetTypes: ["sis", "dcs", "wellhead-plc", "scada-master"],
      zones: ["field", "control", "sis"]
    },
    requirements: [
      {
        id: "iec-62443-req-01",
        code: "SR 1.1",
        title: "User identification and authentication",
        description: "Ensure proper user identification and authentication for ICS access",
        status: "compliant",
        evidence: ["Strong authentication mechanisms deployed"],
        lastAssessed: "2024-01-10T00:00:00Z"
      },
      {
        id: "iec-62443-req-02",
        code: "SR 2.1",
        title: "Network segmentation",
        description: "Implement proper network segmentation between zones",
        status: "compliant",
        evidence: ["Proper zone segmentation implemented"],
        lastAssessed: "2024-01-10T00:00:00Z"
      },
      {
        id: "iec-62443-req-03",
        code: "SR 3.1",
        title: "Communication integrity",
        description: "Ensure integrity of communications between ICS components",
        status: "compliant",
        evidence: ["Encrypted communications enabled"],
        lastAssessed: "2024-01-10T00:00:00Z"
      }
    ],
    lastAudit: "2024-01-05T00:00:00Z",
    nextAudit: "2024-07-05T00:00:00Z"
  },
  {
    id: "standard-nist-csf",
    tenantId: "onshore-field-bravo",
    name: "NIST CSF",
    fullName: "NIST Cybersecurity Framework",
    description: "Framework for improving critical infrastructure cybersecurity",
    complianceScore: 75,
    status: "in-progress",
    applicableScope: {
      siteTypes: ["well-pad", "gathering-station"],
      assetTypes: ["compressor", "field-gateway", "edge-device"],
      zones: ["field", "control", "dmz"]
    },
    requirements: [
      {
        id: "nist-csf-req-01",
        code: "ID.AM-1",
        title: "Physical devices and systems inventory",
        description: "Maintain inventory of physical devices and systems within the organization",
        status: "compliant",
        evidence: ["Comprehensive asset inventory maintained"],
        lastAssessed: "2024-01-14T00:00:00Z"
      },
      {
        id: "nist-csf-req-02",
        code: "PR.AC-1",
        title: "Access control policy",
        description: "Develop and maintain access control policy and procedures",
        status: "non-compliant",
        evidence: ["Policy review overdue"],
        lastAssessed: "2024-01-05T00:00:00Z"
      },
      {
        id: "nist-csf-req-03",
        code: "DE.CM-1",
        title: "Network monitoring",
        description: "Monitor network communications for anomalous activity",
        status: "compliant",
        evidence: ["24/7 monitoring active"],
        lastAssessed: "2024-01-14T00:00:00Z"
      }
    ],
    lastAudit: "2023-11-20T00:00:00Z",
    nextAudit: "2024-05-20T00:00:00Z"
  },
  {
    id: "standard-nist-800-82",
    tenantId: "ksa-upstream-jv",
    name: "NIST 800-82",
    fullName: "NIST SP 800-82 - Guide to Industrial Control Systems Security",
    description: "NIST special publication for ICS security guidance",
    complianceScore: 85,
    status: "compliant",
    applicableScope: {
      siteTypes: ["cpf", "pipeline-station", "well-pad"],
      assetTypes: ["dcs", "scada-master", "wellhead-plc", "sis"],
      zones: ["control", "sis", "field"]
    },
    requirements: [
      {
        id: "nist-800-82-req-01",
        code: "3.2.1",
        title: "Network Architecture",
        description: "Implement secure network architecture for ICS environments",
        status: "compliant",
        evidence: ["Proper network segmentation implemented"],
        lastAssessed: "2024-01-12T00:00:00Z"
      },
      {
        id: "nist-800-82-req-02",
        code: "3.2.2",
        title: "Security Controls",
        description: "Deploy appropriate security controls for ICS protection",
        status: "compliant",
        evidence: ["Security controls properly deployed"],
        lastAssessed: "2024-01-12T00:00:00Z"
      },
      {
        id: "nist-800-82-req-03",
        code: "3.2.3",
        title: "Incident Response",
        description: "Establish incident response procedures for ICS security events",
        status: "in-progress",
        evidence: ["Incident response procedures under review"],
        lastAssessed: "2024-01-08T00:00:00Z"
      }
    ],
    lastAudit: "2023-10-10T00:00:00Z",
    nextAudit: "2024-04-10T00:00:00Z"
  }
];

// =============================================================================
// Audit Readiness
// =============================================================================

export const auditReadiness: AuditReadiness[] = [
  {
    id: "audit-api-1164-2024",
    tenantId: "ksa-upstream-jv",
    name: "API 1164 Compliance Audit 2024",
    description: "Annual compliance audit for API 1164 Pipeline SCADA Security standard",
    type: "regulatory",
    standard: "API 1164",
    scope: {
      siteTypes: ["pipeline-station", "cpf", "gathering-station"],
      assetTypes: ["scada-master", "pipeline-valve", "rtu"],
      zones: ["control", "field", "dmz"],
      departments: ["Operations", "IT Security", "Compliance"]
    },
    scheduledDate: "2024-06-15T09:00:00Z",
    preparationStatus: "in-progress",
    overallReadiness: 78,
    requirements: [
      {
        id: "api-1164-req-01",
        code: "4.2.1",
        title: "Access Control Documentation",
        description: "Document all access control procedures for pipeline SCADA systems",
        category: "documentation",
        status: "complete",
        evidenceStatus: "available",
        evidenceItems: [
          {
            id: "doc-access-control-001",
            type: "document",
            name: "SCADA Access Control Procedures v2.1",
            description: "Comprehensive access control procedures for pipeline SCADA",
            location: "/compliance/docs/access-control-procedures-v2.1.pdf",
            status: "available",
            lastUpdated: "2024-01-15T00:00:00Z",
            size: "2.3 MB",
            format: "PDF"
          }
        ],
        gaps: [],
        assignedTo: "security-team@company.com",
        dueDate: "2024-05-15T00:00:00Z",
        priority: "high",
        upstreamRelevance: "safety-critical",
        lastUpdated: "2024-01-15T00:00:00Z"
      },
      {
        id: "api-1164-req-02",
        code: "4.3.2",
        title: "Network Segmentation Evidence",
        description: "Provide evidence of proper network segmentation between zones",
        category: "technical-control",
        status: "in-progress",
        evidenceStatus: "partial",
        evidenceItems: [
          {
            id: "config-firewall-001",
            type: "configuration",
            name: "Firewall Configuration Export",
            description: "Current firewall rules and network segmentation config",
            location: "/compliance/configs/firewall-config-2024-01.json",
            status: "available",
            lastUpdated: "2024-01-20T00:00:00Z",
            size: "156 KB",
            format: "JSON"
          }
        ],
        gaps: ["Missing documentation for DMZ-to-Control zone rules", "Outdated network diagrams"],
        assignedTo: "network-team@company.com",
        dueDate: "2024-04-30T00:00:00Z",
        priority: "critical",
        upstreamRelevance: "safety-critical",
        lastUpdated: "2024-01-20T00:00:00Z"
      },
      {
        id: "api-1164-req-03",
        code: "5.1.1",
        title: "Incident Response Logs",
        description: "Maintain logs of all security incidents affecting pipeline systems",
        category: "evidence",
        status: "gap-identified",
        evidenceStatus: "missing",
        evidenceItems: [],
        gaps: ["No centralized incident logging system", "Missing incident response procedures for pipeline-specific events"],
        assignedTo: "soc-team@company.com",
        dueDate: "2024-05-01T00:00:00Z",
        priority: "critical",
        upstreamRelevance: "production-critical",
        lastUpdated: "2024-01-10T00:00:00Z"
      }
    ],
    criticalGaps: [
      "Missing centralized incident logging system",
      "Outdated network segmentation documentation",
      "Incomplete vendor access procedures"
    ],
    assignedCoordinator: "compliance-manager@company.com",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-20T00:00:00Z",
    lastAssessment: "2024-01-20T00:00:00Z",
    daysUntilAudit: 146
  },
  {
    id: "audit-iec-62443-2024",
    tenantId: "ksa-upstream-jv",
    name: "IEC 62443 Certification Audit",
    description: "Third-party certification audit for IEC 62443 compliance",
    type: "certification",
    standard: "IEC 62443",
    scope: {
      siteTypes: ["well-pad", "offshore-platform", "cpf"],
      assetTypes: ["sis", "dcs", "wellhead-plc", "esd"],
      zones: ["sis", "control", "field"],
      departments: ["Safety", "Operations", "IT Security"]
    },
    scheduledDate: "2024-07-05T08:00:00Z",
    preparationStatus: "ready",
    overallReadiness: 92,
    requirements: [
      {
        id: "iec-62443-req-01",
        code: "SR 1.1",
        title: "Identification and Authentication Control",
        description: "Implement proper identification and authentication for all users",
        category: "technical-control",
        status: "complete",
        evidenceStatus: "available",
        evidenceItems: [
          {
            id: "config-auth-001",
            type: "configuration",
            name: "Authentication System Configuration",
            description: "Multi-factor authentication configuration for SIS access",
            location: "/compliance/configs/auth-config-sis.xml",
            status: "available",
            lastUpdated: "2024-01-18T00:00:00Z",
            size: "45 KB",
            format: "XML"
          },
          {
            id: "cert-mfa-001",
            type: "certificate",
            name: "MFA Implementation Certificate",
            description: "Third-party verification of MFA implementation",
            location: "/compliance/certs/mfa-verification-2024.pdf",
            status: "available",
            lastUpdated: "2024-01-10T00:00:00Z",
            size: "1.2 MB",
            format: "PDF"
          }
        ],
        gaps: [],
        assignedTo: "sis-team@company.com",
        dueDate: "2024-06-01T00:00:00Z",
        priority: "high",
        upstreamRelevance: "safety-critical",
        lastUpdated: "2024-01-18T00:00:00Z"
      },
      {
        id: "iec-62443-req-02",
        code: "SR 2.1",
        title: "Authorization Enforcement",
        description: "Enforce authorization policies for system access",
        category: "process",
        status: "complete",
        evidenceStatus: "available",
        evidenceItems: [
          {
            id: "doc-authz-001",
            type: "document",
            name: "Authorization Policy Document",
            description: "Detailed authorization policies for upstream systems",
            location: "/compliance/docs/authorization-policies-v3.0.pdf",
            status: "available",
            lastUpdated: "2024-01-12T00:00:00Z",
            size: "3.1 MB",
            format: "PDF"
          }
        ],
        gaps: [],
        assignedTo: "security-team@company.com",
        dueDate: "2024-06-15T00:00:00Z",
        priority: "medium",
        upstreamRelevance: "compliance",
        lastUpdated: "2024-01-12T00:00:00Z"
      }
    ],
    criticalGaps: [],
    assignedCoordinator: "certification-lead@company.com",
    createdAt: "2023-12-01T00:00:00Z",
    updatedAt: "2024-01-18T00:00:00Z",
    lastAssessment: "2024-01-18T00:00:00Z",
    daysUntilAudit: 166
  },
  {
    id: "audit-internal-q1-2024",
    tenantId: "offshore-field-alpha",
    name: "Q1 2024 Internal Security Audit",
    description: "Quarterly internal security audit for offshore operations",
    type: "internal",
    standard: "Internal Security Framework",
    scope: {
      siteTypes: ["offshore-platform"],
      assetTypes: ["dcs", "sis", "scada-master", "compressor"],
      zones: ["control", "sis", "field", "dmz"],
      departments: ["Offshore Operations", "IT Security", "HSE"]
    },
    scheduledDate: "2024-03-31T10:00:00Z",
    preparationStatus: "overdue",
    overallReadiness: 65,
    requirements: [
      {
        id: "internal-req-01",
        code: "INT-001",
        title: "Offshore Platform Security Assessment",
        description: "Comprehensive security assessment of offshore platform systems",
        category: "technical-control",
        status: "not-started",
        evidenceStatus: "missing",
        evidenceItems: [],
        gaps: ["Security assessment not initiated", "Missing vulnerability scan reports"],
        assignedTo: "offshore-security@company.com",
        dueDate: "2024-03-15T00:00:00Z",
        priority: "critical",
        upstreamRelevance: "safety-critical",
        lastUpdated: "2024-01-05T00:00:00Z"
      },
      {
        id: "internal-req-02",
        code: "INT-002",
        title: "Remote Access Review",
        description: "Review all remote access sessions to offshore platforms",
        category: "evidence",
        status: "in-progress",
        evidenceStatus: "partial",
        evidenceItems: [
          {
            id: "log-remote-001",
            type: "log-export",
            name: "Remote Access Logs Q4 2023",
            description: "Complete remote access logs for Q4 2023",
            location: "/compliance/logs/remote-access-q4-2023.csv",
            status: "available",
            lastUpdated: "2024-01-02T00:00:00Z",
            size: "8.7 MB",
            format: "CSV"
          }
        ],
        gaps: ["Missing Q1 2024 logs", "Incomplete vendor access documentation"],
        assignedTo: "access-control@company.com",
        dueDate: "2024-03-20T00:00:00Z",
        priority: "high",
        upstreamRelevance: "production-critical",
        lastUpdated: "2024-01-15T00:00:00Z"
      }
    ],
    criticalGaps: [
      "Security assessment not initiated",
      "Missing Q1 2024 remote access logs",
      "Overdue vulnerability assessments"
    ],
    assignedCoordinator: "internal-audit@company.com",
    createdAt: "2023-12-15T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
    lastAssessment: "2024-01-15T00:00:00Z",
    daysUntilAudit: 70
  },
  {
    id: "audit-nist-csf-2024",
    tenantId: "onshore-field-bravo",
    name: "NIST CSF Implementation Review",
    description: "Annual review of NIST Cybersecurity Framework implementation",
    type: "third-party",
    standard: "NIST CSF",
    scope: {
      siteTypes: ["well-pad", "gathering-station", "pipeline-station"],
      assetTypes: ["wellhead-plc", "rtu", "pipeline-valve", "field-gateway"],
      zones: ["field", "control", "dmz"],
      departments: ["Field Operations", "IT Security", "Compliance"]
    },
    scheduledDate: "2024-05-20T09:00:00Z",
    preparationStatus: "not-started",
    overallReadiness: 45,
    requirements: [
      {
        id: "nist-csf-req-01",
        code: "ID.AM-1",
        title: "Asset Management",
        description: "Maintain inventory of all physical devices and systems",
        category: "documentation",
        status: "gap-identified",
        evidenceStatus: "outdated",
        evidenceItems: [
          {
            id: "doc-asset-inv-001",
            type: "document",
            name: "Asset Inventory Spreadsheet",
            description: "Current asset inventory for field operations",
            location: "/compliance/docs/asset-inventory-2023.xlsx",
            status: "outdated",
            lastUpdated: "2023-06-15T00:00:00Z",
            size: "2.8 MB",
            format: "Excel"
          }
        ],
        gaps: ["Asset inventory is 8 months old", "Missing new well pad assets", "No automated discovery process"],
        assignedTo: "asset-management@company.com",
        dueDate: "2024-04-15T00:00:00Z",
        priority: "critical",
        upstreamRelevance: "production-critical",
        lastUpdated: "2024-01-08T00:00:00Z"
      },
      {
        id: "nist-csf-req-02",
        code: "PR.AC-1",
        title: "Access Control Policy",
        description: "Implement and maintain access control policies",
        category: "process",
        status: "not-started",
        evidenceStatus: "missing",
        evidenceItems: [],
        gaps: ["No formal access control policy", "Missing role definitions", "No access review process"],
        assignedTo: "policy-team@company.com",
        dueDate: "2024-04-01T00:00:00Z",
        priority: "critical",
        upstreamRelevance: "safety-critical",
        lastUpdated: "2024-01-05T00:00:00Z"
      }
    ],
    criticalGaps: [
      "Outdated asset inventory (8 months old)",
      "No formal access control policy",
      "Missing automated asset discovery",
      "No access review process implemented"
    ],
    assignedCoordinator: "nist-lead@company.com",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-08T00:00:00Z",
    lastAssessment: "2024-01-08T00:00:00Z",
    daysUntilAudit: 130
  }
];

// =============================================================================
// Security Controls
// =============================================================================

export const securityControls: SecurityControl[] = [
  // API 1164 Controls
  {
    id: "control-api-1164-access",
    tenantId: "ksa-upstream-jv",
    standardId: "standard-api-1164",
    code: "AC-01",
    title: "Pipeline SCADA Access Control",
    description: "Implement multi-factor authentication and role-based access for pipeline SCADA systems",
    category: "access-control",
    implementationStatus: "implemented",
    applicableSiteTypes: ["pipeline-station", "cpf"],
    applicableZones: ["control", "dmz"],
    upstreamRelevance: "critical",
    coveragePercentage: 95
  },
  {
    id: "control-api-1164-network",
    tenantId: "ksa-upstream-jv",
    standardId: "standard-api-1164",
    code: "NS-01",
    title: "Pipeline Network Segmentation",
    description: "Implement network segmentation between pipeline control systems and corporate networks",
    category: "network-security",
    implementationStatus: "implemented",
    applicableSiteTypes: ["pipeline-station", "cpf"],
    applicableZones: ["control", "field"],
    upstreamRelevance: "critical",
    coveragePercentage: 88
  },
  {
    id: "control-api-1164-monitoring",
    tenantId: "ksa-upstream-jv",
    standardId: "standard-api-1164",
    code: "MO-01",
    title: "Pipeline System Monitoring",
    description: "Continuous monitoring of pipeline control system activities and anomalies",
    category: "monitoring",
    implementationStatus: "partial",
    applicableSiteTypes: ["pipeline-station"],
    applicableZones: ["control", "field"],
    upstreamRelevance: "high",
    coveragePercentage: 72
  },

  // IEC 62443 Controls
  {
    id: "control-iec-62443-sis",
    tenantId: "offshore-field-alpha",
    standardId: "standard-iec-62443",
    code: "SL-4",
    title: "Safety Instrumented System Protection",
    description: "Implement Security Level 4 protection for safety instrumented systems",
    category: "physical-security",
    implementationStatus: "implemented",
    applicableSiteTypes: ["offshore-platform", "cpf"],
    applicableZones: ["sis"],
    upstreamRelevance: "critical",
    coveragePercentage: 98
  },
  {
    id: "control-iec-62443-zone",
    tenantId: "offshore-field-alpha",
    standardId: "standard-iec-62443",
    code: "ZC-01",
    title: "Zone and Conduit Security",
    description: "Implement security zones and conduits according to IEC 62443 guidelines",
    category: "network-security",
    implementationStatus: "implemented",
    applicableSiteTypes: ["offshore-platform", "well-pad", "cpf"],
    applicableZones: ["field", "control", "sis", "dmz"],
    upstreamRelevance: "critical",
    coveragePercentage: 92
  },
  {
    id: "control-iec-62443-incident",
    tenantId: "offshore-field-alpha",
    standardId: "standard-iec-62443",
    code: "IR-01",
    title: "Industrial Incident Response",
    description: "Establish incident response procedures for industrial control system security events",
    category: "incident-response",
    implementationStatus: "planned",
    applicableSiteTypes: ["offshore-platform", "cpf"],
    applicableZones: ["control", "sis"],
    upstreamRelevance: "high",
    coveragePercentage: 45
  },

  // NIST 800-82 Controls
  {
    id: "control-nist-800-82-wellhead",
    tenantId: "ksa-upstream-jv",
    standardId: "standard-nist-800-82",
    code: "SC-01",
    title: "Wellhead System Security",
    description: "Implement security controls for wellhead PLCs and control systems",
    category: "access-control",
    implementationStatus: "implemented",
    applicableSiteTypes: ["well-pad"],
    applicableZones: ["field", "control"],
    upstreamRelevance: "critical",
    coveragePercentage: 85
  },
  {
    id: "control-nist-800-82-data",
    tenantId: "ksa-upstream-jv",
    standardId: "standard-nist-800-82",
    code: "DP-01",
    title: "Production Data Protection",
    description: "Protect production and operational data from unauthorized access and modification",
    category: "data-protection",
    implementationStatus: "implemented",
    applicableSiteTypes: ["cpf", "well-pad", "pipeline-station"],
    applicableZones: ["control", "dmz"],
    upstreamRelevance: "high",
    coveragePercentage: 78
  },
  {
    id: "control-nist-800-82-change",
    tenantId: "onshore-field-bravo",
    standardId: "standard-nist-800-82",
    code: "CM-01",
    title: "Configuration Management",
    description: "Implement change management procedures for ICS configurations",
    category: "change-management",
    implementationStatus: "partial",
    applicableSiteTypes: ["well-pad", "gathering-station"],
    applicableZones: ["field", "control"],
    upstreamRelevance: "medium",
    coveragePercentage: 60
  },

  // Cross-tenant Controls
  {
    id: "control-remote-access-vendor",
    tenantId: "ksa-upstream-jv",
    standardId: "standard-api-1164",
    code: "RA-01",
    title: "Vendor Remote Access Control",
    description: "Control and monitor vendor remote access to upstream systems",
    category: "access-control",
    implementationStatus: "implemented",
    applicableSiteTypes: ["well-pad", "pipeline-station", "cpf"],
    applicableZones: ["field", "control"],
    upstreamRelevance: "critical",
    coveragePercentage: 90
  },
  {
    id: "control-physical-wellhead",
    tenantId: "onshore-field-bravo",
    standardId: "standard-nist-800-82",
    code: "PS-01",
    title: "Wellhead Physical Security",
    description: "Physical security controls for wellhead and field equipment",
    category: "physical-security",
    implementationStatus: "partial",
    applicableSiteTypes: ["well-pad"],
    applicableZones: ["field"],
    upstreamRelevance: "high",
    coveragePercentage: 65
  }
];

// =============================================================================
// Risk Entries
// =============================================================================

export const riskEntries: RiskEntry[] = [
  // Well Control Risks
  {
    id: "risk-well-control-tampering",
    tenantId: "ksa-upstream-jv",
    title: "Well Control System Tampering",
    description: "Risk of unauthorized modification to wellhead control systems leading to production loss or safety incidents",
    category: "well-control",
    likelihood: "medium",
    impact: "major",
    riskScore: 75,
    affectedSiteTypes: ["well-pad"],
    affectedAssetTypes: ["wellhead-plc", "xmas-tree"],
    treatmentStatus: "in-progress",
    treatmentPlan: "Implement enhanced access controls and monitoring for wellhead systems",
    riskOwner: "Ahmed Al-Rashid",
    lastReviewDate: "2024-01-10T00:00:00Z"
  },
  {
    id: "risk-well-blowout",
    tenantId: "ksa-upstream-jv",
    title: "Cyber-Induced Well Blowout",
    description: "Risk of cyber attack causing loss of well control leading to catastrophic blowout",
    category: "well-control",
    likelihood: "low",
    impact: "catastrophic",
    riskScore: 85,
    affectedSiteTypes: ["well-pad", "offshore-platform"],
    affectedAssetTypes: ["wellhead-plc", "sis", "esd"],
    treatmentStatus: "treated",
    treatmentPlan: "Air-gapped safety systems and redundant control mechanisms implemented",
    riskOwner: "Sarah Johnson",
    lastReviewDate: "2024-01-12T00:00:00Z"
  },

  // Pipeline Integrity Risks
  {
    id: "risk-pipeline-manipulation",
    tenantId: "ksa-upstream-jv",
    title: "Pipeline Valve Manipulation",
    description: "Risk of unauthorized pipeline valve operations causing flow disruption or pressure incidents",
    category: "pipeline-integrity",
    likelihood: "medium",
    impact: "major",
    riskScore: 70,
    affectedSiteTypes: ["pipeline-station"],
    affectedAssetTypes: ["pipeline-valve", "rtu"],
    treatmentStatus: "in-progress",
    treatmentPlan: "Deploy valve position monitoring and automated lockout systems",
    riskOwner: "Omar Khalil",
    lastReviewDate: "2024-01-08T00:00:00Z"
  },
  {
    id: "risk-pipeline-pressure-attack",
    tenantId: "offshore-field-alpha",
    title: "Pipeline Pressure Cyber Attack",
    description: "Risk of cyber attack manipulating pipeline pressure controls causing rupture or explosion",
    category: "pipeline-integrity",
    likelihood: "low",
    impact: "catastrophic",
    riskScore: 90,
    affectedSiteTypes: ["pipeline-station", "offshore-platform"],
    affectedAssetTypes: ["pipeline-valve", "compressor", "sis"],
    treatmentStatus: "treated",
    treatmentPlan: "Implemented pressure relief systems and emergency shutdown protocols",
    riskOwner: "Erik Nordahl",
    lastReviewDate: "2024-01-14T00:00:00Z"
  },

  // SIS Bypass Risks
  {
    id: "risk-sis-bypass-platform",
    tenantId: "offshore-field-alpha",
    title: "Safety System Bypass Attack",
    description: "Risk of cyber attack bypassing safety instrumented systems on offshore platform",
    category: "sis-bypass",
    likelihood: "low",
    impact: "catastrophic",
    riskScore: 95,
    affectedSiteTypes: ["offshore-platform"],
    affectedAssetTypes: ["sis", "esd", "flare-system"],
    treatmentStatus: "treated",
    treatmentPlan: "Air-gapped SIS networks and hardware-based safety interlocks",
    riskOwner: "Sarah Johnson",
    lastReviewDate: "2024-01-15T00:00:00Z"
  },
  {
    id: "risk-sis-override-cpf",
    tenantId: "ksa-upstream-jv",
    title: "CPF Safety Override Vulnerability",
    description: "Risk of unauthorized override of safety systems in central processing facility",
    category: "sis-bypass",
    likelihood: "medium",
    impact: "major",
    riskScore: 80,
    affectedSiteTypes: ["cpf"],
    affectedAssetTypes: ["sis", "esd", "separator"],
    treatmentStatus: "in-progress",
    treatmentPlan: "Implement dual-approval system for safety overrides",
    riskOwner: "Nadia Al-Zahra",
    lastReviewDate: "2024-01-11T00:00:00Z"
  },

  // Remote Access Risks
  {
    id: "risk-vendor-remote-access",
    tenantId: "ksa-upstream-jv",
    title: "Unauthorized Vendor Remote Access",
    description: "Risk of vendor credentials being compromised for unauthorized remote access",
    category: "remote-access",
    likelihood: "high",
    impact: "moderate",
    riskScore: 65,
    affectedSiteTypes: ["well-pad", "pipeline-station", "cpf"],
    affectedAssetTypes: ["wellhead-plc", "dcs", "scada-master"],
    treatmentStatus: "in-progress",
    treatmentPlan: "Implement time-limited access tokens and session monitoring",
    riskOwner: "Ahmed Al-Rashid",
    lastReviewDate: "2024-01-13T00:00:00Z"
  },
  {
    id: "risk-remote-session-hijack",
    tenantId: "onshore-field-bravo",
    title: "Remote Session Hijacking",
    description: "Risk of active remote sessions being hijacked by malicious actors",
    category: "remote-access",
    likelihood: "medium",
    impact: "moderate",
    riskScore: 55,
    affectedSiteTypes: ["well-pad", "gathering-station"],
    affectedAssetTypes: ["wellhead-plc", "compressor"],
    treatmentStatus: "accepted",
    treatmentPlan: "Risk accepted with compensating controls: session encryption and monitoring",
    riskOwner: "Mike Thompson",
    lastReviewDate: "2024-01-09T00:00:00Z"
  },

  // Data Breach Risks
  {
    id: "risk-production-data-theft",
    tenantId: "ksa-upstream-jv",
    title: "Production Data Exfiltration",
    description: "Risk of sensitive production and operational data being stolen",
    category: "data-breach",
    likelihood: "medium",
    impact: "moderate",
    riskScore: 60,
    affectedSiteTypes: ["cpf", "well-pad"],
    affectedAssetTypes: ["scada-master", "dcs"],
    treatmentStatus: "treated",
    treatmentPlan: "Data encryption and access logging implemented",
    riskOwner: "Nadia Al-Zahra",
    lastReviewDate: "2024-01-12T00:00:00Z"
  },

  // Malware Risks
  {
    id: "risk-ics-malware",
    tenantId: "offshore-field-alpha",
    title: "ICS-Targeted Malware",
    description: "Risk of specialized malware targeting industrial control systems",
    category: "malware",
    likelihood: "medium",
    impact: "major",
    riskScore: 75,
    affectedSiteTypes: ["offshore-platform", "cpf"],
    affectedAssetTypes: ["dcs", "scada-master", "sis"],
    treatmentStatus: "in-progress",
    treatmentPlan: "Deploy ICS-specific antimalware and network segmentation",
    riskOwner: "Anna Larsson",
    lastReviewDate: "2024-01-14T00:00:00Z"
  },

  // Insider Threat Risks
  {
    id: "risk-insider-sabotage",
    tenantId: "onshore-field-bravo",
    title: "Insider Sabotage of Operations",
    description: "Risk of malicious insider causing operational disruption or safety incidents",
    category: "insider-threat",
    likelihood: "low",
    impact: "major",
    riskScore: 50,
    affectedSiteTypes: ["well-pad", "gathering-station"],
    affectedAssetTypes: ["wellhead-plc", "compressor", "field-gateway"],
    treatmentStatus: "in-progress",
    treatmentPlan: "Enhanced background checks and activity monitoring",
    riskOwner: "Jessica Williams",
    lastReviewDate: "2024-01-10T00:00:00Z"
  },

  // Supply Chain Risks
  {
    id: "risk-vendor-compromise",
    tenantId: "ksa-upstream-jv",
    title: "Vendor Supply Chain Compromise",
    description: "Risk of security compromise through vendor equipment or software",
    category: "supply-chain",
    likelihood: "medium",
    impact: "moderate",
    riskScore: 58,
    affectedSiteTypes: ["well-pad", "cpf", "pipeline-station"],
    affectedAssetTypes: ["wellhead-plc", "dcs", "field-gateway"],
    treatmentStatus: "in-progress",
    treatmentPlan: "Vendor security assessments and secure procurement processes",
    riskOwner: "Ahmed Al-Rashid",
    lastReviewDate: "2024-01-11T00:00:00Z"
  }
];

// =============================================================================
// Security Users
// =============================================================================

export const securityUsers: SecurityUser[] = [
  // KSA Upstream JV Users
  {
    id: "user-ahmed-al-rashid",
    tenantId: "ksa-upstream-jv",
    name: "Ahmed Al-Rashid",
    email: "ahmed.alrashid@ksa-upstream.com",
    role: "ot-engineer",
    status: "active",
    siteAccess: ["well-pad-alpha-01", "cpf-ghawar-central", "pipeline-station-01"],
    zoneAccess: ["field", "control", "dmz"],
    lastLogin: "2024-01-15T14:20:00Z",
    mfaEnabled: true,
    privilegedAccess: true
  },
  {
    id: "user-fatima-hassan",
    tenantId: "ksa-upstream-jv",
    name: "Fatima Hassan",
    email: "fatima.hassan@ksa-upstream.com",
    role: "field-operator",
    status: "active",
    siteAccess: ["well-pad-alpha-01"],
    zoneAccess: ["field"],
    lastLogin: "2024-01-15T12:45:00Z",
    mfaEnabled: true,
    privilegedAccess: false
  },
  {
    id: "user-omar-khalil",
    tenantId: "ksa-upstream-jv",
    name: "Omar Khalil",
    email: "omar.khalil@ksa-upstream.com",
    role: "control-room-operator",
    status: "active",
    siteAccess: ["cpf-ghawar-central"],
    zoneAccess: ["control", "dmz"],
    lastLogin: "2024-01-15T13:30:00Z",
    mfaEnabled: true,
    privilegedAccess: false
  },
  {
    id: "user-nadia-security",
    tenantId: "ksa-upstream-jv",
    name: "Nadia Al-Zahra",
    email: "nadia.alzahra@ksa-upstream.com",
    role: "security-manager",
    status: "active",
    siteAccess: ["well-pad-alpha-01", "cpf-ghawar-central", "pipeline-station-01"],
    zoneAccess: ["field", "control", "sis", "dmz", "corporate"],
    lastLogin: "2024-01-15T14:45:00Z",
    mfaEnabled: true,
    privilegedAccess: true
  },

  // Offshore Field Alpha Users
  {
    id: "user-sarah-johnson",
    tenantId: "offshore-field-alpha",
    name: "Sarah Johnson",
    email: "sarah.johnson@offshore-alpha.com",
    role: "platform-supervisor",
    status: "active",
    siteAccess: ["platform-alpha-north"],
    zoneAccess: ["field", "control", "sis", "dmz"],
    lastLogin: "2024-01-15T13:30:00Z",
    mfaEnabled: true,
    privilegedAccess: true
  },
  {
    id: "user-erik-nordahl",
    tenantId: "offshore-field-alpha",
    name: "Erik Nordahl",
    email: "erik.nordahl@offshore-alpha.com",
    role: "ot-engineer",
    status: "active",
    siteAccess: ["platform-alpha-north"],
    zoneAccess: ["field", "control", "sis"],
    lastLogin: "2024-01-15T11:20:00Z",
    mfaEnabled: true,
    privilegedAccess: true
  },
  {
    id: "user-anna-security",
    tenantId: "offshore-field-alpha",
    name: "Anna Larsson",
    email: "anna.larsson@offshore-alpha.com",
    role: "soc-analyst",
    status: "active",
    siteAccess: ["platform-alpha-north"],
    zoneAccess: ["dmz", "corporate"],
    lastLogin: "2024-01-15T14:00:00Z",
    mfaEnabled: true,
    privilegedAccess: false
  },

  // Onshore Field Bravo Users
  {
    id: "user-robert-martinez",
    tenantId: "onshore-field-bravo",
    name: "Robert Martinez",
    email: "robert.martinez@onshore-bravo.com",
    role: "field-operator",
    status: "active",
    siteAccess: ["well-pad-bravo-02", "gathering-station-west"],
    zoneAccess: ["field"],
    lastLogin: "2024-01-15T11:00:00Z",
    mfaEnabled: false,
    privilegedAccess: false
  },
  {
    id: "user-jessica-control",
    tenantId: "onshore-field-bravo",
    name: "Jessica Williams",
    email: "jessica.williams@onshore-bravo.com",
    role: "control-room-operator",
    status: "active",
    siteAccess: ["gathering-station-west"],
    zoneAccess: ["control", "dmz"],
    lastLogin: "2024-01-15T13:15:00Z",
    mfaEnabled: true,
    privilegedAccess: false
  },
  {
    id: "user-mike-compliance",
    tenantId: "onshore-field-bravo",
    name: "Mike Thompson",
    email: "mike.thompson@onshore-bravo.com",
    role: "compliance-officer",
    status: "active",
    siteAccess: ["well-pad-bravo-02", "gathering-station-west"],
    zoneAccess: ["field", "control", "dmz", "corporate"],
    lastLogin: "2024-01-15T09:30:00Z",
    mfaEnabled: true,
    privilegedAccess: false
  },

  // Vendor Users
  {
    id: "vendor-schneider-tech01",
    tenantId: "ksa-upstream-jv",
    name: "John Smith (Schneider)",
    email: "john.smith@schneider-electric.com",
    role: "vendor-support",
    status: "active",
    siteAccess: ["well-pad-alpha-01"],
    zoneAccess: ["field"],
    lastLogin: "2024-01-15T14:00:00Z",
    mfaEnabled: true,
    privilegedAccess: false
  },
  {
    id: "vendor-cameron-tech02",
    tenantId: "ksa-upstream-jv",
    name: "Mike Rodriguez (Cameron)",
    email: "mike.rodriguez@cameron.com",
    role: "vendor-support",
    status: "active",
    siteAccess: ["pipeline-station-01"],
    zoneAccess: ["field"],
    lastLogin: "2024-01-15T13:45:00Z",
    mfaEnabled: true,
    privilegedAccess: false
  },

  // Vendor Users for tenant t1 (for testing compatibility)
  {
    id: "vendor-schneider-t1-01",
    tenantId: "t1",
    name: "John Smith (Schneider Electric)",
    email: "john.smith@schneider-electric.com",
    role: "vendor-support",
    status: "active",
    siteAccess: ["site-nairobi"],
    zoneAccess: ["field", "control"],
    lastLogin: "2024-01-15T14:00:00Z",
    mfaEnabled: true,
    privilegedAccess: false
  },
  {
    id: "vendor-emerson-t1-01",
    tenantId: "t1",
    name: "Sarah Johnson (Emerson)",
    email: "sarah.johnson@emerson.com",
    role: "vendor-support",
    status: "active",
    siteAccess: ["site-kisumu"],
    zoneAccess: ["field"],
    lastLogin: "2024-01-15T13:30:00Z",
    mfaEnabled: true,
    privilegedAccess: false
  },
  {
    id: "vendor-honeywell-t1-01",
    tenantId: "t1",
    name: "Michael Chen (Honeywell)",
    email: "michael.chen@honeywell.com",
    role: "vendor-support",
    status: "active",
    siteAccess: ["site-mombasa"],
    zoneAccess: ["field", "control"],
    lastLogin: "2024-01-15T12:15:00Z",
    mfaEnabled: true,
    privilegedAccess: false
  }

];

// =============================================================================
// Access Policies
// =============================================================================

export const accessPolicies: AccessPolicy[] = [
  {
    id: "policy-field-operator-access",
    tenantId: "ksa-upstream-jv",
    name: "Field Operator Access Policy",
    description: "Standard access policy for field operators",
    scope: {
      sites: ["well-pad-alpha-01"],
      zones: ["field"],
      assetTypes: ["wellhead-plc", "xmas-tree", "field-gateway"]
    },
    timeRestrictions: {
      allowedHours: "06:00-18:00",
      timezone: "Asia/Riyadh"
    },
    approvalRequired: false,
    assignedUsers: ["user-fatima-hassan"],
    assignedRoles: ["field-operator"],
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-10T00:00:00Z"
  },
  {
    id: "policy-control-room-access",
    tenantId: "ksa-upstream-jv",
    name: "Control Room Access Policy",
    description: "Access policy for control room operators",
    scope: {
      sites: ["cpf-ghawar-central"],
      zones: ["control", "dmz"],
      assetTypes: ["dcs", "scada-master", "separator", "pump"]
    },
    approvalRequired: false,
    assignedUsers: ["user-omar-khalil"],
    assignedRoles: ["control-room-operator"],
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-08T00:00:00Z"
  },
  {
    id: "policy-sis-access",
    tenantId: "offshore-field-alpha",
    name: "Safety System Access Policy",
    description: "Restricted access policy for safety-critical systems",
    scope: {
      sites: ["platform-alpha-north"],
      zones: ["sis"],
      assetTypes: ["sis", "esd", "flare-system"]
    },
    approvalRequired: true,
    assignedUsers: ["user-sarah-johnson", "user-erik-nordahl"],
    assignedRoles: ["platform-supervisor", "ot-engineer"],
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-12T00:00:00Z"
  },
  {
    id: "policy-vendor-access",
    tenantId: "ksa-upstream-jv",
    name: "Vendor Access Policy",
    description: "Temporary access policy for vendor support",
    scope: {
      sites: ["well-pad-alpha-01", "pipeline-station-01"],
      zones: ["field"],
      assetTypes: ["wellhead-plc", "pipeline-valve", "rtu"]
    },
    timeRestrictions: {
      allowedHours: "08:00-17:00",
      timezone: "Asia/Riyadh"
    },
    approvalRequired: true,
    assignedUsers: ["vendor-schneider-tech01", "vendor-cameron-tech02"],
    assignedRoles: ["vendor-support"],
    status: "active",
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z"
  },
  {
    id: "policy-remote-access",
    tenantId: "onshore-field-bravo",
    name: "Remote Access Policy",
    description: "Policy for remote access to field systems",
    scope: {
      sites: ["well-pad-bravo-02", "gathering-station-west"],
      zones: ["field", "control"],
      assetTypes: ["wellhead-plc", "compressor", "field-gateway"]
    },
    timeRestrictions: {
      allowedHours: "07:00-19:00",
      timezone: "America/Chicago"
    },
    approvalRequired: true,
    assignedUsers: ["user-robert-martinez", "user-jessica-control"],
    assignedRoles: ["field-operator", "control-room-operator"],
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-14T00:00:00Z"
  },
  {
    id: "policy-emergency-access",
    tenantId: "offshore-field-alpha",
    name: "Emergency Access Policy",
    description: "Emergency access policy for critical situations",
    scope: {
      sites: ["platform-alpha-north"],
      zones: ["field", "control", "sis"],
      assetTypes: ["sis", "esd", "compressor", "flare-system"]
    },
    approvalRequired: false,
    assignedUsers: ["user-sarah-johnson"],
    assignedRoles: ["platform-supervisor"],
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-05T00:00:00Z"
  }
];

// =============================================================================
// Security Policies
// =============================================================================

export const securityPolicies: SecurityPolicy[] = [
  {
    id: "policy-remote-access-001",
    tenantId: "ksa-upstream-jv",
    name: "Remote Access Security Policy",
    description: "Comprehensive policy governing remote access to upstream oil & gas systems",
    version: "2.1",
    type: "remote-access",
    status: "active",
    approvalStatus: "approved",
    effectiveDate: "2024-01-01T00:00:00Z",
    expirationDate: "2024-12-31T23:59:59Z",
    lastReviewDate: "2024-01-01T00:00:00Z",
    nextReviewDate: "2024-07-01T00:00:00Z",
    approvedBy: "Ahmed Al-Rashid",
    approvalDate: "2023-12-15T00:00:00Z",
    applicableScope: {
      siteTypes: ["well-pad", "cpf", "pipeline-station"],
      zones: ["field", "control", "dmz"],
      assetTypes: ["wellhead-plc", "scada-master", "rtu", "field-gateway"]
    },
    content: "This policy establishes requirements for secure remote access to upstream operational technology systems. All remote access must be authenticated, authorized, and logged. Multi-factor authentication is required for access to safety-critical systems.",
    approvalHistory: [
      {
        id: "approval-001",
        version: "2.1",
        approver: "Ahmed Al-Rashid",
        approverRole: "Security Manager",
        approvalDate: "2023-12-15T00:00:00Z",
        status: "approved",
        comments: "Updated to include new MFA requirements"
      },
      {
        id: "approval-002",
        version: "2.0",
        approver: "Omar Khalil",
        approverRole: "OT Manager",
        approvalDate: "2023-06-01T00:00:00Z",
        status: "approved"
      }
    ],
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-12-15T00:00:00Z",
    createdBy: "Ahmed Al-Rashid",
    isDueForReview: false,
    hasPendingApproval: false
  },
  {
    id: "policy-sis-change-001",
    tenantId: "offshore-field-alpha",
    name: "Safety Instrumented System Change Policy",
    description: "Policy governing changes to safety-critical systems and SIS configurations",
    version: "1.3",
    type: "sis-change",
    status: "active",
    approvalStatus: "approved",
    effectiveDate: "2024-01-01T00:00:00Z",
    lastReviewDate: "2023-10-15T00:00:00Z",
    nextReviewDate: "2024-04-15T00:00:00Z",
    approvedBy: "Sarah Johnson",
    approvalDate: "2023-10-15T00:00:00Z",
    applicableScope: {
      siteTypes: ["offshore-platform"],
      zones: ["sis"],
      assetTypes: ["sis", "esd", "flare-system"]
    },
    content: "All changes to Safety Instrumented Systems must follow a rigorous change management process including safety impact assessment, dual approval, and comprehensive testing before implementation.",
    approvalHistory: [
      {
        id: "approval-003",
        version: "1.3",
        approver: "Sarah Johnson",
        approverRole: "Platform Supervisor",
        approvalDate: "2023-10-15T00:00:00Z",
        status: "approved",
        comments: "Added requirements for offshore platform specific procedures"
      }
    ],
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-10-15T00:00:00Z",
    createdBy: "Sarah Johnson",
    isDueForReview: true,
    hasPendingApproval: false
  },
  {
    id: "policy-vendor-access-001",
    tenantId: "ksa-upstream-jv",
    name: "Vendor Access Management Policy",
    description: "Policy for managing third-party vendor access to upstream systems",
    version: "1.5",
    type: "vendor-access",
    status: "active",
    approvalStatus: "approved",
    effectiveDate: "2024-01-01T00:00:00Z",
    lastReviewDate: "2023-11-01T00:00:00Z",
    nextReviewDate: "2024-05-01T00:00:00Z",
    approvedBy: "Ahmed Al-Rashid",
    approvalDate: "2023-11-01T00:00:00Z",
    applicableScope: {
      siteTypes: ["well-pad", "cpf", "pipeline-station"],
      zones: ["field", "control"],
      assetTypes: ["wellhead-plc", "rtu", "compressor", "separator"]
    },
    content: "Vendor access to upstream systems requires pre-approval, time-limited sessions, and continuous monitoring. All vendor activities must be logged and reviewed.",
    approvalHistory: [
      {
        id: "approval-004",
        version: "1.5",
        approver: "Ahmed Al-Rashid",
        approverRole: "Security Manager",
        approvalDate: "2023-11-01T00:00:00Z",
        status: "approved",
        comments: "Updated vendor screening requirements"
      }
    ],
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-11-01T00:00:00Z",
    createdBy: "Ahmed Al-Rashid",
    isDueForReview: false,
    hasPendingApproval: false
  },
  {
    id: "policy-data-protection-001",
    tenantId: "onshore-field-bravo",
    name: "Operational Data Protection Policy",
    description: "Policy for protecting sensitive operational and production data",
    version: "2.0",
    type: "data-protection",
    status: "under-review",
    approvalStatus: "pending",
    effectiveDate: "2024-02-01T00:00:00Z",
    nextReviewDate: "2024-08-01T00:00:00Z",
    applicableScope: {
      siteTypes: ["well-pad", "gathering-station"],
      zones: ["control", "corporate"],
      assetTypes: ["scada-master", "dcs", "field-gateway"]
    },
    content: "This policy establishes requirements for protecting operational data including production rates, pressure readings, and control system configurations from unauthorized access and disclosure.",
    approvalHistory: [
      {
        id: "approval-005",
        version: "1.0",
        approver: "Robert Martinez",
        approverRole: "Field Manager",
        approvalDate: "2023-02-01T00:00:00Z",
        status: "approved"
      }
    ],
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
    createdBy: "Robert Martinez",
    isDueForReview: false,
    hasPendingApproval: true
  },
  {
    id: "policy-network-security-001",
    tenantId: "offshore-field-alpha",
    name: "Network Security and Segmentation Policy",
    description: "Policy defining network security requirements and zone segmentation",
    version: "1.2",
    type: "network-security",
    status: "active",
    approvalStatus: "approved",
    effectiveDate: "2024-01-01T00:00:00Z",
    lastReviewDate: "2023-09-01T00:00:00Z",
    nextReviewDate: "2024-03-01T00:00:00Z",
    approvedBy: "Erik Nordahl",
    approvalDate: "2023-09-01T00:00:00Z",
    applicableScope: {
      siteTypes: ["offshore-platform"],
      zones: ["field", "control", "sis", "dmz", "corporate"],
      assetTypes: ["sis", "dcs", "scada-master", "field-gateway"]
    },
    content: "Network segmentation must be implemented according to IEC 62443 standards with proper conduit controls between zones. All inter-zone communications must be logged and monitored.",
    approvalHistory: [
      {
        id: "approval-006",
        version: "1.2",
        approver: "Erik Nordahl",
        approverRole: "OT Engineer",
        approvalDate: "2023-09-01T00:00:00Z",
        status: "approved",
        comments: "Updated for offshore platform requirements"
      }
    ],
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-09-01T00:00:00Z",
    createdBy: "Erik Nordahl",
    isDueForReview: true,
    hasPendingApproval: false
  },
  {
    id: "policy-incident-response-001",
    tenantId: "ksa-upstream-jv",
    name: "Cybersecurity Incident Response Policy",
    description: "Policy for responding to cybersecurity incidents in upstream operations",
    version: "1.1",
    type: "incident-response",
    status: "draft",
    approvalStatus: "pending",
    effectiveDate: "2024-03-01T00:00:00Z",
    nextReviewDate: "2024-09-01T00:00:00Z",
    applicableScope: {
      siteTypes: ["well-pad", "cpf", "pipeline-station"],
      zones: ["field", "control", "sis", "dmz"],
      assetTypes: ["wellhead-plc", "sis", "scada-master", "rtu"]
    },
    content: "This policy defines the procedures for detecting, responding to, and recovering from cybersecurity incidents that may affect upstream oil & gas operations.",
    approvalHistory: [],
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
    createdBy: "Ahmed Al-Rashid",
    isDueForReview: false,
    hasPendingApproval: true
  }
];

// =============================================================================
// Security Audit Entries
// =============================================================================

export const securityAuditEntries: SecurityAuditEntry[] = [
  // Authentication Events
  {
    id: "audit-auth-001",
    tenantId: "ksa-upstream-jv",
    timestamp: "2024-01-15T14:20:00Z",
    eventType: "authentication",
    userId: "user-ahmed-al-rashid",
    userName: "Ahmed Al-Rashid",
    sourceIp: "10.0.1.50",
    resource: "Ghawar SCADA Master",
    action: "login",
    outcome: "success",
    details: "Successful login to SCADA system with MFA",
    riskLevel: "low",
    siteId: "cpf-ghawar-central",
    assetId: "scada-master-ghawar"
  },
  {
    id: "audit-auth-002",
    tenantId: "ksa-upstream-jv",
    timestamp: "2024-01-15T14:30:00Z",
    eventType: "authentication",
    sourceIp: "185.220.101.42",
    resource: "Pipeline RTU 01",
    action: "login_attempt",
    outcome: "failure",
    details: "Failed login attempt - invalid credentials",
    riskLevel: "high",
    siteId: "pipeline-station-01",
    assetId: "rtu-pipeline-01"
  },
  {
    id: "audit-auth-003",
    tenantId: "offshore-field-alpha",
    timestamp: "2024-01-15T13:30:00Z",
    eventType: "authentication",
    userId: "user-sarah-johnson",
    userName: "Sarah Johnson",
    sourceIp: "192.168.1.100",
    resource: "Platform Alpha ESD System",
    action: "login",
    outcome: "success",
    details: "Successful login to safety system",
    riskLevel: "medium",
    siteId: "platform-alpha-north",
    assetId: "sis-platform-alpha-esd"
  },

  // Authorization Events
  {
    id: "audit-authz-001",
    tenantId: "ksa-upstream-jv",
    timestamp: "2024-01-15T14:25:00Z",
    eventType: "authorization",
    userId: "user-ahmed-al-rashid",
    userName: "Ahmed Al-Rashid",
    sourceIp: "10.0.1.50",
    resource: "Wellhead PLC Configuration",
    action: "modify_config",
    outcome: "success",
    details: "Authorized configuration change to wellhead PLC",
    riskLevel: "medium",
    siteId: "well-pad-alpha-01",
    assetId: "wellhead-plc-alpha-01-wh01"
  },
  {
    id: "audit-authz-002",
    tenantId: "onshore-field-bravo",
    timestamp: "2024-01-15T11:15:00Z",
    eventType: "authorization",
    userId: "user-robert-martinez",
    userName: "Robert Martinez",
    sourceIp: "192.168.2.75",
    resource: "SIS Override Function",
    action: "access_attempt",
    outcome: "failure",
    details: "Access denied - insufficient privileges for SIS override",
    riskLevel: "high",
    siteId: "well-pad-bravo-02"
  },

  // Configuration Change Events
  {
    id: "audit-config-001",
    tenantId: "ksa-upstream-jv",
    timestamp: "2024-01-15T13:20:00Z",
    eventType: "configuration-change",
    userId: "vendor-schneider-tech01",
    userName: "John Smith (Schneider)",
    sourceIp: "203.0.113.45",
    resource: "Wellhead PLC Logic",
    action: "update_ladder_logic",
    outcome: "success",
    details: "Updated PLC ladder logic for wellhead control",
    riskLevel: "high",
    siteId: "well-pad-alpha-01",
    assetId: "wellhead-plc-alpha-01-wh01"
  },
  {
    id: "audit-config-002",
    tenantId: "offshore-field-alpha",
    timestamp: "2024-01-15T09:30:00Z",
    eventType: "configuration-change",
    userId: "vendor-honeywell-eng01",
    userName: "David Thompson (Honeywell)",
    sourceIp: "198.51.100.89",
    resource: "SIS Safety Function",
    action: "modify_safety_logic",
    outcome: "success",
    details: "Modified safety interlock logic for flare system",
    riskLevel: "high",
    siteId: "platform-alpha-north",
    assetId: "flare-system-platform-alpha"
  },
  {
    id: "audit-config-003",
    tenantId: "ksa-upstream-jv",
    timestamp: "2024-01-15T14:23:00Z",
    eventType: "configuration-change",
    resource: "Pipeline Valve Position",
    action: "valve_position_change",
    outcome: "success",
    details: "Valve position changed from 100% to 75% open",
    riskLevel: "high",
    siteId: "pipeline-station-01",
    assetId: "pipeline-valve-main-01"
  },

  // Data Access Events
  {
    id: "audit-data-001",
    tenantId: "ksa-upstream-jv",
    timestamp: "2024-01-15T14:10:00Z",
    eventType: "data-access",
    userId: "consultant-cybersec-01",
    userName: "Jennifer Park (CyberSec Consulting)",
    sourceIp: "203.0.113.112",
    resource: "Production Data Archive",
    action: "export_data",
    outcome: "success",
    details: "Exported production data for security assessment",
    riskLevel: "medium",
    siteId: "cpf-ghawar-central"
  },
  {
    id: "audit-data-002",
    tenantId: "offshore-field-alpha",
    timestamp: "2024-01-15T12:45:00Z",
    eventType: "data-access",
    sourceIp: "203.0.113.200",
    resource: "Platform Telemetry Data",
    action: "bulk_download",
    outcome: "failure",
    details: "Unauthorized attempt to download telemetry data",
    riskLevel: "high",
    siteId: "platform-alpha-north"
  },

  // System Access Events
  {
    id: "audit-system-001",
    tenantId: "onshore-field-bravo",
    timestamp: "2024-01-15T12:30:00Z",
    eventType: "system-access",
    userId: "vendor-abb-support01",
    userName: "Lisa Chen (ABB)",
    sourceIp: "203.0.113.67",
    resource: "Compressor Control System",
    action: "remote_session_start",
    outcome: "success",
    details: "Started remote maintenance session",
    riskLevel: "medium",
    siteId: "gathering-station-west",
    assetId: "compressor-gathering-west-01"
  },
  {
    id: "audit-system-002",
    tenantId: "ksa-upstream-jv",
    timestamp: "2024-01-15T02:18:00Z",
    eventType: "system-access",
    sourceIp: "185.220.101.42",
    resource: "Pipeline Control Network",
    action: "network_scan",
    outcome: "failure",
    details: "Unauthorized network scanning attempt blocked",
    riskLevel: "high",
    siteId: "pipeline-station-01"
  },

  // Policy Change Events
  {
    id: "audit-policy-001",
    tenantId: "ksa-upstream-jv",
    timestamp: "2024-01-15T08:00:00Z",
    eventType: "policy-change",
    userId: "user-nadia-security",
    userName: "Nadia Al-Zahra",
    sourceIp: "10.0.1.25",
    resource: "Vendor Access Policy",
    action: "update_policy",
    outcome: "success",
    details: "Updated vendor access time restrictions",
    riskLevel: "medium"
  },
  {
    id: "audit-policy-002",
    tenantId: "offshore-field-alpha",
    timestamp: "2024-01-14T16:30:00Z",
    eventType: "policy-change",
    userId: "user-anna-security",
    userName: "Anna Larsson",
    sourceIp: "192.168.1.200",
    resource: "SIS Access Policy",
    action: "add_user_exception",
    outcome: "success",
    details: "Added emergency access exception for platform supervisor",
    riskLevel: "medium",
    siteId: "platform-alpha-north"
  },

  // Incident Response Events
  {
    id: "audit-incident-001",
    tenantId: "ksa-upstream-jv",
    timestamp: "2024-01-15T14:00:00Z",
    eventType: "incident-response",
    userId: "user-nadia-security",
    userName: "Nadia Al-Zahra",
    sourceIp: "10.0.1.25",
    resource: "Security Incident INC-001",
    action: "incident_created",
    outcome: "success",
    details: "Created security incident for well control tampering",
    riskLevel: "high",
    siteId: "well-pad-alpha-01"
  },
  {
    id: "audit-incident-002",
    tenantId: "ksa-upstream-jv",
    timestamp: "2024-01-15T14:45:00Z",
    eventType: "incident-response",
    userId: "user-nadia-security",
    userName: "Nadia Al-Zahra",
    sourceIp: "10.0.1.25",
    resource: "Pipeline Valve System",
    action: "containment_action",
    outcome: "success",
    details: "Isolated affected valve controller as containment measure",
    riskLevel: "high",
    siteId: "pipeline-station-01",
    assetId: "pipeline-valve-main-01"
  }
];

// =============================================================================
// User Roles (Upstream-specific)
// =============================================================================

export const upstreamUserRoles = [
  "field-operator",
  "control-room-operator",
  "ot-engineer",
  "platform-supervisor",
  "vendor-support",
  "soc-analyst",
  "security-manager",
  "compliance-officer"
];

// =============================================================================
// Risk Categories
// =============================================================================

export const upstreamRiskCategories = [
  "well-control",
  "pipeline-integrity",
  "sis-bypass",
  "remote-access",
  "data-breach",
  "malware",
  "insider-threat",
  "supply-chain"
];

// =============================================================================
// Threat Intelligence
// =============================================================================

export const threatIntelligence: ThreatIntelligence[] = [
  // ICS Malware Threats
  {
    id: "threat-triton-sis-malware",
    tenantId: "ksa-upstream-jv",
    title: "TRITON/TRISIS SIS Malware Campaign",
    description: "Advanced malware specifically designed to target Safety Instrumented Systems (SIS) in industrial environments, particularly oil & gas facilities",
    source: "Industrial Cyber Threat Intelligence Consortium",
    sourceType: "industry-sharing",
    threatType: "ics-malware",
    severity: "critical",
    relevanceScore: 95,
    confidence: "high",
    publishedAt: "2024-01-10T00:00:00Z",
    lastUpdated: "2024-01-15T12:00:00Z",
    status: "active",
    affectedSystems: ["Schneider Electric Triconex", "SIS Controllers", "Safety PLCs"],
    affectedIndustries: ["Oil & Gas", "Petrochemicals", "Power Generation"],
    targetedAssetTypes: ["sis", "esd", "safety-plc"],
    indicators: [
      {
        id: "ind-triton-hash-1",
        type: "file-hash",
        value: "6c5120a78ad7b329c8a5c6b9b6b8c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8",
        description: "TRITON malware payload hash",
        confidence: "high",
        firstSeen: "2024-01-10T00:00:00Z",
        lastSeen: "2024-01-15T00:00:00Z",
        status: "active"
      },
      {
        id: "ind-triton-process-1",
        type: "process-name",
        value: "trilog.exe",
        description: "TRITON malware process name",
        confidence: "high",
        firstSeen: "2024-01-10T00:00:00Z",
        lastSeen: "2024-01-15T00:00:00Z",
        status: "active"
      }
    ],
    mitigations: [
      "Implement network segmentation for SIS networks",
      "Deploy endpoint detection and response (EDR) on engineering workstations",
      "Regularly audit SIS configurations and access logs",
      "Implement application whitelisting on SIS networks"
    ],
    recommendedActions: [
      "Immediately scan all SIS controllers for indicators of compromise",
      "Review and restrict remote access to SIS networks",
      "Conduct emergency SIS integrity verification",
      "Notify regulatory authorities if compromise is detected"
    ],
    upstreamRelevance: {
      siteTypes: ["offshore-platform", "cpf", "well-pad"],
      assetTypes: ["sis", "esd", "wellhead-plc"],
      zones: ["sis", "control"],
      safetyImpact: true,
      productionImpact: true
    },
    activeMatches: [],
    relatedThreats: ["threat-industroyer-power", "threat-crashoverride"],
    tags: ["malware", "sis", "safety-critical", "apt", "targeted"]
  },

  // Pipeline Targeting Threats
  {
    id: "threat-pipeline-ransomware-darkside",
    tenantId: "ksa-upstream-jv",
    title: "DarkSide Ransomware - Pipeline Infrastructure Targeting",
    description: "Ransomware group specifically targeting pipeline and energy infrastructure with sophisticated attack techniques",
    source: "National Cyber Threat Intelligence Center",
    sourceType: "government",
    threatType: "pipeline-targeting",
    severity: "high",
    relevanceScore: 88,
    confidence: "high",
    publishedAt: "2024-01-12T00:00:00Z",
    lastUpdated: "2024-01-15T14:00:00Z",
    status: "active",
    affectedSystems: ["Windows Systems", "SCADA Networks", "Pipeline Control Systems"],
    affectedIndustries: ["Oil & Gas", "Pipeline Operations", "Energy"],
    targetedAssetTypes: ["scada-master", "pipeline-valve", "rtu"],
    indicators: [
      {
        id: "ind-darkside-ip-1",
        type: "ip-address",
        value: "185.220.101.182",
        description: "DarkSide C2 server IP address",
        confidence: "high",
        firstSeen: "2024-01-12T00:00:00Z",
        lastSeen: "2024-01-15T00:00:00Z",
        status: "active"
      },
      {
        id: "ind-darkside-domain-1",
        type: "domain",
        value: "darkside-payment.onion",
        description: "DarkSide payment portal domain",
        confidence: "medium",
        firstSeen: "2024-01-12T00:00:00Z",
        lastSeen: "2024-01-15T00:00:00Z",
        status: "active"
      }
    ],
    mitigations: [
      "Implement robust backup and recovery procedures",
      "Deploy advanced email security to prevent phishing",
      "Segment OT networks from IT networks",
      "Implement privileged access management (PAM)"
    ],
    recommendedActions: [
      "Review and test incident response procedures",
      "Verify backup integrity and recovery capabilities",
      "Conduct phishing awareness training for all staff",
      "Implement network monitoring for lateral movement"
    ],
    upstreamRelevance: {
      siteTypes: ["pipeline-station", "cpf", "gathering-station"],
      assetTypes: ["scada-master", "pipeline-valve", "rtu", "compressor"],
      zones: ["control", "dmz", "corporate"],
      safetyImpact: false,
      productionImpact: true
    },
    activeMatches: [],
    relatedThreats: ["threat-colonial-pipeline", "threat-ransomware-conti"],
    tags: ["ransomware", "pipeline", "energy", "financial-motivation"]
  },

  // Oil & Gas Sector Threats
  {
    id: "threat-apt-shamoon-energy",
    tenantId: "offshore-field-alpha",
    title: "Shamoon APT - Energy Sector Destructive Attacks",
    description: "Advanced persistent threat group targeting energy sector organizations with destructive malware capabilities",
    source: "Energy Sector Security Consortium",
    sourceType: "industry-sharing",
    threatType: "oil-gas-sector",
    severity: "high",
    relevanceScore: 82,
    confidence: "high",
    publishedAt: "2024-01-08T00:00:00Z",
    lastUpdated: "2024-01-14T16:00:00Z",
    status: "active",
    affectedSystems: ["Windows Workstations", "File Servers", "Domain Controllers"],
    affectedIndustries: ["Oil & Gas", "Energy", "Petrochemicals"],
    targetedAssetTypes: ["workstation", "server", "domain-controller"],
    indicators: [
      {
        id: "ind-shamoon-hash-1",
        type: "file-hash",
        value: "c7c8e5c6d4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7",
        description: "Shamoon wiper malware hash",
        confidence: "high",
        firstSeen: "2024-01-08T00:00:00Z",
        lastSeen: "2024-01-14T00:00:00Z",
        status: "active"
      },
      {
        id: "ind-shamoon-registry-1",
        type: "registry-key",
        value: "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\\DistTrack",
        description: "Shamoon persistence registry key",
        confidence: "medium",
        firstSeen: "2024-01-08T00:00:00Z",
        lastSeen: "2024-01-14T00:00:00Z",
        status: "active"
      }
    ],
    mitigations: [
      "Implement endpoint protection with behavioral analysis",
      "Deploy network segmentation to limit lateral movement",
      "Establish comprehensive backup and recovery procedures",
      "Implement application whitelisting on critical systems"
    ],
    recommendedActions: [
      "Scan all Windows systems for Shamoon indicators",
      "Review and test disaster recovery procedures",
      "Implement enhanced monitoring for file system changes",
      "Conduct tabletop exercises for destructive attack scenarios"
    ],
    upstreamRelevance: {
      siteTypes: ["offshore-platform", "cpf", "well-pad", "gathering-station"],
      assetTypes: ["workstation", "server", "scada-master"],
      zones: ["corporate", "dmz", "control"],
      safetyImpact: false,
      productionImpact: true
    },
    activeMatches: [],
    relatedThreats: ["threat-apt-elfin", "threat-apt-muddywater"],
    tags: ["apt", "destructive", "energy-sector", "nation-state"]
  },

  // Vulnerability Intelligence
  {
    id: "threat-scada-vulnerability-cve-2024-0001",
    tenantId: "onshore-field-bravo",
    title: "Critical SCADA Vulnerability - CVE-2024-0001",
    description: "Critical remote code execution vulnerability in widely-used SCADA software affecting upstream oil & gas operations",
    source: "Industrial Control Systems Cyber Emergency Response Team (ICS-CERT)",
    sourceType: "government",
    threatType: "vulnerability",
    severity: "critical",
    relevanceScore: 92,
    confidence: "high",
    publishedAt: "2024-01-13T00:00:00Z",
    lastUpdated: "2024-01-15T10:00:00Z",
    status: "active",
    affectedSystems: ["Wonderware System Platform", "AVEVA SCADA", "GE iFIX"],
    affectedIndustries: ["Oil & Gas", "Manufacturing", "Utilities"],
    targetedAssetTypes: ["scada-master", "hmi", "historian"],
    indicators: [
      {
        id: "ind-cve-2024-0001-exploit-1",
        type: "network-signature",
        value: "POST /ScadaWeb/api/command HTTP/1.1\\r\\nContent-Type: application/json\\r\\n\\r\\n{\"cmd\":\"",
        description: "CVE-2024-0001 exploitation attempt signature",
        confidence: "high",
        firstSeen: "2024-01-13T00:00:00Z",
        lastSeen: "2024-01-15T00:00:00Z",
        status: "active"
      }
    ],
    mitigations: [
      "Apply vendor security patches immediately",
      "Implement network access controls for SCADA systems",
      "Deploy intrusion detection systems on SCADA networks",
      "Disable unnecessary SCADA web interfaces"
    ],
    recommendedActions: [
      "Immediately inventory all affected SCADA systems",
      "Apply emergency patches or implement workarounds",
      "Monitor SCADA networks for exploitation attempts",
      "Conduct vulnerability assessments on all SCADA infrastructure"
    ],
    upstreamRelevance: {
      siteTypes: ["cpf", "gathering-station", "pipeline-station"],
      assetTypes: ["scada-master", "hmi", "historian"],
      zones: ["control", "dmz"],
      safetyImpact: true,
      productionImpact: true
    },
    activeMatches: [
      {
        id: "match-scada-ghawar-1",
        indicatorId: "ind-cve-2024-0001-exploit-1",
        indicatorType: "network-signature",
        indicatorValue: "POST /ScadaWeb/api/command",
        matchedAsset: "SCADA Master - Ghawar",
        matchedAssetId: "scada-master-ghawar",
        matchedSystem: "Ghawar SCADA Network",
        matchType: "pattern",
        confidence: "medium",
        detectedAt: "2024-01-15T09:30:00Z",
        status: "active",
        investigationNotes: "Potential exploitation attempt detected on Ghawar SCADA system"
      }
    ],
    relatedThreats: ["threat-scada-vulnerability-cve-2023-9999"],
    tags: ["vulnerability", "scada", "rce", "critical", "patch-required"]
  },

  // Campaign Intelligence
  {
    id: "threat-campaign-oil-rig-targeting",
    tenantId: "offshore-field-alpha",
    title: "Operation Oil Rig - Coordinated Campaign Against Offshore Platforms",
    description: "Coordinated cyber campaign targeting offshore oil platforms with spear-phishing and supply chain attacks",
    source: "Maritime Cyber Security Alliance",
    sourceType: "industry-sharing",
    threatType: "campaign",
    severity: "high",
    relevanceScore: 90,
    confidence: "medium",
    publishedAt: "2024-01-11T00:00:00Z",
    lastUpdated: "2024-01-15T11:00:00Z",
    status: "active",
    affectedSystems: ["Offshore Platform Systems", "Satellite Communications", "Marine Navigation"],
    affectedIndustries: ["Offshore Oil & Gas", "Maritime"],
    targetedAssetTypes: ["offshore-platform", "satellite-link", "navigation-system"],
    indicators: [
      {
        id: "ind-oil-rig-email-1",
        type: "email",
        value: "platform-maintenance@offshore-services.net",
        description: "Spear-phishing email sender address",
        confidence: "medium",
        firstSeen: "2024-01-11T00:00:00Z",
        lastSeen: "2024-01-15T00:00:00Z",
        status: "active"
      },
      {
        id: "ind-oil-rig-domain-1",
        type: "domain",
        value: "offshore-platform-updates.com",
        description: "Malicious domain used in campaign",
        confidence: "high",
        firstSeen: "2024-01-11T00:00:00Z",
        lastSeen: "2024-01-15T00:00:00Z",
        status: "active"
      }
    ],
    mitigations: [
      "Implement advanced email security and anti-phishing measures",
      "Enhance supply chain security verification procedures",
      "Deploy network monitoring for offshore platform communications",
      "Conduct security awareness training for offshore personnel"
    ],
    recommendedActions: [
      "Review all recent vendor communications and software updates",
      "Implement additional verification for offshore platform maintenance requests",
      "Monitor satellite communication links for anomalous activity",
      "Conduct security assessments of all offshore platform systems"
    ],
    upstreamRelevance: {
      siteTypes: ["offshore-platform"],
      assetTypes: ["platform-control", "satellite-link", "navigation-system"],
      zones: ["control", "dmz", "corporate"],
      safetyImpact: true,
      productionImpact: true
    },
    activeMatches: [],
    relatedThreats: ["threat-maritime-cyber-attacks"],
    tags: ["campaign", "offshore", "spear-phishing", "supply-chain"]
  },

  // Technique Intelligence
  {
    id: "threat-technique-living-off-land",
    tenantId: "ksa-upstream-jv",
    title: "Living Off The Land Techniques in OT Environments",
    description: "Adversaries using legitimate system tools and processes to conduct malicious activities in operational technology environments",
    source: "OT Security Research Institute",
    sourceType: "commercial",
    threatType: "technique",
    severity: "medium",
    relevanceScore: 75,
    confidence: "high",
    publishedAt: "2024-01-09T00:00:00Z",
    lastUpdated: "2024-01-14T13:00:00Z",
    status: "active",
    affectedSystems: ["Windows OT Workstations", "Engineering Stations", "HMI Systems"],
    affectedIndustries: ["Oil & Gas", "Manufacturing", "Utilities"],
    targetedAssetTypes: ["workstation", "hmi", "engineering-station"],
    indicators: [
      {
        id: "ind-lotl-powershell-1",
        type: "process-name",
        value: "powershell.exe",
        description: "PowerShell execution in OT environment",
        confidence: "low",
        firstSeen: "2024-01-09T00:00:00Z",
        lastSeen: "2024-01-14T00:00:00Z",
        status: "active"
      },
      {
        id: "ind-lotl-wmic-1",
        type: "process-name",
        value: "wmic.exe",
        description: "WMIC usage for reconnaissance",
        confidence: "low",
        firstSeen: "2024-01-09T00:00:00Z",
        lastSeen: "2024-01-14T00:00:00Z",
        status: "active"
      }
    ],
    mitigations: [
      "Implement application whitelisting on OT workstations",
      "Deploy behavioral monitoring for legitimate tools",
      "Restrict PowerShell execution in OT environments",
      "Implement privilege escalation monitoring"
    ],
    recommendedActions: [
      "Review PowerShell execution logs on OT systems",
      "Implement enhanced monitoring for system administration tools",
      "Conduct security assessment of OT workstation configurations",
      "Develop detection rules for suspicious use of legitimate tools"
    ],
    upstreamRelevance: {
      siteTypes: ["cpf", "well-pad", "gathering-station"],
      assetTypes: ["workstation", "hmi", "engineering-station"],
      zones: ["control", "dmz"],
      safetyImpact: false,
      productionImpact: false
    },
    activeMatches: [],
    relatedThreats: ["threat-technique-credential-dumping"],
    tags: ["technique", "living-off-land", "legitimate-tools", "evasion"]
  }
];

// =============================================================================
// Export all upstream security mock data
// =============================================================================

export const upstreamSecurityMockData = {
  tenants: upstreamTenants,
  sites: upstreamSites,
  zones: securityZones,
  conduits: conduits,
  otAssets: upstreamOtAssets,
  remoteSessions: remoteSessions,
  alerts: upstreamSecurityAlerts,
  incidents: incidentCases,
  anomalies: anomalySignals,
  standards: upstreamComplianceStandards,
  controls: securityControls,
  risks: riskEntries,
  users: securityUsers,
  accessPolicies: accessPolicies,
  auditEntries: securityAuditEntries,
  userRoles: upstreamUserRoles,
  riskCategories: upstreamRiskCategories,
  threatIntelligence: threatIntelligence
};

// =============================================================================
// Helper functions for accessing upstream security data by tenant
// =============================================================================

export function getUpstreamTenantById(tenantId: string): UpstreamTenant | undefined {
  return upstreamTenants.find(tenant => tenant.id === tenantId);
}

export function getUpstreamSecurityAlertsByTenant(tenantId: string): UpstreamSecurityAlert[] {
  return upstreamSecurityAlerts.filter(alert => alert.tenantId === tenantId);
}

export function getUpstreamSitesByTenant(tenantId: string): UpstreamSite[] {
  return upstreamSites.filter(site => site.tenantId === tenantId);
}

export function getUpstreamOtAssetsByTenant(tenantId: string): UpstreamOtAsset[] {
  return upstreamOtAssets.filter(asset => asset.tenantId === tenantId);
}

export function getUpstreamIncidentsByTenant(tenantId: string): IncidentCase[] {
  return incidentCases.filter(incident => incident.tenantId === tenantId);
}

export function getUpstreamAnomaliesByTenant(tenantId: string): AnomalySignal[] {
  return anomalySignals.filter(anomaly => anomaly.tenantId === tenantId);
}

export function getUpstreamComplianceStandardsByTenant(tenantId: string): UpstreamComplianceStandard[] {
  return upstreamComplianceStandards.filter(standard => standard.tenantId === tenantId);
}

export function getRemoteSessionsByTenant(tenantId: string): RemoteSession[] {
  return remoteSessions.filter(session => session.tenantId === tenantId);
}

export function getSecurityUsersByTenant(tenantId: string): SecurityUser[] {
  return securityUsers.filter(user => user.tenantId === tenantId);
}

export function getAccessPoliciesByTenant(tenantId: string): AccessPolicy[] {
  return accessPolicies.filter(policy => policy.tenantId === tenantId);
}

export function getSecurityPoliciesByTenant(tenantId: string): SecurityPolicy[] {
  return securityPolicies.filter(policy => policy.tenantId === tenantId);
}

export function getSecurityAuditEntriesByTenant(tenantId: string): SecurityAuditEntry[] {
  return securityAuditEntries.filter(entry => entry.tenantId === tenantId);
}

export function getSecurityZonesByTenant(tenantId: string): SecurityZone[] {
  return securityZones.filter(zone => zone.tenantId === tenantId);
}

export function getConduitsByTenant(tenantId: string): Conduit[] {
  return conduits.filter(conduit => conduit.tenantId === tenantId);
}

// =============================================================================
// Helper functions for filtering and searching
// =============================================================================

export function getUpstreamSitesByType(tenantId: string, siteType: string): UpstreamSite[] {
  return upstreamSites.filter(site =>
    site.tenantId === tenantId && site.type === siteType
  );
}

export function getUpstreamOtAssetsByCriticality(tenantId: string, criticality: string): UpstreamOtAsset[] {
  return upstreamOtAssets.filter(asset =>
    asset.tenantId === tenantId && asset.criticality === criticality
  );
}

export function getUpstreamOtAssetsBySite(tenantId: string, siteId: string): UpstreamOtAsset[] {
  return upstreamOtAssets.filter(asset =>
    asset.tenantId === tenantId && asset.siteId === siteId
  );
}

export function getUpstreamOtAssetsByZone(tenantId: string, zoneId: string): UpstreamOtAsset[] {
  return upstreamOtAssets.filter(asset =>
    asset.tenantId === tenantId && asset.zoneId === zoneId
  );
}

export function getSafetyCriticalAssets(tenantId: string): UpstreamOtAsset[] {
  return upstreamOtAssets.filter(asset =>
    asset.tenantId === tenantId &&
    (asset.criticality === 'safety-critical' || asset.inSafetyLoop)
  );
}

export function getUpstreamSecurityAlertsBySeverity(tenantId: string, severity: string): UpstreamSecurityAlert[] {
  return upstreamSecurityAlerts.filter(alert =>
    alert.tenantId === tenantId && alert.severity === severity
  );
}

export function getSafetyCriticalAlerts(tenantId: string): UpstreamSecurityAlert[] {
  return upstreamSecurityAlerts.filter(alert =>
    alert.tenantId === tenantId && alert.isSafetyCritical
  );
}

export function getActiveRemoteSessions(tenantId: string): RemoteSession[] {
  return remoteSessions.filter(session =>
    session.tenantId === tenantId && session.status === 'active'
  );
}

export function getRemoteSessionsToSafetyCriticalSystems(tenantId: string): RemoteSession[] {
  return remoteSessions.filter(session =>
    session.tenantId === tenantId && session.isSafetyCritical
  );
}

export function getSecurityAuditEntriesByDateRange(
  tenantId: string,
  startDate: string,
  endDate: string
): SecurityAuditEntry[] {
  return securityAuditEntries.filter(entry =>
    entry.tenantId === tenantId &&
    entry.timestamp >= startDate &&
    entry.timestamp <= endDate
  );
}

export function searchSecurityUsers(tenantId: string, searchQuery: string): SecurityUser[] {
  const query = searchQuery.toLowerCase();
  return securityUsers.filter(user =>
    user.tenantId === tenantId && (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    )
  );
}

export function getSecurityControlsByTenant(tenantId: string): SecurityControl[] {
  return securityControls.filter(control => control.tenantId === tenantId);
}

export function getSecurityControlsByStandard(tenantId: string, standardId: string): SecurityControl[] {
  return securityControls.filter(control =>
    control.tenantId === tenantId && control.standardId === standardId
  );
}

export function getSecurityControlsByCategory(tenantId: string, category: string): SecurityControl[] {
  return securityControls.filter(control =>
    control.tenantId === tenantId && control.category === category
  );
}

export function getSecurityControlsBySiteType(tenantId: string, siteType: string): SecurityControl[] {
  return securityControls.filter(control =>
    control.tenantId === tenantId && control.applicableSiteTypes.includes(siteType)
  );
}

export function getSecurityControlsByZone(tenantId: string, zone: string): SecurityControl[] {
  return securityControls.filter(control =>
    control.tenantId === tenantId && control.applicableZones.includes(zone)
  );
}



export function getThreatIntelligenceByTenant(tenantId: string): ThreatIntelligence[] {
  return threatIntelligence.filter(threat => threat.tenantId === tenantId);
}

export function getRiskEntriesByTenant(tenantId: string): RiskEntry[] {
  return riskEntries.filter(risk => risk.tenantId === tenantId);
}

export function getRiskEntriesByCategory(tenantId: string, category: string): RiskEntry[] {
  return riskEntries.filter(risk =>
    risk.tenantId === tenantId && risk.category === category
  );
}

export function getHighRiskEntries(tenantId: string): RiskEntry[] {
  return riskEntries.filter(risk =>
    risk.tenantId === tenantId && risk.riskScore >= 70
  );
}

// =============================================================================
// Secrets & Certificates
// =============================================================================

export const secretsCertificates: SecretCertificate[] = [
  // SCADA System Certificates
  {
    id: "cert-scada-ghawar-tls",
    tenantId: "ksa-upstream-jv",
    name: "Ghawar SCADA TLS Certificate",
    type: "certificate",
    description: "TLS certificate for secure SCADA communications",
    associatedSystems: ["scada-master-ghawar", "cpf-ghawar-central"],
    associatedSystemNames: ["Ghawar SCADA Master", "CPF Ghawar Central"],
    createdAt: "2023-06-01T00:00:00Z",
    expiresAt: "2024-06-01T00:00:00Z",
    lastRotated: "2023-06-01T00:00:00Z",
    nextRotation: "2024-05-01T00:00:00Z",
    rotationFrequency: 365,
    status: "expiring-soon",
    algorithm: "RSA",
    keySize: 2048,
    issuer: "KSA Internal CA",
    subject: "CN=scada.ghawar.ksa, O=KSA Upstream JV",
    usageCount: 15420,
    lastUsed: "2024-01-15T14:30:00Z",
    rotationHistory: [
      {
        id: "rot-1",
        rotatedAt: "2023-06-01T00:00:00Z",
        rotatedBy: "security-admin",
        reason: "scheduled",
        newVersion: "v2.0",
        status: "success",
        notes: "Annual certificate renewal"
      }
    ],
    dependentSystems: ["wellhead-plc-alpha-01-wh01", "rtu-pipeline-01"],
    securityLevel: "high",
    isDeprecatedAlgorithm: false,
    daysUntilExpiry: 45
  },

  // SIS System Certificates
  {
    id: "cert-sis-platform-alpha",
    tenantId: "offshore-field-alpha",
    name: "Platform Alpha SIS Certificate",
    type: "certificate",
    description: "Security certificate for SIS communications",
    associatedSystems: ["sis-platform-alpha-esd"],
    associatedSystemNames: ["Platform Alpha ESD System"],
    createdAt: "2023-08-15T00:00:00Z",
    expiresAt: "2025-08-15T00:00:00Z",
    lastRotated: "2023-08-15T00:00:00Z",
    nextRotation: "2025-07-15T00:00:00Z",
    rotationFrequency: 730,
    status: "active",
    algorithm: "RSA",
    keySize: 4096,
    issuer: "Offshore Field Alpha CA",
    subject: "CN=sis.platform-alpha.offshore, O=Offshore Field Alpha",
    usageCount: 8920,
    lastUsed: "2024-01-15T15:00:00Z",
    rotationHistory: [
      {
        id: "rot-2",
        rotatedAt: "2023-08-15T00:00:00Z",
        rotatedBy: "ot-engineer",
        reason: "scheduled",
        newVersion: "v1.0",
        status: "success",
        notes: "Initial SIS certificate deployment"
      }
    ],
    dependentSystems: ["esd-cpf-ghawar-main"],
    securityLevel: "high",
    isDeprecatedAlgorithm: false,
    daysUntilExpiry: 580
  },

  // Gateway Private Keys
  {
    id: "key-gateway-alpha-01",
    tenantId: "ksa-upstream-jv",
    name: "Alpha 01 Gateway Private Key",
    type: "private-key",
    description: "Private key for field gateway secure communications",
    associatedSystems: ["field-gateway-alpha-01"],
    associatedSystemNames: ["Alpha 01 Field Gateway"],
    createdAt: "2023-09-01T00:00:00Z",
    expiresAt: "2024-09-01T00:00:00Z",
    lastRotated: "2023-09-01T00:00:00Z",
    nextRotation: "2024-08-01T00:00:00Z",
    rotationFrequency: 365,
    status: "active",
    algorithm: "RSA",
    keySize: 2048,
    usageCount: 12450,
    lastUsed: "2024-01-15T14:45:00Z",
    rotationHistory: [
      {
        id: "rot-3",
        rotatedAt: "2023-09-01T00:00:00Z",
        rotatedBy: "network-admin",
        reason: "scheduled",
        newVersion: "v1.0",
        status: "success",
        notes: "Gateway deployment key generation"
      }
    ],
    dependentSystems: ["wellhead-plc-alpha-01-wh01"],
    securityLevel: "medium",
    isDeprecatedAlgorithm: false,
    daysUntilExpiry: 230
  },

  // API Secrets
  {
    id: "secret-api-historian",
    tenantId: "ksa-upstream-jv",
    name: "Historian API Secret",
    type: "api-secret",
    description: "API secret for historian data access",
    associatedSystems: ["historian-ghawar"],
    associatedSystemNames: ["Ghawar Historian"],
    createdAt: "2023-12-01T00:00:00Z",
    expiresAt: "2024-06-01T00:00:00Z",
    lastRotated: "2023-12-01T00:00:00Z",
    nextRotation: "2024-05-01T00:00:00Z",
    rotationFrequency: 180,
    status: "active",
    usageCount: 5680,
    lastUsed: "2024-01-15T15:15:00Z",
    rotationHistory: [
      {
        id: "rot-4",
        rotatedAt: "2023-12-01T00:00:00Z",
        rotatedBy: "api-admin",
        reason: "scheduled",
        newVersion: "v3.2",
        status: "success",
        notes: "Quarterly API secret rotation"
      }
    ],
    dependentSystems: ["scada-master-ghawar", "dcs-cpf-ghawar-main"],
    securityLevel: "medium",
    isDeprecatedAlgorithm: false,
    daysUntilExpiry: 137
  },

  // Database Passwords
  {
    id: "secret-db-scada-password",
    tenantId: "offshore-field-alpha",
    name: "SCADA Database Password",
    type: "database-password",
    description: "Database password for SCADA system",
    associatedSystems: ["scada-db-platform-alpha"],
    associatedSystemNames: ["Platform Alpha SCADA Database"],
    createdAt: "2024-01-01T00:00:00Z",
    expiresAt: "2024-04-01T00:00:00Z",
    lastRotated: "2024-01-01T00:00:00Z",
    nextRotation: "2024-03-15T00:00:00Z",
    rotationFrequency: 90,
    status: "active",
    usageCount: 2340,
    lastUsed: "2024-01-15T15:30:00Z",
    rotationHistory: [
      {
        id: "rot-5",
        rotatedAt: "2024-01-01T00:00:00Z",
        rotatedBy: "db-admin",
        reason: "scheduled",
        newVersion: "v2024.1",
        status: "success",
        notes: "New year password rotation"
      }
    ],
    dependentSystems: ["scada-master-platform-alpha"],
    securityLevel: "high",
    isDeprecatedAlgorithm: false,
    daysUntilExpiry: 76
  },

  // Encryption Keys
  {
    id: "key-encryption-pipeline",
    tenantId: "ksa-upstream-jv",
    name: "Pipeline Data Encryption Key",
    type: "encryption-key",
    description: "Encryption key for pipeline telemetry data",
    associatedSystems: ["pipeline-station-01", "rtu-pipeline-01"],
    associatedSystemNames: ["Pipeline Station 01", "Pipeline RTU 01"],
    createdAt: "2023-10-15T00:00:00Z",
    expiresAt: "2024-10-15T00:00:00Z",
    lastRotated: "2023-10-15T00:00:00Z",
    nextRotation: "2024-09-15T00:00:00Z",
    rotationFrequency: 365,
    status: "active",
    algorithm: "AES",
    keySize: 256,
    usageCount: 18750,
    lastUsed: "2024-01-15T15:45:00Z",
    rotationHistory: [
      {
        id: "rot-6",
        rotatedAt: "2023-10-15T00:00:00Z",
        rotatedBy: "crypto-admin",
        reason: "scheduled",
        newVersion: "v1.0",
        status: "success",
        notes: "Initial pipeline encryption deployment"
      }
    ],
    dependentSystems: ["pipeline-valve-main-01"],
    securityLevel: "high",
    isDeprecatedAlgorithm: false,
    daysUntilExpiry: 273
  },

  // Signing Keys
  {
    id: "key-signing-firmware",
    tenantId: "onshore-field-bravo",
    name: "Firmware Signing Key",
    type: "signing-key",
    description: "Code signing key for firmware updates",
    associatedSystems: ["firmware-update-server"],
    associatedSystemNames: ["Firmware Update Server"],
    createdAt: "2023-07-01T00:00:00Z",
    expiresAt: "2026-07-01T00:00:00Z",
    lastRotated: "2023-07-01T00:00:00Z",
    nextRotation: "2026-06-01T00:00:00Z",
    rotationFrequency: 1095,
    status: "active",
    algorithm: "RSA",
    keySize: 4096,
    usageCount: 156,
    lastUsed: "2024-01-10T09:00:00Z",
    rotationHistory: [
      {
        id: "rot-7",
        rotatedAt: "2023-07-01T00:00:00Z",
        rotatedBy: "firmware-admin",
        reason: "scheduled",
        newVersion: "v1.0",
        status: "success",
        notes: "Initial firmware signing key deployment"
      }
    ],
    dependentSystems: ["compressor-gathering-west-01", "wellhead-plc-bravo-02"],
    securityLevel: "high",
    isDeprecatedAlgorithm: false,
    daysUntilExpiry: 898
  },

  // Expired Certificate (for testing)
  {
    id: "cert-legacy-modbus",
    tenantId: "onshore-field-bravo",
    name: "Legacy Modbus Certificate",
    type: "certificate",
    description: "Legacy certificate for Modbus communications (EXPIRED)",
    associatedSystems: ["legacy-modbus-gateway"],
    associatedSystemNames: ["Legacy Modbus Gateway"],
    createdAt: "2022-01-01T00:00:00Z",
    expiresAt: "2023-01-01T00:00:00Z",
    lastRotated: "2022-01-01T00:00:00Z",
    nextRotation: "2024-02-01T00:00:00Z",
    rotationFrequency: 365,
    status: "expired",
    algorithm: "MD5",
    keySize: 1024,
    issuer: "Legacy CA",
    subject: "CN=modbus.legacy.bravo, O=Onshore Field Bravo",
    usageCount: 0,
    lastUsed: "2023-01-01T00:00:00Z",
    rotationHistory: [
      {
        id: "rot-8",
        rotatedAt: "2022-01-01T00:00:00Z",
        rotatedBy: "legacy-admin",
        reason: "scheduled",
        newVersion: "v1.0",
        status: "success",
        notes: "Legacy system certificate"
      }
    ],
    dependentSystems: [],
    securityLevel: "low",
    isDeprecatedAlgorithm: true,
    daysUntilExpiry: -379
  },

  // Revoked Certificate
  {
    id: "cert-compromised-gateway",
    tenantId: "ksa-upstream-jv",
    name: "Compromised Gateway Certificate",
    type: "certificate",
    description: "Certificate revoked due to security compromise",
    associatedSystems: ["compromised-gateway"],
    associatedSystemNames: ["Compromised Gateway"],
    createdAt: "2023-05-01T00:00:00Z",
    expiresAt: "2024-05-01T00:00:00Z",
    lastRotated: "2023-11-15T00:00:00Z",
    nextRotation: "2024-04-01T00:00:00Z",
    rotationFrequency: 365,
    status: "revoked",
    algorithm: "RSA",
    keySize: 2048,
    issuer: "KSA Internal CA",
    subject: "CN=gateway.compromised.ksa, O=KSA Upstream JV",
    usageCount: 0,
    lastUsed: "2023-11-15T08:30:00Z",
    rotationHistory: [
      {
        id: "rot-9",
        rotatedAt: "2023-11-15T00:00:00Z",
        rotatedBy: "security-incident-response",
        reason: "compromise",
        newVersion: "REVOKED",
        status: "success",
        notes: "Certificate revoked due to suspected compromise"
      }
    ],
    dependentSystems: [],
    securityLevel: "high",
    isDeprecatedAlgorithm: false,
    daysUntilExpiry: 107
  }
];

// =============================================================================
// Security Exceptions
// =============================================================================

export const securityExceptions: SecurityException[] = [
  // KSA Upstream JV Exceptions
  {
    id: "exception-legacy-wellhead-plc",
    tenantId: "ksa-upstream-jv",
    title: "Legacy Wellhead PLC Exception",
    description: "Exception for legacy wellhead PLC that cannot be upgraded due to operational constraints",
    policyId: "policy-remote-access",
    policyName: "Remote Access Policy",
    scope: ["well-pad-alpha-01", "wellhead-plc-alpha-01-wh01"],
    riskLevel: "medium",
    compensatingControls: [
      "Enhanced monitoring of PLC communications",
      "Restricted network access via dedicated VLAN",
      "Manual approval required for all remote sessions",
      "24/7 SOC monitoring of PLC activities"
    ],
    approvedBy: "Ahmed Al-Rashid",
    approvalDate: "2024-01-10T00:00:00Z",
    expirationDate: "2024-07-10T00:00:00Z",
    status: "active",
    affectsSafetyCritical: true
  },
  {
    id: "exception-pipeline-encryption",
    tenantId: "ksa-upstream-jv",
    title: "Pipeline Communication Encryption Exception",
    description: "Temporary exception for unencrypted pipeline RTU communications during system upgrade",
    policyId: "policy-network-security",
    policyName: "Network Security Policy",
    scope: ["pipeline-station-01", "rtu-pipeline-01"],
    riskLevel: "high",
    compensatingControls: [
      "Physical security at pipeline station enhanced",
      "Network traffic monitoring increased to 24/7",
      "VPN tunnel established for critical communications",
      "Backup communication channel via satellite link"
    ],
    approvedBy: "Nadia Al-Zahra",
    approvalDate: "2024-01-05T00:00:00Z",
    expirationDate: "2024-03-05T00:00:00Z",
    status: "active",
    affectsSafetyCritical: true
  },
  {
    id: "exception-vendor-access-schneider",
    tenantId: "ksa-upstream-jv",
    title: "Extended Vendor Access - Schneider Electric",
    description: "Extended vendor access exception for Schneider Electric during wellhead PLC maintenance project",
    policyId: "policy-vendor-access",
    policyName: "Vendor Access Policy",
    scope: ["well-pad-alpha-01", "cpf-ghawar-central"],
    riskLevel: "medium",
    compensatingControls: [
      "Vendor personnel escorted at all times",
      "All vendor activities logged and monitored",
      "Time-limited access tokens (4-hour maximum)",
      "Dual approval required for safety-critical system access"
    ],
    approvedBy: "Omar Khalil",
    approvalDate: "2024-01-12T00:00:00Z",
    expirationDate: "2024-04-12T00:00:00Z",
    status: "active",
    affectsSafetyCritical: false
  },

  // Offshore Field Alpha Exceptions
  {
    id: "exception-platform-sis-bypass",
    tenantId: "offshore-field-alpha",
    title: "Platform SIS Maintenance Bypass",
    description: "Temporary SIS bypass exception for scheduled maintenance on Platform Alpha ESD system",
    policyId: "policy-sis-change",
    policyName: "SIS Change Management Policy",
    scope: ["platform-alpha-north", "sis-platform-alpha-esd"],
    riskLevel: "high",
    compensatingControls: [
      "Manual safety watch established",
      "Backup ESD system activated",
      "Platform operations reduced to minimum safe level",
      "Emergency response team on standby",
      "Continuous safety engineer supervision"
    ],
    approvedBy: "Sarah Johnson",
    approvalDate: "2024-01-14T00:00:00Z",
    expirationDate: "2024-01-16T00:00:00Z",
    status: "active",
    affectsSafetyCritical: true
  },
  {
    id: "exception-offshore-remote-access",
    tenantId: "offshore-field-alpha",
    title: "Emergency Remote Access Exception",
    description: "Emergency remote access exception for critical platform operations during weather event",
    policyId: "policy-remote-access",
    policyName: "Remote Access Policy",
    scope: ["platform-alpha-north"],
    riskLevel: "medium",
    compensatingControls: [
      "Satellite communication backup activated",
      "Enhanced authentication required (hardware tokens)",
      "All remote sessions recorded",
      "Platform supervisor approval for each session"
    ],
    approvedBy: "Erik Nordahl",
    approvalDate: "2024-01-13T00:00:00Z",
    expirationDate: "2024-01-20T00:00:00Z",
    status: "active",
    affectsSafetyCritical: false
  },

  // Onshore Field Bravo Exceptions
  {
    id: "exception-legacy-compressor-control",
    tenantId: "onshore-field-bravo",
    title: "Legacy Compressor Control Exception",
    description: "Exception for legacy compressor control system that cannot meet current security standards",
    policyId: "policy-network-security",
    policyName: "Network Security Policy",
    scope: ["gathering-station-west", "compressor-gathering-west-01"],
    riskLevel: "medium",
    compensatingControls: [
      "Air-gapped network segment for compressor control",
      "Physical access controls enhanced",
      "Manual operation procedures documented",
      "Weekly security assessments conducted"
    ],
    approvedBy: "Mike Thompson",
    approvalDate: "2024-01-08T00:00:00Z",
    expirationDate: "2024-07-08T00:00:00Z",
    status: "active",
    affectsSafetyCritical: false
  },
  {
    id: "exception-wellhead-firmware",
    tenantId: "onshore-field-bravo",
    title: "Wellhead PLC Firmware Exception",
    description: "Exception for wellhead PLC running outdated firmware due to vendor support limitations",
    policyId: "policy-patch-management",
    policyName: "Patch Management Policy",
    scope: ["well-pad-bravo-02", "wellhead-plc-bravo-02-wh01"],
    riskLevel: "high",
    compensatingControls: [
      "Network isolation via dedicated firewall rules",
      "Intrusion detection system monitoring",
      "Regular vulnerability scanning",
      "Incident response plan specific to this asset"
    ],
    approvedBy: "Jessica Williams",
    approvalDate: "2024-01-11T00:00:00Z",
    expirationDate: "2024-06-11T00:00:00Z",
    status: "active",
    affectsSafetyCritical: true
  },

  // Expired Exception (for testing)
  {
    id: "exception-expired-test",
    tenantId: "ksa-upstream-jv",
    title: "Expired Test Exception",
    description: "Test exception that has expired",
    policyId: "policy-test",
    policyName: "Test Policy",
    scope: ["test-site"],
    riskLevel: "low",
    compensatingControls: ["Test control"],
    approvedBy: "Test Approver",
    approvalDate: "2023-12-01T00:00:00Z",
    expirationDate: "2023-12-31T00:00:00Z",
    status: "expired",
    affectsSafetyCritical: false
  },

  // Revoked Exception (for testing)
  {
    id: "exception-revoked-test",
    tenantId: "offshore-field-alpha",
    title: "Revoked Test Exception",
    description: "Test exception that has been revoked",
    policyId: "policy-test",
    policyName: "Test Policy",
    scope: ["test-site"],
    riskLevel: "medium",
    compensatingControls: ["Test control"],
    approvedBy: "Test Approver",
    approvalDate: "2024-01-01T00:00:00Z",
    expirationDate: "2024-06-01T00:00:00Z",
    status: "revoked",
    affectsSafetyCritical: false
  }
];

// =============================================================================
// Response Playbooks
// =============================================================================

export const responsePlaybooks: ResponsePlaybook[] = [
  // Platform Isolation Playbooks
  {
    id: "playbook-isolate-platform-alpha",
    tenantId: "offshore-field-alpha",
    name: "Isolate Offshore Platform Alpha",
    description: "Emergency response playbook for isolating Platform Alpha from network and production systems during security incidents",
    category: "isolate-platform",
    applicableIncidentTypes: [
      "malware-infection",
      "unauthorized-remote-access",
      "sis-override",
      "well-control-tampering"
    ],
    steps: [
      {
        order: 1,
        action: "Activate Emergency Response Team",
        responsible: "Platform Supervisor",
        timeLimit: "5 minutes",
        decisionPoint: false
      },
      {
        order: 2,
        action: "Assess Safety Status",
        responsible: "Safety Engineer",
        timeLimit: "10 minutes",
        decisionPoint: true,
        options: ["Continue with isolation", "Abort - safety risk too high"]
      },
      {
        order: 3,
        action: "Notify Shore-based Control Center",
        responsible: "Control Room Operator",
        timeLimit: "5 minutes",
        decisionPoint: false
      },
      {
        order: 4,
        action: "Isolate Platform Network Connections",
        responsible: "OT Engineer",
        timeLimit: "15 minutes",
        decisionPoint: false
      },
      {
        order: 5,
        action: "Switch to Manual Operations",
        responsible: "Platform Supervisor",
        timeLimit: "30 minutes",
        decisionPoint: true,
        options: ["Full manual mode", "Partial automation with isolated systems"]
      },
      {
        order: 6,
        action: "Secure All Remote Access Points",
        responsible: "Security Administrator",
        timeLimit: "10 minutes",
        decisionPoint: false
      },
      {
        order: 7,
        action: "Document Incident and Actions Taken",
        responsible: "Incident Commander",
        timeLimit: "60 minutes",
        decisionPoint: false
      }
    ],
    escalationProcedure: "If safety systems are compromised, immediately contact Emergency Response Coordinator and consider platform evacuation procedures",
    lastUpdated: "2024-01-10T00:00:00Z",
    approvedBy: "Sarah Johnson - Platform Operations Manager"
  },

  // Pipeline Segment Closure Playbooks
  {
    id: "playbook-close-pipeline-segment",
    tenantId: "ksa-upstream-jv",
    name: "Close Pipeline Segment - Ghawar to CPF",
    description: "Emergency closure of pipeline segment between Ghawar field and Central Processing Facility during security incidents",
    category: "close-pipeline-segment",
    applicableIncidentTypes: [
      "pipeline-manipulation",
      "valve-state-change",
      "pressure-anomaly",
      "unauthorized-access"
    ],
    steps: [
      {
        order: 1,
        action: "Verify Incident Scope and Impact",
        responsible: "Control Room Operator",
        timeLimit: "5 minutes",
        decisionPoint: true,
        options: ["Proceed with closure", "Investigate further", "Escalate to management"]
      },
      {
        order: 2,
        action: "Notify Downstream Facilities",
        responsible: "Operations Coordinator",
        timeLimit: "10 minutes",
        decisionPoint: false
      },
      {
        order: 3,
        action: "Close Upstream Block Valves",
        responsible: "Field Operator",
        timeLimit: "20 minutes",
        decisionPoint: false
      },
      {
        order: 4,
        action: "Close Downstream Block Valves",
        responsible: "CPF Operator",
        timeLimit: "20 minutes",
        decisionPoint: false
      },
      {
        order: 5,
        action: "Verify Pipeline Isolation",
        responsible: "Control Room Operator",
        timeLimit: "15 minutes",
        decisionPoint: true,
        options: ["Isolation confirmed", "Isolation failed - manual intervention required"]
      },
      {
        order: 6,
        action: "Depressurize Isolated Segment",
        responsible: "Pipeline Engineer",
        timeLimit: "60 minutes",
        decisionPoint: false
      },
      {
        order: 7,
        action: "Secure Physical Access to Valve Stations",
        responsible: "Security Team",
        timeLimit: "30 minutes",
        decisionPoint: false
      },
      {
        order: 8,
        action: "Initiate Incident Investigation",
        responsible: "Incident Commander",
        timeLimit: "120 minutes",
        decisionPoint: false
      }
    ],
    escalationProcedure: "If valve closure fails or pressure cannot be controlled, immediately contact Pipeline Emergency Response Team and consider activating Emergency Shutdown System",
    lastUpdated: "2024-01-08T00:00:00Z",
    approvedBy: "Ahmed Al-Rashid - Pipeline Operations Manager"
  },

  // Remote Access Lockdown Playbooks
  {
    id: "playbook-lockdown-remote-access",
    tenantId: "ksa-upstream-jv",
    name: "Lockdown All Remote Access",
    description: "Complete lockdown of all remote access to upstream systems during security incidents",
    category: "lockdown-remote-access",
    applicableIncidentTypes: [
      "unauthorized-remote-access",
      "malware-infection",
      "authentication-failure",
      "data-exfiltration"
    ],
    steps: [
      {
        order: 1,
        action: "Identify Active Remote Sessions",
        responsible: "Security Administrator",
        timeLimit: "5 minutes",
        decisionPoint: false
      },
      {
        order: 2,
        action: "Terminate All Active Remote Sessions",
        responsible: "Security Administrator",
        timeLimit: "10 minutes",
        decisionPoint: false
      },
      {
        order: 3,
        action: "Disable VPN Gateways",
        responsible: "Network Administrator",
        timeLimit: "15 minutes",
        decisionPoint: false
      },
      {
        order: 4,
        action: "Block External IP Ranges",
        responsible: "Network Administrator",
        timeLimit: "10 minutes",
        decisionPoint: false
      },
      {
        order: 5,
        action: "Revoke Vendor Access Credentials",
        responsible: "Security Administrator",
        timeLimit: "20 minutes",
        decisionPoint: false
      },
      {
        order: 6,
        action: "Enable Enhanced Monitoring",
        responsible: "SOC Analyst",
        timeLimit: "15 minutes",
        decisionPoint: false
      },
      {
        order: 7,
        action: "Notify Affected Vendors and Users",
        responsible: "Communications Coordinator",
        timeLimit: "30 minutes",
        decisionPoint: false
      },
      {
        order: 8,
        action: "Establish Secure Communication Channel",
        responsible: "IT Manager",
        timeLimit: "45 minutes",
        decisionPoint: true,
        options: ["Satellite phone network", "Secure radio network", "Physical courier system"]
      }
    ],
    escalationProcedure: "If critical operations require remote access, establish secure out-of-band communication with management for emergency access approval",
    lastUpdated: "2024-01-12T00:00:00Z",
    approvedBy: "Nadia Al-Zahra - IT Security Manager"
  },

  // SIS Override Response Playbooks
  {
    id: "playbook-sis-override-response",
    tenantId: "offshore-field-alpha",
    name: "SIS Override Incident Response",
    description: "Response procedures for unauthorized or suspicious Safety Instrumented System override events",
    category: "sis-override-response",
    applicableIncidentTypes: [
      "sis-override",
      "sis-trip",
      "well-control-tampering",
      "unauthorized-access"
    ],
    steps: [
      {
        order: 1,
        action: "Immediately Assess Safety Status",
        responsible: "Safety Engineer",
        timeLimit: "2 minutes",
        decisionPoint: true,
        options: ["Safe to continue", "Initiate emergency shutdown", "Evacuate platform"]
      },
      {
        order: 2,
        action: "Verify SIS Override Authorization",
        responsible: "Control Room Operator",
        timeLimit: "5 minutes",
        decisionPoint: true,
        options: ["Override authorized", "Override unauthorized - security incident"]
      },
      {
        order: 3,
        action: "Isolate Affected SIS Loop",
        responsible: "SIS Engineer",
        timeLimit: "10 minutes",
        decisionPoint: false
      },
      {
        order: 4,
        action: "Activate Backup Safety Systems",
        responsible: "Safety Engineer",
        timeLimit: "15 minutes",
        decisionPoint: false
      },
      {
        order: 5,
        action: "Investigate Override Source",
        responsible: "Security Analyst",
        timeLimit: "30 minutes",
        decisionPoint: false
      },
      {
        order: 6,
        action: "Document All Safety Actions",
        responsible: "Safety Engineer",
        timeLimit: "60 minutes",
        decisionPoint: false
      },
      {
        order: 7,
        action: "Notify Regulatory Authorities",
        responsible: "Compliance Officer",
        timeLimit: "120 minutes",
        decisionPoint: true,
        options: ["Immediate notification required", "24-hour notification sufficient"]
      }
    ],
    escalationProcedure: "Any unauthorized SIS override must be immediately escalated to Platform Manager and Safety Director. If safety cannot be assured, initiate emergency shutdown procedures",
    lastUpdated: "2024-01-14T00:00:00Z",
    approvedBy: "Erik Nordahl - Safety Director"
  },

  // Well Control Incident Playbooks
  {
    id: "playbook-well-control-incident",
    tenantId: "onshore-field-bravo",
    name: "Well Control Security Incident",
    description: "Response procedures for security incidents affecting well control systems",
    category: "well-control-incident",
    applicableIncidentTypes: [
      "well-control-tampering",
      "pressure-anomaly",
      "valve-manipulation",
      "unauthorized-access"
    ],
    steps: [
      {
        order: 1,
        action: "Assess Well Status and Pressure",
        responsible: "Well Operator",
        timeLimit: "3 minutes",
        decisionPoint: true,
        options: ["Well stable", "Well unstable - emergency response", "Uncertain - investigate"]
      },
      {
        order: 2,
        action: "Secure Wellhead Area",
        responsible: "Field Supervisor",
        timeLimit: "10 minutes",
        decisionPoint: false
      },
      {
        order: 3,
        action: "Switch to Manual Well Control",
        responsible: "Well Operator",
        timeLimit: "15 minutes",
        decisionPoint: false
      },
      {
        order: 4,
        action: "Isolate Wellhead Control Systems",
        responsible: "OT Technician",
        timeLimit: "20 minutes",
        decisionPoint: false
      },
      {
        order: 5,
        action: "Verify Choke and Flow Line Status",
        responsible: "Production Engineer",
        timeLimit: "25 minutes",
        decisionPoint: false
      },
      {
        order: 6,
        action: "Investigate Control System Compromise",
        responsible: "Security Analyst",
        timeLimit: "60 minutes",
        decisionPoint: false
      },
      {
        order: 7,
        action: "Coordinate with Emergency Response",
        responsible: "Incident Commander",
        timeLimit: "30 minutes",
        decisionPoint: true,
        options: ["Continue operations with manual control", "Shut in well", "Evacuate area"]
      }
    ],
    escalationProcedure: "Any indication of well control compromise must be immediately escalated to Well Control Specialist and Emergency Response Coordinator",
    lastUpdated: "2024-01-09T00:00:00Z",
    approvedBy: "Mike Thompson - Well Operations Manager"
  },

  // Malware Containment Playbooks
  {
    id: "playbook-malware-containment",
    tenantId: "ksa-upstream-jv",
    name: "OT Malware Containment",
    description: "Containment procedures for malware detected in operational technology systems",
    category: "malware-containment",
    applicableIncidentTypes: [
      "malware-infection",
      "network-anomaly",
      "unauthorized-access",
      "data-exfiltration"
    ],
    steps: [
      {
        order: 1,
        action: "Identify Infected Systems",
        responsible: "SOC Analyst",
        timeLimit: "10 minutes",
        decisionPoint: false
      },
      {
        order: 2,
        action: "Isolate Infected Systems from Network",
        responsible: "Network Administrator",
        timeLimit: "15 minutes",
        decisionPoint: false
      },
      {
        order: 3,
        action: "Assess Impact on Operations",
        responsible: "Operations Manager",
        timeLimit: "20 minutes",
        decisionPoint: true,
        options: ["Continue with isolated systems", "Switch to backup systems", "Manual operations"]
      },
      {
        order: 4,
        action: "Preserve Forensic Evidence",
        responsible: "Security Analyst",
        timeLimit: "30 minutes",
        decisionPoint: false
      },
      {
        order: 5,
        action: "Scan Connected Systems",
        responsible: "Security Team",
        timeLimit: "60 minutes",
        decisionPoint: false
      },
      {
        order: 6,
        action: "Update Security Controls",
        responsible: "Security Administrator",
        timeLimit: "45 minutes",
        decisionPoint: false
      },
      {
        order: 7,
        action: "Coordinate Malware Analysis",
        responsible: "Incident Commander",
        timeLimit: "120 minutes",
        decisionPoint: false
      },
      {
        order: 8,
        action: "Plan System Recovery",
        responsible: "IT Recovery Team",
        timeLimit: "180 minutes",
        decisionPoint: true,
        options: ["Clean and restore", "Rebuild from backup", "Replace hardware"]
      }
    ],
    escalationProcedure: "If malware affects safety-critical systems, immediately escalate to Safety Manager and consider emergency shutdown procedures",
    lastUpdated: "2024-01-11T00:00:00Z",
    approvedBy: "Omar Khalil - Cybersecurity Manager"
  }
];

// =============================================================================
// SOAR Actions
// =============================================================================

export const soarActions: SoarAction[] = [
  // Account Management Actions
  {
    id: "soar-001",
    tenantId: "ksa-upstream-jv",
    name: "Disable Vendor Account",
    description: "Immediately disable vendor user account and revoke all access tokens",
    type: "disable-account",
    targetType: "user",
    requiresApproval: false,
    approvalLevel: "operator",
    affectsSafetyCritical: false,
    executionHistory: [
      {
        id: "exec-001",
        executedAt: "2024-01-15T14:30:00Z",
        executedBy: "Sarah Chen - SOC Analyst",
        target: "vendor-schlumberger-tech",
        result: "success",
        details: "Account disabled successfully. All active sessions terminated."
      },
      {
        id: "exec-002",
        executedAt: "2024-01-12T09:15:00Z",
        executedBy: "Ahmed Hassan - Security Engineer",
        target: "vendor-halliburton-ops",
        result: "success",
        details: "Account disabled. Remote access to well pad systems revoked."
      }
    ]
  },
  {
    id: "soar-002",
    tenantId: "ksa-upstream-jv",
    name: "Disable Internal User Account",
    description: "Disable internal user account suspected of unauthorized activity",
    type: "disable-account",
    targetType: "user",
    requiresApproval: true,
    approvalLevel: "supervisor",
    affectsSafetyCritical: false,
    executionHistory: [
      {
        id: "exec-003",
        executedAt: "2024-01-10T16:45:00Z",
        executedBy: "Omar Khalil - Cybersecurity Manager",
        target: "field-operator-ahmed",
        result: "success",
        details: "Account disabled pending investigation. Supervisor approval obtained."
      }
    ]
  },

  // Session Management Actions
  {
    id: "soar-003",
    tenantId: "ksa-upstream-jv",
    name: "Close Remote Session",
    description: "Terminate active remote session to upstream systems",
    type: "close-session",
    targetType: "session",
    requiresApproval: false,
    approvalLevel: "operator",
    affectsSafetyCritical: true,
    executionHistory: [
      {
        id: "exec-004",
        executedAt: "2024-01-16T11:20:00Z",
        executedBy: "Sarah Chen - SOC Analyst",
        target: "session-vendor-wellpad-alpha",
        result: "success",
        details: "Remote session to wellhead PLC terminated. Safety systems unaffected."
      },
      {
        id: "exec-005",
        executedAt: "2024-01-14T08:30:00Z",
        executedBy: "Ahmed Hassan - Security Engineer",
        target: "session-platform-maintenance",
        result: "success",
        details: "Unauthorized session to platform SIS terminated immediately."
      }
    ]
  },
  {
    id: "soar-004",
    tenantId: "ksa-upstream-jv",
    name: "Close All Vendor Sessions",
    description: "Terminate all active vendor remote sessions across all sites",
    type: "close-session",
    targetType: "session",
    requiresApproval: true,
    approvalLevel: "supervisor",
    affectsSafetyCritical: true,
    executionHistory: [
      {
        id: "exec-006",
        executedAt: "2024-01-13T13:00:00Z",
        executedBy: "Omar Khalil - Cybersecurity Manager",
        target: "all-vendor-sessions",
        result: "success",
        details: "All 7 active vendor sessions terminated. Operations notified."
      }
    ]
  },

  // System Isolation Actions
  {
    id: "soar-005",
    tenantId: "ksa-upstream-jv",
    name: "Isolate Well Pad System",
    description: "Isolate compromised well pad from network to prevent lateral movement",
    type: "isolate-system",
    targetType: "asset",
    requiresApproval: true,
    approvalLevel: "manager",
    affectsSafetyCritical: true,
    executionHistory: [
      {
        id: "exec-007",
        executedAt: "2024-01-11T15:45:00Z",
        executedBy: "Omar Khalil - Cybersecurity Manager",
        target: "wellpad-alpha-network",
        result: "success",
        details: "Well pad Alpha isolated. Production impact: 2 wells offline. Safety systems operational."
      }
    ]
  },
  {
    id: "soar-006",
    tenantId: "ksa-upstream-jv",
    name: "Isolate Pipeline Segment",
    description: "Isolate pipeline control system segment to contain security incident",
    type: "isolate-system",
    targetType: "asset",
    requiresApproval: true,
    approvalLevel: "manager",
    affectsSafetyCritical: true,
    executionHistory: [
      {
        id: "exec-008",
        executedAt: "2024-01-09T10:30:00Z",
        executedBy: "Omar Khalil - Cybersecurity Manager",
        target: "pipeline-segment-12",
        result: "success",
        details: "Pipeline segment 12 isolated. Flow rerouted through backup systems."
      }
    ]
  },

  // Network Security Actions
  {
    id: "soar-007",
    tenantId: "ksa-upstream-jv",
    name: "Block Suspicious IP Address",
    description: "Block IP address showing malicious activity against upstream systems",
    type: "block-ip",
    targetType: "network",
    requiresApproval: false,
    approvalLevel: "operator",
    affectsSafetyCritical: false,
    executionHistory: [
      {
        id: "exec-009",
        executedAt: "2024-01-16T09:15:00Z",
        executedBy: "Sarah Chen - SOC Analyst",
        target: "192.168.100.45",
        result: "success",
        details: "Malicious IP blocked at firewall. Attack attempts ceased."
      },
      {
        id: "exec-010",
        executedAt: "2024-01-15T16:20:00Z",
        executedBy: "Ahmed Hassan - Security Engineer",
        target: "10.50.75.123",
        result: "success",
        details: "Suspicious scanning activity blocked. Internal investigation initiated."
      }
    ]
  },

  // Device Security Actions
  {
    id: "soar-008",
    tenantId: "ksa-upstream-jv",
    name: "Quarantine Compromised Device",
    description: "Quarantine device showing signs of compromise or malware infection",
    type: "quarantine-device",
    targetType: "asset",
    requiresApproval: true,
    approvalLevel: "supervisor",
    affectsSafetyCritical: true,
    executionHistory: [
      {
        id: "exec-011",
        executedAt: "2024-01-12T14:00:00Z",
        executedBy: "Ahmed Hassan - Security Engineer",
        target: "wellhead-plc-alpha-03",
        result: "success",
        details: "Wellhead PLC quarantined. Backup control activated. No safety impact."
      }
    ]
  },

  // Access Control Actions
  {
    id: "soar-009",
    tenantId: "ksa-upstream-jv",
    name: "Revoke API Access",
    description: "Revoke API access for compromised service account or application",
    type: "revoke-access",
    targetType: "user",
    requiresApproval: false,
    approvalLevel: "operator",
    affectsSafetyCritical: false,
    executionHistory: [
      {
        id: "exec-012",
        executedAt: "2024-01-14T11:30:00Z",
        executedBy: "Sarah Chen - SOC Analyst",
        target: "scada-gateway-api-key",
        result: "success",
        details: "Compromised API key revoked. New key generated and deployed."
      }
    ]
  },

  // Backup and Recovery Actions
  {
    id: "soar-010",
    tenantId: "ksa-upstream-jv",
    name: "Trigger Emergency Backup",
    description: "Initiate emergency backup of critical system configurations",
    type: "trigger-backup",
    targetType: "asset",
    requiresApproval: false,
    approvalLevel: "operator",
    affectsSafetyCritical: false,
    executionHistory: [
      {
        id: "exec-013",
        executedAt: "2024-01-13T17:45:00Z",
        executedBy: "Ahmed Hassan - Security Engineer",
        target: "sis-controller-configs",
        result: "success",
        details: "Emergency backup completed. SIS configurations secured."
      }
    ]
  },

  // Offshore Field Alpha Actions
  {
    id: "soar-011",
    tenantId: "offshore-field-alpha",
    name: "Disable Vendor Account",
    description: "Disable vendor account with platform access",
    type: "disable-account",
    targetType: "user",
    requiresApproval: false,
    approvalLevel: "operator",
    affectsSafetyCritical: false,
    executionHistory: [
      {
        id: "exec-014",
        executedAt: "2024-01-15T10:20:00Z",
        executedBy: "James Mitchell - Platform Security Officer",
        target: "vendor-cameron-tech",
        result: "success",
        details: "Vendor account disabled. Platform access revoked."
      }
    ]
  },
  {
    id: "soar-012",
    tenantId: "offshore-field-alpha",
    name: "Close Remote Session to Platform",
    description: "Terminate remote session to offshore platform systems",
    type: "close-session",
    targetType: "session",
    requiresApproval: true,
    approvalLevel: "supervisor",
    affectsSafetyCritical: true,
    executionHistory: [
      {
        id: "exec-015",
        executedAt: "2024-01-14T14:15:00Z",
        executedBy: "Emma Thompson - Operations Manager",
        target: "session-platform-control",
        result: "success",
        details: "Unauthorized session to platform DCS terminated. Safety systems checked."
      }
    ]
  },
  {
    id: "soar-013",
    tenantId: "offshore-field-alpha",
    name: "Isolate Platform Network Segment",
    description: "Isolate compromised network segment on offshore platform",
    type: "isolate-system",
    targetType: "asset",
    requiresApproval: true,
    approvalLevel: "manager",
    affectsSafetyCritical: true,
    executionHistory: [
      {
        id: "exec-016",
        executedAt: "2024-01-10T12:30:00Z",
        executedBy: "Robert Chen - Platform Manager",
        target: "platform-control-network",
        result: "success",
        details: "Control network isolated. Production systems switched to backup network."
      }
    ]
  },

  // Onshore Field Bravo Actions
  {
    id: "soar-014",
    tenantId: "onshore-field-bravo",
    name: "Block Malicious IP Range",
    description: "Block range of IP addresses targeting field systems",
    type: "block-ip",
    targetType: "network",
    requiresApproval: false,
    approvalLevel: "operator",
    affectsSafetyCritical: false,
    executionHistory: [
      {
        id: "exec-017",
        executedAt: "2024-01-16T08:45:00Z",
        executedBy: "Maria Rodriguez - Field Security Analyst",
        target: "192.168.200.0/24",
        result: "success",
        details: "Malicious IP range blocked. Scanning attempts stopped."
      }
    ]
  },
  {
    id: "soar-015",
    tenantId: "onshore-field-bravo",
    name: "Quarantine Field Gateway",
    description: "Quarantine field gateway showing suspicious activity",
    type: "quarantine-device",
    targetType: "asset",
    requiresApproval: true,
    approvalLevel: "supervisor",
    affectsSafetyCritical: true,
    executionHistory: [
      {
        id: "exec-018",
        executedAt: "2024-01-13T11:00:00Z",
        executedBy: "David Wilson - Field Operations Supervisor",
        target: "field-gateway-bravo-01",
        result: "success",
        details: "Field gateway quarantined. Backup gateway activated. No production impact."
      }
    ]
  }
];

// =============================================================================
// Helper Functions for Response Playbooks
// =============================================================================

export function getResponsePlaybooksByTenant(tenantId: string): ResponsePlaybook[] {
  return responsePlaybooks.filter(playbook => playbook.tenantId === tenantId);
}

export function getResponsePlaybooksByCategory(tenantId: string, category: string): ResponsePlaybook[] {
  return responsePlaybooks.filter(playbook =>
    playbook.tenantId === tenantId && playbook.category === category
  );
}

export function getResponsePlaybooksForIncidentType(tenantId: string, incidentType: string): ResponsePlaybook[] {
  return responsePlaybooks.filter(playbook =>
    playbook.tenantId === tenantId && playbook.applicableIncidentTypes.includes(incidentType)
  );
}

export function searchResponsePlaybooks(tenantId: string, query: string): ResponsePlaybook[] {
  const lowerQuery = query.toLowerCase();
  return responsePlaybooks.filter(playbook =>
    playbook.tenantId === tenantId && (
      playbook.name.toLowerCase().includes(lowerQuery) ||
      playbook.description.toLowerCase().includes(lowerQuery) ||
      playbook.category.toLowerCase().includes(lowerQuery) ||
      playbook.applicableIncidentTypes.some(type => type.toLowerCase().includes(lowerQuery))
    )
  );
}

// =============================================================================
// Helper Functions for SOAR Actions
// =============================================================================

export function getSoarActionsByTenant(tenantId: string): SoarAction[] {
  return soarActions.filter(action => action.tenantId === tenantId);
}

export function getSoarActionsByType(tenantId: string, type: string): SoarAction[] {
  return soarActions.filter(action =>
    action.tenantId === tenantId && action.type === type
  );
}

export function getSoarActionsByTargetType(tenantId: string, targetType: string): SoarAction[] {
  return soarActions.filter(action =>
    action.tenantId === tenantId && action.targetType === targetType
  );
}

export function getSafetyCriticalSoarActions(tenantId: string): SoarAction[] {
  return soarActions.filter(action =>
    action.tenantId === tenantId && action.affectsSafetyCritical
  );
}

export function getSoarActionsRequiringApproval(tenantId: string): SoarAction[] {
  return soarActions.filter(action =>
    action.tenantId === tenantId && action.requiresApproval
  );
}

export function getSoarActionsByApprovalLevel(tenantId: string, approvalLevel: string): SoarAction[] {
  return soarActions.filter(action =>
    action.tenantId === tenantId && action.approvalLevel === approvalLevel
  );
}

export function searchSoarActions(tenantId: string, query: string): SoarAction[] {
  const lowerQuery = query.toLowerCase();
  return soarActions.filter(action =>
    action.tenantId === tenantId && (
      action.name.toLowerCase().includes(lowerQuery) ||
      action.description.toLowerCase().includes(lowerQuery) ||
      action.type.toLowerCase().includes(lowerQuery) ||
      action.targetType.toLowerCase().includes(lowerQuery)
    )
  );
}

// =============================================================================
// Helper Functions for Security Exceptions
// =============================================================================

export function getSecurityExceptionsByTenant(tenantId: string): SecurityException[] {
  return securityExceptions.filter(exception => exception.tenantId === tenantId);
}

export function getSecurityExceptionsByStatus(tenantId: string, status: string): SecurityException[] {
  return securityExceptions.filter(exception =>
    exception.tenantId === tenantId && exception.status === status
  );
}

export function getSecurityExceptionsByRiskLevel(tenantId: string, riskLevel: string): SecurityException[] {
  return securityExceptions.filter(exception =>
    exception.tenantId === tenantId && exception.riskLevel === riskLevel
  );
}

export function getExpiringSecurityExceptions(tenantId: string, daysThreshold: number = 30): SecurityException[] {
  const now = new Date();
  const thresholdDate = new Date(now.getTime() + (daysThreshold * 24 * 60 * 60 * 1000));

  return securityExceptions.filter(exception =>
    exception.tenantId === tenantId &&
    exception.status === 'active' &&
    new Date(exception.expirationDate) <= thresholdDate
  );
}

export function getSafetyCriticalExceptions(tenantId: string): SecurityException[] {
  return securityExceptions.filter(exception =>
    exception.tenantId === tenantId && exception.affectsSafetyCritical
  );
}

export function searchSecurityExceptions(tenantId: string, query: string): SecurityException[] {
  const lowerQuery = query.toLowerCase();
  return securityExceptions.filter(exception =>
    exception.tenantId === tenantId && (
      exception.title.toLowerCase().includes(lowerQuery) ||
      exception.description.toLowerCase().includes(lowerQuery) ||
      exception.policyName.toLowerCase().includes(lowerQuery) ||
      exception.scope.some(scope => scope.toLowerCase().includes(lowerQuery))
    )
  );
}

// =============================================================================
// =============================================================================
// Backup Policies
// =============================================================================

export const backupPolicies: BackupPolicy[] = [
  // KSA Upstream JV Backup Policies
  {
    id: "backup-policy-scada-config",
    tenantId: "ksa-upstream-jv",
    name: "SCADA Configuration Backup",
    description: "Automated backup of SCADA system configurations and HMI settings",
    type: "scada-config",
    scope: ["SCADA Master", "HMI Workstations", "Historian Configuration", "Alarm Settings"],
    schedule: {
      frequency: "every-6-hours",
      interval: 6,
      timezone: "Asia/Riyadh",
      enabled: true
    },
    retention: {
      policy: "hybrid",
      retentionDays: 90,
      retentionCount: 100,
      archiveAfterDays: 30,
      deleteAfterDays: 365,
      complianceRetention: 2555 // 7 years
    },
    storage: {
      primary: {
        type: "network",
        path: "/backup/scada/primary",
        capacity: "10 TB",
        used: "2.3 TB",
        available: "7.7 TB",
        status: "online"
      },
      secondary: {
        type: "offsite",
        path: "/offsite/scada/secondary",
        capacity: "5 TB",
        used: "1.8 TB",
        available: "3.2 TB",
        status: "online"
      },
      replication: true,
      compression: true,
      deduplication: true
    },
    encryption: {
      enabled: true,
      algorithm: "AES-256",
      keyManagement: "centralized",
      keyRotation: true,
      keyRotationDays: 90
    },
    verification: {
      enabled: true,
      method: "hybrid",
      frequency: "every-backup",
      lastVerification: "2024-01-15T14:00:00Z",
      verificationHistory: [
        {
          id: "verify-001",
          timestamp: "2024-01-15T14:00:00Z",
          method: "checksum",
          status: "success",
          details: "All files verified successfully",
          filesChecked: 1247,
          errorsFound: 0,
          duration: "00:03:45"
        }
      ]
    },
    status: "active",
    lastBackup: {
      id: "backup-exec-001",
      startTime: "2024-01-15T12:00:00Z",
      endTime: "2024-01-15T12:15:00Z",
      status: "completed",
      duration: "00:15:00",
      size: "1.2 GB",
      filesBackedUp: 1247,
      errors: 0,
      warnings: 0,
      details: "Backup completed successfully",
      location: "/backup/scada/primary/2024-01-15-12-00",
      verificationStatus: "passed"
    },
    nextBackup: "2024-01-15T18:00:00Z",
    backupHistory: [
      {
        id: "backup-exec-001",
        startTime: "2024-01-15T12:00:00Z",
        endTime: "2024-01-15T12:15:00Z",
        status: "completed",
        duration: "00:15:00",
        size: "1.2 GB",
        filesBackedUp: 1247,
        errors: 0,
        warnings: 0,
        details: "Backup completed successfully",
        location: "/backup/scada/primary/2024-01-15-12-00",
        verificationStatus: "passed"
      },
      {
        id: "backup-exec-002",
        startTime: "2024-01-15T06:00:00Z",
        endTime: "2024-01-15T06:14:00Z",
        status: "completed",
        duration: "00:14:00",
        size: "1.2 GB",
        filesBackedUp: 1245,
        errors: 0,
        warnings: 1,
        details: "Backup completed with minor warnings",
        location: "/backup/scada/primary/2024-01-15-06-00",
        verificationStatus: "passed"
      }
    ],
    recoveryTesting: [
      {
        id: "recovery-test-001",
        testDate: "2024-01-10T10:00:00Z",
        testType: "partial-restore",
        scope: ["HMI Configuration", "Alarm Settings"],
        status: "passed",
        duration: "00:45:00",
        recoveryTimeObjective: "01:00:00",
        actualRecoveryTime: "00:45:00",
        recoveryPointObjective: "06:00:00",
        actualRecoveryPoint: "00:15:00",
        issues: [],
        recommendations: ["Consider faster storage for improved RTO"],
        testedBy: "Ahmed Al-Rashid",
        notes: "Recovery test successful, all configurations restored correctly"
      }
    ],
    complianceRequirements: ["API 1164", "IEC 62443", "Local Regulations"],
    upstreamContext: {
      siteTypes: ["well-pad", "cpf", "pipeline-station"],
      assetTypes: ["scada-master", "hmi-workstation", "historian"],
      safetyImpact: false,
      productionImpact: true
    },
    createdAt: "2023-10-01T00:00:00Z",
    updatedAt: "2024-01-10T00:00:00Z",
    createdBy: "Ahmed Al-Rashid"
  },

  {
    id: "backup-policy-sis-logic",
    tenantId: "ksa-upstream-jv",
    name: "SIS Logic Backup",
    description: "Critical backup of Safety Instrumented System logic and configurations",
    type: "sis-logic",
    scope: ["SIS Controllers", "Safety Logic", "ESD Configurations", "Fire & Gas Settings"],
    schedule: {
      frequency: "every-4-hours",
      interval: 4,
      timezone: "Asia/Riyadh",
      enabled: true
    },
    retention: {
      policy: "time-based",
      retentionDays: 180,
      archiveAfterDays: 60,
      deleteAfterDays: 2555, // 7 years for safety-critical
      complianceRetention: 3650 // 10 years
    },
    storage: {
      primary: {
        type: "local",
        path: "/backup/sis/primary",
        capacity: "5 TB",
        used: "800 GB",
        available: "4.2 TB",
        status: "online"
      },
      secondary: {
        type: "offsite",
        path: "/offsite/sis/secondary",
        capacity: "2 TB",
        used: "600 GB",
        available: "1.4 TB",
        status: "online"
      },
      offsite: {
        type: "cloud",
        path: "s3://ksa-sis-backup/",
        capacity: "Unlimited",
        used: "450 GB",
        available: "Unlimited",
        status: "online"
      },
      replication: true,
      compression: false, // Disabled for safety-critical systems
      deduplication: false
    },
    encryption: {
      enabled: true,
      algorithm: "AES-256",
      keyManagement: "centralized",
      keyRotation: true,
      keyRotationDays: 30 // More frequent for safety-critical
    },
    verification: {
      enabled: true,
      method: "restore-test",
      frequency: "daily",
      lastVerification: "2024-01-15T13:00:00Z",
      verificationHistory: [
        {
          id: "verify-sis-001",
          timestamp: "2024-01-15T13:00:00Z",
          method: "restore-test",
          status: "success",
          details: "Full restore test completed successfully",
          filesChecked: 89,
          errorsFound: 0,
          duration: "00:12:30"
        }
      ]
    },
    status: "active",
    lastBackup: {
      id: "backup-sis-001",
      startTime: "2024-01-15T14:00:00Z",
      endTime: "2024-01-15T14:08:00Z",
      status: "completed",
      duration: "00:08:00",
      size: "245 MB",
      filesBackedUp: 89,
      errors: 0,
      warnings: 0,
      details: "SIS backup completed successfully",
      location: "/backup/sis/primary/2024-01-15-14-00",
      verificationStatus: "passed"
    },
    nextBackup: "2024-01-15T18:00:00Z",
    backupHistory: [
      {
        id: "backup-sis-001",
        startTime: "2024-01-15T14:00:00Z",
        endTime: "2024-01-15T14:08:00Z",
        status: "completed",
        duration: "00:08:00",
        size: "245 MB",
        filesBackedUp: 89,
        errors: 0,
        warnings: 0,
        details: "SIS backup completed successfully",
        location: "/backup/sis/primary/2024-01-15-14-00",
        verificationStatus: "passed"
      }
    ],
    recoveryTesting: [
      {
        id: "recovery-sis-001",
        testDate: "2024-01-08T14:00:00Z",
        testType: "full-restore",
        scope: ["All SIS Logic", "ESD Configurations"],
        status: "passed",
        duration: "01:15:00",
        recoveryTimeObjective: "02:00:00",
        actualRecoveryTime: "01:15:00",
        recoveryPointObjective: "04:00:00",
        actualRecoveryPoint: "00:30:00",
        issues: [],
        recommendations: [],
        testedBy: "Nadia Al-Zahra",
        notes: "Full SIS restore test successful, all safety functions verified"
      }
    ],
    complianceRequirements: ["IEC 62443", "API 1164", "IEC 61511", "Local Safety Regulations"],
    upstreamContext: {
      siteTypes: ["well-pad", "offshore-platform", "cpf"],
      assetTypes: ["sis", "esd", "fire-gas-system"],
      safetyImpact: true,
      productionImpact: true
    },
    createdAt: "2023-09-15T00:00:00Z",
    updatedAt: "2024-01-08T00:00:00Z",
    createdBy: "Nadia Al-Zahra"
  },

  {
    id: "backup-policy-pipeline-settings",
    tenantId: "ksa-upstream-jv",
    name: "Pipeline Control Settings",
    description: "Backup of pipeline control system configurations and valve settings",
    type: "pipeline-settings",
    scope: ["Pipeline Control", "Valve Configurations", "Flow Control Settings", "Pressure Settings"],
    schedule: {
      frequency: "every-6-hours",
      interval: 6,
      timezone: "Asia/Riyadh",
      enabled: true
    },
    retention: {
      policy: "hybrid",
      retentionDays: 120,
      retentionCount: 50,
      archiveAfterDays: 45,
      deleteAfterDays: 1825, // 5 years
      complianceRetention: 2555 // 7 years
    },
    storage: {
      primary: {
        type: "network",
        path: "/backup/pipeline/primary",
        capacity: "3 TB",
        used: "650 GB",
        available: "2.35 TB",
        status: "online"
      },
      secondary: {
        type: "offsite",
        path: "/offsite/pipeline/secondary",
        capacity: "1.5 TB",
        used: "500 GB",
        available: "1 TB",
        status: "online"
      },
      replication: true,
      compression: true,
      deduplication: true
    },
    encryption: {
      enabled: true,
      algorithm: "AES-256",
      keyManagement: "centralized",
      keyRotation: true,
      keyRotationDays: 60
    },
    verification: {
      enabled: true,
      method: "checksum",
      frequency: "every-backup",
      lastVerification: "2024-01-15T12:00:00Z",
      verificationHistory: [
        {
          id: "verify-pipeline-001",
          timestamp: "2024-01-15T12:00:00Z",
          method: "checksum",
          status: "success",
          details: "All pipeline configuration files verified",
          filesChecked: 456,
          errorsFound: 0,
          duration: "00:02:15"
        }
      ]
    },
    status: "active",
    lastBackup: {
      id: "backup-pipeline-001",
      startTime: "2024-01-15T12:00:00Z",
      endTime: "2024-01-15T12:12:00Z",
      status: "completed",
      duration: "00:12:00",
      size: "890 MB",
      filesBackedUp: 456,
      errors: 0,
      warnings: 0,
      details: "Pipeline backup completed successfully",
      location: "/backup/pipeline/primary/2024-01-15-12-00",
      verificationStatus: "passed"
    },
    nextBackup: "2024-01-15T18:00:00Z",
    backupHistory: [],
    recoveryTesting: [],
    complianceRequirements: ["API 1164", "IEC 62443"],
    upstreamContext: {
      siteTypes: ["pipeline-station", "cpf"],
      assetTypes: ["pipeline-valve", "flow-control", "pressure-control"],
      safetyImpact: true,
      productionImpact: true
    },
    createdAt: "2023-11-01T00:00:00Z",
    updatedAt: "2024-01-12T00:00:00Z",
    createdBy: "Ahmed Al-Rashid"
  },

  // Offshore Field Alpha Backup Policies
  {
    id: "backup-policy-platform-config",
    tenantId: "offshore-field-alpha",
    name: "Platform Control Configuration",
    description: "Backup of offshore platform control systems and safety configurations",
    type: "platform-config",
    scope: ["Platform Control", "Safety Systems", "Production Control", "Marine Systems"],
    schedule: {
      frequency: "every-4-hours",
      interval: 4,
      timezone: "UTC",
      enabled: true
    },
    retention: {
      policy: "time-based",
      retentionDays: 90,
      archiveAfterDays: 30,
      deleteAfterDays: 2190, // 6 years
      complianceRetention: 2555 // 7 years
    },
    storage: {
      primary: {
        type: "local",
        path: "/backup/platform/primary",
        capacity: "8 TB",
        used: "1.8 TB",
        available: "6.2 TB",
        status: "online"
      },
      secondary: {
        type: "network",
        path: "/onshore/platform/backup",
        capacity: "4 TB",
        used: "1.5 TB",
        available: "2.5 TB",
        status: "online"
      },
      replication: true,
      compression: true,
      deduplication: true
    },
    encryption: {
      enabled: true,
      algorithm: "AES-256",
      keyManagement: "centralized",
      keyRotation: true,
      keyRotationDays: 45
    },
    verification: {
      enabled: true,
      method: "hybrid",
      frequency: "daily",
      lastVerification: "2024-01-15T10:00:00Z",
      verificationHistory: []
    },
    status: "active",
    lastBackup: {
      id: "backup-platform-001",
      startTime: "2024-01-15T10:00:00Z",
      endTime: "2024-01-15T10:25:00Z",
      status: "completed",
      duration: "00:25:00",
      size: "1.8 GB",
      filesBackedUp: 2134,
      errors: 0,
      warnings: 1,
      details: "Platform backup completed with minor warnings",
      location: "/backup/platform/primary/2024-01-15-10-00",
      verificationStatus: "passed"
    },
    nextBackup: "2024-01-15T14:00:00Z",
    backupHistory: [],
    recoveryTesting: [],
    complianceRequirements: ["API 1164", "IEC 62443", "Maritime Safety Regulations"],
    upstreamContext: {
      siteTypes: ["offshore-platform"],
      assetTypes: ["platform-control", "safety-systems", "marine-systems"],
      safetyImpact: true,
      productionImpact: true
    },
    createdAt: "2023-08-01T00:00:00Z",
    updatedAt: "2024-01-10T00:00:00Z",
    createdBy: "Captain Sarah Mitchell"
  }
];

// =============================================================================
// Platform Workloads
// =============================================================================

export const platformWorkloads: PlatformWorkload[] = [
  // KSA Upstream JV Workloads
  {
    id: "workload-scada-collector-01",
    tenantId: "ksa-upstream-jv",
    name: "SCADA Data Collector",
    description: "Primary SCADA data collection service for well pad and pipeline telemetry",
    type: "scada-collector",
    category: "data-collection",
    status: "running",
    version: "v2.4.1",
    lastUpdated: "2024-01-10T00:00:00Z",
    securityScore: 87,
    hardeningScore: 92,
    vulnerabilityCount: {
      critical: 0,
      high: 1,
      medium: 3,
      low: 8
    },
    complianceStatus: ["IEC 62443", "API 1164", "NIST 800-82"],
    upstreamContext: {
      handlesOtData: true,
      dataTypes: ["scada-telemetry", "pipeline-data", "well-data"],
      siteTypes: ["well-pad", "pipeline-station", "cpf"],
      assetTypes: ["wellhead-plc", "rtu", "pipeline-valve", "compressor"],
      safetyImpact: false,
      productionImpact: true
    },
    resources: {
      cpu: "2.1 GHz (4 cores)",
      memory: "8 GB",
      disk: "500 GB SSD",
      status: "normal"
    },
    networkZone: "control",
    exposedPorts: [502, 443, 8080],
    tlsEnabled: true,
    healthStatus: "healthy",
    lastHealthCheck: "2024-01-15T15:30:00Z",
    createdAt: "2023-08-15T00:00:00Z",
    updatedAt: "2024-01-10T00:00:00Z",
    managedBy: "Ahmed Al-Rashid"
  },

  {
    id: "workload-sis-gateway-01",
    tenantId: "ksa-upstream-jv",
    name: "SIS Communication Gateway",
    description: "Safety Instrumented System communication gateway for ESD and fire & gas systems",
    type: "communication-gateway",
    category: "communication",
    status: "running",
    version: "v1.8.3",
    lastUpdated: "2024-01-12T00:00:00Z",
    securityScore: 95,
    hardeningScore: 98,
    vulnerabilityCount: {
      critical: 0,
      high: 0,
      medium: 1,
      low: 2
    },
    complianceStatus: ["IEC 62443", "IEC 61511", "API 1164"],
    upstreamContext: {
      handlesOtData: true,
      dataTypes: ["sis-data", "safety-signals"],
      siteTypes: ["well-pad", "offshore-platform", "cpf"],
      assetTypes: ["sis", "esd", "fire-gas-system"],
      safetyImpact: true,
      productionImpact: true
    },
    resources: {
      cpu: "1.8 GHz (2 cores)",
      memory: "4 GB",
      disk: "250 GB SSD",
      status: "normal"
    },
    networkZone: "sis",
    exposedPorts: [443, 4840],
    tlsEnabled: true,
    healthStatus: "healthy",
    lastHealthCheck: "2024-01-15T15:25:00Z",
    createdAt: "2023-09-01T00:00:00Z",
    updatedAt: "2024-01-12T00:00:00Z",
    managedBy: "Nadia Al-Zahra"
  },

  {
    id: "workload-historian-service-01",
    tenantId: "ksa-upstream-jv",
    name: "Process Data Historian",
    description: "Historical data storage and retrieval service for production and process data",
    type: "historian-service",
    category: "data-processing",
    status: "running",
    version: "v3.2.0",
    lastUpdated: "2024-01-08T00:00:00Z",
    securityScore: 82,
    hardeningScore: 85,
    vulnerabilityCount: {
      critical: 0,
      high: 2,
      medium: 5,
      low: 12
    },
    complianceStatus: ["API 1164", "NIST CSF"],
    upstreamContext: {
      handlesOtData: true,
      dataTypes: ["scada-telemetry", "pipeline-data", "well-data", "production-data"],
      siteTypes: ["well-pad", "pipeline-station", "cpf", "gathering-station"],
      assetTypes: ["wellhead-plc", "rtu", "flow-meter", "pressure-sensor"],
      safetyImpact: false,
      productionImpact: true
    },
    resources: {
      cpu: "3.2 GHz (8 cores)",
      memory: "32 GB",
      disk: "10 TB HDD",
      status: "warning"
    },
    networkZone: "control",
    exposedPorts: [443, 8443, 1433],
    tlsEnabled: true,
    healthStatus: "healthy",
    lastHealthCheck: "2024-01-15T15:20:00Z",
    createdAt: "2023-07-20T00:00:00Z",
    updatedAt: "2024-01-08T00:00:00Z",
    managedBy: "Ahmed Al-Rashid"
  },

  {
    id: "workload-hmi-server-01",
    tenantId: "ksa-upstream-jv",
    name: "HMI Application Server",
    description: "Human Machine Interface server for operator workstations and control room displays",
    type: "hmi-server",
    category: "user-interface",
    status: "running",
    version: "v2.1.5",
    lastUpdated: "2024-01-05T00:00:00Z",
    securityScore: 78,
    hardeningScore: 80,
    vulnerabilityCount: {
      critical: 1,
      high: 3,
      medium: 7,
      low: 15
    },
    complianceStatus: ["IEC 62443", "API 1164"],
    upstreamContext: {
      handlesOtData: true,
      dataTypes: ["scada-telemetry", "sis-data", "alarm-data"],
      siteTypes: ["well-pad", "cpf", "control-room"],
      assetTypes: ["scada-master", "sis", "alarm-system"],
      safetyImpact: true,
      productionImpact: true
    },
    resources: {
      cpu: "2.8 GHz (6 cores)",
      memory: "16 GB",
      disk: "1 TB SSD",
      status: "normal"
    },
    networkZone: "control",
    exposedPorts: [443, 8080, 3389],
    tlsEnabled: true,
    healthStatus: "degraded",
    lastHealthCheck: "2024-01-15T15:15:00Z",
    createdAt: "2023-06-10T00:00:00Z",
    updatedAt: "2024-01-05T00:00:00Z",
    managedBy: "Ahmed Al-Rashid"
  },

  {
    id: "workload-security-service-01",
    tenantId: "ksa-upstream-jv",
    name: "OT Security Monitor",
    description: "Security monitoring and threat detection service for OT networks",
    type: "security-service",
    category: "security",
    status: "running",
    version: "v1.5.2",
    lastUpdated: "2024-01-14T00:00:00Z",
    securityScore: 96,
    hardeningScore: 99,
    vulnerabilityCount: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 1
    },
    complianceStatus: ["IEC 62443", "NIST CSF", "NIST 800-82"],
    upstreamContext: {
      handlesOtData: true,
      dataTypes: ["network-traffic", "security-events", "audit-logs"],
      siteTypes: ["well-pad", "offshore-platform", "cpf", "pipeline-station"],
      assetTypes: ["all-ot-assets"],
      safetyImpact: true,
      productionImpact: true
    },
    resources: {
      cpu: "2.4 GHz (4 cores)",
      memory: "12 GB",
      disk: "2 TB SSD",
      status: "normal"
    },
    networkZone: "dmz",
    exposedPorts: [443, 514, 6514],
    tlsEnabled: true,
    healthStatus: "healthy",
    lastHealthCheck: "2024-01-15T15:35:00Z",
    createdAt: "2023-10-01T00:00:00Z",
    updatedAt: "2024-01-14T00:00:00Z",
    managedBy: "Nadia Al-Zahra"
  },

  // Offshore Field Alpha Workloads
  {
    id: "workload-platform-collector-01",
    tenantId: "offshore-field-alpha",
    name: "Platform Data Collector",
    description: "Offshore platform data collection service for production and safety systems",
    type: "scada-collector",
    category: "data-collection",
    status: "running",
    version: "v2.3.8",
    lastUpdated: "2024-01-11T00:00:00Z",
    securityScore: 89,
    hardeningScore: 91,
    vulnerabilityCount: {
      critical: 0,
      high: 1,
      medium: 2,
      low: 6
    },
    complianceStatus: ["IEC 62443", "API 1164", "Maritime Safety"],
    upstreamContext: {
      handlesOtData: true,
      dataTypes: ["scada-telemetry", "platform-data", "marine-systems"],
      siteTypes: ["offshore-platform"],
      assetTypes: ["platform-control", "safety-systems", "marine-systems"],
      safetyImpact: true,
      productionImpact: true
    },
    resources: {
      cpu: "2.6 GHz (4 cores)",
      memory: "12 GB",
      disk: "750 GB SSD",
      status: "normal"
    },
    networkZone: "control",
    exposedPorts: [502, 443],
    tlsEnabled: true,
    healthStatus: "healthy",
    lastHealthCheck: "2024-01-15T14:30:00Z",
    createdAt: "2023-05-15T00:00:00Z",
    updatedAt: "2024-01-11T00:00:00Z",
    managedBy: "Captain Sarah Mitchell"
  },

  {
    id: "workload-satellite-gateway-01",
    tenantId: "offshore-field-alpha",
    name: "Satellite Communication Gateway",
    description: "Secure satellite communication gateway for platform-to-shore data transmission",
    type: "communication-gateway",
    category: "communication",
    status: "running",
    version: "v1.9.1",
    lastUpdated: "2024-01-13T00:00:00Z",
    securityScore: 93,
    hardeningScore: 95,
    vulnerabilityCount: {
      critical: 0,
      high: 0,
      medium: 1,
      low: 3
    },
    complianceStatus: ["IEC 62443", "Maritime Communications"],
    upstreamContext: {
      handlesOtData: true,
      dataTypes: ["all-platform-data"],
      siteTypes: ["offshore-platform"],
      assetTypes: ["communication-systems"],
      safetyImpact: true,
      productionImpact: true
    },
    resources: {
      cpu: "1.9 GHz (2 cores)",
      memory: "6 GB",
      disk: "300 GB SSD",
      status: "normal"
    },
    networkZone: "dmz",
    exposedPorts: [443, 4443],
    tlsEnabled: true,
    healthStatus: "healthy",
    lastHealthCheck: "2024-01-15T14:25:00Z",
    createdAt: "2023-04-20T00:00:00Z",
    updatedAt: "2024-01-13T00:00:00Z",
    managedBy: "Captain Sarah Mitchell"
  },

  // Onshore Field Bravo Workloads
  {
    id: "workload-edge-processor-01",
    tenantId: "onshore-field-bravo",
    name: "Field Edge Processor",
    description: "Edge computing service for local data processing and analytics at well sites",
    type: "edge-processor",
    category: "edge-computing",
    status: "running",
    version: "v1.7.4",
    lastUpdated: "2024-01-09T00:00:00Z",
    securityScore: 84,
    hardeningScore: 87,
    vulnerabilityCount: {
      critical: 0,
      high: 2,
      medium: 4,
      low: 9
    },
    complianceStatus: ["API 1164", "NIST 800-82"],
    upstreamContext: {
      handlesOtData: true,
      dataTypes: ["well-data", "sensor-data", "analytics-results"],
      siteTypes: ["well-pad", "gathering-station"],
      assetTypes: ["wellhead-plc", "sensors", "edge-devices"],
      safetyImpact: false,
      productionImpact: true
    },
    resources: {
      cpu: "2.0 GHz (4 cores)",
      memory: "8 GB",
      disk: "512 GB SSD",
      status: "normal"
    },
    networkZone: "field",
    exposedPorts: [443, 8883],
    tlsEnabled: true,
    healthStatus: "healthy",
    lastHealthCheck: "2024-01-15T16:00:00Z",
    createdAt: "2023-11-10T00:00:00Z",
    updatedAt: "2024-01-09T00:00:00Z",
    managedBy: "Mike Thompson"
  },

  {
    id: "workload-backup-service-01",
    tenantId: "onshore-field-bravo",
    name: "Field Backup Service",
    description: "Automated backup service for field device configurations and historical data",
    type: "backup-service",
    category: "backup",
    status: "running",
    version: "v2.0.3",
    lastUpdated: "2024-01-07T00:00:00Z",
    securityScore: 91,
    hardeningScore: 94,
    vulnerabilityCount: {
      critical: 0,
      high: 0,
      medium: 2,
      low: 4
    },
    complianceStatus: ["API 1164", "NIST CSF"],
    upstreamContext: {
      handlesOtData: true,
      dataTypes: ["configuration-data", "historical-data", "backup-data"],
      siteTypes: ["well-pad", "gathering-station", "field-office"],
      assetTypes: ["wellhead-plc", "rtu", "field-gateway"],
      safetyImpact: false,
      productionImpact: true
    },
    resources: {
      cpu: "1.6 GHz (2 cores)",
      memory: "4 GB",
      disk: "5 TB HDD",
      status: "warning"
    },
    networkZone: "control",
    exposedPorts: [443, 22],
    tlsEnabled: true,
    healthStatus: "healthy",
    lastHealthCheck: "2024-01-15T15:55:00Z",
    createdAt: "2023-12-01T00:00:00Z",
    updatedAt: "2024-01-07T00:00:00Z",
    managedBy: "Mike Thompson"
  }
];

// =============================================================================
// Application Security Scans
// =============================================================================

export const applicationSecurityScans: ApplicationSecurityScan[] = [
  // KSA Upstream JV Application Scans
  {
    id: "scan-scada-collector-sast-001",
    tenantId: "ksa-upstream-jv",
    applicationName: "SCADA Data Collector",
    applicationVersion: "v2.4.1",
    applicationComponent: "Core Service",
    scanType: "sast",
    scanDate: "2024-01-15T10:00:00Z",
    scanDuration: "00:45:30",
    status: "completed",
    vulnerabilitySummary: {
      critical: 0,
      high: 2,
      medium: 8,
      low: 15,
      info: 3,
      total: 28
    },
    scanDetails: {
      linesOfCode: 125000,
      filesScanned: 450,
      rulesExecuted: 280,
      coverage: 92
    },
    findings: [
      {
        id: "finding-001",
        type: "vulnerability",
        severity: "high",
        title: "SQL Injection Vulnerability",
        description: "Potential SQL injection in data query module",
        recommendation: "Use parameterized queries and input validation",
        status: "open",
        detectedAt: "2024-01-15T10:15:00Z"
      },
      {
        id: "finding-002",
        type: "vulnerability",
        severity: "high",
        title: "Insecure Cryptographic Storage",
        description: "Sensitive data stored without proper encryption",
        recommendation: "Implement AES-256 encryption for sensitive data storage",
        status: "in-progress",
        detectedAt: "2024-01-15T10:20:00Z",
        assignedTo: "Ahmed Al-Rashid"
      }
    ],
    remediationSummary: {
      fixed: 12,
      inProgress: 8,
      accepted: 5,
      falsePositive: 3
    },
    complianceStatus: [
      {
        standard: "IEC 62443",
        score: 85,
        status: "warning"
      },
      {
        standard: "NIST 800-82",
        score: 92,
        status: "pass"
      }
    ],
    upstreamContext: {
      handlesOtData: true,
      safetyImpact: false,
      productionImpact: true,
      dataTypes: ["scada-telemetry", "pipeline-data", "well-data"]
    },
    scannerName: "Veracode SAST",
    scannerVersion: "v23.12.1",
    configurationProfile: "ICS Security Profile",
    triggeredBy: "Ahmed Al-Rashid",
    nextScan: "2024-01-22T10:00:00Z"
  },

  {
    id: "scan-sis-gateway-dast-001",
    tenantId: "ksa-upstream-jv",
    applicationName: "SIS Communication Gateway",
    applicationVersion: "v1.8.3",
    applicationComponent: "Web Interface",
    scanType: "dast",
    scanDate: "2024-01-14T14:00:00Z",
    scanDuration: "01:20:15",
    status: "completed",
    vulnerabilitySummary: {
      critical: 0,
      high: 0,
      medium: 3,
      low: 7,
      info: 2,
      total: 12
    },
    scanDetails: {
      rulesExecuted: 150,
      coverage: 88
    },
    findings: [
      {
        id: "finding-003",
        type: "vulnerability",
        severity: "medium",
        title: "Missing Security Headers",
        description: "HTTP security headers not properly configured",
        recommendation: "Implement Content-Security-Policy and X-Frame-Options headers",
        status: "open",
        detectedAt: "2024-01-14T14:30:00Z"
      }
    ],
    remediationSummary: {
      fixed: 8,
      inProgress: 3,
      accepted: 1,
      falsePositive: 0
    },
    complianceStatus: [
      {
        standard: "IEC 62443",
        score: 95,
        status: "pass"
      },
      {
        standard: "IEC 61511",
        score: 98,
        status: "pass"
      }
    ],
    upstreamContext: {
      handlesOtData: true,
      safetyImpact: true,
      productionImpact: true,
      dataTypes: ["sis-data", "safety-signals"]
    },
    scannerName: "OWASP ZAP",
    scannerVersion: "v2.14.0",
    configurationProfile: "Safety Systems Profile",
    triggeredBy: "Nadia Al-Zahra",
    nextScan: "2024-01-21T14:00:00Z"
  },

  {
    id: "scan-historian-dependency-001",
    tenantId: "ksa-upstream-jv",
    applicationName: "Process Data Historian",
    applicationVersion: "v3.2.0",
    applicationComponent: "Dependencies",
    scanType: "dependency",
    scanDate: "2024-01-13T09:00:00Z",
    scanDuration: "00:25:45",
    status: "completed",
    vulnerabilitySummary: {
      critical: 1,
      high: 4,
      medium: 12,
      low: 23,
      info: 8,
      total: 48
    },
    scanDetails: {
      dependenciesScanned: 156,
      coverage: 100
    },
    findings: [
      {
        id: "finding-004",
        type: "vulnerability",
        severity: "critical",
        title: "Critical Vulnerability in Log4j",
        description: "CVE-2021-44228 - Remote Code Execution vulnerability",
        recommendation: "Upgrade Log4j to version 2.17.1 or later",
        status: "in-progress",
        detectedAt: "2024-01-13T09:15:00Z",
        assignedTo: "Ahmed Al-Rashid"
      },
      {
        id: "finding-005",
        type: "vulnerability",
        severity: "high",
        title: "Outdated Database Driver",
        description: "Database driver contains known security vulnerabilities",
        recommendation: "Update to latest stable version of database driver",
        status: "open",
        detectedAt: "2024-01-13T09:20:00Z"
      }
    ],
    remediationSummary: {
      fixed: 15,
      inProgress: 18,
      accepted: 10,
      falsePositive: 5
    },
    complianceStatus: [
      {
        standard: "API 1164",
        score: 78,
        status: "warning"
      },
      {
        standard: "NIST CSF",
        score: 82,
        status: "warning"
      }
    ],
    upstreamContext: {
      handlesOtData: true,
      safetyImpact: false,
      productionImpact: true,
      dataTypes: ["scada-telemetry", "pipeline-data", "well-data", "production-data"]
    },
    scannerName: "Snyk",
    scannerVersion: "v1.1200.0",
    configurationProfile: "Production Systems Profile",
    triggeredBy: "Automated Scheduler",
    nextScan: "2024-01-20T09:00:00Z"
  },

  {
    id: "scan-hmi-server-container-001",
    tenantId: "ksa-upstream-jv",
    applicationName: "HMI Application Server",
    applicationVersion: "v2.1.5",
    applicationComponent: "Container Image",
    scanType: "container",
    scanDate: "2024-01-12T16:00:00Z",
    scanDuration: "00:15:30",
    status: "completed",
    vulnerabilitySummary: {
      critical: 2,
      high: 6,
      medium: 14,
      low: 28,
      info: 12,
      total: 62
    },
    scanDetails: {
      filesScanned: 2340,
      coverage: 95
    },
    findings: [
      {
        id: "finding-006",
        type: "vulnerability",
        severity: "critical",
        title: "Privileged Container Execution",
        description: "Container running with unnecessary privileged access",
        recommendation: "Remove privileged flag and use specific capabilities",
        status: "open",
        detectedAt: "2024-01-12T16:10:00Z"
      },
      {
        id: "finding-007",
        type: "vulnerability",
        severity: "critical",
        title: "Outdated Base Image",
        description: "Base container image contains critical security vulnerabilities",
        recommendation: "Update to latest LTS base image",
        status: "in-progress",
        detectedAt: "2024-01-12T16:12:00Z",
        assignedTo: "Ahmed Al-Rashid"
      }
    ],
    remediationSummary: {
      fixed: 20,
      inProgress: 25,
      accepted: 12,
      falsePositive: 5
    },
    complianceStatus: [
      {
        standard: "IEC 62443",
        score: 72,
        status: "warning"
      },
      {
        standard: "API 1164",
        score: 75,
        status: "warning"
      }
    ],
    upstreamContext: {
      handlesOtData: true,
      safetyImpact: true,
      productionImpact: true,
      dataTypes: ["scada-telemetry", "sis-data", "alarm-data"]
    },
    scannerName: "Twistlock",
    scannerVersion: "v22.12.582",
    configurationProfile: "HMI Security Profile",
    triggeredBy: "Ahmed Al-Rashid",
    nextScan: "2024-01-19T16:00:00Z"
  },

  // Offshore Field Alpha Application Scans
  {
    id: "scan-platform-collector-sast-001",
    tenantId: "offshore-field-alpha",
    applicationName: "Platform Data Collector",
    applicationVersion: "v2.3.8",
    applicationComponent: "Core Service",
    scanType: "sast",
    scanDate: "2024-01-14T08:00:00Z",
    scanDuration: "00:38:20",
    status: "completed",
    vulnerabilitySummary: {
      critical: 0,
      high: 1,
      medium: 5,
      low: 12,
      info: 4,
      total: 22
    },
    scanDetails: {
      linesOfCode: 98000,
      filesScanned: 320,
      rulesExecuted: 260,
      coverage: 94
    },
    findings: [
      {
        id: "finding-008",
        type: "vulnerability",
        severity: "high",
        title: "Weak Cryptographic Algorithm",
        description: "Use of deprecated MD5 hash algorithm",
        recommendation: "Replace MD5 with SHA-256 or stronger algorithm",
        status: "in-progress",
        detectedAt: "2024-01-14T08:25:00Z",
        assignedTo: "Captain Sarah Mitchell"
      }
    ],
    remediationSummary: {
      fixed: 18,
      inProgress: 3,
      accepted: 1,
      falsePositive: 0
    },
    complianceStatus: [
      {
        standard: "IEC 62443",
        score: 89,
        status: "pass"
      },
      {
        standard: "Maritime Safety",
        score: 95,
        status: "pass"
      }
    ],
    upstreamContext: {
      handlesOtData: true,
      safetyImpact: true,
      productionImpact: true,
      dataTypes: ["scada-telemetry", "platform-data", "marine-systems"]
    },
    scannerName: "Checkmarx SAST",
    scannerVersion: "v9.4.2",
    configurationProfile: "Offshore Platform Profile",
    triggeredBy: "Captain Sarah Mitchell",
    nextScan: "2024-01-21T08:00:00Z"
  },

  // Onshore Field Bravo Application Scans
  {
    id: "scan-edge-processor-compliance-001",
    tenantId: "onshore-field-bravo",
    applicationName: "Field Edge Processor",
    applicationVersion: "v1.7.4",
    applicationComponent: "Full Application",
    scanType: "compliance",
    scanDate: "2024-01-11T12:00:00Z",
    scanDuration: "01:15:45",
    status: "completed",
    vulnerabilitySummary: {
      critical: 0,
      high: 3,
      medium: 9,
      low: 18,
      info: 6,
      total: 36
    },
    scanDetails: {
      rulesExecuted: 180,
      coverage: 87
    },
    findings: [
      {
        id: "finding-009",
        type: "compliance-gap",
        severity: "high",
        title: "Insufficient Audit Logging",
        description: "Application does not log all required security events",
        recommendation: "Implement comprehensive audit logging per API 1164 requirements",
        status: "open",
        detectedAt: "2024-01-11T12:30:00Z"
      }
    ],
    remediationSummary: {
      fixed: 25,
      inProgress: 8,
      accepted: 3,
      falsePositive: 0
    },
    complianceStatus: [
      {
        standard: "API 1164",
        score: 84,
        status: "warning"
      },
      {
        standard: "NIST 800-82",
        score: 91,
        status: "pass"
      }
    ],
    upstreamContext: {
      handlesOtData: true,
      safetyImpact: false,
      productionImpact: true,
      dataTypes: ["well-data", "sensor-data", "analytics-results"]
    },
    scannerName: "Rapid7 InsightAppSec",
    scannerVersion: "v2023.12.1",
    configurationProfile: "Field Systems Profile",
    triggeredBy: "Mike Thompson",
    nextScan: "2024-01-18T12:00:00Z"
  }
];

// Helper Functions for Application Security Scans
// =============================================================================

export function getApplicationSecurityScansByTenant(tenantId: string): ApplicationSecurityScan[] {
  return applicationSecurityScans.filter(scan => scan.tenantId === tenantId);
}

export function getApplicationSecurityScansByType(tenantId: string, scanType: string): ApplicationSecurityScan[] {
  return applicationSecurityScans.filter(scan =>
    scan.tenantId === tenantId && scan.scanType === scanType
  );
}

export function getApplicationSecurityScansByApplication(tenantId: string, applicationName: string): ApplicationSecurityScan[] {
  return applicationSecurityScans.filter(scan =>
    scan.tenantId === tenantId && scan.applicationName === applicationName
  );
}

export function getHighRiskApplicationScans(tenantId: string): ApplicationSecurityScan[] {
  return applicationSecurityScans.filter(scan =>
    scan.tenantId === tenantId &&
    (scan.vulnerabilitySummary.critical > 0 || scan.vulnerabilitySummary.high > 3)
  );
}

export function getSafetyImpactApplicationScans(tenantId: string): ApplicationSecurityScan[] {
  return applicationSecurityScans.filter(scan =>
    scan.tenantId === tenantId && scan.upstreamContext.safetyImpact
  );
}

export function searchApplicationSecurityScans(tenantId: string, query: string): ApplicationSecurityScan[] {
  const lowerQuery = query.toLowerCase();
  return applicationSecurityScans.filter(scan =>
    scan.tenantId === tenantId && (
      scan.applicationName.toLowerCase().includes(lowerQuery) ||
      scan.applicationComponent.toLowerCase().includes(lowerQuery) ||
      scan.scanType.toLowerCase().includes(lowerQuery) ||
      scan.scannerName.toLowerCase().includes(lowerQuery)
    )
  );
}

// Helper Functions for Platform Workloads
// =============================================================================

export function getPlatformWorkloadsByTenant(tenantId: string): PlatformWorkload[] {
  return platformWorkloads.filter(workload => workload.tenantId === tenantId);
}

export function getPlatformWorkloadsByType(tenantId: string, type: string): PlatformWorkload[] {
  return platformWorkloads.filter(workload =>
    workload.tenantId === tenantId && workload.type === type
  );
}

export function getPlatformWorkloadsByCategory(tenantId: string, category: string): PlatformWorkload[] {
  return platformWorkloads.filter(workload =>
    workload.tenantId === tenantId && workload.category === category
  );
}

export function getPlatformWorkloadsByStatus(tenantId: string, status: string): PlatformWorkload[] {
  return platformWorkloads.filter(workload =>
    workload.tenantId === tenantId && workload.status === status
  );
}

export function getHighRiskWorkloads(tenantId: string): PlatformWorkload[] {
  return platformWorkloads.filter(workload =>
    workload.tenantId === tenantId &&
    (workload.securityScore < 80 ||
      workload.vulnerabilityCount.critical > 0 ||
      workload.vulnerabilityCount.high > 2)
  );
}

export function getSafetyImpactWorkloads(tenantId: string): PlatformWorkload[] {
  return platformWorkloads.filter(workload =>
    workload.tenantId === tenantId && workload.upstreamContext.safetyImpact
  );
}

export function searchPlatformWorkloads(tenantId: string, query: string): PlatformWorkload[] {
  const lowerQuery = query.toLowerCase();
  return platformWorkloads.filter(workload =>
    workload.tenantId === tenantId && (
      workload.name.toLowerCase().includes(lowerQuery) ||
      workload.description.toLowerCase().includes(lowerQuery) ||
      workload.type.toLowerCase().includes(lowerQuery) ||
      workload.category.toLowerCase().includes(lowerQuery)
    )
  );
}

// Helper Functions for Backup Policies
// =============================================================================

export function getBackupPoliciesByTenant(tenantId: string): BackupPolicy[] {
  return backupPolicies.filter(policy => policy.tenantId === tenantId);
}

export function getBackupPoliciesByType(tenantId: string, type: string): BackupPolicy[] {
  return backupPolicies.filter(policy =>
    policy.tenantId === tenantId && policy.type === type
  );
}

export function getBackupPoliciesByStatus(tenantId: string, status: string): BackupPolicy[] {
  return backupPolicies.filter(policy =>
    policy.tenantId === tenantId && policy.status === status
  );
}

export function getFailedBackups(tenantId: string): BackupPolicy[] {
  return backupPolicies.filter(policy =>
    policy.tenantId === tenantId &&
    policy.lastBackup?.status === 'failed'
  );
}

export function getOverdueBackups(tenantId: string): BackupPolicy[] {
  const now = new Date();
  return backupPolicies.filter(policy =>
    policy.tenantId === tenantId &&
    new Date(policy.nextBackup) < now
  );
}

export function searchBackupPolicies(tenantId: string, query: string): BackupPolicy[] {
  const lowerQuery = query.toLowerCase();
  return backupPolicies.filter(policy =>
    policy.tenantId === tenantId && (
      policy.name.toLowerCase().includes(lowerQuery) ||
      policy.description.toLowerCase().includes(lowerQuery) ||
      policy.type.toLowerCase().includes(lowerQuery) ||
      policy.scope.some(item => item.toLowerCase().includes(lowerQuery))
    )
  );
}

// Helper Functions for Secrets & Certificates
// =============================================================================

export function getSecretsCertificatesByTenant(tenantId: string): SecretCertificate[] {
  return secretsCertificates.filter(secret => secret.tenantId === tenantId);
}

export function getSecretsCertificatesByType(tenantId: string, type: string): SecretCertificate[] {
  return secretsCertificates.filter(secret =>
    secret.tenantId === tenantId && secret.type === type
  );
}

export function getSecretsCertificatesByStatus(tenantId: string, status: string): SecretCertificate[] {
  return secretsCertificates.filter(secret =>
    secret.tenantId === tenantId && secret.status === status
  );
}

export function getExpiringSecretsCertificates(tenantId: string, daysThreshold: number = 90): SecretCertificate[] {
  return secretsCertificates.filter(secret =>
    secret.tenantId === tenantId &&
    secret.daysUntilExpiry !== undefined &&
    secret.daysUntilExpiry <= daysThreshold &&
    secret.daysUntilExpiry > 0
  );
}

export function getDeprecatedAlgorithmSecrets(tenantId: string): SecretCertificate[] {
  return secretsCertificates.filter(secret =>
    secret.tenantId === tenantId && secret.isDeprecatedAlgorithm
  );
}

export function searchSecretsCertificates(tenantId: string, query: string): SecretCertificate[] {
  const lowerQuery = query.toLowerCase();
  return secretsCertificates.filter(secret =>
    secret.tenantId === tenantId && (
      secret.name.toLowerCase().includes(lowerQuery) ||
      secret.description.toLowerCase().includes(lowerQuery) ||
      secret.associatedSystemNames.some(system => system.toLowerCase().includes(lowerQuery)) ||
      secret.type.toLowerCase().includes(lowerQuery)
    )
  );
}

// =============================================================================
// Helper Functions for Audit Readiness
// =============================================================================

export function getAuditReadinessByTenant(tenantId: string): AuditReadiness[] {
  return auditReadiness.filter(audit => audit.tenantId === tenantId);
}

export function getAuditReadinessByType(tenantId: string, type: string): AuditReadiness[] {
  return auditReadiness.filter(audit =>
    audit.tenantId === tenantId && audit.type === type
  );
}

export function getAuditReadinessByStatus(tenantId: string, status: string): AuditReadiness[] {
  return auditReadiness.filter(audit =>
    audit.tenantId === tenantId && audit.preparationStatus === status
  );
}

export function getUpcomingAudits(tenantId: string, daysThreshold: number = 90): AuditReadiness[] {
  return auditReadiness.filter(audit =>
    audit.tenantId === tenantId &&
    audit.daysUntilAudit <= daysThreshold &&
    audit.daysUntilAudit > 0
  );
}

export function getOverdueAudits(tenantId: string): AuditReadiness[] {
  return auditReadiness.filter(audit =>
    audit.tenantId === tenantId && audit.preparationStatus === 'overdue'
  );
}

export function getCriticalGapAudits(tenantId: string): AuditReadiness[] {
  return auditReadiness.filter(audit =>
    audit.tenantId === tenantId && audit.criticalGaps.length > 0
  );
}

export function searchAuditReadiness(tenantId: string, query: string): AuditReadiness[] {
  const lowerQuery = query.toLowerCase();
  return auditReadiness.filter(audit =>
    audit.tenantId === tenantId && (
      audit.name.toLowerCase().includes(lowerQuery) ||
      audit.description.toLowerCase().includes(lowerQuery) ||
      audit.standard.toLowerCase().includes(lowerQuery) ||
      audit.assignedCoordinator.toLowerCase().includes(lowerQuery)
    )
  );
}

// =============================================================================
// Forensic Snapshots
// =============================================================================

export const forensicSnapshots: ForensicSnapshot[] = [
  // SIS Override Snapshots
  {
    id: "snapshot-001",
    tenantId: "ksa-upstream-jv",
    incidentId: "incident-sis-override-001",
    triggerEvent: "Unauthorized SIS Override - Wellhead Alpha-01",
    triggerType: "sis-override",
    capturedAt: "2024-01-15T14:30:00Z",
    scope: [
      "wellhead-plc-alpha-01-wh01",
      "sis-alpha-01",
      "zone-sis-alpha-01",
      "zone-control-alpha-01"
    ],
    systemState: {
      sisStatus: "override_active",
      wellheadPressure: 2850,
      flowRate: 1250,
      safetyLoopStatus: "bypassed",
      alarmStatus: "suppressed",
      operatorActions: [
        "SIS override initiated at 14:28:45",
        "Safety alarm acknowledged at 14:29:12",
        "Manual valve adjustment at 14:29:30"
      ]
    },
    configurations: {
      sisConfiguration: {
        tripPoint: "3000 PSI",
        responseTime: "500ms",
        bypassEnabled: true,
        lastModified: "2024-01-15T14:28:45Z"
      },
      wellheadSettings: {
        maxPressure: "3500 PSI",
        operatingPressure: "2800 PSI",
        safetyMargin: "15%"
      }
    },
    logSegments: [
      "2024-01-15T14:28:45Z [SIS] Override initiated by user: field-operator-ahmed",
      "2024-01-15T14:28:46Z [SIS] Safety interlock bypassed - Reason: Maintenance",
      "2024-01-15T14:29:12Z [ALARM] High pressure alarm acknowledged",
      "2024-01-15T14:29:30Z [WELLHEAD] Manual valve position changed: 100% -> 85%",
      "2024-01-15T14:30:00Z [SYSTEM] Forensic snapshot captured"
    ],
    capturedBy: "Automated Security System",
    retentionUntil: "2025-01-15T14:30:00Z",
    isRegulatory: true
  },
  {
    id: "snapshot-002",
    tenantId: "offshore-field-alpha",
    incidentId: "incident-platform-sis-002",
    triggerEvent: "Emergency Shutdown Override - Platform Alpha",
    triggerType: "sis-override",
    capturedAt: "2024-01-14T09:15:00Z",
    scope: [
      "sis-platform-alpha-esd",
      "platform-alpha-north",
      "zone-sis-platform-alpha",
      "zone-control-platform-alpha"
    ],
    systemState: {
      esdStatus: "override_active",
      platformPressure: 1850,
      gasFlowRate: 2100,
      oilFlowRate: 850,
      safetySystemStatus: "partially_bypassed",
      emergencyStatus: "standby"
    },
    configurations: {
      esdConfiguration: {
        tripConditions: ["High pressure", "Low flow", "Gas leak"],
        responseTime: "200ms",
        overrideReason: "Planned maintenance - Compressor C-101",
        authorizedBy: "Platform Supervisor - Erik Nordahl"
      }
    },
    logSegments: [
      "2024-01-14T09:14:30Z [ESD] Override request submitted",
      "2024-01-14T09:14:45Z [ESD] Supervisor approval received",
      "2024-01-14T09:15:00Z [ESD] Emergency shutdown system bypassed",
      "2024-01-14T09:15:00Z [SYSTEM] Forensic snapshot captured"
    ],
    capturedBy: "Platform Safety System",
    retentionUntil: "2025-01-14T09:15:00Z",
    isRegulatory: true
  },

  // Pipeline Anomaly Snapshots
  {
    id: "snapshot-003",
    tenantId: "ksa-upstream-jv",
    incidentId: "incident-pipeline-anomaly-001",
    triggerEvent: "Pressure Anomaly - Pipeline Station 01",
    triggerType: "pipeline-anomaly",
    capturedAt: "2024-01-13T16:45:00Z",
    scope: [
      "pipeline-valve-main-01",
      "rtu-pipeline-01",
      "pipeline-station-01",
      "zone-field-pipeline-01"
    ],
    systemState: {
      pipelinePressure: 3200,
      normalPressure: 2500,
      flowRate: 950,
      valvePosition: "78%",
      anomalyType: "pressure_spike",
      duration: "15 minutes"
    },
    configurations: {
      pipelineSettings: {
        maxOperatingPressure: "3000 PSI",
        normalOperatingPressure: "2500 PSI",
        alarmThreshold: "2800 PSI",
        tripThreshold: "3100 PSI"
      },
      valveConfiguration: {
        type: "Ball Valve 24\"",
        operatingMode: "automatic",
        responseTime: "30 seconds",
        lastCalibration: "2024-01-01T00:00:00Z"
      }
    },
    logSegments: [
      "2024-01-13T16:30:00Z [PIPELINE] Pressure reading: 2500 PSI (Normal)",
      "2024-01-13T16:35:00Z [PIPELINE] Pressure reading: 2750 PSI (Elevated)",
      "2024-01-13T16:40:00Z [PIPELINE] Pressure reading: 3000 PSI (High Alarm)",
      "2024-01-13T16:43:00Z [PIPELINE] Pressure reading: 3200 PSI (Critical)",
      "2024-01-13T16:45:00Z [SYSTEM] Forensic snapshot captured",
      "2024-01-13T16:46:00Z [VALVE] Automatic closure initiated"
    ],
    capturedBy: "Pipeline Monitoring System",
    retentionUntil: "2025-01-13T16:45:00Z",
    isRegulatory: false
  },
  {
    id: "snapshot-004",
    tenantId: "onshore-field-bravo",
    incidentId: "incident-flow-anomaly-001",
    triggerEvent: "Flow Rate Anomaly - Gathering Station West",
    triggerType: "pipeline-anomaly",
    capturedAt: "2024-01-12T11:20:00Z",
    scope: [
      "compressor-gathering-west-01",
      "gathering-station-west",
      "zone-control-gathering-west"
    ],
    systemState: {
      flowRate: 450,
      normalFlowRate: 850,
      compressionRatio: 2.1,
      suctionPressure: 150,
      dischargePressure: 315,
      anomalyType: "flow_reduction"
    },
    configurations: {
      compressorSettings: {
        maxFlowRate: "1000 MMSCFD",
        normalFlowRate: "850 MMSCFD",
        minFlowRate: "200 MMSCFD",
        operatingMode: "automatic"
      }
    },
    logSegments: [
      "2024-01-12T11:00:00Z [COMPRESSOR] Flow rate: 850 MMSCFD (Normal)",
      "2024-01-12T11:10:00Z [COMPRESSOR] Flow rate: 650 MMSCFD (Reduced)",
      "2024-01-12T11:15:00Z [COMPRESSOR] Flow rate: 500 MMSCFD (Low)",
      "2024-01-12T11:20:00Z [COMPRESSOR] Flow rate: 450 MMSCFD (Critical Low)",
      "2024-01-12T11:20:00Z [SYSTEM] Forensic snapshot captured"
    ],
    capturedBy: "Gathering Station Control System",
    retentionUntil: "2025-01-12T11:20:00Z",
    isRegulatory: false
  },

  // Well Control Event Snapshots
  {
    id: "snapshot-005",
    tenantId: "onshore-field-bravo",
    incidentId: "incident-well-control-001",
    triggerEvent: "Well Control Event - Bravo Well Pad 02",
    triggerType: "well-control-event",
    capturedAt: "2024-01-11T08:30:00Z",
    scope: [
      "wellhead-plc-bravo-02-wh01",
      "well-pad-bravo-02",
      "zone-field-bravo-02"
    ],
    systemState: {
      wellheadPressure: 3800,
      casingPressure: 2200,
      flowRate: 1850,
      chokePosition: "45%",
      wellStatus: "flowing",
      controlMode: "manual"
    },
    configurations: {
      wellParameters: {
        maxSurfacePressure: "3500 PSI",
        maxCasingPressure: "2000 PSI",
        normalFlowRate: "1200 BPD",
        safetyMargin: "10%"
      },
      chokeSettings: {
        type: "Adjustable Choke",
        position: "45%",
        responseTime: "5 seconds",
        operatingMode: "manual"
      }
    },
    logSegments: [
      "2024-01-11T08:25:00Z [WELLHEAD] Pressure: 3200 PSI (Normal)",
      "2024-01-11T08:27:00Z [WELLHEAD] Pressure: 3500 PSI (High)",
      "2024-01-11T08:28:00Z [WELLHEAD] Pressure: 3700 PSI (Critical)",
      "2024-01-11T08:29:00Z [CHOKE] Manual adjustment initiated",
      "2024-01-11T08:30:00Z [WELLHEAD] Pressure: 3800 PSI (Emergency)",
      "2024-01-11T08:30:00Z [SYSTEM] Forensic snapshot captured"
    ],
    capturedBy: "Well Control System",
    retentionUntil: "2025-01-11T08:30:00Z",
    isRegulatory: true
  },

  // Security Incident Snapshots
  {
    id: "snapshot-006",
    tenantId: "ksa-upstream-jv",
    incidentId: "incident-unauthorized-access-001",
    triggerEvent: "Unauthorized Access Attempt - SCADA Master",
    triggerType: "security-incident",
    capturedAt: "2024-01-10T22:15:00Z",
    scope: [
      "scada-master-ghawar",
      "cpf-ghawar-central",
      "zone-control-cpf-ghawar"
    ],
    systemState: {
      accessAttempts: 15,
      sourceIp: "192.168.100.45",
      targetSystem: "SCADA Master",
      authenticationStatus: "failed",
      sessionStatus: "blocked",
      alertLevel: "critical"
    },
    configurations: {
      securitySettings: {
        maxFailedAttempts: 3,
        lockoutDuration: "30 minutes",
        alertThreshold: 5,
        monitoringEnabled: true
      },
      accessControls: {
        allowedIpRanges: ["10.0.0.0/8", "172.16.0.0/12"],
        blockedIpRanges: ["192.168.100.0/24"],
        mfaRequired: true
      }
    },
    logSegments: [
      "2024-01-10T22:10:00Z [AUTH] Login attempt from 192.168.100.45 - FAILED",
      "2024-01-10T22:11:00Z [AUTH] Login attempt from 192.168.100.45 - FAILED",
      "2024-01-10T22:12:00Z [AUTH] Multiple failed attempts detected",
      "2024-01-10T22:13:00Z [SECURITY] IP address 192.168.100.45 blocked",
      "2024-01-10T22:15:00Z [SECURITY] Critical security event detected",
      "2024-01-10T22:15:00Z [SYSTEM] Forensic snapshot captured"
    ],
    capturedBy: "Security Monitoring System",
    retentionUntil: "2027-01-10T22:15:00Z",
    isRegulatory: true
  },

  // Manual Capture Snapshots
  {
    id: "snapshot-007",
    tenantId: "offshore-field-alpha",
    triggerEvent: "Manual Forensic Capture - Platform Maintenance",
    triggerType: "manual-capture",
    capturedAt: "2024-01-09T14:00:00Z",
    scope: [
      "platform-alpha-north",
      "zone-control-platform-alpha",
      "zone-sis-platform-alpha"
    ],
    systemState: {
      platformStatus: "maintenance_mode",
      productionStatus: "reduced",
      safetySystemStatus: "active",
      maintenanceActivity: "Compressor overhaul",
      personnelOnboard: 25
    },
    configurations: {
      maintenanceSettings: {
        mode: "planned_maintenance",
        duration: "8 hours",
        affectedSystems: ["Compressor C-101", "Gas processing unit"],
        safetyPrecautions: ["Hot work permit", "Gas testing", "Isolation procedures"]
      }
    },
    logSegments: [
      "2024-01-09T14:00:00Z [MAINTENANCE] Planned maintenance initiated",
      "2024-01-09T14:00:00Z [SAFETY] Safety systems verified active",
      "2024-01-09T14:00:00Z [SYSTEM] Manual forensic snapshot captured"
    ],
    capturedBy: "Platform Supervisor - Erik Nordahl",
    retentionUntil: "2025-01-09T14:00:00Z",
    isRegulatory: false
  },

  // Additional snapshots for other tenants
  {
    id: "snapshot-008",
    tenantId: "offshore-field-alpha",
    incidentId: "incident-gas-leak-001",
    triggerEvent: "Gas Leak Detection - Platform Alpha North",
    triggerType: "security-incident",
    capturedAt: "2024-01-08T16:30:00Z",
    scope: [
      "platform-alpha-north",
      "zone-field-platform-alpha",
      "gas-detection-system"
    ],
    systemState: {
      gasConcentration: 25,
      alarmLevel: "high",
      windDirection: "northwest",
      windSpeed: 15,
      personnelEvacuated: 12,
      emergencyResponse: "active"
    },
    configurations: {
      gasDetectionSettings: {
        lel_threshold: "20%",
        alarm_threshold: "10%",
        evacuation_threshold: "25%",
        responseTime: "immediate"
      }
    },
    logSegments: [
      "2024-01-08T16:28:00Z [GAS] Gas detection: 10% LEL",
      "2024-01-08T16:29:00Z [GAS] Gas detection: 20% LEL - Alarm triggered",
      "2024-01-08T16:30:00Z [GAS] Gas detection: 25% LEL - Evacuation initiated",
      "2024-01-08T16:30:00Z [SYSTEM] Forensic snapshot captured"
    ],
    capturedBy: "Emergency Response System",
    retentionUntil: "2027-01-08T16:30:00Z",
    isRegulatory: true
  }
];

// =============================================================================
// Helper Functions for Forensic Snapshots
// =============================================================================

export function getForensicSnapshotsByTenant(tenantId: string): ForensicSnapshot[] {
  return forensicSnapshots.filter(snapshot => snapshot.tenantId === tenantId);
}

export function getForensicSnapshotsByTriggerType(tenantId: string, triggerType: string): ForensicSnapshot[] {
  return forensicSnapshots.filter(snapshot =>
    snapshot.tenantId === tenantId && snapshot.triggerType === triggerType
  );
}

export function getForensicSnapshotsByIncident(tenantId: string, incidentId: string): ForensicSnapshot[] {
  return forensicSnapshots.filter(snapshot =>
    snapshot.tenantId === tenantId && snapshot.incidentId === incidentId
  );
}

export function getRegulatoryForensicSnapshots(tenantId: string): ForensicSnapshot[] {
  return forensicSnapshots.filter(snapshot =>
    snapshot.tenantId === tenantId && snapshot.isRegulatory
  );
}

export function getForensicSnapshotsByDateRange(tenantId: string, startDate: string, endDate: string): ForensicSnapshot[] {
  return forensicSnapshots.filter(snapshot =>
    snapshot.tenantId === tenantId &&
    snapshot.capturedAt >= startDate &&
    snapshot.capturedAt <= endDate
  );
}

export function searchForensicSnapshots(tenantId: string, query: string): ForensicSnapshot[] {
  const lowerQuery = query.toLowerCase();
  return forensicSnapshots.filter(snapshot =>
    snapshot.tenantId === tenantId && (
      snapshot.triggerEvent.toLowerCase().includes(lowerQuery) ||
      snapshot.triggerType.toLowerCase().includes(lowerQuery) ||
      snapshot.capturedBy.toLowerCase().includes(lowerQuery) ||
      snapshot.scope.some(scope => scope.toLowerCase().includes(lowerQuery))
    )
  );
}