import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { featureAreas } from "@/data/navigation";
import { FeatureArea, FeatureSet, Feature } from "@/types/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLayout } from "@/context/LayoutContext";
import { CollapseToggle } from "./CollapseToggle";

export function MenuPane() {
  const location = useLocation();
  const navigate = useNavigate();
  const { layoutState, setMenuPaneCollapsed } = useLayout();
  const [expandedAreas, setExpandedAreas] = useState<string[]>(["overview"]);
  const [expandedSets, setExpandedSets] = useState<string[]>(["command-center"]);

  const toggleArea = (areaId: string) => {
    setExpandedAreas((prev) =>
      prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId]
    );
  };

  const toggleSet = (setId: string) => {
    setExpandedSets((prev) =>
      prev.includes(setId) ? prev.filter((id) => id !== setId) : [...prev, setId]
    );
  };

  const isFeatureActive = (path: string) => location.pathname === path;
  const isAreaActive = (area: FeatureArea) =>
    location.pathname.startsWith(`/${area.id}`);
  const isSetActive = (set: FeatureSet) =>
    set?.features?.some((feature) => isFeatureActive(feature.path)) || false;

  return (
    <aside
      className={cn(
        "bg-pane-menu border-r border-border flex flex-col shrink-0 transition-all duration-300 ease-in-out h-full overflow-hidden min-h-0 pane",
        layoutState.menuPaneCollapsed ? "w-[60px]" : ""
      )}
      style={!layoutState.menuPaneCollapsed ? { width: `${layoutState.menuPaneWidth}px` } : {}}
    >
      {/* Collapse Toggle */}
      <div className="p-3 border-b border-border/50 shrink-0">
        <CollapseToggle
          pane="menu"
          isCollapsed={layoutState.menuPaneCollapsed}
          onToggle={setMenuPaneCollapsed}
        />
      </div>

      <ScrollArea className="flex-1 min-h-0 pane-content">
        <nav className={cn(
          "p-3 space-y-1",
          layoutState.menuPaneCollapsed && "px-2"
        )}>
          {featureAreas.map((area) => (
            <div key={area.id}>
              {/* Feature Area Header */}
              <button
                onClick={() => toggleArea(area.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all duration-200",
                  isAreaActive(area)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                  layoutState.menuPaneCollapsed && "justify-center px-2"
                )}
                title={layoutState.menuPaneCollapsed ? (area.shortName || area.name) : undefined}
              >
                <area.icon className="w-4 h-4 shrink-0" />
                {!layoutState.menuPaneCollapsed && (
                  <>
                    <span className="flex-1 text-sm font-medium truncate">
                      {area.shortName || area.name}
                    </span>
                    {area.featureSets.length > 0 && (
                      expandedAreas.includes(area.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )
                    )}
                  </>
                )}
              </button>

              {/* Feature Sets */}
              {expandedAreas.includes(area.id) && !layoutState.menuPaneCollapsed && (
                <div className="ml-2 mt-1 space-y-0.5">
                  {area.featureSets.map((set) => (
                    <div key={set.id}>
                      {/* Feature Set Header */}
                      <button
                        onClick={() => toggleSet(set.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-all duration-200",
                          isSetActive(set)
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                        )}
                      >
                        {expandedSets.includes(set.id) ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                        <span className="text-xs font-medium uppercase tracking-wider">
                          {set.name}
                        </span>
                      </button>

                      {/* Features */}
                      {expandedSets.includes(set.id) && (
                        <div className="ml-4 space-y-0.5">
                          {set.features.map((feature) => (
                            <button
                              key={feature.id}
                              onClick={() => navigate(feature.path)}
                              className={cn(
                                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm transition-all duration-200",
                                isFeatureActive(feature.path)
                                  ? "text-primary font-semibold"
                                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                              )}
                            >
                              {feature.icon && <feature.icon className="w-3.5 h-3.5" />}
                              <span className="truncate">{feature.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* User Settings at Bottom */}
      <div className={cn(
        "p-3 border-t border-border shrink-0",
        layoutState.menuPaneCollapsed && "px-2"
      )}>
        <button
          onClick={() => navigate("/settings/user")}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-200",
            location.pathname === "/settings/user"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
            layoutState.menuPaneCollapsed && "justify-center px-2"
          )}
          title={layoutState.menuPaneCollapsed ? "User Settings" : undefined}
        >
          <Settings className="w-4 h-4" />
          {!layoutState.menuPaneCollapsed && (
            <span className="text-sm">User Settings</span>
          )}
        </button>
      </div>
    </aside>

  );
}
