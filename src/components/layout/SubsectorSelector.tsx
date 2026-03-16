import { ChevronDown, Check, AlertCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
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

export function SubsectorSelector() {
  const { currentSubsector, setCurrentSubsector, availableSubsectors, currentSector } = useApp();

  // Handle empty subsectors array
  if (!Array.isArray(availableSubsectors) || availableSubsectors.length === 0) {
    console.warn(`No subsectors available for sector: ${currentSector?.name || "Unknown"}`);
    return (
      <Button
        variant="outline"
        className="h-9 px-3 gap-2 bg-secondary/50 border-border opacity-50 cursor-not-allowed"
        disabled
      >
        <AlertCircle className="w-4 h-4 text-destructive" />
        <span className="text-sm font-medium">No Subsectors</span>
      </Button>
    );
  }

  // Handle invalid current subsector
  const displayName = currentSubsector || "Unknown Subsector";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-9 px-3 gap-2 bg-secondary/50 border-border hover:bg-secondary hover:text-foreground">
          <span className="text-sm font-medium">{displayName}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-56">
        <DropdownMenuLabel>Select Subsector</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableSubsectors.map((subsector) => {
          // Skip invalid subsectors
          if (!subsector || typeof subsector !== "string" || subsector.trim().length === 0) {
            console.warn("Skipping invalid subsector:", subsector);
            return null;
          }

          const isSelected = currentSubsector === subsector;
          return (
            <DropdownMenuItem
              key={subsector}
              onClick={() => {
                try {
                  setCurrentSubsector(subsector);
                } catch (error) {
                  console.error("Error selecting subsector:", error);
                }
              }}
              className={cn(
                "flex items-center gap-2 justify-between",
                isSelected && "bg-accent"
              )}
            >
              <div>
                <p className="text-sm font-medium">{subsector}</p>
              </div>
              {isSelected && <Check className="w-4 h-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
