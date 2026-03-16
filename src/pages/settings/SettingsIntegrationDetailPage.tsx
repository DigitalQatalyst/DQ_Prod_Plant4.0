import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getDataProvider } from "@/lib/data";
import { Plug, Activity, Settings, ArrowLeft, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import type { IntegrationInstance, IntegrationHealthEvent } from "@/types/settings";

export function SettingsIntegrationDetailPage() {
    const { integrationId } = useParams<{ integrationId: string }>();
    const navigate = useNavigate();
    const { currentTenant } = useApp();
    const { toast } = useToast();
    const [integration, setIntegration] = useState<IntegrationInstance | null>(null);
    const [healthEvents, setHealthEvents] = useState<IntegrationHealthEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!integrationId) return;

            try {
                setLoading(true);
                const provider = getDataProvider();
                const integrationData = await provider.getIntegration?.(integrationId);
                const healthData = await provider.getIntegrationHealthEvents?.(integrationId, 10);
                setIntegration(integrationData || null);
                setHealthEvents(healthData || []);
            } catch (err) {
                console.error("Failed to load integration data", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [integrationId]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return CheckCircle2;
            case 'degraded': return AlertTriangle;
            default: return XCircle;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-success';
            case 'degraded': return 'text-warning';
            default: return 'text-destructive';
        }
    };

    const tabs = [
        {
            id: "overview",
            label: "Overview",
            content: (
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
                            <ArrowLeft className="h-4 w-4" /> Back
                        </Button>
                        <Button variant="outline" onClick={() => navigate(`/settings/integrations/${integrationId}/edit`)} className="gap-2">
                            <Settings className="h-4 w-4" /> Configure
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">Loading integration...</div>
                    ) : integration ? (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Plug className="h-8 w-8 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle>{integration.name}</CardTitle>
                                                <CardDescription>{integration.typeCode}</CardDescription>
                                            </div>
                                        </div>
                                        <Badge variant={integration.status === 'active' ? 'outline' : 'secondary'}
                                            className={integration.status === 'active' ? 'bg-success/10 text-success border-success/20' : ''}>
                                            {integration.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground">Integration ID</p>
                                            <p className="text-sm font-mono mt-1">{integration.id}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground">Last Sync</p>
                                            <p className="text-sm mt-1">
                                                {integration.lastSyncAt
                                                    ? new Date(integration.lastSyncAt).toLocaleString()
                                                    : 'Never'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-primary" />
                                        Health History
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {healthEvents.length > 0 ? (
                                        <div className="space-y-2">
                                            {healthEvents.map((event) => {
                                                const StatusIcon = getStatusIcon(event.status);
                                                return (
                                                    <div key={event.id} className="flex items-center justify-between p-3 border rounded">
                                                        <div className="flex items-center gap-3">
                                                            <StatusIcon className={`h-4 w-4 ${getStatusColor(event.status)}`} />
                                                            <div>
                                                                <p className="text-sm font-medium capitalize">{event.status}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {new Date(event.timestamp).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No health events recorded</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">Integration not found</div>
                    )}
                </div>
            ),
        }
    ];

    return (
        <WorkPane
            title={integration?.name || "Integration Details"}
            subtitle="View integration status and health history"
            tabs={tabs}
        />
    );
}
