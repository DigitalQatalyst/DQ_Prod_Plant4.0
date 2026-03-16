import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, AlertTriangle, TrendingUp, Clock, Activity, ShieldAlert } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

interface FailurePredictionOverviewProps {
    assets: any[];
    loading: boolean;
    onSelectAsset: (asset: any) => void;
    getAllPredictionsForAsset: (assetId: string) => any;
    getRiskLevelStyle: (riskLevel: string) => any;
    getFailureProbabilityColor: (probability: number) => string;
    getRULStatusColor: (days: number) => string;
}

export function FailurePredictionOverview({
    assets,
    loading,
    onSelectAsset,
    getAllPredictionsForAsset,
    getRiskLevelStyle,
    getFailureProbabilityColor,
    getRULStatusColor,
}: FailurePredictionOverviewProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                <Activity className="w-8 h-8 animate-spin mr-2" />
                <span>Loading predictions...</span>
            </div>
        );
    }

    const riskLevels = ["Critical", "High", "Medium", "Low"];
    const summary = riskLevels.map(level => ({
        level,
        count: assets.filter(asset => getAllPredictionsForAsset(asset.id)?.riskLevel === level).length,
        style: getRiskLevelStyle(level)
    }));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Fleet Risk Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {summary.map(({ level, count, style }) => (
                    <Card
                        key={level}
                        className={cn(
                            "border-none shadow-sm transition-all duration-300 hover:scale-[1.02]",
                            style.bgColor
                        )}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                                        {level} Risk
                                    </p>
                                    <div className="flex items-baseline gap-1">
                                        <span className={cn("text-2xl font-black", style.color)}>{count}</span>
                                        <span className="text-[10px] text-muted-foreground font-medium">Assets</span>
                                    </div>
                                </div>
                                <div className={cn("p-2 rounded-lg bg-white/40 shadow-inner")}>
                                    <ShieldAlert className={cn("w-5 h-5", style.color)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Assets Grid */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Predictive Insights Grid
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assets.map((asset) => {
                        const predictionData = getAllPredictionsForAsset(asset.id);
                        if (!predictionData) return null;

                        const riskStyle = getRiskLevelStyle(predictionData.riskLevel);

                        return (
                            <Card
                                key={asset.id}
                                className="group cursor-pointer hover:shadow-md hover:border-primary/40 transition-all duration-300 overflow-hidden border-border/60 bg-card/50 backdrop-blur-sm"
                                onClick={() => onSelectAsset(asset)}
                            >
                                <div className={cn("h-1 w-full", riskStyle.color.replace('text', 'bg'))} />
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
                                            <ShieldAlert className={cn("w-3.5 h-3.5", riskStyle.color)} />
                                            Risk Profile
                                        </div>
                                        <Badge variant={riskStyle.variant} className="text-[9px] font-black px-2 py-0 h-4 uppercase">
                                            {predictionData.riskLevel}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-[11px] font-medium">
                                            <span className="text-muted-foreground">30-Day Probability</span>
                                            <span className={cn("font-bold", getFailureProbabilityColor(predictionData.failureProbability["30d"]))}>
                                                {predictionData.failureProbability["30d"]}%
                                            </span>
                                        </div>
                                        <Progress value={predictionData.failureProbability["30d"]} className="h-1" />
                                    </div>

                                    <div className="grid grid-cols-3 gap-1 py-1.5 px-2 bg-secondary/20 rounded-md border border-border/50">
                                        {[
                                            { label: '7d', val: predictionData.failureProbability["7d"] },
                                            { label: '30d', val: predictionData.failureProbability["30d"] },
                                            { label: '90d', val: predictionData.failureProbability["90d"] }
                                        ].map((slot, i) => (
                                            <div key={slot.label} className={cn("text-center", i !== 0 && "border-l border-border/30")}>
                                                <div className={cn("text-[10px] font-black leading-none mb-0.5", getFailureProbabilityColor(slot.val))}>
                                                    {slot.val}%
                                                </div>
                                                <div className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">{slot.label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-border/30">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-muted-foreground">RUL:</span>
                                            <span className={cn("font-bold", getRULStatusColor(predictionData.rulDays))}>
                                                {predictionData.rulDays}d
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <TrendingUp className="w-3 h-3 text-blue-500" />
                                            <span className="font-bold text-blue-600">{predictionData.confidenceLevel}% Conf.</span>
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
