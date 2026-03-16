/**
 * Test Coverage Verification Script
 * 
 * Verifies comprehensive test coverage for the EMS Transmission system
 * Task: 59 - Final checkpoint - Complete system verification
 */

import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

interface TestCoverage {
  totalPages: number;
  testedPages: number;
  totalComponents: number;
  testedComponents: number;
  totalPropertyTests: number;
  totalIntegrationTests: number;
  totalUnitTests: number;
  missingTests: string[];
  coverage: {
    pages: number;
    components: number;
    overall: number;
  };
}

const ENERGY_PAGES_DIR = 'src/pages/energy';
const TEST_DIR = 'src/pages/energy/__tests__';
const PROPERTY_TEST_DIR = 'src/test';

function getAllFiles(dir: string, extension: string): string[] {
  const files: string[] = [];
  
  try {
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('__')) {
        files.push(...getAllFiles(fullPath, extension));
      } else if (stat.isFile() && item.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}`);
  }
  
  return files;
}

function getEnergyPages(): string[] {
  const pages = getAllFiles(ENERGY_PAGES_DIR, '.tsx');
  return pages.filter(p => 
    !p.includes('__tests__') && 
    !p.includes('components/') &&
    !p.includes('config/')
  );
}

function getTestFiles(): string[] {
  return getAllFiles(TEST_DIR, '.test.tsx').concat(
    getAllFiles(TEST_DIR, '.test.ts')
  );
}

function getPropertyTests(): string[] {
  const propertyTests = getAllFiles(PROPERTY_TEST_DIR, '.property.test.ts');
  return propertyTests.concat(
    getAllFiles(PROPERTY_TEST_DIR, '.property.test.tsx')
  );
}

function getIntegrationTests(): string[] {
  return getAllFiles(PROPERTY_TEST_DIR, '.integration.test.tsx').concat(
    getAllFiles(PROPERTY_TEST_DIR, '.integration.test.ts')
  );
}

function countTestsInFile(filePath: string): number {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const testMatches = content.match(/\b(it|test)\s*\(/g);
    return testMatches ? testMatches.length : 0;
  } catch (error) {
    return 0;
  }
}

function verifyTestCoverage(): TestCoverage {
  const energyPages = getEnergyPages();
  const testFiles = getTestFiles();
  const propertyTests = getPropertyTests();
  const integrationTests = getIntegrationTests();
  
  const missingTests: string[] = [];
  let testedPages = 0;
  
  // Check which pages have tests
  for (const page of energyPages) {
    const pageName = page.split('/').pop()?.replace('.tsx', '');
    const hasTest = testFiles.some(test => test.includes(pageName || ''));
    
    if (hasTest) {
      testedPages++;
    } else {
      missingTests.push(pageName || page);
    }
  }
  
  // Count total tests
  let totalUnitTests = 0;
  for (const testFile of testFiles) {
    totalUnitTests += countTestsInFile(testFile);
  }
  
  let totalPropertyTests = 0;
  for (const propTest of propertyTests) {
    totalPropertyTests += countTestsInFile(propTest);
  }
  
  let totalIntegrationTests = 0;
  for (const intTest of integrationTests) {
    totalIntegrationTests += countTestsInFile(intTest);
  }
  
  const pageCoverage = (testedPages / energyPages.length) * 100;
  const overallCoverage = pageCoverage; // Simplified for now
  
  return {
    totalPages: energyPages.length,
    testedPages,
    totalComponents: energyPages.length, // Simplified
    testedComponents: testedPages,
    totalPropertyTests,
    totalIntegrationTests,
    totalUnitTests,
    missingTests,
    coverage: {
      pages: Math.round(pageCoverage * 100) / 100,
      components: Math.round(pageCoverage * 100) / 100,
      overall: Math.round(overallCoverage * 100) / 100,
    },
  };
}

function printCoverageReport(coverage: TestCoverage): void {
  console.log('\n=== EMS Transmission Test Coverage Report ===\n');
  
  console.log('📊 Coverage Statistics:');
  console.log(`  Pages: ${coverage.testedPages}/${coverage.totalPages} (${coverage.coverage.pages}%)`);
  console.log(`  Components: ${coverage.testedComponents}/${coverage.totalComponents} (${coverage.coverage.components}%)`);
  console.log(`  Overall: ${coverage.coverage.overall}%\n`);
  
  console.log('🧪 Test Counts:');
  console.log(`  Unit Tests: ${coverage.totalUnitTests}`);
  console.log(`  Property Tests: ${coverage.totalPropertyTests}`);
  console.log(`  Integration Tests: ${coverage.totalIntegrationTests}`);
  console.log(`  Total Tests: ${coverage.totalUnitTests + coverage.totalPropertyTests + coverage.totalIntegrationTests}\n`);
  
  if (coverage.missingTests.length > 0) {
    console.log('⚠️  Pages Missing Tests:');
    coverage.missingTests.forEach(page => {
      console.log(`  - ${page}`);
    });
    console.log('');
  }
  
  // Determine pass/fail
  const MINIMUM_COVERAGE = 80;
  const passed = coverage.coverage.overall >= MINIMUM_COVERAGE;
  
  if (passed) {
    console.log(`✅ Test coverage meets minimum requirement (${MINIMUM_COVERAGE}%)`);
  } else {
    console.log(`❌ Test coverage below minimum requirement (${MINIMUM_COVERAGE}%)`);
    console.log(`   Current: ${coverage.coverage.overall}%`);
    console.log(`   Required: ${MINIMUM_COVERAGE}%`);
  }
  
  console.log('\n===========================================\n');
  
  process.exit(passed ? 0 : 1);
}

// Run verification
const coverage = verifyTestCoverage();
printCoverageReport(coverage);
