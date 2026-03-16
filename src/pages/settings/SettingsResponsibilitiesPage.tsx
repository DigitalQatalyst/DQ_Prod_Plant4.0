import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getDataProvider } from "@/lib/data";
import { Tag, Plus, Save, X } from "lucide-react";
import type { ResponsibilityLabel } from "@/types/settings";

export function SettingsResponsibilitiesPage() {
    const { currentTenant } = useApp();
    const { toast } = useToast();
    const [labels, setLabels] = useState<ResponsibilityLabel[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newLabel, setNewLabel] = useState({ code: "", name: "" });

    useEffect(() => {
        const loadLabels = async () => {
            try {
                setLoading(true);
                const provider = getDataProvider();
                const data = await provider.getResponsibilityLabels?.(currentTenant.id);
                setLabels(data || []);
            } catch (err) {
                console.error("Failed to load responsibility labels", err);
            } finally {
                setLoading(false);
            }
        };

        loadLabels();
    }, [currentTenant.id]);

    const handleAddLabel = () => {
        if (!newLabel.code || !newLabel.name) {
            toast({
                title: "Validation Error",
                description: "Both code and name are required",
                variant: "destructive",
            });
            return;
        }

        setLabels([...labels, {
            id: `temp-${Date.now()}`,
            tenantId: currentTenant.id,
            code: newLabel.code,
            name: newLabel.name
        }]);
        setNewLabel({ code: "", name: "" });
        setIsAdding(false);
        toast({
            title: "Label Added",
            description: "Responsibility label has been added",
        });
    };

    const tabs = [
        {
            id: "labels",
            label: "Responsibility Labels",
            content: (
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">Responsibility Labels</h3>
                            <p className="text-sm text-muted-foreground">Define labels for asset and task ownership responsibilities.</p>
                        </div>
                        <Button
                            onClick={() => setIsAdding(true)}
                            disabled={isAdding}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" /> Add Label
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">Loading labels...</div>
                    ) : (
                        <div className="space-y-4">
                            {isAdding && (
                                <Card className="border-primary">
                                    <CardContent className="p-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="code">Code</Label>
                                                <Input
                                                    id="code"
                                                    value={newLabel.code}
                                                    onChange={(e) => setNewLabel({ ...newLabel, code: e.target.value })}
                                                    placeholder="e.g., OPS_MANAGER"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Name</Label>
                                                <Input
                                                    id="name"
                                                    value={newLabel.name}
                                                    onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
                                                    placeholder="e.g., Operations Manager"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-4">
                                            <Button size="sm" onClick={handleAddLabel} className="gap-2">
                                                <Save className="h-3 w-3" /> Save
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setIsAdding(false);
                                                    setNewLabel({ code: "", name: "" });
                                                }}
                                                className="gap-2"
                                            >
                                                <X className="h-3 w-3" /> Cancel
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {labels.map((label) => (
                                <Card key={label.id}>
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Tag className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{label.name}</p>
                                                <p className="text-sm text-muted-foreground font-mono">{label.code}</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm">Edit</Button>
                                    </CardContent>
                                </Card>
                            ))}

                            {labels.length === 0 && !isAdding && (
                                <div className="text-center py-12 border rounded-lg border-dashed">
                                    <p className="text-muted-foreground">No responsibility labels defined yet</p>
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
            title="Responsibility Labels"
            subtitle="Define and manage responsibility assignment labels"
            tabs={tabs}
        />
    );
}
