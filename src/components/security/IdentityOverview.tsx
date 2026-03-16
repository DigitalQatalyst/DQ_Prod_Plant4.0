import React from "react";
import { LucideIcon } from "lucide-react";
import { KPICard } from "@/components/shared/KPICard";

interface OverviewMetric {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
}

interface IdentityOverviewProps {
    title: string;
    description: string;
    metrics: OverviewMetric[];
    children?: React.ReactNode;
    showTitleCard?: boolean;
}

export function IdentityOverview({
    title,
    description,
    metrics,
    children,
    showTitleCard = true
}: IdentityOverviewProps) {
    return (
        <div className="space-y-6 overflow-y-auto h-full pr-1">
            {showTitleCard && (
                <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-xl font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{description}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {metrics.map((metric, index) => (
                    <KPICard
                        key={index}
                        title={metric.title}
                        value={metric.value}
                        subtitle={metric.subtitle}
                        icon={metric.icon}
                        variant={metric.variant}
                    />
                ))}
            </div>

            {children && (
                <div className="mt-6">
                    {children}
                </div>
            )}
        </div>
    );
}
