import { useEffect, useMemo, useState } from "react";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { getDataProvider } from "@/lib/data";
import { useApp } from "@/context/AppContext";
import { DataStreamStatus } from "@/types/overview";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Database, Search } from "lucide-react";
import { DataStreamDetailPage } from "./DataStreamDetailPage";

const statusStyles = {
  fresh: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  stale: "bg-orange-500/10 text-orange-600 border-orange-200",
  critical: "bg-red-500/10 text-red-600 border-red-200"
} as const;

const statusDot = {
  fresh: "bg-emerald-500 shadow-emerald-200",
  stale: "bg-orange-500 shadow-orange-200",
  critical: "bg-red-500 shadow-red-200"
} as const;

const formatTimestamp = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : "N/A";

const formatMinutes = (value?: number | null) => {
  if (value === null || value === undefined) return "N/A";
  return `${value.toFixed(1)} min`;
};

/**
 * DataStreamStatusPage
 * Displays data freshness per site using v_overview_data_freshness.
 */
export function DataStreamStatusPage() {
  const { currentTenant } = useApp();
  const [statuses, setStatuses] = useState<DataStreamStatus[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<DataStreamStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DataStreamStatus["status"]>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      setIsLoading(true);
      try {
        const provider = getDataProvider();
        const data = await provider.getDataStreamStatus(currentTenant.id);
        const sorted = [...data].sort((a, b) => (b.stalenessMinutes ?? 0) - (a.stalenessMinutes ?? 0));
        setStatuses(sorted);
        if (sorted.length > 0) {
          setSelectedStatus(prev => prev ?? sorted[0]);
        }
      } catch (error) {
        console.error("Failed to fetch data stream status:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatus();
  }, [currentTenant.id]);

  const filteredStatuses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return statuses.filter((status) => {
      const matchesFilter = statusFilter === "all" || status.status === statusFilter;
      if (!matchesFilter) return false;
      if (!query) return true;
      return status.siteId.toLowerCase().includes(query);
    });
  }, [statuses, searchQuery, statusFilter]);

  const tabs = [
    {
      id: "details",
      label: "Stream Detail",
      content: selectedStatus ? (
        <DataStreamDetailPage status={selectedStatus} />
      ) : (
        <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground border-2 border-dashed rounded-lg">
          <p>Select a site to view data stream detail</p>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <ListPane
        title="Data Stream Status"
        subtitle="Freshness by site"
        count={filteredStatuses.length}
        actions={
          <div className="flex flex-col gap-2 w-full mt-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sites..."
                className="pl-8 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              {Object.keys(statusStyles).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs capitalize"
                  onClick={() => setStatusFilter(status as DataStreamStatus["status"])}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        }
      >
        <div className="space-y-2 mt-4">
          {isLoading ? (
            <div className="text-center py-10 opacity-50">
              <p className="text-sm">Loading stream status...</p>
            </div>
          ) : filteredStatuses.length > 0 ? (
            filteredStatuses.map((status) => (
              <button
                key={`${status.siteId}-${status.streamId ?? "default"}`}
                onClick={() => setSelectedStatus(status)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 border",
                  selectedStatus?.siteId === status.siteId && selectedStatus?.streamId === status.streamId
                    ? "bg-primary/5 border-primary/30 shadow-sm"
                    : "hover:bg-secondary/50 border-transparent"
                )}
              >
                <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-sm", statusDot[status.status])} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      "text-sm font-semibold truncate",
                      selectedStatus?.siteId === status.siteId ? "text-primary" : "text-foreground"
                    )}>
                      {status.siteId}
                    </span>
                    <Database className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    Last telemetry {formatTimestamp(status.lastTelemetryAt)}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 py-0 capitalize", statusStyles[status.status])}>
                      {status.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {formatMinutes(status.stalenessMinutes)}
                    </span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-10 opacity-50">
              <p className="text-sm">No data stream status found</p>
            </div>
          )}
        </div>
      </ListPane>
      <WorkPane
        title={selectedStatus?.siteId || "Stream Detail"}
        subtitle={selectedStatus ? `${selectedStatus.status} data feed` : "Data freshness insights"}
        tabs={tabs}
      />
    </div>
  );
}