import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { WorkItemDetailPage } from "@/pages/overview/WorkItemDetailPage";
import { getDataProvider } from "@/lib/data";
import { useApp } from "@/context/AppContext";
import type { WorkItem } from "@/types/overview";

/**
 * WorkItemRoutePage
 * Loads a work item by ID for direct route access.
 */
export function WorkItemRoutePage() {
  const { id } = useParams();
  const { currentTenant } = useApp();
  const [workItem, setWorkItem] = useState<WorkItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkItem() {
      if (!id) {
        setError("Missing work item id");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const provider = getDataProvider();
        const result = await provider.getWorkItems(currentTenant.id);
        const match = result.data.find(item => item.id === id) || null;
        if (!match) {
          setError("Work item not found");
        }
        setWorkItem(match);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load work item");
      } finally {
        setIsLoading(false);
      }
    }

    fetchWorkItem();
  }, [id, currentTenant.id]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Loading work item...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center text-destructive">
        {error}
      </div>
    );
  }

  if (!workItem) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Work item not available.
      </div>
    );
  }

  return <WorkItemDetailPage workItem={workItem} />;
}