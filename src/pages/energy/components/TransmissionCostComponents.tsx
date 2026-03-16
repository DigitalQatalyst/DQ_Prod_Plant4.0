/**
 * Transmission-specific cost analysis components
 * These components extend the cost analysis page with transmission tariff features
 */

import { KPICard } from "@/components/shared/KPICard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Zap,
  Activity,
  AlertTriangle,
  TrendingDown,
  Target,
  Calendar,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

// Helper component for displaying label-value pairs
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

// Transmission tariff interface (matches database schema)
export interface TransmissionTariff {
  id: string;
  org_id: string;
  tariff_code: string;
  tariff_name: string;
  description?: string;
  tariff_type: 'transmission' | 'distribution' | 'generation' | 'ancillary_services' | 'combined';
  rate_structure: 'flat' | 'time_of_use' | 'demand_charge' | 'tiered' | 'real_time_pricing' | 'combined';
  utility_name?: string;
  utility_account_number?: string;
  service_territory?: string;
  applies_to_scope: 'org' | 'substation' | 'feeder' | 'meter';
  scope_id?: string;
  voltage_level_kv?: number;
  energy_rate_per_kwh?: number;
  demand_rate_per_kw?: number;
  fixed_charge_per_month?: number;
  tou_rates?: Record<string, any>;
  demand_window_minutes?: number;
  demand_ratchet_enabled: boolean;
  demand_ratchet_percentage?: number;
  demand_ratchet_months?: number;
  seasonal_rates_enabled: boolean;
  seasonal_rates?: Record<string, any>;
  effective_date: string;
  expiry_date?: string;
  active: boolean;
  default_tariff: boolean;
  additional_charges?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface CostCenter {
  id: string;
  name: string;
  scope: string;
  totalDailyCost: number;
  energyBreakdown: {
    electricity: { cost: number; consumption: number; unit: string };
    gas: { cost: number; consumption: number; unit: string };
    diesel: { cost: number; consumption: number; unit: string };
  };
  linkedMeters: string[];
  status: "Normal" | "High" | "Critical";
  substationId?: string;
  substationName?: string;
  feederId?: string;
  feederName?: string;
  demandCharge?: number;
  energyCharge?: number;
  fixedCharge?: number;
}

// Cost optimization recommendation
export interface CostOptimizationRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'demand_management' | 'tariff_optimization' | 'load_shifting' | 'efficiency_improvement';
  estimatedSavingsPerMonth: number;
  implementationComplexity: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
}

interface TransmissionTariffDetailsProps {
  costCenter: CostCenter;
  tariffs: TransmissionTariff[];
}

export function TransmissionTariffDetails({ costCenter, tariffs }: TransmissionTariffDetailsProps) {
  const activeTariff = tariffs.find(t => t.default_tariff) || tariffs[0];
  
  if (!activeTariff) return null;
  
  return (
    <div className="space-y-6">
      {/* Tariff Information */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Active Tariff Structure</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <InfoRow label="Tariff Code" value={activeTariff.tariff_code} />
            <InfoRow label="Tariff Name" value={activeTariff.tariff_name} />
            <InfoRow label="Tariff Type" value={activeTariff.tariff_type} />
            <InfoRow label="Rate Structure" value={activeTariff.rate_structure} />
            {activeTariff.utility_name && (
              <InfoRow label="Utility" value={activeTariff.utility_name} />
            )}
          </div>
          <div className="space-y-3">
            <InfoRow label="Energy Rate" value={`$${(activeTariff.energy_rate_per_kwh || 0).toFixed(4)}/kWh`} />
            <InfoRow label="Demand Rate" value={`$${(activeTariff.demand_rate_per_kw || 0).toFixed(2)}/kW`} />
            <InfoRow label="Fixed Charge" value={`$${(activeTariff.fixed_charge_per_month || 0).toFixed(2)}/month`} />
            {activeTariff.demand_window_minutes && (
              <InfoRow label="Demand Window" value={`${activeTariff.demand_window_minutes} minutes`} />
            )}
            {activeTariff.voltage_level_kv && (
              <InfoRow label="Voltage Level" value={`${activeTariff.voltage_level_kv} kV`} />
            )}
          </div>
        </div>
      </div>

      {/* Cost Breakdown for this Cost Center */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Energy Charge</p>
                <p className="text-xs text-muted-foreground">Consumption-based</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">${(costCenter.energyCharge || 0).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                {((costCenter.energyCharge || 0) / costCenter.totalDailyCost * 100).toFixed(1)}% of total
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-warning" />
              <div>
                <p className="text-sm font-medium">Demand Charge</p>
                <p className="text-xs text-muted-foreground">Peak demand-based</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">${(costCenter.demandCharge || 0).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                {((costCenter.demandCharge || 0) / costCenter.totalDailyCost * 100).toFixed(1)}% of total
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Fixed Charge</p>
                <p className="text-xs text-muted-foreground">Monthly subscription</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">${(costCenter.fixedCharge || 0).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                {((costCenter.fixedCharge || 0) / costCenter.totalDailyCost * 100).toFixed(1)}% of total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Demand Ratchet Information */}
      {activeTariff.demand_ratchet_enabled && (
        <div className="bg-card border border-warning/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Demand Ratchet Active
          </h3>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This tariff includes a demand ratchet clause that maintains minimum demand charges based on historical peak demand.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Ratchet Percentage" value={`${activeTariff.demand_ratchet_percentage || 0}%`} />
              <InfoRow label="Ratchet Period" value={`${activeTariff.demand_ratchet_months || 0} months`} />
            </div>
            <div className="p-3 bg-warning/10 rounded-lg">
              <p className="text-xs text-muted-foreground">
                Minimum demand charge will be {activeTariff.demand_ratchet_percentage}% of the highest peak demand 
                recorded in the last {activeTariff.demand_ratchet_months} months.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Time-of-Use Rates */}
      {activeTariff.rate_structure === 'time_of_use' && activeTariff.tou_rates && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Time-of-Use Rate Schedule</h3>
          <div className="space-y-3">
            {Object.entries(activeTariff.tou_rates).map(([period, details]: [string, any]) => (
              <div key={period} className="p-4 bg-secondary/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium capitalize">{period.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <Badge variant={period.toLowerCase().includes('peak') ? 'destructive' : 'default'}>
                    ${details.rate?.toFixed(4)}/kWh
                  </Badge>
                </div>
                {details.hours && (
                  <p className="text-xs text-muted-foreground">Hours: {details.hours}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface TransmissionTariffStructureProps {
  tariffs: TransmissionTariff[];
  data: any;
}

export function TransmissionTariffStructure({ tariffs, data }: TransmissionTariffStructureProps) {
  const activeTariffs = tariffs.filter(t => t.active);
  const defaultTariff = tariffs.find(t => t.default_tariff);

  // Mock cost optimization recommendations
  const recommendations: CostOptimizationRecommendation[] = [
    {
      id: 'rec-1',
      title: 'Reduce Peak Demand During High-Cost Periods',
      description: 'Shift non-critical loads to off-peak hours to reduce demand charges by up to 25%',
      category: 'demand_management',
      estimatedSavingsPerMonth: 3200,
      implementationComplexity: 'medium',
      priority: 'high',
    },
    {
      id: 'rec-2',
      title: 'Optimize Transformer Loading',
      description: 'Balance loads across transformers to improve efficiency and reduce losses',
      category: 'efficiency_improvement',
      estimatedSavingsPerMonth: 1800,
      implementationComplexity: 'low',
      priority: 'medium',
    },
    {
      id: 'rec-3',
      title: 'Consider Time-of-Use Tariff',
      description: 'Switch to TOU tariff structure to take advantage of lower off-peak rates',
      category: 'tariff_optimization',
      estimatedSavingsPerMonth: 4500,
      implementationComplexity: 'high',
      priority: 'high',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tariff Overview KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Energy Cost"
          value={`$${data.totalEnergyCharge.toFixed(2)}`}
          subtitle="Consumption-based charges"
          icon={Zap}
          variant="primary"
        />
        <KPICard
          title="Total Demand Cost"
          value={`$${data.totalDemandCharge.toFixed(2)}`}
          subtitle="Peak demand charges"
          icon={Activity}
          variant="warning"
        />
        <KPICard
          title="Total Fixed Cost"
          value={`$${data.totalFixedCharge.toFixed(2)}`}
          subtitle="Fixed monthly charges"
          icon={DollarSign}
          variant="default"
        />
        <KPICard
          title="Active Tariffs"
          value={activeTariffs.length.toString()}
          subtitle="Configured tariff structures"
          icon={Target}
          variant="default"
        />
      </div>

      {/* Tariff Breakdown Pie Chart */}
      {data.tariffBreakdownData.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Cost Distribution by Tariff Component</h3>
          <div className="h-80 flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.tariffBreakdownData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  >
                    {data.tariffBreakdownData.map((entry: any, index: number) => {
                      const colors = ['#3b82f6', '#f59e0b', '#6b7280'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`$${value.toFixed(2)}`, 'Daily Cost']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 pl-6">
              <div className="space-y-4">
                {data.tariffBreakdownData.map((entry: any, index: number) => {
                  const colors = ['#3b82f6', '#f59e0b', '#6b7280'];
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <span className="text-sm font-medium">{entry.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">${entry.value.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{entry.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Tariffs List */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Active Tariff Structures</h3>
        <div className="space-y-3">
          {activeTariffs.map(tariff => (
            <div key={tariff.id} className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{tariff.tariff_name}</span>
                  {tariff.default_tariff && (
                    <Badge variant="default">Default</Badge>
                  )}
                  <Badge variant="outline">{tariff.tariff_type}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">{tariff.tariff_code}</span>
              </div>
              {tariff.description && (
                <p className="text-xs text-muted-foreground mb-2">{tariff.description}</p>
              )}
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Energy Rate:</span>
                  <span className="ml-2 font-medium">${(tariff.energy_rate_per_kwh || 0).toFixed(4)}/kWh</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Demand Rate:</span>
                  <span className="ml-2 font-medium">${(tariff.demand_rate_per_kw || 0).toFixed(2)}/kW</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fixed Charge:</span>
                  <span className="ml-2 font-medium">${(tariff.fixed_charge_per_month || 0).toFixed(2)}/mo</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cost Optimization Recommendations */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-success" />
          Cost Optimization Opportunities
        </h3>
        <div className="space-y-3">
          {recommendations.map(rec => (
            <div key={rec.id} className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{rec.title}</span>
                    <Badge 
                      variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'outline'}
                    >
                      {rec.priority} priority
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{rec.description}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground">
                      Category: <span className="font-medium">{rec.category.replace(/_/g, ' ')}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Complexity: <span className="font-medium">{rec.implementationComplexity}</span>
                    </span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-lg font-bold text-success">${rec.estimatedSavingsPerMonth.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">per month</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-success/10 rounded-lg">
          <p className="text-sm font-medium text-success">
            Total Potential Savings: ${recommendations.reduce((sum, rec) => sum + rec.estimatedSavingsPerMonth, 0).toFixed(0)}/month
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Implementing all recommendations could reduce energy costs by up to 30%
          </p>
        </div>
      </div>
    </div>
  );
}
