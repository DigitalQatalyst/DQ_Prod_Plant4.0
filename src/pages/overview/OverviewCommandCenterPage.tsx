import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDataProvider } from "@/lib/data";
import type { DashboardKPIs } from "@/types/overview";
import { Activity, AlertCircle, CheckCircle2, TrendingUp, Database, Shield } from "lucide-react";

/**
 * OverviewCommandCenterPage
 * Main dashboard displaying high-level KPIs from v_overview_kpis view
 * 
 * Requirements: Phase 7, Task 7.1
 */
export function OverviewCommandCenterPage() {
    const { currentTenant } = useApp();
    const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadKPIs = async () => {
            try {
                setLoading(true);
                setError(null);
                const provider = getDataProvider();
                const data = await provider.getOverviewKPIs(currentTenant.id);
                setKpis(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load KPIs");
            } finally {
                setLoading(false);
            }
        };

        loadKPIs();
    }, [currentTenant.id]);

    const tabs = [
        {
            id: "kpis",
            label: "Command Center",
            content: (
                <div className="p-6 space-y-6">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-muted-foreground">Loading KPIs...</div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-destructive">Error: {error}</div>
                        </div>
                    )}

                    {!loading && !error && kpis && (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <KPICard
                                title="Active Alerts"
                                value={kpis.activeAlertsCount}
                                icon={AlertCircle}
                                description="Open alerts requiring attention"
                                variant={kpis.activeAlertsCount > 0 ? "warning" : "default"}
                            />
                            <KPICard
                                title="Open Work Items"
                                value={kpis.openWorkItemsCount}
                                icon={CheckCircle2}
                                description="Tasks and actions pending"
                                variant={kpis.openWorkItemsCount > 10 ? "info" : "default"}
                            />
                            <KPICard
                                title="Integration Health"
                                value={`${kpis.integrationHealthScore}%`}
                                icon={Activity}
                                description="Integration connectivity status"
                                variant={kpis.integrationHealthScore < 80 ? "warning" : "success"}
                            />
                            <KPICard
                                title="Data Freshness"
                                value={`${kpis.dataFreshnessScore}%`}
                                icon={Database}
                                description="Data feed timeliness"
                                variant={kpis.dataFreshnessScore < 80 ? "warning" : "success"}
                            />
                            <KPICard
                                title="Platform Health"
                                value={`${kpis.platformHealthScore}%`}
                                icon={Shield}
                                description="Overall platform status"
                                variant={kpis.platformHealthScore < 80 ? "warning" : "success"}
                            />
                            <KPICard
                                title="System Status"
                                value="Operational"
                                icon={TrendingUp}
                                description="All systems nominal"
                                variant="success"
                            />
                        </div>
                    )}
                </div>
            ),
        },
    ];

    return (
        <WorkPane
            title="Command Center"
            subtitle="Platform overview and key performance indicators"
            tabs={tabs}
        />
    );
}

interface KPICardProps {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    variant?: "default" | "success" | "warning" | "info";
}

function KPICard({ title, value, icon: Icon, description, variant = "default" }: KPICardProps) {
    const variantStyles = {
        default: "border-border",
        success: "border-green-500",
        warning: "border-yellow-500",
        info: "border-blue-500",
    };

    const iconStyles = {
        default: "text-muted-foreground",
        success: "text-green-500",
        warning: "text-yellow-500",
        info: "text-blue-500",
    };

    return (
        <Card className={`${variantStyles[variant]} border-l-4`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className={`h-4 w-4 ${iconStyles[variant]}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </CardContent>
        </Card>
    );
}
