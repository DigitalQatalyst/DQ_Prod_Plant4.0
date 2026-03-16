import { SectorBadges } from "@/components/shared/SectorBadges";

interface EMSHeaderProps {
  sector?: string;
  subsector?: string;
  featureSetName: string;
  featureName: string;
}

export function EMSHeader({ sector, subsector, featureSetName, featureName }: EMSHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {sector && subsector && (
          <SectorBadges sector={sector} subsector={subsector} />
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{featureSetName}</span>
          <span>•</span>
          <span>{featureName}</span>
        </div>
      </div>
    </div>
  );
}