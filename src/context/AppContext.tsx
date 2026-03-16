import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useMemo } from "react";
import { Tenant, UserPersona, Asset, AssetStatus, Sector, UpstreamEnergyMeter, EnergyTelemetry, EnergyBaseline, UpstreamTariffs, UpstreamEmissionFactors } from "@/types/navigation";
import {
  UpstreamAsset,
  LinearAsset,
  UpstreamDiscoveryJob,
  DiscoveryAgent,
  ConnectionEndpoint,
  UpstreamTenant,
  CandidateAsset
} from "@/types/assets";
import {
  tenants,
  assetsByTenant,
  sectors,
  upstreamEnergyMeters,
  transmissionEnergyMeters,
  upstreamEnergyTelemetry,
  upstreamEnergyBaselines,
  upstreamTariffs,
  upstreamEmissionFactors,
  upstreamSubmeters,
  upstreamPowerQuality,
  upstreamProductionContext,
  upstreamEnergyBenchmarks,
  upstreamEnergyAnomalies,
  transmissionEnergyAnomalies,
  ProductionContext
} from "@/data/mockData";
import {
  findMatchingItemAfterSectorSwitch,
  shouldPreserveSelection,
  type SelectableItem,
  type SectorSwitchContext
} from "@/lib/sectorSwitchingUtils";
import {
  StateErrorHandler,
  NavigationErrorHandler,
  ContentErrorHandler
} from "@/lib/errorHandling";
import { supabase, getDataBackend } from "@/lib/supabase";
import { getTransmissionTenantId, getUpstreamTenantId } from "@/lib/tenantUtils";

// PopPane content types for quick views
export type PopPaneContentType =
  | "discovery-job"
  | "discovery-agent"
  | "connection-endpoint"
  | "upstream-asset"
  | "linear-asset"
  | "candidate-asset"
  | "asset"
  | "sim-issue"
  | "ci-project"
  | "optimization-scenario"
  | "ai-recommendation"
  | "optimization-playbook"
  | null;

export interface SectorSpecificModalData {
  modalType: 'sim-issue' | 'ci-project' | 'optimization-scenario' | 'ai-recommendation' | 'optimization-playbook';
  sector: string;
  subsector: string;
  title: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'number' | 'date';
    options?: string[];
    required?: boolean;
    placeholder?: string;
  }>;
}

export interface PopPaneContent {
  type: PopPaneContentType;
  data: UpstreamDiscoveryJob | DiscoveryAgent | ConnectionEndpoint | UpstreamAsset | LinearAsset | CandidateAsset | Asset | SectorSpecificModalData | null;
}

interface AppContextType {
  currentTenant: Tenant | UpstreamTenant;
  setCurrentTenant: (tenant: Tenant | UpstreamTenant) => void;
  userPersona: UserPersona;
  setUserPersona: (persona: UserPersona) => void;
  selectedAsset: Asset | UpstreamAsset | null;
  setSelectedAsset: (asset: Asset | UpstreamAsset | null) => void;
  assets: Asset[];
  isPopPaneOpen: boolean;
  setIsPopPaneOpen: (open: boolean) => void;
  popPaneContent: PopPaneContent;
  setPopPaneContent: (content: PopPaneContent) => void;
  currentSector: Sector;
  setCurrentSector: (sector: Sector) => void;
  currentSubsector: string;
  setCurrentSubsector: (subsector: string) => void;
  availableSubsectors: string[];
  availableOrganizations: Tenant[];
  // Upstream-specific metadata
  sector: string | null;
  subsector: string | null;
  isUpstreamTenant: boolean;
  // Upstream energy data
  energyMeters: UpstreamEnergyMeter[];
  energyTelemetry: Record<string, EnergyTelemetry>;
  energyBaselines: EnergyBaseline[];
  tariffs: UpstreamTariffs;
  emissionFactors: UpstreamEmissionFactors;
  // State preservation for sector switching
  preserveSelectionOnSectorSwitch: (newSector: Sector, newSubsector: string) => void;
  lastSelectedItemId: string | null;
  setLastSelectedItemId: (id: string | null) => void;
  // Error recovery functions
  resetToSafeState: () => void;
  recoverFromStateCorruption: () => void;
  isStateValid: () => boolean;
  // Upstream energy data extensions
  upstreamSubmeters: any[];
  upstreamPowerQuality: any;
  upstreamProductionContext: ProductionContext | null;
  upstreamEnergyBenchmarks: any;
  upstreamEnergyAnomalies: any[];
  transmissionEnergyAnomalies: any[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Refs to track the source of changes and prevent infinite loops
  const isUpdatingFromSector = useRef(false);
  const isUpdatingFromTenant = useRef(false);

  // Default safe state values
  const defaultSector = (sectors || []).find(s => s.id === "power") || (sectors || [])[0] || { id: 'unknown', name: 'Unknown', subsectors: [] };
  const defaultSubsector = (defaultSector.subsectors && defaultSector.subsectors.includes("Transmission")) ? "Transmission" : (defaultSector.subsectors && defaultSector.subsectors[0]) || "";
  const defaultPersona: UserPersona = { type: "firm", label: "Firm" };
  const defaultPopPaneContent: PopPaneContent = { type: null, data: null };

  // Get default organization for the default sector with error handling
  const getDefaultOrgForSector = (sectorId: string) => {
    try {
      const allTenants = tenants || [];
      const sectorOrgs = allTenants.filter(t => t.sector === sectorId);

      // Prioritize DEWA for Power/Transmission
      if (sectorId === 'power') {
        const dataBackend = 'supabase'; // import.meta.env.VITE_DATA_BACKEND;
        if (dataBackend === 'supabase' || dataBackend === 'hybrid') {
          const dewaTenant = allTenants.find(t => t.id === "t-dewa") || sectorOrgs.find(t => t.name === 'DEWA - Transmission');
          if (dewaTenant) return dewaTenant;
        } else {
          const dewa = allTenants.find(t => t.id === "t-dewa");
          if (dewa) return dewa;
        }
      }

      return sectorOrgs.length > 0 ? sectorOrgs[0] : allTenants[0];

    } catch (error) {
      ContentErrorHandler.handleContentLoadingFailure(
        "default_organization",
        error instanceof Error ? error : new Error(String(error))
      );
      return tenants[0]; // Safe fallback
    }
  };

  // State with error recovery
  const [currentSector, setCurrentSector] = useState<Sector>(() => {
    try {
      return defaultSector;
    } catch (error) {
      StateErrorHandler.handleStateCorruption("currentSector", error, defaultSector);
      return defaultSector;
    }
  });

  const [currentSubsector, setCurrentSubsector] = useState<string>(() => {
    try {
      return defaultSubsector;
    } catch (error) {
      StateErrorHandler.handleStateCorruption("currentSubsector", error, defaultSubsector);
      return defaultSubsector;
    }
  });

  // State preservation for sector switching
  const [lastSelectedItemId, setLastSelectedItemId] = useState<string | null>(null);
  const [lastSelectedItemType, setLastSelectedItemType] = useState<string | null>(null);

  // Set DEWA - Transmission as default tenant
  const defaultTenant = (tenants || []).find(t => t.id === "dewa-transmission") || (tenants || []).find(t => t.id === "t-dewa") || getDefaultOrgForSector(defaultSector.id);
  const [currentTenant, setCurrentTenant] = useState<Tenant | UpstreamTenant>(() => {
    try {
      return defaultTenant;
    } catch (error) {
      StateErrorHandler.handleStateCorruption("currentTenant", error, tenants[0]);
      return tenants[0];
    }
  });

  const [userPersona, setUserPersona] = useState<UserPersona>(() => {
    try {
      return defaultPersona;
    } catch (error) {
      StateErrorHandler.handleStateCorruption("userPersona", error, defaultPersona);
      return defaultPersona;
    }
  });

  const [selectedAsset, setSelectedAsset] = useState<Asset | UpstreamAsset | null>(null);
  const [isPopPaneOpen, setIsPopPaneOpen] = useState(false);
  const [popPaneContent, setPopPaneContent] = useState<PopPaneContent>(() => {
    try {
      return defaultPopPaneContent;
    } catch (error) {
      StateErrorHandler.handleStateCorruption("popPaneContent", error, defaultPopPaneContent);
      return defaultPopPaneContent;
    }
  });

  // Real assets from Supabase for hybrid/supabase mode
  const [realAssets, setRealAssets] = useState<Asset[] | null>(null);

  // Fetch real assets when tenant or sector context changes
  useEffect(() => {
    const fetchRealAssets = async () => {
      const mode = getDataBackend();
      if (mode !== 'supabase' && mode !== 'hybrid') {
        setRealAssets(null);
        return;
      }

      if (!supabase) {
        setRealAssets(null);
        return;
      }

      try {
        let tenantId = currentTenant.id;

        // Resolve real tenant ID if we know the context
        if (currentSector.id === 'power' && currentSubsector === 'Transmission') {
          tenantId = await getTransmissionTenantId(currentTenant.id);
        } else if (currentSector.id === 'oil-gas' && currentSubsector === 'Upstream') {
          tenantId = await getUpstreamTenantId(currentTenant.id);
        } else {
          // For other sectors, fallback to mock until implemented
          setRealAssets(null);
          return;
        }

        // If even after resolution it doesn't look like a real UUID, don't try to fetch
        if (tenantId === currentTenant.id && tenantId.length < 20) {
          setRealAssets(null);
          return;
        }

        console.log(`[AppContext] Fetching real assets for resolved tenant ${tenantId}...`);
        const { data, error } = await supabase
          .from('assets')
          .select('*, asset_types(name)')
          .eq('tenant_id', tenantId);

        if (error) throw error;

        if (data) {
          const mapped: Asset[] = data.map((a: any) => ({
            id: a.id,
            name: a.name,
            type: a.asset_types?.name || 'Asset',
            site: 'Main Facility', // Default or could join with sites table
            area: currentSubsector,
            status: a.status as AssetStatus,
            lastSeen: 'Live',
            criticality: a.criticality
          }));
          console.log(`[AppContext] Loaded ${mapped.length} real assets from Supabase.`);
          setRealAssets(mapped);
        }
      } catch (err) {
        console.error('[AppContext] Failed to load real assets:', err);
        setRealAssets(null);
      }
    };

    fetchRealAssets();
  }, [currentTenant.id, currentSector.id, currentSubsector]);

  // Computed values with error handling
  const assets = useMemo(() => {
    // Priority 1: Real assets from Supabase
    if (realAssets !== null && realAssets.length > 0) {
      return realAssets;
    }

    // Priority 2: Mock assets by tenant
    try {
      return assetsByTenant[currentTenant.id] || [];
    } catch (error) {
      ContentErrorHandler.handleContentLoadingFailure(
        "tenant_assets",
        error instanceof Error ? error : new Error(String(error))
      );
      return [];
    }
  }, [realAssets, currentTenant.id]);

  const availableSubsectors = (() => {
    try {
      return currentSector.subsectors || [];
    } catch (error) {
      ContentErrorHandler.handleContentLoadingFailure(
        "available_subsectors",
        error instanceof Error ? error : new Error(String(error))
      );
      return [];
    }
  })();

  // Get organizations available for the current sector with error handling
  const availableOrganizations = (() => {
    try {
      return tenants.filter(t => t.sector === currentSector.id);
    } catch (error) {
      ContentErrorHandler.handleContentLoadingFailure(
        "available_organizations",
        error instanceof Error ? error : new Error(String(error))
      );
      return tenants; // Safe fallback to all tenants
    }
  })();

  // Computed values derived from current state
  const sector = (currentTenant as any).sector || null;
  const subsector = (currentTenant as any).subsector || null;
  const isUpstreamTenant = 'industry' in currentTenant ? currentTenant.industry === "Oil & Gas – Upstream" : false;

  // Enhanced setSelectedAsset that tracks selection for state preservation with error handling
  const setSelectedAssetWithTracking = (asset: Asset | UpstreamAsset | null) => {
    try {
      setSelectedAsset(asset);
      if (asset) {
        setLastSelectedItemId(asset.id);
        // Determine item type based on the asset structure
        if ('wellUptime' in asset) {
          setLastSelectedItemType('upstream-performance');
        } else if ('lineLoading' in asset) {
          setLastSelectedItemType('transmission-performance');
        } else if ('lineOEE' in asset) {
          setLastSelectedItemType('fmcg-performance');
        } else if ('shift' in asset) {
          setLastSelectedItemType('sim-board');
        } else if ('stage' in asset) {
          setLastSelectedItemType('ci-project');
        } else if ('rank' in asset) {
          setLastSelectedItemType('optimization-opportunity');
        } else {
          setLastSelectedItemType('performance-panel');
        }
      } else {
        setLastSelectedItemId(null);
        setLastSelectedItemType(null);
      }
    } catch (error) {
      StateErrorHandler.handleStateCorruption(
        "selectedAsset",
        error,
        null
      );
      // Reset to safe state
      setSelectedAsset(null);
      setLastSelectedItemId(null);
      setLastSelectedItemType(null);
    }
  };

  // Error recovery functions
  const resetToSafeState = () => {
    try {
      setCurrentSector(defaultSector);
      setCurrentSubsector(defaultSubsector);
      setCurrentTenant(getDefaultOrgForSector(defaultSector.id));
      setUserPersona(defaultPersona);
      setSelectedAsset(null);
      setIsPopPaneOpen(false);
      setPopPaneContent(defaultPopPaneContent);
      setLastSelectedItemId(null);
      setLastSelectedItemType(null);
    } catch (error) {
      // If even the reset fails, force a page reload
      window.location.reload();
    }
  };

  const recoverFromStateCorruption = () => {
    try {
      // Validate current state and reset corrupted parts
      if (!StateErrorHandler.validateState(currentSector, (s) => s && s.id && s.name, "currentSector")) {
        setCurrentSector(defaultSector);
      }

      if (!StateErrorHandler.validateState(currentSubsector, (s) => typeof s === 'string' && s.length > 0, "currentSubsector")) {
        setCurrentSubsector(defaultSubsector);
      }

      if (!StateErrorHandler.validateState(currentTenant, (t) => t && t.id && t.name, "currentTenant")) {
        setCurrentTenant(getDefaultOrgForSector(currentSector.id));
      }

      if (!StateErrorHandler.validateState(userPersona, (p) => p && p.type && p.label, "userPersona")) {
        setUserPersona(defaultPersona);
      }

      if (!StateErrorHandler.validateState(popPaneContent, (c) => c && typeof c.type !== 'undefined', "popPaneContent")) {
        setPopPaneContent(defaultPopPaneContent);
      }
    } catch (error) {
      // If recovery fails, reset to completely safe state
      resetToSafeState();
    }
  };

  const isStateValid = () => {
    try {
      return (
        StateErrorHandler.validateState(currentSector, (s) => s && s.id && s.name, "currentSector") &&
        StateErrorHandler.validateState(currentSubsector, (s) => typeof s === 'string' && s.length > 0, "currentSubsector") &&
        StateErrorHandler.validateState(currentTenant, (t) => t && t.id && t.name, "currentTenant") &&
        StateErrorHandler.validateState(userPersona, (p) => p && p.type && p.label, "userPersona") &&
        StateErrorHandler.validateState(popPaneContent, (c) => c && typeof c.type !== 'undefined', "popPaneContent")
      );
    } catch (error) {
      return false;
    }
  };

  // Function to preserve selection when switching sectors with error handling
  const preserveSelectionOnSectorSwitch = (newSector: Sector, newSubsector: string) => {
    try {
      if (!lastSelectedItemId || !lastSelectedItemType || !selectedAsset) {
        return; // Nothing to preserve
      }

      // Check if current selection should be preserved as-is
      if (shouldPreserveSelection(selectedAsset as unknown as SelectableItem, newSector.name, newSubsector)) {
        return; // Current selection is still valid, no change needed
      }

      // Create context for finding matching item
      const context: SectorSwitchContext = {
        previousSector: currentSector.name,
        previousSubsector: currentSubsector,
        newSector: newSector.name,
        newSubsector: newSubsector,
        selectedItemId: lastSelectedItemId,
        selectedItemType: lastSelectedItemType
      };

      // Find the best matching item in the new sector context
      const matchingItem = findMatchingItemAfterSectorSwitch(context);

      // Update selection
      if (matchingItem) {
        setSelectedAsset(matchingItem as any);
      } else {
        // If no matching item found, clear selection but keep the ID for potential future matches
        setSelectedAsset(null);
      }
    } catch (error) {
      ContentErrorHandler.handleContentLoadingFailure(
        "sector_switch_preservation",
        error instanceof Error ? error : new Error(String(error))
      );
      // Safe fallback - clear selection
      setSelectedAsset(null);
    }
  };

  // Auto-update subsector and organization when sector changes (user initiated) with error handling
  useEffect(() => {
    try {
      if (isUpdatingFromTenant.current) {
        isUpdatingFromTenant.current = false;
        return;
      }

      isUpdatingFromSector.current = true;

      let newSubsector = currentSubsector;

      if (currentSector.subsectors && currentSector.subsectors.length > 0) {
        let defaultSubsector = currentSector.subsectors[0]; // fallback to first

        // Set smart defaults based on sector
        if (currentSector.id === "oil-gas") {
          defaultSubsector = "Upstream";
        } else if (currentSector.id === "power") {
          defaultSubsector = "Transmission";
        } else if (currentSector.id === "fmcg") {
          defaultSubsector = "Food & Beverage";
        }

        // Only update if the current subsector is not available in the new sector
        if (!currentSector.subsectors.includes(currentSubsector)) {
          newSubsector = defaultSubsector;
          setCurrentSubsector(defaultSubsector);
        }
      }

      // Auto-switch organization when sector changes
      const currentTenantSector = currentTenant.sector;
      if (currentTenantSector !== currentSector.id) {
        const newOrg = getDefaultOrgForSector(currentSector.id);
        setCurrentTenant(newOrg);
      }

      // Preserve selection state when switching sectors
      preserveSelectionOnSectorSwitch(currentSector, newSubsector);

      setTimeout(() => {
        isUpdatingFromSector.current = false;
      }, 0);
    } catch (error) {
      StateErrorHandler.handleStateCorruption(
        "sector_update_effect",
        error,
        { sector: defaultSector, subsector: defaultSubsector }
      );
      // Recover to safe state
      recoverFromStateCorruption();
    }
  }, [currentSector]);

  // Auto-update sector when tenant/organization changes (user initiated) with error handling
  useEffect(() => {
    try {
      if (isUpdatingFromSector.current) {
        return;
      }

      isUpdatingFromTenant.current = true;

      // Check if tenant has sector and subsector information
      const tenantSector = (currentTenant as any).sector;
      const tenantSubsector = (currentTenant as any).subsector || ('subsector' in currentTenant ? (currentTenant as any).subsector : undefined);

      if (tenantSector && tenantSector !== currentSector.id) {
        const newSector = (sectors || []).find(s => s.id === tenantSector);
        if (newSector) {
          setCurrentSector(newSector);

          // Use tenant's specific subsector if available, otherwise use smart defaults
          let newSubsector = tenantSubsector || newSector.subsectors[0]; // fallback to first

          // Validate that the tenant's subsector exists in the new sector
          if (tenantSubsector && newSector.subsectors.includes(tenantSubsector)) {
            newSubsector = tenantSubsector;
          } else {
            // Set smart defaults based on sector if tenant subsector is not valid
            if (tenantSector === "oil-gas") {
              newSubsector = "Upstream";
            } else if (tenantSector === "power") {
              newSubsector = "Transmission";
            } else if (tenantSector === "fmcg") {
              newSubsector = "Food & Beverage";
            } else if (tenantSector === "mining") {
              newSubsector = "Extraction";
            }
          }

          setCurrentSubsector(newSubsector);

          // Preserve selection state when switching sectors via tenant change
          preserveSelectionOnSectorSwitch(newSector, newSubsector);
        }
      }
    } catch (error) {
      StateErrorHandler.handleStateCorruption(
        "tenant_update_effect",
        error,
        { tenant: getDefaultOrgForSector(defaultSector.id) }
      );
      // Recover to safe state
      recoverFromStateCorruption();
    }
  }, [currentTenant]);

  // Handle subsector changes and preserve selection with error handling
  useEffect(() => {
    try {
      if (isUpdatingFromSector.current || isUpdatingFromTenant.current) {
        return;
      }

      // Preserve selection when subsector changes
      preserveSelectionOnSectorSwitch(currentSector, currentSubsector);
    } catch (error) {
      StateErrorHandler.handleStateCorruption(
        "subsector_update_effect",
        error,
        { subsector: defaultSubsector }
      );
      // Clear selection on error to prevent further issues
      setSelectedAsset(null);
    }
  }, [currentSubsector]);

  // Validate state on every render and recover if needed
  useEffect(() => {
    if (!isStateValid()) {
      recoverFromStateCorruption();
    }
  });

  // Filter energy data by selected tenant
  const energyMeters = useMemo(() => {
    // Determine sector and subsector safely
    const t = currentTenant as any;
    const isOilGas = t.industry?.includes("Oil") || t.sector === "oil-gas";
    const isPowerTransmission = t.subsector === "Transmission" || t.sector === "power" || t.id === "t-dewa";

    if (isOilGas) {
      return upstreamEnergyMeters;
    }
    if (isPowerTransmission) {
      return transmissionEnergyMeters;
    }
    return [];
  }, [currentTenant]);

  const energyTelemetry = useMemo(() => {
    return upstreamEnergyTelemetry || {};
  }, []);

  const energyBaselines = useMemo(() => {
    return upstreamEnergyBaselines || [];
  }, []);

  const tariffs = useMemo(() => {
    const t = currentTenant as any;
    const isOilGas = t.industry?.includes("Oil") || t.sector === "oil-gas";
    const isPower = t.sector === "power" || t.id === "t-dewa";

    if (isOilGas) {
      return upstreamTariffs;
    }
    if (isPower) {
      return {
        electricityUsdPerKWh: 0.12,
        gasUsdPerMMBtu: 0,
        dieselUsdPerLitre: 0
      };
    }
    return {
      electricityUsdPerKWh: 0.14, // Default baseline
      gasUsdPerMMBtu: 0,
      dieselUsdPerLitre: 0
    };
  }, [currentTenant]);

  const emissionFactors = useMemo(() => {
    const t = currentTenant as any;
    const isOilGas = t.industry?.includes("Oil") || t.sector === "oil-gas";
    const isPower = t.sector === "power" || t.id === "t-dewa";

    if (isOilGas) {
      return upstreamEmissionFactors;
    }
    if (isPower) {
      return {
        electricityKgCo2PerKWh: 0.45,
        gasKgCo2PerMMBtu: 0,
        dieselKgCo2PerLitre: 0
      };
    }
    return {
      electricityKgCo2PerKWh: 0.5, // Default baseline
      gasKgCo2PerMMBtu: 0,
      dieselKgCo2PerLitre: 0
    };
  }, [currentTenant]);

  const filteredUpstreamSubmeters = useMemo(() => {
    const t = currentTenant as any;
    if (t.id === "t-upstream" || t.industry?.includes("Oil") || t.sector === "oil-gas") {
      return upstreamSubmeters;
    }
    return [];
  }, [currentTenant]);

  const filteredUpstreamPowerQuality = useMemo(() => {
    if (currentTenant.id === "t-upstream" || currentTenant.id === "69083830-a193-4f8b-aab2-0d17349d286c") {
      return upstreamPowerQuality;
    }
    return {};
  }, [currentTenant.id]);

  return (
    <AppContext.Provider
      value={{
        currentTenant,
        setCurrentTenant,
        userPersona,
        setUserPersona,
        selectedAsset,
        setSelectedAsset: setSelectedAssetWithTracking,
        assets,
        isPopPaneOpen,
        setIsPopPaneOpen,
        popPaneContent,
        setPopPaneContent,
        currentSector,
        setCurrentSector,
        currentSubsector,
        setCurrentSubsector,
        availableSubsectors,
        availableOrganizations,
        sector,
        subsector,
        isUpstreamTenant: currentTenant.id === "t-upstream" || currentTenant.id === "69083830-a193-4f8b-aab2-0d17349d286c",
        energyMeters,
        energyTelemetry,
        energyBaselines,
        tariffs,
        emissionFactors,
        preserveSelectionOnSectorSwitch,
        lastSelectedItemId,
        setLastSelectedItemId,
        resetToSafeState,
        recoverFromStateCorruption,
        isStateValid,
        upstreamSubmeters: filteredUpstreamSubmeters,
        upstreamPowerQuality: filteredUpstreamPowerQuality,
        upstreamProductionContext: (currentTenant.id === "t-upstream" || currentTenant.id === "69083830-a193-4f8b-aab2-0d17349d286c") ? upstreamProductionContext : null,
        upstreamEnergyBenchmarks: (currentTenant.id === "t-upstream" || currentTenant.id === "69083830-a193-4f8b-aab2-0d17349d286c") ? upstreamEnergyBenchmarks : null,
        upstreamEnergyAnomalies: (currentTenant.id === "t-upstream" || currentTenant.id === "69083830-a193-4f8b-aab2-0d17349d286c") ? upstreamEnergyAnomalies : [],
        transmissionEnergyAnomalies: (currentTenant.id === "t-transmission" || currentTenant.sector === 'power') ? transmissionEnergyAnomalies : [],
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}