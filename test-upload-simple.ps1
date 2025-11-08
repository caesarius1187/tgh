# Script simple para probar la API de upload-file

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PROBANDO API DE UPLOAD-FILE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"

# 1. Obtener token de autenticación
Write-Host "`n🔐 Obteniendo token de autenticación..." -ForegroundColor Yellow
try {
    $loginData = @{
        username = "testuser"
        password = "password123"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/login" -Method POST -ContentType "application/json" -Body $loginData
    $token = $response.token
    Write-Host "✅ Token obtenido: $($token.Substring(0, 20))..." -ForegroundColor Green
} catch {
    Write-Host "❌ Error al obtener token:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

# 2. Crear archivo de prueba
Write-Host "`n📁 Creando archivo de prueba..." -ForegroundColor Yellow
$testFile = "test-image.jpg"
$testContent = "Test image content for upload testing" * 100
$testContent | Out-File -FilePath $testFile -Encoding UTF8
Write-Host "✅ Archivo de prueba creado: $testFile" -ForegroundColor Green

# 3. Probar upload de foto
Write-Host "`n🧪 Probando upload de foto..." -ForegroundColor Yellow
try {
    # Crear FormData manualmente
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    $fileBytes = [System.IO.File]::ReadAllBytes($testFile)
    $fileEnc = [System.Text.Encoding]::GetEncoding('UTF-8').GetString($fileBytes)
    
    $bodyLines = (
        "--$boundary",
        "Content-Disposition: form-data; name=`"tipo`"",
        "",
        "foto",
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"test-image.jpg`"",
        "Content-Type: image/jpeg",
        "",
        $fileEnc,
        "--$boundary--",
        ""
    ) -join $LF
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "multipart/form-data; boundary=$boundary"
    }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/upload-file" -Method POST -Headers $headers -Body $bodyLines
    
    Write-Host "✅ Upload exitoso:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "❌ Error en upload:" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "Response: $responseBody" -ForegroundColor Red
    } else {
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

# 4. Probar sin autenticación (debe fallar)
Write-Host "`n🧪 Probando upload sin autenticación..." -ForegroundColor Yellow
try {
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    $fileBytes = [System.IO.File]::ReadAllBytes($testFile)
    $fileEnc = [System.Text.Encoding]::GetEncoding('UTF-8').GetString($fileBytes)
    
    $bodyLines = (
        "--$boundary",
        "Content-Disposition: form-data; name=`"tipo`"",
        "",
        "foto",
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"test-image.jpg`"",
        "Content-Type: image/jpeg",
        "",
        $fileEnc,
        "--$boundary--",
        ""
    ) -join $LF
    
    $headers = @{
        "Content-Type" = "multipart/form-data; boundary=$boundary"
    }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/upload-file" -Method POST -Headers $headers -Body $bodyLines
    
    Write-Host "❌ No debería haber sido exitoso:" -ForegroundColor Red
    $response | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "✅ Correctamente rechazado:" -ForegroundColor Green
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
        Write-Host "Response: $responseBody" -ForegroundColor Green
    }
}

# 5. Verificar archivos guardados
Write-Host "`n🔍 Verificando archivos guardados..." -ForegroundColor Yellow
if (Test-Path "./public/uploads") {
    $uploadedFiles = Get-ChildItem "./public/uploads" -File
    Write-Host "✅ Archivos encontrados en uploads:" -ForegroundColor Green
    foreach ($file in $uploadedFiles) {
        Write-Host "  - $($file.Name) ($($file.Length) bytes)" -ForegroundColor Green
    }
} else {
    Write-Host "❌ Directorio uploads no encontrado" -ForegroundColor Red
}

# 6. Limpiar
Write-Host "`n🧹 Limpiando archivo de prueba..." -ForegroundColor Yellow
if (Test-Path $testFile) { 
    Remove-Item $testFile -Force 
    Write-Host "✅ Archivo de prueba eliminado" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "PRUEBAS COMPLETADAS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
