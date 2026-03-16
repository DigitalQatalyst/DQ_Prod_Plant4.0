import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  getUpstreamSecurityAlertsByTenant,
  getUpstreamSitesByTenant,
  getUpstreamOtAssetsByTenant,
  getUpstreamIncidentsByTenant,
  getUpstreamAnomaliesByTenant,
  getUpstreamComplianceStandardsByTenant,
  getRemoteSessionsByTenant,
  getSecurityUsersByTenant,
  getAccessPoliciesByTenant,
  getSecurityAuditEntriesByTenant,
  getSecurityZonesByTenant,
  getConduitsByTenant,
  getSecurityControlsByTenant,
  getThreatIntelligenceByTenant,
  getRiskEntriesByTenant,
  getResponsePlaybooksByTenant,
  getSoarActionsByTenant,
  getSecurityExceptionsByTenant,
  upstreamTenants
} from './upstreamSecurityMockData';

/**
 * Feature: security-feature-area, Property 2: Tenant data isolation
 * Validates: Requirements 12.1, 12.2
 * 
 * Property: For any security data query (alerts, users, assets, incidents, etc.) 
 * and any tenant context, all returned data should belong exclusively to the current tenant
 */

describe('Property 2: Tenant data isolation', () => {
  
  // Generate arbitrary tenant IDs from the available tenants
  const tenantIdArbitrary = fc.constantFrom(...upstreamTenants.map(t => t.id));
  
  /**
   * Property test: All security data queries should return only data for the specified tenant
   * This test validates that tenant filtering works correctly across all data types
   */
  it('should return only data belonging to the specified tenant for all security data queries', () => {
    fc.assert(
      fc.property(
        tenantIdArbitrary,
        (tenantId: string) => {
          // Test security alerts
          const alerts = getUpstreamSecurityAlertsByTenant(tenantId);
          alerts.forEach(alert => {
            expect(alert.tenantId).toBe(tenantId);
          });
          
          // Test sites
          const sites = getUpstreamSitesByTenant(tenantId);
          sites.forEach(site => {
            expect(site.tenantId).toBe(tenantId);
          });
          
          // Test OT assets
          const assets = getUpstreamOtAssetsByTenant(tenantId);
          assets.forEach(asset => {
            expect(asset.tenantId).toBe(tenantId);
          });
          
          // Test incidents
          const incidents = getUpstreamIncidentsByTenant(tenantId);
          incidents.forEach(incident => {
            expect(incident.tenantId).toBe(tenantId);
          });
          
          // Test anomalies
          const anomalies = getUpstreamAnomaliesByTenant(tenantId);
          anomalies.forEach(anomaly => {
            expect(anomaly.tenantId).toBe(tenantId);
          });
          
          // Test compliance standards
          const standards = getUpstreamComplianceStandardsByTenant(tenantId);
          standards.forEach(standard => {
            expect(standard.tenantId).toBe(tenantId);
          });
          
          // Test remote sessions
          const sessions = getRemoteSessionsByTenant(tenantId);
          sessions.forEach(session => {
            expect(session.tenantId).toBe(tenantId);
          });
          
          // Test security users
          const users = getSecurityUsersByTenant(tenantId);
          users.forEach(user => {
            expect(user.tenantId).toBe(tenantId);
          });
          
          // Test access policies
          const policies = getAccessPoliciesByTenant(tenantId);
          policies.forEach(policy => {
            expect(policy.tenantId).toBe(tenantId);
          });
          
          // Test audit entries
          const auditEntries = getSecurityAuditEntriesByTenant(tenantId);
          auditEntries.forEach(entry => {
            expect(entry.tenantId).toBe(tenantId);
          });
          
          // Test security zones
          const zones = getSecurityZonesByTenant(tenantId);
          zones.forEach(zone => {
            expect(zone.tenantId).toBe(tenantId);
          });
          
          // Test conduits
          const conduits = getConduitsByTenant(tenantId);
          conduits.forEach(conduit => {
            expect(conduit.tenantId).toBe(tenantId);
          });
          
          // Test security controls
          const controls = getSecurityControlsByTenant(tenantId);
          controls.forEach(control => {
            expect(control.tenantId).toBe(tenantId);
          });
          
          // Test threat intelligence
          const threats = getThreatIntelligenceByTenant(tenantId);
          threats.forEach(threat => {
            expect(threat.tenantId).toBe(tenantId);
          });
          
          // Test risk entries
          const risks = getRiskEntriesByTenant(tenantId);
          risks.forEach(risk => {
            expect(risk.tenantId).toBe(tenantId);
          });
          
          // Test response playbooks
          const playbooks = getResponsePlaybooksByTenant(tenantId);
          playbooks.forEach(playbook => {
            expect(playbook.tenantId).toBe(tenantId);
          });
          
          // Test SOAR actions
          const soarActions = getSoarActionsByTenant(tenantId);
          soarActions.forEach(action => {
            expect(action.tenantId).toBe(tenantId);
          });
          
          // Test security exceptions
          const exceptions = getSecurityExceptionsByTenant(tenantId);
          exceptions.forEach(exception => {
            expect(exception.tenantId).toBe(tenantId);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property test: Cross-tenant data should never leak between tenants
   * This test validates that data from one tenant never appears in another tenant's results
   */
  it('should never return data from other tenants when querying for a specific tenant', () => {
    fc.assert(
      fc.property(
        fc.tuple(tenantIdArbitrary, tenantIdArbitrary).filter(([t1, t2]) => t1 !== t2),
        ([tenantId1, tenantId2]) => {
          // Get data for tenant 1
          const alerts1 = getUpstreamSecurityAlertsByTenant(tenantId1);
          const sites1 = getUpstreamSitesByTenant(tenantId1);
          const assets1 = getUpstreamOtAssetsByTenant(tenantId1);
          const incidents1 = getUpstreamIncidentsByTenant(tenantId1);
          const users1 = getSecurityUsersByTenant(tenantId1);
          
          // Get data for tenant 2
          const alerts2 = getUpstreamSecurityAlertsByTenant(tenantId2);
          const sites2 = getUpstreamSitesByTenant(tenantId2);
          const assets2 = getUpstreamOtAssetsByTenant(tenantId2);
          const incidents2 = getUpstreamIncidentsByTenant(tenantId2);
          const users2 = getSecurityUsersByTenant(tenantId2);
          
          // Verify no data from tenant2 appears in tenant1 results
          alerts1.forEach(alert => expect(alert.tenantId).not.toBe(tenantId2));
          sites1.forEach(site => expect(site.tenantId).not.toBe(tenantId2));
          assets1.forEach(asset => expect(asset.tenantId).not.toBe(tenantId2));
          incidents1.forEach(incident => expect(incident.tenantId).not.toBe(tenantId2));
          users1.forEach(user => expect(user.tenantId).not.toBe(tenantId2));
          
          // Verify no data from tenant1 appears in tenant2 results
          alerts2.forEach(alert => expect(alert.tenantId).not.toBe(tenantId1));
          sites2.forEach(site => expect(site.tenantId).not.toBe(tenantId1));
          assets2.forEach(asset => expect(asset.tenantId).not.toBe(tenantId1));
          incidents2.forEach(incident => expect(incident.tenantId).not.toBe(tenantId1));
          users2.forEach(user => expect(user.tenantId).not.toBe(tenantId1));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property test: Empty results for non-existent tenants
   * This test validates that queries for non-existent tenants return empty arrays
   */
  it('should return empty arrays for non-existent tenant IDs', () => {
    fc.assert(
      fc.property(
        fc.string().filter(id => !upstreamTenants.some(t => t.id === id)),
        (nonExistentTenantId: string) => {
          // All queries should return empty arrays for non-existent tenants
          expect(getUpstreamSecurityAlertsByTenant(nonExistentTenantId)).toEqual([]);
          expect(getUpstreamSitesByTenant(nonExistentTenantId)).toEqual([]);
          expect(getUpstreamOtAssetsByTenant(nonExistentTenantId)).toEqual([]);
          expect(getUpstreamIncidentsByTenant(nonExistentTenantId)).toEqual([]);
          expect(getUpstreamAnomaliesByTenant(nonExistentTenantId)).toEqual([]);
          expect(getUpstreamComplianceStandardsByTenant(nonExistentTenantId)).toEqual([]);
          expect(getRemoteSessionsByTenant(nonExistentTenantId)).toEqual([]);
          expect(getSecurityUsersByTenant(nonExistentTenantId)).toEqual([]);
          expect(getAccessPoliciesByTenant(nonExistentTenantId)).toEqual([]);
          expect(getSecurityAuditEntriesByTenant(nonExistentTenantId)).toEqual([]);
          expect(getSecurityZonesByTenant(nonExistentTenantId)).toEqual([]);
          expect(getConduitsByTenant(nonExistentTenantId)).toEqual([]);
          expect(getSecurityControlsByTenant(nonExistentTenantId)).toEqual([]);
          expect(getThreatIntelligenceByTenant(nonExistentTenantId)).toEqual([]);
          expect(getRiskEntriesByTenant(nonExistentTenantId)).toEqual([]);
          expect(getResponsePlaybooksByTenant(nonExistentTenantId)).toEqual([]);
          expect(getSoarActionsByTenant(nonExistentTenantId)).toEqual([]);
          expect(getSecurityExceptionsByTenant(nonExistentTenantId)).toEqual([]);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property test: Consistent results across multiple calls
   * This test validates that the same tenant query returns consistent results
   */
  it('should return consistent results for the same tenant across multiple calls', () => {
    fc.assert(
      fc.property(
        tenantIdArbitrary,
        (tenantId: string) => {
          // Call the same function multiple times and verify results are identical
          const alerts1 = getUpstreamSecurityAlertsByTenant(tenantId);
          const alerts2 = getUpstreamSecurityAlertsByTenant(tenantId);
          expect(alerts1).toEqual(alerts2);
          
          const sites1 = getUpstreamSitesByTenant(tenantId);
          const sites2 = getUpstreamSitesByTenant(tenantId);
          expect(sites1).toEqual(sites2);
          
          const assets1 = getUpstreamOtAssetsByTenant(tenantId);
          const assets2 = getUpstreamOtAssetsByTenant(tenantId);
          expect(assets1).toEqual(assets2);
          
          const users1 = getSecurityUsersByTenant(tenantId);
          const users2 = getSecurityUsersByTenant(tenantId);
          expect(users1).toEqual(users2);
        }
      ),
      { numRuns: 100 }
    );
  });
});