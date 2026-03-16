# Documentation Structure

## Overview

All project documentation has been organized into a clean, hierarchical structure for easy navigation and maintenance.

## Directory Structure

```
project-root/
├── README.md                              # Main project README
│
├── docs/                                  # 📚 All documentation
│   ├── README.md                          # Documentation index
│   │
│   ├── supabase/                          # Supabase documentation
│   │   ├── README.md                      # Supabase docs index
│   │   ├── structure-summary.md           # Quick reference ⭐
│   │   ├── best-practices.md              # Deep dive guide
│   │   └── workflow-diagram.md            # Visual diagrams
│   │
│   ├── validation/                        # Validation documentation
│   │   ├── README.md                      # Validation docs index
│   │   ├── cycle1-summary.md              # Cycle 1 overview ⭐
│   │   ├── cycle1-quickstart.md           # Quick start guide
│   │   └── cycle1-guide.md                # Detailed guide
│   │
│   ├── assets/                            # Asset documentation
│   │   ├── feature_specs.md
│   │   ├── generic_schema.md
│   │   └── page_inventory.md
│   │
│   └── [Other docs...]                    # Existing documentation
│
├── scripts/                               # 🔧 Utility scripts
│   └── validation/                        # Validation scripts
│       ├── check-supabase-status.ps1
│       ├── validate-cycle1-simple.ps1
│       └── validate-cycle1.ps1
│
├── supabase/                              # 🗄️ Database files
│   ├── README.md                          # Supabase folder reference
│   ├── config.toml
│   ├── seed.sql
│   ├── migrations/
│   └── seed/
│
└── .kiro/                                 # 📋 Specifications
    └── specs/
        └── transmission-assets-iot/
            ├── design.md
            ├── requirements.md
            └── tasks.md
```

## Documentation Categories

### 1. Supabase Documentation (`docs/supabase/`)

**Purpose**: Database structure, migrations, seeds, and best practices

**Files**:
- `README.md` - Index for Supabase documentation
- `structure-summary.md` - Quick reference (start here!)
- `best-practices.md` - Detailed guide on migrations vs seeds
- `workflow-diagram.md` - Visual diagrams and decision trees

**When to use**: Working with database, creating migrations, understanding structure

### 2. Validation Documentation (`docs/validation/`)

**Purpose**: Validation procedures and testing guides

**Files**:
- `README.md` - Index for validation documentation
- `cycle1-summary.md` - Complete Cycle 1 validation guide (start here!)
- `cycle1-quickstart.md` - Quick start commands
- `cycle1-guide.md` - Detailed validation procedures

**When to use**: Validating implementations, testing locally, troubleshooting

### 3. Asset Documentation (`docs/assets/`)

**Purpose**: Asset-related specifications and schemas

**Files**:
- `feature_specs.md` - Feature specifications
- `generic_schema.md` - Schema documentation
- `page_inventory.md` - Page inventory

**When to use**: Understanding asset features, schema design

### 4. Validation Scripts (`scripts/validation/`)

**Purpose**: Automated validation and status checking

**Files**:
- `check-supabase-status.ps1` - Quick status check
- `validate-cycle1-simple.ps1` - Quick validation (recommended)
- `validate-cycle1.ps1` - Full validation with idempotency tests

**When to use**: Running validations, checking status

### 5. Supabase Folder (`supabase/`)

**Purpose**: Database migrations, seeds, and configuration

**Files**:
- `README.md` - Complete reference for daily workflows
- `config.toml` - Local Supabase configuration
- `seed.sql` - Seed orchestrator
- `migrations/` - Schema migrations
- `seed/` - Demo data

**When to use**: Daily database work, creating migrations/seeds

### 6. Specifications (`.kiro/specs/`)

**Purpose**: Feature specifications and implementation plans

**Files**:
- `design.md` - Design document
- `requirements.md` - Requirements
- `tasks.md` - Implementation tasks

**When to use**: Planning features, understanding requirements

## Navigation Paths

### For New Team Members

1. Start: `README.md` (project overview)
2. Then: `docs/README.md` (documentation index)
3. Then: `docs/supabase/structure-summary.md` (understand database)
4. Then: `docs/validation/cycle1-summary.md` (validate setup)
5. Bookmark: `supabase/README.md` (daily reference)

### For Daily Development

1. Reference: `supabase/README.md` (database workflows)
2. Reference: `docs/supabase/structure-summary.md` (quick lookup)
3. Scripts: `scripts/validation/` (validation)

### For Validation

1. Start: `docs/validation/cycle1-summary.md`
2. Run: `scripts/validation/validate-cycle1-simple.ps1`
3. Troubleshoot: `docs/validation/cycle1-guide.md`

### For Understanding Structure

1. Start: `docs/supabase/structure-summary.md`
2. Deep dive: `docs/supabase/best-practices.md`
3. Visual: `docs/supabase/workflow-diagram.md`

## File Naming Conventions

### Documentation Files
- Use lowercase with hyphens: `cycle1-summary.md`
- Use descriptive names: `structure-summary.md` not `summary.md`
- Index files: `README.md` in each directory

### Script Files
- Use lowercase with hyphens: `validate-cycle1-simple.ps1`
- Include action in name: `check-supabase-status.ps1`
- Group by purpose in subdirectories

## Cross-References

All documentation files include cross-references to related documents:

- **Relative paths**: `../supabase/structure-summary.md`
- **Clear link text**: `[Structure Summary](../supabase/structure-summary.md)`
- **Context**: Explain why the link is relevant

## Maintenance

### Adding New Documentation

1. **Choose appropriate directory**:
   - Database-related → `docs/supabase/`
   - Validation-related → `docs/validation/`
   - Feature-related → `docs/assets/` or create new category

2. **Use naming convention**:
   - lowercase-with-hyphens.md
   - Descriptive names

3. **Update index files**:
   - Add to `docs/README.md`
   - Add to category `README.md`
   - Update cross-references

4. **Include metadata**:
   - Purpose statement
   - Related documents
   - When to use

### Updating Existing Documentation

1. **Update content**
2. **Check cross-references** (ensure links still work)
3. **Update index files** if title/purpose changed
4. **Update "Last Updated" date** if applicable

## Benefits of This Structure

### ✅ Organized
- Clear hierarchy
- Easy to find documents
- Logical grouping

### ✅ Maintainable
- Consistent naming
- Clear ownership
- Easy to update

### ✅ Discoverable
- Index files at each level
- Cross-references
- Clear navigation paths

### ✅ Scalable
- Easy to add new categories
- Room for growth
- Flexible structure

## Quick Reference

### Most Important Files

| File | Purpose | Audience |
|------|---------|----------|
| `README.md` | Project overview | Everyone |
| `docs/README.md` | Documentation index | Everyone |
| `docs/supabase/structure-summary.md` | Database quick reference | Developers |
| `docs/validation/cycle1-summary.md` | Validation guide | Developers |
| `supabase/README.md` | Daily database reference | Developers |

### Most Used Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `scripts/validation/check-supabase-status.ps1` | Status check | Before starting work |
| `scripts/validation/validate-cycle1-simple.ps1` | Quick validation | After changes |
| `scripts/validation/validate-cycle1.ps1` | Full validation | Before pushing |

## Migration from Old Structure

### What Changed

**Before** (files scattered in root):
```
project-root/
├── SUPABASE_DOCS_INDEX.md
├── SUPABASE_STRUCTURE_SUMMARY.md
├── SUPABASE_STRUCTURE_BEST_PRACTICES.md
├── SUPABASE_WORKFLOW_DIAGRAM.md
├── CYCLE1_VALIDATION_GUIDE.md
├── CYCLE1_VALIDATION_SUMMARY.md
├── VALIDATE_CYCLE1_README.md
├── validate-cycle1-simple.ps1
├── validate-cycle1.ps1
└── check-supabase-status.ps1
```

**After** (organized structure):
```
project-root/
├── README.md
├── docs/
│   ├── README.md
│   ├── supabase/
│   │   ├── README.md
│   │   ├── structure-summary.md
│   │   ├── best-practices.md
│   │   └── workflow-diagram.md
│   └── validation/
│       ├── README.md
│       ├── cycle1-summary.md
│       ├── cycle1-quickstart.md
│       └── cycle1-guide.md
└── scripts/
    └── validation/
        ├── check-supabase-status.ps1
        ├── validate-cycle1-simple.ps1
        └── validate-cycle1.ps1
```

### Path Updates

| Old Path | New Path |
|----------|----------|
| `SUPABASE_STRUCTURE_SUMMARY.md` | `docs/supabase/structure-summary.md` |
| `CYCLE1_VALIDATION_SUMMARY.md` | `docs/validation/cycle1-summary.md` |
| `validate-cycle1-simple.ps1` | `scripts/validation/validate-cycle1-simple.ps1` |

## Summary

✅ All documentation organized in `docs/`  
✅ All scripts organized in `scripts/`  
✅ Clear hierarchy with index files  
✅ Consistent naming conventions  
✅ Cross-references updated  
✅ Easy to navigate and maintain  

---

**Start exploring from [docs/README.md](README.md)!**
