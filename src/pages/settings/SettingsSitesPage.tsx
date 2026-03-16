import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getDataProvider } from "@/lib/data";
import { MapPin, Plus, Building2, MapPinned } from "lucide-react";
import type { Site } from "@/types/assets";

export function SettingsSitesPage() {
    const { currentTenant } = useApp();
    const { toast } = useToast();
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSites = async () => {
            try {
                setLoading(true);
                const provider = getDataProvider();
                const data = await provider.getSites(currentTenant.id);
                setSites(data || []);
            } catch (err) {
                console.error("Failed to load sites", err);
            } finally {
                setLoading(false);
            }
        };

        loadSites();
    }, [currentTenant.id]);

    const tabs = [
        {
            id: "sites",
            label: "All Sites",
            content: (
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">Organization Sites</h3>
                            <p className="text-sm text-muted-foreground">Manage physical and logical sites across your organization.</p>
                        </div>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Add Site
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">Loading sites...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sites.map((site) => (
                                <Card key={site.id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Building2 className="h-5 w-5 text-primary" />
                                            </div>
                                            <Badge variant="outline">{site.type || "Site"}</Badge>
                                        </div>
                                        <CardTitle className="mt-4">{site.name}</CardTitle>
                                        <CardDescription>{site.code}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPin className="h-4 w-4" />
                                                <span>{site.location || "Location not set"}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPinned className="h-4 w-4" />
                                                <span>Lat: {site.latitude?.toFixed(4) || "N/A"}, Lng: {site.longitude?.toFixed(4) || "N/A"}</span>
                                            </div>
                                            <Button variant="outline" size="sm" className="w-full">View Details</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {sites.length === 0 && (
                                <div className="col-span-full text-center py-12 border rounded-lg border-dashed">
                                    <p className="text-muted-foreground">No sites found for this organization.</p>
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
            title="Sites Management"
            subtitle="Configure and manage organizational sites"
            tabs={tabs}
        />
    );
}
