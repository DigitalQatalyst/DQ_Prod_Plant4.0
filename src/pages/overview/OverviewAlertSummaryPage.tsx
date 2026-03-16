import { Alert } from "@/types/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, AlertTriangle, Shield, Zap, Factory } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * OverviewAlertSummaryPage
 * Displays detailed information about a selected alert.
 * 
 * Requirements: 8.1, 14.1
 */
export function OverviewAlertSummaryPage({ alert }: { alert: Alert }) {
    const navigate = useNavigate();

    const handleOpenSource = () => {
        // Logic to route to the source feature area or specific asset
        if (alert.featureArea === "assets" && alert.assetId) {
            navigate(`/assets/detail/360?id=${alert.assetId}`);
        } else {
            // Default fallback to the feature area's alerts page
            navigate(`/${alert.featureArea}/alerts`);
        }
    };

    const getIcon = () => {
        switch (alert.featureArea) {
            case 'assets': return Factory;
            case 'security': return Shield;
            case 'energy': return Zap;
            case 'monitoring': return AlertTriangle;
            case 'automation': return Zap;
            default: return AlertTriangle;
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
                                alert.severity === 'critical' ? 'bg-red-100 text-red-600 dark:bg-red-900/20' :
                                    alert.severity === 'warning' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20' :
                                        'bg-blue-100 text-blue-600 dark:bg-blue-900/20'
                            )}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle>{alert.title}</CardTitle>
                                <CardDescription className="mt-1">
                                    Alert ID: {alert.id} • Created {new Date(alert.createdAt).toLocaleString()}
                                </CardDescription>
                            </div>
                        </div>
                        <Button onClick={handleOpenSource} className="gap-2 shrink-0">
                            <ExternalLink className="w-4 h-4" />
                            Open in Source
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Severity</p>
                            <Badge
                                className={cn(
                                    "capitalize",
                                    alert.severity === 'critical' ? 'bg-red-500 hover:bg-red-600' :
                                        alert.severity === 'warning' ? 'bg-orange-500 hover:bg-orange-600' :
                                            'bg-blue-500 hover:bg-blue-600'
                                )}
                            >
                                {alert.severity}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                            <Badge variant="outline" className="capitalize">
                                {alert.status}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Feature Area</p>
                            <p className="text-sm font-medium capitalize">{alert.featureArea}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Last Updated</p>
                            <p className="text-sm font-medium">
                                {alert.updatedAt ? new Date(alert.updatedAt).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Alert Summary</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {alert.summary}
                            </p>
                        </div>

                        {alert.tags && alert.tags.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2">Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {alert.tags.map(tag => (
                                        <Badge key={tag} variant="secondary" className="text-[10px]">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <Card className="bg-muted/30">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-xs font-semibold uppercase tracking-wider">Context Details</CardTitle>
                                </CardHeader>
                                <CardContent className="py-0 pb-3">
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Tenant ID:</span>
                                            <span className="font-mono">{alert.tenantId}</span>
                                        </div>
                                        {alert.siteId && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Site Location:</span>
                                                <span className="font-mono text-right">{alert.siteId}</span>
                                            </div>
                                        )}
                                        {alert.assetId && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Target Asset:</span>
                                                <span className="font-mono text-right font-medium text-primary cursor-pointer hover:underline" onClick={handleOpenSource}>
                                                    {alert.assetId}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-muted/30 border-dashed">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-xs font-semibold uppercase tracking-wider">System Guidance</CardTitle>
                                </CardHeader>
                                <CardContent className="py-0 pb-3">
                                    <p className="text-[11px] text-muted-foreground leading-normal">
                                        This is a consolidated view of cross-platform alerts. For expert diagnostics, remediation playbooks, and root-cause analysis, please use the <strong>Open in Source</strong> action to navigate to the specialized module.
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
