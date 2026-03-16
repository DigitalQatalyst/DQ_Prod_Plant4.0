import { describe, it, expect } from 'vitest';
import { 
  findMatchingItemAfterSectorSwitch, 
  shouldPreserveSelection,
  type SectorSwitchContext 
} from '../sectorSwitchingUtils';
import { performancePanels, simBoards, ciProjects, optimisationOpportunities } from '@/data/mockData';

describe('Sector Switching Utils', () => {
  describe('findMatchingItemAfterSectorSwitch', () => {
    it('should find exact ID match when item exists in new sector', () => {
      // Find a cross-sector performance panel
      const crossSectorPanel = performancePanels.find(p => !p.sector && !p.subsector);
      expect(crossSectorPanel).toBeDefined();

      const context: SectorSwitchContext = {
        previousSector: 'Oil & Gas',
        previousSubsector: 'Upstream',
        newSector: 'Power',
        newSubsector: 'Transmission',
        selectedItemId: crossSectorPanel!.id,
        selectedItemType: 'performance-panel'
      };

      const result = findMatchingItemAfterSectorSwitch(context);
      expect(result).toBeDefined();
      expect(result?.id).toBe(crossSectorPanel!.id);
    });

    it('should find sector-specific item when switching to that sector', () => {
      const context: SectorSwitchContext = {
        previousSector: 'Oil & Gas',
        previousSubsector: 'Upstream',
        newSector: 'Power',
        newSubsector: 'Transmission',
        selectedItemId: 'non-existent-id',
        selectedItemType: 'performance-panel'
      };

      const result = findMatchingItemAfterSectorSwitch(context);
      expect(result).toBeDefined();
      
      // Should find a Power/Transmission specific panel or cross-sector panel
      if (result && 'sector' in result && result.sector) {
        expect(result.sector).toBe('Power');
        expect(result.subsector).toBe('Transmission');
      } else {
        // Or it should be cross-sector content
        expect(!('sector' in result) || !result.sector).toBe(true);
      }
    });

    it('should return null for invalid item type', () => {
      const context: SectorSwitchContext = {
        previousSector: 'Oil & Gas',
        previousSubsector: 'Upstream',
        newSector: 'Power',
        newSubsector: 'Transmission',
        selectedItemId: 'test-id',
        selectedItemType: 'invalid-type'
      };

      const result = findMatchingItemAfterSectorSwitch(context);
      expect(result).toBeNull();
    });

    it('should handle SIM board switching', () => {
      const upstreamBoard = simBoards.find(b => b.sector === 'Oil & Gas' && b.subsector === 'Upstream');
      
      if (upstreamBoard) {
        const context: SectorSwitchContext = {
          previousSector: 'Oil & Gas',
          previousSubsector: 'Upstream',
          newSector: 'Power',
          newSubsector: 'Transmission',
          selectedItemId: upstreamBoard.id,
          selectedItemType: 'sim-board'
        };

        const result = findMatchingItemAfterSectorSwitch(context);
        expect(result).toBeDefined();
        
        // Should find a Power/Transmission board or cross-sector board
        if (result && 'sector' in result && result.sector) {
          expect(result.sector).toBe('Power');
          expect(result.subsector).toBe('Transmission');
        }
      }
    });

    it('should handle CI project switching', () => {
      const context: SectorSwitchContext = {
        previousSector: 'Oil & Gas',
        previousSubsector: 'Upstream',
        newSector: 'FMCG',
        newSubsector: 'Food & Beverage',
        selectedItemId: 'non-existent-project',
        selectedItemType: 'ci-project'
      };

      const result = findMatchingItemAfterSectorSwitch(context);
      expect(result).toBeDefined();
      
      // Should find an FMCG project or cross-sector project
      if (result && 'sector' in result && result.sector) {
        expect(result.sector).toBe('FMCG');
        expect(result.subsector).toBe('Food & Beverage');
      }
    });

    it('should handle optimization opportunity switching', () => {
      const context: SectorSwitchContext = {
        previousSector: 'Power',
        previousSubsector: 'Transmission',
        newSector: 'Oil & Gas',
        newSubsector: 'Upstream',
        selectedItemId: 'non-existent-opportunity',
        selectedItemType: 'optimization-opportunity'
      };

      const result = findMatchingItemAfterSectorSwitch(context);
      expect(result).toBeDefined();
      
      // Should find an upstream opportunity or cross-sector opportunity
      if (result && 'sector' in result && result.sector) {
        expect(result.sector).toBe('Oil & Gas');
        expect(result.subsector).toBe('Upstream');
      }
    });
  });

  describe('shouldPreserveSelection', () => {
    it('should preserve cross-sector content for any sector', () => {
      const crossSectorPanel = performancePanels.find(p => !p.sector && !p.subsector);
      expect(crossSectorPanel).toBeDefined();

      const shouldPreserve = shouldPreserveSelection(crossSectorPanel!, 'Power', 'Transmission');
      expect(shouldPreserve).toBe(true);
    });

    it('should preserve selection when item matches new sector', () => {
      const powerPanel = performancePanels.find(p => p.sector === 'Power' && p.subsector === 'Transmission');
      
      if (powerPanel) {
        const shouldPreserve = shouldPreserveSelection(powerPanel, 'Power', 'Transmission');
        expect(shouldPreserve).toBe(true);
      }
    });

    it('should not preserve selection when item does not match new sector', () => {
      const upstreamPanel = performancePanels.find(p => p.sector === 'Oil & Gas' && p.subsector === 'Upstream');
      
      if (upstreamPanel) {
        const shouldPreserve = shouldPreserveSelection(upstreamPanel, 'Power', 'Transmission');
        expect(shouldPreserve).toBe(false);
      }
    });

    it('should return false for null selection', () => {
      const shouldPreserve = shouldPreserveSelection(null, 'Power', 'Transmission');
      expect(shouldPreserve).toBe(false);
    });
  });

  describe('sector content filtering', () => {
    it('should include cross-sector content for all sectors', () => {
      const crossSectorPanels = performancePanels.filter(p => !p.sector && !p.subsector);
      const crossSectorBoards = simBoards.filter(b => !b.sector && !b.subsector);
      const crossSectorProjects = ciProjects.filter(p => !p.sector && !p.subsector);
      const crossSectorOpportunities = optimisationOpportunities.filter(o => !o.sector && !o.subsector);

      expect(crossSectorPanels.length).toBeGreaterThan(0);
      expect(crossSectorBoards.length).toBeGreaterThan(0);
      expect(crossSectorProjects.length).toBeGreaterThan(0);
      expect(crossSectorOpportunities.length).toBeGreaterThan(0);
    });

    it('should include sector-specific content for matching sectors', () => {
      const upstreamPanels = performancePanels.filter(p => p.sector === 'Oil & Gas' && p.subsector === 'Upstream');
      const transmissionPanels = performancePanels.filter(p => p.sector === 'Power' && p.subsector === 'Transmission');
      const fmcgPanels = performancePanels.filter(p => p.sector === 'FMCG' && p.subsector === 'Food & Beverage');

      expect(upstreamPanels.length).toBeGreaterThan(0);
      expect(transmissionPanels.length).toBeGreaterThan(0);
      expect(fmcgPanels.length).toBeGreaterThan(0);
    });

    it('should filter content correctly for each sector', () => {
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
});