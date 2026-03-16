import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { DiscoveryAgentsPage } from "../DiscoveryAgentsPage";
import type { DiscoveryAgent } from "@/types/transmission";

// Mock discovery agents data
const mockAgents: DiscoveryAgent[] = [
  {
    id: "agent-1",
    tenantId: "tenant-1",
    name: "IED Gateway 01",
    type: "ied_gateway",
    protocols: ["IEC61850", "DNP3"],
    status: "active",
    assignedScopes: [{ ipRange: "10.20.30.0/24" }],
    lastRun: "2024-01-15T10:00:00Z",
    description: "Primary IED gateway for substation equipment",
    createdAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "agent-2",
    tenantId: "tenant-1",
    name: "SCADA Bridge 01",
    type: "scada_bridge",
    protocols: ["DNP3", "Modbus-TCP"],
    status: "active",
    assignedScopes: [{ nodeIds: ["node-1", "node-2"] }],
    lastRun: "2024-01-15T08:00:00Z",
    description: "SCADA system integration bridge",
    createdAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "agent-3",
    tenantId: "tenant-1",
    name: "RTU Collector 01",
    type: "rtu_collector",
    protocols: ["DNP3", "IEC61850", "OPC-UA"],
    status: "inactive",
    assignedScopes: [],
    description: "Remote terminal unit data collector",
    createdAt: "2024-01-01T00:00:00Z"
  }
];

// Mock the useDataProvider hook
vi.mock("@/hooks/useDataProvider", () => ({
  useDataProvider: () => ({
    provider: {
      getDefaultTransmissionTenantId: vi.fn().mockResolvedValue("tenant-1"),
      getDiscoveryAgentsByTenant: vi.fn().mockResolvedValue(mockAgents),
      createDiscoveryAgent: vi.fn().mockImplementation((data) =>
        Promise.resolve({
          id: "new-agent",
          ...data,
          createdAt: new Date().toISOString()
        })
      )
    },
    backend: "supabase" as const,
    isMock: false,
    isSupabase: true
  })
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("DiscoveryAgentsPage", () => {
  it("renders discovery agents page with seeded data", async () => {
    renderWithRouter(<DiscoveryAgentsPage />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading discovery agents/i)).not.toBeInTheDocument();
    });

    // Check that agents are displayed
    expect(screen.getByText("IED Gateway 01")).toBeInTheDocument();
    expect(screen.getByText("SCADA Bridge 01")).toBeInTheDocument();
    expect(screen.getByText("RTU Collector 01")).toBeInTheDocument();
  });

  it("displays agent count in subtitle", async () => {
    renderWithRouter(<DiscoveryAgentsPage />);

    await waitFor(() => {
      expect(screen.getByText(/3 agents/i)).toBeInTheDocument();
    });
  });

  it("displays agent types and protocols", async () => {
    renderWithRouter(<DiscoveryAgentsPage />);

    await waitFor(() => {
      expect(screen.getByText("IED Gateway 01")).toBeInTheDocument();
    });

    // Check that agent types are displayed
    expect(screen.getAllByText(/ied gateway/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/scada bridge/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/rtu collector/i).length).toBeGreaterThan(0);
  });

  it("displays agent status badges", async () => {
    renderWithRouter(<DiscoveryAgentsPage />);

    await waitFor(() => {
      expect(screen.getByText("IED Gateway 01")).toBeInTheDocument();
    });

    // Check that status badges are displayed
    const activeBadges = screen.getAllByText("active");
    expect(activeBadges.length).toBeGreaterThan(0);
    
    const inactiveBadges = screen.getAllByText("inactive");
    expect(inactiveBadges.length).toBeGreaterThan(0);
  });
});

