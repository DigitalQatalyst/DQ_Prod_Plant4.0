import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getDataProvider } from "@/lib/data";
import { Bell, Save, Mail, Smartphone, Clock } from "lucide-react";
import type { NotificationPreference } from "@/types/settings";

export function SettingsMyNotificationsPage() {
    const { currentTenant } = useApp();
    const { toast } = useToast();
    const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadPreferences = async () => {
            try {
                setLoading(true);
                const provider = getDataProvider();
                const data = await provider.getNotificationPreferences?.("current-user-id");
                setPreferences(data || {
                    userId: "current-user-id",
                    tenantId: currentTenant.id,
                    channels: {},
                    digestFrequency: "daily",
                    quietHours: {}
                });
            } catch (err) {
                console.error("Failed to load notification preferences", err);
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
                await provider.updateNotificationPreferences?.(preferences.userId, preferences);
            }
            toast({
                title: "Preferences Saved",
                description: "Your notification settings have been updated.",
            });
        } catch (err) {
            toast({
                title: "Save Failed",
                description: "Failed to update notification preferences.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        {
            id: "notifications",
            label: "Notification Settings",
            content: (
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">Notification Preferences</h3>
                            <p className="text-sm text-muted-foreground">Control how and when you receive notifications.</p>
                        </div>
                        <Button onClick={handleSave} disabled={saving} className="gap-2">
                            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Settings"}
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">Loading notification preferences...</div>
                    ) : (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Bell className="h-5 w-5 text-primary" />
                                        Notification Channels
                                    </CardTitle>
                                    <CardDescription>Choose how you want to receive notifications</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <Label htmlFor="email" className="cursor-pointer">Email Notifications</Label>
                                                <p className="text-xs text-muted-foreground">Receive notifications via email</p>
                                            </div>
                                        </div>
                                        <Switch id="email" defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <Label htmlFor="push" className="cursor-pointer">Push Notifications</Label>
                                                <p className="text-xs text-muted-foreground">Receive browser push notifications</p>
                                            </div>
                                        </div>
                                        <Switch id="push" defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Bell className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <Label htmlFor="inapp" className="cursor-pointer">In-App Notifications</Label>
                                                <p className="text-xs text-muted-foreground">Show notifications within the app</p>
                                            </div>
                                        </div>
                                        <Switch id="inapp" defaultChecked />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-primary" />
                                        Digest & Scheduling
                                    </CardTitle>
                                    <CardDescription>Configure notification frequency and quiet hours</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="frequency">Digest Frequency</Label>
                                        <Select defaultValue={preferences?.digestFrequency || "daily"}>
                                            <SelectTrigger id="frequency">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="realtime">Real-time</SelectItem>
                                                <SelectItem value="hourly">Hourly</SelectItem>
                                                <SelectItem value="daily">Daily Digest</SelectItem>
                                                <SelectItem value="weekly">Weekly Digest</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="quietStart">Quiet Hours Start</Label>
                                        <Select defaultValue="20:00">
                                            <SelectTrigger id="quietStart">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="18:00">18:00 (6 PM)</SelectItem>
                                                <SelectItem value="20:00">20:00 (8 PM)</SelectItem>
                                                <SelectItem value="22:00">22:00 (10 PM)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="quietEnd">Quiet Hours End</Label>
                                        <Select defaultValue="08:00">
                                            <SelectTrigger id="quietEnd">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="06:00">06:00 (6 AM)</SelectItem>
                                                <SelectItem value="08:00">08:00 (8 AM)</SelectItem>
                                                <SelectItem value="10:00">10:00 (10 AM)</SelectItem>
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
            title="Notification Preferences"
            subtitle="Manage how you receive alerts and updates"
            tabs={tabs}
        />
    );
}
