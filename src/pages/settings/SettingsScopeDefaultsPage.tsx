import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getDataProvider } from "@/lib/data";
import { Settings2, User, Users, Shield, Save } from "lucide-react";
import type { ScopeDefault } from "@/types/settings";

export function SettingsScopeDefaultsPage() {
    const { currentTenant } = useApp();
    const { toast } = useToast();
    const [defaults, setDefaults] = useState<ScopeDefault[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDefaults = async () => {
            try {
                setLoading(true);
                const provider = getDataProvider();
                const data = await provider.getScopeDefaults?.(currentTenant.id);
                setDefaults(data || []);
            } catch (err) {
                console.error("Failed to load scope defaults", err);
            } finally {
                setLoading(false);
            }
        };

        loadDefaults();
    }, [currentTenant.id]);

    const getPrincipalIcon = (type: string) => {
        switch (type) {
            case 'user': return User;
            case 'team': return Users;
            case 'role': return Shield;
            default: return Settings2;
        }
    };

    const tabs = [
        {
            id: "defaults",
            label: "Scope Defaults",
            content: (
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">Scope Defaults Configuration</h3>
                            <p className="text-sm text-muted-foreground">Define default sites, streams, and dashboards per role, team, or user.</p>
                        </div>
                        <Button className="gap-2">
                            <Save className="h-4 w-4" /> Save Changes
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">Loading scope defaults...</div>
                    ) : (
                        <div className="space-y-4">
                            {defaults.map((scopeDefault) => {
                                const Icon = getPrincipalIcon(scopeDefault.principalType);
                                return (
                                    <Card key={scopeDefault.id}>
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Icon className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base">{scopeDefault.principalId}</CardTitle>
                                                    <CardDescription className="capitalize">{scopeDefault.principalType}</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-medium text-muted-foreground">Default Sites</Label>
                                                    <p className="text-sm">{scopeDefault.defaultSiteIds?.length || 0} sites selected</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-medium text-muted-foreground">Default Stream</Label>
                                                    <p className="text-sm">{scopeDefault.defaultStreamId || "Not set"}</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-medium text-muted-foreground">Default Dashboard</Label>
                                                    <p className="text-sm">{scopeDefault.defaultDashboardId || "Not set"}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                            {defaults.length === 0 && (
                                <div className="text-center py-12 border rounded-lg border-dashed">
                                    <p className="text-muted-foreground">No scope defaults configured yet.</p>
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
            title="Scope Defaults"
            subtitle="Configure default scopes for users, teams, and roles"
            tabs={tabs}
        />
    );
}
