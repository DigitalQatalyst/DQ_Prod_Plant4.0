import React from "react";
import { LucideIcon, Database, Search, Filter, AlertTriangle, CheckCircle, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary" | "ghost";
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Standardized empty state component for consistent UI across all Optimise features
 * Provides consistent styling, spacing, and interaction patterns
 * 
 * Requirements: 6.4, 6.5, 6.6 - UI component consistency and empty state templates
 */
export function EmptyState({
  icon: Icon = Database,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizeConfig = {
    sm: {
      container: "py-8",
      icon: "w-8 h-8",
      iconContainer: "w-12 h-12",
      title: "text-sm",
      description: "text-xs",
    },
    md: {
      container: "py-12",
      icon: "w-12 h-12",
      iconContainer: "w-16 h-16",
      title: "text-lg",
      description: "text-sm",
    },
    lg: {
      container: "py-16",
      icon: "w-16 h-16",
      iconContainer: "w-20 h-20",
      title: "text-xl",
      description: "text-base",
    },
  };

  const config = sizeConfig[size];

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center text-center",
        config.container,
        className
      )}
      role="status"
      aria-label={`Empty state: ${title}`}
    >
      <div className={cn(
        "rounded-2xl bg-secondary/50 flex items-center justify-center mb-4",
        config.iconContainer
      )}>
        <Icon className={cn(config.icon, "text-muted-foreground")} aria-hidden="true" />
      </div>
      
      <h3 className={cn("font-semibold text-foreground mb-2", config.title)}>
        {title}
      </h3>
      
      <p className={cn("text-muted-foreground max-w-md mb-4", config.description)}>
        {description}
      </p>
      
      {action && (
        <Button
          variant={action.variant || "outline"}
          size={size === "sm" ? "sm" : "default"}
          onClick={action.onClick}
          aria-label={action.label}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

/**
 * Pre-configured empty states for common scenarios
 */
export const EmptyStates = {
  NoData: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Database}
      title="No Data Available"
      description="There is no data to display at this time."
      {...props}
    />
  ),

  NoSearchResults: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Search}
      title="No Results Found"
      description="No items match your search criteria. Try adjusting your search terms or filters."
      {...props}
    />
  ),

  NoFilterResults: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Filter}
      title="No Matching Items"
      description="No items match your current filters. Try adjusting your filter criteria."
      action={{
        label: "Clear Filters",
        onClick: () => {},
        variant: "outline",
      }}
      {...props}
    />
  ),

  NoIssues: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={CheckCircle}
      title="No Issues"
      description="Great! There are no active issues to display."
      {...props}
    />
  ),

  NoActions: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={CheckCircle}
      title="No Actions Required"
      description="All actions have been completed. No pending actions at this time."
      {...props}
    />
  ),

  NoProjects: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Clock}
      title="No Projects"
      description="No continuous improvement projects have been created yet."
      action={{
        label: "Create Project",
        onClick: () => {},
        variant: "default",
      }}
      {...props}
    />
  ),

  NoAlerts: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={CheckCircle}
      title="No Alerts"
      description="All systems are operating normally. No alerts to display."
      {...props}
    />
  ),

  NoPerformancePanels: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Database}
      title="No Performance Panels"
      description="No performance panels are configured for your current selection."
      {...props}
    />
  ),

  NoSIMBoards: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Clock}
      title="No SIM Boards"
      description="No Short Interval Management boards are available for your current selection."
      {...props}
    />
  ),

  ComingSoon: (props: Partial<EmptyStateProps> & { feature?: string }) => (
    <EmptyState
      icon={Sparkles}
      title={props.feature ? `${props.feature} Coming Soon` : "Coming Soon"}
      description="This feature is under development and will be available in a future release."
      {...props}
    />
  ),

  Error: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={AlertTriangle}
      title="Unable to Load Data"
      description="There was an error loading the data. Please try again or contact support if the problem persists."
      action={{
        label: "Retry",
        onClick: () => {},
        variant: "outline",
      }}
      {...props}
    />
  ),
};