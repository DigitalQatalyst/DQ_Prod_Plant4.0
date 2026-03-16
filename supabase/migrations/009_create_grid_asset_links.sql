-- Create grid_asset_links table to link assets to topology
-- Requirements: 4.3

CREATE TABLE grid_asset_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  node_id UUID REFERENCES grid_nodes(id) ON DELETE CASCADE,
  line_id UUID REFERENCES grid_lines(id) ON DELETE CASCADE,
  CONSTRAINT chk_link_target CHECK (node_id IS NOT NULL OR line_id IS NOT NULL)
);

-- Create index for common queries
CREATE INDEX idx_grid_asset_links_asset ON grid_asset_links(asset_id);