import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getDataProvider } from "@/lib/data";
import { Settings, Save, MapPin, LayoutDashboard, Filter } from "lucide-react";
import type { UserPreference } from "@/types/settings";

export function SettingsMyPreferencesPage() {
    const { currentTenant } = useApp();
    const { toast } = useToast();
    const [preferences, setPreferences] = useState<UserPreference | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadPreferences = async () => {
            try {
                setLoading(true);
                const provider = getDataProvider();
                const data = await provider.getUserPreferences?.("current-user-id");
                setPreferences(data || {
                    userId: "current-user-id",
                    tenantId: currentTenant.id,
                    defaults: {}
                });
            } catch (err) {
                console.error("Failed to load preferences", err);
            } finally {
                setLoading(false);
            }
        };

        loadPreferences();
    }, [currentTenant.id]);

    const handleSave = async () => {
        try {
            setSaving(true);
            const provider = getDataProvider();
            if (preferences) {
                await provider.updateUserPreferences?.(preferences.userId, preferences);
            }
            toast({
                title: "Preferences Saved",
                description: "Your workspace preferences have been updated.",
            });
        } catch (err) {
            toast({
                title: "Save Failed",
                description: "Failed to update preferences.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        {
            id: "defaults",
            label: "Default Scopes",
            content: (
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">Workspace Defaults</h3>
                            <p className="text-sm text-muted-foreground">Configure your default site, stream, and dashboard preferences.</p>
                        </div>
                        <Button onClick={handleSave} disabled={saving} className="gap-2">
                            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Preferences"}
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">Loading preferences...</div>
                    ) : (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        Default Site Selection
                                    </CardTitle>
                                    <CardDescription>Choose which site is selected by default when you log in</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="defaultSite">Default Site</Label>
                                        <Select>
                                            <SelectTrigger id="defaultSite">
                                                <SelectValue placeholder="Select a site..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Sites</SelectItem>
                                                <SelectItem value="site1">Site 1</SelectItem>
                                                <SelectItem value="site2">Site 2</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Filter className="h-5 w-5 text-primary" />
                                        Default Stream
                                    </CardTitle>
                                    <CardDescription>Set your preferred data stream for filtering</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="defaultStream">Default Stream</Label>
                                        <Select>
                                            <SelectTrigger id="defaultStream">
                                                <SelectValue placeholder="Select a stream..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="main">Main Production</SelectItem>
                                                <SelectItem value="test">Test Environment</SelectItem>
                                                <SelectItem value="dev">Development</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <LayoutDashboard className="h-5 w-5 text-primary" />
                                        Default Dashboard
                                    </CardTitle>
                                    <CardDescription>Choose which dashboard loads when you access Overview</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="defaultDashboard">Default Dashboard</Label>
                                        <Select>
                                            <SelectTrigger id="defaultDashboard">
                                                <SelectValue placeholder="Select a dashboard..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="command">Command Center</SelectItem>
                                                <SelectItem value="operations">Operations Overview</SelectItem>
                                                <SelectItem value="custom">My Custom Dashboard</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            ),
        }
    ];

    return (
        <WorkPane
            title="My Preferences"
            subtitle="Configure your default workspace settings"
            tabs={tabs}
        />
    );
}
