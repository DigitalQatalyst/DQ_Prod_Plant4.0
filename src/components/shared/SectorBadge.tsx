import { cn } from "@/lib/utils";

interface SectorBadgeProps {
  sector: string;
  subsector?: string;
  size?: "sm" | "md";
  variant?: "default" | "outline";
}

export function SectorBadge({ sector, subsector, size = "md", variant = "default" }: SectorBadgeProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center rounded-full font-medium",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
          variant === "default" && "bg-primary/10 text-primary border border-primary/20",
          variant === "outline" && "bg-transparent text-muted-foreground border border-border"
        )}
      >
        {sector}
      </span>
      {subsector && (
        <span
          className={cn(
            "inline-flex items-center rounded-full font-medium",
            size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
            variant === "default" && "bg-accent/10 text-accent border border-accent/20",
            variant === "outline" && "bg-transparent text-muted-foreground border border-border"
          )}
        >
          {subsector}
        </span>
      )}
    </div>
  );
}