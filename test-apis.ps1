# Script de PowerShell para probar APIs TGH Pulseras

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PROBANDO APIS TGH PULSERAS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Probar validación de serial
Write-Host "`n1. Probando validación de serial..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/validate-serial" -Method POST -ContentType "application/json" -Body '{"serial": "TGH001"}'
    Write-Host "✅ Respuesta:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# 2. Probar registro de usuario
Write-Host "`n2. Probando registro de usuario..." -ForegroundColor Yellow
try {
    $registerData = @{
        username = "testuser123"
        password = "Test123!@#"
        serial = "TGH001"
        confirmPassword = "Test123!@#"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/register" -Method POST -ContentType "application/json" -Body $registerData
    Write-Host "✅ Respuesta:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
    $token = $response.token
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# 3. Probar login
Write-Host "`n3. Probando login..." -ForegroundColor Yellow
try {
    $loginData = @{
        username = "testuser123"
        password = "Test123!@#"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/login" -Method POST -ContentType "application/json" -Body $loginData
    Write-Host "✅ Respuesta:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
    $token = $response.token
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# 4. Probar obtener datos de usuario (si tenemos token)
if ($token) {
    Write-Host "`n4. Probando obtener datos de usuario..." -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/user-data" -Method GET -Headers $headers
        Write-Host "✅ Respuesta:" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 3
    } catch {
        Write-Host "❌ Error:" -ForegroundColor Red
        Write-Host $_.Exception.Message
    }
}

# 5. Probar datos públicos NFC
Write-Host "`n5. Probando datos públicos NFC..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/nfc-data/TGH001" -Method GET
    Write-Host "✅ Respuesta:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# 6. Probar página pública NFC
Write-Host "`n6. Probando página pública NFC..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/nfc/TGH001" -Method GET
    Write-Host "✅ Status Code:" -ForegroundColor Green
    Write-Host $response.StatusCode
    Write-Host "✅ Content Length:" -ForegroundColor Green
    Write-Host $response.Content.Length
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "PRUEBAS COMPLETADAS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
