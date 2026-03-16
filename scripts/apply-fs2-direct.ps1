# ============================================================================
# Direct FS2 Schema Application Script
# ============================================================================
# This script provides instructions for applying the FS2 schema pack
# to your local Supabase instance.
#
# Since direct SQL execution requires database access, this script
# guides you through the manual application process.
# ============================================================================

$ErrorActionPreference = "Stop"

# Colors
$Cyan = "Cyan"
$Green = "Green"
$Yellow = "Yellow"
$Gray = "Gray"

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host $Message -ForegroundColor $Cyan
    Write-Host ("=" * 80) -ForegroundColor $Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "  $Message" -ForegroundColor $Gray
}

Write-Header "APM Transmission FS2 Schema Pack Application"
Write-Host "Feature Set 2: Predictive & Prescriptive Maintenance" -ForegroundColor $Gray
Write-Host ""

Write-Host "The FS2 schema pack files are ready for application:" -ForegroundColor $Green
Write-Host ""
Write-Success "Migration: supabase/migrations/016_apm_fs2_predictive_prescriptive.sql"
Write-Success "Seed Data: supabase/seed/010_apm_fs2_seed.sql"
Write-Success "Validation: .kiro/specs/apm-transmission-full/schema_packs/apm_tx_fs2_predictive_prescriptive/003_validate.sql"
Write-Host ""

Write-Header "Application Methods"
Write-Host ""

Write-Host "METHOD 1: Supabase Studio SQL Editor (Recommended)" -ForegroundColor $Cyan
Write-Info "1. Open http://127.0.0.1:54321 in your browser"
Write-Info "2. Navigate to SQL Editor"
Write-Info "3. Copy and paste the contents of each file in order:"
Write-Info "   a) supabase/migrations/016_apm_fs2_predictive_prescriptive.sql"
Write-Info "   b) supabase/seed/010_apm_fs2_seed.sql"
Write-Info "   c) .kiro/specs/apm-transmission-full/schema_packs/apm_tx_fs2_predictive_prescriptive/003_validate.sql"
Write-Info "4. Execute each file and verify no errors"
Write-Host ""

Write-Host "METHOD 2: Using psql (if PostgreSQL client is installed)" -ForegroundColor $Cyan
Write-Info "1. Get your database connection string from Supabase Studio"
Write-Info "2. Run the following commands:"
Write-Info "   psql <connection-string> -f supabase/migrations/016_apm_fs2_predictive_prescriptive.sql"
Write-Info "   psql <connection-string> -f supabase/seed/010_apm_fs2_seed.sql"
Write-Info "   psql <connection-string> -f .kiro/specs/apm-transmission-full/schema_packs/apm_tx_fs2_predictive_prescriptive/003_validate.sql"
Write-Host ""

Write-Header "Expected Results"
Write-Host ""
Write-Success "Migration should create 4 new tables:"
Write-Info "- failure_predictions"
Write-Info "- cbm_triggers"
Write-Info "- maintenance_recommendations"
Write-Info "- risk_scoring_model"
Write-Host ""

Write-Success "Seed should populate:"
Write-Info "- 12 failure predictions (various assets and time horizons)"
Write-Info "- 8 CBM triggers (SF6, DGA, temperature, contact wear)"
Write-Info "- 11 maintenance recommendations (various priorities and statuses)"
Write-Info "- 1 risk scoring model for power_transmission sector"
Write-Host ""

Write-Success "Validation should return 0 rows for all checks"
Write-Info "- All failure predictions have valid bounds and values"
Write-Info "- All CBM triggers have valid operators"
Write-Info "- All recommendations reference valid assets and spares"
Write-Info "- Completed recommendations have completion notes"
Write-Host ""

Write-Header "Next Steps After Application"
Write-Host ""
Write-Info "1. Verify tables were created successfully"
Write-Info "2. Check that seed data was inserted"
Write-Info "3. Run validation queries to ensure data integrity"
Write-Info "4. Proceed to implement FS2 API query hooks"
Write-Info "5. Enhance FS2 UI pages with real functionality"
Write-Host ""

Write-Host "Press any key to open the migration file in your default editor..." -ForegroundColor $Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Open the migration file
Start-Process "supabase\migrations\016_apm_fs2_predictive_prescriptive.sql"

Write-Host ""
Write-Success "Migration file opened in your default editor"
Write-Host ""
