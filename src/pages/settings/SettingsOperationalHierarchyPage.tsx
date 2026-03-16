import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getDataProvider } from "@/lib/data";
import { Network, Plus, ChevronRight, Folder } from "lucide-react";
import type { SiteHierarchyNode } from "@/types/settings";

export function SettingsOperationalHierarchyPage() {
    const { currentTenant } = useApp();
    const { toast } = useToast();
    const [nodes, setNodes] = useState<SiteHierarchyNode[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHierarchy = async () => {
            try {
                setLoading(true);
                const provider = getDataProvider();
                const data = await provider.getHierarchyNodes?.(currentTenant.id);
                setNodes(data || []);
            } catch (err) {
                console.error("Failed to load hierarchy", err);
            } finally {
                setLoading(false);
            }
        };

        loadHierarchy();
    }, [currentTenant.id]);

    const renderHierarchyNode = (node: SiteHierarchyNode, level: number = 0) => (
        <div key={node.id} className="space-y-1">
            <div
                className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-md cursor-pointer"
                style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
            >
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <Folder className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{node.name}</span>
                <span className="text-xs text-muted-foreground">({node.nodeType})</span>
            </div>
        </div>
    );

    const tabs = [
        {
            id: "hierarchy",
            label: "Hierarchy Tree",
            content: (
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">Operational Hierarchy</h3>
                            <p className="text-sm text-muted-foreground">Define organizational structure and asset grouping within sites.</p>
                        </div>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Add Node
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">Loading hierarchy...</div>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Network className="h-5 w-5 text-primary" />
                                    Site Hierarchy Structure
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {nodes.length > 0 ? (
                                    <div className="space-y-1">
                                        {nodes
                                            .filter(n => !n.parentId)
                                            .map(node => renderHierarchyNode(node, 0))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 border rounded-lg border-dashed">
                                        <p className="text-muted-foreground">No hierarchy nodes defined yet.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            ),
        }
    ];

    return (
        <WorkPane
            title="Operational Hierarchy"
            subtitle="Define and manage site hierarchy structure"
            tabs={tabs}
        />
    );
}
