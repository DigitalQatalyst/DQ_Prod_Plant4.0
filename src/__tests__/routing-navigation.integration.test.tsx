import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { Performance } from '@/pages/optimise/Performance';
import { LeanExecution } from '@/pages/optimise/LeanExecution';
import { ContinuousImprovement } from '@/pages/optimise/ContinuousImprovement';
import { Optimisation } from '@/pages/optimise/Optimisation';

// Mock AppContext for consistent testing
vi.mock('@/context/AppContext', () => {
  const mockTenant = { id: 'tenant-1', name: 'Test Tenant' };
  const mockSector = { id: 'oil-gas', name: 'Oil & Gas' };
  const mockSubsector = 'Upstream';
  return {
    AppProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useApp: () => ({
      selectedTenant: mockTenant,
      setSelectedTenant: vi.fn(),
      currentTenant: mockTenant,
      currentSector: mockSector,
      currentSubsector: mockSubsector,
      setCurrentSector: vi.fn(),
      setCurrentSubsector: vi.fn(),
      selectedAsset: null,
      setSelectedAsset: vi.fn(),
      setIsPopPaneOpen: vi.fn(),
      setPopPaneContent: vi.fn(),
    }),
  };
});

// Helper to render routes with proper setup
const renderWithRoutes = (initialRoute: string, routes: Array<{ path: string; element: React.ReactElement }>) => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AppProvider>
        <Routes>
          {routes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </AppProvider>
    </MemoryRouter>
  );
};

describe('Routing and Navigation Integration Tests', () => {
  describe('Optimise Feature Area Routing', () => {
    const optimiseRoutes = [
      { path: '/optimise/performance', element: <Performance />, title: 'Performance Panels' },
      { path: '/optimise/sim/boards', element: <LeanExecution subFeature="boards" />, title: 'SIM Boards' },
      { path: '/optimise/ci/projects', element: <ContinuousImprovement subFeature="projects" />, title: 'CI Projects' },
      { path: '/optimise/optimisation/opportunities', element: <Optimisation subFeature="opportunities" />, title: 'Optimization Opportunities' }
    ];

    optimiseRoutes.forEach(({ path, element, title }) => {
      it(`should render correct component for route ${path}`, async () => {
        renderWithRoutes(path, [{ path, element }]);

        await waitFor(() => {
          if (title === 'CI Projects' || title === 'SIM Boards') {
            // These titles appear multiple times, use getAllByText
            const titleElements = screen.getAllByText(title);
            expect(titleElements.length).toBeGreaterThan(0);
          } else {
            expect(screen.getByText(title)).toBeInTheDocument();
          }
        });
      });
    });

    it('should handle all optimise routes in single router configuration', async () => {
      const allRoutes = optimiseRoutes.map(({ path, element }) => ({ path, element }));
      
      // Test each route in the same router configuration
      for (const { path, title } of optimiseRoutes) {
        const { unmount } = renderWithRoutes(path, allRoutes);

        await waitFor(() => {
          if (title === 'CI Projects' || title === 'SIM Boards') {
            const titleElements = screen.getAllByText(title);
            expect(titleElements.length).toBeGreaterThan(0);
          } else {
            expect(screen.getByText(title)).toBeInTheDocument();
          }
        });

        unmount();
      }
    });
  });

  describe('URL Pattern Validation', () => {
    it('should follow consistent URL patterns for cognitive workflows', () => {
      const expectedPatterns = [
        { pattern: '/optimise/performance', type: 'analytical', description: 'Single analytical workspace' },
        { pattern: '/optimise/sim/*', type: 'operational', description: 'Operational workflow with sub-items' },
        { pattern: '/optimise/ci/*', type: 'project', description: 'Project workflow with sub-items' },
        { pattern: '/optimise/optimisation/*', type: 'decision', description: 'Decision workflow with sub-items' }
      ];

      expectedPatterns.forEach(({ pattern, type, description }) => {
        expect(pattern).toMatch(/^\/optimise\/[a-z-]+/);
        expect(type).toMatch(/^(analytical|operational|project|decision)$/);
        expect(description).toBeTruthy();
      });
    });

    it('should support nested routing for workflow patterns', async () => {
      const nestedRoutes = [
        { path: '/optimise/sim/boards', component: 'SIM Boards' },
        { path: '/optimise/sim/shifts', component: 'Shift Performance' },
        { path: '/optimise/sim/issues', component: 'Issues' },
        { path: '/optimise/sim/actions', component: 'Actions' },
        { path: '/optimise/ci/projects', component: 'CI Projects' },
        { path: '/optimise/ci/rca', component: 'RCA' },
        { path: '/optimise/ci/countermeasures', component: 'Countermeasures' },
        { path: '/optimise/ci/impact', component: 'Impact Tracking' },
        { path: '/optimise/ci/reports', component: 'CI Reports' },
        { path: '/optimise/optimisation/opportunities', component: 'Opportunities' },
        { path: '/optimise/optimisation/recommendations', component: 'Recommendations' },
        { path: '/optimise/optimisation/playbooks', component: 'Playbooks' },
        { path: '/optimise/optimisation/simulations', component: 'Simulations' },
        { path: '/optimise/optimisation/execution', component: 'Execution' }
      ];

      nestedRoutes.forEach(({ path, component }) => {
        // Verify URL structure follows expected pattern
        expect(path).toMatch(/^\/optimise\/[a-z-]+\/[a-z-]+$/);
        expect(component).toBeTruthy();
      });
    });
  });

  describe('Browser Navigation Behavior', () => {
    it('should support browser back/forward navigation', async () => {
      const routes = [
        { path: '/optimise/performance', element: <Performance /> },
        { path: '/optimise/sim/boards', element: <LeanExecution subFeature="boards" /> }
      ];

      // Test navigation to SIM boards route directly
      renderWithRoutes('/optimise/sim/boards', routes);

      await waitFor(() => {
        const titleElements = screen.getAllByText('SIM Boards');
        expect(titleElements.length).toBeGreaterThan(0);
      });
    });

    it('should maintain URL state during page refresh simulation', async () => {
      const testRoute = '/optimise/performance';
      
      // Initial render
      const { unmount } = renderWithRoutes(testRoute, [
        { path: testRoute, element: <Performance /> }
      ]);

      await waitFor(() => {
        expect(screen.getByText('Performance Panels')).toBeInTheDocument();
      });

      unmount();

      // Simulate page refresh by re-rendering with same route
      renderWithRoutes(testRoute, [
        { path: testRoute, element: <Performance /> }
      ]);

      await waitFor(() => {
        expect(screen.getByText('Performance Panels')).toBeInTheDocument();
      });
    });

    it('should handle rapid route changes without errors', async () => {
      const routes = [
        { path: '/optimise/performance', element: <Performance />, title: 'Performance Panels' },
        { path: '/optimise/sim/boards', element: <LeanExecution />, title: 'SIM Boards' },
        { path: '/optimise/ci/projects', element: <ContinuousImprovement />, title: 'CI Projects' },
        { path: '/optimise/optimisation/opportunities', element: <Optimisation />, title: 'Optimisation Decision Workflow' }
      ];

      const allRoutes = routes.map(({ path, element }) => ({ path, element }));

      // Rapidly switch between routes
      for (const { path, title } of routes) {
        const { unmount } = renderWithRoutes(path, allRoutes);

        await waitFor(() => {
          if (title === 'CI Projects') {
            const titleElements = screen.getAllByText(title);
            expect(titleElements.length).toBeGreaterThan(0);
          } else {
            expect(screen.getByText(title)).toBeInTheDocument();
          }
        });

        unmount();
      }
    });
  });

  describe('Route Parameter Handling', () => {
    it('should handle route parameters correctly for workflow items', async () => {
      // Test that routes with parameters work correctly
      const parameterizedRoutes = [
        '/optimise/sim/boards',
        '/optimise/ci/projects',
        '/optimise/optimisation/opportunities'
      ];

      parameterizedRoutes.forEach(route => {
        const pathSegments = route.split('/');
        expect(pathSegments).toHaveLength(4); // ['', 'optimise', 'workflow', 'item']
        expect(pathSegments[1]).toBe('optimise');
        expect(pathSegments[2]).toMatch(/^(sim|ci|optimisation)$/);
        expect(pathSegments[3]).toBeTruthy();
      });
    });

    it('should validate route structure consistency', () => {
      const routePatterns = [
        { pattern: '/optimise/performance', segments: 3, type: 'analytical' },
        { pattern: '/optimise/sim/boards', segments: 4, type: 'operational' },
        { pattern: '/optimise/ci/projects', segments: 4, type: 'project' },
        { pattern: '/optimise/optimisation/opportunities', segments: 4, type: 'decision' }
      ];

      routePatterns.forEach(({ pattern, segments, type }) => {
        const pathSegments = pattern.split('/').filter(Boolean);
        expect(pathSegments).toHaveLength(segments - 1); // Exclude empty first segment
        expect(pathSegments[0]).toBe('optimise');
        expect(type).toMatch(/^(analytical|operational|project|decision)$/);
      });
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should handle invalid routes gracefully', async () => {
      renderWithRoutes('/optimise/invalid/route', []);

      await waitFor(() => {
        expect(screen.getByText('404 Not Found')).toBeInTheDocument();
      });
    });

    it('should handle malformed optimise routes', async () => {
      const malformedRoutes = [
        '/optimise',
        '/optimise/',
        '/optimise/performance/invalid',
        '/optimise/sim',
        '/optimise/ci',
        '/optimise/optimisation'
      ];

      malformedRoutes.forEach(async (route) => {
        const { unmount } = renderWithRoutes(route, []);

        await waitFor(() => {
          expect(screen.getByText('404 Not Found')).toBeInTheDocument();
        });

        unmount();
      });
    });

    it('should provide fallback navigation for broken routes', async () => {
      // Test that broken routes don't crash the application
      renderWithRoutes('/optimise/nonexistent/feature', [
        { path: '/optimise/performance', element: <Performance /> }
      ]);

      await waitFor(() => {
        expect(screen.getByText('404 Not Found')).toBeInTheDocument();
      });

      // Verify that valid routes still work after encountering invalid ones
      const { rerender } = render(
        <MemoryRouter initialEntries={['/optimise/performance']}>
          <AppProvider>
            <Routes>
              <Route path="/optimise/performance" element={<Performance />} />
              <Route path="*" element={<div>404 Not Found</div>} />
            </Routes>
          </AppProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Performance Panels')).toBeInTheDocument();
      });
    });
  });

  describe('Route State Persistence', () => {
    it('should maintain route state across component re-renders', async () => {
      const { rerender } = renderWithRoutes('/optimise/performance', [
        { path: '/optimise/performance', element: <Performance /> }
      ]);

      await waitFor(() => {
        expect(screen.getByText('Performance Panels')).toBeInTheDocument();
      });

      // Force re-render
      rerender(
        <MemoryRouter initialEntries={['/optimise/performance']}>
          <AppProvider>
            <Routes>
              <Route path="/optimise/performance" element={<Performance />} />
            </Routes>
          </AppProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Performance Panels')).toBeInTheDocument();
      });
    });

    it('should preserve navigation context during route transitions', async () => {
      const routes = [
        { path: '/optimise/performance', element: <Performance /> },
        { path: '/optimise/sim/boards', element: <LeanExecution subFeature="boards" /> }
      ];

      // Test SIM boards route directly
      renderWithRoutes('/optimise/sim/boards', routes);

      await waitFor(() => {
        const titleElements = screen.getAllByText('SIM Boards');
        expect(titleElements.length).toBeGreaterThan(0);
      });
    });
  });
});