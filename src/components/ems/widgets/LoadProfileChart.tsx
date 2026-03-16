import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Badge } from "@/components/ui/badge";

interface LoadProfileData {
  time: string;
  actual: number;
  forecast?: number;
  baseline?: number;
}

interface LoadProfileChartProps {
  data: LoadProfileData[];
  title?: string;
  unit?: string;
  showForecast?: boolean;
  showBaseline?: boolean;
  peakThreshold?: number;
  height?: number;
}

export function LoadProfileChart({
  data,
  title = "24-Hour Load Profile",
  unit = "kW",
  showForecast = false,
  showBaseline = false,
  peakThreshold,
  height = 400,
}: LoadProfileChartProps) {
  const maxValue = Math.max(...data.map(d => Math.max(d.actual, d.forecast || 0, d.baseline || 0)));
  const peakHours = data.filter(d => peakThreshold && d.actual > peakThreshold);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Peak: {maxValue.toFixed(1)} {unit}
          </Badge>
          {peakHours.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {peakHours.length} peak hours
            </Badge>
          )}
        </div>
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="time" 
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fontSize: 12 }}
              label={{ value: unit, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: any, name: string) => [
                `${value} ${unit}`, 
                name === 'actual' ? 'Actual' : name === 'forecast' ? 'Forecast' : 'Baseline'
              ]}
            />
            
            {/* Peak threshold line */}
            {peakThreshold && (
              <ReferenceLine 
                y={peakThreshold} 
                stroke="hsl(var(--destructive))" 
                strokeDasharray="5 5"
                label={{ value: "Peak Threshold", position: "top" }}
              />
            )}
            
            {/* Baseline line */}
            {showBaseline && (
              <Line 
                type="monotone" 
                dataKey="baseline" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
              />
            )}
            
            {/* Forecast line */}
            {showForecast && (
              <Line 
                type="monotone" 
                dataKey="forecast" 
                stroke="hsl(var(--warning))" 
                strokeWidth={2}
                strokeDasharray="2 2"
                dot={false}
              />
            )}
            
            {/* Actual load line */}
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Peak windows highlight */}
      {peakHours.length > 0 && (
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm font-medium text-destructive mb-1">Peak Demand Windows</p>
          <p className="text-xs text-muted-foreground">
            Load exceeded {peakThreshold} {unit} during: {peakHours.map(h => h.time).join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}