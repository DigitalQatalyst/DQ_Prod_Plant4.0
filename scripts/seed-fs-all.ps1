# Execute all FS seed scripts in order
# This script runs FS1, FS2, FS3, and FS5 seed scripts

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "APM Transmission - Seed All Feature Sets" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Database connection string
$dbUrl = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Check if psql is available
$psqlAvailable = Get-Command psql -ErrorAction SilentlyContinue

if (-not $psqlAvailable) {
    Write-Host "✗ psql not found. Using Supabase CLI instead..." -ForegroundColor Yellow
    Write-Host ""
    
    # Use Supabase CLI to execute SQL files
    $seedFiles = @(
        "supabase/seed/008_apm_fs1_seed.sql",
        "supabase/seed/009_apm_fs3_seed.sql",
        "supabase/seed/010_apm_fs2_seed.sql",
        "supabase/seed/011_apm_fs5_seed.sql"
    )
    
    foreach ($file in $seedFiles) {
        if (Test-Path $file) {
            Write-Host "Executing: $file" -ForegroundColor Cyan
            $content = Get-Content $file -Raw
            
            # Create a temporary file with the SQL content
            $tempFile = [System.IO.Path]::GetTempFileName() + ".sql"
            $content | Out-File -FilePath $tempFile -Encoding UTF8
            
            # Execute using Supabase CLI
            npx supabase db execute --file $tempFile
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ $file completed successfully" -ForegroundColor Green
            } else {
                Write-Host "✗ $file failed" -ForegroundColor Red
                Remove-Item $tempFile -ErrorAction SilentlyContinue
                exit 1
            }
            
            Remove-Item $tempFile -ErrorAction SilentlyContinue
            Write-Host ""
        } else {
            Write-Host "✗ File not found: $file" -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "✓ psql found, using direct database connection" -ForegroundColor Green
    Write-Host ""
    
    # Use psql to execute SQL files
    $seedFiles = @(
        "supabase/seed/008_apm_fs1_seed.sql",
        "supabase/seed/009_apm_fs3_seed.sql",
        "supabase/seed/010_apm_fs2_seed.sql",
        "supabase/seed/011_apm_fs5_seed.sql"
    )
    
    foreach ($file in $seedFiles) {
        if (Test-Path $file) {
            Write-Host "Executing: $file" -ForegroundColor Cyan
            psql $dbUrl -f $file
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ $file completed successfully" -ForegroundColor Green
            } else {
                Write-Host "✗ $file failed" -ForegroundColor Red
                exit 1
            }
            Write-Host ""
        } else {
            Write-Host "✗ File not found: $file" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All seed scripts completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
