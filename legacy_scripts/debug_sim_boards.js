import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSimBoards() {
  const testTenantId = '67317811-a14d-4ef8-bfc8-e6b4ac10f439';
  
  console.log('Testing simple sim_boards query...');
  
  try {
    // Simple query first
    const { data: simpleData, error: simpleError } = await supabase
      .from('sim_boards')
      .select('*')
      .eq('tenant_id', testTenantId)
      .limit(3);
    
    if (simpleError) {
      console.error('Simple query error:', simpleError);
    } else {
      console.log(`Simple query success: ${simpleData.length} boards found`);
    }
    
    // Complex query with joins
    console.log('\nTesting complex query with joins...');
    const { data: complexData, error: complexError } = await supabase
      .from('sim_boards')
      .select(`
        *,
        sites (
          id,
          name
        ),
        sim_shifts (
          id,
          shift_name,
          shift_start,
          shift_end
        )
      `)
      .eq('tenant_id', testTenantId)
      .limit(3);
    
    if (complexError) {
      console.error('Complex query error:', complexError);
    } else {
      console.log(`Complex query success: ${complexData.length} boards found`);
      if (complexData.length > 0) {
        console.log('Sample board:', JSON.stringify(complexData[0], null, 2));
      }
    }
    
  } catch (err) {
    console.error('Connection error:', err);
  }
}

debugSimBoards();