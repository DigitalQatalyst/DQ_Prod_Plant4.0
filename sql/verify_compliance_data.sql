
-- Verification Script: Check Compliance Data Counts

SELECT 'Compliance Standards' as metric, COUNT(*) as count FROM compliance_standards
UNION ALL
SELECT 'Compliance Requirements' as metric, COUNT(*) as count FROM compliance_requirements
UNION ALL
SELECT 'Compliance Evidence' as metric, COUNT(*) as count FROM compliance_evidence
UNION ALL
SELECT 'Audit Readiness Scenarios' as metric, COUNT(*) as count FROM compliance_standards WHERE category IN ('regulatory', 'cybersecurity') AND total_requirements > 0;

-- Check specific standards existence
SELECT name, total_requirements, compliance_score 
FROM compliance_standards 
ORDER BY name;
