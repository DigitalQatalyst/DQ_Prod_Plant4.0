import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:8000';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
    console.log('🚀 Starting Interconnected Security Data Seeding...\n');

    try {
        const { data: tenants } = await supabase.from('tenants').select('id').ilike('name', '%Transmission%').limit(1);
        const tenantId = tenants[0].id;

        const { data: standards } = await supabase.from('compliance_standards').select('id, name').eq('tenant_id', tenantId);
        const iec = standards?.find(s => s.name === 'IEC 62443')?.id;
        const nerc = standards?.find(s => s.name === 'NERC CIP')?.id;
        const nist = standards?.find(s => s.name === 'NIST CSF')?.id;

        // 1. Seed Controls first to get their UUIDs
        const controls = [
            { tenant_id: tenantId, control_id: 'C-CRY-01', control_name: 'Encryption Policy', control_type: 'preventive', category: 'Cryptography', domain: 'Network', standard_id: iec, status: 'active', implementation_status: 'implemented', effectiveness: 'effective', effectiveness_score: 95 },
            { tenant_id: tenantId, control_id: 'C-MP-01', control_name: 'USB Lockdown', control_type: 'preventive', category: 'Media Protection', domain: 'Endpoint', standard_id: nist, status: 'active', implementation_status: 'implemented', effectiveness: 'effective', effectiveness_score: 98 },
            { tenant_id: tenantId, control_id: 'C-PS-01', control_name: 'Background Checks', control_type: 'preventive', category: 'Personnel', domain: 'Identity', standard_id: nerc, status: 'active', implementation_status: 'implemented', effectiveness: 'effective', effectiveness_score: 90 },
            { tenant_id: tenantId, control_id: 'C-SI-01', control_name: 'Firmware Verification', control_type: 'preventive', category: 'Integrity', domain: 'Endpoint', standard_id: iec, status: 'active', implementation_status: 'partial', effectiveness: 'partially-effective', effectiveness_score: 65 },
            { tenant_id: tenantId, control_id: 'C-NS-02', control_name: 'OT Firewalls', control_type: 'preventive', category: 'Network Security', domain: 'Network', standard_id: iec, status: 'active', implementation_status: 'implemented', effectiveness: 'effective', effectiveness_score: 92 }
        ];

        const { data: insertedControls, error: ce } = await supabase.from('security_controls').upsert(controls, { onConflict: 'tenant_id,control_id' }).select();
        if (ce) throw ce;
        console.log('✅ Controls seeded.');

        const controlIds = insertedControls.reduce((acc, c) => ({ ...acc, [c.control_id]: c.id }), {});

        // 2. Seed Risks and link to Controls
        const risks = [
            {
                tenant_id: tenantId,
                risk_id: 'R-CYBER-001',
                risk_name: 'Unauthorized SCADA Access',
                risk_description: 'Risk of malicious actors gaining access to SCADA control network.',
                risk_category: 'cyber-attack',
                inherent_likelihood: 'high',
                inherent_impact: 'catastrophic',
                inherent_risk_score: 85,
                inherent_risk_level: 'critical',
                existing_controls: [controlIds['C-CRY-01'], controlIds['C-NS-02']],
                status: 'mitigating',
                treatment_strategy: 'mitigate'
            },
            {
                tenant_id: tenantId,
                risk_id: 'R-PHYS-002',
                risk_name: 'Infected Removable Media',
                risk_description: 'Malware introduction via infected USB drives at substation HMIs.',
                risk_category: 'physical-security',
                inherent_likelihood: 'medium',
                inherent_impact: 'major',
                inherent_risk_score: 60,
                inherent_risk_level: 'high',
                existing_controls: [controlIds['C-MP-01']],
                status: 'assessed',
                treatment_strategy: 'mitigate'
            }
        ];

        const { error: re } = await supabase.from('security_risks').upsert(risks, { onConflict: 'tenant_id,risk_id' });
        if (re) console.error('Risks error:', re.message);
        else console.log('✅ Risks seeded.');

        // 3. Seed Policies and link to Controls
        const policies = [
            {
                tenant_id: tenantId,
                policy_id: 'P-CRY-01',
                policy_name: 'Key Management Policy',
                policy_type: 'Data Protection',
                version: '1.0',
                status: 'active',
                policy_owner: 'CISO',
                policy_statement: 'All keys must be rotated.',
                scope: 'enterprise',
                enforcement_level: 'mandatory',
                related_controls: [controlIds['C-CRY-01']]
            },
            {
                tenant_id: tenantId,
                policy_id: 'P-REM-01',
                policy_name: 'Remote Access Policy',
                policy_type: 'Access Control',
                version: '1.0',
                status: 'active',
                policy_owner: 'Network Manager',
                policy_statement: 'VPN required.',
                scope: 'transmission',
                enforcement_level: 'mandatory',
                related_controls: [controlIds['C-NS-02']]
            }
        ];

        const { error: pe } = await supabase.from('security_policies').upsert(policies, { onConflict: 'tenant_id,policy_id,version' });
        if (pe) console.error('Policies error:', pe.message);
        else console.log('✅ Policies seeded.');

    } catch (e) { console.error('Error:', e.message); }
}
seed();
