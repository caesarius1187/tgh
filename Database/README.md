# Base de Datos TGH Pulseras

Este directorio contiene todos los archivos relacionados con la configuración y gestión de la base de datos MySQL para el sistema TGH Pulseras.

## 📁 Archivos

### Scripts SQL
- `01_create_database.sql` - Crear la base de datos
- `02_create_tables.sql` - Crear todas las tablas
- `03_insert_sample_data.sql` - Insertar datos de prueba

### Configuración
- `database.env` - Variables de entorno para la base de datos
- `setup_database.js` - Script de utilidad para configurar la BD
- `README.md` - Este archivo de documentación

### Documentación
- `DER.txt` - Diseño Entidad-Relación completo

## 🚀 Configuración Rápida

### 1. Configurar variables de entorno
```bash
# Copiar archivo de configuración
cp Database/database.env .env.local

# Editar con tus credenciales de MySQL
# DB_PASSWORD=tu_password_aqui
```

### 2. Ejecutar configuración automática
```bash
# Configurar base de datos completa
node Database/setup_database.js

# O solo probar conexión
node Database/setup_database.js test
```

### 3. Configuración manual (alternativa)
```bash
# Conectar a MySQL
mysql -u root -p

# Ejecutar scripts en orden
source Database/01_create_database.sql;
source Database/02_create_tables.sql;
source Database/03_insert_sample_data.sql;
```

## 📊 Estructura de la Base de Datos

### Tablas principales:
1. **pulseras** - Información de pulseras NFC
2. **usuarios** - Datos de usuarios registrados
3. **datos_personales** - Información personal
4. **datos_vitales** - Información médica
5. **contactos_emergencia** - Contactos de emergencia
6. **auditoria_logs** - Logs del sistema
7. **sesiones_usuarios** - Gestión de sesiones

### Relaciones:
- 1 Usuario ↔ 1 Pulsera (opcional)
- 1 Usuario ↔ 1 Datos Personales
- 1 Usuario ↔ 1 Datos Vitales
- 1 Usuario ↔ N Contactos de Emergencia
- 1 Usuario ↔ N Sesiones
- 1 Usuario ↔ N Logs de Auditoría

## 🔧 Scripts de Utilidad

### setup_database.js
Script principal para configurar la base de datos:

```bash
# Configuración completa
node Database/setup_database.js setup

# Probar conexión
node Database/setup_database.js test

# Mostrar ayuda
node Database/setup_database.js help
```

## 📝 Datos de Prueba

El script `03_insert_sample_data.sql` incluye:

- **5 pulseras** con seriales TGH001-TGH005
- **2 usuarios** (admin, testuser) con contraseña 'password123'
- **Datos personales** completos para ambos usuarios
- **Datos vitales** con información médica de ejemplo
- **Contactos de emergencia** para cada usuario
- **Logs de auditoría** de ejemplo

### Credenciales de prueba:
- **Usuario:** admin / **Contraseña:** password123
- **Usuario:** testuser / **Contraseña:** password123

## 🛠️ Comandos Útiles

### Verificar estructura:
```sql
USE tgh_pulseras;
SHOW TABLES;
DESCRIBE pulseras;
```

### Limpiar datos de prueba:
```sql
USE tgh_pulseras;
DELETE FROM auditoria_logs;
DELETE FROM sesiones_usuarios;
DELETE FROM contactos_emergencia;
DELETE FROM datos_vitales;
DELETE FROM datos_personales;
DELETE FROM usuarios;
DELETE FROM pulseras;
```

### Backup de la base de datos:
```bash
mysqldump -u root -p tgh_pulseras > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar backup:
```bash
mysql -u root -p tgh_pulseras < backup_20231201_120000.sql
```

## 🔒 Seguridad

- Las contraseñas se almacenan hasheadas con bcrypt
- Se registran todos los eventos importantes
- Validaciones a nivel de base de datos
- Índices optimizados para consultas frecuentes

## 📈 Performance

- Pool de conexiones configurado
- Índices en campos críticos
- Charset utf8mb4 para compatibilidad completa
- Engine InnoDB para transacciones

## 🚨 Troubleshooting

### Error de conexión:
- Verificar que MySQL esté ejecutándose
- Confirmar credenciales en `.env.local`
- Verificar puerto (por defecto 3306)

### Error de permisos:
- Usuario debe tener permisos para crear bases de datos
- Ejecutar como administrador si es necesario

### Error de charset:
- Verificar que MySQL soporte utf8mb4
- Actualizar versión de MySQL si es necesario
