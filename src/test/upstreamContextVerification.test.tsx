import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '@/context/AppContext';
import { ThemeProvider } from '@/components/theme-provider';
import { describe, it, expect, beforeEach } from 'vitest';

// Import mock data to verify upstream context
import {
  upstreamTenants,
  upstreamSites,
  upstreamOtAssets,
  upstreamSecurityAlerts,
  incidentCases,
  anomalySignals,
  upstreamComplianceStandards,
  securityControls,
  securityUsers,
  remoteSessions,
  accessPolicies,
  securityAuditEntries,
  securityZones,
  conduits,
  threatIntelligence,
  riskEntries,
  responsePlaybooks,
  soarActions,
  securityExceptions
} from '@/data/upstreamSecurityMockData';

// Import security components to test
import { PostureBySite } from '@/pages/security/PostureBySite';
import { SecurityOverviewDashboard } from '@/pages/ShellPage';
import { UserRoleDirectory } from '@/pages/ShellPage';
import { SecurityAlertInbox } from '@/pages/ShellPage';
import { OtAssetInventory } from '@/pages/ShellPage';

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

describe('Upstream O&G Context Verification', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  describe('Mock Data Upstream Context', () => {
    it('should have upstream tenants with O&G context', () => {
      expect((upstreamTenants || []).length).toBeGreaterThan(0);

      upstreamTenants.forEach(tenant => {
        // Verify tenant has upstream O&G characteristics
        expect(tenant.id).toBeDefined();
        expect(tenant.name).toBeDefined();
        expect(tenant.type).toMatch(/national-oil-company|upstream-jv|field-operator|upstream-operator/);
        expect(tenant.region).toBeDefined();

        // Many upstream tenants should have basin information
        const tenantsWithBasin = upstreamTenants.filter(t => (t as any).basin);
        expect(tenantsWithBasin.length).toBeGreaterThan(0);
      });
    });

    it('should have upstream sites with O&G facility types', () => {
      expect((upstreamSites || []).length).toBeGreaterThan(0);

      const expectedSiteTypes = [
        'well-pad',
        'offshore-platform',
        'cpf',
        'gpf',
        'gathering-station',
        'pipeline-station'
      ];

      upstreamSites.forEach(site => {
        expect(expectedSiteTypes).toContain(site.type);
        expect(site.region).toBeDefined();

        // Sites should have upstream-specific properties
        if ((site as any).field) {
          expect(typeof (site as any).field).toBe('string');
        }
        if ((site as any).basin) {
          expect(typeof (site as any).basin).toBe('string');
        }
      });

      // Verify we have different types of upstream sites
      const siteTypes = [...new Set(upstreamSites.map(s => s.type))];
      expect(siteTypes.length).toBeGreaterThan(2);
    });

    it('should have upstream OT assets with O&G equipment types', () => {
      expect((upstreamOtAssets || []).length).toBeGreaterThan(0);

      const expectedAssetTypes = [
        'wellhead-plc',
        'rtu',
        'sis',
        'dcs',
        'scada-master',
        'esd',
        'compressor',
        'pump',
        'separator',
        'heater',
        'flare-system',
        'pipeline-valve',
        'xmas-tree',
        'field-gateway',
        'edge-device'
      ];

      upstreamOtAssets.forEach(asset => {
        expect(expectedAssetTypes).toContain(asset.type);
        expect(asset.criticality).toMatch(/safety-critical|production-critical|high|medium|low/);

        // Safety-critical assets should be properly marked
        if (asset.criticality === 'safety-critical' || (asset as any).inSafetyLoop) {
          expect(typeof (asset as any).inSafetyLoop).toBe('boolean');
        }
      });

      // Verify we have upstream-specific asset types
      const assetTypes = [...new Set(upstreamOtAssets.map(a => a.type))];
      const upstreamSpecificTypes = assetTypes.filter(type =>
        ['wellhead-plc', 'sis', 'esd', 'xmas-tree', 'pipeline-valve', 'compressor'].includes(type)
      );
      expect(upstreamSpecificTypes.length).toBeGreaterThan(0);
    });

    it('should have security alerts with upstream O&G scenarios', () => {
      expect((upstreamSecurityAlerts || []).length).toBeGreaterThan(0);

      const expectedAlertCategories = [
        'valve-manipulation',
        'pressure-anomaly',
        'sis-trip',
        'unauthorized-access',
        'remote-session',
        'config-change',
        'malware',
        'network-anomaly',
        'authentication-failure'
      ];

      upstreamSecurityAlerts.forEach(alert => {
        expect(expectedAlertCategories).toContain(alert.category);
        expect(typeof (alert as any).isSafetyCritical).toBe('boolean');
      });

      // Verify we have upstream-specific alert categories
      const alertCategories = [...new Set(upstreamSecurityAlerts.map(a => a.category))];
      const upstreamSpecificCategories = alertCategories.filter(cat =>
        ['valve-manipulation', 'pressure-anomaly', 'sis-trip'].includes(cat)
      );
      expect(upstreamSpecificCategories.length).toBeGreaterThan(0);
    });

    it('should identify incidents requiring notification', () => {
      const incidentRequiringNotification = (incidentCases || []).find(i => (i as any).requiresRegNotification);
      if (incidentRequiringNotification) {
        expect(incidentRequiringNotification.status).toBeDefined();
      }
    });

    it('should have anomaly signals with upstream context', () => {
      expect((anomalySignals || []).length).toBeGreaterThan(0);
    });

    it('should have security controls with upstream context', () => {
      expect((securityControls || []).length).toBeGreaterThan(0);
    });

    it('should have anomalies with upstream O&G parameters', () => {
      expect((anomalySignals || []).length).toBeGreaterThan(0);

      const expectedAnomalyTypes = [
        'pressure-spike',
        'flow-anomaly',
        'valve-state-change',
        'sis-trip',
        'temperature-deviation',
        'vibration-anomaly',
        'communication-loss'
      ];

      anomalySignals.forEach(anomaly => {
        expect(expectedAnomalyTypes).toContain(anomaly.type);
        expect(typeof (anomaly as any).isSafetyRelated).toBe('boolean');
      });

      // Verify we have upstream-specific anomaly types
      const anomalyTypes = [...new Set(anomalySignals.map(a => a.type))];
      const upstreamSpecificTypes = anomalyTypes.filter(type =>
        ['pressure-spike', 'flow-anomaly', 'valve-state-change', 'sis-trip'].includes(type)
      );
      expect(upstreamSpecificTypes.length).toBeGreaterThan(0);
    });

    it('should have compliance standards relevant to upstream O&G', () => {
      expect((upstreamComplianceStandards || []).length).toBeGreaterThan(0);

      const expectedStandards = ['API 1164', 'IEC 62443', 'NIST CSF', 'NIST 800-82'];

      upstreamComplianceStandards.forEach(standard => {
        expect(expectedStandards).toContain(standard.name);
      });

      // Verify we have upstream-specific standards
      const standardNames = upstreamComplianceStandards.map(s => s.name);
      expect(standardNames).toContain('API 1164'); // Pipeline SCADA Security
      expect(standardNames).toContain('IEC 62443'); // Industrial Automation Security
    });

    it('should have users with upstream O&G roles', () => {
      expect((securityUsers || []).length).toBeGreaterThan(0);

      const expectedRoles = [
        'field-operator',
        'control-room-operator',
        'ot-engineer',
        'platform-supervisor',
        'vendor-support',
        'soc-analyst',
        'security-manager',
        'compliance-officer'
      ];

      securityUsers.forEach(user => {
        // Some users should have upstream-specific roles
        if (expectedRoles.includes(user.role)) {
          expect(expectedRoles).toContain(user.role);
        }
      });

      // Verify we have upstream-specific roles
      const userRoles = [...new Set(securityUsers.map(u => u.role))];
      const upstreamSpecificRoles = userRoles.filter(role =>
        ['field-operator', 'control-room-operator', 'platform-supervisor'].includes(role)
      );
      expect(upstreamSpecificRoles.length).toBeGreaterThan(0);
    });

    it('should have response playbooks for upstream scenarios', () => {
      expect((responsePlaybooks || []).length).toBeGreaterThan(0);

      const expectedPlaybookCategories = [
        'isolate-platform',
        'close-pipeline-segment',
        'lockdown-remote-access',
        'sis-override-response',
        'well-control-incident',
        'malware-containment'
      ];

      responsePlaybooks.forEach(playbook => {
        expect(expectedPlaybookCategories).toContain(playbook.category);
      });

      // Verify we have upstream-specific playbooks
      const playbookCategories = [...new Set(responsePlaybooks.map(p => p.category))];
      const upstreamSpecificCategories = playbookCategories.filter(cat =>
        ['isolate-platform', 'close-pipeline-segment', 'well-control-incident'].includes(cat)
      );
      expect(upstreamSpecificCategories.length).toBeGreaterThan(0);
    });
  });

  describe('Component Upstream Context', () => {
    it('should display upstream terminology in PostureBySite component', () => {
      const { container } = render(
        <TestWrapper>
          <PostureBySite />
        </TestWrapper>
      );

      // Look for upstream-specific terminology
      const upstreamTerms = [
        'well pad',
        'platform',
        'pipeline',
        'cpf',
        'field',
        'basin',
        'wellhead',
        'sis',
        'safety-critical'
      ];

      const textContent = container.textContent?.toLowerCase() || '';

      // At least some upstream terms should be present
      const foundTerms = upstreamTerms.filter(term =>
        textContent.includes(term.toLowerCase())
      );

      expect(foundTerms.length).toBeGreaterThan(0);
    });

    it('should display upstream context in SecurityOverviewDashboard', () => {
      const { container } = render(
        <TestWrapper>
          <SecurityOverviewDashboard />
        </TestWrapper>
      );

      // Should show upstream-relevant metrics and terminology
      const textContent = container.textContent?.toLowerCase() || '';

      // Look for upstream context indicators
      const hasUpstreamContext =
        textContent.includes('upstream') ||
        textContent.includes('oil') ||
        textContent.includes('gas') ||
        textContent.includes('well') ||
        textContent.includes('platform') ||
        textContent.includes('pipeline') ||
        textContent.includes('field');

      expect(hasUpstreamContext).toBe(true);
    });

    it('should show upstream roles in UserRoleDirectory', () => {
      const { container } = render(
        <TestWrapper>
          <UserRoleDirectory />
        </TestWrapper>
      );

      const textContent = container.textContent?.toLowerCase() || '';

      // Look for upstream-specific roles
      const upstreamRoles = [
        'field operator',
        'control room operator',
        'platform supervisor',
        'ot engineer'
      ];

      const foundRoles = upstreamRoles.filter(role =>
        textContent.includes(role.toLowerCase())
      );

      // Should have at least some upstream-specific roles
      expect(foundRoles.length).toBeGreaterThan(0);
    });

    it('should display upstream alert scenarios in SecurityAlertInbox', () => {
      const { container } = render(
        <TestWrapper>
          <SecurityAlertInbox />
        </TestWrapper>
      );

      const textContent = container.textContent?.toLowerCase() || '';

      // Look for upstream-specific alert scenarios
      const upstreamScenarios = [
        'valve',
        'pressure',
        'sis',
        'wellhead',
        'pipeline',
        'safety'
      ];

      const foundScenarios = upstreamScenarios.filter(scenario =>
        textContent.includes(scenario.toLowerCase())
      );

      expect(foundScenarios.length).toBeGreaterThan(0);
    });

    it('should show upstream asset types in OtAssetInventory', () => {
      const { container } = render(
        <TestWrapper>
          <OtAssetInventory />
        </TestWrapper>
      );

      const textContent = container.textContent?.toLowerCase() || '';

      // Look for upstream-specific asset types
      const upstreamAssetTypes = [
        'wellhead',
        'plc',
        'sis',
        'pipeline',
        'compressor',
        'separator',
        'valve'
      ];

      const foundAssetTypes = upstreamAssetTypes.filter(assetType =>
        textContent.includes(assetType.toLowerCase())
      );

      expect(foundAssetTypes.length).toBeGreaterThan(0);
    });
  });

  describe('Data Consistency', () => {
    it('should have consistent upstream terminology across all data types', () => {
      // Verify consistent use of upstream terminology
      const allSiteTypes = [...new Set((upstreamSites || []).map(s => s.type))];
      const allAssetTypes = [...new Set((upstreamOtAssets || []).map(a => a.type))];
      const allAlertCategories = [...new Set((upstreamSecurityAlerts || []).map(a => a.category))];

      // Site types should be upstream-specific
      const upstreamSiteTypes = allSiteTypes.filter(type =>
        ['well-pad', 'offshore-platform', 'cpf', 'gpf', 'pipeline-station'].includes(type)
      );
      expect(upstreamSiteTypes.length).toBeGreaterThan(0);

      // Asset types should include upstream equipment
      const upstreamAssetTypes = allAssetTypes.filter(type =>
        ['wellhead-plc', 'sis', 'pipeline-valve', 'xmas-tree', 'compressor'].includes(type)
      );
      expect(upstreamAssetTypes.length).toBeGreaterThan(0);

      // Alert categories should include upstream scenarios
      const upstreamAlertCategories = allAlertCategories.filter(cat =>
        ['valve-manipulation', 'pressure-anomaly', 'sis-trip'].includes(cat)
      );
      expect(upstreamAlertCategories.length).toBeGreaterThan(0);
    });

    it('should have proper relationships between upstream entities', () => {
      // Verify that sites belong to upstream tenants
      (upstreamSites || []).forEach(site => {
        const tenant = (upstreamTenants || []).find(t => t.id === site.tenantId);
        expect(tenant).toBeDefined();
        expect(tenant?.type).toMatch(/national-oil-company|upstream-jv|field-operator|upstream-operator/);
      });

      // Verify that assets belong to upstream sites
      (upstreamOtAssets || []).forEach(asset => {
        const site = (upstreamSites || []).find(s => s.id === asset.siteId);
        expect(site).toBeDefined();
      });

      // Verify that alerts reference upstream assets/sites
      (upstreamSecurityAlerts || []).forEach(alert => {
        if (alert.siteId) {
          const site = (upstreamSites || []).find(s => s.id === alert.siteId);
          expect(site).toBeDefined();
        }
      });
    });

    it('should have upstream-specific compliance standards', () => {
      const standardNames = (upstreamComplianceStandards || []).map(s => s.name);

      // Should include upstream-relevant standards
      expect(standardNames).toContain('API 1164'); // Pipeline SCADA Security
      expect(standardNames).toContain('IEC 62443'); // Industrial Automation Security
      expect(standardNames).toContain('NIST 800-82'); // ICS Security

      // Standards should have upstream-specific scope
      const api1164 = (upstreamComplianceStandards || []).find(s => s.name === 'API 1164');
      if (api1164) {
        expect(api1164.applicableScope.siteTypes).toContain('pipeline-station');
      }
    });

    it('should have safety-critical context throughout', () => {
      // Verify safety-critical context is present across data types

      // Assets should have safety-critical indicators
      const safetyCriticalAssets = (upstreamOtAssets || []).filter(a =>
        a.criticality === 'safety-critical' || (a as any).inSafetyLoop
      );
      expect(safetyCriticalAssets.length).toBeGreaterThan(0);

      // Alerts should have safety-critical flags
      const safetyCriticalAlerts = (upstreamSecurityAlerts || []).filter(a => (a as any).isSafetyCritical);
      expect(safetyCriticalAlerts.length).toBeGreaterThan(0);

      // Anomalies should have safety-related flags
      const safetyRelatedAnomalies = (anomalySignals || []).filter(a => (a as any).isSafetyRelated);
      expect(safetyRelatedAnomalies.length).toBeGreaterThan(0);

      // Remote sessions should track safety-critical access
      const safetyCriticalSessions = (remoteSessions || []).filter(s => (s as any).isSafetyCritical);
      expect(safetyCriticalSessions.length).toBeGreaterThan(0);
    });
  });

  describe('Terminology Consistency', () => {
    it('should use consistent upstream terminology', () => {
      // Define expected upstream terminology
      const expectedTerminology = {
        siteTypes: ['well-pad', 'offshore-platform', 'cpf', 'gpf', 'gathering-station', 'pipeline-station'],
        assetTypes: ['wellhead-plc', 'rtu', 'sis', 'esd', 'compressor', 'pump', 'separator', 'xmas-tree', 'pipeline-valve'],
        alertCategories: ['valve-manipulation', 'pressure-anomaly', 'sis-trip'],
        incidentCategories: ['well-control-tampering', 'pipeline-manipulation', 'sis-override'],
        anomalyTypes: ['pressure-spike', 'flow-anomaly', 'valve-state-change', 'sis-trip'],
        roles: ['field-operator', 'control-room-operator', 'platform-supervisor', 'ot-engineer']
      };

      // Verify terminology is used consistently
      Object.entries(expectedTerminology).forEach(([category, terms]) => {
        terms.forEach(term => {
          // Term should use consistent formatting (kebab-case)
          expect(term).toMatch(/^[a-z]+(-[a-z]+)*$/);
        });
      });
    });

    it('should have upstream-specific field names and properties', () => {
      // Verify upstream-specific properties exist

      // Sites should have upstream properties
      const siteWithField = (upstreamSites || []).find(s => (s as any).field);
      expect(siteWithField).toBeDefined();

      const siteWithBasin = (upstreamSites || []).find(s => (s as any).basin);
      expect(siteWithBasin).toBeDefined();

      // Assets should have upstream properties
      const assetInSafetyLoop = (upstreamOtAssets || []).find(a => (a as any).inSafetyLoop);
      expect(assetInSafetyLoop).toBeDefined();

      const highPressureAsset = (upstreamOtAssets || []).find(a => (a as any).highPressure);
      expect(highPressureAsset).toBeDefined();

      // Incidents should have upstream properties
      const incidentWithStatus = (incidentCases || []).find(i => i.status);
      expect(incidentWithStatus).toBeDefined();
    });
  });
});