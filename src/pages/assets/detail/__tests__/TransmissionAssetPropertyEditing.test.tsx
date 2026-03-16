import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TransmissionAssetDetailPage } from '../TransmissionAssetDetailPage';
import { TransmissionAsset } from '@/types/transmission';

const mockAsset: TransmissionAsset = {
    id: 'test-asset-id',
    tenantId: 'test-tenant-id',
    siteId: 'test-site-id',
    siteName: 'Test Site',
    assetTypeId: 'test-type-id',
    assetTypeCode: 'TRANSFORMER',
    assetTypeName: 'Power Transformer',
    name: 'Test Transformer',
    status: 'online',
    criticality: 'critical',
    parentAssetId: null,
    properties: {
        voltage_primary: 400,
        cooling_type: 'ONAF'
    },
    propertiesSchema: {
        voltage_primary: 'number',
        voltage_secondary: 'number',
        capacity_mva: 'number',
        cooling_type: 'string'
    }
};

// Mock useDataProvider hook
const mockUpdateTransmissionAsset = vi.fn();
const mockCreateAssetAuditLog = vi.fn();

vi.mock('@/hooks/useDataProvider', () => ({
    useDataProvider: () => ({
        provider: {
            getTransmissionAssetById: vi.fn().mockResolvedValue(mockAsset),
            updateTransmissionAsset: mockUpdateTransmissionAsset,
            createAssetAuditLog: mockCreateAssetAuditLog,
            getAlertsByAsset: vi.fn().mockResolvedValue([]),
            getTelemetryPointsByAsset: vi.fn().mockResolvedValue([]),
            getChildAssets: vi.fn().mockResolvedValue([]),
            getAssetTopologyLinks: vi.fn().mockResolvedValue([]),
            getAssetDocuments: vi.fn().mockResolvedValue([]),
            getAssetAuditLog: vi.fn().mockResolvedValue({ data: [], total: 0 }),
            getComplianceByAsset: vi.fn().mockResolvedValue([])
        },
        backend: 'supabase',
        isMock: false,
        isSupabase: true
    })
}));

// Mock the components that might be problematic in JSDOM or are not needed for this logic test
vi.mock('@/components/shared/LoadingState', () => ({
    LoadingState: () => <div data-testid="loading">Loading...</div>
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn()
    }
}));

describe('TransmissionAssetDetailPage - Property Editing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUpdateTransmissionAsset.mockResolvedValue({ ...mockAsset, properties: { ...mockAsset.properties, voltage_primary: 500 } });
        mockCreateAssetAuditLog.mockResolvedValue({});
    });

    const renderComponent = () => {
        return render(
            <MemoryRouter initialEntries={['/assets/detail/360/test-asset-id']}>
                <Routes>
                    <Route path="/assets/detail/360/:id" element={<TransmissionAssetDetailPage />} />
                    <Route path="/assets/portfolio/overview" element={<div>Portfolio</div>} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('toggles edit mode when Edit button is clicked', async () => {
        renderComponent();

        // Wait for asset to load
        await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument());

        const editButton = screen.getByRole('button', { name: /edit/i });
        fireEvent.click(editButton);

        await waitFor(() => {
            // The Edit button text should change to Cancel
            const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
            expect(cancelButtons.length).toBeGreaterThan(0);
            // The Save button should appear in the Properties card
            expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
        });

        // Click cancel (the main edit toggle button which now says Cancel)
        const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
        fireEvent.click(cancelButtons[0]);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
        });
    });

    it('displays validation error for invalid numeric input', async () => {
        renderComponent();
        await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: /edit/i }));

        // Wait for the input to appear
        const input = await screen.findByLabelText(/voltage primary/i);
        fireEvent.change(input, { target: { value: 'not-a-number' } });

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(screen.getByText(/must be a number/i)).toBeInTheDocument();
        });
        expect(mockUpdateTransmissionAsset).not.toHaveBeenCalled();
    });

    it('successfully saves properties and creates audit log', async () => {
        renderComponent();
        await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: /edit/i }));

        const input = await screen.findByLabelText(/voltage primary/i);
        fireEvent.change(input, { target: { value: '500' } });

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(mockUpdateTransmissionAsset).toHaveBeenCalledWith('test-asset-id', {
                properties: expect.objectContaining({
                    voltage_primary: 500,
                    cooling_type: 'ONAF'
                })
            });
            expect(mockCreateAssetAuditLog).toHaveBeenCalled();
            expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument(); // Back to read mode
        });
    });
});
