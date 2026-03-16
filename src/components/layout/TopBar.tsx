import { ChevronDown, Layers, User } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectorSelector } from "./SectorSelector";
import { SubsectorSelector } from "./SubsectorSelector";
import { ModeToggle } from "@/components/ui/mode-toggle";

export function TopBar() {
  const { currentTenant, setCurrentTenant, userPersona, setUserPersona, availableOrganizations } = useApp();

  return (
    <header className="h-14 bg-pane-menu border-b border-border flex items-center justify-between px-4 shrink-0">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Plant4.0 Platform</h1>
            <p className="text-[10px] text-muted-foreground">nLVE · Stage 02–04</p>
          </div>
        </div>
      </div>

      {/* Center Section - Tenant & Multi-Stream */}
      <div className="flex items-center gap-3">
        {/* Tenant Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 px-3 gap-2 bg-secondary/50 border-border hover:bg-secondary hover:text-foreground">
              <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                {currentTenant.name.charAt(0)}
              </div>
              <span className="text-sm font-medium">{currentTenant.name}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56 max-h-80 overflow-y-auto scrollbar-thin">
            <DropdownMenuLabel>Select Organization</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableOrganizations.map((tenant) => (
              <DropdownMenuItem
                key={tenant.id}
                onClick={() => setCurrentTenant(tenant)}
                className="flex items-center gap-2 justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                    {tenant.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tenant.name}</p>
                    <p className="text-xs text-muted-foreground">{tenant.industry}</p>
                  </div>
                </div>
                {tenant.sector && tenant.subsector && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{tenant.subsector}</p>
                  </div>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sector Selector */}
        <SectorSelector />

        {/* Subsector Selector */}
        <SubsectorSelector />
      </div>

      {/* Right Section - User & Persona */}
      <div className="flex items-center gap-3">
        {/* Persona Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-2">
              <Badge
                variant="outline"
                className={
                  userPersona.type === "firm"
                    ? "bg-primary/10 text-primary border-primary/30"
                    : userPersona.type === "vendor"
                      ? "bg-accent/10 text-accent border-accent/30"
                      : "bg-warning/10 text-warning border-warning/30"
                }
              >
                {userPersona.label}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Switch Persona</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setUserPersona({ type: "firm", label: "Firm" })}>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 mr-2">
                Firm
              </Badge>
              End Organization
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setUserPersona({ type: "vendor", label: "Vendor" })}>
              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 mr-2">
                Vendor
              </Badge>
              Platform Owner
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setUserPersona({ type: "advisor", label: "Advisor" })}>
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 mr-2">
                Advisor
              </Badge>
              Partner Access
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <ModeToggle />

        {/* User Chip */}
        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium">John Doe</p>
            <p className="text-[10px] text-muted-foreground">Asset Manager</p>
          </div>
        </div>
      </div>
    </header>
  );
}
