-- Check sim_action_links table structure
\d sim_action_links

-- Check the constraint that ensures at least one link target
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'sim_action_links'::regclass 
AND contype = 'c';
