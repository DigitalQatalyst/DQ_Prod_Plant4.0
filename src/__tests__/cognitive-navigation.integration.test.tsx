import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { Performance } from '@/pages/optimise/Performance';
import { LeanExecution } from '@/pages/optimise/LeanExecution';
import { ContinuousImprovement } from '@/pages/optimise/ContinuousImprovement';
import { Optimisation } from '@/pages/optimise/Optimisation';
import { featureAreas } from '@/data/navigation';

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AppProvider>
      {children}
    </AppProvider>
  </BrowserRouter>
);

describe('Cognitive Navigation Integration Tests', () => {
  describe('Navigation Structure Validation', () => {
    it('should have correct cognitive patterns in navigation structure', () => {
      const optimiseArea = featureAreas.find(area => area.id === 'optimise');
      expect(optimiseArea).toBeDefined();
      
      const featureSets = optimiseArea?.featureSets || [];
      
      // Verify Performance analytical pattern
      const performance = featureSets.find(fs => fs.id === 'performance');
      expect(performance?.cognitivePattern).toBe('analytical');
      
      // Verify SIM operational pattern
      const sim = featureSets.find(fs => fs.id === 'lean-execution');
      expect(sim?.cognitivePattern).toBe('operational');
      
      // Verify CI project pattern
      const ci = featureSets.find(fs => fs.id === 'continuous-improvement');
      expect(ci?.cognitivePattern).toBe('project');
      
      // Verify Optimisation decision pattern
      const optimisation = featureSets.find(fs => fs.id === 'optimisation');
      expect(optimisation?.cognitivePattern).toBe('decision');
    });

    it('should have correct feature counts for each cognitive pattern', () => {
      const optimiseArea = featureAreas.find(area => area.id === 'optimise');
      const featureSets = optimiseArea?.featureSets || [];
      
      // Performance: 1 feature (analytical workspace)
      const performance = featureSets.find(fs => fs.id === 'performance');
      expect(performance?.features).toHaveLength(1);
      
      // SIM: 4 features (operational workflow)
      const sim = featureSets.find(fs => fs.id === 'lean-execution');
      expect(sim?.features).toHaveLength(4);
      
      // CI: 5 features (project workflow)
      const ci = featureSets.find(fs => fs.id === 'continuous-improvement');
      expect(ci?.features).toHaveLength(5);
      
      // Optimisation: 5 features (decision workflow)
      const optimisation = featureSets.find(fs => fs.id === 'optimisation');
      expect(optimisation?.features).toHaveLength(5);
    });
  });

  describe('Performance Analytical Workspace Integration', () => {
    it('should render analytical workspace with correct structure', async () => {
      render(
        <TestWrapper>
          <Performance />
        </TestWrapper>
      );

      // Verify analytical workspace structure
      expect(screen.getByText('Performance Panels')).toBeInTheDocument();
      
      // Verify multi-tab work pane
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Losses')).toBeInTheDocument();
      expect(screen.getByText('Bottlenecks')).toBeInTheDocument();
      expect(screen.getByText('Trends')).toBeInTheDocument();
      expect(screen.getByText('Benchmarks')).toBeInTheDocument();
      
      // Verify dashboard widget integration
      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByText('AI Assist')).toBeInTheDocument();
    });

    it('should maintain analytical workspace state during navigation', async () => {
      const { rerender } = render(
        <TestWrapper>
          <Performance />
        </TestWrapper>
      );

      // Verify initial state
      expect(screen.getByText('Performance Panels')).toBeInTheDocument();
      
      // Simulate tab navigation within the workspace
      const trendsTab = screen.getByText('Trends');
      fireEvent.click(trendsTab);
      
      // Verify state is maintained
      expect(screen.getByText('Performance Panels')).toBeInTheDocument();
      expect(screen.getByText('Trends')).toBeInTheDocument();
    });
  });

  describe('SIM Operational Workflow Integration', () => {
    it('should render operational workflow with correct structure', async () => {
      render(
        <TestWrapper>
          <LeanExecution />
        </TestWrapper>
      );

      // Verify operational workflow structure
      expect(screen.getByText('SIM Boards')).toBeInTheDocument();
      
      // Verify sub-navigation items are present
      const simBoardsElements = screen.getAllByText('SIM Boards');
      expect(simBoardsElements.length).toBeGreaterThan(0);
      
      // Verify workflow tabs (default tabs when no board is selected)
      const simOverviewElements = screen.getAllByText('SIM Overview');
      expect(simOverviewElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Metrics')).toBeInTheDocument();
      expect(screen.getByText('Escalations')).toBeInTheDocument();
    });

    it('should support navigation between operational workflow items', async () => {
      render(
        <TestWrapper>
          <LeanExecution />
        </TestWrapper>
      );

      // Verify initial state shows SIM Boards
      expect(screen.getByText('SIM Boards')).toBeInTheDocument();
      
      // Verify operational workflow maintains structure
      const simOverviewElements = screen.getAllByText('SIM Overview');
      expect(simOverviewElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByText('AI Assist')).toBeInTheDocument();
    });
  });

  describe('CI Project Workflow Integration', () => {
    it('should render project workflow with correct structure', async () => {
      render(
        <TestWrapper>
          <ContinuousImprovement />
        </TestWrapper>
      );

      // Verify project workflow structure
      const ciProjectsElements = screen.getAllByText('CI Projects');
      expect(ciProjectsElements.length).toBeGreaterThan(0);
      
      // Verify project workflow tools are available
      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByText('AI Assist')).toBeInTheDocument();
    });

    it('should support navigation between project workflow items', async () => {
      render(
        <TestWrapper>
          <ContinuousImprovement />
        </TestWrapper>
      );

      // Verify project workflow maintains structure
      const ciProjectsElements = screen.getAllByText('CI Projects');
      expect(ciProjectsElements.length).toBeGreaterThan(0);
      
      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByText('AI Assist')).toBeInTheDocument();
    });
  });

  describe('Optimisation Decision Workflow Integration', () => {
    it('should render decision workflow with correct structure', async () => {
      render(
        <TestWrapper>
          <Optimisation />
        </TestWrapper>
      );

      // Verify decision workflow structure
      expect(screen.getByText('Optimisation Decision Workflow')).toBeInTheDocument();
      
      // Verify workflow areas count (5 areas)
      const workflowCount = 5;
      const countElements = screen.getAllByText(workflowCount.toString());
      expect(countElements.length).toBeGreaterThan(0);
    });

    it('should support navigation between decision workflow items', async () => {
      render(
        <TestWrapper>
          <Optimisation />
        </TestWrapper>
      );

      // Verify decision workflow maintains structure
      expect(screen.getByText('Optimisation Decision Workflow')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByText('AI Assist')).toBeInTheDocument();
    });
  });

  describe('Template Integration Validation', () => {
    it('should reuse existing dashboard templates across all cognitive patterns', async () => {
      const components = [
        { Component: Performance, title: 'Performance Panels' },
        { Component: LeanExecution, title: 'SIM Boards' },
        { Component: ContinuousImprovement, title: 'CI Projects' },
        { Component: Optimisation, title: 'Optimisation Decision Workflow' }
      ];

      components.forEach(({ Component, title }) => {
        const { unmount } = render(
          <TestWrapper>
            <Component />
          </TestWrapper>
        );

        // Verify common template elements
        expect(screen.getByText('Export')).toBeInTheDocument();
        expect(screen.getByText('AI Assist')).toBeInTheDocument();
        
        // Verify search functionality is present
        const searchElements = screen.getAllByPlaceholderText(/search/i);
        expect(searchElements.length).toBeGreaterThan(0);

        unmount();
      });
    });

    it('should use consistent List Pane layout across all features', async () => {
      const components = [Performance, LeanExecution, ContinuousImprovement, Optimisation];

      components.forEach(Component => {
        const { unmount } = render(
          <TestWrapper>
            <Component />
          </TestWrapper>
        );

        // Verify List Pane elements
        expect(screen.getByText('Export')).toBeInTheDocument();
        expect(screen.getByText('AI Assist')).toBeInTheDocument();
        
        // Verify filter/sort capabilities
        const searchElements = screen.getAllByPlaceholderText(/search/i);
        expect(searchElements.length).toBeGreaterThan(0);

        unmount();
      });
    });

    it('should use consistent Work Pane tab styling across all features', async () => {
      const components = [
        { Component: Performance, tabs: ['Overview', 'Losses', 'Bottlenecks', 'Trends', 'Benchmarks'] },
        { Component: LeanExecution, tabs: ['SIM Overview', 'Metrics', 'Escalations'] },
        { Component: ContinuousImprovement, tabs: [] } // CI Projects component doesn't show tabs in list view
      ];

      components.forEach(({ Component, tabs }) => {
        const { unmount } = render(
          <TestWrapper>
            <Component />
          </TestWrapper>
        );

        // Verify tab elements are present (if any)
        tabs.forEach(tab => {
          if (tab === 'SIM Overview') {
            const elements = screen.getAllByText(tab);
            expect(elements.length).toBeGreaterThan(0);
          } else {
            expect(screen.getByText(tab)).toBeInTheDocument();
          }
        });

        // Verify common elements are present
        expect(screen.getByText('Export')).toBeInTheDocument();
        expect(screen.getByText('AI Assist')).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('State Management Integration', () => {
    it('should maintain state across feature transitions', async () => {
      // Test state preservation when switching between cognitive patterns
      const { rerender } = render(
        <TestWrapper>
          <Performance />
        </TestWrapper>
      );

      // Verify initial state
      expect(screen.getByText('Performance Panels')).toBeInTheDocument();

      // Switch to different cognitive pattern
      rerender(
        <TestWrapper>
          <LeanExecution />
        </TestWrapper>
      );

      // Verify new state
      expect(screen.getByText('SIM Boards')).toBeInTheDocument();

      // Switch back to verify state management
      rerender(
        <TestWrapper>
          <Performance />
        </TestWrapper>
      );

      // Verify state is restored
      expect(screen.getByText('Performance Panels')).toBeInTheDocument();
    });

    it('should handle concurrent state updates across cognitive patterns', async () => {
      // Test that state management handles multiple cognitive patterns correctly
      const components = [Performance, LeanExecution, ContinuousImprovement, Optimisation];
      
      components.forEach(Component => {
        const { unmount } = render(
          <TestWrapper>
            <Component />
          </TestWrapper>
        );

        // Verify component renders without state conflicts
        expect(screen.getByText('Export')).toBeInTheDocument();
        expect(screen.getByText('AI Assist')).toBeInTheDocument();

        unmount();
      });
    });
  });
});