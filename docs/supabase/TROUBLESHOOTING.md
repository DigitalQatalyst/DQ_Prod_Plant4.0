# Supabase Troubleshooting Guide

## Common Issues and Solutions

### Storage Container Unhealthy (Windows)

**Error:**
```
supabase_storage_DQ_Prod_Plant4.0_Skunk container is not ready: unhealthy
```

**Cause:** The storage container health check fails on Windows, but this doesn't affect core functionality for development.

**Solutions:**

#### Option 1: Ignore Storage Health Check (Recommended for Development)
The database, API, and Studio are working fine. You can proceed with development:

```powershell
# Check what's actually running
npx supabase status

# If you see most services as "healthy", you're good to go
# Storage being unhealthy won't affect:
# - Database operations
# - Migrations and seeds
# - API calls
# - Studio access
```

#### Option 2: Expose Docker Daemon (Advanced)
If you need storage functionality:

1. Open Docker Desktop
2. Go to Settings → General
3. Enable "Expose daemon on tcp://localhost:2375 without TLS"
4. Restart Docker Desktop
5. Run: `npx supabase start`

**Warning:** This exposes Docker without TLS. Only use on trusted networks.

#### Option 3: Use WSL2 (Recommended for Production-like Environment)
For a more stable setup:

1. Install WSL2: https://learn.microsoft.com/en-us/windows/wsl/install
2. Install Docker Desktop with WSL2 backend
3. Run Supabase commands from WSL2 terminal

### Seeds Not Running

**Error:**
```
ERROR: syntax error at or near "\"
```

**Cause:** Using `\i` psql meta-commands in seed files.

**Solution:** Seeds are configured in `supabase/config.toml`:

```toml
[db.seed]
enabled = true
sql_paths = [
  "./seed/001_transmission_tenant.sql",
  "./seed/002_grid_topology.sql",
  # ... add more seeds here
]
```

Don't use `\i` commands. List files directly in config.toml.

### Supabase Command Not Found

**Error:**
```
supabase : The term 'supabase' is not recognized
```

**Solution:** Use `npx` prefix:

```powershell
# Wrong
supabase start

# Correct
npx supabase start
```

Or install globally:
```powershell
npm install -g supabase
```

### Port Already in Use

**Error:**
```
Error: port 54321 is already in use
```

**Solution:**

```powershell
# Stop existing Supabase instance
npx supabase stop

# Or stop specific port
# Find process using port
netstat -ano | findstr :54321

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Start Supabase again
npx supabase start
```

### Docker Not Running

**Error:**
```
Cannot connect to the Docker daemon
```

**Solution:**

1. Start Docker Desktop
2. Wait for Docker to fully start (whale icon in system tray)
3. Run: `npx supabase start`

### Migration Failed

**Error:**
```
Applying migration XXX_name.sql... ERROR
```

**Solutions:**

1. **Check syntax:**
   ```powershell
   npx supabase db lint
   ```

2. **Reset database:**
   ```powershell
   npx supabase db reset
   ```

3. **Check migration file:**
   - Ensure proper SQL syntax
   - Check for missing semicolons
   - Verify table/column names

### Seed Failed

**Error:**
```
Seeding data from supabase/seed/XXX.sql... ERROR
```

**Solutions:**

1. **Check preconditions:**
   - Ensure dependent seeds ran first
   - Verify tenant exists
   - Check foreign key references

2. **Run seed manually:**
   ```powershell
   npx supabase db execute --file supabase/seed/007_property_sets.sql
   ```

3. **Check seed order in config.toml:**
   - Seeds must be in dependency order
   - Parent data must exist before child data

### Validation Script Fails

**Error:**
```
Failed to query property_sets
```

**Solutions:**

1. **Ensure Supabase is running:**
   ```powershell
   npx supabase status
   ```

2. **Reset database:**
   ```powershell
   npx supabase db reset
   ```

3. **Check table exists:**
   - Open Studio: http://127.0.0.1:54323
   - Go to Table Editor
   - Verify tables exist

### Studio Not Loading

**Error:**
Browser shows "Cannot connect" at http://127.0.0.1:54323

**Solutions:**

1. **Check if Studio is running:**
   ```powershell
   npx supabase status
   ```

2. **Restart Supabase:**
   ```powershell
   npx supabase stop
   npx supabase start
   ```

3. **Check firewall:**
   - Ensure port 54323 is not blocked
   - Add exception for Docker in Windows Firewall

### Database Connection Refused

**Error:**
```
connection refused at 127.0.0.1:54322
```

**Solutions:**

1. **Check if database is running:**
   ```powershell
   npx supabase status
   ```

2. **Check Docker containers:**
   ```powershell
   docker ps
   ```

3. **Restart Supabase:**
   ```powershell
   npx supabase stop
   npx supabase start
   ```

## Windows-Specific Issues

### Analytics Warning

**Warning:**
```
WARNING: Analytics on Windows requires Docker daemon exposed on tcp://localhost:2375
```

**Impact:** Analytics won't work, but doesn't affect core functionality.

**Solution:** Ignore for development, or follow Option 2 in "Storage Container Unhealthy" above.

### Service Version Mismatch

**Warning:**
```
WARNING: You are running different service versions locally than your linked project
```

**Impact:** Minor version differences usually don't cause issues.

**Solution:**

```powershell
# Update local versions
npx supabase link --project-ref your-project-ref
npx supabase db pull
```

Or ignore if working fine locally.

## Diagnostic Commands

### Check Service Status
```powershell
npx supabase status
```

### View Logs
```powershell
# All logs
npx supabase logs

# Database logs only
npx supabase logs --db

# Specific service
npx supabase logs --service postgres
```

### Check Docker Containers
```powershell
# List running containers
docker ps

# Check specific container logs
docker logs supabase_db_DQ_Prod_Plant4.0_Skunk
```

### Test Database Connection
```powershell
# Using psql (if installed)
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Or use Studio SQL Editor
# http://127.0.0.1:54323
```

### Check Migrations
```powershell
# List applied migrations
npx supabase migration list

# Check for issues
npx supabase db lint
```

## Getting Help

### Check Logs First
```powershell
npx supabase logs
```

### Run with Debug
```powershell
npx supabase start --debug
```

### Check Supabase Status Page
https://status.supabase.com/

### Community Support
- **Discord**: https://discord.supabase.com/
- **GitHub Issues**: https://github.com/supabase/supabase/issues
- **Docs**: https://supabase.com/docs

## Quick Fixes

### Nuclear Option (Reset Everything)
```powershell
# Stop Supabase
npx supabase stop

# Remove volumes (WARNING: deletes all data)
docker volume prune -f

# Start fresh
npx supabase start
```

### Restart Docker
1. Right-click Docker Desktop icon
2. Select "Restart Docker Desktop"
3. Wait for Docker to start
4. Run: `npx supabase start`

### Clear npm Cache
```powershell
npm cache clean --force
npx clear-npx-cache
```

## Prevention Tips

### ✅ Best Practices

1. **Always use npx:**
   ```powershell
   npx supabase start  # Not: supabase start
   ```

2. **Check status before working:**
   ```powershell
   .\scripts\validation\check-supabase-status.ps1
   ```

3. **Reset database regularly:**
   ```powershell
   npx supabase db reset
   ```

4. **Keep Docker running:**
   - Don't close Docker Desktop while working
   - Ensure Docker starts on system boot

5. **Validate after changes:**
   ```powershell
   .\scripts\validation\validate-cycle1-simple.ps1
   ```

### ❌ Common Mistakes

1. **Forgetting npx prefix**
2. **Not starting Docker first**
3. **Modifying old migrations**
4. **Running seeds out of order**
5. **Not checking logs when errors occur**

## Still Stuck?

1. Check this guide again
2. Run diagnostic commands
3. Check [docs/validation/cycle1-guide.md](../validation/cycle1-guide.md)
4. Check [supabase/README.md](../../supabase/README.md)
5. Ask for help with logs and error messages

---

**Most issues can be resolved with: `npx supabase stop && npx supabase start`**
