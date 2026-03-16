# Simple Cycle 1 Validation Script
# Uses Supabase local REST API to validate data

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cycle 1 Simple Validation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$SUPABASE_URL = "http://127.0.0.1:54321"
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

# Step 1: Check if local Supabase is running
Write-Host "[1/4] Checking if local Supabase is running..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/" -Headers @{
        "apikey" = $SUPABASE_ANON_KEY
    } -Method Get -ErrorAction Stop
    Write-Host "OK Local Supabase is running" -ForegroundColor Green
} catch {
    Write-Host "ERROR Local Supabase is not running" -ForegroundColor Red
    Write-Host "Start it with: npx supabase start" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 2: Check tenant exists
Write-Host "[2/4] Checking transmission tenant..." -ForegroundColor Yellow
try {
    $tenantUrl = "$SUPABASE_URL/rest/v1/tenants?scenario_tag=eq.power_transmission_demo_v1&select=id,name"
    $response = Invoke-RestMethod -Uri $tenantUrl -Headers @{
        "apikey" = $SUPABASE_ANON_KEY
        "Content-Type" = "application/json"
    } -Method Get -ErrorAction Stop
    
    if ($response.Count -gt 0) {
        $tenantId = $response[0].id
        $tenantName = $response[0].name
        Write-Host "OK Tenant found: $tenantName ($tenantId)" -ForegroundColor Green
    } else {
        Write-Host "ERROR Transmission tenant not found" -ForegroundColor Red
        Write-Host "Run: npx supabase db reset" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "ERROR Failed to query tenants: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Validate property_sets
Write-Host "[3/4] Validating property_sets..." -ForegroundColor Yellow
try {
    $propertyUrl = "$SUPABASE_URL/rest/v1/property_sets?tenant_id=eq.$tenantId&select=id,name,type"
    $response = Invoke-RestMethod -Uri $propertyUrl -Headers @{
        "apikey" = $SUPABASE_ANON_KEY
        "Content-Type" = "application/json"
    } -Method Get -ErrorAction Stop
    
    $count = $response.Count
    if ($count -ge 5) {
        Write-Host "OK property_sets: $count records (expected >= 5)" -ForegroundColor Green
        Write-Host "  Types found:" -ForegroundColor Gray
        foreach ($ps in $response) {
            Write-Host "    - $($ps.name) ($($ps.type))" -ForegroundColor Gray
        }
    } else {
        Write-Host "ERROR property_sets: $count records (expected >= 5)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERROR Failed to query property_sets: $_" -ForegroundColor Red
    Write-Host "Table may not exist. Run: npx supabase db reset" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 4: Validate lifecycle_states
Write-Host "[4/4] Validating lifecycle_states..." -ForegroundColor Yellow
try {
    $lifecycleUrl = "$SUPABASE_URL/rest/v1/lifecycle_states?tenant_id=eq.$tenantId&select=id,asset_category,name,order_index"
    $response = Invoke-RestMethod -Uri $lifecycleUrl -Headers @{
        "apikey" = $SUPABASE_ANON_KEY
        "Content-Type" = "application/json"
    } -Method Get -ErrorAction Stop
    
    $count = $response.Count
    if ($count -ge 15) {
        Write-Host "OK lifecycle_states: $count records (expected >= 15)" -ForegroundColor Green
        
        # Group by category
        $categories = $response | Group-Object -Property asset_category
        Write-Host "  Categories found:" -ForegroundColor Gray
        foreach ($cat in $categories) {
            Write-Host "    - $($cat.Name): $($cat.Count) states" -ForegroundColor Gray
        }
    } else {
        Write-Host "ERROR lifecycle_states: $count records (expected >= 15)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERROR Failed to query lifecycle_states: $_" -ForegroundColor Red
    Write-Host "Table may not exist. Run: npx supabase db reset" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Success summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OK All Cycle 1 validations passed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. View data in Supabase Studio: http://127.0.0.1:54323" -ForegroundColor White
Write-Host "2. Test UI pages: npm run dev" -ForegroundColor White
Write-Host "3. Push to remote: npx supabase db push" -ForegroundColor White
Write-Host ""
