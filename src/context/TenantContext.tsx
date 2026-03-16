import React, { createContext, useContext, ReactNode } from "react";
import { useApp } from "./AppContext";
import { Tenant } from "@/types/navigation";
import { UpstreamTenant } from "@/types/assets";

interface TenantContextType {
    currentTenant: Tenant | UpstreamTenant;
    setCurrentTenant: (tenant: Tenant | UpstreamTenant) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
    const { currentTenant, setCurrentTenant } = useApp();

    return (
        <TenantContext.Provider value={{ currentTenant, setCurrentTenant }}>
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error("useTenant must be used within a TenantProvider or AppProvider wrapper");
    }
    return context;
}
