// Demonstration of seamless tenant switching functionality
import { tenants, sectors } from '@/data/mockData';

export interface TenantSwitchDemo {
  fromTenant: string;
  toTenant: string;
  fromSector: string;
  toSector: string;
  fromSubsector: string;
  toSubsector: string;
  description: string;
}

// Examples of seamless tenant switching
export const tenantSwitchExamples: TenantSwitchDemo[] = [
  {
    fromTenant: "Kenya Power",
    toTenant: "Saudi Aramco", 
    fromSector: "Power & Utilities",
    toSector: "Oil & Gas",
    fromSubsector: "Transmission",
    toSubsector: "Upstream",
    description: "Switching from Kenya Power (Power/Transmission) to Saudi Aramco (Oil & Gas/Upstream)"
  },
  {
    fromTenant: "Saudi Aramco",
    toTenant: "Nestlé East Africa",
    fromSector: "Oil & Gas", 
    toSector: "FMCG & Manufacturing",
    fromSubsector: "Upstream",
    toSubsector: "Food & Beverage",
    description: "Switching from Saudi Aramco (Oil & Gas/Upstream) to Nestlé (FMCG/Food & Beverage)"
  },
  {
    fromTenant: "Bamburi Cement",
    toTenant: "AngloGold Ashanti",
    fromSector: "FMCG & Manufacturing",
    toSector: "Mining & Metals", 
    fromSubsector: "Industrial Manufacturing",
    toSubsector: "Extraction",
    description: "Switching from Bamburi Cement (FMCG/Manufacturing) to AngloGold (Mining/Extraction)"
  }
];

// Function to demonstrate the switching logic
export function demonstrateTenantSwitching() {
  console.log("🏢 Available Tenants with Sector/Subsector Information:");
  console.log("=" .repeat(60));
  
  tenants.forEach(tenant => {
    const sector = sectors.find(s => s.id === tenant.sector);
    console.log(`${tenant.name}`);
    console.log(`  Industry: ${tenant.industry}`);
    console.log(`  Sector: ${sector?.name || 'Unknown'} (${tenant.sector})`);
    console.log(`  Subsector: ${tenant.subsector}`);
    console.log("");
  });
  
  console.log("🔄 Seamless Switching Examples:");
  console.log("=" .repeat(60));
  
  tenantSwitchExamples.forEach((example, index) => {
    console.log(`${index + 1}. ${example.description}`);
    console.log(`   ${example.fromSector}/${example.fromSubsector} → ${example.toSector}/${example.toSubsector}`);
    console.log("");
  });
}

// Function to get tenant by name
export function getTenantByName(name: string) {
  return tenants.find(t => t.name === name);
}

// Function to get all tenants in a specific sector
export function getTenantsBySector(sectorId: string) {
  return tenants.filter(t => t.sector === sectorId);
}

// Function to get all tenants in a specific subsector
export function getTenantsBySubsector(subsector: string) {
  return tenants.filter(t => t.subsector === subsector);
}