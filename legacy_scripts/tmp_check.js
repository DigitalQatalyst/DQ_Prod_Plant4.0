const fs = require('fs');
const perf = fs.readFileSync('c:/Users/Dell Ultrabook/Desktop/EP.IoT/DQ_Prod_Plant4.0_Skunk/src/types/performance.ts', 'utf8');
const opt = fs.readFileSync('c:/Users/Dell Ultrabook/Desktop/EP.IoT/DQ_Prod_Plant4.0_Skunk/src/types/optimise.ts', 'utf8');
const missing = [
    'PerformanceFilters', 'PerformancePanel', 'CreatePerformancePanelRequest', 'UpdatePerformancePanelRequest',
    'LossFilters', 'PerformanceLoss', 'CreatePerformanceLossRequest', 'UpdatePerformanceLossRequest',
    'BottleneckFilters', 'PerformanceBottleneck', 'CreatePerformanceBottleneckRequest', 'UpdatePerformanceBottleneckRequest',
    'TrendFilters', 'PerformanceTrend', 'BenchmarkFilters', 'PerformanceBenchmark',
    'PerformanceExportRequest', 'ExportResult', 'SIMBoard', 'KPIMetric',
    'SwitchingOrder', 'CreateSwitchingOrderRequest', 'UpdateSwitchingOrderRequest',
    'Outage', 'CreateOutageRequest', 'UpdateOutageRequest',
    'CreateSimIssueRequest', 'SimIssue', 'UpdateSimIssueRequest',
    'CreateSimActionRequest', 'SimAction', 'UpdateSimActionRequest',
    'CIStage', 'CIProject', 'CreateCIProjectRequest', 'UpdateCIProjectRequest',
    'RootCauseAnalysis', 'UpsertRCARequest', 'CreateCountermeasureRequest', 'Countermeasure', 'UpdateCountermeasureRequest',
    'CIKPI', 'CIImpact', 'UpsertImpactRequest', 'CIDocument', 'CreateCIDocumentRequest',
    'OptimisationOpportunity', 'UpdateOpportunityRequest', 'AIRecommendation', 'CreateRecommendationRequest', 'UpdateRecommendationRequest',
    'PlaybookFilters', 'OptimisationPlaybook', 'CreateSimulationRequest', 'OptimisationSimulation', 'UpdateSimulationRequest',
    'PublishToSimRequest', 'PublishEvent', 'PublishToCiRequest', 'ShiftPerformanceMetrics'
];

const inPerf = missing.filter(m => perf.includes(`export interface ${m}`) || perf.includes(`export type ${m}`));
const inOpt = missing.filter(m => opt.includes(`export interface ${m}`) || opt.includes(`export type ${m}`));

// Also check what's missing entirely!
const stillMissing = missing.filter(m => !inPerf.includes(m) && !inOpt.includes(m));

console.log('--- Performance ---');
console.log(inPerf.join(', '));
console.log('--- Optimise ---');
console.log(inOpt.join(', '));
console.log('--- Still Missing ---');
console.log(stillMissing.join(', '));
