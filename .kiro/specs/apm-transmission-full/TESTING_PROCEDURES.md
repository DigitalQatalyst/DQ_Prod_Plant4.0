# APM Power Transmission - Testing Procedures

## Overview

This document describes the testing procedures for the APM Power Transmission system. The testing strategy includes unit tests, integration tests, property-based tests, and manual testing procedures.

## Testing Philosophy

### Test Pyramid

```
        /\
       /  \      E2E Tests (Manual)
      /____\
     /      \    Integration Tests
    /________\
   /          \  Unit Tests
  /____________\
 /              \ Property-Based Tests
/________________\
```

### Testing Principles

1. **Property-Based Testing First**: Validate universal correctness properties
2. **Unit Tests for Examples**: Test specific scenarios and edge cases
3. **Integration Tests for Workflows**: Test end-to-end user workflows
4. **Manual Testing for UX**: Verify user experience and visual consistency

## Test Environment Setup

### Prerequisites

1. **Node.js**: Version 18 or higher
2. **Vitest**: Test runner (already configured)
3. **Supabase**: Local or cloud instance with test data
4. **Environment Variables**: Set in `.env.development`

```bash
VITE_SUPABASE_URL=your_test_supabase_url
VITE_SUPABASE_ANON_KEY=your_test_anon_key
```

### Test Data Setup

Before running tests, ensure test data is seeded:

```bash
# Seed all feature sets
npm run seed:fs-all

# Or use PowerShell
.\scripts\seed-fs-all.ps1
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test src/test/apm-basic-verification.test.ts

# Run tests with coverage
npm run test:coverage
```

## Property-Based Testing

### What is Property-Based Testing?

Property-based testing validates that universal properties hold across all possible inputs, rather than testing specific examples.

**Example:**
```typescript
// Instead of testing specific values:
expect(add(2, 3)).toBe(5);
expect(add(10, 20)).toBe(30);

// Test the universal property:
fc.assert(
  fc.property(fc.integer(), fc.integer(), (a, b) => {
    return add(a, b) === add(b, a); // Commutative property
  })
);
```

### Property Test Structure

All property tests follow this structure:

```typescript
import { describe, it } from 'vitest';
import * as fc from 'fast-check';

describe('Property: [Property Name]', () => {
  it('should validate [requirement]', () => {
    fc.assert(
      fc.property(
        // Generators
        fc.record({
          field1: fc.string(),
          field2: fc.integer({ min: 0, max: 100 })
        }),
        // Test function
        (input) => {
          const result = functionUnderTest(input);
          return result.satisfiesProperty();
        }
      ),
      { numRuns: 100 } // Run 100 random test cases
    );
  });
});
```

### Property Test Catalog

#### FS4: Asset Inventory & Criticality

**Property 1: Asset Natural Key Uniqueness**
- **Validates**: Requirements 27.2
- **Property**: No two assets can have the same (sector, name, location) or asset_tag
- **Location**: `src/test/properties/asset-natural-key.property.test.ts`

**Property 2: Asset Relationship Referential Integrity**
- **Validates**: Requirements 1.4, 1.8
- **Property**: All asset relationships reference existing assets
- **Location**: `src/test/properties/asset-relationships.property.test.ts`

**Property 3: FMEA RPN Calculation**
- **Validates**: Requirements 3.4
- **Property**: RPN always equals severity × occurrence × detection
- **Location**: `src/test/properties/fmea-rpn.property.test.ts`

**Property 4: FMEA Natural Key Uniqueness**
- **Validates**: Requirements 3.2
- **Property**: No two FMEA entries can have the same (asset_type, failure_mode)
- **Location**: `src/test/properties/fmea-uniqueness.property.test.ts`

**Property 5: FMEA Rating Bounds**
- **Validates**: Requirements 3.3
- **Property**: Severity, occurrence, detection are always 1-10
- **Location**: `src/test/properties/fmea-bounds.property.test.ts`

**Property 6: Spare Part Quantity Non-Negative**
- **Validates**: Requirements 5.7
- **Property**: quantity_required is always >= 0
- **Location**: `src/test/properties/spare-parts.property.test.ts`

**Property 7: Lifecycle Stage Validity**
- **Validates**: Requirements 4.4
- **Property**: lifecycle_stage is always a valid stage
- **Location**: `src/test/properties/lifecycle.property.test.ts`

**Property 8: Criticality Tier Validity**
- **Validates**: Requirements 2.1, 2.4
- **Property**: criticality is always Critical, Important, or Standard
- **Location**: `src/test/properties/criticality.property.test.ts`

#### FS1: Asset Health & Diagnostics

**Property 9: Telemetry Status Classification**
- **Validates**: Requirements 7.3, 7.4, 7.5
- **Property**: Status is Normal/Warning/Critical based on thresholds
- **Location**: `src/test/properties/telemetry-status.property.test.ts`

**Property 10: Health Score Bounds**
- **Validates**: Requirements 8.1
- **Property**: Health score is always 0-100
- **Location**: `src/test/properties/health-score-bounds.property.test.ts`

**Property 11: Diagnostic Event State Transitions**
- **Validates**: Requirements 9.4, 9.7, 9.8
- **Property**: State transitions follow open → ack → closed
- **Location**: `src/test/properties/diagnostic-state.property.test.ts`

**Property 12: Diagnostic Event Resolution Notes Required**
- **Validates**: Requirements 9.8
- **Property**: Closed events always have resolution_notes
- **Location**: `src/test/properties/diagnostic-resolution.property.test.ts`

**Property 13: RCA Event Linkage Validity**
- **Validates**: Requirements 10.3
- **Property**: All RCA records link to valid events
- **Location**: `src/test/properties/rca-linkage.property.test.ts`

**Property 14: Parameter Mapping Completeness**
- **Validates**: Requirements 6.10
- **Property**: Each asset_type has >= 10 mapped parameters
- **Location**: `src/test/properties/parameter-mapping.property.test.ts`

#### FS3: Asset Performance & Utilisation

**Property 15: Downtime Duration Consistency**
- **Validates**: Requirements 12.6
- **Property**: duration_minutes equals (end_time - start_time) in minutes
- **Location**: `src/test/properties/downtime-duration.property.test.ts`

**Property 16: Downtime Time Ordering**
- **Validates**: Requirements 12.5
- **Property**: start_time is always before end_time
- **Location**: `src/test/properties/downtime-ordering.property.test.ts`

**Property 17: Downtime Non-Overlap**
- **Validates**: Requirements 12.9
- **Property**: No overlapping downtime periods per asset
- **Location**: `src/test/properties/downtime-overlap.property.test.ts`

**Property 18: MTBF Calculation**
- **Validates**: Requirements 13.1
- **Property**: MTBF calculation is correct
- **Location**: `src/test/properties/mtbf.property.test.ts`

**Property 19: Availability Calculation**
- **Validates**: Requirements 13.3
- **Property**: Availability = (uptime / total_time) × 100
- **Location**: `src/test/properties/availability.property.test.ts`

**Property 20: Load Factor Calculation**
- **Validates**: Requirements 14.2
- **Property**: Load factor = (average_load / rated_capacity) × 100
- **Location**: `src/test/properties/load-factor.property.test.ts`

**Property 21: Thermal Headroom Calculation**
- **Validates**: Requirements 14.3
- **Property**: Thermal headroom = (rated - current) / rated × 100
- **Location**: `src/test/properties/thermal-headroom.property.test.ts`

**Property 22: Reliability Period Non-Overlap**
- **Validates**: Requirements 13.6
- **Property**: No overlapping reliability periods per asset
- **Location**: `src/test/properties/reliability-overlap.property.test.ts`

#### FS2: Predictive & Prescriptive Maintenance

**Property 23: Failure Probability Bounds**
- **Validates**: Requirements 16.1
- **Property**: Failure probability is always 0-100
- **Location**: `src/test/properties/failure-probability.property.test.ts`

**Property 24: Prediction Confidence Bounds**
- **Validates**: Requirements 16.1
- **Property**: Confidence is always 0-100
- **Location**: `src/test/properties/prediction-confidence.property.test.ts`

**Property 25: Prediction Horizon Validity**
- **Validates**: Requirements 16.2
- **Property**: time_horizon_days is always 7, 30, or 90
- **Location**: `src/test/properties/prediction-horizon.property.test.ts`

**Property 26: Risk Level Classification**
- **Validates**: Requirements 16.3
- **Property**: risk_level is always low, medium, high, or critical
- **Location**: `src/test/properties/risk-level.property.test.ts`

**Property 27: CBM Trigger Condition Operator Validity**
- **Validates**: Requirements 17.2
- **Property**: condition_operator is always valid
- **Location**: `src/test/properties/cbm-operator.property.test.ts`

**Property 28: Recommendation Priority Score Bounds**
- **Validates**: Requirements 18.3
- **Property**: priority_score is always 0-100
- **Location**: `src/test/properties/recommendation-priority.property.test.ts`

**Property 29: Recommendation Asset Validity**
- **Validates**: Requirements 18.5
- **Property**: All recommendations reference valid assets
- **Location**: `src/test/properties/recommendation-asset.property.test.ts`

**Property 30: Recommendation Spare Parts Validity**
- **Validates**: Requirements 18.5
- **Property**: All required_spares reference valid spare parts
- **Location**: `src/test/properties/recommendation-spares.property.test.ts`

**Property 31: Recommendation Closure Notes Required**
- **Validates**: Requirements 18.8
- **Property**: Completed/cancelled recommendations have completion_notes
- **Location**: `src/test/properties/recommendation-closure.property.test.ts`

#### FS5: Alerts, Reports & Visualisation

**Property 32: Alert Severity Validity**
- **Validates**: Requirements 20.2
- **Property**: severity is always info, warning, critical, or emergency
- **Location**: `src/test/properties/alert-severity.property.test.ts`

**Property 33: Alert Source Validity**
- **Validates**: Requirements 20.1
- **Property**: source is always telemetry, diagnostic, prediction, or manual
- **Location**: `src/test/properties/alert-source.property.test.ts`

**Property 34: Alert State Transitions**
- **Validates**: Requirements 20.4, 20.7, 20.8
- **Property**: State transitions follow open → ack → closed
- **Location**: `src/test/properties/alert-state.property.test.ts`

**Property 35: Alert Closure Notes Required**
- **Validates**: Requirements 20.8
- **Property**: Closed alerts always have resolution_notes
- **Location**: `src/test/properties/alert-closure.property.test.ts`

**Property 36: Alert History State Transition Recording**
- **Validates**: Requirements 21.5
- **Property**: State changes are recorded in alert_history
- **Location**: `src/test/properties/alert-history.property.test.ts`

**Property 37: Export Job State Validity**
- **Validates**: Requirements 24.4
- **Property**: status is always queued, processing, completed, or failed
- **Location**: `src/test/properties/export-status.property.test.ts`

**Property 38: Dashboard Widget Query Validity**
- **Validates**: Requirements 22.7
- **Property**: All widget query_template_ref are valid
- **Location**: `src/test/properties/dashboard-widget.property.test.ts`

#### Cross-Cutting Properties

**Property 39: Sector Enforcement for Transmission Assets**
- **Validates**: Requirements 1.2, 25.7
- **Property**: All transmission assets have sector='power_transmission'
- **Location**: `src/test/properties/sector-enforcement.property.test.ts`

**Property 40: Natural Key Uniqueness - Assets**
- **Validates**: Requirements 27.2
- **Property**: No duplicate natural keys in assets
- **Location**: `src/test/properties/asset-natural-key.property.test.ts`

**Property 41: Natural Key Uniqueness - FMEA**
- **Validates**: Requirements 3.2
- **Property**: No duplicate natural keys in FMEA
- **Location**: `src/test/properties/fmea-uniqueness.property.test.ts`

**Property 42: Foreign Key Referential Integrity**
- **Validates**: Requirements 27.3
- **Property**: All foreign keys reference existing records
- **Location**: `src/test/properties/foreign-key-integrity.property.test.ts`

**Property 43: Timestamp Ordering in Time Series**
- **Validates**: Requirements 4.6, 7.7, 21.3
- **Property**: Timestamps are in chronological order
- **Location**: `src/test/properties/timestamp-ordering.property.test.ts`

**Property 44: Pagination Consistency**
- **Validates**: Requirements 1.10, 28.6
- **Property**: Pagination returns consistent results
- **Location**: `src/test/properties/pagination.property.test.ts`

**Property 45: RLS Sector Filtering**
- **Validates**: Requirements 25.2, 25.5
- **Property**: Users only see data from their sector
- **Location**: `src/test/properties/rls-sector.property.test.ts`

**Property 46: Existing Tenant Context Adherence**
- **Validates**: Requirements 31.1, 31.3
- **Property**: All queries respect tenant context
- **Location**: `src/test/properties/tenant-context.property.test.ts`

### Running Property Tests

```bash
# Run all property tests
npm test -- --grep "Property:"

# Run specific property test
npm test src/test/properties/health-score-bounds.property.test.ts

# Run with more iterations for thorough testing
npm test -- --grep "Property:" --runs 1000
```

### Handling Property Test Failures

When a property test fails:

1. **Review the counterexample**: The test will output the failing input
2. **Reproduce manually**: Create a unit test with the failing input
3. **Fix the implementation**: Correct the code to handle the case
4. **Re-run the property test**: Verify the fix

**Example:**
```typescript
// Property test fails with counterexample:
// Input: { score: 101 }

// Create unit test to reproduce
it('should reject health scores > 100', () => {
  expect(() => createHealthScore({ score: 101 })).toThrow();
});

// Fix implementation
function createHealthScore(data) {
  if (data.score < 0 || data.score > 100) {
    throw new Error('Health score must be 0-100');
  }
  // ...
}
```

## Unit Testing

### Unit Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Component/Function Name', () => {
  beforeEach(() => {
    // Setup
  });

  it('should handle normal case', () => {
    // Arrange
    const input = createTestInput();
    
    // Act
    const result = functionUnderTest(input);
    
    // Assert
    expect(result).toBe(expectedValue);
  });

  it('should handle edge case', () => {
    // Test edge case
  });

  it('should handle error case', () => {
    // Test error handling
  });
});
```

### Unit Test Categories

#### 1. Data Validation Tests

Test data validation logic:

```typescript
describe('Asset Validation', () => {
  it('should reject invalid asset types', () => {
    expect(() => validateAsset({ asset_type: 'invalid' })).toThrow();
  });

  it('should accept valid transmission asset types', () => {
    expect(() => validateAsset({ asset_type: 'power_transformer' })).not.toThrow();
  });
});
```

#### 2. Calculation Tests

Test calculation logic:

```typescript
describe('MTBF Calculation', () => {
  it('should calculate MTBF correctly', () => {
    const result = calculateMTBF({
      operatingHours: 1000,
      failureCount: 5
    });
    expect(result).toBe(200); // 1000 / 5
  });

  it('should handle zero failures', () => {
    const result = calculateMTBF({
      operatingHours: 1000,
      failureCount: 0
    });
    expect(result).toBe(Infinity);
  });
});
```

#### 3. Component Tests

Test React components:

```typescript
import { render, screen } from '@testing-library/react';

describe('AssetCard', () => {
  it('should render asset name', () => {
    render(<AssetCard asset={mockAsset} />);
    expect(screen.getByText('Transformer T1')).toBeInTheDocument();
  });

  it('should display criticality badge', () => {
    render(<AssetCard asset={{ ...mockAsset, criticality: 'Critical' }} />);
    expect(screen.getByText('Critical')).toHaveClass('badge-critical');
  });
});
```

#### 4. Hook Tests

Test custom React hooks:

```typescript
import { renderHook, waitFor } from '@testing-library/react';

describe('useAssets', () => {
  it('should fetch assets', async () => {
    const { result } = renderHook(() => useAssets({ sector: 'power_transmission' }));
    
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.data.length).toBeGreaterThan(0);
    });
  });

  it('should handle errors', async () => {
    // Mock error
    const { result } = renderHook(() => useAssets({ sector: 'invalid' }));
    
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });
});
```

### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run specific test file
npm test src/lib/__tests__/apmAssetTypeMapping.test.ts

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Integration Testing

### Integration Test Structure

Integration tests verify end-to-end workflows across multiple components.

```typescript
describe('Integration: Asset Health Workflow', () => {
  it('should display asset health from database', async () => {
    // 1. Seed test data
    const asset = await createTestAsset();
    await createTestTelemetry(asset.id);
    await createTestHealthScore(asset.id);
    
    // 2. Render component
    render(<HealthScoringPage />);
    
    // 3. Verify data is displayed
    await waitFor(() => {
      expect(screen.getByText(asset.name)).toBeInTheDocument();
      expect(screen.getByText(/Health Score: \d+/)).toBeInTheDocument();
    });
  });
});
```

### Integration Test Catalog

#### FS4 Integration Tests

- **Asset List and Detail**: Navigate from list to detail view
- **FMEA Lookup**: View asset and see applicable FMEA entries
- **Spare Parts Linkage**: View asset and see linked spare parts

#### FS1 Integration Tests

- **Telemetry to Health Score**: Telemetry updates trigger health score recalculation
- **Diagnostic Event Creation**: Threshold violation creates diagnostic event
- **RCA Workflow**: Create diagnostic event, acknowledge, close with RCA

#### FS3 Integration Tests

- **Downtime to Reliability**: Downtime events update reliability metrics
- **Performance Benchmarking**: Compare asset performance to benchmarks
- **Utilisation Monitoring**: Display utilisation metrics with thresholds

#### FS2 Integration Tests

- **CBM Trigger Firing**: Telemetry threshold triggers maintenance recommendation
- **Failure Prediction to Recommendation**: High failure probability creates recommendation
- **Recommendation Workflow**: Create, acknowledge, schedule, close recommendation

#### FS5 Integration Tests

- **Alert Generation**: Diagnostic event creates alert
- **Alert Timeline**: Display unified timeline of alerts, events, downtime
- **Dashboard Rendering**: Load dashboard and execute widget queries
- **Report Generation**: Generate report and verify output
- **Data Export**: Create export job and download file

### Running Integration Tests

```bash
# Run all integration tests
npm test -- --grep "Integration:"

# Run specific integration test
npm test src/test/apm-final-integration.test.ts
```

## Performance Testing

### Performance Test Structure

```typescript
describe('Performance: Asset List Query', () => {
  it('should return results within 300ms', async () => {
    const startTime = performance.now();
    
    const { data } = await supabase
      .from('assets')
      .select('*')
      .eq('sector', 'power_transmission')
      .limit(20);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(300);
    expect(data.length).toBeGreaterThan(0);
  });
});
```

### Performance Benchmarks

| Operation | Target | Measured |
|-----------|--------|----------|
| Asset list query | < 300ms | ✅ |
| Telemetry 30-day query | < 2s | ✅ |
| Health score computation | < 500ms | ✅ |
| Alert list query | < 300ms | ✅ |
| Dashboard load | < 1s | ✅ |

### Running Performance Tests

```bash
# Run performance tests
npm test src/test/apm-asset-query-performance.test.ts
npm test src/test/apm-telemetry-query-performance.test.ts
```

## Manual Testing

### Manual Test Checklist

#### Navigation and Layout

- [ ] All pages accessible from navigation
- [ ] Breadcrumbs work correctly
- [ ] Back button works
- [ ] Page titles are correct
- [ ] Loading states display
- [ ] Empty states display when no data
- [ ] Error states display on failures

#### FS4: Asset Inventory & Criticality

- [ ] Asset list displays with filters
- [ ] Asset detail view shows all information
- [ ] Asset relationships display correctly
- [ ] FMEA entries display for asset type
- [ ] Spare parts display with critical flag
- [ ] Lifecycle events display chronologically
- [ ] Criticality badge displays correctly

#### FS1: Asset Health & Diagnostics

- [ ] Latest telemetry displays with status colors
- [ ] Telemetry time series chart renders
- [ ] Health score displays with breakdown
- [ ] Diagnostic events list with filters
- [ ] Acknowledge event works
- [ ] Close event requires resolution notes
- [ ] RCA records display correctly
- [ ] Degradation trends chart renders

#### FS3: Asset Performance & Utilisation

- [ ] Downtime events list with filters
- [ ] Reliability KPIs display correctly
- [ ] MTBF, MTTR, Availability calculated correctly
- [ ] Utilisation metrics display
- [ ] Load curves render
- [ ] Performance deviations list
- [ ] Benchmark comparison displays

#### FS2: Predictive & Prescriptive Maintenance

- [ ] Failure predictions display with risk levels
- [ ] RUL estimation displays
- [ ] CBM triggers list
- [ ] Maintenance recommendations list
- [ ] Acknowledge recommendation works
- [ ] Schedule recommendation works
- [ ] Close recommendation requires notes
- [ ] Priority scoring displays

#### FS5: Alerts, Reports & Visualisation

- [ ] Alerts list with severity filters
- [ ] Acknowledge alert works
- [ ] Close alert requires notes
- [ ] Alert timeline displays chronologically
- [ ] Dashboard list displays
- [ ] Dashboard loads with widgets
- [ ] Report generation works
- [ ] Export job creates and downloads

### Manual Testing Procedure

1. **Setup**: Ensure test data is seeded
2. **Login**: Login with test user
3. **Navigate**: Go through each page systematically
4. **Interact**: Click buttons, fill forms, submit data
5. **Verify**: Check data displays correctly
6. **Test Errors**: Try invalid inputs, check error messages
7. **Test Permissions**: Try actions without required role
8. **Document**: Record any issues found

### Browser Testing

Test in multiple browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Responsive Testing

Test at different screen sizes:

- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

## RLS Testing

### RLS Test Procedure

1. **Create test users with different roles**
2. **Login as each user**
3. **Verify read access**:
   - Can see own tenant's data
   - Cannot see other tenant's data
4. **Verify write access**:
   - Can perform authorized operations
   - Cannot perform unauthorized operations
5. **Check audit logs**:
   - All write operations logged
   - User and role recorded

### RLS Test Cases

#### Test Case 1: Read Access

```typescript
describe('RLS: Read Access', () => {
  it('should allow authenticated users to read transmission assets', async () => {
    // Login as authenticated user
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('sector', 'power_transmission');
    
    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);
  });

  it('should not allow cross-tenant access', async () => {
    // Login as tenant1 user
    const { data } = await supabase
      .from('assets')
      .select('*')
      .eq('tenant_id', 'tenant2');
    
    expect(data.length).toBe(0); // Should not see tenant2 data
  });
});
```

#### Test Case 2: Write Access

```typescript
describe('RLS: Write Access', () => {
  it('should allow operations_engineer to acknowledge alerts', async () => {
    // Login as operations_engineer
    const { error } = await supabase
      .from('alerts')
      .update({ state: 'ack', acknowledged_by: userId })
      .eq('id', alertId);
    
    expect(error).toBeNull();
  });

  it('should not allow operations_engineer to close alerts', async () => {
    // Login as operations_engineer
    const { error } = await supabase
      .from('alerts')
      .update({ state: 'closed', closed_by: userId })
      .eq('id', alertId);
    
    expect(error).toBeDefined();
    expect(error.code).toBe('42501'); // Insufficient privilege
  });
});
```

## Continuous Integration

### CI Pipeline

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v2
```

### Pre-commit Hooks

```bash
# .husky/pre-commit
#!/bin/sh
npm test -- --run
npm run lint
```

## Test Coverage

### Coverage Targets

- **Overall**: > 80%
- **Critical paths**: > 90%
- **Utility functions**: > 95%

### Generating Coverage Report

```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/index.html
```

### Coverage Report Interpretation

- **Green**: Well-tested code
- **Yellow**: Partially tested code
- **Red**: Untested code

Focus on covering:
1. Critical business logic
2. Data validation
3. Error handling
4. State transitions

## Troubleshooting Tests

### Issue: Tests fail with "Cannot connect to Supabase"

**Solution:**
1. Check `.env.development` has correct Supabase URL and key
2. Verify Supabase instance is running
3. Check network connectivity

### Issue: Tests fail with "No data found"

**Solution:**
1. Ensure test data is seeded: `npm run seed:fs-all`
2. Check database has data: `node scripts/verify-all-fs-data.js`
3. Verify RLS policies allow access

### Issue: Property tests fail intermittently

**Solution:**
1. Review the counterexample
2. Check for race conditions
3. Increase timeout if needed
4. Fix the implementation to handle edge cases

### Issue: Tests are slow

**Solution:**
1. Use local Supabase for faster tests
2. Reduce number of property test runs
3. Mock external dependencies
4. Run tests in parallel

## Best Practices

### 1. Write Tests First (TDD)

Write tests before implementation to ensure testability.

### 2. Keep Tests Independent

Each test should be independent and not rely on other tests.

### 3. Use Descriptive Test Names

```typescript
// Good
it('should reject health scores greater than 100', () => {});

// Bad
it('test1', () => {});
```

### 4. Test One Thing Per Test

Each test should verify one specific behavior.

### 5. Use Arrange-Act-Assert Pattern

```typescript
it('should calculate MTBF correctly', () => {
  // Arrange
  const input = { operatingHours: 1000, failureCount: 5 };
  
  // Act
  const result = calculateMTBF(input);
  
  // Assert
  expect(result).toBe(200);
});
```

### 6. Clean Up After Tests

```typescript
afterEach(async () => {
  // Clean up test data
  await deleteTestData();
});
```

### 7. Mock External Dependencies

```typescript
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}));
```

## Test Maintenance

### When to Update Tests

- When requirements change
- When bugs are found
- When refactoring code
- When adding new features

### Test Review Checklist

- [ ] Tests cover all requirements
- [ ] Tests are independent
- [ ] Tests are fast
- [ ] Tests are readable
- [ ] Tests use appropriate assertions
- [ ] Tests handle edge cases
- [ ] Tests handle error cases

## Conclusion

Following these testing procedures ensures the APM Power Transmission system is reliable, maintainable, and meets all requirements. Regular testing catches issues early and provides confidence in the system's correctness.

For questions or issues with testing, contact the development team.
