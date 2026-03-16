import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface BaselineComparisonCardProps {
  actualValue: number;
  baselineValue: number;
  unit: string;
  title?: string;
  subtitle?: string;
}

export function BaselineComparisonCard({
  actualValue,
  baselineValue,
  unit,
  title = "Baseline Comparison",
  subtitle = "Today vs Baseline",
}: BaselineComparisonCardProps) {
  const percentageDiff = ((actualValue - baselineValue) / baselineValue) * 100;
  const isOverBaseline = percentageDiff > 0;
  const TrendIcon = isOverBaseline ? TrendingUp : percentageDiff < 0 ? TrendingDown : Minus;

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{actualValue.toFixed(0)}</p>
          <p className="text-sm text-muted-foreground">Actual {unit}</p>
        </div>
        
        <div className="text-center">
          <p className="text-2xl font-bold text-muted-foreground">{baselineValue.toFixed(0)}</p>
          <p className="text-sm text-muted-foreground">Baseline {unit}</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <TrendIcon 
              className={cn(
                "w-5 h-5",
                isOverBaseline ? "text-destructive" : percentageDiff < 0 ? "text-success" : "text-muted-foreground"
              )} 
            />
            <p className={cn(
              "text-2xl font-bold",
              isOverBaseline ? "text-destructive" : percentageDiff < 0 ? "text-success" : "text-muted-foreground"
            )}>
              {Math.abs(percentageDiff).toFixed(1)}%
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {isOverBaseline ? "Over" : percentageDiff < 0 ? "Under" : "At"} Baseline
          </p>
        </div>
      </div>
    </div>
  );
}