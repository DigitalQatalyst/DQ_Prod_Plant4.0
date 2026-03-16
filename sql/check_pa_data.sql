-- Check PA tables rowcounts
SELECT 'pa_tag_mappings' as table_name, COUNT(*) as row_count FROM pa_tag_mappings
UNION ALL
SELECT 'pa_control_models', COUNT(*) FROM pa_control_models
UNION ALL
SELECT 'pa_action_bindings', COUNT(*) FROM pa_action_bindings
UNION ALL
SELECT 'pa_triggers', COUNT(*) FROM pa_triggers
UNION ALL
SELECT 'pa_alarm_rules', COUNT(*) FROM pa_alarm_rules
UNION ALL
SELECT 'pa_event_patterns', COUNT(*) FROM pa_event_patterns;
