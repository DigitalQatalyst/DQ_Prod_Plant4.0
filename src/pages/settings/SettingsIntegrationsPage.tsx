/** SettingsIntegrationsPage - Organization management */
/** SettingsIntegrationsPage - External system connections */
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getDataProvider } from "@/lib/data";
import { Plug, Plus, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { IntegrationInstance } from "@/types/settings";

export function SettingsIntegrationsPage() {
    const { currentTenant } = useApp();
    const { toast } = useToast();
    const [integrations, setIntegrations] = useState<IntegrationInstance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadIntegrations = async () => {
            try {
                setLoading(true);
                const provider = getDataProvider();
                const data = await provider.getIntegrations?.(currentTenant.id);
                setIntegrations(data || []);
            } catch (err) {
                console.error("Failed to load integrations", err);
            } finally {
                setLoading(false);
            }
        };

        loadIntegrations();
    }, [currentTenant.id]);

    const tabs = [
        {
            id: "catalog",
            label: "Connected Systems",
            content: (
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">Integration Catalog</h3>
                            <p className="text-sm text-muted-foreground">Manage external system connections and data synchronization.</p>
                        </div>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Add Integration
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">Loading integrations...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {integrations.map((integration) => (
                                <Card key={integration.id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Plug className="h-5 w-5 text-primary" />
                                            </div>
                                            <Badge variant={integration.status === 'active' ? 'outline' : 'secondary'}
                                                className={integration.status === 'active' ? 'bg-success/10 text-success border-success/20' : ''}>
                                                {integration.status}
                                            </Badge>
                                        </div>
                                        <CardTitle className="mt-4">{integration.name}</CardTitle>
                                        <CardDescription>{integration.typeCode}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Activity className="h-4 w-4" />
                                                <span>Last sync: {integration.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleString() : 'Never'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {integration.status === 'active' ? (
                                                    <CheckCircle2 className="h-4 w-4 text-success" />
                                                ) : (
                                                    <AlertTriangle className="h-4 w-4 text-warning" />
                                                )}
                                                <span className="text-xs font-medium">System connection {integration.status === 'active' ? 'healthy' : 'pending'}</span>
                                            </div>
                                            <Button variant="outline" size="sm" className="w-full">Configure</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            ),
        }
    ];

    return (
        <WorkPane
            title="External Integrations"
            subtitle="Connect and manage external data sources and systems"
            tabs={tabs}
        />
    );
}
