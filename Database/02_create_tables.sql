-- Script para crear todas las tablas de la base de datos TGH Pulseras
-- Ejecutar después de crear la base de datos

USE tgh_pulseras;

-- =================================================================================
-- TABLA 1: pulseras
-- =================================================================================
CREATE TABLE IF NOT EXISTS pulseras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    serial VARCHAR(50) UNIQUE NOT NULL COMMENT 'Número de serie único del chip NFC',
    is_active BOOLEAN DEFAULT FALSE NOT NULL COMMENT 'Indica si la pulsera está activada',
    public_url VARCHAR(255) UNIQUE NULL COMMENT 'URL pública generada automáticamente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_serial (serial),
    INDEX idx_is_active (is_active),
    INDEX idx_public_url (public_url)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Información de las pulseras NFC';

-- =================================================================================
-- TABLA 2: usuarios
-- =================================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT 'Nombre de usuario para login',
    password_hash VARCHAR(255) NOT NULL COMMENT 'Hash de la contraseña usando bcrypt',
    pulsera_id INT UNIQUE NULL COMMENT 'ID de la pulsera asociada al usuario',
    is_active BOOLEAN DEFAULT TRUE NOT NULL COMMENT 'Indica si el usuario está activo',
    last_login TIMESTAMP NULL COMMENT 'Fecha y hora del último login',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE INDEX idx_username (username),
    UNIQUE INDEX idx_pulsera_id (pulsera_id),
    INDEX idx_is_active (is_active),
    INDEX idx_last_login (last_login),
    
    FOREIGN KEY (pulsera_id) REFERENCES pulseras(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Información de usuarios registrados';

-- =================================================================================
-- TABLA 3: datos_personales
-- =================================================================================
CREATE TABLE IF NOT EXISTS datos_personales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL COMMENT 'ID del usuario propietario de los datos',
    nombre VARCHAR(100) NOT NULL COMMENT 'Nombre del usuario',
    apellido VARCHAR(100) NOT NULL COMMENT 'Apellido del usuario',
    fecha_nacimiento DATE NOT NULL COMMENT 'Fecha de nacimiento del usuario',
    foto_url VARCHAR(500) NULL COMMENT 'URL o ruta del archivo de foto carnet',
    telefono VARCHAR(20) NULL COMMENT 'Teléfono personal del usuario',
    email VARCHAR(100) NULL COMMENT 'Email del usuario',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE INDEX idx_usuario_id (usuario_id),
    INDEX idx_nombre_apellido (nombre, apellido),
    INDEX idx_email (email),
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Datos personales de los usuarios';

-- =================================================================================
-- TABLA 4: datos_vitales
-- =================================================================================
CREATE TABLE IF NOT EXISTS datos_vitales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL COMMENT 'ID del usuario propietario de los datos',
    alergias TEXT NULL COMMENT 'Lista de alergias conocidas del usuario',
    medicacion TEXT NULL COMMENT 'Medicamentos que toma regularmente el usuario',
    enfermedades_cronicas TEXT NULL COMMENT 'Enfermedades crónicas o condiciones médicas',
    grupo_sanguineo VARCHAR(10) NULL COMMENT 'Grupo sanguíneo del usuario',
    grupo_sanguineo_url VARCHAR(500) NULL COMMENT 'URL o ruta del certificado de grupo sanguíneo',
    peso DECIMAL(5,2) NULL COMMENT 'Peso en kilogramos',
    altura DECIMAL(5,2) NULL COMMENT 'Altura en centímetros',
    observaciones_medicas TEXT NULL COMMENT 'Observaciones médicas adicionales',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE INDEX idx_usuario_id (usuario_id),
    INDEX idx_grupo_sanguineo (grupo_sanguineo),
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Información médica vital del usuario';

-- =================================================================================
-- TABLA 5: contactos_emergencia
-- =================================================================================
CREATE TABLE IF NOT EXISTS contactos_emergencia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL COMMENT 'ID del usuario propietario del contacto',
    nombre VARCHAR(100) NOT NULL COMMENT 'Nombre del contacto de emergencia',
    telefono VARCHAR(20) NOT NULL COMMENT 'Número de teléfono del contacto',
    relacion VARCHAR(50) NULL COMMENT 'Relación con el usuario',
    es_principal BOOLEAN DEFAULT FALSE COMMENT 'Indica si es el contacto principal',
    orden INT DEFAULT 0 COMMENT 'Orden de prioridad del contacto',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Indica si el contacto está activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_usuario_principal (usuario_id, es_principal),
    INDEX idx_usuario_orden (usuario_id, orden),
    INDEX idx_is_active (is_active),
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Contactos de emergencia del usuario';

-- =================================================================================
-- TABLA 6: auditoria_logs
-- =================================================================================
CREATE TABLE IF NOT EXISTS auditoria_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL COMMENT 'ID del usuario relacionado con el evento',
    evento VARCHAR(100) NOT NULL COMMENT 'Tipo de evento registrado',
    descripcion TEXT NULL COMMENT 'Descripción detallada del evento',
    ip_address VARCHAR(45) NULL COMMENT 'Dirección IP desde donde se realizó la acción',
    user_agent TEXT NULL COMMENT 'User agent del navegador/cliente',
    datos_adicionales JSON NULL COMMENT 'Datos adicionales del evento en formato JSON',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_evento (evento),
    INDEX idx_created_at (created_at),
    INDEX idx_ip_address (ip_address),
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registro de eventos del sistema para auditoría';

-- =================================================================================
-- TABLA 7: sesiones_usuarios
-- =================================================================================
CREATE TABLE IF NOT EXISTS sesiones_usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL COMMENT 'ID del usuario de la sesión',
    token_hash VARCHAR(255) NOT NULL COMMENT 'Hash del JWT token para la sesión',
    expires_at TIMESTAMP NOT NULL COMMENT 'Fecha y hora de expiración de la sesión',
    ip_address VARCHAR(45) NULL COMMENT 'Dirección IP desde donde se inició la sesión',
    user_agent TEXT NULL COMMENT 'User agent del navegador/cliente',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Indica si la sesión está activa',
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de última actividad',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_active (is_active),
    INDEX idx_last_activity (last_activity),
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Gestión de sesiones activas de usuarios';

-- =================================================================================
-- VERIFICACIÓN DE TABLAS CREADAS
-- =================================================================================
SELECT 'Todas las tablas han sido creadas exitosamente' AS mensaje;

-- Mostrar información de las tablas creadas
SHOW TABLES;

-- Mostrar estructura de cada tabla
DESCRIBE pulseras;
DESCRIBE usuarios;
DESCRIBE datos_personales;
DESCRIBE datos_vitales;
DESCRIBE contactos_emergencia;
DESCRIBE auditoria_logs;
DESCRIBE sesiones_usuarios;
