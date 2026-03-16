import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getDataProvider } from "@/lib/data";
import type { NamingStandard } from "@/types/settings";
import { FileCode, Save, RotateCcw, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * SettingsNamingStandardsPage
 * Naming standards edit functionality
 * 
 * Requirements: Task 8.1
 */
export function SettingsNamingStandardsPage() {
    const { currentTenant } = useApp();
    const { toast } = useToast();
    const [standards, setStandards] = useState<NamingStandard | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [jsonString, setJsonString] = useState("");

    useEffect(() => {
        const loadStandards = async () => {
            try {
                setLoading(true);
                setError(null);
                const provider = getDataProvider();
                // Note: getNamingStandards might need to be implemented or handled.
                // Assuming it exists as per design doc but might return null if not seeded.
                const data = await provider.getNamingStandards?.(currentTenant.id);
                setStandards(data || { tenantId: currentTenant.id, rules: {} });
                setJsonString(JSON.stringify(data?.rules || {}, null, 4));
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load naming standards");
            } finally {
                setLoading(false);
            }
        };

        loadStandards();
    }, [currentTenant.id]);

    const handleSave = async () => {
        try {
            setSaving(true);
            let parsedRules;
            try {
                parsedRules = JSON.parse(jsonString);
            } catch (e) {
                throw new Error("Invalid JSON format. Please check your syntax.");
            }

            const provider = getDataProvider();
            const updated = await provider.updateNamingStandards?.(currentTenant.id, {
                tenantId: currentTenant.id,
                rules: parsedRules
            });

            if (updated) {
                setStandards(updated);
            }

            toast({
                title: "Naming Standards Updated",
                description: "The naming standards have been successfully saved.",
            });
        } catch (err) {
            toast({
                title: "Save Failed",
                description: err instanceof Error ? err.message : "Failed to save standards",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (standards) {
            setJsonString(JSON.stringify(standards.rules, null, 4));
        }
    };

    const tabs = [
        {
            id: "editor",
            label: "Rules Editor",
            content: (
                <div className="p-6 space-y-6">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Naming Governance</AlertTitle>
                        <AlertDescription>
                            Define the patterns and vocabulary used for asset naming, tagging, and metadata across your organization.
                        </AlertDescription>
                    </Alert>

                    {loading ? (
                        <div className="text-center py-12">Loading standards...</div>
                    ) : error ? (
                        <div className="text-destructive text-center py-12">Error: {error}</div>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileCode className="h-5 w-5 text-primary" />
                                    Standards Configuration (JSON)
                                </CardTitle>
                                <CardDescription>
                                    Edit the raw configuration for naming patterns, required fields, and tag vocabulary.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="rules-json">Rules Schema</Label>
                                    <Textarea
                                        id="rules-json"
                                        className="font-mono min-h-[400px] text-sm"
                                        value={jsonString}
                                        onChange={(e) => setJsonString(e.target.value)}
                                        placeholder='{ "naming_patterns": { "asset": "{SITE}-{TYPE}-{SEQ}" } }'
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                                        {saving ? "Saving..." : <><Save className="h-4 w-4" /> Save Standards</>}
                                    </Button>
                                    <Button variant="outline" onClick={handleReset} disabled={saving} className="gap-2">
                                        <RotateCcw className="h-4 w-4" /> Reset
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            ),
        }
    ];

    return (
        <WorkPane
            title="Naming Standards"
            subtitle="Configure organizational naming conventions and data vocabulary"
            tabs={tabs}
        />
    );
}
