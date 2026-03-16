# Generic Energy Management System (EMS) Supabase Schema Documentation

## Overview

This document provides comprehensive documentation for a generic, domain-independent Energy Management System (EMS) Supabase database schema. Unlike industry-specific schemas, this generic EMS is designed to be applicable across various sectors including:

- **Manufacturing facilities** - Production lines, process equipment, utilities
- **Commercial buildings** - Offices, retail spaces, hospitality
- **Healthcare facilities** - Hospitals, clinics, laboratories
- **Educational institutions** - Schools, universities, research facilities
- **Data centers** - Server farms, telecommunications facilities
- **Industrial operations** - Warehouses, distribution centers, processing plants

## Key Design Principles

### 1. Domain Independence
- Generic energy types (electricity, natural gas, steam, etc.)
- Flexible equipment categorization
- Industry-agnostic terminology
- Configurable units and measurements

### 2. Multi-Tenant Architecture
- Organization-level isolation
- Site-based hierarchy
- Scalable for enterprise deployments
- Flexible access control

### 3. Extensibility
- JSONB metadata fields for custom attributes
- Configurable energy types and units
- Flexible reporting and analytics
- Integration-ready design

### 4. Performance Optimization
- TimescaleDB for time-series data
- Comprehensive indexing strategy
- Efficient query patterns
- Data retention policies

## Database Extensions

The schema requires the following PostgreSQL extensions:

- `uuid-ossp` - UUID generation functions
- `pg_stat_statements` - Query performance statistics
- `timescaledb` - Time-series data optimization for energy telemetry

## Custom Types and Enums

### Energy Types (Comprehensive)
```sql
CREATE TYPE energy_type AS ENUM (
    'electricity',
    'natural_gas',
    'propane',
    'diesel',
    'gasoline',
    'fuel_oil',
    'steam',
    'compressed_air',
    'chilled_water',
    'hot_water',
    'solar',
    'wind',
    'biomass',
    'other'
);
```

### Meter Status
```sql
CREATE TYPE meter_status AS ENUM (
    'normal',
    'warning',
    'critical',
    'offline',
    'maintenance'
);
```

### Load Types (Generic Categories)
```sql
CREATE TYPE load_type AS ENUM (
    'hvac',
    'lighting',
    'motor_drive',
    'pump',
    'compressor',
    'fan',
    'conveyor',
    'process_equipment',
    'it_equipment',
    'refrigeration',
    'heating',
    'ventilation',
    'other'
);
```

### Generation Types
```sql
CREATE TYPE generation_type AS ENUM (
    'diesel_generator',
    'gas_generator',
    'solar_pv',
    'wind_turbine',
    'battery_storage',
    'ups',
    'fuel_cell',
    'micro_turbine',
    'cogeneration',
    'other'
);
```

### Operating Modes
```sql
CREATE TYPE operating_mode AS ENUM (
    'off',
    'standby',
    'low',
    'normal',
    'high',
    'maximum',
    'maintenance'
);
```

## Core Schema Architecture

### Hierarchical Structure
```
Organizations
├── Sites (Buildings/Facilities)
    ├── Energy Meters (Main measurement points)
    │   ├── Submeters (Equipment-level monitoring)
    │   └── Energy Telemetry (Time-series data)
    ├── Controllable Loads (Demand response assets)
    ├── Generation Assets (On-site generation)
    └── Equipment Modes (Operational optimization)
```

## Core Tables Documentation

### 1. Organizations Table

**Purpose:** Multi-tenant support for different organizations using the EMS.

**Key Fields:**
- `id` (UUID) - Primary key
- `name` (VARCHAR) - Organization name
- `industry` (VARCHAR) - Industry sector
- `timezone` (VARCHAR) - Default timezone
- `currency_code` (VARCHAR) - Default currency (USD, EUR, etc.)
- `metadata` (JSONB) - Custom organizational attributes

**Use Cases:**
- Multi-tenant SaaS deployments
- Enterprise with multiple divisions
- Service provider managing multiple clients
- Franchise operations

### 2. Sites Table

**Purpose:** Physical locations/facilities within organizations.

**Key Fields:**
- `organization_id` (UUID) - Parent organization
- `name` (VARCHAR) - Site name
- `site_type` (VARCHAR) - Facility type (manufacturing, office, etc.)
- `area_sqft` (DECIMAL) - Floor area for intensity calculations
- `operating_hours_per_day` (DECIMAL) - Operational schedule
- `weather_station_id` (VARCHAR) - Weather data integration
- `metadata` (JSONB) - Site-specific attributes

**Use Cases:**
- Multi-site organizations
- Campus environments
- Retail chains
- Manufacturing networks

### 3. Energy Meters Table

**Purpose:** Main energy measurement points for comprehensive monitoring.

**Key Fields:**
- `site_id` (UUID) - Parent site reference
- `name` (VARCHAR) - Meter identification
- `meter_type` (VARCHAR) - Classification (main, submeter, check_meter)
- `scope` (VARCHAR) - Coverage area (building, floor, department)
- `energy_types` (energy_type[]) - Array of measured energy types
- `current_demand` (DECIMAL) - Real-time demand reading
- `status` (meter_status) - Operational status
- `communication_protocol` (VARCHAR) - Data collection method
- `meter_constant` (DECIMAL) - Calibration factor

**Relationships:**
- Parent to submeters and telemetry data
- Links to controllable loads and generation assets
- References activity context for normalization

### 4. Submeters Table

**Purpose:** Equipment-level and area-specific energy monitoring.

**Key Fields:**
- `parent_meter_id` (UUID) - Parent meter reference
- `equipment_id` (UUID) - Monitored equipment reference
- `energy_type` (energy_type) - Specific energy type
- `current_value` (DECIMAL) - Current reading
- `unit` (VARCHAR) - Measurement unit
- `location` (VARCHAR) - Physical location

**Use Cases:**
- Equipment-level monitoring
- Department/area allocation
- Process-specific tracking
- Tenant billing in commercial buildings

### 5. Energy Telemetry Table (TimescaleDB Hypertable)

**Purpose:** High-performance time-series energy consumption data storage.

**Key Fields:**
- `meter_id` (UUID) - Meter reference
- `timestamp` (TIMESTAMPTZ) - Measurement time
- `energy_consumed` (DECIMAL) - Cumulative energy consumption
- `demand` (DECIMAL) - Instantaneous demand
- `voltage`, `current`, `power_factor` - Electrical parameters
- `temperature`, `humidity` - Environmental conditions
- `quality_score` (DECIMAL) - Data quality indicator
- `data_source` (VARCHAR) - Data origin (meter, sensor, calculated)

**Optimization Features:**
- TimescaleDB hypertable for time-series performance
- Automatic partitioning by time
- Compression for historical data
- Efficient aggregation queries

### 6. Power Quality Monitoring

**Purpose:** Electrical power quality analysis and event tracking.

**Key Fields:**
- `power_factor` (DECIMAL) - Power factor measurement
- `thd_voltage_pct`, `thd_current_pct` - Harmonic distortion
- `voltage_l1/l2/l3` - Three-phase voltage measurements
- `current_l1/l2/l3` - Three-phase current measurements
- `voltage_imbalance_pct` - Phase imbalance
- Historical arrays for trend analysis

**Applications:**
- Power quality compliance monitoring
- Equipment protection
- Energy efficiency analysis
- Utility coordination

### 7. Energy Anomalies Table

**Purpose:** Automated detection and analysis of energy consumption anomalies.

**Key Fields:**
- `anomaly_type` (anomaly_type) - Classification of anomaly
- `magnitude_pct` (DECIMAL) - Deviation magnitude
- `severity` (severity_level) - Impact assessment
- `baseline_value`, `actual_value` - Comparison values
- `detection_method` (VARCHAR) - Detection algorithm used
- `confidence_score` (DECIMAL) - Detection confidence
- `root_cause`, `corrective_actions` - Analysis results

**Detection Methods:**
- Statistical analysis (z-score, control charts)
- Machine learning models
- Rule-based systems
- Comparative analysis

### 8. Energy Baselines Table

**Purpose:** Energy consumption baselines for measurement and verification (M&V).

**Key Fields:**
- `baseline_name` (VARCHAR) - Baseline identifier
- `baseline_type` (VARCHAR) - Methodology (historical, engineered, regression)
- `baseline_value` (DECIMAL) - Expected consumption
- `normalization_factors` (JSONB) - Weather, occupancy, production adjustments
- `confidence_level` (DECIMAL) - Statistical confidence
- `r_squared`, `cv_rmse` - Model performance metrics

**Applications:**
- Energy savings verification
- Performance tracking
- Efficiency program evaluation
- Regulatory compliance

### 9. Controllable Loads Table

**Purpose:** Assets available for demand response and load management.

**Key Fields:**
- `load_type` (load_type) - Equipment category
- `control_priority` (INTEGER) - Shedding priority (1 = highest)
- `min_off_duration_min` - Minimum control duration
- `max_control_duration_min` - Maximum control duration
- `rated_capacity` (DECIMAL) - Maximum load capacity
- `control_method` (VARCHAR) - Control strategy
- `comfort_constraints` (JSONB) - Operational limits
- `annual_control_limit_hours` - Usage restrictions

**Control Methods:**
- On/off control
- Load modulation
- Setpoint adjustment
- Scheduled operation

### 10. Generation Assets Table

**Purpose:** On-site generation and energy storage systems.

**Key Fields:**
- `generation_type` (generation_type) - Asset category
- `rated_capacity` (DECIMAL) - Maximum output capacity
- `current_output` (DECIMAL) - Real-time output
- `efficiency_pct` (DECIMAL) - Operating efficiency
- `fuel_consumption_rate` - Fuel usage rate
- `emissions_factor` - Environmental impact
- `runtime_hours`, `starts_count` - Operational metrics

**Applications:**
- Peak shaving
- Backup power
- Grid independence
- Renewable integration

### 11. Demand Response Events Table

**Purpose:** Demand response program participation and load management events.

**Key Fields:**
- `event_type` (dr_event_type) - Event classification
- `scheduled_start/end` - Planned event timing
- `actual_start/end` - Actual event timing
- `requested_reduction` - Target load reduction
- `actual_reduction` - Achieved reduction
- `participating_loads` (UUID[]) - Controlled assets
- `performance_score` - Event effectiveness
- `incentive_payment` - Financial compensation

**Event Types:**
- Peak shaving (reduce peak demand)
- Load shifting (move consumption to off-peak)
- Emergency response (grid stability support)
- Economic dispatch (price-responsive operation)

### 12. Energy Tariffs Table

**Purpose:** Energy pricing structures and cost calculation.

**Key Fields:**
- `tariff_structure` (VARCHAR) - Pricing model
- `base_rate` (DECIMAL) - Standard rate
- `demand_charge` - Peak demand charges
- `time_of_use_rates` (JSONB) - Peak/off-peak pricing
- `seasonal_rates` (JSONB) - Seasonal variations
- `tier_rates` (JSONB) - Tiered pricing structures
- `fixed_charges` (JSONB) - Monthly fixed costs

**Tariff Structures:**
- Flat rate
- Tiered pricing
- Time-of-use (TOU)
- Real-time pricing
- Demand charges

### 13. Activity Context Table

**Purpose:** Production, occupancy, and operational data for energy normalization.

**Key Fields:**
- `activity_type` (VARCHAR) - Context category
- `activity_value` (DECIMAL) - Quantitative measure
- `weather_temperature`, `weather_humidity` - Environmental conditions
- `occupancy_count`, `occupancy_percentage` - Building occupancy
- `production_rate` - Manufacturing output
- `operating_schedule` (JSONB) - Operational patterns

**Applications:**
- Energy intensity calculations
- Weather normalization
- Occupancy-based analysis
- Production correlation

### 14. Equipment Modes Table

**Purpose:** Operating mode management for energy optimization.

**Key Fields:**
- `equipment_id` (UUID) - Equipment reference
- `current_mode` (operating_mode) - Active operating mode
- `available_modes` (JSONB) - Mode configurations
- `efficiency_rating` (DECIMAL) - Equipment efficiency
- `energy_star_rating` - Efficiency certification
- `next_maintenance_hours` - Maintenance scheduling

**Mode Configurations:**
- Power consumption per mode
- Efficiency ratings
- Risk assessments
- Time constraints

### 15. Efficiency Curves Table

**Purpose:** Equipment performance curves and optimization analysis.

**Key Fields:**
- `design_capacity` (DECIMAL) - Rated capacity
- `best_efficiency_point` (JSONB) - Optimal operating point
- `current_operating_point` (JSONB) - Real-time performance
- `curve_data` (JSONB) - Performance curve points
- `curve_type` (VARCHAR) - Data source (manufacturer, measured, modeled)

**Applications:**
- Performance optimization
- Energy efficiency analysis
- Equipment sizing
- Operating point recommendations

### 16. Energy Benchmarks Table

**Purpose:** Industry benchmarks and performance comparisons.

**Key Fields:**
- `industry_sector` (VARCHAR) - Industry classification
- `building_type` (VARCHAR) - Facility type
- `metric_name` (VARCHAR) - Performance metric
- `benchmark_type` (VARCHAR) - Benchmark category
- `percentile_10/25/50/75/90` - Performance distributions
- `data_source` (VARCHAR) - Benchmark source
- `geographic_scope` - Regional applicability

**Benchmark Types:**
- Industry average
- Best practice
- Regulatory standards
- Peer comparisons

## Performance Optimization

### TimescaleDB Integration

The energy telemetry table is optimized as a TimescaleDB hypertable:

```sql
SELECT create_hypertable('energy_telemetry', 'timestamp');
```

**Benefits:**
- Automatic time-based partitioning
- Optimized time-range queries
- Efficient data compression
- Parallel query execution

### Indexing Strategy

**Time-Series Indexes:**
```sql
CREATE INDEX idx_energy_telemetry_meter_timestamp 
ON energy_telemetry(meter_id, timestamp DESC);
```

**Categorical Indexes:**
```sql
CREATE INDEX idx_energy_meters_energy_types 
ON energy_meters USING GIN(energy_types);
```

**Composite Indexes:**
```sql
CREATE INDEX idx_controllable_loads_site_priority 
ON controllable_loads(site_id, control_priority);
```

### Query Optimization Patterns

**Time-Range Queries:**
```sql
-- Efficient time-range query with meter filter
SELECT * FROM energy_telemetry 
WHERE meter_id = $1 
AND timestamp BETWEEN $2 AND $3
ORDER BY timestamp DESC;
```

**Aggregation Queries:**
```sql
-- Hourly aggregation with TimescaleDB
SELECT time_bucket('1 hour', timestamp) as hour,
       AVG(demand) as avg_demand,
       MAX(demand) as peak_demand
FROM energy_telemetry 
WHERE meter_id = $1 
AND timestamp > NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour;
```

## Utility Functions

### Energy Consumption Calculation
```sql
SELECT * FROM calculate_energy_consumption(
    'meter-001'::UUID,
    '2024-01-01 00:00:00'::TIMESTAMPTZ,
    '2024-01-31 23:59:59'::TIMESTAMPTZ
);
```

### Energy Intensity Analysis
```sql
SELECT * FROM calculate_energy_intensity(
    'site-001'::UUID,
    '2024-01-01 00:00:00'::TIMESTAMPTZ,
    '2024-01-31 23:59:59'::TIMESTAMPTZ,
    'production'
);
```

### Latest Telemetry Retrieval
```sql
SELECT * FROM get_latest_telemetry('meter-001'::UUID);
```

## Security and Access Control

### Row Level Security (RLS)

All tables implement RLS with organization-based isolation:

```sql
-- Example: Organization-based access control
CREATE POLICY "Users can access their organization data" 
ON sites FOR ALL TO authenticated 
USING (organization_id IN (
    SELECT organization_id FROM user_organizations 
    WHERE user_id = auth.uid()
));
```

### Multi-Tenant Isolation

**Organization Level:**
- Complete data isolation between organizations
- Shared reference data (benchmarks, emission factors)
- Configurable cross-organization reporting

**Site Level:**
- Site-based access control within organizations
- Department/area-based restrictions
- Equipment-specific permissions

### API Security

**Authentication:**
- Supabase Auth integration
- JWT token validation
- Multi-factor authentication support

**Authorization:**
- Role-based access control (RBAC)
- Attribute-based access control (ABAC)
- Fine-grained permissions

## Data Integration Patterns

### Real-Time Data Ingestion

**SCADA/BMS Integration:**
```sql
-- Batch insert for high-frequency data
INSERT INTO energy_telemetry (meter_id, timestamp, energy_consumed, demand)
SELECT meter_id, timestamp, energy_consumed, demand
FROM staging_telemetry_data
WHERE processed = false;
```

**IoT Device Integration:**
- MQTT message processing
- REST API endpoints
- Webhook integrations
- File-based imports

### External System Integration

**ERP Systems:**
- Cost allocation
- Budget tracking
- Procurement integration

**Weather Services:**
- Degree day calculations
- Weather normalization
- Forecast integration

**Utility Systems:**
- Bill validation
- Rate schedule updates
- Demand response signals

## Industry Applications

### Manufacturing Facilities

**Equipment Monitoring:**
- Production line energy tracking
- Process optimization
- Equipment efficiency analysis
- Maintenance scheduling

**Cost Management:**
- Department allocation
- Product costing
- Budget variance analysis
- Peak demand management

### Commercial Buildings

**Tenant Billing:**
- Sub-metering by tenant
- Common area allocation
- Utility bill reconciliation
- Green lease compliance

**Building Optimization:**
- HVAC optimization
- Lighting control
- Occupancy-based control
- Energy Star benchmarking

### Healthcare Facilities

**Critical System Monitoring:**
- Backup power systems
- Medical equipment power quality
- Environmental controls
- Emergency preparedness

**Compliance Tracking:**
- Regulatory reporting
- Sustainability goals
- Energy efficiency standards
- Carbon footprint reduction

### Data Centers

**Infrastructure Monitoring:**
- Power Usage Effectiveness (PUE)
- Cooling efficiency
- Server utilization correlation
- Capacity planning

**Cost Optimization:**
- Time-of-use optimization
- Demand response participation
- Renewable energy integration
- Carbon offset tracking

## Reporting and Analytics

### Standard Reports

**Energy Consumption Reports:**
- Daily/weekly/monthly summaries
- Trend analysis
- Comparative analysis
- Exception reporting

**Cost Analysis Reports:**
- Utility bill analysis
- Budget variance reports
- Cost allocation reports
- Savings verification

**Efficiency Reports:**
- Equipment performance
- Benchmark comparisons
- Efficiency trends
- Optimization opportunities

### Custom Analytics

**Energy Intensity Metrics:**
- Energy per square foot
- Energy per unit of production
- Weather-normalized consumption
- Occupancy-adjusted usage

**Performance Indicators:**
- Peak demand trends
- Load factor analysis
- Power quality metrics
- Anomaly frequency

## Deployment and Maintenance

### Initial Setup

1. **Database Preparation:**
   ```sql
   -- Enable required extensions
   CREATE EXTENSION IF NOT EXISTS "timescaledb";
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

2. **Schema Deployment:**
   ```bash
   psql -d your_database -f generic-ems-schema.sql
   ```

3. **Data Validation:**
   ```sql
   -- Verify hypertable creation
   SELECT * FROM timescaledb_information.hypertables;
   
   -- Check sample data
   SELECT COUNT(*) FROM organizations;
   SELECT COUNT(*) FROM sites;
   SELECT COUNT(*) FROM energy_meters;
   ```

### Maintenance Procedures

**Data Retention:**
```sql
-- Set up data retention policy
SELECT add_retention_policy('energy_telemetry', INTERVAL '2 years');
```

**Performance Monitoring:**
```sql
-- Monitor query performance
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE query LIKE '%energy_telemetry%'
ORDER BY total_time DESC;
```

**Data Quality Checks:**
```sql
-- Check for data gaps
SELECT meter_id, 
       MAX(timestamp) as last_reading,
       NOW() - MAX(timestamp) as time_since_last
FROM energy_telemetry
GROUP BY meter_id
HAVING NOW() - MAX(timestamp) > INTERVAL '1 hour';
```

## Best Practices

### Data Quality

**Validation Rules:**
- Range checks for meter readings
- Timestamp validation
- Data completeness monitoring
- Anomaly detection

**Data Cleansing:**
- Outlier detection and handling
- Missing data interpolation
- Duplicate record prevention
- Quality scoring

### Performance Optimization

**Query Optimization:**
- Use appropriate indexes
- Leverage TimescaleDB features
- Optimize aggregation queries
- Monitor query performance

**Data Management:**
- Implement data retention policies
- Regular maintenance tasks
- Backup and recovery procedures
- Capacity planning

### Security Considerations

**Data Protection:**
- Encrypt sensitive data
- Secure API endpoints
- Audit data access
- Regular security reviews

**Access Control:**
- Principle of least privilege
- Regular access reviews
- Strong authentication
- Session management

## Extension and Customization

### Adding New Energy Types

1. **Update Enum:**
   ```sql
   ALTER TYPE energy_type ADD VALUE 'hydrogen';
   ```

2. **Update Tariffs and Emission Factors:**
   ```sql
   INSERT INTO emission_factors (factor_name, energy_type, factor_value, factor_unit)
   VALUES ('Hydrogen Fuel Cell', 'hydrogen', 0.0, 'kg_CO2_per_kg');
   ```

### Custom Metrics

**New Telemetry Parameters:**
```sql
-- Add custom columns to energy_telemetry
ALTER TABLE energy_telemetry 
ADD COLUMN custom_parameter DECIMAL(10,4);
```

**Custom Calculations:**
```sql
-- Create custom calculation functions
CREATE OR REPLACE FUNCTION calculate_custom_metric(...)
RETURNS TABLE (...) AS $$
-- Custom logic here
$$ LANGUAGE plpgsql;
```

### Industry-Specific Extensions

**Manufacturing:**
- Production correlation tables
- Equipment efficiency tracking
- Process-specific metrics

**Commercial Buildings:**
- Tenant management
- Space utilization tracking
- Green building certifications

**Healthcare:**
- Critical system monitoring
- Regulatory compliance tracking
- Patient safety correlations

## Support and Resources

### Documentation References
- PostgreSQL documentation
- TimescaleDB best practices
- Supabase guides
- Energy management standards

### Industry Standards
- ISO 50001 Energy Management
- ASHRAE guidelines
- IPMVP protocols
- Green building standards

### Community Resources
- Energy management forums
- Open-source tools
- Industry associations
- Professional networks

---

*This generic EMS schema provides a comprehensive foundation for energy management across diverse industries. Customize tables, fields, and relationships based on specific organizational requirements and industry standards.*