/**
 * Key Generation Utilities for React Components
 * 
 * This module provides utilities for generating unique, stable keys for React components,
 * particularly for dropdown menus and list components. It implements the interfaces
 * defined in the design document to ensure proper component identity management.
 */

export interface KeyGenerationOptions {
  preferredProperty?: string;
  fallbackProperties?: string[];
  prefix?: string;
}

export interface ValidationResult {
  isValid: boolean;
  duplicates: string[];
  errors: string[];
}

export interface UniqueKeyGenerator {
  generateKey(item: any, index: number, options?: KeyGenerationOptions): string;
  validateUniqueKeys(items: any[], keyProperty: string): boolean;
}

export interface DataValidator {
  validateTenantUniqueness(tenants: any[]): ValidationResult;
  validateDropdownData(items: any[], keyProperty: string): ValidationResult;
}

export interface DropdownKeyManager {
  generateDropdownKeys(items: any[]): string[];
  ensureKeyUniqueness(keys: string[]): string[];
}

/**
 * Default implementation of UniqueKeyGenerator
 */
export class DefaultUniqueKeyGenerator implements UniqueKeyGenerator {
  /**
   * Generates a unique key for an item, preferring stable properties over array indices
   * 
   * @param item - The item to generate a key for
   * @param index - The array index (used as fallback)
   * @param options - Key generation options
   * @returns A unique string key
   */
  generateKey(item: any, index: number, options: KeyGenerationOptions = {}): string {
    const { preferredProperty, fallbackProperties = [], prefix = '' } = options;
    
    // Try preferred property first
    if (preferredProperty && item && typeof item === 'object' && item[preferredProperty] != null) {
      const value = item[preferredProperty];
      if (typeof value === 'string' || typeof value === 'number') {
        return prefix ? `${prefix}-${value}` : String(value);
      }
    }
    
    // Try fallback properties
    for (const prop of fallbackProperties) {
      if (item && typeof item === 'object' && item[prop] != null) {
        const value = item[prop];
        if (typeof value === 'string' || typeof value === 'number') {
          return prefix ? `${prefix}-${value}` : String(value);
        }
      }
    }
    
    // If item has an id property, use it
    if (item && typeof item === 'object' && item.id != null) {
      const value = item.id;
      if (typeof value === 'string' || typeof value === 'number') {
        return prefix ? `${prefix}-${value}` : String(value);
      }
    }
    
    // Create composite key from multiple properties if available
    if (item && typeof item === 'object') {
      const keyParts: string[] = [];
      
      // Try common identifying properties
      const identifyingProps = ['name', 'title', 'label', 'key'];
      for (const prop of identifyingProps) {
        if (item[prop] != null) {
          const value = item[prop];
          if (typeof value === 'string' || typeof value === 'number') {
            keyParts.push(String(value));
            break; // Use first available identifying property
          }
        }
      }
      
      if (keyParts.length > 0) {
        const compositeKey = keyParts.join('-');
        return prefix ? `${prefix}-${compositeKey}` : compositeKey;
      }
    }
    
    // Final fallback to index
    return prefix ? `${prefix}-${index}` : String(index);
  }

  /**
   * Validates that all items have unique keys when using the specified property
   * 
   * @param items - Array of items to validate
   * @param keyProperty - Property to use as key
   * @returns True if all keys are unique
   */
  validateUniqueKeys(items: any[], keyProperty: string): boolean {
    if (!Array.isArray(items)) return true;
    
    const keys = new Set<string>();
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const key = this.generateKey(item, i, { preferredProperty: keyProperty });
      
      if (keys.has(key)) {
        return false;
      }
      keys.add(key);
    }
    
    return true;
  }
}

/**
 * Default implementation of DataValidator
 */
export class DefaultDataValidator implements DataValidator {
  /**
   * Validates that tenant data has unique identifiers
   * 
   * @param tenants - Array of tenant objects
   * @returns Validation result with details about duplicates
   */
  validateTenantUniqueness(tenants: any[]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      duplicates: [],
      errors: []
    };
    
    if (!Array.isArray(tenants)) {
      result.isValid = false;
      result.errors.push('Tenants data is not an array');
      return result;
    }
    
    const seenIds = new Map<string, number>();
    
    tenants.forEach((tenant, index) => {
      if (!tenant || typeof tenant !== 'object') {
        result.errors.push(`Invalid tenant at index ${index}: not an object`);
        result.isValid = false;
        return;
      }
      
      if (!tenant.id) {
        result.errors.push(`Tenant at index ${index} missing required 'id' property`);
        result.isValid = false;
        return;
      }
      
      const id = String(tenant.id);
      if (seenIds.has(id)) {
        result.duplicates.push(`Duplicate tenant ID '${id}' found at indices ${seenIds.get(id)} and ${index}`);
        result.isValid = false;
      } else {
        seenIds.set(id, index);
      }
    });
    
    return result;
  }

  /**
   * Validates dropdown data for unique keys
   * 
   * @param items - Array of dropdown items
   * @param keyProperty - Property to use as key
   * @returns Validation result
   */
  validateDropdownData(items: any[], keyProperty: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      duplicates: [],
      errors: []
    };
    
    if (!Array.isArray(items)) {
      result.isValid = false;
      result.errors.push('Items data is not an array');
      return result;
    }
    
    const seenKeys = new Map<string, number>();
    const keyGenerator = new DefaultUniqueKeyGenerator();
    
    items.forEach((item, index) => {
      const key = keyGenerator.generateKey(item, index, { preferredProperty: keyProperty });
      
      if (seenKeys.has(key)) {
        result.duplicates.push(`Duplicate key '${key}' found at indices ${seenKeys.get(key)} and ${index}`);
        result.isValid = false;
      } else {
        seenKeys.set(key, index);
      }
    });
    
    return result;
  }
}

/**
 * Default implementation of DropdownKeyManager
 */
export class DefaultDropdownKeyManager implements DropdownKeyManager {
  private keyGenerator: UniqueKeyGenerator;
  
  constructor(keyGenerator?: UniqueKeyGenerator) {
    this.keyGenerator = keyGenerator || new DefaultUniqueKeyGenerator();
  }
  
  /**
   * Generates keys for all items in a dropdown
   * 
   * @param items - Array of dropdown items
   * @returns Array of unique keys
   */
  generateDropdownKeys(items: any[]): string[] {
    if (!Array.isArray(items)) return [];
    
    return items.map((item, index) => 
      this.keyGenerator.generateKey(item, index, { 
        preferredProperty: 'id',
        fallbackProperties: ['name', 'title', 'label'],
        prefix: 'dropdown'
      })
    );
  }
  
  /**
   * Ensures all keys in the array are unique by appending suffixes if needed
   * 
   * @param keys - Array of keys that may contain duplicates
   * @returns Array of unique keys
   */
  ensureKeyUniqueness(keys: string[]): string[] {
    const uniqueKeys: string[] = [];
    const keyCount = new Map<string, number>();
    
    keys.forEach(key => {
      const count = keyCount.get(key) || 0;
      keyCount.set(key, count + 1);
      
      if (count === 0) {
        uniqueKeys.push(key);
      } else {
        uniqueKeys.push(`${key}-${count}`);
      }
    });
    
    return uniqueKeys;
  }
}

// Convenience functions for common use cases

/**
 * Generates a unique key for a tenant object
 */
export function generateTenantKey(tenant: any, index: number): string {
  const keyGenerator = new DefaultUniqueKeyGenerator();
  return keyGenerator.generateKey(tenant, index, {
    preferredProperty: 'id',
    fallbackProperties: ['name'],
    prefix: 'tenant'
  });
}

/**
 * Generates unique keys for dropdown menu items
 */
export function generateDropdownItemKeys(items: any[]): string[] {
  const keyManager = new DefaultDropdownKeyManager();
  return keyManager.generateDropdownKeys(items);
}

/**
 * Validates that an array of objects has unique values for a given property
 */
export function validateUniqueProperty(items: any[], property: string): ValidationResult {
  const validator = new DefaultDataValidator();
  return validator.validateDropdownData(items, property);
}

/**
 * Creates a stable key from an object using multiple fallback strategies
 */
export function createStableKey(item: any, index: number, options?: KeyGenerationOptions): string {
  const keyGenerator = new DefaultUniqueKeyGenerator();
  return keyGenerator.generateKey(item, index, options);
}