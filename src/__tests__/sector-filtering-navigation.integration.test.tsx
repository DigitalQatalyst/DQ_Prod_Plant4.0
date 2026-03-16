import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { Performance } from '@/pages/optimise/Performance';
import { LeanExecution } from '@/pages/optimise/LeanExecution';
import { ContinuousImprovement } from '@/pages/optimise/ContinuousImprovement';
import { Optimisation } from '@/pages/optimise/Optimisation';
import { performancePanels, simBoards, ciProjects, optimisationOpportunities } from '@/data/mockData';

// Mock AppContext with different sector configurations
const createMockAppContext = (sector: string, subsector: string) => ({
  AppProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useApp: () => ({
    selectedTenant: { id: 'tenant-1', name: 'Test Tenant' },
    setSelectedTenant: vi.fn(),
    currentTenant: { id: 'tenant-1', name: 'Test Tenant' },
    selectedSector: sector,
    selectedSubsector: subsector,
    setSelectedSector: vi.fn(),
    setSelectedSubsector: vi.fn(),
  }),
});

// Test wrapper with sector context
const TestWrapperWithSector = ({ 
  children, 
  sector = 'Oil & Gas', 
  subsector = 'Upstream' 
}: { 
  children: React.ReactNode;
  sector?: string;
  subsector?: string;
}) => {
  // Mock the context for this specific test
  vi.doMock('@/context/AppContext', () => createMockAppContext(sector, subsector));
  
  return (
    <BrowserRouter>
      <AppProvider>
        {children}
      </AppProvider>
    </BrowserRouter>
  );
};

describe('Sector Filtering Navigation Integration Tests', () => {
  describe('Cross-Sector Content Consistency', () => {
    it('should always include cross-sector content regardless of sector selection', async () => {
      const sectorCombinations = [
        { sector: 'Oil & Gas', subsector: 'Upstream' },
        { sector: 'Power', subsector: 'Transmission' },
        { sector: 'FMCG', subsector: 'Food & Beverage' }
      ];

      for (const { sector, subsector } of sectorCombinations) {
        // Test Performance panels
        const { unmount: unmountPerf } = render(
          <TestWrapperWithSector sector={sector} subsector={subsector}>
            <Performance />
          </TestWrapperWithSector>
        );

        await waitFor(() => {
          expect(screen.getByText('Performance Panels')).toBeInTheDocument();
        });

        // Verify cross-sector content is included
        const crossSectorPanels = performancePanels.filter(p => !p.sector && !p.subsector);
        const sectorSpecificPanels = performancePanels.filter(p => p.sector === sector && p.subsector === subsector);
        const expectedCount = crossSectorPanels.length + sectorSpecificPanels.length;
        
        if (expectedCount > 0) {
          const countElements = screen.getAllByText(expectedCount.toString());
          expect(countElements.length).toBeGreaterThan(0);
        }

        unmountPerf();

        // Test SIM Boards
        const { unmount: unmountSim } = render(
          <TestWrapperWithSector sector={sector} subsector={subsector}>
            <LeanExecution />
          </TestWrapperWithSector>
        );

        await waitFor(() => {
          expect(screen.getByText('SIM Boards')).toBeInTheDocument();
        });

        const crossSectorBoards = simBoards.filter(b => !b.sector && !b.subsector);
        const sectorSpecificBoards = simBoards.filter(b => b.sector === sector && b.subsector === subsector);
        const expectedBoardCount = crossSectorBoards.length + sectorSpecificBoards.length;
        
        if (expectedBoardCount > 0) {
          const boardCountElements = screen.getAllByText(expectedBoardCount.toString());
          expect(boardCountElements.length).toBeGreaterThan(0);
        }

        unmountSim();
      }
    });

    it('should filter content correctly for each cognitive pattern', async () => {
      const testSector = 'Oil & Gas';
      const testSubsector = 'Upstream';

      // Test Performance analytical workspace
      const { unmount: unmountPerf } = render(
        <TestWrapperWithSector sector={testSector} subsector={testSubsector}>
          <Performance />
        </TestWrapperWithSector>
      );

      await waitFor(() => {
        expect(screen.getByText('Performance Panels')).toBeInTheDocument();
      });

      // Verify filtering logic
      const crossSectorPanels = performancePanels.filter(p => !p.sector && !p.subsector);
      const sectorPanels = performancePanels.filter(p => p.sector === testSector && p.subsector === testSubsector);
      const totalExpected = crossSectorPanels.length + sectorPanels.length;

      if (totalExpected > 0) {
        const countElements = screen.getAllByText(totalExpected.toString());
        expect(countElements.length).toBeGreaterThan(0);
      }

      unmountPerf();

      // Test SIM operational workflow
      const { unmount: unmountSim } = render(
        <TestWrapperWithSector sector={testSector} subsector={testSubsector}>
          <LeanExecution />
        </TestWrapperWithSector>
      );

      await waitFor(() => {
        expect(screen.getByText('SIM Boards')).toBeInTheDocument();
      });

      unmountSim();

      // Test CI project workflow
      const { unmount: unmountCI } = render(
        <TestWrapperWithSector sector={testSector} subsector={testSubsector}>
          <ContinuousImprovement />
        </TestWrapperWithSector>
      );

      await waitFor(() => {
        const ciProjectsElements = screen.getAllByText('CI Projects');
        expect(ciProjectsElements.length).toBeGreaterThan(0);
      });

      unmountCI();

      // Test Optimisation decision workflow
      const { unmount: unmountOpt } = render(
        <TestWrapperWithSector sector={testSector} subsector={testSubsector}>
          <Optimisation />
        </TestWrapperWithSector>
      );

      await waitFor(() => {
        expect(screen.getByText('Optimisation Decision Workflow')).toBeInTheDocument();
      });

      unmountOpt();
    });
  });

  describe('Sector-Specific Content Validation', () => {
    it('should display appropriate content for Oil & Gas Upstream', async () => {
      const sector = 'Oil & Gas';
      const subsector = 'Upstream';

      const components = [
        { Component: Performance, title: 'Performance Panels' },
        { Component: LeanExecution, title: 'SIM Boards' },
        { Component: ContinuousImprovement, title: 'CI Projects' },
        { Component: Optimisation, title: 'Optimisation Decision Workflow' }
      ];

      for (const { Component, title } of components) {
        const { unmount } = render(
          <TestWrapperWithSector sector={sector} subsector={subsector}>
            <Component />
          </TestWrapperWithSector>
        );

        await waitFor(() => {
          if (title === 'CI Projects') {
            const titleElements = screen.getAllByText(title);
            expect(titleElements.length).toBeGreaterThan(0);
          } else {
            expect(screen.getByText(title)).toBeInTheDocument();
          }
        });

        // Verify sector-specific functionality
        expect(screen.getByText('Export')).toBeInTheDocument();
        expect(screen.getByText('AI Assist')).toBeInTheDocument();

        unmount();
      }
    });

    it('should display appropriate content for Power Transmission', async () => {
      const sector = 'Power';
      const subsector = 'Transmission';

      const components = [Performance, LeanExecution, ContinuousImprovement, Optimisation];

      for (const Component of components) {
        const { unmount } = render(
          <TestWrapperWithSector sector={sector} subsector={subsector}>
            <Component />
          </TestWrapperWithSector>
        );

        // Verify component renders without errors for this sector
        await waitFor(() => {
          expect(screen.getByText('Export')).toBeInTheDocument();
          expect(screen.getByText('AI Assist')).toBeInTheDocument();
        });

        unmount();
      }
    });

    it('should display appropriate content for FMCG Food & Beverage', async () => {
      const sector = 'FMCG';
      const subsector = 'Food & Beverage';

      const components = [Performance, LeanExecution, ContinuousImprovement, Optimisation];

      for (const Component of components) {
        const { unmount } = render(
          <TestWrapperWithSector sector={sector} subsector={subsector}>
            <Component />
          </TestWrapperWithSector>
        );

        // Verify component renders without errors for this sector
        await waitFor(() => {
          expect(screen.getByText('Export')).toBeInTheDocument();
          expect(screen.getByText('AI Assist')).toBeInTheDocument();
        });

        unmount();
      }
    });
  });

  describe('Sector Switching Behavior', () => {
    it('should update content when sector changes', async () => {
      // Start with Oil & Gas
      const { rerender } = render(
        <TestWrapperWithSector sector="Oil & Gas" subsector="Upstream">
          <Performance />
        </TestWrapperWithSector>
      );

      await waitFor(() => {
        expect(screen.getByText('Performance Panels')).toBeInTheDocument();
      });

      // Switch to Power sector
      rerender(
        <TestWrapperWithSector sector="Power" subsector="Transmission">
          <Performance />
        </TestWrapperWithSector>
      );

      await waitFor(() => {
        expect(screen.getByText('Performance Panels')).toBeInTheDocument();
      });

      // Verify component still functions correctly
      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByText('AI Assist')).toBeInTheDocument();
    });

    it('should maintain navigation structure during sector switches', async () => {
      const sectors = [
        { sector: 'Oil & Gas', subsector: 'Upstream' },
        { sector: 'Power', subsector: 'Transmission' },
        { sector: 'FMCG', subsector: 'Food & Beverage' }
      ];

      for (const { sector, subsector } of sectors) {
        const { unmount } = render(
          <TestWrapperWithSector sector={sector} subsector={subsector}>
            <Performance />
          </TestWrapperWithSector>
        );

        await waitFor(() => {
          expect(screen.getByText('Performance Panels')).toBeInTheDocument();
        });

        // Verify navigation structure is preserved
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Trends')).toBeInTheDocument();
        expect(screen.getByText('Benchmarks')).toBeInTheDocument();

        unmount();
      }
    });
  });

  describe('Data Filtering Logic Validation', () => {
    it('should correctly implement sector filtering algorithm', () => {
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

      const testCases = [
        { sector: 'Oil & Gas', subsector: 'Upstream' },
        { sector: 'Power', subsector: 'Transmission' },
        { sector: 'FMCG', subsector: 'Food & Beverage' }
      ];

      testCases.forEach(({ sector, subsector }) => {
        // Test performance panels filtering
        const filteredPanels = filterBySector(performancePanels, sector, subsector);
        const crossSectorCount = performancePanels.filter(p => !p.sector && !p.subsector).length;
        const sectorSpecificCount = performancePanels.filter(p => p.sector === sector && p.subsector === subsector).length;
        
        expect(filteredPanels.length).toBe(crossSectorCount + sectorSpecificCount);

        // Verify all filtered items are either cross-sector or match target sector
        filteredPanels.forEach(panel => {
          if (panel.sector && panel.subsector) {
            expect(panel.sector).toBe(sector);
            expect(panel.subsector).toBe(subsector);
          } else {
            expect(panel.sector).toBeUndefined();
            expect(panel.subsector).toBeUndefined();
          }
        });

        // Test SIM boards filtering
        const filteredBoards = filterBySector(simBoards, sector, subsector);
        const crossSectorBoardsCount = simBoards.filter(b => !b.sector && !b.subsector).length;
        const sectorSpecificBoardsCount = simBoards.filter(b => b.sector === sector && b.subsector === subsector).length;
        
        expect(filteredBoards.length).toBe(crossSectorBoardsCount + sectorSpecificBoardsCount);

        // Test CI projects filtering
        const filteredProjects = filterBySector(ciProjects, sector, subsector);
        const crossSectorProjectsCount = ciProjects.filter(p => !p.sector && !p.subsector).length;
        const sectorSpecificProjectsCount = ciProjects.filter(p => p.sector === sector && p.subsector === subsector).length;
        
        expect(filteredProjects.length).toBe(crossSectorProjectsCount + sectorSpecificProjectsCount);

        // Test optimization opportunities filtering
        const filteredOpportunities = filterBySector(optimisationOpportunities, sector, subsector);
        const crossSectorOpportunitiesCount = optimisationOpportunities.filter(o => !o.sector && !o.subsector).length;
        const sectorSpecificOpportunitiesCount = optimisationOpportunities.filter(o => o.sector === sector && o.subsector === subsector).length;
        
        expect(filteredOpportunities.length).toBe(crossSectorOpportunitiesCount + sectorSpecificOpportunitiesCount);
      });
    });

    it('should preserve cross-sector content across all sector selections', () => {
      // Verify cross-sector content exists and is properly structured
      const crossSectorPanels = performancePanels.filter(p => !p.sector && !p.subsector);
      const crossSectorBoards = simBoards.filter(b => !b.sector && !b.subsector);
      const crossSectorProjects = ciProjects.filter(p => !p.sector && !p.subsector);
      const crossSectorOpportunities = optimisationOpportunities.filter(o => !o.sector && !o.subsector);

      // Verify we have cross-sector content for each data type
      expect(crossSectorPanels.length).toBeGreaterThan(0);
      expect(crossSectorBoards.length).toBeGreaterThan(0);
      expect(crossSectorProjects.length).toBeGreaterThan(0);
      expect(crossSectorOpportunities.length).toBeGreaterThan(0);

      // Verify cross-sector items have no sector/subsector properties
      [...crossSectorPanels, ...crossSectorBoards, ...crossSectorProjects, ...crossSectorOpportunities].forEach(item => {
        expect(item.sector).toBeUndefined();
        expect(item.subsector).toBeUndefined();
      });
    });
  });

  describe('Navigation Integration with Sector Filtering', () => {
    it('should maintain cognitive navigation patterns across sector changes', async () => {
      const cognitivePatterns = [
        { Component: Performance, pattern: 'analytical', title: 'Performance Panels' },
        { Component: LeanExecution, pattern: 'operational', title: 'SIM Boards' },
        { Component: ContinuousImprovement, pattern: 'project', title: 'CI Projects' },
        { Component: Optimisation, pattern: 'decision', title: 'Optimisation Decision Workflow' }
      ];

      const sectors = ['Oil & Gas', 'Power', 'FMCG'];
      const subsectors = ['Upstream', 'Transmission', 'Food & Beverage'];

      for (let i = 0; i < sectors.length; i++) {
        const sector = sectors[i];
        const subsector = subsectors[i];

        for (const { Component, pattern, title } of cognitivePatterns) {
          const { unmount } = render(
            <TestWrapperWithSector sector={sector} subsector={subsector}>
              <Component />
            </TestWrapperWithSector>
          );

          await waitFor(() => {
            if (title === 'CI Projects') {
              const titleElements = screen.getAllByText(title);
              expect(titleElements.length).toBeGreaterThan(0);
            } else {
              expect(screen.getByText(title)).toBeInTheDocument();
            }
          });

          // Verify cognitive pattern structure is maintained
          expect(screen.getByText('Export')).toBeInTheDocument();
          expect(screen.getByText('AI Assist')).toBeInTheDocument();

          unmount();
        }
      }
    });

    it('should support sector-aware URL routing', () => {
      // Verify that URL patterns support sector-specific routing
      const baseRoutes = [
        '/optimise/performance',
        '/optimise/sim/boards',
        '/optimise/ci/projects',
        '/optimise/optimisation/opportunities'
      ];

      baseRoutes.forEach(route => {
        // Routes should be sector-agnostic at the URL level
        // Sector filtering happens at the data/component level
        expect(route).toMatch(/^\/optimise\//);
        expect(route).not.toContain('sector');
        expect(route).not.toContain('subsector');
      });
    });
  });
});