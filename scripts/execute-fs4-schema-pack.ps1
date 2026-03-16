# ============================================================================
# Execute APM Transmission FS4 Schema Pack
# ============================================================================
# This script executes the FS4 schema pack in the correct order:
# 1. Migration (create tables and extend schema)
# 2. Seed (populate reference data)
# 3. Validate (verify data integrity)
#
# Usage: .\scripts\execute-fs4-schema-pack.ps1
# ============================================================================

param(
    [string]$SupabaseProjectRef = $env:SUPABASE_PROJECT_REF,
    [string]$SupabaseDbPassword = $env:SUPABASE_DB_PASSWORD,
    [switch]$SkipValidation = $false,
    [switch]$Verbose = $false
)

# Colors for output
$ErrorColor = "Red"
$SuccessColor = "Green"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

function Write-Step {
    param([string]$Message)
    Write-Host "`n$Message" -ForegroundColor $InfoColor
    Write-Host ("=" * 80) -ForegroundColor $InfoColor
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $SuccessColor
}

function Write-Failure {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $ErrorColor
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $WarningColor
}

# ============================================================================
# Validate Prerequisites
# ============================================================================

Write-Step "Validating Prerequisites"

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Supabase CLI found: $supabaseVersion"
    } else {
        throw "Supabase CLI not found"
    }
} catch {
    Write-Failure "Supabase CLI is not installed or not in PATH"
    Write-Host "Install from: https://supabase.com/docs/guides/cli" -ForegroundColor $InfoColor
    exit 1
}

# Check if schema pack directory exists
$schemaPackDir = "scripts/apm_tx_fs4_inventory_criticality"
if (-not (Test-Path $schemaPackDir)) {
    Write-Failure "Schema pack directory not found: $schemaPackDir"
    exit 1
}
Write-Success "Schema pack directory found"

# Check if all required files exist
$requiredFiles = @(
    "$schemaPackDir/001_migration.sql",
    "$schemaPackDir/002_seed.sql",
    "$schemaPackDir/003_validate.sql"
)

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Failure "Required file not found: $file"
        exit 1
    }
}
Write-Success "All required SQL files found"

# ============================================================================
# Execute Migration
# ============================================================================

Write-Step "Step 1: Executing Migration Script"
Write-Host "Creating tables and extending schema..." -ForegroundColor $InfoColor

try {
    $migrationFile = "$schemaPackDir/001_migration.sql"
    
    if ($Verbose) {
        Write-Host "Executing: $migrationFile" -ForegroundColor $InfoColor
    }
    
    # Execute using Supabase CLI
    $output = supabase db execute --file $migrationFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Migration completed successfully"
        if ($Verbose) {
            Write-Host $output -ForegroundColor Gray
        }
    } else {
        throw "Migration failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Failure "Migration failed: $_"
    Write-Host $output -ForegroundColor $ErrorColor
    exit 1
}

# ============================================================================
# Execute Seed
# ============================================================================

Write-Step "Step 2: Executing Seed Script"
Write-Host "Populating reference data..." -ForegroundColor $InfoColor

try {
    $seedFile = "$schemaPackDir/002_seed.sql"
    
    if ($Verbose) {
        Write-Host "Executing: $seedFile" -ForegroundColor $InfoColor
    }
    
    # Execute using Supabase CLI
    $output = supabase db execute --file $seedFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Seed completed successfully"
        if ($Verbose) {
            Write-Host $output -ForegroundColor Gray
        }
    } else {
        throw "Seed failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Failure "Seed failed: $_"
    Write-Host $output -ForegroundColor $ErrorColor
    exit 1
}

# ============================================================================
# Execute Validation
# ============================================================================

if (-not $SkipValidation) {
    Write-Step "Step 3: Executing Validation Script"
    Write-Host "Validating data integrity..." -ForegroundColor $InfoColor

    try {
        $validateFile = "$schemaPackDir/003_validate.sql"
        
        if ($Verbose) {
            Write-Host "Executing: $validateFile" -ForegroundColor $InfoColor
        }
        
        # Execute using Supabase CLI
        $output = supabase db execute --file $validateFile 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host $output
            
            # Check if output contains any FAIL messages
            if ($output -match "FAIL:") {
                Write-Warning "Validation completed with failures"
                Write-Host "Review the output above for details" -ForegroundColor $WarningColor
                exit 1
            } else {
                Write-Success "Validation completed - all checks passed"
            }
        } else {
            throw "Validation failed with exit code $LASTEXITCODE"
        }
    } catch {
        Write-Failure "Validation failed: $_"
        Write-Host $output -ForegroundColor $ErrorColor
        exit 1
    }
} else {
    Write-Warning "Validation skipped (use -SkipValidation:$false to enable)"
}

# ============================================================================
# Summary
# ============================================================================

Write-Step "FS4 Schema Pack Execution Complete"

Write-Host ""
Write-Success "All steps completed successfully!"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor $InfoColor
Write-Host "  1. Test API hooks (useAssets, useFMEAEntries, useSpareParts)" -ForegroundColor Gray
Write-Host "  2. Verify UI pages display data correctly" -ForegroundColor Gray
Write-Host "  3. Proceed to FS1: Asset Health & Diagnostics" -ForegroundColor Gray
Write-Host ""

exit 0
