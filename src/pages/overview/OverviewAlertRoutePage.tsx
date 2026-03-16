import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { OverviewAlertSummaryPage } from "@/pages/overview/OverviewAlertSummaryPage";
import { getDataProvider } from "@/lib/data";
import { useApp } from "@/context/AppContext";
import type { Alert } from "@/types/alert";

/**
 * OverviewAlertRoutePage
 * Loads an alert by ID for direct route access.
 */
export function OverviewAlertRoutePage() {
    const { id } = useParams();
    const { currentTenant } = useApp();
    const [alert, setAlert] = useState<Alert | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchAlert() {
            if (!id) {
                setError("Missing alert id");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const provider = getDataProvider();
                const result = await provider.getAlertsByTenant(currentTenant.id);
                const match = result.find(item => item.id === id) || null;
                if (!match) {
                    setError("Alert not found");
                }
                setAlert(match);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unable to load alert");
            } finally {
                setIsLoading(false);
            }
        }

        fetchAlert();
    }, [id, currentTenant.id]);

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center text-muted-foreground p-12">
                Loading alert details...
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

    if (!alert) {
        return (
            <div className="flex flex-1 items-center justify-center text-muted-foreground p-12">
                Alert not available.
            </div>
        );
    }

    return <OverviewAlertSummaryPage alert={alert} />;
}
