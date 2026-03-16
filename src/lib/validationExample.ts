/**
 * Example usage of data validation utilities
 * 
 * This file demonstrates how to use the validation utilities to detect
 * and resolve duplicate key issues in the application data.
 */

import { tenants } from '@/data/mockData';
import { 
  validateTenantData, 
  validateDropdownData, 
  performDataValidation,
  hasCriticalValidationIssues,
  formatValidationResult
} from './dataValidation';

/**
 * Example function to validate tenant data and log results
 */
export function validateApplicationTenants() {
  console.log('🔍 Validating tenant data...');
  
  const result = validateTenantData(tenants);
  
  if (hasCriticalValidationIssues(result)) {
    console.error('❌ Critical validation issues found:');
    console.error(formatValidationResult(result));
  } else if (result.warnings.length > 0) {
    console.warn('⚠️ Validation warnings:');
    console.warn(formatValidationResult(result));
  } else {
    console.log('✅ Tenant data validation passed');
  }
  
  return result;
}

/**
 * Example function to validate dropdown data
 */
export function validateDropdownItems(items: any[], itemType: string = 'dropdown') {
  console.log(`🔍 Validating ${itemType} items...`);
  
  const result = validateDropdownData(items);
  
  if (hasCriticalValidationIssues(result)) {
    console.error(`❌ Critical validation issues found in ${itemType}:`);
    console.error(formatValidationResult(result));
  } else if (result.warnings.length > 0) {
    console.warn(`⚠️ Validation warnings for ${itemType}:`);
    console.warn(formatValidationResult(result));
  } else {
    console.log(`✅ ${itemType} validation passed`);
  }
  
  return result;
}

/**
 * Example function to validate all application data
 */
export function validateAllApplicationData() {
  console.log('🚀 Starting comprehensive data validation...');
  
  const results = {
    tenants: validateApplicationTenants(),
    // Add more data validations as needed
  };
  
  const hasAnyCriticalIssues = Object.values(results).some(hasCriticalValidationIssues);
  
  if (hasAnyCriticalIssues) {
    console.error('❌ Application has critical data validation issues that should be resolved');
  } else {
    console.log('✅ All application data validation checks passed');
  }
  
  return results;
}

/**
 * Development-time validation helper
 */
export function runDevelopmentValidation() {
  if (process.env.NODE_ENV === 'development') {
    return validateAllApplicationData();
  }
  return null;
}

// Example usage in development
if (process.env.NODE_ENV === 'development') {
  // This will run during development to help catch data issues early
  setTimeout(() => {
    runDevelopmentValidation();
  }, 1000);
}