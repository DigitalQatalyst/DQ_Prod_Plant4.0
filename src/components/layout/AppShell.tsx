import { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { MenuPane } from "./MenuPane";
import { PopPane } from "./PopPane";
import { LayoutProvider } from "@/context/LayoutContext";
import { LayoutContainer } from "./LayoutContainer";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <LayoutProvider>
      <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">

        <TopBar />
        <LayoutContainer
          menu={<MenuPane />}
          pop={<PopPane />}
        >
          <main className="flex-1 flex overflow-hidden w-full min-w-0 h-full">
            {children}
          </main>
        </LayoutContainer>
      </div>
    </LayoutProvider>
  );
}
