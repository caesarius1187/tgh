ABRIR DOCKER Desktop

#1. Iniciar Supabase local
npx supabase start

Asegúrate de que Docker Desktop esté corriendo antes de ejecutar este comando.
Esto iniciará:
PostgreSQL en el puerto 54322
Supabase API en http://127.0.0.1:54321
Storage y otros servicios
Nota: Si es la primera vez, puede tardar unos minutos descargando las imágenes de Docker.

#2. Iniciar el proyecto Next.js

npm run dev

La aplicación estará disponible en: http://localhost:3000
Comandos útiles adicionales
# Ver estado de Supabase
supabase status
# Detener Supabase
supabase stop
# Verificar conexión a la base de datos
node Database/setup_database.js test
# Configurar base de datos (si es la primera vez)
node Database/setup_database.js setup

Orden recomendado

Asegúrate de que Docker Desktop esté corriendo

supabase start - Inicia Supabase local
Verifica que .env.local esté configurado correctamente
npm run dev - Inicia el proyecto Next.js

