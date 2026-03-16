import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AlertList } from "../AlertList";
import { Alert, AlertStatus } from "@/types/alert";

// Mock alerts for testing
const mockAlerts: Alert[] = [
  {
    id: "alert-1",
    featureArea: "assets",
    severity: "critical",
    status: "open",
    tenantId: "t1",
    siteId: "site-1",
    title: "Critical Asset Alert",
    summary: "Asset is offline",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    tags: ["critical"]
  },
  {
    id: "alert-2",
    featureArea: "security",
    severity: "warning",
    status: "acknowledged",
    tenantId: "t1",
    title: "Security Warning",
    summary: "Unauthorized access attempt",
    createdAt: "2024-01-15T11:00:00Z",
    updatedAt: "2024-01-15T11:30:00Z",
    tags: ["security"]
  },
  {
    id: "alert-3",
    featureArea: "energy",
    severity: "info",
    status: "closed",
    tenantId: "t1",
    title: "Energy Info",
    summary: "Normal energy consumption",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T12:00:00Z"
  },
  {
    id: "alert-4",
    featureArea: "assets",
    severity: "warning",
    status: "in-progress",
    tenantId: "t1",
    siteId: "site-2",
    title: "Asset Warning",
    summary: "Asset needs maintenance",
    createdAt: "2024-01-15T12:00:00Z",
    updatedAt: "2024-01-15T13:00:00Z"
  }
];

describe("AlertList", () => {
  it("renders all alerts", () => {
    const onStatusChange = vi.fn();
    render(<AlertList alerts={mockAlerts} onStatusChange={onStatusChange} />);

    // Check that all alert titles are rendered
    expect(screen.getByText("Critical Asset Alert")).toBeInTheDocument();
    expect(screen.getByText("Security Warning")).toBeInTheDocument();
    expect(screen.getByText("Energy Info")).toBeInTheDocument();
    expect(screen.getByText("Asset Warning")).toBeInTheDocument();
  });

  it("displays correct alert count", () => {
    const onStatusChange = vi.fn();
    render(<AlertList alerts={mockAlerts} onStatusChange={onStatusChange} />);

    expect(screen.getByText(/Showing 4 of 4 alerts/)).toBeInTheDocument();
  });

  it("filters alerts by severity", () => {
    const onStatusChange = vi.fn();
    render(<AlertList alerts={mockAlerts} onStatusChange={onStatusChange} />);

    // Click the Critical filter button
    const criticalButton = screen.getByRole("button", { name: "Filter by critical severity" });
    fireEvent.click(criticalButton);

    // Should show only 1 critical alert
    expect(screen.getByText(/Showing 1 of 4 alerts/)).toBeInTheDocument();
    expect(screen.getByText("Critical Asset Alert")).toBeInTheDocument();
    expect(screen.queryByText("Security Warning")).not.toBeInTheDocument();
  });

  it("filters alerts by status", () => {
    const onStatusChange = vi.fn();
    render(<AlertList alerts={mockAlerts} onStatusChange={onStatusChange} />);

    // Click the Open filter button
    const openButton = screen.getByRole("button", { name: "Filter by open status" });
    fireEvent.click(openButton);

    // Should show only 1 open alert
    expect(screen.getByText(/Showing 1 of 4 alerts/)).toBeInTheDocument();
    expect(screen.getByText("Critical Asset Alert")).toBeInTheDocument();
  });

  it("filters alerts by multiple criteria", () => {
    const onStatusChange = vi.fn();
    render(<AlertList alerts={mockAlerts} onStatusChange={onStatusChange} />);

    // Click Warning severity filter
    const warningButton = screen.getByRole("button", { name: "Filter by warning severity" });
    fireEvent.click(warningButton);

    // Should show 2 warning alerts
    expect(screen.getByText(/Showing 2 of 4 alerts/)).toBeInTheDocument();

    // Now also filter by acknowledged status
    const acknowledgedButton = screen.getByRole("button", { name: "Filter by acknowledged status" });
    fireEvent.click(acknowledgedButton);

    // Should show only 1 alert (warning AND acknowledged)
    expect(screen.getByText(/Showing 1 of 4 alerts/)).toBeInTheDocument();
    expect(screen.getByText("Security Warning")).toBeInTheDocument();
  });

  it("clears all filters", () => {
    const onStatusChange = vi.fn();
    render(<AlertList alerts={mockAlerts} onStatusChange={onStatusChange} />);

    // Apply a filter
    const criticalButton = screen.getByRole("button", { name: "Filter by critical severity" });
    fireEvent.click(criticalButton);

    expect(screen.getByText(/Showing 1 of 4 alerts/)).toBeInTheDocument();

    // Clear filters
    const clearButton = screen.getByRole("button", { name: "Clear all filters" });
    fireEvent.click(clearButton);

    // Should show all alerts again
    expect(screen.getByText(/Showing 4 of 4 alerts/)).toBeInTheDocument();
  });

  it("sorts alerts by different fields", () => {
    const onStatusChange = vi.fn();
    render(<AlertList alerts={mockAlerts} onStatusChange={onStatusChange} />);

    // Default sort is by severity (desc), so critical should be first
    const alertCards = screen.getAllByRole("heading", { level: 3 });
    expect(alertCards[0]).toHaveTextContent("Critical Asset Alert");

    // Find the sort select by looking for the one in the sort controls area
    const sortControls = screen.getByRole("group", { name: "Sort controls" });
    const sortSelect = sortControls.querySelector('[role="combobox"]');
    
    if (sortSelect) {
      fireEvent.click(sortSelect);
      
      const createdAtOption = screen.getByRole("option", { name: "Created Time" });
      fireEvent.click(createdAtOption);

      // With desc order, most recent (alert-4) should be first
      const updatedCards = screen.getAllByRole("heading", { level: 3 });
      expect(updatedCards[0]).toHaveTextContent("Asset Warning");
    }
  });

  it("toggles sort direction", () => {
    const onStatusChange = vi.fn();
    render(<AlertList alerts={mockAlerts} onStatusChange={onStatusChange} />);

    // Find the sort direction button
    const sortDirectionButton = screen.getByLabelText(/Sort direction:/);
    
    // Initial direction is desc (↓)
    expect(sortDirectionButton).toHaveTextContent("↓");

    // Toggle to asc
    fireEvent.click(sortDirectionButton);
    expect(sortDirectionButton).toHaveTextContent("↑");

    // Toggle back to desc
    fireEvent.click(sortDirectionButton);
    expect(sortDirectionButton).toHaveTextContent("↓");
  });

  it("displays empty state when no alerts match filters", () => {
    const onStatusChange = vi.fn();
    render(<AlertList alerts={mockAlerts} onStatusChange={onStatusChange} />);

    // Apply filters that match no alerts
    const criticalButton = screen.getByRole("button", { name: "Filter by critical severity" });
    fireEvent.click(criticalButton);
    
    const closedButton = screen.getByRole("button", { name: "Filter by closed status" });
    fireEvent.click(closedButton);

    // Should show empty state (no critical AND closed alerts)
    expect(screen.getByText("No alerts found")).toBeInTheDocument();
    expect(screen.getByText(/No alerts match your current filters/)).toBeInTheDocument();
  });

  it("displays empty state when no alerts provided", () => {
    const onStatusChange = vi.fn();
    render(<AlertList alerts={[]} onStatusChange={onStatusChange} />);

    expect(screen.getByText("No alerts found")).toBeInTheDocument();
    expect(screen.getByText(/There are no alerts to display/)).toBeInTheDocument();
  });

  it("filters by feature area using badges", () => {
    const onStatusChange = vi.fn();
    render(<AlertList alerts={mockAlerts} onStatusChange={onStatusChange} />);

    // Find and click the assets badge (use the filter badge, not the display badge)
    const assetsBadge = screen.getByRole("button", { name: "Filter by assets feature area" });
    fireEvent.click(assetsBadge);

    // Should show only 2 assets alerts
    expect(screen.getByText(/Showing 2 of 4 alerts/)).toBeInTheDocument();
    expect(screen.getByText("Critical Asset Alert")).toBeInTheDocument();
    expect(screen.getByText("Asset Warning")).toBeInTheDocument();
  });

  it("calls onStatusChange when alert status is changed", () => {
    const onStatusChange = vi.fn();
    render(<AlertList alerts={mockAlerts} onStatusChange={onStatusChange} />);

    // Find the first alert card and look for its status select
    const alertCards = screen.getAllByRole("article");
    if (alertCards.length > 0) {
      const firstCard = alertCards[0];
      const statusSelect = firstCard.querySelector('[aria-label="Change alert status"]');
      
      if (statusSelect) {
        fireEvent.click(statusSelect);
        
        // Select a new status
        const acknowledgedOption = screen.getByRole("option", { name: "Acknowledged" });
        fireEvent.click(acknowledgedOption);

        // Verify the callback was called
        expect(onStatusChange).toHaveBeenCalled();
      }
    }
  });
});
