
SELECT 'compliance_standards' as table_name, COUNT(*) as row_count FROM compliance_standards;
SELECT 'compliance_requirements' as table_name, COUNT(*) as row_count FROM compliance_requirements;
SELECT 'security_exceptions' as table_name, COUNT(*) as row_count FROM security_exceptions;
SELECT 'compliance_evidence' as table_name, COUNT(*) as row_count FROM compliance_evidence;
SELECT name, total_requirements FROM compliance_standards WHERE name IN ('ADHICS', 'NESA IAS', 'CITC Cybersecurity');
