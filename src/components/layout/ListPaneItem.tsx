import { ReactNode } from "react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

interface ListPaneItemProps {
    title: string;
    description?: string;
    status?: string;
    category?: string;
    value?: string | ReactNode;
    isSelected?: boolean;
    onClick?: () => void;
    className?: string;
}

/**
 * Standardized card component for ListPane items based on image reference.
 * Structure:
 * - Top row: [StatusBadge] Title (bold)
 * - Middle row: Description (muted, wrap)
 * - Bottom row: [CategoryTag] [Value (green, right-aligned)]
 */
export function ListPaneItem({
    title,
    description,
    status,
    category,
    value,
    isSelected,
    onClick,
    className,
}: ListPaneItemProps) {
    return (
        <div
            className={cn(
                "p-4 rounded-xl border transition-all duration-200 group relative flex flex-col gap-2.5",
                isSelected
                    ? "border-primary/40 bg-primary/5 shadow-sm ring-1 ring-primary/10"
                    : "border-border/60 bg-background hover:bg-card/50 hover:border-primary/20",
                className
            )}
            onClick={onClick}
        >
            {/* Top Row: Status + Title */}
            <div className="flex items-center gap-2.5 min-w-0">
                {status && <StatusBadge status={status} size="sm" />}
                <h4 className={cn(
                    "text-[15px] font-bold truncate tracking-tight",
                    isSelected ? "text-primary" : "text-foreground"
                )}>
                    {title}
                </h4>
            </div>

            {/* Middle Row: Description */}
            {description && (
                <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed">
                    {description}
                </p>
            )}

            {/* Bottom Row: Category + Value */}
            <div className="flex items-center justify-between mt-0.5">
                {category && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-secondary/60 text-muted-foreground/80">
                        {category}
                    </span>
                )}
                {value && (
                    <div className="text-[13px] font-bold text-success flex items-center">
                        {value}
                    </div>
                )}
            </div>

            {isSelected && (
                <div className="absolute left-0 top-[20%] bottom-[20%] w-0.5 bg-primary rounded-r-full" />
            )}
        </div>
    );
}
