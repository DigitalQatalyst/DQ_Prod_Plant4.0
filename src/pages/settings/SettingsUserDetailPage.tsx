import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getDataProvider } from "@/lib/data";
import { User, Mail, Shield, Users, ArrowLeft, Settings } from "lucide-react";
import type { UserProfile, TeamMembership } from "@/types/settings";

export function SettingsUserDetailPage() {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { currentTenant } = useApp();
    const { toast } = useToast();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [memberships, setMemberships] = useState<TeamMembership[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUserData = async () => {
            if (!userId) return;

            try {
                setLoading(true);
                const provider = getDataProvider();
                const profileData = await provider.getUserProfile?.(userId);
                setProfile(profileData || null);
                // Note: We'd need a method to get user's team memberships
                // const membershipData = await provider.getUserTeamMemberships?.(userId);
                // setMemberships(membershipData || []);
            } catch (err) {
                console.error("Failed to load user data", err);
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, [userId]);

    const tabs = [
        {
            id: "profile",
            label: "Profile",
            content: (
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
                            <ArrowLeft className="h-4 w-4" /> Back
                        </Button>
                        <Button variant="outline" className="gap-2">
                            <Settings className="h-4 w-4" /> Edit Profile
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">Loading user profile...</div>
                    ) : profile ? (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-8 w-8 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle>{profile.displayName}</CardTitle>
                                            <CardDescription>{profile.personaLabel || "User"}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground">User ID</p>
                                            <p className="text-sm font-mono mt-1">{profile.userId}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground">Created</p>
                                            <p className="text-sm mt-1">{new Date(profile.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Users className="h-5 w-5 text-primary" />
                                        Team Memberships
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {memberships.length > 0 ? (
                                        <div className="space-y-2">
                                            {memberships.map((membership) => (
                                                <div key={membership.teamId} className="flex items-center justify-between p-2 border rounded">
                                                    <span className="text-sm">{membership.teamId}</span>
                                                    <Badge variant="outline">{membership.role}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No team memberships</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-primary" />
                                        Permissions & Roles
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        User permissions and role assignments are managed in the Security feature area.
                                    </p>
                                    <Button variant="outline" size="sm">
                                        Manage in Security
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">User not found</div>
                    )}
                </div>
            ),
        }
    ];

    return (
        <WorkPane
            title={profile?.displayName || "User Details"}
            subtitle="View and manage user profile information"
            tabs={tabs}
        />
    );
}
