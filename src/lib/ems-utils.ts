import { cn } from "@/lib/utils";

/**
 * EMS-specific utility functions for consistent UI design
 * Following Plant4.0 design system requirements
 */

/**
 * Get consistent CSS classes for EMS list items
 */
export function getEMSListItemClasses(isSelected: boolean) {
  return cn(
    "ems-list-item",
    isSelected && "ems-list-item-selected"
  );
}

/**
 * Get consistent CSS classes for EMS list item icons
 */
export function getEMSListItemIconClasses(isSelected: boolean) {
  return cn(
    "ems-list-item-icon",
    isSelected && "ems-list-item-icon-selected"
  );
}

/**
 * Get consistent CSS classes for energy type icons
 */
export function getEnergyIconClasses(energyType: string) {
  const baseClasses = "ems-energy-icon";
  
  switch (energyType.toLowerCase()) {
    case 'electricity':
      return cn(baseClasses, "ems-energy-icon-electricity");
    case 'gas':
      return cn(baseClasses, "ems-energy-icon-gas");
    case 'diesel':
      return cn(baseClasses, "ems-energy-icon-diesel");
    case 'steam':
      return cn(baseClasses, "ems-energy-icon-steam");
    default:
      return cn(baseClasses, "text-gray-500");
  }
}

/**
 * Format energy values consistently across EMS pages
 */
export function formatEnergyValue(value: number, unit: string, decimals: number = 1): string {
  return `${value.toFixed(decimals)} ${unit}`;
}

/**
 * Format cost values consistently across EMS pages
 */
export function formatCostValue(value: number, currency: string = "USD"): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format CO2 emissions consistently across EMS pages
 */
export function formatCO2Value(value: number, unit: string = "kg"): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)} t ${unit.replace('kg', 'CO₂')}`;
  }
  return `${value.toFixed(1)} ${unit} CO₂`;
}

/**
 * Get status color classes for consistent status indicators
 */
export function getStatusColorClasses(status: string) {
  switch (status.toLowerCase()) {
    case 'normal':
    case 'online':
    case 'active':
    case 'pass':
    case 'available':
      return "text-success bg-success/20";
    case 'high':
    case 'pending':
    case 'planned':
    case 'watch':
    case 'unavailable':
      return "text-warning bg-warning/20";
    case 'critical':
    case 'offline':
    case 'fail':
    case 'shedding':
      return "text-destructive bg-destructive/20";
    case 'maintenance':
      return "text-purple-500 bg-purple-500/20";
    default:
      return "text-muted-foreground bg-muted";
  }
}

/**
 * Ensure consistent sector and subsector display
 */
export function getDefaultSectorInfo() {
  return {
    sector: "Oil & Gas",
    subsector: "Upstream"
  };
}

/**
 * Get consistent feature set names for EMS pages
 */
export const EMS_FEATURE_SETS = {
  MONITORING: "Energy Monitoring & Metering",
  ANALYTICS: "Energy Analytics & Optimisation", 
  SUSTAINABILITY: "Sustainability & Emissions Tracking",
  CONTROL: "Energy Control Advisory & Integration",
  DASHBOARDS: "Energy Dashboards & Reporting"
} as const;

/**
 * Get consistent page titles for EMS features
 */
export const EMS_PAGE_TITLES = {
  // Monitoring & Metering
  REAL_TIME: "Real-time Consumption",
  SUB_METERING: "Sub-metering",
  POWER_QUALITY: "Power Quality",
  BASELINE_TRENDS: "Baseline Trends", 
  MULTI_FLUID: "Multi-fluid Monitoring",
  
  // Analytics & Optimisation
  EFFICIENCY_KPIS: "Efficiency KPIs",
  LOAD_PROFILING: "Load Profiling",
  PEAK_DEMAND: "Peak Demand",
  WASTE_DETECTION: "Waste Detection",
  AI_OPTIMISATION: "AI Optimisation",
  
  // Sustainability & Emissions
  CARBON_CALCULATION: "Carbon Calculation",
  ENERGY_INTENSITY: "Energy Intensity",
  RENEWABLES: "Renewables",
  ESG_REPORTING: "ESG Reporting",
  COMPLIANCE: "Compliance",
  
  // Control & Integration
  LOAD_BALANCING: "Load Balancing",
  DEMAND_RESPONSE: "Demand Response", 
  ASSET_MODES: "Asset Modes",
  INTEGRATION: "Integration",
  EFFICIENCY_CURVES: "Efficiency Curves",
  
  // Dashboards & Reporting
  CUSTOM_DASHBOARDS: "Custom Dashboards",
  PERIOD_COMPARISON: "Period Comparison",
  COST_ANALYSIS: "Cost Analysis",
  ANOMALIES: "Anomalies",
  AUDIT_REPORTS: "Audit Reports"
} as const;