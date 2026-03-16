import { describe, it, expect } from 'vitest';
import { featureAreas } from './navigation';

describe('Navigation Integration Tests', () => {
  describe('Security Feature Area', () => {
    it('should have Security feature area in navigation', () => {
      const securityArea = featureAreas.find(area => area.id === 'security');
      
      expect(securityArea).toBeDefined();
      expect(securityArea?.name).toBe('Security (CS)');
      expect(securityArea?.shortName).toBe('Security');
      expect(securityArea?.icon).toBeDefined();
    });

    it('should have all 7 feature sets in Security area', () => {
      const securityArea = featureAreas.find(area => area.id === 'security');
      
      expect(securityArea?.featureSets).toHaveLength(9);
      
      const featureSetIds = securityArea?.featureSets.map(fs => fs.id);
      expect(featureSetIds).toEqual([
        'posture',
        'dashboard',
        'alerts',
        'security-policies',
        'identity',
        'ot',
        'compliance',
        'threats',
        'logging',
        'platform'
      ]);
    });

    it('should have correct feature set names', () => {
      const securityArea = featureAreas.find(area => area.id === 'security');
      const featureSets = securityArea?.featureSets || [];
      
      expect(featureSets[0].name).toBe('Posture & Dashboards');
      expect(featureSets[1].name).toBe('Identity & Access');
      expect(featureSets[2].name).toBe('OT/IoT Security');
      expect(featureSets[3].name).toBe('Compliance & Governance');
      expect(featureSets[4].name).toBe('Threats & Incidents');
      expect(featureSets[5].name).toBe('Logging & Forensics');
      expect(featureSets[6].name).toBe('Platform Protection');
      expect(featureSets[0].name).toBe('Dashboard');
      expect(featureSets[1].name).toBe('Alerts');
      expect(featureSets[2].name).toBe('Policies & Compliance');
      expect(featureSets[3].name).toBe('Identity & Access');
      expect(featureSets[4].name).toBe('OT Security');
      expect(featureSets[5].name).toBe('Compliance');
      expect(featureSets[6].name).toBe('Threats');
      expect(featureSets[7].name).toBe('Logging');
      expect(featureSets[8].name).toBe('Platform');
    });

    it('should have correct routes for all security features', () => {
      const securityArea = featureAreas.find(area => area.id === 'security');
      const allFeatures = securityArea?.featureSets.flatMap(fs => fs.features) || [];
      
      const expectedRoutes = [
        // Posture & Dashboards (5 features)
        '/security/posture/overview',
        '/security/posture/sites',
        '/security/posture/controls',
        '/security/posture/risk-compliance',
        '/security/posture/vendor-advisor',
        // Identity & Access (8 features)
        '/security/dashboard',
        '/security/alerts',
        '/security/overview/posture',
        '/security/identity/users',
        '/security/identity/policies',
        '/security/identity/privileged',
        '/security/identity/sso',
        '/security/identity/logs',
        '/security/identity/api-keys',
        '/security/identity/mfa-sessions',
        '/security/identity/secrets',
        // OT/IoT Security (8 features)
        '/security/ot/zones',
        '/security/ot/ot-inventory',
        '/security/ot/gateways',
        '/security/ot/baselines',
        '/security/ot/remote-sessions',
        '/security/ot/protocol-policy',
        '/security/ot/iot-security',
        '/security/ot/exposure',
        // Compliance & Governance (6 features)
        '/security/compliance/standards',
        '/security/compliance/controls',
        '/security/compliance/policies',
        '/security/compliance/exceptions',
        '/security/compliance/audit',
        '/security/compliance/risks',
        // Threats & Incidents (7 features)
        '/security/threats/alerts',
        '/security/threats/incidents',
        '/security/threats/anomalies',
        '/security/threats/playbooks',
        '/security/threats/soar',
        '/security/threats/intel',
        '/security/threats/impact',
        // Logging & Forensics (6 features)
        '/security/logging/audit-log',
        '/security/logging/config-history',
        '/security/logging/log-explorer',
        '/security/logging/retention',
        '/security/logging/integrity',
        '/security/logging/snapshots',
        // Platform Protection (5 features)
        '/security/platform/data-protection',
        '/security/platform/encryption',
        '/security/platform/backups',
        '/security/platform/workloads',
        '/security/platform/app-security',
      ];
      
      const actualRoutes = allFeatures.map(f => f.path);
      expect(actualRoutes).toEqual(expectedRoutes);
    });

    it('should have correct feature names', () => {
      const securityArea = featureAreas.find(area => area.id === 'security');
      const allFeatures = securityArea?.featureSets.flatMap(fs => fs.features) || [];
      
      const expectedNames = [
        // Posture & Dashboards (5 features)
        'Security Dashboard',
        'Security Alerts',
        'Security Overview Dashboard',
        'Posture by Site / Facility',
        'Control Coverage View',
        'Risk & Compliance Summary',
        'Vendor / Advisor Security Summary',
        // Identity & Access (8 features)
        'User & Role Directory',
        'Access Policies & Scopes',
        'Privileged Access Controls',
        'Directory & SSO Integration',
        'Identity & Access Logs',
        'API Keys & Service Principals',
        'MFA, Session & Token Rules',
        'Secrets & Certificates Vault View',
        // OT/IoT Security (8 features)
        'Zone & Conduit Model',
        'OT Asset Inventory & Criticality',
        'Gateway & Agent Security Posture',
        'Endpoint Baselines & Compliance',
        'Remote Access & Session View',
        'Encryption & Protocol Policy',
        'IoT / Field Device Security Posture',
        'Network Exposure View',
        // Compliance & Governance (6 features)
        'Standards & Applicable Scope',
        'Security Control Library',
        'Security Policy Register',
        'Exceptions & Waivers',
        'Audit Readiness View',
        'Risk Register',
        // Threats & Incidents (7 features)
        'Security Alert Inbox',
        'Incident Cases',
        'Anomaly Signals',
        'Response Playbooks',
        'Basic SOAR Actions',
        'Threat Intelligence Integration',
        'Impact & Blast Radius View',
        // Logging & Forensics (6 features)
        'Security Audit Log',
        'Configuration & Asset Change History',
        'Central Log Explorer',
        'Log Retention & Export Settings',
        'File & Config Integrity Monitoring',
        'Forensic Snapshots',
        // Platform Protection (5 features)
        'Platform Data Protection Overview',
        'Platform Encryption & Key Mgmt View',
        'Backup & Recovery Configuration',
        'Workload Security & Hardening',
        'Platform Application Security Status',
      ];
      
      const actualNames = allFeatures.map(f => f.name);
      expect(actualNames).toEqual(expectedNames);
    });

    it('should have icons for all feature sets', () => {
      const securityArea = featureAreas.find(area => area.id === 'security');
      const featureSets = securityArea?.featureSets || [];
      
      featureSets.forEach(fs => {
        expect(fs.icon).toBeDefined();
      });
    });

    it('should have icons for all features', () => {
      const securityArea = featureAreas.find(area => area.id === 'security');
      const allFeatures = securityArea?.featureSets.flatMap(fs => fs.features) || [];
      
      allFeatures.forEach(feature => {
        expect(feature.icon).toBeDefined();
      });
    });

    it('should have exactly 45 security features total', () => {
      const securityArea = featureAreas.find(area => area.id === 'security');
      const allFeatures = securityArea?.featureSets.flatMap(fs => fs.features) || [];
      
      expect(allFeatures).toHaveLength(45);
      
      // Verify feature count per set
      const featureSets = securityArea?.featureSets || [];
      expect(featureSets[0].features).toHaveLength(5); // Posture & Dashboards
      expect(featureSets[1].features).toHaveLength(8); // Identity & Access
      expect(featureSets[2].features).toHaveLength(8); // OT/IoT Security
      expect(featureSets[3].features).toHaveLength(6); // Compliance & Governance
      expect(featureSets[4].features).toHaveLength(7); // Threats & Incidents
      expect(featureSets[5].features).toHaveLength(6); // Logging & Forensics
      expect(featureSets[6].features).toHaveLength(5); // Platform Protection
    });
  });

  describe('Route Structure', () => {
    it('should have consistent route patterns', () => {
      const securityArea = featureAreas.find(area => area.id === 'security');
      const allFeatures = securityArea?.featureSets.flatMap(fs => fs.features) || [];
      
      allFeatures.forEach(feature => {
        expect(feature.path).toMatch(/^\/security\//);
        // Routes can have either 3 parts (/security/dashboard) or 4 parts (/security/overview/posture)
        const pathParts = feature.path.split('/').length;
        expect(pathParts).toBeGreaterThanOrEqual(3);
        expect(pathParts).toBeLessThanOrEqual(4);
      });
    });

    it('should have unique routes for all features', () => {
      const securityArea = featureAreas.find(area => area.id === 'security');
      const allFeatures = securityArea?.featureSets.flatMap(fs => fs.features) || [];
      
      const routes = allFeatures.map(f => f.path);
      const uniqueRoutes = new Set(routes);
      
      expect(routes.length).toBe(uniqueRoutes.size);
    });

    it('should have unique IDs for all features', () => {
      const securityArea = featureAreas.find(area => area.id === 'security');
      const allFeatures = securityArea?.featureSets.flatMap(fs => fs.features) || [];
      
      const ids = allFeatures.map(f => f.id);
      const uniqueIds = new Set(ids);
      
      expect(ids.length).toBe(uniqueIds.size);
    });
  });
});
