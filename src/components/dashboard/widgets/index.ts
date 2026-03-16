/**
 * Widget components barrel export
 * Provides centralized access to all widget-related components
 */

export { WidgetErrorBoundary } from "./WidgetErrorBoundary";
export {
  BaseWidget,
  createWidgetError,
  createWidgetEmpty,
  type BaseWidgetProps,
  type WidgetErrorState,
  type WidgetEmptyState,
} from "./BaseWidget";

// Widget type components
export { KPIWidget } from "./KPIWidget";
export { StatusBoardWidget } from "./StatusBoardWidget";
export { ListWidget } from "./ListWidget";
export { TableWidget } from "./TableWidget";
