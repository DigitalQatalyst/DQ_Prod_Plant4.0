/** SettingsModuleTogglesPage - Organization management */
/** SettingsModuleTogglesPage - Feature area accessibility toggles */
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getDataProvider } from "@/lib/data";
import { Box, Lock, Settings2, Sparkles } from "lucide-react";
import type { ModuleToggle } from "@/types/settings";

export function SettingsModuleTogglesPage() {
    const { currentTenant } = useApp();
    const { toast } = useToast();
    const [toggles, setToggles] = useState<ModuleToggle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadToggles = async () => {
            try {
                setLoading(true);
                const provider = getDataProvider();
                const data = await provider.getModuleToggles?.(currentTenant.id);
                setToggles(data || []);
            } catch (err) {
                console.error("Failed to load module toggles", err);
            } finally {
                setLoading(false);
            }
        };

        loadToggles();
    }, [currentTenant.id]);

    const handleToggle = async (id: string, enabled: boolean) => {
        try {
            const provider = getDataProvider();
            await provider.updateModuleToggle?.(id, enabled);
            setToggles(prev => prev.map(t => t.id === id ? { ...t, enabled } : t));
            toast({
                title: "Module Updated",
                description: "Feature accessibility has been updated successfully.",
            });
        } catch (err) {
            toast({
                title: "Update Failed",
                description: "Failed to update module accessibility.",
                variant: "destructive",
            });
        }
    };

    const tabs = [
        {
            id: "modules",
            label: "Feature Toggles",
            content: (
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-medium">Platform Modules</h3>
                        <p className="text-sm text-muted-foreground">Enable or disable specific platform modules and features for this organization.</p>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">Loading modules...</div>
                    ) : (
                        <div className="space-y-4">
                            {toggles.map((toggle) => (
                                <Card key={toggle.id}>
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Box className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <Label htmlFor={`toggle-${toggle.id}`} className="text-base font-semibold cursor-pointer">
                                                    {toggle.featureArea}
                                                </Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Stream: {toggle.streamId || 'Global'} • State: {toggle.readinessState || 'Stable'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {toggle.readinessState === 'restricted' && (
                                                <Lock className="h-4 w-4 text-muted-foreground" />
                                            )}
                                            <Switch
                                                id={`toggle-${toggle.id}`}
                                                checked={toggle.enabled}
                                                onCheckedChange={(checked) => handleToggle(toggle.id, checked)}
                                            />
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
            title="Module Access"
            subtitle="Configure platform feature availability and readiness"
            tabs={tabs}
        />
    );
}
