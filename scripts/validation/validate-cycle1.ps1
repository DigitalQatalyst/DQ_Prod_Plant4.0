# Validation script for Cycle 1 (Asset Catalog & Types)
# This script validates migrations and seeds locally before pushing to remote Supabase

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cycle 1 Validation Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Supabase CLI is installed
Write-Host "[1/6] Checking Supabase CLI..." -ForegroundColor Yellow
try {
    $supabaseVersion = supabase --version 2>&1
    Write-Host "✓ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Supabase CLI not found. Install from: https://supabase.com/docs/guides/cli" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Check if local Supabase is running
Write-Host "[2/6] Checking local Supabase status..." -ForegroundColor Yellow
$status = supabase status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Local Supabase is not running" -ForegroundColor Red
    Write-Host "Starting local Supabase..." -ForegroundColor Yellow
    supabase start
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to start Supabase" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ Local Supabase is running" -ForegroundColor Green
}
Write-Host ""

# Step 3: Reset database with migrations and seeds
Write-Host "[3/6] Resetting database (applying migrations + seeds)..." -ForegroundColor Yellow
Write-Host "This will drop all data and recreate from scratch..." -ForegroundColor Yellow
$confirm = Read-Host "Continue? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "Aborted by user" -ForegroundColor Yellow
    exit 0
}

supabase db reset
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Database reset failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Database reset successful" -ForegroundColor Green
Write-Host ""

# Step 4: Validate Cycle 1 migrations
Write-Host "[4/6] Validating Cycle 1 migrations..." -ForegroundColor Yellow

# Check property_sets table exists
$checkPropertySets = @"
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'property_sets'
);
"@

$result = supabase db execute --query $checkPropertySets 2>&1
if ($result -match "t|true") {
    Write-Host "✓ property_sets table exists" -ForegroundColor Green
} else {
    Write-Host "✗ property_sets table not found" -ForegroundColor Red
    exit 1
}

# Check lifecycle_states table exists
$checkLifecycleStates = @"
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'lifecycle_states'
);
"@

$result = supabase db execute --query $checkLifecycleStates 2>&1
if ($result -match "t|true") {
    Write-Host "✓ lifecycle_states table exists" -ForegroundColor Green
} else {
    Write-Host "✗ lifecycle_states table not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 5: Validate Cycle 1 seed data
Write-Host "[5/6] Validating Cycle 1 seed data..." -ForegroundColor Yellow

# Check property_sets count
$checkPropertySetsCount = @"
SELECT COUNT(*) as count FROM property_sets ps
JOIN tenants t ON ps.tenant_id = t.id
WHERE t.scenario_tag = 'power_transmission_demo_v1';
"@

$result = supabase db execute --query $checkPropertySetsCount 2>&1
if ($result -match "(\d+)") {
    $count = $matches[1]
    if ([int]$count -ge 5) {
        Write-Host "✓ property_sets: $count records (expected >= 5)" -ForegroundColor Green
    } else {
        Write-Host "✗ property_sets: $count records (expected >= 5)" -ForegroundColor Red
        exit 1
    }
}

# Check lifecycle_states count
$checkLifecycleStatesCount = @"
SELECT COUNT(*) as count FROM lifecycle_states ls
JOIN tenants t ON ls.tenant_id = t.id
WHERE t.scenario_tag = 'power_transmission_demo_v1';
"@

$result = supabase db execute --query $checkLifecycleStatesCount 2>&1
if ($result -match "(\d+)") {
    $count = $matches[1]
    if ([int]$count -ge 15) {
        Write-Host "✓ lifecycle_states: $count records (expected >= 15)" -ForegroundColor Green
    } else {
        Write-Host "✗ lifecycle_states: $count records (expected >= 15)" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Step 6: Test idempotency
Write-Host "[6/6] Testing seed idempotency..." -ForegroundColor Yellow
Write-Host "Running seeds again to verify idempotency..." -ForegroundColor Yellow

# Re-run property_sets seed
supabase db execute --file supabase/seed/007_property_sets.sql
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ property_sets seed failed on re-run" -ForegroundColor Red
    exit 1
}

# Re-run lifecycle_states seed
supabase db execute --file supabase/seed/008_lifecycle_states.sql
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ lifecycle_states seed failed on re-run" -ForegroundColor Red
    exit 1
}

# Verify counts unchanged
$result = supabase db execute --query $checkPropertySetsCount 2>&1
if ($result -match "(\d+)") {
    $count = $matches[1]
    if ([int]$count -eq 5) {
        Write-Host "✓ property_sets idempotent: $count records" -ForegroundColor Green
    } else {
        Write-Host "✗ property_sets not idempotent: $count records (expected 5)" -ForegroundColor Red
        exit 1
    }
}

$result = supabase db execute --query $checkLifecycleStatesCount 2>&1
if ($result -match "(\d+)") {
    $count = $matches[1]
    if ([int]$count -eq 15) {
        Write-Host "✓ lifecycle_states idempotent: $count records" -ForegroundColor Green
    } else {
        Write-Host "✗ lifecycle_states not idempotent: $count records (expected 15)" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Success summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ All Cycle 1 validations passed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test the UI pages locally (npm run dev)" -ForegroundColor White
Write-Host "2. Review Supabase Studio: http://127.0.0.1:54323" -ForegroundColor White
Write-Host "3. Push migrations to remote: supabase db push" -ForegroundColor White
Write-Host ""
