import { AlertView } from "./AlertView";

/**
 * Demo component for AlertView
 * 
 * This component demonstrates the AlertView in different configurations:
 * 1. Global view (all alerts across all feature areas)
 * 2. Domain-specific view (alerts for a specific feature area)
 * 3. Different initial views (alerts vs incidents)
 */
export function AlertViewDemo() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">AlertView Demo</h2>
        <p className="text-muted-foreground mb-6">
          Demonstrating the AlertView component in different configurations.
          The view respects the current tenant context from AppContext.
        </p>
      </div>

      {/* Global Alerts View */}
      <div className="border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Global Alerts View</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Shows all alerts across all feature areas for the current tenant.
        </p>
        <AlertView />
      </div>

      {/* Domain-Specific View - Assets */}
      <div className="border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Assets Domain View</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Shows only alerts from the assets feature area.
        </p>
        <AlertView featureArea="assets" />
      </div>

      {/* Domain-Specific View - Security with Incidents */}
      <div className="border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Security Domain View (Incidents)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Shows security incidents by default.
        </p>
        <AlertView featureArea="security" initialView="incidents" />
      </div>
    </div>
  );
}
