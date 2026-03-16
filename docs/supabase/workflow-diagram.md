# Supabase Workflow: Visual Guide

## File Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOUR REPOSITORY                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  supabase/                                                      │
│  ├── migrations/          ┌──────────────────────┐            │
│  │   ├── 001_*.sql ──────→│  SHARED: Local+Remote│            │
│  │   ├── 002_*.sql ──────→│  Schema changes only │            │
│  │   └── 012_*.sql ──────→│  Committed to git    │            │
│  │                         └──────────────────────┘            │
│  │                                                              │
│  ├── seed/                ┌──────────────────────┐            │
│  │   ├── 001_*.sql ──────→│  LOCAL ONLY          │            │
│  │   ├── 002_*.sql ──────→│  Demo/test data      │            │
│  │   └── 007_*.sql ──────→│  Committed to git    │            │
│  │                         └──────────────────────┘            │
│  │                                                              │
│  └── seed.sql             ┌──────────────────────┐            │
│      (orchestrator) ─────→│  Runs seeds in order │            │
│                            └──────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## Local Development Flow

```
┌──────────────┐
│ Developer    │
│ Workstation  │
└──────┬───────┘
       │
       │ 1. supabase start
       ▼
┌──────────────────────────────────────┐
│   Local Supabase (Docker)            │
│   ┌────────────────────────────┐    │
│   │  PostgreSQL Database       │    │
│   │  Port: 54322               │    │
│   └────────────────────────────┘    │
│   ┌────────────────────────────┐    │
│   │  PostgREST API             │    │
│   │  Port: 54321               │    │
│   └────────────────────────────┘    │
│   ┌────────────────────────────┐    │
│   │  Supabase Studio           │    │
│   │  Port: 54323               │    │
│   └────────────────────────────┘    │
└──────────────────────────────────────┘
       │
       │ 2. supabase db reset
       ▼
┌──────────────────────────────────────┐
│  Apply Migrations (001-013)          │
│  ✓ CREATE TABLE property_sets        │
│  ✓ CREATE TABLE lifecycle_states     │
└──────────────────────────────────────┘
       │
       │ 3. Run Seeds (001-008)
       ▼
┌──────────────────────────────────────┐
│  Insert Demo Data                    │
│  ✓ 5 property_sets                   │
│  ✓ 15 lifecycle_states               │
└──────────────────────────────────────┘
       │
       │ 4. Validate
       ▼
┌──────────────────────────────────────┐
│  .\validate-cycle1-simple.ps1        │
│  ✓ Tables exist                      │
│  ✓ Data counts correct               │
└──────────────────────────────────────┘
```

## Remote Deployment Flow

```
┌──────────────┐
│ Developer    │
│ Workstation  │
└──────┬───────┘
       │
       │ 1. supabase link --project-ref xxx
       ▼
┌──────────────────────────────────────┐
│  Link to Remote Project              │
│  ✓ Connected to production           │
└──────────────────────────────────────┘
       │
       │ 2. supabase db diff
       ▼
┌──────────────────────────────────────┐
│  Review Pending Changes              │
│  • 012_create_property_sets.sql      │
│  • 013_create_lifecycle_states.sql   │
└──────────────────────────────────────┘
       │
       │ 3. supabase db push
       ▼
┌──────────────────────────────────────┐
│   Remote Supabase (Cloud)            │
│   ┌────────────────────────────┐    │
│   │  PostgreSQL Database       │    │
│   │  ✓ Migrations applied      │    │
│   │  ✗ Seeds NOT applied       │    │
│   └────────────────────────────┘    │
└──────────────────────────────────────┘
       │
       │ 4. Manual: Copy seed SQL
       ▼
┌──────────────────────────────────────┐
│  Supabase Studio (Remote)            │
│  SQL Editor                          │
│  • Paste seed/007_property_sets.sql  │
│  • Run SQL                           │
│  • Paste seed/008_lifecycle_states...│
│  • Run SQL                           │
└──────────────────────────────────────┘
       │
       │ 5. Verify
       ▼
┌──────────────────────────────────────┐
│  Table Editor                        │
│  ✓ property_sets: 5 records          │
│  ✓ lifecycle_states: 15 records      │
└──────────────────────────────────────┘
```

## Migration vs Seed Decision Tree

```
                    ┌─────────────────┐
                    │  Need to add    │
                    │  something?     │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
         ┌──────▼──────┐          ┌──────▼──────┐
         │  Schema     │          │  Data       │
         │  Change?    │          │  Change?    │
         └──────┬──────┘          └──────┬──────┘
                │                         │
         ┌──────▼──────┐          ┌──────▼──────┐
         │ MIGRATION   │          │  SEED       │
         │             │          │             │
         │ • CREATE    │          │ • INSERT    │
         │ • ALTER     │          │ • UPDATE    │
         │ • DROP      │          │ • DELETE    │
         │ • INDEX     │          │             │
         │             │          │             │
         │ Location:   │          │ Location:   │
         │ migrations/ │          │ seed/       │
         │             │          │             │
         │ Applied to: │          │ Applied to: │
         │ Local+Remote│          │ Local only  │
         └─────────────┘          └─────────────┘
```

## Environment Comparison

```
┌─────────────────┬──────────────────┬──────────────────┬──────────────────┐
│                 │  LOCAL DEV       │  STAGING         │  PRODUCTION      │
├─────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Migrations      │ ✅ Auto          │ ✅ Auto          │ ✅ Auto          │
│ (Schema)        │ (db reset)       │ (db push)        │ (db push)        │
├─────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Seeds           │ ✅ Auto          │ ⚠️  Manual       │ ⚠️  Manual       │
│ (Demo Data)     │ (db reset)       │ (Studio/psql)    │ (Studio/psql)    │
├─────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Data Source     │ seed/*.sql       │ scripts/staging/ │ scripts/prod/    │
│                 │                  │ or Studio        │ or App code      │
├─────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Purpose         │ Development      │ Testing          │ Real users       │
│                 │ & Testing        │ & QA             │ & Real data      │
└─────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

## File Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                        MIGRATION LIFECYCLE                      │
└─────────────────────────────────────────────────────────────────┘

1. CREATE
   Developer creates: migrations/014_create_my_table.sql
   
2. TEST LOCALLY
   supabase db reset
   ✓ Migration applies successfully
   
3. COMMIT
   git add migrations/014_create_my_table.sql
   git commit -m "Add my_table"
   
4. PUSH TO REMOTE
   supabase db push
   ✓ Migration applied to remote
   
5. NEVER MODIFY
   ❌ Don't edit 014_create_my_table.sql
   ✅ Create 015_alter_my_table.sql instead

┌─────────────────────────────────────────────────────────────────┐
│                          SEED LIFECYCLE                         │
└─────────────────────────────────────────────────────────────────┘

1. CREATE
   Developer creates: seed/009_my_data.sql
   
2. ADD TO ORCHESTRATOR
   Edit seed.sql: \i seed/009_my_data.sql
   
3. TEST LOCALLY
   supabase db reset
   ✓ Seed runs successfully
   ✓ Data appears in Studio
   
4. COMMIT
   git add seed/009_my_data.sql seed.sql
   git commit -m "Add my_data seed"
   
5. REMOTE (MANUAL)
   Copy seed/009_my_data.sql
   Paste in remote Studio SQL Editor
   Run SQL
   
6. CAN MODIFY
   ✅ Can edit seed/009_my_data.sql
   ✅ Use ON CONFLICT for idempotency
```

## Validation Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    VALIDATION WORKFLOW                       │
└──────────────────────────────────────────────────────────────┘

Local Validation:
┌─────────────┐
│ supabase    │
│ db reset    │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Migrations  │────→│   Seeds     │────→│  Validate   │
│ Applied     │     │   Run       │     │  Data       │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │ ✓ All Pass  │
                                        └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │ Ready to    │
                                        │ Push Remote │
                                        └─────────────┘

Remote Deployment:
┌─────────────┐
│ supabase    │
│ db push     │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Migrations  │────→│  Manual     │────→│  Verify     │
│ Applied     │     │  Run Seeds  │     │  Remote     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │ ✓ Production│
                                        │   Ready     │
                                        └─────────────┘
```

## Quick Reference

### When to Use Migrations
- ✅ Creating tables
- ✅ Adding columns
- ✅ Creating indexes
- ✅ Changing constraints
- ✅ Any schema change

### When to Use Seeds
- ✅ Demo data for development
- ✅ Test data for local testing
- ✅ Reference data (if idempotent)
- ❌ Production user data
- ❌ Secrets or credentials

### Commands Cheat Sheet

```bash
# Local Development
supabase start              # Start local instance
supabase db reset           # Apply migrations + seeds
supabase status             # Check what's running
supabase stop               # Stop local instance

# Remote Deployment
supabase link               # Connect to remote
supabase db diff            # Preview changes
supabase db push            # Push migrations only

# Validation
.\validate-cycle1-simple.ps1    # Quick validation
.\check-supabase-status.ps1     # Status check

# Debugging
supabase logs               # View all logs
supabase logs --db          # Database logs only
supabase migration list     # List applied migrations
```

---

**Your structure is production-ready! 🚀**

Follow the flows above for smooth local development and safe remote deployments.
