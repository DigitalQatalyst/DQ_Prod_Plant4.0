import { useState, useEffect } from "react";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { getDataProvider } from "@/lib/data";
import { useApp } from "@/context/AppContext";
import { AdvisorCard } from "@/types/overview";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search, ExternalLink, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

/**
 * RecommendedActionsPage
 * Displays actionable recommendations from advisor cards.
 * 
 * Requirements: Task 7.5
 */
export function RecommendedActionsPage() {
    const { currentTenant } = useApp();
    const navigate = useNavigate();
    const [actions, setActions] = useState<AdvisorCard[]>([]);
    const [filteredActions, setFilteredActions] = useState<AdvisorCard[]>([]);
    const [selectedAction, setSelectedAction] = useState<AdvisorCard | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [severityFilter, setSeverityFilter] = useState<string>("all");

    useEffect(() => {
        async function fetchActions() {
            setIsLoading(true);
            try {
                const provider = getDataProvider();
                const allCards = await provider.getAdvisorCards(currentTenant.id);

                // Filter to only cards with recommended actions
                const actionableCards = allCards.filter(
                    (card) => card.recommendedAction && card.recommendedAction.trim() !== ""
                );

                // Sort by severity (critical > warning > info) then by created date
                const sortedData = [...actionableCards].sort((a, b) => {
                    const severityOrder = { critical: 1, warning: 2, info: 3 };
                    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
                    if (severityDiff !== 0) return severityDiff;
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });

                setActions(sortedData);
                setFilteredActions(sortedData);

                if (sortedData.length > 0 && !selectedAction) {
                    setSelectedAction(sortedData[0]);
                }
            } catch (error) {
                console.error("Failed to fetch recommended actions:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchActions();
    }, [currentTenant.id]);

    useEffect(() => {
        let filtered = actions;

        // Apply search filter
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (action) =>
                    action.title.toLowerCase().includes(query) ||
                    action.recommendedAction?.toLowerCase().includes(query)
            );
        }

        // Apply severity filter
        if (severityFilter !== "all") {
            filtered = filtered.filter((action) => action.severity === severityFilter);
        }

        setFilteredActions(filtered);
    }, [searchQuery, severityFilter, actions]);

    const handleTakeAction = (action: AdvisorCard) => {
        if (action.deeplinkPath) {
            navigate(action.deeplinkPath);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "critical":
                return "bg-red-500 shadow-red-200";
            case "warning":
                return "bg-orange-500 shadow-orange-200";
            case "info":
                return "bg-blue-500 shadow-blue-200";
            default:
                return "bg-gray-500 shadow-gray-200";
        }
    };

    const getSeverityBadgeStyle = (severity: string) => {
        switch (severity) {
            case "critical":
                return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
            case "warning":
                return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
            case "info":
                return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
        }
    };

    const tabs = [
        {
            id: "action",
            label: "Recommended Action",
            content: selectedAction ? (
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Action Required</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {selectedAction.title}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Priority:</span>
                        <Badge
                            variant="secondary"
                            className={cn("text-xs capitalize", getSeverityBadgeStyle(selectedAction.severity))}
                        >
                            {selectedAction.severity}
                        </Badge>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                            <div>
                                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                    Recommended Action
                                </h4>
                                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                                    {selectedAction.recommendedAction}
                                </p>
                            </div>
                        </div>
                    </div>

                    {selectedAction.rationale && (
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Context & Rationale</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {selectedAction.rationale}
                            </p>
                        </div>
                    )}

                    {selectedAction.deeplinkPath && (
                        <div className="pt-4 border-t">
                            <Button
                                onClick={() => handleTakeAction(selectedAction)}
                                variant="default"
                                size="lg"
                                className="w-full gap-2"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Take Action
                            </Button>
                            <p className="text-xs text-muted-foreground text-center mt-2">
                                Opens the relevant page to implement this recommendation
                            </p>
                        </div>
                    )}

                    <div className="pt-4 border-t text-xs text-muted-foreground">
                        Recommended on: {new Date(selectedAction.createdAt).toLocaleString()}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>Select a recommendation to view action details</p>
                </div>
            ),
        },
    ];

    // Group actions by severity for statistics
    const criticalCount = filteredActions.filter((a) => a.severity === "critical").length;
    const warningCount = filteredActions.filter((a) => a.severity === "warning").length;
    const infoCount = filteredActions.filter((a) => a.severity === "info").length;

    return (
        <div className="flex flex-1 h-full overflow-hidden">
            <ListPane
                title="Recommended Actions"
                subtitle="Actionable insights from advisor cards"
                count={filteredActions.length}
                actions={
                    <div className="flex flex-col gap-2 w-full mt-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search actions..."
                                className="pl-8 h-9 text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select value={severityFilter} onValueChange={setSeverityFilter}>
                                <SelectTrigger className="flex-1 h-8 text-xs">
                                    <SelectValue placeholder="Filter by priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Priorities</SelectItem>
                                    <SelectItem value="critical">Critical ({criticalCount})</SelectItem>
                                    <SelectItem value="warning">Warning ({warningCount})</SelectItem>
                                    <SelectItem value="info">Info ({infoCount})</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                }
            >
                <div className="space-y-2 mt-4">
                    {filteredActions.length > 0 ? (
                        filteredActions.map((action) => (
                            <button
                                key={action.id}
                                onClick={() => setSelectedAction(action)}
                                className={cn(
                                    "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 border",
                                    selectedAction?.id === action.id
                                        ? "bg-primary/5 border-primary/30 shadow-sm"
                                        : "hover:bg-secondary/50 border-transparent"
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-sm",
                                        getSeverityColor(action.severity)
                                    )}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span
                                            className={cn(
                                                "text-sm font-semibold truncate",
                                                selectedAction?.id === action.id
                                                    ? "text-primary"
                                                    : "text-foreground"
                                            )}
                                        >
                                            {action.title}
                                        </span>
                                    </div>
                                    {action.recommendedAction && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                            {action.recommendedAction}
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "text-[9px] h-4 px-1.5 py-0 capitalize",
                                                    getSeverityBadgeStyle(action.severity)
                                                )}
                                            >
                                                {action.severity}
                                            </Badge>
                                            {action.deeplinkPath && (
                                                <Badge variant="outline" className="text-[9px] h-4 px-1.5 py-0">
                                                    Actionable
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-medium">
                                            {new Date(action.createdAt).toLocaleDateString([], {
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-10 opacity-50 space-y-2">
                            <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground/30" />
                            <p className="text-sm font-medium">No recommended actions</p>
                            <p className="text-xs text-muted-foreground">
                                All advisor recommendations have been addressed
                            </p>
                        </div>
                    )}
                </div>
            </ListPane>
            <WorkPane
                title={selectedAction?.title || "Action Details"}
                subtitle={
                    selectedAction
                        ? `${selectedAction.severity} priority recommendation`
                        : "AI-driven actionable insights"
                }
                tabs={tabs}
            />
        </div>
    );
}
