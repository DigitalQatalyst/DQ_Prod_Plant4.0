import { ReactNode, useState } from "react";
import { Search, Filter, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useLayout } from "@/context/LayoutContext";
import { CollapseToggle } from "./CollapseToggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

export interface SortOption {
  value: string;
  label: string;
}

/* ── Types ─────────────────────────────────────── */
interface ListPaneProps {
  title: string;
  subtitle?: string;
  context?: string;
  count?: number;
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearch?: (query: string) => void;
  showFilters?: boolean;
  showExpandableFilters?: boolean;
  filters?: FilterConfig[];
  filterContent?: ReactNode;
  sortValue?: string;
  onSortChange?: (value: string) => void;
  sortOptions?: SortOption[];
  children: ReactNode;
  actions?: ReactNode;
  searchValue?: string;
  className?: string;
}

/* ── Small filter pill ─────────────────────────── */
function FilterPill({
  label,
  value,
  options,
  onChange,
  colorMap,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  colorMap?: Record<string, string>;
}) {
  const active = value !== "all";
  const selected = options.find((o) => o.value === value);
  const dotColor = active && colorMap ? colorMap[value] : undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150 outline-none focus:ring-1 focus:ring-primary/50",
            active
              ? "bg-primary/10 text-primary border-primary/30"
              : "bg-secondary/60 text-muted-foreground border-border/60 hover:border-primary/30 hover:text-foreground"
          )}
        >
          {dotColor && (
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />
          )}
          {active ? selected?.label ?? label : label}
          <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[140px]">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {options.map((opt) => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-xs">
              <span className="flex items-center gap-2">
                {colorMap && opt.value !== "all" && (
                  <span className={cn("w-2 h-2 rounded-full shrink-0", colorMap[opt.value])} />
                )}
                {opt.label}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── Main component ────────────────────────────── */
export function ListPane({
  title,
  subtitle,
  context,
  count,
  searchPlaceholder = "Search",
  onSearch,
  showFilters = true,
  showExpandableFilters = false,
  filters = [],
  filterContent,
  sortValue,
  onSortChange,
  sortOptions = [],
  children,
  actions,
  searchValue,
  className,
}: ListPaneProps) {
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const { layoutState, setListPaneCollapsed } = useLayout();
  const [internalSearch, setInternalSearch] = useState("");

  const handleSearchChange = (value: string) => {
    setInternalSearch(value);
    onSearch?.(value);
  };

  const displaySearch = searchValue !== undefined ? searchValue : internalSearch;
  const hasFilters = filters.length > 0;

  return (
    <div
      className={cn("bg-pane-list border-r border-border flex flex-col relative shrink-0 h-full min-h-0 overflow-hidden", className)}
      style={{ width: `${layoutState.listPaneWidth}px` }}
    >
      {/* Pane Header */}
      <div className="p-4 border-b border-border/60 bg-background/50 backdrop-blur-sm shrink-0">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <h2 className="text-[17px] font-bold text-foreground leading-tight">{title}</h2>
            {(context || subtitle) && (
              <p className="text-xs font-medium text-muted-foreground/80">
                {context || subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {count !== undefined && (
              <div className="bg-secondary/60 text-muted-foreground/70 text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center border border-border/40">
                {count}
              </div>
            )}
            <CollapseToggle
              pane="list"
              isCollapsed={layoutState.listPaneCollapsed}
              onToggle={setListPaneCollapsed}
            />
          </div>
        </div>
        {actions && <div className="mt-2 w-full">{actions}</div>}
      </div>

      {/* Control Section (Fixed) */}
      <div className="p-3 border-b border-border/60 bg-background/40 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
            <Input
              placeholder={searchPlaceholder}
              value={displaySearch}
              className="pl-8 h-9 text-sm bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40 placeholder:text-muted-foreground/50"
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {showFilters && hasFilters && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 gap-2 text-xs font-semibold bg-background border-border/60 hover:bg-secondary/50 flex-1"
                >
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {filters.map((filter) => (
                  <div key={filter.key}>
                    <DropdownMenuLabel>{filter.label}</DropdownMenuLabel>
                    <DropdownMenuRadioGroup value={filter.value} onValueChange={filter.onChange}>
                      {filter.options.map((opt) => (
                        <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSeparator />
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {sortOptions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 gap-2 text-xs font-semibold bg-background border-border/60 hover:bg-secondary/50 flex-1"
                >
                  <SlidersHorizontal className="w-4 h-4 text-muted-foreground rotate-90" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={sortValue} onValueChange={onSortChange}>
                  {sortOptions.map((opt) => (
                    <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Custom Filter Content */}
          {filterContent && (
            <div className="pt-2">
              {filterContent}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable List Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2.5 space-y-2.5">{children}</div>
      </ScrollArea>
    </div>

  );
}
