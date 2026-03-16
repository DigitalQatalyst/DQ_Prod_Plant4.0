# Seed Data Summary: Migrations 012-019

## Quick Reference

| Migration | Seed File | Tables | Records | Status |
|-----------|-----------|--------|---------|--------|
| 012 | 012_seed_security_users.sql | security_users | 11 | ✅ Complete |
| 013 | 013_seed_access_policies.sql | access_policies, access_rules, privileged_access_sessions | 6 + 8 + 6 | ✅ Complete |
| 014 | 014_seed_secrets_certificates.sql | secrets_certificates, certificate_rotation_history, api_keys, service_principals | 7 + 2 + 3 + 2 | ✅ Complete |
| 015 | 015_016_017_seed_security_infrastructure.sql | security_audit_log, audit_retention_policies | 6 + 2 | ✅ Complete |
| 016 | 015_016_017_seed_security_infrastructure.sql | security_zones, security_conduits | 6 + 4 | ✅ Complete |
| 017 | 015_016_017_seed_security_infrastructure.sql | ot_asset_security | 20 | ✅ Complete |
| 018 | 018_019_seed_remote_access_network_exposure.sql | remote_access_sessions | 6 | ✅ Complete |
| 019 | 018_019_seed_remote_access_network_exposure.sql | network_exposure_assessments | 5 | ✅ Complete |

## Total Records Created

- **Security Users**: 11 users across 5 role types
- **Access Policies**: 6 policies with 8 rules
- **Privileged Sessions**: 6 sessions (various statuses)
- **Certificates/Secrets**: 7 certificates/secrets + 2 rotation records
- **API Keys**: 3 keys (2 active, 1 expired)
- **Service Principals**: 2 system accounts
- **Security Zones**: 6 zones (IEC 62443 SL1-4)
- **Security Conduits**: 4 inter-zone connections
- **OT Asset Security**: 20 asset security records
- **Audit Log Entries**: 6 sample events
- **Retention Policies**: 2 policies (7-year and 3-year)
- **Remote Access Sessions**: 6 sessions (RDP, SSH, VNC, Web, IEC 61850)
- **Network Assessments**: 5 assessments (scans, pentests, audits)

**Grand Total**: 89 records across 14 tables

## Execution Commands

### Individual Files
```bash
# Execute in order
psql -d your_database -f supabase/seed/012_seed_security_users.sql
psql -d your_database -f supabase/seed/013_seed_access_policies.sql
psql -d your_database -f supabase/seed/014_seed_secrets_certificates.sql
psql -d your_database -f supabase/seed/015_016_017_seed_security_infrastructure.sql
psql -d your_database -f supabase/seed/018_019_seed_remote_access_network_exposure.sql
```

### All at Once
```bash
# Execute all seed files in order
for file in supabase/seed/012_*.sql supabase/seed/013_*.sql supabase/seed/014_*.sql supabase/seed/015_*.sql supabase/seed/018_*.sql; do
  echo "Executing $file..."
  psql -d your_database -f "$file"
done
```

### Using Supabase CLI
```bash
# Reset and seed database
supabase db reset

# Or apply specific seed files
supabase db seed supabase/seed/012_seed_security_users.sql
```

## Data Highlights

### Security Users (Migration 012)
- **Administrators**: Ahmed Al Mansouri (full access, MFA enabled)
- **Supervisors**: Fatima Al Zahra (approval authority, MFA enabled)
- **Engineers**: Mohammed bin Rashid, Sarah Al Nuaimi, Omar Al Falasi (technical ops, MFA enabled)
- **Operators**: Khalid Al Marri, Mariam Al Khan, Layla Al Mheiri (monitoring)
- **Auditors**: Abdullah Al Shamsi (compliance, MFA enabled)
- **Test Cases**: 1 suspended user, 1 inactive user

### Access Policies (Migration 013)
- **Protection Systems Access Control**: SL3-4, engineers only
- **SCADA Network Monitoring**: Read-only for operators
- **Business Hours Restriction**: Time-based (7am-6pm, Mon-Fri)
- **Critical Asset Protection**: Requires supervisor approval
- **Auditor Read-Only**: All zones, compliance monitoring

### Certificates & Secrets (Migration 014)
- **IEC 61850 Certificates**: Active, 545 days remaining
- **DNP3 TLS Certificates**: Active, 275 days remaining
- **Web Server Certificate**: Pending rotation (15 days to expiry)
- **Root CA**: 10-year validity, self-signed
- **API Keys**: SCADA integration, mobile app access
- **Service Principals**: Data collector (45K auths), backup service

### Security Zones (Migrations 015-017)
- **SL4 (Highest)**: Protection Systems Zone (Jebel Ali)
- **SL3**: Substation Control, SCADA Network
- **SL2**: DMZ, Field Devices
- **SL1**: Corporate Network
- **Conduits**: IEC 61850, DNP3-TLS, OPC-UA, MODBUS-TCP

### Remote Access (Migration 018)
- **Active Sessions**: RDP to SCADA (1.5h), IEC 61850 client (45m)
- **Completed**: SSH firmware upgrade (1h 45m), VNC HMI access (1.5h)
- **Failed**: Unauthorized SSH attempt (blocked, alert generated)
- **Expired**: Web session timeout (8h limit)

### Network Exposure (Migration 019)
- **Vulnerability Scan**: SCADA network, 12 findings (3 high)
- **Penetration Test**: Protection zone, 5 findings (0 critical)
- **Configuration Audit**: Legacy relay, 8 findings (1 critical - Telnet)
- **Network Scan**: Field devices, 15 findings (2 high)
- **Protocol Analysis**: IEC 61850 traffic, 3 findings (0 critical)

## Key Features

### Realistic Data
- Timestamps relative to NOW() for time-based queries
- Realistic risk scores and metrics
- Authentic transmission industry context
- IEC 62443 security level classifications
- NERC CIP compliance references

### Comprehensive Coverage
- All user roles represented
- Multiple policy types (zone, role, time, asset-based)
- Various certificate types (IEC 61850, DNP3, web, CA)
- Different session types (RDP, SSH, VNC, Web, IEC 61850)
- Multiple assessment types (scan, pentest, audit, analysis)

### Test Scenarios
- Successful operations (normal workflows)
- Failed operations (security violations)
- Pending approvals (workflow states)
- Expired/suspended items (lifecycle management)
- Emergency access (incident response)

## Integration Points

### With Existing Seeds
- Uses DEWA tenant from seed 001
- References sites from seed 002 (Jebel Ali, Control Centre, Al Aweer)
- Links to assets from seed 004
- Complements security assessments seed 023

### With Application
- Security users for authentication/authorization
- Policies for access control enforcement
- Certificates for secure communications
- Zones for network segmentation
- Audit logs for compliance reporting
- Sessions for access monitoring
- Assessments for risk management

## Verification Queries

```sql
-- Quick verification
SELECT 
  'security_users' as table_name, COUNT(*) as count FROM security_users
UNION ALL
SELECT 'access_policies', COUNT(*) FROM access_policies
UNION ALL
SELECT 'secrets_certificates', COUNT(*) FROM secrets_certificates
UNION ALL
SELECT 'security_zones', COUNT(*) FROM security_zones
UNION ALL
SELECT 'ot_asset_security', COUNT(*) FROM ot_asset_security
UNION ALL
SELECT 'security_audit_log', COUNT(*) FROM security_audit_log
UNION ALL
SELECT 'remote_access_sessions', COUNT(*) FROM remote_access_sessions
UNION ALL
SELECT 'network_exposure_assessments', COUNT(*) FROM network_exposure_assessments;
```

Expected output:
```
table_name                      | count
--------------------------------|-------
security_users                  | 11
access_policies                 | 6
secrets_certificates            | 7
security_zones                  | 6
ot_asset_security              | 20
security_audit_log             | 6
remote_access_sessions         | 6
network_exposure_assessments   | 5
```

## Next Steps

1. **Execute seed files** in the order specified above
2. **Verify data** using the verification queries
3. **Test UI components** with the seeded data
4. **Run integration tests** to validate data relationships
5. **Review security dashboards** to ensure proper data display

## Related Documentation

- **README_MIGRATIONS_012_019.md**: Detailed documentation for each seed file
- **README_SECURITY_ASSESSMENTS.md**: Documentation for seed 023 (control coverage, risk compliance, vendor assessments)
- **Migration files**: 012-019 in `supabase/migrations/`
- **Design document**: `.kiro/specs/power-transmission-cybersecurity/design.md`
- **Tasks document**: `.kiro/specs/power-transmission-cybersecurity/tasks.md`

## Support

For issues or questions:
1. Check the detailed README files
2. Verify prerequisites are met (tenant, sites, assets exist)
3. Review execution order
4. Check for foreign key violations
5. Ensure migrations 012-019 have been applied
