# 🧪 Guía de Pruebas - APIs TGH Pulseras

Esta guía te ayudará a probar todas las APIs que hemos desarrollado.

## 📋 Prerrequisitos

### 1. Configurar Variables de Entorno
```bash
# Copiar configuración de entorno
copy env-setup.txt .env.local

# Editar .env.local con tus credenciales de PostgreSQL/Supabase
# Especialmente: POSTGRES_PASSWORD=tu_password_aqui
```

### 2. Configurar Base de Datos
```bash
# Opción A: Usar Supabase CLI
supabase start

# Opción B: Configuración manual (PostgreSQL)
psql "$POSTGRES_URL_NON_POOLING" -f Database/exportacionlocalhost.sql
```

### 3. Iniciar Servidor de Desarrollo
```bash
npm run dev
```

## 🚀 Pruebas de APIs

### Opción 1: Script Automático (Node.js)
```bash
node test-apis.js
```

### Opción 2: Script Simple (Windows)
```bash
test-apis-simple.bat
```

### Opción 3: Pruebas Manuales con curl

#### 1. Validar Serial
```bash
curl -X POST http://localhost:3000/api/validate-serial \
  -H "Content-Type: application/json" \
  -d '{"serial": "TGH001"}'
```

**Respuesta esperada:**
```json
{
  "valid": true,
  "message": "Serial válido y disponible para activación",
  "serial": "TGH001"
}
```

#### 2. Registro de Usuario
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "password": "Test123!@#",
    "serial": "TGH001",
    "confirmPassword": "Test123!@#"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "testuser123"
  }
}
```

#### 3. Login
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "password": "Test123!@#"
  }'
```

#### 4. Obtener Datos de Usuario
```bash
curl -X GET http://localhost:3000/api/user-data \
  -H "Authorization: Bearer TU_JWT_TOKEN_AQUI"
```

#### 5. Datos Públicos NFC
```bash
curl http://localhost:3000/api/nfc-data/TGH001
```

#### 6. Página Pública NFC
```bash
curl http://localhost:3000/nfc/TGH001
```

## 🎯 Casos de Prueba Específicos

### Validación de Serial
- ✅ Serial válido: `TGH001`
- ❌ Serial inválido: `INVALID123`
- ❌ Serial ya activado: `TGH002` (después de registrarlo)

### Registro de Usuario
- ✅ Datos válidos
- ❌ Username existente
- ❌ Contraseña débil
- ❌ Serial ya usado

### Login
- ✅ Credenciales correctas
- ❌ Credenciales incorrectas
- ❌ Usuario inactivo
- ❌ Demasiados intentos (rate limiting)

### Autenticación
- ✅ Token válido
- ❌ Token expirado
- ❌ Token inválido
- ❌ Sin token

## 🔍 Verificación de Funcionalidades

### 1. Rate Limiting
- Hacer múltiples requests rápidos
- Verificar que se bloquea después del límite

### 2. Validación de Datos
- Enviar datos inválidos
- Verificar mensajes de error apropiados

### 3. Logging y Auditoría
- Revisar logs en la base de datos
- Verificar que se registran todos los eventos

### 4. Seguridad
- Verificar headers de seguridad
- Probar CORS
- Validar sanitización de datos

## 🐛 Troubleshooting

### Error de Conexión a Base de Datos
```
❌ Error de conexión: ECONNREFUSED
```
**Solución:**
1. Verificar que MySQL esté ejecutándose
2. Confirmar credenciales en `.env.local`
3. Verificar puerto (3306)

### Error 500 - Error Interno del Servidor
```
❌ Error interno del servidor
```
**Solución:**
1. Revisar logs del servidor
2. Verificar configuración de base de datos
3. Confirmar que las tablas existen

### Error 401 - No Autorizado
```
❌ Token de autenticación requerido
```
**Solución:**
1. Verificar que el token JWT sea válido
2. Confirmar formato: `Bearer <token>`
3. Verificar que el token no haya expirado

### Error 404 - No Encontrado
```
❌ Serial no encontrado
```
**Solución:**
1. Verificar que el serial existe en la base de datos
2. Confirmar que la pulsera está activada
3. Revisar datos de prueba

## 📊 Datos de Prueba Incluidos

El script `03_insert_sample_data.sql` incluye:

- **5 pulseras** con seriales TGH001-TGH005
- **2 usuarios** (admin, testuser)
- **Datos personales** completos
- **Datos vitales** de ejemplo
- **Contactos de emergencia**
- **Logs de auditoría**

### Credenciales de Prueba:
- **Usuario:** admin / **Contraseña:** password123
- **Usuario:** testuser / **Contraseña:** password123

## 🎉 Pruebas Exitosas

Si todo funciona correctamente, deberías ver:

1. ✅ Validación de serial exitosa
2. ✅ Registro de usuario exitoso
3. ✅ Login exitoso con token JWT
4. ✅ Obtención de datos de usuario
5. ✅ Datos públicos NFC accesibles
6. ✅ Página pública NFC renderizada
7. ✅ Logs de auditoría en la base de datos

## 📝 Notas Importantes

- Las APIs están protegidas con CORS
- Todos los endpoints requieren Content-Type: application/json
- Los endpoints autenticados requieren Bearer token
- Los archivos se suben a `./public/uploads/`
- Los logs se guardan en la tabla `auditoria_logs`
