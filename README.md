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
   ```bash
   cp env.config.txt .env.local
   # Editar .env.local con tus configuraciones
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

Ver archivo `env.config.txt` para todas las variables necesarias.

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
