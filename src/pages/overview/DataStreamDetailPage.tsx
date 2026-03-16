import { DataStreamStatus } from "@/types/overview";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const statusStyles = {
  fresh: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  stale: "bg-orange-500/10 text-orange-600 border-orange-200",
  critical: "bg-red-500/10 text-red-600 border-red-200"
} as const;

const formatTimestamp = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "N/A";

const formatMinutes = (value?: number | null) => {
  if (value === null || value === undefined) return "N/A";
  return `${value.toFixed(1)} min`;
};

/**
 * DataStreamDetailPage
 * Displays detailed freshness info for a selected site/stream.
 */
export function DataStreamDetailPage({ status }: { status: DataStreamStatus }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Data Stream Detail</CardTitle>
              <CardDescription className="mt-1">
                Site: {status.siteId} • Stream: {status.streamId || "Primary"}
              </CardDescription>
            </div>
            <Badge variant="outline" className={cn("capitalize", statusStyles[status.status])}>
              {status.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Last Telemetry</p>
              <p className="text-sm font-medium">{formatTimestamp(status.lastTelemetryAt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Staleness</p>
              <p className="text-sm font-medium">{formatMinutes(status.stalenessMinutes)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tenant</p>
              <p className="text-sm font-mono text-muted-foreground truncate">{status.tenantId}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Stream ID</p>
              <p className="text-sm font-mono text-muted-foreground truncate">{status.streamId || "N/A"}</p>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Operational Notes</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Review ingestion pipelines and site connectivity if staleness is trending beyond expected thresholds.
              </p>
            </div>

            <Card className="bg-muted/30 border-dashed border-primary/20">
              <CardHeader className="py-3 text-primary">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider">Suggested Actions</CardTitle>
              </CardHeader>
              <CardContent className="py-0 pb-3">
                <ul className="text-[11px] text-muted-foreground leading-normal list-disc list-inside space-y-1">
                  <li>Verify site telemetry collectors are online.</li>
                  <li>Inspect ingestion queue backlogs for delays.</li>
                  <li>Confirm stream configuration and polling intervals.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}