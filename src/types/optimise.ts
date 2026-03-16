// TypeScript interfaces for Optimise feature data models with cognitive navigation patterns

// Cognitive Navigation Pattern Types
export type CognitivePattern = 'analytical' | 'operational' | 'project' | 'decision';

export type ListTemplate = 'dashboard' | 'alert' | 'task' | 'kanban' | 'report' | 'analytics' | 'simulation' | 'list';

export type WorkPaneType = 'multi-tab-analytical' | 'structured-workflow' | 'project-lifecycle' | 'decision-workflow';

// Navigation Structure for Cognitive Patterns
export interface OptimiseNavigationStructure {
  performance: {
    cognitivePattern: 'analytical';
    hasSubItems: false;
    listTemplate: 'dashboard';
    workPaneType: 'multi-tab-analytical';
  };
  leanExecution: {
    cognitivePattern: 'operational';
    hasSubItems: true;
    subItems: ['simBoards', 'shiftPerformance', 'issues', 'actions'];
    listTemplates: {
      simBoards: 'dashboard';
      shiftPerformance: 'dashboard';
      issues: 'alert';
      actions: 'task';
    };
  };
  continuousImprovement: {
    cognitivePattern: 'project';
    hasSubItems: true;
    subItems: ['ciProjects', 'rca', 'countermeasures', 'impactTracking', 'ciReports'];
    listTemplates: {
      ciProjects: 'kanban';
      rca: 'list';
      countermeasures: 'list';
      impactTracking: 'list';
      ciReports: 'report';
    };
  };
  optimisation: {
    cognitivePattern: 'decision';
    hasSubItems: true;
    subItems: ['opportunities', 'recommendations', 'playbooks', 'simulations', 'execution'];
    listTemplates: {
      opportunities: 'analytics';
      recommendations: 'analytics';
      playbooks: 'list';
      simulations: 'simulation';
      execution: 'list';
    };
  };
}

// Cognitive Pattern Metadata
export interface CognitivePatternMetadata {
  pattern: CognitivePattern;
  description: string;
  navigationDepth: 'single' | 'multi';
  workflowType: 'analytical' | 'operational' | 'project' | 'decision';
  templateStrategy: 'consolidated' | 'separated';
}

// Enhanced Performance Panel with Analytical Workspace Support
export interface PerformancePanel {
  id: string;
  name: string;
  type: 'line' | 'asset' | 'area' | 'plant' | 'custom';
  asset: string;
  site: string;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  lastUpdated: string;
  sector?: string;
  subsector?: string;
  // Analytical workspace data
  oeeMetrics: OEEMetrics;
  lossCategories: LossCategory[];
  bottlenecks: Bottleneck[];
  trends: TrendData[];
  benchmarks: BenchmarkData[];
}

export interface OEEMetrics {
  availability: number;
  performance: number;
  quality: number;
  overall: number;
  target: number;
  variance: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface LossCategory {
  id: string;
  category: string;
  subcategory: string;
  duration: number; // minutes
  frequency: number;
  impact: number; // percentage
  rootCause: string;
  trend: 'improving' | 'stable' | 'worsening';
}

export interface TrendData {
  id: string;
  metric: string;
  timeframe: 'hourly' | 'daily' | 'weekly' | 'monthly';
  dataPoints: {
    timestamp: string;
    value: number;
    target?: number;
  }[];
  trend: 'improving' | 'stable' | 'declining';
  variance: number;
}

export interface BenchmarkData {
  id: string;
  metric: string;
  current: number;
  target: number;
  industryAverage: number;
  bestInClass: number;
  peerComparison: number;
  performanceGap: number;
}

// Oil & Gas - Upstream specific interfaces
export interface UpstreamPerformancePanel extends PerformancePanel {
  sector: "Oil & Gas";
  subsector: "Upstream";
  wellUptime: number;
  plannedProduction: number; // barrels per day
  actualProduction: number; // barrels per day
  energyPerBarrel: number; // kWh per barrel
  flowAssuranceStatus: "stable" | "deviation" | "critical";
  defermentHours: number;
  energyIntensity: number; // kWh per MSCF
  wellCount: number;
  activeWells: number;
}

export interface WellDeferment {
  wellId: string;
  wellName: string;
  padName: string;
  fieldName: string;
  defermentType: string;
  duration: number; // hours
  impact: number; // barrels lost
  status: "active" | "resolved";
  rootCause: string;
  timestamp: string;
}

export interface ProductionTrainBottleneck {
  trainId: string;
  trainName: string;
  bottleneckType: "separator-capacity" | "trunkline-throughput" | "gathering-system";
  severity: "high" | "medium" | "low";
  throughputImpact: number; // percentage
  pressureReading: number; // psi
  temperatureReading: number; // degrees F
  flowRate: number; // barrels per day
}

export interface UpstreamEnergyMetrics {
  kwhPerBarrel: number;
  kwhPerMSCF: number;
  totalEnergyConsumption: number; // kWh
  energyEfficiencyTrend: "improving" | "stable" | "declining";
}

// Power - Transmission specific interfaces
export interface TransmissionPerformancePanel extends PerformancePanel {
  sector: "Power";
  subsector: "Transmission";
  lineLoading: number; // percentage
  transformerLoading: number; // percentage
  transmissionLosses: number; // percentage
  saidi: number; // minutes
  saifi: number; // interruptions per customer
  tripCount: number;
  networkConstraints: number;
  congestionLevel: number; // percentage
}

export interface RelayMisoperation {
  relayId: string;
  relayName: string;
  location: string;
  misoperationType: "false-trip" | "failure-to-trip" | "slow-trip";
  timestamp: string;
  impact: string;
  status: "investigating" | "resolved";
  faultType: string;
  voltageLevel: number; // kV
}

export interface NetworkConstraint {
  constraintId: string;
  constraintName?: string; // Added for backward compatibility
  location: string;
  constraintType: "thermal" | "voltage" | "stability";
  severity: "high" | "medium" | "low";
  congestionLevel: number; // percentage
  loadingMW: number;
  voltageStability: number; // percentage
  thermalLimit: number; // MW
}

export interface TransmissionLossMetrics {
  lineLosses: number; // percentage
  transformerLosses: number; // percentage
  systemEfficiency: number; // percentage
  totalLossMW: number;
}

// FMCG - Food & Beverage specific interfaces
export interface FMCGPerformancePanel extends PerformancePanel {
  sector: "FMCG";
  subsector: "Food & Beverage";
  lineOEE: number;
  changeoverEfficiency: number;
  packagingYield: number;
  batchYield: number;
  scrapRate: number;
  microStopFrequency: number;
  fillingAccuracy: number; // percentage
  labelingAccuracy: number; // percentage
  wastePercentage: number;
}

export interface ChangeoverAnalysis {
  lineId: string;
  lineName: string;
  fromSKU: string;
  toSKU: string;
  changeoverTime?: number; // Added for backward compatibility
  targetTime?: number; // Added for backward compatibility
  plannedDuration: number; // minutes
  actualDuration: number; // minutes
  efficiency: number; // percentage
  setupTime: number; // minutes
  cleaningTime: number; // minutes
  materialChangeTime: number; // minutes
  wasteGenerated: number; // units
}

export interface PackagingYield {
  lineId?: string; // Added for backward compatibility
  lineName?: string; // Added for backward compatibility
  materialType: string;
  plannedUsage: number;
  actualUsage: number;
  yieldPercentage: number;
  targetYield?: number; // Added for backward compatibility
  wasteAmount: number;
  costImpact: number;
  rootCauseCategory: string;
}

export interface BatchConsistency {
  batchId: string;
  recipeId: string;
  productName?: string; // Added for backward compatibility
  targetYield: number;
  actualYield: number;
  yieldVariance: number; // percentage
  consistencyScore?: number; // Added for backward compatibility
  targetScore?: number; // Added for backward compatibility
  qualityParameters: Record<string, number>;
  deviationAnalysis: string[];
}

export interface Loss {
  category: string;
  duration: number; // minutes
  frequency: number;
  impact: number; // percentage
}

export interface Bottleneck {
  id: string;
  asset: string;
  constraint: string;
  severity: "high" | "medium" | "low";
  impact: string;
}

// Enhanced SIM Board with Operational Workflow Support
export interface SIMBoard {
  id: string;
  tenantId: string;
  boardDate: string;
  siteId?: string;
  shiftId?: string;
  boardName: string;
  status: "on-track" | "at-risk" | "behind";
  createdAt: string;
  updatedAt: string;
  // Joined data
  site?: any; // Site interface from existing types
  shift?: Shift;
  kpis?: KPIMetric[];
  // Legacy fields for backward compatibility
  name?: string;
  date?: string;
  sector?: string;
  subsector?: string;
  events?: ShiftEvent[];
  actions?: ShiftAction[];
  metrics?: SIMMetrics;
}

// SIM-specific types based on database schema
export interface Shift {
  id: string;
  tenantId: string;
  siteId?: string;
  shiftStart: string;
  shiftEnd: string;
  shiftName: string; // 'day', 'evening', 'night'
  createdAt: string;
}

export interface SwitchingOrder {
  id: string;
  tenantId: string;
  orderNo: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'in-progress' | 'completed' | 'cancelled';
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  assignedOwner?: string;
  checklist?: { text: string; completed: boolean }[];
  history?: { event: string; timestamp: string; user: string }[];
  createdAt: string;
  updatedAt: string;
  // Joined data
  impacts?: SwitchingOrderImpact[];
  actions?: SimAction[];
}

export interface SwitchingOrderImpact {
  id: string;
  orderId: string;
  nodeId?: string;
  lineId?: string;
  assetId?: string;
  createdAt: string;
  // Joined data
  node?: any; // GridNode interface from existing types
  line?: any; // GridLine interface from existing types
  asset?: any; // Asset interface from existing types
}

export interface Outage {
  id: string;
  tenantId: string;
  outageRef: string;
  outageType: 'planned' | 'unplanned';
  status: 'scheduled' | 'active' | 'resolved';
  startTime: string;
  estimatedRestoration?: string;
  actualRestoration?: string;
  impactLevel: 'high' | 'medium' | 'low';
  description?: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  impacts?: OutageImpact[];
}

export interface OutageImpact {
  id: string;
  outageId: string;
  nodeId?: string;
  lineId?: string;
  assetId?: string;
  createdAt: string;
  // Joined data
  node?: any; // GridNode interface from existing types
  line?: any; // GridLine interface from existing types
  asset?: any; // Asset interface from existing types
}

export interface SimIssue {
  id: string;
  tenantId: string;
  issueRef: string;
  title: string;
  description?: string;
  category?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

export interface SimAction {
  id: string;
  tenantId: string;
  actionRef: string;
  description: string;
  owner: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
  updatedAt: string;
  // Joined data
  links?: SimActionLink[];
}

export interface SimActionLink {
  id: string;
  actionId: string;
  issueId?: string;
  orderId?: string;
  outageId?: string;
  nodeId?: string;
  lineId?: string;
  assetId?: string;
  createdAt: string;
  // Joined data
  issue?: SimIssue;
  order?: SwitchingOrder;
  outage?: Outage;
  node?: any; // GridNode interface from existing types
  line?: any; // GridLine interface from existing types
  asset?: any; // Asset interface from existing types
}

// Request/Response types for SIM operations
export interface CreateSwitchingOrderRequest {
  orderNo: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  plannedStart?: string;
  plannedEnd?: string;
  assignedOwner?: string;
  impacts: {
    nodeId?: string;
    lineId?: string;
    assetId?: string;
  }[];
}

export interface UpdateSwitchingOrderRequest {
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: 'pending' | 'approved' | 'in-progress' | 'completed' | 'cancelled';
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  assignedOwner?: string;
}

export interface CreateOutageRequest {
  outageRef: string;
  outageType: 'planned' | 'unplanned';
  startTime: string;
  estimatedRestoration?: string;
  impactLevel: 'high' | 'medium' | 'low';
  description?: string;
  impacts: {
    nodeId?: string;
    lineId?: string;
    assetId?: string;
  }[];
}

export interface UpdateOutageRequest {
  outageType?: 'planned' | 'unplanned';
  status?: 'scheduled' | 'active' | 'resolved';
  estimatedRestoration?: string;
  actualRestoration?: string;
  impactLevel?: 'high' | 'medium' | 'low';
  description?: string;
}

export interface CreateSimIssueRequest {
  issueRef: string;
  title: string;
  description?: string;
  category?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface UpdateSimIssueRequest {
  title?: string;
  description?: string;
  category?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: 'open' | 'in-progress' | 'resolved';
}

export interface CreateSimActionRequest {
  actionRef: string;
  description: string;
  owner: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
  links: {
    issueId?: string;
    orderId?: string;
    outageId?: string;
    nodeId?: string;
    lineId?: string;
    assetId?: string;
  }[];
}

export interface UpdateSimActionRequest {
  description?: string;
  owner?: string;
  dueDate?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: 'pending' | 'in-progress' | 'completed';
}

// Filter types for SIM operations
export interface SIMBoardFilters {
  siteId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: 'on-track' | 'at-risk' | 'behind';
}

export interface SwitchingOrderFilters {
  siteId?: string;
  status?: 'pending' | 'approved' | 'in-progress' | 'completed' | 'cancelled';
  priority?: 'high' | 'medium' | 'low';
  dateFrom?: string;
  dateTo?: string;
}

export interface OutageFilters {
  siteId?: string;
  status?: 'scheduled' | 'active' | 'resolved';
  type?: 'planned' | 'unplanned';
  dateFrom?: string;
  dateTo?: string;
}

export interface SimIssueFilters {
  boardId?: string;
  siteId?: string;
  status?: 'open' | 'in-progress' | 'resolved';
  priority?: 'high' | 'medium' | 'low';
}

export interface SimActionFilters {
  issueId?: string;
  siteId?: string;
  status?: 'pending' | 'in-progress' | 'completed';
  owner?: string;
}


export interface KPIMetric {
  id: string;
  tenantId: string;
  boardId: string;
  kpiCode: string;
  kpiName: string;
  targetValue?: number;
  actualValue?: number;
  unit?: string;
  status: "good" | "warning" | "critical";
  createdAt: string;
  // Legacy fields for backward compatibility
  name?: string;
  target?: number;
  actual?: number;
  trend?: 'improving' | 'stable' | 'declining';
  variance?: number;
}

export interface ShiftEvent {
  id: string;
  eventType: string;
  description: string;
  timestamp: string;
  duration?: number; // minutes
  impact: 'high' | 'medium' | 'low';
  status: 'active' | 'resolved';
  assignee?: string;
}

export interface ShiftAction {
  id: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  assignee: string;
  dueTime: string;
  completedTime?: string;
  // Additional fields for SIM compatibility
  tenantId?: string;
  actionRef?: string;
  owner?: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  links?: SimActionLink[];
}

export interface SIMMetrics {
  shiftPerformance: number; // percentage
  targetAchievement: number; // percentage
  eventCount: number;
  actionCompletionRate: number; // percentage
}

// Shift Performance Data Models
export interface ShiftPerformance {
  id: string;
  shiftId: string;
  date: Date;
  shift: string;
  summary: PerformanceSummary;
  analysis: PerformanceAnalysis;
  issues: Issue[];
  handover: HandoverInfo;
}

export interface PerformanceSummary {
  keyAchievements: string[];
  challenges: string[];
  overallRating: 'excellent' | 'good' | 'fair' | 'poor';
  targetsMet: number; // percentage
  issuesResolved: number;
}

export interface PerformanceAnalysis {
  varianceExplanations: string[];
  trendContext: string;
  rootCauseAnalysis: string[];
  improvementOpportunities: string[];
}

export interface HandoverInfo {
  ongoingIssues: string[];
  priorities: string[];
  specialInstructions: string[];
  nextShiftFocus: string[];
}

// Oil & Gas - Upstream SIM interfaces
export interface UpstreamSIMBoard extends SIMBoard {
  sector: "Oil & Gas";
  subsector: "Upstream";
  fieldName: string;
  padName: string;
  wellCount: number;
  activeWells: number;
  barrelAtRisk: number;
  mcfAtRisk: number;
  separatorStatus: "normal" | "abnormal" | "shutdown";
  trunklineStatus: "normal" | "abnormal" | "shutdown";
  pressureReading: number; // psi
  temperatureReading: number; // degrees F
  flowRate: number; // barrels per day
}

export interface WellStatus {
  wellId: string;
  wellName: string;
  padName: string;
  status: "producing" | "shut-in" | "abnormal";
  uptime: number; // percentage
  plannedRate: number; // barrels per day
  actualRate: number; // barrels per day
  lastUpdate: string;
  abnormalBehavior?: string;
  interventionRequired: boolean;
}

export interface UpstreamSIMMetrics {
  wellUptimeVsTarget: number; // percentage
  productionVsPlanned: number; // percentage
  defermentTracking: number; // barrels lost
  separatorEfficiency: number; // percentage
  energyPerBarrel: number; // kWh
}

// Power - Transmission SIM interfaces
export interface TransmissionSIMBoard extends SIMBoard {
  sector: "Power";
  subsector: "Transmission";
  controlCenter: string;
  systemLoading: number; // percentage
  outageCount: number;
  switchingOrdersCount: number;
  highImpactEvents: number;
  systemStatus: "normal" | "alert" | "emergency";
  gridStability: number; // percentage
  voltageProfile: "normal" | "high" | "low";
}

export interface TransmissionSwitchingOrder {
  orderId: string;
  description: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "in-progress" | "completed";
  scheduledTime: string;
  estimatedDuration: number; // minutes
  equipmentAffected: string[];
  safetyRequirements: string[];
  impactAssessment: string;
}

export interface TransmissionEvent {
  eventId: string;
  eventType: "trip" | "relay-misoperation" | "outage" | "switching";
  location: string;
  timestamp: string;
  impact: "high" | "medium" | "low";
  status: "active" | "resolved";
  affectedCustomers: number;
  estimatedRestoration: string;
}

// FMCG - Food & Beverage SIM interfaces
export interface FMCGSIMBoard extends SIMBoard {
  sector: "FMCG";
  subsector: "Food & Beverage";
  lineName: string;
  currentSKU: string;
  hourlyTarget: number; // units per hour
  hourlyActual: number; // units per hour
  blockingEvents: number;
  starvingEvents: number;
  changeoverStatus: "none" | "in-progress" | "completed";
  materialShortages: number;
  cipStatus: "none" | "in-progress" | "completed";
  qualityStatus: "normal" | "deviation" | "hold";
}

export interface LineEvent {
  eventId: string;
  eventType: "blocking" | "starving" | "micro-stop" | "changeover" | "material-shortage" | "cip" | "quality-hold";
  lineName: string;
  duration: number; // minutes
  impact: number; // units lost
  status: "active" | "resolved";
  timestamp: string;
  rootCause?: string;
  correctionAction?: string;
}

export interface FMCGSIMMetrics {
  hourlyProductionTracking: number; // units per hour
  changeoverEfficiency: number; // percentage
  materialFlowStatus: "normal" | "shortage" | "excess";
  microStopFrequency: number; // per hour
  qualityYield: number; // percentage
}

export interface SIMMetric {
  name: string;
  target: number;
  actual: number;
  unit: string;
  status: "good" | "warning" | "critical";
}

export interface Issue {
  id: string;
  title: string;
  category: string;
  priority: "high" | "medium" | "low";
  status: "open" | "in-progress" | "resolved";
  assignee: string;
  createdAt: string;
}

// Enhanced CI Project with Project Lifecycle Workflow Support
export interface DetailedCIProject {
  id: string;
  name?: string; // Added for backward compatibility
  title: string;
  description?: string; // Added for backward compatibility
  status?: string; // Added for backward compatibility
  priority: "high" | "medium" | "low";
  owner: string;
  assignee?: string; // Added for backward compatibility
  dueDate?: string; // Added for backward compatibility
  createdAt: string;
  targetKPI: string;
  targetImprovement: string;
  stage: "backlog" | "analysis" | "implementation" | "validation" | "verified";
  sector?: string;
  subsector?: string;
  projectType?: string;
  // Project lifecycle data
  objectives: string[];
  timeline: ProjectTimeline;
  resources: Resource[];
  outcomes: ProjectOutcome[];
}

export interface ProjectTimeline {
  startDate: string;
  endDate: string;
  milestones: Milestone[];
  currentPhase: string;
  completionPercentage: number;
}

export interface Milestone {
  id: string;
  name: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  deliverables: string[];
}

export interface Resource {
  id: string;
  type: 'human' | 'equipment' | 'budget' | 'material';
  name: string;
  allocation: number; // percentage or amount
  availability: 'available' | 'limited' | 'unavailable';
}

export interface ProjectOutcome {
  id: string;
  metric: string;
  baseline: number;
  target: number;
  actual?: number;
  unit: string;
  status: 'not-started' | 'in-progress' | 'achieved' | 'missed';
}

// Root Cause Analysis Data Models
export interface DetailedRootCauseAnalysis {
  id: string;
  problemStatement: string;
  scope: string;
  impactAssessment: string;
  analysis: CauseAnalysis;
  verification: VerificationResult;
  documentation: RCAReport;
}

export interface CauseAnalysis {
  fishboneDiagram: FishboneCategory[];
  hypotheses: Hypothesis[];
  evidenceCollection: Evidence[];
  analysisTools: string[];
}

export interface FishboneCategory {
  category: string;
  causes: string[];
}

export interface Hypothesis {
  id: string;
  description: string;
  likelihood: 'high' | 'medium' | 'low';
  testMethod: string;
  result?: 'confirmed' | 'rejected' | 'inconclusive';
}

export interface Evidence {
  id: string;
  type: 'data' | 'observation' | 'document' | 'interview';
  description: string;
  source: string;
  reliability: 'high' | 'medium' | 'low';
}

export interface VerificationResult {
  confidenceLevel: number; // percentage
  validationMethods: string[];
  results: string[];
  recommendations: string[];
}

export interface RCAReport {
  summary: string;
  findings: string[];
  rootCauses: string[];
  recommendedActions: string[];
}

// Countermeasures Data Models
export interface CountermeasureTracking {
  id: string;
  description: string;
  rationale: string;
  successCriteria: string[];
  implementation: ImplementationPlan;
  monitoring: MonitoringPlan;
  evaluation: EffectivenessEvaluation;
}

export interface ImplementationPlan {
  steps: ImplementationStep[];
  timeline: string;
  resources: Resource[];
  risks: Risk[];
}

export interface ImplementationStep {
  id: string;
  description: string;
  owner: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  dependencies: string[];
}

export interface Risk {
  id: string;
  description: string;
  probability: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  mitigation: string;
}

export interface MonitoringPlan {
  indicators: PerformanceIndicator[];
  dataCollection: DataCollectionMethod[];
  reviewFrequency: string;
}

export interface PerformanceIndicator {
  id: string;
  name: string;
  target: number;
  unit: string;
  measurementMethod: string;
}

export interface DataCollectionMethod {
  id: string;
  method: string;
  frequency: string;
  responsible: string;
  dataSource: string;
}

export interface EffectivenessEvaluation {
  results: EvaluationResult[];
  roiCalculation: ROICalculation;
  sustainabilityAssessment: string;
  improvementRecommendations: string[];
}

export interface EvaluationResult {
  indicator: string;
  baseline: number;
  target: number;
  actual: number;
  improvement: number;
  status: 'exceeded' | 'met' | 'partially-met' | 'not-met';
}

export interface ROICalculation {
  investment: number;
  savings: number;
  roi: number; // percentage
  paybackPeriod: number; // months
}

// =====================================================
// CI (Continuous Improvement) Types - Database Schema Aligned
// =====================================================

// CI Stage - represents the six stages of the CI pipeline
export interface CIStage {
  id: string;
  tenantId: string;
  code: string; // 'BACKLOG', 'ANALYSIS', 'COUNTERMEASURES', 'IMPLEMENTATION', 'VERIFICATION', 'CLOSED'
  name: string;
  sortOrder: number;
  createdAt: string;
}

// Lightweight project reference returned from joins (used by Countermeasure, RCA, etc.)
export interface CIProjectRef {
  id: string;
  projectRef: string;
  title: string;
}

// CI Project - main CI improvement project entity
export interface CIProject {
  id: string;
  tenantId: string;
  projectRef: string;
  title: string;
  stageId: string;
  siteId?: string;
  owner: string;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'on-hold' | 'completed' | 'cancelled';
  startDate?: string;
  dueDate?: string;
  summary?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  // Joined data
  stage?: CIStage;
  site?: any; // Site interface from existing types
  rca?: RootCauseAnalysis[];
  countermeasures?: Countermeasure[];
  kpis?: CIKPI[];
  documents?: CIDocument[];
  links?: CIProjectLink[];
  impacts?: CIImpact[];
  // Legacy fields for backward compatibility
  name?: string;
  description?: string;
  assignee?: string;
  targetKPI?: string;
  targetImprovement?: string;
  objectives?: string[];
  timeline?: ProjectTimeline;
  resources?: Resource[];
  outcomes?: ProjectOutcome[];
}

// CI Project Link - links projects to assets, nodes, lines, alerts
export interface CIProjectLink {
  id: string;
  projectId: string;
  assetId?: string;
  nodeId?: string;
  lineId?: string;
  alertId?: string;
  createdAt: string;
  // Joined data
  asset?: any;
  node?: any;
  line?: any;
  alert?: any;
}

// Root Cause Analysis - stores RCA data in JSONB format
export interface RootCauseAnalysis {
  id: string;
  projectId: string;
  projectRef?: string;    // e.g. "CI-2024-001"
  projectTitle?: string;  // e.g. "Reduce relay misoperation frequency"
  rcaType: '5-whys' | 'fishbone' | 'fault-tree';
  analysisType?: '5-whys' | 'fishbone' | 'fault-tree'; // Alias for rcaType
  content: Record<string, any>; // JSONB field - flexible structure
  findings?: string; // Extracted from content for display
  conclusion?: string; // Extracted from content for display
  createdAt: string;
  updatedAt: string;
  // Legacy fields for backward compatibility
  problemStatement?: string;
  scope?: string;
  impactAssessment?: string;
  analysis?: CauseAnalysis;
  verification?: VerificationResult;
  documentation?: RCAReport;
}

// Countermeasure - tracks countermeasures with effectiveness
export interface Countermeasure {
  id: string;
  tenantId: string;
  cmRef: string;
  projectId: string;
  owner: string;
  status: 'planned' | 'in-progress' | 'completed' | 'verified';
  dueDate?: string;
  summary: string;
  effectivenessScore?: number; // 0-100, only for completed/verified
  createdAt: string;
  updatedAt: string;
  // Joined data
  project?: CIProject;
  // Legacy fields for backward compatibility
  description?: string;
  rationale?: string;
  successCriteria?: string[];
  implementation?: ImplementationPlan;
  monitoring?: MonitoringPlan;
  evaluation?: EffectivenessEvaluation;
}

// CI KPI - KPI definitions for transmission metrics
export interface CIKPI {
  id: string;
  tenantId: string;
  kpiCode: string;
  name: string;
  unit?: string;
  createdAt: string;
}

// CI KPI Link - many-to-many between projects and KPIs
export interface CIKPILink {
  id: string;
  projectId: string;
  kpiId: string;
  createdAt: string;
  // Joined data
  project?: CIProject;
  kpi?: CIKPI;
}

// CI Impact - tracks baseline, target, and actual KPI values
export interface CIImpact {
  id: string;
  projectId: string;
  kpiId: string;
  baseline?: number;
  target?: number;
  actual?: number;
  impactValue?: number; // Calculated: (actual - baseline) / (target - baseline) * 100
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  project?: CIProject;
  kpi?: CIKPI;
}

// CI Document - document metadata (not actual files)
export interface CIDocument {
  id: string;
  projectId: string;
  docRef: string;
  name: string;
  docType: 'report' | 'analysis' | 'procedure' | 'photo' | 'diagram' | 'other';
  url?: string;
  createdAt: string;
  // Joined data
  project?: CIProject;
}

// Request/Response types for CI operations
export interface CreateCIProjectRequest {
  projectRef: string;
  title: string;
  stageId: string;
  siteId?: string;
  owner: string;
  priority?: 'high' | 'medium' | 'low';
  startDate?: string;
  dueDate?: string;
  summary?: string;
  tags?: string[];
  links?: {
    assetId?: string;
    nodeId?: string;
    lineId?: string;
    alertId?: string;
  }[];
}

export interface UpdateCIProjectRequest {
  title?: string;
  stageId?: string;
  siteId?: string;
  owner?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: 'active' | 'on-hold' | 'completed' | 'cancelled';
  startDate?: string;
  dueDate?: string;
  summary?: string;
  tags?: string[];
}

export interface UpsertRCARequest {
  projectId: string;
  rcaType: '5-whys' | 'fishbone' | 'fault-tree';
  content: Record<string, any>;
}

export interface CreateCountermeasureRequest {
  cmRef: string;
  projectId: string;
  owner: string;
  dueDate?: string;
  summary: string;
}

export interface UpdateCountermeasureRequest {
  owner?: string;
  status?: 'planned' | 'in-progress' | 'completed' | 'verified';
  dueDate?: string;
  summary?: string;
  effectivenessScore?: number;
}

export interface UpsertImpactRequest {
  projectId: string;
  kpiId: string;
  baseline?: number;
  target?: number;
  actual?: number;
  notes?: string;
}

export interface CreateCIDocumentRequest {
  projectId: string;
  docRef: string;
  name: string;
  docType: 'report' | 'analysis' | 'procedure' | 'photo' | 'diagram' | 'other';
  url?: string;
}

// Filter types for CI operations
export interface CIProjectFilters {
  stageId?: string;
  siteId?: string;
  owner?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: 'active' | 'on-hold' | 'completed' | 'cancelled';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface CountermeasureFilters {
  projectId?: string;
  owner?: string;
  status?: 'planned' | 'in-progress' | 'completed' | 'verified';
  dateFrom?: string;
  dateTo?: string;
}

// =====================================================
// Optimisation (AI-powered) Types - Database Schema Aligned
// =====================================================

// Optimisation Opportunity - AI-identified optimization opportunity
export interface OptimisationOpportunity {
  id: string;
  tenantId: string;
  oppRef: string;
  title: string;
  category: 'loss-reduction' | 'reliability' | 'loading' | 'voltage' | 'asset-health' | 'operational-efficiency';
  status: 'identified' | 'analyzing' | 'planning' | 'published' | 'archived';
  priority: 'critical' | 'high' | 'medium' | 'low';
  rankScore: number; // 0-100
  confidence: number; // 0-100
  estimatedImpactMwh?: number;
  estimatedImpactCost?: number;
  estimatedSavings?: number;
  description: string;
  analysis: Record<string, any>; // JSONB - flexible analysis data
  siteId?: string;
  assetId?: string;
  nodeId?: string;
  lineId?: string;
  telemetryPointId?: string;
  identifiedAt: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  site?: any;
  asset?: any;
  node?: any;
  line?: any;
  telemetryPoint?: any;
  recommendations?: AIRecommendation[];
  playbooks?: OptimisationPlaybook[];
  simulations?: OptimisationSimulation[];
}

// AI Recommendation - Actionable recommendation for an opportunity
export interface AIRecommendation {
  id: string;
  tenantId: string;
  opportunityId: string;
  recRef: string;
  title: string;
  description: string;
  actionType: 'operational-change' | 'asset-upgrade' | 'maintenance' | 'configuration' | 'control-adjustment' | 'load-redistribution';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'draft' | 'pending-review' | 'approved' | 'rejected' | 'published';
  estimatedEffortHours?: number;
  estimatedCost?: number;
  estimatedBenefit?: number;
  implementationSteps: any[]; // JSONB array
  prerequisites: any[]; // JSONB array
  risks: any[]; // JSONB array
  kpis: any[]; // JSONB array
  createdBy?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  confidenceScore?: number;
  opportunity?: OptimisationOpportunity;
  simulations?: OptimisationSimulation[];
}

// Optimisation Playbook - Reusable best-practice playbook
export interface OptimisationPlaybook {
  id: string;
  tenantId: string;
  playbookRef: string;
  title: string;
  category: 'loss-reduction' | 'reliability' | 'loading' | 'voltage' | 'asset-health' | 'operational-efficiency';
  description: string;
  applicabilityCriteria: Record<string, any>; // JSONB
  steps: any[]; // JSONB array
  expectedOutcomes: any[]; // JSONB array
  successMetrics: any[]; // JSONB array
  caseStudies: any[]; // JSONB array
  version: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  // Joined data for opportunity-playbook links
  relevanceScore?: number; // From opt_opportunity_playbooks join
  linkNotes?: string; // From opt_opportunity_playbooks join
}

// Optimisation Simulation - Simulation results (load flow, voltage, etc.)
export interface OptimisationSimulation {
  id: string;
  tenantId: string;
  recommendationId?: string;
  opportunityId?: string;
  simRef: string;
  simType: 'load-flow' | 'voltage-stability' | 'reliability' | 'economic' | 'thermal' | 'contingency';
  scenarioName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  inputParameters: Record<string, any>; // JSONB
  results: Record<string, any>; // JSONB
  metrics: Record<string, any>; // JSONB
  warnings: any[]; // JSONB array
  errors: any[]; // JSONB array
  runDurationMs?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  // UI-friendly aliases
  name?: string; // Alias for scenarioName
  type?: string; // Alias for simType
  description?: string; // Extracted from results or inputParameters
  confidence?: number; // Extracted from metrics
  parameters?: Record<string, any>; // Alias for inputParameters
  projectedOutcome?: string; // Extracted from results
  // Joined data
  recommendation?: AIRecommendation;
  opportunity?: OptimisationOpportunity;
}

// Publish Event - Tracks publishing to SIM or CI systems
export interface PublishEvent {
  id: string;
  tenantId: string;
  eventRef: string;
  sourceType: 'opportunity' | 'recommendation';
  sourceId: string;
  targetSystem: 'sim' | 'ci';
  targetType: 'switching-order' | 'outage' | 'issue' | 'action' | 'ci-project' | 'countermeasure';
  targetId?: string; // UUID of created entity in target system
  status: 'pending' | 'published' | 'failed' | 'rolled-back';
  payload: Record<string, any>; // JSONB - data sent to target system
  errorMessage?: string;
  publishedBy?: string;
  publishedAt?: string;
  createdAt: string;
  // Joined data
  opportunity?: OptimisationOpportunity;
  recommendation?: AIRecommendation;
}

// Request/Response types for Optimisation operations
export interface UpdateOpportunityRequest {
  status?: 'identified' | 'analyzing' | 'planning' | 'published' | 'archived';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  analysis?: Record<string, any>;
}

export interface CreateRecommendationRequest {
  opportunityId: string;
  recRef: string;
  title: string;
  description: string;
  actionType: 'operational-change' | 'asset-upgrade' | 'maintenance' | 'configuration' | 'control-adjustment' | 'load-redistribution';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  estimatedEffortHours?: number;
  estimatedCost?: number;
  estimatedBenefit?: number;
  implementationSteps?: any[];
  prerequisites?: any[];
  risks?: any[];
  kpis?: any[];
}

export interface UpdateRecommendationRequest {
  title?: string;
  description?: string;
  status?: 'draft' | 'pending-review' | 'approved' | 'rejected' | 'published';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  estimatedEffortHours?: number;
  estimatedCost?: number;
  estimatedBenefit?: number;
  implementationSteps?: any[];
  prerequisites?: any[];
  risks?: any[];
  kpis?: any[];
  reviewedBy?: string;
}

export interface CreateSimulationRequest {
  recommendationId?: string;
  opportunityId?: string;
  simRef: string;
  simType: 'load-flow' | 'voltage-stability' | 'reliability' | 'economic' | 'thermal' | 'contingency';
  scenarioName: string;
  inputParameters: Record<string, any>;
}

export interface UpdateSimulationRequest {
  status?: 'pending' | 'running' | 'completed' | 'failed';
  results?: Record<string, any>;
  metrics?: Record<string, any>;
  warnings?: any[];
  errors?: any[];
  runDurationMs?: number;
  startedAt?: string;
  completedAt?: string;
}

export interface PublishToSimRequest {
  opportunityId?: string;
  recommendationId?: string;
  targetType: 'switching-order' | 'outage' | 'issue' | 'action';
  payload: Record<string, any>;
  publishedBy?: string;
}

export interface PublishToCiRequest {
  opportunityId?: string;
  recommendationId?: string;
  targetType: 'ci-project' | 'countermeasure';
  payload: Record<string, any>;
  publishedBy?: string;
}

// Filter types for Optimisation operations
export interface OpportunityFilters {
  category?: 'loss-reduction' | 'reliability' | 'loading' | 'voltage' | 'asset-health' | 'operational-efficiency';
  status?: 'identified' | 'analyzing' | 'planning' | 'published' | 'archived';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  siteId?: string;
  assetId?: string;
  minRankScore?: number; // e.g., >= 80
  minConfidence?: number; // e.g., >= 85
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface RecommendationFilters {
  opportunityId?: string;
  actionType?: 'operational-change' | 'asset-upgrade' | 'maintenance' | 'configuration' | 'control-adjustment' | 'load-redistribution';
  status?: 'draft' | 'pending-review' | 'approved' | 'rejected' | 'published';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  createdBy?: string;
  reviewedBy?: string;
}

export interface PlaybookFilters {
  category?: 'loss-reduction' | 'reliability' | 'loading' | 'voltage' | 'asset-health' | 'operational-efficiency';
  isActive?: boolean;
  search?: string;
}

export interface SimulationFilters {
  recommendationId?: string;
  opportunityId?: string;
  simType?: 'load-flow' | 'voltage-stability' | 'reliability' | 'economic' | 'thermal' | 'contingency';
  status?: 'pending' | 'running' | 'completed' | 'failed';
  dateFrom?: string;
  dateTo?: string;
}

export interface PublishEventFilters {
  sourceType?: 'opportunity' | 'recommendation';
  targetSystem?: 'sim' | 'ci';
  targetType?: 'switching-order' | 'outage' | 'issue' | 'action' | 'ci-project' | 'countermeasure';
  status?: 'pending' | 'published' | 'failed' | 'rolled-back';
  publishedBy?: string;
  dateFrom?: string;
  dateTo?: string;
}


// Impact Tracking Data Models
export interface ImpactMeasurement {
  id: string;
  name: string;
  baseline: BaselineData;
  targets: TargetData;
  results: ResultData;
  analysis: ImpactAnalysis;
}

export interface BaselineData {
  value: number;
  unit: string;
  measurementDate: string;
  measurementMethod: string;
  historicalContext: string;
}

export interface TargetData {
  value: number;
  unit: string;
  targetDate: string;
  successCriteria: string[];
  measurementTimeline: string;
}

export interface ResultData {
  currentValue: number;
  trend: TrendData[];
  varianceAnalysis: string;
  achievementStatus: 'on-track' | 'at-risk' | 'behind' | 'exceeded';
}

export interface ImpactAnalysis {
  impactAssessment: string;
  roiCalculation: ROICalculation;
  sustainabilityFactors: string[];
  lessonsLearned: string[];
}

// Oil & Gas - Upstream CI interfaces
export interface UpstreamCIProject extends DetailedCIProject {
  sector: "Oil & Gas";
  subsector: "Upstream";
  projectType: "deferment-reduction" | "flow-assurance" | "well-uptime" | "lifting-cost" | "produced-water";
  wellsAffected?: string[];
  padsAffected?: string[];
  fieldsAffected?: string[];
  productionImpact?: number; // barrels per day
  energyImpact?: number; // kWh per barrel reduction
  liftingCostImpact?: number; // dollars per barrel
  defermentReduction?: number; // hours saved
  flowAssuranceImprovement?: string;
}

export interface UpstreamRootCause extends RootCause {
  wellPerformanceFactors?: string[];
  equipmentCondition?: string;
  operationalPractices?: string[];
  flowAssuranceIssues?: string[];
  energyEfficiencyFactors?: string[];
}

export interface UpstreamCountermeasure extends DetailedCountermeasure {
  wellInterventionRequired: boolean;
  equipmentModification?: string;
  operationalChange?: string;
  energyOptimization?: string;
  estimatedCost?: number;
  expectedROI?: number;
}

// Power - Transmission CI interfaces
export interface TransmissionCIProject extends DetailedCIProject {
  sector: "Power";
  subsector: "Transmission";
  projectType: "relay-misoperation" | "transmission-loss" | "trip-investigation" | "transformer-loading" | "grid-reliability";
  equipmentAffected?: string[];
  substationsAffected?: string[];
  transmissionLines?: string[];
  reliabilityImpact?: number; // SAIDI/SAIFI improvement
  lossReduction?: number; // percentage
  misoperationReduction?: number; // percentage
  gridStabilityImprovement?: string;
  customerImpactReduction?: number;
}

export interface TransmissionRootCause extends RootCause {
  relaySettings?: string[];
  equipmentCondition?: string;
  protectionScheme?: string;
  maintenancePractices?: string[];
  operationalProcedures?: string[];
}

export interface TransmissionCountermeasure extends DetailedCountermeasure {
  relaySettingChange: boolean;
  equipmentReplacement?: string;
  protectionUpgrade?: string;
  procedureModification?: string;
  trainingRequired?: boolean;
  estimatedCost?: number;
}

// FMCG - Food & Beverage CI interfaces
export interface FMCGCIProject extends DetailedCIProject {
  sector: "FMCG";
  subsector: "Food & Beverage";
  projectType: "changeover-reduction" | "scrap-waste" | "material-yield" | "batch-consistency" | "quality-improvement";
  linesAffected?: string[];
  skusAffected?: string[];
  recipesAffected?: string[];
  changeoverImpact?: number; // minutes saved
  yieldImpact?: number; // percentage improvement
  wasteReduction?: number; // percentage
  qualityImprovement?: string;
  throughputIncrease?: number; // percentage
}

export interface FMCGRootCause extends RootCause {
  changeoverFactors?: string[];
  materialHandling?: string[];
  recipeVariability?: string[];
  equipmentPerformance?: string[];
  operatorSkills?: string[];
}

export interface FMCGCountermeasure extends DetailedCountermeasure {
  smedImplementation: boolean;
  recipeOptimization?: string;
  equipmentModification?: string;
  trainingProgram?: string;
  materialImprovement?: string;
  estimatedSavings?: number;
}

export interface RootCause {
  id: string;
  category: string;
  description: string;
  evidence: string[];
  verified: boolean;
}

export interface DetailedCountermeasure {
  id: string;
  description: string;
  type?: string; // Added for backward compatibility
  status: "planned" | "in-progress" | "completed" | string; // Added string for more flexible status
  owner: string;
  assignee?: string; // Added for backward compatibility
  dueDate: string;
}

// Enhanced Optimisation with Decision Workflow Support
export interface DetailedOptimisationOpportunity {
  id: string;
  title: string;
  rank: number;
  category: string;
  potentialImpact: string;
  confidence: number; // 0-100
  status: "new" | "under-review" | "approved" | "published";
  sector?: string;
  subsector?: string;
  opportunityType?: string;
  // Decision workflow data
  impactScore: number;
  confidenceScore: number;
  assessment: OpportunityAssessment;
  businessCase: BusinessCase;
  approvalStatus: ApprovalStatus;
  tracking: OpportunityTracking;
}

export interface OpportunityAssessment {
  impactEstimation: ImpactEstimation;
  feasibilityEvaluation: FeasibilityEvaluation;
  riskAssessment: RiskAssessment;
  resourceRequirements: ResourceRequirement[];
}

export interface ImpactEstimation {
  quantitativeImpact: number;
  qualitativeImpact: string[];
  timeframe: string;
  confidenceLevel: number;
  assumptions: string[];
}

export interface FeasibilityEvaluation {
  technicalFeasibility: 'high' | 'medium' | 'low';
  operationalFeasibility: 'high' | 'medium' | 'low';
  economicFeasibility: 'high' | 'medium' | 'low';
  constraints: string[];
  enablers: string[];
}

export interface RiskAssessment {
  risks: Risk[];
  overallRiskLevel: 'high' | 'medium' | 'low';
  mitigationStrategies: string[];
}

export interface ResourceRequirement {
  type: 'human' | 'financial' | 'technical' | 'time';
  description: string;
  quantity: number;
  unit: string;
  availability: 'available' | 'limited' | 'unavailable';
}

export interface BusinessCase {
  costBenefitAnalysis: CostBenefitAnalysis;
  roiProjections: ROIProjection[];
  financialMetrics: FinancialMetrics;
  strategicAlignment: string;
}

export interface CostBenefitAnalysis {
  implementationCosts: Cost[];
  operationalCosts: Cost[];
  benefits: Benefit[];
  netBenefit: number;
}

export interface Cost {
  category: string;
  amount: number;
  currency: string;
  timeframe: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface Benefit {
  category: string;
  amount: number;
  currency: string;
  timeframe: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ROIProjection {
  year: number;
  investment: number;
  returns: number;
  cumulativeROI: number;
}

export interface FinancialMetrics {
  npv: number;
  irr: number;
  paybackPeriod: number;
  breakEvenPoint: number;
}

export interface ApprovalStatus {
  currentStage: 'assessment' | 'review' | 'approval' | 'implementation';
  stakeholders: Stakeholder[];
  decisions: Decision[];
  nextSteps: string[];
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  influence: 'high' | 'medium' | 'low';
  support: 'supportive' | 'neutral' | 'resistant';
  feedback: string;
}

export interface Decision {
  id: string;
  description: string;
  decisionMaker: string;
  date: string;
  outcome: 'approved' | 'rejected' | 'deferred' | 'conditional';
  rationale: string;
}

export interface OpportunityTracking {
  progress: ProgressMetric[];
  milestones: Milestone[];
  outcomes: OutcomeMeasurement[];
}

export interface ProgressMetric {
  metric: string;
  target: number;
  actual: number;
  unit: string;
  status: 'on-track' | 'at-risk' | 'behind';
}

export interface OutcomeMeasurement {
  metric: string;
  baseline: number;
  target: number;
  actual: number;
  improvement: number;
  unit: string;
}

// AI Recommendation Data Models
export interface DetailedAIRecommendation {
  id: string;
  title: string;
  confidenceScore: number;
  impactProjection: ImpactProjection;
  analysis: AIAnalysis;
  rationale: RecommendationRationale;
  implementation: ImplementationGuidance;
  feedback: RecommendationFeedback;
}

export interface ImpactProjection {
  primaryMetric: string;
  projectedImprovement: number;
  unit: string;
  timeframe: string;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export interface AIAnalysis {
  dataAnalysis: DataAnalysisResult[];
  patternRecognition: Pattern[];
  predictiveInsights: PredictiveInsight[];
  correlationAnalysis: Correlation[];
}

export interface DataAnalysisResult {
  dataset: string;
  analysisType: string;
  findings: string[];
  statisticalSignificance: number;
}

export interface Pattern {
  id: string;
  description: string;
  frequency: number;
  strength: 'strong' | 'moderate' | 'weak';
  implications: string[];
}

export interface PredictiveInsight {
  prediction: string;
  probability: number;
  timeHorizon: string;
  factors: string[];
}

export interface Correlation {
  variables: string[];
  strength: number;
  significance: number;
  interpretation: string;
}

export interface RecommendationRationale {
  logic: string[];
  supportingEvidence: Evidence[];
  confidenceFactors: ConfidenceFactor[];
  assumptions: string[];
}

export interface ConfidenceFactor {
  factor: string;
  weight: number;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface ImplementationGuidance {
  steps: ImplementationStep[];
  resourceRequirements: ResourceRequirement[];
  timeline: TimelineEstimate;
  successFactors: string[];
}

export interface TimelineEstimate {
  estimatedDuration: number;
  unit: 'days' | 'weeks' | 'months';
  phases: Phase[];
}

export interface Phase {
  name: string;
  duration: number;
  dependencies: string[];
  deliverables: string[];
}

export interface RecommendationFeedback {
  userRatings: UserRating[];
  outcomeTracking: OutcomeTracking[];
  modelImprovement: ModelImprovementInput[];
}

export interface UserRating {
  userId: string;
  rating: number; // 1-5
  feedback: string;
  implementationStatus: 'implemented' | 'partially-implemented' | 'not-implemented';
}

export interface OutcomeTracking {
  metric: string;
  predicted: number;
  actual: number;
  variance: number;
  accuracy: number;
}

export interface ModelImprovementInput {
  feedbackType: 'accuracy' | 'relevance' | 'completeness';
  description: string;
  priority: 'high' | 'medium' | 'low';
}

// Playbook Data Models
export interface DetailedOptimisationPlaybook {
  id: string;
  name: string;
  category: string;
  description: string;
  applicability: number; // 0-100
  overview: PlaybookOverview;
  procedures: PlaybookProcedure[];
  customization: PlaybookCustomization;
  results: PlaybookResults;
}

export interface PlaybookOverview {
  scope: string;
  objectives: string[];
  successCriteria: string[];
  applicableScenarios: string[];
  prerequisites: string[];
}

export interface PlaybookProcedure {
  id: string;
  step: number;
  title: string;
  description: string;
  instructions: string[];
  decisionPoints: DecisionPoint[];
  qualityGates: QualityGate[];
  resources: string[];
}

export interface DecisionPoint {
  id: string;
  question: string;
  options: DecisionOption[];
  criteria: string[];
}

export interface DecisionOption {
  option: string;
  nextStep: string;
  implications: string[];
}

export interface QualityGate {
  id: string;
  criteria: string;
  checkMethod: string;
  passThreshold: string;
  failureAction: string;
}

export interface PlaybookCustomization {
  parameters: CustomizationParameter[];
  adaptationGuidelines: string[];
  sectorSpecificVariations: SectorVariation[];
}

export interface CustomizationParameter {
  name: string;
  type: 'numeric' | 'text' | 'selection' | 'boolean';
  defaultValue: any;
  options?: string[];
  description: string;
}

export interface SectorVariation {
  sector: string;
  subsector?: string;
  modifications: string[];
  additionalSteps: string[];
}

export interface PlaybookResults {
  historicalResults: HistoricalResult[];
  successRates: SuccessRate[];
  performanceBenchmarks: PerformanceBenchmark[];
  lessonsLearned: string[];
}

export interface HistoricalResult {
  implementationId: string;
  sector: string;
  subsector?: string;
  outcome: 'successful' | 'partially-successful' | 'unsuccessful';
  metrics: ResultMetric[];
  duration: number;
  challenges: string[];
}

export interface ResultMetric {
  metric: string;
  baseline: number;
  target: number;
  achieved: number;
  improvement: number;
  unit: string;
}

export interface SuccessRate {
  scenario: string;
  totalImplementations: number;
  successfulImplementations: number;
  successRate: number;
  averageImprovement: number;
}

export interface PerformanceBenchmark {
  metric: string;
  industry: string;
  average: number;
  bestInClass: number;
  playbookAverage: number;
  unit: string;
}

// Simulation Data Models
export interface DetailedOptimisationSimulation {
  id: string;
  name: string;
  status: 'setup' | 'running' | 'completed' | 'failed';
  parameters: SimulationParameter[];
  setup: SimulationSetup;
  execution: SimulationExecution;
  results: SimulationResults;
  comparison: SimulationComparison;
}

export interface SimulationParameter {
  name: string;
  type: 'input' | 'constraint' | 'objective';
  value: number;
  unit: string;
  range?: {
    min: number;
    max: number;
  };
}

export interface SimulationSetup {
  scenario: string;
  objectives: string[];
  constraints: Constraint[];
  assumptions: string[];
  modelType: string;
}

export interface Constraint {
  name: string;
  type: 'equality' | 'inequality';
  expression: string;
  value: number;
}

export interface SimulationExecution {
  startTime: string;
  endTime?: string;
  progress: number; // percentage
  intermediateResults: IntermediateResult[];
  executionLogs: ExecutionLog[];
}

export interface IntermediateResult {
  timestamp: string;
  iteration: number;
  objectiveValue: number;
  convergence: number;
}

export interface ExecutionLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
}

export interface SimulationResults {
  outcomes: SimulationOutcome[];
  performancePredictions: PerformancePrediction[];
  sensitivityAnalysis: SensitivityAnalysis[];
  recommendations: string[];
}

export interface SimulationOutcome {
  scenario: string;
  objectiveValue: number;
  variables: VariableResult[];
  feasibility: 'feasible' | 'infeasible' | 'unknown';
}

export interface VariableResult {
  name: string;
  value: number;
  unit: string;
  sensitivity: number;
}

export interface PerformancePrediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  improvement: number;
  confidence: number;
  unit: string;
}

export interface SensitivityAnalysis {
  parameter: string;
  impact: number;
  elasticity: number;
  criticalThreshold?: number;
}

export interface SimulationComparison {
  scenarios: ScenarioComparison[];
  tradeOffAnalysis: TradeOffAnalysis[];
  recommendationRanking: RecommendationRanking[];
}

export interface ScenarioComparison {
  scenarioA: string;
  scenarioB: string;
  metrics: ComparisonMetric[];
  preference: 'A' | 'B' | 'equivalent';
}

export interface ComparisonMetric {
  metric: string;
  valueA: number;
  valueB: number;
  difference: number;
  significance: 'high' | 'medium' | 'low';
}

export interface TradeOffAnalysis {
  objective1: string;
  objective2: string;
  tradeOffRatio: number;
  paretoFrontier: ParetoPoint[];
}

export interface ParetoPoint {
  objective1Value: number;
  objective2Value: number;
  isOptimal: boolean;
}

export interface RecommendationRanking {
  rank: number;
  scenario: string;
  score: number;
  criteria: RankingCriterion[];
}

export interface RankingCriterion {
  criterion: string;
  weight: number;
  score: number;
  contribution: number;
}

// Execution Tracking Data Models
export interface OptimisationExecution {
  id: string;
  name: string;
  status: 'planning' | 'implementing' | 'monitoring' | 'completed';
  planning: ExecutionPlanning;
  implementation: ExecutionImplementation;
  monitoring: ExecutionMonitoring;
  evaluation: ExecutionEvaluation;
}

export interface ExecutionPlanning {
  implementationPlan: ImplementationPlan;
  resourceAllocation: ResourceAllocation[];
  timeline: ExecutionTimeline;
  riskManagement: RiskManagementPlan;
}

export interface ResourceAllocation {
  resource: string;
  type: 'human' | 'financial' | 'equipment' | 'material';
  allocated: number;
  unit: string;
  utilization: number; // percentage
}

export interface ExecutionTimeline {
  phases: ExecutionPhase[];
  milestones: ExecutionMilestone[];
  dependencies: Dependency[];
}

export interface ExecutionPhase {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed';
  deliverables: string[];
}

export interface ExecutionMilestone {
  id: string;
  name: string;
  dueDate: string;
  status: 'pending' | 'achieved' | 'missed';
  criteria: string[];
}

export interface Dependency {
  predecessor: string;
  successor: string;
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish';
  lag: number; // days
}

export interface RiskManagementPlan {
  risks: ExecutionRisk[];
  mitigationStrategies: MitigationStrategy[];
  contingencyPlans: ContingencyPlan[];
}

export interface ExecutionRisk {
  id: string;
  description: string;
  category: string;
  probability: number; // 0-1
  impact: number; // 0-1
  riskScore: number;
  status: 'identified' | 'mitigated' | 'realized' | 'closed';
}

export interface MitigationStrategy {
  riskId: string;
  strategy: string;
  owner: string;
  effectiveness: number; // 0-1
  cost: number;
}

export interface ContingencyPlan {
  trigger: string;
  actions: string[];
  resources: string[];
  timeline: string;
}

export interface ExecutionImplementation {
  deploymentProgress: DeploymentProgress[];
  milestoneCompletion: MilestoneCompletion[];
  issueTracking: ExecutionIssue[];
  changeManagement: ChangeRequest[];
}

export interface DeploymentProgress {
  component: string;
  plannedCompletion: number; // percentage
  actualCompletion: number; // percentage
  status: 'on-track' | 'at-risk' | 'delayed';
  blockers: string[];
}

export interface MilestoneCompletion {
  milestoneId: string;
  plannedDate: string;
  actualDate?: string;
  status: 'pending' | 'completed' | 'overdue';
  completionCriteria: CompletionCriterion[];
}

export interface CompletionCriterion {
  criterion: string;
  status: 'met' | 'not-met' | 'partially-met';
  evidence: string;
}

export interface ExecutionIssue {
  id: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'resolved';
  owner: string;
  resolution?: string;
}

export interface ChangeRequest {
  id: string;
  description: string;
  justification: string;
  impact: ChangeImpact;
  status: 'submitted' | 'approved' | 'rejected' | 'implemented';
}

export interface ChangeImpact {
  scope: string[];
  timeline: number; // days
  cost: number;
  risk: 'high' | 'medium' | 'low';
}

export interface ExecutionMonitoring {
  performanceMetrics: ExecutionMetric[];
  realTimeMetrics: RealTimeMetric[];
  deviationAlerts: DeviationAlert[];
}

export interface ExecutionMetric {
  metric: string;
  target: number;
  actual: number;
  unit: string;
  trend: 'improving' | 'stable' | 'declining';
  status: 'on-target' | 'at-risk' | 'off-target';
}

export interface RealTimeMetric {
  metric: string;
  value: number;
  timestamp: string;
  threshold: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface DeviationAlert {
  id: string;
  metric: string;
  deviation: number;
  threshold: number;
  severity: 'high' | 'medium' | 'low';
  timestamp: string;
  acknowledged: boolean;
}

export interface ExecutionEvaluation {
  outcomeEvaluation: OutcomeEvaluation;
  benefitRealization: BenefitRealization;
  lessonsLearned: LessonLearned[];
  recommendations: EvaluationRecommendation[];
}

export interface OutcomeEvaluation {
  objectives: ObjectiveEvaluation[];
  overallSuccess: 'exceeded' | 'met' | 'partially-met' | 'not-met';
  successFactors: string[];
  challenges: string[];
}

export interface ObjectiveEvaluation {
  objective: string;
  target: number;
  achieved: number;
  unit: string;
  status: 'exceeded' | 'met' | 'partially-met' | 'not-met';
}

export interface BenefitRealization {
  financialBenefits: FinancialBenefit[];
  operationalBenefits: OperationalBenefit[];
  strategicBenefits: string[];
  totalValue: number;
}

export interface FinancialBenefit {
  category: string;
  projected: number;
  realized: number;
  variance: number;
  currency: string;
}

export interface OperationalBenefit {
  metric: string;
  baseline: number;
  target: number;
  achieved: number;
  improvement: number;
  unit: string;
}

export interface LessonLearned {
  category: string;
  description: string;
  impact: 'positive' | 'negative';
  applicability: string[];
  recommendations: string[];
}

export interface EvaluationRecommendation {
  type: 'process-improvement' | 'scaling' | 'replication' | 'discontinuation';
  description: string;
  priority: 'high' | 'medium' | 'low';
  timeline: string;
}

// Oil & Gas - Upstream Optimisation interfaces
export interface UpstreamOptimisationOpportunity extends DetailedOptimisationOpportunity {
  sector: "Oil & Gas";
  subsector: "Upstream";
  opportunityType: "well-performance" | "lift-optimization" | "gathering-system" | "energy-efficiency" | "flow-assurance";
  wellsAffected?: string[];
  padsAffected?: string[];
  fieldsAffected?: string[];
  productionUplift?: number; // barrels per day
  energySavings?: number; // kWh per barrel
  gasUplift?: number; // MCF per day
  recommendedSettings?: {
    espFrequency?: number;
    chokePosition?: number;
    pumpSpeed?: number;
    pressure?: number; // psi
    temperature?: number; // degrees F
  };
  flowAssuranceOptimization?: string;
  gatheringSystemEfficiency?: number; // percentage
}

export interface UpstreamRecommendation extends Recommendation {
  wellPerformanceEnvelope?: string;
  liftOptimization?: string;
  energyEfficiency?: string;
  flowAssuranceGuidance?: string;
  equipmentSettings?: Record<string, number>;
  productionForecast?: number; // barrels per day
}

export interface UpstreamPlaybook extends Playbook {
  wellIntervention?: boolean;
  productionOptimization?: boolean;
  flowAssuranceManagement?: boolean;
  energyOptimization?: boolean;
  equipmentMaintenance?: boolean;
}

// Power - Transmission Optimisation interfaces
export interface TransmissionOptimisationOpportunity extends DetailedOptimisationOpportunity {
  sector: "Power";
  subsector: "Transmission";
  opportunityType: "loading-optimization" | "congestion-relief" | "switching-path" | "loss-minimization" | "grid-stability";
  equipmentAffected?: string[];
  transmissionLines?: string[];
  substations?: string[];
  loadingImprovement?: number; // percentage
  lossReduction?: number; // MW
  congestionRelief?: number; // percentage
  reliabilityImprovement?: string;
  gridStabilityEnhancement?: string;
  riskReduction?: string;
}

export interface TransmissionRecommendation extends Recommendation {
  loadBalancing?: string;
  congestionManagement?: string;
  switchingOptimization?: string;
  lossMinimization?: string;
  gridStabilityImprovement?: string;
  optimalSwitchingSequence?: string[];
  loadingScenarios?: Record<string, number>;
}

export interface TransmissionPlaybook extends Playbook {
  gridOptimization?: boolean;
  outageManagement?: boolean;
  reliabilityImprovement?: boolean;
  congestionRelief?: boolean;
  emergencyResponse?: boolean;
}

// FMCG - Food & Beverage Optimisation interfaces
export interface FMCGOptimisationOpportunity extends DetailedOptimisationOpportunity {
  sector: "FMCG";
  subsector: "Food & Beverage";
  opportunityType: "sku-sequencing" | "line-speed" | "recipe-optimization" | "packaging-material" | "energy-throughput";
  linesAffected?: string[];
  skusAffected?: string[];
  recipesAffected?: string[];
  throughputIncrease?: number; // percentage
  energySavings?: number; // kWh per unit
  materialSavings?: number; // percentage
  changeoverReduction?: number; // minutes
  wasteReduction?: number; // percentage
  qualityImprovement?: string;
}

export interface FMCGRecommendation extends Recommendation {
  skuSequencing?: string;
  lineSpeedOptimization?: string;
  recipeImprovement?: string;
  packagingOptimization?: string;
  energyEfficiency?: string;
  changeoverSequence?: string[];
  productionScheduling?: Record<string, any>;
}

export interface FMCGPlaybook extends Playbook {
  productionOptimization?: boolean;
  changeoverManagement?: boolean;
  qualityImprovement?: boolean;
  wasteReduction?: boolean;
  energyEfficiency?: boolean;
}

// Legacy interfaces maintained for backward compatibility
export interface Recommendation {
  id: string;
  description: string;
  rationale: string;
  confidence: number;
  estimatedImpact: string;
  sector?: string;
  subsector?: string;
}

export interface Playbook {
  id: string;
  name: string;
  category: string;
  description: string;
  applicability: number; // 0-100
  sector?: string;
  subsector?: string;
}

export interface Scenario {
  id: string;
  name: string;
  parameters: Record<string, unknown>;
  projectedOutcome: string;
  confidence: number;
  sector?: string;
  subsector?: string;
}

// Additional sector-specific metrics and analysis interfaces

// Oil & Gas - Upstream specific metrics
export interface UpstreamLossAnalysis {
  wellDefermentPareto: {
    wellId: string;
    wellName: string;
    defermentHours: number;
    productionLoss: number; // barrels
    rootCause: string;
  }[];
  downtimePareto: {
    equipmentType: string;
    downtimeHours: number;
    frequency: number;
    impact: number; // barrels lost
  }[];
  energyLossAnalysis: {
    category: string;
    energyWaste: number; // kWh
    costImpact: number;
  }[];
}

export interface UpstreamBottleneckAnalysis {
  productionTrainBottlenecks: ProductionTrainBottleneck[];
  flowAssuranceConstraints: {
    constraintType: string;
    location: string;
    severity: "high" | "medium" | "low";
    throughputImpact: number; // percentage
  }[];
  gatheringSystemRestrictions: {
    systemComponent: string;
    capacity: number; // barrels per day
    currentUtilization: number; // percentage
    bottleneckRisk: "high" | "medium" | "low";
  }[];
}

// Power - Transmission specific metrics
export interface TransmissionLossAnalysis {
  tripAnalytics: {
    tripCause: string;
    frequency: number;
    impact: string;
    affectedCustomers: number;
  }[];
  relayMisoperationAnalytics: RelayMisoperation[];
  transmissionLossBreakdown: TransmissionLossMetrics;
}

export interface TransmissionBottleneckAnalysis {
  networkConstraints: NetworkConstraint[];
  congestionPoints: {
    location: string;
    congestionLevel: number; // percentage
    frequencyOfCongestion: number;
    economicImpact: number;
  }[];
  loadingPerformance: {
    equipmentId: string;
    equipmentType: string;
    currentLoading: number; // percentage
    thermalLimit: number; // MW
    utilizationEfficiency: number; // percentage
  }[];
}

// FMCG - Food & Beverage specific metrics
export interface FMCGLossAnalysis {
  microStopAnalysis: {
    stopType: string;
    frequency: number;
    averageDuration: number; // minutes
    unitsLost: number;
    rootCause: string;
  }[];
  fillingLabelingDeviations: {
    deviationType: string;
    frequency: number;
    speedVariation: number; // percentage
    accuracyImpact: number; // percentage
  }[];
  scrapWasteTrends: {
    wasteCategory: string;
    wasteAmount: number;
    costImpact: number;
    trendDirection: "improving" | "stable" | "worsening";
    rootCauseCategory: string;
  }[];
}

export interface FMCGBottleneckAnalysis {
  changeoverConstraints: {
    fromSKU: string;
    toSKU: string;
    changeoverTime: number; // minutes
    efficiency: number; // percentage
    bottleneckFactor: string;
  }[];
  materialShortageImpacts: {
    materialType: string;
    shortageFrequency: number;
    impactDuration: number; // minutes
    unitsLost: number;
  }[];
  lineBlockingStarving: {
    eventType: "blocking" | "starving";
    frequency: number;
    averageDuration: number; // minutes
    rootCause: string;
    impactOnThroughput: number; // percentage
  }[];
}

// Sector-specific KPI interfaces
export interface UpstreamKPIs {
  wellUptimeVsPlanned: number; // percentage
  flowAssuranceDeviationTrends: number; // percentage
  energyPerBarrelMetrics: number; // kWh per barrel
  productionDefermentHours: number;
  separatorEfficiency: number; // percentage
  gatheringSystemUtilization: number; // percentage
}

export interface TransmissionKPIs {
  transmissionLosses: number; // percentage
  saidiPerformance: number; // minutes
  saifiPerformance: number; // interruptions per customer
  networkLoadingMetrics: number; // percentage
  relayReliability: number; // percentage
  gridStabilityIndex: number; // percentage
}

export interface FMCGKPIs {
  packagingMaterialYields: number; // percentage
  batchRecipeYieldsVsStandard: number; // percentage
  changeoverEfficiencyMetrics: number; // percentage
  microStopFrequency: number; // per hour
  qualityYieldPercentage: number; // percentage
  wastePercentage: number; // percentage
}

// Union types for discriminated unions
export type SectorSpecificPerformancePanel =
  | PerformancePanel
  | UpstreamPerformancePanel
  | TransmissionPerformancePanel
  | FMCGPerformancePanel;

export type SectorSpecificSIMBoard =
  | SIMBoard
  | UpstreamSIMBoard
  | TransmissionSIMBoard
  | FMCGSIMBoard;

export type SectorSpecificCIProject =
  | DetailedCIProject
  | UpstreamCIProject
  | TransmissionCIProject
  | FMCGCIProject;

export type SectorSpecificOptimisationOpportunity =
  | DetailedOptimisationOpportunity
  | UpstreamOptimisationOpportunity
  | TransmissionOptimisationOpportunity
  | FMCGOptimisationOpportunity;

export type SectorSpecificRootCause =
  | RootCause
  | UpstreamRootCause
  | TransmissionRootCause
  | FMCGRootCause;

export type SectorSpecificCountermeasure =
  | DetailedCountermeasure
  | UpstreamCountermeasure
  | TransmissionCountermeasure
  | FMCGCountermeasure;

export type SectorSpecificRecommendation =
  | Recommendation
  | UpstreamRecommendation
  | TransmissionRecommendation
  | FMCGRecommendation;

export type SectorSpecificPlaybook =
  | Playbook
  | UpstreamPlaybook
  | TransmissionPlaybook
  | FMCGPlaybook;

// Enhanced union types for cognitive navigation patterns
export type EnhancedOptimisationOpportunity = DetailedOptimisationOpportunity | SectorSpecificOptimisationOpportunity;
export type EnhancedAIRecommendation = DetailedAIRecommendation | SectorSpecificRecommendation;
export type EnhancedOptimisationPlaybook = DetailedOptimisationPlaybook | SectorSpecificPlaybook;
export type EnhancedOptimisationSimulation = DetailedOptimisationSimulation;
export type EnhancedOptimisationExecution = OptimisationExecution;

// Cognitive navigation type guards
export function isCognitiveNavigationStructure(obj: any): obj is OptimiseNavigationStructure {
  return obj &&
    typeof obj === 'object' &&
    'performance' in obj &&
    'leanExecution' in obj &&
    'continuousImprovement' in obj &&
    'optimisation' in obj;
}

export function hasAnalyticalPattern(item: any): boolean {
  return item?.cognitivePattern === 'analytical';
}

export function hasOperationalPattern(item: any): boolean {
  return item?.cognitivePattern === 'operational';
}

export function hasProjectPattern(item: any): boolean {
  return item?.cognitivePattern === 'project';
}

export function hasDecisionPattern(item: any): boolean {
  return item?.cognitivePattern === 'decision';
}

// Template type mapping
export const COGNITIVE_TEMPLATE_MAPPING: Record<CognitivePattern, {
  listTemplate: ListTemplate;
  workPaneType: WorkPaneType;
  hasSubItems: boolean;
}> = {
  analytical: {
    listTemplate: 'dashboard',
    workPaneType: 'multi-tab-analytical',
    hasSubItems: false
  },
  operational: {
    listTemplate: 'dashboard',
    workPaneType: 'structured-workflow',
    hasSubItems: true
  },
  project: {
    listTemplate: 'kanban',
    workPaneType: 'project-lifecycle',
    hasSubItems: true
  },
  decision: {
    listTemplate: 'analytics',
    workPaneType: 'decision-workflow',
    hasSubItems: true
  }
};

// Cognitive pattern metadata constants
export const COGNITIVE_PATTERNS: Record<CognitivePattern, CognitivePatternMetadata> = {
  analytical: {
    pattern: 'analytical',
    description: 'Single-page analytical workspace for related concepts',
    navigationDepth: 'single',
    workflowType: 'analytical',
    templateStrategy: 'consolidated'
  },
  operational: {
    pattern: 'operational',
    description: 'Multi-page operational workflow for distinct tasks',
    navigationDepth: 'multi',
    workflowType: 'operational',
    templateStrategy: 'separated'
  },
  project: {
    pattern: 'project',
    description: 'Multi-page project lifecycle workflow',
    navigationDepth: 'multi',
    workflowType: 'project',
    templateStrategy: 'separated'
  },
  decision: {
    pattern: 'decision',
    description: 'Multi-page decision and execution workflow',
    navigationDepth: 'multi',
    workflowType: 'decision',
    templateStrategy: 'separated'
  }
};

// CI Reports Data Models
export interface CIReport {
  id: string;
  tenantId: string;
  reportRef: string;
  name: string;
  reportType: string;
  scope: string;
  status: 'draft' | 'in-review' | 'published';
  generatedDate: string;
  author: string;
  recipients: number;
  content: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CIReportFilters {
  status?: 'draft' | 'in-review' | 'published';
  reportType?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Shift Performance Data Models
export interface ShiftPerformanceMetrics {
  id: string;
  tenantId: string;
  shiftId: string;
  performanceScore: number;
  status: 'excellent' | 'good' | 'needs-improvement';
  achievements: number;
  issues: number;
  metrics: Record<string, any>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  shift?: Shift;
}

export interface ShiftPerformanceFilters {
  status?: 'excellent' | 'good' | 'needs-improvement';
  dateFrom?: string;
  dateTo?: string;
}