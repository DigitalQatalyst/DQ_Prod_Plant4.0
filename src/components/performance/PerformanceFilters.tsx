import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Filter,
  X,
  Search,
  Calendar,
  RotateCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PerformanceFilters as PerformanceFiltersType } from '@/types/performance';

interface PerformanceFiltersProps {
  filters: PerformanceFiltersType;
  onFiltersChange: (filters: PerformanceFiltersType) => void;
  onSearch?: (searchTerm: string) => void;
  className?: string;
  // Available options for dropdowns
  sites?: Array<{ id: string; name: string }>;
  assetTypes?: Array<{ id: string; name: string }>;
}

/**
 * Performance Filters Component
 * 
 * Provides filters for site, asset type, performance range, status.
 * Implements date range picker for time-based filtering.
 * Adds quick filter buttons and search functionality.
 * 
 * Requirements: 1.6, 6.1, 8.2
 */
export function PerformanceFilters({
  filters,
  onFiltersChange,
  onSearch,
  className,
  sites = [],
  assetTypes = []
}: PerformanceFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Handle filter updates
  const updateFilter = (key: keyof PerformanceFiltersType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  // Handle array filter updates (for multi-select)
  const updateArrayFilter = (key: keyof PerformanceFiltersType, value: string, checked: boolean) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = checked
      ? [...currentArray, value]
      : currentArray.filter(item => item !== value);

    updateFilter(key, newArray.length > 0 ? newArray : undefined);
  };

  // Clear all filters
  const clearFilters = () => {
    onFiltersChange({});
    setSearchTerm('');
    onSearch?.('');
  };

  // Quick filter presets
  const quickFilters = [
    {
      label: 'High Performance',
      action: () => updateFilter('oee_min', 85)
    },
    {
      label: 'Low Performance',
      action: () => updateFilter('oee_max', 70)
    },
    {
      label: 'Active Only',
      action: () => updateFilter('status', ['active'])
    },
    {
      label: 'Last 7 Days',
      action: () => {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        updateFilter('date_from', sevenDaysAgo.toISOString().split('T')[0]);
        updateFilter('date_to', now.toISOString().split('T')[0]);
      }
    }
  ];

  // Count active filters
  const activeFilterCount = (filters && typeof filters === 'object') ? Object.values(filters).filter(value =>
    value !== undefined && value !== null &&
    (Array.isArray(value) ? value.length > 0 : true)
  ).length : 0;

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  return (
    <Card className={cn("performance-filters", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-sm font-medium">Filters</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Clear
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search performance panels..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={filter.action}
              className="h-7 text-xs"
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-4 pt-2 border-t">
            {/* Site Filter */}
            {sites.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Sites</Label>
                <Select
                  value={filters.site_ids?.[0] || 'all'}
                  onValueChange={(value) => updateFilter('site_ids', value && value !== 'all' ? [value] : undefined)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select site..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sites</SelectItem>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Asset Type Filter */}
            {assetTypes.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Asset Types</Label>
                <Select
                  value={filters.panel_types?.[0] || 'all'}
                  onValueChange={(value) => updateFilter('panel_types', value && value !== 'all' ? [value] : undefined)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="site">Site</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Status</Label>
              <Select
                value={filters.status?.[0] || 'all'}
                onValueChange={(value) => updateFilter('status', value && value !== 'all' ? [value] : undefined)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Performance Range */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">OEE Range (%)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.oee_min || ''}
                    onChange={(e) => updateFilter('oee_min', e.target.value ? Number(e.target.value) : undefined)}
                    className="h-8"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.oee_max || ''}
                    onChange={(e) => updateFilter('oee_max', e.target.value ? Number(e.target.value) : undefined)}
                    className="h-8"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date Range
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="date"
                    value={filters.date_from || ''}
                    onChange={(e) => updateFilter('date_from', e.target.value || undefined)}
                    className="h-8"
                  />
                </div>
                <div>
                  <Input
                    type="date"
                    value={filters.date_to || ''}
                    onChange={(e) => updateFilter('date_to', e.target.value || undefined)}
                    className="h-8"
                  />
                </div>
              </div>
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Sort By</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={filters.sort_by || ''}
                  onValueChange={(value) => updateFilter('sort_by', value || undefined)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Sort field..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Default</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="oee_percentage">OEE</SelectItem>
                    <SelectItem value="availability_percentage">Availability</SelectItem>
                    <SelectItem value="last_updated">Last Updated</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.sort_order || ''}
                  onValueChange={(value) => updateFilter('sort_order', value as 'asc' | 'desc' || undefined)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Order..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-1 pt-2 border-t">
            {filters.site_ids?.map((siteId) => {
              const site = sites.find(s => s.id === siteId);
              return (
                <Badge key={siteId} variant="secondary" className="text-xs">
                  Site: {site?.name || siteId}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => updateArrayFilter('site_ids', siteId, false)}
                  />
                </Badge>
              );
            })}

            {filters.status?.map((status) => (
              <Badge key={status} variant="secondary" className="text-xs">
                Status: {status}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => updateArrayFilter('status', status, false)}
                />
              </Badge>
            ))}

            {filters.oee_min !== undefined && (
              <Badge variant="secondary" className="text-xs">
                OEE ≥ {filters.oee_min}%
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => updateFilter('oee_min', undefined)}
                />
              </Badge>
            )}

            {filters.oee_max !== undefined && (
              <Badge variant="secondary" className="text-xs">
                OEE ≤ {filters.oee_max}%
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => updateFilter('oee_max', undefined)}
                />
              </Badge>
            )}

            {filters.date_from && (
              <Badge variant="secondary" className="text-xs">
                From: {filters.date_from}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => updateFilter('date_from', undefined)}
                />
              </Badge>
            )}

            {filters.date_to && (
              <Badge variant="secondary" className="text-xs">
                To: {filters.date_to}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => updateFilter('date_to', undefined)}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}