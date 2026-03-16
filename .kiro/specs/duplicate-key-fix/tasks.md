# Implementation Plan

- [x] 1. Fix duplicate tenant data in mockData.ts
  - Remove duplicate tenant entries that are causing the React key warning
  - Ensure tenant array contains only unique entries
  - Verify no other duplicate data exists in mock data files
  - _Requirements: 1.1, 1.3_

- [x] 1.5 Fix TypeScript compilation errors in mockData.ts




  - Fix missing export for upstreamAssetTypes causing import errors in AssetCatalog.tsx
  - Resolve type mismatches between security and navigation Asset types
  - Fix missing properties in data objects (status, policies, violations, etc.)
  - Correct property names and types to match interface definitions
  - Ensure all imported modules are properly re-exported
  - Resolve all 112 TypeScript compilation errors in mockData.ts
  - _Requirements: 1.1, 1.3_

- [ ]* 1.1 Write property test for tenant data uniqueness
  - **Property 1: Dropdown key uniqueness**
  - **Validates: Requirements 1.1, 1.5**



- [x] 2. Create key generation utilities



  - Implement UniqueKeyGenerator interface with robust key generation logic
  - Add support for preferred properties and fallback strategies
  - Create utility functions for dropdown key management
  - _Requirements: 3.1, 3.2, 3.3_

- [ ]* 2.1 Write property test for key generation stability
  - **Property 6: Stable key generation**
  - **Validates: Requirements 3.1**

- [ ]* 2.2 Write property test for preferred property usage
  - **Property 7: Preferred property key usage**
  - **Validates: Requirements 3.2**

- [ ]* 2.3 Write property test for composite key generation
  - **Property 8: Composite key generation**
  - **Validates: Requirements 3.3**

- [x] 3. Add data validation functions




  - Implement DataValidator interface to detect duplicate keys
  - Add validation for tenant data and dropdown data
  - Create validation utilities that can be used across the application
  - _Requirements: 1.1, 1.5_

- [ ]* 3.1 Write unit tests for data validation functions
  - Test duplicate detection with various data scenarios
  - Test validation error reporting
  - _Requirements: 1.1, 1.5_

- [ ] 4. Update dropdown components to use improved key generation
  - Modify TopBar component to use new key generation utilities
  - Update SectorSelector and SubsectorSelector components
  - Ensure all dropdown menu items have unique, stable keys
  - _Requirements: 1.2, 1.4, 2.2_

- [ ]* 4.1 Write property test for component identity consistency
  - **Property 2: Component identity consistency**
  - **Validates: Requirements 1.2**

- [ ]* 4.2 Write property test for dropdown rendering completeness
  - **Property 3: Dropdown rendering completeness**
  - **Validates: Requirements 1.4, 2.2**

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Add development-time validation
  - Create build-time checks to detect duplicate keys
  - Add TypeScript types to enforce key property requirements
  - Implement console warnings for development environment
  - _Requirements: 3.5_

- [ ]* 6.1 Write unit tests for development validation
  - Test build-time duplicate detection
  - Test TypeScript type enforcement
  - _Requirements: 3.5_

- [ ] 7. Test dropdown interactions and state management
  - Verify focus and selection states work correctly
  - Test dynamic content scenarios
  - Ensure conditional rendering maintains key consistency
  - _Requirements: 2.3, 2.5, 3.4_

- [ ]* 7.1 Write property test for focus state preservation
  - **Property 4: Focus state preservation**
  - **Validates: Requirements 2.3**

- [ ]* 7.2 Write property test for dynamic content key stability
  - **Property 5: Dynamic content key stability**
  - **Validates: Requirements 2.5**

- [ ]* 7.3 Write property test for conditional rendering consistency
  - **Property 9: Conditional rendering key consistency**
  - **Validates: Requirements 3.4**

- [ ] 8. Final verification and cleanup
  - Run application and verify no React key warnings appear
  - Test all dropdown components for proper functionality
  - Clean up any temporary code or console logs
  - _Requirements: 1.3, 2.1_

- [ ]* 8.1 Write integration tests for complete dropdown functionality
  - Test complete user workflows with dropdown components
  - Verify no console warnings during normal usage
  - _Requirements: 1.3, 2.1_

- [ ] 9. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.