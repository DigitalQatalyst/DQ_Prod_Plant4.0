import { ChevronDown, Check, AlertCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { sectors } from "@/data/mockData";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SectorSelector() {
  const { currentSector, setCurrentSector } = useApp();

  // Handle empty sectors array
  if (!Array.isArray(sectors) || sectors.length === 0) {
    console.error("Sectors array is empty or undefined");
    return (
      <Button
        variant="outline"
        className="h-9 px-3 gap-2 bg-secondary/50 border-border opacity-50 cursor-not-allowed"
        disabled
      >
        <AlertCircle className="w-4 h-4 text-destructive" />
        <span className="text-sm font-medium">No Sectors</span>
      </Button>
    );
  }

  // Handle invalid current sector
  const displayName = currentSector?.name || "Unknown Sector";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-9 px-3 gap-2 bg-secondary/50 border-border hover:bg-secondary hover:text-foreground">
          <span className="text-sm font-medium">{displayName}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-56">
        <DropdownMenuLabel>Select Sector</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sectors.map((sector) => {
          // Skip invalid sectors
          if (!sector || !sector.id || !sector.name) {
            console.warn("Skipping invalid sector:", sector);
            return null;
          }

          const isSelected = currentSector?.id === sector.id;
          const subsectorCount = Array.isArray(sector.subsectors) ? sector.subsectors.length : 0;

          return (
            <DropdownMenuItem
              key={sector.id}
              onClick={() => {
                try {
                  setCurrentSector(sector);
                } catch (error) {
                  console.error("Error selecting sector:", error);
                }
              }}
              className={cn(
                "flex items-center gap-2 justify-between",
                isSelected && "bg-accent"
              )}
            >
              <div>
                <p className="text-sm font-medium">{sector.name}</p>
                <p className="text-xs text-muted-foreground">
                  {subsectorCount} subsector{subsectorCount !== 1 ? 's' : ''}
                </p>
              </div>
              {isSelected && <Check className="w-4 h-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
