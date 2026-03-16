import React from "react";
import {
    ShieldCheck,
    Activity,
    AlertTriangle,
    Lock,
    Fingerprint,
    LucideIcon,
    CheckCircle2,
    Clock,
    Shield,
    Globe,
    Zap,
    Layout
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
    PieChart,
    Pie,
    AreaChart,
    Area
} from "recharts";

// ─── Metric Card ─────────────────────────────────────────────────────────────

export interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    icon: LucideIcon;
    variant?: 'default' | 'success' | 'warning' | 'destructive' | 'primary';
}

function MetricCard({ title, value, subtitle, icon: Icon, variant = 'default' }: MetricCardProps) {
    const variantColors = {
        default: 'text-muted-foreground bg-muted/20 border-muted-foreground/20',
        primary: 'text-primary bg-primary/10 border-primary/20',
        success: 'text-success bg-success/10 border-success/20',
        warning: 'text-warning bg-warning/10 border-warning/20',
        destructive: 'text-destructive bg-destructive/10 border-destructive/20',
    };

    return (
        <Card className="overflow-hidden border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold tracking-tight">{value}</p>
                        <p className="text-[10px] text-muted-foreground">{subtitle}</p>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${variantColors[variant]}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── IdentityGovernanceMetrics (section-level overview) ──────────────────────

interface IdentityGovernanceMetricsProps {
    title: string;
    description: string;
    metrics: MetricCardProps[];
    children?: React.ReactNode;
}

export function IdentityGovernanceMetrics({ title, description, metrics, children }: IdentityGovernanceMetricsProps) {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric, idx) => (
                    <MetricCard key={idx} {...metric} />
                ))}
            </div>

            {children}
        </div>
    );
}

// ─── EnforcementHeatmap ──────────────────────────────────────────────────────

interface EnforcementHeatmapProps {
    title: string;
    description: string;
    data: { name: string; value: number; total: number; color?: string }[];
}

export function EnforcementHeatmap({ title, description, data }: EnforcementHeatmapProps) {
    return (
        <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    {title}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 mt-2">
                    {data.map((item, idx) => (
                        <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                                <span>{item.name}</span>
                                <span className="text-muted-foreground">{item.value} / {item.total}</span>
                            </div>
                            <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full transition-all duration-1000 ease-out"
                                    style={{
                                        width: `${(item.value / item.total) * 100}%`,
                                        backgroundColor: item.color || 'hsl(var(--primary))'
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// ─── GovernanceTimeline ──────────────────────────────────────────────────────

interface GovernanceTimelineProps {
    title: string;
    data: { date: string; count: number }[];
}

export function GovernanceTimeline({ title, data }: GovernanceTimelineProps) {
    return (
        <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[180px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} dy={10} />
                            <YAxis hide />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    fontSize: '11px'
                                }}
                            />
                            <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── SecurityMix (Pie) ───────────────────────────────────────────────────────

interface SecurityMixProps {
    title: string;
    data: { name: string; value: number; color: string }[];
}

export function SecurityMix({ title, data }: SecurityMixProps) {
    return (
        <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-primary" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[180px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    fontSize: '11px'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                    {data.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-[10px] text-muted-foreground truncate font-medium uppercase">{item.name}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Individual Item Detail Components ───────────────────────────────────────

export interface DetailProperty {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    mono?: boolean;
    variant?: 'default' | 'success' | 'warning' | 'destructive';
}

export function DetailPropertyRow({ label, value, icon: Icon, mono, variant = 'default' }: DetailProperty) {
    const valueColors = {
        default: 'text-foreground',
        success: 'text-success',
        warning: 'text-warning',
        destructive: 'text-destructive',
    };
    return (
        <div className="flex items-start justify-between py-2.5 border-b border-border/40 last:border-0 gap-4">
            <div className="flex items-center gap-2 shrink-0">
                {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">{label}</span>
            </div>
            <span className={`text-xs text-right ${valueColors[variant]} ${mono ? 'font-mono' : 'font-medium'} break-all max-w-[55%]`}>
                {value}
            </span>
        </div>
    );
}

export interface LifecycleStep {
    label: string;
    sublabel?: string;
    status: 'completed' | 'active' | 'pending' | 'failed';
}

export function StatusLifecycle({ steps }: { steps: LifecycleStep[] }) {
    const getStepStyle = (status: LifecycleStep['status']) => {
        switch (status) {
            case 'completed': return { ring: 'ring-success', bg: 'bg-success', text: 'text-success' };
            case 'active': return { ring: 'ring-primary', bg: 'bg-primary', text: 'text-primary' };
            case 'failed': return { ring: 'ring-destructive', bg: 'bg-destructive', text: 'text-destructive' };
            default: return { ring: 'ring-muted-foreground/30', bg: 'bg-muted/40', text: 'text-muted-foreground' };
        }
    };

    return (
        <div className="flex items-start">
            {steps.map((step, idx) => {
                const style = getStepStyle(step.status);
                return (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                        <div className="flex items-center w-full">
                            <div className={`h-px flex-1 ${idx === 0 ? 'opacity-0' : step.status !== 'pending' ? 'bg-success/50' : 'bg-border'}`} />
                            <div className={`w-7 h-7 rounded-full ring-2 ${style.ring} ${style.bg} flex items-center justify-center shrink-0`}>
                                {step.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-white" />}
                                {step.status === 'active' && <Activity className="w-3.5 h-3.5 text-white" />}
                                {step.status === 'pending' && <Clock className="w-3.5 h-3.5 text-muted-foreground" />}
                                {step.status === 'failed' && <AlertTriangle className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <div className={`h-px flex-1 ${idx === steps.length - 1 ? 'opacity-0' : step.status === 'completed' ? 'bg-success/50' : 'bg-border'}`} />
                        </div>
                        <div className="mt-2 text-center px-1">
                            <p className={`text-[10px] font-bold uppercase tracking-tight ${style.text}`}>{step.label}</p>
                            {step.sublabel && <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{step.sublabel}</p>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export function TagBadgeList({ tags, colorFn }: { tags: string[]; colorFn?: (tag: string) => string }) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {tags.length === 0
                ? <span className="text-xs text-muted-foreground italic">None configured</span>
                : tags.map((tag, idx) => (
                    <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border bg-secondary/20 border-border"
                        style={colorFn ? { color: colorFn(tag), borderColor: `${colorFn(tag)}40`, backgroundColor: `${colorFn(tag)}10` } : {}}
                    >
                        {tag}
                    </span>
                ))
            }
        </div>
    );
}

// ─── Rule Detail Card ───────────────────────────────────────────────────────

export interface RuleDetailCardProps {
    order: number;
    title: string;
    description?: string;
    effect: 'allow' | 'deny';
    actions: string[];
    metadata: {
        label: string;
        value: string;
        icon: LucideIcon;
        variant?: 'default' | 'success' | 'warning' | 'destructive';
    }[];
}

export function RuleDetailCard({ order, title, description, effect, actions, metadata }: RuleDetailCardProps) {
    return (
        <div className="bg-card/40 border border-border/60 rounded-xl p-4 hover:border-primary/40 transition-all group shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary border border-primary/20 shadow-inner group-hover:scale-110 transition-transform">
                        {order}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm tracking-tight capitalize">{title}</h4>
                        {description && <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>}
                    </div>
                </div>
                <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border shadow-sm ${effect === 'allow'
                    ? 'bg-success/10 text-success border-success/30'
                    : 'bg-destructive/10 text-destructive border-destructive/30'
                    }`}>
                    {effect}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Capabilities</p>
                    <TagBadgeList
                        tags={actions}
                        colorFn={() => effect === 'allow' ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'}
                    />
                </div>
                <div className="grid grid-cols-1 gap-1.5 border-l border-border/40 pl-4">
                    {metadata.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <item.icon className="w-3 h-3" />
                                <span className="font-semibold uppercase tracking-tight">{item.label}</span>
                            </div>
                            <span className={`font-bold ${item.variant === 'success' ? 'text-success' :
                                item.variant === 'warning' ? 'text-warning' :
                                    item.variant === 'destructive' ? 'text-destructive' :
                                        'text-foreground'
                                }`}>
                                {item.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── AnalysisMetric ──────────────────────────────────────────────────────────

export interface AnalysisMetricProps {
    label: string;
    value: string | number;
    status?: 'success' | 'warning' | 'failed' | 'default';
    variant?: 'row' | 'card';
    icon: LucideIcon;
}

export function AnalysisMetric({
    label,
    value,
    status = 'default',
    variant = 'row',
    icon: Icon
}: AnalysisMetricProps) {
    if (variant === 'card') {
        const variantClasses = {
            default: "text-primary",
            warning: "text-warning",
            failed: "text-destructive", // mapped from 'failed' to match cards' 'destructive'
            success: "text-success"
        };

        const displayStatus = status === 'failed' ? 'failed' : status;

        return (
            <div className="bg-card border border-border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
                </div>
                <p className={`text-lg font-bold ${variantClasses[status as keyof typeof variantClasses] || variantClasses.default}`}>{value}</p>
            </div>
        );
    }

    // Default 'row' variant
    const statusColors = {
        success: 'text-success',
        warning: 'text-warning',
        failed: 'text-destructive',
        default: 'text-foreground'
    };

    const statusBg = {
        success: 'bg-success',
        warning: 'bg-warning',
        failed: 'bg-destructive',
        default: 'bg-muted-foreground'
    };

    return (
        <div className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
            <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-secondary/20 text-muted-foreground">
                    <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
            </div>
            <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-tighter">
                <span className={statusColors[status as keyof typeof statusColors] || statusColors.default}>
                    {value}
                </span>
                <div className={`w-1.5 h-1.5 rounded-full ${statusBg[status as keyof typeof statusBg] || statusBg.default}`} />
            </div>
        </div>
    );
}
