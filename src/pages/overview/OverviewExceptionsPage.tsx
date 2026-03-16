import { useState, useEffect } from "react";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { getDataProvider } from "@/lib/data";
import { useApp } from "@/context/AppContext";
import { OverviewException } from "@/types/overview";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search, Info, AlertTriangle, AlertCircle, Cpu, Database, Activity } from "lucide-react";
import { OverviewExceptionDetailPage } from "./OverviewExceptionDetailPage";
import { Input } from "@/components/ui/input";

/**
 * OverviewExceptionsPage
 * List of system exceptions and anomalies using the nLVE pattern.
 * 
 * Requirements: 12.1, 14.3
 */
export function OverviewExceptionsPage() {
    const { currentTenant } = useApp();
    const [exceptions, setExceptions] = useState<OverviewException[]>([]);
    const [filteredExceptions, setFilteredExceptions] = useState<OverviewException[]>([]);
    const [selectedException, setSelectedException] = useState<OverviewException | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function fetchExceptions() {
            setIsLoading(true);
            try {
                const provider = getDataProvider();
                const data = await provider.getOverviewExceptions(currentTenant.id);

                // Sort by date descending
                const sortedData = [...data].sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

                setExceptions(sortedData);
                setFilteredExceptions(sortedData);

                if (sortedData.length > 0 && !selectedException) {
                    setSelectedException(sortedData[0]);
                }
            } catch (error) {
                console.error("Failed to fetch exceptions:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchExceptions();
    }, [currentTenant.id]);

    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredExceptions(exceptions);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = exceptions.filter(
                (ex) =>
                    ex.title.toLowerCase().includes(query) ||
                    ex.exceptionType.toLowerCase().includes(query) ||
                    (ex.description?.toLowerCase().includes(query))
            );
            setFilteredExceptions(filtered);
        }
    }, [searchQuery, exceptions]);

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'AI': return Cpu;
            case 'DATA': return Database;
            default: return Activity;
        }
    };

    const tabs = [
        {
            id: "details",
            label: "Exception Details",
            content: selectedException ? (
                <OverviewExceptionDetailPage exception={selectedException} />
            ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>Select an exception to view technical details</p>
                </div>
            ),
        },
    ];

    return (
        <div className="flex flex-1 h-full overflow-hidden">
            <ListPane
                title="Exceptions"
                subtitle="Platform anomalies & failures"
                count={filteredExceptions.length}
                actions={
                    <div className="relative w-full mt-2">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search exceptions..."
                            className="pl-8 h-9 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                }
            >
                <div className="space-y-2 mt-4">
                    {filteredExceptions.length > 0 ? (
                        filteredExceptions.map((ex) => {
                            const TypeIcon = getTypeIcon(ex.exceptionType);
                            return (
                                <button
                                    key={ex.id}
                                    onClick={() => setSelectedException(ex)}
                                    className={cn(
                                        "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 border",
                                        selectedException?.id === ex.id
                                            ? "bg-primary/5 border-primary/30 shadow-sm"
                                            : "hover:bg-secondary/50 border-transparent"
                                    )}
                                >
                                    <div className={cn(
                                        "p-2 rounded-lg shrink-0",
                                        selectedException?.id === ex.id ? "bg-primary/20" : "bg-muted"
                                    )}>
                                        <TypeIcon className={cn(
                                            "w-4 h-4",
                                            selectedException?.id === ex.id ? "text-primary" : "text-muted-foreground"
                                        )} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={cn(
                                                "text-sm font-semibold truncate",
                                                selectedException?.id === ex.id ? "text-primary" : "text-foreground"
                                            )}>
                                                {ex.title}
                                            </span>
                                            {getSeverityIcon(ex.severity)}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{ex.exceptionType}</span>
                                            <span className="text-[10px] text-muted-foreground">•</span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(ex.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="mt-3">
                                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 py-0 capitalize opacity-80">
                                                {ex.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <div className="text-center py-10 opacity-50">
                            <p className="text-sm">No exceptions found</p>
                        </div>
                    )}
                </div>
            </ListPane>
            <WorkPane
                title={selectedException?.title || "Exception Insights"}
                subtitle={selectedException ? `${selectedException.exceptionType} Exception` : "Deep-dive into platform anomalies"}
                tabs={tabs}
            />
        </div>
    );
}
