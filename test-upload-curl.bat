@echo off
echo ========================================
echo PROBANDO API DE UPLOAD-FILE CON CURL
echo ========================================

REM Crear archivo de prueba
echo.
echo Creando archivo de prueba...
echo Test image content for upload testing > test-image.jpg
echo Archivo de prueba creado: test-image.jpg

REM 1. Obtener token de autenticación
echo.
echo Obteniendo token de autenticacion...
curl -X POST http://localhost:3000/api/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\": \"testuser\", \"password\": \"password123\"}" ^
  -o login_response.json

echo.
echo Respuesta del login:
type login_response.json

REM Extraer token (esto es básico, en un script real usarías jq)
echo.
echo Token obtenido (ver archivo login_response.json)

REM 2. Probar upload con autenticación
echo.
echo Probando upload de archivo...
curl -X POST http://localhost:3000/api/upload-file ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInVzZXJuYW1lIjoidGVzdHVzZXIiLCJpYXQiOjE3MzQ5NzI4MDAsImV4cCI6MTczNDk3NjQwMH0.example" ^
  -F "tipo=foto" ^
  -F "file=@test-image.jpg" ^
  -o upload_response.json

echo.
echo Respuesta del upload:
type upload_response.json

REM 3. Probar sin autenticación (debe fallar)
echo.
echo Probando upload sin autenticacion (debe fallar)...
curl -X POST http://localhost:3000/api/upload-file ^
  -F "tipo=foto" ^
  -F "file=@test-image.jpg" ^
  -o upload_no_auth_response.json

echo.
echo Respuesta del upload sin auth:
type upload_no_auth_response.json

REM 4. Verificar archivos guardados
echo.
echo Verificando archivos guardados...
if exist "public\uploads" (
    echo Archivos encontrados en uploads:
    dir public\uploads
) else (
    echo Directorio uploads no encontrado
)

REM 5. Limpiar
echo.
echo Limpiando archivos de prueba...
del test-image.jpg
del login_response.json
del upload_response.json
del upload_no_auth_response.json

echo.
echo ========================================
echo PRUEBAS COMPLETADAS
echo ========================================
pause
