/**
 * Simple test to verify performance provider methods are working
 */

import { getDataProvider } from './src/lib/data/index.js';

async function testPerformanceProvider() {
  console.log('Testing Performance Provider Implementation...');
  
  try {
    const provider = getDataProvider();
    console.log('✓ DataProvider created successfully');
    console.log('Provider info:', provider.getInfo());
    
    // Test getting performance panels (should return empty array for now)
    const tenantId = 'test-tenant-id';
    console.log(`\nTesting getPerformancePanelsByTenant for tenant: ${tenantId}`);
    
    const panels = await provider.getPerformancePanelsByTenant(tenantId);
    console.log('✓ getPerformancePanelsByTenant executed successfully');
    console.log(`Returned ${panels.length} panels`);
    
    // Test getting performance losses
    console.log(`\nTesting getPerformanceLossesByTenant for tenant: ${tenantId}`);
    const losses = await provider.getPerformanceLossesByTenant(tenantId);
    console.log('✓ getPerformanceLossesByTenant executed successfully');
    console.log(`Returned ${losses.length} losses`);
    
    // Test getting performance bottlenecks
    console.log(`\nTesting getPerformanceBottlenecksByTenant for tenant: ${tenantId}`);
    const bottlenecks = await provider.getPerformanceBottlenecksByTenant(tenantId);
    console.log('✓ getPerformanceBottlenecksByTenant executed successfully');
    console.log(`Returned ${bottlenecks.length} bottlenecks`);
    
    console.log('\n🎉 All performance provider methods are working correctly!');
    
  } catch (error) {
    console.error('❌ Performance provider test failed:', error);
    process.exit(1);
  }
}

testPerformanceProvider();