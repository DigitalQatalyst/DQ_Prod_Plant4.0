import React, { useMemo } from "react";
import { Asset } from "@/types/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    HeartPulse,
    Activity,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    Wrench,
    TrendingDown,
    TrendingUp,
    Minus,
    RefreshCw,
    Loader2,
    MapPin,
    ShieldAlert,
} from "lucide-react";

interface ConditionMonitoringOverviewProps {
    assets: Asset[];
    loading?: boolean;
    onSelectAsset?: (asset: Asset) => void;
}

/* ── helpers ── */
function getStatusConfig(status: string) {
    switch (status) {
        case "online":
            return { label: "Online", color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-500", Icon: CheckCircle2 };
        case "offline":
            return { label: "Offline", color: "text-red-600", bg: "bg-red-500/10", border: "border-red-500/20", dot: "bg-red-500", Icon: XCircle };
        case "maintenance":
            return { label: "Maintenance", color: "text-purple-600", bg: "bg-purple-500/10", border: "border-purple-500/20", dot: "bg-purple-500", Icon: Wrench };
        case "pending":
            return { label: "Pending", color: "text-yellow-600", bg: "bg-yellow-500/10", border: "border-yellow-500/20", dot: "bg-yellow-500", Icon: Clock };
        default:
            return { label: status, color: "text-muted-foreground", bg: "bg-secondary", border: "border-border", dot: "bg-muted-foreground", Icon: Minus };
    }
}

function getCriticalityConfig(criticality?: string) {
    const c = (criticality || "").toLowerCase();
    switch (c) {
        case "critical":
            return { label: "Critical", color: "text-red-600", bg: "bg-red-500/10", border: "border-red-500/20", dot: "bg-red-500" };
        case "high":
        case "important":
            return { label: criticality || "High", color: "text-orange-600", bg: "bg-orange-500/10", border: "border-orange-500/20", dot: "bg-orange-500" };
        case "medium":
        case "standard":
            return { label: criticality || "Medium", color: "text-yellow-600", bg: "bg-yellow-500/10", border: "border-yellow-500/20", dot: "bg-yellow-400" };
        case "low":
            return { label: "Low", color: "text-green-600", bg: "bg-green-500/10", border: "border-green-500/20", dot: "bg-green-500" };
        default:
            return { label: criticality || "—", color: "text-muted-foreground", bg: "bg-secondary", border: "border-border", dot: "bg-muted-foreground" };
    }
}

function getHealthConfig(score?: number) {
    if (score === undefined || score === null) return { label: "—", color: "text-muted-foreground", ring: "stroke-muted-foreground/30", trend: null };
    if (score >= 85) return { label: "Good", color: "text-emerald-600", ring: "stroke-emerald-500", trend: "up" };
    if (score >= 70) return { label: "Fair", color: "text-yellow-600", ring: "stroke-yellow-500", trend: "stable" };
    return { label: "Poor", color: "text-red-600", ring: "stroke-red-500", trend: "down" };
}

/* ── Radial mini-gauge ── */
function MiniGauge({ score, size = 48 }: { score: number; size?: number }) {
    const cfg = getHealthConfig(score);
    const r = 18;
    const circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    return (
        <svg width={size} height={size} viewBox="0 0 44 44" className="shrink-0">
            <circle cx="22" cy="22" r={r} fill="none" className="stroke-muted/20" strokeWidth="4" />
            <circle
                cx="22" cy="22" r={r}
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circ}`}
                stroke="currentColor"
                className={cfg.color}
                transform="rotate(-90 22 22)"
            />
            <text x="22" y="26" textAnchor="middle" fontSize="10" className="fill-foreground font-semibold" fontFamily="inherit">
                {score}
            </text>
        </svg>
    );
}

/* ── Summary KPI tile ── */
function KpiTile({
    label,
    value,
    sub,
    Icon,
    iconColor,
    iconBg,
}: {
    label: string;
    value: string | number;
    sub?: string;
    Icon: React.ElementType;
    iconColor: string;
    iconBg: string;
}) {
    return (
        <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-2xl font-bold mt-0.5">{value}</p>
                        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
                    </div>
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", iconBg)}>
                        <Icon className={cn("w-5 h-5", iconColor)} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/* ── Horizontal bar ── */
function BarRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{count}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

/* ── Main component ── */
export function ConditionMonitoringOverview({ assets, loading, onSelectAsset }: ConditionMonitoringOverviewProps) {
    /* ── Derived stats ── */
    const stats = useMemo(() => {
        const total = assets.length;
        const online = assets.filter(a => a.status === "online").length;
        const offline = assets.filter(a => a.status === "offline").length;
        const maintenance = assets.filter(a => a.status === "maintenance").length;
        const pending = assets.filter(a => a.status === "pending").length;

        const withHealth = assets.filter(a => a.healthIndex !== undefined);
        const avgHealth = withHealth.length
            ? Math.round(withHealth.reduce((s, a) => s + (a.healthIndex ?? 0), 0) / withHealth.length)
            : null;

        const critical = assets.filter(a => a.anomalyState === "Critical").length;
        const warning = assets.filter(a => a.anomalyState === "Warning").length;
        const normal = assets.filter(a => a.anomalyState === "Normal").length;

        const byType = assets.reduce<Record<string, number>>((acc, a) => {
            acc[a.type] = (acc[a.type] || 0) + 1;
            return acc;
        }, {});

        // sort by highest risk first: offline → critical anomaly → warning → maintenance → normal
        const prioritised = [...assets].sort((a, b) => {
            const score = (x: Asset) => {
                if (x.status === "offline") return 5;
                if (x.anomalyState === "Critical") return 4;
                if (x.status === "maintenance") return 3;
                if (x.anomalyState === "Warning") return 2;
                return 0;
            };
            return score(b) - score(a);
        });

        return { total, online, offline, maintenance, pending, avgHealth, critical, warning, normal, byType, prioritised };
    }, [assets]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm">Loading condition data…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">

            {/* ── Header ── */}
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <HeartPulse className="w-4.5 h-4.5 text-primary animate-pulse" />
                </div>
                <div>
                    <h2 className="text-base font-semibold">Fleet Condition Overview</h2>
                    <p className="text-xs text-muted-foreground">
                        Live summary across {stats.total} monitored asset{stats.total !== 1 ? "s" : ""} · Auto-refreshes every 30 s
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                    <RefreshCw className="w-3 h-3" />
                    <span>Live</span>
                </div>
            </div>

            {/* ── KPI row ── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                <KpiTile
                    label="Total Assets"
                    value={stats.total}
                    sub="Under monitoring"
                    Icon={Activity}
                    iconColor="text-primary"
                    iconBg="bg-primary/10"
                />
                <KpiTile
                    label="Online"
                    value={stats.online}
                    sub={`${stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}% availability`}
                    Icon={CheckCircle2}
                    iconColor="text-emerald-600"
                    iconBg="bg-emerald-500/10"
                />
                <KpiTile
                    label="Faults / Alerts"
                    value={stats.critical + stats.warning}
                    sub={`${stats.critical} critical · ${stats.warning} warning`}
                    Icon={AlertTriangle}
                    iconColor="text-amber-600"
                    iconBg="bg-amber-500/10"
                />
                <KpiTile
                    label="Fleet Health"
                    value={stats.avgHealth !== null ? `${stats.avgHealth}` : "—"}
                    sub={stats.avgHealth !== null ? getHealthConfig(stats.avgHealth).label : "No health data"}
                    Icon={HeartPulse}
                    iconColor={stats.avgHealth !== null ? getHealthConfig(stats.avgHealth).color : "text-muted-foreground"}
                    iconBg={stats.avgHealth !== null && stats.avgHealth >= 85 ? "bg-emerald-500/10" : stats.avgHealth !== null && stats.avgHealth >= 70 ? "bg-yellow-500/10" : "bg-red-500/10"}
                />
            </div>

            {/* ── Distributions ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status breakdown */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary" />
                            Asset Status Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <BarRow label="Online" count={stats.online} total={stats.total} color="bg-emerald-500" />
                        <BarRow label="Offline" count={stats.offline} total={stats.total} color="bg-red-500" />
                        <BarRow label="Maintenance" count={stats.maintenance} total={stats.total} color="bg-purple-500" />
                        <BarRow label="Pending" count={stats.pending} total={stats.total} color="bg-yellow-400" />
                    </CardContent>
                </Card>

                {/* Condition state */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-primary" />
                            Condition State Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <BarRow label="Normal" count={stats.normal} total={stats.total} color="bg-emerald-500" />
                        <BarRow label="Warning" count={stats.warning} total={stats.total} color="bg-yellow-400" />
                        <BarRow label="Critical" count={stats.critical} total={stats.total} color="bg-red-500" />
                        <BarRow
                            label="Unmonitored"
                            count={stats.total - stats.normal - stats.warning - stats.critical}
                            total={stats.total}
                            color="bg-muted-foreground/40"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* ── Asset type distribution ── */}
            {Object.keys(stats.byType).length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary" />
                            Assets by Type
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(stats.byType)
                                .sort((a, b) => b[1] - a[1])
                                .map(([type, count]) => (
                                    <div
                                        key={type}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary text-xs font-medium"
                                    >
                                        <span className="text-foreground">{type}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-semibold">
                                            {count}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Priority asset list ── */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-primary" />
                        Assets Requiring Attention
                        <span className="ml-auto text-[10px] font-normal text-muted-foreground">
                            Click an asset to open its live data
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {stats.prioritised.length === 0 ? (
                        <div className="py-10 text-center text-sm text-muted-foreground">
                            No assets loaded yet
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {stats.prioritised.map((asset) => {
                                const statusCfg = getStatusConfig(asset.status);
                                const critCfg = getCriticalityConfig(asset.criticality);
                                const healthCfg = getHealthConfig(asset.healthIndex);

                                const TrendIcon =
                                    healthCfg.trend === "up"
                                        ? TrendingUp
                                        : healthCfg.trend === "down"
                                            ? TrendingDown
                                            : Minus;

                                return (
                                    <button
                                        key={asset.id}
                                        onClick={() => onSelectAsset?.(asset)}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/40 transition-colors group"
                                    >
                                        {/* Health gauge or placeholder */}
                                        {asset.healthIndex !== undefined ? (
                                            <MiniGauge score={asset.healthIndex} />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0 text-xs text-muted-foreground">
                                                —
                                            </div>
                                        )}

                                        {/* Name & type */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                                {asset.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">{asset.type}</p>
                                            {asset.location && (
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <MapPin className="w-2.5 h-2.5 text-muted-foreground" />
                                                    <span className="text-[10px] text-muted-foreground truncate">{asset.location}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Badges */}
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            {/* Status */}
                                            <Badge
                                                variant="outline"
                                                className={cn("text-[10px] px-1.5 py-0 flex items-center gap-1", statusCfg.bg, statusCfg.color, statusCfg.border)}
                                            >
                                                <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)} />
                                                {statusCfg.label}
                                            </Badge>

                                            {/* Criticality */}
                                            {asset.criticality && (
                                                <Badge
                                                    variant="outline"
                                                    className={cn("text-[10px] px-1.5 py-0", critCfg.bg, critCfg.color, critCfg.border)}
                                                >
                                                    {critCfg.label}
                                                </Badge>
                                            )}

                                            {/* Anomaly state */}
                                            {asset.anomalyState && asset.anomalyState !== "Normal" && (
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-[10px] px-1.5 py-0",
                                                        asset.anomalyState === "Critical"
                                                            ? "bg-red-500/10 text-red-600 border-red-500/20"
                                                            : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                                                    )}
                                                >
                                                    {asset.anomalyState}
                                                </Badge>
                                            )}

                                            {/* Health trend */}
                                            {asset.healthIndex !== undefined && (
                                                <TrendIcon className={cn("w-3 h-3", healthCfg.color)} />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── CTA hint ── */}
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-primary/25 bg-primary/5 px-4 py-3">
                <HeartPulse className="w-4 h-4 text-primary animate-pulse shrink-0" />
                <p className="text-xs text-muted-foreground">
                    Select any asset from the list on the left — or click a row above — to open its full
                    live telemetry, health score, and trend charts.
                </p>
            </div>
        </div>
    );
}
