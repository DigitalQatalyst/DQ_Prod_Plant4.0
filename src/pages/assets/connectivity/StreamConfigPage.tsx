/**
 * Stream Config Page
 * Route: /assets/connectivity/streams
 * 
 * Lists stream configs with profile filter.
 * Create/Edit form with polling_interval, retention, profile selection.
 * 
 * Requirements: 4.7, 4.8
 */

import { useState, useEffect, useMemo } from 'react';
import { useDataProvider } from '@/hooks/useDataProvider';
import type { StreamConfig } from '@/types/transmission';
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
import { Plus, Info, Settings } from 'lucide-react';
import { ListPane } from '@/components/layout/ListPane';
import { WorkPane } from '@/components/layout/WorkPane';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

const PROFILES = ['high-frequency', 'standard', 'low-frequency'] as const;
const RETENTIONS = ['7d', '30d', '90d', '1y'] as const;

const PROFILE_DEFAULTS: Record<string, { pollingInterval: number; retention: string }> = {
  'high-frequency': { pollingInterval: 1000, retention: '7d' },
  'standard': { pollingInterval: 15000, retention: '30d' },
  'low-frequency': { pollingInterval: 300000, retention: '90d' },
};

export default function StreamConfigPage() {
  const { provider } = useDataProvider();
  const [tenantId, setTenantId] = useState<string>('');
  const [configs, setConfigs] = useState<StreamConfig[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [profileFilter, setProfileFilter] = useState<string>('all');

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<StreamConfig>>({});
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

  // Load stream configs
  useEffect(() => {
    if (!tenantId) return;

    const loadConfigs = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await provider.getStreamConfigsByTenant(tenantId, {
          limit: 100,
          offset: 0,
        });
        setConfigs(result.data);
        setTotal(result.total);
        if (result.data.length > 0 && !selectedConfigId) {
          setSelectedConfigId(result.data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stream configs');
      } finally {
        setLoading(false);
      }
    };

    loadConfigs();
  }, [provider, tenantId]);

  // Filter configs
  const filteredConfigs = useMemo(() => {
    let filtered = configs;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (config) =>
          config.name.toLowerCase().includes(query) ||
          config.description?.toLowerCase().includes(query)
      );
    }

    if (profileFilter !== 'all') {
      filtered = filtered.filter((config) => config.profile === profileFilter);
    }

    return filtered;
  }, [configs, searchQuery, profileFilter]);

  // Set initial selected config
  useMemo(() => {
    if (filteredConfigs.length > 0 && !selectedConfigId) {
      setSelectedConfigId(filteredConfigs[0].id);
    }
  }, [filteredConfigs, selectedConfigId]);

  const selectedConfig = configs.find((c) => c.id === selectedConfigId);

  const handleCreate = () => {
    setFormData({
      tenantId,
      name: '',
      pollingInterval: 15000,
      retention: '30d',
      profile: 'standard',
      assetTypes: [],
      isSandbox: false,
      description: '',
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleProfileChange = (profile: string) => {
    const defaults = PROFILE_DEFAULTS[profile];
    setFormData({
      ...formData,
      profile: profile as 'high-frequency' | 'standard' | 'low-frequency',
      pollingInterval: defaults.pollingInterval,
      retention: defaults.retention as '7d' | '30d' | '90d' | '1y',
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      errors.name = 'Name is required';
    }
    if (!formData.pollingInterval || formData.pollingInterval < 100) {
      errors.pollingInterval = 'Polling interval must be at least 100ms';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await provider.createStreamConfig(formData as Omit<StreamConfig, 'id' | 'createdAt'>);
      setDialogOpen(false);
      // Reload configs
      const result = await provider.getStreamConfigsByTenant(tenantId, {
        limit: 100,
        offset: 0,
      });
      setConfigs(result.data);
      setTotal(result.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create stream config';
      if (message.includes('already exists')) {
        setFormErrors({ name: message });
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getProfileBadge = (profile: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      'high-frequency': 'default',
      'standard': 'secondary',
      'low-frequency': 'outline',
    };
    return <Badge variant={variants[profile] || 'secondary'} className="shrink-0">{profile}</Badge>;
  };

  const formatPollingInterval = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${ms / 1000}s`;
    return `${ms / 60000}m`;
  };

  if (loading) {
    return <LoadingState isLoading={true} loadingText="Loading stream configs..." />;
  }

  if (error) {
    return (
      <>
        <ListPane title="Stream Configuration" subtitle="Error loading data" count={0}>
          <EmptyState title="Error" description={error} />
        </ListPane>
        <WorkPane title="Stream Configuration" subtitle="Error loading data" tabs={[]} />
      </>
    );
  }

  const tabs = selectedConfig
    ? [
      {
        id: 'details',
        label: 'Configuration Details',
        content: <ConfigDetails config={selectedConfig} />,
      },
      {
        id: 'profiles',
        label: 'Profile Information',
        content: <ProfileInfo />,
      },
    ]
    : [];

  return (
    <>
      <ListPane
        title="Stream Configuration"
        subtitle={`${filteredConfigs.length} total configurations`}
        count={filteredConfigs.length}
        searchPlaceholder="Search configs..."
        onSearch={setSearchQuery}
        showExpandableFilters={true}
        filters={[
          {
            key: 'profile',
            label: 'Profile',
            value: profileFilter,
            onChange: setProfileFilter,
            options: [
              { value: 'all', label: 'All Profiles' },
              ...PROFILES.map((p) => ({ value: p, label: p })),
            ],
          },
        ]}
        actions={
          <Button onClick={handleCreate} size="sm" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Create Config
          </Button>
        }
      >
        {filteredConfigs.length === 0 ? (
          <EmptyState
            title="No configs found"
            description="Create your first stream config to define data collection policies"
          />
        ) : (
          filteredConfigs.map((config) => (
            <div
              key={config.id}
              onClick={() => setSelectedConfigId(config.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedConfigId === config.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/30 bg-card'
                }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium truncate min-w-0 flex-1">{config.name}</p>
                    {getProfileBadge(config.profile)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {formatPollingInterval(config.pollingInterval)} • {config.retention}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {config.isSandbox && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                        SANDBOX
                      </Badge>
                    )}
                    {config.assetTypes.length > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        {config.assetTypes.length} asset types
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </ListPane>

      {selectedConfig && (
        <WorkPane
          title={selectedConfig.name}
          subtitle={`${selectedConfig.profile} stream configuration`}
          tabs={tabs}
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Stream Config</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Critical Protection Monitoring"
              />
              {formErrors.name && (
                <p className="text-sm text-destructive mt-1">{formErrors.name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="profile">Profile *</Label>
              <Select value={formData.profile} onValueChange={handleProfileChange}>
                <SelectTrigger id="profile">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROFILES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Selecting a profile will set default polling interval and retention
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pollingInterval">Polling Interval (ms) *</Label>
                <Input
                  id="pollingInterval"
                  type="number"
                  min="100"
                  value={formData.pollingInterval || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, pollingInterval: parseInt(e.target.value) || 0 })
                  }
                  placeholder="15000"
                />
                {formErrors.pollingInterval && (
                  <p className="text-sm text-destructive mt-1">{formErrors.pollingInterval}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Minimum 100ms</p>
              </div>
              <div>
                <Label htmlFor="retention">Retention *</Label>
                <Select
                  value={formData.retention}
                  onValueChange={(value) => setFormData({ ...formData, retention: value as '7d' | '30d' | '90d' | '1y' })}
                >
                  <SelectTrigger id="retention">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RETENTIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
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
                placeholder="High-frequency monitoring for critical protection devices"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isSandbox"
                checked={formData.isSandbox}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isSandbox: checked as boolean })
                }
              />
              <Label htmlFor="isSandbox" className="text-sm font-normal">
                Sandbox stream (simulated data for demo/testing)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Config'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ConfigDetails({ config }: { config: StreamConfig }) {
  const formatPollingInterval = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${ms / 1000}s`;
    return `${ms / 60000}m`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuration Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-sm">{config.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Profile</p>
              <Badge variant="outline">{config.profile}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Polling Interval</p>
              <p className="text-sm">{formatPollingInterval(config.pollingInterval)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Retention</p>
              <Badge variant="outline">{config.retention}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Asset Types</p>
              <p className="text-sm">
                {config.assetTypes.length > 0 ? `${config.assetTypes.length} types` : 'All types'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sandbox Mode</p>
              {config.isSandbox ? (
                <Badge variant="secondary">SANDBOX</Badge>
              ) : (
                <p className="text-sm">Production</p>
              )}
            </div>
            {config.description && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm">{config.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileInfo() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Stream Profiles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <Badge className="mb-2">high-frequency</Badge>
              <p className="text-sm text-muted-foreground">
                Polling ≤ 1000ms, Retention 7 days
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                For critical protection devices requiring real-time monitoring
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <Badge variant="secondary" className="mb-2">
                standard
              </Badge>
              <p className="text-sm text-muted-foreground">
                Polling 5-60s, Retention 30 days
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                For operational assets with regular monitoring needs
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <Badge variant="outline" className="mb-2">
                low-frequency
              </Badge>
              <p className="text-sm text-muted-foreground">
                Polling &gt; 60s, Retention 90+ days
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                For environmental monitoring and long-term trend analysis
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
