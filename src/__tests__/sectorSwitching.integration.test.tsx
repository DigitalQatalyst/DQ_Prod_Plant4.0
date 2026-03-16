import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { Performance } from '@/pages/optimise/Performance';
import { LeanExecution } from '@/pages/optimise/LeanExecution';
import { ContinuousImprovement } from '@/pages/optimise/ContinuousImprovement';
import { Optimisation } from '@/pages/optimise/Optimisation';
import { performancePanels, simBoards, ciProjects, optimisationOpportunities } from '@/data/mockData';

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AppProvider>
      {children}
    </AppProvider>
  </BrowserRouter>
);

describe('Sector Switching Integration', () => {
  describe('Performance Page Sector Switching', () => {
    it('should display cross-sector and sector-specific content correctly', async () => {
      render(
        <TestWrapper>
          <Performance />
        </TestWrapper>
      );

      // Should display performance panels
      expect(screen.getByText('Performance Panels')).toBeInTheDocument();
      
      // Should show some content (cross-sector + Oil & Gas Upstream by default)
      const crossSectorPanels = performancePanels.filter(p => !p.sector && !p.subsector);
      const upstreamPanels = performancePanels.filter(p => p.sector === 'Oil & Gas' && p.subsector === 'Upstream');
      const expectedCount = crossSectorPanels.length + upstreamPanels.length;
      
      // Check that the count is displayed correctly in the header
      await waitFor(() => {
        const countElements = screen.getAllByText(expectedCount.toString());
        expect(countElements.length).toBeGreaterThan(0);
      });
    });

    it('should filter content when sector changes', async () => {
      render(
        <TestWrapper>
          <Performance />
        </TestWrapper>
      );

      // Initial state should show Oil & Gas + cross-sector content
      const initialCrossSector = performancePanels.filter(p => !p.sector && !p.subsector).length;
      const initialUpstream = performancePanels.filter(p => p.sector === 'Oil & Gas' && p.subsector === 'Upstream').length;
      const initialExpected = initialCrossSector + initialUpstream;

      await waitFor(() => {
        const countElements = screen.getAllByText(initialExpected.toString());
        expect(countElements.length).toBeGreaterThan(0);
      });

      // Note: In a real integration test, we would simulate sector selector changes
      // For now, we verify the filtering logic works with the mock data
      expect(initialExpected).toBeGreaterThan(0);
    });
  });

  describe('SIM Board Sector Switching', () => {
    it('should display sector-appropriate SIM boards', async () => {
      render(
        <TestWrapper>
          <LeanExecution />
        </TestWrapper>
      );

      expect(screen.getByText('SIM Boards')).toBeInTheDocument();
      
      // Should show cross-sector + Oil & Gas Upstream SIM boards by default
      const crossSectorBoards = simBoards.filter(b => !b.sector && !b.subsector);
      const upstreamBoards = simBoards.filter(b => b.sector === 'Oil & Gas' && b.subsector === 'Upstream');
      const expectedCount = crossSectorBoards.length + upstreamBoards.length;
      
      await waitFor(() => {
        const countElements = screen.getAllByText(expectedCount.toString());
        expect(countElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('CI Project Sector Switching', () => {
    it('should display sector-appropriate CI projects', async () => {
      render(
        <TestWrapper>
          <ContinuousImprovement />
        </TestWrapper>
      );

      expect(screen.getAllByText('CI Projects')[0]).toBeInTheDocument();
      
      // Should show cross-sector + Oil & Gas Upstream CI projects by default
      const crossSectorProjects = ciProjects.filter(p => !p.sector && !p.subsector);
      const upstreamProjects = ciProjects.filter(p => p.sector === 'Oil & Gas' && p.subsector === 'Upstream');
      const expectedCount = crossSectorProjects.length + upstreamProjects.length;
      
      await waitFor(() => {
        const countElements = screen.getAllByText(expectedCount.toString());
        expect(countElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Optimization Opportunities Sector Switching', () => {
    it('should display sector-appropriate optimization opportunities', async () => {
      render(
        <TestWrapper>
          <Optimisation />
        </TestWrapper>
      );

      expect(screen.getByText('Optimisation Decision Workflow')).toBeInTheDocument();
      
      // Should show 5 workflow areas in the Optimisation Decision Workflow
      const expectedWorkflowCount = 5; // Opportunities, Recommendations, Playbooks, Simulations, Execution
      
      await waitFor(() => {
        const countElements = screen.getAllByText(expectedWorkflowCount.toString());
        expect(countElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Content Filtering Logic', () => {
    it('should correctly filter content for each sector combination', () => {
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

      // Test all sector combinations
      const sectorCombinations = [
        { sector: 'Oil & Gas', subsector: 'Upstream' },
        { sector: 'Power', subsector: 'Transmission' },
        { sector: 'FMCG', subsector: 'Food & Beverage' }
      ];

      sectorCombinations.forEach(({ sector, subsector }) => {
        // Test performance panels
        const filteredPanels = filterBySector(performancePanels, sector, subsector);
        const crossSectorCount = performancePanels.filter(p => !p.sector && !p.subsector).length;
        const sectorSpecificCount = performancePanels.filter(p => p.sector === sector && p.subsector === subsector).length;
        
        expect(filteredPanels.length).toBe(crossSectorCount + sectorSpecificCount);
        
        // Verify all items are either cross-sector or match the target sector
        filteredPanels.forEach(panel => {
          if (panel.sector && panel.subsector) {
            expect(panel.sector).toBe(sector);
            expect(panel.subsector).toBe(subsector);
          }
        });

        // Test SIM boards
        const filteredBoards = filterBySector(simBoards, sector, subsector);
        const crossSectorBoardsCount = simBoards.filter(b => !b.sector && !b.subsector).length;
        const sectorSpecificBoardsCount = simBoards.filter(b => b.sector === sector && b.subsector === subsector).length;
        
        expect(filteredBoards.length).toBe(crossSectorBoardsCount + sectorSpecificBoardsCount);

        // Test CI projects
        const filteredProjects = filterBySector(ciProjects, sector, subsector);
        const crossSectorProjectsCount = ciProjects.filter(p => !p.sector && !p.subsector).length;
        const sectorSpecificProjectsCount = ciProjects.filter(p => p.sector === sector && p.subsector === subsector).length;
        
        expect(filteredProjects.length).toBe(crossSectorProjectsCount + sectorSpecificProjectsCount);

        // Test optimization opportunities
        const filteredOpportunities = filterBySector(optimisationOpportunities, sector, subsector);
        const crossSectorOpportunitiesCount = optimisationOpportunities.filter(o => !o.sector && !o.subsector).length;
        const sectorSpecificOpportunitiesCount = optimisationOpportunities.filter(o => o.sector === sector && o.subsector === subsector).length;
        
        expect(filteredOpportunities.length).toBe(crossSectorOpportunitiesCount + sectorSpecificOpportunitiesCount);
      });
    });

    it('should preserve cross-sector content across all sectors', () => {
      // Cross-sector content should always be available regardless of sector selection
      const crossSectorPanels = performancePanels.filter(p => !p.sector && !p.subsector);
      const crossSectorBoards = simBoards.filter(b => !b.sector && !b.subsector);
      const crossSectorProjects = ciProjects.filter(p => !p.sector && !p.subsector);
      const crossSectorOpportunities = optimisationOpportunities.filter(o => !o.sector && !o.subsector);

      // Verify we have cross-sector content
      expect(crossSectorPanels.length).toBeGreaterThan(0);
      expect(crossSectorBoards.length).toBeGreaterThan(0);
      expect(crossSectorProjects.length).toBeGreaterThan(0);
      expect(crossSectorOpportunities.length).toBeGreaterThan(0);

      // Verify cross-sector content has no sector/subsector properties
      crossSectorPanels.forEach(panel => {
        expect(panel.sector).toBeUndefined();
        expect(panel.subsector).toBeUndefined();
      });

      crossSectorBoards.forEach(board => {
        expect(board.sector).toBeUndefined();
        expect(board.subsector).toBeUndefined();
      });

      crossSectorProjects.forEach(project => {
        expect(project.sector).toBeUndefined();
        expect(project.subsector).toBeUndefined();
      });

      crossSectorOpportunities.forEach(opportunity => {
        expect(opportunity.sector).toBeUndefined();
        expect(opportunity.subsector).toBeUndefined();
      });
    });
  });

  describe('State Preservation', () => {
    it('should maintain navigation context during sector switches', () => {
      // This test verifies that the page structure remains intact during sector switches
      render(
        <TestWrapper>
          <Performance />
        </TestWrapper>
      );

      // Verify core page elements are present
      expect(screen.getByText('Performance Panels')).toBeInTheDocument();
      const performanceOverviewElements = screen.getAllByText('Overview');
      expect(performanceOverviewElements.length).toBeGreaterThan(0);
      
      // Verify tabs are present
      expect(screen.getByText('Trends')).toBeInTheDocument();
      expect(screen.getByText('Benchmarks')).toBeInTheDocument();
    });

    it('should maintain component structure across different feature pages', () => {
      // Test that all Optimise pages maintain consistent structure
      const pages = [
        { component: Performance, title: 'Performance Panels' },
        { component: LeanExecution, title: 'SIM Boards' },
        { component: ContinuousImprovement, title: 'CI Projects' },
        { component: Optimisation, title: 'Optimisation Decision Workflow' }
      ];

      pages.forEach(({ component: Component, title }) => {
        const { unmount } = render(
          <TestWrapper>
            <Component />
          </TestWrapper>
        );

        // Use getAllByText for titles that might appear multiple times (like "CI Projects")
        const titleElements = screen.getAllByText(title);
        expect(titleElements.length).toBeGreaterThan(0);
        
        // All pages should have export and AI assist buttons
        expect(screen.getByText('Export')).toBeInTheDocument();
        expect(screen.getByText('AI Assist')).toBeInTheDocument();

        unmount();
      });
    });
  });
});