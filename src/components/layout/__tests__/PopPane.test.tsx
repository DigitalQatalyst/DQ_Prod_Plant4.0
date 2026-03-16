import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PopPane } from '../PopPane';
import { AppProvider } from '@/context/AppContext';
import { upstreamDiscoveryJobs, connectionEndpoints, upstreamAssets } from '@/data/upstreamMockData';

// Mock the useApp hook
const mockUseApp = vi.fn();
vi.mock('@/context/AppContext', async () => {
  const actual = await vi.importActual('@/context/AppContext');
  return {
    ...actual,
    useApp: () => mockUseApp(),
  };
});

describe('PopPane', () => {
  it('renders nothing when PopPane is closed', () => {
    mockUseApp.mockReturnValue({
      isPopPaneOpen: false,
      setIsPopPaneOpen: vi.fn(),
      popPaneContent: { type: null, data: null },
    });

    const { container } = render(<PopPane />);
    expect(container.firstChild).toBeNull();
  });

  it('renders discovery job quick view when PopPane is open with discovery job', () => {
    const mockJob = upstreamDiscoveryJobs[0];
    mockUseApp.mockReturnValue({
      isPopPaneOpen: true,
      setIsPopPaneOpen: vi.fn(),
      popPaneContent: { type: 'discovery-job', data: mockJob },
    });

    render(<PopPane />);
    
    expect(screen.getByText('Discovery Job')).toBeInTheDocument();
    expect(screen.getByText(mockJob.name)).toBeInTheDocument();
  });

  it('renders connection endpoint quick view when PopPane is open with endpoint', () => {
    const mockEndpoint = connectionEndpoints[0];
    mockUseApp.mockReturnValue({
      isPopPaneOpen: true,
      setIsPopPaneOpen: vi.fn(),
      popPaneContent: { type: 'connection-endpoint', data: mockEndpoint },
    });

    render(<PopPane />);
    
    expect(screen.getByText('Connection Endpoint')).toBeInTheDocument();
    expect(screen.getByText(mockEndpoint.name)).toBeInTheDocument();
  });

  it('renders asset quick view when PopPane is open with asset', () => {
    const mockAsset = upstreamAssets[0];
    mockUseApp.mockReturnValue({
      isPopPaneOpen: true,
      setIsPopPaneOpen: vi.fn(),
      popPaneContent: { type: 'upstream-asset', data: mockAsset },
    });

    render(<PopPane />);
    
    expect(screen.getByText('Asset Details')).toBeInTheDocument();
    expect(screen.getByText(mockAsset.name)).toBeInTheDocument();
  });
});