/**
 * Tests for Key Generation Utilities
 */

import {
  DefaultUniqueKeyGenerator,
  DefaultDataValidator,
  DefaultDropdownKeyManager,
  generateTenantKey,
  generateDropdownItemKeys,
  validateUniqueProperty,
  createStableKey
} from '../keyGenerationUtils';

describe('DefaultUniqueKeyGenerator', () => {
  let generator: DefaultUniqueKeyGenerator;

  beforeEach(() => {
    generator = new DefaultUniqueKeyGenerator();
  });

  describe('generateKey', () => {
    it('should use preferred property when available', () => {
      const item = { id: 'test-id', name: 'Test Name' };
      const key = generator.generateKey(item, 0, { preferredProperty: 'id' });
      expect(key).toBe('test-id');
    });

    it('should use fallback properties when preferred is not available', () => {
      const item = { name: 'Test Name', title: 'Test Title' };
      const key = generator.generateKey(item, 0, { 
        preferredProperty: 'id',
        fallbackProperties: ['name', 'title']
      });
      expect(key).toBe('Test Name');
    });

    it('should use id property as default when no preferred property specified', () => {
      const item = { id: 'default-id', name: 'Test Name' };
      const key = generator.generateKey(item, 0);
      expect(key).toBe('default-id');
    });

    it('should use index as final fallback', () => {
      const item = {};
      const key = generator.generateKey(item, 5);
      expect(key).toBe('5');
    });

    it('should add prefix when specified', () => {
      const item = { id: 'test-id' };
      const key = generator.generateKey(item, 0, { prefix: 'dropdown' });
      expect(key).toBe('dropdown-test-id');
    });

    it('should handle null/undefined items gracefully', () => {
      expect(generator.generateKey(null, 0)).toBe('0');
      expect(generator.generateKey(undefined, 1)).toBe('1');
    });
  });

  describe('validateUniqueKeys', () => {
    it('should return true for unique keys', () => {
      const items = [
        { id: 'item1' },
        { id: 'item2' },
        { id: 'item3' }
      ];
      const result = generator.validateUniqueKeys(items, 'id');
      expect(result).toBe(true);
    });

    it('should return false for duplicate keys', () => {
      const items = [
        { id: 'item1' },
        { id: 'item2' },
        { id: 'item1' } // duplicate
      ];
      const result = generator.validateUniqueKeys(items, 'id');
      expect(result).toBe(false);
    });

    it('should handle empty arrays', () => {
      const result = generator.validateUniqueKeys([], 'id');
      expect(result).toBe(true);
    });
  });
});

describe('DefaultDataValidator', () => {
  let validator: DefaultDataValidator;

  beforeEach(() => {
    validator = new DefaultDataValidator();
  });

  describe('validateTenantUniqueness', () => {
    it('should validate unique tenants', () => {
      const tenants = [
        { id: 't1', name: 'Tenant 1' },
        { id: 't2', name: 'Tenant 2' }
      ];
      const result = validator.validateTenantUniqueness(tenants);
      expect(result.isValid).toBe(true);
      expect(result.duplicates).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect duplicate tenant IDs', () => {
      const tenants = [
        { id: 't1', name: 'Tenant 1' },
        { id: 't2', name: 'Tenant 2' },
        { id: 't1', name: 'Duplicate Tenant' }
      ];
      const result = validator.validateTenantUniqueness(tenants);
      expect(result.isValid).toBe(false);
      expect(result.duplicates).toHaveLength(1);
      expect(result.duplicates[0]).toContain("Duplicate tenant ID 't1'");
    });

    it('should detect missing ID properties', () => {
      const tenants = [
        { id: 't1', name: 'Tenant 1' },
        { name: 'Tenant without ID' }
      ];
      const result = validator.validateTenantUniqueness(tenants);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("missing required 'id' property");
    });
  });
});

describe('DefaultDropdownKeyManager', () => {
  let keyManager: DefaultDropdownKeyManager;

  beforeEach(() => {
    keyManager = new DefaultDropdownKeyManager();
  });

  describe('generateDropdownKeys', () => {
    it('should generate keys for dropdown items', () => {
      const items = [
        { id: 'item1', name: 'Item 1' },
        { id: 'item2', name: 'Item 2' }
      ];
      const keys = keyManager.generateDropdownKeys(items);
      expect(keys).toEqual(['dropdown-item1', 'dropdown-item2']);
    });

    it('should handle empty arrays', () => {
      const keys = keyManager.generateDropdownKeys([]);
      expect(keys).toEqual([]);
    });
  });

  describe('ensureKeyUniqueness', () => {
    it('should keep unique keys unchanged', () => {
      const keys = ['key1', 'key2', 'key3'];
      const uniqueKeys = keyManager.ensureKeyUniqueness(keys);
      expect(uniqueKeys).toEqual(['key1', 'key2', 'key3']);
    });

    it('should make duplicate keys unique by adding suffixes', () => {
      const keys = ['key1', 'key2', 'key1', 'key3', 'key1'];
      const uniqueKeys = keyManager.ensureKeyUniqueness(keys);
      expect(uniqueKeys).toEqual(['key1', 'key2', 'key1-1', 'key3', 'key1-2']);
    });
  });
});

describe('Convenience functions', () => {
  describe('generateTenantKey', () => {
    it('should generate tenant key with prefix', () => {
      const tenant = { id: 't1', name: 'Test Tenant' };
      const key = generateTenantKey(tenant, 0);
      expect(key).toBe('tenant-t1');
    });
  });

  describe('generateDropdownItemKeys', () => {
    it('should generate keys for dropdown items', () => {
      const items = [
        { id: 'item1' },
        { id: 'item2' }
      ];
      const keys = generateDropdownItemKeys(items);
      expect(keys).toEqual(['dropdown-item1', 'dropdown-item2']);
    });
  });

  describe('validateUniqueProperty', () => {
    it('should validate unique properties', () => {
      const items = [
        { id: 'item1' },
        { id: 'item2' }
      ];
      const result = validateUniqueProperty(items, 'id');
      expect(result.isValid).toBe(true);
    });
  });

  describe('createStableKey', () => {
    it('should create stable keys', () => {
      const item = { id: 'stable-id' };
      const key1 = createStableKey(item, 0);
      const key2 = createStableKey(item, 0);
      expect(key1).toBe(key2);
      expect(key1).toBe('stable-id');
    });
  });
});