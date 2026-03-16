-- Verification script for SIM tables migration
-- Run this after applying migration 013_create_sim_tables.sql

\echo '=== Verifying SIM Tables Migration ==='
\echo ''

-- Check if all SIM tables exist
\echo 'Test 1: Checking if SIM tables exist...'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE 'sim_%' OR table_name LIKE '%order%' OR table_name LIKE 'outage%')
ORDER BY table_name;

\echo ''
\echo 'Expected tables:'
\echo '  - outage_impacts'
\echo '  - outages'
\echo '  - sim_action_links'
\echo '  - sim_actions'
\echo '  - sim_boards'
\echo '  - sim_issues'
\echo '  - sim_kpis'
\echo '  - sim_shifts'
\echo '  - switching_order_impacts'
\echo '  - switching_orders'
\echo ''

-- Check indexes
\echo 'Test 2: Checking indexes...'
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND (tablename LIKE 'sim_%' OR tablename LIKE '%order%' OR tablename LIKE 'outage%')
ORDER BY tablename, indexname;

\echo ''

-- Check RLS is enabled
\echo 'Test 3: Checking if RLS is enabled...'
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND (tablename LIKE 'sim_%' OR tablename LIKE '%order%' OR tablename LIKE 'outage%')
ORDER BY tablename;

\echo ''

-- Check constraints
\echo 'Test 4: Checking constraints...'
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
AND (tc.table_name LIKE 'sim_%' OR tc.table_name LIKE '%order%' OR tc.table_name LIKE 'outage%')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

\echo ''
\echo '=== Verification Complete ==='
\echo ''
\echo 'If all tables, indexes, and RLS policies are present, the migration was successful!'
\echo ''
