import { useState } from "react";
import { useAssets } from "@/hooks/useAPM";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Calendar, Clock, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APMPageShell } from "@/components/apm/APMPageShell";
import { Asset as NavigationAsset } from "@/types/navigation";

export function LifecycleTrackingPage() {
  const navigate = useNavigate();
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<NavigationAsset | null>(null);
  const { data: assetsResponse, loading } = useAssets({ pageSize: 100 });
  const apmAssets = assetsResponse?.data || [];

  // Convert to navigation assets for sidebar
  const navigationAssets: NavigationAsset[] = apmAssets.map(a => {
    // Map criticality tier to navigation criticality
    let criticality: "low" | "medium" | "high" | "critical" = "medium";
    if (a.criticality === "Critical") criticality = "critical";
    else if (a.criticality === "Important") criticality = "high";
    else if (a.criticality === "Standard") criticality = "medium";

    // Map operational status to navigation status
    let status: "online" | "offline" | "pending" | "maintenance" = "online";
    if (a.operational_status === "online") status = "online";
    else if (a.operational_status === "offline") status = "offline";
    else if (a.operational_status === "maintenance") status = "maintenance";
    else if (a.operational_status === "pending") status = "pending";

    return {
      id: a.id,
      name: a.name,
      type: a.asset_type || "Unknown",
      site: "Main Substation",
      area: "Transmission",
      lastSeen: "Real-time",
      location: a.location || "",
      status: status,
      criticality: criticality,
    };
  });

  const selectedAsset = apmAssets.find((a) => a.id === selectedAssetLocal?.id);

  const handleAssetSelection = (asset: NavigationAsset) => {
    setSelectedAssetLocal(asset);
  };

  // Mock lifecycle events - in real implementation, this would come from useAssetById
  const lifecycleEvents = selectedAsset
    ? [
      {
        id: "1",
        stage: "design",
        occurred_at: "2020-01-15",
        notes: "Initial design phase completed",
        created_by: "Engineering Team",
      },
      {
        id: "2",
        stage: "procure",
        occurred_at: "2020-03-20",
        notes: "Equipment procurement approved",
        created_by: "Procurement",
      },
      {
        id: "3",
        stage: "install",
        occurred_at: "2020-06-10",
        notes: "Installation completed on-site",
        created_by: "Installation Team",
      },
      {
        id: "4",
        stage: "commission",
        occurred_at: "2020-07-01",
        notes: "Commissioning tests passed",
        created_by: "Commissioning Engineer",
      },
      {
        id: "5",
        stage: "operate",
        occurred_at: "2020-07-15",
        notes: "Asset entered operational service",
        created_by: "Operations",
      },
    ]
    : [];

  return (
    <APMPageShell
      title="Lifecycle Tracking"
      featureSetName="Asset Inventory & Criticality"
      featureName="Lifecycle Tracking"
      listType="assets"
      assets={navigationAssets}
      selectedAsset={selectedAssetLocal}
      onAssetSelect={handleAssetSelection}
    >
      <div className="space-y-6">
        {/* Lifecycle Timeline */}
        {selectedAsset && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Lifecycle Timeline - {selectedAsset.name}
                </CardTitle>
                <Badge>{selectedAsset.lifecycle_stage}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {lifecycleEvents.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No lifecycle events"
                  description="No lifecycle events have been recorded for this asset"
                />
              ) : (
                <div className="space-y-6">
                  {lifecycleEvents.map((event, index) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-4 rounded-full bg-primary" />
                        {index < lifecycleEvents.length - 1 && (
                          <div className="w-0.5 h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="capitalize">
                            {event.stage}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(event.occurred_at).toLocaleDateString()}
                          </span>
                        </div>
                        {event.notes && (
                          <p className="text-sm mb-2">{event.notes}</p>
                        )}
                        {event.created_by && (
                          <p className="text-xs text-muted-foreground">
                            By: {event.created_by}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!selectedAsset && !loading && (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={Calendar}
                title="No asset selected"
                description="Select an asset from the list to view its lifecycle timeline"
              />
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingState isLoading loadingText="Loading assets..." />
          </div>
        )}
      </div>
    </APMPageShell>
  );
}
