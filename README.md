# TGH Pulseras - Sistema de Gestión

Sistema de gestión de pulseras con chips NFC para emergencias médicas.

## 🚀 Tecnologías

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de datos**: MySQL
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

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone [url-del-repo]
   cd tgh
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   Crea un archivo `.env.local` en la raíz del proyecto (está incluido en `.gitignore`) con las credenciales de tu entorno local. Ejemplo:
   ```bash
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   JWT_SECRET=tu_clave_super_secreta
   JWT_EXPIRES_IN=7d

   POSTGRES_HOST=localhost
   POSTGRES_PORT=3306
   POSTGRES_USER=root
  POSTGRES_PASSWORD=tu_password
   POSTGRES_DATABASE=tgh_pulseras
   ```

4. **Configurar base de datos**
   - Crear base de datos MySQL: `tgh_pulseras`
   - Ejecutar scripts de la carpeta `Database/`

5. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

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
| `POSTGRES_PORT`                 | Puerto de la base de datos                             | `3306` (o `5432` si es PostgreSQL)    | `3306`/`5432` según tu servicio           |
| `POSTGRES_USER`                 | Usuario de la base de datos                            | `root`                                | usuario configurado en producción         |
| `POSTGRES_PASSWORD`             | Contraseña de la base de datos                         | `tu_password`                         | contraseña del servicio                   |
| `POSTGRES_DATABASE`             | Nombre de la base de datos                             | `tgh_pulseras`                        | nombre de la base en producción           |
| `POSTGRES_URL` (opcional)       | Cadena de conexión completa (si tu proveedor la expone)| `postgres://...` o `mysql://...`      | URL completa del servicio                 |
| `POSTGRES_URL_NON_POOLING` etc. | Variantes opcionales para poolers / Prisma / Supabase  | —                                     | URL que provea tu proveedor               |

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
