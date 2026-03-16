import { ReactNode, useEffect } from "react";
import { useLayout } from "@/context/LayoutContext";
import { PaneResizer } from "./PaneResizer";
import { cn } from "@/lib/utils";

interface LayoutContainerProps {
  menu: ReactNode;
  list?: ReactNode; // Optional
  children: ReactNode;
  pop?: ReactNode; // Optional
}

export function LayoutContainer({
  menu,
  list,
  children,
  pop,
}: LayoutContainerProps) {
  const {
    layoutState,
    setMenuPaneWidth,
    setListPaneWidth,
    setPopPaneWidth,
    isResponsiveMode
  } = useLayout();

  // Sync layout widths with CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--menu-width', `${layoutState.menuPaneWidth}px`);
    document.documentElement.style.setProperty('--list-width', `${layoutState.listPaneWidth}px`);
    document.documentElement.style.setProperty('--pop-width', `${layoutState.popPaneWidth}px`);
  }, [layoutState.menuPaneWidth, layoutState.listPaneWidth, layoutState.popPaneWidth]);

  // Handle mobile layout
  if (isResponsiveMode('mobile')) {
    return (
      <div className="flex flex-col h-full relative overflow-hidden bg-background">
        <main className="flex-1 min-h-0 overflow-auto relative">
          {children}
        </main>
        {/* Pop Pane as Overlay on Mobile */}
        {layoutState.popPaneVisible && pop && (
          <div className="absolute inset-x-0 bottom-0 top-14 bg-background z-50 border-t border-border shadow-2xl animate-in slide-in-from-bottom duration-300">
            {pop}
          </div>
        )}
      </div>
    );
  }

  // Desktop / Tablet Layout
  const mainContentTransition = layoutState.layoutMode === 'desktop' ? 'transition-[grid-template-columns] duration-300 ease-in-out' : '';

  // Calculate columns dynamically
  const getGridColumns = () => {
    const columns = [];

    // Menu Column
    columns.push(layoutState.menuPaneCollapsed ? '64px' : `${layoutState.menuPaneWidth}px`);

    // Menu Separator
    columns.push('1px');

    // List Column (only if provided and NOT collapsed)
    if (list && !layoutState.listPaneCollapsed) {
      columns.push(`${layoutState.listPaneWidth}px`);
      columns.push('1px'); // List Separator
    } else if (list && layoutState.listPaneCollapsed) {
      columns.push('0px');
      columns.push('0px');
    }

    // Work Column
    columns.push('1fr');

    // Pop Column
    if (pop && layoutState.popPaneVisible) {
      columns.push('1px'); // Pop Separator
      columns.push(`${layoutState.popPaneWidth}px`);
    }

    return columns.join(' ');
  };

  const gridTemplateColumns = layoutState.layoutMode === 'desktop'
    ? getGridColumns()
    : `${layoutState.menuPaneCollapsed ? '64px' : '256px'} 1px 1fr`;

  return (
    <div
      className={cn(
        "grid h-full w-full overflow-hidden bg-background",
        mainContentTransition
      )}
      style={{ gridTemplateColumns }}
    >
      {/* Menu Pane */}
      <div className={cn(
        "h-full bg-pane-menu relative shrink-0",
        layoutState.menuPaneCollapsed ? "w-16" : ""
      )}>
        {menu}
        {!layoutState.menuPaneCollapsed && (
          <PaneResizer
            pane="list" // Right-side resize behavior
            currentWidth={layoutState.menuPaneWidth}
            onResize={setMenuPaneWidth}
            minWidth={200}
            maxWidth={400}
            className="absolute right-0 top-0 bottom-0 z-20"
          />
        )}
      </div>

      {/* Menu Separator */}
      <div className="w-[1px] h-full bg-border/40 shrink-0" />

      {/* List Pane */}
      {list && (
        <>
          <div className={cn(
            "h-full bg-pane-list shrink-0 transition-all duration-300 ease-in-out overflow-hidden relative",
            layoutState.listPaneCollapsed ? "w-0 opacity-0" : ""
          )}>
            {list}
            {!layoutState.listPaneCollapsed && (
              <PaneResizer
                pane="list"
                currentWidth={layoutState.listPaneWidth}
                onResize={setListPaneWidth}
                minWidth={280}
                maxWidth={500}
                className="absolute right-0 top-0 bottom-0 z-20"
              />
            )}
          </div>
          {!layoutState.listPaneCollapsed && (
            <div className="w-[1px] h-full bg-border shrink-0" />
          )}
        </>
      )}

      {/* Work Pane (Center) */}
      <div className="flex-1 h-full min-h-0 min-w-0 bg-background overflow-hidden relative">
        {children}
      </div>

      {/* Pop Pane (Right) */}
      {pop && layoutState.popPaneVisible && (
        <>
          <div className="w-[1px] h-full bg-border shrink-0" />
          <div className="h-full bg-pane-pop shrink-0 relative overflow-hidden">
            <PaneResizer
              pane="pop" // Left-side resize behavior
              currentWidth={layoutState.popPaneWidth}
              onResize={setPopPaneWidth}
              minWidth={400}
              maxWidth={600}
              className="absolute left-0 top-0 bottom-0 z-20"
            />
            {pop}
          </div>
        </>
      )}


    </div>
  );
}