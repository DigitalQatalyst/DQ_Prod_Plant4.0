import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, X } from 'lucide-react';
import { useDataProvider } from '@/hooks/useDataProvider';
import { CreatePerformancePanelRequest, PerformancePanel } from '@/types/performance';

/**
 * Zod validation schema for creating a performance panel
 * 
 * Business Rules:
 * - Name is required and must be 1-100 characters
 * - Panel type is required (asset, site, or system)
 * - Asset panels must have an asset_id
 * - Site panels must have a site_id
 * - System panels should not have asset_id or site_id
 * - OEE metrics must be between 0 and 100 if provided
 * 
 * Requirements: 1.1, 1.5
 */
const createPerformancePanelSchema = z.object({
  name: z.string()
    .min(1, 'Panel name is required')
    .max(100, 'Panel name must be less than 100 characters'),
  panel_type: z.enum(['asset', 'site', 'system'], {
    required_error: 'Panel type is required',
  }),
  site_id: z.string().optional(),
  asset_id: z.string().optional(),
  grid_node_id: z.string().optional(),
  grid_line_id: z.string().optional(),
  oee_percentage: z.number()
    .min(0, 'OEE must be at least 0%')
    .max(100, 'OEE cannot exceed 100%')
    .optional(),
  availability_percentage: z.number()
    .min(0, 'Availability must be at least 0%')
    .max(100, 'Availability cannot exceed 100%')
    .optional(),
  performance_percentage: z.number()
    .min(0, 'Performance must be at least 0%')
    .max(100, 'Performance cannot exceed 100%')
    .optional(),
  quality_percentage: z.number()
    .min(0, 'Quality must be at least 0%')
    .max(100, 'Quality cannot exceed 100%')
    .optional(),
}).refine((data) => {
  // Asset panels must have an asset_id
  if (data.panel_type === 'asset' && !data.asset_id) {
    return false;
  }
  // Site panels must have a site_id
  if (data.panel_type === 'site' && !data.site_id) {
    return false;
  }
  return true;
}, {
  message: 'Asset panels require an asset ID, and site panels require a site ID',
  path: ['panel_type'],
});

type CreatePerformancePanelFormData = z.infer<typeof createPerformancePanelSchema>;

interface CreatePerformancePanelFormProps {
  tenantId: string;
  onSuccess?: (panel: PerformancePanel) => void;
  onCancel?: () => void;
  // Available options for dropdowns
  sites?: Array<{ id: string; name: string }>;
  assets?: Array<{ id: string; name: string }>;
  gridNodes?: Array<{ id: string; name: string }>;
  gridLines?: Array<{ id: string; name: string }>;
}

/**
 * Create Performance Panel Form Component
 * 
 * Provides a form for creating new performance panels with validation.
 * Implements Zod validation schema with business rules.
 * Handles form submission with success/error feedback.
 * 
 * Requirements: 1.1, 1.5
 */
export function CreatePerformancePanelForm({
  tenantId,
  onSuccess,
  onCancel,
  sites = [],
  assets = [],
  gridNodes = [],
  gridLines = [],
}: CreatePerformancePanelFormProps) {
  const { provider } = useDataProvider();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreatePerformancePanelFormData>({
    resolver: zodResolver(createPerformancePanelSchema),
    defaultValues: {
      name: '',
      panel_type: 'asset',
      oee_percentage: undefined,
      availability_percentage: undefined,
      performance_percentage: undefined,
      quality_percentage: undefined,
    },
  });

  const panelType = form.watch('panel_type');

  const onSubmit = async (data: CreatePerformancePanelFormData) => {
    try {
      setIsSubmitting(true);

      // Prepare the request payload
      const request: CreatePerformancePanelRequest = {
        name: data.name,
        panel_type: data.panel_type,
        site_id: data.site_id,
        asset_id: data.asset_id,
        grid_node_id: data.grid_node_id,
        grid_line_id: data.grid_line_id,
        oee_percentage: data.oee_percentage,
        availability_percentage: data.availability_percentage,
        performance_percentage: data.performance_percentage,
        quality_percentage: data.quality_percentage,
      };

      // Call the data provider to create the panel
      const createdPanel = await provider.createPerformancePanel(tenantId, request);

      // Show success message
      toast.success('Performance panel created successfully', {
        description: `Panel "${createdPanel.name}" has been created.`,
      });

      // Reset form
      form.reset();

      // Call success callback
      onSuccess?.(createdPanel);
    } catch (error) {
      console.error('Failed to create performance panel:', error);
      
      // Show error message
      toast.error('Failed to create performance panel', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onCancel?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create Performance Panel
        </CardTitle>
        <CardDescription>
          Create a new performance monitoring panel for tracking OEE and transmission metrics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Panel Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Panel Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Substation A - Transformer T1"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this performance panel
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Panel Type */}
            <FormField
              control={form.control}
              name="panel_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Panel Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select panel type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="asset">Asset</SelectItem>
                      <SelectItem value="site">Site</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Asset: Individual equipment | Site: Entire location | System: Overall network
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditional Fields Based on Panel Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Site Selection */}
              {(panelType === 'site' || panelType === 'asset') && sites.length > 0 && (
                <FormField
                  control={form.control}
                  name="site_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site {panelType === 'site' ? '*' : ''}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select site" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sites.map((site) => (
                            <SelectItem key={site.id} value={site.id}>
                              {site.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Asset Selection */}
              {panelType === 'asset' && assets.length > 0 && (
                <FormField
                  control={form.control}
                  name="asset_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select asset" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {assets.map((asset) => (
                            <SelectItem key={asset.id} value={asset.id}>
                              {asset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Grid Node Selection */}
              {gridNodes.length > 0 && (
                <FormField
                  control={form.control}
                  name="grid_node_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grid Node (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grid node" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {gridNodes.map((node) => (
                            <SelectItem key={node.id} value={node.id}>
                              {node.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Grid Line Selection */}
              {gridLines.length > 0 && (
                <FormField
                  control={form.control}
                  name="grid_line_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grid Line (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grid line" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {gridLines.map((line) => (
                            <SelectItem key={line.id} value={line.id}>
                              {line.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Initial OEE Metrics (Optional) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Initial OEE Metrics (Optional)</Label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="oee_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OEE %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0-100"
                          min="0"
                          max="100"
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availability_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0-100"
                          min="0"
                          max="100"
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="performance_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Performance %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0-100"
                          min="0"
                          max="100"
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quality_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quality %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0-100"
                          min="0"
                          max="100"
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Panel
                  </>
                )}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
