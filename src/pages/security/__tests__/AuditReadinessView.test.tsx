import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuditReadinessView } from '../AuditReadinessView';
import { AppProvider } from '@/context/AppContext';

// Mock the Supabase audit readiness queries
vi.mock('@/lib/auditReadinessQueries', () => ({
  getAuditReadinessByTenant: vi.fn(() => Promise.resolve([
    {
      id: 'audit-1',
      tenantId: 'test-tenant',
      name: 'IEC 62443 Audit Preparation',
      description: 'Audit preparation for IEC 62443 compliance',
      type: 'certification',
      standard: 'IEC 62443',
      scope: {
        siteTypes: ['substation', 'grid-station'],
        assetTypes: ['transformer', 'protection-relay'],
        zones: ['control', 'protection'],
        departments: ['Operations', 'Engineering']
      },
      scheduledDate: '2024-06-15T09:00:00Z',
      preparationStatus: 'in-progress',
      overallReadiness: 75,
      requirements: [],
      criticalGaps: [],
      assignedCoordinator: 'test@example.com',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      daysUntilAudit: 100
    }
  ])),
  getAuditRequirements: vi.fn(() => Promise.resolve([])),
  getAuditEvidence: vi.fn(() => Promise.resolve([]))
}));

describe('AuditReadinessView', () => {
  it('renders without crashing', async () => {
    render(
      <AppProvider>
        <AuditReadinessView />
      </AppProvider>
    );
    
    expect(screen.getByText('Audit Readiness View')).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading Audit Readiness Data')).not.toBeInTheDocument();
    });
  });

  it('displays transmission-specific context', async () => {
    render(
      <AppProvider>
        <AuditReadinessView />
      </AppProvider>
    );
    
    // Check for transmission-specific subtitle
    expect(screen.getByText(/Power Transmission Audit Preparation/)).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('IEC 62443 Audit Preparation')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(
      <AppProvider>
        <AuditReadinessView />
      </AppProvider>
    );
    
    expect(screen.getByText('Loading Audit Readiness Data')).toBeInTheDocument();
    expect(screen.getByText('Connecting to Supabase...')).toBeInTheDocument();
  });
});