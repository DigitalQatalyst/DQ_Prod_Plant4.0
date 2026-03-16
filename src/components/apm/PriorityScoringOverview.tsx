import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Target,
    AlertTriangle,
    TrendingUp,
    DollarSign,
    Calculator,
    ArrowRight,
    TrendingDown,
    Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PriorityScoringOverviewProps {
    data: any[];
    onSelectAsset: (assetId: string) => void;
    getRiskLevelColor: (riskLevel: string) => string;
}

export function PriorityScoringOverview({
    data,
    onSelectAsset,
    getRiskLevelColor,
}: PriorityScoringOverviewProps) {
    const stats = [
        {
            label: "Total Assets",
            value: data.length,
            desc: "in priority queue",
            icon: Target,
            color: "text-blue-600",
            bgColor: "bg-blue-50"
        },
        {
            label: "High Risk",
            value: data.filter(item => item.riskLevel === "Critical" || item.riskLevel === "High").length,
            desc: "critical + high",
            icon: AlertTriangle,
            color: "text-red-600",
            bgColor: "bg-red-50"
        },
        {
            label: "Increasing Risk",
            value: data.filter(item => item.trend === "increasing").length,
            desc: "trending up",
            icon: TrendingUp,
            color: "text-orange-600",
            bgColor: "bg-orange-50"
        },
        {
            label: "Total Budget",
            value: `$${(data.reduce((sum, item) => sum + item.estimatedCost, 0) / 1000).toFixed(0)}K`,
            desc: "estimated cost",
            icon: DollarSign,
            color: "text-green-600",
            bgColor: "bg-green-50"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Formula Card */}
            <Card className="border-none shadow-sm bg-gradient-to-r from-slate-50 to-white overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Calculator className="w-32 h-32" />
                </div>
                <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Calculator className="w-4 h-4" />
                        Priority Calculation Engine
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex-1 space-y-4">
                            <div className="text-xl md:text-2xl font-black tracking-tighter text-slate-900 flex flex-wrap items-center gap-2">
                                <span className="text-blue-600">PRIORITY</span> =
                                <span className="text-green-600 px-2 py-1 bg-green-50 rounded-lg">CRITICALITY</span> ×
                                <span className="text-orange-600 px-2 py-1 bg-orange-50 rounded-lg">PROBABILITY</span> ×
                                <span className="text-purple-600 px-2 py-1 bg-purple-50 rounded-lg">CONSEQUENCE</span>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium max-w-2xl leading-relaxed">
                                Our proprietary risk scoring algorithm synthesizes asset criticality metadata, AI-predicted failure probabilities,
                                and downstream operational impact to rank maintenance interventions.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Card
                        key={stat.label}
                        className={cn(
                            "border-none shadow-sm transition-all duration-300 hover:shadow-md",
                            stat.bgColor
                        )}
                    >
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                                        {stat.label}
                                    </p>
                                    <h3 className={cn("text-2xl font-black", stat.color)}>{stat.value}</h3>
                                    <p className="text-[10px] text-muted-foreground italic font-medium">{stat.desc}</p>
                                </div>
                                <div className={cn("p-2.5 rounded-xl bg-white/50 shadow-sm border border-white/20")}>
                                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Priority Queue Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/80 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-foreground uppercase tracking-tighter leading-none">
                                Ranked Priority Queue
                            </h3>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
                                Dynamic risk-weighted maintenance scheduling
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {data.map((item) => {
                        const isCritical = item.riskLevel === "Critical";

                        return (
                            <Card
                                key={item.assetId}
                                className={cn(
                                    "group cursor-pointer hover:border-primary/50 transition-all duration-300 bg-card/40 backdrop-blur-sm relative overflow-hidden",
                                    isCritical ? "border-red-200 shadow-sm shadow-red-100" : "border-border/60"
                                )}
                                onClick={() => onSelectAsset(item.assetId)}
                            >
                                {isCritical && (
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
                                                {item.assetName}
                                            </h4>
                                            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">
                                                {item.assetType}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className={cn("text-[8px] h-4 font-black uppercase tracking-widest", getRiskLevelColor(item.riskLevel))}>
                                            {item.riskLevel}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-4 pt-2 space-y-4">
                                    <div className="flex items-end justify-between">
                                        <div className="space-y-0.5">
                                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Priority Score</p>
                                            <p className="text-2xl font-black text-slate-900 leading-none tracking-tighter">{item.priorityScore}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Cost</p>
                                            <p className="text-xs font-bold text-green-600 leading-none">${item.estimatedCost.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-1 pt-3 border-t border-border/40">
                                        <div className="space-y-1">
                                            <p className="text-[7px] font-bold text-muted-foreground uppercase text-center tracking-tighter">Crit.</p>
                                            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-500" style={{ width: `${(item.criticality / 10) * 100}%` }} />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[7px] font-bold text-muted-foreground uppercase text-center tracking-tighter">Prob.</p>
                                            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-orange-500" style={{ width: `${item.failureProbability}%` }} />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[7px] font-bold text-muted-foreground uppercase text-center tracking-tighter">Cons.</p>
                                            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500" style={{ width: `${(item.consequence / 10) * 100}%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            {item.trend === "increasing" ? (
                                                <TrendingUp className="w-3 h-3 text-red-500" />
                                            ) : (
                                                <TrendingDown className="w-3 h-3 text-green-500" />
                                            )}
                                            <span className="text-[9px] font-bold text-muted-foreground">
                                                {item.trendChange >= 0 ? "+" : ""}{item.trendChange}% Trend
                                            </span>
                                        </div>
                                        <button className="flex items-center gap-1 text-[9px] font-black text-primary hover:gap-2 transition-all">
                                            DRILL DOWN <ArrowRight className="w-3 h-3" />
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
