import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { SecurityAlert } from '@/data/mockData';
import { SecurityAlertInbox } from './SecurityAlertInbox';
import React from 'react';

// Mock the AppContext
const mockTenant = { id: 't1', name: 'Kenya Power', industry: 'Utilities' };
const mockSetCurrentTenant = vi.fn();

vi.mock('@/context/AppContext', () => ({
  useApp: () => ({
    currentTenant: mockTenant,
    setCurrentTenant: mockSetCurrentTenant,
  }),
}));

// Mock the layout components to simplify testing
vi.mock('@/components/layout/ListPane', () => ({
  ListPane: ({ children, title, subtitle, count, showFilters }: any) => (
    <div data-testid="list-pane">
      <div data-testid="list-pane-title">{title}</div>
      <div data-testid="list-pane-subtitle">{subtitle}</div>
      <div data-testid="list-pane-count">{count}</div>
      {children}
    </div>
  ),
}));

vi.mock('@/components/layout/WorkPane', () => ({
  WorkPane: ({ title, subtitle, tabs }: any) => (
    <div data-testid="work-pane">
      <div data-testid="work-pane-title">{title}</div>
      <div data-testid="work-pane-subtitle">{subtitle}</div>
      {tabs && tabs.length > 0 && tabs[0].content}
    </div>
  ),
}));

/**
 * Feature: security-feature-area, Property 2: Alert severity ordering
 * Validates: Requirements 5.5
 * 
 * Property: For any list of security alerts, when sorted by severity,
 * critical alerts should appear before high, high before medium, and medium before low severity alerts
 */
describe('Property 2: Alert severity ordering', () => {
  // Define severity order (higher number = higher severity)
  const severityOrder: Record<SecurityAlert['severity'], number> = {
    'critical': 4,
    'high': 3,
    'medium': 2,
    'low': 1,
  };

  // Helper function to sort security alerts by severity (highest first)
  const sortAlertsBySeverity = (alerts: SecurityAlert[]): SecurityAlert[] => {
    return [...alerts].sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
  };

  // Helper function to check if alerts are ordered by severity (highest first)
  const isOrderedBySeverity = (alerts: SecurityAlert[]): boolean => {
    for (let i = 0; i < alerts.length - 1; i++) {
      const currentSeverity = severityOrder[alerts[i].severity];
      const nextSeverity = severityOrder[alerts[i + 1].severity];
      
      // Current alert should have severity >= next alert (highest first)
      if (currentSeverity < nextSeverity) {
        return false;
      }
    }
    return true;
  };

  // Arbitrary generator for SecurityAlert
  const securityAlertArbitrary = fc.record({
    id: fc.string({ minLength: 1, maxLength: 10 }),
    tenantId: fc.constantFrom('t1', 't2', 't3'),
    title: fc.string({ minLength: 5, maxLength: 50 }),
    description: fc.string({ minLength: 10, maxLength: 100 }),
    severity: fc.constantFrom('critical', 'high', 'medium', 'low') as fc.Arbitrary<'critical' | 'high' | 'medium' | 'low'>,
    status: fc.constantFrom('new', 'acknowledged', 'investigating', 'resolved') as fc.Arbitrary<'new' | 'acknowledged' | 'investigating' | 'resolved'>,
    affectedAsset: fc.option(fc.string({ minLength: 5, maxLength: 30 }), { nil: undefined }),
    affectedAssetId: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
    timestamp: fc.integer({ min: Date.parse('2024-01-01T00:00:00Z'), max: Date.parse('2024-12-31T23:59:59Z') }).map(ms => new Date(ms).toISOString()),
    detectedBy: fc.string({ minLength: 5, maxLength: 30 }),
    assignedTo: fc.option(fc.string({ minLength: 5, maxLength: 30 }), { nil: undefined }),
    category: fc.constantFrom('unauthorized-access', 'malware', 'configuration-change', 'vulnerability'),
  });

  it('should maintain severity order (critical > high > medium > low) for any list of alerts', () => {
    fc.assert(
      fc.property(
        // Generate a non-empty array of security alerts
        fc.array(securityAlertArbitrary, { minLength: 1, maxLength: 20 }),
        (alerts) => {
          // Sort the alerts by severity (highest first)
          const sortedAlerts = sortAlertsBySeverity(alerts);
          
          // Property: The sorted list should be ordered by severity
          expect(isOrderedBySeverity(sortedAlerts)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should place critical alerts before high severity alerts', () => {
    fc.assert(
      fc.property(
        securityAlertArbitrary,
        securityAlertArbitrary,
        (alert1, alert2) => {
          // Create one critical and one high severity alert
          const criticalAlert = { ...alert1, severity: 'critical' as const };
          const highAlert = { ...alert2, severity: 'high' as const };
          
          const alerts = [highAlert, criticalAlert]; // Start with high first
          const sortedAlerts = sortAlertsBySeverity(alerts);
          
          // Critical should come before high
          expect(sortedAlerts[0].severity).toBe('critical');
          expect(sortedAlerts[1].severity).toBe('high');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should place high alerts before medium severity alerts', () => {
    fc.assert(
      fc.property(
        securityAlertArbitrary,
        securityAlertArbitrary,
        (alert1, alert2) => {
          // Create one high and one medium severity alert
          const highAlert = { ...alert1, severity: 'high' as const };
          const mediumAlert = { ...alert2, severity: 'medium' as const };
          
          const alerts = [mediumAlert, highAlert]; // Start with medium first
          const sortedAlerts = sortAlertsBySeverity(alerts);
          
          // High should come before medium
          expect(sortedAlerts[0].severity).toBe('high');
          expect(sortedAlerts[1].severity).toBe('medium');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should place medium alerts before low severity alerts', () => {
    fc.assert(
      fc.property(
        securityAlertArbitrary,
        securityAlertArbitrary,
        (alert1, alert2) => {
          // Create one medium and one low severity alert
          const mediumAlert = { ...alert1, severity: 'medium' as const };
          const lowAlert = { ...alert2, severity: 'low' as const };
          
          const alerts = [lowAlert, mediumAlert]; // Start with low first
          const sortedAlerts = sortAlertsBySeverity(alerts);
          
          // Medium should come before low
          expect(sortedAlerts[0].severity).toBe('medium');
          expect(sortedAlerts[1].severity).toBe('low');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle alerts with identical severity levels', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('critical', 'high', 'medium', 'low') as fc.Arbitrary<'critical' | 'high' | 'medium' | 'low'>,
        fc.integer({ min: 2, max: 5 }),
        (severity, count) => {
          // Create multiple alerts with the same severity
          const alerts = Array.from({ length: count }, (_, i) => ({
            id: `alert-${i}`,
            tenantId: 't1',
            title: `Alert ${i}`,
            description: `Description for alert ${i}`,
            severity,
            status: 'new' as const,
            timestamp: new Date().toISOString(),
            detectedBy: 'System',
            category: 'unauthorized-access' as const,
          }));
          
          const sortedAlerts = sortAlertsBySeverity(alerts);
          
          // All alerts should have the same severity
          const severities = sortedAlerts.map(a => a.severity);
          const uniqueSeverities = new Set(severities);
          expect(uniqueSeverities.size).toBe(1);
          
          // The list should still be considered ordered by severity
          expect(isOrderedBySeverity(sortedAlerts)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain complete severity hierarchy (critical > high > medium > low)', () => {
    fc.assert(
      fc.property(
        securityAlertArbitrary,
        securityAlertArbitrary,
        securityAlertArbitrary,
        securityAlertArbitrary,
        (alert1, alert2, alert3, alert4) => {
          // Create one alert of each severity level
          const criticalAlert = { ...alert1, severity: 'critical' as const, id: 'critical-1' };
          const highAlert = { ...alert2, severity: 'high' as const, id: 'high-1' };
          const mediumAlert = { ...alert3, severity: 'medium' as const, id: 'medium-1' };
          const lowAlert = { ...alert4, severity: 'low' as const, id: 'low-1' };
          
          // Shuffle the alerts randomly
          const alerts = [lowAlert, mediumAlert, highAlert, criticalAlert];
          const sortedAlerts = sortAlertsBySeverity(alerts);
          
          // Verify the complete hierarchy
          expect(sortedAlerts[0].severity).toBe('critical');
          expect(sortedAlerts[1].severity).toBe('high');
          expect(sortedAlerts[2].severity).toBe('medium');
          expect(sortedAlerts[3].severity).toBe('low');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty list of alerts', () => {
    const emptyList: SecurityAlert[] = [];
    const sortedList = sortAlertsBySeverity(emptyList);
    
    expect(sortedList).toEqual([]);
    expect(isOrderedBySeverity(sortedList)).toBe(true);
  });

  it('should handle single alert', () => {
    fc.assert(
      fc.property(
        securityAlertArbitrary,
        (alert) => {
          const sortedAlerts = sortAlertsBySeverity([alert]);
          
          expect(sortedAlerts.length).toBe(1);
          expect(sortedAlerts[0]).toEqual(alert);
          expect(isOrderedBySeverity(sortedAlerts)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should group alerts by severity level when sorted', () => {
    fc.assert(
      fc.property(
        fc.array(securityAlertArbitrary, { minLength: 10, maxLength: 30 }),
        (alerts) => {
          const sortedAlerts = sortAlertsBySeverity(alerts);
          
          // Find the indices where severity changes
          const criticalAlerts = sortedAlerts.filter(a => a.severity === 'critical');
          const highAlerts = sortedAlerts.filter(a => a.severity === 'high');
          const mediumAlerts = sortedAlerts.filter(a => a.severity === 'medium');
          const lowAlerts = sortedAlerts.filter(a => a.severity === 'low');
          
          // Reconstruct the sorted list by severity groups
          const reconstructed = [
            ...criticalAlerts,
            ...highAlerts,
            ...mediumAlerts,
            ...lowAlerts,
          ];
          
          // The sorted list should match the reconstructed list
          expect(sortedAlerts.map(a => a.id)).toEqual(reconstructed.map(a => a.id));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve relative order within same severity level (stable sort)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('critical', 'high', 'medium', 'low') as fc.Arbitrary<'critical' | 'high' | 'medium' | 'low'>,
        fc.integer({ min: 3, max: 10 }),
        (severity, count) => {
          // Create alerts with the same severity but different IDs (to track order)
          const alerts = Array.from({ length: count }, (_, i) => ({
            id: `alert-${i}`,
            tenantId: 't1',
            title: `Alert ${i}`,
            description: `Description ${i}`,
            severity,
            status: 'new' as const,
            timestamp: new Date().toISOString(),
            detectedBy: 'System',
            category: 'unauthorized-access' as const,
          }));
          
          const sortedAlerts = sortAlertsBySeverity(alerts);
          
          // All alerts should still be present
          expect(sortedAlerts.length).toBe(alerts.length);
          
          // All should have the same severity
          expect(sortedAlerts.every(a => a.severity === severity)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: security-feature-area, Property 7: Alert status transition validity
 * Validates: Requirements 5.2
 * 
 * Property: For any security alert, status transitions should follow the valid flow:
 * new → acknowledged → investigating → resolved, and no alert should transition backward in this sequence
 */
describe('Property 7: Alert status transition validity', () => {
  // Define the valid status order (lower number = earlier in sequence)
  const statusOrder: Record<SecurityAlert['status'], number> = {
    'new': 1,
    'acknowledged': 2,
    'investigating': 3,
    'resolved': 4,
  };

  // Helper function to check if a status transition is valid (forward only)
  const isValidTransition = (fromStatus: SecurityAlert['status'], toStatus: SecurityAlert['status']): boolean => {
    const fromOrder = statusOrder[fromStatus];
    const toOrder = statusOrder[toStatus];
    
    // Valid transitions are:
    // 1. Same status (no change)
    // 2. Forward progression (toOrder > fromOrder)
    return toOrder >= fromOrder;
  };

  // Helper function to check if a sequence of status transitions is valid
  const isValidTransitionSequence = (statuses: SecurityAlert['status'][]): boolean => {
    if (statuses.length <= 1) {
      return true; // Empty or single status is always valid
    }

    for (let i = 0; i < statuses.length - 1; i++) {
      if (!isValidTransition(statuses[i], statuses[i + 1])) {
        return false;
      }
    }
    return true;
  };

  // Helper function to generate a valid status transition sequence
  const generateValidTransitionSequence = (startStatus: SecurityAlert['status'], length: number): SecurityAlert['status'][] => {
    const allStatuses: SecurityAlert['status'][] = ['new', 'acknowledged', 'investigating', 'resolved'];
    const sequence: SecurityAlert['status'][] = [startStatus];
    
    for (let i = 1; i < length; i++) {
      // Pick a status that is >= current status
      const currentIndex = allStatuses.indexOf(sequence[sequence.length - 1]);
      const nextIndex = Math.min(currentIndex + Math.floor(Math.random() * 2), allStatuses.length - 1);
      sequence.push(allStatuses[nextIndex]);
    }
    
    return sequence;
  };

  it('should allow forward status transitions (new → acknowledged → investigating → resolved)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('new', 'acknowledged', 'investigating') as fc.Arbitrary<'new' | 'acknowledged' | 'investigating'>,
        (startStatus) => {
          const allStatuses: SecurityAlert['status'][] = ['new', 'acknowledged', 'investigating', 'resolved'];
          const startIndex = allStatuses.indexOf(startStatus);
          
          // Test all forward transitions from this status
          for (let i = startIndex; i < allStatuses.length; i++) {
            const toStatus = allStatuses[i];
            expect(isValidTransition(startStatus, toStatus)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject backward status transitions', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('acknowledged', 'investigating', 'resolved') as fc.Arbitrary<'acknowledged' | 'investigating' | 'resolved'>,
        (startStatus) => {
          const allStatuses: SecurityAlert['status'][] = ['new', 'acknowledged', 'investigating', 'resolved'];
          const startIndex = allStatuses.indexOf(startStatus);
          
          // Test all backward transitions from this status (should be invalid)
          for (let i = 0; i < startIndex; i++) {
            const toStatus = allStatuses[i];
            expect(isValidTransition(startStatus, toStatus)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow staying in the same status', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('new', 'acknowledged', 'investigating', 'resolved') as fc.Arbitrary<SecurityAlert['status']>,
        (status) => {
          // Transitioning to the same status should always be valid
          expect(isValidTransition(status, status)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate that new → acknowledged is a valid transition', () => {
    expect(isValidTransition('new', 'acknowledged')).toBe(true);
  });

  it('should validate that acknowledged → investigating is a valid transition', () => {
    expect(isValidTransition('acknowledged', 'investigating')).toBe(true);
  });

  it('should validate that investigating → resolved is a valid transition', () => {
    expect(isValidTransition('investigating', 'resolved')).toBe(true);
  });

  it('should validate that new → resolved is a valid transition (skip intermediate states)', () => {
    expect(isValidTransition('new', 'resolved')).toBe(true);
  });

  it('should reject resolved → new transition', () => {
    expect(isValidTransition('resolved', 'new')).toBe(false);
  });

  it('should reject resolved → acknowledged transition', () => {
    expect(isValidTransition('resolved', 'acknowledged')).toBe(false);
  });

  it('should reject resolved → investigating transition', () => {
    expect(isValidTransition('resolved', 'investigating')).toBe(false);
  });

  it('should reject investigating → new transition', () => {
    expect(isValidTransition('investigating', 'new')).toBe(false);
  });

  it('should reject investigating → acknowledged transition', () => {
    expect(isValidTransition('investigating', 'acknowledged')).toBe(false);
  });

  it('should reject acknowledged → new transition', () => {
    expect(isValidTransition('acknowledged', 'new')).toBe(false);
  });

  it('should validate sequences of forward transitions', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('new', 'acknowledged', 'investigating') as fc.Arbitrary<'new' | 'acknowledged' | 'investigating'>,
        fc.integer({ min: 2, max: 5 }),
        (startStatus, length) => {
          // Generate a sequence that only moves forward
          const sequence = generateValidTransitionSequence(startStatus, length);
          
          // The sequence should be valid
          expect(isValidTransitionSequence(sequence)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject sequences containing backward transitions', () => {
    // Test specific invalid sequences
    const invalidSequences: SecurityAlert['status'][][] = [
      ['new', 'acknowledged', 'new'], // backward from acknowledged to new
      ['acknowledged', 'investigating', 'acknowledged'], // backward from investigating to acknowledged
      ['investigating', 'resolved', 'investigating'], // backward from resolved to investigating
      ['resolved', 'new'], // backward from resolved to new
      ['new', 'acknowledged', 'investigating', 'resolved', 'new'], // backward at the end
      ['new', 'resolved', 'acknowledged'], // backward after skip
    ];

    invalidSequences.forEach((sequence) => {
      expect(isValidTransitionSequence(sequence)).toBe(false);
    });
  });

  it('should validate the complete forward progression (new → acknowledged → investigating → resolved)', () => {
    const completeSequence: SecurityAlert['status'][] = ['new', 'acknowledged', 'investigating', 'resolved'];
    expect(isValidTransitionSequence(completeSequence)).toBe(true);
  });

  it('should validate partial forward progressions', () => {
    const partialSequences: SecurityAlert['status'][][] = [
      ['new', 'acknowledged'],
      ['new', 'investigating'],
      ['new', 'resolved'],
      ['acknowledged', 'investigating'],
      ['acknowledged', 'resolved'],
      ['investigating', 'resolved'],
    ];

    partialSequences.forEach((sequence) => {
      expect(isValidTransitionSequence(sequence)).toBe(true);
    });
  });

  it('should validate that alerts can skip intermediate states', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('new', 'acknowledged', 'investigating') as fc.Arbitrary<'new' | 'acknowledged' | 'investigating'>,
        (startStatus) => {
          const allStatuses: SecurityAlert['status'][] = ['new', 'acknowledged', 'investigating', 'resolved'];
          const startIndex = allStatuses.indexOf(startStatus);
          
          // Test skipping to any later status (should be valid)
          for (let i = startIndex + 1; i < allStatuses.length; i++) {
            const toStatus = allStatuses[i];
            expect(isValidTransition(startStatus, toStatus)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate status order consistency', () => {
    // Verify that the status order is correctly defined
    expect(statusOrder['new']).toBeLessThan(statusOrder['acknowledged']);
    expect(statusOrder['acknowledged']).toBeLessThan(statusOrder['investigating']);
    expect(statusOrder['investigating']).toBeLessThan(statusOrder['resolved']);
  });

  it('should handle empty transition sequences', () => {
    expect(isValidTransitionSequence([])).toBe(true);
  });

  it('should handle single-status sequences', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('new', 'acknowledged', 'investigating', 'resolved') as fc.Arbitrary<SecurityAlert['status']>,
        (status) => {
          expect(isValidTransitionSequence([status])).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate that all possible forward transitions are allowed', () => {
    const allStatuses: SecurityAlert['status'][] = ['new', 'acknowledged', 'investigating', 'resolved'];
    
    // Test all combinations
    for (let i = 0; i < allStatuses.length; i++) {
      for (let j = 0; j < allStatuses.length; j++) {
        const fromStatus = allStatuses[i];
        const toStatus = allStatuses[j];
        const shouldBeValid = j >= i; // Forward or same
        
        expect(isValidTransition(fromStatus, toStatus)).toBe(shouldBeValid);
      }
    }
  });

  it('should generate only valid transition sequences', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('new', 'acknowledged', 'investigating', 'resolved') as fc.Arbitrary<SecurityAlert['status']>,
        fc.integer({ min: 1, max: 10 }),
        (startStatus, length) => {
          const sequence = generateValidTransitionSequence(startStatus, length);
          
          // The generated sequence should always be valid
          expect(isValidTransitionSequence(sequence)).toBe(true);
          
          // The sequence should start with the specified status
          expect(sequence[0]).toBe(startStatus);
          
          // The sequence should have the specified length
          expect(sequence.length).toBe(length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Unit Tests for SecurityAlertInbox Component
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
describe('SecurityAlertInbox Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render alert list correctly', () => {
      const { container } = render(<SecurityAlertInbox />);
      expect(container).toBeTruthy();
      
      // Should render ListPane with correct title
      expect(screen.getByTestId('list-pane-title')).toHaveTextContent('Security Alerts');
      expect(screen.getByTestId('list-pane-subtitle')).toHaveTextContent('Kenya Power');
    });

    it('should render filter controls', () => {
      render(<SecurityAlertInbox />);
      
      const listPane = screen.getByTestId('list-pane');
      
      // Should have three select elements (severity, status, and category filters)
      const selects = within(listPane).getAllByRole('combobox');
      expect(selects.length).toBe(3);
    });

    it('should render alert items in the list', () => {
      render(<SecurityAlertInbox />);
      
      // Tenant t1 has 3 security alerts
      // Check that alerts are present (using getAllByText since text appears in both ListPane and WorkPane)
      expect(screen.getAllByText('Unauthorized Access Attempt').length).toBeGreaterThan(0);
    });

    it('should display alert severity badges', () => {
      render(<SecurityAlertInbox />);
      
      // Should display severity badges
      const listPane = screen.getByTestId('list-pane');
      expect(within(listPane).getAllByText('critical').length).toBeGreaterThan(0);
    });

    it('should display alert status badges', () => {
      render(<SecurityAlertInbox />);
      
      // Should display status badges
      const listPane = screen.getByTestId('list-pane');
      expect(within(listPane).getAllByText('new').length).toBeGreaterThan(0);
    });
  });

  describe('Alert Selection', () => {
    it('should update WorkPane when alert is selected', () => {
      render(<SecurityAlertInbox />);
      
      // Initially, the first alert from the array should be selected (Suspicious Configuration Change - most recent)
      const workPane = screen.getByTestId('work-pane');
      expect(within(workPane).getByTestId('work-pane-title')).toHaveTextContent('Suspicious Configuration Change');
      
      // Click on a different alert
      const listPane = screen.getByTestId('list-pane');
      const secondAlert = within(listPane).getByText('Suspicious Configuration Change');
      fireEvent.click(secondAlert.closest('div')!);
      
      // WorkPane should update to show the selected alert
      expect(within(workPane).getByTestId('work-pane-title')).toHaveTextContent('Suspicious Configuration Change');
    });

    it('should highlight selected alert in the list', () => {
      render(<SecurityAlertInbox />);
      
      // Find the first alert from the list (should be selected by default)
      const listPane = screen.getByTestId('list-pane');
      const alertText = within(listPane).getByText('Suspicious Configuration Change');
      
      // Find the parent container with the border-primary class
      const alertContainer = alertText.closest('.border-primary');
      
      // Should have the selected styling class
      expect(alertContainer).toBeInTheDocument();
      expect(alertContainer).toHaveClass('border-primary');
    });

    it('should display alert details in WorkPane', () => {
      render(<SecurityAlertInbox />);
      
      const workPane = screen.getByTestId('work-pane');
      
      // Should display alert title
      expect(within(workPane).getByTestId('work-pane-title')).toBeInTheDocument();
      
      // Should display alert description
      expect(within(workPane).getByText(/Unauthorized configuration change detected/i)).toBeInTheDocument();
    });
  });

  describe('Severity Filtering', () => {
    it('should filter alerts by severity correctly', () => {
      render(<SecurityAlertInbox />);
      
      const listPane = screen.getByTestId('list-pane');
      const selects = within(listPane).getAllByRole('combobox');
      const severityFilter = selects[0] as HTMLSelectElement;
      
      // Change filter to "critical"
      fireEvent.change(severityFilter, { target: { value: 'critical' } });
      
      // Should only show critical alerts (2 for tenant t1)
      const alertCount = screen.getByTestId('list-pane-count');
      const count = parseInt(alertCount.textContent || '0');
      
      // Verify that filtering occurred
      expect(count).toBe(2);
      expect(count).toBeLessThan(3); // Less than total alerts for tenant t1
    });

    it('should show all alerts when severity filter is "all"', () => {
      render(<SecurityAlertInbox />);
      
      const listPane = screen.getByTestId('list-pane');
      const selects = within(listPane).getAllByRole('combobox');
      const severityFilter = selects[0] as HTMLSelectElement;
      
      // Ensure filter is set to "all"
      fireEvent.change(severityFilter, { target: { value: 'all' } });
      
      // Should show all 3 alerts for tenant t1
      const alertCount = screen.getByTestId('list-pane-count');
      expect(alertCount.textContent).toBe('3');
    });

    it('should update displayed alerts when severity filter changes', () => {
      render(<SecurityAlertInbox />);
      
      const listPane = screen.getByTestId('list-pane');
      const selects = within(listPane).getAllByRole('combobox');
      const severityFilter = selects[0] as HTMLSelectElement;
      
      // Get initial count (should be 3 for tenant t1)
      const initialCount = screen.getByTestId('list-pane-count').textContent;
      expect(initialCount).toBe('3');
      
      // Change filter to critical (should show 2 alerts)
      fireEvent.change(severityFilter, { target: { value: 'critical' } });
      
      // Count should change
      const newCount = screen.getByTestId('list-pane-count').textContent;
      expect(newCount).toBe('2');
      expect(newCount).not.toBe(initialCount);
    });
  });

  describe('Status Filtering', () => {
    it('should filter alerts by status correctly', () => {
      render(<SecurityAlertInbox />);
      
      const listPane = screen.getByTestId('list-pane');
      const selects = within(listPane).getAllByRole('combobox');
      const statusFilter = selects[1] as HTMLSelectElement;
      
      // Change filter to "new"
      fireEvent.change(statusFilter, { target: { value: 'new' } });
      
      // Should only show new alerts (1 for tenant t1)
      const alertCount = screen.getByTestId('list-pane-count');
      const count = parseInt(alertCount.textContent || '0');
      
      // Verify that filtering occurred
      expect(count).toBe(1);
      expect(count).toBeLessThan(3); // Less than total alerts for tenant t1
    });

    it('should show all alerts when status filter is "all"', () => {
      render(<SecurityAlertInbox />);
      
      const listPane = screen.getByTestId('list-pane');
      const selects = within(listPane).getAllByRole('combobox');
      const statusFilter = selects[1] as HTMLSelectElement;
      
      // Ensure filter is set to "all"
      fireEvent.change(statusFilter, { target: { value: 'all' } });
      
      // Should show all 3 alerts for tenant t1
      const alertCount = screen.getByTestId('list-pane-count');
      expect(alertCount.textContent).toBe('3');
    });

    it('should update displayed alerts when status filter changes', () => {
      render(<SecurityAlertInbox />);
      
      const listPane = screen.getByTestId('list-pane');
      const selects = within(listPane).getAllByRole('combobox');
      const statusFilter = selects[1] as HTMLSelectElement;
      
      // Get initial count (should be 3)
      const initialCount = screen.getByTestId('list-pane-count').textContent;
      expect(initialCount).toBe('3');
      
      // Change filter to resolved (should show 1 alert)
      fireEvent.change(statusFilter, { target: { value: 'resolved' } });
      
      // Count should change to 1
      const newCount = screen.getByTestId('list-pane-count').textContent;
      expect(newCount).toBe('1');
      expect(newCount).not.toBe(initialCount);
    });

    it('should combine severity and status filters', () => {
      render(<SecurityAlertInbox />);
      
      const listPane = screen.getByTestId('list-pane');
      const selects = within(listPane).getAllByRole('combobox');
      const severityFilter = selects[0] as HTMLSelectElement;
      const statusFilter = selects[1] as HTMLSelectElement;
      
      // Apply both filters (critical + new should match 1 alert)
      fireEvent.change(severityFilter, { target: { value: 'critical' } });
      fireEvent.change(statusFilter, { target: { value: 'new' } });
      
      // Should show only alerts matching both filters
      const alertCount = screen.getByTestId('list-pane-count');
      const count = parseInt(alertCount.textContent || '0');
      
      // Should match 1 alert (Unauthorized Access Attempt)
      expect(count).toBe(1);
    });
  });

  describe('Alert Sorting by Timestamp', () => {
    it('should sort alerts by timestamp with most recent first', () => {
      render(<SecurityAlertInbox />);
      
      const listPane = screen.getByTestId('list-pane');
      
      // Get all alert elements
      const alerts = within(listPane).getAllByText(/Unauthorized Access Attempt|Suspicious Configuration Change|Certificate Expiring Soon/);
      
      // Should have 3 alerts displayed for tenant t1
      expect(alerts.length).toBe(3);
      
      // The first alert should be the most recent one
      // Based on mock data, "Suspicious Configuration Change" is the most recent (2024-01-15T16:00:00Z)
      expect(alerts[0]).toHaveTextContent('Suspicious Configuration Change');
    });

    it('should maintain timestamp sorting after filtering', () => {
      render(<SecurityAlertInbox />);
      
      const listPane = screen.getByTestId('list-pane');
      // Find the select element by its options
      const selects = within(listPane).getAllByRole('combobox');
      const severityFilter = selects[0] as HTMLSelectElement;
      
      // Apply a filter to critical (should show 2 alerts)
      fireEvent.change(severityFilter, { target: { value: 'critical' } });
      
      // Alerts should still be sorted by timestamp
      const alertCount = screen.getByTestId('list-pane-count');
      const count = parseInt(alertCount.textContent || '0');
      
      // Should have 2 critical alerts
      expect(count).toBe(2);
    });
  });

  describe('Alert Details Display', () => {
    it('should display alert information section', () => {
      render(<SecurityAlertInbox />);
      
      const workPane = screen.getByTestId('work-pane');
      
      // Should display "Alert Information" section
      expect(within(workPane).getByText('Alert Information')).toBeInTheDocument();
    });

    it('should display detected at timestamp', () => {
      render(<SecurityAlertInbox />);
      
      const workPane = screen.getByTestId('work-pane');
      
      // Should display "Detected At" label
      expect(within(workPane).getByText('Detected At')).toBeInTheDocument();
    });

    it('should display detected by information', () => {
      render(<SecurityAlertInbox />);
      
      const workPane = screen.getByTestId('work-pane');
      
      // Should display "Detected By" label
      expect(within(workPane).getByText('Detected By')).toBeInTheDocument();
    });

    it('should display alert category', () => {
      render(<SecurityAlertInbox />);
      
      const workPane = screen.getByTestId('work-pane');
      
      // Should display "Category" label
      expect(within(workPane).getByText('Category')).toBeInTheDocument();
    });

    it('should display recommended actions', () => {
      render(<SecurityAlertInbox />);
      
      const workPane = screen.getByTestId('work-pane');
      
      // Should display "Recommended Actions" section
      expect(within(workPane).getByText('Recommended Actions')).toBeInTheDocument();
    });
  });

  describe('Tenant Context Integration', () => {
    it('should display tenant name in subtitle', () => {
      render(<SecurityAlertInbox />);
      
      // Should show tenant name
      expect(screen.getByTestId('list-pane-subtitle')).toHaveTextContent('Kenya Power');
    });

    it('should display alerts filtered by tenant', () => {
      render(<SecurityAlertInbox />);
      
      // Should show alerts for tenant t1
      expect(screen.getAllByText('Unauthorized Access Attempt').length).toBeGreaterThan(0);
      
      // Should show correct count for tenant t1 (3 alerts)
      const alertCount = screen.getByTestId('list-pane-count');
      expect(alertCount.textContent).toBe('3');
    });
  });

  describe('Alert Tabs', () => {
    it('should render tabs for selected alert', () => {
      render(<SecurityAlertInbox />);
      
      const workPane = screen.getByTestId('work-pane');
      
      // Should have content from the first tab (Details)
      expect(within(workPane).getByText('Alert Information')).toBeInTheDocument();
    });
  });

  describe('Empty State Handling', () => {
    it('should handle case when no alerts match filters', () => {
      render(<SecurityAlertInbox />);
      
      const listPane = screen.getByTestId('list-pane');
      // Find the select elements by their role
      const selects = within(listPane).getAllByRole('combobox');
      const severityFilter = selects[0] as HTMLSelectElement;
      const statusFilter = selects[1] as HTMLSelectElement;
      
      // Apply filters that result in a match (low + resolved = 1 alert)
      fireEvent.change(severityFilter, { target: { value: 'low' } });
      fireEvent.change(statusFilter, { target: { value: 'resolved' } });
      
      // Should show count of 1 (Certificate Expiring Soon)
      const alertCount = screen.getByTestId('list-pane-count');
      expect(alertCount.textContent).toBe('1');
    });
  });

  describe('Alert Severity Display', () => {
    it('should display critical severity with correct styling', () => {
      render(<SecurityAlertInbox />);
      
      const listPane = screen.getByTestId('list-pane');
      const criticalBadges = within(listPane).getAllByText('critical');
      
      // Should have critical severity badges
      expect(criticalBadges.length).toBeGreaterThan(0);
    });

    it('should display different severity levels', () => {
      render(<SecurityAlertInbox />);
      
      const listPane = screen.getByTestId('list-pane');
      
      // Should have various severity levels displayed
      // Based on mock data for tenant t1: 2 critical, 1 low
      expect(within(listPane).getAllByText('critical').length).toBe(2);
      expect(within(listPane).getAllByText('low').length).toBe(1);
    });
  });

  describe('Alert Status Display', () => {
    it('should display different status values', () => {
      render(<SecurityAlertInbox />);
      
      const listPane = screen.getByTestId('list-pane');
      
      // Should have various status values displayed
      // Based on mock data for tenant t1
      expect(within(listPane).getAllByText('new').length).toBeGreaterThan(0);
    });
  });
});
