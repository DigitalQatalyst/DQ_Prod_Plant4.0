/**
 * Tests for the unified data layer
 */

import {
  tenants,
  sites,
  securityAlerts,
  assets,
  users,
  complianceStandards,
  auditLogEntries,
  getSecurityAlertsByTenant,
  getAssetsByTenant,
  getUsersByTenant,
  getUpstreamSecurityAlerts,
  getSafetyCriticalAssets,
  getUpstreamSites,
  getUpstreamUsers,
  getUpstreamComplianceStandards
} from './mockData';

describe('Unified Data Layer', () => {
  describe('Tenant Data', () => {
    it('should include both legacy and upstream tenants', () => {
      expect(tenants.length).toBeGreaterThan(0);
      
      // Check for legacy tenants
      const legacyTenant = tenants.find(t => t.id === 't1');
      expect(legacyTenant).toBeDefined();
      expect(legacyTenant?.industry).toBe('utilities');
      expect(legacyTenant?.oilGas).toBeUndefined();
      
      // Check for upstream tenants
      const upstreamTenant = tenants.find(t => t.id === 'ksa-upstream-jv');
      expect(upstreamTenant).toBeDefined();
      expect(upstreamTenant?.industry).toBe('oil-gas');
      expect(upstreamTenant?.oilGas).toBeDefined();
      expect(upstreamTenant?.oilGas?.type).toBe('upstream-jv');
    });
  });

  describe('Security Alerts', () => {
    it('should include both legacy and upstream alerts', () => {
      expect(securityAlerts.length).toBeGreaterThan(0);
      
      // Check for legacy alerts
      const legacyAlert = securityAlerts.find(a => a.id === 'sa1');
      expect(legacyAlert).toBeDefined();
      expect(legacyAlert?.tenantId).toBe('t1');
      expect(legacyAlert?.oilGas).toBeUndefined();
      
      // Check for upstream alerts
      const upstreamAlert = securityAlerts.find(a => a.id.startsWith('alert-'));
      expect(upstreamAlert).toBeDefined();
      expect(upstreamAlert?.oilGas).toBeDefined();
      expect(upstreamAlert?.oilGas?.isSafetyCritical).toBeDefined();
    });

    it('should filter alerts by tenant correctly', () => {
      const t1Alerts = getSecurityAlertsByTenant('t1');
      expect(t1Alerts.length).toBeGreaterThan(0);
      expect(t1Alerts.every(a => a.tenantId === 't1')).toBe(true);
      
      const upstreamAlerts = getSecurityAlertsByTenant('ksa-upstream-jv');
      expect(upstreamAlerts.length).toBeGreaterThan(0);
      expect(upstreamAlerts.every(a => a.tenantId === 'ksa-upstream-jv')).toBe(true);
    });

    it('should filter upstream alerts correctly', () => {
      const upstreamAlerts = getUpstreamSecurityAlerts('ksa-upstream-jv');
      expect(upstreamAlerts.length).toBeGreaterThan(0);
      expect(upstreamAlerts.every(a => a.oilGas !== undefined)).toBe(true);
    });
  });

  describe('Assets', () => {
    it('should include upstream assets with unified structure', () => {
      expect(assets.length).toBeGreaterThan(0);
      
      // Check for upstream assets
      const upstreamAsset = assets.find(a => a.oilGas);
      expect(upstreamAsset).toBeDefined();
      expect(upstreamAsset?.security).toBeDefined();
      expect(upstreamAsset?.oilGas).toBeDefined();
      expect(upstreamAsset?.oilGas?.zoneId).toBeDefined();
    });

    it('should filter assets by tenant correctly', () => {
      const tenantAssets = getAssetsByTenant('ksa-upstream-jv');
      expect(tenantAssets.length).toBeGreaterThan(0);
      expect(tenantAssets.every(a => a.tenantId === 'ksa-upstream-jv')).toBe(true);
    });

    it('should filter safety critical assets correctly', () => {
      const safetyCriticalAssets = getSafetyCriticalAssets('ksa-upstream-jv');
      expect(safetyCriticalAssets.length).toBeGreaterThan(0);
      expect(safetyCriticalAssets.every(a => 
        a.oilGas?.criticality === 'safety-critical' || a.oilGas?.inSafetyLoop
      )).toBe(true);
    });
  });

  describe('Users', () => {
    it('should include both legacy and upstream users', () => {
      expect(users.length).toBeGreaterThan(0);
      
      // Check for legacy users
      const legacyUser = users.find(u => u.id === 'u1');
      expect(legacyUser).toBeDefined();
      expect(legacyUser?.oilGas).toBeUndefined();
      expect(legacyUser?.role).toBeDefined();
      
      // Check for upstream users
      const upstreamUser = users.find(u => u.oilGas);
      expect(upstreamUser).toBeDefined();
      expect(upstreamUser?.oilGas?.role).toBeDefined();
    });

    it('should filter users by tenant correctly', () => {
      const tenantUsers = getUsersByTenant('ksa-upstream-jv');
      expect(tenantUsers.length).toBeGreaterThan(0);
      expect(tenantUsers.every(u => u.tenantId === 'ksa-upstream-jv')).toBe(true);
    });

    it('should filter upstream users correctly', () => {
      const upstreamUsers = getUpstreamUsers('ksa-upstream-jv');
      expect(upstreamUsers.length).toBeGreaterThan(0);
      expect(upstreamUsers.every(u => u.oilGas !== undefined)).toBe(true);
    });
  });

  describe('Sites', () => {
    it('should include upstream sites with unified structure', () => {
      expect(sites.length).toBeGreaterThan(0);
      
      const upstreamSite = sites.find(s => s.oilGas);
      expect(upstreamSite).toBeDefined();
      expect(upstreamSite?.oilGas?.type).toBeDefined();
      expect(upstreamSite?.oilGas?.securityPosture).toBeDefined();
    });

    it('should filter upstream sites correctly', () => {
      const upstreamSites = getUpstreamSites('ksa-upstream-jv');
      expect(upstreamSites.length).toBeGreaterThan(0);
      expect(upstreamSites.every(s => s.oilGas !== undefined)).toBe(true);
    });
  });

  describe('Compliance Standards', () => {
    it('should include both legacy and upstream standards', () => {
      expect(complianceStandards.length).toBeGreaterThan(0);
      
      // Check for upstream standards
      const upstreamStandard = complianceStandards.find(s => s.oilGas);
      expect(upstreamStandard).toBeDefined();
      expect(upstreamStandard?.oilGas?.applicableScope).toBeDefined();
    });

    it('should filter upstream compliance standards correctly', () => {
      const upstreamStandards = getUpstreamComplianceStandards('ksa-upstream-jv');
      expect(upstreamStandards.length).toBeGreaterThan(0);
      expect(upstreamStandards.every(s => s.oilGas !== undefined)).toBe(true);
    });
  });

  describe('Audit Log Entries', () => {
    it('should include both legacy and upstream audit entries', () => {
      expect(auditLogEntries.length).toBeGreaterThan(0);
      
      // Check for legacy entries
      const legacyEntry = auditLogEntries.find(e => e.id.startsWith('al'));
      expect(legacyEntry).toBeDefined();
      
      // Check for upstream entries
      const upstreamEntry = auditLogEntries.find(e => e.riskLevel);
      expect(upstreamEntry).toBeDefined();
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain function compatibility', () => {
      // Test that old function names still work
      expect(typeof getSecurityAlertsByTenant).toBe('function');
      expect(typeof getAssetsByTenant).toBe('function');
      expect(typeof getUsersByTenant).toBe('function');
    });

    it('should provide upstream-specific functions', () => {
      // Test new upstream-specific functions
      expect(typeof getUpstreamSecurityAlerts).toBe('function');
      expect(typeof getSafetyCriticalAssets).toBe('function');
      expect(typeof getUpstreamSites).toBe('function');
      expect(typeof getUpstreamUsers).toBe('function');
    });
  });
});