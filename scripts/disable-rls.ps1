#!/usr/bin/env pwsh
# ============================================================================
# Disable All RLS Policies
# ============================================================================
# This script applies migration 022 to disable all RLS policies
# WARNING: This removes all security restrictions - use only in dev environment
# ============================================================================

Write-Host "===========================================================================" -ForegroundColor Cyan
Write-Host "Disabling All RLS Policies" -ForegroundColor Cyan
Write-Host "===========================================================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
if (Test-Path .env.development) {
    Write-Host "Loading environment from .env.development..." -ForegroundColor Yellow
    Get-Content .env.development | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
} else {
    Write-Host "ERROR: .env.development file not found" -ForegroundColor Red
    exit 1
}

$SUPABASE_URL = $env:VITE_SUPABASE_URL
$SUPABASE_SERVICE_KEY = $env:VITE_SUPABASE_SERVICE_ROLE_KEY

if (-not $SUPABASE_URL -or -not $SUPABASE_SERVICE_KEY) {
    Write-Host "ERROR: Missing Supabase credentials in .env.development" -ForegroundColor Red
    exit 1
}

Write-Host "Supabase URL: $SUPABASE_URL" -ForegroundColor Green
Write-Host ""

# Read migration file
$migrationFile = "supabase/migrations/022_disable_all_rls.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "ERROR: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Reading migration file: $migrationFile" -ForegroundColor Yellow
$sql = Get-Content $migrationFile -Raw

# Execute migration
Write-Host "Executing migration..." -ForegroundColor Yellow
Write-Host ""

$body = @{
    query = $sql
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod `
        -Uri "$SUPABASE_URL/rest/v1/rpc/exec_sql" `
        -Method Post `
        -Headers @{
            "apikey" = $SUPABASE_SERVICE_KEY
            "Authorization" = "Bearer $SUPABASE_SERVICE_KEY"
            "Content-Type" = "application/json"
        } `
        -Body $body `
        -ErrorAction Stop

    Write-Host "✓ Migration executed successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "All RLS policies have been disabled" -ForegroundColor Green
    Write-Host "All tables now have unrestricted access" -ForegroundColor Yellow
    Write-Host ""
} catch {
    Write-Host "ERROR: Failed to execute migration" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    # Try alternative method using psql if available
    Write-Host ""
    Write-Host "Attempting alternative method using direct SQL execution..." -ForegroundColor Yellow
    
    # Extract connection details from Supabase URL
    if ($SUPABASE_URL -match 'https://([^.]+)\.supabase\.co') {
        $projectRef = $matches[1]
        Write-Host "Project Reference: $projectRef" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "To apply this migration manually:" -ForegroundColor Yellow
        Write-Host "1. Go to Supabase Dashboard > SQL Editor" -ForegroundColor White
        Write-Host "2. Copy the contents of: $migrationFile" -ForegroundColor White
        Write-Host "3. Paste and execute in the SQL Editor" -ForegroundColor White
    }
    
    exit 1
}

Write-Host "===========================================================================" -ForegroundColor Cyan
Write-Host "RLS Policies Disabled Successfully" -ForegroundColor Cyan
Write-Host "===========================================================================" -ForegroundColor Cyan
