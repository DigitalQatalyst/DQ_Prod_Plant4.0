import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    Cell as RechartsCell
} from "recharts";
import {
    PieChart as PieChartIcon,
    BarChart as BarChartIcon,
    ShieldCheck,
    History,
} from "lucide-react";

export interface ChartData {
    name: string;
    value: number;
    color?: string;
}

export interface KeyArea {
    icon: LucideIcon;
    title: string;
    description: string;
}

export interface RecentActivity {
    id: string;
    title: string;
    subtitle?: string;
    status?: 'success' | 'warning' | 'error' | 'info';
    value?: string | number;
}

interface FeatureOverviewChartsProps {
    pieChartTitle: string;
    pieChartData: ChartData[];
    pieChartIcon?: LucideIcon;
    barChartTitle: string;
    barChartData: ChartData[];
    barChartIcon?: LucideIcon;
    keyAreasTitle?: string;
    keyAreas: KeyArea[];
    recentActivityTitle?: string;
    recentActivity: RecentActivity[];
    onActivityClick?: (id: string) => void;
}

export function FeatureOverviewCharts({
    pieChartTitle,
    pieChartData,
    pieChartIcon: PieIcon = PieChartIcon,
    barChartTitle,
    barChartData,
    barChartIcon: BarIcon = BarChartIcon,
    keyAreasTitle = "Key Areas",
    keyAreas,
    recentActivityTitle = "Recent Activity",
    recentActivity,
    onActivityClick,
}: FeatureOverviewChartsProps) {
    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'success':
                return 'bg-success';
            case 'warning':
                return 'bg-warning';
            case 'error':
                return 'bg-destructive';
            case 'info':
                return 'bg-primary';
            default:
                return 'bg-muted-foreground';
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
            {/* Pie Chart */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <PieIcon className="w-4 h-4 text-primary" />
                        {pieChartTitle}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                                <Pie
                                    data={pieChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Legend layout="vertical" align="right" verticalAlign="middle" />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <BarIcon className="w-4 h-4 text-primary" />
                        {barChartTitle}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={barChartData} layout="vertical" margin={{ left: 80, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                                <XAxis type="number" hide domain={[0, 'auto']} />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={150}
                                    tick={{ fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: 'hsl(var(--muted)/0.1)' }}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {barChartData.map((_entry, index) => (
                                        <RechartsCell key={`cell-${index}`} fill={`hsl(var(--primary) / ${1 - index * 0.15})`} />
                                    ))}
                                </Bar>
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Key Areas */}
            <div className="bg-card border border-border rounded-lg p-6">
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    {keyAreasTitle}
                </h4>
                <div className="space-y-4">
                    {keyAreas.map((area, index) => {
                        const Icon = area.icon;
                        return (
                            <div key={index} className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                    <Icon className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{area.title}</p>
                                    <p className="text-xs text-muted-foreground">{area.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-lg p-6">
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    {recentActivityTitle}
                </h4>
                <div className="space-y-4">
                    {recentActivity.map((activity) => (
                        <div
                            key={activity.id}
                            className={`group flex items-center justify-between p-2 border rounded-lg transition-colors ${onActivityClick ? 'hover:bg-muted/50 cursor-pointer' : ''
                                }`}
                            onClick={() => onActivityClick?.(activity.id)}
                        >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                {activity.status && (
                                    <div className={`w-2 h-2 rounded-full ${getStatusColor(activity.status)}`} />
                                )}
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium truncate block">{activity.title}</span>
                                    {activity.subtitle && (
                                        <span className="text-xs text-muted-foreground truncate block">{activity.subtitle}</span>
                                    )}
                                </div>
                            </div>
                            {activity.value && (
                                <span className="text-xs font-bold ml-2">{activity.value}</span>
                            )}
                        </div>
                    ))}
                    {recentActivity.length === 0 && (
                        <div className="text-center py-4">
                            <p className="text-xs text-muted-foreground italic">No recent activity</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
