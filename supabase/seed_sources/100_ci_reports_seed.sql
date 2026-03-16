-- CI REPORTS SEED DATA
-- This is extracted from 009_ci_seed.sql to maintain the original structure

BEGIN;

-- Insert CI Reports
INSERT INTO ci_reports (tenant_id, report_ref, name, report_type, scope, status, generated_date, author, recipients, content)
SELECT 
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' AND sector = 'power' AND subsector = 'transmission' LIMIT 1),
  v.report_ref,
  v.name,
  v.report_type,
  v.scope,
  v.status,
  v.generated_date,
  v.author,
  v.recipients,
  v.content::jsonb
FROM (VALUES
  ('RPT-2024-001', 'Monthly CI Summary - December', 'Summary Report', 'Plant-wide', 'published', CURRENT_DATE - INTERVAL '15 days', 'CI Team', 15, '{"sections": ["Executive Summary", "Project Status", "Impact Analysis", "Recommendations"]}'),
  ('RPT-2024-002', 'Q4 Impact Assessment', 'Impact Report', 'All Projects', 'published', CURRENT_DATE - INTERVAL '20 days', 'Sarah Mohammed', 12, '{"sections": ["Impact Overview", "KPI Analysis", "Cost Savings", "Future Outlook"]}'),
  ('RPT-2024-003', 'Protection System Improvements', 'Technical Report', 'Protection Projects', 'in-review', CURRENT_DATE - INTERVAL '10 days', 'Ahmed Al-Rashid', 8, '{"sections": ["Current State", "Improvements", "Test Results", "Recommendations"]}'),
  ('RPT-2024-004', 'Reliability Enhancement Status', 'Status Report', 'Active Projects', 'in-review', CURRENT_DATE - INTERVAL '8 days', 'Fatima Ali', 10, '{"sections": ["Project Status", "Milestones", "Risks", "Next Steps"]}'),
  ('RPT-2024-005', 'Asset Condition Monitoring Report', 'Technical Report', 'Asset Management', 'published', CURRENT_DATE - INTERVAL '25 days', 'Omar Hassan', 18, '{"sections": ["Asset Health", "Monitoring Results", "Maintenance Needs", "Budget Impact"]}'),
  ('RPT-2024-006', 'January CI Planning', 'Planning Report', 'Future Projects', 'draft', CURRENT_DATE - INTERVAL '3 days', 'Mohammed Khalil', 0, '{"sections": ["Proposed Projects", "Resource Allocation", "Timeline", "Budget"]}'),
  ('RPT-2024-007', 'Loss Reduction Initiative', 'Impact Report', 'Efficiency Projects', 'draft', CURRENT_DATE - INTERVAL '5 days', 'Aisha Saeed', 0, '{"sections": ["Current Losses", "Reduction Strategies", "Expected Impact", "Implementation Plan"]}'),
  ('RPT-2024-008', 'Training Effectiveness Analysis', 'Analysis Report', 'Training Programs', 'published', CURRENT_DATE - INTERVAL '30 days', 'Khalid Nasser', 14, '{"sections": ["Training Overview", "Effectiveness Metrics", "Skill Gaps", "Recommendations"]}')
) AS v(report_ref, name, report_type, scope, status, generated_date, author, recipients, content)
ON CONFLICT (tenant_id, report_ref)
DO UPDATE SET
  name = EXCLUDED.name,
  report_type = EXCLUDED.report_type,
  scope = EXCLUDED.scope,
  status = EXCLUDED.status,
  generated_date = EXCLUDED.generated_date,
  author = EXCLUDED.author,
  recipients = EXCLUDED.recipients,
  content = EXCLUDED.content,
  updated_at = now();

COMMIT;
