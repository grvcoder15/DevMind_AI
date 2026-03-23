# Test Google Gemini Integration
Write-Host "Testing Gemini API..." -ForegroundColor Cyan
Write-Host ""

# Check if API key is set
$envFile = Get-Content "backend\.env" -Raw
if ($envFile -match 'GEMINI_API_KEY=AIza[^\s]+') {
    Write-Host "✅ Gemini API key found in .env" -ForegroundColor Green
    
    # Test simple generation
    Write-Host "Testing text generation (10 seconds)..." -ForegroundColor Yellow
    try {
        $uploadBody = @{ repo_url = "https://github.com/grvcoder15/voermon" } | ConvertTo-Json
        $uploadResponse = Invoke-WebRequest -Uri "http://localhost:8000/upload-repo" -Method POST -Body $uploadBody -ContentType "application/json" -TimeoutSec 30 -UseBasicParsing
        $uploadData = $uploadResponse.Content | ConvertFrom-Json
        
        Write-Host "✅ Upload successful! Repo ID: $($uploadData.repo_id)" -ForegroundColor Green
        Write-Host ""
        Write-Host "Running AI analysis with Gemini (30-60 seconds)..." -ForegroundColor Yellow
        
        $analyzeBody = @{ repo_id = $uploadData.repo_id } | ConvertTo-Json
        $analyzeResponse = Invoke-WebRequest -Uri "http://localhost:8000/analyze" -Method POST -Body $analyzeBody -ContentType "application/json" -TimeoutSec 120 -UseBasicParsing
        $analyzeData = $analyzeResponse.Content | ConvertFrom-Json
        
        Write-Host ""
        Write-Host "✅ ✅ ✅ SUCCESS! Gemini is working!" -ForegroundColor Green
        Write-Host "Project: $($analyzeData.project_name)" -ForegroundColor Cyan
        Write-Host "Language: $($analyzeData.language)" -ForegroundColor Cyan
        Write-Host "Summary: $($analyzeData.summary.Substring(0, [Math]::Min(150, $analyzeData.summary.Length)))..." -ForegroundColor White
        
    } catch {
        Write-Host "❌ Error: $_" -ForegroundColor Red
    }
    
} else {
    Write-Host "❌ Gemini API key NOT found in backend\.env" -ForegroundColor Red
    Write-Host ""
    Write-Host "To get FREE API key:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://makersuite.google.com/app/apikey" -ForegroundColor White
    Write-Host "2. Click 'Create API Key'" -ForegroundColor White
    Write-Host "3. Copy the key" -ForegroundColor White
    Write-Host "4. Add to backend\.env:" -ForegroundColor White
    Write-Host "   GEMINI_API_KEY=AIzaSyXxxxxxxxxxxxxxx" -ForegroundColor Cyan
}
