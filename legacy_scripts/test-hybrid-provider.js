// Test HybridProvider routing for SIM methods
import { HybridProvider } from './src/lib/data/providers/HybridProvider.js';

async function testHybridProviderRouting() {
  console.log('Testing HybridProvider SIM method routing...\n');
  
  const provider = new HybridProvider();
  const testTenantId = '67317811-a14d-4ef8-bfc8-e6b4ac10f439'; // DEWA Transmission tenant
  
  try {
    // Test SIM Boards method
    console.log('Testing getSimBoards...');
    const boards = await provider.getSimBoards(testTenantId);
    console.log(`✅ getSimBoards: ${boards.length} boards found`);
    
    // Test Switching Orders method
    console.log('Testing listSwitchingOrders...');
    const orders = await provider.listSwitchingOrders(testTenantId);
    console.log(`✅ listSwitchingOrders: ${orders.length} orders found`);
    
    // Test Outages method
    console.log('Testing listOutages...');
    const outages = await provider.listOutages(testTenantId);
    console.log(`✅ listOutages: ${outages.length} outages found`);
    
    // Test SIM Issues method
    console.log('Testing listSimIssues...');
    const issues = await provider.listSimIssues(testTenantId);
    console.log(`✅ listSimIssues: ${issues.length} issues found`);
    
    // Test SIM Actions method
    console.log('Testing listSimActions...');
    const actions = await provider.listSimActions(testTenantId);
    console.log(`✅ listSimActions: ${actions.length} actions found`);
    
    console.log('\n🎉 All HybridProvider SIM methods working correctly!');
    
    // Test error handling with invalid tenant
    console.log('\nTesting error handling with invalid tenant...');
    try {
      await provider.getSimBoards('invalid-tenant-id');
      console.log('⚠️  Expected error but got success');
    } catch (error) {
      console.log('✅ Error handling works: Invalid tenant properly handled');
    }
    
  } catch (error) {
    console.error('❌ HybridProvider test failed:', error.message);
    process.exit(1);
  }
}

testHybridProviderRouting();