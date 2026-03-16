import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { BulkDiscoveryPage } from "../BulkDiscoveryPage";

// Mock the upstream mock data
vi.mock("@/data/upstreamMockData", () => ({
  upstreamDiscoveryJobs: [
    {
      id: "job-1",
      name: "Test Discovery Job",
      tenantId: "alpha-upstream", // Use the correct tenant ID
      type: "network",
      scope: { ipRange: "192.168.1.100-150" },
      status: "completed",
      foundCount: 5,
      lastRunAt: "2024-01-15T08:30:00Z",
      description: "Test job description"
    }
  ]
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

describe("BulkDiscoveryPage", () => {
  it("renders discovery jobs list", () => {
    renderWithProviders(<BulkDiscoveryPage />);
    
    expect(screen.getByText("Discovery Jobs")).toBeInTheDocument();
    expect(screen.getAllByText("Test Discovery Job")).toHaveLength(2); // Appears in list and table
  });

  it("displays job type and status", () => {
    renderWithProviders(<BulkDiscoveryPage />);
    
    expect(screen.getAllByText("Network Scan")).toHaveLength(2); // Appears in badge and table
    expect(screen.getAllByText("Completed")).toHaveLength(2); // Appears in status badge and table
  });

  it("shows found count", () => {
    renderWithProviders(<BulkDiscoveryPage />);
    
    expect(screen.getByText("5 found")).toBeInTheDocument();
  });
});