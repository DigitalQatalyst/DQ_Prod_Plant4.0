SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE 'sim_%' OR table_name LIKE '%order%' OR table_name LIKE 'outage%') ORDER BY table_name;
