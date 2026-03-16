# Validation Documentation

## Overview

This directory contains validation guides and procedures for the Plant4.0 Transmission Assets/IoT application.

## Quick Start

**Validating Cycle 1?** Start here: **[cycle1-summary.md](cycle1-summary.md)** ⭐

## Documentation Files

### Cycle 1 Validation

- **[cycle1-summary.md](cycle1-summary.md)** ⭐ Start here!
  - Complete validation overview
  - Step-by-step instructions
  - Prerequisites and setup
  - Troubleshooting guide
  - 10-minute read

- **[cycle1-quickstart.md](cycle1-quickstart.md)**
  - TL;DR commands
  - Quick reference
  - Expected results
  - 3-minute read

- **[cycle1-guide.md](cycle1-guide.md)**
  - Detailed validation procedures
  - Manual validation steps
  - Common issues and solutions
  - Complete reference

## Validation Scripts

Located in: `../../scripts/validation/`

### Available Scripts

1. **check-supabase-status.ps1**
   - Quick status check
   - Shows running services
   - Displays connection URLs
   
   ```powershell
   ../../scripts/validation/check-supabase-status.ps1
   ```

2. **validate-cycle1-simple.ps1** ⭐ Recommended
   - Quick validation via REST API
   - Checks tables and data counts
   - No database reset required
   
   ```powershell
   ../../scripts/validation/validate-cycle1-simple.ps1
   ```

3. **validate-cycle1.ps1**
   - Full validation with idempotency tests
   - Includes database reset
   - More thorough but slower
   
   ```powershell
   ../../scripts/validation/validate-cycle1.ps1
   ```

## Quick Validation Workflow

```powershell
# 1. Check status
../../scripts/validation/check-supabase-status.ps1

# 2. Start Supabase (if not running)
supabase start

# 3. Reset database (apply migrations + seeds)
supabase db reset

# 4. Validate
../../scripts/validation/validate-cycle1-simple.ps1

# 5. View in Studio
# Open: http://127.0.0.1:54323
```

## What Gets Validated

### Cycle 1: Asset Catalog & Types

**Tables Created:**
- ✅ `property_sets` - Reusable metadata field collections
- ✅ `lifecycle_states` - Asset lifecycle stage definitions

**Data Seeded:**
- ✅ 5 property sets (technical, operational, safety, financial, maintenance)
- ✅ 15 lifecycle states (5 states × 3 categories)

**Expected Results:**
- property_sets table has >= 5 records
- lifecycle_states table has >= 15 records
- Seeds are idempotent (can re-run without errors)

## Validation Checklist

Before pushing to remote:

- [ ] Supabase CLI installed and working
- [ ] Local Supabase started successfully
- [ ] Database reset completed without errors
- [ ] `property_sets` table exists with 5 records
- [ ] `lifecycle_states` table exists with 15 records
- [ ] Validation script passes all checks
- [ ] Data visible in Supabase Studio
- [ ] Seeds are idempotent

## Common Issues

### "Supabase not running"
```powershell
supabase start
```

### "Tables don't exist"
```powershell
supabase db reset
```

### "Wrong data counts"
```powershell
# Re-run specific seeds
supabase db execute --file supabase/seed/007_property_sets.sql
supabase db execute --file supabase/seed/008_lifecycle_states.sql
```

## Related Documentation

### Supabase Documentation
- **[../supabase/structure-summary.md](../supabase/structure-summary.md)** - Supabase structure overview
- **[../supabase/best-practices.md](../supabase/best-practices.md)** - Best practices guide
- **[../../supabase/README.md](../../supabase/README.md)** - Supabase folder reference

### Spec Files
- **[../../.kiro/specs/transmission-assets-iot/design.md](../../.kiro/specs/transmission-assets-iot/design.md)** - Design document
- **[../../.kiro/specs/transmission-assets-iot/requirements.md](../../.kiro/specs/transmission-assets-iot/requirements.md)** - Requirements
- **[../../.kiro/specs/transmission-assets-iot/tasks.md](../../.kiro/specs/transmission-assets-iot/tasks.md)** - Implementation tasks

## Next Steps

After successful validation:

1. ✅ Mark Cycle 1 tasks as complete in tasks.md
2. 🚀 Push migrations to remote Supabase
3. 📝 Document any issues or learnings
4. ⏭️ Proceed to Cycle 2 (Discovery & Onboarding)

## Support

If you encounter issues:
- Check [cycle1-guide.md](cycle1-guide.md) → "Troubleshooting"
- Check Supabase logs: `supabase logs`
- Check migration status: `supabase migration list`
- Review Supabase docs: https://supabase.com/docs

---

**Ready to validate? Start with [cycle1-summary.md](cycle1-summary.md)!**
