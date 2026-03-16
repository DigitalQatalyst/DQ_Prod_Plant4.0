import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getDataProvider } from "@/lib/data";
import { User, Mail, Save, Shield } from "lucide-react";
import type { UserProfile } from "@/types/settings";

export function SettingsMyProfilePage() {
    const { currentTenant } = useApp();
    const { toast } = useToast();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                const provider = getDataProvider();
                // In a real app, we'd get the current user's ID from auth context
                const data = await provider.getUserProfile?.("current-user-id");
                setProfile(data || null);
            } catch (err) {
                console.error("Failed to load profile", err);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [currentTenant.id]);

    const handleSave = async () => {
        try {
            setSaving(true);
            const provider = getDataProvider();
            if (profile) {
                await provider.updateUserProfile?.(profile.userId, {
                    displayName: profile.displayName,
                    personaLabel: profile.personaLabel,
                    preferences: profile.preferences
                });
            }
            toast({
                title: "Profile Saved",
                description: "Your profile has been updated successfully.",
            });
        } catch (err) {
            toast({
                title: "Save Failed",
                description: "Failed to update your profile.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        {
            id: "profile",
            label: "My Profile",
            content: (
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">Personal Profile</h3>
                            <p className="text-sm text-muted-foreground">Manage your display name and profile information.</p>
                        </div>
                        <Button onClick={handleSave} disabled={saving} className="gap-2">
                            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">Loading profile...</div>
                    ) : profile ? (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <User className="h-5 w-5 text-primary" />
                                        Basic Information
                                    </CardTitle>
                                    <CardDescription>Your personal details visible to team members</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="displayName">Display Name</Label>
                                        <Input
                                            id="displayName"
                                            value={profile.displayName}
                                            onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="personaLabel">Role/Persona</Label>
                                        <Input
                                            id="personaLabel"
                                            value={profile.personaLabel || ""}
                                            onChange={(e) => setProfile({ ...profile, personaLabel: e.target.value })}
                                            placeholder="e.g., Operations Manager, Engineer"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="userId">User ID (Read-only)</Label>
                                        <Input
                                            id="userId"
                                            value={profile.userId}
                                            disabled
                                            className="font-mono text-sm"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-primary" />
                                        Account Security
                                    </CardTitle>
                                    <CardDescription>Manage authentication and security settings</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Authentication and security settings are managed through your organization's identity provider.
                                    </p>
                                    <Button variant="outline" size="sm">
                                        View Security Settings
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">Profile not found</div>
                    )}
                </div>
            ),
        }
    ];

    return (
        <WorkPane
            title="My Profile"
            subtitle="Manage your personal profile and account settings"
            tabs={tabs}
        />
    );
}
