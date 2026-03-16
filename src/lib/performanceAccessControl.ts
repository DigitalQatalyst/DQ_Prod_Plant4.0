/**
 * Performance Access Control Utilities
 * 
 * This module provides utilities for controlling access to performance features
 * based on the currently selected sector and subsector.
 */

import { Sector } from "@/types/navigation";

/**
 * Checks if the current sector has access to detailed performance features
 * Detailed performance features are available to Power & Utilities sector users
 */
export function hasDetailedPerformanceAccess(sector: Sector): boolean {
  return sector.name === 'Power & Utilities';
}

/**
 * Checks if the current sector should show the original performance page
 * Original performance page is shown for Oil & Gas sector
 */
export function hasOriginalPerformanceAccess(sector: Sector): boolean {
  return sector.name === 'Oil & Gas';
}

/**
 * Checks if the current sector is Power & Utilities sector
 */
export function isPowerSector(sector: Sector): boolean {
  return sector.name === 'Power & Utilities';
}

/**
 * Checks if the current sector is Oil & Gas sector
 */
export function isOilGasSector(sector: Sector): boolean {
  return sector.name === 'Oil & Gas';
}

/**
 * Error thrown when a sector doesn't have access to performance features
 */
export class PerformanceAccessError extends Error {
  constructor(sectorName: string, feature: string) {
    super(`Sector ${sectorName} does not have access to performance feature: ${feature}`);
    this.name = 'PerformanceAccessError';
  }
}

/**
 * Validates that a sector has detailed performance access and throws an error if not
 */
export function validateDetailedPerformanceAccess(sector: Sector, feature: string): void {
  if (!hasDetailedPerformanceAccess(sector)) {
    throw new PerformanceAccessError(sector.name, feature);
  }
}

/**
 * Validates that a sector has original performance access and throws an error if not
 */
export function validateOriginalPerformanceAccess(sector: Sector, feature: string): void {
  if (!hasOriginalPerformanceAccess(sector)) {
    throw new PerformanceAccessError(sector.name, feature);
  }
}