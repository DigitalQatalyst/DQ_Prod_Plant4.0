import { Dashboard, Widget } from "@/types/dashboard";

// Mock Dashboards
export const dashboards: Dashboard[] = [
  // Global/Cross-Domain Dashboards
  {
    id: "main-overview",
    name: "Main Overview",
    featureArea: "cross",
    isGlobal: true,
    widgetIds: [
      "w-total-assets",
      "w-alert-summary",
      "w-energy-today",
      "w-security-score",
      "w-system-health",
      "w-recent-events"
    ]
  },
  {
    id: "alerts-summary",
    name: "Alerts Summary",
    featureArea: "cross",
    isGlobal: true,
    widgetIds: [
      "w-alerts-by-severity",
      "w-alerts-by-area",
      "w-recent-incidents",
      "w-alert-trends"
    ]
  },
  
  // Domain-Specific Dashboards - Assets
  {
    id: "asset-health",
    name: "Asset Health",
    featureArea: "assets",
    widgetIds: [
      "w-asset-status",
      "w-critical-assets",
      "w-connectivity-health",
      "w-asset-uptime"
    ]
  },
  {
    id: "asset-performance",
    name: "Asset Performance",
    featureArea: "assets",
    widgetIds: [
      "w-performance-metrics",
      "w-efficiency-trends",
      "w-maintenance-schedule"
    ]
  },
  
  // Domain-Specific Dashboards - Security
  {
    id: "security-posture",
    name: "Security Posture",
    featureArea: "security",
    widgetIds: [
      "w-policy-compliance",
      "w-open-incidents",
      "w-vulnerability-trend",
      "w-access-violations"
    ]
  },
  {
    id: "security-monitoring",
    name: "Security Monitoring",
    featureArea: "security",
    widgetIds: [
      "w-active-threats",
      "w-firewall-status",
      "w-authentication-logs"
    ]
  },
  
  // Domain-Specific Dashboards - Energy
  {
    id: "energy-overview",
    name: "Energy Overview",
    featureArea: "energy",
    widgetIds: [
      "w-energy-consumption",
      "w-power-quality",
      "w-cost-analysis"
    ]
  },
  
  // Domain-Specific Dashboards - Monitoring
  {
    id: "system-monitoring",
    name: "System Monitoring",
    featureArea: "monitoring",
    widgetIds: [
      "w-system-status",
      "w-performance-indicators",
      "w-data-streams"
    ]
  },
  
  // Tenant-Specific Dashboards
  {
    id: "alpha-upstream-operations",
    name: "Alpha Upstream Operations",
    featureArea: "cross",
    scope: { tenantId: "alpha-upstream" },
    widgetIds: [
      "w-total-assets",
      "w-asset-status",
      "w-critical-assets"
    ]
  },
  {
    id: "t1-operations",
    name: "Kenya Power Operations",
    featureArea: "cross",
    scope: { tenantId: "t1" },
    widgetIds: [
      "w-total-assets",
      "w-alert-summary",
      "w-energy-today"
    ]
  },
  {
    id: "t2-production",
    name: "Kenya Tea Production",
    featureArea: "assets",
    scope: { tenantId: "t2" },
    widgetIds: [
      "w-asset-status",
      "w-critical-assets"
    ]
  }
];

// Mock Widgets
export const widgets: Widget[] = [
  // KPI Widgets
  {
    id: "w-total-assets",
    type: "kpi",
    featureArea: "assets",
    title: "Total Assets",
    description: "Total number of managed assets",
    config: {
      metricKey: "totalAssets",
      trend: "+12",
      trendLabel: "vs last month",
      value: 1247
    }
  },
  {
    id: "w-energy-today",
    type: "kpi",
    featureArea: "energy",
    title: "Energy Today",
    description: "Total energy consumption today",
    config: {
      metricKey: "energyConsumption",
      value: 2847,
      unit: "kWh",
      trend: "-5%",
      trendLabel: "vs yesterday"
    }
  },
  {
    id: "w-security-score",
    type: "kpi",
    featureArea: "security",
    title: "Security Score",
    description: "Overall security posture score",
    config: {
      metricKey: "securityScore",
      value: 87,
      unit: "/100",
      trend: "+3",
      trendLabel: "vs last week"
    }
  },
  {
    id: "w-system-health",
    type: "kpi",
    featureArea: "monitoring",
    title: "System Health",
    description: "Overall system health percentage",
    config: {
      metricKey: "systemHealth",
      value: 94,
      unit: "%",
      trend: "stable",
      trendLabel: "last 24h"
    }
  },
  {
    id: "w-asset-uptime",
    type: "kpi",
    featureArea: "assets",
    title: "Asset Uptime",
    description: "Average asset uptime percentage",
    config: {
      metricKey: "assetUptime",
      value: 98.5,
      unit: "%",
      trend: "+0.3%",
      trendLabel: "vs last month"
    }
  },
  
  // Status Board Widgets
  {
    id: "w-alert-summary",
    type: "statusBoard",
    featureArea: "cross",
    title: "Alert Summary",
    description: "Alerts grouped by severity",
    config: {
      groupBy: "severity",
      statuses: ["critical", "warning", "info"],
      dataSource: "alerts"
    }
  },
  {
    id: "w-asset-status",
    type: "statusBoard",
    featureArea: "assets",
    title: "Asset Status",
    description: "Assets grouped by operational status",
    config: {
      groupBy: "status",
      statuses: ["online", "offline", "maintenance", "pending"],
      dataSource: "assets"
    }
  },
  {
    id: "w-alerts-by-severity",
    type: "statusBoard",
    featureArea: "cross",
    title: "Alerts by Severity",
    description: "Current alert distribution",
    config: {
      groupBy: "severity",
      statuses: ["critical", "warning", "info"],
      dataSource: "alerts",
      showCounts: true
    }
  },
  {
    id: "w-alerts-by-area",
    type: "statusBoard",
    featureArea: "cross",
    title: "Alerts by Feature Area",
    description: "Alert distribution across domains",
    config: {
      groupBy: "featureArea",
      dataSource: "alerts",
      showCounts: true
    }
  },
  {
    id: "w-policy-compliance",
    type: "statusBoard",
    featureArea: "security",
    title: "Policy Compliance",
    description: "Security policy compliance status",
    config: {
      groupBy: "complianceStatus",
      statuses: ["compliant", "non-compliant", "pending-review"],
      dataSource: "securityPolicies"
    }
  },
  {
    id: "w-firewall-status",
    type: "statusBoard",
    featureArea: "security",
    title: "Firewall Status",
    description: "Firewall rules and status",
    config: {
      groupBy: "status",
      statuses: ["active", "inactive", "blocked"],
      dataSource: "firewallRules"
    }
  },
  
  // List Widgets
  {
    id: "w-critical-assets",
    type: "list",
    featureArea: "assets",
    title: "Critical Assets",
    description: "Assets requiring immediate attention",
    config: {
      filters: { 
        criticality: "critical", 
        status: ["offline", "maintenance"] 
      },
      displayLimit: 10,
      columns: ["name", "site", "status", "lastSeen"],
      dataSource: "assets",
      sortBy: "lastSeen",
      sortOrder: "desc"
    }
  },
  {
    id: "w-recent-events",
    type: "list",
    featureArea: "cross",
    title: "Recent Events",
    description: "Latest system events",
    config: {
      displayLimit: 8,
      columns: ["timestamp", "type", "description", "source"],
      dataSource: "systemEvents",
      sortBy: "timestamp",
      sortOrder: "desc"
    }
  },
  {
    id: "w-recent-incidents",
    type: "list",
    featureArea: "cross",
    title: "Recent Incidents",
    description: "Latest security and operational incidents",
    config: {
      displayLimit: 5,
      columns: ["title", "severity", "status", "createdAt"],
      dataSource: "incidents",
      sortBy: "createdAt",
      sortOrder: "desc"
    }
  },
  {
    id: "w-open-incidents",
    type: "list",
    featureArea: "security",
    title: "Open Security Incidents",
    description: "Active security incidents requiring attention",
    config: {
      filters: { status: ["open", "acknowledged", "in-progress"] },
      displayLimit: 10,
      columns: ["title", "severity", "status", "createdAt"],
      dataSource: "incidents",
      sortBy: "severity",
      sortOrder: "desc"
    }
  },
  {
    id: "w-access-violations",
    type: "list",
    featureArea: "security",
    title: "Access Violations",
    description: "Recent unauthorized access attempts",
    config: {
      displayLimit: 10,
      columns: ["timestamp", "user", "resource", "action"],
      dataSource: "accessLogs",
      filters: { violation: true },
      sortBy: "timestamp",
      sortOrder: "desc"
    }
  },
  {
    id: "w-maintenance-schedule",
    type: "list",
    featureArea: "assets",
    title: "Maintenance Schedule",
    description: "Upcoming maintenance activities",
    config: {
      displayLimit: 8,
      columns: ["asset", "type", "scheduledDate", "assignee"],
      dataSource: "maintenanceSchedule",
      sortBy: "scheduledDate",
      sortOrder: "asc"
    }
  },
  
  // Table Widgets
  {
    id: "w-connectivity-health",
    type: "table",
    featureArea: "assets",
    title: "Connectivity Health",
    description: "Asset connectivity status by site",
    config: {
      columns: [
        { key: "site", label: "Site", sortable: true },
        { key: "totalAssets", label: "Total Assets", sortable: true },
        { key: "onlineAssets", label: "Online", sortable: true },
        { key: "offlineAssets", label: "Offline", sortable: true },
        { key: "healthPercentage", label: "Health %", sortable: true }
      ],
      dataSource: "siteConnectivity",
      defaultSort: { column: "healthPercentage", order: "desc" }
    }
  },
  {
    id: "w-vulnerability-trend",
    type: "table",
    featureArea: "security",
    title: "Vulnerability Trends",
    description: "Security vulnerabilities by category",
    config: {
      columns: [
        { key: "category", label: "Category", sortable: true },
        { key: "critical", label: "Critical", sortable: true },
        { key: "high", label: "High", sortable: true },
        { key: "medium", label: "Medium", sortable: true },
        { key: "low", label: "Low", sortable: true }
      ],
      dataSource: "vulnerabilities",
      defaultSort: { column: "critical", order: "desc" }
    }
  },
  {
    id: "w-performance-metrics",
    type: "table",
    featureArea: "assets",
    title: "Performance Metrics",
    description: "Key performance indicators by asset type",
    config: {
      columns: [
        { key: "assetType", label: "Asset Type", sortable: true },
        { key: "count", label: "Count", sortable: true },
        { key: "avgUptime", label: "Avg Uptime %", sortable: true },
        { key: "avgEfficiency", label: "Avg Efficiency %", sortable: true }
      ],
      dataSource: "assetPerformance",
      defaultSort: { column: "avgUptime", order: "desc" }
    }
  },
  {
    id: "w-energy-consumption",
    type: "table",
    featureArea: "energy",
    title: "Energy Consumption by Site",
    description: "Energy usage breakdown",
    config: {
      columns: [
        { key: "site", label: "Site", sortable: true },
        { key: "today", label: "Today (kWh)", sortable: true },
        { key: "yesterday", label: "Yesterday (kWh)", sortable: true },
        { key: "change", label: "Change %", sortable: true }
      ],
      dataSource: "energyConsumption",
      defaultSort: { column: "today", order: "desc" }
    }
  },
  {
    id: "w-authentication-logs",
    type: "table",
    featureArea: "security",
    title: "Authentication Logs",
    description: "Recent authentication events",
    config: {
      columns: [
        { key: "timestamp", label: "Time", sortable: true },
        { key: "user", label: "User", sortable: true },
        { key: "action", label: "Action", sortable: true },
        { key: "result", label: "Result", sortable: true },
        { key: "ipAddress", label: "IP Address", sortable: false }
      ],
      dataSource: "authLogs",
      displayLimit: 20,
      defaultSort: { column: "timestamp", order: "desc" }
    }
  },
  
  // Timeseries Widgets
  {
    id: "w-alert-trends",
    type: "timeseries",
    featureArea: "cross",
    title: "Alert Trends",
    description: "Alert volume over time",
    config: {
      metricKeys: ["critical", "warning", "info"],
      timeRange: { start: "7d", end: "now" },
      visualization: "line",
      dataSource: "alertHistory"
    }
  },
  {
    id: "w-efficiency-trends",
    type: "timeseries",
    featureArea: "assets",
    title: "Efficiency Trends",
    description: "Asset efficiency over time",
    config: {
      metricKeys: ["efficiency"],
      timeRange: { start: "30d", end: "now" },
      visualization: "area",
      dataSource: "assetEfficiency"
    }
  },
  {
    id: "w-power-quality",
    type: "timeseries",
    featureArea: "energy",
    title: "Power Quality",
    description: "Voltage and frequency stability",
    config: {
      metricKeys: ["voltage", "frequency"],
      timeRange: { start: "24h", end: "now" },
      visualization: "line",
      dataSource: "powerQuality"
    }
  },
  {
    id: "w-cost-analysis",
    type: "timeseries",
    featureArea: "energy",
    title: "Cost Analysis",
    description: "Energy cost trends",
    config: {
      metricKeys: ["cost"],
      timeRange: { start: "90d", end: "now" },
      visualization: "bar",
      dataSource: "energyCost"
    }
  },
  {
    id: "w-active-threats",
    type: "list",
    featureArea: "security",
    title: "Active Threats",
    description: "Currently detected security threats",
    config: {
      filters: { status: "active" },
      displayLimit: 10,
      columns: ["threat", "severity", "source", "detectedAt"],
      dataSource: "threats",
      sortBy: "severity",
      sortOrder: "desc"
    }
  },
  {
    id: "w-system-status",
    type: "statusBoard",
    featureArea: "monitoring",
    title: "System Status",
    description: "Overall system component status",
    config: {
      groupBy: "status",
      statuses: ["operational", "degraded", "down"],
      dataSource: "systemComponents"
    }
  },
  {
    id: "w-performance-indicators",
    type: "kpi",
    featureArea: "monitoring",
    title: "Performance Indicators",
    description: "Key system performance metrics",
    config: {
      metricKey: "responseTime",
      value: 145,
      unit: "ms",
      trend: "-12ms",
      trendLabel: "vs last hour"
    }
  },
  {
    id: "w-data-streams",
    type: "list",
    featureArea: "monitoring",
    title: "Data Streams",
    description: "Active data collection streams",
    config: {
      displayLimit: 10,
      columns: ["stream", "source", "rate", "status"],
      dataSource: "dataStreams",
      sortBy: "rate",
      sortOrder: "desc"
    }
  }
];
