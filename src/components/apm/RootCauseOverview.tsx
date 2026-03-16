import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
    Lightbulb,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Wrench,
    Search,
    FileText,
    Activity,
    ArrowRight,
    Loader2,
    LayoutDashboard,
} from "lucide-react";
import type { DiagnosticEvent } from "@/types/apm";

// ─── Component ───────────────────────────────────────────────────────────────

interface RootCauseOverviewProps {
    events: DiagnosticEvent[];
    loading?: boolean;
    onSelectEvent?: (event: DiagnosticEvent) => void;
}

export function RootCauseOverview({
    events,
    loading,
    onSelectEvent,
}: RootCauseOverviewProps) {
    const stats = useMemo(() => {
        const total = events.length;
        const open = events.filter(e => e.state === "open").length;
        const acked = events.filter(e => e.state === "ack").length;
        const closed = events.filter(e => e.state === "closed").length;

        // simulate RCA coverage (some closed events might not have RCA records in real DB, 
        // but here we just show the distribution)
        const pendingRCA = events.filter(e => e.state === "ack").length;

        return { total, open, acked, closed, pendingRCA };
    }, [events]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Summarizing diagnostics...</p>
            </div>
        );
    }

    const recentOpen = events.filter(e => e.state === "open" || e.state === "ack").slice(0, 6);

    return (
        <div className="space-y-6 p-6 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-4.5 h-4.5 text-purple-600" />
                </div>
                <div>
                    <h2 className="text-base font-semibold">Diagnostic Analysis Overview</h2>
                    <p className="text-xs text-muted-foreground">
                        Root cause analysis status across {stats.total} detected events
                    </p>
                </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-destructive/5 border-destructive/20 transition-all hover:shadow-sm">
                    <CardContent className="pt-4 pb-4">
                        <p className="text-xs text-destructive font-medium uppercase tracking-wider">Urgent</p>
                        <h3 className="text-2xl font-bold mt-1">{stats.open}</h3>
                        <p className="text-[10px] text-muted-foreground mt-1">Open & waiting detection</p>
                    </CardContent>
                </Card>
                <Card className="bg-amber-500/5 border-amber-500/20">
                    <CardContent className="pt-4 pb-4">
                        <p className="text-xs text-amber-600 font-medium uppercase tracking-wider">In Analysis</p>
                        <h3 className="text-2xl font-bold mt-1">{stats.acked}</h3>
                        <p className="text-[10px] text-muted-foreground mt-1">Personnel investigating</p>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-500/5 border-emerald-500/20">
                    <CardContent className="pt-4 pb-4">
                        <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider">Resolved</p>
                        <h3 className="text-2xl font-bold mt-1">{stats.closed}</h3>
                        <p className="text-[10px] text-muted-foreground mt-1">Documented solutions</p>
                    </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-4 pb-4">
                        <p className="text-xs text-primary font-medium uppercase tracking-wider">RCA Yield</p>
                        <h3 className="text-2xl font-bold mt-1">
                            {stats.total > 0 ? Math.round((stats.closed / stats.total) * 100) : 0}%
                        </h3>
                        <p className="text-[10px] text-muted-foreground mt-1">Conversion to RCA records</p>
                    </CardContent>
                </Card>
            </div>

            {/* Actionable Feed */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left: Pending investigation */}
                <div className="md:col-span-2 space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2 px-1">
                        <Search className="w-4 h-4 text-primary" />
                        Events Pending RCA
                    </h3>
                    <div className="space-y-3">
                        {recentOpen.map((event) => (
                            <Card
                                key={event.id}
                                className="hover:border-primary/50 cursor-pointer transition-all group"
                                onClick={() => onSelectEvent?.(event)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1 pr-4">
                                            <h4 className="text-sm font-medium group-hover:text-primary transition-colors">{event.title}</h4>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{event.description}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4.5">
                                                    {event.event_type}
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {new Date(event.detected_at).toLocaleDateString()}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Activity className="w-2.5 h-2.5" />
                                                    {event.confidence}% Confidence
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Badge className={cn(
                                                "text-[10px] px-1.5",
                                                event.state === "open" ? "bg-red-500/10 text-red-600 border-red-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                            )}>
                                                {event.state === "open" ? "Urgent" : "In Progress"}
                                            </Badge>
                                            <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-all translate-x-0 group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {recentOpen.length === 0 && (
                            <div className="text-center py-12 border rounded-xl border-dashed">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                                <p className="text-sm text-muted-foreground">All events have been analyzed</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Distribution & Quick Links */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                Analysis Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                                    <span>Detection to RCA</span>
                                    <span>{stats.closed} / {stats.total}</span>
                                </div>
                                <Progress value={stats.total > 0 ? (stats.closed / stats.total) * 100 : 0} className="h-1.5" />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                                    <span>Personnel Assigned</span>
                                    <span>{stats.acked} / {stats.total - stats.closed}</span>
                                </div>
                                <Progress value={(stats.total - stats.closed) > 0 ? (stats.acked / (stats.total - stats.closed)) * 100 : 0} className="h-1.5 bg-secondary" indicatorClassName="bg-amber-500" />
                            </div>

                            <div className="pt-2 border-t mt-4 flex flex-col gap-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                        <Wrench className="w-3.5 h-3.5" /> Corrective Actions
                                    </span>
                                    <span className="font-semibold text-emerald-600">Active</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                        <LayoutDashboard className="w-3.5 h-3.5" /> FMEA Knowledge
                                    </span>
                                    <span className="font-semibold text-primary">Indexed</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-secondary/20">
                        <CardContent className="pt-4 pb-4">
                            <h4 className="text-xs font-semibold mb-2">Knowledge Base Tip</h4>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Documentation of "Resolved" events contributes to the FMEA database,
                                improving future confidence scores for similar anomalies. Ensure resolution
                                notes are detailed.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
