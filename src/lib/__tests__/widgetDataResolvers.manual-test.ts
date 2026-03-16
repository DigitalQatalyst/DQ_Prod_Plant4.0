/**
 * Manual verification script for widget data resolvers
 * Run this file with: npx tsx src/lib/__tests__/widgetDataResolvers.manual-test.ts
 * (requires tsx to be installed: npm install -D tsx)
 */

import {
  getWidgetData,
  resolveKPIWidget,
  resolveStatusBoardWidget,
  resolveListWidget,
  resolveTableWidget,
  WidgetConfigError
} from "../widgetDataResolvers";
import { Widget } from "../../types/dashboard";

console.log("=== Widget Data Resolvers Manual Tests ===\n");

// Test 1: KPI Widget
console.log("Test 1: KPI Widget Resolution");
try {
  const kpiWidget: Widget = {
    id: "test-kpi",
    type: "kpi",
    featureArea: "assets",
    title: "Total Assets",
    config: {
      value: 1247,
      unit: "assets",
      trend: "+12",
      trendLabel: "vs last month"
    }
  };

  const kpiResult = resolveKPIWidget(kpiWidget, "t1");
  console.log("✓ KPI Widget resolved successfully");
  console.log("  Value:", kpiResult.value);
  console.log("  Unit:", kpiResult.unit);
  console.log("  Trend:", kpiResult.trend);
} catch (error) {
  console.log("✗ KPI Widget failed:", error);
}

// Test 2: KPI Widget with missing value
console.log("\nTest 2: KPI Widget with missing value (should throw error)");
try {
  const invalidKpiWidget: Widget = {
    id: "test-kpi-invalid",
    type: "kpi",
    featureArea: "assets",
    title: "Invalid KPI",
    config: {}
  };

  resolveKPIWidget(invalidKpiWidget, "t1");
  console.log("✗ Should have thrown an error");
} catch (error) {
  if (error instanceof WidgetConfigError) {
    console.log("✓ Correctly threw WidgetConfigError");
    console.log("  Message:", error.message);
  } else {
    console.log("✗ Wrong error type:", error);
  }
}

// Test 3: Status Board Widget
console.log("\nTest 3: Status Board Widget Resolution");
try {
  const statusWidget: Widget = {
    id: "test-status",
    type: "statusBoard",
    featureArea: "cross",
    title: "Alert Summary",
    config: {
      groupBy: "severity",
      statuses: ["critical", "warning", "info"],
      dataSource: "alerts"
    }
  };

  const statusResult = resolveStatusBoardWidget(statusWidget, "t1");
  console.log("✓ Status Board Widget resolved successfully");
  console.log("  Categories:", statusResult.categories.length);
  statusResult.categories.forEach((cat) => {
    console.log(`    ${cat.label}: ${cat.count}`);
  });
} catch (error) {
  console.log("✗ Status Board Widget failed:", error);
}

// Test 4: List Widget
console.log("\nTest 4: List Widget Resolution");
try {
  const listWidget: Widget = {
    id: "test-list",
    type: "list",
    featureArea: "assets",
    title: "Critical Alerts",
    config: {
      dataSource: "alerts",
      columns: ["title", "severity", "status"],
      filters: { severity: "critical" },
      displayLimit: 5
    }
  };

  const listResult = resolveListWidget(listWidget, "t1");
  console.log("✓ List Widget resolved successfully");
  console.log("  Total items:", listResult.totalCount);
  console.log("  Displayed items:", listResult.items.length);
  console.log("  Columns:", listResult.columns.join(", "));
  if (listResult.items.length > 0) {
    console.log("  First item:", listResult.items[0].title);
  }
} catch (error) {
  console.log("✗ List Widget failed:", error);
}

// Test 5: Table Widget
console.log("\nTest 5: Table Widget Resolution");
try {
  const tableWidget: Widget = {
    id: "test-table",
    type: "table",
    featureArea: "assets",
    title: "Site Connectivity",
    config: {
      dataSource: "siteConnectivity",
      columns: [
        { key: "site", label: "Site", sortable: true },
        { key: "totalAssets", label: "Total Assets", sortable: true },
        { key: "onlineAssets", label: "Online", sortable: true },
        { key: "healthPercentage", label: "Health %", sortable: true }
      ]
    }
  };

  const tableResult = resolveTableWidget(tableWidget, "t1");
  console.log("✓ Table Widget resolved successfully");
  console.log("  Rows:", tableResult.rows.length);
  console.log("  Columns:", tableResult.columns.length);
  if (tableResult.rows.length > 0) {
    console.log("  First row:", JSON.stringify(tableResult.rows[0]));
  }
} catch (error) {
  console.log("✗ Table Widget failed:", error);
}

// Test 6: getWidgetData routing
console.log("\nTest 6: getWidgetData routing");
try {
  const widgets: Widget[] = [
    {
      id: "kpi-1",
      type: "kpi",
      featureArea: "assets",
      title: "Test KPI",
      config: { value: 100 }
    },
    {
      id: "status-1",
      type: "statusBoard",
      featureArea: "cross",
      title: "Test Status",
      config: { groupBy: "severity", dataSource: "alerts" }
    },
    {
      id: "list-1",
      type: "list",
      featureArea: "assets",
      title: "Test List",
      config: { dataSource: "alerts", columns: ["title"] }
    },
    {
      id: "table-1",
      type: "table",
      featureArea: "assets",
      title: "Test Table",
      config: {
        dataSource: "siteConnectivity",
        columns: [{ key: "site", label: "Site", sortable: true }]
      }
    }
  ];

  widgets.forEach((widget) => {
    const result = getWidgetData(widget, "t1");
    console.log(`✓ ${widget.type} widget routed correctly`);
  });
} catch (error) {
  console.log("✗ Widget routing failed:", error);
}

// Test 7: Tenant filtering
console.log("\nTest 7: Tenant Context Filtering");
try {
  const widget: Widget = {
    id: "test-tenant-filter",
    type: "list",
    featureArea: "assets",
    title: "Tenant Alerts",
    config: {
      dataSource: "alerts",
      columns: ["title", "tenantId"]
    }
  };

  const t1Result = resolveListWidget(widget, "t1");
  const t2Result = resolveListWidget(widget, "t2");

  console.log("✓ Tenant filtering works");
  console.log("  Tenant t1 alerts:", t1Result.totalCount);
  console.log("  Tenant t2 alerts:", t2Result.totalCount);

  // Verify all items belong to correct tenant
  const t1Valid = t1Result.items.every((item) => item.tenantId === "t1");
  const t2Valid = t2Result.items.every((item) => item.tenantId === "t2");

  if (t1Valid && t2Valid) {
    console.log("✓ All items correctly filtered by tenant");
  } else {
    console.log("✗ Tenant filtering has issues");
  }
} catch (error) {
  console.log("✗ Tenant filtering failed:", error);
}

// Test 8: Error handling
console.log("\nTest 8: Error Handling");
try {
  const invalidWidget: Widget = {
    id: "test-invalid",
    type: "list",
    featureArea: "assets",
    title: "Invalid List",
    config: {
      // Missing required dataSource and columns
    }
  };

  getWidgetData(invalidWidget, "t1");
  console.log("✗ Should have thrown an error");
} catch (error) {
  if (error instanceof WidgetConfigError) {
    console.log("✓ Error handling works correctly");
    console.log("  Error type:", error.name);
    console.log("  Widget ID:", error.widgetId);
    console.log("  Widget type:", error.widgetType);
  } else {
    console.log("✗ Wrong error type:", error);
  }
}

console.log("\n=== All Manual Tests Complete ===");
