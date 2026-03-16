import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PlatformHealthFindingDetailPage } from "@/pages/overview/PlatformHealthFindingDetailPage";
import { getDataProvider } from "@/lib/data";
import { useApp } from "@/context/AppContext";
import type { PlatformHealthFinding } from "@/types/overview";

/**
 * PlatformHealthFindingRoutePage
 * Loads a health finding by ID for direct route access.
 */
export function PlatformHealthFindingRoutePage() {
    const { id } = useParams();
    const { currentTenant } = useApp();
    const [finding, setFinding] = useState<PlatformHealthFinding | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchFinding() {
            if (!id) {
                setError("Missing finding id");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const provider = getDataProvider();
                const result = await provider.getPlatformHealthFindings?.(currentTenant.id);
                const match = result?.find(item => item.id === id) || null;
                if (!match) {
                    setError("Health finding not found");
                }
                setFinding(match);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unable to load health finding");
            } finally {
                setIsLoading(false);
            }
        }

        fetchFinding();
    }, [id, currentTenant.id]);

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center text-muted-foreground p-12">
                Loading health finding details...
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

    if (!finding) {
        return (
            <div className="flex flex-1 items-center justify-center text-muted-foreground p-12">
                Health finding not available.
            </div>
        );
    }

    return <PlatformHealthFindingDetailPage finding={finding} />;
}
