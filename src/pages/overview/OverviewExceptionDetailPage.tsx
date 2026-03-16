import { OverviewException } from "@/types/overview";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Cpu, Activity, Database, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * OverviewExceptionDetailPage
 * Displays detailed information about a platform exception/anomaly.
 * 
 * Requirements: 12.1, 14.3
 */
export function OverviewExceptionDetailPage({ exception }: { exception: OverviewException }) {
    const navigate = useNavigate();

    const handleDeepLink = () => {
        if (exception.sourceRef?.deeplink) {
            navigate(exception.sourceRef.deeplink);
        }
    };

    const getIcon = () => {
        switch (exception.exceptionType) {
            case 'AI': return Cpu;
            case 'DATA': return Database;
            case 'SYSTEM': return Activity;
            default: return AlertCircle;
        }
    };

    const Icon = getIcon();

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "p-3 rounded-lg",
                                exception.severity === 'critical' ? 'bg-red-100 text-red-600 dark:bg-red-900/20' :
                                    exception.severity === 'warning' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20' :
                                        'bg-blue-100 text-blue-600 dark:bg-blue-900/20'
                            )}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle>{exception.title}</CardTitle>
                                <CardDescription className="mt-1">
                                    Exception ID: {exception.id} • Detected {new Date(exception.createdAt).toLocaleString()}
                                </CardDescription>
                            </div>
                        </div>
                        {exception.sourceRef?.deeplink && (
                            <Button onClick={handleDeepLink} className="gap-2 shrink-0">
                                <ExternalLink className="w-4 h-4" />
                                Investigate Source
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Severity</p>
                            <Badge
                                className={cn(
                                    "capitalize",
                                    exception.severity === 'critical' ? 'bg-red-500 hover:bg-red-600' :
                                        exception.severity === 'warning' ? 'bg-orange-500 hover:bg-orange-600' :
                                            'bg-blue-500 hover:bg-blue-600'
                                )}
                            >
                                {exception.severity}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                            <Badge variant="outline" className="capitalize">
                                {exception.status}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Type</p>
                            <p className="text-sm font-medium">{exception.exceptionType}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Owner Team</p>
                            <p className="text-sm font-medium">{exception.ownerTeamId || 'Unassigned'}</p>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Technical Description</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {exception.description || 'No detailed description available.'}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <Card className="bg-muted/30">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-xs font-semibold uppercase tracking-wider">Source Metadata</CardTitle>
                                </CardHeader>
                                <CardContent className="py-0 pb-3">
                                    {exception.sourceRef ? (
                                        <pre className="text-[10px] text-muted-foreground bg-black/5 p-2 rounded overflow-auto max-h-[150px] font-mono">
                                            {JSON.stringify(exception.sourceRef, null, 2)}
                                        </pre>
                                    ) : (
                                        <p className="text-[10px] text-muted-foreground italic">No metadata provided.</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="bg-muted/30 border-dashed border-primary/20">
                                <CardHeader className="py-3 text-primary">
                                    <CardTitle className="text-xs font-semibold uppercase tracking-wider">AI Reasoning Context</CardTitle>
                                </CardHeader>
                                <CardContent className="py-0 pb-3">
                                    <p className="text-[11px] text-muted-foreground leading-normal italic">
                                        "This anomaly was detected by the platform reasoning engine. It represents a potential deviation from historical operational patterns. We recommend cross-referencing this with active maintenance schedules before taking remediation steps."
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
