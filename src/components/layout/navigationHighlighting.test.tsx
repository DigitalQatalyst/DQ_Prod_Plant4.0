import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MenuPane } from './MenuPane';
import { featureAreas } from '@/data/navigation';
import { LayoutProvider } from '@/context/LayoutContext';

/**
 * Integration tests for navigation highlighting
 * Tests active feature highlighting in MenuPane
 * Validates: Requirements 8.5
 */

describe('Navigation Highlighting Integration Tests', () => {

  const renderMenuPaneWithRoute = (initialRoute: string) => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <LayoutProvider>
          <MenuPane />
        </LayoutProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    // Reset any state between tests
  });

  /**
   * Test: Active feature is highlighted in MenuPane
   * This test validates that when navigating to a security feature,
   * the corresponding menu item is highlighted
   */
  it('should highlight active feature in MenuPane', () => {
    // Test security overview dashboard highlighting
    renderMenuPaneWithRoute('/security/posture/overview');

    // Find the Security feature area button
    const securityAreaButton = screen.getByRole('button', { name: /security/i });
    expect(securityAreaButton).toHaveClass('bg-primary/10', 'text-primary');

    // Expand the security area to see features
    fireEvent.click(securityAreaButton);

    // Expand the posture feature set
    const postureSetButton = screen.getByRole('button', { name: /posture & dashboards/i });
    fireEvent.click(postureSetButton);

    // Check that the specific feature is highlighted
    const overviewFeature = screen.getByRole('button', { name: /security overview dashboard/i });
    expect(overviewFeature).toHaveClass('bg-primary/15', 'text-primary', 'border-l-2', 'border-primary');
  });

  /**
   * Test: Navigation state persists across refreshes
   * This test validates that navigation highlighting works correctly
   * when the page is loaded directly with a specific route
   */
  it('should maintain correct highlighting when loading page directly', () => {
    // Test loading a deep security route directly
    renderMenuPaneWithRoute('/security/identity/users');

    // The Security area should be highlighted as active
    const securityAreaButton = screen.getByRole('button', { name: /security/i });
    expect(securityAreaButton).toHaveClass('bg-primary/10', 'text-primary');
  });

  /**
   * Test: Multiple security routes highlighting
   * This test validates that different security features are highlighted correctly
   */
  it('should highlight correct security features for different routes', () => {
    const securityRoutes = [
      '/security/posture/overview',
      '/security/identity/users',
      '/security/ot/zones',
      '/security/compliance/standards',
      '/security/threats/alerts',
      '/security/logging/audit-log',
      '/security/platform/data-protection'
    ];

    securityRoutes.forEach(route => {
      const { unmount } = renderMenuPaneWithRoute(route);

      // Security area should always be highlighted for security routes
      const securityAreaButton = screen.getByRole('button', { name: /security/i });
      expect(securityAreaButton).toHaveClass('bg-primary/10', 'text-primary');

      unmount();
    });
  });

  /**
   * Test: Non-security routes don't highlight security area
   * This test validates that security area is not highlighted for non-security routes
   */
  it('should not highlight security area for non-security routes', () => {
    const nonSecurityRoutes = [
      '/overview/dashboard',
      '/assets/dashboard',
      '/energy/dashboard',
      '/automate/integrate/tags',
      '/optimise/performance',
      '/monitoring/dashboard'
    ];

    nonSecurityRoutes.forEach(route => {
      const { unmount } = renderMenuPaneWithRoute(route);

      // Security area should not be highlighted for non-security routes
      const securityAreaButton = screen.getByRole('button', { name: /security/i });
      expect(securityAreaButton).not.toHaveClass('bg-primary/10', 'text-primary');

      unmount();
    });
  });

  /**
   * Test: Feature area expansion state
   * This test validates that clicking on feature areas expands/collapses them correctly
   */
  it('should expand and collapse feature areas correctly', () => {
    renderMenuPaneWithRoute('/');

    const securityAreaButton = screen.getByRole('button', { name: /security/i });

    // Initially, security area should be collapsed (not expanded by default)
    // Check that feature sets are not visible
    expect(screen.queryByRole('button', { name: /posture & dashboards/i })).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(securityAreaButton);

    // Now feature sets should be visible
    expect(screen.getByRole('button', { name: /posture & dashboards/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /identity & access/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ot\/iot security/i })).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(securityAreaButton);

    // Feature sets should be hidden again
    expect(screen.queryByRole('button', { name: /posture & dashboards/i })).not.toBeInTheDocument();
  });

  /**
   * Test: Feature set expansion state
   * This test validates that clicking on feature sets expands/collapses them correctly
   */
  it('should expand and collapse feature sets correctly', () => {
    renderMenuPaneWithRoute('/');

    // Expand security area first
    const securityAreaButton = screen.getByRole('button', { name: /security/i });
    fireEvent.click(securityAreaButton);

    // Find and click posture feature set
    const postureSetButton = screen.getByRole('button', { name: /posture & dashboards/i });

    // Initially, features should not be visible
    expect(screen.queryByRole('button', { name: /security overview dashboard/i })).not.toBeInTheDocument();

    // Click to expand feature set
    fireEvent.click(postureSetButton);

    // Now features should be visible
    expect(screen.getByRole('button', { name: /security overview dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /posture by site \/ facility/i })).toBeInTheDocument();

    // Click to collapse feature set
    fireEvent.click(postureSetButton);

    // Features should be hidden again
    expect(screen.queryByRole('button', { name: /security overview dashboard/i })).not.toBeInTheDocument();
  });

  /**
   * Test: All 45 security features are present in navigation
   * This test validates that all security features from the specification are present
   */
  it('should include all 45 security features in navigation', () => {
    renderMenuPaneWithRoute('/');

    // Find the security feature area
    const securityArea = featureAreas.find(area => area.id === 'security');
    expect(securityArea).toBeDefined();

    // Count total features across all feature sets
    let totalFeatures = 0;
    securityArea!.featureSets.forEach(set => {
      totalFeatures += set.features.length;
    });

    // Should have exactly 45 features as per specification
    expect(totalFeatures).toBe(45);

    // Verify all 7 feature sets are present
    expect(securityArea!.featureSets).toHaveLength(7);

    const expectedFeatureSets = [
      'posture',
      'identity',
      'ot',
      'compliance',
      'threats',
      'logging',
      'platform'
    ];

    expectedFeatureSets.forEach(setId => {
      const featureSet = securityArea!.featureSets.find(set => set.id === setId);
      expect(featureSet).toBeDefined();
    });
  });

  /**
   * Test: Security feature paths are correctly formatted
   * This test validates that all security feature paths follow the expected pattern
   */
  it('should have correctly formatted security feature paths', () => {
    const securityArea = featureAreas.find(area => area.id === 'security');
    expect(securityArea).toBeDefined();

    securityArea!.featureSets.forEach(set => {
      set.features.forEach(feature => {
        // All security feature paths should start with /security/
        expect(feature.path).toMatch(/^\/security\//);

        // Path should follow pattern: /security/{featureSet}/{feature}
        const pathParts = feature.path.split('/');
        expect(pathParts).toHaveLength(4); // ['', 'security', 'featureSet', 'feature']
        expect(pathParts[1]).toBe('security');
        expect(pathParts[2]).toBe(set.id);
      });
    });
  });

  /**
   * Test: Navigation highlighting with different routes
   * This test validates that navigation highlighting updates correctly for different routes
   */
  it('should update highlighting correctly with different routes', () => {
    // Test security route
    const { unmount: unmount1 } = renderMenuPaneWithRoute('/security/posture/overview');
    let securityAreaButton = screen.getByRole('button', { name: /security/i });
    expect(securityAreaButton).toHaveClass('bg-primary/10', 'text-primary');
    unmount1();

    // Test assets route
    const { unmount: unmount2 } = renderMenuPaneWithRoute('/assets/dashboard');
    securityAreaButton = screen.getByRole('button', { name: /security/i });
    expect(securityAreaButton).not.toHaveClass('bg-primary/10', 'text-primary');

    const assetsAreaButton = screen.getByRole('button', { name: /assets/i });
    expect(assetsAreaButton).toHaveClass('bg-primary/10', 'text-primary');
    unmount2();
  });

  /**
   * Test: User Settings highlighting
   * This test validates that the user settings button is highlighted correctly
   */
  it('should highlight user settings when on settings route', () => {
    renderMenuPaneWithRoute('/settings/user');

    const userSettingsButton = screen.getByRole('button', { name: /user settings/i });
    expect(userSettingsButton).toHaveClass('bg-primary/10', 'text-primary');
  });

  /**
   * Test: Invalid routes don't cause highlighting issues
   * This test validates that invalid routes don't break navigation highlighting
   */
  it('should handle invalid routes gracefully without breaking highlighting', () => {
    renderMenuPaneWithRoute('/invalid/route/that/does/not/exist');

    // No feature areas should be highlighted for invalid routes
    const securityAreaButton = screen.getByRole('button', { name: /security/i });
    expect(securityAreaButton).not.toHaveClass('bg-primary/10', 'text-primary');

    const assetsAreaButton = screen.getByRole('button', { name: /assets/i });
    expect(assetsAreaButton).not.toHaveClass('bg-primary/10', 'text-primary');

    // Component should still render without errors
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});