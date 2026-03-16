# ============================================================================
# Apply RLS Migrations to Supabase
# ============================================================================
# This script applies the RLS policy migrations to the Supabase database
# ============================================================================

Write-Host "Applying RLS Migrations..." -ForegroundColor Cyan

# Check if .env.development exists
if (-not (Test-Path ".env.development")) {
    Write-Host "Error: .env.development file not found" -ForegroundColor Red
    exit 1
}

# Load environment variables
Get-Content .env.development | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

$SUPABASE_URL = $env:VITE_SUPABASE_URL
$SUPABASE_KEY = $env:VITE_SUPABASE_ANON_KEY

if (-not $SUPABASE_URL -or -not $SUPABASE_KEY) {
    Write-Host "Error: Supabase credentials not found in .env.development" -ForegroundColor Red
    exit 1
}

Write-Host "Supabase URL: $SUPABASE_URL" -ForegroundColor Gray

# Function to execute SQL file
function Execute-SqlFile {
    param (
        [string]$FilePath
    )
    
    Write-Host "`nExecuting: $FilePath" -ForegroundColor Yellow
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "Error: File not found: $FilePath" -ForegroundColor Red
        return $false
    }
    
    $sql = Get-Content $FilePath -Raw
    
    # Note: This requires the Supabase REST API to have an exec_sql function
    # or you need to use the Supabase CLI: supabase db push
    Write-Host "SQL file loaded. Please apply manually using Supabase CLI:" -ForegroundColor Cyan
    Write-Host "  supabase db push" -ForegroundColor White
    Write-Host "Or apply via Supabase Dashboard SQL Editor" -ForegroundColor White
    
    return $true
}

# Apply migrations in order
$migrations = @(
    "supabase/migrations/018_enable_rls_policies.sql",
    "supabase/migrations/019_create_write_policies.sql",
    "supabase/migrations/020_add_audit_logging.sql"
)

foreach ($migration in $migrations) {
    $result = Execute-SqlFile -FilePath $migration
    if (-not $result) {
        Write-Host "Failed to execute: $migration" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n✅ RLS migrations ready to apply" -ForegroundColor Green
Write-Host "`nTo apply these migrations, use one of the following methods:" -ForegroundColor Cyan
Write-Host "1. Supabase CLI: supabase db push" -ForegroundColor White
Write-Host "2. Supabase Dashboard: Copy SQL from migration files to SQL Editor" -ForegroundColor White
Write-Host "3. Local Supabase: supabase migration up" -ForegroundColor White
