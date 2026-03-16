import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { WorkPane } from "@/components/layout/WorkPane";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDataProvider } from "@/lib/data";
import type { Stream, Program } from "@/types/settings";
import { Activity, LayoutList, CheckCircle2, AlertCircle, Plus } from "lucide-react";

/**
 * SettingsStreamsProgramsPage
 * Streams and programs management
 * 
 * Requirements: Task 8.1
 */
export function SettingsStreamsProgramsPage() {
    const { currentTenant } = useApp();
    const [streams, setStreams] = useState<Stream[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);
                const provider = getDataProvider();
                const [streamsData, programsData] = await Promise.all([
                    provider.getStreams(currentTenant.id),
                    provider.getPrograms(currentTenant.id)
                ]);
                setStreams(streamsData);
                setPrograms(programsData);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load data");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [currentTenant.id]);

    const getStreamStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>;
            case "inactive":
                return <Badge variant="secondary">Inactive</Badge>;
            case "archived":
                return <Badge variant="outline">Archived</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const tabs = [
        {
            id: "streams",
            label: "Operational Streams",
            content: (
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-lg font-medium">Streams</h3>
                            <p className="text-sm text-muted-foreground">Define different operational contexts (Production, Pilot, R&D)</p>
                        </div>
                        <Button className="gap-2" size="sm">
                            <Plus className="h-4 w-4" /> Add Stream
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">Loading streams...</div>
                    ) : (
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Kind</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Default</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {streams.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                                No streams found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        streams.map((stream) => (
                                            <TableRow key={stream.id}>
                                                <TableCell className="font-mono">{stream.code}</TableCell>
                                                <TableCell className="font-medium">{stream.name}</TableCell>
                                                <TableCell className="capitalize">{stream.kind}</TableCell>
                                                <TableCell>{getStreamStatusBadge(stream.status)}</TableCell>
                                                <TableCell>
                                                    {stream.isDefault ? (
                                                        <Badge variant="outline" className="text-primary border-primary flex w-fit gap-1 font-medium">
                                                            <CheckCircle2 className="h-3 w-3" /> Default
                                                        </Badge>
                                                    ) : "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm">Edit</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    )}
                </div>
            ),
        },
        {
            id: "programs",
            label: "Programs",
            content: (
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-lg font-medium">Organizational Programs</h3>
                            <p className="text-sm text-muted-foreground">Strategic programs and initiatives</p>
                        </div>
                        <Button className="gap-2" size="sm">
                            <Plus className="h-4 w-4" /> Add Program
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">Loading programs...</div>
                    ) : (
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {programs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                                No programs found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        programs.map((program) => (
                                            <TableRow key={program.id}>
                                                <TableCell className="font-medium">{program.name}</TableCell>
                                                <TableCell className="max-w-md truncate text-muted-foreground">
                                                    {program.description || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">{program.status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {new Date(program.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm">Edit</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    )}
                </div>
            ),
        }
    ];

    return (
        <WorkPane
            title="Streams & Programs"
            subtitle="Manage operational contexts and organizational initiatives"
            tabs={tabs}
        />
    );
}
