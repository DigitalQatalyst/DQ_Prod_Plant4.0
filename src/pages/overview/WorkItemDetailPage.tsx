import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ExternalLink, CheckCircle2, CalendarClock } from "lucide-react";
import type { WorkItem, WorkItemStatus } from "@/types/overview";
import { getDataProvider } from "@/lib/data";

const priorityStyles: Record<NonNullable<WorkItem["priority"]>, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  info: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
};

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "N/A";

interface WorkItemDetailPageProps {
  workItem: WorkItem;
  onStatusChange?: (workItem: WorkItem) => void;
}

/**
 * WorkItemDetailPage
 * Shows details for a selected work item with deep linking and status actions.
 */
export function WorkItemDetailPage({ workItem, onStatusChange }: WorkItemDetailPageProps) {
  const statusLabel = workItem.status.replace("_", " ");

  const updateStatus = async (status: WorkItemStatus) => {
    try {
      const provider = getDataProvider();
      const updated = await provider.updateWorkItem(workItem.id, { status });
      onStatusChange?.(updated);
    } catch (error) {
      console.error("Failed to update work item status:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>{workItem.title}</CardTitle>
              <CardDescription className="mt-1">
                {workItem.sourceFeatureArea} • {workItem.type}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {statusLabel}
              </Badge>
              {workItem.priority && (
                <Badge className={cn("capitalize", priorityStyles[workItem.priority])}>
                  {workItem.priority}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Assigned To</p>
              <p className="text-sm font-medium">{workItem.assignedToUserId || "Unassigned"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Due Date</p>
              <div className="flex items-center gap-2 text-sm font-medium">
                <CalendarClock className="w-4 h-4 text-muted-foreground" />
                {formatDateTime(workItem.dueAt)}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Last Updated</p>
              <p className="text-sm font-medium">{formatDateTime(workItem.updatedAt)}</p>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold mb-2">Source Reference</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Feature Area: {workItem.sourceFeatureArea}</p>
                <p>Source Table: {workItem.sourceTable || "N/A"}</p>
                <p>Source ID: {workItem.sourceId || "N/A"}</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Actions</h4>
              <div className="flex flex-col gap-2">
                {workItem.deeplinkPath && (
                  <Button variant="outline" className="justify-start" asChild>
                    <a href={workItem.deeplinkPath} target="_blank" rel="noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in Source
                    </a>
                  </Button>
                )}
                {workItem.status !== "completed" && (
                  <Button className="justify-start" onClick={() => updateStatus("completed")}> 
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark as Completed
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}