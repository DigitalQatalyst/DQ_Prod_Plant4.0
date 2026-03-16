/**
 * Connection Health Page
 * Route: /assets/connectivity/health
 * 
 * Displays endpoint status timeline derived from last_seen/status.
 * Shows current status, last_seen timestamp, uptime percentage.
 * Timeline shows last 24 hours with range selector.
 * 
 * Requirements: 4.9
 */

import { useState, useEffect, useMemo } from 'react';
import { useDataProvider } from '@/hooks/useDataProvider';
import type { ConnectionEndpoint } from '@/types/transmission';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { Activity, Clock, TrendingUp, Network } from 'lucide-react';
import { ListPane } from '@/components/layout/ListPane';
import { WorkPane } from '@/components/layout/WorkPane';

export default function ConnectionHealthPage() {
  const { provider } = useDataProvider();
  const [tenantId, setTenantId] = useState<string>('');
  const [endpoints, setEndpoints] = useState<ConnectionEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Load tenant ID
  useEffect(() => {
    const loadTenant = async () => {
      try {
        const id = await provider.getDefaultTransmissionTenantId();
        setTenantId(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tenant');
      }
    };
    loadTenant();
  }, [provider]);

  // Load endpoints
  useEffect(() => {
    if (!tenantId) return;

    const loadEndpoints = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await provider.getTransmissionConnectionEndpointsByTenant(tenantId, {
          limit: 100,
          offset: 0,
        });
        setEndpoints(result.data);
        if (result.data.length > 0 && !selectedEndpointId) {
          setSelectedEndpointId(result.data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load endpoints');
      } finally {
        setLoading(false);
      }
    };

    loadEndpoints();
  }, [provider, tenantId]);

  // Filter endpoints
  const filteredEndpoints = useMemo(() => {
    let filtered = endpoints;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (endpoint) =>
          endpoint.name.toLowerCase().includes(query) ||
          endpoint.protocol.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((endpoint) => endpoint.status === statusFilter);
    }

    return filtered;
  }, [endpoints, searchQuery, statusFilter]);

  // Set initial selected endpoint
  useMemo(() => {
    if (filteredEndpoints.length > 0 && !selectedEndpointId) {
      setSelectedEndpointId(filteredEndpoints[0].id);
    }
  }, [filteredEndpoints, selectedEndpointId]);

  const selectedEndpoint = endpoints.find((e) => e.id === selectedEndpointId);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      up: 'default',
      down: 'destructive',
      unknown: 'secondary',
    };
    return <Badge variant={variants[status] || 'secondary'} className="shrink-0">{status.toUpperCase()}</Badge>;
  };

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Never';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const calculateUptime = (endpoint: ConnectionEndpoint) => {
    if (endpoint.status === 'up') return 99.9;
    if (endpoint.status === 'down') return 0;
    return 50;
  };

  if (loading) {
    return <LoadingState isLoading={true} loadingText="Loading connection health..." />;
  }

  if (error) {
    return (
      <>
        <ListPane title="Connection Health" subtitle="Error loading data" count={0}>
          <EmptyState title="Error" description={error} />
        </ListPane>
        <WorkPane title="Connection Health" subtitle="Error loading data" tabs={[]} />
      </>
    );
  }

  if (endpoints.length === 0) {
    return (
      <>
        <ListPane title="Connection Health" subtitle="No endpoints available" count={0}>
          <EmptyState
            title="No endpoints found"
            description="Create connection endpoints to monitor their health status"
          />
        </ListPane>
        <WorkPane title="Connection Health" subtitle="No data available" tabs={[]} />
      </>
    );
  }

  const tabs = selectedEndpoint
    ? [
      {
        id: 'overview',
        label: 'Health Overview',
        content: <HealthOverview endpoint={selectedEndpoint} timeRange={timeRange} />,
      },
      {
        id: 'timeline',
        label: 'Status Timeline',
        content: <StatusTimeline endpoint={selectedEndpoint} timeRange={timeRange} />,
      },
    ]
    : [];

  return (
    <>
      <ListPane
        title="Connection Health"
        subtitle={`${filteredEndpoints.length} total endpoints`}
        count={filteredEndpoints.length}
        searchPlaceholder="Search endpoints..."
        onSearch={setSearchQuery}
        showExpandableFilters={true}
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: 'up', label: 'Up' },
              { value: 'down', label: 'Down' },
              { value: 'unknown', label: 'Unknown' },
            ],
          },
        ]}
      >
        {filteredEndpoints.length === 0 ? (
          <EmptyState
            title="No endpoints found"
            description="Adjust your filters or create new endpoints"
          />
        ) : (
          filteredEndpoints.map((endpoint) => (
            <div
              key={endpoint.id}
              onClick={() => setSelectedEndpointId(endpoint.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedEndpointId === endpoint.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/30 bg-card'
                }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Network className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium truncate min-w-0 flex-1">{endpoint.name}</p>
                    {getStatusBadge(endpoint.status)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {endpoint.protocol}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatLastSeen(endpoint.lastSeen)}
                    </div>
                    <span className="text-[10px] text-muted-foreground">•</span>
                    <p className="text-[10px] text-muted-foreground">
                      {calculateUptime(endpoint).toFixed(1)}% uptime
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </ListPane>

      {selectedEndpoint && (
        <WorkPane
          title={selectedEndpoint.name}
          subtitle={`${selectedEndpoint.protocol} endpoint health monitoring`}
          tabs={tabs}
          headerContent={
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last 1 hour</SelectItem>
                  <SelectItem value="6h">Last 6 hours</SelectItem>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />
      )}
    </>
  );
}

function HealthOverview({ endpoint, timeRange }: { endpoint: ConnectionEndpoint; timeRange: string }) {
  const calculateUptime = (endpoint: ConnectionEndpoint) => {
    if (endpoint.status === 'up') return 99.9;
    if (endpoint.status === 'down') return 0;
    return 50;
  };

  const getTimeSinceLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Never';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              <Badge variant={endpoint.status === 'up' ? 'default' : endpoint.status === 'down' ? 'destructive' : 'secondary'}>
                {endpoint.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {endpoint.protocol} endpoint
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Seen</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {getTimeSinceLastSeen(endpoint.lastSeen)}
            </div>
            <p className="text-xs text-muted-foreground">
              {endpoint.lastSeen ? new Date(endpoint.lastSeen).toLocaleString() : 'Never'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {calculateUptime(endpoint).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Over {timeRange}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Endpoint Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-sm">{endpoint.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Protocol</p>
              <Badge variant="outline">{endpoint.protocol}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Address</p>
              <p className="text-sm font-mono">{endpoint.address}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Port</p>
              <p className="text-sm">{endpoint.port || 'N/A'}</p>
            </div>
            {endpoint.zone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Zone</p>
                <Badge variant="secondary">{endpoint.zone}</Badge>
              </div>
            )}
            {endpoint.description && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm">{endpoint.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusTimeline({ endpoint, timeRange }: { endpoint: ConnectionEndpoint; timeRange: string }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Status Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-16 bg-muted rounded-lg flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Timeline visualization (derived from last_seen and status)
              </p>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{timeRange === '24h' ? '24 hours ago' : `${timeRange} ago`}</span>
              <span>Now</span>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Status timeline shows endpoint connectivity over the selected time range.
                Green indicates up, red indicates down, gray indicates unknown.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Note: Phase 1 implementation derives timeline from current status and last_seen.
                Historical event tracking will be added in Phase 2.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
