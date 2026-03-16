import { Zap, Flame, Droplets, Activity, Cloud } from "lucide-react";

/**
 * Centralized energy type iconography for consistent UI design
 * Following Plant4.0 design system requirements:
 * - Bolt (Zap) for electricity - yellow-500
 * - Flame for gas - orange-500  
 * - Droplet (Droplets) for diesel - blue-500
 * - Cloud for steam - gray-500
 */

export type EnergyType = 'electricity' | 'gas' | 'diesel' | 'steam';

export interface EnergyIconProps {
  className?: string;
  size?: number;
}

/**
 * Get the appropriate icon component for an energy type
 */
export function getEnergyTypeIcon(energyType: string, props?: EnergyIconProps) {
  const { className = "w-4 h-4", size } = props || {};
  const iconProps = {
    className: size ? `w-${size} h-${size}` : className,
  };

  switch (energyType.toLowerCase()) {
    case 'electricity':
      return <Zap {...iconProps} className={`${iconProps.className} text-yellow-500`} />;
    case 'gas':
      return <Flame {...iconProps} className={`${iconProps.className} text-orange-500`} />;
    case 'diesel':
      return <Droplets {...iconProps} className={`${iconProps.className} text-blue-500`} />;
    case 'steam':
      return <Cloud {...iconProps} className={`${iconProps.className} text-gray-500`} />;
    default:
      return <Activity {...iconProps} className={`${iconProps.className} text-gray-500`} />;
  }
}

/**
 * Get the color value for an energy type (for charts and visualizations)
 */
export function getEnergyTypeColor(energyType: string): string {
  switch (energyType.toLowerCase()) {
    case 'electricity':
      return '#eab308'; // yellow-500
    case 'gas':
      return '#f97316'; // orange-500
    case 'diesel':
      return '#3b82f6'; // blue-500
    default:
      return '#6b7280'; // gray-500
  }
}

/**
 * Get all energy type configurations for consistent theming
 */
export const energyTypeConfig = {
  electricity: {
    icon: Zap,
    color: '#eab308',
    textColor: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    label: 'Electricity',
    unit: 'kWh'
  },
  gas: {
    icon: Flame,
    color: '#f97316', 
    textColor: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    label: 'Gas',
    unit: 'MMBtu'
  },
  diesel: {
    icon: Droplets,
    color: '#3b82f6',
    textColor: 'text-blue-500', 
    bgColor: 'bg-blue-500/10',
    label: 'Diesel',
    unit: 'Litres'
  },
  steam: {
    icon: Cloud,
    color: '#6b7280',
    textColor: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    label: 'Steam',
    unit: 'lbs'
  }
} as const;