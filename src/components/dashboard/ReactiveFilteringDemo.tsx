/**
 * ReactiveFilteringDemo Component
 * 
 * This demo component demonstrates how DashboardView and AlertView
 * automatically re-filter data when the tenant context changes.
 * 
 * Task 17: AppContext Integration for Reactive Filtering
 * Requirements: 3.4, 8.2, 9.2, 13.1, 13.2, 13.3, 13.4
 */

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { DashboardView } from "./DashboardView";
import { AlertView } from "@/components/alerts/AlertView";
import { tenants } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function ReactiveFilteringDemo() {
  const { currentTenant, setCurrentTenant } = useApp();
  const [view, setView] = useState<"dashboard" | "alerts">("dashboard");

  const handleTenantSwitch = () => {
    // Switch to the next tenant in the list
    const currentIndex = tenants.findIndex(t => t.id === currentTenant.id);
    const nextIndex = (currentIndex + 1) % tenants.length;
    setCurrentTenant(tenants[nextIndex]);
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Reactive Filtering Demo</CardTitle>
          <CardDescription>
            This demo shows how dashboards and alerts automatically update when you switch tenants.
            The components use React hooks (useMemo and useEffect) that depend on currentTenant.id,
            causing automatic re-filtering when the tenant changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Current Tenant:</p>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-base">
                  {currentTenant.name}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  (ID: {currentTenant.id})
                </span>
              </div>
            </div>
            <Button onClick={handleTenantSwitch} variant="outline">
              Switch to Next Tenant
            </Button>
          </div>

          <div className="rounded-lg border p-4 bg-muted/50">
            <h3 className="font-semibold mb-2">How It Works:</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>
                <strong>DashboardView</strong> uses <code>useMemo</code> with <code>currentTenant.id</code> dependency
              </li>
              <li>
                <strong>AlertView</strong> uses <code>useEffect</code> with <code>currentTenant.id</code> dependency
              </li>
              <li>
                When you click "Switch to Next Tenant", the AppContext updates <code>currentTenant</code>
              </li>
              <li>
                React automatically re-runs the hooks, triggering data re-filtering
              </li>
              <li>
                The UI updates immediately without manual refresh
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Tabs value={view} onValueChange={(v) => setView(v as "dashboard" | "alerts")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard View</TabsTrigger>
          <TabsTrigger value="alerts">Alert View</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard View - Reactive Filtering</CardTitle>
              <CardDescription>
                Dashboards and widgets automatically filter by the current tenant.
                Try switching tenants to see the data update in real-time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert View - Reactive Filtering</CardTitle>
              <CardDescription>
                Alerts and incidents automatically filter by the current tenant.
                Try switching tenants to see the alerts update in real-time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertView />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-blue-900">Implementation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">DashboardView Implementation:</h4>
            <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
{`const dashboards = useMemo(() => {
  if (featureArea) {
    return getDashboardsForFeatureArea(featureArea, currentTenant.id);
  } else {
    return getDashboardsForTenant(currentTenant.id).filter(
      (dashboard) => dashboard.isGlobal || dashboard.featureArea === "cross"
    );
  }
}, [featureArea, currentTenant.id]);`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold text-blue-900 mb-1">AlertView Implementation:</h4>
            <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
{`useEffect(() => {
  let filteredAlerts: Alert[];
  
  if (featureArea) {
    filteredAlerts = getAlertsForFeatureArea(featureArea, currentTenant.id);
  } else {
    filteredAlerts = getAlertsForTenant(currentTenant.id);
  }
  
  setAlerts(filteredAlerts);
}, [featureArea, currentTenant.id]);`}
            </pre>
          </div>

          <div className="pt-2 border-t">
            <h4 className="font-semibold text-blue-900 mb-1">Requirements Satisfied:</h4>
            <ul className="list-disc list-inside space-y-1 text-blue-900">
              <li>3.4: Dashboard tenant filtering from AppContext</li>
              <li>8.2: Alert tenant filtering from AppContext</li>
              <li>9.2: Domain alert tenant filtering</li>
              <li>13.1: Dashboard reactive filtering on tenant change</li>
              <li>13.2: Alert reactive filtering on tenant change</li>
              <li>13.3: Dashboard scope filtering</li>
              <li>13.4: Alert tenant filtering</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
