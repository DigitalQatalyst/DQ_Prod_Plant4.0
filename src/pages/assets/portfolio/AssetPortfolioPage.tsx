/**
 * AssetPortfolioPage Component
 * 
 * Route: /assets/portfolio
 * 
 * Displays asset portfolio with KPI cards, filtering, pagination, and sorting.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState';
import {
  Activity,
  Zap,
  AlertCircle,
  Wrench,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  X,
  ExternalLink
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ListPane } from '@/components/layout/ListPane';
import { WorkPane } from '@/components/layout/WorkPane';
import { KPICard } from '@/components/shared/KPICard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useDataProvider } from '@/hooks/useDataProvider';
import type {
  TransmissionAsset,
  PortfolioKpis,
  AssetFilter,
  PaginationParams,
  SortParams
} from '@/types/transmission';

interface AssetWithDetails extends TransmissionAsset {
  siteName?: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;

export function AssetPortfolioPage() {
  const { provider } = useDataProvider();
  const navigate = useNavigate();


  // State
  const [tenantId, setTenantId] = useState<string>('');
  const [assets, setAssets] = useState<AssetWithDetails[]>([]);
  const [kpis, setKpis] = useState<PortfolioKpis | null>(null);
  const [sites, setSites] = useState<Array<{ id: string; name: string }>>([]);
  const [assetTypes, setAssetTypes] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetWithDetails | null>(null);

  // Filter state
  const [filters, setFilters] = useState<AssetFilter>({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalAssets, setTotalAssets] = useState(0);

  // Sort state
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [searchParams] = useSearchParams();
  const assetIdFromUrl = searchParams.get('assetId');



  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get default transmission tenant
      const defaultTenantId = await provider.getDefaultTransmissionTenantId();
      setTenantId(defaultTenantId);

      // Load sites and asset types for filters
      const [sitesData, assetTypesData] = await Promise.all([
        provider.getSitesByTenant(defaultTenantId),
        provider.getAssetTypesByTenant(defaultTenantId)
      ]);

      setSites(sitesData);
      setAssetTypes(assetTypesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  }, [provider]);

  const loadAssets = useCallback(async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      setError(null);

      // Get all assets for the tenant (we'll filter client-side for now)
      const allAssets = await provider.getTransmissionAssetsByTenant(tenantId);

      // Apply filters
      let filteredAssets = allAssets;

      if (filters.siteId) {
        filteredAssets = filteredAssets.filter(asset => asset.siteId === filters.siteId);
      }

      if (filters.assetTypeId) {
        filteredAssets = filteredAssets.filter(asset => asset.assetTypeId === filters.assetTypeId);
      }

      if (filters.status) {
        filteredAssets = filteredAssets.filter(asset => asset.status === filters.status);
      }

      if (filters.criticality) {
        filteredAssets = filteredAssets.filter(asset => asset.criticality === filters.criticality);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredAssets = filteredAssets.filter(asset =>
          asset.name.toLowerCase().includes(searchLower)
        );
      }

      // Apply sorting
      filteredAssets.sort((a, b) => {
        let aValue: string | number = '';
        let bValue: string | number = '';

        switch (sortBy) {
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          case 'criticality': {
            const criticalityOrder: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
            aValue = criticalityOrder[a.criticality] || 0;
            bValue = criticalityOrder[b.criticality] || 0;
            break;
          }
          case 'siteName': {
            const aSite = sites.find(s => s.id === a.siteId);
            const bSite = sites.find(s => s.id === b.siteId);
            aValue = aSite?.name || '';
            bValue = bSite?.name || '';
            break;
          }
          default:
            aValue = a.name;
            bValue = b.name;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDir === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        } else {
          return sortDir === 'asc'
            ? (aValue as number) - (bValue as number)
            : (bValue as number) - (aValue as number);
        }
      });

      // Apply pagination
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedAssets = filteredAssets.slice(startIndex, endIndex);

      // Enrich with site and asset type names
      const enrichedAssets: AssetWithDetails[] = paginatedAssets.map(asset => ({
        ...asset,
        siteName: sites.find(s => s.id === asset.siteId)?.name,
        assetTypeName: assetTypes.find(t => t.id === asset.assetTypeId)?.name || asset.assetTypeName
      }));

      setAssets(enrichedAssets);
      setTotalAssets(filteredAssets.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, [tenantId, provider, filters, sortBy, sortDir, sites, assetTypes, currentPage, pageSize]);

  const loadKpis = useCallback(async () => {
    if (!tenantId) return;

    try {
      const kpisData = await provider.getAssetPortfolioKpis(tenantId, filters);
      setKpis(kpisData);
    } catch (err) {
      console.error('Failed to load KPIs:', err);
    }
  }, [tenantId, provider, filters]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load assets when filters, pagination, or sorting changes
  useEffect(() => {
    if (tenantId) {
      loadAssets();
      loadKpis();
    }
  }, [tenantId, filters, currentPage, pageSize, sortBy, sortDir, loadAssets, loadKpis]);

  // Effect for auto-selecting asset from URL
  useEffect(() => {
    if (assetIdFromUrl && assets.length > 0) {
      const asset = assets.find(a => a.id === assetIdFromUrl);
      if (asset) {
        setSelectedAsset(asset);
      }
    }
  }, [assetIdFromUrl, assets]);

  const handleFilterChange = (key: keyof AssetFilter, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: (value === 'all' || !value) ? undefined : value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalAssets / pageSize);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'online': return 'default';
      case 'offline': return 'destructive';
      case 'maintenance': return 'secondary';
      default: return 'outline';
    }
  };

  const getCriticalityBadgeVariant = (criticality: string) => {
    switch (criticality) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  if (loading && !kpis) {
    return <LoadingState />;
  }

  const filterConfigs = [
    {
      key: 'site',
      label: 'Site',
      value: filters.siteId || 'all',
      onChange: (val: string) => handleFilterChange('siteId', val),
      options: [{ value: 'all', label: 'All Sites' }, ...sites.map(s => ({ value: s.id, label: s.name }))],
    },
    {
      key: 'assetType',
      label: 'Asset Type',
      value: filters.assetTypeId || 'all',
      onChange: (val: string) => handleFilterChange('assetTypeId', val),
      options: [{ value: 'all', label: 'All Types' }, ...assetTypes.map(t => ({ value: t.id, label: t.name }))],
    },
    {
      key: 'status',
      label: 'Status',
      value: filters.status || 'all',
      onChange: (val: string) => handleFilterChange('status', val),
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'online', label: 'Online' },
        { value: 'offline', label: 'Offline' },
        { value: 'maintenance', label: 'Maintenance' },
      ],
    },
    {
      key: 'criticality',
      label: 'Criticality',
      value: filters.criticality || 'all',
      onChange: (val: string) => handleFilterChange('criticality', val),
      options: [
        { value: 'all', label: 'All Levels' },
        { value: 'critical', label: 'Critical' },
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' },
      ],
    },
  ];

  const ListActions = (
    <div className="flex items-center justify-between w-full mt-2">
      <Button variant="outline" size="sm" onClick={clearFilters} className="h-7 text-xs">
        Clear Filters
      </Button>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          <span className="sr-only">Previous Page</span>
          &lt;
        </Button>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {currentPage} / {totalPages || 1}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          <span className="sr-only">Next Page</span>
          &gt;
        </Button>
      </div>
    </div>
  );

  const tabs = [
    {
      id: "overview",
      label: "Portfolio Overview",
      content: (
        <div className="space-y-6">
          {kpis && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <KPICard
                title="Total Assets"
                value={kpis.totalAssets}
                icon={Activity}
                variant="default"
              />
              <KPICard
                title="Online"
                value={kpis.onlineAssets}
                icon={Zap}
                variant="success"
              />
              <KPICard
                title="Offline"
                value={kpis.offlineAssets}
                icon={AlertCircle}
                variant="destructive"
              />
              <KPICard
                title="Maintenance"
                value={kpis.maintenanceAssets}
                icon={Wrench}
                variant="warning"
              />
              <KPICard
                title="Critical Alerts"
                value={kpis.criticalAlerts}
                icon={AlertTriangle}
                variant="destructive"
              />
              <KPICard
                title="Warning Alerts"
                value={kpis.warningAlerts}
                icon={Info}
                variant="warning"
              />
            </div>
          )}

          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Health Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              {[
                { label: "Healthy", value: kpis ? Math.round((kpis.onlineAssets / (kpis.totalAssets || 1)) * 100) : 0, color: "bg-green-500" },
                { label: "Warning", value: kpis ? Math.round((kpis.warningAlerts / (kpis.totalAssets || 1)) * 100) : 0, color: "bg-yellow-500" },
                { label: "Critical", value: kpis ? Math.round((kpis.criticalAlerts / (kpis.totalAssets || 1)) * 100) : 0, color: "bg-red-500" },
                { label: "Offline", value: kpis ? Math.round((kpis.offlineAssets / (kpis.totalAssets || 1)) * 100) : 0, color: "bg-gray-500" },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-foreground">{item.value}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all duration-1000", item.color)}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ),
    },
  ];

  if (selectedAsset) {
    tabs.push({
      id: "details",
      label: "Asset Details",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">General Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground">Entity ID:</span>
                  <span className="text-sm font-medium">{selectedAsset.id}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <span className="text-sm font-medium">{selectedAsset.assetTypeName}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground">Site:</span>
                  <span className="text-sm font-medium">{selectedAsset.siteName}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <StatusBadge status={selectedAsset.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Criticality:</span>
                  <StatusBadge status={selectedAsset.criticality} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Monitoring</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground">Active Alerts:</span>
                  <span className="text-sm font-medium">0</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground">Uptime (30d):</span>
                  <span className="text-sm font-medium">99.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Last Communication:</span>
                  <span className="text-sm font-medium">{new Date().toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/assets/detail/360/${selectedAsset.id}`)}>
              View Context
            </Button>
          </div>
        </div>
      ),
    });
  }

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane
        title="Asset Portfolio"
        subtitle={`${totalAssets} total assets`}
        count={totalAssets}
        searchPlaceholder="Filter assets..."
        onSearch={(val) => handleFilterChange('search', val)}
        showExpandableFilters={true}
        filters={filterConfigs}
        actions={ListActions}
      >
        {loading && assets.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No assets match filters
          </div>
        ) : (
          <div className="space-y-1">
            {assets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all",
                  selectedAsset?.id === asset.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/30 bg-card/50"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-medium leading-none mb-1">{asset.name}</h3>
                    <p className="text-[10px] text-muted-foreground">
                      {asset.assetTypeName} • {asset.siteName}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={asset.status} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <StatusBadge status={asset.criticality} />
                  <span className="text-[10px] text-muted-foreground font-mono">{asset.id.slice(0, 8)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ListPane>

      <WorkPane
        key={selectedAsset?.id || 'portfolio'}
        title={selectedAsset ? selectedAsset.name : "Portfolio Summary"}
        subtitle={selectedAsset ? `${selectedAsset.assetTypeName} • ${selectedAsset.siteName}` : "Overview of all assets in the portfolio"}
        tabs={tabs}
        defaultTab={selectedAsset ? "details" : "overview"}
      />
    </div>
  );
}
