import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RootCauseDiagnostics } from '../RootCauseDiagnostics';
import * as useAPMModule from '@/hooks/useAPM';
import * as AppContextModule from '@/context/AppContext';

// Mock the hooks
vi.mock('@/hooks/useAPM');
vi.mock('@/context/AppContext');

describe('RootCauseDiagnostics', () => {
  beforeEach(() => {
    // Mock useApp context
    vi.spyOn(AppContextModule, 'useApp').mockReturnValue({
      sector: 'power',
      subsector: 'transmission',
    } as any);

    // Mock diagnostic events hook
    vi.spyOn(useAPMModule, 'useDiagnosticEvents').mockReturnValue({
      data: [
        {
          id: 'event-1',
          asset_id: 'asset-1',
          event_type: 'thermal',
          title: 'High Temperature Alert',
          description: 'Transformer temperature exceeded threshold',
          confidence: 85,
          detected_at: new Date().toISOString(),
          state: 'open',
          created_at: new Date().toISOString(),
        },
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    // Mock RCA records hook
    vi.spyOn(useAPMModule, 'useRCARecords').mockReturnValue({
      data: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    // Mock FMEA entries hook
    vi.spyOn(useAPMModule, 'useFMEAEntries').mockReturnValue({
      data: [],
      loading: false,
      error: null,
    } as any);

    // Mock mutation hooks
    vi.spyOn(useAPMModule, 'useAcknowledgeDiagnosticEvent').mockReturnValue({
      mutate: vi.fn(),
      loading: false,
      error: null,
    } as any);

    vi.spyOn(useAPMModule, 'useCloseDiagnosticEvent').mockReturnValue({
      mutate: vi.fn(),
      loading: false,
      error: null,
    } as any);

    vi.spyOn(useAPMModule, 'useCreateRCARecord').mockReturnValue({
      mutate: vi.fn(),
      loading: false,
      error: null,
    } as any);
  });

  it('renders diagnostic events list', async () => {
    render(<RootCauseDiagnostics />);
    
    await waitFor(() => {
      expect(screen.getByText('High Temperature Alert')).toBeInTheDocument();
    });
  });

  it('displays event state badge', async () => {
    render(<RootCauseDiagnostics />);
    
    await waitFor(() => {
      expect(screen.getByText('open')).toBeInTheDocument();
    });
  });

  it('shows acknowledge button for open events', async () => {
    render(<RootCauseDiagnostics />);
    
    // Click on the event to select it
    const eventButton = await screen.findByText('High Temperature Alert');
    eventButton.click();

    await waitFor(() => {
      expect(screen.getByText('Acknowledge')).toBeInTheDocument();
    });
  });
});
