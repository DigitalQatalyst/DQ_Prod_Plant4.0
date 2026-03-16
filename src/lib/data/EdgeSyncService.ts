/**
 * Edge Sync Service - Simulates edge-to-cloud synchronization
 * AC 2.15.1-2.15.3
 */

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

class EdgeSyncService {
    private static instance: EdgeSyncService;
    private status: SyncStatus = 'synced';
    private lastSyncTime: Date = new Date();
    private listeners: ((status: SyncStatus, lastSync: Date) => void)[] = [];

    private constructor() {
        // Simulate periodic background sync
        setInterval(() => {
            if (this.status === 'synced' && Math.random() > 0.8) {
                this.performSimulatedSync();
            }
        }, 30000);
    }

    public static getInstance(): EdgeSyncService {
        if (!EdgeSyncService.instance) {
            EdgeSyncService.instance = new EdgeSyncService();
        }
        return EdgeSyncService.instance;
    }

    public getStatus(): SyncStatus {
        return this.status;
    }

    public getLastSyncTime(): Date {
        return this.lastSyncTime;
    }

    public setStatus(status: SyncStatus) {
        this.status = status;
        this.notify();
    }

    public async syncNow(): Promise<void> {
        if (this.status === 'offline') {
            throw new Error("Cannot sync while offline");
        }
        await this.performSimulatedSync();
    }

    private async performSimulatedSync(): Promise<void> {
        this.status = 'syncing';
        this.notify();

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (Math.random() > 0.05) {
            this.status = 'synced';
            this.lastSyncTime = new Date();
        } else {
            this.status = 'error';
        }
        this.notify();
    }

    public subscribe(callback: (status: SyncStatus, lastSync: Date) => void) {
        this.listeners.push(callback);
        callback(this.status, this.lastSyncTime);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    private notify() {
        this.listeners.forEach(l => l(this.status, this.lastSyncTime));
    }

    public toggleOffline() {
        if (this.status === 'offline') {
            this.status = 'synced';
        } else {
            this.status = 'offline';
        }
        this.notify();
    }
}

export const edgeSyncService = EdgeSyncService.getInstance();
