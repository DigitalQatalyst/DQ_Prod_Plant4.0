#!/usr/bin/env node

/**
 * EMS Mock-Only Operation Validation Script
 * 
 * This script validates that all EMS pages operate exclusively with mock data
 * and do not make any backend API calls.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// EMS page files to validate
const emsPageFiles = [
  'src/pages/energy/EnergyMonitoringRealTime.tsx',
  'src/pages/energy/EnergyMonitoringSubMetering.tsx',
  'src/pages/energy/EnergyMonitoringPowerQuality.tsx',
  'src/pages/energy/EnergyMonitoringBaselineTrends.tsx',
  'src/pages/energy/EnergyMonitoringMultiFluid.tsx',
  'src/pages/energy/EnergyAnalyticsEfficiencyKPIs.tsx',
  'src/pages/energy/EnergyAnalyticsLoadProfiling.tsx',
  'src/pages/energy/EnergyAnalyticsPeakDemand.tsx',
  'src/pages/energy/EnergyAnalyticsWasteDetection.tsx',
  'src/pages/energy/EnergyAnalyticsAIOptimisation.tsx',
  'src/pages/energy/EnergySustainabilityCarbonCalculation.tsx',
  'src/pages/energy/EnergySustainabilityEnergyIntensity.tsx',
  'src/pages/energy/EnergySustainabilityRenewables.tsx',
  'src/pages/energy/EnergySustainabilityESGReporting.tsx',
  'src/pages/energy/EnergySustainabilityCompliance.tsx',
  'src/pages/energy/EnergyControlLoadBalancing.tsx',
  'src/pages/energy/EnergyControlDemandResponse.tsx',
  'src/pages/energy/EnergyControlAssetModes.tsx',
  'src/pages/energy/EnergyControlIntegration.tsx',
  'src/pages/energy/EnergyControlEfficiencyCurves.tsx',
  'src/pages/energy/EnergyDashboardsCustom.tsx',
  'src/pages/energy/EnergyDashboardsPeriodComparison.tsx',
  'src/pages/energy/EnergyDashboardsCostAnalysis.tsx',
  'src/pages/energy/EnergyDashboardsAnomalies.tsx',
  'src/pages/energy/EnergyDashboardsAuditReports.tsx'
];

// Patterns that indicate API calls
const apiCallPatterns = [
  /\bfetch\s*\(/,
  /\baxios\./,
  /XMLHttpRequest/,
  /\bapi\./,
  /\/api\//,
  /https?:\/\/(?!localhost)/
];

// More specific HTTP method patterns (excluding Map methods)
const httpMethodPatterns = [
  /(?<!Map\s*\(\s*\)\s*\.)(?<!map\s*\.)(?<!Map\.)(?<!\.)\bget\s*\(\s*['"`]/,
  /(?<!Map\s*\(\s*\)\s*\.)(?<!map\s*\.)(?<!Map\.)(?<!\.)\bpost\s*\(\s*['"`]/,
  /(?<!Map\s*\(\s*\)\s*\.)(?<!map\s*\.)(?<!Map\.)(?<!\.)\bput\s*\(\s*['"`]/,
  /(?<!Map\s*\(\s*\)\s*\.)(?<!map\s*\.)(?<!Map\.)(?<!\.)\bdelete\s*\(\s*['"`]/,
  /(?<!Map\s*\(\s*\)\s*\.)(?<!map\s*\.)(?<!Map\.)(?<!\.)\bpatch\s*\(\s*['"`]/
];

// Patterns that indicate proper mock data usage
const mockDataPatterns = [
  /import.*mockData/,
  /import.*upstreamMockData/,
  /from ['"]@\/data\/mockData['"]/,
  /upstreamEnergyMeters/,
  /upstreamSubmeters/,
  /upstreamPowerQuality/,
  /upstreamEnergyAnomalies/,
  /upstreamControllableLoads/,
  /upstreamGeneratorUpsRenewable/,
  /upstreamDemandResponseSignals/,
  /upstreamReportTemplates/,
  /upstreamExportJobs/,
  /upstreamProductionContext/,
  /upstreamAssetModes/,
  /upstreamEfficiencyCurves/
];

function validateFile(filePath) {
  const fullPath = path.resolve(__dirname, '../../', filePath);
  
  if (!fs.existsSync(fullPath)) {
    return {
      file: filePath,
      exists: false,
      errors: [`File does not exist: ${filePath}`],
      warnings: [],
      mockDataUsage: false
    };
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  
  const errors = [];
  const warnings = [];
  let mockDataUsage = false;

  // Check for API call patterns
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();
    
    // Skip comments
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*')) {
      return;
    }
    
    // Skip lines with Map.get() or similar data structure methods
    if (/\.(get|set|has|delete)\s*\(/.test(line) && !/\bfetch\b|\baxios\b|\bapi\b/.test(line)) {
      return;
    }
    
    apiCallPatterns.forEach(pattern => {
      if (pattern.test(line)) {
        errors.push(`Line ${lineNumber}: Potential API call detected: ${line.trim()}`);
      }
    });
    
    httpMethodPatterns.forEach(pattern => {
      if (pattern.test(line)) {
        errors.push(`Line ${lineNumber}: Potential HTTP method call detected: ${line.trim()}`);
      }
    });
  });

  // Check for mock data usage
  mockDataPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      mockDataUsage = true;
    }
  });

  // Check for useEffect hooks that might contain API calls
  const useEffectMatches = content.match(/useEffect\s*\(/g);
  if (useEffectMatches && useEffectMatches.length > 0) {
    warnings.push(`File contains ${useEffectMatches.length} useEffect hook(s) - verify no API calls inside`);
  }

  return {
    file: filePath,
    exists: true,
    errors,
    warnings,
    mockDataUsage
  };
}

function validateMockDataFile() {
  const mockDataPath = path.resolve(__dirname, '../../src/data/mockData.ts');
  
  if (!fs.existsSync(mockDataPath)) {
    return {
      exists: false,
      errors: ['Mock data file does not exist'],
      datasets: []
    };
  }

  const content = fs.readFileSync(mockDataPath, 'utf8');
  
  // Check for required datasets
  const requiredDatasets = [
    'upstreamEnergyMeters',
    'upstreamSubmeters',
    'upstreamPowerQuality',
    'upstreamEnergyAnomalies',
    'upstreamControllableLoads',
    'upstreamGeneratorUpsRenewable',
    'upstreamDemandResponseSignals',
    'upstreamReportTemplates',
    'upstreamExportJobs',
    'upstreamProductionContext',
    'upstreamAssetModes',
    'upstreamEfficiencyCurves'
  ];

  const foundDatasets = [];
  const missingDatasets = [];

  requiredDatasets.forEach(dataset => {
    if (content.includes(`export const ${dataset}`)) {
      foundDatasets.push(dataset);
    } else {
      missingDatasets.push(dataset);
    }
  });

  return {
    exists: true,
    errors: missingDatasets.map(ds => `Missing dataset: ${ds}`),
    datasets: foundDatasets,
    totalDatasets: requiredDatasets.length,
    foundCount: foundDatasets.length
  };
}

function main() {
  console.log('🔍 EMS Mock-Only Operation Validation');
  console.log('=====================================\n');

  // Validate mock data file
  console.log('📊 Validating Mock Data File...');
  const mockDataValidation = validateMockDataFile();
  
  if (!mockDataValidation.exists) {
    console.log('❌ Mock data file validation failed:');
    mockDataValidation.errors.forEach(error => console.log(`   - ${error}`));
    process.exit(1);
  }

  console.log(`✅ Mock data file exists with ${mockDataValidation.foundCount}/${mockDataValidation.totalDatasets} required datasets`);
  
  if (mockDataValidation.errors.length > 0) {
    console.log('⚠️  Missing datasets:');
    mockDataValidation.errors.forEach(error => console.log(`   - ${error}`));
  }

  console.log('\n📄 Validating EMS Page Files...');
  
  let totalFiles = 0;
  let validFiles = 0;
  let filesWithErrors = 0;
  let filesWithMockData = 0;
  const allErrors = [];
  const allWarnings = [];

  emsPageFiles.forEach(filePath => {
    const result = validateFile(filePath);
    totalFiles++;

    if (!result.exists) {
      console.log(`❌ ${filePath} - File not found`);
      filesWithErrors++;
      allErrors.push(...result.errors);
      return;
    }

    if (result.errors.length > 0) {
      console.log(`❌ ${filePath} - ${result.errors.length} error(s)`);
      result.errors.forEach(error => console.log(`   - ${error}`));
      filesWithErrors++;
      allErrors.push(...result.errors);
    } else {
      console.log(`✅ ${filePath} - No API calls detected`);
      validFiles++;
    }

    if (result.mockDataUsage) {
      filesWithMockData++;
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
      allWarnings.push(...result.warnings);
    }
  });

  // Summary
  console.log('\n📋 Validation Summary');
  console.log('====================');
  console.log(`Total EMS files checked: ${totalFiles}`);
  console.log(`Files without API calls: ${validFiles}`);
  console.log(`Files with potential API calls: ${filesWithErrors}`);
  console.log(`Files using mock data: ${filesWithMockData}`);
  console.log(`Total errors: ${allErrors.length}`);
  console.log(`Total warnings: ${allWarnings.length}`);

  // Validation results
  if (filesWithErrors === 0 && mockDataValidation.errors.length === 0) {
    console.log('\n🎉 All validations passed! EMS operates in mock-only mode.');
    process.exit(0);
  } else {
    console.log('\n❌ Validation failed. Please fix the issues above.');
    process.exit(1);
  }
}

main();