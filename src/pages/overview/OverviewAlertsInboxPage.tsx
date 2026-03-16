import { useState, useEffect } from "react";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { getDataProvider } from "@/lib/data";
import { useApp } from "@/context/AppContext";
import { Alert } from "@/types/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Filter, Search } from "lucide-react";
import { OverviewAlertSummaryPage } from "./OverviewAlertSummaryPage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * OverviewAlertsInboxPage
 * Centralized alert inbox using the nLVE pattern.
 * 
 * Requirements: 1.1, 8.1, 14.2
 */
export function OverviewAlertsInboxPage() {
    const { currentTenant } = useApp();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function fetchAlerts() {
            setIsLoading(true);
            try {
                const provider = getDataProvider();
                const data = await provider.getAlertsByTenant(currentTenant.id);

                // Sort by date descending
                const sortedData = [...data].sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

                setAlerts(sortedData);
                setFilteredAlerts(sortedData);

                if (sortedData.length > 0 && !selectedAlert) {
                    setSelectedAlert(sortedData[0]);
                }
            } catch (error) {
                console.error("Failed to fetch alerts:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchAlerts();
    }, [currentTenant.id]);

    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredAlerts(alerts);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = alerts.filter(
                (alert) =>
                    alert.title.toLowerCase().includes(query) ||
                    alert.summary.toLowerCase().includes(query) ||
                    alert.featureArea.toLowerCase().includes(query)
            );
            setFilteredAlerts(filtered);
        }
    }, [searchQuery, alerts]);

    const tabs = [
        {
            id: "summary",
            label: "Alert Summary",
            content: selectedAlert ? (
                <OverviewAlertSummaryPage alert={selectedAlert} />
            ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>Select an alert from the inbox to view details</p>
                </div>
            ),
        },
    ];

    return (
        <div className="flex flex-1 h-full overflow-hidden">
            <ListPane
                title="Alert Inbox"
                subtitle="Consolidated platform alerts"
                count={filteredAlerts.length}
                actions={
                    <div className="flex flex-col gap-2 w-full mt-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search alerts..."
                                className="pl-8 h-9 text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1">
                                <Filter className="w-3 h-3" />
                                Filters
                            </Button>
                        </div>
                    </div>
                }
            >
                <div className="space-y-2 mt-4">
                    {filteredAlerts.length > 0 ? (
                        filteredAlerts.map((alert) => (
                            <button
                                key={alert.id}
                                onClick={() => setSelectedAlert(alert)}
                                className={cn(
                                    "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 border",
                                    selectedAlert?.id === alert.id
                                        ? "bg-primary/5 border-primary/30 shadow-sm"
                                        : "hover:bg-secondary/50 border-transparent"
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-sm",
                                        alert.severity === "critical" ? "bg-red-500 shadow-red-200" :
                                            alert.severity === "warning" ? "bg-orange-500 shadow-orange-200" : "bg-blue-500 shadow-blue-200"
                                    )}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={cn(
                                            "text-sm font-semibold truncate",
                                            selectedAlert?.id === alert.id ? "text-primary" : "text-foreground"
                                        )}>
                                            {alert.title}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1 leading-relaxed">
                                        {alert.summary}
                                    </p>
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 py-0 uppercase font-bold tracking-tighter opacity-70">
                                                {alert.featureArea}
                                            </Badge>
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "text-[9px] h-4 px-1.5 py-0 capitalize",
                                                    alert.status === "open" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                                        alert.status === "acknowledged" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                                            "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                )}
                                            >
                                                {alert.status}
                                            </Badge>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-medium">
                                            {new Date(alert.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-10 opacity-50">
                            <p className="text-sm">No alerts found</p>
                        </div>
                    )}
                </div>
            </ListPane>
            <WorkPane
                title={selectedAlert?.title || "Alert Details"}
                subtitle={selectedAlert ? `${selectedAlert.severity} priority alert` : "Consolidated platform intelligence"}
                tabs={tabs}
            />
        </div>
    );
}
