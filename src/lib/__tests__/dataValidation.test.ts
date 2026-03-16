/**
 * Tests for Data Validation Utilities
 */

import {
  EnhancedDataValidator,
  DropdownValidator,
  TenantValidator,
  validateTenantData,
  validateDropdownData,
  validateMenuData,
  performDataValidation,
  hasCriticalValidationIssues,
  formatValidationResult
} from '../dataValidation';

describe('EnhancedDataValidator', () => {
  let validator: EnhancedDataValidator;

  beforeEach(() => {
    validator = new EnhancedDataValidator();
  });

  describe('validateDataIntegrity', () => {
    it('should validate clean data successfully', () => {
      const data = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' }
      ];
      const result = validator.validateDataIntegrity(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect non-array input', () => {
      const result = validator.validateDataIntegrity('not an array' as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Data is not an array');
    });

    it('should warn about empty arrays', () => {
      const result = validator.validateDataIntegrity([]);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Data array is empty');
    });

    it('should detect null items', () => {
      const data = [
        { id: '1', name: 'Item 1' },
        null,
        { id: '2', name: 'Item 2' }
      ];
      const result = validator.validateDataIntegrity(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Null or undefined item at index 1');
    });

    it('should warn about inconsistent structure', () => {
      const data = [
        { id: '1', name: 'Item 1' },
        { id: '2', title: 'Item 2' } // different structure
      ];
      const result = validator.validateDataIntegrity(data);
      expect(result.warnings.some(w => w.includes('inconsistent structure'))).toBe(true);
    });
  });

  describe('validateKeyConsistency', () => {
    it('should validate consistent unique keys', () => {
      const items = [
        { id: 'key1', name: 'Item 1' },
        { id: 'key2', name: 'Item 2' }
      ];
      const result = validator.validateKeyConsistency(items, 'id');
      expect(result.isValid).toBe(true);
      expect(result.duplicates).toHaveLength(0);
    });

    it('should detect duplicate keys', () => {
      const items = [
        { id: 'key1', name: 'Item 1' },
        { id: 'key2', name: 'Item 2' },
        { id: 'key1', name: 'Duplicate Item' }
      ];
      const result = validator.validateKeyConsistency(items, 'id');
      expect(result.isValid).toBe(false);
      expect(result.duplicates).toHaveLength(1);
      expect(result.duplicates[0]).toContain("Duplicate key 'key1'");
    });

    it('should detect missing key properties', () => {
      const items = [
        { id: 'key1', name: 'Item 1' },
        { name: 'Item without ID' }
      ];
      const result = validator.validateKeyConsistency(items, 'id');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("Missing 'id' property"))).toBe(true);
    });

    it('should detect invalid key types', () => {
      const items = [
        { id: 'key1', name: 'Item 1' },
        { id: { nested: 'object' }, name: 'Item with object ID' }
      ];
      const result = validator.validateKeyConsistency(items, 'id');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("Invalid 'id' type"))).toBe(true);
    });
  });

  describe('validateRequiredProperties', () => {
    it('should validate items with all required properties', () => {
      const items = [
        { id: '1', name: 'Item 1', type: 'A' },
        { id: '2', name: 'Item 2', type: 'B' }
      ];
      const result = validator.validateRequiredProperties(items, ['id', 'name', 'type']);
      expect(result.isValid).toBe(true);
    });

    it('should detect missing required properties', () => {
      const items = [
        { id: '1', name: 'Item 1' },
        { id: '2', type: 'B' } // missing name
      ];
      const result = validator.validateRequiredProperties(items, ['id', 'name', 'type']);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("Missing required property 'name'"))).toBe(true);
      expect(result.errors.some(e => e.includes("Missing required property 'type'"))).toBe(true);
    });
  });
});

describe('DropdownValidator', () => {
  let validator: DropdownValidator;

  beforeEach(() => {
    validator = new DropdownValidator();
  });

  describe('validateDropdownItems', () => {
    it('should validate proper dropdown items', () => {
      const items = [
        { id: 'item1', name: 'Item 1' },
        { id: 'item2', name: 'Item 2' }
      ];
      const result = validator.validateDropdownItems(items);
      expect(result.isValid).toBe(true);
    });

    it('should warn about items lacking identifiers', () => {
      const items = [
        { value: 'item1' }, // no id, name, label, or title
        { value: 'item2' }
      ];
      const result = validator.validateDropdownItems(items);
      expect(result.warnings.some(w => w.includes('lack proper identifiers'))).toBe(true);
    });
  });

  describe('validateMenuStructure', () => {
    it('should validate proper menu items', () => {
      const items = [
        { id: 'menu1', name: 'Menu 1', path: '/menu1' },
        { id: 'menu2', name: 'Menu 2', href: '/menu2' }
      ];
      const result = validator.validateMenuStructure(items);
      expect(result.isValid).toBe(true);
    });

    it('should warn about items lacking action properties', () => {
      const items = [
        { id: 'menu1', name: 'Menu 1' }, // no path, href, or onClick
        { id: 'menu2', name: 'Menu 2' }
      ];
      const result = validator.validateMenuStructure(items);
      expect(result.warnings.some(w => w.includes('lack action properties'))).toBe(true);
    });
  });

  describe('validateNavigationData', () => {
    it('should validate proper navigation data', () => {
      const navigationData = {
        tenants: [
          { id: 't1', name: 'Tenant 1', industry: 'Tech' },
          { id: 't2', name: 'Tenant 2', industry: 'Finance' }
        ],
        sections: [
          { id: 's1', name: 'Section 1' },
          { id: 's2', name: 'Section 2' }
        ]
      };
      const result = validator.validateNavigationData(navigationData);
      expect(result.isValid).toBe(true);
    });

    it('should detect invalid navigation data structure', () => {
      const result = validator.validateNavigationData('not an object');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Navigation data is not an object');
    });
  });
});

describe('TenantValidator', () => {
  let validator: TenantValidator;

  beforeEach(() => {
    validator = new TenantValidator();
  });

  describe('validateTenants', () => {
    it('should validate proper tenant data', () => {
      const tenants = [
        { id: 't1', name: 'Tenant 1', industry: 'Tech', sector: 'software', subsector: 'saas' },
        { id: 't2', name: 'Tenant 2', industry: 'Finance', sector: 'banking', subsector: 'retail' }
      ];
      const result = validator.validateTenants(tenants);
      expect(result.isValid).toBe(true);
    });

    it('should detect missing required properties', () => {
      const tenants = [
        { id: 't1', name: 'Tenant 1' }, // missing industry
        { name: 'Tenant 2', industry: 'Finance' } // missing id
      ];
      const result = validator.validateTenants(tenants);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("Missing required property 'industry'"))).toBe(true);
      expect(result.errors.some(e => e.includes("Missing required property 'id'"))).toBe(true);
    });

    it('should warn about missing recommended properties', () => {
      const tenants = [
        { id: 't1', name: 'Tenant 1', industry: 'Tech' }, // missing sector, subsector
        { id: 't2', name: 'Tenant 2', industry: 'Finance' }
      ];
      const result = validator.validateTenants(tenants);
      expect(result.warnings.some(w => w.includes('missing recommended properties'))).toBe(true);
    });
  });
});

describe('Convenience functions', () => {
  describe('validateTenantData', () => {
    it('should validate tenant data', () => {
      const tenants = [
        { id: 't1', name: 'Tenant 1', industry: 'Tech' },
        { id: 't2', name: 'Tenant 2', industry: 'Finance' }
      ];
      const result = validateTenantData(tenants);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateDropdownData', () => {
    it('should validate dropdown data', () => {
      const items = [
        { id: 'item1', name: 'Item 1' },
        { id: 'item2', name: 'Item 2' }
      ];
      const result = validateDropdownData(items);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateMenuData', () => {
    it('should validate menu data', () => {
      const items = [
        { id: 'menu1', name: 'Menu 1', path: '/menu1' },
        { id: 'menu2', name: 'Menu 2', path: '/menu2' }
      ];
      const result = validateMenuData(items);
      expect(result.isValid).toBe(true);
    });
  });

  describe('performDataValidation', () => {
    it('should perform validation based on type', () => {
      const data = [
        { id: 'item1', name: 'Item 1' }
      ];
      
      const dropdownResult = performDataValidation(data, 'dropdown');
      expect(dropdownResult.isValid).toBe(true);
      
      const menuResult = performDataValidation(data, 'menu');
      expect(menuResult.isValid).toBe(true);
    });
  });

  describe('hasCriticalValidationIssues', () => {
    it('should detect critical issues', () => {
      const criticalResult = {
        isValid: false,
        duplicates: ['Duplicate found'],
        errors: ['Error found']
      };
      expect(hasCriticalValidationIssues(criticalResult)).toBe(true);
      
      const nonCriticalResult = {
        isValid: true,
        duplicates: [],
        errors: []
      };
      expect(hasCriticalValidationIssues(nonCriticalResult)).toBe(false);
    });
  });

  describe('formatValidationResult', () => {
    it('should format validation results properly', () => {
      const result = {
        isValid: false,
        duplicates: ['Duplicate key found'],
        errors: ['Missing property'],
        warnings: ['Inconsistent structure'],
        suggestions: ['Add missing properties']
      };
      
      const formatted = formatValidationResult(result);
      expect(formatted).toContain('Validation Result: INVALID');
      expect(formatted).toContain('Errors:');
      expect(formatted).toContain('Duplicates:');
      expect(formatted).toContain('Warnings:');
      expect(formatted).toContain('Suggestions:');
    });
  });
});