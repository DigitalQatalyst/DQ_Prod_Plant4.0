import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { ManualAssetCapturePage } from "../ManualAssetCapturePage";

// Mock the data provider
const mockProvider = {
  getInfo: vi.fn(() => ({ name: "MockProvider", version: "1.0.0", isConnected: true })),
  getDefaultTransmissionTenantId: vi.fn(() => Promise.resolve("tenant-1")),
  getAssetTypesByTenant: vi.fn(() => Promise.resolve([
    { id: "type-1", code: "TRANSFORMER", name: "Transformer", category: "electrical" },
    { id: "type-2", code: "BREAKER", name: "Circuit Breaker", category: "protection" }
  ])),
  getSitesByTenant: vi.fn(() => Promise.resolve([
    { id: "site-1", name: "Substation A" },
    { id: "site-2", name: "Substation B" }
  ])),
  createTransmissionAsset: vi.fn(() => Promise.resolve({
    id: "asset-1",
    tenantId: "tenant-1",
    siteId: "site-1",
    assetTypeId: "type-1",
    assetTypeCode: "TRANSFORMER",
    assetTypeName: "Transformer",
    name: "Test Asset",
    status: "online",
    criticality: "medium",
    parentAssetId: null,
    properties: {}
  }))
};

vi.mock("@/hooks/useDataProvider", () => ({
  useDataProvider: () => ({ provider: mockProvider })
}));

function renderWithProviders(component: React.ReactElement) {
  return render(
    <BrowserRouter>
      <AppProvider>
        {component}
      </AppProvider>
    </BrowserRouter>
  );
}

describe("ManualAssetCapturePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the manual asset capture form", async () => {
    renderWithProviders(<ManualAssetCapturePage />);
    
    await waitFor(() => {
      expect(screen.getByText("Manual Asset Capture")).toBeInTheDocument();
    });
    
    expect(screen.getByText("Create a new transmission asset manually")).toBeInTheDocument();
  });

  it("displays required field labels with asterisks", async () => {
    renderWithProviders(<ManualAssetCapturePage />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Asset Name/)).toBeInTheDocument();
    });
    
    // Check for required fields
    expect(screen.getByText(/Asset Name/)).toBeInTheDocument();
    expect(screen.getByText(/Asset Type/)).toBeInTheDocument();
    expect(screen.getByText(/Site/)).toBeInTheDocument();
  });

  it("loads asset types and sites on mount", async () => {
    renderWithProviders(<ManualAssetCapturePage />);
    
    await waitFor(() => {
      expect(mockProvider.getDefaultTransmissionTenantId).toHaveBeenCalled();
    });
    
    expect(mockProvider.getAssetTypesByTenant).toHaveBeenCalledWith("tenant-1");
    expect(mockProvider.getSitesByTenant).toHaveBeenCalledWith("tenant-1");
  });

  it("displays optional fields", async () => {
    renderWithProviders(<ManualAssetCapturePage />);
    
    await waitFor(() => {
      expect(screen.getByText("Status")).toBeInTheDocument();
    });
    
    expect(screen.getByText("Criticality")).toBeInTheDocument();
    expect(screen.getByText(/Custom Properties/)).toBeInTheDocument();
  });

  it("shows Create Asset and Reset buttons", async () => {
    renderWithProviders(<ManualAssetCapturePage />);
    
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create Asset/i })).toBeInTheDocument();
    });
    
    expect(screen.getByRole("button", { name: /Reset/i })).toBeInTheDocument();
  });
});
