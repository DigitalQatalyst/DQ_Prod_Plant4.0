import { ReactNode, useState } from "react";
import { Zap, BarChart3, TrendingUp, FileText, Target, Activity, Layout } from "lucide-react";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { EMSHeader } from "./EMSHeader";
import { getEMSListItemClasses, getEMSListItemIconClasses, getStatusColorClasses, getDefaultSectorInfo } from "@/lib/ems-utils";
import { cn } from "@/lib/utils";

interface EMSPageShellProps {
  title: string;
  featureSetName: string;
  featureName: string;
  listType: "meters" | "submeters" | "profiles" | "reports" | "scopes" | "feeders" | "alerts";
  listItems: any[];
  selectedItem: any;
  onItemSelect: (item: any) => void;
  workPaneContent: ReactNode;
  actions?: ReactNode;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  sector?: string;
  subsector?: string;
  tenantName?: string;
  listFilterContent?: ReactNode;
}

export function EMSPageShell({
  title,
  featureSetName,
  featureName,
  listType,
  listItems,
  selectedItem,
  onItemSelect,
  workPaneContent,
  actions,
  searchPlaceholder = "Search...",
  onSearch,
  sector,
  subsector,
  tenantName,
  listFilterContent,
}: EMSPageShellProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Ensure consistent sector/subsector display
  const defaultSectorInfo = getDefaultSectorInfo();
  const displaySector = sector || defaultSectorInfo.sector;
  const displaySubsector = subsector || defaultSectorInfo.subsector;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const filteredItems = listItems.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(query) ||
      item.scope?.toLowerCase().includes(query) ||
      item.type?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query)
    );
  });

  const getListTitle = () => {
    switch (listType) {
      case "meters":
        return "Energy Meters";
      case "submeters":
        return "Sub-meters";
      case "profiles":
        return "Load Profiles";
      case "reports":
        return "Reports";
      case "scopes":
        return "Scopes";
      case "feeders":
        return "Transmission Feeders";
      default:
        return "Items";
    }
  };

  return (
    <>
      <ListPane
        title={getListTitle()}
        subtitle={tenantName}
        count={filteredItems.length}
        onSearch={handleSearch}
        actions={actions}
        filterContent={listFilterContent}
      >
        {filteredItems.map((item) => (
          <EMSListItem
            key={item.id}
            item={item}
            listType={listType}
            isSelected={selectedItem?.id === item.id}
            onClick={() => onItemSelect(item)}
          />
        ))}
      </ListPane>

      <WorkPane
        title={title}
        subtitle={selectedItem ? `${featureSetName} · ${featureName}` : `${filteredItems.length} ${listType} available`}
        headerContent={
          <EMSHeader
            sector={displaySector}
            subsector={displaySubsector}
            featureSetName={featureSetName}
            featureName={featureName}
          />
        }
      >
        {workPaneContent}
      </WorkPane>
    </>
  );
}

interface EMSListItemProps {
  item: any;
  listType: string;
  isSelected: boolean;
  onClick: () => void;
}

function EMSListItem({ item, listType, isSelected, onClick }: EMSListItemProps) {
  const Icon = getItemIcon(listType);
  return (
    <button
      onClick={onClick}
      className={getEMSListItemClasses(isSelected)}
    >
      <div className={getEMSListItemIconClasses(isSelected)}>
        <Icon className={cn("w-5 h-5", isSelected ? "text-primary" : "text-muted-foreground")} />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-1">
          <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-foreground")}>
            {item.name}
          </span>
          {item.status && (
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider", getStatusColorClasses(item.status))}>
              {item.status}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mb-1">
          {item.scope || item.category || item.type || ""}
        </p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{getItemSubtitle(item, listType)}</span>
          {item.currentKWh !== undefined && (
            <>
              <span>•</span>
              <span className="font-medium text-foreground">{item.currentKWh.toFixed(0)} kWh/day</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

function getItemIcon(listType: string) {
  switch (listType) {
    case "meters":
      return Zap;
    case "submeters":
      return BarChart3;
    case "profiles":
      return TrendingUp;
    case "reports":
      return FileText;
    case "scopes":
      return Target;
    case "feeders":
      return Activity;
    default:
      return Layout;
  }
}


function getItemSubtitle(item: any, listType: string): string {
  switch (listType) {
    case "meters":
      return `${item.linkedAssets?.length || 0} assets`;
    case "submeters":
      return item.assetId || "";
    case "profiles":
      return item.timeRange || "";
    case "reports":
      return item.frequency || "";
    case "scopes":
      return item.description || "";
    case "feeders":
      return `${item.voltage_level_kv || 0} kV • ${item.meter_count || 0} meters`;
    default:
      return "";
  }
}