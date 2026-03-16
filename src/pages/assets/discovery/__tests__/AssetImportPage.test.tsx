import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { AssetImportPage } from "../AssetImportPage";

// Mock the data provider
vi.mock("@/hooks/useDataProvider", () => ({
  useDataProvider: () => ({
    provider: {
      getDefaultTransmissionTenantId: vi.fn().mockResolvedValue("tenant-123"),
      getAssetImportsByTenant: vi.fn().mockResolvedValue({
        data: [
          {
            id: "import-1",
            tenantId: "tenant-123",
            name: "Q1 2024 Asset Import",
            status: "completed",
            sourceType: "csv",
            recordCount: 100,
            importedCount: 95,
            errors: [
              { row: 5, field: "name", message: "Name is required" },
              { row: 12, field: "assetTypeCode", message: "Invalid asset type code" }
            ],
            createdAt: "2024-01-15T10:00:00Z",
            completedAt: "2024-01-15T10:05:00Z"
          },
          {
            id: "import-2",
            tenantId: "tenant-123",
            name: "Q2 2024 Asset Import",
            status: "failed",
            sourceType: "excel",
            recordCount: 50,
            importedCount: 0,
            errors: [
              { row: 1, field: "file", message: "Failed to parse file" }
            ],
            createdAt: "2024-02-01T14:00:00Z"
          }
        ],
        total: 2
      }),
      createAssetImport: vi.fn().mockResolvedValue({
        id: "import-3",
        tenantId: "tenant-123",
        name: "New Import",
        status: "completed",
        sourceType: "csv",
        recordCount: 10,
        importedCount: 10,
        errors: [],
        createdAt: new Date().toISOString()
      })
    }
  })
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

describe("AssetImportPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the asset import page with list and work panes", async () => {
    renderWithProviders(<AssetImportPage />);
    
    await waitFor(() => {
      expect(screen.getByText("Asset Imports")).toBeInTheDocument();
    });
  });

  it("displays import records in the list", async () => {
    renderWithProviders(<AssetImportPage />);
    
    await waitFor(() => {
      expect(screen.getByText("Q1 2024 Asset Import")).toBeInTheDocument();
      expect(screen.getByText("Q2 2024 Asset Import")).toBeInTheDocument();
    });
  });

  it("shows status badges for each import", async () => {
    renderWithProviders(<AssetImportPage />);
    
    await waitFor(() => {
      expect(screen.getByText("completed")).toBeInTheDocument();
      expect(screen.getByText("failed")).toBeInTheDocument();
    });
  });

  it("displays import summary with record counts", async () => {
    renderWithProviders(<AssetImportPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/95\/100 imported/)).toBeInTheDocument();
      expect(screen.getByText(/0\/50 imported/)).toBeInTheDocument();
    });
  });

  it("shows New Import button", async () => {
    renderWithProviders(<AssetImportPage />);
    
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /New Import/i })).toBeInTheDocument();
    });
  });

  it("displays empty state when no import is selected", async () => {
    renderWithProviders(<AssetImportPage />);
    
    await waitFor(() => {
      expect(screen.getByText("No import selected")).toBeInTheDocument();
      expect(screen.getByText("Select an import from the list to view details")).toBeInTheDocument();
    });
  });
});
