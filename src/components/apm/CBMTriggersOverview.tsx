import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Settings,
    AlertTriangle,
    CheckCircle,
    Activity,
    Clock,
    ArrowRight,
    ShieldAlert,
    Power
} from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

interface CBMTriggersOverviewProps {
    assets: any[];
    loading: boolean;
    onSelectAsset: (asset: any) => void;
    getCBMData: (assetId: string) => any;
    getTriggerStatusColor: (status: string) => string;
    getTriggerStatusIcon: (status: string) => React.ReactNode;
}

export function CBMTriggersOverview({
    assets,
    loading,
    onSelectAsset,
    getCBMData,
    getTriggerStatusColor,
    getTriggerStatusIcon,
}: CBMTriggersOverviewProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
                <Activity className="w-8 h-8 animate-spin mr-2" />
                <span>Syncing CBM rules...</span>
            </div>
        );
    }

    const triggeredCount = assets.reduce((sum, asset) => {
        const data = getCBMData(asset.id);
        return sum + (data?.triggers.filter((t: any) => t.status === "Triggered").length || 0);
    }, 0);

    const totalTriggers = assets.reduce((sum, asset) => {
        const data = getCBMData(asset.id);
        return sum + (data?.triggers.length || 0);
    }, 0);

    const activeMonitoring = assets.filter(asset => {
        const data = getCBMData(asset.id);
        return data?.triggers.some((t: any) => t.status === "Active");
    }).length;

    const summaryCards = [
        {
            label: "Critical Triggers",
            count: triggeredCount,
            color: "text-red-600",
            bgColor: "bg-red-50",
            icon: AlertTriangle,
            desc: "requiring immediate action"
        },
        {
            label: "Total Safe Rules",
            count: totalTriggers - triggeredCount,
            color: "text-green-600",
            bgColor: "bg-green-50",
            icon: CheckCircle,
            desc: "within nominal range"
        },
        {
            label: "Active Monitoring",
            count: activeMonitoring,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            icon: Activity,
            desc: "continuous watch state"
        },
        {
            label: "Rule Engine Status",
            count: "ONLINE",
            color: "text-purple-600",
            bgColor: "bg-purple-50",
            icon: ShieldAlert,
            desc: "v1.4 rule definitions"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Fleet CBM Summary */}
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
                                    <div className="flex items-baseline gap-2">
                                        <h3 className={cn("text-2xl font-black", card.color)}>{card.count}</h3>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic">{card.desc}</p>
                                </div>
                                <div className={cn("p-2.5 rounded-xl bg-white/50 shadow-sm border border-white/20")}>
                                    <card.icon className={cn("w-6 h-6", card.color)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Asset Trigger Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/80 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Settings className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-foreground uppercase tracking-tighter leading-none">
                                Condition-Based Rules Grid
                            </h3>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
                                Real-time rule evaluation across monitored endpoints
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {assets.map((asset) => {
                        const cbmData = getCBMData(asset.id);
                        if (!cbmData) return null;

                        const triggered = cbmData.triggers.filter((t: any) => t.status === "Triggered").length;
                        const total = cbmData.triggers.length;

                        return (
                            <Card
                                key={asset.id}
                                className={cn(
                                    "group cursor-pointer hover:border-primary/50 transition-all duration-300 bg-card/40 backdrop-blur-sm relative overflow-hidden",
                                    triggered > 0 ? "border-red-200" : "border-border/60"
                                )}
                                onClick={() => onSelectAsset(asset)}
                            >
                                {triggered > 0 && (
                                    <div className="absolute top-0 right-0 p-1">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
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
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tighter p-2 bg-secondary/30 rounded border border-border/40">
                                        <span className="text-muted-foreground">Active Rules</span>
                                        <span className="text-primary">{total}</span>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-[10px]">
                                            <span className="font-bold text-muted-foreground uppercase tracking-widest">Status Distribution</span>
                                            <span className={cn("font-black", triggered > 0 ? "text-red-500" : "text-green-500")}>
                                                {triggered > 0 ? `${triggered} TRIGGERED` : "ALL NOMINAL"}
                                            </span>
                                        </div>
                                        <div className="flex h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                                            <div
                                                className="bg-red-500 h-full transition-all duration-500"
                                                style={{ width: `${(triggered / total) * 100}%` }}
                                            />
                                            <div
                                                className="bg-green-500 h-full transition-all duration-500"
                                                style={{ width: `${((total - triggered) / total) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-[9px] text-muted-foreground font-medium italic">Latest check: 2m ago</span>
                                        </div>
                                        <button className="flex items-center gap-1 text-[9px] font-black text-primary hover:gap-2 transition-all group-hover:translate-x-1">
                                            VIEW RULES <ArrowRight className="w-3 h-3" />
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
