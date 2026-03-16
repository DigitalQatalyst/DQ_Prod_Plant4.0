import { LucideIcon, Shield, AlertTriangle, CheckCircle, Clock, ExternalLink, ShieldAlert, Award, BarChart3, TrendingUp, AlertCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { VendorSummary, VendorScorecard } from "@/types/security";
import { cn } from "@/lib/utils";

interface VendorRiskProfileProps {
    vendor: VendorSummary;
    scorecard: VendorScorecard | null;
}

export function VendorRiskProfile({ vendor, scorecard }: VendorRiskProfileProps) {
    if (!scorecard) return null;

    const { risk_indicators, metrics } = scorecard;

    const indicators = [
        {
            label: "Critical Open Findings",
            value: risk_indicators.critical_open_findings,
            status: risk_indicators.critical_open_findings > 0 ? "destructive" : "success",
            icon: ShieldAlert
        },
        {
            label: "Expired Certifications",
            value: risk_indicators.expired_certifications,
            status: risk_indicators.expired_certifications > 0 ? "warning" : "success",
            icon: Award
        },
        {
            label: "Overdue Assessments",
            value: risk_indicators.overdue_assessments ? "YES" : "NO",
            status: risk_indicators.overdue_assessments ? "destructive" : "success",
            icon: Clock
        },
        {
            label: "Expiring Contract",
            value: risk_indicators.contract_expiring_soon ? "SOON" : "STABLE",
            status: risk_indicators.contract_expiring_soon ? "warning" : "success",
            icon: ExternalLink
        }
    ];

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Strategic Risk Indicators */}
            <Card className="xl:col-span-2 bg-gradient-to-br from-card to-secondary/30 border-primary/10 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl animate-pulse"></div>
                <CardHeader className="pb-4 relative z-10">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                        Strategic Supply Chain Indicators
                    </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {indicators.map((indicator, idx) => (
                            <div key={idx} className="bg-background/40 backdrop-blur-md p-4 rounded-xl border border-white/5 hover:border-primary/20 transition-all group">
                                <div className="flex items-center justify-between mb-2">
                                    <indicator.icon className={cn("w-5 h-5",
                                        indicator.status === 'success' ? 'text-success' :
                                            indicator.status === 'warning' ? 'text-warning' : 'text-destructive'
                                    )} />
                                </div>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1 group-hover:text-primary/70 transition-colors">
                                    {indicator.label}
                                </p>
                                <p className={cn("text-xl font-black",
                                    indicator.status === 'success' ? 'text-foreground' :
                                        indicator.status === 'warning' ? 'text-warning' : 'text-destructive'
                                )}>
                                    {indicator.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Compliance & Governance */}
            <Card className="bg-card border-border shadow-lg">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        Governance Maturity
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-tight">Compliance Level</span>
                            <Badge variant="outline" className={cn(
                                "text-[10px] uppercase font-bold px-1.5 py-0",
                                metrics.compliance_level === 'full' ? 'bg-success/10 text-success border-success/30' :
                                    metrics.compliance_level === 'partial' ? 'bg-warning/10 text-warning border-warning/30' :
                                        'bg-destructive/10 text-destructive border-destructive/30'
                            )}>
                                {metrics.compliance_level}
                            </Badge>
                        </div>
                        <div className="flex gap-1.5 items-center mt-2 overflow-x-auto pb-1 no-scrollbar">
                            {scorecard.assessment.compliance_standards?.map(std => (
                                <div key={std} className="px-2 py-1 rounded bg-secondary/50 border border-border text-[10px] font-bold whitespace-nowrap">
                                    {std}
                                </div>
                            ))}
                            {scorecard.assessment.certifications?.map(cert => (
                                <div key={cert} className="px-2 py-1 rounded bg-primary/5 border border-primary/20 text-[10px] font-bold text-primary whitespace-nowrap">
                                    {cert}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-tight">IEC 62443 Certified</span>
                            {scorecard.assessment.iec_62443_certified ?
                                <CheckCircle className="w-4 h-4 text-success" /> :
                                <XCircle className="w-4 h-4 text-muted-foreground/30" />
                            }
                        </div>
                        <p className="text-[11px] text-muted-foreground italic">
                            {scorecard.assessment.trust_level === 'trusted'
                                ? "Standard-bearer for secure industrial manufacturing."
                                : "Continuous auditing required for maintenance access."}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Remediation Performance */}
            <Card className="bg-card border-border shadow-lg">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Remediation Pulse
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">Fix Rate</span>
                            <span className="text-xs font-bold">{metrics.remediation_rate}%</span>
                        </div>
                        <Progress value={metrics.remediation_rate} className="h-1.5" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-secondary/20">
                            <p className="text-[9px] text-muted-foreground uppercase font-bold">Latency</p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                                <span className="text-sm font-black">{metrics.response_time}</span>
                            </div>
                        </div>
                        <div className="p-3 rounded-lg bg-secondary/20">
                            <p className="text-[9px] text-muted-foreground uppercase font-bold">Trend</p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <BarChart3 className={cn("w-3.5 h-3.5",
                                    metrics.security_trend === 'improving' ? 'text-success' :
                                        metrics.security_trend === 'stable' ? 'text-primary' : 'text-destructive'
                                )} />
                                <span className="text-sm font-black capitalize">{metrics.security_trend}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Security Score Breakdown (from latest assessment) */}
            <Card className="xl:col-span-2 bg-black/20 border-border shadow-inner">
                <CardContent className="p-5 flex items-center justify-around gap-4 h-full">
                    <ScoreMetric label="Patch Management" value={scorecard.assessment.patch_management_score || 0} />
                    <div className="h-8 w-px bg-border/50"></div>
                    <ScoreMetric label="Auth & Identity" value={scorecard.assessment.authentication_score || 0} />
                    <div className="h-8 w-px bg-border/50"></div>
                    <ScoreMetric label="Incident Response" value={scorecard.assessment.incident_response_score || 0} />
                    <div className="h-8 w-px bg-border/50"></div>
                    <ScoreMetric label="Encryption" value={scorecard.assessment.encryption_score || 0} />
                </CardContent>
            </Card>
        </div>
    );
}

function ScoreMetric({ label, value }: { label: string; value: number }) {
    const getScoreColor = (v: number) => {
        if (v >= 90) return 'text-success';
        if (v >= 70) return 'text-primary';
        if (v >= 50) return 'text-warning';
        return 'text-destructive';
    };

    return (
        <div className="text-center">
            <p className="text-[9px] text-muted-foreground uppercase font-extrabold tracking-widest mb-1">{label}</p>
            <p className={cn("text-lg font-black", getScoreColor(value))}>{value}%</p>
        </div>
    );
}
