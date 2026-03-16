@echo off
echo Check pending migrations...
call npx supabase migration up

echo.
echo If the above command succeeded, the table should be created.
echo If you still see the error, try reloading the schema cache:
echo.

echo Restarting PostgREST service (via Kong/Rest container restart)...
docker restart supabase_rest_DQ_Prod_Plant4.0_Skunk

echo.
echo Full status check:
call npx supabase status

echo.
echo If the table is still missing, you may need to reset the database (WARNING: Wipes data):
echo npx supabase db reset
pause
