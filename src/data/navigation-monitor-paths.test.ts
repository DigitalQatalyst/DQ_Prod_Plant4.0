/**
 * Test to verify Monitor section navigation paths follow the correct pattern
 * Requirements: 29.1, 29.2
 */

import { describe, it, expect } from 'vitest';
import { featureAreas } from './navigation';

describe('Monitor Navigation Path Structure', () => {
  it('should have Monitor feature area with correct feature sets', () => {
    const monitorArea = featureAreas.find(area => area.id === 'monitor');
    expect(monitorArea).toBeDefined();
    expect(monitorArea?.name).toBe('Monitor (APM)');
    
    const featureSetIds = monitorArea?.featureSets.map(fs => fs.id) || [];
    expect(featureSetIds).toContain('health-diagnostics');
    expect(featureSetIds).toContain('predictive-maintenance');
    expect(featureSetIds).toContain('performance-utilisation');
    expect(featureSetIds).toContain('inventory-criticality');
    expect(featureSetIds).toContain('alerts-reports');
  });

  it('should have all Monitor paths follow /monitor/{feature-set}/{feature} pattern', () => {
    const monitorArea = featureAreas.find(area => area.id === 'monitor');
    expect(monitorArea).toBeDefined();
    
    const allFeatures = monitorArea?.featureSets.flatMap(fs => fs.features) || [];
    
    allFeatures.forEach(feature => {
      // Each path should start with /monitor/
      expect(feature.path).toMatch(/^\/monitor\//);
      
      // Each path should have exactly 3 segments: /monitor/{feature-set}/{feature}
      const segments = feature.path.split('/').filter(s => s.length > 0);
      expect(segments.length).toBe(3);
      expect(segments[0]).toBe('monitor');
    });
  });

  it('should have health-diagnostics feature set with correct paths', () => {
    const monitorArea = featureAreas.find(area => area.id === 'monitor');
    const healthDiagnostics = monitorArea?.featureSets.find(fs => fs.id === 'health-diagnostics');
    
    expect(healthDiagnostics).toBeDefined();
    expect(healthDiagnostics?.features).toHaveLength(5);
    
    const paths = healthDiagnostics?.features.map(f => f.path) || [];
    expect(paths).toContain('/monitor/health-diagnostics/condition-monitoring');
    expect(paths).toContain('/monitor/health-diagnostics/health-scoring');
    expect(paths).toContain('/monitor/health-diagnostics/anomaly-detection');
    expect(paths).toContain('/monitor/health-diagnostics/root-cause');
    expect(paths).toContain('/monitor/health-diagnostics/degradation-trends');
  });

  it('should have predictive-maintenance feature set with correct paths', () => {
    const monitorArea = featureAreas.find(area => area.id === 'monitor');
    const predictiveMaintenance = monitorArea?.featureSets.find(fs => fs.id === 'predictive-maintenance');
    
    expect(predictiveMaintenance).toBeDefined();
    expect(predictiveMaintenance?.features).toHaveLength(5);
    
    const paths = predictiveMaintenance?.features.map(f => f.path) || [];
    expect(paths).toContain('/monitor/predictive-maintenance/failure-prediction');
    expect(paths).toContain('/monitor/predictive-maintenance/rul-estimation');
    expect(paths).toContain('/monitor/predictive-maintenance/cbm-triggers');
    expect(paths).toContain('/monitor/predictive-maintenance/recommendations');
    expect(paths).toContain('/monitor/predictive-maintenance/priority-scoring');
  });

  it('should have performance-utilisation feature set with correct paths', () => {
    const monitorArea = featureAreas.find(area => area.id === 'monitor');
    const performanceUtilisation = monitorArea?.featureSets.find(fs => fs.id === 'performance-utilisation');
    
    expect(performanceUtilisation).toBeDefined();
    expect(performanceUtilisation?.features).toHaveLength(5);
    
    const paths = performanceUtilisation?.features.map(f => f.path) || [];
    expect(paths).toContain('/monitor/performance-utilisation/uptime-tracking');
    expect(paths).toContain('/monitor/performance-utilisation/utilisation-monitoring');
    expect(paths).toContain('/monitor/performance-utilisation/deviation-detection');
    expect(paths).toContain('/monitor/performance-utilisation/benchmarking');
    expect(paths).toContain('/monitor/performance-utilisation/arm-kpis');
  });

  it('should have inventory-criticality feature set with correct paths', () => {
    const monitorArea = featureAreas.find(area => area.id === 'monitor');
    const inventoryCriticality = monitorArea?.featureSets.find(fs => fs.id === 'inventory-criticality');
    
    expect(inventoryCriticality).toBeDefined();
    expect(inventoryCriticality?.features).toHaveLength(5);
    
    const paths = inventoryCriticality?.features.map(f => f.path) || [];
    expect(paths).toContain('/monitor/inventory-criticality/registry');
    expect(paths).toContain('/monitor/inventory-criticality/criticality-scoring');
    expect(paths).toContain('/monitor/inventory-criticality/failure-modes');
    expect(paths).toContain('/monitor/inventory-criticality/lifecycle-tracking');
    expect(paths).toContain('/monitor/inventory-criticality/spare-parts');
  });

  it('should have alerts-reports feature set with correct paths', () => {
    const monitorArea = featureAreas.find(area => area.id === 'monitor');
    const alertsReports = monitorArea?.featureSets.find(fs => fs.id === 'alerts-reports');
    
    expect(alertsReports).toBeDefined();
    expect(alertsReports?.features).toHaveLength(5);
    
    const paths = alertsReports?.features.map(f => f.path) || [];
    expect(paths).toContain('/monitor/alerts-reports/realtime-alerts');
    expect(paths).toContain('/monitor/alerts-reports/alert-history');
    expect(paths).toContain('/monitor/alerts-reports/custom-dashboards');
    expect(paths).toContain('/monitor/alerts-reports/reliability-reports');
    expect(paths).toContain('/monitor/alerts-reports/data-export');
  });

  it('should not have any separate APM Transmission feature area', () => {
    const apmArea = featureAreas.find(area => 
      area.id.toLowerCase().includes('apm') || 
      area.id.toLowerCase().includes('transmission')
    );
    
    // Should not find any separate APM or Transmission feature area
    expect(apmArea).toBeUndefined();
  });

  it('should have all Monitor features tagged with appropriate sector/subsector', () => {
    const monitorArea = featureAreas.find(area => area.id === 'monitor');
    const allFeatures = monitorArea?.featureSets.flatMap(fs => fs.features) || [];
    
    allFeatures.forEach(feature => {
      // Each feature should have sector and subsector tags
      expect(feature.sector).toBeDefined();
      expect(feature.subsector).toBeDefined();
      
      // For transmission features, should be Oil & Gas / Upstream
      expect(feature.sector).toBe('Oil & Gas');
      expect(feature.subsector).toBe('Upstream');
    });
  });
});
