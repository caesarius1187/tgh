@echo off
echo ========================================
echo PROBANDO APIS TGH PULSERAS
echo ========================================

echo.
echo 1. Probando validacion de serial...
curl -X POST http://localhost:3000/api/validate-serial ^
  -H "Content-Type: application/json" ^
  -d "{\"serial\": \"TGH001\"}"

echo.
echo.
echo 2. Probando registro de usuario...
curl -X POST http://localhost:3000/api/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\": \"testuser123\", \"password\": \"Test123!@#\", \"serial\": \"TGH001\", \"confirmPassword\": \"Test123!@#\"}"

echo.
echo.
echo 3. Probando login...
curl -X POST http://localhost:3000/api/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\": \"testuser123\", \"password\": \"Test123!@#\"}"

echo.
echo.
echo 4. Probando datos publicos NFC...
curl http://localhost:3000/api/nfc-data/TGH001

echo.
echo.
echo 5. Probando pagina publica NFC...
curl http://localhost:3000/nfc/TGH001

echo.
echo ========================================
echo PRUEBAS COMPLETADAS
echo ========================================
pause
