import { useState, useEffect } from "react";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { getDataProvider } from "@/lib/data";
import { useApp } from "@/context/AppContext";
import { AdvisorCard } from "@/types/overview";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Filter, Search, ExternalLink } from "lucide-react";
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
 * AdvisorCardsPage
 * Displays AI-driven advisor cards with deep linking to actionable items.
 * 
 * Requirements: Task 7.5
 */
export function AdvisorCardsPage() {
    const { currentTenant } = useApp();
    const navigate = useNavigate();
    const [cards, setCards] = useState<AdvisorCard[]>([]);
    const [filteredCards, setFilteredCards] = useState<AdvisorCard[]>([]);
    const [selectedCard, setSelectedCard] = useState<AdvisorCard | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [severityFilter, setSeverityFilter] = useState<string>("all");

    useEffect(() => {
        async function fetchCards() {
            setIsLoading(true);
            try {
                const provider = getDataProvider();
                const data = await provider.getAdvisorCards(currentTenant.id);

                // Sort by severity (critical > warning > info) then by created date
                const sortedData = [...data].sort((a, b) => {
                    const severityOrder = { critical: 1, warning: 2, info: 3 };
                    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
                    if (severityDiff !== 0) return severityDiff;
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });

                setCards(sortedData);
                setFilteredCards(sortedData);

                if (sortedData.length > 0 && !selectedCard) {
                    setSelectedCard(sortedData[0]);
                }
            } catch (error) {
                console.error("Failed to fetch advisor cards:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchCards();
    }, [currentTenant.id]);

    useEffect(() => {
        let filtered = cards;

        // Apply search filter
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (card) =>
                    card.title.toLowerCase().includes(query) ||
                    card.rationale?.toLowerCase().includes(query) ||
                    card.recommendedAction?.toLowerCase().includes(query)
            );
        }

        // Apply severity filter
        if (severityFilter !== "all") {
            filtered = filtered.filter((card) => card.severity === severityFilter);
        }

        setFilteredCards(filtered);
    }, [searchQuery, severityFilter, cards]);

    const handleDeepLink = (card: AdvisorCard) => {
        if (card.deeplinkPath) {
            navigate(card.deeplinkPath);
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
            id: "details",
            label: "Card Details",
            content: selectedCard ? (
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Advisory</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {selectedCard.title}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Severity:</span>
                        <Badge variant="secondary" className={cn("text-xs capitalize", getSeverityBadgeStyle(selectedCard.severity))}>
                            {selectedCard.severity}
                        </Badge>
                    </div>

                    {selectedCard.rationale && (
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Rationale</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {selectedCard.rationale}
                            </p>
                        </div>
                    )}

                    {selectedCard.recommendedAction && (
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Recommended Action</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {selectedCard.recommendedAction}
                            </p>
                        </div>
                    )}

                    {selectedCard.deeplinkPath && (
                        <div className="pt-4 border-t">
                            <Button
                                onClick={() => handleDeepLink(selectedCard)}
                                variant="default"
                                className="w-full gap-2"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Open in Source
                            </Button>
                        </div>
                    )}

                    {selectedCard.params && Object.keys(selectedCard.params).length > 0 && (
                        <div className="pt-4 border-t">
                            <h4 className="text-sm font-semibold mb-2">Additional Parameters</h4>
                            <div className="bg-muted/50 rounded-lg p-3">
                                <pre className="text-xs overflow-auto">
                                    {JSON.stringify(selectedCard.params, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t text-xs text-muted-foreground">
                        Created: {new Date(selectedCard.createdAt).toLocaleString()}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>Select an advisor card to view details</p>
                </div>
            ),
        },
    ];

    return (
        <div className="flex flex-1 h-full overflow-hidden">
            <ListPane
                title="Advisor Cards"
                subtitle="AI-driven recommendations and insights"
                count={filteredCards.length}
                actions={
                    <div className="flex flex-col gap-2 w-full mt-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search cards..."
                                className="pl-8 h-9 text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select value={severityFilter} onValueChange={setSeverityFilter}>
                                <SelectTrigger className="flex-1 h-8 text-xs">
                                    <SelectValue placeholder="Filter by severity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Severities</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                    <SelectItem value="warning">Warning</SelectItem>
                                    <SelectItem value="info">Info</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                }
            >
                <div className="space-y-2 mt-4">
                    {filteredCards.length > 0 ? (
                        filteredCards.map((card) => (
                            <button
                                key={card.id}
                                onClick={() => setSelectedCard(card)}
                                className={cn(
                                    "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 border",
                                    selectedCard?.id === card.id
                                        ? "bg-primary/5 border-primary/30 shadow-sm"
                                        : "hover:bg-secondary/50 border-transparent"
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-sm",
                                        getSeverityColor(card.severity)
                                    )}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span
                                            className={cn(
                                                "text-sm font-semibold truncate",
                                                selectedCard?.id === card.id
                                                    ? "text-primary"
                                                    : "text-foreground"
                                            )}
                                        >
                                            {card.title}
                                        </span>
                                    </div>
                                    {card.rationale && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                            {card.rationale}
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between mt-3">
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                "text-[9px] h-4 px-1.5 py-0 capitalize",
                                                getSeverityBadgeStyle(card.severity)
                                            )}
                                        >
                                            {card.severity}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground font-medium">
                                            {new Date(card.createdAt).toLocaleDateString([], {
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-10 opacity-50">
                            <p className="text-sm">No advisor cards found</p>
                        </div>
                    )}
                </div>
            </ListPane>
            <WorkPane
                title={selectedCard?.title || "Advisor Card Details"}
                subtitle={
                    selectedCard
                        ? `${selectedCard.severity} severity advisory`
                        : "AI-driven platform insights"
                }
                tabs={tabs}
            />
        </div>
    );
}
