import { useEffect, useMemo, useState } from "react";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search, ClipboardCheck, Clock, CheckCircle2 } from "lucide-react";
import { getDataProvider } from "@/lib/data";
import { useApp } from "@/context/AppContext";
import type { WorkItem, WorkItemStatus } from "@/types/overview";
import { WorkItemDetailPage } from "@/pages/overview/WorkItemDetailPage";

const statusOptions: Array<{ id: "all" | WorkItemStatus; label: string; icon: typeof ClipboardCheck }> = [
  { id: "all", label: "All", icon: ClipboardCheck },
  { id: "open", label: "Open", icon: Clock },
  { id: "in_progress", label: "In Progress", icon: ClipboardCheck },
  { id: "completed", label: "Completed", icon: CheckCircle2 }
];

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : "N/A";

/**
 * MyWorklistPage
 * Worklist for the current user using the nLVE pattern.
 */
export function MyWorklistPage() {
  const { currentTenant } = useApp();
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | WorkItemStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUserId = "u1"; // Placeholder until user identity context is added.

  useEffect(() => {
    async function fetchWorkItems() {
      setIsLoading(true);
      setError(null);
      try {
        const provider = getDataProvider();
        const result = await provider.getWorkItems(currentTenant.id);
        const sorted = [...result.data].sort((a, b) => {
          const aTime = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
          const bTime = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
          return aTime - bTime;
        });
        setWorkItems(sorted);
        if (sorted.length > 0) {
          setSelectedWorkItem(prev => prev ?? sorted[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load work items");
      } finally {
        setIsLoading(false);
      }
    }

    fetchWorkItems();
  }, [currentTenant.id]);

  const userScopedItems = useMemo(() => {
    const assigned = workItems.filter(item => item.assignedToUserId === currentUserId);
    return assigned.length > 0 ? assigned : workItems;
  }, [workItems, currentUserId]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return userScopedItems.filter(item => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      if (!matchesStatus) return false;
      if (!query) return true;
      return (
        item.title.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        item.sourceFeatureArea.toLowerCase().includes(query)
      );
    });
  }, [userScopedItems, searchQuery, statusFilter]);

  const tabs = [
    {
      id: "details",
      label: "Work Item Details",
      content: selectedWorkItem ? (
        <WorkItemDetailPage
          workItem={selectedWorkItem}
          onStatusChange={(updated) => {
            setWorkItems(prev => prev.map(item => (item.id === updated.id ? updated : item)));
            setSelectedWorkItem(updated);
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground border-2 border-dashed rounded-lg">
          <p>Select a work item to view details</p>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <ListPane
        title="My Worklist"
        subtitle="Assigned work items and actions"
        count={filteredItems.length}
        actions={
          <div className="flex flex-col gap-2 w-full mt-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search work items..."
                className="pl-8 h-9 text-sm"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {statusOptions.map((option) => (
                <Button
                  key={option.id}
                  variant={statusFilter === option.id ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={() => setStatusFilter(option.id)}
                >
                  <option.icon className="w-3 h-3" />
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        }
      >
        <div className="space-y-2 mt-4">
          {isLoading ? (
            <div className="text-center py-10 opacity-50">
              <p className="text-sm">Loading work items...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-destructive">
              <p className="text-sm">{error}</p>
            </div>
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedWorkItem(item)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 border",
                  selectedWorkItem?.id === item.id
                    ? "bg-primary/5 border-primary/30 shadow-sm"
                    : "hover:bg-secondary/50 border-transparent"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      "text-sm font-semibold truncate",
                      selectedWorkItem?.id === item.id ? "text-primary" : "text-foreground"
                    )}>
                      {item.title}
                    </span>
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 py-0 uppercase">
                      {item.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {item.sourceFeatureArea}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[9px] h-4 px-1.5 py-0 capitalize">
                        {item.status.replace("_", " ")}
                      </Badge>
                      {item.priority && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 py-0 capitalize">
                          {item.priority}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      Due {formatDate(item.dueAt)}
                    </span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-10 opacity-50">
              <p className="text-sm">No work items found</p>
            </div>
          )}
        </div>
      </ListPane>
      <WorkPane
        title={selectedWorkItem?.title || "Work Item Details"}
        subtitle={selectedWorkItem ? selectedWorkItem.sourceFeatureArea : "Detailed work instructions"}
        tabs={tabs}
      />
    </div>
  );
}