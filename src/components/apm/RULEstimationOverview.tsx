import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Target, TrendingDown, Activity, ShieldAlert, BarChart3, AlertTriangle, Calendar } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

interface RULEstimationOverviewProps {
    assets: any[];
    loading: boolean;
    onSelectAsset: (asset: any) => void;
    getRULData: (assetId: string) => any;
    getRULStatusColor: (days: number) => string;
    getRULStatusBadge: (days: number) => { variant: any; label: string };
    getDegradationTrend: (trend: string) => any;
}

export function RULEstimationOverview({
    assets,
    loading,
    onSelectAsset,
    getRULData,
    getRULStatusColor,
    getRULStatusBadge,
    getDegradationTrend,
}: RULEstimationOverviewProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                <Activity className="w-8 h-8 animate-spin mr-2" />
                <span>Loading RUL estimations...</span>
            </div>
        );
    }

    const criticalAssets = assets.filter(asset => {
        const data = getRULData(asset.id);
        return data && data.rulDays <= 60;
    });

    const highRiskAssets = assets.filter(asset => {
        const data = getRULData(asset.id);
        return data && data.rulDays > 60 && data.rulDays <= 120;
    });

    const averageRUL = assets.length > 0
        ? Math.round(assets.reduce((acc, asset) => acc + (getRULData(asset.id)?.rulDays || 0), 0) / assets.length)
        : 0;

    const summaryCards = [
        {
            label: "Critical RUL (<60d)",
            count: criticalAssets.length,
            color: "text-red-600",
            bgColor: "bg-red-50",
            icon: AlertTriangle
        },
        {
            label: "High Risk (60-120d)",
            count: highRiskAssets.length,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
            icon: Clock
        },
        {
            label: "Fleet Avg RUL",
            count: `${averageRUL}d`,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            icon: Calendar
        },
        {
            label: "Model Reliability",
            count: "94.2%",
            color: "text-green-600",
            bgColor: "bg-green-50",
            icon: Target
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Fleet RUL Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryCards.map((card) => (
                    <Card
                        key={card.label}
                        className={cn(
                            "border-none shadow-sm transition-all duration-300 hover:scale-[1.02]",
                            card.bgColor
                        )}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                                        {card.label}
                                    </p>
                                    <h3 className={cn("text-2xl font-black", card.color)}>{card.count}</h3>
                                </div>
                                <div className={cn("p-2 rounded-lg bg-white/40 shadow-inner")}>
                                    <card.icon className={cn("w-5 h-5", card.color)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Assets RUL Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 uppercase tracking-tighter">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Remaining Useful Life Grid
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assets.map((asset) => {
                        const rulData = getRULData(asset.id);
                        if (!rulData) return null;

                        const statusBadge = getRULStatusBadge(rulData.rulDays);
                        const trendInfo = getDegradationTrend(rulData.trendDirection);

                        return (
                            <Card
                                key={asset.id}
                                className="group cursor-pointer hover:shadow-md hover:border-primary/40 transition-all duration-300 overflow-hidden border-border/60 bg-card/50 backdrop-blur-sm"
                                onClick={() => onSelectAsset(asset)}
                            >
                                <div className={cn("h-1 w-full", getRULStatusColor(rulData.rulDays).replace('text', 'bg'))} />
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-0.5 min-w-0">
                                            <CardTitle className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                                                {asset.name}
                                            </CardTitle>
                                            <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">
                                                {asset.asset_type || asset.type} • {asset.location}
                                            </p>
                                        </div>
                                        <StatusBadge status={asset.status || "operational"} size="sm" />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-2 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 font-bold text-[11px] text-muted-foreground/80 uppercase tracking-wider">
                                            <Clock className={cn("w-3.5 h-3.5", getRULStatusColor(rulData.rulDays))} />
                                            Life Span Analysis
                                        </div>
                                        <Badge variant={statusBadge.variant} className="text-[9px] font-black px-2 py-0 h-4 uppercase">
                                            {statusBadge.label}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-[11px] font-medium">
                                            <span className="text-muted-foreground">Estimated Remaining Life</span>
                                            <span className={cn("font-bold text-lg", getRULStatusColor(rulData.rulDays))}>
                                                {rulData.rulDays} <span className="text-[10px] font-normal uppercase">days</span>
                                            </span>
                                        </div>
                                        <Progress
                                            value={Math.max(10, Math.min(100, (rulData.rulDays / 365) * 100))}
                                            className="h-1"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 py-2 px-3 bg-secondary/20 rounded-md border border-border/50">
                                        <div className="text-center border-r border-border/30">
                                            <div className="text-[12px] font-black leading-none mb-1 text-blue-600">
                                                {rulData.confidenceLevel}%
                                            </div>
                                            <div className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest leading-none">Confidence</div>
                                        </div>
                                        <div className="text-center">
                                            <div className={cn("text-[12px] font-black leading-none mb-1", trendInfo.color)}>
                                                {rulData.degradationRate}%
                                            </div>
                                            <div className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest leading-none">Degradation/mo</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-border/30">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-muted-foreground">Months:</span>
                                            <span className="font-bold">{rulData.rulMonths.toFixed(1)}m</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <trendInfo.icon className={cn("w-3 h-3", trendInfo.color)} />
                                            <span className={cn("font-bold", trendInfo.color)}>{trendInfo.label} Trend</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
