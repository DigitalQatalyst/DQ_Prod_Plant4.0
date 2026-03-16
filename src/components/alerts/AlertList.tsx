import { useState, useMemo } from "react";
import { Alert, AlertSeverity, AlertStatus, AlertWithTopology } from "@/types/alert";
import { FeatureAreaId } from "@/types/dashboard";
import { AlertCard } from "./AlertCard";
import {
  filterAlertsByCriteria,
  sortAlerts,
  AlertSortField,
  SortDirection,
  AlertFilterCriteria
} from "@/lib/alertUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertListProps {
  alerts: Alert[] | AlertWithTopology[];
  onStatusChange: (alertId: string, newStatus: AlertStatus) => void;
  isTransmission?: boolean;
}

export function AlertList({ alerts, onStatusChange, isTransmission = false }: AlertListProps) {
  // Sorting state
  const [sortField, setSortField] = useState<AlertSortField>("severity");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Filter state
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity[]>([]);
  const [filterStatus, setFilterStatus] = useState<AlertStatus[]>([]);
  const [filterFeatureArea, setFilterFeatureArea] = useState<FeatureAreaId[]>([]);
  
  // Transmission-specific filter state
  const [filterSubstation, setFilterSubstation] = useState<string[]>([]);
  const [filterFeeder, setFilterFeeder] = useState<string[]>([]);

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === "asc" ? "desc" : "asc");
  };

  // Build filter criteria
  const filterCriteria: AlertFilterCriteria = useMemo(() => {
    const criteria: AlertFilterCriteria = {};
    
    if (filterSeverity.length > 0) {
      criteria.severity = filterSeverity;
    }
    
    if (filterStatus.length > 0) {
      criteria.status = filterStatus;
    }
    
    if (filterFeatureArea.length > 0) {
      criteria.featureArea = filterFeatureArea;
    }
    
    return criteria;
  }, [filterSeverity, filterStatus, filterFeatureArea]);

  // Apply filters and sorting
  const processedAlerts = useMemo(() => {
    // First filter using existing criteria
    let filtered = filterAlertsByCriteria(alerts, filterCriteria);
    
    // Apply transmission-specific filters if enabled
    if (isTransmission) {
      const alertsWithTopology = filtered as AlertWithTopology[];
      
      if (filterSubstation.length > 0) {
        filtered = alertsWithTopology.filter(alert => 
          alert.substationName && filterSubstation.includes(alert.substationName)
        );
      }
      
      if (filterFeeder.length > 0) {
        filtered = alertsWithTopology.filter(alert => 
          alert.feederName && filterFeeder.includes(alert.feederName)
        );
      }
    }
    
    // Then sort
    return sortAlerts(filtered, sortField, sortDirection);
  }, [alerts, filterCriteria, filterSubstation, filterFeeder, isTransmission, sortField, sortDirection]);

  // Check if any filters are active
  const hasActiveFilters = filterSeverity.length > 0 || filterStatus.length > 0 || filterFeatureArea.length > 0 ||
    (isTransmission && (filterSubstation.length > 0 || filterFeeder.length > 0));

  // Clear all filters
  const clearFilters = () => {
    setFilterSeverity([]);
    setFilterStatus([]);
    setFilterFeatureArea([]);
    if (isTransmission) {
      setFilterSubstation([]);
      setFilterFeeder([]);
    }
  };

  // Toggle filter value
  const toggleSeverityFilter = (severity: AlertSeverity) => {
    setFilterSeverity(prev =>
      prev.includes(severity)
        ? prev.filter(s => s !== severity)
        : [...prev, severity]
    );
  };

  const toggleStatusFilter = (status: AlertStatus) => {
    setFilterStatus(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleFeatureAreaFilter = (featureArea: FeatureAreaId) => {
    setFilterFeatureArea(prev =>
      prev.includes(featureArea)
        ? prev.filter(f => f !== featureArea)
        : [...prev, featureArea]
    );
  };

  // Transmission-specific filter toggles
  const toggleSubstationFilter = (substation: string) => {
    setFilterSubstation(prev =>
      prev.includes(substation)
        ? prev.filter(s => s !== substation)
        : [...prev, substation]
    );
  };

  const toggleFeederFilter = (feeder: string) => {
    setFilterFeeder(prev =>
      prev.includes(feeder)
        ? prev.filter(f => f !== feeder)
        : [...prev, feeder]
    );
  };

  // Get unique feature areas from alerts
  const uniqueFeatureAreas = useMemo(() => {
    const areas = new Set(alerts.map(alert => alert.featureArea));
    return Array.from(areas).sort();
  }, [alerts]);

  // Get unique substations and feeders for transmission filtering
  const uniqueSubstations = useMemo(() => {
    if (!isTransmission) return [];
    const alertsWithTopology = alerts as AlertWithTopology[];
    const substations = new Set(
      alertsWithTopology
        .map(alert => alert.substationName)
        .filter(name => name !== undefined) as string[]
    );
    return Array.from(substations).sort();
  }, [alerts, isTransmission]);

  const uniqueFeeders = useMemo(() => {
    if (!isTransmission) return [];
    const alertsWithTopology = alerts as AlertWithTopology[];
    const feeders = new Set(
      alertsWithTopology
        .map(alert => alert.feederName)
        .filter(name => name !== undefined) as string[]
    );
    return Array.from(feeders).sort();
  }, [alerts, isTransmission]);

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div 
        className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-muted/30 p-4 rounded-lg border"
        role="region"
        aria-label="Alert filters and sorting controls"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium text-muted-foreground" id="filter-label">Filters:</span>
          
          {/* Severity Filter Buttons */}
          <div className="flex gap-1" role="group" aria-label="Filter by severity">
            <Button
              variant={filterSeverity.includes("critical") ? "default" : "outline"}
              size="sm"
              onClick={() => toggleSeverityFilter("critical")}
              className={cn(
                "h-7 text-xs",
                filterSeverity.includes("critical") && "bg-destructive hover:bg-destructive/90"
              )}
              aria-pressed={filterSeverity.includes("critical")}
              aria-label="Filter by critical severity"
            >
              Critical
            </Button>
            <Button
              variant={filterSeverity.includes("warning") ? "default" : "outline"}
              size="sm"
              onClick={() => toggleSeverityFilter("warning")}
              className={cn(
                "h-7 text-xs",
                filterSeverity.includes("warning") && "bg-warning hover:bg-warning/90"
              )}
              aria-pressed={filterSeverity.includes("warning")}
              aria-label="Filter by warning severity"
            >
              Warning
            </Button>
            <Button
              variant={filterSeverity.includes("info") ? "default" : "outline"}
              size="sm"
              onClick={() => toggleSeverityFilter("info")}
              className={cn(
                "h-7 text-xs",
                filterSeverity.includes("info") && "bg-blue-500 hover:bg-blue-600"
              )}
              aria-pressed={filterSeverity.includes("info")}
              aria-label="Filter by info severity"
            >
              Info
            </Button>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex gap-1" role="group" aria-label="Filter by status">
            <Button
              variant={filterStatus.includes("open") ? "default" : "outline"}
              size="sm"
              onClick={() => toggleStatusFilter("open")}
              className="h-7 text-xs"
              aria-pressed={filterStatus.includes("open")}
              aria-label="Filter by open status"
            >
              Open
            </Button>
            <Button
              variant={filterStatus.includes("acknowledged") ? "default" : "outline"}
              size="sm"
              onClick={() => toggleStatusFilter("acknowledged")}
              className="h-7 text-xs"
              aria-pressed={filterStatus.includes("acknowledged")}
              aria-label="Filter by acknowledged status"
            >
              Acknowledged
            </Button>
            <Button
              variant={filterStatus.includes("in-progress") ? "default" : "outline"}
              size="sm"
              onClick={() => toggleStatusFilter("in-progress")}
              className="h-7 text-xs"
              aria-pressed={filterStatus.includes("in-progress")}
              aria-label="Filter by in-progress status"
            >
              In Progress
            </Button>
            <Button
              variant={filterStatus.includes("closed") ? "default" : "outline"}
              size="sm"
              onClick={() => toggleStatusFilter("closed")}
              className="h-7 text-xs"
              aria-pressed={filterStatus.includes("closed")}
              aria-label="Filter by closed status"
            >
              Closed
            </Button>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 text-xs"
              aria-label="Clear all filters"
            >
              <X className="h-3 w-3 mr-1" aria-hidden="true" />
              Clear
            </Button>
          )}

          {/* Transmission-specific filters */}
          {isTransmission && (
            <>
              {/* Substation Filter Buttons */}
              {uniqueSubstations.length > 0 && (
                <div className="flex gap-1" role="group" aria-label="Filter by substation">
                  <span className="text-xs font-medium text-muted-foreground">Substations:</span>
                  {uniqueSubstations.slice(0, 3).map((substation) => (
                    <Button
                      key={substation}
                      variant={filterSubstation.includes(substation) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleSubstationFilter(substation)}
                      className="h-7 text-xs"
                      aria-pressed={filterSubstation.includes(substation)}
                      aria-label={`Filter by ${substation} substation`}
                    >
                      {substation}
                    </Button>
                  ))}
                  {uniqueSubstations.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{uniqueSubstations.length - 3} more</span>
                  )}
                </div>
              )}

              {/* Feeder Filter Buttons */}
              {uniqueFeeders.length > 0 && (
                <div className="flex gap-1" role="group" aria-label="Filter by feeder">
                  <span className="text-xs font-medium text-muted-foreground">Feeders:</span>
                  {uniqueFeeders.slice(0, 3).map((feeder) => (
                    <Button
                      key={feeder}
                      variant={filterFeeder.includes(feeder) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleFeederFilter(feeder)}
                      className="h-7 text-xs"
                      aria-pressed={filterFeeder.includes(feeder)}
                      aria-label={`Filter by ${feeder} feeder`}
                    >
                      {feeder}
                    </Button>
                  ))}
                  {uniqueFeeders.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{uniqueFeeders.length - 3} more</span>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2" role="group" aria-label="Sort controls">
          <span className="text-sm font-medium text-muted-foreground" id="sort-label">Sort by:</span>
          <Select 
            value={sortField} 
            onValueChange={(value) => setSortField(value as AlertSortField)}
            aria-labelledby="sort-label"
          >
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="severity">Severity</SelectItem>
              <SelectItem value="createdAt">Created Time</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="featureArea">Feature Area</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSortDirection}
            className="h-8 px-2"
            aria-label={`Sort direction: ${sortDirection === "asc" ? "ascending" : "descending"}. Click to toggle.`}
          >
            <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
            <span className="ml-1 text-xs" aria-hidden="true">{sortDirection === "asc" ? "↑" : "↓"}</span>
          </Button>
        </div>
      </div>

      {/* Feature Area Filter Pills */}
      {uniqueFeatureAreas.length > 1 && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by feature area">
          <span className="text-xs font-medium text-muted-foreground">Feature Areas:</span>
          {uniqueFeatureAreas.map((area) => (
            <Badge
              key={area}
              variant={filterFeatureArea.includes(area) ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => toggleFeatureAreaFilter(area)}
              role="button"
              tabIndex={0}
              aria-pressed={filterFeatureArea.includes(area)}
              aria-label={`Filter by ${area} feature area`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleFeatureAreaFilter(area);
                }
              }}
            >
              {area}
            </Badge>
          ))}
        </div>
      )}

      {/* Results Summary */}
      <div 
        className="flex items-center justify-between text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span>
          Showing {processedAlerts.length} of {alerts.length} alerts
        </span>
        {hasActiveFilters && (
          <span className="text-xs">
            {filterSeverity.length > 0 && `Severity: ${filterSeverity.join(", ")} • `}
            {filterStatus.length > 0 && `Status: ${filterStatus.join(", ")} • `}
            {filterFeatureArea.length > 0 && `Areas: ${filterFeatureArea.join(", ")} • `}
            {isTransmission && filterSubstation.length > 0 && `Substations: ${filterSubstation.join(", ")} • `}
            {isTransmission && filterFeeder.length > 0 && `Feeders: ${filterFeeder.join(", ")}`}
          </span>
        )}
      </div>

      {/* Alert Cards */}
      {processedAlerts.length > 0 ? (
        <div className="space-y-3" role="list" aria-label="Alert list">
          {processedAlerts.map((alert) => (
            <div key={alert.id} role="listitem">
              <AlertCard
                alert={alert}
                onStatusChange={onStatusChange}
                isTransmission={isTransmission}
              />
            </div>
          ))}
        </div>
      ) : (
        // Empty State
        <div 
          className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed rounded-lg"
          role="status"
        >
          <Filter className="h-12 w-12 text-muted-foreground/50 mb-4" aria-hidden="true" />
          <h3 className="text-lg font-semibold mb-2">No alerts found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {hasActiveFilters
              ? "No alerts match your current filters. Try adjusting your filter criteria."
              : "There are no alerts to display."}
          </p>
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              aria-label="Clear all filters"
            >
              Clear all filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
