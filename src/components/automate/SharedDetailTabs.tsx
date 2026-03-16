
import { useMemo } from "react";
import { History, Box, MapPin, Activity, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Mock Data Generators ---

function seededRandom(seed: string) {
    let h = 0x811c9dc5;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return function () {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return (h >>> 0) / 4294967296;
    };
}

function generateLinkedAssets(recordId: string) {
    const rng = seededRandom(recordId + "assets");
    const count = Math.floor(rng() * 5) + 1; // 1 to 5 assets

    const types = ["Pump", "Valve", "Sensor", "Compressor", "Tank", "Conveyor", "Robot Arm", "PLC"];
    const locations = ["Zone A", "Zone B", "Building 1", "North Wing", "Processing Unit", "Assembly Line"];
    const statuses = ["Active", "Active", "Active", "Maintenance", "Offline", "Warning"];

    return Array.from({ length: count }).map((_, i) => {
        const type = types[Math.floor(rng() * types.length)];
        const idNum = Math.floor(rng() * 900) + 100;
        return {
            id: `ast-${i}-${idNum}`,
            name: `${type}-${idNum}`,
            type,
            location: locations[Math.floor(rng() * locations.length)],
            status: statuses[Math.floor(rng() * statuses.length)],
            lastSeen: new Date(Date.now() - Math.floor(rng() * 100000000)).toLocaleString(),
        };
    });
}

function generateHistory(recordId: string, createdAt: string, updatedAt: string) {
    const rng = seededRandom(recordId + "history");
    const count = Math.floor(rng() * 8) + 3; // 3 to 10 events

    const actions = [
        { type: "update", label: "Configuration Updated", details: "Parameters modified by user" },
        { type: "status", label: "Status Changed", details: "State transition occurred" },
        { type: "trigger", label: "System Trigger", details: "Automated process execution" },
        { type: "validation", label: "Validation Check", details: "System integrity verified" },
        { type: "warning", label: "Warning Logged", details: "Threshold approach detected" },
        { type: "alert", label: "Alert Cleared", details: "Return to normal operation" },
    ];

    const users = ["system", "admin", "john.doe", "jane.smith", "operator-x"];

    const events = Array.from({ length: count }).map((_, i) => {
        const action = actions[Math.floor(rng() * actions.length)];
        const timeOffset = Math.floor(rng() * 30 * 24 * 60 * 60 * 1000); // Up to 30 days ago

        return {
            id: `evt-${i}`,
            action: action.label,
            details: action.details,
            user: users[Math.floor(rng() * users.length)],
            timestamp: new Date(Date.now() - timeOffset),
            type: action.type,
        };
    });

    // Ensure CreatedAt and UpdatedAt are included/respected if possible, 
    // but for now we just mix them in or rely on the generated ones to fill the gaps.
    // We'll sort them by date.

    // Add explicit create/update from record if available
    if (createdAt) {
        events.push({
            id: 'evt-create',
            action: 'Created',
            details: 'Initial record creation',
            user: 'system',
            timestamp: new Date(createdAt),
            type: 'create'
        });
    }

    // Clean up sort
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// --- Icons ---
function getActionIcon(type: string) {
    switch (type) {
        case 'create': return <CheckCircle2 className="w-4 h-4 text-success" />;
        case 'update': return <Activity className="w-4 h-4 text-primary" />;
        case 'status': return <Activity className="w-4 h-4 text-info" />; // Info
        case 'warning': return <AlertCircle className="w-4 h-4 text-warning" />;
        case 'alert': return <CheckCircle2 className="w-4 h-4 text-success" />;
        default: return <History className="w-4 h-4 text-muted-foreground" />;
    }
}

// --- Components ---

interface SharedTabProps {
    record: {
        id: string;
        created_at?: string;
        updated_at?: string;
        [key: string]: any;
    } | null;
    emptyIcon?: React.ElementType;
    emptyTitle?: string;
    emptyMessage?: string;
}

export function SharedLinkedAssetsTab({ record, emptyIcon: EmptyIcon = Box, emptyTitle = "No Record Selected", emptyMessage = "Select a record to view its linked assets" }: SharedTabProps) {
    if (!record) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                    <EmptyIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{emptyTitle}</h3>
                <p className="text-sm text-muted-foreground max-w-md">{emptyMessage}</p>
            </div>
        );
    }

    const assets = useMemo(() => generateLinkedAssets(record.id), [record.id]);

    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Box className="w-4 h-4 text-primary" />
                    Linked Assets ({assets.length})
                </h4>

                <div className="space-y-3">
                    {assets.map((asset) => (
                        <div key={asset.id} className="flex items-center justify-between p-3 bg-secondary/20 border border-border rounded-lg hover:bg-secondary/40 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border border-border">
                                    <Activity className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{asset.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Box className="w-3 h-3" /> {asset.type}
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {asset.location}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={cn(
                                    "text-xs px-2 py-0.5 rounded-full font-medium inline-block mb-1",
                                    asset.status === 'Active' ? "bg-success/10 text-success border border-success/20" :
                                        asset.status === 'Warning' ? "bg-warning/10 text-warning border border-warning/20" :
                                            "bg-muted text-muted-foreground border border-border"
                                )}>
                                    {asset.status}
                                </div>
                                <p className="text-[10px] text-muted-foreground">Last seen: {asset.lastSeen}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function SharedHistoryTab({ record, emptyIcon: EmptyIcon = History, emptyTitle = "No Record Selected", emptyMessage = "Select a record to view its history" }: SharedTabProps) {
    if (!record) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                    <EmptyIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{emptyTitle}</h3>
                <p className="text-sm text-muted-foreground max-w-md">{emptyMessage}</p>
            </div>
        );
    }

    const events = useMemo(() =>
        generateHistory(record.id, record.created_at || '', record.updated_at || ''),
        [record.id, record.created_at, record.updated_at]);

    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg divide-y divide-border">
                {events.map((event, i) => (
                    <div key={event.id} className="px-4 py-3 flex items-start justify-between hover:bg-muted/30 transition-colors">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                                {getActionIcon(event.type)}
                            </div>
                            <div>
                                <p className="text-sm font-medium">{event.action}</p>
                                <p className="text-xs text-muted-foreground mb-0.5">{event.details}</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <User className="w-3 h-3 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">{event.user}</p>
                                </div>
                            </div>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                            {event.timestamp.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
