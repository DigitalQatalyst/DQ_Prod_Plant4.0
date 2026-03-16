# Local Supabase Setup for Power Transmission Data

This guide walks you through setting up Supabase locally for the power transmission sector demo using `npx`.

## Prerequisites

1. **Install Docker Desktop**
   
   Supabase CLI uses Docker to run the local stack.
   - Download from: https://www.docker.com/products/docker-desktop
   - Install and start Docker Desktop
   - Wait for Docker to fully initialize (check system tray icon)

2. **Node.js and npm**
   
   Make sure you have Node.js installed (comes with npm and npx):
   ```bash
   
   # npm (cross-platform)
   npm install -g supabase
   ```

2. **Install Docker Desktop**
   
   Supabase CLI uses Docker to run the local stack.
   - Download from: https://www.docker.com/products/docker-desktop
   - Make sure Docker is running before proceeding

3. **Verify Installation**
   
   ```bash
   supabase --version
   docker --version
   ```

## Quick Start (5 minutes)

### 1. Start Supabase Local Stack

From your project root directory:

```bash
supabase start
```

This will:
- Pull Docker images (first time only, ~2-3 minutes)
- Start PostgreSQL, PostgREST, GoTrue, and other services
- Apply all migrations from `supabase/migrations/`
- Run seed data from `supabase/seed/`

Wait for the output showing all services are running. You'll see something like:

```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Configure Your Environment

Copy the `.env.example` to create your local environment file:

```bash
copy .env.example .env.development
```

Edit `.env.development` and add your local Supabase credentials:

```env
# Use the values from 'supabase start' output
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<paste-anon-key-from-output>

# Use hybrid mode for Power Transmission demo
VITE_DATA_BACKEND=hybrid
```

### 3. Start Your Development Server

```bash
npm run dev
```

Your app will now use:
- **Supabase data** for Power Transmission pages
- **Mock data** for Upstream Oil & Gas pages

### 4. Explore the Data

Open Supabase Studio in your browser:
```
http://localhost:54323
```

You can browse tables, run queries, and inspect the seeded data.

## What Data Gets Loaded?

The seed files create a complete Power Transmission demo with:

### Tenant & Sites
- **1 Tenant**: DEWA - Transmission
- **3 Sites**: 
  - Dubai Main Substation
  - Jebel Ali Grid Station
  - Al Aweer Regional Hub

### Grid Topology
- **5 Grid Nodes**: Substations and connection points
- **6 Grid Lines**: Transmission lines connecting nodes
- **18 Asset Links**: Connections between assets and grid topology

### Assets
- **4 Asset Types**: Transformers, Circuit Breakers, Bays, Smart Meters
- **15 Assets**: Distributed across the 3 sites

### Monitoring Data
- **10 Tags**: Voltage, current, power, frequency, etc.
- **30 Telemetry Points**: Real-time monitoring points
- **12 Alerts**: Sample alerts for demo purposes

### Operational Data
- Automation workflows
- Alarm rules
- CI projects

## Common Commands

### Check Status
```bash
supabase status
```

### Stop Services
```bash
supabase stop
```

### Reset Database (Fresh Start)
```bash
supabase db reset
```
This will:
- Drop all data
- Re-run all migrations
- Re-seed all data

### View Logs
```bash
supabase logs
```

### Access Database Directly
```bash
supabase db psql
```

## Troubleshooting

### Issue: Docker not running
**Error**: `Cannot connect to the Docker daemon`

**Solution**: Start Docker Desktop and wait for it to fully initialize.

### Issue: Port already in use
**Error**: `Port 54321 is already allocated`

**Solution**: 
```bash
# Stop any existing Supabase instances
supabase stop

# Or change ports in supabase/config.toml
```

### Issue: Migrations fail
**Error**: `Migration failed: relation already exists`

**Solution**:
```bash
# Reset the database
supabase db reset
```

### Issue: No data showing in app
**Checklist**:
1. Verify Supabase is running: `supabase status`
2. Check environment variables in `.env.development`
3. Confirm `VITE_DATA_BACKEND=hybrid` or `supabase`
4. Restart dev server: `npm run dev`
5. Check browser console for errors

### Issue: Seed data not loading
**Solution**:
```bash
# Manually run seed files in order
supabase db psql < supabase/seed/001_transmission_tenant.sql
supabase db psql < supabase/seed/002_grid_topology.sql
supabase db psql < supabase/seed/003_assets.sql
supabase db psql < supabase/seed/006_grid_asset_links.sql
supabase db psql < supabase/seed/004_telemetry_alerts.sql
supabase db psql < supabase/seed/005_operational.sql
```

## Verify Your Setup

### 1. Check Database Tables
```bash
supabase db psql
```

Then run:
```sql
-- Should return 1 tenant
SELECT COUNT(*) FROM tenants;

-- Should return 3 sites
SELECT COUNT(*) FROM sites;

-- Should return 15 assets
SELECT COUNT(*) FROM assets;

-- Should return 5 grid nodes
SELECT COUNT(*) FROM grid_nodes;

-- Should return 6 grid lines
SELECT COUNT(*) FROM grid_lines;

-- Exit psql
\q
```

### 2. Test in Browser

Navigate to Power Transmission pages in your app:
- Grid Topology view should show nodes and lines
- Asset list should show 15 assets
- Alerts should display 12 sample alerts

## Backend Modes Explained

### Mock Mode (Default)
```env
VITE_DATA_BACKEND=mock
```
- All data from mock files
- No Supabase required
- Good for offline development

### Hybrid Mode (Recommended for Demo)
```env
VITE_DATA_BACKEND=hybrid
```
- Power Transmission: Supabase data
- Upstream Oil & Gas: Mock data
- Best for showcasing Power Transmission features

### Supabase Mode (Full Migration)
```env
VITE_DATA_BACKEND=supabase
```
- All data from Supabase
- Requires all sectors to be migrated
- Not yet fully implemented

## Next Steps

1. **Explore the Schema**: Check `supabase/migrations/` to understand the database structure
2. **Customize Seed Data**: Edit files in `supabase/seed/` to add your own demo data
3. **Add More Sectors**: Create new migrations and seed files for other sectors
4. **Deploy to Cloud**: When ready, push to Supabase cloud with `supabase db push`

## Production Deployment

When you're ready to deploy to Supabase cloud:

1. **Create a Supabase Project**
   - Go to https://supabase.com/dashboard
   - Create a new project

2. **Link Your Project**
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. **Push Migrations**
   ```bash
   supabase db push
   ```

4. **Update Environment Variables**
   Use the production URL and keys from your Supabase dashboard.

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Local Development Guide](https://supabase.com/docs/guides/cli/local-development)
- [Migration Guide](https://supabase.com/docs/guides/cli/managing-environments)
- Project Documentation: `docs/SUPABASE_SETUP.md`
