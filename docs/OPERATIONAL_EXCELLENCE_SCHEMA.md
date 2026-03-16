# Operational Excellence Database Schema

## Overview

This document describes the Supabase database schema for the Operational Excellence platform, designed to support multi-tenant industrial IoT operations across four main feature areas:

- **Performance**: OEE monitoring and performance tracking
- **Lean Execution (SIM)**: Shift Information Management and operational workflows
- **Continuous Improvement (CI)**: CI projects, root cause analysis, and countermeasures
- **AI-Assisted Optimisation**: Opportunities, recommendations, and scenario planning

## Architecture

### Multi-Tenant Design
The schema supports multi-tenant architecture with Row Level Security (RLS) policies to ensure data isolation between tenants.

### Sector-Specific Support
The schema accommodates sector-specific data while maintaining cross-sector compatibility:
- **Oil & Gas - Upstream**: Well performance, production tracking, energy metrics
- **Power - Transmission**: Grid performance, relay operations, transmission losses
- **FMCG - Food & Beverage**: Line performance, changeover efficiency, packaging yield

## Database Tables

### Core Infrastructure Tables

#### `tenants`
Multi-tenant organizations using the platform.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(255) | Organization name |
| `sector` | VARCHAR(100) | Industry sector |
| `subsector` | VARCHAR(100) | Industry subsector |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

#### `sites`
Physical sites/facilities within each tenant organization.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `tenant_id` | UUID | Foreign key to tenants |
| `name` | VARCHAR(255) | Site name |
| `location` | VARCHAR(255) | Site location |
| `timezone` | VARCHAR(50) | Site timezone |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

#### `assets`
Equipment and assets at each site.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `site_id` | UUID | Foreign key to sites |
| `name` | VARCHAR(255) | Asset name |
| `type` | VARCHAR(100) | Asset type |
| `description` | TEXT | Asset description |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### Performance Feature Area

#### `performance_panels`
OEE and performance monitoring data for assets.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `tenant_id` | UUID | Foreign key to tenants |
| `asset_id` | UUID | Foreign key to assets |
| `name` | VARCHAR(255) | Panel name |
| `oee` | DECIMAL(5,2) | Overall Equipment Effectiveness (0-100%) |
| `availability` | DECIMAL(5,2) | Equipment availability (0-100%) |
| `performance` | DECIMAL(5,2) | Performance efficiency (0-100%) |
| `quality` | DECIMAL(5,2) | Quality rate (0-100%) |
| `last_updated` | TIMESTAMPTZ | Last data update |
| `sector` | VARCHAR(100) | Industry sector |
| `subsector` | VARCHAR(100) | Industry subsector |

**Sector-Specific Fields:**

**Oil & Gas - Upstream:**
- `well_uptime` - Well uptime percentage
- `planned_production` - Planned production (barrels/day)
- `actual_production` - Actual production (barrels/day)
- `energy_per_barrel` - Energy consumption per barrel
- `flow_assurance_status` - Flow assurance status
- `deferment_hours` - Production deferment hours

**Power - Transmission:**
- `line_loading` - Transmission line loading percentage
- `transformer_loading` - Transformer loading percentage
- `transmission_losses` - Transmission losses percentage
- `saidi` - System Average Interruption Duration Index
- `saifi` - System Average Interruption Frequency Index
- `trip_count` - Number of trips

**FMCG - Food & Beverage:**
- `changeover_efficiency` - Changeover efficiency percentage
- `packaging_yield` - Packaging yield percentage
- `batch_yield` - Batch yield percentage
- `scrap_rate` - Scrap rate percentage
- `micro_stop_frequency` - Micro-stop frequency

#### `performance_losses`
Production losses categorized by type and impact.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `performance_panel_id` | UUID | Foreign key to performance_panels |
| `category` | VARCHAR(100) | Loss category |
| `duration_minutes` | INTEGER | Duration in minutes |
| `frequency` | INTEGER | Frequency of occurrence |
| `impact_percentage` | DECIMAL(5,2) | Impact on performance |

#### `performance_bottlenecks`
Identified bottlenecks constraining performance.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `performance_panel_id` | UUID | Foreign key to performance_panels |
| `asset_id` | UUID | Foreign key to assets |
| `constraint_description` | TEXT | Description of constraint |
| `severity` | severity_level | Severity (high/medium/low) |
| `impact_description` | TEXT | Impact description |

### Lean Execution (SIM) Feature Area

#### `sim_boards`
Shift Information Management boards for operational workflows.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `tenant_id` | UUID | Foreign key to tenants |
| `site_id` | UUID | Foreign key to sites |
| `name` | VARCHAR(255) | Board name |
| `shift_name` | VARCHAR(50) | Shift identifier |
| `shift_date` | DATE | Shift date |
| `status` | sim_status | Status (on-track/at-risk/behind) |
| `sector` | VARCHAR(100) | Industry sector |
| `subsector` | VARCHAR(100) | Industry subsector |

**Sector-Specific Fields:**

**Oil & Gas - Upstream:**
- `field_name` - Oil field name
- `pad_name` - Well pad name
- `well_count` - Total wells
- `active_wells` - Active wells
- `barrel_at_risk` - Barrels at risk
- `mcf_at_risk` - MCF at risk
- `separator_status` - Separator status
- `trunkline_status` - Trunkline status
- `pressure_reading` - Pressure reading (psi)
- `temperature_reading` - Temperature reading (°F)
- `flow_rate` - Flow rate (bbl/day)

**Power - Transmission:**
- `control_center` - Control center name
- `system_loading` - System loading percentage
- `outage_count` - Number of outages
- `switching_orders_count` - Switching orders count
- `high_impact_events` - High impact events
- `system_status` - System status
- `grid_stability` - Grid stability percentage
- `voltage_profile` - Voltage profile status

**FMCG - Food & Beverage:**
- `line_name` - Production line name
- `current_sku` - Current SKU being produced
- `hourly_target` - Hourly production target
- `hourly_actual` - Actual hourly production
- `blocking_events` - Number of blocking events
- `starving_events` - Number of starving events
- `changeover_status` - Changeover status
- `material_shortages` - Material shortages count
- `cip_status` - Clean-in-place status
- `quality_status` - Quality status

#### `sim_metrics`
Key performance metrics tracked during shifts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `sim_board_id` | UUID | Foreign key to sim_boards |
| `name` | VARCHAR(100) | Metric name |
| `target_value` | DECIMAL(10,2) | Target value |
| `actual_value` | DECIMAL(10,2) | Actual value |
| `unit` | VARCHAR(50) | Unit of measurement |
| `status` | status_level | Status (good/warning/critical) |

#### `issues`
Operational issues and problems requiring resolution.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `tenant_id` | UUID | Foreign key to tenants |
| `sim_board_id` | UUID | Foreign key to sim_boards (optional) |
| `title` | VARCHAR(500) | Issue title |
| `category` | VARCHAR(100) | Issue category |
| `priority` | priority_level | Priority (high/medium/low) |
| `status` | issue_status | Status (open/in-progress/resolved) |
| `assignee` | VARCHAR(255) | Assigned person |
| `description` | TEXT | Issue description |

### Continuous Improvement (CI) Feature Area

#### `ci_projects`
Continuous improvement projects and initiatives.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `tenant_id` | UUID | Foreign key to tenants |
| `title` | VARCHAR(500) | Project title |
| `stage` | ci_stage | Project stage |
| `priority` | priority_level | Priority level |
| `owner` | VARCHAR(255) | Project owner |
| `target_kpi` | VARCHAR(255) | Target KPI |
| `target_improvement` | VARCHAR(255) | Target improvement |
| `sector` | VARCHAR(100) | Industry sector |
| `subsector` | VARCHAR(100) | Industry subsector |
| `project_type` | VARCHAR(100) | Project type |
| `description` | TEXT | Project description |
| `start_date` | DATE | Start date |
| `end_date` | DATE | End date |
| `completion_percentage` | DECIMAL(5,2) | Completion percentage |

**CI Stages:**
- `backlog` - In project backlog
- `analysis` - Analysis phase
- `implementation` - Implementation phase
- `validation` - Validation phase
- `verified` - Verified and completed

#### `root_causes`
Root cause analysis results for CI projects.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `ci_project_id` | UUID | Foreign key to ci_projects |
| `category` | VARCHAR(100) | Root cause category |
| `description` | TEXT | Root cause description |
| `evidence` | JSONB | Supporting evidence array |
| `verified` | BOOLEAN | Verification status |

#### `countermeasures`
Corrective actions and countermeasures.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `ci_project_id` | UUID | Foreign key to ci_projects |
| `root_cause_id` | UUID | Foreign key to root_causes (optional) |
| `description` | TEXT | Countermeasure description |
| `status` | countermeasure_status | Status (planned/in-progress/completed) |
| `owner` | VARCHAR(255) | Responsible person |
| `due_date` | DATE | Due date |
| `completed_date` | DATE | Completion date |

### AI-Assisted Optimisation Feature Area

#### `optimisation_opportunities`
AI-identified optimization opportunities.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `tenant_id` | UUID | Foreign key to tenants |
| `title` | VARCHAR(500) | Opportunity title |
| `rank_priority` | INTEGER | Priority ranking |
| `category` | VARCHAR(100) | Optimization category |
| `potential_impact` | TEXT | Expected impact |
| `confidence_percentage` | DECIMAL(5,2) | AI confidence level |
| `status` | optimisation_status | Status |
| `sector` | VARCHAR(100) | Industry sector |
| `subsector` | VARCHAR(100) | Industry subsector |
| `description` | TEXT | Detailed description |

**Optimisation Status:**
- `new` - Newly identified
- `under-review` - Under review
- `approved` - Approved for implementation
- `rejected` - Rejected
- `implemented` - Successfully implemented

#### `recommendations`
AI-generated recommendations for optimization.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `optimisation_opportunity_id` | UUID | Foreign key to optimisation_opportunities |
| `description` | TEXT | Recommendation description |
| `rationale` | TEXT | Reasoning behind recommendation |
| `confidence_percentage` | DECIMAL(5,2) | Confidence level |
| `estimated_impact` | TEXT | Expected impact |

#### `playbooks`
Best practice playbooks and guides.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(255) | Playbook name |
| `category` | VARCHAR(100) | Playbook category |
| `description` | TEXT | Playbook description |
| `applicability_percentage` | DECIMAL(5,2) | Applicability for context |
| `content` | JSONB | Structured playbook content |

#### `scenarios`
Optimization scenario simulations and projections.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `optimisation_opportunity_id` | UUID | Foreign key to optimisation_opportunities |
| `name` | VARCHAR(255) | Scenario name |
| `parameters` | JSONB | Scenario parameters |
| `projected_outcome` | TEXT | Expected outcome |
| `confidence_percentage` | DECIMAL(5,2) | Confidence level |

### Reference Data

#### `sectors`
Industry sectors and subsectors reference data.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `code` | VARCHAR(50) | Sector code |
| `name` | VARCHAR(255) | Sector name |
| `subsectors` | JSONB | Array of subsector names |

## Database Views

### `performance_summary`
Summary view of performance panels with tenant, site, and asset information.

### `active_issues_summary`
Summary of active (open/in-progress) issues across all tenants.

### `ci_projects_summary`
Summary of CI projects with countermeasure counts and completion status.

### `optimisation_opportunities_summary`
Summary of optimization opportunities with related recommendations and scenarios.

## Indexes

The schema includes comprehensive indexes for optimal query performance:

- **Tenant-based indexes**: All multi-tenant tables indexed by `tenant_id`
- **Sector filtering**: Indexes on `sector` and `subsector` columns
- **Date-based queries**: Indexes on timestamp and date columns
- **Status filtering**: Indexes on status and priority columns
- **Foreign key relationships**: All foreign keys are indexed

## Security Features

### Row Level Security (RLS)
- Enabled on all tenant-specific tables
- Policies ensure users only access their tenant's data
- Example policies provided (commented out, customize based on auth setup)

### Data Validation
- Check constraints on percentage fields (0-100%)
- Enum types for consistent status values
- Foreign key constraints maintain referential integrity

### Audit Trail
- `created_at` and `updated_at` timestamps on all tables
- Automatic timestamp updates via triggers
- Comprehensive audit logging capability

## Usage Examples

### Basic Queries

```sql
-- Get performance panels for a tenant
SELECT * FROM performance_panels WHERE tenant_id = 'tenant-uuid';

-- Get active issues summary
SELECT * FROM active_issues_summary WHERE status IN ('open', 'in-progress');

-- Get CI projects by stage
SELECT * FROM ci_projects WHERE stage = 'implementation';
```

### Sector-Specific Queries

```sql
-- Oil & Gas upstream performance
SELECT name, oee, well_uptime, actual_production 
FROM performance_panels 
WHERE sector = 'Oil & Gas' AND subsector = 'Upstream';

-- Power transmission metrics
SELECT name, line_loading, transmission_losses, saidi 
FROM performance_panels 
WHERE sector = 'Power' AND subsector = 'Transmission';
```

### Analytics Queries

```sql
-- Average OEE by sector
SELECT sector, AVG(oee) as avg_oee 
FROM performance_panels 
GROUP BY sector;

-- Top optimization opportunities
SELECT title, potential_impact, confidence_percentage 
FROM optimisation_opportunities 
WHERE status = 'new' 
ORDER BY rank_priority;
```

## Installation

1. **Create Database**: Run `supabase-operational-excellence-schema.sql`
2. **Load Sample Data**: Run `supabase-sample-data.sql`
3. **Configure RLS**: Uncomment and customize RLS policies
4. **Set up Authentication**: Configure Supabase auth integration

## Integration

### TypeScript Integration
- Use `supabase-types.ts` for type definitions
- Use `supabase-client-utils.ts` for database operations
- Includes real-time subscription support

### API Patterns
- RESTful API through Supabase auto-generated endpoints
- Real-time subscriptions for live data updates
- Comprehensive filtering and pagination support

## Maintenance

### Regular Tasks
- Monitor index performance
- Update statistics for query optimization
- Review and optimize RLS policies
- Backup and disaster recovery procedures

### Scaling Considerations
- Partition large tables by tenant or date
- Consider read replicas for analytics workloads
- Monitor connection pooling and query performance

## Support

For questions or issues with the schema:
1. Review the sample data and queries
2. Check the TypeScript utilities for usage examples
3. Refer to Supabase documentation for platform-specific features