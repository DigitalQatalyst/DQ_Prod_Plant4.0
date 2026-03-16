/**
 * Navigation Filtering Utilities
 * 
 * This module provides utilities for filtering navigation items based on the current sector and subsector.
 * It implements sector-based visibility rules for features and feature sets.
 */

import { FeatureArea, FeatureSet, Feature, Sector } from "@/types/navigation";

/**
 * Checks if a feature should be visible for the given sector and subsector
 */
export function isFeatureVisible(feature: Feature, currentSector: Sector, currentSubsector: string): boolean {
  // If no sector hints are defined, the feature is visible to all sectors
  if (!feature.sectorHints || feature.sectorHints.length === 0) {
    return true;
  }

  // Check if current sector is in the allowed sectors
  const sectorMatch = feature.sectorHints.includes(currentSector.name);
  
  if (!sectorMatch) {
    return false;
  }

  // If subsector hints are defined, check subsector match
  if (feature.subsectorHints && feature.subsectorHints.length > 0) {
    return feature.subsectorHints.includes(currentSubsector);
  }

  // If sector matches and no subsector restrictions, show the feature
  return true;
}

/**
 * Checks if a feature set should be visible (has at least one visible feature)
 */
export function isFeatureSetVisible(featureSet: FeatureSet, currentSector: Sector, currentSubsector: string): boolean {
  return featureSet.features.some(feature => 
    isFeatureVisible(feature, currentSector, currentSubsector)
  );
}

/**
 * Checks if a feature area should be visible (has at least one visible feature set)
 */
export function isFeatureAreaVisible(featureArea: FeatureArea, currentSector: Sector, currentSubsector: string): boolean {
  return featureArea.featureSets.some(featureSet => 
    isFeatureSetVisible(featureSet, currentSector, currentSubsector)
  );
}

/**
 * Filters features within a feature set based on sector and subsector
 */
export function filterFeatures(features: Feature[], currentSector: Sector, currentSubsector: string): Feature[] {
  return features.filter(feature => 
    isFeatureVisible(feature, currentSector, currentSubsector)
  );
}

/**
 * Filters feature sets within a feature area based on sector and subsector
 */
export function filterFeatureSets(featureSets: FeatureSet[], currentSector: Sector, currentSubsector: string): FeatureSet[] {
  return featureSets
    .map(featureSet => ({
      ...featureSet,
      features: filterFeatures(featureSet.features, currentSector, currentSubsector)
    }))
    .filter(featureSet => featureSet.features.length > 0);
}

/**
 * Filters feature areas based on sector and subsector
 */
export function filterFeatureAreas(featureAreas: FeatureArea[], currentSector: Sector, currentSubsector: string): FeatureArea[] {
  return featureAreas
    .map(featureArea => ({
      ...featureArea,
      featureSets: filterFeatureSets(featureArea.featureSets, currentSector, currentSubsector)
    }))
    .filter(featureArea => featureArea.featureSets.length > 0);
}

/**
 * Gets filtered navigation structure for the current sector and subsector
 */
export function getFilteredNavigation(featureAreas: FeatureArea[], currentSector: Sector, currentSubsector: string): FeatureArea[] {
  return filterFeatureAreas(featureAreas, currentSector, currentSubsector);
}