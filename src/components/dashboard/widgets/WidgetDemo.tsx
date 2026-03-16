import React from "react";
import { KPIWidget } from "./KPIWidget";
import { StatusBoardWidget } from "./StatusBoardWidget";
import { ListWidget } from "./ListWidget";
import { TableWidget } from "./TableWidget";
import { Widget } from "@/types/dashboard";

/**
 * Demo component showing how to use the widget components
 * This file is for demonstration purposes only
 */

// Example widget configurations
const kpiWidget: Widget = {
  id: "demo-kpi",
  type: "kpi",
  featureArea: "assets",
  title: "Total Assets",
  description: "Total number of managed assets",
  config: {
    value: 1247,
    trend: "+12",
    trendLabel: "vs last month"
  }
};

const statusBoardWidget: Widget = {
  id: "demo-status",
  type: "statusBoard",
  featureArea: "cross",
  title: "Alert Summary",
  description: "Alerts grouped by severity",
  config: {
    groupBy: "severity",
    statuses: ["critical", "warning", "info"],
    dataSource: "alerts"
  }
};

const listWidget: Widget = {
  id: "demo-list",
  type: "list",
  featureArea: "assets",
  title: "Critical Assets",
  description: "Assets requiring immediate attention",
  config: {
    filters: { 
      criticality: "critical", 
      status: ["offline", "maintenance"] 
    },
    displayLimit: 5,
    columns: ["name", "site", "status", "lastSeen"],
    dataSource: "assets",
    sortBy: "lastSeen",
    sortOrder: "desc"
  }
};

const tableWidget: Widget = {
  id: "demo-table",
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
};

export function WidgetDemo() {
  const tenantId = "t1"; // Example tenant ID

  const handleAction = (action: string, payload?: any) => {
    console.log("Widget action:", action, payload);
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Widget Components Demo</h2>
        <p className="text-muted-foreground mb-8">
          Examples of all widget types with their configurations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* KPI Widget */}
        <KPIWidget
          widget={kpiWidget}
          tenantId={tenantId}
          onAction={handleAction}
        />

        {/* Status Board Widget */}
        <StatusBoardWidget
          widget={statusBoardWidget}
          tenantId={tenantId}
          onAction={handleAction}
        />

        {/* List Widget */}
        <ListWidget
          widget={listWidget}
          tenantId={tenantId}
          onAction={handleAction}
        />

        {/* Table Widget */}
        <TableWidget
          widget={tableWidget}
          tenantId={tenantId}
          onAction={handleAction}
        />
      </div>
    </div>
  );
}
