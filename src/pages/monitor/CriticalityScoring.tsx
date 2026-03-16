import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Asset } from "@/types/navigation";
import { APMPageShell } from "@/components/apm/APMPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SectorBadge } from "@/components/shared/SectorBadge";
import { 
  Shield, 
  Factory, 
  Leaf, 
  Eye, 
  Target,
  AlertTriangle,
  CheckCircle,
  Calendar,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { criticalityScores } from "@/data/apmUpstreamData";

// Radar chart component (simplified version)
const RadarChart = ({ data, size = 200 }: { data: any; size?: number }) => {
  const center = size / 2;
  const radius = size / 2 - 20;
  const angleStep = (2 * Math.PI) / data.length;
  
  // Generate points for the polygon
  const points = data.map((item: any, index: number) => {
    const angle = index * angleStep - Math.PI / 2; // Start from top
    const value = (item.value / 5) * radius; // Scale to 0-5 range
    const x = center + Math.cos(angle) * value;
    const y = center + Math.sin(angle) * value;
    return `${x},${y}`;
  }).join(' ');
  
  // Generate grid circles
  const gridCircles = [1, 2, 3, 4, 5].map(level => (
    <circle
      key={level}
      cx={center}
      cy={center}
      r={(level / 5) * radius}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      className="text-muted-foreground/20"
    />
  ));
  
  // Generate axis lines
  const axisLines = data.map((item: any, index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const x = center + Math.cos(angle) * radius;
    const y = center + Math.sin(angle) * radius;
    return (
      <line
        key={index}
        x1={center}
        y1={center}
        x2={x}
        y2={y}
        stroke="currentColor"
        strokeWidth="1"
        className="text-muted-foreground/30"
      />
    );
  });
  
  // Generate labels
  const labels = data.map((item: any, index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const labelRadius = radius + 15;
    const x = center + Math.cos(angle) * labelRadius;
    const y = center + Math.sin(angle) * labelRadius;
    return (
      <text
        key={index}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-xs fill-current text-muted-foreground"
      >
        {item.label}
      </text>
    );
  });
  
  return (
    <svg width={size} height={size} className="mx-auto">
      {gridCircles}
      {axisLines}
      <polygon
        points={points}
        fill="rgb(59 130 246 / 0.2)"
        stroke="rgb(59 130 246)"
        strokeWidth="2"
      />
      {labels}
    </svg>
  );
};

const getCriticalityData = (asset: Asset) => {
  // Find criticality data for the asset or generate default
  const criticalityData = criticalityScores.find(score => 
    score.assetId === asset.id || score.assetName.includes(asset.name.split(' ')[0])
  );
  
  if (criticalityData) {
    return criticalityData;
  }
  
  // Generate default criticality based on asset type and criticality level
  const baseScores = {
    "Wellhead": { safety: 5, production: 5, environmental: 4, detectability: 3 },
    "ESP Pump": { safety: 3, production: 5, environmental: 2, detectability: 4 },
    "Gas Compressor": { safety: 4, production: 4, environmental: 3, detectability: 3 },
    "Crude Transfer Pump": { safety: 2, production: 3, environmental: 3, detectability: 4 },
    "Flare KO Drum": { safety: 5, production: 2, environmental: 4, detectability: 2 }
  };
  
  const scores = baseScores[asset.type as keyof typeof baseScores] || 
                 { safety: 3, production: 3, environmental: 3, detectability: 3 };
  
  // Adjust based on asset criticality level
  const multiplier = asset.criticality === "critical" || asset.criticality === "high" ? 1.0 : 
                    asset.criticality === "medium" ? 0.8 : 0.6;
  
  const adjustedScores = {
    safetyImpact: Math.round(scores.safety * multiplier),
    productionImpact: Math.round(scores.production * multiplier),
    environmentalImpact: Math.round(scores.environmental * multiplier),
    detectability: scores.detectability
  };
  
  const overallScore = (adjustedScores.safetyImpact + adjustedScores.productionImpact + 
                       adjustedScores.environmentalImpact) * adjustedScores.detectability * 2;
  
  return {
    assetId: asset.id,
    assetName: asset.name,
    ...adjustedScores,
    overallScore,
    criticalityTier: overallScore >= 70 ? "A" : overallScore >= 40 ? "B" : "C",
    rationale: generateRationale(asset, adjustedScores),
    lastReviewDate: "2024-01-01T00:00:00Z",
    nextReviewDue: "2024-07-01T00:00:00Z"
  };
};

const generateRationale = (asset: Asset, scores: any) => {
  const reasons = [];
  
  if (scores.safetyImpact >= 4) {
    reasons.push("high safety impact due to pressure/hazardous materials");
  }
  if (scores.productionImpact >= 4) {
    reasons.push("critical for production operations");
  }
  if (scores.environmentalImpact >= 4) {
    reasons.push("potential for environmental release");
  }
  if (scores.detectability <= 2) {
    reasons.push("limited detection/monitoring capability");
  }
  
  const baseText = `${asset.type} asset with ${reasons.join(", ")}.`;
  const impactText = scores.safetyImpact >= 4 || scores.productionImpact >= 4 ? 
    " Failure could result in significant operational and safety consequences." : 
    " Moderate impact on operations with manageable consequences.";
  
  return baseText + impactText;
};

const getScoreColor = (score: number, max: number = 5) => {
  const percentage = (score / max) * 100;
  if (percentage >= 80) return "text-red-600 bg-red-50 border-red-200";
  if (percentage >= 60) return "text-orange-600 bg-orange-50 border-orange-200";
  if (percentage >= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200";
  return "text-green-600 bg-green-50 border-green-200";
};

const getTierColor = (tier: string) => {
  switch (tier) {
    case "A": return "bg-red-500 text-white";
    case "B": return "bg-orange-500 text-white";
    case "C": return "bg-green-500 text-white";
    default: return "bg-gray-500 text-white";
  }
};

const getTierDescription = (tier: string) => {
  switch (tier) {
    case "A": return "Critical - Highest priority for maintenance and monitoring";
    case "B": return "Important - Significant impact, regular attention required";
    case "C": return "Standard - Routine maintenance and monitoring sufficient";
    default: return "Unknown criticality level";
  }
};

export function CriticalityScoring() {
  const { assets, selectedAsset, setSelectedAsset, sector, subsector } = useApp();
  const [selectedAssetLocal, setSelectedAssetLocal] = useState<Asset | null>(null);

  const currentAsset = selectedAssetLocal || (selectedAsset as Asset);

  const handleAssetSelection = (asset: Asset) => {
    setSelectedAssetLocal(asset);
    setSelectedAsset(asset);
  };

  const criticalityData = currentAsset ? getCriticalityData(currentAsset) : null;

  // Prepare radar chart data
  const radarData = criticalityData ? [
    { label: "Safety", value: criticalityData.safetyImpact },
    { label: "Production", value: criticalityData.productionImpact },
    { label: "Environmental", value: criticalityData.environmentalImpact },
    { label: "Detectability", value: 6 - criticalityData.detectability } // Invert for display
  ] : [];

  return (
    <APMPageShell
      title="Criticality Scoring"
      featureSetName="Asset Inventory & Criticality"
      featureName="Criticality Scoring"
      listType="assets"
      assets={assets}
      selectedAsset={currentAsset}
      onAssetSelect={handleAssetSelection}
    >
      {currentAsset && criticalityData ? (
        <div className="space-y-6">
          {/* Asset Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold">{currentAsset.name}</h3>
                <StatusBadge status={currentAsset.status} />
                {sector && subsector && <SectorBadge sector={sector} subsector={subsector} />}
                <Badge className={cn("font-semibold", getTierColor(criticalityData.criticalityTier))}>
                  Tier {criticalityData.criticalityTier}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{currentAsset.type}</span>
                <span>•</span>
                <span>{currentAsset.location}</span>
                <span>•</span>
                <span>Overall Score: {criticalityData.overallScore}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Criticality Breakdown - Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Criticality Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <RadarChart data={radarData} size={240} />
                  <div className="text-center">
                    <div className="text-2xl font-bold">{criticalityData.overallScore}</div>
                    <div className="text-sm text-muted-foreground">Overall Criticality Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Impact Scores Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Impact Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Safety Impact */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium">Safety Impact</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20">
                        <Progress value={(criticalityData.safetyImpact / 5) * 100} className="h-2" />
                      </div>
                      <Badge className={cn("text-xs", getScoreColor(criticalityData.safetyImpact))}>
                        {criticalityData.safetyImpact}/5
                      </Badge>
                    </div>
                  </div>

                  {/* Production Impact */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Factory className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Production Impact</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20">
                        <Progress value={(criticalityData.productionImpact / 5) * 100} className="h-2" />
                      </div>
                      <Badge className={cn("text-xs", getScoreColor(criticalityData.productionImpact))}>
                        {criticalityData.productionImpact}/5
                      </Badge>
                    </div>
                  </div>

                  {/* Environmental Impact */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Environmental Impact</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20">
                        <Progress value={(criticalityData.environmentalImpact / 5) * 100} className="h-2" />
                      </div>
                      <Badge className={cn("text-xs", getScoreColor(criticalityData.environmentalImpact))}>
                        {criticalityData.environmentalImpact}/5
                      </Badge>
                    </div>
                  </div>

                  {/* Detectability */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium">Detectability</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20">
                        <Progress value={(criticalityData.detectability / 5) * 100} className="h-2" />
                      </div>
                      <Badge className={cn("text-xs", getScoreColor(criticalityData.detectability))}>
                        {criticalityData.detectability}/5
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Overall Score and Tier */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Overall Score:</span>
                      <span className="text-lg font-bold">{criticalityData.overallScore}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Criticality Tier:</span>
                      <Badge className={cn("font-semibold", getTierColor(criticalityData.criticalityTier))}>
                        Tier {criticalityData.criticalityTier}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getTierDescription(criticalityData.criticalityTier)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Criticality Rationale */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Criticality Rationale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm leading-relaxed">{criticalityData.rationale}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Last Review Date</span>
                    </div>
                    <p className="text-muted-foreground ml-6">
                      {new Date(criticalityData.lastReviewDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Next Review Due</span>
                    </div>
                    <p className="text-muted-foreground ml-6">
                      {new Date(criticalityData.nextReviewDue).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scoring Methodology */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Scoring Methodology
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Impact Factors (1-5 Scale)</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Safety Impact:</span>
                      <span className="text-muted-foreground ml-2">Potential for injury or fatality</span>
                    </div>
                    <div>
                      <span className="font-medium">Production Impact:</span>
                      <span className="text-muted-foreground ml-2">Effect on production capacity</span>
                    </div>
                    <div>
                      <span className="font-medium">Environmental Impact:</span>
                      <span className="text-muted-foreground ml-2">Potential for environmental damage</span>
                    </div>
                    <div>
                      <span className="font-medium">Detectability:</span>
                      <span className="text-muted-foreground ml-2">Ability to detect failure modes</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Criticality Tiers</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className={getTierColor("A")}>A</Badge>
                      <span>Critical (Score &ge; 70) - Highest priority</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getTierColor("B")}>B</Badge>
                      <span>Important (Score 40-69) - Significant impact</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getTierColor("C")}>C</Badge>
                      <span>Standard (Score &lt; 40) - Routine attention</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700">
                      <strong>Formula:</strong> Overall Score = (Safety + Production + Environmental) × Detectability × 2
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Select an asset to view its criticality scoring analysis
        </div>
      )}
    </APMPageShell>
  );
}