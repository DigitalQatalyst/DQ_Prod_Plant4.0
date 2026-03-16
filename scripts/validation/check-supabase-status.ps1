# Quick status check for local Supabase

Write-Host "Checking Supabase Status..." -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is available via npx
try {
    $version = npx supabase --version 2>&1
    Write-Host "OK Supabase CLI: $version" -ForegroundColor Green
} catch {
    Write-Host "ERROR Supabase CLI not available" -ForegroundColor Red
    Write-Host "Install from: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}

# Check if Supabase is running
Write-Host ""
Write-Host "Checking services..." -ForegroundColor Yellow
npx supabase status

Write-Host ""
Write-Host "Quick links:" -ForegroundColor Cyan
Write-Host "  Studio:  http://127.0.0.1:54323" -ForegroundColor White
Write-Host "  API:     http://127.0.0.1:54321" -ForegroundColor White
Write-Host "  DB:      postgresql://postgres:postgres@127.0.0.1:54322/postgres" -ForegroundColor White
Write-Host ""
Write-Host "Note: Use 'npx supabase' for all Supabase CLI commands" -ForegroundColor Yellow
Write-Host ""
