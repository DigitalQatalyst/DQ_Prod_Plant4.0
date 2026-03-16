import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DataStreamDetailPage } from "@/pages/overview/DataStreamDetailPage";
import { getDataProvider } from "@/lib/data";
import { useApp } from "@/context/AppContext";
import type { DataStreamStatus } from "@/types/overview";

/**
 * DataStreamRoutePage
 * Loads a data stream status by ID (siteId) for direct route access.
 */
export function DataStreamRoutePage() {
    const { id } = useParams();
    const { currentTenant } = useApp();
    const [status, setStatus] = useState<DataStreamStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!id) {
                setError("Missing stream id");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const provider = getDataProvider();
                const result = await provider.getDataStreamStatus(currentTenant.id);
                const match = result.find(item => item.siteId === id) || null;
                if (!match) {
                    setError("Data stream not found");
                }
                setStatus(match);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unable to load data stream");
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [id, currentTenant.id]);

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center text-muted-foreground p-12">
                Loading data stream...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-1 items-center justify-center text-destructive p-12">
                {error}
            </div>
        );
    }

    if (!status) {
        return (
            <div className="flex flex-1 items-center justify-center text-muted-foreground p-12">
                Data stream not available.
            </div>
        );
    }

    return <DataStreamDetailPage status={status} />;
}
