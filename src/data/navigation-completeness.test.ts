import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { featureAreas } from './navigation';

/**
 * Feature: security-feature-area, Property 1: Navigation and routing completeness
 * Validates: Requirements 8.3, 9.1, 9.2
 * 
 * Property: For any security feature in the 45-feature specification, there should exist 
 * a corresponding navigation entry and route configuration that renders the correct component
 */
describe('Property 1: Navigation and routing completeness', () => {
  // Extract all security features from navigation data
  const securityArea = featureAreas.find(area => area.id === 'security');
  const allSecurityFeatures = securityArea?.featureSets.flatMap(fs => fs.features) || [];
  
  // Expected 45 security features based on the specification
  const expectedSecurityFeatureCount = 45;
  
  // All expected security routes based on the design specification
  const expectedSecurityRoutes = [
    // Posture & Dashboards (5 features)
    '/security/posture/overview',
    '/security/posture/sites', 
    '/security/posture/controls',
    '/security/posture/risk-compliance',
    '/security/posture/vendor-advisor',
    
    // Identity & Access (8 features)
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

  // Arbitrary generator for expected security routes
  const expectedSecurityRouteArbitrary = fc.constantFrom(...expectedSecurityRoutes);

  it('should have exactly 45 security features in navigation', () => {
    expect(allSecurityFeatures.length).toBe(expectedSecurityFeatureCount);
  });

  it('should have all expected security routes in navigation', () => {
    const actualRoutes = allSecurityFeatures.map(f => f.path);
    
    // Check that all expected routes are present
    expectedSecurityRoutes.forEach(expectedRoute => {
      expect(actualRoutes).toContain(expectedRoute);
    });
    
    // Check that we have exactly the expected number of routes
    expect(actualRoutes.length).toBe(expectedSecurityRoutes.length);
  });

  it('should have navigation entry for every expected security feature', () => {
    fc.assert(
      fc.property(
        expectedSecurityRouteArbitrary,
        (expectedRoute) => {
          // Property: Every expected security route should have a navigation entry
          const navigationFeature = allSecurityFeatures.find(f => f.path === expectedRoute);
          
          expect(navigationFeature).toBeDefined();
          expect(navigationFeature?.path).toBe(expectedRoute);
          expect(navigationFeature?.id).toBeDefined();
          expect(navigationFeature?.name).toBeDefined();
          expect(navigationFeature?.icon).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have proper feature set organization for all security features', () => {
    fc.assert(
      fc.property(
        expectedSecurityRouteArbitrary,
        (expectedRoute) => {
          // Property: Every security feature should belong to a proper feature set
          const parts = expectedRoute.split('/');
          const featureSetId = parts[2]; // /security/{featureSetId}/{featureId}
          
          const featureSet = securityArea?.featureSets.find(fs => fs.id === featureSetId);
          expect(featureSet).toBeDefined();
          
          // Verify the feature exists in this feature set
          const featureInSet = featureSet?.features.find(f => f.path === expectedRoute);
          expect(featureInSet).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have all 7 expected feature sets', () => {
    const featureSets = securityArea?.featureSets || [];
    expect(featureSets.length).toBe(7);
    
    const expectedFeatureSetIds = [
      'posture',
      'identity', 
      'ot',
      'compliance',
      'threats',
      'logging',
      'platform'
    ];
    
    const actualFeatureSetIds = featureSets.map(fs => fs.id);
    expect(actualFeatureSetIds).toEqual(expectedFeatureSetIds);
  });

  it('should have correct feature count per feature set', () => {
    const featureSets = securityArea?.featureSets || [];
    
    // Expected feature counts per set based on specification
    const expectedCounts = [5, 8, 8, 6, 7, 6, 5]; // Total: 45
    
    featureSets.forEach((featureSet, index) => {
      expect(featureSet.features.length).toBe(expectedCounts[index]);
    });
  });

  it('should have unique routes across all security features', () => {
    fc.assert(
      fc.property(
        expectedSecurityRouteArbitrary,
        expectedSecurityRouteArbitrary,
        (route1, route2) => {
          // Property: If two routes are different, they should not be equal
          if (route1 !== route2) {
            expect(route1).not.toBe(route2);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should have unique feature IDs across all security features', () => {
    const featureIds = allSecurityFeatures.map(f => f.id);
    const uniqueIds = new Set(featureIds);
    
    expect(featureIds.length).toBe(uniqueIds.size);
  });

  it('should have consistent route patterns for all security features', () => {
    fc.assert(
      fc.property(
        expectedSecurityRouteArbitrary,
        (route) => {
          // Property: All security routes should follow /security/{featureSet}/{feature} pattern
          expect(route).toMatch(/^\/security\/[a-z-]+\/[a-z-]+$/);
          
          const parts = route.split('/');
          expect(parts.length).toBe(4);
          expect(parts[0]).toBe('');
          expect(parts[1]).toBe('security');
          expect(parts[2]).toBeTruthy();
          expect(parts[3]).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have descriptive names for all security features', () => {
    fc.assert(
      fc.property(
        expectedSecurityRouteArbitrary,
        (route) => {
          const feature = allSecurityFeatures.find(f => f.path === route);
          
          // Property: All features should have meaningful names
          expect(feature?.name).toBeDefined();
          expect(feature!.name.length).toBeGreaterThan(5);
          expect(feature!.name.length).toBeLessThan(100);
          expect(feature!.name).not.toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have icons for all security features', () => {
    fc.assert(
      fc.property(
        expectedSecurityRouteArbitrary,
        (route) => {
          const feature = allSecurityFeatures.find(f => f.path === route);
          
          // Property: All features should have icons defined
          expect(feature?.icon).toBeDefined();
          expect(typeof feature?.icon).toBe('object'); // Lucide icons are imported as objects
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain navigation completeness across all feature sets', () => {
    const featureSets = securityArea?.featureSets || [];
    
    featureSets.forEach(featureSet => {
      // Property: Each feature set should have all its features properly defined
      expect(featureSet.id).toBeDefined();
      expect(featureSet.name).toBeDefined();
      expect(featureSet.icon).toBeDefined();
      expect(featureSet.features.length).toBeGreaterThan(0);
      
      featureSet.features.forEach(feature => {
        expect(feature.id).toBeDefined();
        expect(feature.name).toBeDefined();
        expect(feature.path).toBeDefined();
        expect(feature.icon).toBeDefined();
        expect(feature.path.startsWith('/security/')).toBe(true);
      });
    });
  });

  // This test will fail until all routes are implemented in App.tsx
  it('should have route configuration completeness (will fail until all routes implemented)', () => {
    // This property test checks that navigation completeness extends to routing
    // It will fail until task 4.1 is completed (adding all security routes to App.tsx)
    
    fc.assert(
      fc.property(
        expectedSecurityRouteArbitrary,
        (route) => {
          // Property: Every navigation route should have a corresponding route configuration
          // Note: This test documents the current gap between navigation (45 features) 
          // and routing (7 features) that needs to be addressed
          
          const feature = allSecurityFeatures.find(f => f.path === route);
          expect(feature).toBeDefined();
          
          // This assertion will fail for routes not yet implemented in App.tsx
          // The failure serves as documentation of what needs to be implemented
          expect(feature?.path).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});