import { PlatformHealthFinding } from "@/types/overview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const severityStyles = {
  critical: "bg-red-500 hover:bg-red-600",
  warning: "bg-orange-500 hover:bg-orange-600",
  info: "bg-blue-500 hover:bg-blue-600"
} as const;

const severityIconStyles = {
  critical: "bg-red-100 text-red-600 dark:bg-red-900/20",
  warning: "bg-orange-100 text-orange-600 dark:bg-orange-900/20",
  info: "bg-blue-100 text-blue-600 dark:bg-blue-900/20"
} as const;

const severityIcons = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info
} as const;

const formatTimestamp = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "N/A";

const renderValue = (value: unknown) => {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

/**
 * PlatformHealthFindingDetailPage
 * Displays detailed information about a selected platform health finding.
 */
export function PlatformHealthFindingDetailPage({ finding }: { finding: PlatformHealthFinding }) {
  const SeverityIcon = severityIcons[finding.severity];
  const detailEntries = finding.details ? Object.entries(finding.details) : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-lg", severityIconStyles[finding.severity])}>
                <SeverityIcon className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>Health Finding</CardTitle>
                <CardDescription className="mt-1">
                  Check: {finding.checkKey} • First seen {formatTimestamp(finding.firstSeen)}
                </CardDescription>
              </div>
            </div>
            <Badge className={cn("capitalize", severityStyles[finding.severity])}>
              {finding.severity}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
              <Badge variant="outline" className="capitalize">
                {finding.status}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Last Seen</p>
              <p className="text-sm font-medium">{formatTimestamp(finding.lastSeen)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Resolved At</p>
              <p className="text-sm font-medium">{formatTimestamp(finding.resolvedAt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Finding ID</p>
              <p className="text-sm font-mono text-muted-foreground truncate">{finding.id}</p>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Finding Context</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This finding captures cross-platform health checks and telemetry signals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Card className="bg-muted/30">
                <CardHeader className="py-3">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider">Details</CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-3">
                  {detailEntries.length > 0 ? (
                    <div className="space-y-2 text-xs">
                      {detailEntries.map(([key, value]) => (
                        <div key={key} className="flex items-start justify-between gap-2">
                          <span className="text-muted-foreground">{key}</span>
                          <span className="text-right font-mono text-[10px] whitespace-pre-wrap">
                            {renderValue(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic">No detail payload provided.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-muted/30 border-dashed border-primary/20">
                <CardHeader className="py-3 text-primary">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider">Response Guidance</CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-3">
                  <p className="text-[11px] text-muted-foreground leading-normal italic">
                    Review the related telemetry pipelines, integration health, and recent configuration changes
                    to determine the most likely source of degradation.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}