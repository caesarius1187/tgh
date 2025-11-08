# Script para instalar Visual C++ Redistributables automáticamente
# Ejecutar como Administrador: powershell -ExecutionPolicy Bypass -File install-vcredist.ps1

Write-Host "=== Instalando Visual C++ Redistributables ===" -ForegroundColor Cyan

# URLs de descarga de Microsoft
$vcredistUrls = @{
    "x64" = "https://aka.ms/vs/17/release/vc_redist.x64.exe"
    "x86" = "https://aka.ms/vs/17/release/vc_redist.x86.exe"
}

$tempDir = "$env:TEMP\vcredist"
New-Item -ItemType Directory -Force -Path $tempDir

foreach ($arch in $vcredistUrls.Keys) {
    $url = $vcredistUrls[$arch]
    $fileName = "vc_redist_$arch.exe"
    $filePath = "$tempDir\$fileName"
    
    Write-Host "Descargando Visual C++ Redistributable ($arch)..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri $url -OutFile $filePath -UseBasicParsing
        Write-Host "✅ Descarga completada: $fileName" -ForegroundColor Green
        
        Write-Host "Instalando $fileName..." -ForegroundColor Yellow
        Start-Process -FilePath $filePath -ArgumentList "/quiet", "/norestart" -Wait
        Write-Host "✅ Instalación completada: $arch" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Error instalando $arch : $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "=== Instalación completada ===" -ForegroundColor Cyan
Write-Host "Reinicia tu computadora si es necesario." -ForegroundColor Yellow

# Limpiar archivos temporales
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
