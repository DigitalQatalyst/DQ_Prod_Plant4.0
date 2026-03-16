import { useState } from "react";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchFilterSortProps {
    searchPlaceholder?: string;
    onSearchChange: (value: string) => void;
    filterContent?: React.ReactNode;
    sortContent?: React.ReactNode;
    className?: string;
}

export function SearchFilterSort({
    searchPlaceholder = "Search...",
    onSearchChange,
    filterContent,
    sortContent,
    className,
}: SearchFilterSortProps) {
    const [showFilters, setShowFilters] = useState(false);
    const [showSort, setShowSort] = useState(false);

    return (
        <div className={cn("space-y-2", className)}>
            {/* Search Bar with Filter and Sort Buttons */}
            <div className="flex items-center gap-1 w-full min-w-0">
                <div className="relative flex-1 min-w-0" style={{ flex: "1 1 0px", minWidth: 0 }}>
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                        placeholder={searchPlaceholder}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-7 h-8 text-sm px-2 w-full min-w-0"
                        style={{ minWidth: 0 }}
                    />
                </div>

                {filterContent && (
                    <Button
                        variant={showFilters ? "default" : "outline"}
                        size="sm"
                        className="gap-1 h-8 px-2 shrink-0"
                        style={{ flexShrink: 0 }}
                        onClick={() => {
                            setShowFilters(!showFilters);
                            if (showSort) setShowSort(false);
                        }}
                    >
                        <Filter className="w-3.5 h-3.5" />
                        <span className="text-xs">Filter</span>
                    </Button>
                )}

                {sortContent && (
                    <Button
                        variant={showSort ? "default" : "outline"}
                        size="sm"
                        className="gap-1 h-8 px-2 shrink-0"
                        style={{ flexShrink: 0 }}
                        onClick={() => {
                            setShowSort(!showSort);
                            if (showFilters) setShowFilters(false);
                        }}
                    >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        <span className="text-xs">Sort</span>
                    </Button>
                )}
            </div>

            {/* Collapsible Filter Section */}
            {showFilters && filterContent && (
                <div className="p-3 bg-muted/50 rounded-lg border border-border animate-in slide-in-from-top-2 duration-200">
                    {filterContent}
                </div>
            )}

            {/* Collapsible Sort Section */}
            {showSort && sortContent && (
                <div className="p-3 bg-muted/50 rounded-lg border border-border animate-in slide-in-from-top-2 duration-200">
                    {sortContent}
                </div>
            )}
        </div>
    );
}
