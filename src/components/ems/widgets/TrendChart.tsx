import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface TrendChartProps {
  data: Array<{
    time: string;
    value: number;
    [key: string]: any;
  }>;
  dataKey: string;
  title: string;
  unit?: string;
  type?: "line" | "bar";
  height?: number;
  color?: string;
}

export function TrendChart({
  data,
  dataKey,
  title,
  unit = "",
  type = "line",
  height = 300,
  color = "hsl(var(--primary))",
}: TrendChartProps) {
  const ChartComponent = type === "line" ? LineChart : BarChart;

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={data}>
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
              formatter={(value: any) => [`${value} ${unit}`, title]}
            />
            {type === "line" ? (
              <Line 
                type="monotone" 
                dataKey={dataKey} 
                stroke={color} 
                strokeWidth={2}
                dot={{ fill: color, strokeWidth: 2, r: 4 }}
              />
            ) : (
              <Bar 
                dataKey={dataKey} 
                fill={color}
                opacity={0.8}
              />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </div>
  );
}