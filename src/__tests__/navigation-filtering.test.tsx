/**
 * Navigation Filtering Test
 * 
 * Tests the sector-specific navigation filtering behavior:
 * - Oil & Gas sector should show only the "Performance" feature
 * - Power (Transmission) sector should show Overview, Loss Analysis, etc. but NOT the main "Performance" feature
 */

import { describe, it, expect } from 'vitest';
import { getFilteredNavigation } from '@/lib/navigationFiltering';
import { featureAreas } from '@/data/navigation';

// Mock sectors
const oilGasSector = { 
  id: "oil-gas", 
  name: "Oil & Gas", 
  subsectors: ["Upstream", "Midstream", "Downstream"] 
};

const powerSector = { 
  id: "power", 
  name: "Power & Utilities", 
  subsectors: ["Generation", "Transmission", "Distribution"] 
};

describe('Navigation Filtering', () => {
  describe('Oil & Gas Sector', () => {
    it('should show only the Performance feature for Oil & Gas Upstream', () => {
      const filteredNavigation = getFilteredNavigation(featureAreas, oilGasSector, "Upstream");
      
      // Find the optimise area
      const optimiseArea = filteredNavigation.find(area => area.id === "optimise");
      expect(optimiseArea).toBeDefined();
      
      // Find the performance feature set
      const performanceSet = optimiseArea?.featureSets.find(set => set.id === "performance");
      expect(performanceSet).toBeDefined();
      
      // Should only have the analytical performance feature
      expect(performanceSet?.features).toHaveLength(1);
      expect(performanceSet?.features[0].name).toBe("Performance");
      expect(performanceSet?.features[0].id).toBe("performance-analytical");
      expect(performanceSet?.features[0].path).toBe("/optimise/performance");
    });
  });

  describe('Power Sector', () => {
    it('should show detailed performance features but NOT the main Performance feature for Power Transmission', () => {
      const filteredNavigation = getFilteredNavigation(featureAreas, powerSector, "Transmission");
      
      // Find the optimise area
      const optimiseArea = filteredNavigation.find(area => area.id === "optimise");
      expect(optimiseArea).toBeDefined();
      
      // Find the performance feature set
      const performanceSet = optimiseArea?.featureSets.find(set => set.id === "performance");
      expect(performanceSet).toBeDefined();
      
      // Should have 5 detailed performance features (Overview, Loss Analysis, Bottlenecks, Trends, Benchmarks)
      expect(performanceSet?.features).toHaveLength(5);
      
      // Check that it has the expected features
      const featureNames = performanceSet?.features.map(f => f.name) || [];
      expect(featureNames).toContain("Overview");
      expect(featureNames).toContain("Loss Analysis");
      expect(featureNames).toContain("Bottlenecks & Constraints");
      expect(featureNames).toContain("Trend Analysis");
      expect(featureNames).toContain("Benchmarking");
      
      // Should NOT have the main "Performance" feature
      expect(featureNames).not.toContain("Performance");
      
      // Verify the analytical performance feature is not present
      const analyticalFeature = performanceSet?.features.find(f => f.id === "performance-analytical");
      expect(analyticalFeature).toBeUndefined();
    });

    it('should show correct paths for Power Transmission performance features', () => {
      const filteredNavigation = getFilteredNavigation(featureAreas, powerSector, "Transmission");
      
      const optimiseArea = filteredNavigation.find(area => area.id === "optimise");
      const performanceSet = optimiseArea?.featureSets.find(set => set.id === "performance");
      
      // Check that all features have the correct paths
      const featurePaths = performanceSet?.features.map(f => f.path) || [];
      expect(featurePaths).toContain("/optimise/performance/overview");
      expect(featurePaths).toContain("/optimise/performance/losses");
      expect(featurePaths).toContain("/optimise/performance/bottlenecks");
      expect(featurePaths).toContain("/optimise/performance/trends");
      expect(featurePaths).toContain("/optimise/performance/benchmarks");
      
      // Should NOT have the base performance path
      expect(featurePaths).not.toContain("/optimise/performance");
    });
  });

  describe('Cross-Sector Validation', () => {
    it('should show different features for different sectors', () => {
      const oilGasNavigation = getFilteredNavigation(featureAreas, oilGasSector, "Upstream");
      const powerNavigation = getFilteredNavigation(featureAreas, powerSector, "Transmission");
      
      const oilGasPerformance = oilGasNavigation.find(area => area.id === "optimise")?.featureSets.find(set => set.id === "performance");
      const powerPerformance = powerNavigation.find(area => area.id === "optimise")?.featureSets.find(set => set.id === "performance");
      
      // Oil & Gas should have 1 feature, Power should have 5 features
      expect(oilGasPerformance?.features).toHaveLength(1);
      expect(powerPerformance?.features).toHaveLength(5);
      
      // Features should be completely different
      const oilGasFeatureIds = oilGasPerformance?.features.map(f => f.id) || [];
      const powerFeatureIds = powerPerformance?.features.map(f => f.id) || [];
      
      // No overlap between the two sets
      const intersection = oilGasFeatureIds.filter(id => powerFeatureIds.includes(id));
      expect(intersection).toHaveLength(0);
    });
  });
});