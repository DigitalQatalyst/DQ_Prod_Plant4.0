import { useState, useEffect } from "react";
import { Cloud, CloudOff, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { edgeSyncService, SyncStatus } from "@/lib/data/EdgeSyncService";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function EdgeSyncStatus() {
    const [status, setStatus] = useState<SyncStatus>(edgeSyncService.getStatus());
    const [lastSync, setLastSync] = useState<Date>(edgeSyncService.getLastSyncTime());

    useEffect(() => {
        return edgeSyncService.subscribe((newStatus, newLastSync) => {
            setStatus(newStatus);
            setLastSync(newLastSync);
        });
    }, []);

    const getStatusIcon = () => {
        switch (status) {
            case 'synced':
                return <CheckCircle2 className="w-4 h-4 text-success" />;
            case 'syncing':
                return <RefreshCw className="w-4 h-4 text-primary animate-spin" />;
            case 'offline':
                return <CloudOff className="w-4 h-4 text-muted-foreground" />;
            case 'error':
                return <AlertCircle className="w-4 h-4 text-destructive" />;
            default:
                return <Cloud className="w-4 h-4 text-muted-foreground" />;
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'synced': return 'Edge Synchronized';
            case 'syncing': return 'Syncing with Edge...';
            case 'offline': return 'Edge Offline (using cache)';
            case 'error': return 'Sync Error';
            default: return 'Edge Connection';
        }
    };

    return (
        <TooltipProvider>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 cursor-help">
                            {getStatusIcon()}
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                {status}
                            </span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-xs">{getStatusText()}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Last sync: {lastSync.toLocaleTimeString()}
                        </p>
                    </TooltipContent>
                </Tooltip>

                <div className="w-px h-3 bg-border mx-1" />

                <Button
                    variant="ghost"
                    size="icon"
                    className="w-5 h-5 h-auto p-0 hover:bg-transparent"
                    onClick={() => edgeSyncService.syncNow()}
                    disabled={status === 'syncing' || status === 'offline'}
                >
                    <RefreshCw className={cn("w-3 h-3 text-muted-foreground hover:text-primary transition-colors", status === 'syncing' && "animate-spin")} />
                </Button>
            </div>
        </TooltipProvider>
    );
}
