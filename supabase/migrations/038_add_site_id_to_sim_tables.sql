-- Migration: Add site_id to SIM tables for better filtering
-- Description: Adds site_id column to switching_orders, outages, sim_issues, and sim_actions

ALTER TABLE switching_orders ADD COLUMN site_id UUID REFERENCES sites(id);
ALTER TABLE outages ADD COLUMN site_id UUID REFERENCES sites(id);
ALTER TABLE sim_issues ADD COLUMN site_id UUID REFERENCES sites(id);
ALTER TABLE sim_actions ADD COLUMN site_id UUID REFERENCES sites(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_switching_orders_site_id ON switching_orders(site_id);
CREATE INDEX IF NOT EXISTS idx_outages_site_id ON outages(site_id);
CREATE INDEX IF NOT EXISTS idx_sim_issues_site_id ON sim_issues(site_id);
CREATE INDEX IF NOT EXISTS idx_sim_actions_site_id ON sim_actions(site_id);
