# TGH Pulseras - Sistema de Gestión

Sistema de gestión de pulseras con chips NFC para emergencias médicas.

## 🚀 Tecnologías

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de datos**: PostgreSQL (Supabase)
- **Autenticación**: JWT
- **Validación**: Zod
- **Estilos**: Tailwind CSS + Lucide React

## 📁 Estructura del Proyecto

```
tgh/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes (backend)
│   │   ├── activacion/        # Página de activación
│   │   ├── registro/          # Página de registro
│   │   ├── dashboard/         # Dashboard personal
│   │   ├── nfc/[serial]/      # Vista pública NFC
│   │   └── login/             # Página de login
│   ├── components/            # Componentes React
│   ├── lib/                   # Utilidades y configuración BD
│   ├── types/                 # Tipos TypeScript
│   └── middleware/            # Middleware de autenticación
├── public/                    # Archivos estáticos
├── Database/                  # Scripts y documentación BD
├── docs/                      # Documentación del proyecto
└── package.json
```

## 🛠️ Instalación Rápida

### Paso 1: Instalar Dependencias
```bash
npm install
```

### Paso 2: Iniciar Supabase Local (Recomendado)
```bash
# Asegúrate de que Docker Desktop esté corriendo
supabase start
```

### Paso 3: Configurar Variables de Entorno
Crea un archivo `.env.local` en la raíz del proyecto con:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

JWT_SECRET=tu_clave_super_secreta
JWT_EXPIRES_IN=7d

# Valores que muestra 'supabase start'
POSTGRES_URL=postgresql://postgres:postgres@localhost:54322/postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=54322
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DATABASE=postgres
POSTGRES_SSL=false
POSTGRES_SSL_REJECT_UNAUTHORIZED=false

SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Copia el valor completo de 'supabase start'
SUPABASE_STORAGE_BUCKET=uploads
```

### Paso 4: Configurar Base de Datos
```bash
# Opción A: Script automático (recomendado)
node Database/setup_database.js setup

# Opción B: Importar dump completo
psql "postgresql://postgres:postgres@localhost:54322/postgres" -f Database/exportacionlocalhost.sql
```

### Paso 5: Iniciar el Proyecto
```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:3000`

> 📖 **Para una guía detallada paso a paso, consulta [GUIA_INICIO.md](./GUIA_INICIO.md)**

## 📋 Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Construir para producción
- `npm run start` - Ejecutar en producción
- `npm run lint` - Ejecutar ESLint
- `npm run type-check` - Verificar tipos TypeScript

## 🔧 Configuración

### Variables de Entorno

| Variable                        | Descripción                                            | Ejemplo local                         | Producción (Vercel / Hostinger / Supabase) |
|---------------------------------|--------------------------------------------------------|---------------------------------------|-------------------------------------------|
| `NEXT_PUBLIC_APP_URL`           | URL pública de la app                                  | `http://localhost:3000`               | `https://tu-dominio.vercel.app`           |
| `JWT_SECRET`                    | Clave usada para firmar JWT                            | `tu_clave_super_secreta`              | valor aleatorio seguro                    |
| `JWT_EXPIRES_IN`                | Tiempo de expiración del JWT                           | `7d`                                  | `7d` (o el valor que definas)             |
| `POSTGRES_HOST`                 | Host del servidor de base de datos                     | `localhost`                           | `db.tu_proveedor.com`                     |
| `POSTGRES_PORT`                 | Puerto de la base de datos                             | `5432`                                | `5432`                                    |
| `POSTGRES_USER`                 | Usuario de la base de datos                            | `postgres`                            | usuario configurado en producción         |
| `POSTGRES_PASSWORD`             | Contraseña de la base de datos                         | `tu_password`                         | contraseña del servicio                   |
| `POSTGRES_DATABASE`             | Nombre de la base de datos                             | `tgh_pulseras`                        | nombre de la base en producción           |
| `POSTGRES_URL` (opcional)       | Cadena de conexión completa (si tu proveedor la expone)| `postgres://...`                      | URL completa del servicio                 |
| `POSTGRES_SSL`                  | Forzar conexión con SSL (`true`/`false`)               | `false`                               | `true` o según proveedor                  |
| `POSTGRES_SSL_REJECT_UNAUTHORIZED` | Rechazar certificados autofirmados (`true`/`false`) | `false`                               | `false` si usas certificados self-signed  |
| `SUPABASE_URL`                  | Proyecto Supabase (REST/Storage)                       | `http://127.0.0.1:54321`              | `https://xxxx.supabase.co`                |
| `SUPABASE_SERVICE_ROLE_KEY`     | Clave service role para operaciones server-side        | `clave_local_service_role`            | clave service role de Supabase            |
| `SUPABASE_STORAGE_BUCKET`       | Bucket de Storage donde se suben archivos              | `uploads`                             | `uploads` (o el nombre que definas)       |

**Local:** crea/edita `.env.local` con los valores anteriores.  
**Producción (Vercel):** en *Project Settings → Environment Variables* añade las mismas variables pero usando las credenciales de Hostinger. Tras guardarlas vuelve a desplegar (`vercel --prod` o desde el dashboard).

> Nunca subas `.env.local` al repositorio. Si necesitas compartir los campos crea un archivo con placeholders (por ejemplo `env.example`) y distribúyelo sin credenciales reales.

### Base de Datos

Ver carpeta `Database/` para scripts de creación y documentación.

## 📱 Funcionalidades

- ✅ Activación de pulseras NFC
- ✅ Registro de usuarios
- ✅ Dashboard personal
- ✅ Gestión de datos médicos
- ✅ Contactos de emergencia
- ✅ Vista pública para NFC
- ✅ Sistema de autenticación
- ✅ Subida de archivos

## 🚀 Despliegue

1. Construir el proyecto: `npm run build`
2. Configurar variables de entorno de producción
3. Ejecutar: `npm run start`

## 📄 Licencia

Proyecto privado - TGH Pulseras
