import React, { createContext, useContext, ReactNode, useMemo } from "react";
import { getDataProvider, type DataProvider } from "@/lib/data";

const DataProviderContext = createContext<DataProvider | undefined>(undefined);

export function DataProviderProvider({ children }: { children: ReactNode }) {
    const provider = useMemo(() => getDataProvider(), []);

    return (
        <DataProviderContext.Provider value={provider}>
            {children}
        </DataProviderContext.Provider>
    );
}

export function useDataProvider() {
    const context = useContext(DataProviderContext);
    if (context === undefined) {
        throw new Error("useDataProvider must be used within a DataProviderProvider");
    }
    return context;
}
