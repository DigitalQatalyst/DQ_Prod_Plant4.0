import { WorkPane } from "@/components/layout/WorkPane";
import { AlertView } from "@/components/alerts/AlertView";
import { useApp } from "@/context/AppContext";

/**
 * EnergyAlerts Page
 * Displays alerts specific to the energy feature area
 * Extended with transmission topology context for Power/Transmission sector
 * 
 * Requirements: 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 9.1, 9.2, 14.2
 */
export function EnergyAlerts() {
  const { sector, subsector } = useApp();
  const isTransmission = sector === 'power' && subsector === 'transmission';

  const tabs = [
    {
      id: "alerts",
      label: "Alerts",
      content: (
        <AlertView 
          featureArea="energy" 
          isTransmission={isTransmission}
        />
      ),
    },
  ];

  const subtitle = isTransmission 
    ? "Monitor and respond to transmission grid alerts and power quality events"
    : "Monitor and respond to energy-related alerts and incidents";

  return (
    <WorkPane
      title="Energy Alerts"
      subtitle={subtitle}
      tabs={tabs}
    />
  );
}
