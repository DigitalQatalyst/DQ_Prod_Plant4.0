import { Leaf, Zap, Flame, Droplets } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CarbonEmission {
  scope: "Scope 1" | "Scope 2";
  source: string;
  energyType: "electricity" | "gas" | "diesel" | "steam";
  consumption: number;
  consumptionUnit: string;
  emissionFactor: number;
  co2Kg: number;
  co2PerBBL?: number;
  percentage: number;
}

interface CarbonBreakdownTableProps {
  emissions: CarbonEmission[];
  productionBBL?: number;
  title?: string;
}

export function CarbonBreakdownTable({ 
  emissions, 
  productionBBL, 
  title = "Carbon Emissions Breakdown" 
}: CarbonBreakdownTableProps) {
  const totalCO2 = emissions.reduce((sum, emission) => sum + emission.co2Kg, 0);
  const scope1Total = emissions.filter(e => e.scope === "Scope 1").reduce((sum, e) => sum + e.co2Kg, 0);
  const scope2Total = emissions.filter(e => e.scope === "Scope 2").reduce((sum, e) => sum + e.co2Kg, 0);

  const getEnergyTypeIcon = (type: string) => {
    switch (type) {
      case "electricity":
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case "gas":
        return <Flame className="w-4 h-4 text-orange-500" />;
      case "diesel":
        return <Droplets className="w-4 h-4 text-blue-500" />;
      case "steam":
        return <Droplets className="w-4 h-4 text-gray-500" />;
      default:
        return <Leaf className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <Leaf className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{totalCO2.toFixed(1)}</p>
          <p className="text-sm text-muted-foreground">Total CO₂ (kg/day)</p>
          {productionBBL && (
            <p className="text-xs text-muted-foreground mt-1">
              {(totalCO2 / productionBBL).toFixed(2)} kg/BBL
            </p>
          )}
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-orange-500 font-bold text-sm">1</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{scope1Total.toFixed(1)}</p>
          <p className="text-sm text-muted-foreground">Scope 1 (kg/day)</p>
          <p className="text-xs text-muted-foreground mt-1">
            {((scope1Total / totalCO2) * 100).toFixed(1)}% of total
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-blue-500 font-bold text-sm">2</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{scope2Total.toFixed(1)}</p>
          <p className="text-sm text-muted-foreground">Scope 2 (kg/day)</p>
          <p className="text-xs text-muted-foreground mt-1">
            {((scope2Total / totalCO2) * 100).toFixed(1)}% of total
          </p>
        </div>
      </div>

      {/* Detailed Breakdown Table */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2">Scope</th>
                <th className="text-left py-3 px-2">Source</th>
                <th className="text-left py-3 px-2">Energy Type</th>
                <th className="text-right py-3 px-2">Consumption</th>
                <th className="text-right py-3 px-2">Emission Factor</th>
                <th className="text-right py-3 px-2">CO₂ (kg/day)</th>
                <th className="text-right py-3 px-2">% of Total</th>
                {productionBBL && <th className="text-right py-3 px-2">kg/BBL</th>}
              </tr>
            </thead>
            <tbody>
              {emissions.map((emission, index) => (
                <tr key={index} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="py-3 px-2">
                    <Badge variant={emission.scope === "Scope 1" ? "warning" : "default"}>
                      {emission.scope}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 font-medium">{emission.source}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      {getEnergyTypeIcon(emission.energyType)}
                      <span className="capitalize">{emission.energyType}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    {emission.consumption.toFixed(1)} {emission.consumptionUnit}
                  </td>
                  <td className="py-3 px-2 text-right text-muted-foreground">
                    {emission.emissionFactor.toFixed(3)}
                  </td>
                  <td className="py-3 px-2 text-right font-medium">
                    {emission.co2Kg.toFixed(1)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <Badge variant="outline">
                      {emission.percentage.toFixed(1)}%
                    </Badge>
                  </td>
                  {productionBBL && (
                    <td className="py-3 px-2 text-right text-muted-foreground">
                      {emission.co2PerBBL?.toFixed(3) || "-"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Production Context */}
      {productionBBL && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-md font-semibold mb-4">Production Context</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-secondary/30 rounded-lg">
              <p className="text-xl font-bold text-foreground">{productionBBL.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground">BBL/day Production</p>
            </div>
            <div className="text-center p-3 bg-secondary/30 rounded-lg">
              <p className="text-xl font-bold text-foreground">
                {(totalCO2 / productionBBL).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">kg CO₂/BBL Intensity</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}