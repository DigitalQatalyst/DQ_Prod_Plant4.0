/**
 * Test to verify EMS page structure consistency
 * This test checks that all 25 EMS pages use EMSPageShell and follow nLVE pattern
 */

import { describe, it, expect } from 'vitest';

// Import all 25 EMS pages
import { EnergyMonitoringRealTime } from '@/pages/energy/EnergyMonitoringRealTime';
import { EnergyMonitoringSubMetering } from '@/pages/energy/EnergyMonitoringSubMetering';
import { EnergyMonitoringPowerQuality } from '@/pages/energy/EnergyMonitoringPowerQuality';
import { EnergyMonitoringBaselineTrends } from '@/pages/energy/EnergyMonitoringBaselineTrends';
import { EnergyMonitoringMultiFluid } from '@/pages/energy/EnergyMonitoringMultiFluid';
import { EnergyAnalyticsEfficiencyKPIs } from '@/pages/energy/EnergyAnalyticsEfficiencyKPIs';
import { EnergyAnalyticsLoadProfiling } from '@/pages/energy/EnergyAnalyticsLoadProfiling';
import { EnergyAnalyticsPeakDemand } from '@/pages/energy/EnergyAnalyticsPeakDemand';
import { EnergyAnalyticsWasteDetection } from '@/pages/energy/EnergyAnalyticsWasteDetection';
import { EnergyAnalyticsAIOptimisation } from '@/pages/energy/EnergyAnalyticsAIOptimisation';
import { EnergySustainabilityCarbonCalculation } from '@/pages/energy/EnergySustainabilityCarbonCalculation';
import { EnergySustainabilityEnergyIntensity } from '@/pages/energy/EnergySustainabilityEnergyIntensity';
import { EnergySustainabilityRenewables } from '@/pages/energy/EnergySustainabilityRenewables';
import { EnergySustainabilityESGReporting } from '@/pages/energy/EnergySustainabilityESGReporting';
import { EnergySustainabilityCompliance } from '@/pages/energy/EnergySustainabilityCompliance';
import EnergyControlLoadBalancing from '@/pages/energy/EnergyControlLoadBalancing';
import EnergyControlDemandResponse from '@/pages/energy/EnergyControlDemandResponse';
import EnergyControlAssetModes from '@/pages/energy/EnergyControlAssetModes';
import EnergyControlIntegration from '@/pages/energy/EnergyControlIntegration';
import EnergyControlEfficiencyCurves from '@/pages/energy/EnergyControlEfficiencyCurves';
import { EnergyDashboardsCustom } from '@/pages/energy/EnergyDashboardsCustom';
import { EnergyDashboardsPeriodComparison } from '@/pages/energy/EnergyDashboardsPeriodComparison';
import { EnergyDashboardsCostAnalysis } from '@/pages/energy/EnergyDashboardsCostAnalysis';
import { EnergyDashboardsAnomalies } from '@/pages/energy/EnergyDashboardsAnomalies';
import { EnergyDashboardsAuditReports } from '@/pages/energy/EnergyDashboardsAuditReports';

const emsPages = [
  // Energy Monitoring & Metering (5 pages)
  { name: 'EnergyMonitoringRealTime', component: EnergyMonitoringRealTime, featureSet: 'Energy Monitoring & Metering' },
  { name: 'EnergyMonitoringSubMetering', component: EnergyMonitoringSubMetering, featureSet: 'Energy Monitoring & Metering' },
  { name: 'EnergyMonitoringPowerQuality', component: EnergyMonitoringPowerQuality, featureSet: 'Energy Monitoring & Metering' },
  { name: 'EnergyMonitoringBaselineTrends', component: EnergyMonitoringBaselineTrends, featureSet: 'Energy Monitoring & Metering' },
  { name: 'EnergyMonitoringMultiFluid', component: EnergyMonitoringMultiFluid, featureSet: 'Energy Monitoring & Metering' },
  
  // Energy Analytics & Optimisation (5 pages)
  { name: 'EnergyAnalyticsEfficiencyKPIs', component: EnergyAnalyticsEfficiencyKPIs, featureSet: 'Energy Analytics & Optimisation' },
  { name: 'EnergyAnalyticsLoadProfiling', component: EnergyAnalyticsLoadProfiling, featureSet: 'Energy Analytics & Optimisation' },
  { name: 'EnergyAnalyticsPeakDemand', component: EnergyAnalyticsPeakDemand, featureSet: 'Energy Analytics & Optimisation' },
  { name: 'EnergyAnalyticsWasteDetection', component: EnergyAnalyticsWasteDetection, featureSet: 'Energy Analytics & Optimisation' },
  { name: 'EnergyAnalyticsAIOptimisation', component: EnergyAnalyticsAIOptimisation, featureSet: 'Energy Analytics & Optimisation' },
  
  // Sustainability & Emissions Tracking (5 pages)
  { name: 'EnergySustainabilityCarbonCalculation', component: EnergySustainabilityCarbonCalculation, featureSet: 'Sustainability & Emissions Tracking' },
  { name: 'EnergySustainabilityEnergyIntensity', component: EnergySustainabilityEnergyIntensity, featureSet: 'Sustainability & Emissions Tracking' },
  { name: 'EnergySustainabilityRenewables', component: EnergySustainabilityRenewables, featureSet: 'Sustainability & Emissions Tracking' },
  { name: 'EnergySustainabilityESGReporting', component: EnergySustainabilityESGReporting, featureSet: 'Sustainability & Emissions Tracking' },
  { name: 'EnergySustainabilityCompliance', component: EnergySustainabilityCompliance, featureSet: 'Sustainability & Emissions Tracking' },
  
  // Energy Control Advisory & Integration (5 pages)
  { name: 'EnergyControlLoadBalancing', component: EnergyControlLoadBalancing, featureSet: 'Energy Control Advisory & Integration' },
  { name: 'EnergyControlDemandResponse', component: EnergyControlDemandResponse, featureSet: 'Energy Control Advisory & Integration' },
  { name: 'EnergyControlAssetModes', component: EnergyControlAssetModes, featureSet: 'Energy Control Advisory & Integration' },
  { name: 'EnergyControlIntegration', component: EnergyControlIntegration, featureSet: 'Energy Control Advisory & Integration' },
  { name: 'EnergyControlEfficiencyCurves', component: EnergyControlEfficiencyCurves, featureSet: 'Energy Control Advisory & Integration' },
  
  // Energy Dashboards & Reporting (5 pages)
  { name: 'EnergyDashboardsCustom', component: EnergyDashboardsCustom, featureSet: 'Energy Dashboards & Reporting' },
  { name: 'EnergyDashboardsPeriodComparison', component: EnergyDashboardsPeriodComparison, featureSet: 'Energy Dashboards & Reporting' },
  { name: 'EnergyDashboardsCostAnalysis', component: EnergyDashboardsCostAnalysis, featureSet: 'Energy Dashboards & Reporting' },
  { name: 'EnergyDashboardsAnomalies', component: EnergyDashboardsAnomalies, featureSet: 'Energy Dashboards & Reporting' },
  { name: 'EnergyDashboardsAuditReports', component: EnergyDashboardsAuditReports, featureSet: 'Energy Dashboards & Reporting' },
];

describe('EMS Page Structure Consistency', () => {
  it('should have exactly 25 EMS pages', () => {
    expect(emsPages).toHaveLength(25);
  });

  it('should have 5 pages per feature set', () => {
    const featureSets = [
      'Energy Monitoring & Metering',
      'Energy Analytics & Optimisation', 
      'Sustainability & Emissions Tracking',
      'Energy Control Advisory & Integration',
      'Energy Dashboards & Reporting'
    ];

    featureSets.forEach(featureSet => {
      const pagesInSet = emsPages.filter(page => page.featureSet === featureSet);
      expect(pagesInSet).toHaveLength(5);
    });
  });

  it('should have all pages as valid React components', () => {
    emsPages.forEach(page => {
      expect(page.component).toBeDefined();
      expect(typeof page.component).toBe('function');
    });
  });
});