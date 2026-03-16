import { useEffect, useMemo, useState } from "react";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { getDataProvider } from "@/lib/data";
import { useApp } from "@/context/AppContext";
import { PlatformHealthFinding, Severity } from "@/types/overview";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, Info, Search } from "lucide-react";
import { PlatformHealthFindingDetailPage } from "./PlatformHealthFindingDetailPage";

const severityOrder: Severity[] = ["critical", "warning", "info"];

const severityStyles = {
  critical: "bg-red-500/10 text-red-600 border-red-200",
  warning: "bg-orange-500/10 text-orange-600 border-orange-200",
  info: "bg-blue-500/10 text-blue-600 border-blue-200"
} as const;

const severityDot = {
  critical: "bg-red-500 shadow-red-200",
  warning: "bg-orange-500 shadow-orange-200",
  info: "bg-blue-500 shadow-blue-200"
} as const;

const severityIcons = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info
} as const;

const formatTimestamp = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : "N/A";

/**
 * PlatformHealthFindingsPage
 * List of platform health findings with severity filtering (nLVE pattern).
 */
export function PlatformHealthFindingsPage() {
  const { currentTenant } = useApp();
  const [findings, setFindings] = useState<PlatformHealthFinding[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<PlatformHealthFinding | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"all" | Severity>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFindings() {
      setIsLoading(true);
      try {
        const provider = getDataProvider();
        const data = await provider.getPlatformHealthFindings(currentTenant.id);
        const sorted = [...data].sort((a, b) => {
          const severityIndex = severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
          if (severityIndex !== 0) return severityIndex;
          return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
        });
        setFindings(sorted);
        if (sorted.length > 0) {
          setSelectedFinding(prev => prev ?? sorted[0]);
        }
      } catch (error) {
        console.error("Failed to fetch platform health findings:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFindings();
  }, [currentTenant.id]);

  const filteredFindings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return findings.filter((finding) => {
      const matchesSeverity = severityFilter === "all" || finding.severity === severityFilter;
      if (!matchesSeverity) return false;
      if (!query) return true;
      return (
        finding.checkKey.toLowerCase().includes(query) ||
        finding.id.toLowerCase().includes(query)
      );
    });
  }, [findings, searchQuery, severityFilter]);

  const tabs = [
    {
      id: "details",
      label: "Finding Details",
      content: selectedFinding ? (
        <PlatformHealthFindingDetailPage finding={selectedFinding} />
      ) : (
        <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground border-2 border-dashed rounded-lg">
          <p>Select a health finding to view details</p>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <ListPane
        title="Platform Health"
        subtitle="Active health findings"
        count={filteredFindings.length}
        actions={
          <div className="flex flex-col gap-2 w-full mt-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search findings..."
                className="pl-8 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={severityFilter === "all" ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setSeverityFilter("all")}
              >
                All
              </Button>
              {severityOrder.map((severity) => (
                <Button
                  key={severity}
                  variant={severityFilter === severity ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs capitalize"
                  onClick={() => setSeverityFilter(severity)}
                >
                  {severity}
                </Button>
              ))}
            </div>
          </div>
        }
      >
        <div className="space-y-2 mt-4">
          {isLoading ? (
            <div className="text-center py-10 opacity-50">
              <p className="text-sm">Loading findings...</p>
            </div>
          ) : filteredFindings.length > 0 ? (
            filteredFindings.map((finding) => {
              const SeverityIcon = severityIcons[finding.severity];
              return (
                <button
                  key={finding.id}
                  onClick={() => setSelectedFinding(finding)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 border",
                    selectedFinding?.id === finding.id
                      ? "bg-primary/5 border-primary/30 shadow-sm"
                      : "hover:bg-secondary/50 border-transparent"
                  )}
                >
                  <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-sm", severityDot[finding.severity])} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        "text-sm font-semibold truncate",
                        selectedFinding?.id === finding.id ? "text-primary" : "text-foreground"
                      )}>
                        {finding.checkKey}
                      </span>
                      <SeverityIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      Last seen {formatTimestamp(finding.lastSeen)}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 py-0 capitalize", severityStyles[finding.severity])}>
                        {finding.severity}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {finding.status}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center py-10 opacity-50">
              <p className="text-sm">No health findings found</p>
            </div>
          )}
        </div>
      </ListPane>
      <WorkPane
        title={selectedFinding?.checkKey || "Health Finding Details"}
        subtitle={selectedFinding ? `${selectedFinding.severity} severity` : "Platform health diagnostics"}
        tabs={tabs}
      />
    </div>
  );
}