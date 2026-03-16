# Supabase Docker Cleanup and Reset Script
# This script performs a complete cleanup of Docker and Supabase to resolve persistent issues

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Supabase Docker Cleanup & Reset Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop Supabase
Write-Host "[1/6] Stopping Supabase..." -ForegroundColor Yellow
npx supabase stop --no-backup 2>&1 | Out-Null
Write-Host "Done" -ForegroundColor Green
Write-Host ""

# Step 2: Stop all Docker containers
Write-Host "[2/6] Stopping all Docker containers..." -ForegroundColor Yellow
$containers = docker ps -aq
if ($containers) {
    docker stop $containers 2>&1 | Out-Null
    Write-Host "Done" -ForegroundColor Green
} else {
    Write-Host "No containers running" -ForegroundColor Green
}
Write-Host ""

# Step 3: Remove all Docker containers
Write-Host "[3/6] Removing all Docker containers..." -ForegroundColor Yellow
$containers = docker ps -aq
if ($containers) {
    docker rm -f $containers 2>&1 | Out-Null
    Write-Host "Done" -ForegroundColor Green
} else {
    Write-Host "No containers to remove" -ForegroundColor Green
}
Write-Host ""

# Step 4: Prune Docker system
Write-Host "[4/6] Pruning Docker system (images, volumes, networks)..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes..." -ForegroundColor DarkGray
docker system prune -a -f --volumes 2>&1 | Out-Null
Write-Host "Done" -ForegroundColor Green
Write-Host ""

# Step 5: Prune Docker networks
Write-Host "[5/6] Pruning Docker networks..." -ForegroundColor Yellow
docker network prune -f 2>&1 | Out-Null
Write-Host "Done" -ForegroundColor Green
Write-Host ""

# Step 6: Start Supabase
Write-Host "[6/6] Starting Supabase..." -ForegroundColor Yellow
Write-Host "   This will download images and initialize the database..." -ForegroundColor DarkGray
Write-Host "   Please wait, this may take 5-10 minutes..." -ForegroundColor DarkGray
Write-Host ""

npx supabase start

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Cleanup and restart complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Navigate to http://localhost:55323 to access Supabase Studio" -ForegroundColor White
Write-Host "2. Navigate to http://localhost:5173/automation/dashboard to test the dashboard" -ForegroundColor White
Write-Host "3. Navigate to http://localhost:5173/automation/alerts to test alerts" -ForegroundColor White
