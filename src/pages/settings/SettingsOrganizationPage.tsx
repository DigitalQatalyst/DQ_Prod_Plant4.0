import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDataProvider } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import type { OrganizationProfile } from "@/types/settings";
import { Building, Globe, Clock, Coins, Save, RotateCcw } from "lucide-react";

/**
 * SettingsOrganizationPage
 * Tenant profile view/edit functionality
 * 
 * Requirements: Task 8.1
 */
export function SettingsOrganizationPage() {
    const { currentTenant } = useApp();
    const { toast } = useToast();
    const [profile, setProfile] = useState<OrganizationProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState<Partial<OrganizationProfile>>({});

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                setError(null);
                const provider = getDataProvider();
                const data = await provider.getTenantProfile(currentTenant.id);
                setProfile(data);
                if (data) {
                    setFormData(data);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load tenant profile");
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
            const updated = await provider.updateTenantProfile(currentTenant.id, formData);
            setProfile(updated);
            setEditMode(false);
            toast({
                title: "Profile Updated",
                description: "Organization profile has been successfully updated.",
            });
        } catch (err) {
            toast({
                title: "Save Failed",
                description: err instanceof Error ? err.message : "Failed to save profile",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (profile) {
            setFormData(profile);
        }
        setEditMode(false);
    };

    const tabs = [
        {
            id: "overview",
            label: "Overview",
            content: (
                <div className="p-6 space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-muted-foreground">Loading profile...</div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-destructive">Error: {error}</div>
                        </div>
                    ) : profile ? (
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="flex items-center gap-2">
                                                <Building className="h-5 w-5 text-primary" />
                                                Organization Details
                                            </CardTitle>
                                            <CardDescription>Basic identification and branding</CardDescription>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                                            Edit Profile
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-3 items-center">
                                        <div className="text-sm font-medium text-muted-foreground">Tenant ID</div>
                                        <div className="col-span-2 font-mono text-sm">{profile.tenantId}</div>
                                    </div>
                                    <div className="grid grid-cols-3 items-center">
                                        <div className="text-sm font-medium text-muted-foreground">Region</div>
                                        <div className="col-span-2 text-sm">{profile.region || "Not specified"}</div>
                                    </div>
                                    <div className="grid grid-cols-3 items-center">
                                        <div className="text-sm font-medium text-muted-foreground">Logo URL</div>
                                        <div className="col-span-2 text-sm truncate">{profile.logoUrl || "No logo uploaded"}</div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Globe className="h-5 w-5 text-primary" />
                                        Regional Settings
                                    </CardTitle>
                                    <CardDescription>Language, timezone, and currency defaults</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-3 items-center">
                                        <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Clock className="h-4 w-4" /> Timezone
                                        </div>
                                        <div className="col-span-2 text-sm">{profile.timezone}</div>
                                    </div>
                                    <div className="grid grid-cols-3 items-center">
                                        <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Coins className="h-4 w-4" /> Currency
                                        </div>
                                        <div className="col-span-2 text-sm">{profile.currencyCode}</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : null}
                </div>
            ),
        },
        {
            id: "edit",
            label: "Edit Profile",
            disabled: loading,
            content: (
                <div className="p-6">
                    <Card className="max-w-2xl">
                        <CardHeader>
                            <CardTitle>Edit Organization Profile</CardTitle>
                            <CardDescription>Update your organization's global settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="region">Region</Label>
                                    <Input 
                                        id="region" 
                                        value={formData.region || ""} 
                                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                        placeholder="e.g. North America"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="timezone">Timezone</Label>
                                    <Select 
                                        value={formData.timezone} 
                                        onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                                    >
                                        <SelectTrigger id="timezone">
                                            <SelectValue placeholder="Select timezone" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="UTC">UTC</SelectItem>
                                            <SelectItem value="America/New_York">America/New_York</SelectItem>
                                            <SelectItem value="Europe/London">Europe/London</SelectItem>
                                            <SelectItem value="Asia/Dubai">Asia/Dubai</SelectItem>
                                            <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="currency">Currency Code</Label>
                                    <Input 
                                        id="currency" 
                                        value={formData.currencyCode || ""} 
                                        onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })}
                                        placeholder="e.g. USD, EUR, AED"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="logo">Logo URL</Label>
                                    <Input 
                                        id="logo" 
                                        value={formData.logoUrl || ""} 
                                        onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                                        placeholder="https://example.com/logo.png"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button onClick={handleSave} disabled={saving} className="gap-2">
                                    {saving ? "Saving..." : <><Save className="h-4 w-4" /> Save Changes</>}
                                </Button>
                                <Button variant="ghost" onClick={handleCancel} disabled={saving} className="gap-2">
                                    <RotateCcw className="h-4 w-4" /> Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ),
        }
    ];

    return (
        <WorkPane
            title="Organization Profile"
            subtitle="Manage your organization's identity and global configuration"
            tabs={tabs}
            activeTab={editMode ? "edit" : "overview"}
            onTabChange={(tabId) => setEditMode(tabId === "edit")}
        />
    );
}
