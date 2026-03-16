-- Check switching_order_impacts table structure
\d switching_order_impacts

-- Check the constraint that ensures at least one impact target
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'switching_order_impacts'::regclass 
AND contype = 'c';
