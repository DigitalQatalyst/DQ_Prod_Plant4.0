import { describe, it, expect } from 'vitest';
import { performancePanels, simBoards, ciProjects, optimisationOpportunities } from '@/data/mockData';

describe('Sector-specific content filtering', () => {
  it('should include cross-sector core content for all sectors', () => {
    // Cross-sector content should not have sector/subsector properties
    const crossSectorPanels = performancePanels.filter(panel => !panel.sector && !panel.subsector);
    const crossSectorBoards = simBoards.filter(board => !board.sector && !board.subsector);
    const crossSectorProjects = ciProjects.filter(project => !project.sector && !project.subsector);
    const crossSectorOpportunities = optimisationOpportunities.filter(opp => !opp.sector && !opp.subsector);

    expect(crossSectorPanels.length).toBeGreaterThan(0);
    expect(crossSectorBoards.length).toBeGreaterThan(0);
    expect(crossSectorProjects.length).toBeGreaterThan(0);
    expect(crossSectorOpportunities.length).toBeGreaterThan(0);
  });

  it('should include Oil & Gas Upstream specific content', () => {
    const upstreamPanels = performancePanels.filter(panel => 
      panel.sector === "Oil & Gas" && panel.subsector === "Upstream"
    );
    const upstreamBoards = simBoards.filter(board => 
      board.sector === "Oil & Gas" && board.subsector === "Upstream"
    );
    const upstreamProjects = ciProjects.filter(project => 
      project.sector === "Oil & Gas" && project.subsector === "Upstream"
    );
    const upstreamOpportunities = optimisationOpportunities.filter(opp => 
      opp.sector === "Oil & Gas" && opp.subsector === "Upstream"
    );

    expect(upstreamPanels.length).toBeGreaterThan(0);
    expect(upstreamBoards.length).toBeGreaterThan(0);
    expect(upstreamProjects.length).toBeGreaterThan(0);
    expect(upstreamOpportunities.length).toBeGreaterThan(0);

    // Verify sector-specific terminology
    expect(upstreamPanels.some(panel => panel.name.includes('Well'))).toBe(true);
    expect(upstreamProjects.some(project => project.title.includes('Deferment'))).toBe(true);
    expect(upstreamOpportunities.some(opp => opp.title.includes('ESP'))).toBe(true);
  });

  it('should include Power Transmission specific content', () => {
    const transmissionPanels = performancePanels.filter(panel => 
      panel.sector === "Power" && panel.subsector === "Transmission"
    );
    const transmissionBoards = simBoards.filter(board => 
      board.sector === "Power" && board.subsector === "Transmission"
    );
    const transmissionProjects = ciProjects.filter(project => 
      project.sector === "Power" && project.subsector === "Transmission"
    );
    const transmissionOpportunities = optimisationOpportunities.filter(opp => 
      opp.sector === "Power" && opp.subsector === "Transmission"
    );

    expect(transmissionPanels.length).toBeGreaterThan(0);
    expect(transmissionBoards.length).toBeGreaterThan(0);
    expect(transmissionProjects.length).toBeGreaterThan(0);
    expect(transmissionOpportunities.length).toBeGreaterThan(0);

    // Verify sector-specific terminology
    expect(transmissionPanels.some(panel => panel.name.includes('Grid'))).toBe(true);
    expect(transmissionProjects.some(project => project.title.includes('Relay'))).toBe(true);
    expect(transmissionOpportunities.some(opp => opp.title.includes('Load Balancing'))).toBe(true);
  });

  it('should include FMCG Food & Beverage specific content', () => {
    const fmcgPanels = performancePanels.filter(panel => 
      panel.sector === "FMCG" && panel.subsector === "Food & Beverage"
    );
    const fmcgBoards = simBoards.filter(board => 
      board.sector === "FMCG" && board.subsector === "Food & Beverage"
    );
    const fmcgProjects = ciProjects.filter(project => 
      project.sector === "FMCG" && project.subsector === "Food & Beverage"
    );
    const fmcgOpportunities = optimisationOpportunities.filter(opp => 
      opp.sector === "FMCG" && opp.subsector === "Food & Beverage"
    );

    expect(fmcgPanels.length).toBeGreaterThan(0);
    expect(fmcgBoards.length).toBeGreaterThan(0);
    expect(fmcgProjects.length).toBeGreaterThan(0);
    expect(fmcgOpportunities.length).toBeGreaterThan(0);

    // Verify sector-specific terminology
    expect(fmcgPanels.some(panel => panel.name.includes('Bottling') || panel.name.includes('Packaging'))).toBe(true);
    expect(fmcgProjects.some(project => project.title.includes('SMED') || project.title.includes('Changeover'))).toBe(true);
    expect(fmcgOpportunities.some(opp => opp.title.includes('SKU'))).toBe(true);
  });

  it('should filter content correctly based on sector selection', () => {
    // Simulate filtering logic from the components
    const filterBySector = (items: any[], sectorName: string, subsectorName: string) => {
      return items.filter(item => {
        // Always include cross-sector core content
        if (!item.sector || !item.subsector) {
          return true;
        }
        // Include sector-specific content that matches selection
        return item.sector === sectorName && item.subsector === subsectorName;
      });
    };

    // Test Oil & Gas filtering
    const oilGasFiltered = filterBySector(performancePanels, "Oil & Gas", "Upstream");
    const crossSectorCount = performancePanels.filter(p => !p.sector && !p.subsector).length;
    const upstreamCount = performancePanels.filter(p => p.sector === "Oil & Gas" && p.subsector === "Upstream").length;
    
    expect(oilGasFiltered.length).toBe(crossSectorCount + upstreamCount);

    // Test Power filtering
    const powerFiltered = filterBySector(performancePanels, "Power", "Transmission");
    const transmissionCount = performancePanels.filter(p => p.sector === "Power" && p.subsector === "Transmission").length;
    
    expect(powerFiltered.length).toBe(crossSectorCount + transmissionCount);

    // Test FMCG filtering
    const fmcgFiltered = filterBySector(performancePanels, "FMCG", "Food & Beverage");
    const fmcgCount = performancePanels.filter(p => p.sector === "FMCG" && p.subsector === "Food & Beverage").length;
    
    expect(fmcgFiltered.length).toBe(crossSectorCount + fmcgCount);
  });
});