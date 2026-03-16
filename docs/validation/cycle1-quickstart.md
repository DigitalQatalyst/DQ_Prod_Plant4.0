# Quick Start: Validate Cycle 1 Locally

## TL;DR - Run This

```powershell
# 1. Check Supabase status
.\check-supabase-status.ps1

# 2. If not running, start it
supabase start

# 3. Reset database (apply migrations + seeds)
supabase db reset

# 4. Validate Cycle 1 data
.\validate-cycle1-simple.ps1

# 5. View in Studio
# Open: http://127.0.0.1:54323
```

## What Gets Validated

### Tables Created
- ✅ `property_sets` - Reusable metadata field collections
- ✅ `lifecycle_states` - Asset lifecycle stage definitions

### Data Seeded
- ✅ 5 property sets (technical, operational, safety, financial, maintenance)
- ✅ 15 lifecycle states (5 states × 3 categories)

### Expected Results

**property_sets:**
| Name | Type | Fields |
|------|------|--------|
| Technical Specifications | technical | 4 fields (voltage_rating, current_rating, frequency, power_rating) |
| Operational Parameters | operational | 4 fields (operating temps, load_factor, efficiency) |
| Safety Compliance | safety | 4 fields (safety_class, insulation_class, ip_rating, arc_flash_rating) |
| Financial Data | financial | 4 fields (costs, depreciation) |
| Maintenance Schedule | maintenance | 4 fields (inspection dates, intervals, warranty) |

**lifecycle_states:**
| Category | States | Order |
|----------|--------|-------|
| electrical | Commissioning, In Service, Standby, Outage, Decommissioned | 1-5 |
| protection | Commissioning, In Service, Standby, Outage, Decommissioned | 1-5 |
| measurement | Commissioning, In Service, Standby, Outage, Decommissioned | 1-5 |

## Files Created

- ✅ `supabase/seed.sql` - Master seed orchestrator
- ✅ `validate-cycle1-simple.ps1` - Quick validation via REST API
- ✅ `validate-cycle1.ps1` - Full validation with idempotency test
- ✅ `check-supabase-status.ps1` - Status checker
- ✅ `CYCLE1_VALIDATION_GUIDE.md` - Detailed guide

## Troubleshooting

### "Supabase not running"
```powershell
supabase start
```

### "Tables don't exist"
```powershell
supabase db reset
```

### "Wrong data counts"
Check seed files ran:
```powershell
supabase db execute --file supabase/seed/007_property_sets.sql
supabase db execute --file supabase/seed/008_lifecycle_states.sql
```

## Next: Push to Remote

Once validation passes locally:

```powershell
# 1. Review what will be pushed
supabase db diff

# 2. Push migrations
supabase db push

# 3. Run seeds on remote (manual via Studio SQL Editor)
# Copy contents of seed/007_property_sets.sql and seed/008_lifecycle_states.sql
```

See `CYCLE1_VALIDATION_GUIDE.md` for detailed instructions.
