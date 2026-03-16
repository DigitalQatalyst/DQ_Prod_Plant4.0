import { useState, useEffect, useMemo } from 'react';
import { useDataProvider } from '@/hooks/useDataProvider';
import type { TransmissionAsset } from '@/types/transmission';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Truck, MapPin, History, Globe, Info, Navigation, Save, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ListPane } from '@/components/layout/ListPane';
import { WorkPane } from '@/components/layout/WorkPane';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Site {
  id: string;
  name: string;
}

export function MobileAssetsPage() {
  const { provider } = useDataProvider();
  const [assets, setAssets] = useState<TransmissionAsset[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<TransmissionAsset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state
  const [siteFilter, setSiteFilter] = useState<string>('all');

  // Update location form state
  const [newLat, setNewLat] = useState('');
  const [newLng, setNewLng] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedAsset) {
      const location = (selectedAsset.properties?.last_known_location as any) || {};
      setNewLat(location.lat?.toString() || '');
      setNewLng(location.lng?.toString() || '');
    }
  }, [selectedAsset]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const tenantId = await provider.getDefaultTransmissionTenantId();
      
      // Create rich mock data for mobile assets
      const mockSites: Site[] = [
        { id: 'site-1', name: 'North Substation' },
        { id: 'site-2', name: 'East Field Operations' },
        { id: 'site-3', name: 'South Maintenance Hub' },
        { id: 'site-4', name: 'West Distribution Center' },
        { id: 'site-5', name: 'Central Command' },
      ];

      const mockMobileAssets: TransmissionAsset[] = [
        {
          id: 'mobile-1',
          tenantId,
          siteId: 'site-1',
          assetTypeId: 'type-mobile-1',
          assetTypeCode: 'MV-001',
          assetTypeName: 'Emergency Response Vehicle',
          name: 'Emergency Unit Alpha',
          status: 'online',
          properties: {
            role: 'mobile',
            last_known_location: {
              lat: 40.7589,
              lng: -73.9851,
              timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
            },
            vehicle_type: 'Emergency Response',
            license_plate: 'ERV-2024',
            crew_size: 4,
            equipment_capacity: 'High',
            fuel_level: 78,
            odometer: 45230,
          },
          createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
        {
          id: 'mobile-2',
          tenantId,
          siteId: 'site-2',
          assetTypeId: 'type-mobile-2',
          assetTypeCode: 'MT-102',
          assetTypeName: 'Mobile Transformer Unit',
          name: 'Mobile Transformer Beta',
          status: 'online',
          properties: {
            role: 'mobile',
            last_known_location: {
              lat: 40.7128,
              lng: -74.0060,
              timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
            },
            vehicle_type: 'Heavy Equipment',
            license_plate: 'MTU-5521',
            transformer_capacity: '25 MVA',
            voltage_rating: '138/13.2 kV',
            fuel_level: 92,
            odometer: 12450,
          },
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        },
        {
          id: 'mobile-3',
          tenantId,
          siteId: 'site-3',
          assetTypeId: 'type-mobile-3',
          assetTypeCode: 'FT-203',
          assetTypeName: 'Field Testing Truck',
          name: 'Testing Unit Gamma',
          status: 'online',
          properties: {
            role: 'mobile',
            last_known_location: {
              lat: 40.6782,
              lng: -73.9442,
              timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 mins ago
            },
            vehicle_type: 'Testing Equipment',
            license_plate: 'FTT-8834',
            test_equipment: ['Relay Tester', 'Megger', 'Power Analyzer'],
            crew_size: 2,
            fuel_level: 65,
            odometer: 67890,
          },
          createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        },
        {
          id: 'mobile-4',
          tenantId,
          siteId: 'site-4',
          assetTypeId: 'type-mobile-4',
          assetTypeCode: 'MG-304',
          assetTypeName: 'Mobile Generator',
          name: 'Generator Unit Delta',
          status: 'online',
          properties: {
            role: 'mobile',
            last_known_location: {
              lat: 40.7580,
              lng: -73.9855,
              timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
            },
            vehicle_type: 'Power Generation',
            license_plate: 'MGU-4421',
            generator_capacity: '2.5 MW',
            fuel_type: 'Diesel',
            fuel_level: 45,
            runtime_hours: 3420,
            odometer: 23100,
          },
          createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
          id: 'mobile-5',
          tenantId,
          siteId: 'site-1',
          assetTypeId: 'type-mobile-5',
          assetTypeCode: 'CR-405',
          assetTypeName: 'Cable Repair Vehicle',
          name: 'Cable Unit Epsilon',
          status: 'online',
          properties: {
            role: 'mobile',
            last_known_location: {
              lat: 40.7489,
              lng: -73.9680,
              timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 mins ago
            },
            vehicle_type: 'Maintenance',
            license_plate: 'CRV-7732',
            cable_capacity: '500 meters',
            crew_size: 3,
            fuel_level: 88,
            odometer: 54320,
          },
          createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        },
        {
          id: 'mobile-6',
          tenantId,
          siteId: 'site-5',
          assetTypeId: 'type-mobile-6',
          assetTypeCode: 'IV-506',
          assetTypeName: 'Inspection Vehicle',
          name: 'Inspection Unit Zeta',
          status: 'online',
          properties: {
            role: 'mobile',
            last_known_location: {
              lat: 40.7306,
              lng: -73.9352,
              timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(), // 1 min ago
            },
            vehicle_type: 'Inspection',
            license_plate: 'INV-9921',
            inspection_equipment: ['Thermal Camera', 'Drone', 'LiDAR Scanner'],
            crew_size: 2,
            fuel_level: 72,
            odometer: 38900,
          },
          createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
        },
        {
          id: 'mobile-7',
          tenantId,
          siteId: 'site-2',
          assetTypeId: 'type-mobile-7',
          assetTypeCode: 'HT-607',
          assetTypeName: 'Hot Line Truck',
          name: 'Hot Line Unit Eta',
          status: 'online',
          properties: {
            role: 'mobile',
            last_known_location: {
              lat: 40.7614,
              lng: -73.9776,
              timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 mins ago
            },
            vehicle_type: 'Live Line Work',
            license_plate: 'HLT-3345',
            boom_height: '45 feet',
            crew_size: 3,
            fuel_level: 55,
            odometer: 29870,
          },
          createdAt: new Date(Date.now() - 130 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        },
        {
          id: 'mobile-8',
          tenantId,
          siteId: 'site-3',
          assetTypeId: 'type-mobile-8',
          assetTypeCode: 'SV-708',
          assetTypeName: 'Supervisor Vehicle',
          name: 'Supervisor Unit Theta',
          status: 'online',
          properties: {
            role: 'mobile',
            last_known_location: {
              lat: 40.7505,
              lng: -73.9934,
              timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(), // 3 mins ago
            },
            vehicle_type: 'Command & Control',
            license_plate: 'SUP-6654',
            communication_equipment: ['Satellite Phone', 'Radio System', 'Mobile Command Center'],
            crew_size: 1,
            fuel_level: 81,
            odometer: 41200,
          },
          createdAt: new Date(Date.now() - 160 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        },
      ];

      setAssets(mockMobileAssets);
      setSites(mockSites);
      
      // Set first asset as selected by default
      if (mockMobileAssets.length > 0) {
        setSelectedAsset(mockMobileAssets[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mobile assets');
    } finally {
      setLoading(false);
    }
  };

  const getSiteName = (siteId: string) => {
    return sites.find(s => s.id === siteId)?.name || 'Field Operation';
  };

  const getLastKnownLocation = (asset: TransmissionAsset) => {
    const location = asset.properties?.last_known_location as any;
    if (!location) return null;
    return {
      lat: location.lat as number,
      lng: location.lng as number,
      timestamp: location.timestamp as string
    };
  };

  const filteredAssets = useMemo(() => {
    let filtered = [...assets];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(query) ||
        asset.assetTypeName.toLowerCase().includes(query)
      );
    }

    // Site filter
    if (siteFilter !== 'all') {
      filtered = filtered.filter(asset => asset.siteId === siteFilter);
    }

    return filtered;
  }, [assets, searchQuery, siteFilter]);

  const handleUpdateLocation = async () => {
    if (!selectedAsset) return;

    const lat = parseFloat(newLat);
    const lng = parseFloat(newLng);

    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter valid coordinates',
        variant: 'destructive'
      });
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({
        title: 'Validation Error',
        description: 'Latitude must be between -90 and 90, longitude between -180 and 180',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);

      const newProperties = {
        ...selectedAsset.properties,
        last_known_location: {
          lat,
          lng,
          timestamp: new Date().toISOString()
        }
      };

      const updated = await provider.updateTransmissionAsset(selectedAsset.id, {
        properties: newProperties
      });

      // Update local state
      setAssets(prev => prev.map(a => a.id === selectedAsset.id ? updated : a));
      setSelectedAsset(updated);

      toast({
        title: 'Location Updated',
        description: `${selectedAsset.name} position has been synchronized`
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update location',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filterConfigs = [
    {
      key: 'site',
      label: 'Current Site',
      options: [
        { label: 'All Sites', value: 'all' },
        ...sites.map(site => ({
          label: site.name,
          value: site.id
        }))
      ],
      value: siteFilter,
      onChange: setSiteFilter
    }
  ];

  if (loading) {
    return <Skeleton className="h-full w-full" />;
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadData} className="mt-4">Retry</Button>
      </div>
    );
  }

  const tabs = [
    {
      id: 'details',
      label: 'Asset Details',
      icon: <Info className="w-4 h-4 mr-2" />,
      content: selectedAsset ? (
        <div className="space-y-8">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Asset Parameters</CardTitle>
              <CardDescription>Specifications and current operational status</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Asset Code</p>
                  <p className="text-lg font-bold font-mono">{selectedAsset.assetTypeCode}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Type</p>
                  <Badge variant="secondary" className="mt-1">{selectedAsset.assetTypeName}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Assigned Site</p>
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <MapPin className="w-4 h-4" />
                    {getSiteName(selectedAsset.siteId)}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Health Status</p>
                  <Badge variant="outline" className={cn(
                    "mt-1 font-medium",
                    selectedAsset.status === 'online' ? "text-success border-success/30 bg-success/5" : "text-yellow-600 border-yellow-200 bg-yellow-50"
                  )}>
                    {selectedAsset.status.toUpperCase()}
                  </Badge>
                </div>
                {selectedAsset.properties?.license_plate && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">License Plate</p>
                    <p className="text-lg font-mono font-semibold">{selectedAsset.properties.license_plate as string}</p>
                  </div>
                )}
                {selectedAsset.properties?.vehicle_type && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Vehicle Type</p>
                    <p className="text-sm font-medium">{selectedAsset.properties.vehicle_type as string}</p>
                  </div>
                )}
                {selectedAsset.properties?.crew_size && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Crew Size</p>
                    <p className="text-sm font-medium">{selectedAsset.properties.crew_size as number} personnel</p>
                  </div>
                )}
                {selectedAsset.properties?.fuel_level !== undefined && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Fuel Level</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all",
                            (selectedAsset.properties.fuel_level as number) > 50 ? "bg-success" : 
                            (selectedAsset.properties.fuel_level as number) > 25 ? "bg-yellow-500" : "bg-destructive"
                          )}
                          style={{ width: `${selectedAsset.properties.fuel_level}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{selectedAsset.properties.fuel_level}%</span>
                    </div>
                  </div>
                )}
                {selectedAsset.properties?.odometer && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Odometer</p>
                    <p className="text-sm font-medium">{(selectedAsset.properties.odometer as number).toLocaleString()} miles</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Equipment Details */}
          {(selectedAsset.properties?.transformer_capacity || 
            selectedAsset.properties?.generator_capacity || 
            selectedAsset.properties?.test_equipment ||
            selectedAsset.properties?.inspection_equipment ||
            selectedAsset.properties?.communication_equipment) && (
            <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="px-0">
                <CardTitle>Equipment & Capabilities</CardTitle>
                <CardDescription>Specialized equipment and operational capacity</CardDescription>
              </CardHeader>
              <CardContent className="px-0 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  {selectedAsset.properties?.transformer_capacity && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Transformer Capacity</p>
                      <p className="text-sm font-medium">{selectedAsset.properties.transformer_capacity as string}</p>
                    </div>
                  )}
                  {selectedAsset.properties?.voltage_rating && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Voltage Rating</p>
                      <p className="text-sm font-medium">{selectedAsset.properties.voltage_rating as string}</p>
                    </div>
                  )}
                  {selectedAsset.properties?.generator_capacity && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Generator Capacity</p>
                      <p className="text-sm font-medium">{selectedAsset.properties.generator_capacity as string}</p>
                    </div>
                  )}
                  {selectedAsset.properties?.fuel_type && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Fuel Type</p>
                      <p className="text-sm font-medium">{selectedAsset.properties.fuel_type as string}</p>
                    </div>
                  )}
                  {selectedAsset.properties?.runtime_hours && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Runtime Hours</p>
                      <p className="text-sm font-medium">{(selectedAsset.properties.runtime_hours as number).toLocaleString()} hours</p>
                    </div>
                  )}
                  {selectedAsset.properties?.cable_capacity && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Cable Capacity</p>
                      <p className="text-sm font-medium">{selectedAsset.properties.cable_capacity as string}</p>
                    </div>
                  )}
                  {selectedAsset.properties?.boom_height && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Boom Height</p>
                      <p className="text-sm font-medium">{selectedAsset.properties.boom_height as string}</p>
                    </div>
                  )}
                  {selectedAsset.properties?.equipment_capacity && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Equipment Capacity</p>
                      <p className="text-sm font-medium">{selectedAsset.properties.equipment_capacity as string}</p>
                    </div>
                  )}
                  {selectedAsset.properties?.test_equipment && (
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Test Equipment</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(selectedAsset.properties.test_equipment as string[]).map((eq, idx) => (
                          <Badge key={idx} variant="outline">{eq}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedAsset.properties?.inspection_equipment && (
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Inspection Equipment</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(selectedAsset.properties.inspection_equipment as string[]).map((eq, idx) => (
                          <Badge key={idx} variant="outline">{eq}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedAsset.properties?.communication_equipment && (
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Communication Equipment</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(selectedAsset.properties.communication_equipment as string[]).map((eq, idx) => (
                          <Badge key={idx} variant="outline">{eq}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="border-t border-border/40 pt-8">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" />
              Manual Telemetry Override
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-muted/30 rounded-2xl border border-border/40">
              <div className="space-y-2">
                <Label htmlFor="lat" className="text-xs text-muted-foreground uppercase">Latitude</Label>
                <Input id="lat" value={newLat} onChange={(e) => setNewLat(e.target.value)} type="number" step="any" placeholder="0.0000" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng" className="text-xs text-muted-foreground uppercase">Longitude</Label>
                <Input id="lng" value={newLng} onChange={(e) => setNewLng(e.target.value)} type="number" step="any" placeholder="0.0000" className="rounded-xl" />
              </div>
              <div className="md:col-span-2 flex justify-end pt-2">
                <Button onClick={handleUpdateLocation} disabled={submitting} className="rounded-xl px-8">
                  <Save className="w-4 h-4 mr-2" />
                  {submitting ? 'Updating...' : 'Sync Location'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-muted-foreground p-8 border border-dashed rounded-xl">
          <div className="text-center">
            <Info className="w-10 h-10 mx-auto mb-4 opacity-20" />
            <p className="text-sm">Select a mobile asset to view detailed specifications</p>
          </div>
        </div>
      )
    },
    {
      id: 'history',
      label: 'Tracking Map',
      icon: <Globe className="w-4 h-4 mr-2" />,
      content: selectedAsset ? (
        <div className="space-y-6">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Geospatial Telemetry</CardTitle>
              <CardDescription>Real-time location and movement history visualization</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-4">
              <div className="bg-muted rounded-2xl p-8 text-center min-h-[400px] flex flex-col items-center justify-center border border-dashed border-border/60">
                <Globe className="h-16 w-16 text-muted-foreground/40 mb-4 animate-spin-slow" />
                <p className="text-lg font-semibold mb-2">GPS Tracking Interface</p>
                {(() => {
                  const loc = getLastKnownLocation(selectedAsset);
                  return loc ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Last reported position: <span className="font-mono font-medium text-foreground">{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">Reported at {new Date(loc.timestamp).toLocaleString()}</p>
                      <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-md">
                        <div className="bg-background/50 rounded-xl p-4 border border-border/40 text-left">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Signal Quality</p>
                          <p className="text-sm font-medium text-success">Excellent (94%)</p>
                        </div>
                        <div className="bg-background/50 rounded-xl p-4 border border-border/40 text-left">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Power Level</p>
                          <p className="text-sm font-medium">82% (Nominal)</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent telemetry data captured for this unit</p>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          <div className="p-6 border rounded-2xl bg-card border-border/40">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Recent Movement Logs
            </h3>
            <p className="text-sm text-muted-foreground italic">
              Historical route analysis for {selectedAsset.name} will be available in the next release cycle.
            </p>
          </div>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-muted-foreground p-8 border border-dashed rounded-xl">
          <div className="text-center">
            <Globe className="w-10 h-10 mx-auto mb-4 opacity-20" />
            <p className="text-sm">Select an asset to view telemetry and tracking map</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <>
      <ListPane
        title="Mobile Assets"
        subtitle={`${filteredAssets.length} total units`}
        showFilters={true}
        showExpandableFilters={true}
        filters={filterConfigs}
        onSearch={setSearchQuery}
        searchPlaceholder="Search assets or types..."
      >
        <div className="space-y-1">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => setSelectedAsset(asset)}
              className={cn(
                "p-3 rounded-xl border cursor-pointer transition-all duration-200",
                selectedAsset?.id === asset.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-transparent hover:bg-secondary/50"
              )}
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 shadow-sm border border-primary/5">
                  <Truck className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold truncate min-w-0 flex-1">{asset.name}</p>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 font-mono">
                      {asset.assetTypeCode}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {getSiteName(asset.siteId)} • {asset.status}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {filteredAssets.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground italic">
              No matching mobile assets found
            </div>
          )}
        </div>
      </ListPane>

      <WorkPane
        key={selectedAsset?.id || 'mobile-operations'}
        title={selectedAsset ? selectedAsset.name : "Operations Workspace"}
        subtitle={selectedAsset ? `Telematics tracking for ${selectedAsset.name}` : "Comprehensive monitoring of movable transmission gear and field vehicle telemetry"}
        tabs={tabs}
        defaultTab="details"
      />
    </>
  );
}
