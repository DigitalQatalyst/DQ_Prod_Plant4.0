/** SettingsUserProfilesPage - Organization management */
/** SettingsUserProfilesPage - User directory and persona management */
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getDataProvider } from "@/lib/data";
import { User, Mail, Shield, UserCog } from "lucide-react";
import type { UserProfile } from "@/types/settings";

export function SettingsUserProfilesPage() {
    const { currentTenant } = useApp();
    const { toast } = useToast();
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfiles = async () => {
            try {
                setLoading(true);
                const provider = getDataProvider();
                const data = await provider.getUserProfiles?.(currentTenant.id);
                setProfiles(data || []);
            } catch (err) {
                console.error("Failed to load user profiles", err);
            } finally {
                setLoading(false);
            }
        };

        loadProfiles();
    }, [currentTenant.id]);

    const tabs = [
        {
            id: "all",
            label: "All Users",
            content: (
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">User Profiles</h3>
                            <p className="text-sm text-muted-foreground">Manage user display names, personas, and tenant-specific settings.</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">Loading profiles...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {profiles.map((profile) => (
                                <Card key={profile.userId}>
                                    <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{profile.displayName}</CardTitle>
                                            <CardDescription>{profile.personaLabel || "Contributor"}</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Mail className="h-4 w-4" />
                                                <span>{profile.userId.substring(0, 8)}...</span>
                                            </div>
                                            <Button variant="outline" size="sm" className="w-full gap-2">
                                                <UserCog className="h-3 w-3" /> Edit Profile
                                            </Button>
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
            title="User Profiles"
            subtitle="Manage organizational users and their profiles"
            tabs={tabs}
        />
    );
}
