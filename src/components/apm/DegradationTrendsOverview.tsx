import React, { useMemo } from "react";
import { Asset } from "@/types/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
    TrendingDown,
    TrendingUp,
    Activity,
    AlertTriangle,
    Clock,
    ArrowRight,
    RefreshCw,
    BarChart3,
    Search,
    Zap,
} from "lucide-react";

// ─── Deterministic Mock Data Generation ──────────────────────────────────────

function hashId(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i);
    return Math.abs(h);
}

interface MockTrend {
    assetId: string;
    assetName: string;
    assetType: string;
    parameter: string;
    currentValue: number;
    unit: string;
    rateOfChange: number; // % per month
    riskLevel: "Critical" | "High" | "Medium" | "Low";
    projectedCrossing?: string; // ISO date
    trend: "degrading" | "stable" | "improving";
}

const PARAMETERS = [
    { name: "Winding Temp", unit: "°C", typical: 65 },
    { name: "Vibration Index", unit: "mm/s", typical: 1.2 },
    { name: "Oil Pressure", unit: "bar", typical: 4.5 },
    { name: "Partial Discharge", unit: "pC", typical: 150 },
    { name: "Phase Balance", unit: "%", typical: 0.5 },
];

function generateMockTrends(assets: Asset[]): MockTrend[] {
    return assets.map(asset => {
        const h = hashId(asset.id);
        const param = PARAMETERS[h % PARAMETERS.length];
        const rateOfChange = ((h % 200) - 80) / 10; // -8% to +12%

        let trend: "degrading" | "stable" | "improving" = "stable";
        if (rateOfChange > 2) trend = "degrading";
        else if (rateOfChange < -1) trend = "improving";

        let riskLevel: MockTrend["riskLevel"] = "Low";
        if (rateOfChange > 8) riskLevel = "Critical";
        else if (rateOfChange > 4) riskLevel = "High";
        else if (rateOfChange > 2) riskLevel = "Medium";

        let projectedCrossing: string | undefined;
        if (trend === "degrading") {
            const days = 15 + (h % 90);
            const d = new Date();
            d.setDate(d.getDate() + days);
            projectedCrossing = d.toISOString();
        }

        return {
            assetId: asset.id,
            assetName: asset.name,
            assetType: asset.type,
            parameter: param.name,
            currentValue: param.typical + (h % 20),
            unit: param.unit,
            rateOfChange,
            riskLevel,
            projectedCrossing,
            trend,
        };
    }).sort((a, b) => {
        const risk = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        return risk[a.riskLevel] - risk[b.riskLevel];
    });
}

// ─── Component ───────────────────────────────────────────────────────────────

interface DegradationTrendsOverviewProps {
    assets: Asset[];
    loading?: boolean;
    onSelectAsset?: (asset: Asset) => void;
}

export function DegradationTrendsOverview({
    assets,
    loading,
    onSelectAsset,
}: DegradationTrendsOverviewProps) {
    const trends = useMemo(() => generateMockTrends(assets), [assets]);

    const stats = useMemo(() => {
        const critical = trends.filter(t => t.riskLevel === "Critical").length;
        const high = trends.filter(t => t.riskLevel === "High").length;
        const degrading = trends.filter(t => t.trend === "degrading").length;
        const avgRate = trends.reduce((acc, t) => acc + t.rateOfChange, 0) / (trends.length || 1);

        return { critical, high, degrading, avgRate };
    }, [trends]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analyzing fleet trends...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                    <TrendingDown className="w-4.5 h-4.5 text-orange-600" />
                </div>
                <div>
                    <h2 className="text-base font-semibold">Degradation Trends Overview</h2>
                    <p className="text-xs text-muted-foreground">
                        Predictive analysis across {assets.length} assets · Insights based on last 30 days
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>Updated 5m ago</span>
                </div>
            </div>

            {/* KPI Tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-muted-foreground text-nowrap">Critical Trends</p>
                                <h3 className="text-2xl font-bold text-red-600">{stats.critical}</h3>
                            </div>
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-muted-foreground text-nowrap">High Risk Assets</p>
                                <h3 className="text-2xl font-bold text-orange-600">{stats.high}</h3>
                            </div>
                            <div className="p-2 bg-orange-500/10 rounded-lg">
                                <Activity className="w-4 h-4 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-muted-foreground text-nowrap">Degrading Parameters</p>
                                <h3 className="text-2xl font-bold text-amber-600">{stats.degrading}</h3>
                            </div>
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <TrendingDown className="w-4 h-4 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-muted-foreground text-nowrap">Avg Fleet Drift</p>
                                <h3 className="text-2xl font-bold text-blue-600">{stats.avgRate.toFixed(1)}%</h3>
                            </div>
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Zap className="w-4 h-4 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Ranking Table */}
            <Card>
                <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary" />
                            Asset Degradation Ranking
                        </span>
                        <Badge variant="outline" className="text-[10px] font-normal">Sorted by Risk Level</Badge>
                    </CardTitle>
                </CardHeader>
                <div className="divide-y overflow-hidden rounded-b-xl">
                    {trends.slice(0, 10).map((t, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                const a = assets.find(as => as.id === t.assetId);
                                if (a && onSelectAsset) onSelectAsset(a);
                            }}
                            className="w-full flex items-center gap-4 px-4 py-3 hover:bg-secondary/40 transition-colors text-left group"
                        >
                            <div className="flex flex-col gap-0.5 min-w-[180px]">
                                <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">{t.assetName}</span>
                                <span className="text-[10px] text-muted-foreground uppercase">{t.assetType}</span>
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-medium">{t.parameter}</span>
                                    <span className={cn(
                                        "text-xs font-bold",
                                        t.trend === "degrading" ? "text-red-600" : "text-emerald-600"
                                    )}>
                                        {t.rateOfChange > 0 ? "+" : ""}{t.rateOfChange.toFixed(1)}% / mo
                                    </span>
                                </div>
                                <Progress
                                    value={Math.min(100, Math.abs(t.rateOfChange) * 8)}
                                    className="h-1"
                                    indicatorClassName={cn(
                                        t.riskLevel === "Critical" ? "bg-red-600" :
                                            t.riskLevel === "High" ? "bg-orange-500" :
                                                "bg-amber-400"
                                    )}
                                />
                            </div>

                            <div className="w-[120px] hidden md:flex flex-col items-end gap-1 shrink-0">
                                <Badge variant={
                                    t.riskLevel === "Critical" ? "destructive" :
                                        t.riskLevel === "High" ? "destructive" :
                                            t.riskLevel === "Medium" ? "outline" : "secondary"
                                } className="text-[10px] font-mono px-2 py-0">
                                    {t.riskLevel}
                                </Badge>
                                {t.projectedCrossing && (
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                        X-Crossing: {new Date(t.projectedCrossing).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                )}
                            </div>

                            <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                        </button>
                    ))}
                </div>
                <div className="p-3 bg-secondary/20 border-t text-center">
                    <p className="text-[10px] text-muted-foreground">Showing top 10 assets by degradation risk. Select an asset for full multi-parameter trend projection.</p>
                </div>
            </Card>

            {/* CTA / Context */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 flex items-start gap-3">
                    <Search className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-xs font-medium">How it works</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            We apply linear regression and seasonal decomposition to your telemetry history.
                            The <strong>Rate of Change</strong> calculates how fast a parameter is drifting away from its nominal baseline.
                        </p>
                    </div>
                </div>
                <div className="p-4 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5 flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-xs font-medium">Predictive Maintenance</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Assets marked as <strong>Critical</strong> are projected to cross operational limits within the next 30 days.
                            Schedule inspection before the failure point is reached.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
