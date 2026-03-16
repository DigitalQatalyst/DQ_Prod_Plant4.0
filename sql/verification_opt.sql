SELECT 
  (SELECT COUNT(*) FROM opt_opportunities WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as opportunities,
  (SELECT COUNT(*) FROM opt_recommendations WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as recommendations,
  (SELECT COUNT(*) FROM opt_playbooks WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as playbooks,
  (SELECT COUNT(*) FROM opt_simulations WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as simulations,
  (SELECT COUNT(*) FROM opt_publish_events WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as publish_events;
