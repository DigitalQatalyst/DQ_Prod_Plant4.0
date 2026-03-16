import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getDataProvider } from "@/lib/data";
import { Settings, Save, ArrowLeft, MapPin } from "lucide-react";
import type { IntegrationInstance, IntegrationMapping } from "@/types/settings";

export function SettingsIntegrationConfigPage() {
    const { integrationId } = useParams<{ integrationId: string }>();
    const navigate = useNavigate();
    const { currentTenant } = useApp();
    const { toast } = useToast();
    const [integration, setIntegration] = useState<IntegrationInstance | null>(null);
    const [mappings, setMappings] = useState<IntegrationMapping[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!integrationId) return;

            try {
                setLoading(true);
                const provider = getDataProvider();
                const integrationData = await provider.getIntegration?.(integrationId);
                const mappingData = await provider.getIntegrationMappings?.(integrationId);
                setIntegration(integrationData || null);
                setMappings(mappingData || []);
            } catch (err) {
                console.error("Failed to load integration config", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [integrationId]);

    const handleSave = async () => {
        try {
            setSaving(true);
            const provider = getDataProvider();
            if (integration) {
                await provider.updateIntegration?.(integration.id, {
                    name: integration.name,
                    status: integration.status,
                    config: integration.config
                });
            }
            toast({
                title: "Configuration Saved",
                description: "Integration configuration has been updated successfully.",
            });
        } catch (err) {
            toast({
                title: "Save Failed",
                description: "Failed to update integration configuration.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        {
            id: "config",
            label: "Configuration",
            content: (
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
                            <ArrowLeft className="h-4 w-4" /> Back
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="gap-2">
                            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Configuration"}
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">Loading configuration...</div>
                    ) : integration ? (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Settings className="h-5 w-5 text-primary" />
                                        Basic Settings
                                    </CardTitle>
                                    <CardDescription>Configure integration connection and behavior</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Integration Name</Label>
                                            <Input
                                                id="name"
                                                value={integration.name}
                                                onChange={(e) => setIntegration({ ...integration, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="type">Type</Label>
                                            <Input
                                                id="type"
                                                value={integration.typeCode}
                                                disabled
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="config">Configuration (JSON)</Label>
                                        <Textarea
                                            id="config"
                                            value={JSON.stringify(integration.config || {}, null, 2)}
                                            onChange={(e) => {
                                                try {
                                                    const config = JSON.parse(e.target.value);
                                                    setIntegration({ ...integration, config });
                                                } catch (err) {
                                                    // Invalid JSON, don't update
                                                }
                                            }}
                                            className="font-mono text-xs"
                                            rows={10}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        Site & Stream Mappings
                                    </CardTitle>
                                    <CardDescription>Configure how this integration maps to sites and streams</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {mappings.length > 0 ? (
                                        <div className="space-y-2">
                                            {mappings.map((mapping) => (
                                                <div key={mapping.id} className="p-3 border rounded">
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <div>
                                                            <span className="text-muted-foreground">Site:</span> {mapping.siteId}
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Stream:</span> {mapping.streamId}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No mappings configured</p>
                                    )}
                                    <Button variant="outline" size="sm" className="mt-4">Add Mapping</Button>
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
            title={`Configure ${integration?.name || "Integration"}`}
            subtitle="Edit integration configuration and mappings"
            tabs={tabs}
        />
    );
}
