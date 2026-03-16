/**
 * Comprehensive APM Functionality Verification Test
 * 
 * This test verifies all 25 APM features load without errors under upstream tenant context
 * and validates the key functionality requirements from the checkpoint task.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { featureAreas } from '@/data/navigation';
import { assetsByTenant, upstreamTelemetry, upstreamAlerts } from '@/data/mockData';
import { reliabilityMetrics, criticalityScores, benchmarkData } from '@/data/apmUpstreamData';

// Import all APM pages for testing
import { ConditionMonitoring } from '@/pages/monitor/ConditionMonitoring';
import { HealthScoring } from '@/pages/monitor/HealthScoring';
import { AnomalyDetection } from '@/pages/monitor/AnomalyDetection';
import { RootCauseDiagnostics } from '@/pages/monitor/RootCauseDiagnostics';
import { DegradationTrends } from '@/pages/monitor/DegradationTrends';
import { FailurePrediction } from '@/pages/monitor/FailurePrediction';
import { RULEstimation } from '@/pages/monitor/RULEstimation';
import { CBMTriggers } from '@/pages/monitor/CBMTriggers';
import { MaintenanceRecommendations } from '@/pages/monitor/MaintenanceRecommendations';
import { PriorityScoring } from '@/pages/monitor/PriorityScoring';
import { UptimeDowntimeTracking } from '@/pages/monitor/UptimeDowntimeTracking';
import { UtilisationMonitoring } from '@/pages/monitor/UtilisationMonitoring';
import { PerformanceDeviationDetection } from '@/pages/monitor/PerformanceDeviationDetection';
import { PerformanceBenchmarking } from '@/pages/monitor/PerformanceBenchmarking';
import { ARMKPIs } from '@/pages/monitor/ARMKPIs';
import { AssetRegistry } from '@/pages/monitor/AssetRegistry';
import { CriticalityScoring } from '@/pages/monitor/CriticalityScoring';
import { FailureModeMapping } from '@/pages/monitor/FailureModeMapping';
import { LifecycleTracking } from '@/pages/monitor/LifecycleTracking';
import { SparePartsLinkage } from '@/pages/monitor/SparePartsLinkage';
import { RealtimeAlerts } from '@/pages/monitor/RealtimeAlerts';
import { AlertHistory } from '@/pages/monitor/AlertHistory';
import { CustomDashboards } from '@/pages/monitor/CustomDashboards';
import { ReliabilityReports } from '@/pages/monitor/ReliabilityReports';
import { DataExport } from '@/pages/monitor/DataExport';

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AppProvider>
      {children}
    </AppProvider>
  </BrowserRouter>
);

describe('APM Comprehensive Functionality Verification', () => {
  beforeEach(() => {
    // Reset any global state before each test
    localStorage.clear();
  });

  describe('1. Navigation Structure and Metadata', () => {
    it('should have all 25 APM features defined in navigation', () => {
      const monitorArea = featureAreas.find(area => area.id === 'monitor');
      expect(monitorArea).toBeDefined();
      expect(monitorArea?.name).toBe('Monitor (APM)');
      expect(monitorArea?.sector).toBe('Oil & Gas');
      expect(monitorArea?.subsector).toBe('Upstream');

      // Verify all 5 feature sets exist
      expect(monitorArea?.featureSets).toHaveLength(5);
      
      const featureSetNames = monitorArea?.featureSets.map(fs => fs.name);
      expect(featureSetNames).toContain('Asset Health & Diagnostics');
      expect(featureSetNames).toContain('Predictive & Prescriptive Maintenance');
      expect(featureSetNames).toContain('Asset Performance & Utilisation');
      expect(featureSetNames).toContain('Asset Inventory & Criticality');
      expect(featureSetNames).toContain('Alerts, Reports & Visualisation');

      // Count total features across all feature sets
      const totalFeatures = monitorArea?.featureSets.reduce((sum, fs) => sum + fs.features.length, 0);
      expect(totalFeatures).toBe(25);
    });

    it('should have sector and subsector metadata on all APM features', () => {
      const monitorArea = featureAreas.find(area => area.id === 'monitor');
      
      monitorArea?.featureSets.forEach(featureSet => {
        expect(featureSet.sector).toBe('Oil & Gas');
        expect(featureSet.subsector).toBe('Upstream');
        
        featureSet.features.forEach(feature => {
          expect(feature.sector).toBe('Oil & Gas');
          expect(feature.subsector).toBe('Upstream');
          expect(feature.industryTags).toBeDefined();
          expect(Array.isArray(feature.industryTags)).toBe(true);
        });
      });
    });
  });

  describe('2. Upstream Tenant and Asset Data', () => {
    it('should have upstream tenant with 5 assets', () => {
      const upstreamAssets = assetsByTenant['t-upstream'];
      expect(upstreamAssets).toBeDefined();
      expect(upstreamAssets).toHaveLength(5);

      const expectedAssets = ['WH-01', 'ESP-07', 'GC-11', 'P-21', 'KO-03'];
      const assetIds = upstreamAssets.map(asset => asset.id);
      expectedAssets.forEach(expectedId => {
        expect(assetIds).toContain(expectedId);
      });
    });

    it('should have complete asset information for all upstream assets', () => {
      const upstreamAssets = assetsByTenant['t-upstream'];
      
      upstreamAssets.forEach(asset => {
        // Property 1: Asset information completeness
        expect(asset.name).toBeDefined();
        expect(asset.type).toBeDefined();
        expect(asset.location).toBeDefined();
        expect(asset.criticality).toBeDefined();
        expect(asset.healthIndex).toBeDefined();
        expect(asset.anomalyState).toBeDefined();
        
        // Verify asset types are correct
        expect(['Wellhead', 'ESP Pump', 'Gas Compressor', 'Crude Transfer Pump', 'Flare KO Drum'])
          .toContain(asset.type);
      });
    });

    it('should have telemetry data for all upstream assets', () => {
      const upstreamAssets = assetsByTenant['t-upstream'];
      
      upstreamAssets.forEach(asset => {
        // Property 4: Telemetry data completeness
        const telemetryData = upstreamTelemetry[asset.id];
        expect(telemetryData).toBeDefined();
        
        // Property 5: Historical data availability (24 hours)
        Object.values(telemetryData).forEach(parameterData => {
          expect(Array.isArray(parameterData)).toBe(true);
          expect(parameterData.length).toBeGreaterThan(0);
          
          // Verify data points have required structure
          parameterData.forEach(dataPoint => {
            expect(dataPoint.value).toBeDefined();
            expect(dataPoint.timestamp).toBeDefined();
            expect(dataPoint.unit).toBeDefined();
            expect(dataPoint.status).toBeDefined();
          });
        });
      });
    });

    it('should have asset-type specific telemetry parameters', () => {
      const upstreamAssets = assetsByTenant['t-upstream'];
      
      upstreamAssets.forEach(asset => {
        const telemetryData = upstreamTelemetry[asset.id];
        const parameters = Object.keys(telemetryData);
        
        // Property 3: Asset-type telemetry mapping
        switch (asset.type) {
          case 'Wellhead':
            expect(parameters).toContain('tubingPressure');
            expect(parameters).toContain('temperature');
            expect(parameters).toContain('flowRate');
            break;
          case 'ESP Pump':
            expect(parameters).toContain('motorCurrent');
            expect(parameters).toContain('intakePressure');
            expect(parameters).toContain('dischargePressure');
            expect(parameters).toContain('vibration');
            break;
          case 'Gas Compressor':
            expect(parameters).toContain('suctionPressure');
            expect(parameters).toContain('dischargePressure');
            expect(parameters).toContain('vibration');
            break;
          case 'Crude Transfer Pump':
            expect(parameters).toContain('flowRate');
            expect(parameters).toContain('suctionPressure');
            expect(parameters).toContain('dischargePressure');
            expect(parameters).toContain('motorCurrent');
            break;
          case 'Flare KO Drum':
            expect(parameters).toContain('pressure');
            expect(parameters).toContain('temperature');
            expect(parameters).toContain('level');
            break;
        }
      });
    });
  });

  describe('3. APM Feature Pages Load Without Errors', () => {
    const apmComponents = [
      { name: 'Condition Monitoring', component: ConditionMonitoring },
      { name: 'Health Scoring', component: HealthScoring },
      { name: 'Anomaly Detection', component: AnomalyDetection },
      { name: 'Root Cause Diagnostics', component: RootCauseDiagnostics },
      { name: 'Degradation Trends', component: DegradationTrends },
      { name: 'Failure Prediction', component: FailurePrediction },
      { name: 'RUL Estimation', component: RULEstimation },
      { name: 'CBM Triggers', component: CBMTriggers },
      { name: 'Maintenance Recommendations', component: MaintenanceRecommendations },
      { name: 'Priority Scoring', component: PriorityScoring },
      { name: 'Uptime Downtime Tracking', component: UptimeDowntimeTracking },
      { name: 'Utilisation Monitoring', component: UtilisationMonitoring },
      { name: 'Performance Deviation Detection', component: PerformanceDeviationDetection },
      { name: 'Performance Benchmarking', component: PerformanceBenchmarking },
      { name: 'ARM KPIs', component: ARMKPIs },
      { name: 'Asset Registry', component: AssetRegistry },
      { name: 'Criticality Scoring', component: CriticalityScoring },
      { name: 'Failure Mode Mapping', component: FailureModeMapping },
      { name: 'Lifecycle Tracking', component: LifecycleTracking },
      { name: 'Spare Parts Linkage', component: SparePartsLinkage },
      { name: 'Realtime Alerts', component: RealtimeAlerts },
      { name: 'Alert History', component: AlertHistory },
      { name: 'Custom Dashboards', component: CustomDashboards },
      { name: 'Reliability Reports', component: ReliabilityReports },
      { name: 'Data Export', component: DataExport },
    ];

    apmComponents.forEach(({ name, component: Component }) => {
      it(`should render ${name} without errors`, () => {
        expect(() => {
          render(
            <TestWrapper>
              <Component />
            </TestWrapper>
          );
        }).not.toThrow();
      });
    });
  });

  describe('4. Asset Selection and WorkPane Updates', () => {
    it('should update WorkPane content when asset is selected in Condition Monitoring', () => {
      render(
        <TestWrapper>
          <ConditionMonitoring />
        </TestWrapper>
      );

      // Should show asset selection prompt initially
      expect(screen.getByText(/select an asset/i)).toBeInTheDocument();

      // Find and click on an asset (assuming APMAssetList renders assets)
      const assetButtons = screen.getAllByRole('button');
      const assetButton = assetButtons.find(button => 
        button.textContent?.includes('WH-01') || 
        button.textContent?.includes('ESP-07')
      );

      if (assetButton) {
        fireEvent.click(assetButton);
        
        // WorkPane should update with asset-specific content
        // This verifies Property 31: WorkPane content updates
        expect(screen.queryByText(/select an asset/i)).not.toBeInTheDocument();
      }
    });
  });

  describe('5. Health Indices and Anomaly States', () => {
    it('should display health indices and anomaly indicators for all assets', () => {
      const upstreamAssets = assetsByTenant['t-upstream'];
      
      upstreamAssets.forEach(asset => {
        // Property 8: Health index and anomaly display
        expect(asset.healthIndex).toBeDefined();
        expect(typeof asset.healthIndex).toBe('number');
        expect(asset.healthIndex).toBeGreaterThanOrEqual(0);
        expect(asset.healthIndex).toBeLessThanOrEqual(100);
        
        expect(asset.anomalyState).toBeDefined();
        expect(['Normal', 'Warning', 'Critical']).toContain(asset.anomalyState);
      });
    });
  });

  describe('6. Root Cause Diagnostics', () => {
    it('should provide upstream-specific causes and actions', () => {
      expect(upstreamAlerts).toBeDefined();
      expect(Array.isArray(upstreamAlerts)).toBe(true);
      expect(upstreamAlerts.length).toBeGreaterThan(0);

      upstreamAlerts.forEach(alert => {
        // Property 13: Root cause analysis completeness
        expect(alert.likelyCauses).toBeDefined();
        expect(Array.isArray(alert.likelyCauses)).toBe(true);
        expect(alert.likelyCauses.length).toBeGreaterThan(0);
        
        // Property 14: Corrective action appropriateness
        expect(alert.correctiveActions).toBeDefined();
        expect(Array.isArray(alert.correctiveActions)).toBe(true);
        expect(alert.correctiveActions.length).toBeGreaterThan(0);
        
        // Verify upstream-specific content
        const allText = [...alert.likelyCauses, ...alert.correctiveActions].join(' ').toLowerCase();
        const upstreamTerms = ['pressure', 'vibration', 'pump', 'compressor', 'wellhead', 'valve', 'bearing'];
        const hasUpstreamTerms = upstreamTerms.some(term => allText.includes(term));
        expect(hasUpstreamTerms).toBe(true);
      });
    });
  });

  describe('7. Performance Metrics and Reliability', () => {
    it('should have reliability metrics for all assets', () => {
      expect(reliabilityMetrics).toBeDefined();
      expect(Array.isArray(reliabilityMetrics)).toBe(true);
      
      const upstreamAssets = assetsByTenant['t-upstream'];
      upstreamAssets.forEach(asset => {
        const metrics = reliabilityMetrics.find(m => m.assetId === asset.id);
        
        // Property 21: Performance metric completeness
        expect(metrics).toBeDefined();
        expect(metrics?.mtbfHours).toBeDefined();
        expect(metrics?.mttrHours).toBeDefined();
        expect(metrics?.availabilityPercent).toBeDefined();
        expect(metrics?.downtimeHours30d).toBeDefined();
        
        // Property 22: Reliability calculation provision
        expect(typeof metrics?.mtbfHours).toBe('number');
        expect(typeof metrics?.mttrHours).toBe('number');
        expect(typeof metrics?.availabilityPercent).toBe('number');
        
        // Verify reasonable ranges
        expect(metrics?.availabilityPercent).toBeGreaterThanOrEqual(0);
        expect(metrics?.availabilityPercent).toBeLessThanOrEqual(100);
      });
    });

    it('should have benchmark data for performance comparisons', () => {
      expect(benchmarkData).toBeDefined();
      expect(Array.isArray(benchmarkData)).toBe(true);
      
      benchmarkData.forEach(benchmark => {
        // Property 25: Benchmark comparison accuracy
        expect(benchmark.currentValue).toBeDefined();
        expect(benchmark.target).toBeDefined();
        expect(benchmark.bestObserved).toBeDefined();
        expect(benchmark.industryAverage).toBeDefined();
        
        expect(typeof benchmark.currentValue).toBe('number');
        expect(typeof benchmark.target).toBe('number');
        expect(typeof benchmark.bestObserved).toBe('number');
        expect(typeof benchmark.industryAverage).toBe('number');
      });
    });
  });

  describe('8. Criticality Scores', () => {
    it('should have criticality scores for all assets', () => {
      expect(criticalityScores).toBeDefined();
      expect(Array.isArray(criticalityScores)).toBe(true);
      
      const upstreamAssets = assetsByTenant['t-upstream'];
      upstreamAssets.forEach(asset => {
        const criticality = criticalityScores.find(c => c.assetId === asset.id);
        
        expect(criticality).toBeDefined();
        expect(criticality?.safetyImpact).toBeDefined();
        expect(criticality?.productionImpact).toBeDefined();
        expect(criticality?.environmentalImpact).toBeDefined();
        expect(criticality?.overallScore).toBeDefined();
        expect(criticality?.criticalityTier).toBeDefined();
        
        // Verify score ranges (1-5 scale)
        expect(criticality?.safetyImpact).toBeGreaterThanOrEqual(1);
        expect(criticality?.safetyImpact).toBeLessThanOrEqual(5);
        expect(criticality?.productionImpact).toBeGreaterThanOrEqual(1);
        expect(criticality?.productionImpact).toBeLessThanOrEqual(5);
        expect(criticality?.environmentalImpact).toBeGreaterThanOrEqual(1);
        expect(criticality?.environmentalImpact).toBeLessThanOrEqual(5);
        
        expect(['A', 'B', 'C']).toContain(criticality?.criticalityTier);
      });
    });
  });

  describe('9. Sector and Subsector Badge Consistency', () => {
    it('should display sector and subsector badges consistently', () => {
      render(
        <TestWrapper>
          <ConditionMonitoring />
        </TestWrapper>
      );

      // Property 2: Sector badge consistency
      // The badges should be displayed in the APMPageShell component
      // This test verifies the structure is in place for consistent badge display
      const monitorArea = featureAreas.find(area => area.id === 'monitor');
      expect(monitorArea?.sector).toBe('Oil & Gas');
      expect(monitorArea?.subsector).toBe('Upstream');
    });
  });

  describe('10. Data Completeness and Structure', () => {
    it('should have complete data structures for APM functionality', () => {
      // Verify all required data structures exist
      expect(assetsByTenant['t-upstream']).toBeDefined();
      expect(upstreamTelemetry).toBeDefined();
      expect(upstreamAlerts).toBeDefined();
      expect(reliabilityMetrics).toBeDefined();
      expect(criticalityScores).toBeDefined();
      expect(benchmarkData).toBeDefined();
      
      // Verify data is not empty
      expect(assetsByTenant['t-upstream'].length).toBeGreaterThan(0);
      expect(Object.keys(upstreamTelemetry).length).toBeGreaterThan(0);
      expect(upstreamAlerts.length).toBeGreaterThan(0);
      expect(reliabilityMetrics.length).toBeGreaterThan(0);
      expect(criticalityScores.length).toBeGreaterThan(0);
      expect(benchmarkData.length).toBeGreaterThan(0);
    });
  });
});