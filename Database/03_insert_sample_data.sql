-- Script para insertar datos de prueba en la base de datos TGH Pulseras
-- Ejecutar después de crear las tablas

USE tgh_pulseras;

-- =================================================================================
-- DATOS DE PRUEBA: PULSERAS
-- =================================================================================
INSERT INTO pulseras (serial, is_active, public_url) VALUES
('TGH001', FALSE, NULL),
('TGH002', FALSE, NULL),
('TGH003', FALSE, NULL),
('TGH004', FALSE, NULL),
('TGH005', FALSE, NULL);

-- =================================================================================
-- DATOS DE PRUEBA: USUARIOS
-- =================================================================================
-- Nota: Las contraseñas están hasheadas con bcrypt para 'password123'
INSERT INTO usuarios (username, password_hash, pulsera_id, is_active) VALUES
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, TRUE),
('testuser', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, TRUE);

-- =================================================================================
-- DATOS DE PRUEBA: DATOS PERSONALES
-- =================================================================================
INSERT INTO datos_personales (usuario_id, nombre, apellido, fecha_nacimiento, telefono, email) VALUES
(1, 'Administrador', 'Sistema', '1990-01-01', '+1234567890', 'admin@tgh.com'),
(2, 'Usuario', 'Prueba', '1985-05-15', '+0987654321', 'test@tgh.com');

-- =================================================================================
-- DATOS DE PRUEBA: DATOS VITALES
-- =================================================================================
INSERT INTO datos_vitales (usuario_id, alergias, medicacion, enfermedades_cronicas, grupo_sanguineo, peso, altura) VALUES
(1, 'Ninguna', 'Ninguna', 'Ninguna', 'O+', 70.5, 175.0),
(2, 'Penicilina', 'Ninguna', 'Diabetes tipo 2', 'A+', 80.2, 180.0);

-- =================================================================================
-- DATOS DE PRUEBA: CONTACTOS DE EMERGENCIA
-- =================================================================================
INSERT INTO contactos_emergencia (usuario_id, nombre, telefono, relacion, es_principal, orden, is_active) VALUES
(1, 'Contacto Emergencia Admin', '+1111111111', 'Familiar', TRUE, 1, TRUE),
(2, 'Mamá', '+2222222222', 'Madre', TRUE, 1, TRUE),
(2, 'Papá', '+3333333333', 'Padre', FALSE, 2, TRUE),
(2, 'Hermano', '+4444444444', 'Hermano', FALSE, 3, TRUE);

-- =================================================================================
-- DATOS DE PRUEBA: LOGS DE AUDITORÍA
-- =================================================================================
INSERT INTO auditoria_logs (usuario_id, evento, descripcion, ip_address, user_agent) VALUES
(1, 'registro_usuario', 'Usuario administrador creado', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
(2, 'registro_usuario', 'Usuario de prueba creado', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
(1, 'login', 'Inicio de sesión exitoso', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');

-- =================================================================================
-- VERIFICACIÓN DE DATOS INSERTADOS
-- =================================================================================
SELECT 'Datos de prueba insertados exitosamente' AS mensaje;

-- Mostrar conteos de registros
SELECT 
    'pulseras' AS tabla, COUNT(*) AS registros FROM pulseras
UNION ALL
SELECT 
    'usuarios' AS tabla, COUNT(*) AS registros FROM usuarios
UNION ALL
SELECT 
    'datos_personales' AS tabla, COUNT(*) AS registros FROM datos_personales
UNION ALL
SELECT 
    'datos_vitales' AS tabla, COUNT(*) AS registros FROM datos_vitales
UNION ALL
SELECT 
    'contactos_emergencia' AS tabla, COUNT(*) AS registros FROM contactos_emergencia
UNION ALL
SELECT 
    'auditoria_logs' AS tabla, COUNT(*) AS registros FROM auditoria_logs;

-- Mostrar datos de prueba
SELECT '=== PULSERAS ===' AS info;
SELECT * FROM pulseras;

SELECT '=== USUARIOS ===' AS info;
SELECT id, username, pulsera_id, is_active, created_at FROM usuarios;

SELECT '=== DATOS PERSONALES ===' AS info;
SELECT dp.id, dp.nombre, dp.apellido, dp.fecha_nacimiento, u.username 
FROM datos_personales dp 
JOIN usuarios u ON dp.usuario_id = u.id;

SELECT '=== CONTACTOS EMERGENCIA ===' AS info;
SELECT ce.id, ce.nombre, ce.telefono, ce.relacion, ce.es_principal, u.username 
FROM contactos_emergencia ce 
JOIN usuarios u ON ce.usuario_id = u.id 
ORDER BY u.id, ce.orden;
