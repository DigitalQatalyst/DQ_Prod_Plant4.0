import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getDataProvider } from "@/lib/data";
import { Settings2, Save, Gauge, Zap } from "lucide-react";
import type { UnitSystem } from "@/types/settings";

export function SettingsPlatformDefaultsPage() {
    const { currentTenant } = useApp();
    const { toast } = useToast();
    const [units, setUnits] = useState<UnitSystem | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadDefaults = async () => {
            try {
                setLoading(true);
                const provider = getDataProvider();
                const data = await provider.getTenantUnits?.(currentTenant.id);
                setUnits(data || { tenantId: currentTenant.id, unitSystem: {} });
            } catch (err) {
                console.error("Failed to load platform defaults", err);
            } finally {
                setLoading(false);
            }
        };

        loadDefaults();
    }, [currentTenant.id]);

    const handleSave = async () => {
        try {
            setSaving(true);
            const provider = getDataProvider();
            if (units) {
                await provider.updateTenantUnits?.(currentTenant.id, units);
            }
            toast({
                title: "Defaults Saved",
                description: "Platform defaults have been updated successfully.",
            });
        } catch (err) {
            toast({
                title: "Save Failed",
                description: "Failed to update platform defaults.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        {
            id: "units",
            label: "Units & Defaults",
            content: (
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">Platform Defaults</h3>
                            <p className="text-sm text-muted-foreground">Configure organization-wide default settings and unit systems.</p>
                        </div>
                        <Button onClick={handleSave} disabled={saving} className="gap-2">
                            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">Loading defaults...</div>
                    ) : (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Gauge className="h-5 w-5 text-primary" />
                                        Measurement Units
                                    </CardTitle>
                                    <CardDescription>Define default units of measurement for the organization</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="temperature">Temperature</Label>
                                            <Select defaultValue="celsius">
                                                <SelectTrigger id="temperature">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="celsius">Celsius (°C)</SelectItem>
                                                    <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
                                                    <SelectItem value="kelvin">Kelvin (K)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="pressure">Pressure</Label>
                                            <Select defaultValue="bar">
                                                <SelectTrigger id="pressure">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="bar">Bar</SelectItem>
                                                    <SelectItem value="psi">PSI</SelectItem>
                                                    <SelectItem value="pascal">Pascal (Pa)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="power">Power</Label>
                                            <Select defaultValue="kw">
                                                <SelectTrigger id="power">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="kw">Kilowatt (kW)</SelectItem>
                                                    <SelectItem value="mw">Megawatt (MW)</SelectItem>
                                                    <SelectItem value="hp">Horsepower (hp)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="energy">Energy</Label>
                                            <Select defaultValue="kwh">
                                                <SelectTrigger id="energy">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="kwh">Kilowatt-hour (kWh)</SelectItem>
                                                    <SelectItem value="mwh">Megawatt-hour (MWh)</SelectItem>
                                                    <SelectItem value="joule">Joule (J)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-primary" />
                                        Display Preferences
                                    </CardTitle>
                                    <CardDescription>Configure default display and formatting options</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="dateFormat">Date Format</Label>
                                            <Select defaultValue="iso">
                                                <SelectTrigger id="dateFormat">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="iso">ISO 8601 (YYYY-MM-DD)</SelectItem>
                                                    <SelectItem value="us">US (MM/DD/YYYY)</SelectItem>
                                                    <SelectItem value="eu">EU (DD/MM/YYYY)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="numberFormat">Number Format</Label>
                                            <Select defaultValue="comma">
                                                <SelectTrigger id="numberFormat">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="comma">1,234.56</SelectItem>
                                                    <SelectItem value="period">1.234,56</SelectItem>
                                                    <SelectItem value="space">1 234.56</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            ),
        }
    ];

    return (
        <WorkPane
            title="Platform Defaults"
            subtitle="Configure organization-wide platform settings"
            tabs={tabs}
        />
    );
}
