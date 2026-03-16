import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "primary" | "success" | "warning" | "destructive" | "pressure" | "flow" | "vibration";
  unit?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = "default",
  unit,
}: KPICardProps) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div className={cn(
      "kpi-card", 
      variant === "primary" && "border-primary/30",
      variant === "pressure" && "kpi-card-pressure",
      variant === "flow" && "kpi-card-flow",
      variant === "vibration" && "kpi-card-vibration"
    )}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              variant === "default" && "bg-secondary",
              variant === "primary" && "bg-primary/10",
              variant === "success" && "bg-success/10",
              variant === "warning" && "bg-warning/10",
              variant === "destructive" && "bg-destructive/10",
              variant === "pressure" && "bg-blue-500/10",
              variant === "flow" && "bg-cyan-500/10",
              variant === "vibration" && "bg-orange-500/10"
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4",
                variant === "default" && "text-muted-foreground",
                variant === "primary" && "text-primary",
                variant === "success" && "text-success",
                variant === "warning" && "text-warning",
                variant === "destructive" && "text-destructive",
                variant === "pressure" && "text-blue-500",
                variant === "flow" && "text-cyan-500",
                variant === "vibration" && "text-orange-500"
              )}
            />
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {unit && (
              <span className="text-sm text-muted-foreground">{unit}</span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>

        {trend && trendValue && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend === "up" && "text-success",
              trend === "down" && "text-destructive",
              trend === "neutral" && "text-muted-foreground"
            )}
          >
            <TrendIcon className="w-3 h-3" />
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
}
