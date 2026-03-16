# Plant4.0 Documentation

## Overview

This directory contains all documentation for the Plant4.0 Transmission Assets/IoT application.

## Documentation Structure

```
docs/
├── README.md                          # This file - documentation index
│
├── supabase/                          # Supabase database documentation
│   ├── README.md                      # Main index for Supabase docs
│   ├── structure-summary.md           # Quick reference (start here!)
│   ├── best-practices.md              # Deep dive guide
│   └── workflow-diagram.md            # Visual diagrams and flows
│
├── validation/                        # Validation guides
│   ├── cycle1-summary.md              # Cycle 1 validation overview
│   ├── cycle1-quickstart.md           # Quick start guide
│   └── cycle1-guide.md                # Detailed validation guide
│
├── assets/                            # Asset-related documentation
│   ├── feature_specs.md
│   ├── generic_schema.md
│   └── page_inventory.md
│
└── [Other docs...]                    # Existing project documentation
```

## Quick Start Guides

### New to the Project?

1. **[supabase/structure-summary.md](supabase/structure-summary.md)** ⭐
   - Quick overview of Supabase structure
   - Key principles (migrations vs seeds)
   - 5-minute read

2. **[validation/cycle1-summary.md](validation/cycle1-summary.md)** ⭐
   - Step-by-step validation guide
   - Prerequisites and setup
   - 10-minute read

3. **[supabase/README.md](supabase/README.md)** ⭐
   - Complete Supabase reference
   - Daily workflows
   - Bookmark this!

### Working with Supabase?

Start here: **[supabase/README.md](supabase/README.md)**

Quick links:
- [Structure Summary](supabase/structure-summary.md) - Quick reference
- [Best Practices](supabase/best-practices.md) - Deep dive
- [Workflow Diagrams](supabase/workflow-diagram.md) - Visual guide

### Validating Cycle 1?

Start here: **[validation/cycle1-summary.md](validation/cycle1-summary.md)**

Quick links:
- [Quick Start](validation/cycle1-quickstart.md) - TL;DR commands
- [Detailed Guide](validation/cycle1-guide.md) - Complete reference

## Validation Scripts

Located in: `scripts/validation/`

- **check-supabase-status.ps1** - Quick status check
- **validate-cycle1-simple.ps1** - Quick validation (recommended)
- **validate-cycle1.ps1** - Full validation with idempotency tests

Usage:
```powershell
# Check status
.\scripts\validation\check-supabase-status.ps1

# Quick validation
.\scripts\validation\validate-cycle1-simple.ps1

# Full validation
.\scripts\validation\validate-cycle1.ps1
```

## Common Tasks

### I want to...

#### Validate Cycle 1 locally
1. Read: [validation/cycle1-summary.md](validation/cycle1-summary.md)
2. Run: `.\scripts\validation\check-supabase-status.ps1`
3. Run: `supabase start` (if not running)
4. Run: `supabase db reset`
5. Run: `.\scripts\validation\validate-cycle1-simple.ps1`

#### Understand Supabase structure
1. Read: [supabase/structure-summary.md](supabase/structure-summary.md)
2. Read: [supabase/README.md](supabase/README.md)
3. Optional: [supabase/best-practices.md](supabase/best-practices.md)

#### Create a new migration
1. Read: [supabase/README.md](supabase/README.md) → "Creating New Migrations"
2. Run: `supabase migration new my_migration_name`
3. Edit: `supabase/migrations/014_my_migration_name.sql`
4. Test: `supabase db reset`

#### Push to remote
1. Validate locally first!
2. Read: [validation/cycle1-summary.md](validation/cycle1-summary.md) → "Pushing to Remote"
3. Run: `supabase db push`

## Document Categories

### Supabase Documentation
- **[supabase/README.md](supabase/README.md)** - Main index and reference
- **[supabase/structure-summary.md](supabase/structure-summary.md)** - Quick overview
- **[supabase/best-practices.md](supabase/best-practices.md)** - Detailed guide
- **[supabase/workflow-diagram.md](supabase/workflow-diagram.md)** - Visual diagrams

### Validation Documentation
- **[validation/cycle1-summary.md](validation/cycle1-summary.md)** - Validation overview
- **[validation/cycle1-quickstart.md](validation/cycle1-quickstart.md)** - Quick start
- **[validation/cycle1-guide.md](validation/cycle1-guide.md)** - Detailed guide

### Implementation Documentation
- **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - Initial Supabase setup
- **[UNIFIED_DATA_LAYER_IMPLEMENTATION.md](UNIFIED_DATA_LAYER_IMPLEMENTATION.md)** - Data layer architecture
- **[MIGRATION_STRATEGY.md](MIGRATION_STRATEGY.md)** - Migration strategy
- **[DESIGN_NOTES.md](DESIGN_NOTES.md)** - Design decisions

### Verification & Testing
- **[VALIDATION_REPORT.md](VALIDATION_REPORT.md)** - Validation reports
- **[APM_VERIFICATION_REPORT.md](APM_VERIFICATION_REPORT.md)** - APM verification
- **[TASK_8_TESTING_GUIDE.md](TASK_8_TESTING_GUIDE.md)** - Testing guide

### Feature Documentation
- **[assets/feature_specs.md](assets/feature_specs.md)** - Feature specifications
- **[assets/generic_schema.md](assets/generic_schema.md)** - Schema documentation
- **[assets/page_inventory.md](assets/page_inventory.md)** - Page inventory

## External Resources

- **Supabase CLI Docs**: https://supabase.com/docs/guides/cli
- **Local Development**: https://supabase.com/docs/guides/local-development
- **Migrations**: https://supabase.com/docs/guides/cli/local-development#database-migrations

## Spec Files

For implementation details, see:
- `.kiro/specs/transmission-assets-iot/design.md`
- `.kiro/specs/transmission-assets-iot/requirements.md`
- `.kiro/specs/transmission-assets-iot/tasks.md`

## Contributing

When adding new documentation:
1. Place in appropriate subdirectory (supabase/, validation/, assets/, etc.)
2. Update this README.md with links
3. Use lowercase-with-hyphens for filenames
4. Include cross-references to related docs

## Support

If you're stuck:
1. Check the relevant guide in this directory
2. Run `supabase logs` for errors
3. Check [validation/cycle1-guide.md](validation/cycle1-guide.md) → "Troubleshooting"
4. Review [supabase/README.md](supabase/README.md) → "Troubleshooting"

---

**New to the project? Start with [supabase/structure-summary.md](supabase/structure-summary.md)!**
