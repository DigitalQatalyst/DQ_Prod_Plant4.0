import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getDataProvider } from "@/lib/data";
import { Users, User, UserPlus, Shield } from "lucide-react";
import type { UserProfile, Team } from "@/types/settings";

export function SettingsUsersTeamsPage() {
    const { currentTenant } = useApp();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const provider = getDataProvider();
                const [usersData, teamsData] = await Promise.all([
                    provider.getUserProfiles?.(currentTenant.id),
                    provider.getTeams?.(currentTenant.id)
                ]);
                setUsers(usersData || []);
                setTeams(teamsData || []);
            } catch (err) {
                console.error("Failed to load users/teams", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [currentTenant.id]);

    const tabs = [
        {
            id: "users",
            label: "Users",
            content: (
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">User Directory</h3>
                            <p className="text-sm text-muted-foreground">View and manage organizational users</p>
                        </div>
                        <Button className="gap-2">
                            <UserPlus className="h-4 w-4" /> Add User
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">Loading users...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {users.map((user) => (
                                <Card key={user.userId} className="cursor-pointer hover:border-primary"
                                    onClick={() => navigate(`/settings/users/${user.userId}`)}>
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{user.displayName}</p>
                                            <p className="text-sm text-muted-foreground">{user.personaLabel || "User"}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {users.length === 0 && (
                                <div className="col-span-full text-center py-12 border rounded-lg border-dashed">
                                    <p className="text-muted-foreground">No users found</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ),
        },
        {
            id: "teams",
            label: "Teams",
            content: (
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">Team Management</h3>
                            <p className="text-sm text-muted-foreground">Manage organizational teams and memberships</p>
                        </div>
                        <Button className="gap-2">
                            <UserPlus className="h-4 w-4" /> Create Team
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">Loading teams...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {teams.map((team) => (
                                <Card key={team.id}>
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Users className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{team.name}</p>
                                            <p className="text-sm text-muted-foreground">{team.onCallLabel || "Team"}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {teams.length === 0 && (
                                <div className="col-span-full text-center py-12 border rounded-lg border-dashed">
                                    <p className="text-muted-foreground">No teams found</p>
                                </div>
                            )}
                        </div>
                    )}

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Shield className="h-4 w-4" />
                                <span>Team permissions and role assignments are managed in the Security feature area.</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ),
        }
    ];

    return (
        <WorkPane
            title="Users & Teams"
            subtitle="Manage organizational users and team structure"
            tabs={tabs}
        />
    );
}
