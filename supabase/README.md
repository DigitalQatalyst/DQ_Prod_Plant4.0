# Supabase Database Structure

## Overview

This directory contains all database-related files for the Plant4.0 Transmission Assets/IoT application.

## Structure

```
supabase/
├── config.toml          # Local Supabase configuration
├── seed.sql             # Master seed orchestrator (runs all seeds in order)
├── migrations/          # Schema migrations (applied to local + remote)
├── seed/                # Demo/development data (local only)
└── README.md            # This file
```

## Migrations (Schema Changes)

**Location**: `migrations/`

**Purpose**: Define database schema changes that apply to ALL environments (local, staging, production)

**Naming**: `NNN_description.sql` (e.g., `012_create_property_sets.sql`)

**Applied to**:
- ✅ Local: via `supabase db reset` or `supabase migration up`
- ✅ Remote: via `supabase db push`

**Current Migrations**:
- 001-011: Baseline (tenants, sites, assets, grid topology, alerts, telemetry)
- 012-013: Cycle 1 - Asset Catalog & Types (property_sets, lifecycle_states)
- 014+: Future cycles (discovery, connectivity, portfolio, etc.)

## Seeds (Development Data)

**Location**: `seed/`

**Purpose**: Provide realistic demo data for local development and testing

**Naming**: `NNN_description.sql` (e.g., `007_property_sets.sql`)

**Applied to**:
- ✅ Local: via `supabase db reset` (automatic)
- ❌ Remote: Manual only (via Supabase Studio or psql)

**Current Seeds**:
- 001: Transmission tenant (DEWA - Transmission)
- 002: Grid topology (nodes, lines, links)
- 003: Assets (transformers, breakers, meters)
- 004: Telemetry & alerts
- 005: Operational data
- 007: Property sets (Cycle 1)
- 008: Lifecycle states (Cycle 1)

**Seed Orchestrator**: Seeds are configured in `config.toml` under `[db.seed]` section

## Local Development Workflow

### Initial Setup

```bash
# 1. Install Supabase CLI
# Windows: scoop install supabase
# Mac: brew install supabase/tap/supabase
# Linux: See https://supabase.com/docs/guides/cli

# 2. Start local Supabase
supabase start

# 3. Apply migrations + seeds
supabase db reset
```

### Creating New Migrations

```bash
# 1. Create migration file
supabase migration new create_my_table

# 2. Edit the generated file in migrations/
# Example: migrations/014_create_my_table.sql

# 3. Apply locally
supabase db reset

# 4. Test thoroughly

# 5. Commit to git
git add supabase/migrations/014_create_my_table.sql
git commit -m "Add my_table migration"
```

### Creating New Seeds

```bash
# 1. Create seed file
# Example: seed/009_my_data.sql

# 2. Add to config.toml
# Edit supabase/config.toml [db.seed] section
# Add: "./seed/009_my_data.sql" to sql_paths array

# 3. Apply locally
supabase db reset

# 4. Verify data in Supabase Studio
# Open: http://127.0.0.1:54323

# 5. Commit to git
git add supabase/seed/009_my_data.sql supabase/config.toml
git commit -m "Add my_data seed"
```

### Daily Development

```bash
# Start Supabase (if not running)
supabase start

# Reset to clean state (reapply all migrations + seeds)
supabase db reset

# View logs
supabase logs

# Stop Supabase
supabase stop
```

## Remote Deployment Workflow

### Pushing Migrations

```bash
# 1. Link to remote project (first time only)
supabase link --project-ref your-project-ref

# 2. Review changes that will be applied
supabase db diff

# 3. Push migrations to remote
supabase db push

# 4. Verify in remote Supabase Studio
```

### Seeding Remote (Manual)

Seeds are NOT automatically applied to remote. You must manually run them:

**Option 1: Via Supabase Studio (Recommended)**
1. Open remote Supabase Studio
2. Navigate to SQL Editor
3. Copy contents of seed file (e.g., `seed/007_property_sets.sql`)
4. Paste and run in SQL Editor
5. Verify data in Table Editor

**Option 2: Via psql**
```bash
# Get connection string from Supabase Studio
psql $DATABASE_URL -f supabase/seed/007_property_sets.sql
```

**Option 3: Via Application Code**
- Use your application's admin interface
- Better for production data management

## Validation

### Local Validation

```bash
# Quick validation
.\validate-cycle1-simple.ps1

# Full validation with idempotency tests
.\validate-cycle1.ps1

# Check status
.\check-supabase-status.ps1
```

### Manual Validation

```bash
# 1. Start Supabase
supabase start

# 2. Open Studio
# http://127.0.0.1:54323

# 3. Check tables exist
# Table Editor → Verify tables

# 4. Check data counts
# SQL Editor → Run count queries
```

## Troubleshooting

### "Supabase not running"
```bash
supabase start
```

### "Migration failed"
```bash
# Check syntax
supabase db lint

# View logs
supabase logs

# Reset and try again
supabase db reset
```

### "Seed failed"
```bash
# Run individual seed
supabase db execute --file supabase/seed/007_property_sets.sql

# Check preconditions
# Ensure dependent seeds ran first
```

### "Port already in use"
```bash
# Stop Supabase
supabase stop

# Or change ports in config.toml
```

## Best Practices

### ✅ DO:
- Use `IF NOT EXISTS` in migrations for idempotency
- Use `ON CONFLICT DO UPDATE` in seeds for idempotency
- Number migrations sequentially (001, 002, 003...)
- Test migrations locally before pushing to remote
- Document seed dependencies in comments
- Commit migrations and seeds to git
- Use environment variables for secrets in config.toml

### ❌ DON'T:
- Don't modify old migrations (create new ones instead)
- Don't auto-seed production (always manual)
- Don't commit secrets or credentials
- Don't skip migration numbers
- Don't put production data in seed files
- Don't commit .temp/ folder

## Useful Commands

```bash
# Status
supabase status

# Start/Stop
supabase start
supabase stop

# Database
supabase db reset          # Drop all, reapply migrations + seeds
supabase db diff           # Show pending changes
supabase db push           # Push migrations to remote
supabase migration list    # List applied migrations
supabase migration up      # Apply pending migrations

# Logs
supabase logs              # All logs
supabase logs --db         # Database logs only

# Link/Unlink
supabase link --project-ref <ref>
supabase unlink
```

## Quick Links

- **Local Studio**: http://127.0.0.1:54323
- **Local API**: http://127.0.0.1:54321
- **Local DB**: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- **Supabase Docs**: https://supabase.com/docs
- **CLI Reference**: https://supabase.com/docs/reference/cli

## Support

For issues or questions:
1. Check validation scripts: `.\validate-cycle1-simple.ps1`
2. Review logs: `supabase logs`
3. Check Supabase docs: https://supabase.com/docs
4. Review spec files: `.kiro/specs/transmission-assets-iot/`

## Cycle Progress

- [x] Cycle 0: Baseline (migrations 001-011, seeds 001-005)
- [x] Cycle 1: Asset Catalog & Types (migrations 012-013, seeds 007-008)
- [ ] Cycle 2: Discovery & Onboarding (migration 014, seed 009)
- [ ] Cycle 3: Location & Topology (migration 018, seed 010)
- [ ] Cycle 4: Connectivity (migration 015, seed 011)
- [ ] Cycle 5: Portfolio Management (migration 016, seed 012)
- [ ] Cycle 6: Asset Detail (migration 017, seeds 013-014)
- [ ] Cycle 7: Dashboard & Alerts (no new migrations/seeds)
