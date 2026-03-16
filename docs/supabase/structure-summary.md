# Supabase Structure: Quick Reference

## TL;DR

**Migrations** = Schema (Shared across all environments)  
**Seeds** = Data (Local development only)

## Your Structure (Following Best Practices ✅)

```
supabase/
├── config.toml              # Local configuration
├── seed.sql                 # Seed orchestrator (runs all seeds in order)
├── .gitignore              # Ignore temp files
├── README.md               # Documentation
│
├── migrations/             # SHARED: Schema changes (local + remote)
│   ├── 001-011_*.sql      # Baseline
│   ├── 012_create_property_sets.sql      # Cycle 1
│   └── 013_create_lifecycle_states.sql   # Cycle 1
│
└── seed/                   # LOCAL ONLY: Demo data
    ├── 001-005_*.sql      # Baseline
    ├── 007_property_sets.sql             # Cycle 1
    └── 008_lifecycle_states.sql          # Cycle 1
```

## Key Principles

| Aspect | Migrations | Seeds |
|--------|-----------|-------|
| **Purpose** | Schema changes | Demo/test data |
| **Applied to** | Local + Remote | Local only |
| **Committed to git** | ✅ Yes | ✅ Yes |
| **Auto-applied locally** | ✅ Yes (db reset) | ✅ Yes (db reset) |
| **Auto-applied remotely** | ✅ Yes (db push) | ❌ No (manual) |
| **Contains** | CREATE TABLE, ALTER TABLE | INSERT, UPDATE |
| **Idempotent** | ✅ IF NOT EXISTS | ✅ ON CONFLICT |

## Workflows

### Local Development

```bash
# Start Supabase
supabase start

# Apply all migrations + seeds
supabase db reset

# View in Studio
# http://127.0.0.1:54323
```

### Remote Deployment

```bash
# Push migrations (automatic)
supabase db push

# Run seeds (manual via Studio SQL Editor)
# Copy seed file contents → Paste in SQL Editor → Run
```

## Best Practices Applied

### ✅ What You're Doing Right:

1. **Separate migrations and seeds** - Clear separation of schema vs data
2. **Sequential numbering** - 001, 002, 003... for easy ordering
3. **Seed orchestrator** - `seed.sql` controls execution order
4. **Idempotent migrations** - Using `IF NOT EXISTS`
5. **Idempotent seeds** - Using `ON CONFLICT DO UPDATE`
6. **Documented dependencies** - Comments in seed files
7. **Version controlled** - All files committed to git
8. **No hardcoded IDs** - Seeds use lookups (scenario_tag)

### 📝 New Additions:

1. **supabase/.gitignore** - Ignore temp files and secrets
2. **supabase/README.md** - Complete documentation
3. **Enhanced seed.sql** - Better comments and structure
4. **SUPABASE_STRUCTURE_BEST_PRACTICES.md** - Detailed guide

## Common Questions

### Q: Should I commit seed files?
**A:** ✅ Yes! Seeds are useful for team development and testing.

### Q: Do seeds run on production?
**A:** ❌ No! Seeds are local-only. Run them manually on remote if needed.

### Q: Can I modify old migrations?
**A:** ❌ No! Create new migrations instead. Old ones may already be applied.

### Q: How do I seed production?
**A:** Use separate scripts in `scripts/production/` or application-level seeding.

### Q: What if I need environment-specific data?
**A:** Create separate scripts:
```
scripts/
├── staging/seed_staging.sql
└── production/seed_production.sql
```

### Q: Should I use glob patterns for seeds?
**A:** For complex projects, use an orchestrator (seed.sql) for explicit control.

## File Purposes

| File | Purpose | Committed | Applied Locally | Applied Remotely |
|------|---------|-----------|-----------------|------------------|
| `migrations/*.sql` | Schema changes | ✅ | ✅ Auto | ✅ Auto (db push) |
| `seed/*.sql` | Demo data | ✅ | ✅ Auto | ❌ Manual |
| `seed.sql` | Seed orchestrator | ✅ | ✅ Auto | ❌ N/A |
| `config.toml` | Local config | ✅ | ✅ | ❌ N/A |
| `.gitignore` | Ignore patterns | ✅ | N/A | N/A |
| `README.md` | Documentation | ✅ | N/A | N/A |

## Validation

Before pushing to remote:

```bash
# 1. Validate locally
.\validate-cycle1-simple.ps1

# 2. Review changes
supabase db diff

# 3. Push migrations
supabase db push

# 4. Manually run seeds in remote Studio
```

## Next Steps

1. ✅ Your structure is solid - no changes needed!
2. 📖 Read `supabase/README.md` for detailed workflows
3. 📖 Read `SUPABASE_STRUCTURE_BEST_PRACTICES.md` for deep dive
4. 🚀 Continue with Cycle 1 validation
5. 🎯 Proceed to Cycle 2 when ready

## Quick Commands

```bash
# Local
supabase start              # Start local Supabase
supabase db reset           # Apply migrations + seeds
supabase status             # Check status
supabase stop               # Stop local Supabase

# Remote
supabase link               # Link to remote project
supabase db diff            # Review pending changes
supabase db push            # Push migrations to remote

# Validation
.\check-supabase-status.ps1        # Check status
.\validate-cycle1-simple.ps1       # Validate Cycle 1
```

## Resources

- **Your README**: `supabase/README.md`
- **Best Practices**: `SUPABASE_STRUCTURE_BEST_PRACTICES.md`
- **Validation Guide**: `CYCLE1_VALIDATION_SUMMARY.md`
- **Supabase Docs**: https://supabase.com/docs/guides/local-development

---

**Your structure follows industry best practices! 🎉**

The separation of migrations (schema) and seeds (data) ensures:
- ✅ Consistent schema across environments
- ✅ Safe local development with realistic data
- ✅ No accidental production data leaks
- ✅ Easy team collaboration
- ✅ Clear deployment process
