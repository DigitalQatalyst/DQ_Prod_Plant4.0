import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { IncidentList } from "../IncidentList";
import { Incident, Alert } from "@/types/alert";

describe("IncidentList", () => {
  const mockIncidents: Incident[] = [
    {
      id: "incident-001",
      featureArea: "assets",
      title: "Incident 1",
      status: "open",
      severity: "critical",
      relatedAlertIds: ["alert-001"],
      tenantId: "t1",
      createdAt: "2024-01-15T14:30:00Z",
      updatedAt: "2024-01-15T14:30:00Z"
    },
    {
      id: "incident-002",
      featureArea: "security",
      title: "Incident 2",
      status: "acknowledged",
      severity: "warning",
      relatedAlertIds: ["alert-002", "alert-003"],
      tenantId: "t1",
      createdAt: "2024-01-15T13:00:00Z",
      updatedAt: "2024-01-15T13:30:00Z"
    }
  ];

  const mockAlerts: Alert[] = [
    {
      id: "alert-001",
      featureArea: "assets",
      severity: "critical",
      status: "open",
      tenantId: "t1",
      title: "Alert 1",
      summary: "Test alert 1",
      createdAt: "2024-01-15T14:30:00Z",
      updatedAt: "2024-01-15T14:30:00Z"
    },
    {
      id: "alert-002",
      featureArea: "security",
      severity: "warning",
      status: "acknowledged",
      tenantId: "t1",
      title: "Alert 2",
      summary: "Test alert 2",
      createdAt: "2024-01-15T13:00:00Z",
      updatedAt: "2024-01-15T13:00:00Z"
    },
    {
      id: "alert-003",
      featureArea: "security",
      severity: "warning",
      status: "acknowledged",
      tenantId: "t1",
      title: "Alert 3",
      summary: "Test alert 3",
      createdAt: "2024-01-15T13:15:00Z",
      updatedAt: "2024-01-15T13:15:00Z"
    }
  ];

  const mockOnStatusChange = vi.fn();

  it("renders all incidents", () => {
    render(
      <IncidentList
        incidents={mockIncidents}
        alerts={mockAlerts}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText("Incident 1")).toBeInTheDocument();
    expect(screen.getByText("Incident 2")).toBeInTheDocument();
    expect(screen.getByText("Showing 2 incidents")).toBeInTheDocument();
  });

  it("displays empty state when no incidents", () => {
    render(
      <IncidentList
        incidents={[]}
        alerts={mockAlerts}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText("No incidents found")).toBeInTheDocument();
    expect(screen.getByText("There are no incidents to display.")).toBeInTheDocument();
  });

  it("correctly maps related alerts to incidents", () => {
    render(
      <IncidentList
        incidents={mockIncidents}
        alerts={mockAlerts}
        onStatusChange={mockOnStatusChange}
      />
    );

    // First incident has 1 alert
    expect(screen.getByText("1 Alert")).toBeInTheDocument();
    
    // Second incident has 2 alerts
    expect(screen.getByText("2 Alerts")).toBeInTheDocument();
  });

  it("handles incidents with missing alerts gracefully", () => {
    const incidentsWithMissingAlerts: Incident[] = [
      {
        ...mockIncidents[0],
        relatedAlertIds: ["alert-999"] // Non-existent alert
      }
    ];

    render(
      <IncidentList
        incidents={incidentsWithMissingAlerts}
        alerts={mockAlerts}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText("Incident 1")).toBeInTheDocument();
    expect(screen.getByText("0 Alerts")).toBeInTheDocument();
  });

  it("displays correct count for single incident", () => {
    render(
      <IncidentList
        incidents={[mockIncidents[0]]}
        alerts={mockAlerts}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText("Showing 1 incident")).toBeInTheDocument();
  });
});
