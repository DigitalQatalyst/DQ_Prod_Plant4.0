/**
 * Data Validation Utilities
 * 
 * This module provides comprehensive data validation utilities for detecting
 * duplicate keys, validating data integrity, and ensuring proper component
 * identity management across the application.
 */

import { Tenant } from '@/types/navigation';
import { 
  ValidationResult, 
  DataValidator, 
  DefaultDataValidator 
} from './keyGenerationUtils';

export interface ExtendedValidationResult extends ValidationResult {
  warnings: string[];
  suggestions: string[];
}

export interface DataIntegrityValidator {
  validateDataIntegrity(data: any[]): ExtendedValidationResult;
  validateKeyConsistency(items: any[], keyProperty: string): ExtendedValidationResult;
  validateRequiredProperties(items: any[], requiredProps: string[]): ExtendedValidationResult;
}

export interface DropdownDataValidator {
  validateDropdownItems(items: any[]): ExtendedValidationResult;
  validateMenuStructure(menuItems: any[]): ExtendedValidationResult;
  validateNavigationData(navigationData: any): ExtendedValidationResult;
}

/**
 * Enhanced data validator with additional validation capabilities
 */
export class EnhancedDataValidator extends DefaultDataValidator implements DataIntegrityValidator {
  
  /**
   * Validates overall data integrity including duplicates, missing properties, and structure
   */
  validateDataIntegrity(data: any[]): ExtendedValidationResult {
    const result: ExtendedValidationResult = {
      isValid: true,
      duplicates: [],
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!Array.isArray(data)) {
      result.isValid = false;
      result.errors.push('Data is not an array');
      return result;
    }

    if (data.length === 0) {
      result.warnings.push('Data array is empty');
      return result;
    }

    // Check for null/undefined items
    const nullItems = data
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item == null);

    if (nullItems.length > 0) {
      result.isValid = false;
      nullItems.forEach(({ index }) => {
        result.errors.push(`Null or undefined item at index ${index}`);
      });
    }

    // Check for consistent object structure
    const validItems = data.filter(item => item != null && typeof item === 'object');
    if (validItems.length > 0) {
      const firstItemKeys = Object.keys(validItems[0]).sort();
      const inconsistentItems = validItems
        .map((item, index) => ({ item, index, keys: Object.keys(item).sort() }))
        .filter(({ keys }) => JSON.stringify(keys) !== JSON.stringify(firstItemKeys));

      if (inconsistentItems.length > 0) {
        result.warnings.push(`Found ${inconsistentItems.length} items with inconsistent structure`);
        inconsistentItems.slice(0, 3).forEach(({ index, keys }) => {
          result.warnings.push(`Item at index ${index} has keys: [${keys.join(', ')}]`);
        });
        
        if (inconsistentItems.length > 3) {
          result.warnings.push(`... and ${inconsistentItems.length - 3} more items`);
        }
      }
    }

    return result;
  }

  /**
   * Validates that keys are consistent and unique across items
   */
  validateKeyConsistency(items: any[], keyProperty: string): ExtendedValidationResult {
    const result: ExtendedValidationResult = {
      isValid: true,
      duplicates: [],
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!Array.isArray(items)) {
      result.isValid = false;
      result.errors.push('Items is not an array');
      return result;
    }

    const keyValues = new Map<string, number[]>();
    const missingKeyItems: number[] = [];
    const invalidKeyItems: number[] = [];

    items.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        result.errors.push(`Invalid item at index ${index}: not an object`);
        result.isValid = false;
        return;
      }

      if (!(keyProperty in item)) {
        missingKeyItems.push(index);
        return;
      }

      const keyValue = item[keyProperty];
      if (keyValue == null) {
        missingKeyItems.push(index);
        return;
      }

      if (typeof keyValue !== 'string' && typeof keyValue !== 'number') {
        invalidKeyItems.push(index);
        result.isValid = false;
        return;
      }

      const keyString = String(keyValue);
      if (!keyValues.has(keyString)) {
        keyValues.set(keyString, []);
      }
      keyValues.get(keyString)!.push(index);
    });

    // Report missing keys
    if (missingKeyItems.length > 0) {
      result.isValid = false;
      result.errors.push(`Missing '${keyProperty}' property at indices: [${missingKeyItems.join(', ')}]`);
    }

    // Report invalid key types
    if (invalidKeyItems.length > 0) {
      result.isValid = false;
      result.errors.push(`Invalid '${keyProperty}' type at indices: [${invalidKeyItems.join(', ')}]`);
    }

    // Report duplicates
    keyValues.forEach((indices, key) => {
      if (indices.length > 1) {
        result.isValid = false;
        result.duplicates.push(`Duplicate key '${key}' found at indices: [${indices.join(', ')}]`);
      }
    });

    // Provide suggestions
    if (result.duplicates.length > 0) {
      result.suggestions.push('Consider using composite keys or adding unique suffixes to resolve duplicates');
    }

    if (missingKeyItems.length > 0) {
      result.suggestions.push(`Ensure all items have a valid '${keyProperty}' property`);
    }

    return result;
  }

  /**
   * Validates that items have all required properties
   */
  validateRequiredProperties(items: any[], requiredProps: string[]): ExtendedValidationResult {
    const result: ExtendedValidationResult = {
      isValid: true,
      duplicates: [],
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!Array.isArray(items)) {
      result.isValid = false;
      result.errors.push('Items is not an array');
      return result;
    }

    if (!Array.isArray(requiredProps) || requiredProps.length === 0) {
      result.warnings.push('No required properties specified');
      return result;
    }

    const missingPropsMap = new Map<string, number[]>();

    items.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        result.errors.push(`Invalid item at index ${index}: not an object`);
        result.isValid = false;
        return;
      }

      requiredProps.forEach(prop => {
        if (!(prop in item) || item[prop] == null) {
          if (!missingPropsMap.has(prop)) {
            missingPropsMap.set(prop, []);
          }
          missingPropsMap.get(prop)!.push(index);
        }
      });
    });

    // Report missing properties
    missingPropsMap.forEach((indices, prop) => {
      result.isValid = false;
      result.errors.push(`Missing required property '${prop}' at indices: [${indices.join(', ')}]`);
    });

    if (missingPropsMap.size > 0) {
      result.suggestions.push('Ensure all items have the required properties defined');
    }

    return result;
  }
}

/**
 * Specialized validator for dropdown and menu data
 */
export class DropdownValidator implements DropdownDataValidator {
  private dataValidator: EnhancedDataValidator;

  constructor() {
    this.dataValidator = new EnhancedDataValidator();
  }

  /**
   * Validates dropdown items for common issues
   */
  validateDropdownItems(items: any[]): ExtendedValidationResult {
    const result: ExtendedValidationResult = {
      isValid: true,
      duplicates: [],
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Basic data integrity check
    const integrityResult = this.dataValidator.validateDataIntegrity(items);
    this.mergeResults(result, integrityResult);

    if (!result.isValid) {
      return result;
    }

    // Check for common dropdown properties
    const commonProps = ['id', 'name', 'label', 'title'];
    const hasIdentifier = items.every(item => 
      commonProps.some(prop => item && typeof item === 'object' && item[prop] != null)
    );

    if (!hasIdentifier) {
      result.warnings.push('Some dropdown items may lack proper identifiers (id, name, label, or title)');
      result.suggestions.push('Ensure each dropdown item has at least one identifying property');
    }

    // Validate key uniqueness using id as primary key
    const keyResult = this.dataValidator.validateKeyConsistency(items, 'id');
    this.mergeResults(result, keyResult);

    return result;
  }

  /**
   * Validates menu structure for navigation components
   */
  validateMenuStructure(menuItems: any[]): ExtendedValidationResult {
    const result: ExtendedValidationResult = {
      isValid: true,
      duplicates: [],
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Validate basic structure
    const dropdownResult = this.validateDropdownItems(menuItems);
    this.mergeResults(result, dropdownResult);

    // Check for menu-specific properties
    const menuProps = ['path', 'href', 'onClick'];
    const hasAction = menuItems.every(item => 
      item && typeof item === 'object' && 
      menuProps.some(prop => item[prop] != null)
    );

    if (!hasAction) {
      result.warnings.push('Some menu items may lack action properties (path, href, or onClick)');
      result.suggestions.push('Ensure each menu item has a way to handle user interaction');
    }

    return result;
  }

  /**
   * Validates navigation data structure
   */
  validateNavigationData(navigationData: any): ExtendedValidationResult {
    const result: ExtendedValidationResult = {
      isValid: true,
      duplicates: [],
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!navigationData || typeof navigationData !== 'object') {
      result.isValid = false;
      result.errors.push('Navigation data is not an object');
      return result;
    }

    // Validate tenants if present
    if (navigationData.tenants) {
      const tenantResult = this.dataValidator.validateTenantUniqueness(navigationData.tenants);
      this.mergeResults(result, tenantResult);
    }

    // Validate sections if present
    if (navigationData.sections && Array.isArray(navigationData.sections)) {
      const sectionsResult = this.validateDropdownItems(navigationData.sections);
      this.mergeResults(result, sectionsResult);
    }

    return result;
  }

  /**
   * Helper method to merge validation results
   */
  private mergeResults(target: ExtendedValidationResult, source: ValidationResult | ExtendedValidationResult): void {
    if (!source.isValid) {
      target.isValid = false;
    }
    
    target.duplicates.push(...source.duplicates);
    target.errors.push(...source.errors);
    
    if ('warnings' in source) {
      target.warnings.push(...source.warnings);
    }
    
    if ('suggestions' in source) {
      target.suggestions.push(...source.suggestions);
    }
  }
}

/**
 * Tenant-specific validation utilities
 */
export class TenantValidator {
  private dataValidator: EnhancedDataValidator;

  constructor() {
    this.dataValidator = new EnhancedDataValidator();
  }

  /**
   * Comprehensive tenant data validation
   */
  validateTenants(tenants: Tenant[]): ExtendedValidationResult {
    const result: ExtendedValidationResult = {
      isValid: true,
      duplicates: [],
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Basic tenant uniqueness validation
    const uniquenessResult = this.dataValidator.validateTenantUniqueness(tenants);
    this.mergeResults(result, uniquenessResult);

    // Validate required tenant properties
    const requiredProps = ['id', 'name', 'industry'];
    const propsResult = this.dataValidator.validateRequiredProperties(tenants, requiredProps);
    this.mergeResults(result, propsResult);

    // Check for recommended properties
    const recommendedProps = ['sector', 'subsector'];
    const missingRecommended = tenants.filter(tenant => 
      !recommendedProps.some(prop => tenant[prop as keyof Tenant])
    );

    if (missingRecommended.length > 0) {
      result.warnings.push(`${missingRecommended.length} tenants missing recommended properties (sector, subsector)`);
      result.suggestions.push('Consider adding sector and subsector information for better categorization');
    }

    return result;
  }

  /**
   * Helper method to merge validation results
   */
  private mergeResults(target: ExtendedValidationResult, source: ValidationResult | ExtendedValidationResult): void {
    if (!source.isValid) {
      target.isValid = false;
    }
    
    target.duplicates.push(...source.duplicates);
    target.errors.push(...source.errors);
    
    if ('warnings' in source) {
      target.warnings.push(...source.warnings);
    }
    
    if ('suggestions' in source) {
      target.suggestions.push(...source.suggestions);
    }
  }
}

// Convenience functions for common validation scenarios

/**
 * Validates tenant data for duplicate keys and missing properties
 */
export function validateTenantData(tenants: Tenant[]): ExtendedValidationResult {
  const validator = new TenantValidator();
  return validator.validateTenants(tenants);
}

/**
 * Validates dropdown data for React component usage
 */
export function validateDropdownData(items: any[]): ExtendedValidationResult {
  const validator = new DropdownValidator();
  return validator.validateDropdownItems(items);
}

/**
 * Validates menu structure for navigation components
 */
export function validateMenuData(menuItems: any[]): ExtendedValidationResult {
  const validator = new DropdownValidator();
  return validator.validateMenuStructure(menuItems);
}

/**
 * Performs comprehensive data validation with detailed reporting
 */
export function performDataValidation(data: any[], type: 'tenant' | 'dropdown' | 'menu' = 'dropdown'): ExtendedValidationResult {
  switch (type) {
    case 'tenant':
      return validateTenantData(data as Tenant[]);
    case 'menu':
      return validateMenuData(data);
    case 'dropdown':
    default:
      return validateDropdownData(data);
  }
}

/**
 * Checks if validation result indicates critical issues that should prevent rendering
 */
export function hasCriticalValidationIssues(result: ValidationResult): boolean {
  return !result.isValid && (result.duplicates.length > 0 || result.errors.length > 0);
}

/**
 * Formats validation result for console logging
 */
export function formatValidationResult(result: ExtendedValidationResult): string {
  const lines: string[] = [];
  
  lines.push(`Validation Result: ${result.isValid ? 'VALID' : 'INVALID'}`);
  
  if (result.errors.length > 0) {
    lines.push('Errors:');
    result.errors.forEach(error => lines.push(`  - ${error}`));
  }
  
  if (result.duplicates.length > 0) {
    lines.push('Duplicates:');
    result.duplicates.forEach(duplicate => lines.push(`  - ${duplicate}`));
  }
  
  if (result.warnings.length > 0) {
    lines.push('Warnings:');
    result.warnings.forEach(warning => lines.push(`  - ${warning}`));
  }
  
  if (result.suggestions.length > 0) {
    lines.push('Suggestions:');
    result.suggestions.forEach(suggestion => lines.push(`  - ${suggestion}`));
  }
  
  return lines.join('\n');
}