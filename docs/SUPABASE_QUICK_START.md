# Supabase Quick Start Guide

## Step 1: Start Supabase

Make sure Docker Desktop is running, then:

```bash
npx supabase start
```

**Note:** First time will take 2-5 minutes to download Docker images. Be patient!

## Step 2: Get Your Credentials

Once Supabase starts successfully, run:

```bash
npx supabase status
```

You'll see output with an **"🔑 Authentication Keys"** section:

```
╭──────────────────────────────────────────────────────────────╮
│ 🔑 Authentication Keys                                       │
├─────────────┬────────────────────────────────────────────────┤
│ Publishable │ sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH │  ← THIS IS YOUR ANON KEY!

╰─────────────┴────────────────────────────────────────────────╯
```

**Copy the `Publishable` key value!** This is your anon key.

## Step 3: Update Your .env File

I've already created `.env.development` with your actual keys from `npx supabase status`.

The file now contains:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
VITE_DATA_BACKEND=hybrid
```

**Note:** The "Publishable" key from the Authentication Keys section is your anon key.

## Step 4: Verify Database Setup

Check if migrations were applied:

```bash
npx supabase db psql
```

Then run:

```sql
-- Should show your tables
\dt

-- Check if tenant exists
SELECT COUNT(*) FROM tenants;

-- Exit
\q
```

**Expected tables:**
- tenants
- sites
- assets
- asset_types
- grid_nodes
- grid_lines
- grid_asset_links
- alerts
- tags
- telemetry_points
- performance_panels
- performance_losses
- performance_bottlenecks
- performance_trends
- performance_benchmarks

## Step 5: Load Seed Data (if needed)

If tables are empty, manually load seed data:

```bash
npx supabase db psql < supabase/seed/001_transmission_tenant.sql
npx supabase db psql < supabase/seed/002_grid_topology.sql
npx supabase db psql < supabase/seed/003_assets.sql
npx supabase db psql < supabase/seed/006_grid_asset_links.sql
npx supabase db psql < supabase/seed/004_telemetry_alerts.sql
npx supabase db psql < supabase/seed/005_operational.sql
npx supabase db psql < supabase/seed/007_performance_data.sql
```

## Step 6: Start Your App

```bash
npm run dev
```

Your app will now use:
- **Supabase data** for Power Transmission pages
- **Mock data** for Upstream Oil & Gas pages

## Useful Commands

### Check Supabase Status
```bash
npx supabase status
```

### View Supabase Studio (Database UI)
Open in browser: http://localhost:54323

### Stop Supabase
```bash
npx supabase stop
```

### Reset Database (Fresh Start)
```bash
npx supabase db reset
```

### View Database Logs
```bash
npx supabase logs db
```

### Access Database Shell
```bash
npx supabase db psql
```

## Troubleshooting

### Issue: "supabase start is not running"

**Solution:** Start Supabase first:
```bash
npx supabase start
```

### Issue: Docker not running

**Solution:** 
1. Open Docker Desktop
2. Wait for it to fully start (check system tray)
3. Try again

### Issue: Port already in use

**Solution:**
```bash
# Stop any existing instances
npx supabase stop

# Or check what's using the port
netstat -ano | findstr :54321
```

### Issue: Migrations not applied

**Solution:**
```bash
# Reset and reapply everything
npx supabase db reset
```

### Issue: Empty data in app

**Checklist:**
1. ✅ Supabase is running: `npx supabase status`
2. ✅ `.env.development` has correct URL and key
3. ✅ `VITE_DATA_BACKEND=hybrid` is set
4. ✅ Restart dev server: `npm run dev`
5. ✅ Check browser console for errors

### Issue: Supabase start hangs

**Solution:**
1. Stop: `npx supabase stop`
2. Clean Docker: `docker system prune -a` (WARNING: removes all unused Docker data)
3. Restart Docker Desktop
4. Try again: `npx supabase start`

## What Data Gets Loaded?

### Power Transmission Demo Data:
- **1 Tenant**: DEWA - Transmission
- **3 Sites**: Dubai Main, Jebel Ali, Al Aweer
- **5 Grid Nodes**: Substations and connection points
- **6 Grid Lines**: Transmission lines
- **15 Assets**: Transformers, breakers, meters
- **30 Telemetry Points**: Real-time monitoring
- **12 Alerts**: Sample alerts

## Next Steps

1. **Explore Supabase Studio**: http://localhost:54323
2. **View Power Transmission pages** in your app
3. **Check the data** is loading correctly
4. **Customize seed data** in `supabase/seed/` files

## Need Help?

- Check `LOCAL_SUPABASE_SETUP.md` for detailed setup
- Check `docs/SUPABASE_SETUP.md` for architecture details
- View logs: `npx supabase logs`
