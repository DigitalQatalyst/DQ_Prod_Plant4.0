import { useState } from "react";
import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Palette, Save, Eye, Type, Contrast } from "lucide-react";

export function SettingsAccessibilityThemePage() {
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            toast({
                title: "Settings Saved",
                description: "Your accessibility preferences have been updated.",
            });
        }, 500);
    };

    const tabs = [
        {
            id: "accessibility",
            label: "Accessibility & Theme",
            content: (
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">Accessibility & Theme Settings</h3>
                            <p className="text-sm text-muted-foreground">Customize visual appearance and accessibility features.</p>
                        </div>
                        <Button onClick={handleSave} disabled={saving} className="gap-2">
                            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Settings"}
                        </Button>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Palette className="h-5 w-5 text-primary" />
                                    Theme Settings
                                </CardTitle>
                                <CardDescription>Choose your preferred color scheme</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="theme">Color Theme</Label>
                                    <Select defaultValue="system">
                                        <SelectTrigger id="theme">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="light">Light Mode</SelectItem>
                                            <SelectItem value="dark">Dark Mode</SelectItem>
                                            <SelectItem value="system">System Default</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Type className="h-5 w-5 text-primary" />
                                    Text & Display
                                </CardTitle>
                                <CardDescription>Adjust text size and display preferences</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fontSize">Font Size</Label>
                                    <Select defaultValue="medium">
                                        <SelectTrigger id="fontSize">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="small">Small</SelectItem>
                                            <SelectItem value="medium">Medium (Default)</SelectItem>
                                            <SelectItem value="large">Large</SelectItem>
                                            <SelectItem value="xlarge">Extra Large</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="dyslexicFont" className="cursor-pointer">Dyslexia-Friendly Font</Label>
                                        <p className="text-xs text-muted-foreground">Use OpenDyslexic font for better readability</p>
                                    </div>
                                    <Switch id="dyslexicFont" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Contrast className="h-5 w-5 text-primary" />
                                    Visual Enhancements
                                </CardTitle>
                                <CardDescription>Configure high contrast and motion settings</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="highContrast" className="cursor-pointer">High Contrast Mode</Label>
                                        <p className="text-xs text-muted-foreground">Increase contrast for better visibility</p>
                                    </div>
                                    <Switch id="highContrast" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="reduceMotion" className="cursor-pointer">Reduce Motion</Label>
                                        <p className="text-xs text-muted-foreground">Minimize animations and transitions</p>
                                    </div>
                                    <Switch id="reduceMotion" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="focusIndicator" className="cursor-pointer">Enhanced Focus Indicators</Label>
                                        <p className="text-xs text-muted-foreground">Show clearer focus outlines for keyboard navigation</p>
                                    </div>
                                    <Switch id="focusIndicator" defaultChecked />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Eye className="h-5 w-5 text-primary" />
                                    Screen Reader Support
                                </CardTitle>
                                <CardDescription>Optimize for assistive technologies</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="screenReader" className="cursor-pointer">Screen Reader Mode</Label>
                                        <p className="text-xs text-muted-foreground">Enable enhanced screen reader support with ARIA labels</p>
                                    </div>
                                    <Switch id="screenReader" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="skipLinks" className="cursor-pointer">Skip Navigation Links</Label>
                                        <p className="text-xs text-muted-foreground">Show skip-to-content links for keyboard users</p>
                                    </div>
                                    <Switch id="skipLinks" defaultChecked />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ),
        }
    ];

    return (
        <WorkPane
            title="Accessibility & Theme"
            subtitle="Customize visual and accessibility preferences"
            tabs={tabs}
        />
    );
}
