# APM Power Transmission - nLVE Navigation User Guide

## Overview

This guide explains how to navigate and use the APM Power Transmission system. The system follows the **nLVE pattern** (Navigate → List → View → Edit) for consistent user experience across all features.

## What is nLVE?

**nLVE** is a navigation pattern that provides a consistent way to interact with data:

1. **Navigate**: Use the sidebar to navigate to a feature area
2. **List**: View a list of items with filters and search
3. **View**: Click an item to see detailed information
4. **Edit**: Modify data (if you have permission)

This pattern is used throughout the APM system for assets, alerts, recommendations, and more.

## System Navigation

### Main Navigation Structure

The APM Power Transmission features are integrated into the existing **Monitor** section:

```
Monitor
├── Asset Inventory & Criticality (FS4)
│   ├── Asset Registry
│   ├── Criticality Scoring
│   ├── Failure Mode Mapping (FMEA)
│   ├── Lifecycle Tracking
│   └── Spare Parts Linkage
│
├── Asset Health & Diagnostics (FS1)
│   ├── Condition Monitoring
│   ├── Health Scoring
│   ├── Anomaly Detection
│   ├── Root Cause Diagnostics
│   └── Degradation Trends
│
├── Asset Performance & Utilisation (FS3)
│   ├── Uptime/Downtime Tracking
│   ├── Reliability KPIs (ARM)
│   ├── Utilisation Monitoring
│   ├── Performance Deviation Detection
│   └── Performance Benchmarking
│
├── Predictive & Prescriptive Maintenance (FS2)
│   ├── Failure Prediction
│   ├── RUL Estimation
│   ├── CBM Triggers
│   ├── Maintenance Recommendations
│   └── Priority Scoring
│
└── Alerts, Reports & Visualisation (FS5)
    ├── Real-time Alerts
    ├── Alert History
    ├── Custom Dashboards
    ├── Reliability Reports
    └── Data Export
```

### Accessing Features

1. **Click "Monitor" in the sidebar**: Opens the Monitor section
2. **Expand a feature set**: Click to see available features
3. **Click a feature**: Navigate to that page

**Example:**
```
Monitor → Asset Health & Diagnostics → Condition Monitoring
```

## Feature Set 4: Asset Inventory & Criticality

### Asset Registry

**Path:** `/monitor/inventory-criticality/asset-registry`

#### Navigate
- Click **Monitor** → **Asset Inventory & Criticality** → **Asset Registry**

#### List
- View all transmission assets in a table
- **Filters:**
  - Asset Type (Transformer, Breaker, Line, etc.)
  - Operational Status (Online, Offline, Maintenance)
  - Location
  - Criticality (Critical, Important, Standard)
- **Search:** Type asset name or tag
- **Sort:** Click column headers to sort

#### View
- Click an asset row to see details:
  - Basic information (name, type, location, voltage)
  - Operational status and criticality
  - Parent/child relationships
  - Linked spare parts
  - Lifecycle events
  - Applicable FMEA entries

#### Edit
- Click **Edit** button (requires `reliability_engineer` role)
- Update asset information
- Click **Save** to commit changes

### Criticality Scoring

**Path:** `/monitor/inventory-criticality/criticality-scoring`

#### Navigate
- Click **Monitor** → **Asset Inventory & Criticality** → **Criticality Scoring**

#### List
- View assets ranked by criticality score
- **Filters:**
  - Criticality Tier (Critical, Important, Standard)
  - Asset Type
- **Sort:** By criticality score (default: highest first)

#### View
- Click an asset to see:
  - Criticality score breakdown
  - Safety impact
  - Production impact
  - Environmental impact
  - Detectability factor

#### Edit
- Click **Edit Model** (requires `reliability_engineer` role)
- Adjust scoring weights
- Recalculate scores

### FMEA Library

**Path:** `/monitor/inventory-criticality/failure-mode-mapping`

#### Navigate
- Click **Monitor** → **Asset Inventory & Criticality** → **Failure Mode Mapping**

#### List
- View FMEA entries for all asset types
- **Filters:**
  - Asset Type
  - Minimum RPN (Risk Priority Number)
- **Sort:** By RPN (default: highest first)

#### View
- Click an FMEA entry to see:
  - Failure mode description
  - Failure cause
  - Failure effect
  - Severity, Occurrence, Detection ratings
  - RPN calculation
  - Recommended actions

#### Edit
- Click **Add FMEA** or **Edit** (requires `reliability_engineer` role)
- Enter failure mode details
- Set severity, occurrence, detection (1-10)
- RPN calculated automatically

### Lifecycle Tracking

**Path:** `/monitor/inventory-criticality/lifecycle-tracking`

#### Navigate
- Click **Monitor** → **Asset Inventory & Criticality** → **Lifecycle Tracking**

#### List
- View assets grouped by lifecycle stage
- **Stages:**
  - Design
  - Procure
  - Install
  - Commission
  - Operate
  - Maintain
  - Refurbish
  - Retire

#### View
- Click an asset to see:
  - Current lifecycle stage
  - Lifecycle history with timestamps
  - Transition notes

#### Edit
- Click **Record Transition** (requires `reliability_engineer` role)
- Select new lifecycle stage
- Add transition notes
- Click **Save**

### Spare Parts Linkage

**Path:** `/monitor/inventory-criticality/spare-parts-linkage`

#### Navigate
- Click **Monitor** → **Asset Inventory & Criticality** → **Spare Parts Linkage**

#### List
- View spare parts inventory
- **Filters:**
  - Asset Type
  - Critical Parts Only
  - Low Stock (quantity ≤ reorder point)

#### View
- Click a spare part to see:
  - Part number and description
  - Applicable asset types
  - On-hand quantity
  - Reorder point
  - Lead time
  - Unit cost
  - Linked assets

#### Edit
- Click **Update Inventory** (requires `maintenance_planner` role)
- Adjust on-hand quantity
- Update reorder point

## Feature Set 1: Asset Health & Diagnostics

### Condition Monitoring

**Path:** `/monitor/health-diagnostics/condition-monitoring`

#### Navigate
- Click **Monitor** → **Asset Health & Diagnostics** → **Condition Monitoring**

#### List
- View assets with latest telemetry readings
- **Filters:**
  - Asset Type
  - Status (Normal, Warning, Critical)
- **Real-time updates:** Page refreshes automatically

#### View
- Click an asset to see:
  - Latest telemetry readings with status colors
  - Parameter values and units
  - Threshold indicators
  - Timestamp of last reading

#### Drill-down
- Click a parameter to see:
  - Time series chart
  - Historical values
  - Threshold lines

### Health Scoring

**Path:** `/monitor/health-diagnostics/health-scoring`

#### Navigate
- Click **Monitor** → **Asset Health & Diagnostics** → **Health Scoring**

#### List
- View assets ranked by health score
- **Filters:**
  - Asset Type
  - Health Score Range (0-100)
- **Sort:** By health score (default: lowest first)

#### View
- Click an asset to see:
  - Overall health score (0-100)
  - Component breakdown chart
  - Contributing factors
  - Historical health trend

#### Analyze
- View parameter contributions
- Identify degrading components
- Compare to historical baseline

### Anomaly Detection

**Path:** `/monitor/health-diagnostics/anomaly-detection`

#### Navigate
- Click **Monitor** → **Asset Health & Diagnostics** → **Anomaly Detection**

#### List
- View detected anomalies and faults
- **Filters:**
  - Asset Type
  - Event Type (Thermal, Electrical, Mechanical, Insulation, Comms)
  - Severity
  - Time Range

#### View
- Click an anomaly to see:
  - Event title and description
  - Confidence level (0-100%)
  - Detected timestamp
  - Telemetry window that triggered detection
  - Current state (Open, Acknowledged, Closed)

#### Act
- Click **Acknowledge** (requires `operations_engineer` role)
- Anomaly marked as acknowledged
- Timestamp and user recorded

### Root Cause Diagnostics

**Path:** `/monitor/health-diagnostics/root-cause`

#### Navigate
- Click **Monitor** → **Asset Health & Diagnostics** → **Root Cause Diagnostics**

#### List
- View diagnostic events requiring investigation
- **Filters:**
  - State (Open, Acknowledged, Closed)
  - Asset Type
  - Time Range

#### View
- Click an event to see:
  - Event details
  - Linked RCA record (if exists)
  - Recommended checks from FMEA
  - Linked downtime events

#### Edit
- Click **Close Event** (requires `reliability_engineer` role)
- Enter resolution notes (required)
- Optionally create RCA record:
  - Root cause
  - Contributing factors
  - Corrective actions
  - Preventive actions
- Click **Save**

### Degradation Trends

**Path:** `/monitor/health-diagnostics/degradation-trends`

#### Navigate
- Click **Monitor** → **Asset Health & Diagnostics** → **Degradation Trends**

#### List
- View parameters showing degradation
- **Filters:**
  - Asset Type
  - Parameter Type
  - Time Horizon (30, 60, 90 days)

#### View
- Click a parameter to see:
  - Historical trend chart
  - Degradation slope
  - Rate of change
  - Projected threshold crossing
  - Rolling statistics

#### Analyze
- Identify parameters approaching thresholds
- Estimate time to intervention
- Plan proactive maintenance

## Feature Set 3: Asset Performance & Utilisation

### Uptime/Downtime Tracking

**Path:** `/monitor/performance-utilisation/uptime-tracking`

#### Navigate
- Click **Monitor** → **Asset Performance & Utilisation** → **Uptime/Downtime Tracking**

#### List
- View downtime events
- **Filters:**
  - Event Type (Planned Maintenance, Unplanned Failure, Forced Outage, Testing)
  - Outage Scope (Bay, Line, Transformer, Substation)
  - Time Range

#### View
- Click an event to see:
  - Start and end time
  - Duration
  - Event type
  - Grid impact (MW)
  - Protection trip code (if applicable)
  - Outage scope
  - Linked RCA record

#### Analyze
- View production impact
- Identify recurring issues
- Plan maintenance windows

### Reliability KPIs (ARM)

**Path:** `/monitor/performance-utilisation/arm-kpis`

#### Navigate
- Click **Monitor** → **Asset Performance & Utilisation** → **Reliability KPIs**

#### List
- View reliability metrics for all assets
- **Time Period Selector:**
  - Last 30 days
  - Last 90 days
  - Last year
  - Custom range

#### View
- Click an asset to see:
  - **MTBF** (Mean Time Between Failures)
  - **MTTR** (Mean Time To Repair)
  - **Availability** (%)
  - Failure count
  - Total downtime
  - Historical trends

#### Compare
- Compare multiple assets
- Compare to benchmarks
- Identify underperforming assets

### Utilisation Monitoring

**Path:** `/monitor/performance-utilisation/utilisation-monitoring`

#### Navigate
- Click **Monitor** → **Asset Performance & Utilisation** → **Utilisation Monitoring**

#### List
- View utilisation metrics for all assets
- **Filters:**
  - Asset Type
  - Time Range

#### View
- Click an asset to see:
  - **Load Factor** (average load / rated capacity)
  - **Peak Current**
  - **Thermal Headroom** (for transformers/lines)
  - **Switching Cycles** (for breakers)
  - Load curves vs rating limits

#### Analyze
- Identify overloaded assets
- Identify underutilized assets
- Plan load balancing

### Performance Deviation Detection

**Path:** `/monitor/performance-utilisation/deviation-detection`

#### Navigate
- Click **Monitor** → **Asset Performance & Utilisation** → **Performance Deviation Detection**

#### List
- View assets deviating from expected performance
- **Filters:**
  - Asset Type
  - Deviation Magnitude (%)
  - Time Range

#### View
- Click a deviation to see:
  - Deviation type
  - Magnitude
  - Detected timestamp
  - Telemetry window
  - Benchmark reference

#### Act
- Investigate root cause
- Plan corrective actions

### Performance Benchmarking

**Path:** `/monitor/performance-utilisation/benchmarking`

#### Navigate
- Click **Monitor** → **Asset Performance & Utilisation** → **Performance Benchmarking**

#### List
- View benchmarks for each asset type
- **Filters:**
  - Asset Type
  - Sector

#### View
- Click a benchmark to see:
  - Target availability
  - Target load factor
  - Target MTBF
  - Actual vs target comparison

#### Edit
- Click **Edit Benchmarks** (requires `apm_admin` role)
- Update target values
- Click **Save**

## Feature Set 2: Predictive & Prescriptive Maintenance

### Failure Prediction

**Path:** `/monitor/predictive-maintenance/failure-prediction`

#### Navigate
- Click **Monitor** → **Predictive & Prescriptive Maintenance** → **Failure Prediction**

#### List
- View failure predictions for all assets
- **Filters:**
  - Risk Level (Low, Medium, High, Critical)
  - Time Horizon (7, 30, 90 days)
  - Asset Type

#### View
- Click a prediction to see:
  - Failure probability (0-100%)
  - Confidence level (0-100%)
  - Time horizon
  - Risk level
  - Contributing factors
  - Linked health indicators

#### Act
- Create maintenance recommendation
- Schedule inspection
- Monitor closely

### RUL Estimation

**Path:** `/monitor/predictive-maintenance/rul-estimation`

#### Navigate
- Click **Monitor** → **Predictive & Prescriptive Maintenance** → **RUL Estimation**

#### List
- View assets with RUL estimates
- **Filters:**
  - Asset Type
  - RUL Threshold (< 30 days, < 90 days, etc.)

#### View
- Click an asset to see:
  - Remaining Useful Life (days)
  - RUL trend chart with confidence bands
  - Critical components
  - Flagged assets (RUL below threshold)

#### Plan
- Schedule replacement
- Order spare parts
- Plan maintenance window

### CBM Triggers

**Path:** `/monitor/predictive-maintenance/cbm-triggers`

#### Navigate
- Click **Monitor** → **Predictive & Prescriptive Maintenance** → **CBM Triggers**

#### List
- View condition-based maintenance triggers
- **Filters:**
  - Asset Type
  - Parameter
  - Active/Inactive

#### View
- Click a trigger to see:
  - Trigger name
  - Parameter
  - Condition operator (>, <, =, rate of change)
  - Threshold value
  - Recommended action
  - Trigger history

#### Edit
- Click **Add Trigger** or **Edit** (requires `reliability_engineer` role)
- Select parameter
- Set condition and threshold
- Enter recommended action
- Click **Save**

### Maintenance Recommendations

**Path:** `/monitor/predictive-maintenance/recommendations`

#### Navigate
- Click **Monitor** → **Predictive & Prescriptive Maintenance** → **Maintenance Recommendations**

#### List
- View maintenance recommendations
- **Filters:**
  - Status (Open, Scheduled, Completed, Cancelled)
  - Priority Score (0-100)
  - Due Date
  - Asset Type
- **Sort:** By priority score (default: highest first)

#### View
- Click a recommendation to see:
  - Recommendation type (Inspection, Repair, Replacement, Calibration, Cleaning)
  - Description
  - Priority score
  - Due date
  - Required spare parts
  - Source (CBM trigger or prediction)
  - Status

#### Act
- **Acknowledge** (requires `maintenance_planner` role)
  - Mark as acknowledged
- **Schedule** (requires `maintenance_planner` role)
  - Set scheduled date
  - Assign to technician
- **Close** (requires `maintenance_planner` role)
  - Enter completion notes (required)
  - Mark as completed or cancelled

### Priority Scoring

**Path:** `/monitor/predictive-maintenance/priority-scoring`

#### Navigate
- Click **Monitor** → **Predictive & Prescriptive Maintenance** → **Priority Scoring**

#### List
- View maintenance backlog ranked by priority
- **Integrated risk score** combines:
  - Asset criticality
  - Health score
  - Failure probability
  - Performance deviations

#### View
- Click a recommendation to see:
  - Priority score breakdown
  - Risk factors
  - Recommended action

#### Edit
- Click **Edit Risk Model** (requires `apm_admin` role)
- Adjust factor weights
- Recalculate scores

## Feature Set 5: Alerts, Reports & Visualisation

### Real-time Alerts

**Path:** `/monitor/alerts-reports/realtime-alerts`

#### Navigate
- Click **Monitor** → **Alerts, Reports & Visualisation** → **Real-time Alerts**

#### List
- View active alerts
- **Filters:**
  - Severity (Info, Warning, Critical, Emergency)
  - State (Open, Acknowledged, Closed)
  - Asset Type
  - Time Range
- **Real-time updates:** New alerts appear automatically

#### View
- Click an alert to see:
  - Alert type
  - Severity
  - Source (Telemetry, Diagnostic, Prediction, Manual)
  - Message
  - Detected timestamp
  - State
  - Source event linkage

#### Act
- **Acknowledge** (requires `operations_engineer` role)
  - Mark as acknowledged
  - Timestamp and user recorded
- **Close** (requires `operations_engineer` role)
  - Enter resolution notes (required)
  - Mark as closed

### Alert History

**Path:** `/monitor/alerts-reports/alert-history`

#### Navigate
- Click **Monitor** → **Alerts, Reports & Visualisation** → **Alert History**

#### List
- View unified timeline of events
- **Event Types:**
  - Alerts
  - Diagnostic Events
  - Downtime Events
- **Filters:**
  - Asset
  - Event Type
  - Time Range

#### View
- Click an event to see:
  - Event details
  - Timeline position
  - Related events
  - State transitions

#### Analyze
- Understand event sequence
- Identify patterns
- Investigate incidents

### Custom Dashboards

**Path:** `/monitor/alerts-reports/custom-dashboards`

#### Navigate
- Click **Monitor** → **Alerts, Reports & Visualisation** → **Custom Dashboards**

#### List
- View your dashboards
- **Filters:**
  - My Dashboards
  - Shared with Me

#### View
- Click a dashboard to see:
  - Dashboard layout
  - Widgets with live data
  - KPI cards
  - Charts
  - Tables

#### Edit
- Click **Create Dashboard** or **Edit**
- **Dashboard Builder:**
  - Add widgets
  - Configure widget queries
  - Arrange layout
  - Set refresh interval
- Click **Save**
- **Share:**
  - Click **Share**
  - Select users or roles
  - Click **Save**

### Reliability Reports

**Path:** `/monitor/alerts-reports/reliability-reports`

#### Navigate
- Click **Monitor** → **Alerts, Reports & Visualisation** → **Reliability Reports**

#### List
- View report run history
- **Filters:**
  - Report Type
  - Time Range

#### Generate
- Click **Generate Report**
- **Report Configuration:**
  - Select report type:
    - Reliability Summary
    - Maintenance Backlog
    - Asset Health Status
    - Performance Benchmarking
  - Select asset scope
  - Select format (PDF, CSV)
  - Click **Generate**
- **Report Status:**
  - Queued
  - Processing
  - Completed
  - Failed

#### Download
- Click **Download** on completed report
- File downloads to your device

### Data Export

**Path:** `/monitor/alerts-reports/data-export`

#### Navigate
- Click **Monitor** → **Alerts, Reports & Visualisation** → **Data Export**

#### List
- View your export jobs
- **Job Status:**
  - Queued
  - Processing
  - Completed
  - Failed

#### Create Export
- Click **Create Export**
- **Export Configuration:**
  - Select data type:
    - Telemetry Data
    - Downtime Events
    - Reliability Metrics
    - Asset List
  - Select format (CSV, JSON, Excel)
  - Set filters (time range, asset type, etc.)
  - Click **Create Export**

#### Download
- Wait for export to complete
- Click **Download**
- File downloads to your device

## User Roles and Permissions

### authenticated (Read-Only)

**Can:**
- View all data
- View dashboards
- View reports

**Cannot:**
- Modify any data
- Acknowledge alerts
- Create recommendations

### operations_engineer

**Can:**
- All `authenticated` permissions
- Acknowledge alerts
- Acknowledge diagnostic events
- Create manual alerts

**Cannot:**
- Close events
- Modify health models
- Create recommendations

### maintenance_planner

**Can:**
- All `operations_engineer` permissions
- Acknowledge recommendations
- Schedule recommendations
- Close recommendations
- Update spare parts inventory

**Cannot:**
- Close diagnostic events
- Modify health models
- Modify CBM triggers

### reliability_engineer

**Can:**
- All `maintenance_planner` permissions
- Close diagnostic events with RCA
- Create/update RCA records
- Create/update FMEA entries
- Update health models
- Create/update CBM triggers
- Generate reports

**Cannot:**
- Modify system configuration

### data_analyst

**Can:**
- All `authenticated` permissions
- Export data
- Create custom dashboards
- Run ad-hoc queries

**Cannot:**
- Modify operational data

### apm_admin

**Can:**
- All permissions
- Modify system configuration
- Update RLS policies
- Manage user roles
- Access audit logs

## Tips and Best Practices

### Navigation Tips

1. **Use breadcrumbs**: Click breadcrumbs to navigate back
2. **Use browser back button**: Works as expected
3. **Bookmark frequently used pages**: Save time
4. **Use keyboard shortcuts**: 
   - `Ctrl+K` (or `Cmd+K` on Mac): Quick search
   - `Esc`: Close modals

### Filtering Tips

1. **Combine filters**: Use multiple filters for precise results
2. **Save filter presets**: Create custom views
3. **Clear filters**: Click "Clear All" to reset

### Performance Tips

1. **Use date ranges**: Limit telemetry queries to necessary time ranges
2. **Use pagination**: Don't load all data at once
3. **Refresh strategically**: Don't refresh too frequently

### Data Entry Tips

1. **Required fields**: Marked with asterisk (*)
2. **Validation**: Form validates before submission
3. **Save frequently**: Don't lose work
4. **Cancel to discard**: Click "Cancel" to discard changes

### Troubleshooting

#### "No data available"

**Possible causes:**
- No data exists for selected filters
- RLS policies blocking access
- Network connectivity issue

**Solutions:**
- Adjust filters
- Check user role and permissions
- Refresh page
- Contact administrator

#### "Permission denied"

**Cause:** User lacks required role for operation

**Solution:**
- Check required role in this guide
- Contact administrator to request role

#### "Page not loading"

**Possible causes:**
- Network connectivity issue
- Server error
- Browser cache issue

**Solutions:**
- Check network connection
- Refresh page (F5)
- Clear browser cache
- Try different browser

## Mobile Usage

The APM system is responsive and works on mobile devices:

- **Navigation**: Hamburger menu on mobile
- **Tables**: Scroll horizontally
- **Charts**: Touch to zoom and pan
- **Forms**: Mobile-optimized inputs

## Accessibility

The APM system follows accessibility best practices:

- **Keyboard navigation**: All features accessible via keyboard
- **Screen readers**: ARIA labels for screen reader support
- **Color contrast**: WCAG AA compliant
- **Focus indicators**: Clear focus states

## Getting Help

### In-App Help

- **Tooltips**: Hover over icons for help text
- **Help button**: Click "?" icon for context-sensitive help

### Support

For questions or issues:

1. Check this user guide
2. Contact your system administrator
3. Submit a support ticket

## Conclusion

The nLVE pattern provides a consistent, intuitive way to navigate and use the APM Power Transmission system. By following this guide, you can efficiently monitor assets, respond to alerts, plan maintenance, and optimize performance.

For technical documentation, see:
- [API Query Contracts](./API_QUERY_CONTRACTS.md)
- [Schema Pack Execution Guide](./SCHEMA_PACK_EXECUTION_GUIDE.md)
- [RLS Policies and Roles](./RLS_POLICIES_AND_ROLES.md)
- [Testing Procedures](./TESTING_PROCEDURES.md)
