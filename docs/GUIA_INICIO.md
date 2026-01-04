# 🚀 Guía de Inicio - TGH Pulseras

Esta guía te ayudará a configurar y ejecutar el proyecto desde cero.

## 📋 Requisitos Previos

- **Node.js** 18+ y npm
- **Docker Desktop** (para Supabase local)
- **Git** (opcional, si clonas el repo)

## 🛠️ Instalación Paso a Paso

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Supabase Local (Recomendado)

Si usas Supabase localmente, inicia los contenedores:

```bash
# Asegúrate de que Docker Desktop esté corriendo
npx supabase start
```

Esto iniciará:
- PostgreSQL en el puerto `54322`
- Supabase API en `http://127.0.0.1:54321`
- Storage y otros servicios

**Nota:** Si es la primera vez, puede tardar unos minutos descargando imágenes.

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Copia el archivo de ejemplo
cp .env.example .env.local
```

Luego edita `.env.local` con tus valores:

#### Para Desarrollo Local (Supabase CLI)

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

JWT_SECRET=tu_clave_super_secreta_local
JWT_EXPIRES_IN=7d

# Usa los valores que muestra 'supabase start'
POSTGRES_URL=postgresql://postgres:postgres@localhost:54322/postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=54322
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DATABASE=postgres
POSTGRES_SSL=false
POSTGRES_SSL_REJECT_UNAUTHORIZED=false

# Valores de Supabase local (los muestra 'supabase start')
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Copia el valor completo
SUPABASE_STORAGE_BUCKET=uploads
```

#### Para Producción (Supabase Cloud)

```env
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app

JWT_SECRET=clave_secreta_produccion_muy_segura
JWT_EXPIRES_IN=7d

# URL de conexión de Supabase Cloud
POSTGRES_URL=postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
POSTGRES_SSL=true
POSTGRES_SSL_REJECT_UNAUTHORIZED=false

SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_de_supabase_cloud
SUPABASE_STORAGE_BUCKET=uploads
```

### 4. Configurar la Base de Datos

Tienes dos opciones:

#### Opción A: Usar el Script Automático (Recomendado)

```bash
# Asegúrate de tener las variables de entorno cargadas
node Database/setup_database.js setup
```

Este script:
- Crea la base de datos (si no existe)
- Crea todas las tablas
- Te pregunta si quieres insertar datos de prueba

#### Opción B: Importar el Dump Completo

```bash
# Si usas Supabase local
psql "postgresql://postgres:postgres@localhost:54322/postgres" -f Database/exportacionlocalhost.sql

# Si usas Supabase Cloud (reemplaza con tu URL)
psql "tu_POSTGRES_URL" -f Database/exportacionlocalhost.sql
```

#### Opción C: Ejecutar Scripts Manualmente

```bash
# 1. Crear base de datos
psql "postgresql://postgres:postgres@localhost:54322/postgres" -f Database/01_create_database.sql

# 2. Crear tablas
psql "postgresql://postgres:postgres@localhost:54322/postgres" -f Database/02_create_tables.sql

# 3. Insertar datos de prueba (opcional)
psql "postgresql://postgres:postgres@localhost:54322/postgres" -f Database/03_insert_sample_data.sql
```

### 5. Verificar la Conexión

```bash
# Probar conexión a la base de datos
node Database/setup_database.js test
```

Deberías ver: `✅ Conexión a la base de datos exitosa`

### 6. Crear el Bucket de Storage (Supabase)

El código intentará crear el bucket automáticamente, pero puedes crearlo manualmente:

**Supabase Local:**
```bash
# El bucket se crea automáticamente en el primer upload
# O puedes usar la UI en http://127.0.0.1:54323
```

**Supabase Cloud:**
1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Storage → Create bucket
3. Nombre: `uploads`
4. Marca como público si quieres acceso directo a las URLs

### 7. Iniciar el Proyecto

```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:3000`

## ✅ Verificación

1. **Abrir la aplicación:** `http://localhost:3000`
2. **Probar login:** Si insertaste datos de prueba, usa las credenciales del script
3. **Verificar logs:** Revisa la consola para errores de conexión

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Construir para producción
npm run start            # Ejecutar en producción
npm run lint             # Verificar código con ESLint
npm run type-check       # Verificar tipos TypeScript

# Base de datos
node Database/setup_database.js setup    # Configurar BD completa
node Database/setup_database.js test     # Probar conexión
node Database/setup_database.js help     # Ver ayuda

# Supabase
supabase start           # Iniciar Supabase local
supabase stop            # Detener Supabase local
supabase status          # Ver estado de servicios
```

## 🚨 Solución de Problemas

### Error: "The server does not support SSL connections"
**Solución:** Asegúrate de tener `POSTGRES_SSL=false` en `.env.local` para desarrollo local.

### Error: "Cannot find module '@supabase/supabase-js'"
**Solución:** Ejecuta `npm install` nuevamente.

### Error: "ENOENT: no such file or directory" al subir archivos
**Solución:** Ya está resuelto usando Supabase Storage. Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté configurado.

### Error: "self-signed certificate in certificate chain" (Vercel)
**Solución:** En Vercel, configura:
- `POSTGRES_SSL=true`
- `POSTGRES_SSL_REJECT_UNAUTHORIZED=false`

### Docker no inicia Supabase
**Solución:**
1. Asegúrate de que Docker Desktop esté corriendo
2. Ejecuta Docker Desktop como administrador (Windows)
3. Intenta: `supabase stop` y luego `supabase start`

### No se puede conectar a la base de datos
**Solución:**
1. Verifica que Supabase esté corriendo: `supabase status`
2. Verifica las variables de entorno en `.env.local`
3. Prueba la conexión: `node Database/setup_database.js test`

## 📚 Recursos Adicionales

- **Documentación de Supabase:** https://supabase.com/docs
- **Documentación de Next.js:** https://nextjs.org/docs
- **Scripts de BD:** Ver `Database/README.md`

## 🎯 Próximos Pasos

1. ✅ Configurar variables de entorno
2. ✅ Iniciar Supabase local
3. ✅ Configurar base de datos
4. ✅ Iniciar el proyecto
5. 🚀 ¡Comienza a desarrollar!

---

**¿Necesitas ayuda?** Revisa los logs en la consola y los archivos de documentación en `Database/README.md`.

