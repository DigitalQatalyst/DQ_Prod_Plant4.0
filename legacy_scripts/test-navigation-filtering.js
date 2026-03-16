// Quick test to verify navigation filtering logic
import { getFilteredNavigation } from './src/lib/navigationFiltering.js';
import { featureAreas } from './src/data/navigation.js';

// Mock sectors
const oilGasSector = { id: "oil-gas", name: "Oil & Gas", subsectors: ["Upstream"] };
const powerSector = { id: "power", name: "Power", subsectors: ["Transmission"] };

console.log("Testing Oil & Gas sector filtering...");
const oilGasNavigation = getFilteredNavigation(featureAreas, oilGasSector, "Upstream");
const oilGasPerformance = oilGasNavigation.find(area => area.id === "optimise")?.featureSets.find(set => set.id === "performance");
console.log("Oil & Gas Performance features:", oilGasPerformance?.features.map(f => f.name));

console.log("\nTesting Power sector filtering...");
const powerNavigation = getFilteredNavigation(featureAreas, powerSector, "Transmission");
const powerPerformance = powerNavigation.find(area => area.id === "optimise")?.featureSets.find(set => set.id === "performance");
console.log("Power Performance features:", powerPerformance?.features.map(f => f.name));