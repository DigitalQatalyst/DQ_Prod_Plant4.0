import React from "react";
import { DashboardView } from "./DashboardView";

/**
 * DashboardViewDemo Component
 * Demonstrates the DashboardView component with different configurations
 */
export function DashboardViewDemo() {
  return (
    <div className="space-y-12 p-6">
      <section>
        <h2 className="text-2xl font-bold mb-4">Overview Dashboard</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Shows global/cross-domain dashboards
        </p>
        <DashboardView />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Assets Dashboard</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Shows dashboards specific to the assets feature area
        </p>
        <DashboardView featureArea="assets" />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Security Dashboard</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Shows dashboards specific to the security feature area
        </p>
        <DashboardView featureArea="security" />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Specific Dashboard by ID</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Shows a specific dashboard (Asset Health)
        </p>
        <DashboardView featureArea="assets" dashboardId="asset-health" />
      </section>
    </div>
  );
}
