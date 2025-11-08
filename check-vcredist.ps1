# Script para verificar qué Visual C++ Redistributables están instalados
# Ejecutar: powershell -ExecutionPolicy Bypass -File check-vcredist.ps1

Write-Host "=== Verificando Visual C++ Redistributables Instalados ===" -ForegroundColor Cyan

# Lista de versiones comunes
$vcredistVersions = @(
    "2015-2022",
    "2015-2019", 
    "2013",
    "2012",
    "2010",
    "2008"
)

foreach ($version in $vcredistVersions) {
    Write-Host "`nVerificando Visual C++ $version Redistributable:" -ForegroundColor Yellow
    
    # Verificar x64
    $x64Installed = Get-WmiObject -Class Win32_Product | Where-Object { 
        $_.Name -like "*Visual C++*$version*Redistributable*" -and $_.Name -like "*x64*" 
    }
    
    # Verificar x86
    $x86Installed = Get-WmiObject -Class Win32_Product | Where-Object { 
        $_.Name -like "*Visual C++*$version*Redistributable*" -and $_.Name -like "*x86*" 
    }
    
    if ($x64Installed) {
        Write-Host "  ✅ x64: $($x64Installed.Name)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ x64: No instalado" -ForegroundColor Red
    }
    
    if ($x86Installed) {
        Write-Host "  ✅ x86: $($x86Installed.Name)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ x86: No instalado" -ForegroundColor Red
    }
}

# Verificar también en el registro
Write-Host "`n=== Verificando en el Registro ===" -ForegroundColor Cyan

$regPaths = @(
    "HKLM:\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes",
    "HKLM:\SOFTWARE\WOW6432Node\Microsoft\VisualStudio\14.0\VC\Runtimes",
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
    "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"
)

foreach ($regPath in $regPaths) {
    if (Test-Path $regPath) {
        $installed = Get-ChildItem $regPath | Where-Object { 
            $_.GetValue("DisplayName") -like "*Visual C++*Redistributable*" 
        }
        
        if ($installed) {
            Write-Host "Encontrado en registro:" -ForegroundColor Yellow
            foreach ($item in $installed) {
                Write-Host "  - $($item.GetValue('DisplayName'))" -ForegroundColor Green
            }
        }
    }
}

Write-Host "`n=== Recomendación ===" -ForegroundColor Cyan
Write-Host "Para WAMP, necesitas al menos:" -ForegroundColor Yellow
Write-Host "- Microsoft Visual C++ 2015-2022 Redistributable (x64)" -ForegroundColor White
Write-Host "- Microsoft Visual C++ 2015-2022 Redistributable (x86)" -ForegroundColor White
Write-Host "`nDescarga desde: https://aka.ms/vs/17/release/vc_redist.x64.exe" -ForegroundColor Blue
Write-Host "Descarga desde: https://aka.ms/vs/17/release/vc_redist.x86.exe" -ForegroundColor Blue
