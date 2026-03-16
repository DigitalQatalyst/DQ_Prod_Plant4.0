import React, { useMemo } from "react";
import { Asset } from "@/types/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
    HeartPulse,
    Activity,
    TrendingDown,
    TrendingUp,
    Minus,
    Target,
    BarChart3,
    ShieldAlert,
    Loader2,
    RefreshCw,
    MapPin,
    AlertTriangle,
    CheckCircle2,
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { generateMockHealthScore } from "@/lib/mockTelemetry";

// ─── helpers ────────────────────────────────────────────────────────────────

function getScoreBand(score: number) {
    if (score >= 85)
        return {
            label: "Good",
            color: "text-emerald-600",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            bar: "bg-emerald-500",
            ring: "stroke-emerald-500",
        };
    if (score >= 70)
        return {
            label: "Fair",
            color: "text-yellow-600",
            bg: "bg-yellow-500/10",
            border: "border-yellow-500/20",
            bar: "bg-yellow-500",
            ring: "stroke-yellow-500",
        };
    if (score >= 55)
        return {
            label: "Poor",
            color: "text-orange-600",
            bg: "bg-orange-500/10",
            border: "border-orange-500/20",
            bar: "bg-orange-500",
            ring: "stroke-orange-500",
        };
    return {
        label: "Critical",
        color: "text-red-600",
        bg: "bg-red-500/10",
        border: "border-red-500/20",
        bar: "bg-red-500",
        ring: "stroke-red-500",
    };
}

/** Deterministic 30-day health history for the fleet average sparkline */
function fleetTrendData(avgScore: number) {
    return Array.from({ length: 30 }, (_, i) => {
        const offset = Math.sin(i * 0.4) * 3 + Math.cos(i * 0.9) * 2;
        const health = Math.max(40, Math.min(100, Math.round(avgScore + offset - 2)));
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return { date: date.toISOString().split("T")[0], health };
    });
}

// ─── sub-components ──────────────────────────────────────────────────────────

function KpiTile({
    label,
    value,
    sub,
    band,
    Icon,
}: {
    label: string;
    value: string | number;
    sub?: string;
    band?: ReturnType<typeof getScoreBand>;
    Icon: React.ElementType;
}) {
    return (
        <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p
                            className={cn(
                                "text-2xl font-bold mt-0.5",
                                band ? band.color : ""
                            )}
                        >
                            {value}
                        </p>
                        {sub && (
                            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                        )}
                    </div>
                    <div
                        className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                            band ? band.bg : "bg-primary/10"
                        )}
                    >
                        <Icon className={cn("w-5 h-5", band ? band.color : "text-primary")} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/** Thin gauge arc (score 0-100) */
function ScoreGauge({ score, size = 48 }: { score: number; size?: number }) {
    const band = getScoreBand(score);
    const r = 18;
    const circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    return (
        <svg width={size} height={size} viewBox="0 0 44 44" className="shrink-0">
            <circle cx="22" cy="22" r={r} fill="none" className="stroke-muted/20" strokeWidth="4" />
            <circle
                cx="22" cy="22" r={r}
                fill="none" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${dash} ${circ}`}
                stroke="currentColor"
                className={band.color}
                transform="rotate(-90 22 22)"
            />
            <text x="22" y="26" textAnchor="middle" fontSize="10"
                className="fill-foreground font-semibold" fontFamily="inherit">
                {score}
            </text>
        </svg>
    );
}

/** Horizontal distribution bar row */
function BandRow({
    label, count, total, barClass,
}: {
    label: string; count: number; total: number; barClass: string;
}) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{count}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all duration-500", barClass)}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

// ─── main component ──────────────────────────────────────────────────────────

interface HealthScoringOverviewProps {
    assets: Asset[];
    loading?: boolean;
    onSelectAsset?: (asset: Asset) => void;
}

export function HealthScoringOverview({
    assets,
    loading,
    onSelectAsset,
}: HealthScoringOverviewProps) {
    /* ── derive per-asset health scores from mock generator ── */
    const assetScores = useMemo(
        () =>
            assets.map((a) => {
                const hs = generateMockHealthScore(a.id, a.type);
                return { asset: a, score: Math.round(hs.score) };
            }),
        [assets]
    );

    /* ── fleet-level stats ── */
    const stats = useMemo(() => {
        if (assetScores.length === 0)
            return {
                avg: 0, highest: 0, lowest: 0,
                good: 0, fair: 0, poor: 0, critical: 0,
                byType: {} as Record<string, { count: number; avgScore: number }>,
                sorted: [] as typeof assetScores,
            };

        const scores = assetScores.map((s) => s.score);
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const highest = Math.max(...scores);
        const lowest = Math.min(...scores);

        const good = assetScores.filter((s) => s.score >= 85).length;
        const fair = assetScores.filter((s) => s.score >= 70 && s.score < 85).length;
        const poor = assetScores.filter((s) => s.score >= 55 && s.score < 70).length;
        const critical = assetScores.filter((s) => s.score < 55).length;

        const byType: Record<string, { count: number; totalScore: number; avgScore: number }> = {};
        assetScores.forEach(({ asset, score }) => {
            if (!byType[asset.type]) byType[asset.type] = { count: 0, totalScore: 0, avgScore: 0 };
            byType[asset.type].count++;
            byType[asset.type].totalScore += score;
        });
        Object.values(byType).forEach((v) => {
            v.avgScore = Math.round(v.totalScore / v.count);
        });

        // sort ascending (lowest health = most urgent first)
        const sorted = [...assetScores].sort((a, b) => a.score - b.score);

        return { avg, highest, lowest, good, fair, poor, critical, byType, sorted };
    }, [assetScores]);

    const trendData = useMemo(() => fleetTrendData(stats.avg), [stats.avg]);

    /* ── loading ── */
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm">Loading health data…</p>
                </div>
            </div>
        );
    }

    const avgBand = getScoreBand(stats.avg);
    const total = assets.length;

    return (
        <div className="space-y-6 pb-8">

            {/* ── Header ── */}
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <HeartPulse className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                    <h2 className="text-base font-semibold">Fleet Health Score Overview</h2>
                    <p className="text-xs text-muted-foreground">
                        AI-computed health indices across {total} asset{total !== 1 ? "s" : ""} · Updated every 60 s
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
                    label="Fleet Avg Score"
                    value={stats.avg || "—"}
                    sub={avgBand.label}
                    band={avgBand}
                    Icon={HeartPulse}
                />
                <KpiTile
                    label="Best Health"
                    value={stats.highest || "—"}
                    sub="Highest in fleet"
                    band={getScoreBand(stats.highest)}
                    Icon={CheckCircle2}
                />
                <KpiTile
                    label="Needs Attention"
                    value={stats.poor + stats.critical}
                    sub={`${stats.critical} critical · ${stats.poor} poor`}
                    band={stats.poor + stats.critical > 0 ? getScoreBand(40) : getScoreBand(90)}
                    Icon={AlertTriangle}
                />
                <KpiTile
                    label="Lowest Score"
                    value={stats.lowest || "—"}
                    sub="Needs immediate review"
                    band={getScoreBand(stats.lowest)}
                    Icon={TrendingDown}
                />
            </div>

            {/* ── Trend + Band distribution ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fleet health trend (30d) */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary" />
                            Fleet Health Trend (30 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-36">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                                    <defs>
                                        <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 10 }}
                                        tickLine={false}
                                        tickFormatter={(v) =>
                                            new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                        }
                                        interval={6}
                                    />
                                    <YAxis
                                        domain={[40, 100]}
                                        tick={{ fontSize: 10 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--background))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "6px",
                                            fontSize: "12px",
                                        }}
                                        formatter={(v: number) => [`${v}`, "Avg Health"]}
                                        labelFormatter={(v) => new Date(v).toLocaleDateString()}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="health"
                                        stroke="hsl(var(--primary))"
                                        fill="url(#healthGrad)"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Score band distribution */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-primary" />
                            Score Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <BandRow label="Good (≥ 85)" count={stats.good} total={total} barClass="bg-emerald-500" />
                        <BandRow label="Fair (70–84)" count={stats.fair} total={total} barClass="bg-yellow-500" />
                        <BandRow label="Poor (55–69)" count={stats.poor} total={total} barClass="bg-orange-500" />
                        <BandRow label="Critical (< 55)" count={stats.critical} total={total} barClass="bg-red-500" />
                    </CardContent>
                </Card>
            </div>

            {/* ── Per-type average score ── */}
            {Object.keys(stats.byType).length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Target className="w-4 h-4 text-primary" />
                            Average Health Score by Asset Type
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(stats.byType)
                                .sort((a, b) => a[1].avgScore - b[1].avgScore)
                                .map(([type, info]) => {
                                    const band = getScoreBand(info.avgScore);
                                    return (
                                        <div key={type} className="space-y-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground truncate max-w-[60%]">{type}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {info.count} asset{info.count !== 1 ? "s" : ""}
                                                    </span>
                                                    <span className={cn("font-semibold", band.color)}>
                                                        {info.avgScore}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full transition-all duration-500", band.bar)}
                                                    style={{ width: `${info.avgScore}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Prioritised asset health table ── */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" />
                        All Assets — Sorted by Health Score
                        <span className="ml-auto text-[10px] font-normal text-muted-foreground">
                            Click a row to open full scoring breakdown
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {stats.sorted.length === 0 ? (
                        <div className="py-10 text-center text-sm text-muted-foreground">
                            No assets loaded yet
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {stats.sorted.map(({ asset, score }) => {
                                const band = getScoreBand(score);
                                const TrendIcon =
                                    score >= 85 ? TrendingUp : score >= 70 ? Minus : TrendingDown;
                                return (
                                    <button
                                        key={asset.id}
                                        onClick={() => onSelectAsset?.(asset)}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/40 transition-colors group"
                                    >
                                        {/* Gauge */}
                                        <ScoreGauge score={score} />

                                        {/* Name + type + location */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                                {asset.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">{asset.type}</p>
                                            {asset.location && (
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <MapPin className="w-2.5 h-2.5 text-muted-foreground" />
                                                    <span className="text-[10px] text-muted-foreground truncate">
                                                        {asset.location}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Score progress bar */}
                                        <div className="w-24 shrink-0 space-y-1">
                                            <Progress value={score} className="h-1.5" indicatorClassName={band.bar} />
                                            <p className={cn("text-[10px] text-right font-medium", band.color)}>
                                                {band.label}
                                            </p>
                                        </div>

                                        {/* Badges + trend */}
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <Badge
                                                variant="outline"
                                                className={cn("text-[10px] px-1.5 py-0", band.bg, band.color, band.border)}
                                            >
                                                {score} / 100
                                            </Badge>
                                            {asset.criticality && (
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-[10px] px-1.5 py-0",
                                                        asset.criticality === "critical"
                                                            ? "bg-red-500/10 text-red-600 border-red-500/20"
                                                            : asset.criticality === "high"
                                                                ? "bg-orange-500/10 text-orange-600 border-orange-500/20"
                                                                : asset.criticality === "medium"
                                                                    ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                                                                    : "bg-green-500/10 text-green-600 border-green-500/20"
                                                    )}
                                                >
                                                    {asset.criticality}
                                                </Badge>
                                            )}
                                            <TrendIcon
                                                className={cn(
                                                    "w-3 h-3",
                                                    score >= 85
                                                        ? "text-emerald-600"
                                                        : score >= 70
                                                            ? "text-muted-foreground"
                                                            : "text-red-500"
                                                )}
                                            />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── CTA ── */}
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-primary/25 bg-primary/5 px-4 py-3">
                <Target className="w-4 h-4 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground">
                    Select any asset from the list on the left — or click a row above — to open its
                    full 30-day health score history, component breakdown, and degradation contributors.
                </p>
            </div>
        </div>
    );
}
