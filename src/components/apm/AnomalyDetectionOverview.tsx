import React, { useMemo } from "react";
import { Asset } from "@/types/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
    AlertTriangle,
    Activity,
    Zap,
    Thermometer,
    Gauge,
    Wifi,
    Cog,
    ShieldAlert,
    CheckCircle2,
    Clock,
    TrendingUp,
    Eye,
    MapPin,
    Loader2,
    RefreshCw,
    ArrowRight,
} from "lucide-react";

// ─── deterministic mock anomaly data seeded by asset id ─────────────────────

function hashId(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i);
    return Math.abs(h);
}

type EventType = "thermal" | "electrical" | "mechanical" | "insulation" | "comms";
type Severity = "critical" | "warning" | "info";

interface MockAnomaly {
    id: string;
    assetId: string;
    assetName: string;
    title: string;
    type: EventType;
    severity: Severity;
    confidence: number;
    detectedAt: string;
    state: "open" | "ack" | "closed";
}

const ANOMALY_TEMPLATES: Array<{
    title: string;
    type: EventType;
    severity: Severity;
}> = [
        { title: "Thermal runaway detected in winding", type: "thermal", severity: "critical" },
        { title: "Voltage imbalance exceeds 3%", type: "electrical", severity: "warning" },
        { title: "Partial discharge activity elevated", type: "insulation", severity: "warning" },
        { title: "Bearing vibration anomaly", type: "mechanical", severity: "critical" },
        { title: "Oil temperature trending high", type: "thermal", severity: "warning" },
        { title: "Communication timeout > 5 min", type: "comms", severity: "info" },
        { title: "Insulation resistance degraded", type: "insulation", severity: "critical" },
        { title: "Over-current detected on L3", type: "electrical", severity: "critical" },
        { title: "Gearbox vibration spike", type: "mechanical", severity: "warning" },
        { title: "SF6 pressure low", type: "insulation", severity: "warning" },
    ];

function generateMockAnomalies(assets: Asset[]): MockAnomaly[] {
    const anomalies: MockAnomaly[] = [];
    assets.forEach((asset) => {
        const h = hashId(asset.id);
        const count = h % 3; // 0, 1 or 2 anomalies per asset
        for (let i = 0; i < count; i++) {
            const tpl = ANOMALY_TEMPLATES[(h + i * 7) % ANOMALY_TEMPLATES.length];
            const confidence = 65 + ((h + i * 13) % 35);
            const daysAgo = (h + i * 3) % 7;
            const det = new Date();
            det.setDate(det.getDate() - daysAgo);
            det.setHours((h + i) % 24);
            const stateIdx = (h + i * 5) % 3;
            anomalies.push({
                id: `mock-${asset.id}-${i}`,
                assetId: asset.id,
                assetName: asset.name,
                title: tpl.title,
                type: tpl.type,
                severity: tpl.severity,
                confidence,
                detectedAt: det.toISOString(),
                state: stateIdx === 0 ? "open" : stateIdx === 1 ? "ack" : "closed",
            });
        }
    });
    return anomalies.sort((a, b) => {
        const sev = { critical: 0, warning: 1, info: 2 };
        return sev[a.severity] - sev[b.severity];
    });
}

// ─── style helpers ───────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<EventType, { label: string; Icon: React.ElementType; dot: string; badge: string }> = {
    thermal: { label: "Thermal", Icon: Thermometer, dot: "bg-red-500", badge: "bg-red-500/10 text-red-600 border-red-500/20" },
    electrical: { label: "Electrical", Icon: Zap, dot: "bg-yellow-500", badge: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
    mechanical: { label: "Mechanical", Icon: Cog, dot: "bg-blue-500", badge: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    insulation: { label: "Insulation", Icon: Gauge, dot: "bg-purple-500", badge: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
    comms: { label: "Communications", Icon: Wifi, dot: "bg-green-500", badge: "bg-green-500/10 text-green-600 border-green-500/20" },
};

const SEV_CONFIG: Record<Severity, { label: string; badge: string; ring: string }> = {
    critical: { label: "Critical", badge: "bg-red-500/10 text-red-600 border-red-500/20", ring: "text-red-600" },
    warning: { label: "Warning", badge: "bg-orange-500/10 text-orange-600 border-orange-500/20", ring: "text-orange-500" },
    info: { label: "Info", badge: "bg-blue-500/10 text-blue-600 border-blue-500/20", ring: "text-blue-500" },
};

const STATE_CONFIG: Record<"open" | "ack" | "closed", { label: string; badge: string }> = {
    open: { label: "Active", badge: "bg-red-500/10 text-red-600 border-red-500/20" },
    ack: { label: "Acknowledged", badge: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
    closed: { label: "Resolved", badge: "bg-green-500/10 text-green-600 border-green-500/20" },
};

function relTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function KpiTile({ label, value, sub, icon: Icon, colorClass }: {
    label: string; value: string | number; sub?: string;
    icon: React.ElementType; colorClass: string;
}) {
    return (
        <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className={cn("text-2xl font-bold mt-0.5", colorClass)}>{value}</p>
                        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
                    </div>
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", colorClass.replace("text-", "bg-").replace("600", "500/10").replace("500", "500/10"))}>
                        <Icon className={cn("w-5 h-5", colorClass)} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function TypeBar({ type, count, total }: { type: EventType; count: number; total: number }) {
    const cfg = TYPE_CONFIG[type];
    const pct = total > 0 ? (count / total) * 100 : 0;
    const Icon = cfg.Icon;
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                    <div className={cn("w-2 h-2 rounded-full", cfg.dot)} />
                    <Icon className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{cfg.label}</span>
                </div>
                <span className="font-medium">{count}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-500", cfg.dot)} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

// ─── main component ──────────────────────────────────────────────────────────

interface AnomalyDetectionOverviewProps {
    assets: Asset[];
    loading?: boolean;
    onSelectAsset?: (asset: Asset) => void;
}

export function AnomalyDetectionOverview({
    assets,
    loading,
    onSelectAsset,
}: AnomalyDetectionOverviewProps) {
    const anomalies = useMemo(() => generateMockAnomalies(assets), [assets]);

    const stats = useMemo(() => {
        const open = anomalies.filter(a => a.state === "open").length;
        const acked = anomalies.filter(a => a.state === "ack").length;
        const resolved = anomalies.filter(a => a.state === "closed").length;
        const critical = anomalies.filter(a => a.severity === "critical" && a.state === "open").length;

        const byType: Record<EventType, number> = {
            thermal: 0, electrical: 0, mechanical: 0, insulation: 0, comms: 0,
        };
        anomalies.forEach(a => { byType[a.type]++; });

        // assets with at least one open anomaly
        const assetsAffected = new Set(
            anomalies.filter(a => a.state === "open").map(a => a.assetId)
        ).size;

        // per-asset risk score (number of open + severity weight)
        const assetRisk: Record<string, { name: string; asset: Asset; score: number; openCount: number; critCount: number }> = {};
        assets.forEach(a => {
            assetRisk[a.id] = { name: a.name, asset: a, score: 0, openCount: 0, critCount: 0 };
        });
        anomalies.forEach(an => {
            if (!assetRisk[an.assetId]) return;
            const w = an.severity === "critical" ? 3 : an.severity === "warning" ? 2 : 1;
            assetRisk[an.assetId].score += w;
            if (an.state === "open") {
                assetRisk[an.assetId].openCount++;
                if (an.severity === "critical") assetRisk[an.assetId].critCount++;
            }
        });

        const rankedAssets = Object.values(assetRisk)
            .filter(v => v.score > 0)
            .sort((a, b) => b.score - a.score);

        return { open, acked, resolved, critical, byType, assetsAffected, rankedAssets };
    }, [anomalies, assets]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm">Loading fault data…</p>
                </div>
            </div>
        );
    }

    const recentOpen = anomalies.filter(a => a.state === "open").slice(0, 8);

    return (
        <div className="space-y-6 pb-8">

            {/* ── Header ── */}
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-4.5 h-4.5 text-destructive" />
                </div>
                <div>
                    <h2 className="text-base font-semibold">Anomaly &amp; Fault Detection Overview</h2>
                    <p className="text-xs text-muted-foreground">
                        AI-driven fault detection across {assets.length} asset{assets.length !== 1 ? "s" : ""} · Updated every 30 s
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
                    label="Active Faults"
                    value={stats.open}
                    sub={`${stats.critical} critical`}
                    icon={AlertTriangle}
                    colorClass={stats.open > 0 ? "text-red-600" : "text-emerald-600"}
                />
                <KpiTile
                    label="Assets Affected"
                    value={stats.assetsAffected}
                    sub={`of ${assets.length} total`}
                    icon={Activity}
                    colorClass={stats.assetsAffected > 0 ? "text-orange-600" : "text-emerald-600"}
                />
                <KpiTile
                    label="Acknowledged"
                    value={stats.acked}
                    sub="Pending review"
                    icon={Eye}
                    colorClass="text-yellow-600"
                />
                <KpiTile
                    label="Resolved (period)"
                    value={stats.resolved}
                    sub="Last 7 days"
                    icon={CheckCircle2}
                    colorClass="text-emerald-600"
                />
            </div>

            {/* ── Distribution + recent events ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Event-type breakdown */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            Events by Type
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {(Object.entries(stats.byType) as [EventType, number][]).map(([type, count]) => (
                            <TypeBar key={type} type={type} count={count} total={anomalies.length} />
                        ))}
                        {anomalies.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-4">No events recorded</p>
                        )}
                    </CardContent>
                </Card>

                {/* State summary donut-style */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-primary" />
                            Event State Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {(["open", "ack", "closed"] as const).map(state => {
                            const cfg = STATE_CONFIG[state];
                            const count = state === "open" ? stats.open : state === "ack" ? stats.acked : stats.resolved;
                            const pct = anomalies.length > 0 ? (count / anomalies.length) * 100 : 0;
                            return (
                                <div key={state} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">{cfg.label}</span>
                                        <span className="font-medium">{count}</span>
                                    </div>
                                    <Progress
                                        value={pct}
                                        className="h-1.5"
                                        indicatorClassName={
                                            state === "open" ? "bg-red-500" : state === "ack" ? "bg-yellow-500" : "bg-emerald-500"
                                        }
                                    />
                                </div>
                            );
                        })}
                        <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50">
                            <span>Total events</span>
                            <span className="font-semibold text-foreground">{anomalies.length}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Active faults feed ── */}
            {recentOpen.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                            Active Faults — Most Recent
                            <span className="ml-auto text-[10px] font-normal text-muted-foreground">
                                Click asset to investigate
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/50">
                            {recentOpen.map((anomaly) => {
                                const typeCfg = TYPE_CONFIG[anomaly.type];
                                const sevCfg = SEV_CONFIG[anomaly.severity];
                                const TypeIcon = typeCfg.Icon;
                                const matchingAsset = assets.find(a => a.id === anomaly.assetId);
                                return (
                                    <button
                                        key={anomaly.id}
                                        onClick={() => matchingAsset && onSelectAsset?.(matchingAsset)}
                                        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-secondary/40 transition-colors group"
                                    >
                                        {/* severity dot */}
                                        <div className={cn("mt-1 w-2 h-2 rounded-full shrink-0", sevCfg.ring.replace("text-", "bg-"))} />

                                        {/* main info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                                {anomaly.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">{anomaly.assetName}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                                                <span className="text-[10px] text-muted-foreground">{relTime(anomaly.detectedAt)}</span>
                                                <Eye className="w-2.5 h-2.5 text-muted-foreground ml-1" />
                                                <span className={cn("text-[10px]",
                                                    anomaly.confidence >= 90 ? "text-emerald-600" :
                                                        anomaly.confidence >= 70 ? "text-yellow-600" : "text-red-600"
                                                )}>
                                                    {anomaly.confidence}% confidence
                                                </span>
                                            </div>
                                        </div>

                                        {/* badges */}
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", sevCfg.badge)}>
                                                {sevCfg.label}
                                            </Badge>
                                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", typeCfg.badge)}>
                                                <TypeIcon className="w-2.5 h-2.5 mr-1" />
                                                {typeCfg.label}
                                            </Badge>
                                        </div>

                                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground mt-1 shrink-0 transition-colors" />
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Asset risk ranking ── */}
            {stats.rankedAssets.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary" />
                            Asset Risk Ranking
                            <span className="ml-auto text-[10px] font-normal text-muted-foreground">
                                Sorted by anomaly severity score
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/50">
                            {stats.rankedAssets.map(({ asset, score, openCount, critCount }) => {
                                const maxScore = stats.rankedAssets[0]?.score || 1;
                                const pct = (score / maxScore) * 100;
                                return (
                                    <button
                                        key={asset.id}
                                        onClick={() => onSelectAsset?.(asset)}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/40 transition-colors group"
                                    >
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

                                        {/* risk bar */}
                                        <div className="w-24 shrink-0 space-y-1">
                                            <Progress
                                                value={pct}
                                                className="h-1.5"
                                                indicatorClassName={pct >= 80 ? "bg-red-500" : pct >= 50 ? "bg-orange-500" : "bg-yellow-500"}
                                            />
                                            <p className="text-[10px] text-right text-muted-foreground">
                                                score {score}
                                            </p>
                                        </div>

                                        {/* counts */}
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            {openCount > 0 && (
                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-red-500/10 text-red-600 border-red-500/20">
                                                    {openCount} open
                                                </Badge>
                                            )}
                                            {critCount > 0 && (
                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-500/10 text-orange-600 border-orange-500/20">
                                                    {critCount} critical
                                                </Badge>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {anomalies.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-500 opacity-70" />
                        <p className="text-sm text-muted-foreground">No anomalies detected across your fleet</p>
                        <p className="text-xs text-muted-foreground mt-1">Select an asset from the list to investigate in detail</p>
                    </CardContent>
                </Card>
            )}

            {/* ── CTA ── */}
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-primary/25 bg-primary/5 px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground">
                    Select any asset from the sidebar — or click a row above — to open its full
                    diagnostic event log, filter by event type or state, and inspect the telemetry window
                    around each detected anomaly.
                </p>
            </div>
        </div>
    );
}
