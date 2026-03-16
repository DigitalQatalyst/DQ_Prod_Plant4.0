# Design Document

## Overview

The application is experiencing React warnings about duplicate keys, specifically with tenant ID `t3` appearing multiple times in dropdown menu components. This issue stems from duplicate tenant entries in the mock data that are being used as keys in React components. The solution involves identifying and eliminating duplicate data entries, implementing proper key generation strategies, and establishing patterns to prevent similar issues in the future.

## Architecture

The duplicate key issue affects the following architectural layers:

1. **Data Layer**: Mock data contains duplicate tenant entries with the same ID
2. **Component Layer**: Dropdown components use tenant IDs as React keys
3. **Rendering Layer**: React encounters duplicate keys during virtual DOM reconciliation

The fix will address each layer:
- Clean up duplicate data at the source
- Implement robust key generation utilities
- Add validation to prevent future duplicates

## Components and Interfaces

### Key Generation Utilities

```typescript
interface KeyGenerationOptions {
  preferredProperty?: string;
  fallbackProperties?: string[];
  prefix?: string;
}

interface UniqueKeyGenerator {
  generateKey(item: any, index: number, options?: KeyGenerationOptions): string;
  validateUniqueKeys(items: any[], keyProperty: string): boolean;
}
```

### Data Validation

```typescript
interface DataValidator {
  validateTenantUniqueness(tenants: NavigationTenant[]): ValidationResult;
  validateDropdownData(items: any[], keyProperty: string): ValidationResult;
}

interface ValidationResult {
  isValid: boolean;
  duplicates: string[];
  errors: string[];
}
```

### Component Key Management

```typescript
interface DropdownKeyManager {
  generateDropdownKeys(items: any[]): string[];
  ensureKeyUniqueness(keys: string[]): string[];
}
```

## Data Models

### Tenant Data Structure
The current tenant data structure has duplicates that need to be resolved:

```typescript
// Current problematic structure
const tenants: NavigationTenant[] = [
  ...legacyTenants,           // Contains { id: "t3", ... }
  ...uniqueUpstreamTenants,
  { id: "t1", name: "Kenya Power", industry: "Utilities" },      // Duplicate
  { id: "t2", name: "Kenya Tea", industry: "Agriculture" },      // Duplicate  
  { id: "t3", name: "Bamburi Cement", industry: "Manufacturing" }, // Duplicate
  { id: "t-upstream", name: "GulfUpstream Demo", industry: "Oil & Gas – Upstream" },
];
```

### Corrected Data Structure
```typescript
// Corrected structure with no duplicates
const tenants: NavigationTenant[] = [
  ...legacyTenants,
  ...uniqueUpstreamTenants,
  // Remove duplicate entries - they already exist in legacyTenants
];
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Property 1: Dropdown key uniqueness**
*For any* dropdown menu component, all child components should have unique keys within that dropdown
**Validates: Requirements 1.1, 1.5**

**Property 2: Component identity consistency**
*For any* component re-render cycle, components with the same data should maintain the same key
**Validates: Requirements 1.2**

**Property 3: Dropdown rendering completeness**
*For any* dropdown with multiple items, all items should be rendered without omission
**Validates: Requirements 1.4, 2.2**

**Property 4: Focus state preservation**
*For any* dropdown navigation sequence, focus and selection states should be maintained correctly
**Validates: Requirements 2.3**

**Property 5: Dynamic content key stability**
*For any* dynamically populated dropdown, keys should be based on stable item properties rather than array indices
**Validates: Requirements 2.5**

**Property 6: Stable key generation**
*For any* collection of items, generated keys should be stable across multiple generations with the same input
**Validates: Requirements 3.1**

**Property 7: Preferred property key usage**
*For any* item with unique properties, those properties should be preferred over array indices for key generation
**Validates: Requirements 3.2**

**Property 8: Composite key generation**
*For any* items lacking natural unique identifiers, composite keys should ensure uniqueness
**Validates: Requirements 3.3**

**Property 9: Conditional rendering key consistency**
*For any* conditionally rendered components, keys should remain consistent across render cycles
**Validates: Requirements 3.4**

## Error Handling

### Data Validation Errors
- **Duplicate Key Detection**: Identify and log duplicate keys in data sources
- **Missing Key Properties**: Handle cases where expected key properties are undefined
- **Invalid Key Types**: Ensure keys are strings or numbers, not objects or arrays

### Runtime Error Recovery
- **Fallback Key Generation**: Generate unique keys when primary key generation fails
- **Console Warning Suppression**: Fix underlying issues rather than suppressing warnings
- **Graceful Degradation**: Ensure UI remains functional even with key issues

### Development-Time Validation
- **Build-Time Checks**: Add validation to detect duplicate keys during development
- **Type Safety**: Use TypeScript to enforce key property requirements
- **Linting Rules**: Add ESLint rules to catch potential key issues

## Testing Strategy

### Unit Testing
- Test key generation utilities with various input scenarios
- Test data validation functions with duplicate and valid data
- Test component rendering with corrected data structures

### Property-Based Testing
Property-based tests will use **fast-check** library for TypeScript/JavaScript, configured to run a minimum of 100 iterations per test. Each test will be tagged with the format: **Feature: duplicate-key-fix, Property {number}: {property_text}**

- Generate random dropdown data and verify key uniqueness
- Test component re-rendering with various data sets
- Verify key stability across multiple generation cycles
- Test composite key generation with items lacking unique identifiers

### Integration Testing
- Test complete dropdown components with corrected data
- Verify no console warnings appear during normal usage
- Test dropdown interactions and state management

### Manual Testing
- Verify dropdown menus function correctly in browser
- Confirm no React warnings appear in console
- Test user interactions with dropdown components