import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { DiscoveryReviewPage } from "../DiscoveryReviewPage";

// Mock the data provider
const mockProvider = {
  getDefaultTransmissionTenantId: vi.fn().mockResolvedValue("tenant-1"),
  getTransmissionDiscoveryJobsByTenant: vi.fn().mockResolvedValue({
    data: [
      {
        id: "job-1",
        name: "Test Discovery Job",
        tenantId: "tenant-1",
        type: "network",
        scope: { ipRange: "192.168.1.0/24" },
        status: "completed",
        foundCount: 3,
        createdAt: "2024-01-15T08:30:00Z"
      }
    ],
    total: 1
  }),
  getTransmissionCandidateAssetsByJob: vi.fn().mockResolvedValue({
    data: [
      {
        id: "candidate-1",
        tenantId: "tenant-1",
        discoveryJobId: "job-1",
        suggestedName: "Transformer T1",
        suggestedTypeId: "type-1",
        suggestedTypeName: "Transformer",
        suggestedHierarchy: {},
        confidence: 0.85,
        status: "pending",
        createdAt: "2024-01-15T09:00:00Z"
      }
    ],
    total: 1
  })
};

vi.mock("@/hooks/useDataProvider", () => ({
  useDataProvider: () => ({ provider: mockProvider })
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AppProvider>
        {component}
      </AppProvider>
    </BrowserRouter>
  );
};

describe("DiscoveryReviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders candidate assets list", async () => {
    renderWithProviders(<DiscoveryReviewPage />);
    
    await waitFor(() => {
      expect(screen.getByText("Candidate Assets")).toBeInTheDocument();
    });
  });

  it("displays candidate details", async () => {
    renderWithProviders(<DiscoveryReviewPage />);
    
    await waitFor(() => {
      expect(screen.getByText("Transformer T1")).toBeInTheDocument();
      expect(screen.getByText("Transformer")).toBeInTheDocument();
    });
  });

  it("shows confidence score", async () => {
    renderWithProviders(<DiscoveryReviewPage />);
    
    await waitFor(() => {
      expect(screen.getByText("85%")).toBeInTheDocument();
    });
  });

  it("displays status badge", async () => {
    renderWithProviders(<DiscoveryReviewPage />);
    
    await waitFor(() => {
      expect(screen.getByText("pending")).toBeInTheDocument();
    });
  });

  it("shows discovery job selector", async () => {
    renderWithProviders(<DiscoveryReviewPage />);
    
    await waitFor(() => {
      expect(screen.getByText("Discovery Job")).toBeInTheDocument();
    });
  });
});
