import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Asset } from "@/types/navigation";
import { 
  Lightbulb,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Wrench,
  TrendingUp,
  Shield,
  Zap
} from "lucide-react";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: "Maintenance" | "Operations" | "Safety" | "Efficiency" | "Cost";
  priority: "Critical" | "High" | "Medium" | "Low";
  urgency: "Immediate" | "This Week" | "Next Month" | "Next Shutdown";
  estimatedCost: number;
  estimatedSavings?: number;
  downtimeHours?: number;
  riskReduction?: number;
  implementationTime: string;
  assetId: string;
  assetName: string;
  rationale: string;
  status: "New" | "In Progress" | "Completed" | "Deferred";
}

interface RecommendationListProps {
  recommendations: Recommendation[];
  selectedAsset?: Asset | null;
  groupBy?: "priority" | "urgency" | "category";
  showCosts?: boolean;
  maxItems?: number;
  onRecommendationSelect?: (recommendation: Recommendation) => void;
  onCreateWorkOrder?: (recommendation: Recommendation) => void;
}

export function RecommendationList({
  recommendations,
  selectedAsset,
  groupBy = "priority",
  showCosts = true,
  maxItems = 10,
  onRecommendationSelect,
  onCreateWorkOrder,
}: RecommendationListProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "High":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "Medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-muted-foreground bg-secondary border-border";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "Immediate":
        return "text-red-600 bg-red-50 border-red-200";
      case "This Week":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "Next Month":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Next Shutdown":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-muted-foreground bg-secondary border-border";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Maintenance":
        return <Wrench className="w-4 h-4" />;
      case "Operations":
        return <Zap className="w-4 h-4" />;
      case "Safety":
        return <Shield className="w-4 h-4" />;
      case "Efficiency":
        return <TrendingUp className="w-4 h-4" />;
      case "Cost":
        return <DollarSign className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Maintenance":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "Operations":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "Safety":
        return "text-red-600 bg-red-50 border-red-200";
      case "Efficiency":
        return "text-green-600 bg-green-50 border-green-200";
      case "Cost":
        return "text-orange-600 bg-orange-50 border-orange-200";
      default:
        return "text-muted-foreground bg-secondary border-border";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "In Progress":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Completed":
        return "text-green-600 bg-green-50 border-green-200";
      case "Deferred":
        return "text-gray-600 bg-gray-50 border-gray-200";
      default:
        return "text-muted-foreground bg-secondary border-border";
    }
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cost);
  };

  const calculateROI = (cost: number, savings?: number) => {
    if (!savings || cost === 0) return null;
    return ((savings - cost) / cost * 100).toFixed(0);
  };

  // Filter recommendations by selected asset if provided
  const filteredRecommendations = selectedAsset 
    ? recommendations.filter(rec => rec.assetId === selectedAsset.id)
    : recommendations;

  // Group recommendations
  const groupedRecommendations = filteredRecommendations.reduce((groups, rec) => {
    const key = rec[groupBy as keyof Recommendation] as string;
    if (!groups[key]) groups[key] = [];
    groups[key].push(rec);
    return groups;
  }, {} as Record<string, Recommendation[]>);

  // Sort groups by priority/urgency
  const sortedGroups = Object.entries(groupedRecommendations).sort(([a], [b]) => {
    if (groupBy === "priority") {
      const priorityOrder = { "Critical": 0, "High": 1, "Medium": 2, "Low": 3 };
      return (priorityOrder[a as keyof typeof priorityOrder] || 4) - (priorityOrder[b as keyof typeof priorityOrder] || 4);
    } else if (groupBy === "urgency") {
      const urgencyOrder = { "Immediate": 0, "This Week": 1, "Next Month": 2, "Next Shutdown": 3 };
      return (urgencyOrder[a as keyof typeof urgencyOrder] || 4) - (urgencyOrder[b as keyof typeof urgencyOrder] || 4);
    }
    return a.localeCompare(b);
  });

  const displayRecommendations = filteredRecommendations.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Recommendations
            {selectedAsset && (
              <span className="text-xs text-muted-foreground">
                • {selectedAsset.name}
              </span>
            )}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {filteredRecommendations.length} total
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 rounded-lg bg-secondary/30">
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">
              {filteredRecommendations.filter(r => r.priority === "Critical").length}
            </div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {filteredRecommendations.filter(r => r.urgency === "Immediate").length}
            </div>
            <div className="text-xs text-muted-foreground">Immediate</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {formatCost(filteredRecommendations.reduce((sum, r) => sum + (r.estimatedSavings || 0), 0))}
            </div>
            <div className="text-xs text-muted-foreground">Potential Savings</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {filteredRecommendations.filter(r => r.status === "New").length}
            </div>
            <div className="text-xs text-muted-foreground">New</div>
          </div>
        </div>

        {/* Recommendations List */}
        {displayRecommendations.length > 0 ? (
          <div className="space-y-3">
            {sortedGroups.map(([groupName, groupRecs]) => (
              <div key={groupName} className="space-y-2">
                {/* Group Header */}
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {groupName}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {groupRecs.length}
                  </Badge>
                </div>

                {/* Group Items */}
                {groupRecs.slice(0, Math.ceil(maxItems / sortedGroups.length)).map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:bg-secondary/50"
                    onClick={() => onRecommendationSelect?.(rec)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={cn("text-xs", getCategoryColor(rec.category))}>
                            <div className="flex items-center gap-1">
                              {getCategoryIcon(rec.category)}
                              {rec.category}
                            </div>
                          </Badge>
                          <Badge variant="outline" className={cn("text-xs", getPriorityColor(rec.priority))}>
                            {rec.priority}
                          </Badge>
                          <Badge variant="outline" className={cn("text-xs", getUrgencyColor(rec.urgency))}>
                            {rec.urgency}
                          </Badge>
                        </div>
                        
                        <h4 className="text-sm font-medium text-foreground">
                          {rec.title}
                        </h4>
                        
                        <p className="text-xs text-muted-foreground mt-1">
                          {rec.assetName}
                        </p>
                      </div>
                      
                      <Badge variant="outline" className={cn("text-xs", getStatusColor(rec.status))}>
                        {rec.status}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground mb-3">
                      {rec.description}
                    </p>

                    {/* Metrics */}
                    {showCosts && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 p-2 rounded bg-secondary/30">
                        <div className="text-center">
                          <div className="text-xs font-medium text-red-600">
                            {formatCost(rec.estimatedCost)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">Cost</div>
                        </div>
                        
                        {rec.estimatedSavings && (
                          <div className="text-center">
                            <div className="text-xs font-medium text-green-600">
                              {formatCost(rec.estimatedSavings)}
                            </div>
                            <div className="text-[10px] text-muted-foreground">Savings</div>
                          </div>
                        )}
                        
                        {rec.downtimeHours && (
                          <div className="text-center">
                            <div className="text-xs font-medium text-orange-600">
                              {rec.downtimeHours}h
                            </div>
                            <div className="text-[10px] text-muted-foreground">Downtime</div>
                          </div>
                        )}
                        
                        <div className="text-center">
                          <div className="text-xs font-medium text-blue-600">
                            {rec.implementationTime}
                          </div>
                          <div className="text-[10px] text-muted-foreground">Timeline</div>
                        </div>
                      </div>
                    )}

                    {/* ROI and Risk Reduction */}
                    {(rec.estimatedSavings || rec.riskReduction) && (
                      <div className="flex items-center gap-4 mb-3 text-xs">
                        {rec.estimatedSavings && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-green-600" />
                            <span className="text-green-600 font-medium">
                              ROI: {calculateROI(rec.estimatedCost, rec.estimatedSavings)}%
                            </span>
                          </div>
                        )}
                        
                        {rec.riskReduction && (
                          <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-blue-600" />
                            <span className="text-blue-600 font-medium">
                              Risk Reduction: {rec.riskReduction}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rationale */}
                    <div className="mb-3">
                      <h5 className="text-xs font-medium text-muted-foreground mb-1">Rationale:</h5>
                      <p className="text-xs text-muted-foreground">
                        {rec.rationale}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateWorkOrder?.(rec);
                        }}
                      >
                        <Wrench className="w-4 h-4 mr-2" />
                        Create Work Order
                      </Button>
                      <Button size="sm" variant="outline">
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule
                      </Button>
                      {rec.status === "New" && (
                        <Button size="sm" variant="outline">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No recommendations available
          </div>
        )}

        {/* View All Button */}
        {filteredRecommendations.length > maxItems && (
          <div className="pt-2 border-t">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              View All {filteredRecommendations.length} Recommendations
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}