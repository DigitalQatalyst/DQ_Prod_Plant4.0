import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Lightbulb,
    DollarSign,
    TrendingUp,
    Clock,
    Activity,
    ShieldCheck,
    Zap,
    ArrowRight
} from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

interface PrescriptiveMaintenanceOverviewProps {
    assets: any[];
    loading: boolean;
    onSelectAsset: (asset: any) => void;
    getRecommendationsData: (assetId: string) => any;
    getPriorityColor: (priority: string) => string;
}

export function PrescriptiveMaintenanceOverview({
    assets,
    loading,
    onSelectAsset,
    getRecommendationsData,
    getPriorityColor,
}: PrescriptiveMaintenanceOverviewProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
                <Activity className="w-8 h-8 animate-spin mr-2" />
                <span>Synthesizing recommendations...</span>
            </div>
        );
    }

    // Calculate fleet-wide metrics
    let totalRecs = 0;
    let totalSavings = 0;
    let avgRiskReduction = 0;
    let urgentActions = 0;
    let countWithRecs = 0;

    assets.forEach(asset => {
        const data = getRecommendationsData(asset.id);
        if (data && data.recommendations.length > 0) {
            countWithRecs++;
            totalRecs += data.recommendations.length;
            totalSavings += data.recommendations.reduce((sum: number, r: any) => sum + (r.downtimeAvoided * 1000), 0);
            avgRiskReduction += data.recommendations.reduce((sum: number, r: any) => sum + r.riskReduction, 0) / data.recommendations.length;
            urgentActions += data.recommendations.filter((r: any) => r.urgency === "Now").length;
        }
    });

    if (countWithRecs > 0) {
        avgRiskReduction = Math.round(avgRiskReduction / countWithRecs);
    }

    const summaryCards = [
        {
            label: "Fleet Recommendations",
            count: totalRecs,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            icon: Lightbulb,
            desc: "strategies identified"
        },
        {
            label: "Potential Recovery",
            count: `$${(totalSavings / 1000).toFixed(0)}K`,
            color: "text-green-600",
            bgColor: "bg-green-50",
            icon: DollarSign,
            desc: "downtime cost avoided"
        },
        {
            label: "Avg. Risk Mitigation",
            count: `${avgRiskReduction}%`,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
            icon: ShieldCheck,
            desc: "reliability enhancement"
        },
        {
            label: "Urgent Interventions",
            count: urgentActions,
            color: "text-red-600",
            bgColor: "bg-red-50",
            icon: Zap,
            desc: "immediate actions needed"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Fleet Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryCards.map((card) => (
                    <Card
                        key={card.label}
                        className={cn(
                            "border-none shadow-sm transition-all duration-300 hover:shadow-md",
                            card.bgColor
                        )}
                    >
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                                        {card.label}
                                    </p>
                                    <h3 className={cn("text-2xl font-black", card.color)}>{card.count}</h3>
                                    <p className="text-[10px] text-muted-foreground italic font-medium">{card.desc}</p>
                                </div>
                                <div className={cn("p-2.5 rounded-xl bg-white/50 shadow-sm border border-white/20")}>
                                    <card.icon className={cn("w-6 h-6", card.color)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Asset Optimization Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/80 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-foreground uppercase tracking-tighter leading-none">
                                Optimization Recommendations Grid
                            </h3>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
                                Asset-specific prescriptive maintenance strategies
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {assets.map((asset) => {
                        const data = getRecommendationsData(asset.id);
                        if (!data || data.recommendations.length === 0) return null;

                        const recs = data.recommendations;
                        const hasUrgent = recs.some((r: any) => r.urgency === "Now");
                        const topRec = recs[0];

                        return (
                            <Card
                                key={asset.id}
                                className={cn(
                                    "group cursor-pointer hover:border-primary/50 transition-all duration-300 bg-card/40 backdrop-blur-sm relative overflow-hidden",
                                    hasUrgent ? "border-red-200 shadow-sm shadow-red-100" : "border-border/60"
                                )}
                                onClick={() => onSelectAsset(asset)}
                            >
                                {hasUrgent && (
                                    <div className="absolute top-0 right-0 p-1.5 z-10">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                                        </span>
                                    </div>
                                )}

                                <CardHeader className="p-4 pb-2">
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-xs truncate group-hover:text-primary transition-colors">
                                                {asset.name}
                                            </h4>
                                            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">
                                                {asset.asset_type || asset.type}
                                            </p>
                                        </div>
                                        <StatusBadge status={asset.status || "operational"} size="sm" />
                                    </div>
                                </CardHeader>

                                <CardContent className="p-4 pt-2 space-y-3">
                                    <div className="p-2 bg-secondary/30 rounded border border-border/40 space-y-1">
                                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1 leading-none text-center">Primary Advisory</p>
                                        <p className="text-[10px] font-bold text-foreground text-center line-clamp-1">{topRec.title}</p>
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tighter">
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground leading-none mb-1">Impact</span>
                                            <span className="text-green-600 font-black">{topRec.riskReduction}% Reduction</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-muted-foreground leading-none mb-1">ROI</span>
                                            <span className="text-blue-600 font-black">
                                                {Math.round(((topRec.downtimeAvoided * 1000) / topRec.estimatedCost - 1) * 100)}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex items-center justify-between border-t border-border/40">
                                        <div className="flex items-center gap-1">
                                            <Badge variant="outline" className="text-[8px] px-1 h-3.5 leading-none font-black uppercase text-secondary-foreground/70">
                                                {recs.length} STRATEGIES
                                            </Badge>
                                        </div>
                                        <button className="flex items-center gap-1 text-[9px] font-black text-primary hover:gap-2 transition-all">
                                            OPTIMIZE <ArrowRight className="w-3 h-3" />
                                        </button>
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
