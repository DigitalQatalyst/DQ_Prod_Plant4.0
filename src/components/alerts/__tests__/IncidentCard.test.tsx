import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IncidentCard } from "../IncidentCard";
import { Incident, Alert } from "@/types/alert";

describe("IncidentCard", () => {
  const mockIncident: Incident = {
    id: "incident-001",
    featureArea: "assets",
    title: "Test Incident",
    status: "open",
    severity: "critical",
    relatedAlertIds: ["alert-001", "alert-002"],
    tenantId: "t1",
    siteId: "site-test",
    createdAt: "2024-01-15T14:30:00Z",
    updatedAt: "2024-01-15T14:30:00Z",
    ownerUserId: "user-123"
  };

  const mockAlerts: Alert[] = [
    {
      id: "alert-001",
      featureArea: "assets",
      severity: "critical",
      status: "open",
      tenantId: "t1",
      siteId: "site-test",
      title: "Alert 1",
      summary: "Test alert 1",
      createdAt: "2024-01-15T14:30:00Z",
      updatedAt: "2024-01-15T14:30:00Z"
    },
    {
      id: "alert-002",
      featureArea: "assets",
      severity: "warning",
      status: "acknowledged",
      tenantId: "t1",
      siteId: "site-test",
      title: "Alert 2",
      summary: "Test alert 2",
      createdAt: "2024-01-15T14:30:00Z",
      updatedAt: "2024-01-15T14:30:00Z"
    }
  ];

  const mockOnStatusChange = vi.fn();

  it("renders incident title and metadata", () => {
    render(
      <IncidentCard
        incident={mockIncident}
        relatedAlerts={mockAlerts}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText("Test Incident")).toBeInTheDocument();
    expect(screen.getByText("Critical")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("assets")).toBeInTheDocument();
  });

  it("displays related alert count", () => {
    render(
      <IncidentCard
        incident={mockIncident}
        relatedAlerts={mockAlerts}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText("2 Alerts")).toBeInTheDocument();
  });

  it("expands and collapses to show related alerts", () => {
    render(
      <IncidentCard
        incident={mockIncident}
        relatedAlerts={mockAlerts}
        onStatusChange={mockOnStatusChange}
      />
    );

    // Initially collapsed - related alerts not visible
    expect(screen.queryByText("Alert 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Alert 2")).not.toBeInTheDocument();

    // Click to expand
    const expandButton = screen.getByLabelText("Expand incident details");
    fireEvent.click(expandButton);

    // Now related alerts should be visible
    expect(screen.getByText("Alert 1")).toBeInTheDocument();
    expect(screen.getByText("Alert 2")).toBeInTheDocument();
    expect(screen.getByText("Related Alerts (2)")).toBeInTheDocument();

    // Click to collapse
    const collapseButton = screen.getByLabelText("Collapse incident details");
    fireEvent.click(collapseButton);

    // Related alerts should be hidden again
    expect(screen.queryByText("Alert 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Alert 2")).not.toBeInTheDocument();
  });

  it("detects and indicates cross-domain incidents", () => {
    const crossDomainAlerts: Alert[] = [
      {
        ...mockAlerts[0],
        featureArea: "assets"
      },
      {
        ...mockAlerts[1],
        featureArea: "security"
      }
    ];

    render(
      <IncidentCard
        incident={mockIncident}
        relatedAlerts={crossDomainAlerts}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText("Cross-Domain")).toBeInTheDocument();
  });

  it("does not show cross-domain badge for single feature area", () => {
    render(
      <IncidentCard
        incident={mockIncident}
        relatedAlerts={mockAlerts}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.queryByText("Cross-Domain")).not.toBeInTheDocument();
  });

  it("handles empty related alerts", () => {
    render(
      <IncidentCard
        incident={mockIncident}
        relatedAlerts={[]}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText("0 Alerts")).toBeInTheDocument();

    // Expand to see empty state
    const expandButton = screen.getByLabelText("Expand incident details");
    fireEvent.click(expandButton);

    expect(screen.getByText("No related alerts found for this incident.")).toBeInTheDocument();
  });

  it("renders related alerts in compact mode", () => {
    render(
      <IncidentCard
        incident={mockIncident}
        relatedAlerts={mockAlerts}
        onStatusChange={mockOnStatusChange}
      />
    );

    // Expand to show alerts
    const expandButton = screen.getByLabelText("Expand incident details");
    fireEvent.click(expandButton);

    // Check that alerts are rendered (they should be in compact mode)
    expect(screen.getByText("Alert 1")).toBeInTheDocument();
    expect(screen.getByText("Alert 2")).toBeInTheDocument();
  });
});
