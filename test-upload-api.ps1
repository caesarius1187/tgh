# Script de PowerShell para probar la API de upload-file

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PROBANDO API DE UPLOAD-FILE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Variables
$baseUrl = "http://localhost:3000"
$testImagePath = "test-image.jpg"
$testPdfPath = "test-certificate.pdf"

# Función para crear archivo de prueba
function Create-TestFile {
    param(
        [string]$FilePath,
        [string]$Content,
        [int]$SizeKB = 100
    )
    
    if (-not (Test-Path $FilePath)) {
        # Crear contenido de prueba
        $content = "Test file content for $FilePath" * ($SizeKB * 10)
        $content | Out-File -FilePath $FilePath -Encoding UTF8
        Write-Host "✅ Archivo de prueba creado: $FilePath" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  Archivo ya existe: $FilePath" -ForegroundColor Yellow
    }
}

# Función para hacer login y obtener token
function Get-AuthToken {
    try {
        $loginData = @{
            username = "testuser"
            password = "password123"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/login" -Method POST -ContentType "application/json" -Body $loginData
        return $response.token
    } catch {
        Write-Host "❌ Error al obtener token de autenticación:" -ForegroundColor Red
        Write-Host $_.Exception.Message
        return $null
    }
}

# Crear archivos de prueba
Write-Host "`n📁 Creando archivos de prueba..." -ForegroundColor Yellow
Create-TestFile -FilePath $testImagePath -SizeKB 50
Create-TestFile -FilePath $testPdfPath -SizeKB 200

# Obtener token de autenticación
Write-Host "`n🔐 Obteniendo token de autenticación..." -ForegroundColor Yellow
$token = Get-AuthToken

if (-not $token) {
    Write-Host "❌ No se pudo obtener token. Abortando pruebas." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Token obtenido: $($token.Substring(0, 20))..." -ForegroundColor Green

# Función para probar upload
function Test-FileUpload {
    param(
        [string]$FilePath,
        [string]$Tipo,
        [string]$Token,
        [string]$TestName
    )
    
    Write-Host "`n🧪 $TestName" -ForegroundColor Yellow
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "❌ Archivo no encontrado: $FilePath" -ForegroundColor Red
        return
    }
    
    try {
        # Crear FormData
        $boundary = [System.Guid]::NewGuid().ToString()
        $LF = "`r`n"
        
        $fileBytes = [System.IO.File]::ReadAllBytes($FilePath)
        $fileEnc = [System.Text.Encoding]::GetEncoding('UTF-8').GetString($fileBytes)
        
        $bodyLines = (
            "--$boundary",
            "Content-Disposition: form-data; name=`"tipo`"",
            "",
            $Tipo,
            "--$boundary",
            "Content-Disposition: form-data; name=`"file`"; filename=`"$(Split-Path $FilePath -Leaf)`"",
            "Content-Type: application/octet-stream",
            "",
            $fileEnc,
            "--$boundary--",
            ""
        ) -join $LF
        
        $headers = @{
            "Authorization" = "Bearer $Token"
            "Content-Type" = "multipart/form-data; boundary=$boundary"
        }
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/upload-file" -Method POST -Headers $headers -Body $bodyLines
        
        Write-Host "✅ Respuesta exitosa:" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 3
        
    } catch {
        Write-Host "❌ Error:" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
            Write-Host "Response: $responseBody" -ForegroundColor Red
        } else {
            Write-Host $_.Exception.Message -ForegroundColor Red
        }
    }
}

# Función para probar sin autenticación
function Test-UploadWithoutAuth {
    param(
        [string]$FilePath,
        [string]$Tipo,
        [string]$TestName
    )
    
    Write-Host "`n🧪 $TestName" -ForegroundColor Yellow
    
    try {
        $boundary = [System.Guid]::NewGuid().ToString()
        $LF = "`r`n"
        
        $fileBytes = [System.IO.File]::ReadAllBytes($FilePath)
        $fileEnc = [System.Text.Encoding]::GetEncoding('UTF-8').GetString($fileBytes)
        
        $bodyLines = (
            "--$boundary",
            "Content-Disposition: form-data; name=`"tipo`"",
            "",
            $Tipo,
            "--$boundary",
            "Content-Disposition: form-data; name=`"file`"; filename=`"$(Split-Path $FilePath -Leaf)`"",
            "Content-Type: application/octet-stream",
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
}

# Pruebas
Write-Host "`n🚀 Iniciando pruebas de upload..." -ForegroundColor Cyan

# 1. Probar upload de foto válida
Test-FileUpload -FilePath $testImagePath -Tipo "foto" -Token $token -TestName "1. Upload de foto válida"

# 2. Probar upload de certificado válido
Test-FileUpload -FilePath $testPdfPath -Tipo "certificado_grupo_sanguineo" -Token $token -TestName "2. Upload de certificado válido"

# 3. Probar upload sin autenticación
Test-UploadWithoutAuth -FilePath $testImagePath -Tipo "foto" -TestName "3. Upload sin autenticación (debe fallar)"

# 4. Probar upload con tipo inválido
Write-Host "`n🧪 4. Upload con tipo inválido" -ForegroundColor Yellow
try {
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    $fileBytes = [System.IO.File]::ReadAllBytes($testImagePath)
    $fileEnc = [System.Text.Encoding]::GetEncoding('UTF-8').GetString($fileBytes)
    
    $bodyLines = (
        "--$boundary",
        "Content-Disposition: form-data; name=`"tipo`"",
        "",
        "tipo_invalido",
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"test.jpg`"",
        "Content-Type: application/octet-stream",
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

# 5. Probar upload sin archivo
Write-Host "`n🧪 5. Upload sin archivo (debe fallar)" -ForegroundColor Yellow
try {
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    $bodyLines = (
        "--$boundary",
        "Content-Disposition: form-data; name=`"tipo`"",
        "",
        "foto",
        "--$boundary--",
        ""
    ) -join $LF
    
    $headers = @{
        "Authorization" = "Bearer $token"
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

# 6. Verificar que los archivos se guardaron
Write-Host "`n🔍 6. Verificando archivos guardados..." -ForegroundColor Yellow
if (Test-Path "./public/uploads") {
    $uploadedFiles = Get-ChildItem "./public/uploads" -File
    Write-Host "✅ Archivos encontrados en uploads:" -ForegroundColor Green
    foreach ($file in $uploadedFiles) {
        Write-Host "  - $($file.Name) ($($file.Length) bytes)" -ForegroundColor Green
    }
} else {
    Write-Host "❌ Directorio uploads no encontrado" -ForegroundColor Red
}

# Limpiar archivos de prueba
Write-Host "`n🧹 Limpiando archivos de prueba..." -ForegroundColor Yellow
if (Test-Path $testImagePath) { Remove-Item $testImagePath -Force }
if (Test-Path $testPdfPath) { Remove-Item $testPdfPath -Force }
Write-Host "✅ Archivos de prueba eliminados" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "PRUEBAS DE UPLOAD COMPLETADAS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
