import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

export interface DistributionData {
    name: string;
    value: number;
    color?: string;
}

interface ThreatsDistributionChartProps {
    title: string;
    icon: LucideIcon;
    data: DistributionData[];
    emptyMessage?: string;
    centerText?: string;
}

const DEFAULT_COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--warning))',
    'hsl(var(--destructive))',
    'hsl(var(--success))',
    'hsl(var(--secondary))',
];

export function ThreatsDistributionChart({
    title,
    icon: Icon,
    data,
    emptyMessage = "No Data Available",
    centerText
}: ThreatsDistributionChartProps) {
    const hasData = data.some(d => d.value > 0);

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={hasData ? data : [{ name: 'No Data', value: 1 }]}
                                cx="40%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {hasData ? (
                                    data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                                        />
                                    ))
                                ) : (
                                    <Cell fill="hsl(var(--muted) / 0.2)" />
                                )}
                            </Pie>
                            {!hasData && (
                                <text
                                    x="40%"
                                    y="50%"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="fill-muted-foreground text-xs font-medium"
                                >
                                    {emptyMessage}
                                </text>
                            )}
                            {hasData && centerText && (
                                <text
                                    x="40%"
                                    y="50%"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="fill-foreground text-lg font-bold"
                                >
                                    {centerText}
                                </text>
                            )}
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                }}
                            />
                            <Legend
                                layout="vertical"
                                align="right"
                                verticalAlign="middle"
                                wrapperStyle={{ paddingLeft: '20px', fontSize: '12px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
