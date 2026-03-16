import { Clock, DollarSign, AlertTriangle, CheckCircle, TrendingUp, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AdvisoryAction {
  id: string;
  title: string;
  description: string;
  timeframe: "Now" | "Next shift" | "Next shutdown" | "Planned maintenance";
  savingsEstimate: number;
  savingsUnit: "kWh/day" | "$/day" | "$/month" | "$/year";
  riskLevel: "Low" | "Medium" | "High";
  confidenceScore: number; // 0-100
  affectedAssets: string[];
  category: "efficiency" | "scheduling" | "maintenance" | "control" | "demand_response" | "grid_optimization" | "load_balancing" | "voltage_regulation" | "loss_reduction";
  status: "new" | "reviewing" | "approved" | "implemented" | "rejected";
  implementationTime?: string;
}

interface AdvisoryActionsListProps {
  actions: AdvisoryAction[];
  onApprove?: (action: AdvisoryAction) => void;
  onReject?: (action: AdvisoryAction) => void;
  onViewDetails?: (action: AdvisoryAction) => void;
  groupByTimeframe?: boolean;
}

export function AdvisoryActionsList({
  actions,
  onApprove,
  onReject,
  onViewDetails,
  groupByTimeframe = true
}: AdvisoryActionsListProps) {
  const timeframes = ["Now", "Next shift", "Next shutdown", "Planned maintenance"];

  const groupedActions = groupByTimeframe
    ? timeframes.reduce((acc, timeframe) => {
      acc[timeframe] = actions.filter(action => action.timeframe === timeframe);
      return acc;
    }, {} as Record<string, AdvisoryAction[]>)
    : { "All Actions": actions };

  const totalSavings = actions.reduce((sum, action) => {
    // Convert all to daily savings for comparison
    let dailySavings = action.savingsEstimate;
    if (action.savingsUnit.includes("month")) dailySavings = action.savingsEstimate / 30;
    if (action.savingsUnit.includes("year")) dailySavings = action.savingsEstimate / 365;
    return sum + dailySavings;
  }, 0);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "efficiency":
        return <TrendingUp className="w-4 h-4 text-success" />;
      case "scheduling":
        return <Clock className="w-4 h-4 text-primary" />;
      case "maintenance":
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "control":
        return <Lightbulb className="w-4 h-4 text-blue-500" />;
      case "demand_response":
        return <DollarSign className="w-4 h-4 text-green-500" />;
      default:
        return <Lightbulb className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRiskVariant = (risk: string) => {
    switch (risk) {
      case "Low":
        return "default" as const;
      case "Medium":
        return "secondary" as const;
      case "High":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "new":
        return "secondary" as const;
      case "reviewing":
        return "secondary" as const;
      case "approved":
        return "default" as const;
      case "implemented":
        return "default" as const;
      case "rejected":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          AI Optimization Recommendations
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <p className="text-2xl font-bold text-foreground">{actions.length}</p>
            <p className="text-sm text-muted-foreground">Total Recommendations</p>
          </div>
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <p className="text-2xl font-bold text-success">${totalSavings.toFixed(0)}</p>
            <p className="text-sm text-muted-foreground">Daily Savings Potential</p>
          </div>
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <p className="text-2xl font-bold text-primary">
              {actions.filter(a => a.timeframe === "Now").length}
            </p>
            <p className="text-sm text-muted-foreground">Immediate Actions</p>
          </div>
        </div>
      </div>

      {/* Actions by Timeframe */}
      {Object.entries(groupedActions).map(([timeframe, timeframeActions]) => {
        if (timeframeActions.length === 0) return null;

        return (
          <div key={timeframe} className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <h4 className="text-md font-semibold">{timeframe}</h4>
              <Badge variant="outline">{timeframeActions.length} actions</Badge>
            </div>

            <div className="space-y-3">
              {timeframeActions.map((action) => (
                <div key={action.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getCategoryIcon(action.category)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="font-medium">{action.title}</h5>
                          <Badge variant={getRiskVariant(action.riskLevel)}>
                            {action.riskLevel} Risk
                          </Badge>
                          <Badge variant={getStatusVariant(action.status)}>
                            {action.status.charAt(0).toUpperCase() + action.status.slice(1)}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">{action.description}</p>

                        <div className="flex items-center gap-4 text-sm mb-3">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-success" />
                            <span className="font-medium">
                              {action.savingsEstimate.toFixed(0)} {action.savingsUnit}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-primary" />
                            <span>{action.confidenceScore}% confidence</span>
                          </div>
                          {action.implementationTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>{action.implementationTime}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Affected assets:</span>
                          {action.affectedAssets.slice(0, 3).map((asset, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {asset}
                            </Badge>
                          ))}
                          {action.affectedAssets.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{action.affectedAssets.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {action.status === "new" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewDetails?.(action)}
                          >
                            Details
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onReject?.(action)}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => onApprove?.(action)}
                          >
                            Approve
                          </Button>
                        </>
                      )}
                      {action.status === "approved" && (
                        <Button size="sm" variant="outline">
                          Implement
                        </Button>
                      )}
                      {action.status === "implemented" && (
                        <Badge variant="default">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Done
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Implementation Timeline */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-semibold mb-4">Implementation Timeline</h4>
        <div className="space-y-3">
          {timeframes.map((timeframe) => {
            const timeframeActions = actions.filter(a => a.timeframe === timeframe);
            const timeframeSavings = timeframeActions.reduce((sum, action) => {
              let dailySavings = action.savingsEstimate;
              if (action.savingsUnit.includes("month")) dailySavings = action.savingsEstimate / 30;
              if (action.savingsUnit.includes("year")) dailySavings = action.savingsEstimate / 365;
              return sum + dailySavings;
            }, 0);

            if (timeframeActions.length === 0) return null;

            return (
              <div key={timeframe} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{timeframe}</p>
                  <p className="text-xs text-muted-foreground">
                    {timeframeActions.length} actions available
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-success">
                    ${timeframeSavings.toFixed(0)}/day
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Potential savings
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}