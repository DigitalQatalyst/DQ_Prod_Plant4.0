import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDataProvider } from "@/lib/data";
import type { OverviewDashboard } from "@/types/overview";
import { LayoutDashboard, Star } from "lucide-react";

/**
 * OverviewDashboardsPage
 * List of available dashboards (Operations, Reliability, Energy, etc.)
 * 
 * Requirements: Phase 7, Task 7.1
 */
export function OverviewDashboardsPage() {
    const { currentTenant } = useApp();
    const [dashboards, setDashboards] = useState<OverviewDashboard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadDashboards = async () => {
            try {
                setLoading(true);
                setError(null);
                const provider = getDataProvider();
                const data = await provider.getDashboards(currentTenant.id);
                setDashboards(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load dashboards");
            } finally {
                setLoading(false);
            }
        };

        loadDashboards();
    }, [currentTenant.id]);

    const tabs = [
        {
            id: "dashboards",
            label: "Dashboards",
            content: (
                <div className="p-6 space-y-6">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-muted-foreground">Loading dashboards...</div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-destructive">Error: {error}</div>
                        </div>
                    )}

                    {!loading && !error && dashboards.length === 0 && (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-muted-foreground">No dashboards configured</div>
                        </div>
                    )}

                    {!loading && !error && dashboards.length > 0 && (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {dashboards.map((dashboard) => (
                                <DashboardCard key={dashboard.id} dashboard={dashboard} />
                            ))}
                        </div>
                    )}
                </div>
            ),
        },
    ];

    return (
        <WorkPane
            title="Dashboards"
            subtitle="Browse and access your custom dashboards"
            tabs={tabs}
        />
    );
}

interface DashboardCardProps {
    dashboard: OverviewDashboard;
}

function DashboardCard({ dashboard }: DashboardCardProps) {
    return (
        <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <LayoutDashboard className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                    </div>
                    {dashboard.isDefault && (
                        <Badge variant="secondary" className="ml-2">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                        </Badge>
                    )}
                </div>
                {dashboard.presetType && (
                    <CardDescription className="mt-2">
                        <Badge variant="outline" className="capitalize">
                            {dashboard.presetType}
                        </Badge>
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    View detailed analytics and metrics
                </p>
            </CardContent>
        </Card>
    );
}
