// Test file to verify all APM components can be imported
import {
  APMPageShell,
  APMAssetList,
  HealthIndexCard,
  SignalKPIGrid,
  MiniTrendChart,
  AlertList,
  RootCausePanel,
  RULCard,
  FailureProbabilityCard,
  BenchmarkTable,
  DowntimeTable,
  RecommendationList,
  ExportActionsPanel
} from './index';

// Verify all components are defined
const components = {
  APMPageShell,
  APMAssetList,
  HealthIndexCard,
  SignalKPIGrid,
  MiniTrendChart,
  AlertList,
  RootCausePanel,
  RULCard,
  FailureProbabilityCard,
  BenchmarkTable,
  DowntimeTable,
  RecommendationList,
  ExportActionsPanel
};

console.log('All APM components imported successfully:', Object.keys(components));

export default components;