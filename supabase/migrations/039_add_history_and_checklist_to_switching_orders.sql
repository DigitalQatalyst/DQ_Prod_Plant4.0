-- Migration: 022_add_history_and_checklist_to_switching_orders.sql
-- Description: Adds history and checklist JSONB columns to switching_orders for data diversity

ALTER TABLE switching_orders ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]';
ALTER TABLE switching_orders ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]';

COMMENT ON COLUMN switching_orders.checklist IS 'Execution checklist items with text and completion status';
COMMENT ON COLUMN switching_orders.history IS 'Audit trail of events for the switching order';
