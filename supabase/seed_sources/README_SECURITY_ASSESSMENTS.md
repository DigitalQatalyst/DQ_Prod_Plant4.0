# Security Assessments Seed Data

## Overview

This seed file (`023_seed_security_assessments.sql`) provides comprehensive test data for the security assessment tables in the Plant4.0 Power Transmission cybersecurity system.

## Data Structure

### 1. Control Coverage Assessments (3 records)

Tracks IEC 62443 and NERC CIP control implementation and coverage:

- **Jebel Ali Power Station** - IEC 62443-3-3 SL2 Assessment
  - 85 total controls, 68 implemented (88.24% coverage)
  - Status: Completed, Partial compliance
  - 2 critical gaps, 3 high gaps
  
- **DEWA Control Centre** - NERC CIP v6 Assessment
  - 120 total controls, 105 implemented (91.67% coverage)
  - Status: Completed, Compliant
  - 0 critical gaps, 2 high gaps
  
- **Al Aweer Power Station** - Combined IEC 62443 & UAE Cyber Law
  - 95 total controls, 78 implemented (89.47% coverage)
  - Status: In-progress, Partial compliance
  - 1 critical gap, 4 high gaps

### 2. Risk & Compliance Summaries (2 records)

Aggregated risk and compliance reporting:

- **Q4 2023 DEWA Organization-wide Summary**
  - Overall risk score: 42.50 (within threshold)
  - Overall compliance score: 88.40%
  - 45 total risks (3 critical, 12 high)
  - 8 incidents (1 critical, 6 resolved)
  - Status: Approved by Saeed Al Tayer
  
- **January 2024 Jebel Ali Site Summary**
  - Overall risk score: 38.75
  - Overall compliance score: 87.50%
  - 18 total risks (2 critical, 5 high)
  - 3 incidents (1 critical, 2 resolved)
  - Status: Approved by Ahmed Al Mansouri

### 3. Compliance Standard Status (3 records)

Individual standard compliance tracking linked to summaries:

- **IEC 62443-3-3** - 88.24% compliance, Partial status
- **NERC CIP v6** - 91.67% compliance, Compliant status
- **UAE Cyber Law** - 92.00% compliance, Compliant status

### 4. Risk Compliance Trends (18 records)

Historical trend data for 6 months across 3 metrics:

- **Overall Risk Score** - Trending from 57.5 to 42.5 (improving)
- **Overall Compliance Score** - Trending from 82.0 to 88.4 (improving)
- **Control Effectiveness Score** - Trending from 80.0 to 86.5 (improving)

### 5. Vendor Security Assessments (4 records)

Third-party vendor and system security assessments:

- **General Electric - Mark VIe Turbine Control**
  - Score: 82.50/100, Risk: 35.00
  - IEC 62443 SL2 certified
  - 2 high findings (default credentials, outdated firmware)
  - Status: Completed, Approved
  
- **ABB - REG670 Protection Relay**
  - Score: 88.00/100, Risk: 25.00
  - IEC 62443 SL3 certified
  - 0 critical findings, 2 medium findings
  - Status: Completed, Approved
  
- **Schneider Electric - ClearSCADA**
  - Score: 85.00/100, Risk: 30.00
  - IEC 62443 SL2 certified
  - 1 high finding (database encryption)
  - Status: Completed, Conditional approval
  
- **Fortinet - FortiGate 3000D Firewall**
  - Score: 90.00/100, Risk: 20.00
  - Common Criteria EAL4+ certified
  - 0 critical findings, 1 medium finding
  - Status: Completed, Approved

### 6. Vendor Security Findings (4 records)

Detailed security findings from vendor assessments:

- **GE-FIND-001**: Default credentials (High severity, In-progress)
- **GE-FIND-002**: Outdated firmware with CVEs (High severity, Open)
- **SE-FIND-001**: Database not encrypted (High severity, In-progress)
- **ABB-FIND-001**: Insecure SNMP configuration (Medium severity, Open)

### 7. Vendor Contact History (3 records)

Communication history with vendors:

- GE kickoff meeting and remediation discussion
- Schneider on-site audit meeting

## Data Relationships

```
tenants (DEWA)
  └── sites (Jebel Ali, Control Centre, Al Aweer)
       ├── control_coverage_assessments
       └── risk_compliance_summaries
            └── compliance_standard_status

tenants (DEWA)
  └── vendor_security_assessments
       ├── vendor_security_findings
       └── vendor_contact_history

tenants (DEWA)
  └── risk_compliance_trends
```

## Usage

This seed data is designed to:

1. **Demonstrate realistic security assessment workflows** for power transmission operations
2. **Provide test data** for security dashboard pages (PostureBySite, ControlCoverageView, RiskComplianceSummary, VendorAdvisorSummary)
3. **Show compliance tracking** for IEC 62443, NERC CIP, and UAE regulations
4. **Illustrate vendor management** processes with real equipment manufacturers
5. **Enable trend analysis** with 6 months of historical data

## Tenant Context

All data uses the **Dubai Electricity and Water Authority (DEWA)** tenant from the existing seed data, ensuring consistency with:

- Sites: Jebel Ali Power Station, DEWA Control Centre, Al Aweer Power Station
- Users: Ahmed Al Mansouri, Fatima Al Zahra, Mohammed bin Rashid
- Assets: Mark VIe controllers, REG670 relays, ClearSCADA systems

## Verification

After running the seed, verify data with:

```sql
SELECT COUNT(*) FROM control_coverage_assessments;  -- Should return 3
SELECT COUNT(*) FROM risk_compliance_summaries;     -- Should return 2
SELECT COUNT(*) FROM vendor_security_assessments;   -- Should return 4
SELECT COUNT(*) FROM vendor_security_findings;      -- Should return 4
SELECT COUNT(*) FROM compliance_standard_status;    -- Should return 3
SELECT COUNT(*) FROM risk_compliance_trends;        -- Should return 18
SELECT COUNT(*) FROM vendor_contact_history;        -- Should return 3
```

## Notes

- All dates are relative to NOW() for realistic time-based queries
- Scores and metrics are realistic for power transmission operations
- Vendor names and products match actual industry equipment
- Compliance standards reflect real regulatory requirements (IEC 62443, NERC CIP, UAE Cyber Law)
- Findings include realistic CVE references and remediation plans
