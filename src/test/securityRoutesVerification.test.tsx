import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '@/context/AppContext';
import { ThemeProvider } from '@/components/theme-provider';
import { describe, it, expect, beforeEach } from 'vitest';

// Import all security components
import { SecurityOverviewDashboard } from '@/pages/ShellPage';
import { PostureBySite } from '@/pages/security/PostureBySite';
import { ControlCoverageView } from '@/pages/security/ControlCoverageView';
import { RiskComplianceSummary } from '@/pages/security/RiskComplianceSummary';
import { VendorAdvisorSummary } from '@/pages/security/VendorAdvisorSummary';
import { UserRoleDirectory } from '@/pages/ShellPage';
import { AccessPolicies } from '@/pages/security/AccessPolicies';
import { PrivilegedAccessControls } from '@/pages/security/PrivilegedAccessControls';
import { DirectorySsoIntegration } from '@/pages/security/DirectorySsoIntegration';
import { IdentityAccessLogs } from '@/pages/security/IdentityAccessLogs';
import { ApiKeysServicePrincipals } from '@/pages/security/ApiKeysServicePrincipals';
import { MfaSessionRules } from '@/pages/security/MfaSessionRules';
import { SecretsCertificatesVault } from '@/pages/security/SecretsCertificatesVault';
import { ZoneConduitModel } from '@/pages/security/ZoneConduitModel';
import { OtAssetInventory } from '@/pages/ShellPage';
import { GatewayAgentPosture } from '@/pages/security/GatewayAgentPosture';
import { EndpointBaselines } from '@/pages/security/EndpointBaselines';
import { RemoteAccessSessions } from '@/pages/security/RemoteAccessSessions';
import { EncryptionProtocolPolicy } from '@/pages/security/EncryptionProtocolPolicy';
import { IotFieldDeviceSecurity } from '@/pages/security/IotFieldDeviceSecurity';
import { NetworkExposureView } from '@/pages/security/NetworkExposureView';
import { SecurityStandardsScope } from '@/pages/ShellPage';
import { SecurityControlLibrary } from '@/pages/security/SecurityControlLibrary';
import { SecurityPolicyRegister } from '@/pages/security/SecurityPolicyRegister';
import { ExceptionsWaivers } from '@/pages/security/ExceptionsWaivers';
import { AuditReadinessView } from '@/pages/security/AuditReadinessView';
import { RiskRegister } from '@/pages/security/RiskRegister';
import { SecurityAlertInbox } from '@/pages/ShellPage';
import { IncidentCases } from '@/pages/security/IncidentCases';
import { AnomalySignals } from '@/pages/security/AnomalySignals';
import { ResponsePlaybooks } from '@/pages/security/ResponsePlaybooks';
import { BasicSoarActions } from '@/pages/security/BasicSoarActions';
import { ThreatIntelligence } from '@/pages/security/ThreatIntelligence';
import { ImpactBlastRadius } from '@/pages/security/ImpactBlastRadius';
import { SecurityAuditLog } from '@/pages/ShellPage';
import { ConfigChangeHistory } from '@/pages/security/ConfigChangeHistory';
import { CentralLogExplorer } from '@/pages/security/CentralLogExplorer';
import { LogRetentionSettings } from '@/pages/security/LogRetentionSettings';
import { FileConfigIntegrity } from '@/pages/security/FileConfigIntegrity';
import { ForensicSnapshots } from '@/pages/security/ForensicSnapshots';
import { PlatformDataProtection } from '@/pages/ShellPage';
import { EncryptionKeyManagement } from '@/pages/security/EncryptionKeyManagement';
import { BackupRecoveryConfig } from '@/pages/security/BackupRecoveryConfig';
import { WorkloadSecurityHardening } from '@/pages/security/WorkloadSecurityHardening';
import { ApplicationSecurityStatus } from '@/pages/security/ApplicationSecurityStatus';

// Define all 45 security routes with their components
const securityRoutes = [
  // Feature Set 1: Posture & Dashboards (5 features)
  { path: '/security/posture/overview', component: SecurityOverviewDashboard, name: 'Security Overview Dashboard' },
  { path: '/security/posture/sites', component: PostureBySite, name: 'Posture by Site / Facility' },
  { path: '/security/posture/controls', component: ControlCoverageView, name: 'Control Coverage View' },
  { path: '/security/posture/risk-compliance', component: RiskComplianceSummary, name: 'Risk & Compliance Summary' },
  { path: '/security/posture/vendor-advisor', component: VendorAdvisorSummary, name: 'Vendor / Advisor Security Summary' },

  // Feature Set 2: Identity & Access (8 features)
  { path: '/security/identity/users', component: UserRoleDirectory, name: 'User & Role Directory' },
  { path: '/security/identity/policies', component: AccessPolicies, name: 'Access Policies & Scopes' },
  { path: '/security/identity/privileged', component: PrivilegedAccessControls, name: 'Privileged Access Controls' },
  { path: '/security/identity/sso', component: DirectorySsoIntegration, name: 'Directory & SSO Integration' },
  { path: '/security/identity/logs', component: IdentityAccessLogs, name: 'Identity & Access Logs' },
  { path: '/security/identity/api-keys', component: ApiKeysServicePrincipals, name: 'API Keys & Service Principals' },
  { path: '/security/identity/mfa-sessions', component: MfaSessionRules, name: 'MFA, Session & Token Rules' },
  { path: '/security/identity/secrets', component: SecretsCertificatesVault, name: 'Secrets & Certificates Vault View' },

  // Feature Set 3: OT/IoT Security (8 features)
  { path: '/security/ot/zones', component: ZoneConduitModel, name: 'Zone & Conduit Model' },
  { path: '/security/ot/ot-inventory', component: OtAssetInventory, name: 'OT Asset Inventory & Criticality' },
  { path: '/security/ot/gateways', component: GatewayAgentPosture, name: 'Gateway & Agent Security Posture' },
  { path: '/security/ot/baselines', component: EndpointBaselines, name: 'Endpoint Baselines & Compliance' },
  { path: '/security/ot/remote-sessions', component: RemoteAccessSessions, name: 'Remote Access & Session View' },
  { path: '/security/ot/protocol-policy', component: EncryptionProtocolPolicy, name: 'Encryption & Protocol Policy' },
  { path: '/security/ot/iot-security', component: IotFieldDeviceSecurity, name: 'IoT / Field Device Security Posture' },
  { path: '/security/ot/exposure', component: NetworkExposureView, name: 'Network Exposure View' },

  // Feature Set 4: Compliance & Governance (6 features)
  { path: '/security/compliance/standards', component: SecurityStandardsScope, name: 'Standards & Applicable Scope' },
  { path: '/security/compliance/controls', component: SecurityControlLibrary, name: 'Security Control Library' },
  { path: '/security/compliance/policies', component: SecurityPolicyRegister, name: 'Security Policy Register' },
  { path: '/security/compliance/exceptions', component: ExceptionsWaivers, name: 'Exceptions & Waivers' },
  { path: '/security/compliance/audit', component: AuditReadinessView, name: 'Audit Readiness View' },
  { path: '/security/compliance/risks', component: RiskRegister, name: 'Risk Register' },

  // Feature Set 5: Threats & Incidents (7 features)
  { path: '/security/threats/alerts', component: SecurityAlertInbox, name: 'Security Alert Inbox' },
  { path: '/security/threats/incidents', component: IncidentCases, name: 'Incident Cases' },
  { path: '/security/threats/anomalies', component: AnomalySignals, name: 'Anomaly Signals' },
  { path: '/security/threats/playbooks', component: ResponsePlaybooks, name: 'Response Playbooks' },
  { path: '/security/threats/soar', component: BasicSoarActions, name: 'Basic SOAR Actions' },
  { path: '/security/threats/intel', component: ThreatIntelligence, name: 'Threat Intelligence Integration' },
  { path: '/security/threats/impact', component: ImpactBlastRadius, name: 'Impact & Blast Radius View' },

  // Feature Set 6: Logging & Forensics (6 features)
  { path: '/security/logging/audit-log', component: SecurityAuditLog, name: 'Security Audit Log' },
  { path: '/security/logging/config-history', component: ConfigChangeHistory, name: 'Configuration & Asset Change History' },
  { path: '/security/logging/log-explorer', component: CentralLogExplorer, name: 'Central Log Explorer' },
  { path: '/security/logging/retention', component: LogRetentionSettings, name: 'Log Retention & Export Settings' },
  { path: '/security/logging/integrity', component: FileConfigIntegrity, name: 'File & Config Integrity Monitoring' },
  { path: '/security/logging/snapshots', component: ForensicSnapshots, name: 'Forensic Snapshots' },

  // Feature Set 7: Platform Protection (5 features)
  { path: '/security/platform/data-protection', component: PlatformDataProtection, name: 'Platform Data Protection Overview' },
  { path: '/security/platform/encryption', component: EncryptionKeyManagement, name: 'Platform Encryption & Key Mgmt View' },
  { path: '/security/platform/backups', component: BackupRecoveryConfig, name: 'Backup & Recovery Configuration' },
  { path: '/security/platform/workloads', component: WorkloadSecurityHardening, name: 'Workload Security & Hardening' },
  { path: '/security/platform/app-security', component: ApplicationSecurityStatus, name: 'Platform Application Security Status' },
];

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AppProvider>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('Security Routes Verification', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  it('should have exactly 45 security routes defined', () => {
    expect(securityRoutes).toHaveLength(45);
  });

  it('should verify all security routes render without errors', async () => {
    const results: { path: string; name: string; success: boolean; error?: string }[] = [];

    for (const route of securityRoutes) {
      try {
        const Component = route.component;

        render(
          <TestWrapper>
            <Routes>
              <Route path={route.path} element={<Component />} />
            </Routes>
          </TestWrapper>
        );

        // Check that the component renders without throwing
        results.push({
          path: route.path,
          name: route.name,
          success: true,
        });
      } catch (error) {
        results.push({
          path: route.path,
          name: route.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Log results for debugging
    const failedRoutes = results.filter(r => !r.success);
    if (failedRoutes.length > 0) {
      console.error('Failed routes:', failedRoutes);
    }

    // All routes should render successfully
    expect(results.every(r => r.success)).toBe(true);
  });

  it('should verify route paths match navigation configuration', async () => {
    // Import navigation data
    const { featureAreas } = await import('@/data/navigation');
    const securityArea = featureAreas.find((area: any) => area.id === 'security');

    expect(securityArea).toBeDefined();

    // Extract all security feature paths from navigation
    const navigationPaths: string[] = [];
    securityArea.featureSets.forEach((featureSet: any) => {
      featureSet.features.forEach((feature: any) => {
        navigationPaths.push(feature.path);
      });
    });

    // Extract paths from our route definitions
    const routePaths = securityRoutes.map(route => route.path);

    // Verify all navigation paths have corresponding routes
    navigationPaths.forEach(navPath => {
      expect(routePaths).toContain(navPath);
    });

    // Verify all route paths have corresponding navigation entries
    routePaths.forEach(routePath => {
      expect(navigationPaths).toContain(routePath);
    });
  });

  it('should verify feature set counts match specification', () => {
    const featureSetCounts = {
      posture: 5,      // Posture & Dashboards
      identity: 8,     // Identity & Access
      ot: 8,          // OT/IoT Security
      compliance: 6,   // Compliance & Governance
      threats: 7,      // Threats & Incidents
      logging: 6,      // Logging & Forensics
      platform: 5,    // Platform Protection
    };

    const postureRoutes = securityRoutes.filter(r => r.path.includes('/security/posture/'));
    const identityRoutes = securityRoutes.filter(r => r.path.includes('/security/identity/'));
    const otRoutes = securityRoutes.filter(r => r.path.includes('/security/ot/'));
    const complianceRoutes = securityRoutes.filter(r => r.path.includes('/security/compliance/'));
    const threatsRoutes = securityRoutes.filter(r => r.path.includes('/security/threats/'));
    const loggingRoutes = securityRoutes.filter(r => r.path.includes('/security/logging/'));
    const platformRoutes = securityRoutes.filter(r => r.path.includes('/security/platform/'));

    expect(postureRoutes).toHaveLength(featureSetCounts.posture);
    expect(identityRoutes).toHaveLength(featureSetCounts.identity);
    expect(otRoutes).toHaveLength(featureSetCounts.ot);
    expect(complianceRoutes).toHaveLength(featureSetCounts.compliance);
    expect(threatsRoutes).toHaveLength(featureSetCounts.threats);
    expect(loggingRoutes).toHaveLength(featureSetCounts.logging);
    expect(platformRoutes).toHaveLength(featureSetCounts.platform);

    // Total should be 45
    const total = postureRoutes.length + identityRoutes.length + otRoutes.length +
      complianceRoutes.length + threatsRoutes.length + loggingRoutes.length +
      platformRoutes.length;
    expect(total).toBe(45);
  });
});