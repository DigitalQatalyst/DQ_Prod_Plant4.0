/**
 * Basic APM Functionality Verification
 */

import { describe, it, expect } from 'vitest';
import { featureAreas } from '@/data/navigation';
import { assetsByTenant, upstreamTelemetry, upstreamAlerts } from '@/data/mockData';
import { reliabilityMetrics, criticalityScores, benchmarkData } from '@/data/apmUpstreamData';

describe('APM Basic Verification', () => {
  describe('Navigation Structure', () => {
    it('should have Monitor area with 25 APM features', () => {
      const monitorArea = featureAreas.find(area => area.id === 'monitor');
      expect(monitorArea).toBeDefined();
      expect(monitorArea?.name).toBe('Monitor (APM)');
      
      const totalFeatures = monitorArea?.featureSets.reduce((sum, fs) => sum + fs.features.length, 0);
      expect(totalFeatures).toBe(25);
    });

    it('should have correct sector and subsector metadata', () => {
      const monitorArea = featureAreas.find(area => area.id === 'monitor');
      expect(monitorArea?.sector).toBe('Oil & Gas');
      expect(monitorArea?.subsector).toBe('Upstream');
    });
  });

  describe('Upstream Assets', () => {
    it('should have 5 upstream assets with complete information', () => {
      const upstreamAssets = assetsByTenant['t-upstream'];
      expect(upstreamAssets).toHaveLength(5);
      
      const expectedAssets = ['WH-01', 'ESP-07', 'GC-11', 'P-21', 'KO-03'];
      expectedAssets.forEach(assetId => {
        const asset = upstreamAssets.find(a => a.id === assetId);
        expect(asset).toBeDefined();
        expect(asset?.name).toBeDefined();
        expect(asset?.type).toBeDefined();
        expect(asset?.location).toBeDefined();
        expect(asset?.criticality).toBeDefined();
        expect(asset?.healthIndex).toBeDefined();
        expect(asset?.anomalyState).toBeDefined();
      });
    });
  });

  describe('Telemetry Data', () => {
    it('should have telemetry data for all assets', () => {
      const upstreamAssets = assetsByTenant['t-upstream'];
      
      upstreamAssets.forEach(asset => {
        const telemetryData = upstreamTelemetry[asset.id];
        expect(telemetryData).toBeDefined();
        expect(Object.keys(telemetryData).length).toBeGreaterThan(0);
        
        Object.values(telemetryData).forEach(parameterData => {
          expect(Array.isArray(parameterData)).toBe(true);
          expect(parameterData.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have asset-type specific parameters', () => {
      const wellheadData = upstreamTelemetry['WH-01'];
      expect(wellheadData.tubingPressure).toBeDefined();
      expect(wellheadData.flowRate).toBeDefined();
      
      const espData = upstreamTelemetry['ESP-07'];
      expect(espData.motorCurrent).toBeDefined();
      expect(espData.vibration).toBeDefined();
      
      const compressorData = upstreamTelemetry['GC-11'];
      expect(compressorData.suctionPressure).toBeDefined();
      expect(compressorData.dischargePressure).toBeDefined();
    });
  });

  describe('APM Data Structures', () => {
    it('should have reliability metrics', () => {
      expect(reliabilityMetrics).toBeDefined();
      expect(Array.isArray(reliabilityMetrics)).toBe(true);
      expect(reliabilityMetrics.length).toBeGreaterThan(0);
      
      reliabilityMetrics.forEach(metric => {
        expect(metric.mtbfHours).toBeDefined();
        expect(metric.mttrHours).toBeDefined();
        expect(metric.availabilityPercent).toBeDefined();
      });
    });

    it('should have criticality scores', () => {
      expect(criticalityScores).toBeDefined();
      expect(Array.isArray(criticalityScores)).toBe(true);
      expect(criticalityScores.length).toBeGreaterThan(0);
      
      criticalityScores.forEach(score => {
        expect(score.safetyImpact).toBeDefined();
        expect(score.productionImpact).toBeDefined();
        expect(score.environmentalImpact).toBeDefined();
        expect(score.overallScore).toBeDefined();
      });
    });

    it('should have benchmark data', () => {
      expect(benchmarkData).toBeDefined();
      expect(Array.isArray(benchmarkData)).toBe(true);
      expect(benchmarkData.length).toBeGreaterThan(0);
      
      benchmarkData.forEach(benchmark => {
        expect(benchmark.currentValue).toBeDefined();
        expect(benchmark.target).toBeDefined();
        expect(benchmark.bestObserved).toBeDefined();
        expect(benchmark.industryAverage).toBeDefined();
      });
    });

    it('should have upstream alerts with root cause data', () => {
      expect(upstreamAlerts).toBeDefined();
      expect(Array.isArray(upstreamAlerts)).toBe(true);
      expect(upstreamAlerts.length).toBeGreaterThan(0);
      
      upstreamAlerts.forEach(alert => {
        expect(alert.likelyCauses).toBeDefined();
        expect(Array.isArray(alert.likelyCauses)).toBe(true);
        expect(alert.correctiveActions).toBeDefined();
        expect(Array.isArray(alert.correctiveActions)).toBe(true);
      });
    });
  });
});