import { useCallback } from "react";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CollapseToggleProps {
  /**
   * The pane being controlled ('menu', 'list', or 'pop')
   */
  pane: 'menu' | 'list' | 'pop';
  
  /**
   * Current collapsed state
   */
  isCollapsed: boolean;
  
  /**
   * Callback when toggle is clicked
   */
  onToggle: (collapsed: boolean) => void;
  
  /**
   * Position of the toggle button
   */
  position?: 'left' | 'right' | 'top';
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Show label text alongside icon
   */
  showLabel?: boolean;
  
  /**
   * Custom label text
   */
  label?: string;
}

export function CollapseToggle({
  pane,
  isCollapsed,
  onToggle,
  position = 'right',
  className,
  showLabel = false,
  label,
}: CollapseToggleProps) {
  // Handle toggle click
  const handleToggle = useCallback(() => {
    onToggle(!isCollapsed);
  }, [isCollapsed, onToggle]);

  // Determine icon based on pane type and state
  const getIcon = () => {
    if (pane === 'menu') {
      return isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />;
    }
    
    if (pane === 'list') {
      return isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />;
    }
    
    // Pop pane
    return isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />;
  };

  // Determine tooltip text
  const getTooltipText = () => {
    if (label) return label;
    
    const paneLabel = pane === 'menu' ? 'Menu' : pane === 'list' ? 'List' : 'Details';
    return isCollapsed ? `Show ${paneLabel}` : `Hide ${paneLabel}`;
  };

  // Determine button position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'left':
        return 'left-0';
      case 'right':
        return 'right-0';
      case 'top':
        return 'top-0';
      default:
        return '';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            className={cn(
              "h-8 transition-all duration-200 ease-in-out",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              getPositionClasses(),
              className
            )}
            aria-label={getTooltipText()}
            aria-expanded={!isCollapsed}
            aria-controls={`${pane}-pane`}
          >
            <span className="flex items-center gap-2">
              {getIcon()}
              {showLabel && (
                <span className="text-xs font-medium">
                  {label || (isCollapsed ? 'Show' : 'Hide')}
                </span>
              )}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
