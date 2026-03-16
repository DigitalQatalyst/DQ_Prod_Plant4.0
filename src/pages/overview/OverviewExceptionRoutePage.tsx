import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { OverviewExceptionDetailPage } from "@/pages/overview/OverviewExceptionDetailPage";
import { getDataProvider } from "@/lib/data";
import { useApp } from "@/context/AppContext";
import type { OverviewException } from "@/types/overview";

/**
 * OverviewExceptionRoutePage
 * Loads an exception by ID for direct route access.
 */
export function OverviewExceptionRoutePage() {
    const { id } = useParams();
    const { currentTenant } = useApp();
    const [exception, setException] = useState<OverviewException | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchException() {
            if (!id) {
                setError("Missing exception id");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const provider = getDataProvider();
                const result = await provider.getOverviewExceptions?.(currentTenant.id);
                const match = result?.find(item => item.id === id) || null;
                if (!match) {
                    setError("Exception not found");
                }
                setException(match);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unable to load exception");
            } finally {
                setIsLoading(false);
            }
        }

        fetchException();
    }, [id, currentTenant.id]);

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center text-muted-foreground p-12">
                Loading exception details...
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

    if (!exception) {
        return (
            <div className="flex flex-1 items-center justify-center text-muted-foreground p-12">
                Exception not available.
            </div>
        );
    }

    return <OverviewExceptionDetailPage exception={exception} />;
}
