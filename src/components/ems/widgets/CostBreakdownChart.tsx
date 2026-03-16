import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { DollarSign, TrendingUp, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getEnergyTypeColor } from "@/lib/energy-icons";

interface CostBreakdownData {
  category: string;
  cost: number;
  percentage: number;
  energyType?: "electricity" | "gas" | "diesel" | "steam";
  unit?: string;
  consumption?: number;
}

interface CostBreakdownChartProps {
  data: CostBreakdownData[];
  totalCost: number;
  title?: string;
  chartType?: "pie" | "bar";
  showTopContributors?: boolean;
  currency?: string;
}

export function CostBreakdownChart({
  data = [],
  totalCost = 0,
  title = "Energy Cost Breakdown",
  chartType = "pie",
  showTopContributors = true,
  currency = "USD",
}: CostBreakdownChartProps) {
  // Default mock data if no data provided
  const defaultData: CostBreakdownData[] = [
    {
      category: "Gas Compressor",
      cost: 4018.15,
      percentage: 65.2,
      energyType: "gas",
      unit: "MMBtu",
      consumption: 892.7
    },
    {
      category: "ESP Pumps",
      cost: 1245.30,
      percentage: 20.2,
      energyType: "electricity",
      unit: "kWh",
      consumption: 10377.5
    },
    {
      category: "Camp & Utilities",
      cost: 567.80,
      percentage: 9.2,
      energyType: "electricity",
      unit: "kWh",
      consumption: 4731.7
    },
    {
      category: "Transfer Pumps",
      cost: 234.50,
      percentage: 3.8,
      energyType: "electricity",
      unit: "kWh",
      consumption: 1954.2
    },
    {
      category: "Backup Generator",
      cost: 89.25,
      percentage: 1.4,
      energyType: "diesel",
      unit: "L",
      consumption: 71.4
    }
  ];

  const displayData = data.length > 0 ? data : defaultData;
  const displayTotalCost = totalCost > 0 ? totalCost : displayData.reduce((sum, item) => sum + item.cost, 0);
  
  const sortedData = [...displayData].sort((a, b) => b.cost - a.cost);
  const topContributors = sortedData.slice(0, 5);

  const getColor = (item: CostBreakdownData, index: number) => {
    if (item.energyType) {
      return getEnergyTypeColor(item.energyType);
    }
    // Default color palette
    const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#84cc16"];
    return colors[index % colors.length];
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.category}</p>
          <p className="text-sm text-muted-foreground">
            ${data.cost.toFixed(2)} ({data.percentage.toFixed(1)}%)
          </p>
          {data.consumption && data.unit && (
            <p className="text-xs text-muted-foreground">
              {data.consumption.toFixed(1)} {data.unit}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-warning" />
          {title}
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <p className="text-2xl font-bold text-foreground">${displayTotalCost.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Total Daily Cost</p>
          </div>
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <p className="text-2xl font-bold text-foreground">${(displayTotalCost * 30).toFixed(0)}</p>
            <p className="text-sm text-muted-foreground">Monthly Projection</p>
          </div>
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <p className="text-2xl font-bold text-foreground">${(displayTotalCost * 365).toFixed(0)}</p>
            <p className="text-sm text-muted-foreground">Annual Projection</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-semibold mb-4">Cost Distribution</h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "pie" ? (
              <PieChart>
                <Pie
                  data={displayData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="cost"
                  label={({ category, percentage }) => `${category} (${percentage.toFixed(1)}%)`}
                >
                  {displayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry, index)} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            ) : (
              <BarChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="category" 
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                  label={{ value: `Cost (${currency})`, angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cost" fill="hsl(var(--primary))" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Contributors */}
      {showTopContributors && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Top Cost Contributors
          </h4>
          <div className="space-y-3">
            {topContributors.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getColor(item, index) }}
                  />
                  <div>
                    <p className="text-sm font-medium">{item.category}</p>
                    {item.consumption && item.unit && (
                      <p className="text-xs text-muted-foreground">
                        {item.consumption.toFixed(1)} {item.unit}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">${item.cost.toFixed(2)}</p>
                  <Badge variant="outline" className="text-xs">
                    {item.percentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost per Unit Analysis */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-semibold mb-4">Cost per Unit Analysis</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Energy Type Rates</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Electricity:</span>
                <span>$0.12/kWh</span>
              </div>
              <div className="flex justify-between">
                <span>Natural Gas:</span>
                <span>$4.50/MMBtu</span>
              </div>
              <div className="flex justify-between">
                <span>Diesel:</span>
                <span>$1.25/L</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Cost Optimization</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Peak demand management</li>
              <li>• Load shifting opportunities</li>
              <li>• Energy efficiency improvements</li>
              <li>• Fuel switching analysis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}