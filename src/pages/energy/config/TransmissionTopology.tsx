import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { EMSPageShell } from "@/components/ems/EMSPageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Plus, MapPin, Zap, Activity, GitBranch } from "lucide-react";
import { getTransmissionProvider } from "@/lib/data/providers/TransmissionProvider";
import type { TxSubstation, TxFeeder, TxTransformer, TxLine } from "@/types/transmission";

export function TransmissionTopology() {
  const { sector, subsector, currentTenant } = useApp();
  const isTransmission = sector === 'Power' && subsector === 'Transmission';
  
  const [activeTab, setActiveTab] = useState<'substations' | 'feeders' | 'transformers' | 'lines'>('substations');
  const [substations, setSubstations] = useState<TxSubstation[]>([]);
  const [feeders, setFeeders] = useState<TxFeeder[]>([]);
  const [transformers, setTransformers] = useState<TxTransformer[]>([]);
  const [lines, setLines] = useState<TxLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSubstation, setSelectedSubstation] = useState<TxSubstation | null>(null);
  const [selectedFeeder, setSelectedFeeder] = useState<TxFeeder | null>(null);
  const [selectedTransformer, setSelectedTransformer] = useState<TxTransformer | null>(null);
  const [selectedLine, setSelectedLine] = useState<TxLine | null>(null);

  // Load topology data
  useEffect(() => {
    if (!isTransmission || !currentTenant) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const provider = getTransmissionProvider();
        
        const [subsData, feedData, transData, lineData] = await Promise.all([
          provider.listTxSubstations({ org_id: currentTenant.id }),
          provider.listTxFeeders({ org_id: currentTenant.id }),
          provider.listTxTransformers({ org_id: currentTenant.id }),
          provider.listTxLines({ org_id: currentTenant.id })
        ]);
        
        setSubstations(subsData);
        setFeeders(feedData);
        setTransformers(transData);
        setLines(lineData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load topology data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [isTransmission, currentTenant]);


  // Not transmission sector - show message
  if (!isTransmission) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <MapPin className="w-16 h-16 mx-auto text-muted-foreground" />
          <h2 className="text-2xl font-semibold">Transmission Topology</h2>
          <p className="text-muted-foreground max-w-md">
            This page is only available for Power Transmission sector.
            Switch to Power/Transmission to manage grid topology.
          </p>
        </div>
      </div>
    );
  }

  const currentList = activeTab === 'substations' ? substations :
                      activeTab === 'feeders' ? feeders :
                      activeTab === 'transformers' ? transformers : lines;
  
  const selectedItem = activeTab === 'substations' ? selectedSubstation :
                       activeTab === 'feeders' ? selectedFeeder :
                       activeTab === 'transformers' ? selectedTransformer : selectedLine;
  
  const handleItemSelect = (item: any) => {
    if (activeTab === 'substations') setSelectedSubstation(item);
    else if (activeTab === 'feeders') setSelectedFeeder(item);
    else if (activeTab === 'transformers') setSelectedTransformer(item);
    else setSelectedLine(item);
  };

  const workPaneContent = (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="substations" className="gap-2">
            <MapPin className="w-4 h-4" />
            Substations
          </TabsTrigger>
          <TabsTrigger value="feeders" className="gap-2">
            <Zap className="w-4 h-4" />
            Feeders
          </TabsTrigger>
          <TabsTrigger value="transformers" className="gap-2">
            <Activity className="w-4 h-4" />
            Transformers
          </TabsTrigger>
          <TabsTrigger value="lines" className="gap-2">
            <GitBranch className="w-4 h-4" />
            Lines
          </TabsTrigger>
        </TabsList>

        <TabsContent value="substations" className="space-y-4 mt-6">
          {selectedSubstation ? (
            <SubstationDetail substation={selectedSubstation} />
          ) : (
            <div className="text-center text-muted-foreground py-12">
              Select a substation from the list to view details
            </div>
          )}
        </TabsContent>

        <TabsContent value="feeders" className="space-y-4 mt-6">
          {selectedFeeder ? (
            <FeederDetail feeder={selectedFeeder} substations={substations} />
          ) : (
            <div className="text-center text-muted-foreground py-12">
              Select a feeder from the list to view details
            </div>
          )}
        </TabsContent>

        <TabsContent value="transformers" className="space-y-4 mt-6">
          {selectedTransformer ? (
            <TransformerDetail transformer={selectedTransformer} substations={substations} />
          ) : (
            <div className="text-center text-muted-foreground py-12">
              Select a transformer from the list to view details
            </div>
          )}
        </TabsContent>

        <TabsContent value="lines" className="space-y-4 mt-6">
          {selectedLine ? (
            <LineDetail line={selectedLine} substations={substations} />
          ) : (
            <div className="text-center text-muted-foreground py-12">
              Select a line from the list to view details
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <EMSPageShell
      title="Transmission Topology"
      featureSetName="Energy Configuration"
      featureName="Transmission Topology"
      listType="custom"
      listItems={currentList}
      selectedItem={selectedItem}
      onItemSelect={handleItemSelect}
      workPaneContent={workPaneContent}
      searchPlaceholder={`Search ${activeTab}...`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add {activeTab.slice(0, -1)}
          </Button>
        </div>
      }
    />
  );
}


// Substation Detail Component
function SubstationDetail({ substation }: { substation: TxSubstation }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-semibold">{substation.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">Code: {substation.code}</p>
        </div>
        <Badge variant={substation.active ? "default" : "secondary"}>
          {substation.active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Region</p>
          <p className="text-base">{substation.region || 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Voltage Levels</p>
          <div className="flex gap-2">
            {substation.voltage_levels_kv?.map((kv) => (
              <Badge key={kv} variant="outline">{kv} kV</Badge>
            )) || <span className="text-sm text-muted-foreground">N/A</span>}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Created</p>
          <p className="text-sm">{new Date(substation.created_at).toLocaleDateString()}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Updated</p>
          <p className="text-sm">{new Date(substation.updated_at).toLocaleDateString()}</p>
        </div>
      </div>

      {substation.geo && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Location</p>
          <div className="p-4 bg-muted rounded-lg">
            <pre className="text-xs">{JSON.stringify(substation.geo, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

// Feeder Detail Component
function FeederDetail({ feeder, substations }: { feeder: TxFeeder; substations: TxSubstation[] }) {
  const substation = substations.find(s => s.id === feeder.substation_id);
  
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-semibold">{feeder.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">Code: {feeder.feeder_code}</p>
        </div>
        <Badge variant={feeder.active ? "default" : "secondary"}>
          {feeder.active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Substation</p>
          <p className="text-base">{substation?.name || 'Unknown'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Voltage Level</p>
          <p className="text-base">{feeder.voltage_level_kv ? `${feeder.voltage_level_kv} kV` : 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Direction</p>
          <Badge variant="outline">{feeder.direction || 'N/A'}</Badge>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Capacity</p>
          <p className="text-base">{feeder.capacity_mva ? `${feeder.capacity_mva} MVA` : 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Utility Reference</p>
          <p className="text-sm">{feeder.utility_ref || 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Updated</p>
          <p className="text-sm">{new Date(feeder.updated_at).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}


// Transformer Detail Component
function TransformerDetail({ transformer, substations }: { transformer: TxTransformer; substations: TxSubstation[] }) {
  const substation = substations.find(s => s.id === transformer.substation_id);
  
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-semibold">{transformer.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">Code: {transformer.transformer_code}</p>
        </div>
        <Badge variant={transformer.active ? "default" : "secondary"}>
          {transformer.active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Substation</p>
          <p className="text-base">{substation?.name || 'Unknown'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Rated Capacity</p>
          <p className="text-base">{transformer.rated_capacity_mva ? `${transformer.rated_capacity_mva} MVA` : 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Primary Voltage</p>
          <p className="text-base">{transformer.primary_voltage_kv ? `${transformer.primary_voltage_kv} kV` : 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Secondary Voltage</p>
          <p className="text-base">{transformer.secondary_voltage_kv ? `${transformer.secondary_voltage_kv} kV` : 'N/A'}</p>
        </div>
        {transformer.tertiary_voltage_kv && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Tertiary Voltage</p>
            <p className="text-base">{transformer.tertiary_voltage_kv} kV</p>
          </div>
        )}
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Cooling Type</p>
          <Badge variant="outline">{transformer.cooling_type || 'N/A'}</Badge>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Tap Changer</p>
          <Badge variant="outline">{transformer.tap_changer_type || 'N/A'}</Badge>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Updated</p>
          <p className="text-sm">{new Date(transformer.updated_at).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}

// Line Detail Component
function LineDetail({ line, substations }: { line: TxLine; substations: TxSubstation[] }) {
  const fromSubstation = substations.find(s => s.id === line.from_substation_id);
  const toSubstation = substations.find(s => s.id === line.to_substation_id);
  
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-semibold">{line.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">Code: {line.line_code}</p>
        </div>
        <Badge variant={line.active ? "default" : "secondary"}>
          {line.active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">From Substation</p>
          <p className="text-base">{fromSubstation?.name || 'Unknown'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">To Substation</p>
          <p className="text-base">{toSubstation?.name || 'Unknown'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Voltage Level</p>
          <p className="text-base">{line.voltage_level_kv ? `${line.voltage_level_kv} kV` : 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Length</p>
          <p className="text-base">{line.length_km ? `${line.length_km} km` : 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Conductor Type</p>
          <p className="text-sm">{line.conductor_type || 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Thermal Rating</p>
          <p className="text-base">{line.thermal_rating_mva ? `${line.thermal_rating_mva} MVA` : 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Updated</p>
          <p className="text-sm">{new Date(line.updated_at).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
