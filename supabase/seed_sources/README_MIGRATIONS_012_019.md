# Seed Data for Migrations 012-019

## Overview

This directory contains comprehensive seed data for cybersecurity migrations 012-019, covering identity management, access control, secrets management, audit logging, network security zones, OT asset security, remote access monitoring, and network exposure assessments.

## Seed Files

### 012_seed_security_users.sql
**Migration:** 012_create_security_users.sql  
**Requirements:** 2.1, 8.2  
**Description:** Security users with transmission-specific roles

**Data Created:**
- 11 security users across all role types
- Roles: administrator (1), supervisor (1), engineer (3), operator (3), auditor (1)
- Status distribution: active (9), suspended (1), inactive (1)
- MFA enabled for critical roles (5 users)
- Realistic access zones and permissions per role

**Key Users:**
- Ahmed Al Mansouri (Administrator) - Full system access
- Fatima Al Zahra (Supervisor) - Oversight and approval
- Mohammed bin Rashid (Engineer) - Technical operations
- Khalid Al Marri (Operator) - Day-to-day monitoring
- Abdullah Al Shamsi (Auditor) - Compliance and audit

### 013_seed_access_policies.sql
**Migration:** 013_create_access_policies.sql  
**Requirements:** 2.2, 2.3  
**Description:** Zone-based access control policies and privileged access sessions

**Data Created:**
- 6 access policies (5 active, 1 draft)
- Policy types: zone-based, role-based, time-based, asset-based
- 8 access rules defining granular permissions
- 6 privileged access sessions (various statuses)

**Key Policies:**
- Protection Systems Access Control (Priority 10, SL3-4)
- SCADA Network Monitoring (Priority 50, Read-only)
- Business Hours Access Restriction (Priority 20, Time-based)
- Critical Asset Protection (Priority 5, Approval required)
- Auditor Read-Only Access (Priority 100, All zones)

**Session Examples:**
- Emergency breaker control (completed)
- Protection relay configuration (active)
- SCADA administrative access (approved, pending)
- Unauthorized access attempt (denied)

### 014_seed_secrets_certificates.sql
**Migration:** 014_create_secrets_certificates.sql  
**Requirements:** 2.8  
**Description:** Certificates, API keys, and service principals for secure authentication

**Data Created:**
- 7 secrets/certificates (4 certificates, 2 secrets, 1 API key)
- Certificate types: IEC 61850 server, DNP3 TLS, web server, root CA
- 2 certificate rotation history records
- 3 API keys (2 active, 1 expired)
- 2 service principals for system-to-system auth

**Key Certificates:**
- IEC61850-Server-JebelAli-2024 (Active, 545 days remaining)
- DNP3-TLS-SCADA-Main-2024 (Active, 275 days remaining)
- SCADA-WebServer-2023 (Pending rotation, 15 days remaining)
- DEWA-Root-CA-2022 (Active, 10-year validity)

**Service Principals:**
- SCADA-Data-Collector-Service (45,678 authentications)
- Backup-Service-Principal (1,234 authentications)

### 015_016_017_seed_security_infrastructure.sql
**Migration:** 015_create_security_audit_log.sql, 016_create_security_zones_conduits.sql, 017_create_ot_asset_security.sql  
**Requirements:** 2.5, 3.1, 3.2, 6.1, 8.3  
**Description:** Combined seed for audit logging, security zones, and OT asset security

**Data Created:**

#### Security Zones (6 zones)
- Jebel Ali Protection Systems Zone (SL4, Compliant)
- Jebel Ali Substation Control Zone (SL3, Compliant)
- Control Centre SCADA Network (SL3, Compliant)
- Control Centre DMZ (SL2, Partial)
- Al Aweer Field Devices Zone (SL2, Partial)
- DEWA Corporate Network (SL1, Compliant)

#### Security Conduits (4 conduits)
- SCADA-to-Protection-IEC61850 (Bidirectional, Encrypted)
- ControlCentre-to-Substation-DNP3 (Bidirectional, Encrypted)
- SCADA-to-DMZ-DataDiode (Unidirectional, Encrypted)
- FieldDevices-to-Substation-MODBUS (Bidirectional, Not encrypted)

#### OT Asset Security (20 records)
- Random distribution across criticality levels
- Security status: secure, at-risk, vulnerable
- Patch status tracking
- Network exposure classification
- Manufacturers: ABB, Siemens, GE, Schneider Electric, SEL

#### Security Audit Log (6 sample entries)
- Authentication events (success and failure)
- Configuration changes
- Security violations
- Certificate operations
- Data access events

#### Audit Retention Policies (2 policies)
- Critical Security Events Retention (7 years, NERC CIP)
- Standard Audit Log Retention (3 years, ISO 27001)

### 018_019_seed_remote_access_network_exposure.sql
**Migration:** 018_create_remote_access_sessions.sql, 019_create_network_exposure_assessments.sql  
**Requirements:** 3.5, 3.8  
**Description:** Remote access monitoring and network exposure assessments

**Data Created:**

#### Remote Access Sessions (6 sessions)
- Session types: RDP, SSH, IEC 61850 client, Web, VNC
- Status distribution: active (2), terminated (2), failed (1), expired (1)
- Authentication methods: MFA, certificate, password, SSO
- Risk scores ranging from 10 to 95

**Key Sessions:**
- Active RDP to SCADA server (1.5 hours, 15 commands)
- Completed SSH to protection relay (1h 45m, firmware upgrade)
- Failed unauthorized access attempt (5 seconds, blocked)
- Active IEC 61850 client session (45 minutes, configuration review)

#### Network Exposure Assessments (5 assessments)
- Assessment types: vulnerability scan, penetration test, configuration audit, network scan, protocol analysis
- Exposure levels: low (2), medium (2), high (1)
- Risk scores ranging from 18 to 72

**Key Assessments:**
- SCADA Network Vulnerability Scan (12 findings, 3 high)
- Protection Systems Penetration Test (5 findings, 0 critical)
- Legacy Relay Configuration Audit (8 findings, 1 critical - Telnet enabled)
- Field Devices Network Scan (15 findings, 2 high)
- IEC 61850 Protocol Analysis (3 findings, 0 critical)

## Data Relationships

```
tenants (DEWA)
  └── security_users (11 users)
       ├── access_policies (6 policies)
       │    └── access_rules (8 rules)
       ├── privileged_access_sessions (6 sessions)
       ├── secrets_certificates (7 certs/secrets)
       │    ├── certificate_rotation_history (2 rotations)
       │    ├── api_keys (3 keys)
       │    └── service_principals (2 principals)
       ├── security_zones (6 zones)
       │    ├── security_conduits (4 conduits)
       │    └── ot_asset_security (20 records)
       ├── security_audit_log (6 entries)
       │    └── audit_retention_policies (2 policies)
       ├── remote_access_sessions (6 sessions)
       └── network_exposure_assessments (5 assessments)
```

## Execution Order

The seed files should be executed in the following order:

1. **012_seed_security_users.sql** - Creates users first (referenced by other tables)
2. **013_seed_access_policies.sql** - Creates policies and sessions (references users)
3. **014_seed_secrets_certificates.sql** - Creates certificates and keys (references users)
4. **015_016_017_seed_security_infrastructure.sql** - Creates zones, conduits, OT security, audit logs
5. **018_019_seed_remote_access_network_exposure.sql** - Creates sessions and assessments (references zones and users)

## Prerequisites

Before running these seed files, ensure the following migrations and seeds have been executed:

- Migration 001-011 (tenants, sites, assets, etc.)
- Seed 001-006 (tenant data, sites, assets)
- Specifically requires:
  - DEWA tenant exists
  - Sites: Jebel Ali Power Station, DEWA Control Centre, Al Aweer Power Station
  - Assets table populated

## Verification

After running all seed files, verify data with:

```sql
-- User counts
SELECT role, COUNT(*) FROM security_users GROUP BY role;

-- Policy counts
SELECT status, COUNT(*) FROM access_policies GROUP BY status;

-- Certificate counts
SELECT secret_type, status, COUNT(*) FROM secrets_certificates GROUP BY secret_type, status;

-- Zone counts
SELECT zone_type, security_level, COUNT(*) FROM security_zones GROUP BY zone_type, security_level;

-- Session counts
SELECT session_type, status, COUNT(*) FROM remote_access_sessions GROUP BY session_type, status;

-- Assessment counts
SELECT assessment_type, exposure_level, COUNT(*) FROM network_exposure_assessments GROUP BY assessment_type, exposure_level;

-- Total records
SELECT 
  (SELECT COUNT(*) FROM security_users) as users,
  (SELECT COUNT(*) FROM access_policies) as policies,
  (SELECT COUNT(*) FROM secrets_certificates) as certificates,
  (SELECT COUNT(*) FROM security_zones) as zones,
  (SELECT COUNT(*) FROM ot_asset_security) as ot_security,
  (SELECT COUNT(*) FROM security_audit_log) as audit_logs,
  (SELECT COUNT(*) FROM remote_access_sessions) as sessions,
  (SELECT COUNT(*) FROM network_exposure_assessments) as assessments;
```

Expected totals:
- Security Users: 11
- Access Policies: 6
- Access Rules: 8
- Privileged Sessions: 6
- Secrets/Certificates: 7
- API Keys: 3
- Service Principals: 2
- Security Zones: 6
- Security Conduits: 4
- OT Asset Security: 20
- Audit Log Entries: 6
- Retention Policies: 2
- Remote Access Sessions: 6
- Network Exposure Assessments: 5

## Notes

- All data uses the DEWA tenant for consistency
- Timestamps are relative to NOW() for realistic time-based queries
- User credentials are hashed (not actual passwords)
- Certificate values are base64-encoded placeholders
- Risk scores and metrics are realistic for power transmission operations
- All data follows IEC 62443 security level classifications
- Compliance standards referenced: IEC 62443, NERC CIP, ISO 27001, UAE Cyber Law

## Troubleshooting

If seed execution fails:

1. **Missing tenant error**: Run tenant seed data first (001-006)
2. **Missing user error**: Ensure 012_seed_security_users.sql ran successfully
3. **Foreign key violations**: Check execution order above
4. **Duplicate key errors**: Database may already contain seed data - check before re-running

## Integration with Existing Seeds

These seeds integrate with:
- **023_seed_security_assessments.sql**: Control coverage, risk compliance, vendor assessments
- **Existing tenant/site seeds**: Uses DEWA tenant and sites
- **Asset seeds**: Links OT security records to existing assets

## Future Enhancements

Potential additions for future seed data:
- Additional users for multi-tenant scenarios
- More complex policy hierarchies
- Extended audit log history (currently 6 sample entries)
- Additional certificate rotation scenarios
- More network exposure assessment types
- Integration with alert and incident seed data
