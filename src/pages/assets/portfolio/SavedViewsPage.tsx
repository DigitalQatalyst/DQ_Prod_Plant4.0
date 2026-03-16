/**
 * SavedViewsPage Component
 * 
 * Route: /assets/portfolio/views
 * 
 * List saved views with name, description, created_at
 * Create form with name uniqueness validation
 * Apply view action populates filters on AssetPortfolioPage
 * Delete view action
 * Requirements: 3.7, 3.8
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { KPICard } from '@/components/shared/KPICard';
import { ListPane } from '@/components/layout/ListPane';
import { WorkPane } from '@/components/layout/WorkPane';
import { cn } from '@/lib/utils';
import {
  Save,
  X,
  Search,
  Filter,
  Eye,
  Calendar,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Building2,
  Database,
  TrendingUp,
  Activity
} from "lucide-react";
import { useDataProvider } from '@/hooks/useDataProvider';
import type {
  SavedView,
  AssetFilter
} from '@/types/transmission';

interface NewViewForm {
  name: string;
  description: string;
  filters: AssetFilter;
}

interface Site {
  id: string;
  name: string;
}

interface AssetType {
  id: string;
  name: string;
  code: string;
}

export function SavedViewsPage() {
  const { provider } = useDataProvider();
  const navigate = useNavigate();

  // State
  const [tenantId, setTenantId] = useState<string>('');
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingView, setEditingView] = useState<SavedView | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<NewViewForm>({
    name: '',
    description: '',
    filters: {}
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');



  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get default transmission tenant
      const defaultTenantId = await provider.getDefaultTransmissionTenantId();
      setTenantId(defaultTenantId);

      // Load data in parallel
      const [savedViewsData, sitesData, assetTypesData] = await Promise.all([
        provider.getSavedViewsByTenant(defaultTenantId),
        provider.getSitesByTenant(defaultTenantId),
        provider.getAssetTypesByTenant(defaultTenantId)
      ]);

      setSavedViews(savedViewsData.data);
      setSites(sitesData);
      setAssetTypes(assetTypesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [provider]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateView = () => {
    setEditingView(null);
    setFormData({
      name: '',
      description: '',
      filters: {}
    });
    setFormErrors({});
    setIsCreateDialogOpen(true);
  };

  const handleEditView = (view: SavedView) => {
    setEditingView(view);
    setFormData({
      name: view.name,
      description: view.description || '',
      filters: view.filters
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'View name is required';
    } else if (formData.name.length < 3) {
      errors.name = 'View name must be at least 3 characters';
    } else {
      // Check for name uniqueness (excluding current view when editing)
      const existingView = savedViews.find(v =>
        v.name.toLowerCase() === formData.name.toLowerCase() &&
        v.id !== editingView?.id
      );
      if (existingView) {
        errors.name = 'A view with this name already exists';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveView = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError(null);

      if (editingView) {
        // Update existing view
        const updatedView = await provider.createSavedView({
          tenantId,
          name: formData.name,
          description: formData.description,
          filters: formData.filters
        });

        setSavedViews(prev => prev.map(v => v.id === editingView.id ? updatedView : v));
        setIsEditDialogOpen(false);
      } else {
        // Create new view
        const newView = await provider.createSavedView({
          tenantId,
          name: formData.name,
          description: formData.description,
          filters: formData.filters
        });

        setSavedViews(prev => [...prev, newView]);
        setIsCreateDialogOpen(false);
      }

      setEditingView(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save view');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteView = async (view: SavedView) => {
    if (!confirm(`Are you sure you want to delete the view "${view.name}"?`)) {
      return;
    }

    try {
      setError(null);
      await provider.deleteSavedView(view.id);
      setSavedViews(prev => prev.filter(v => v.id !== view.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete view');
    }
  };

  const handleApplyView = (view: SavedView) => {
    // Navigate to AssetPortfolioPage with filters applied via URL params
    const params = new URLSearchParams();

    if (view.filters.siteId) params.set('siteId', view.filters.siteId);
    if (view.filters.assetTypeId) params.set('assetTypeId', view.filters.assetTypeId);
    if (view.filters.status) params.set('status', view.filters.status);
    if (view.filters.criticality) params.set('criticality', view.filters.criticality);
    if (view.filters.search) params.set('search', view.filters.search);

    navigate(`/assets/portfolio?${params.toString()}`);
  };

  const updateFormFilters = (key: keyof AssetFilter, value: string) => {
    setFormData(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [key]: value || undefined
      }
    }));
  };

  const getFilterSummary = (filters: AssetFilter): string => {
    const parts: string[] = [];

    if (filters.siteId) {
      const site = sites.find(s => s.id === filters.siteId);
      if (site) parts.push(site.name);
    }

    if (filters.assetTypeId) {
      const type = assetTypes.find(t => t.id === filters.assetTypeId);
      if (type) parts.push(type.name);
    }

    if (filters.status) parts.push(`${filters.status} status`);
    if (filters.criticality) parts.push(`${filters.criticality} criticality`);
    if (filters.search) parts.push(`"${filters.search}"`);

    return parts.length > 0 ? parts.join(' • ') : 'No filters';
  };

  const filteredViews = useMemo(() => {
    return savedViews.filter(view =>
      view.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (view.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [savedViews, searchQuery]);

  const selectedView = savedViews.find(v => v.id === selectedViewId);

  if (loading) {
    return <LoadingState />;
  }

  const tabs = [
    {
      id: "overview",
      label: selectedView ? "View Details" : "Summary",
      content: (
        <div className="space-y-6">
          {!selectedView ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                  title="Total Presets"
                  value={savedViews.length}
                  icon={Save}
                  variant="primary"
                />
                <KPICard
                  title="Most Recent"
                  value={savedViews.length > 0 ? new Date(Math.max(...savedViews.map(v => new Date(v.createdAt).getTime()))).toLocaleDateString() : 'N/A'}
                  icon={Calendar}
                  variant="default"
                />
                <KPICard
                  title="Shared Context"
                  value="Enterprise"
                  icon={Building2}
                  variant="default"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Getting Started</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Saved views allow you to quickly apply frequently used filters to your asset portfolio.
                    You can create views for specific regions, asset types, or status combinations.
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                      <div className="text-sm">Select a view from the left pane to see its details and filters.</div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                      <div className="text-sm">Click "Apply View" to navigate to the portfolio with those filters.</div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
                      <div className="text-sm">Use the "Create" button in the list pane to save your current setup.</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Information</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-xs text-muted-foreground uppercase">Description</span>
                      <p className="mt-1">{selectedView.description || 'No description provided.'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground uppercase">Created At</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(selectedView.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-sm">Filter Summary</CardTitle></CardHeader>
                  <CardContent>
                    <div className="p-3 bg-muted/50 rounded-lg text-sm italic">
                      {getFilterSummary(selectedView.filters)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle className="text-sm">Filter Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(selectedView.filters).map(([key, value]) => {
                      if (!value) return null;
                      return (
                        <div key={key} className="flex flex-col p-3 border rounded-lg">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">{key}</span>
                          <span className="text-sm font-medium">{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )
    }
  ];

  const actions = selectedView && (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleApplyView(selectedView)}
        className="gap-2"
      >
        <Eye className="h-4 w-4" />
        Apply View
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleEditView(selectedView)}
        className="gap-2"
      >
        <Edit className="h-4 w-4" />
        Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleDeleteView(selectedView)}
        className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
    </div>
  );

  return (
    <>
      {error && (
        <div className="absolute top-4 right-4 z-[100] max-w-md animate-in slide-in-from-top-2">
          <Card className="border-destructive bg-destructive/10 text-destructive">
            <CardContent className="p-3 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Error Occurred</p>
                <p className="text-xs opacity-90">{error}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-1 -mt-1 hover:bg-destructive/20"
                onClick={() => setError(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <ListPane
        title="Saved Views"
        subtitle={`${savedViews.length} presets available`}
        count={savedViews.length}
        searchPlaceholder="Filter views..."
        onSearch={(val) => setSearchQuery(val)}
        actions={
          <Button onClick={handleCreateView} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Create
          </Button>
        }
      >
        <div className="space-y-1">
          {filteredViews.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-sm">No views found</p>
            </div>
          ) : (
            filteredViews.map(view => (
              <div
                key={view.id}
                onClick={() => setSelectedViewId(view.id)}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all",
                  selectedViewId === view.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/30 bg-card/50"
                )}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-sm font-medium leading-none truncate pr-2">{view.name}</h3>
                  <Badge variant="outline" className="text-[9px] h-3.5 px-1 whitespace-nowrap">
                    {new Date(view.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-1">
                  {view.description || 'No description'}
                </p>
                <div className="mt-2 flex items-center gap-1.5 overflow-hidden">
                  <Filter className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-[9px] text-muted-foreground truncate italic" title={getFilterSummary(view.filters)}>
                    {getFilterSummary(view.filters)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </ListPane>

      <WorkPane
        title={selectedView ? selectedView.name : "Saved View Portfolio"}
        subtitle={selectedView ? "View and manage filter preset" : "Manage your saved asset portfolio filter presets"}
        tabs={tabs}
        actions={actions}
      />

      {/* Create View Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Saved View</DialogTitle>
            <DialogDescription>
              Save your current filters to easily access this view later.
            </DialogDescription>
          </DialogHeader>
          <ViewForm
            formData={formData}
            setFormData={setFormData}
            formErrors={formErrors}
            sites={sites}
            assetTypes={assetTypes}
            onSave={handleSaveView}
            onCancel={() => setIsCreateDialogOpen(false)}
            submitting={submitting}
            updateFormFilters={updateFormFilters}
          />
        </DialogContent>
      </Dialog>

      {/* Edit View Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Saved View</DialogTitle>
            <DialogDescription>
              Update the name, description, or filters for this saved view.
            </DialogDescription>
          </DialogHeader>
          <ViewForm
            formData={formData}
            setFormData={setFormData}
            formErrors={formErrors}
            sites={sites}
            assetTypes={assetTypes}
            onSave={handleSaveView}
            onCancel={() => setIsEditDialogOpen(false)}
            submitting={submitting}
            updateFormFilters={updateFormFilters}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ViewFormProps {
  formData: NewViewForm;
  setFormData: (data: NewViewForm) => void;
  formErrors: Record<string, string>;
  sites: Site[];
  assetTypes: AssetType[];
  onSave: () => void;
  onCancel: () => void;
  submitting: boolean;
  updateFormFilters: (key: keyof AssetFilter, value: string) => void;
}

function ViewForm({
  formData,
  setFormData,
  formErrors,
  sites,
  assetTypes,
  onSave,
  onCancel,
  submitting,
  updateFormFilters
}: ViewFormProps) {
  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">View Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter view name..."
            className={formErrors.name ? 'border-red-500' : ''}
          />
          {formErrors.name && (
            <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe this view..."
            rows={3}
          />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Site</Label>
              <Select
                value={formData.filters.siteId || 'all'}
                onValueChange={(value) => updateFormFilters('siteId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select site..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  {sites.map(site => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Asset Type</Label>
              <Select
                value={formData.filters.assetTypeId || 'all'}
                onValueChange={(value) => updateFormFilters('assetTypeId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {assetTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={formData.filters.status || 'all'}
                onValueChange={(value) => updateFormFilters('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Criticality</Label>
              <Select
                value={formData.filters.criticality || 'all'}
                onValueChange={(value) => updateFormFilters('criticality', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select criticality..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label>Search Text</Label>
              <Input
                value={formData.filters.search || ''}
                onChange={(e) => updateFormFilters('search', e.target.value)}
                placeholder="Search assets by name..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={onSave} disabled={submitting} className="gap-2">
          <Save className="w-4 h-4" />
          {submitting ? 'Saving...' : 'Save View'}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={submitting} className="gap-2">
          <X className="w-4 h-4" />
          Cancel
        </Button>
      </div>
    </div>
  );
}