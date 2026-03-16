-- Seed data for property sets (reusable metadata field collections)
-- Requirements: 9.1, 9.3, 9.4
-- Creates 5 property sets: technical, operational, safety, financial, maintenance

BEGIN;

-- Precondition: Verify tenant exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM tenants WHERE scenario_tag = 'power_transmission_demo_v1'
  ) THEN
    RAISE EXCEPTION 'Precondition failed: Transmission tenant does not exist';
  END IF;
END $$;

-- Upsert property sets using CTE pattern
WITH tenant AS (
  SELECT id FROM tenants WHERE scenario_tag = 'power_transmission_demo_v1'
),
upsert_property_sets AS (
  INSERT INTO property_sets (tenant_id, name, type, fields, description)
  SELECT 
    tenant.id,
    v.name,
    v.type,
    v.fields::JSONB,
    v.description
  FROM tenant
  CROSS JOIN (VALUES
    (
      'Technical Specifications',
      'technical',
      '[
        {"id": "voltage_rating", "label": "Voltage Rating", "dataType": "number", "unit": "kV", "required": true},
        {"id": "current_rating", "label": "Current Rating", "dataType": "number", "unit": "A", "required": true},
        {"id": "frequency", "label": "Frequency", "dataType": "number", "unit": "Hz", "required": false},
        {"id": "power_rating", "label": "Power Rating", "dataType": "number", "unit": "MVA", "required": false}
      ]',
      'Technical specifications for electrical equipment'
    ),
    (
      'Operational Parameters',
      'operational',
      '[
        {"id": "operating_temp_min", "label": "Min Operating Temp", "dataType": "number", "unit": "°C", "required": false},
        {"id": "operating_temp_max", "label": "Max Operating Temp", "dataType": "number", "unit": "°C", "required": false},
        {"id": "load_factor", "label": "Load Factor", "dataType": "number", "unit": "%", "required": false},
        {"id": "efficiency", "label": "Efficiency", "dataType": "number", "unit": "%", "required": false}
      ]',
      'Operational parameters and limits'
    ),
    (
      'Safety Compliance',
      'safety',
      '[
        {"id": "safety_class", "label": "Safety Class", "dataType": "string", "required": true},
        {"id": "insulation_class", "label": "Insulation Class", "dataType": "string", "required": false},
        {"id": "ip_rating", "label": "IP Rating", "dataType": "string", "required": false},
        {"id": "arc_flash_rating", "label": "Arc Flash Rating", "dataType": "string", "unit": "cal/cm²", "required": false}
      ]',
      'Safety and compliance specifications'
    ),
    (
      'Financial Data',
      'financial',
      '[
        {"id": "purchase_cost", "label": "Purchase Cost", "dataType": "number", "unit": "USD", "required": false},
        {"id": "installation_cost", "label": "Installation Cost", "dataType": "number", "unit": "USD", "required": false},
        {"id": "annual_maintenance_cost", "label": "Annual Maintenance Cost", "dataType": "number", "unit": "USD", "required": false},
        {"id": "depreciation_years", "label": "Depreciation Period", "dataType": "number", "unit": "years", "required": false}
      ]',
      'Financial and cost tracking data'
    ),
    (
      'Maintenance Schedule',
      'maintenance',
      '[
        {"id": "last_inspection_date", "label": "Last Inspection Date", "dataType": "date", "required": false},
        {"id": "next_inspection_date", "label": "Next Inspection Date", "dataType": "date", "required": false},
        {"id": "maintenance_interval", "label": "Maintenance Interval", "dataType": "number", "unit": "days", "required": false},
        {"id": "warranty_expiry", "label": "Warranty Expiry", "dataType": "date", "required": false}
      ]',
      'Maintenance scheduling and tracking'
    )
  ) AS v(name, type, fields, description)
  ON CONFLICT (tenant_id, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    fields = EXCLUDED.fields,
    description = EXCLUDED.description
  RETURNING id
)
SELECT COUNT(*) FROM upsert_property_sets;

-- Post-seed validation: Ensure minimum count
DO $$
DECLARE
  property_set_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO property_set_count
  FROM property_sets ps
  JOIN tenants t ON ps.tenant_id = t.id
  WHERE t.scenario_tag = 'power_transmission_demo_v1';
  
  IF property_set_count < 5 THEN
    RAISE EXCEPTION 'Post-seed validation failed: Expected >= 5 property sets, found %', property_set_count;
  END IF;
END $$;

COMMIT;
