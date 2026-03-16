/** SettingsTeamsPage - Organization management */
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getDataProvider } from "@/lib/data";
import { Users, UserPlus, Shield, Settings2 } from "lucide-react";
import type { Team } from "@/types/settings";

export function SettingsTeamsPage() {
    const { currentTenant } = useApp();
    const { toast } = useToast();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTeams = async () => {
            try {
                setLoading(true);
                const provider = getDataProvider();
                const data = await provider.getTeams?.(currentTenant.id);
                setTeams(data || []);
            } catch (err) {
                console.error("Failed to load teams", err);
            } finally {
                setLoading(false);
            }
        };

        loadTeams();
    }, [currentTenant.id]);

    const tabs = [
        {
            id: "overview",
            label: "Teams Overview",
            content: (
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">Organization Teams</h3>
                            <p className="text-sm text-muted-foreground">Manage your organization's functional teams and their memberships.</p>
                        </div>
                        <Button className="gap-2">
                            <UserPlus className="h-4 w-4" /> Create Team
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">Loading teams...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {teams.map((team) => (
                                <Card key={team.id}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-5 w-5 text-primary" />
                                            {team.name}
                                        </CardTitle>
                                        <CardDescription>{team.onCallLabel || "Functional Team"}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Shield className="h-4 w-4" />
                                            <span>Team permissions and memberships managed in Security area.</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {teams.length === 0 && (
                                <div className="col-span-full text-center py-12 border rounded-lg border-dashed">
                                    <p className="text-muted-foreground">No teams found for this organization.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ),
        }
    ];

    return (
        <WorkPane
            title="Teams & Memberships"
            subtitle="Manage functional teams and organizational structure"
            tabs={tabs}
        />
    );
}
