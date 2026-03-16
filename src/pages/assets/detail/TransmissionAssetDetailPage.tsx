
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useDataProvider } from "@/hooks/useDataProvider";
import { WorkPane } from "@/components/layout/WorkPane";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Settings,
    Activity,
    Network,
    FileText,
    History,
    Shield,
    Download,
    Edit,
    ArrowLeft
} from "lucide-react";
import { TransmissionAsset, AssetDocument, AssetAuditLog, TelemetryPoint, GridAssetLink, ComplianceRecord } from "@/types/transmission";
import { Alert } from "@/types/alert";
import { DataProvider } from "@/lib/data/DataProvider";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyStates } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function TransmissionAssetDetailPage() {
    const { id } = useParams<{ id: string }>();

    if (!id) {
        return (
            <WorkPane title="Asset Detail" subtitle="No asset selected">
                <EmptyStates.Error
                    title="Asset Not Selected"
                    description="Please select an asset to view the 360 context."
                    action={{
                        label: "Back to Portfolio",
                        onClick: () => window.location.href = "/assets/portfolio/overview",
                        variant: "default"
                    }}
                />
            </WorkPane>
        );
    }

    return <TransmissionAssetDetailContent assetId={id} showBack={true} />;
}

export function TransmissionAssetDetailContent({ assetId, showBack }: { assetId: string; showBack?: boolean }) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { provider } = useDataProvider();

    const [asset, setAsset] = useState<TransmissionAsset | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const currentTab = searchParams.get("tab") || "overview";

    const loadAsset = useCallback(async () => {
        if (!assetId) return;
        setLoading(true);
        try {
            const data = await provider.getTransmissionAssetById(assetId);
            if (data) {
                setAsset(data);
            } else {
                setError("Asset not found");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load asset");
        } finally {
            setLoading(false);
        }
    }, [assetId, provider]);

    useEffect(() => {
        loadAsset();
    }, [loadAsset]);

    const handleTabChange = (value: string) => {
        setSearchParams({ tab: value });
    };

    if (loading) {
        return (
            <WorkPane title="Asset Detail" subtitle="Loading...">
                <LoadingState loadingText="Loading asset details..." />
            </WorkPane>
        );
    }

    if (error || !asset) {
        return (
            <WorkPane title="Asset Detail" subtitle="Error">
                <EmptyStates.Error
                    title="Asset Not Found"
                    description={error || "The requested asset could not be found."}
                    action={{
                        label: "Back to Portfolio",
                        onClick: () => navigate("/assets/portfolio/overview"),
                        variant: "default"
                    }}
                />
            </WorkPane>
        );
    }

    const tabs = [
        { id: "overview", label: "Overview", icon: Settings },
        { id: "telemetry", label: "Telemetry", icon: Activity },
        { id: "relationships", label: "Relationships", icon: Network },
        { id: "documents", label: "Documents", icon: FileText },
        { id: "history", label: "History", icon: History },
        { id: "compliance", label: "Compliance", icon: Shield },
    ];

    return (
        <WorkPane
            title={asset.name}
            subtitle={`Asset Detail • ${asset.assetTypeName}`}
            actions={
                <div className="flex items-center gap-2">
                    {showBack && (
                        <Button variant="outline" size="sm" onClick={() => navigate("/assets/portfolio/overview")}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                    )}
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                    <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => setIsEditing(!isEditing)}
                        variant={isEditing ? "secondary" : "default"}
                    >
                        <Edit className="w-4 h-4" />
                        {isEditing ? "Cancel" : "Edit"}
                    </Button>
                </div>
            }
        >
            <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
                <TabsList>
                    {tabs.map((tab) => (
                        <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="overview">
                    <OverviewTab
                        asset={asset}
                        provider={provider}
                        isEditing={isEditing}
                        setIsEditing={setIsEditing}
                        onRefresh={loadAsset}
                    />
                </TabsContent>

                <TabsContent value="telemetry">
                    <TelemetryTab assetId={asset.id} provider={provider} />
                </TabsContent>

                <TabsContent value="relationships">
                    <RelationshipsTab asset={asset} provider={provider} />
                </TabsContent>

                <TabsContent value="documents">
                    <DocumentsTab assetId={asset.id} provider={provider} />
                </TabsContent>

                <TabsContent value="history">
                    <AuditLogTab assetId={asset.id} provider={provider} />
                </TabsContent>

                <TabsContent value="compliance">
                    <ComplianceTab assetId={asset.id} provider={provider} />
                </TabsContent>
            </Tabs>
        </WorkPane>
    );
}

function OverviewTab({
    asset,
    provider,
    isEditing,
    setIsEditing,
    onRefresh
}: {
    asset: TransmissionAsset,
    provider: DataProvider,
    isEditing: boolean,
    setIsEditing: (val: boolean) => void,
    onRefresh: () => void
}) {
    const [formData, setFormData] = useState<Record<string, unknown>>({ ...asset.properties });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData({ ...asset.properties });
        setErrors({});
    }, [asset.properties, isEditing]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!asset.propertiesSchema) return true;

        Object.entries(asset.propertiesSchema).forEach(([key, type]) => {
            const value = formData[key];
            if (type === 'number') {
                if (value !== undefined && value !== '' && isNaN(Number(value))) {
                    newErrors[key] = 'Must be a number';
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) {
            toast.error("Please fix the errors before saving.");
            return;
        }

        setIsSaving(true);
        try {
            // Identify changed fields for audit log
            const changedFields: string[] = [];
            const oldValues: Record<string, unknown> = {};
            const newValues: Record<string, unknown> = {};

            Object.keys({ ...asset.properties, ...formData }).forEach(key => {
                const oldValue = asset.properties[key];
                const newValue = formData[key];

                // Simplified comparison for properties
                if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                    changedFields.push(key);
                    oldValues[key] = oldValue;
                    newValues[key] = newValue;
                }
            });

            if (changedFields.length === 0) {
                setIsEditing(false);
                return;
            }

            // Update asset
            await provider.updateTransmissionAsset(asset.id, {
                properties: formData
            });

            // Create audit log
            await provider.createAssetAuditLog({
                tenantId: asset.tenantId,
                assetId: asset.id,
                action: 'update',
                changedFields,
                oldValues,
                newValues,
                details: `Updated properties: ${changedFields.join(', ')}`
            });

            toast.success("Asset properties updated successfully");
            onRefresh();
            setIsEditing(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update asset");
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (key: string, value: string) => {
        const schemaType = asset.propertiesSchema?.[key];
        let finalValue: any = value;

        if (schemaType === 'number') {
            // Keep as string while typing for validation to work, 
            // but convert to number if it's a valid number for saving eventually 
            // OR just store as string and convert on save.
            // Let's store as string/number based on schema when possible.
            if (value === '') finalValue = undefined;
            else if (!isNaN(Number(value))) finalValue = Number(value);
        }

        setFormData(prev => ({
            ...prev,
            [key]: finalValue
        }));
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <div className="text-sm text-muted-foreground">Asset Name</div>
                            <div className="font-medium text-lg">{asset.name}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Type</div>
                            <div className="font-medium">{asset.assetTypeName}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Site</div>
                            <div className="font-medium">{asset.siteName || asset.siteId}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Status</div>
                            <StatusBadge status={asset.status} />
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Criticality</div>
                            <Badge variant={asset.criticality === 'critical' || asset.criticality === 'high' ? 'destructive' : 'secondary'}>
                                {asset.criticality}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <AlertSummaryCard assetId={asset.id} provider={provider} />

            <Card className={isEditing ? "border-primary ring-1 ring-primary/20" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Properties</CardTitle>
                    {isEditing && (
                        <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                                Cancel
                            </Button>
                            <Button size="sm" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {isEditing ? (
                        <div className="space-y-4">
                            {asset.propertiesSchema ? (
                                Object.entries(asset.propertiesSchema).map(([key, type]) => (
                                    <div key={key} className="space-y-1.5">
                                        <Label htmlFor={key} className="capitalize">{key.replace(/_/g, ' ')}</Label>
                                        <Input
                                            id={key}
                                            type={type === 'number' ? 'text' : 'text'}
                                            value={formData[key] !== undefined ? String(formData[key]) : ''}
                                            onChange={(e) => handleInputChange(key, e.target.value)}
                                            className={errors[key] ? "border-destructive focus-visible:ring-destructive" : ""}
                                            placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                                        />
                                        {errors[key] && (
                                            <p className="text-[10px] text-destructive font-medium">{errors[key]}</p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-muted-foreground italic py-4">
                                    No schema defined for this asset type. Edit mode restricted to existing properties.
                                </div>
                            )}

                            {/* Fallback for properties not in schema but present in data */}
                            {Object.keys(formData).map(key => {
                                if (asset.propertiesSchema?.[key]) return null;
                                return (
                                    <div key={key} className="space-y-1.5">
                                        <Label htmlFor={key} className="capitalize">{key.replace(/_/g, ' ')} (Unmapped)</Label>
                                        <Input
                                            id={key}
                                            value={String(formData[key] || '')}
                                            onChange={(e) => handleInputChange(key, e.target.value)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        Object.keys(asset.properties).length > 0 ? (
                            <div className="space-y-2">
                                {Object.entries(asset.properties).map(([key, value]) => (
                                    <div key={key} className="flex justify-between border-b border-muted py-1 last:border-0">
                                        <span className="text-sm text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                                        <span className="text-sm font-medium">{String(value)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground italic">No additional properties defined</div>
                        )
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function AlertSummaryCard({ assetId, provider }: { assetId: string, provider: DataProvider }) {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAlerts = async () => {
            setLoading(true);
            try {
                const data = await provider.getAlertsByAsset(assetId);
                setAlerts(data);
            } catch (e) {
                console.error("Failed to load alerts for summary", e);
            } finally {
                setLoading(false);
            }
        };
        loadAlerts();
    }, [assetId, provider]);

    if (loading) return <Card className="flex items-center justify-center p-8"><LoadingState /></Card>;

    const openAlerts = alerts.filter(a => a.status !== 'closed');
    const criticalCount = openAlerts.filter(a => a.severity === 'critical').length;
    const warningCount = openAlerts.filter(a => a.severity === 'warning').length;

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                    Active Alerts
                    <Badge variant={criticalCount > 0 ? "destructive" : "secondary"} className={warningCount > 0 && criticalCount === 0 ? "bg-amber-500 text-white border-none hover:bg-amber-600" : ""}>
                        {openAlerts.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {openAlerts.length > 0 ? (
                    <>
                        <div className="flex gap-4">
                            <div className="text-center flex-1">
                                <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
                                <div className="text-xs text-muted-foreground">Critical</div>
                            </div>
                            <div className="text-center flex-1 border-l">
                                <div className="text-2xl font-bold text-orange-500">{warningCount}</div>
                                <div className="text-xs text-muted-foreground">Warning</div>
                            </div>
                        </div>
                        <div className="text-sm border-t pt-4">
                            <div className="font-semibold text-xs text-muted-foreground uppercase mb-1">Latest Alert</div>
                            <div className="font-medium line-clamp-1">{openAlerts[0].title}</div>
                            <div className="text-[10px] text-muted-foreground">
                                {new Date(openAlerts[0].createdAt).toLocaleString()}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-green-600 gap-2">
                        <Shield className="w-8 h-8 opacity-20" />
                        <span className="text-sm font-medium">All systems normal</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function TelemetryTab({ assetId, provider }: { assetId: string, provider: DataProvider }) {
    const [points, setPoints] = useState<TelemetryPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPoints = async () => {
            setLoading(true);
            try {
                const data = await provider.getTelemetryPointsByAsset(assetId);
                setPoints(data);
            } catch (e) {
                console.error("Failed to load telemetry points", e);
            } finally {
                setLoading(false);
            }
        };
        loadPoints();
    }, [assetId, provider]);

    if (loading) return <LoadingState />;

    if (points.length === 0) {
        return (
            <Card>
                <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                        <Activity className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        <p>No telemetry points linked to this asset.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {points.map(point => (
                <Card key={point.id}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium capitalize flex justify-between">
                            {point.metric.replace(/_/g, ' ')}
                            <Activity className="w-4 h-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold">--</span>
                            <span className="text-muted-foreground text-sm font-normal">{point.unit || ''}</span>
                        </div>
                        {point.limits && (
                            <div className="mt-4 pt-4 border-t space-y-2">
                                <div className="text-[10px] text-muted-foreground font-semibold uppercase">Thresholds</div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex justify-between p-1 bg-orange-500/10 rounded">
                                        <span className="text-orange-500 font-medium">Warning</span>
                                        <span>{point.limits.warning}</span>
                                    </div>
                                    <div className="flex justify-between p-1 bg-destructive/10 rounded">
                                        <span className="text-destructive font-medium">Critical</span>
                                        <span>{point.limits.critical}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function RelationshipsTab({ asset, provider }: { asset: TransmissionAsset, provider: DataProvider }) {
    const [children, setChildren] = useState<TransmissionAsset[]>([]);
    const [links, setLinks] = useState<GridAssetLink[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadRel = async () => {
            setLoading(true);
            try {
                const [childData, linkData] = await Promise.all([
                    provider.getChildAssets(asset.id),
                    provider.getAssetTopologyLinks(asset.id)
                ]);
                setChildren(childData);
                setLinks(linkData);
            } catch (e) {
                console.error("Failed to load relationships", e);
            } finally {
                setLoading(false);
            }
        };
        loadRel();
    }, [asset.id, provider]);

    if (loading) return <LoadingState />;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Hierarchy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <div className="text-sm font-medium text-muted-foreground mb-2 px-1">Parent Asset</div>
                        {asset.parentAssetId ? (
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-3 h-auto py-3 px-4 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
                                onClick={() => navigate(`/assets/detail/360/${asset.parentAssetId}`)}
                            >
                                <Network className="w-5 h-5 text-primary" />
                                <div className="text-left">
                                    <div className="font-semibold text-primary">View Parent Asset</div>
                                    <div className="text-xs text-muted-foreground font-mono">{asset.parentAssetId}</div>
                                </div>
                            </Button>
                        ) : (
                            <div className="p-4 border rounded-lg border-dashed text-sm text-center text-muted-foreground italic">
                                No parent asset assigned (Top-level)
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="text-sm font-medium text-muted-foreground mb-2 px-1">Child Assets ({children.length})</div>
                        {children.length > 0 ? (
                            <div className="space-y-2">
                                {children.map(child => (
                                    <Button
                                        key={child.id}
                                        variant="outline"
                                        className="w-full justify-start gap-3 h-auto py-3 px-4"
                                        onClick={() => navigate(`/assets/detail/360/${child.id}`)}
                                    >
                                        <Network className="w-4 h-4" />
                                        <div className="text-left">
                                            <div className="font-semibold">{child.name}</div>
                                            <div className="text-xs text-muted-foreground underline decoration-dotted">{child.assetTypeName}</div>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 border rounded-lg border-dashed text-sm text-center text-muted-foreground italic">
                                No child assets found
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Topology Context</CardTitle>
                </CardHeader>
                <CardContent>
                    {links.length > 0 ? (
                        <div className="space-y-3">
                            <p className="text-xs text-muted-foreground px-1 pb-1">Historical and logical links to grid topology nodes and lines.</p>
                            {links.map((link, i) => (
                                <div key={i} className="p-4 border rounded-lg flex items-center justify-between group hover:border-primary/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                                            <Network className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold capitalize">Linked to {link.nodeId ? 'Grid Node' : 'Grid Line'}</div>
                                            <div className="text-[10px] text-muted-foreground font-mono">{link.nodeId || link.lineId}</div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                                        <ArrowLeft className="w-4 h-4 rotate-180" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 border rounded-lg border-dashed text-center">
                            <Network className="w-12 h-12 mx-auto mb-4 opacity-10" />
                            <p className="text-sm text-muted-foreground italic">No topology links mapping this asset to the transmission grid.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


function DocumentsTab({ assetId, provider }: { assetId: string, provider: DataProvider }) {
    const [documents, setDocuments] = useState<AssetDocument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDocs = async () => {
            setLoading(true);
            try {
                const docs = await provider.getAssetDocuments(assetId);
                setDocuments(docs);
            } catch (e) {
                console.error("Failed to load documents", e);
            } finally {
                setLoading(false);
            }
        };
        loadDocs();
    }, [assetId, provider]);

    if (loading) return <LoadingState />;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Asset Documents</CardTitle>
            </CardHeader>
            <CardContent>
                {documents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No documents found.</div>
                ) : (
                    <div className="space-y-2">
                        {documents.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-primary" />
                                    <div>
                                        <div className="font-medium">{doc.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {doc.category} • {(doc.fileSize / 1024).toFixed(1)} KB • {new Date(doc.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm">
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function AuditLogTab({ assetId, provider }: { assetId: string, provider: DataProvider }) {
    const [logs, setLogs] = useState<AssetAuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadLogs = async () => {
            setLoading(true);
            try {
                const result = await provider.getAssetAuditLog(assetId, { limit: 50 });
                setLogs(result.data);
            } catch (e) {
                console.error("Failed to load audit logs", e);
            } finally {
                setLoading(false);
            }
        };
        loadLogs();
    }, [assetId, provider]);

    if (loading) return <LoadingState />;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Audit History</CardTitle>
            </CardHeader>
            <CardContent>
                {logs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No audit history found.</div>
                ) : (
                    <div className="space-y-4">
                        {logs.map(log => (
                            <div key={log.id} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                                    <div className="w-px h-full bg-border mt-2" />
                                </div>
                                <div className="pb-4">
                                    <div className="text-sm font-medium capitalize">{log.action.replace(/_/g, ' ')}</div>
                                    <div className="text-xs text-muted-foreground">{new Date(log.performedAt).toLocaleString()} • {log.userId || 'System'}</div>
                                    <div className="text-sm mt-1">
                                        {log.details || `Modified fields: ${log.changedFields.join(', ')}`}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
function ComplianceTab({ assetId, provider }: { assetId: string, provider: DataProvider }) {
    const [records, setRecords] = useState<ComplianceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCompliance = async () => {
            setLoading(true);
            try {
                const data = await provider.getComplianceByAsset(assetId);
                setRecords(data);
            } catch (e) {
                console.error("Failed to load compliance records", e);
            } finally {
                setLoading(false);
            }
        };
        loadCompliance();
    }, [assetId, provider]);

    if (loading) return <LoadingState />;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Safety & Compliance</CardTitle>
            </CardHeader>
            <CardContent>
                {records.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Shield className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        <p>No active compliance records found for this asset.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {records.map(record => (
                            <div key={record.id} className="p-4 border rounded-lg flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold">{record.title}</h4>
                                        <Badge variant={
                                            record.status === 'compliant' ? 'default' :
                                                record.status === 'warning' ? 'secondary' :
                                                    'destructive'
                                        }>
                                            {record.status}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{record.description}</p>
                                    <div className="flex flex-wrap gap-4 text-xs mt-2 text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Shield className="w-3 h-3" />
                                            Authority: {record.authority}
                                        </div>
                                        {record.referenceNumber && (
                                            <div className="flex items-center gap-1">
                                                <FileText className="w-3 h-3" />
                                                Ref: {record.referenceNumber}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <Activity className="w-3 h-3" />
                                            Next Due: {record.nextInspectionDate ? new Date(record.nextInspectionDate).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm">View Certificate</Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
