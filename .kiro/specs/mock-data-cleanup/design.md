# Mock Data Cleanup Design Document

## Overview

This design outlines the approach to clean up and reorganize the mock data file structure to resolve TypeScript compilation errors, improve maintainability, and ensure type safety. The solution involves restructuring imports, organizing data by domain, and implementing proper type safety measures.

## Architecture

The mock data will be restructured using a modular approach:

```
src/data/
├── mockData.ts (main export file)
├── domains/
│   ├── navigation/
│   │   ├── assets.ts
│   │   ├── tenants.ts
│   │   └── discovery.ts
│   ├── security/
│   │   ├── alerts.ts
│   │   ├── users.ts
│   │   └── compliance.ts
│   ├── sectors/
│   │   ├── oil-gas/
│   │   ├── power/
│   │   └── fmcg/
│   └── performance/
│       ├── panels.ts
│       ├── losses.ts
│       └── bottlenecks.ts
└── utils/
    ├── generators.ts
    └── factories.ts
```

## Components and Interfaces

### 1. Import Resolution System
- **Purpose**: Resolve duplicate imports and type conflicts
- **Implementation**: Use type aliases and namespace imports
- **Key Functions**:
  - `resolveTypeConflicts()`: Identify and resolve naming conflicts
  - `consolidateImports()`: Merge duplicate import statements

### 2. Domain-Specific Data Modules
- **Navigation Domain**: Assets, tenants, discovery jobs
- **Security Domain**: Alerts, users, compliance data
- **Sector-Specific Domain**: Oil & Gas, Power, FMCG specific data
- **Performance Domain**: Performance panels, losses, bottlenecks

### 3. Data Factory System
- **Purpose**: Generate consistent mock data using factory patterns
- **Key Components**:
  - `AssetFactory`: Generate asset mock data
  - `UserFactory`: Generate user mock data
  - `AlertFactory`: Generate alert mock data

## Data Models

### Core Type Aliases
```typescript
// Resolve naming conflicts with aliases
import { 
  Asset as NavigationAsset, 
  AssetType as NavigationAssetType,
  Tenant as NavigationTenant 
} from "@/types/navigation";

import { 
  Asset as SecurityAsset, 
  User as SecurityUser,
  Tenant as SecurityTenant 
} from "@/types/security";
```

### Unified Export Interface
```typescript
export interface MockDataExports {
  // Navigation data
  assets: NavigationAsset[];
  tenants: NavigationTenant[];
  assetTypes: NavigationAssetType[];
  
  // Security data
  securityAlerts: SecurityAlert[];
  users: SecurityUser[];
  
  // Performance data
  performancePanels: PerformancePanel[];
  losses: Loss[];
  bottlenecks: Bottleneck[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Import Uniqueness
*For any* TypeScript file, all imported identifiers should be unique within the file scope, preventing duplicate identifier compilation errors
**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Type Conformance
*For any* mock data object, it should conform to its declared TypeScript interface, ensuring type safety at compile time
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Referential Integrity
*For any* related mock data entities (e.g., assets and tenants), foreign key relationships should reference existing entities
**Validates: Requirements 2.5**

### Property 4: Modular Organization
*For any* domain-specific mock data, it should be organized in its appropriate domain module, maintaining clear separation of concerns
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 5: Interface Consistency
*For any* mock data structure, it should use the correct interface from the appropriate type definition file
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

## Error Handling

### Import Conflict Resolution
- Detect duplicate imports using AST analysis
- Automatically generate unique aliases for conflicting types
- Provide clear error messages for unresolvable conflicts

### Type Validation
- Implement runtime type checking for critical mock data
- Validate required properties are present
- Ensure enum values are valid

### Data Integrity Checks
- Validate foreign key relationships
- Check for circular dependencies
- Ensure data consistency across modules

## Testing Strategy

### Unit Testing
- Test individual data factory functions
- Validate type conformance for each mock data object
- Test import resolution utilities

### Property-Based Testing
- Use fast-check library for property-based testing
- Generate random data and validate it conforms to interfaces
- Test referential integrity with randomly generated relationships
- Minimum 100 iterations per property test
- Each property test tagged with: **Feature: mock-data-cleanup, Property {number}: {property_text}**

### Integration Testing
- Test complete mock data loading and export
- Validate all modules can be imported without conflicts
- Test data relationships across domain boundaries