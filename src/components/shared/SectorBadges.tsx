import { Badge } from "@/components/ui/badge";

interface SectorBadgesProps {
  sector: string | null;
  subsector: string | null;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Lightweight sector/subsector badges for visual context indication
 * Following Plant4.0 design requirements for consistent visual theme
 */
export function SectorBadges({ sector, subsector, size = "sm", className }: SectorBadgesProps) {
  if (!sector && !subsector) return null;

  const badgeSize = size === "sm" ? "text-xs px-2 py-1" : "text-sm px-3 py-1";

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      {sector && (
        <Badge variant="secondary" className={badgeSize}>
          {sector}
        </Badge>
      )}
      {subsector && (
        <Badge variant="outline" className={badgeSize}>
          {subsector}
        </Badge>
      )}
    </div>
  );
}