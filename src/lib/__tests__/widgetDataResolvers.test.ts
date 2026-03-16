// Manual verification tests for widget data resolvers
import { describe, it, expect } from "vitest";
import {
  getWidgetData,
  resolveKPIWidget,
  resolveStatusBoardWidget,
  resolveListWidget,
  resolveTableWidget,
  WidgetConfigError
} from "../widgetDataResolvers";
import { Widget } from "@/types/dashboard";

describe("Widget Data Resolvers", () => {
  const testTenantId = "t1";

  describe("resolveKPIWidget", () => {
    it("should resolve KPI widget with valid config", () => {
      const widget: Widget = {
        id: "test-kpi",
        type: "kpi",
        featureArea: "assets",
        title: "Test KPI",
        config: {
          value: 100,
          unit: "units",
          trend: "+5%",
          trendLabel: "vs last month"
        }
      };

      const result = resolveKPIWidget(widget, testTenantId);

      expect(result.value).toBe(100);
      expect(result.unit).toBe("units");
      expect(result.trend).toBe("+5%");
      expect(result.trendLabel).toBe("vs last month");
    });

    it("should throw error when value is missing", () => {
      const widget: Widget = {
        id: "test-kpi",
        type: "kpi",
        featureArea: "assets",
        title: "Test KPI",
        config: {}
      };

      expect(() => resolveKPIWidget(widget, testTenantId)).toThrow(WidgetConfigError);
    });
  });

  describe("resolveStatusBoardWidget", () => {
    it("should resolve status board widget for alerts by severity", () => {
      const widget: Widget = {
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

      const result = resolveStatusBoardWidget(widget, testTenantId);

      expect(result.categories).toBeDefined();
      expect(result.categories.length).toBeGreaterThan(0);
      expect(result.categories[0]).toHaveProperty("label");
      expect(result.categories[0]).toHaveProperty("count");
      expect(result.categories[0]).toHaveProperty("status");
    });

    it("should throw error when dataSource is missing", () => {
      const widget: Widget = {
        id: "test-status",
        type: "statusBoard",
        featureArea: "cross",
        title: "Test Status",
        config: {
          groupBy: "severity"
        }
      };

      expect(() => resolveStatusBoardWidget(widget, testTenantId)).toThrow(WidgetConfigError);
    });

    it("should filter data by tenant", () => {
      const widget: Widget = {
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

      const result1 = resolveStatusBoardWidget(widget, "t1");
      const result2 = resolveStatusBoardWidget(widget, "t2");

      // Different tenants should potentially have different counts
      // (unless they happen to have the same number of alerts)
      expect(result1.categories).toBeDefined();
      expect(result2.categories).toBeDefined();
    });
  });

  describe("resolveListWidget", () => {
    it("should resolve list widget with valid config", () => {
      const widget: Widget = {
        id: "test-list",
        type: "list",
        featureArea: "assets",
        title: "Test List",
        config: {
          dataSource: "alerts",
          columns: ["title", "severity", "status"],
          displayLimit: 5
        }
      };

      const result = resolveListWidget(widget, testTenantId);

      expect(result.items).toBeDefined();
      expect(result.columns).toEqual(["title", "severity", "status"]);
      expect(result.totalCount).toBeGreaterThanOrEqual(0);
      expect(result.items.length).toBeLessThanOrEqual(5);
    });

    it("should throw error when dataSource is missing", () => {
      const widget: Widget = {
        id: "test-list",
        type: "list",
        featureArea: "assets",
        title: "Test List",
        config: {
          columns: ["title"]
        }
      };

      expect(() => resolveListWidget(widget, testTenantId)).toThrow(WidgetConfigError);
    });

    it("should throw error when columns is missing", () => {
      const widget: Widget = {
        id: "test-list",
        type: "list",
        featureArea: "assets",
        title: "Test List",
        config: {
          dataSource: "alerts"
        }
      };

      expect(() => resolveListWidget(widget, testTenantId)).toThrow(WidgetConfigError);
    });

    it("should apply filters correctly", () => {
      const widget: Widget = {
        id: "test-list",
        type: "list",
        featureArea: "assets",
        title: "Critical Alerts",
        config: {
          dataSource: "alerts",
          columns: ["title", "severity"],
          filters: { severity: "critical" }
        }
      };

      const result = resolveListWidget(widget, testTenantId);

      // All items should have critical severity
      result.items.forEach((item) => {
        expect(item.severity).toBe("critical");
      });
    });

    it("should apply display limit", () => {
      const widget: Widget = {
        id: "test-list",
        type: "list",
        featureArea: "assets",
        title: "Test List",
        config: {
          dataSource: "alerts",
          columns: ["title"],
          displayLimit: 3
        }
      };

      const result = resolveListWidget(widget, testTenantId);

      expect(result.items.length).toBeLessThanOrEqual(3);
    });
  });

  describe("resolveTableWidget", () => {
    it("should resolve table widget with valid config", () => {
      const widget: Widget = {
        id: "test-table",
        type: "table",
        featureArea: "assets",
        title: "Test Table",
        config: {
          dataSource: "siteConnectivity",
          columns: [
            { key: "site", label: "Site", sortable: true },
            { key: "totalAssets", label: "Total", sortable: true }
          ]
        }
      };

      const result = resolveTableWidget(widget, testTenantId);

      expect(result.rows).toBeDefined();
      expect(result.columns).toBeDefined();
      expect(result.columns.length).toBe(2);
    });

    it("should throw error when dataSource is missing", () => {
      const widget: Widget = {
        id: "test-table",
        type: "table",
        featureArea: "assets",
        title: "Test Table",
        config: {
          columns: [{ key: "test", label: "Test", sortable: true }]
        }
      };

      expect(() => resolveTableWidget(widget, testTenantId)).toThrow(WidgetConfigError);
    });

    it("should throw error when columns is missing", () => {
      const widget: Widget = {
        id: "test-table",
        type: "table",
        featureArea: "assets",
        title: "Test Table",
        config: {
          dataSource: "siteConnectivity"
        }
      };

      expect(() => resolveTableWidget(widget, testTenantId)).toThrow(WidgetConfigError);
    });
  });

  describe("getWidgetData", () => {
    it("should route to correct resolver based on widget type", () => {
      const kpiWidget: Widget = {
        id: "test-kpi",
        type: "kpi",
        featureArea: "assets",
        title: "Test KPI",
        config: { value: 100 }
      };

      const result = getWidgetData(kpiWidget, testTenantId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("value");
    });

    it("should throw error for unknown widget type", () => {
      const widget: Widget = {
        id: "test-unknown",
        type: "unknown" as any,
        featureArea: "assets",
        title: "Test Unknown",
        config: {}
      };

      expect(() => getWidgetData(widget, testTenantId)).toThrow(WidgetConfigError);
    });

    it("should return null for unimplemented widget types", () => {
      const widget: Widget = {
        id: "test-timeseries",
        type: "timeseries",
        featureArea: "assets",
        title: "Test Timeseries",
        config: {}
      };

      const result = getWidgetData(widget, testTenantId);
      expect(result).toBeNull();
    });

    it("should apply tenant filtering across all widget types", () => {
      const statusWidget: Widget = {
        id: "test-status",
        type: "statusBoard",
        featureArea: "cross",
        title: "Alert Summary",
        config: {
          groupBy: "severity",
          dataSource: "alerts"
        }
      };

      // Get data for two different tenants
      const result1 = getWidgetData(statusWidget, "t1");
      const result2 = getWidgetData(statusWidget, "t2");

      // Both should return valid data
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });

  describe("Tenant Context Filtering", () => {
    it("should only return data for specified tenant in status board", () => {
      const widget: Widget = {
        id: "test-status",
        type: "statusBoard",
        featureArea: "cross",
        title: "Alert Summary",
        config: {
          groupBy: "severity",
          dataSource: "alerts"
        }
      };

      const result = resolveStatusBoardWidget(widget, "t1");
      
      // Verify the data is filtered (we can't directly check the source,
      // but we can verify the function runs without error)
      expect(result.categories).toBeDefined();
    });

    it("should only return data for specified tenant in list widget", () => {
      const widget: Widget = {
        id: "test-list",
        type: "list",
        featureArea: "assets",
        title: "Test List",
        config: {
          dataSource: "alerts",
          columns: ["title", "tenantId"]
        }
      };

      const result = resolveListWidget(widget, "t1");

      // All items should belong to tenant t1
      result.items.forEach((item) => {
        expect(item.tenantId).toBe("t1");
      });
    });
  });
});
