# Base de Datos TGH Pulseras (PostgreSQL / Supabase)

Este directorio contiene todos los archivos relacionados con la configuración y gestión de la base de datos PostgreSQL utilizada por el sistema TGH Pulseras. Puedes trabajar conectando contra Supabase Cloud o usando el stack local que levanta el Supabase CLI (Docker).

## 📁 Archivos

### Scripts SQL
- `01_create_database.sql` – Creación inicial de la base de datos
- `02_create_tables.sql` – Definición de tablas y relaciones
- `03_insert_sample_data.sql` – Datos de ejemplo
- `exportacionlocalhost.sql` – Dump completo listo para cargar en PostgreSQL

### Configuración
- `database.env` – Plantilla de variables de entorno
- `setup_database.js` – Script de utilidad (ahora usa PostgreSQL)
- `README.md` – Este documento

### Documentación
- `DER.txt` – Modelo entidad–relación

## 🚀 Configuración rápida

### 1. Variables de entorno
```bash
cp Database/database.env .env.local
# Edita .env.local con tus credenciales de PostgreSQL/Supabase
# Ejemplo local (Supabase CLI):
# POSTGRES_URL=postgresql://postgres:postgres@localhost:54322/postgres
# SUPABASE_URL=http://127.0.0.1:54321
```

### 2. Preparar la base de datos
```bash
# Opción recomendada: Supabase CLI
supabase start

# Opción manual: importar dump
psql "$POSTGRES_URL_NON_POOLING" -f Database/exportacionlocalhost.sql
```

### 3. Ejecutar script de utilidad (opcional)
```bash
# Configurar o probar la base de datos con Node.js
node Database/setup_database.js setup   # aplica scripts SQL
node Database/setup_database.js test    # prueba la conexión
```

## 📊 Estructura principal

Tablas clave:
1. **pulseras** – Chips NFC
2. **usuarios** – Credenciales y estado
3. **datos_personales** – Información personal
4. **datos_vitales** – Información médica
5. **contactos_emergencia** – Contactos asociados
6. **auditoria_logs** – Eventos de auditoría
7. **sesiones_usuarios** – Tokens/ sesiones activas

Relaciones destacadas:
- Usuario ↔ Pulsera (1:1 opcional)
- Usuario ↔ Datos personales (1:1)
- Usuario ↔ Datos vitales (1:1)
- Usuario ↔ Contactos de emergencia (1:N)
- Usuario ↔ Sesiones / Logs (1:N)

## 🛠️ Comandos útiles

### Consultar estructura con psql
```bash
psql "$POSTGRES_URL_NON_POOLING"
\dt
\d usuarios
```

### Limpiar datos de prueba
```sql
TRUNCATE auditoria_logs,
         sesiones_usuarios,
         contactos_emergencia,
         datos_vitales,
         datos_personales,
         usuarios,
         pulseras
RESTART IDENTITY CASCADE;
```

### Backup / restore
```bash
# Backup
pg_dump "$POSTGRES_URL_NON_POOLING" > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
psql "$POSTGRES_URL_NON_POOLING" -f backup_20231201_120000.sql
```

## 🔒 Seguridad y buenas prácticas

- Usa variables de entorno distintas para local y producción.
- Al desplegar en producción habilita SSL (`POSTGRES_SSL=true`).
- No compartas claves `SUPABASE_SERVICE_ROLE_KEY` o `SUPABASE_JWT_SECRET`.
- Revisa los logs en `auditoria_logs` para auditorías de acceso.

## 🚨 Problemas comunes

| Problema | Solución |
|----------|----------|
| `The server does not support SSL connections` | Establece `POSTGRES_SSL=false` (entornos locales). |
| No conecta a Supabase Cloud | Verifica `POSTGRES_URL` / `POSTGRES_PASSWORD` y que `sslmode=require` esté presente. |
| Contenedores locales no inician | Asegúrate de que Docker Desktop esté activo y vuelve a ejecutar `supabase start`. |
| Falta de datos | Importa `Database/exportacionlocalhost.sql` o ejecuta `03_insert_sample_data.sql`. |

---

Mantén este directorio sincronizado con los scripts que realmente uses (Supabase CLI + dump SQL). Cualquier contribución o cambio de esquema debería reflejarse aquí para que el resto del equipo pueda reproducir el entorno fácilmente.
