# Generic Security Schema Documentation

## Overview

This document describes a comprehensive, domain-independent security schema designed to work across any industry including Manufacturing, Healthcare, Financial Services, Energy, Transportation, and more. The schema has been abstracted from transmission-specific implementations to provide a flexible foundation for security operations.

## Design Principles

1. **Domain Independence**: No industry-specific terminology or constraints
2. **Extensibility**: Metadata fields allow custom attributes without schema changes
3. **Compliance Ready**: Built-in support for multiple regulatory frameworks
4. **Scalability**: Hierarchical structure supports organizations of any size
5. **Interoperability**: Standard data types and clear relationships

## Core Schema Components

### 1. Organizational Hierarchy

```
Tenant (Organization)
  └── Sites (Facilities/Locations)
       └── Security Zones (Network Segments)
            └── Assets (Devices/Systems)
```

#### Tenant
Represents the top-level organization or business entity.

**Key Attributes:**
- Industry classification
- Regulatory frameworks
- Geographic information
- Asset/site/user counts

**Use Cases:**
- Multi-tenant SaaS platforms
- Enterprise organizations
- Managed security service providers

#### Site
Physical or logical locations within an organization.

**Key Attributes:**
- Site type (manufacturing, office, data center, etc.)
- Criticality level
- Security posture score
- Geographic coordinates

**Examples:**
- Manufacturing plants
- Data centers
- Research facilities
- Office buildings
- Cloud regions

#### Security Zone
Network segments with defined security boundaries.

**Key Attributes:**
- Zone type (process, control, DMZ, corporate, custom)
- Security level (0-4)
- Compliance status
- Network segmentation status

**Common Zone Types:**
- **Process**: Critical operational systems
- **Control**: Supervisory and monitoring systems
- **DMZ**: External-facing services
- **Corporate**: Business IT systems
- **Custom**: Industry-specific zones

### 2. Asset Management

#### Asset
Any device, system, or application requiring security oversight.

**Categories:**
- **OT** (Operational Technology): PLCs, SCADA, HMI, sensors
- **IT** (Information Technology): Servers, workstations, applications
- **IoT** (Internet of Things): Connected devices, sensors
- **Network**: Routers, switches, firewalls
- **Endpoint**: Workstations, mobile devices
- **Server**: Physical and virtual servers
- **Application**: Software systems

**Security Attributes:**
- Criticality level
- Security status
- Vulnerability count
- Risk score (0-100)
- Network exposure
- Patch status
- Compliance status

**Technical Attributes:**
- Manufacturer and model
- Firmware/software versions
- Communication protocols
- IP/MAC addresses
- Operating system

### 3. Identity & Access Management

#### User
Individuals with system access.

**User Types:**
- Internal employees
- Vendors/contractors
- Consultants
- Support personnel

**Key Features:**
- Multi-factor authentication status
- Privileged access tracking
- Site and zone access permissions
- Certification tracking
- Clearance levels

#### Role
Permission sets assigned to users.

**Attributes:**
- Permission list
- Privilege level
- System vs custom roles
- User count

#### Access Policy
Rules governing resource access.

**Features:**
- Scope definition (sites, zones, assets)
- Time restrictions
- IP restrictions
- Approval requirements
- Emergency override procedures

### 4. Remote Access & Sessions

#### Remote Session
Tracked remote access to systems.

**Tracked Information:**
- User and vendor details
- Source and destination
- Protocol and access level
- Commands executed
- Data transferred
- Approval chain
- Session recording status

**Use Cases:**
- Vendor support sessions
- Remote maintenance
- Emergency access
- Audit trail requirements

### 5. Security Monitoring

#### Security Alert
Real-time security events requiring attention.

**Alert Categories:**
- Unauthorized access
- Malware detection
- Data exfiltration
- API abuse
- Configuration changes
- Anomalous behavior

**Severity Levels:**
- Critical
- High
- Medium
- Low
- Info

**Workflow:**
- New → Acknowledged → Investigating → Resolved/False Positive

#### Incident Case
Formal security incidents requiring investigation.

**Incident Types:**
- Ransomware
- Data breach
- DDoS attack
- Insider threat
- Supply chain compromise

**Tracking:**
- Affected assets and sites
- Business impact
- Response team
- Containment actions
- Remediation steps
- Lessons learned
- Root cause analysis

#### Anomaly Signal
ML-detected deviations from baseline behavior.

**Anomaly Types:**
- CPU/memory usage
- Network traffic patterns
- Data access patterns
- Transaction volumes
- API call rates

**Attributes:**
- Baseline vs observed values
- Deviation magnitude
- ML confidence score
- Correlated events

### 6. Compliance & Governance

#### Compliance Standard
Regulatory or industry standards.

**Supported Standards:**
- ISO 27001
- NIST CSF
- SOC 2
- HIPAA
- GDPR
- PCI DSS
- Industry-specific standards

**Features:**
- Compliance score (0-100)
- Requirement tracking
- Evidence management
- Gap analysis
- Audit scheduling

#### Security Control
Specific security measures implemented.

**Control Categories:**
- Access control
- Network security
- Data protection
- Monitoring
- Incident response
- Vulnerability management
- Physical security
- Change management

**Metrics:**
- Implementation status
- Coverage percentage
- Effectiveness score
- Implementation complexity

#### Security Policy
Organizational security rules.

**Components:**
- Policy rules (conditions and actions)
- Scope definition
- Exception handling
- Review schedule
- Approval workflow

### 7. Risk Management

#### Risk Entry
Identified security risks.

**Risk Assessment:**
- Likelihood (very-high to very-low)
- Impact (critical to negligible)
- Risk score calculation
- Mitigation planning
- Residual risk tracking

#### Vulnerability
Known security weaknesses.

**Tracking:**
- CVE identifiers
- CVSS scores
- Affected assets
- Patch availability
- Exploit status
- Remediation steps
- Workarounds

### 8. Audit & Logging

#### Audit Log Entry
Comprehensive activity logging.

**Event Categories:**
- Authentication
- Authorization
- Configuration changes
- Data access
- System events
- Security events
- Compliance events
- Incidents

**Attributes:**
- Timestamp
- User and source IP
- Resource and action
- Outcome
- Severity
- Regulatory reportability

### 9. Incident Response

#### Response Playbook
Predefined incident response procedures.

**Components:**
- Applicable incident types
- Step-by-step actions
- Responsible parties
- Time limits
- Decision points
- Escalation procedures
- Required tools and personnel

#### SOAR Action
Security Orchestration, Automation, and Response.

**Action Types:**
- Disable account
- Close session
- Isolate system
- Block IP
- Quarantine device
- Revoke access

**Features:**
- Approval requirements
- Execution history
- Rollback capability
- Success/failure tracking

#### Forensic Snapshot
Point-in-time system state capture.

**Captured Data:**
- System state
- Configurations
- Log segments
- Trigger event details
- Retention period

### 10. Integration & Authentication

#### SSO Integration
Single Sign-On directory integration.

**Supported Providers:**
- Active Directory
- Azure AD
- Okta
- LDAP
- SAML
- OAuth
- RADIUS

**Features:**
- User/group synchronization
- Auto-provisioning
- Group mapping
- Sync history tracking

#### API Key
System-to-system authentication.

**Management:**
- Scope and permissions
- Expiration tracking
- Usage statistics
- Rotation schedule
- IP/time restrictions
- Security levels

#### Service Principal
Application identity for automated systems.

**Features:**
- Certificate management
- Secret rotation
- Permission assignment
- Resource access control
- Compliance tracking

### 11. Network Security

#### Gateway
Network security enforcement points.

**Gateway Types:**
- Firewalls
- Protocol converters
- Security gateways
- API gateways

**Monitoring:**
- Firmware status
- Hardening score
- Connected devices
- Vulnerability count
- Certificate expiry
- Performance metrics

### 12. Threat Intelligence

#### Threat Indicator
Known malicious indicators.

**Indicator Types:**
- IP addresses
- Domains
- URLs
- File hashes
- Email addresses

**Attributes:**
- Severity and confidence
- Source attribution
- First/last seen dates
- Associated threats
- Block status

#### Threat Actor
Known adversary groups.

**Tracking:**
- Actor type (nation-state, cybercrime, etc.)
- Sophistication level
- Motivations
- Targeted industries
- TTPs (Tactics, Techniques, Procedures)

### 13. Security Metrics

#### Security Metric
Quantitative security measurements.

**Metric Categories:**
- Asset security
- Access control
- Network security
- Compliance
- Incident response
- Vulnerability management

**Features:**
- Target values
- Thresholds (warning/critical)
- Trend analysis
- Timestamp tracking

#### Security Posture
Overall security health score.

**Dimensions:**
- Asset security
- Access control
- Network security
- Compliance
- Incident response
- Vulnerability management

**Scoring:**
- Overall score (0-100)
- Dimension scores
- Finding counts by severity
- Trend analysis

## Data Relationships

```
Tenant
  ├── Sites
  │   ├── Security Zones
  │   │   ├── Assets
  │   │   └── Network Conduits
  │   ├── Remote Sessions
  │   └── Gateways
  ├── Users
  │   └── Roles
  ├── Access Policies
  ├── Security Alerts
  │   └── Incident Cases
  ├── Compliance Standards
  │   ├── Requirements
  │   └── Security Controls
  ├── Risks
  │   └── Vulnerabilities
  ├── Audit Logs
  ├── SSO Integrations
  ├── API Keys
  ├── Service Principals
  └── Security Metrics
```

## Extensibility

### Metadata Fields
Every entity includes a `metadata` field (Record<string, unknown>) allowing custom attributes without schema modifications.

**Example Use Cases:**
- Industry-specific attributes
- Custom compliance requirements
- Integration with external systems
- Temporary tracking fields
- Experimental features

### Custom Zone Types
While standard zone types are provided, the `type` field accepts custom values for industry-specific needs.

### Custom Categories
Many entities support custom categories to accommodate industry-specific classifications.

## Implementation Guidelines

### 1. Multi-Tenancy
- Always filter data by `tenantId`
- Enforce tenant isolation at the data layer
- Use tenant-specific configurations

### 2. Security
- Encrypt sensitive fields (passwords, keys, certificates)
- Implement row-level security
- Audit all data access
- Use secure communication channels

### 3. Performance
- Index frequently queried fields (tenantId, siteId, status)
- Implement pagination for large datasets
- Cache frequently accessed data
- Archive historical data

### 4. Compliance
- Retain audit logs per regulatory requirements
- Implement data retention policies
- Support data export for audits
- Track regulatory reportable events

### 5. Integration
- Use standard data formats (ISO 8601 for dates)
- Provide REST APIs for data access
- Support webhook notifications
- Enable data import/export

## Example Use Cases

### Manufacturing
- Track OT assets (PLCs, SCADA, HMI)
- Monitor production zones
- Manage vendor access
- Comply with IEC 62443

### Healthcare
- Protect PHI/ePHI
- HIPAA compliance tracking
- Clinical system security
- Research data protection

### Financial Services
- PCI DSS compliance
- Transaction monitoring
- Fraud detection
- Payment system security

### Energy & Utilities
- Critical infrastructure protection
- NERC CIP compliance
- SCADA security
- Grid operations monitoring

### Technology/SaaS
- Multi-tenant security
- API security
- Cloud infrastructure
- SOC 2 compliance

## Migration from Domain-Specific Schemas

When migrating from domain-specific schemas (e.g., transmission security):

1. **Map domain-specific fields to generic equivalents**
   - voltageLevel → metadata.voltageLevel
   - isBESCritical → criticality: 'critical'
   - protectionSystem → type: 'protection-system'

2. **Preserve domain context in metadata**
   - Store industry-specific attributes
   - Maintain backward compatibility
   - Enable domain-specific queries

3. **Maintain relationships**
   - Preserve parent-child relationships
   - Keep foreign key references
   - Update helper functions

4. **Update queries and filters**
   - Adjust field names
   - Update filter logic
   - Modify aggregations

## Conclusion

This generic security schema provides a comprehensive, flexible foundation for security operations across any industry. Its domain-independent design, combined with extensibility through metadata fields, makes it suitable for diverse use cases while maintaining consistency and interoperability.

The schema balances completeness with simplicity, providing essential security features while allowing customization for specific industry requirements.
