-- Migration: Add priority to sim_actions
-- Description: Adds priority column to sim_actions table for better task management

ALTER TABLE sim_actions ADD COLUMN priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_sim_actions_priority ON sim_actions(priority);
