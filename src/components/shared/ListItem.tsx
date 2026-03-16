import React, { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";

export interface ListItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  status?: "online" | "offline" | "maintenance";
  priority?: "high" | "medium" | "low";
  icon?: LucideIcon | string;
  metadata?: Array<{
    label: string;
    value: string | ReactNode;
  }>;
  actions?: ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "compact" | "detailed";
}

/**
 * Standardized list item component for consistent list styling across all Optimise features
 * Provides consistent layout, interaction patterns, and visual hierarchy
 * 
 * Requirements: 6.4, 6.5 - List pane layout consistency and UI component reuse
 */
export function ListItem({
  title,
  subtitle,
  description,
  status,
  priority,
  icon,
  metadata = [],
  actions,
  isSelected = false,
  onClick,
  className,
  variant = "default",
}: ListItemProps) {
  const variantConfig = {
    compact: {
      container: "p-2",
      title: "text-sm",
      subtitle: "text-xs",
      spacing: "space-y-1",
    },
    default: {
      container: "p-3",
      title: "text-sm",
      subtitle: "text-xs",
      spacing: "space-y-2",
    },
    detailed: {
      container: "p-4",
      title: "text-base",
      subtitle: "text-sm",
      spacing: "space-y-3",
    },
  };

  const config = variantConfig[variant];

  const renderIcon = () => {
    if (!icon) return null;

    if (typeof icon === 'string') {
      return <span className="text-lg">{icon}</span>;
    }

    const IconComponent = icon as LucideIcon;
    return <IconComponent className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusFromPriority = (priority: string) => {
    switch (priority) {
      case "high": return "offline";
      case "medium": return "maintenance";
      case "low": return "online";
      default: return "online";
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border cursor-pointer transition-all duration-200 hover:border-primary/30 w-full max-w-full overflow-hidden",
        config.container,
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:bg-card/80",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className={config.spacing}>
        {/* Header with title, subtitle, and status */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {icon && (
              <div className="flex-shrink-0 mt-0.5">
                {renderIcon()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className={cn("font-medium text-foreground truncate", config.title)}>
                {title}
              </h4>
              {subtitle && (
                <p className={cn("text-muted-foreground truncate", config.subtitle)}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {priority && (
              <StatusBadge
                status={getStatusFromPriority(priority)}
                size="sm"
                showLabel={variant !== "compact"}
              />
            )}
            {status && (
              <StatusBadge
                status={status}
                size="sm"
                showLabel={variant !== "compact"}
              />
            )}
            {actions}
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className={cn("text-muted-foreground", config.subtitle)}>
            {description}
          </p>
        )}

        {/* Metadata */}
        {metadata.length > 0 && (
          <div className={cn("grid gap-x-2 gap-y-1",
            metadata.length <= 2 ? "grid-cols-2" :
              metadata.length === 3 ? "grid-cols-3" : "grid-cols-2" // Force max 2 cols for narrow panes
          )}>
            {metadata.map((item, index) => (
              <div key={index} className={cn(
                "flex items-center gap-1 overflow-hidden min-w-0",
                variant === "compact" ? "justify-start gap-2" : "justify-between"
              )}>
                <span className={cn("text-muted-foreground shrink-0", config.subtitle)}>
                  {item.label}
                </span>
                <span className={cn("font-medium truncate text-right", config.subtitle)}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Pre-configured list item variants for common use cases
 */
export const ListItemVariants = {
  /**
   * Performance panel list item
   */
  PerformancePanel: (props: {
    panel: any;
    isSelected?: boolean;
    onClick?: () => void;
  }) => {
    const oee = props.panel.oee_percentage ?? props.panel.oee ?? 0;
    const avail = props.panel.availability_percentage ?? props.panel.availability ?? 0;
    const perf = props.panel.performance_percentage ?? props.panel.performance ?? 0;
    const qual = props.panel.quality_percentage ?? props.panel.quality ?? 0;

    const statusStr = oee >= 85 ? "online" : oee >= 70 ? "maintenance" : "offline";

    return (
      <ListItem
        title={props.panel.name}
        subtitle={props.panel.asset || props.panel.site || (props.panel.asset_id ? "Asset" : "Site")}
        metadata={[
          {
            label: "",
            value: <StatusBadge status={statusStr} showLabel={true} size="sm" />
          },
          { label: "OEE", value: `${oee.toFixed(1)}%` },
          { label: "Avail", value: `${avail.toFixed(1)}%` },
        ]}
        isSelected={props.isSelected}
        onClick={props.onClick}
        variant="compact"
      />
    );
  },

  /**
   * SIM board list item
   */
  SIMBoard: (props: {
    board: any;
    isSelected?: boolean;
    onClick?: () => void;
  }) => {
    const getShiftIcon = (shift: string) => {
      switch (shift?.toLowerCase()) {
        case "day": return "☀️";
        case "evening": return "🌅";
        case "night": return "🌙";
        default: return "⏰";
      }
    };

    return (
      <ListItem
        title={props.board.name}
        subtitle={`${props.board.shift} Shift`}
        icon={getShiftIcon(props.board.shift)}
        status={props.board.status === "on-track" ? "online" : props.board.status === "at-risk" ? "maintenance" : "offline"}
        metadata={[
          { label: "Date", value: props.board.date },
          { label: "Site", value: props.board.siteName || "N/A" },
        ]}
        isSelected={props.isSelected}
        onClick={props.onClick}
        variant="compact"
      />
    );
  },

  /**
   * CI project list item (for Kanban cards)
   */
  CIProject: (props: {
    project: any;
    isSelected?: boolean;
    onClick?: () => void;
  }) => (
    <ListItem
      title={props.project.title}
      subtitle={props.project.targetKPI}
      priority={props.project.priority}
      metadata={[
        { label: "Target", value: props.project.targetImprovement },
        { label: "Stage", value: props.project.stage },
        { label: "Owner", value: props.project.owner },
        { label: "Created", value: new Date(props.project.createdAt).toLocaleDateString() },
      ]}
      isSelected={props.isSelected}
      onClick={props.onClick}
      variant="compact"
    />
  ),

  /**
   * Alert/Issue list item
   */
  Alert: (props: {
    alert: any;
    isSelected?: boolean;
    onClick?: () => void;
  }) => (
    <ListItem
      title={props.alert.issueRef || props.alert.title}
      subtitle={props.alert.category}
      description={props.alert.description}
      icon="⚠️"
      priority={props.alert.priority}
      status={props.alert.status === "resolved" ? "online" : props.alert.status === "in-progress" ? "maintenance" : "offline"}
      metadata={[
        { label: "Site", value: props.alert.site?.name || "N/A" },
        { label: "Owner", value: props.alert.assignedOwner || props.alert.assignee },
        { label: "Due", value: props.alert.dueDate ? new Date(props.alert.dueDate).toLocaleDateString() : "N/A" },
      ]}
      isSelected={props.isSelected}
      onClick={props.onClick}
      variant="compact"
    />
  ),

  /**
   * Action/Task list item
   */
  Action: (props: {
    action: any;
    isSelected?: boolean;
    onClick?: () => void;
  }) => (
    <ListItem
      title={props.action.actionRef || props.action.title}
      subtitle={props.action.description}
      icon="✅"
      priority={props.action.priority}
      status={props.action.status === "completed" ? "online" : props.action.status === "in-progress" ? "maintenance" : "offline"}
      metadata={[
        { label: "Site", value: props.action.site?.name || "N/A" },
        { label: "Owner", value: props.action.owner || props.action.assignee },
        { label: "Due", value: props.action.dueDate ? new Date(props.action.dueDate).toLocaleDateString() : "TBD" },
      ]}
      isSelected={props.isSelected}
      onClick={props.onClick}
      variant="compact"
    />
  ),

  /**
   * Switching order list item
   */
  SwitchingOrder: (props: {
    order: any;
    isSelected?: boolean;
    onClick?: () => void;
  }) => (
    <ListItem
      title={props.order.orderNo}
      subtitle={props.order.description}
      icon="⚡"
      priority={props.order.priority}
      status={props.order.status === "completed" ? "online" : props.order.status === "in-progress" ? "maintenance" : "offline"}
      metadata={[
        { label: "Site", value: props.order.site?.name || "N/A" },
        { label: "Planned", value: props.order.plannedStart ? new Date(props.order.plannedStart).toLocaleDateString() : "TBD" },
        { label: "Owner", value: props.order.assignedOwner },
      ]}
      isSelected={props.isSelected}
      onClick={props.onClick}
      variant="compact"
    />
  ),

  /**
   * Recommendation list item
   */
  Recommendation: (props: {
    recommendation: any;
    isSelected?: boolean;
    onClick?: () => void;
  }) => (
    <ListItem
      title={props.recommendation.description}
      subtitle={`Confidence: ${props.recommendation.confidence}%`}
      description={props.recommendation.rationale}
      icon="🤖"
      metadata={[
        { label: "Impact", value: props.recommendation.estimatedImpact },
        { label: "Confidence", value: `${props.recommendation.confidence}%` },
      ]}
      isSelected={props.isSelected}
      onClick={props.onClick}
    />
  ),

  /**
   * Opportunity list item
   */
  Opportunity: (props: {
    opportunity: any;
    isSelected?: boolean;
    onClick?: () => void;
  }) => (
    <ListItem
      title={props.opportunity.title}
      subtitle={props.opportunity.category}
      description={`AI Confidence: ${props.opportunity.confidence}%`}
      icon="💡"
      metadata={[
        { label: "Rank", value: `#${props.opportunity.rank}` },
        { label: "Impact", value: props.opportunity.potentialImpact },
        { label: "Confidence", value: `${props.opportunity.confidence}%` },
      ]}
      isSelected={props.isSelected}
      onClick={props.onClick}
    />
  ),

  /**
   * Performance Loss list item
   */
  PerformanceLoss: (props: {
    loss: any;
    isSelected?: boolean;
    onClick?: () => void;
  }) => (
    <ListItem
      title={props.loss.loss_type}
      subtitle={props.loss.loss_category}
      status={props.loss.impact_percentage > 10 ? "offline" : props.loss.impact_percentage > 5 ? "maintenance" : "online"}
      metadata={[
        { label: "Impact", value: `${props.loss.impact_percentage.toFixed(1)}%` },
        { label: "Duration", value: `${props.loss.duration_minutes} min` },
      ]}
      isSelected={props.isSelected}
      onClick={props.onClick}
    />
  ),

  /**
   * Performance Bottleneck list item
   */
  PerformanceBottleneck: (props: {
    bottleneck: any;
    isSelected?: boolean;
    onClick?: () => void;
  }) => (
    <ListItem
      title={props.bottleneck.description}
      subtitle={props.bottleneck.constraint_type}
      status={props.bottleneck.severity === "high" ? "offline" : props.bottleneck.severity === "medium" ? "maintenance" : "online"}
      metadata={[
        { label: "Status", value: props.bottleneck.status },
        { label: "Loading", value: props.bottleneck.loading_percentage ? `${props.bottleneck.loading_percentage.toFixed(1)}%` : "N/A" },
      ]}
      isSelected={props.isSelected}
      onClick={props.onClick}
    />
  ),

  /**
   * Performance Benchmark list item
   */
  PerformanceBenchmark: (props: {
    benchmark: any;
    isSelected?: boolean;
    onClick?: () => void;
  }) => (
    <ListItem
      title={props.benchmark.benchmark_name}
      subtitle={props.benchmark.benchmark_type?.replace('_', ' ')}
      metadata={[
        { label: "Entities", value: props.benchmark.entities?.length || 0 },
        { label: "Updated", value: new Date(props.benchmark.updated_at).toLocaleDateString() },
      ]}
      isSelected={props.isSelected}
      onClick={props.onClick}
    />
  ),
};
