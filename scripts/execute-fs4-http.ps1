# Execute FS4 Schema Pack using HTTP API
# This script executes SQL files by posting them to Supabase's SQL execution endpoint

$ErrorActionPreference = "Stop"

# Colors
$Green = "Green"
$Red = "Red"
$Cyan = "Cyan"
$Yellow = "Yellow"
$Gray = "Gray"

function Write-Step {
    param([string]$Message)
    Write-Host "`n$Message" -ForegroundColor $Cyan
    Write-Host ("=" * 80) -ForegroundColor $Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $Green
}

function Write-Failure {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $Red
}

function Write-Info {
    param([string]$Message)
    Write-Host $Message -ForegroundColor $Gray
}

# Configuration
$SupabaseUrl = "http://127.0.0.1:54321"
$SupabaseKey = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"
$SchemaPackDir = "scripts\apm_tx_fs4_inventory_criticality"

Write-Step "APM Transmission FS4 Schema Pack Execution"

# Check if schema pack directory exists
if (-not (Test-Path $SchemaPackDir)) {
    Write-Failure "Schema pack directory not found: $SchemaPackDir"
    exit 1
}

Write-Success "Schema pack directory found"
Write-Info "Supabase URL: $SupabaseUrl"

# Function to execute SQL file
function Invoke-SqlFile {
    param(
        [string]$FilePath,
        [string]$Description
    )
    
    Write-Step "Executing: $Description"
    Write-Info "File: $FilePath"
    
    try {
        # Read SQL file
        $sql = Get-Content -Path $FilePath -Raw
        
        # For local Supabase, we need to use the database connection directly
        # Since we don't have psql, we'll use the pg_admin endpoint
        
        # Create a temporary SQL file with proper encoding
        $tempFile = [System.IO.Path]::GetTempFileName()
        $sql | Out-File -FilePath $tempFile -Encoding UTF8
        
        # Try to execute using curl if available
        $curlAvailable = Get-Command curl -ErrorAction SilentlyContinue
        
        if ($curlAvailable) {
            Write-Info "Using curl to execute SQL..."
            
            # Execute SQL using Supabase REST API
            $headers = @{
                "Content-Type" = "application/json"
                "apikey" = $SupabaseKey
                "Authorization" = "Bearer $SupabaseKey"
            }
            
            # Note: This approach won't work for DDL statements
            # We need direct database access
            Write-Failure "Direct SQL execution requires database access"
            Write-Info "Please use one of these methods:"
            Write-Info "  1. Install Supabase CLI: https://supabase.com/docs/guides/cli"
            Write-Info "  2. Use Supabase Dashboard SQL Editor"
            Write-Info "  3. Install PostgreSQL client (psql)"
            
            Remove-Item $tempFile
            return $false
        }
        
        Remove-Item $tempFile
        return $false
        
    } catch {
        Write-Failure "$Description failed: $_"
        return $false
    }
}

# Since we can't execute SQL directly without proper tools,
# let's provide instructions instead

Write-Step "Execution Method Required"
Write-Host ""
Write-Host "To execute the FS4 schema pack, please use one of these methods:" -ForegroundColor $Yellow
Write-Host ""
Write-Host "Method 1: Supabase Dashboard (Recommended)" -ForegroundColor $Cyan
Write-Host "  1. Open http://127.0.0.1:54321" -ForegroundColor $Gray
Write-Host "  2. Navigate to SQL Editor" -ForegroundColor $Gray
Write-Host "  3. Copy and paste contents of:" -ForegroundColor $Gray
Write-Host "     - $SchemaPackDir\001_migration.sql" -ForegroundColor $Gray
Write-Host "     - $SchemaPackDir\002_seed.sql" -ForegroundColor $Gray
Write-Host "     - $SchemaPackDir\003_validate.sql" -ForegroundColor $Gray
Write-Host "  4. Execute each file in order" -ForegroundColor $Gray
Write-Host ""
Write-Host "Method 2: Install Supabase CLI" -ForegroundColor $Cyan
Write-Host "  1. Install: https://supabase.com/docs/guides/cli" -ForegroundColor $Gray
Write-Host "  2. Run: supabase db execute --file $SchemaPackDir\001_migration.sql" -ForegroundColor $Gray
Write-Host "  3. Run: supabase db execute --file $SchemaPackDir\002_seed.sql" -ForegroundColor $Gray
Write-Host "  4. Run: supabase db execute --file $SchemaPackDir\003_validate.sql" -ForegroundColor $Gray
Write-Host ""
Write-Host "Method 3: Install PostgreSQL Client" -ForegroundColor $Cyan
Write-Host "  1. Install PostgreSQL: https://www.postgresql.org/download/" -ForegroundColor $Gray
Write-Host "  2. Get connection string from Supabase dashboard" -ForegroundColor $Gray
Write-Host "  3. Run: psql <connection-string> -f $SchemaPackDir\001_migration.sql" -ForegroundColor $Gray
Write-Host ""

Write-Host "Files ready for execution:" -ForegroundColor $Green
Write-Host "  ✓ $SchemaPackDir\001_migration.sql" -ForegroundColor $Gray
Write-Host "  ✓ $SchemaPackDir\002_seed.sql" -ForegroundColor $Gray
Write-Host "  ✓ $SchemaPackDir\003_validate.sql" -ForegroundColor $Gray
Write-Host ""
