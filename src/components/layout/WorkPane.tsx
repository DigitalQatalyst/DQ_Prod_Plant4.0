import { ReactNode, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

interface WorkPaneProps {
  title: string;
  subtitle?: string | ReactNode;
  tabs?: Tab[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  actions?: ReactNode;
  headerContent?: ReactNode;
  children?: ReactNode;
}

export function WorkPane({
  title,
  subtitle,
  tabs,
  defaultTab,
  activeTab: activeTabProp,
  onTabChange,
  actions,
  headerContent,
  children
}: WorkPaneProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs?.[0]?.id);

  const activeTab = activeTabProp !== undefined ? activeTabProp : internalActiveTab;

  const handleTabChange = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
    setInternalActiveTab(tabId);
  };

  // Derive the effective active tab. If the current activeTab state is not in the tabs prop,
  // we fall back to the defaultTab or the first tab.
  const effectiveActiveTab = (tabs && tabs.length > 0 && activeTab && tabs.some(t => t.id === activeTab))
    ? activeTab
    : (defaultTab || tabs?.[0]?.id);

  // Keep the state in sync for future clicks or if the component is reused
  useEffect(() => {
    if (tabs && tabs.length > 0) {
      const tabExists = tabs.some((t) => t.id === activeTab);
      if (!activeTab || !tabExists) {
        handleTabChange(defaultTab || tabs[0].id);
      }
    }
  }, [tabs, defaultTab, activeTab]);

  const activeTabContent = tabs?.find((t) => t.id === effectiveActiveTab)?.content;

  return (
    <div className="flex-1 bg-pane-work flex flex-col min-w-0 w-full max-w-full h-full min-h-0">
      {/* Header */}
      <div className="pane-header shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {subtitle && (
            <div className="text-sm text-muted-foreground">
              {typeof subtitle === 'string' ? <p>{subtitle}</p> : subtitle}
            </div>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {headerContent && (
        <div className="px-4 py-3 border-b border-border/50 shrink-0">{headerContent}</div>
      )}

      {/* Tab Bar - only show if tabs are provided */}
      {tabs && tabs.length > 0 && (
        <div className="border-b border-border px-4 flex items-center gap-1 overflow-x-auto scrollbar-thin shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && handleTabChange(tab.id)}
              disabled={tab.disabled}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-[1px] whitespace-nowrap",
                effectiveActiveTab === tab.id
                  ? "text-primary border-primary"
                  : tab.disabled
                    ? "text-muted-foreground/50 border-transparent cursor-not-allowed"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">
          {tabs && tabs.length > 0 ? activeTabContent : children}
        </div>
      </ScrollArea>
    </div>

  );
}
