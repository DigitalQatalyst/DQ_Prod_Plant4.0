-- Quick seed for tenant only
BEGIN;

-- Upsert tenant and capture its UUID
WITH upsert_tenant AS (
  INSERT INTO tenants (id, name, sector, subsector, scenario_tag)
  VALUES ('69083830-a193-4f8b-aab2-0d17349d286c', 'DEWA - Transmission', 'power', 'transmission', 'power_transmission_demo_v1')
  ON CONFLICT (name, sector, subsector, scenario_tag)
  DO UPDATE SET updated_at = now()
  RETURNING id
),
tenant AS (
  SELECT id FROM upsert_tenant
),
-- Upsert sites using tenant UUID
upsert_sites AS (
  INSERT INTO sites (tenant_id, name, region, geo_lat, geo_lng, site_type)
  SELECT 
    tenant.id,
    v.name,
    v.region,
    v.geo_lat,
    v.geo_lng,
    v.site_type
  FROM tenant
  CROSS JOIN (VALUES
    ('Dubai Main Substation', 'Dubai', 25.2048, 55.2708, 'substation'),
    ('Jebel Ali Grid Station', 'Jebel Ali', 25.0118, 55.1272, 'switching-station'),
    ('Al Aweer Regional Hub', 'Al Aweer', 25.1584, 55.4444, 'control-center')
  ) AS v(name, region, geo_lat, geo_lng, site_type)
  ON CONFLICT (tenant_id, name)
  DO UPDATE SET
    region = EXCLUDED.region,
    geo_lat = EXCLUDED.geo_lat,
    geo_lng = EXCLUDED.geo_lng,
    site_type = EXCLUDED.site_type
  RETURNING id, name
)
SELECT COUNT(*) FROM upsert_sites;

COMMIT;
