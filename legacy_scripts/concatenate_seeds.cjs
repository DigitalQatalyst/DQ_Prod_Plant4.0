const fs = require('fs');
const path = require('path');

const projectRoot = 'C:\\Users\\Admin\\Documents\\Projects\\DQ_Prod_Plant4.0_Skunk';
const configPath = path.join(projectRoot, 'supabase', 'config.toml');
const outputSeedPath = path.join(projectRoot, 'supabase', 'seed.sql');

try {
    const configContent = fs.readFileSync(configPath, 'utf8');

    // Simple regex to find the sql_paths array
    // Matches sql_paths = [ ... ] across multiple lines
    const match = configContent.match(/sql_paths\s*=\s*\[([\s\S]*?)\]/);

    if (!match) {
        console.error('Could not find sql_paths in config.toml');
        process.exit(1);
    }

    const pathsContent = match[1];
    // Extract filenames, removing quotes and commas
    const files = [
        'supabase/seed_sources/001_transmission_tenant.sql',
        'supabase/seed_sources/002_grid_topology.sql',
        'supabase/seed_sources/003_assets.sql',
        'supabase/seed_sources/004_telemetry_alerts.sql',
        'supabase/seed_sources/005_operational.sql',
        'supabase/seed_sources/006_grid_asset_links.sql',
        'supabase/seed_sources/012_seed_security_users.sql',
        'supabase/seed_sources/013_seed_access_policies.sql',
        'supabase/seed_sources/014_seed_secrets_certificates.sql',
        'supabase/seed_sources/015_016_017_seed_security_infrastructure.sql',
        'supabase/seed_sources/018_019_seed_remote_access_network_exposure.sql',
        'supabase/seed_sources/023_seed_security_assessments.sql',
        'supabase/seed_sources/024_seed_security_alerts.sql',
        'supabase/seed_sources/030_seed_transmission_compliance_standards.sql',
        'supabase/seed_sources/031_seed_incident_cases.sql',
        'supabase/seed_sources/031_seed_transmission_security_risks.sql',
        'supabase/seed_sources/032_seed_anomaly_detection.sql',
        'supabase/seed_sources/032_seed_transmission_security_controls.sql',
        'supabase/seed_sources/033_seed_response_playbooks.sql',
        'supabase/seed_sources/033_seed_transmission_security_policies.sql',
        'supabase/seed_sources/034_seed_threat_intelligence.sql',
        'supabase/seed_sources/034_seed_transmission_security_exceptions.sql',
        'supabase/seed_sources/035_seed_impact_assessments.sql',
        'supabase/seed_sources/035_seed_iso_27001_requirements.sql',
        'supabase/seed_sources/036_seed_audit_logging.sql',
        'supabase/seed_sources/036_seed_nist_csf_requirements.sql',
        'supabase/seed_sources/037_seed_log_retention.sql',
        'supabase/seed_sources/038_seed_file_integrity.sql',
        'supabase/seed_sources/039_seed_forensic_snapshots.sql',
        'supabase/seed_sources/040_seed_data_protection_framework.sql',
        'supabase/seed_sources/040_seed_unified_security_incidents.sql',
        'supabase/seed_sources/041_seed_encryption_key_management.sql',
        'supabase/seed_sources/042_seed_backup_recovery.sql',
        'supabase/seed_sources/043_seed_workload_security.sql',
        'supabase/seed_sources/044_seed_application_security.sql',
        'supabase/seed_sources/046_seed_field_gateways.sql',
        'supabase/seed_sources/047_seed_iot_devices.sql',
        'supabase/seed_sources/048_seed_missing_security_data.sql',
        'supabase/seed_sources/049_seed_diverse_posture_data.sql',
        'supabase/seed_sources/049_seed_protocol_policies.sql',
        'supabase/seed_sources/050_seed_comprehensive_security_data.sql',
        'supabase/seed_sources/050_seed_security_zones.sql',
        'supabase/seed_sources/051_seed_diversified_security_data.sql',
        'supabase/seed_sources/051_seed_sites.sql',
        'supabase/seed_sources/053_seed_expanded_security_data.sql',
        'supabase/seed_sources/054_seed_compliance_evidence.sql',
        'supabase/seed_sources/090_seed_audit_readiness.sql'
    ];

    console.log(`Found ${files.length} seed files to concatenate.`);

    let combinedSql = '-- Auto-generated seed.sql from config.toml\n\n';

    for (const file of files) {
        const filePath = path.join(projectRoot, file); // files already include 'supabase/seed_sources/'
        console.log(`Checking file: ${filePath}`);
        if (fs.existsSync(filePath)) {
            console.log(`Reading ${file}...`);
            const content = fs.readFileSync(filePath, 'utf8');
            combinedSql += `\n-- START OF ${file} --\n`;
            combinedSql += content;
            combinedSql += `\n-- END OF ${file} --\n`;
        } else {
            console.warn(`Warning: Seed file not found: ${filePath}`);
        }
    }

    fs.writeFileSync(outputSeedPath, combinedSql);
    console.log(`Successfully created ${outputSeedPath} with ${combinedSql.length} bytes.`);

} catch (err) {
    console.error('Error:', err);
    process.exit(1);
}
