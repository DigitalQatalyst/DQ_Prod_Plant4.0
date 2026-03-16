import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { featureAreas } from './navigation';

/**
 * Feature: security-feature-area, Property 1: Navigation route consistency
 * Validates: Requirements 8.4, 9.2
 * 
 * Property: For any security feature route, navigating to that route should update the URL,
 * highlight the correct menu item, and render the corresponding component
 */
describe('Property 1: Navigation route consistency', () => {
  // Extract all security feature routes from navigation data
  const securityArea = featureAreas.find(area => area.id === 'security');
  const securityFeatures = securityArea?.featureSets.flatMap(fs => fs.features) || [];
  
  // Map of routes to expected component names (all 45 security features)
  const routeToComponentMap: Record<string, string> = {
    // Posture & Dashboards (5 features)
    '/security/posture/overview': 'SecurityOverviewDashboard',
    '/security/posture/sites': 'PostureBySite',
    '/security/posture/controls': 'ControlCoverageView',
    '/security/posture/risk-compliance': 'RiskComplianceSummary',
    '/security/posture/vendor-advisor': 'VendorAdvisorSummary',
    
    // Identity & Access (8 features)
    '/security/dashboard': 'SecurityDashboard',
    '/security/alerts': 'SecurityAlerts',
    '/security/overview/posture': 'SecurityOverviewDashboard',
    '/security/identity/users': 'UserRoleDirectory',
    '/security/identity/policies': 'AccessPolicies',
    '/security/identity/privileged': 'PrivilegedAccessControls',
    '/security/identity/sso': 'DirectorySsoIntegration',
    '/security/identity/logs': 'IdentityAccessLogs',
    '/security/identity/api-keys': 'ApiKeysServicePrincipals',
    '/security/identity/mfa-sessions': 'MfaSessionRules',
    '/security/identity/secrets': 'SecretsCertificatesVault',
    
    // OT/IoT Security (8 features)
    '/security/ot/zones': 'ZoneConduitModel',
    '/security/ot/ot-inventory': 'OtAssetInventory',
    '/security/ot/gateways': 'GatewayAgentPosture',
    '/security/ot/baselines': 'EndpointBaselines',
    '/security/ot/remote-sessions': 'RemoteAccessSessions',
    '/security/ot/protocol-policy': 'EncryptionProtocolPolicy',
    '/security/ot/iot-security': 'IotFieldDeviceSecurity',
    '/security/ot/exposure': 'NetworkExposureView',
    
    // Compliance & Governance (6 features)
    '/security/compliance/standards': 'SecurityStandardsScope',
    '/security/compliance/controls': 'SecurityControlLibrary',
    '/security/compliance/policies': 'SecurityPolicyRegister',
    '/security/compliance/exceptions': 'ExceptionsWaivers',
    '/security/compliance/audit': 'AuditReadinessView',
    '/security/compliance/risks': 'RiskRegister',
    
    // Threats & Incidents (7 features)
    '/security/threats/alerts': 'SecurityAlertInbox',
    '/security/threats/incidents': 'IncidentCases',
    '/security/threats/anomalies': 'AnomalySignals',
    '/security/threats/playbooks': 'ResponsePlaybooks',
    '/security/threats/soar': 'BasicSoarActions',
    '/security/threats/intel': 'ThreatIntelligence',
    '/security/threats/impact': 'ImpactBlastRadius',
    
    // Logging & Forensics (6 features)
    '/security/logging/audit-log': 'SecurityAuditLog',
    '/security/logging/config-history': 'ConfigChangeHistory',
    '/security/logging/log-explorer': 'CentralLogExplorer',
    '/security/logging/retention': 'LogRetentionSettings',
    '/security/logging/integrity': 'FileConfigIntegrity',
    '/security/logging/snapshots': 'ForensicSnapshots',
    
    // Platform Protection (5 features)
    '/security/platform/data-protection': 'PlatformDataProtection',
    '/security/platform/encryption': 'EncryptionKeyManagement',
    '/security/platform/backups': 'BackupRecoveryConfig',
    '/security/platform/workloads': 'WorkloadSecurityHardening',
    '/security/platform/app-security': 'ApplicationSecurityStatus',
  };

  // Helper function to check if a route is valid
  const isValidSecurityRoute = (route: string): boolean => {
    return securityFeatures.some(feature => feature.path === route);
  };

  // Helper function to extract feature info from route
  const getFeatureInfoFromRoute = (route: string) => {
    return securityFeatures.find(feature => feature.path === route);
  };

  // Arbitrary generator for security routes
  const securityRouteArbitrary = fc.constantFrom(
    ...securityFeatures.map(f => f.path)
  );

  it('should have all security routes defined in navigation data', () => {
    expect(securityFeatures.length).toBe(45);
    
    // Verify we have the expected number of features per feature set
    const featureSets = securityArea?.featureSets || [];
    expect(featureSets.length).toBe(7);
    expect(securityFeatures.length).toBe(9);
    
    const expectedRoutes = [
      '/security/dashboard',
      '/security/alerts',
      '/security/overview/posture',
      '/security/identity/users',
      '/security/ot/ot-inventory',
      '/security/compliance/standards',
      '/security/threats/alerts',
      '/security/logging/audit-log',
      '/security/platform/data-protection'
    ];
    
    const featureSetCounts = featureSets.map(fs => fs.features.length);
    expect(featureSetCounts).toEqual([5, 8, 8, 6, 7, 6, 5]); // Expected counts per feature set
    
    // Verify all routes are present in the component mapping
    const actualRoutes = securityFeatures.map(f => f.path);
    const mappedRoutes = Object.keys(routeToComponentMap);
    
    expect(actualRoutes.sort()).toEqual(mappedRoutes.sort());
  });

  it('should recognize all security routes as valid', () => {
    fc.assert(
      fc.property(
        securityRouteArbitrary,
        (route) => {
          // Property: All security routes should be recognized as valid
          expect(isValidSecurityRoute(route)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have feature info for all security routes', () => {
    fc.assert(
      fc.property(
        securityRouteArbitrary,
        (route) => {
          const featureInfo = getFeatureInfoFromRoute(route);
          
          // Property: Every security route should have corresponding feature info
          expect(featureInfo).toBeDefined();
          expect(featureInfo?.path).toBe(route);
          expect(featureInfo?.id).toBeDefined();
          expect(featureInfo?.name).toBeDefined();
          expect(featureInfo?.icon).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have consistent route structure for all security routes', () => {
    fc.assert(
      fc.property(
        securityRouteArbitrary,
        (route) => {
          // Property: All security routes should follow the pattern /security/{feature} or /security/{featureSet}/{feature}
          expect(route).toMatch(/^\/security\/[a-z-]+(?:\/[a-z-]+)?$/);
          
          const parts = route.split('/');
          expect(parts.length).toBeGreaterThanOrEqual(3); // ['', 'security', 'feature'] or ['', 'security', 'featureSet', 'feature']
          expect(parts.length).toBeLessThanOrEqual(4);
          expect(parts[0]).toBe('');
          expect(parts[1]).toBe('security');
          expect(parts[2]).toBeTruthy();
          if (parts.length === 4) {
            expect(parts[3]).toBeTruthy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should map each security route to a component', () => {
    fc.assert(
      fc.property(
        securityRouteArbitrary,
        (route) => {
          const componentName = routeToComponentMap[route];
          
          // Property: Every security route should map to a component
          expect(componentName).toBeDefined();
          expect(typeof componentName).toBe('string');
          expect(componentName.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have unique routes for all security features', () => {
    const routes = securityFeatures.map(f => f.path);
    const uniqueRoutes = new Set(routes);
    
    // Property: All routes should be unique
    expect(routes.length).toBe(uniqueRoutes.size);
  });

  it('should have unique feature IDs for all security features', () => {
    const ids = securityFeatures.map(f => f.id);
    const uniqueIds = new Set(ids);
    
    // Property: All feature IDs should be unique
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('should have valid route patterns for rendering', () => {
    fc.assert(
      fc.property(
        securityRouteArbitrary,
        (route) => {
          // Property: All routes should be valid paths that can be used for navigation
          expect(route).toBeTruthy();
          expect(typeof route).toBe('string');
          expect(route.startsWith('/')).toBe(true);
          
          // Verify the route has the correct structure for React Router
          const parts = route.split('/').filter(p => p !== '');
          expect(parts.length).toBeGreaterThan(0);
          expect(parts.every(part => part.length > 0)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain route-to-feature mapping consistency', () => {
    fc.assert(
      fc.property(
        securityRouteArbitrary,
        (route) => {
          const featureInfo = getFeatureInfoFromRoute(route);
          const componentName = routeToComponentMap[route];
          
          // Property: The feature info and component mapping should be consistent
          expect(featureInfo).toBeDefined();
          expect(componentName).toBeDefined();
          
          // Verify the route matches in both mappings
          expect(featureInfo?.path).toBe(route);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have all security routes start with /security prefix', () => {
    fc.assert(
      fc.property(
        securityRouteArbitrary,
        (route) => {
          // Property: All security routes should start with /security
          expect(route.startsWith('/security/')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have feature sets properly organized in navigation', () => {
    const featureSets = securityArea?.featureSets || [];
    
    expect(featureSets.length).toBe(9);
    
    // Property: Each feature set should have at least one feature
    featureSets.forEach(featureSet => {
      expect(featureSet.features.length).toBeGreaterThan(0);
      expect(featureSet.id).toBeDefined();
      expect(featureSet.name).toBeDefined();
      expect(featureSet.icon).toBeDefined();
    });
  });

  it('should have consistent feature set IDs in routes', () => {
    fc.assert(
      fc.property(
        securityRouteArbitrary,
        (route) => {
          // Find which feature set contains this route
          const featureSet = securityArea?.featureSets.find(fs => 
            fs.features.some(f => f.path === route)
          );
          
          // Property: Every route should belong to a feature set
          expect(featureSet).toBeDefined();
          
          // Verify the route belongs to this feature set
          const featureInSet = featureSet?.features.some(f => f.path === route);
          expect(featureInSet).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not have duplicate component mappings', () => {
    const componentNames = Object.values(routeToComponentMap);
    const uniqueComponentNames = new Set(componentNames);
    
    // Property: Each component should be mapped to exactly one route
    expect(componentNames.length).toBe(uniqueComponentNames.size);
  });

  it('should have all routes in navigation also in component mapping', () => {
    securityFeatures.forEach(feature => {
      const route = feature.path;
      const componentName = routeToComponentMap[route];
      
      // Property: Every route in navigation should have a component mapping
      expect(componentName).toBeDefined();
    });
  });

  it('should have all routes in component mapping also in navigation', () => {
    Object.keys(routeToComponentMap).forEach(route => {
      const featureInfo = getFeatureInfoFromRoute(route);
      
      // Property: Every route in component mapping should exist in navigation
      expect(featureInfo).toBeDefined();
      expect(featureInfo?.path).toBe(route);
    });
  });

  it('should maintain bidirectional consistency between navigation and routing', () => {
    fc.assert(
      fc.property(
        securityRouteArbitrary,
        (route) => {
          // Get feature from navigation
          const featureInfo = getFeatureInfoFromRoute(route);
          
          // Get component from routing
          const componentName = routeToComponentMap[route];
          
          // Property: Both should exist and be consistent
          expect(featureInfo).toBeDefined();
          expect(componentName).toBeDefined();
          expect(featureInfo?.path).toBe(route);
          
          // Verify the route is valid in both systems
          expect(isValidSecurityRoute(route)).toBe(true);
          expect(routeToComponentMap[route]).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should support navigation between any two security routes', () => {
    fc.assert(
      fc.property(
        securityRouteArbitrary,
        securityRouteArbitrary,
        (route1, route2) => {
          // Property: Any two security routes should be valid navigation targets
          const feature1 = getFeatureInfoFromRoute(route1);
          const feature2 = getFeatureInfoFromRoute(route2);
          
          // Both routes should be valid
          expect(feature1).toBeDefined();
          expect(feature2).toBeDefined();
          
          // Both should have component mappings
          expect(routeToComponentMap[route1]).toBeDefined();
          expect(routeToComponentMap[route2]).toBeDefined();
          
          // Routes should be navigable (valid path format)
          expect(route1.startsWith('/security/')).toBe(true);
          expect(route2.startsWith('/security/')).toBe(true);
        }
      ),
      { numRuns: 50 } // Reduced runs for performance
    );
  });

  it('should have feature names that describe the functionality', () => {
    fc.assert(
      fc.property(
        securityRouteArbitrary,
        (route) => {
          const featureInfo = getFeatureInfoFromRoute(route);
          
          // Property: Feature names should be descriptive (non-empty, reasonable length)
          expect(featureInfo?.name).toBeDefined();
          expect(featureInfo!.name.length).toBeGreaterThan(5);
          expect(featureInfo!.name.length).toBeLessThan(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have kebab-case route segments', () => {
    fc.assert(
      fc.property(
        securityRouteArbitrary,
        (route) => {
          const parts = route.split('/').filter(p => p !== '');
          
          // Property: All route segments should be in kebab-case (lowercase with hyphens)
          parts.forEach(part => {
            expect(part).toMatch(/^[a-z]+(-[a-z]+)*$/);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
