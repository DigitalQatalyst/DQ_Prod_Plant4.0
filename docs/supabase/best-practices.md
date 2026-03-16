# Supabase Folder Structure: Best Practices

## Recommended Structure

```
supabase/
├── config.toml                 # Local dev configuration (gitignored sensitive values)
├── seed.sql                    # Local dev seed orchestrator
├── .gitignore                  # Ignore temp files, secrets
│
├── migrations/                 # SHARED: Local + Remote
│   ├── 001_create_tenants.sql
│   ├── 002_create_sites.sql
│   └── ...
│
├── seed/                       # LOCAL ONLY: Development data
│   ├── 001_transmission_tenant.sql
│   ├── 002_grid_topology.sql
│   └── ...
│
├── functions/                  # SHARED: Edge Functions (if used)
│   └── my-function/
│       └── index.ts
│
└── tests/                      # LOCAL ONLY: Database tests
    └── database/
        └── test.sql
```

## Key Principles

### 1. Migrations: SHARED (Local + Remote)

**Purpose**: Schema changes that apply to ALL environments

**Location**: `supabase/migrations/`

**Characteristics**:
- ✅ Version controlled (committed to git)
- ✅ Applied to local via `supabase db reset` or `supabase migration up`
- ✅ Applied to remote via `supabase db push`
- ✅ Idempotent (use `IF NOT EXISTS`, `IF EXISTS`)
- ✅ Sequential numbering (001, 002, 003...)
- ❌ No environment-specific data
- ❌ No secrets or credentials

**Example**:
```sql
-- migrations/012_create_property_sets.sql
CREATE TABLE IF NOT EXISTS property_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  -- ...
);
```

### 2. Seeds: LOCAL ONLY (Development Data)

**Purpose**: Sample/demo data for local development and testing

**Location**: `supabase/seed/`

**Characteristics**:
- ✅ Version controlled (committed to git)
- ✅ Applied to local via `supabase db reset`
- ❌ NOT automatically applied to remote
- ✅ Idempotent (use `ON CONFLICT DO UPDATE`)
- ✅ Can contain realistic demo data
- ❌ Should not contain production data
- ❌ Should not contain real user data or secrets

**Example**:
```sql
-- seed/007_property_sets.sql
INSERT INTO property_sets (tenant_id, name, type, fields)
SELECT tenant.id, 'Technical Specifications', 'technical', '[...]'::JSONB
FROM tenants tenant
WHERE tenant.scenario_tag = 'power_transmission_demo_v1'
ON CONFLICT (tenant_id, name) DO UPDATE SET
  type = EXCLUDED.type,
  fields = EXCLUDED.fields;
```

### 3. Config: Environment-Specific

**Purpose**: Configuration for local Supabase instance

**Location**: `supabase/config.toml`

**Characteristics**:
- ✅ Version controlled (base config)
- ⚠️ Sensitive values use `env(VAR_NAME)` pattern
- ✅ Local ports, database settings
- ❌ Production credentials (use env vars)

**Example**:
```toml
[db]
port = 54322

[db.seed]
enabled = true
sql_paths = ["./seed.sql"]

[auth.email.smtp]
enabled = true
pass = "env(SMTP_PASSWORD)"  # Not hardcoded!
```

## Your Current Structure (Good!)

```
supabase/
├── config.toml                 ✅ Local config
├── seed.sql                    ✅ Seed orchestrator
├── migrations/                 ✅ Shared migrations
│   ├── 001-011_*.sql          ✅ Baseline
│   ├── 012_create_property_sets.sql      ✅ Cycle 1
│   └── 013_create_lifecycle_states.sql   ✅ Cycle 1
└── seed/                       ✅ Local seeds
    ├── 001-005_*.sql          ✅ Baseline
    ├── 007_property_sets.sql  ✅ Cycle 1
    └── 008_lifecycle_states.sql ✅ Cycle 1
```

## Common Patterns

### Pattern 1: Seed Orchestrator (Recommended)

**File**: `supabase/seed.sql`

```sql
-- Master seed file that runs all seeds in order
\i seed/001_transmission_tenant.sql
\i seed/002_grid_topology.sql
\i seed/003_assets.sql
-- ...
```

**Config**: `supabase/config.toml`
```toml
[db.seed]
enabled = true
sql_paths = ["./seed.sql"]
```

**Pros**:
- ✅ Clear execution order
- ✅ Easy to enable/disable specific seeds
- ✅ Single entry point

### Pattern 2: Glob Pattern (Alternative)

**Config**: `supabase/config.toml`
```toml
[db.seed]
enabled = true
sql_paths = ["./seed/*.sql"]
```

**Pros**:
- ✅ Automatic discovery of seed files
- ✅ No need to update orchestrator

**Cons**:
- ❌ Execution order depends on filename sorting
- ❌ Less explicit control

**Recommendation**: Use Pattern 1 (orchestrator) for complex projects with dependencies.

## Environment-Specific Data

### Local Development
```
supabase/seed/
├── 001_transmission_tenant.sql    # Demo tenant
├── 002_grid_topology.sql          # Sample grid
├── 003_assets.sql                 # Sample assets
└── 007_property_sets.sql          # Sample property sets
```

### Staging/Production
**Option A: Manual SQL Scripts** (Recommended)
```
scripts/
├── staging/
│   └── initial_data.sql           # Staging-specific data
└── production/
    └── initial_data.sql           # Production-specific data
```

Run manually:
```bash
psql $STAGING_DATABASE_URL -f scripts/staging/initial_data.sql
psql $PRODUCTION_DATABASE_URL -f scripts/production/initial_data.sql
```

**Option B: Application-Level Seeding**
- Use your application code to seed production data
- More control, better error handling
- Can use environment variables

**Option C: Supabase Studio**
- Use SQL Editor in Supabase Studio
- Good for one-time setup
- Manual but safe

## What NOT to Commit

### .gitignore for supabase/
```gitignore
# Supabase
.branches/
.temp/
.env.local

# Sensitive config (if not using env vars)
config.local.toml

# Generated files
*.log
```

## Migration Workflow

### Local Development
```bash
# 1. Create migration
supabase migration new create_my_table

# 2. Edit migration file
# supabase/migrations/014_create_my_table.sql

# 3. Apply locally
supabase db reset  # or supabase migration up

# 4. Test with seeds
# Seeds run automatically with db reset

# 5. Commit migration
git add supabase/migrations/014_create_my_table.sql
git commit -m "Add my_table migration"
```

### Remote Deployment
```bash
# 1. Link to remote project
supabase link --project-ref your-project-ref

# 2. Review changes
supabase db diff

# 3. Push migrations
supabase db push

# 4. Manually seed if needed
# Use Supabase Studio SQL Editor
```

## Seed Workflow

### Local Development
```bash
# 1. Create seed file
# supabase/seed/009_my_data.sql

# 2. Add to orchestrator
# supabase/seed.sql
\i seed/009_my_data.sql

# 3. Apply seeds
supabase db reset

# 4. Commit seed
git add supabase/seed/009_my_data.sql supabase/seed.sql
git commit -m "Add my_data seed"
```

### Remote (Staging/Production)
```bash
# Option 1: Manual via Studio
# Copy seed SQL → Paste in SQL Editor → Run

# Option 2: Via psql
psql $DATABASE_URL -f supabase/seed/009_my_data.sql

# Option 3: Application-level
# Use your app's admin interface or scripts
```

## Advanced: Multiple Environments

### Structure
```
supabase/
├── config.toml                    # Local dev
├── config.staging.toml            # Staging overrides
├── config.production.toml         # Production overrides
│
├── migrations/                    # Shared
│
├── seed/                          # Local dev only
│   ├── dev/
│   │   └── 001_demo_data.sql
│   └── test/
│       └── 001_test_data.sql
│
└── scripts/
    ├── staging/
    │   └── seed_staging.sql
    └── production/
        └── seed_production.sql
```

### Usage
```bash
# Local dev
supabase start

# Staging
supabase link --project-ref staging-ref
supabase db push
psql $STAGING_URL -f scripts/staging/seed_staging.sql

# Production
supabase link --project-ref prod-ref
supabase db push
psql $PRODUCTION_URL -f scripts/production/seed_production.sql
```

## Best Practices Summary

### ✅ DO:
1. **Commit migrations** - They're shared across all environments
2. **Commit seeds** - They're useful for team development
3. **Use idempotent migrations** - `IF NOT EXISTS`, `IF EXISTS`
4. **Use idempotent seeds** - `ON CONFLICT DO UPDATE`
5. **Number migrations sequentially** - 001, 002, 003...
6. **Use environment variables** - For secrets in config.toml
7. **Test migrations locally** - Before pushing to remote
8. **Document seed dependencies** - In comments or README
9. **Keep seeds realistic** - Use production-like data structures
10. **Version control everything** - Except secrets and temp files

### ❌ DON'T:
1. **Don't commit secrets** - Use env vars or .env.local
2. **Don't auto-seed production** - Always manual/controlled
3. **Don't put production data in seeds** - Use separate scripts
4. **Don't skip migration numbers** - Keep sequential
5. **Don't modify old migrations** - Create new ones instead
6. **Don't hardcode tenant IDs** - Use lookups in seeds
7. **Don't commit .temp/ folder** - It's auto-generated
8. **Don't mix schema and data** - Migrations = schema, Seeds = data
9. **Don't forget preconditions** - Check dependencies in seeds
10. **Don't skip testing** - Always test locally first

## Your Project: Recommendations

### Current State: ✅ Good!
Your structure follows best practices:
- Migrations in `migrations/` (shared)
- Seeds in `seed/` (local dev)
- Orchestrator in `seed.sql`
- Config in `config.toml`

### Suggested Additions:

1. **Add .gitignore**
```bash
# supabase/.gitignore
.branches/
.temp/
.env.local
*.log
```

2. **Add scripts/ folder for remote seeding**
```
scripts/
├── staging/
│   └── seed_staging.sql
└── production/
    └── seed_production.sql
```

3. **Document seed order**
```sql
-- supabase/seed.sql
-- Seed execution order for local development
-- Dependencies: Each seed requires previous seeds to complete

-- Baseline (Cycle 0)
\i seed/001_transmission_tenant.sql  -- Creates tenant
\i seed/002_grid_topology.sql        -- Requires: 001
\i seed/003_assets.sql               -- Requires: 001, 002
\i seed/004_telemetry_alerts.sql     -- Requires: 003
\i seed/005_operational.sql          -- Requires: 003

-- Cycle 1: Asset Catalog
\i seed/007_property_sets.sql        -- Requires: 001
\i seed/008_lifecycle_states.sql     -- Requires: 001
```

4. **Add README**
```markdown
# supabase/README.md

## Structure
- `migrations/` - Schema changes (local + remote)
- `seed/` - Demo data (local only)
- `seed.sql` - Seed orchestrator
- `config.toml` - Local configuration

## Local Development
\`\`\`bash
supabase start
supabase db reset
\`\`\`

## Remote Deployment
\`\`\`bash
supabase db push
# Then manually run seeds via Studio
\`\`\`
```

## Conclusion

Your current structure is solid! The key principle is:

**Migrations = Schema (Shared) | Seeds = Data (Local)**

This separation ensures:
- Schema changes are consistent across environments
- Development data doesn't leak to production
- Production data is managed separately and securely
- Team members can easily reset to a known state

Keep doing what you're doing! 🎉
