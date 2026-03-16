import { useState } from "react";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Settings, 
  Factory,
  Droplets,
  Activity,
  Cpu,
  Zap,
  CheckCircle,
  BookOpen,
  Wrench,
  Shield,
  Database,
  Clock,
  AlertCircle
} from "lucide-react";
import { 
  upstreamAssetTypes, 
  upstreamPropertySets,
  lifecycleStates 
} from "@/data/upstreamMockData";
import { UpstreamAssetType, PropertySet, LifecycleState } from "@/types/assets";

// Sector Profile Definition
interface SectorProfile {
  id: string;
  name: string;
  description: string;
  status: "active" | "available" | "deprecated";
  sector: string;
  recommendedAssetTypes: string[];
  recommendedPropertySets: string[];
  recommendedLifecycleStates: string[];
  features: string[];
  lastUpdated: string;
}

// Mock sector profiles data
const sectorProfiles: SectorProfile[] = [
  {
    id: "upstream-oil-gas",
    name: "Oil & Gas Upstream",
    description: "Complete upstream operations profile for exploration and production activities including wells, wellheads, separators, compressors, and pipeline networks",
    status: "active",
    sector: "oil-gas",
    recommendedAssetTypes: [
      "type-well",
      "type-wellhead", 
      "type-xmas-tree",
      "type-esp",
      "type-separator",
      "type-compressor",
      "type-pump",
      "type-tank",
      "type-flowline",
      "type-pipeline",
      "type-manifold",
      "type-rtu",
      "type-sis",
      "type-flow-meter"
    ],
    recommendedPropertySets: [
      "well-properties",
      "pressure-ratings", 
      "pipeline-design",
      "safety-systems"
    ],
    recommendedLifecycleStates: [
      "lifecycle-well-planned",
      "lifecycle-well-drilling",
      "lifecycle-well-completing", 
      "lifecycle-well-producing",
      "lifecycle-well-shut-in",
      "lifecycle-well-pa",
      "lifecycle-process-commissioning",
      "lifecycle-process-active",
      "lifecycle-process-maintenance",
      "lifecycle-process-mothballed",
      "lifecycle-process-decommissioned"
    ],
    features: [
      "Well Management",
      "Production Optimization",
      "Safety Systems Integration",
      "Pipeline Integrity",
      "Artificial Lift Systems",
      "Gas Processing",
      "Water Management",
      "Regulatory Compliance"
    ],
    lastUpdated: "2024-12-15"
  },
  {
    id: "midstream-transport",
    name: "Midstream Transport", 
    description: "Pipeline networks, pump stations, terminals, and storage facilities for hydrocarbon transportation",
    status: "available",
    sector: "oil-gas",
    recommendedAssetTypes: [
      "type-pipeline",
      "type-pump",
      "type-compressor",
      "type-tank",
      "type-manifold"
    ],
    recommendedPropertySets: [
      "pipeline-design",
      "pressure-ratings"
    ],
    recommendedLifecycleStates: [
      "lifecycle-pipeline-design",
      "lifecycle-pipeline-construction",
      "lifecycle-pipeline-active",
      "lifecycle-pipeline-maintenance"
    ],
    features: [
      "Pipeline Networks",
      "Pump Stations", 
      "Storage Terminals",
      "Custody Transfer"
    ],
    lastUpdated: "2024-12-10"
  },
  {
    id: "downstream-refining",
    name: "Downstream Refining",
    description: "Process units, storage tanks, utilities, and support systems for petroleum refining operations",
    status: "available", 
    sector: "oil-gas",
    recommendedAssetTypes: [
      "type-separator",
      "type-compressor",
      "type-pump",
      "type-tank"
    ],
    recommendedPropertySets: [
      "pressure-ratings",
      "safety-systems"
    ],
    recommendedLifecycleStates: [
      "lifecycle-process-commissioning",
      "lifecycle-process-active",
      "lifecycle-process-maintenance"
    ],
    features: [
      "Process Units",
      "Storage Systems",
      "Utilities",
      "Product Quality"
    ],
    lastUpdated: "2024-12-05"
  }
];

// Status colors
const statusColors = {
  active: "bg-green-100 text-green-700 border-green-200",
  available: "bg-blue-100 text-blue-700 border-blue-200", 
  deprecated: "bg-red-100 text-red-700 border-red-200"
};

// Status icons
const statusIcons = {
  active: CheckCircle,
  available: Clock,
  deprecated: AlertCircle
};

export function SectorProfilesPage() {
  const [selectedProfile, setSelectedProfile] = useState<SectorProfile | null>(null);

  const tabs = selectedProfile
    ? [
        { 
          id: "overview", 
          label: "Overview", 
          content: <ProfileOverview profile={selectedProfile} /> 
        },
        { 
          id: "asset-types", 
          label: "Asset Types", 
          content: <ProfileAssetTypes profile={selectedProfile} /> 
        },
        { 
          id: "property-sets", 
          label: "Property Sets", 
          content: <ProfilePropertySets profile={selectedProfile} /> 
        },
        { 
          id: "lifecycle", 
          label: "Lifecycle", 
          content: <ProfileLifecycle profile={selectedProfile} /> 
        },
      ]
    : [
        { 
          id: "catalog", 
          label: "Sector Profiles", 
          content: <ProfilesCatalog 
            profiles={sectorProfiles}
            onSelect={setSelectedProfile} 
          /> 
        },
      ];

  return (
    <div className="flex w-full h-full overflow-hidden">
      <ListPane
        title="Sector Profiles"
        subtitle="Asset Catalog & Types"
        count={sectorProfiles.length}
        searchPlaceholder="Search sector profiles..."
        actions={
          <Button size="sm" className="w-full mt-2 gap-2">
            <Plus className="w-4 h-4" />
            New Profile
          </Button>
        }
      >
        {/* Profile List */}
        <div className="space-y-2">
          {sectorProfiles.map((profile) => {
            const StatusIcon = statusIcons[profile.status];
            const statusColor = statusColors[profile.status];
            
            return (
              <button
                key={profile.id}
                onClick={() => setSelectedProfile(profile)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-200",
                  selectedProfile?.id === profile.id
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-secondary/50 border border-transparent"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    selectedProfile?.id === profile.id ? "bg-primary/20" : "bg-secondary"
                  )}
                >
                  <Factory className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-medium", 
                      selectedProfile?.id === profile.id ? "text-primary" : "text-foreground"
                    )}>
                      {profile.name}
                    </span>
                    <StatusIcon className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {profile.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={cn("text-[10px] px-1.5 py-0.5 capitalize", statusColor)}
                    >
                      {profile.status}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                      {profile.recommendedAssetTypes.length} types
                    </Badge>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ListPane>

      <WorkPane
        title={selectedProfile ? selectedProfile.name : "Sector Profiles Catalog"}
        subtitle={selectedProfile 
          ? `${selectedProfile.sector} · ${selectedProfile.recommendedAssetTypes.length} asset types` 
          : "Manage sector-specific asset type profiles and configurations"
        }
        tabs={tabs}
        actions={
          selectedProfile && (
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              Configure Profile
            </Button>
          )
        }
      />
    </div>
  );
}

function ProfileOverview({ profile }: { profile: SectorProfile }) {
  const StatusIcon = statusIcons[profile.status];
  const statusColor = statusColors[profile.status];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <Factory className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">{profile.name}</CardTitle>
              <CardDescription className="mt-1">
                {profile.sector} Sector Profile
              </CardDescription>
              <div className="flex gap-4 mt-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge 
                    variant="outline" 
                    className={cn("ml-2 capitalize", statusColor)}
                  >
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {profile.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Asset Types:</span>
                  <span className="font-medium ml-2">{profile.recommendedAssetTypes.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Property Sets:</span>
                  <span className="font-medium ml-2">{profile.recommendedPropertySets.length}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{profile.description}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Profile Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Asset Types</span>
                <span className="text-sm font-medium">{profile.recommendedAssetTypes.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Property Sets</span>
                <span className="text-sm font-medium">{profile.recommendedPropertySets.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Lifecycle States</span>
                <span className="text-sm font-medium">{profile.recommendedLifecycleStates.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Features</span>
                <span className="text-sm font-medium">{profile.features.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Sector</span>
                <div className="text-sm font-medium capitalize">{profile.sector}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <div className="text-sm font-medium">{profile.lastUpdated}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Profile ID</span>
                <div className="text-sm font-medium font-mono">{profile.id}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Key Features</CardTitle>
          <CardDescription>
            Core capabilities and focus areas of this sector profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {profile.features.map((feature) => (
              <div key={feature} className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm">
                {feature}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileAssetTypes({ profile }: { profile: SectorProfile }) {
  const recommendedTypes = upstreamAssetTypes.filter(type => 
    profile.recommendedAssetTypes.includes(type.id)
  );

  // Group by category
  const groupedTypes = recommendedTypes.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = [];
    }
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, UpstreamAssetType[]>);

  // Category icons
  const categoryIcons = {
    well: Droplets,
    process: Factory,
    pipeline: Activity,
    instrumentation: Cpu,
    electrical: Zap
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {recommendedTypes.length} recommended asset types
        </p>
        <Button size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Asset Type
        </Button>
      </div>

      {Object.entries(groupedTypes).map(([category, types]) => {
        const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons] || Factory;
        
        return (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 capitalize">
                <CategoryIcon className="w-4 h-4" />
                {category} Equipment
                <Badge variant="secondary">{types.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {types.map((type) => (
                  <div key={type.id} className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                      <CategoryIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{type.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{type.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ProfilePropertySets({ profile }: { profile: SectorProfile }) {
  const recommendedPropertySets = upstreamPropertySets.filter(ps => 
    profile.recommendedPropertySets.includes(ps.id)
  );

  // Property set type icons
  const propertySetTypeIcons = {
    process: Activity,
    mechanical: Wrench,
    electrical: Zap,
    safety: Shield,
    pipeline: Database
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {recommendedPropertySets.length} recommended property sets
        </p>
        <Button size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Property Set
        </Button>
      </div>
      
      <div className="space-y-4">
        {recommendedPropertySets.map((propertySet) => {
          const IconComponent = propertySetTypeIcons[propertySet.type] || Database;
          
          return (
            <Card key={propertySet.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{propertySet.name}</CardTitle>
                      <CardDescription className="capitalize">
                        {propertySet.type} · {propertySet.fields.length} fields
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {propertySet.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{propertySet.description}</p>
                <div className="grid grid-cols-2 gap-2">
                  {propertySet.fields.slice(0, 4).map((field) => (
                    <div key={field.id} className="text-xs bg-secondary/30 rounded px-2 py-1">
                      <span className="font-medium">{field.label}</span>
                      {field.unit && <span className="text-muted-foreground ml-1">({field.unit})</span>}
                    </div>
                  ))}
                  {propertySet.fields.length > 4 && (
                    <div className="text-xs text-muted-foreground px-2 py-1">
                      +{propertySet.fields.length - 4} more fields
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ProfileLifecycle({ profile }: { profile: SectorProfile }) {
  // Mock lifecycle states for the profile (in a real app, this would be filtered from actual data)
  const mockLifecycleStates = [
    { id: "lifecycle-well-planned", name: "Planned", category: "well", order: 1, description: "Well planning and permitting phase" },
    { id: "lifecycle-well-drilling", name: "Drilling", category: "well", order: 2, description: "Active drilling operations" },
    { id: "lifecycle-well-completing", name: "Completing", category: "well", order: 3, description: "Well completion and testing" },
    { id: "lifecycle-well-producing", name: "Producing", category: "well", order: 4, description: "Active production phase" },
    { id: "lifecycle-well-shut-in", name: "Shut-in", category: "well", order: 5, description: "Temporarily shut-in well" },
    { id: "lifecycle-well-pa", name: "P&A", category: "well", order: 6, description: "Plugged and abandoned" },
    { id: "lifecycle-process-commissioning", name: "Commissioning", category: "process", order: 1, description: "Equipment commissioning and startup" },
    { id: "lifecycle-process-active", name: "Active", category: "process", order: 2, description: "Normal operation" },
    { id: "lifecycle-process-maintenance", name: "Under Maintenance", category: "process", order: 3, description: "Scheduled maintenance" },
    { id: "lifecycle-process-mothballed", name: "Mothballed", category: "process", order: 4, description: "Temporarily out of service" },
    { id: "lifecycle-process-decommissioned", name: "Decommissioned", category: "process", order: 5, description: "Permanently decommissioned" }
  ];

  // Group by category
  const groupedStates = mockLifecycleStates.reduce((acc, state) => {
    if (!acc[state.category]) {
      acc[state.category] = [];
    }
    acc[state.category].push(state);
    return acc;
  }, {} as Record<string, typeof mockLifecycleStates>);

  // Category icons
  const categoryIcons = {
    well: Droplets,
    process: Factory,
    pipeline: Activity
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {mockLifecycleStates.length} lifecycle states configured
        </p>
        <Button size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Lifecycle State
        </Button>
      </div>

      {Object.entries(groupedStates).map(([category, states]) => {
        const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons] || Factory;
        const categoryName = category === "well" ? "Wells" : 
                           category === "process" ? "Process Equipment" : 
                           category.charAt(0).toUpperCase() + category.slice(1);
        
        return (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CategoryIcon className="w-4 h-4" />
                {categoryName} Lifecycle
                <Badge variant="secondary">{states.length} states</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {states.sort((a, b) => a.order - b.order).map((state) => (
                  <div key={state.id} className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg">
                    <Badge variant="outline" className="text-xs">
                      {state.order}
                    </Badge>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{state.name}</div>
                      <div className="text-xs text-muted-foreground">{state.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ProfilesCatalog({ 
  profiles, 
  onSelect 
}: { 
  profiles: SectorProfile[]; 
  onSelect: (profile: SectorProfile) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-2">Sector Profiles</h2>
        <p className="text-muted-foreground">
          Manage sector-specific asset type profiles and configurations for different industry segments
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {profiles.map((profile) => {
          const StatusIcon = statusIcons[profile.status];
          const statusColor = statusColors[profile.status];
          
          return (
            <button
              key={profile.id}
              onClick={() => onSelect(profile)}
              className="bg-card border border-border rounded-lg p-6 text-left hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Factory className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{profile.name}</h3>
                    <Badge 
                      variant="outline" 
                      className={cn("capitalize", statusColor)}
                    >
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {profile.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    {profile.description}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Asset Types:</span>
                      <span className="font-medium ml-2">{profile.recommendedAssetTypes.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Property Sets:</span>
                      <span className="font-medium ml-2">{profile.recommendedPropertySets.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Features:</span>
                      <span className="font-medium ml-2">{profile.features.length}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-4">
                    {profile.features.slice(0, 4).map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {profile.features.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{profile.features.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}