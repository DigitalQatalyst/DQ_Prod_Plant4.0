// Manual test to verify sector-specific modal functionality
import { getSectorSpecificModalContent } from '../sectorModalUtils';

console.log('=== Testing Sector-Specific Modal Content Generation ===\n');

// Test 1: Cross-sector SIM issue
console.log('1. Cross-sector SIM Issue:');
const crossSectorSIM = getSectorSpecificModalContent('sim-issue', '', '');
console.log(`Title: ${crossSectorSIM.data.title}`);
console.log(`Fields count: ${crossSectorSIM.data.fields.length}`);
console.log(`Required fields: ${crossSectorSIM.data.fields.filter(f => f.required).map(f => f.name).join(', ')}\n`);

// Test 2: Upstream SIM issue
console.log('2. Upstream SIM Issue:');
const upstreamSIM = getSectorSpecificModalContent('sim-issue', 'Oil & Gas', 'Upstream');
console.log(`Title: ${upstreamSIM.data.title}`);
console.log(`Fields count: ${upstreamSIM.data.fields.length}`);
console.log(`Sector-specific fields: ${upstreamSIM.data.fields.filter(f => f.name.includes('wells') || f.name.includes('production')).map(f => f.name).join(', ')}`);
const categoryField = upstreamSIM.data.fields.find(f => f.name === 'category');
console.log(`Category options: ${categoryField?.options?.join(', ')}\n`);

// Test 3: Transmission CI Project
console.log('3. Transmission CI Project:');
const transmissionCI = getSectorSpecificModalContent('ci-project', 'Power', 'Transmission');
console.log(`Title: ${transmissionCI.data.title}`);
console.log(`Fields count: ${transmissionCI.data.fields.length}`);
const projectTypeField = transmissionCI.data.fields.find(f => f.name === 'projectType');
console.log(`Project type options: ${projectTypeField?.options?.join(', ')}\n`);

// Test 4: FMCG Optimization Scenario
console.log('4. FMCG Optimization Scenario:');
const fmcgOpt = getSectorSpecificModalContent('optimization-scenario', 'FMCG', 'Food & Beverage');
console.log(`Title: ${fmcgOpt.data.title}`);
console.log(`Fields count: ${fmcgOpt.data.fields.length}`);
const optCategoryField = fmcgOpt.data.fields.find(f => f.name === 'category');
console.log(`Category options: ${optCategoryField?.options?.join(', ')}\n`);

console.log('=== All tests completed successfully! ===');

// Verify that all modal types work
const modalTypes: Array<'sim-issue' | 'ci-project' | 'optimization-scenario'> = ['sim-issue', 'ci-project', 'optimization-scenario'];
const sectors = [
  { sector: '', subsector: '' },
  { sector: 'Oil & Gas', subsector: 'Upstream' },
  { sector: 'Power', subsector: 'Transmission' },
  { sector: 'FMCG', subsector: 'Food & Beverage' }
];

console.log('\n=== Comprehensive Modal Generation Test ===');
modalTypes.forEach(modalType => {
  sectors.forEach(({ sector, subsector }) => {
    const result = getSectorSpecificModalContent(modalType, sector, subsector);
    const sectorLabel = sector ? `${sector}-${subsector}` : 'Cross-sector';
    console.log(`✓ ${modalType} (${sectorLabel}): ${result.data.fields.length} fields, title: "${result.data.title}"`);
  });
});

export {};