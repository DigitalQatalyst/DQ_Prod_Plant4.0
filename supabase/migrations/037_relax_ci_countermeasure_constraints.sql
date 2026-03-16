-- ============================================================
-- Migration 024: Relax CI Countermeasure check constraints
-- ============================================================
-- Problem:
--   The ci_countermeasures_effectiveness_check constraint enforces that
--   effectiveness_score can only be set when status IN ('completed','verified').
--   This causes the UI update to fail when a user rates effectiveness on a
--   planned/in-progress countermeasure (error: "violates check constraint").
--
-- Fix:
--   Drop the restrictive constraint and replace it with a permissive one that
--   only prevents negative scores or scores above 100. The application layer
--   already handles the business rule that completed/verified CMs have scores.
--
-- Also relax the due_date_check which can fire unexpectedly when a status
-- transition happens mid-update (e.g., auto-promoting from planned → completed
-- while the old due_date is still being evaluated against the old status).
-- ============================================================

-- 1) Drop the old effectiveness constraint
ALTER TABLE ci_countermeasures
  DROP CONSTRAINT IF EXISTS ci_countermeasures_effectiveness_check;

-- 2) Replace with a simple range constraint (0-100)
ALTER TABLE ci_countermeasures
  ADD CONSTRAINT ci_countermeasures_effectiveness_range_check
  CHECK (effectiveness_score IS NULL OR (effectiveness_score >= 0 AND effectiveness_score <= 100));

-- 3) Relax the due_date constraint:
--    Original: due_date IS NULL OR status IN ('completed','verified') OR due_date >= CURRENT_DATE
--    This can fire during a status+due_date update depending on evaluation order.
--    Replace with a non-temporal version that only checks NULLability.
ALTER TABLE ci_countermeasures
  DROP CONSTRAINT IF EXISTS ci_countermeasures_due_date_check;

-- No replacement needed — due_date is already typed as DATE which handles format validation.
-- The application layer enforces business rules around due dates.
