/** SettingsUserPreferencesPage - Organization management */
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getDataProvider } from "@/lib/data";
import { Settings, Bell, Palette, Globe, Save } from "lucide-react";
import type { UserPreference } from "@/types/settings";

export function SettingsUserPreferencesPage() {
    const { currentTenant } = useApp();
    const { toast } = useToast();
    const [prefs, setPrefs] = useState<UserPreference | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadPrefs = async () => {
            try {
                setLoading(true);
                const provider = getDataProvider();
                // In a real app, we'd use current user's ID
                const data = await provider.getUserPreferences?.("current-user-id", currentTenant.id);
                setPrefs(data || { userId: "current-user-id", tenantId: currentTenant.id, defaults: {} });
            } catch (err) {
                console.error("Failed to load preferences", err);
            } finally {
                setLoading(false);
            }
        };

        loadPrefs();
    }, [currentTenant.id]);

    const handleSave = async () => {
        try {
            setSaving(true);
            const provider = getDataProvider();
            if (prefs) {
                await provider.updateUserPreferences?.(prefs.userId, currentTenant.id, prefs);
            }
            toast({
                title: "Preferences Saved",
                description: "Your settings have been updated successfully.",
            });
        } catch (err) {
            toast({
                title: "Save Failed",
                description: "Failed to save your preferences.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        {
            id: "general",
            label: "General Settings",
            content: (
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">Personal Preferences</h3>
                            <p className="text-sm text-muted-foreground">Configure your display preferences, language, and regional settings.</p>
                        </div>
                        <Button onClick={handleSave} disabled={saving} className="gap-2">
                            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Preferences"}
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">Loading preferences...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Palette className="h-4 w-4 text-primary" /> Appearance
                                    </CardTitle>
                                    <CardDescription>Manage your visual theme and display options.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground italic">Theme settings are managed by the platform-wide theme provider.</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Bell className="h-4 w-4 text-primary" /> Notifications
                                    </CardTitle>
                                    <CardDescription>Configure how you receive platform alerts.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground italic">Advanced notification rules can be configured in the Security area.</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-primary" /> Regional
                                    </CardTitle>
                                    <CardDescription>Set your language and time zone preferences.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">Currently defaulting to organization settings.</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Settings className="h-4 w-4 text-primary" /> Workspace
                                    </CardTitle>
                                    <CardDescription>Customize your dashboard and work pane layout.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">Layout persistence effectively managed.</p>
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
            subtitle="Manage your personal workspace settings"
            tabs={tabs}
        />
    );
}
