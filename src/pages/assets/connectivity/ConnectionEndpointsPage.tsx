/**
 * Connection Endpoints Page
 * Route: /assets/connectivity/endpoints
 * 
 * Lists connection endpoints with pagination, filtering by protocol/status/zone, and sorting.
 * Supports create/edit with validation.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.11
 */

import { useState, useEffect, useMemo } from 'react';
import { useDataProvider } from '@/hooks/useDataProvider';
import type { ConnectionEndpoint } from '@/types/transmission';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Network, Clock } from 'lucide-react';
import { ListPane } from '@/components/layout/ListPane';
import { WorkPane } from '@/components/layout/WorkPane';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const PROTOCOLS = ['IEC61850', 'DNP3', 'OPC-UA', 'Modbus-TCP', 'MQTT'] as const;
const ZONES = ['IT', 'OT', 'DMZ'] as const;
const STATUSES = ['up', 'down', 'unknown'] as const;

export default function ConnectionEndpointsPage() {
  const { provider } = useDataProvider();
  const [tenantId, setTenantId] = useState<string>('');
  const [endpoints, setEndpoints] = useState<ConnectionEndpoint[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<ConnectionEndpoint>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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
        setTotal(result.total);
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
          endpoint.address.toLowerCase().includes(query) ||
          endpoint.description?.toLowerCase().includes(query)
      );
    }

    if (protocolFilter !== 'all') {
      filtered = filtered.filter((endpoint) => endpoint.protocol === protocolFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((endpoint) => endpoint.status === statusFilter);
    }

    if (zoneFilter !== 'all') {
      filtered = filtered.filter((endpoint) => endpoint.zone === zoneFilter);
    }

    return filtered;
  }, [endpoints, searchQuery, protocolFilter, statusFilter, zoneFilter]);

  // Set initial selected endpoint
  useMemo(() => {
    if (filteredEndpoints.length > 0 && !selectedEndpointId) {
      setSelectedEndpointId(filteredEndpoints[0].id);
    }
  }, [filteredEndpoints, selectedEndpointId]);

  const selectedEndpoint = endpoints.find((e) => e.id === selectedEndpointId);

  const handleCreate = () => {
    setFormData({
      tenantId,
      name: '',
      protocol: 'IEC61850',
      address: '',
      port: undefined,
      zone: undefined,
      status: 'unknown',
      description: '',
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      errors.name = 'Name is required';
    }
    if (!formData.address?.trim()) {
      errors.address = 'Address is required';
    }
    if (formData.port !== undefined && (formData.port < 1 || formData.port > 65535)) {
      errors.port = 'Port must be between 1 and 65535';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await provider.createConnectionEndpoint(formData as Omit<ConnectionEndpoint, 'id' | 'createdAt'>);
      setDialogOpen(false);
      // Reload endpoints
      const result = await provider.getTransmissionConnectionEndpointsByTenant(tenantId, {
        limit: 100,
        offset: 0,
      });
      setEndpoints(result.data);
      setTotal(result.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create endpoint';
      if (message.includes('already exists')) {
        setFormErrors({ name: message });
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      up: 'default',
      down: 'destructive',
      unknown: 'secondary',
    };
    return <Badge variant={variants[status] || 'secondary'} className="shrink-0">{status}</Badge>;
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

  if (loading) {
    return <LoadingState isLoading={true} loadingText="Loading connection endpoints..." />;
  }

  if (error) {
    return (
      <>
        <ListPane title="Connection Endpoints" subtitle="Error loading data" count={0}>
          <EmptyState title="Error" description={error} />
        </ListPane>
        <WorkPane title="Connection Endpoints" subtitle="Error loading data" tabs={[]} />
      </>
    );
  }

  const tabs = selectedEndpoint
    ? [
      {
        id: 'details',
        label: 'Endpoint Details',
        content: <EndpointDetails endpoint={selectedEndpoint} />,
      },
      {
        id: 'configuration',
        label: 'Configuration',
        content: <EndpointConfiguration endpoint={selectedEndpoint} />,
      },
    ]
    : [];

  return (
    <>
      <ListPane
        title="Connection Endpoints"
        subtitle={`${filteredEndpoints.length} total endpoints`}
        count={filteredEndpoints.length}
        searchPlaceholder="Search endpoints..."
        onSearch={setSearchQuery}
        showExpandableFilters={true}
        filters={[
          {
            key: 'protocol',
            label: 'Protocol',
            value: protocolFilter,
            onChange: setProtocolFilter,
            options: [
              { value: 'all', label: 'All Protocols' },
              ...PROTOCOLS.map((p) => ({ value: p, label: p })),
            ],
          },
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'All Statuses' },
              ...STATUSES.map((s) => ({ value: s, label: s })),
            ],
          },
          {
            key: 'zone',
            label: 'Zone',
            value: zoneFilter,
            onChange: setZoneFilter,
            options: [
              { value: 'all', label: 'All Zones' },
              ...ZONES.map((z) => ({ value: z, label: z })),
            ],
          },
        ]}
        actions={
          <Button onClick={handleCreate} size="sm" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Create Endpoint
          </Button>
        }
      >
        {filteredEndpoints.length === 0 ? (
          <EmptyState
            title="No endpoints found"
            description="Create your first endpoint to start collecting data"
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
                    {endpoint.protocol} • {endpoint.address}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {endpoint.zone && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                        {endpoint.zone}
                      </Badge>
                    )}
                    {endpoint.lastSeen && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatLastSeen(endpoint.lastSeen)}
                      </div>
                    )}
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
          subtitle={`${selectedEndpoint.protocol} endpoint`}
          tabs={tabs}
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Connection Endpoint</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="IED Gateway Primary"
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive mt-1">{formErrors.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="protocol">Protocol *</Label>
                <Select
                  value={formData.protocol}
                  onValueChange={(value) => setFormData({ ...formData, protocol: value as any })}
                >
                  <SelectTrigger id="protocol">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROTOCOLS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="10.20.30.100 or opc.tcp://host:port"
                />
                {formErrors.address && (
                  <p className="text-sm text-destructive mt-1">{formErrors.address}</p>
                )}
              </div>
              <div>
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  min="1"
                  max="65535"
                  value={formData.port || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, port: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                  placeholder="102"
                />
                {formErrors.port && (
                  <p className="text-sm text-destructive mt-1">{formErrors.port}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zone">Zone</Label>
                <Select
                  value={formData.zone || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, zone: (value === 'none' ? undefined : value) as 'IT' | 'OT' | 'DMZ' | undefined })}
                >
                  <SelectTrigger id="zone">
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {ZONES.map((z) => (
                      <SelectItem key={z} value={z}>
                        {z}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as 'up' | 'down' | 'unknown' })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Primary IED gateway for substation protection devices"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Endpoint'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EndpointDetails({ endpoint }: { endpoint: ConnectionEndpoint }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Endpoint Information</CardTitle>
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
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={endpoint.status === 'up' ? 'default' : endpoint.status === 'down' ? 'destructive' : 'secondary'}>
                {endpoint.status}
              </Badge>
            </div>
            {endpoint.lastSeen && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Last Seen</p>
                <p className="text-sm">{new Date(endpoint.lastSeen).toLocaleString()}</p>
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

function EndpointConfiguration({ endpoint }: { endpoint: ConnectionEndpoint }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connection Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Protocol Settings</p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-mono">Protocol: {endpoint.protocol}</p>
                <p className="text-sm font-mono">Address: {endpoint.address}</p>
                {endpoint.port && <p className="text-sm font-mono">Port: {endpoint.port}</p>}
              </div>
            </div>
            {endpoint.zone && (
              <div>
                <p className="text-sm font-medium mb-2">Security Zone</p>
                <Badge variant="secondary">{endpoint.zone}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
