# Supabase Documentation Index

## Quick Start (Start Here!)

**New to Supabase in this project?** Read these in order:

1. **[structure-summary.md](structure-summary.md)** ⭐
   - Quick overview of the structure
   - Key principles (migrations vs seeds)
   - Your structure validation
   - 5-minute read

2. **[../validation/cycle1-summary.md](../validation/cycle1-summary.md)** ⭐
   - Step-by-step validation guide
   - Prerequisites and setup
   - Validation scripts usage
   - Troubleshooting
   - 10-minute read

3. **[../../supabase/README.md](../../supabase/README.md)** ⭐
   - Complete reference for supabase/ folder
   - Daily workflows
   - Command reference
   - Keep this bookmarked!

## Documentation Files

### Core Documentation

- **[structure-summary.md](structure-summary.md)** ⭐ Start here!
  - Quick reference guide
  - Key principles
  - File structure overview
  - Common commands

- **[best-practices.md](best-practices.md)**
  - Industry best practices
  - Detailed explanations
  - Common patterns
  - What to do and what NOT to do
  - 20-minute read

- **[workflow-diagram.md](workflow-diagram.md)**
  - Visual diagrams
  - File flow charts
  - Decision trees
  - Environment comparisons
  - Great for visual learners

## Related Documentation

### Validation Guides
- **[../validation/cycle1-summary.md](../validation/cycle1-summary.md)** - Validation overview
- **[../validation/cycle1-quickstart.md](../validation/cycle1-quickstart.md)** - Quick start
- **[../validation/cycle1-guide.md](../validation/cycle1-guide.md)** - Detailed guide

### Supabase Folder Reference
- **[../../supabase/README.md](../../supabase/README.md)** - Complete reference for supabase/ folder

## Quick Commands

```bash
# Status
../../scripts/validation/check-supabase-status.ps1

# Start/Stop
supabase start
supabase stop

# Reset (apply migrations + seeds)
supabase db reset

# Validate
../../scripts/validation/validate-cycle1-simple.ps1

# Push to remote
supabase db push

# View logs
supabase logs
```

## Common Tasks

### I want to...

#### Validate Cycle 1 locally
1. Read: [../validation/cycle1-summary.md](../validation/cycle1-summary.md)
2. Run: `../../scripts/validation/check-supabase-status.ps1`
3. Run: `supabase start` (if not running)
4. Run: `supabase db reset`
5. Run: `../../scripts/validation/validate-cycle1-simple.ps1`

#### Understand the structure
1. Read: [structure-summary.md](structure-summary.md)
2. Read: [../../supabase/README.md](../../supabase/README.md)
3. Optional: [best-practices.md](best-practices.md)

#### Create a new migration
1. Read: [../../supabase/README.md](../../supabase/README.md) → "Creating New Migrations"
2. Run: `supabase migration new my_migration_name`
3. Edit: `supabase/migrations/014_my_migration_name.sql`
4. Test: `supabase db reset`

#### Push to remote
1. Read: [../validation/cycle1-summary.md](../validation/cycle1-summary.md) → "Pushing to Remote"
2. Validate locally first!
3. Run: `supabase db push`

## Reading Paths

### Path 1: "I just want to validate Cycle 1"
1. [../validation/cycle1-summary.md](../validation/cycle1-summary.md)
2. Run scripts
3. Done!

### Path 2: "I want to understand the structure"
1. [structure-summary.md](structure-summary.md)
2. [../../supabase/README.md](../../supabase/README.md)
3. [workflow-diagram.md](workflow-diagram.md)
4. [best-practices.md](best-practices.md)

### Path 3: "I need to work with Supabase daily"
1. [structure-summary.md](structure-summary.md)
2. [../../supabase/README.md](../../supabase/README.md) ← Bookmark this!
3. Keep [../validation/cycle1-summary.md](../validation/cycle1-summary.md) handy

### Path 4: "I'm new to the team"
1. [structure-summary.md](structure-summary.md)
2. [../validation/cycle1-summary.md](../validation/cycle1-summary.md)
3. Run validation scripts
4. [../../supabase/README.md](../../supabase/README.md)
5. [workflow-diagram.md](workflow-diagram.md)

## External Resources

- **Supabase CLI Docs**: https://supabase.com/docs/guides/cli
- **Local Development**: https://supabase.com/docs/guides/local-development
- **Migrations**: https://supabase.com/docs/guides/cli/local-development#database-migrations
- **Seeding**: https://supabase.com/docs/guides/cli/seeding-your-database

## Document Status

| Document | Purpose | Status |
|----------|---------|--------|
| structure-summary.md | Quick reference | ✅ Complete |
| best-practices.md | Deep dive guide | ✅ Complete |
| workflow-diagram.md | Visual guide | ✅ Complete |

---

**Start with [structure-summary.md](structure-summary.md) if this is your first time!**
