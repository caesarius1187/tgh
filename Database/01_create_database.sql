-- Script para crear la base de datos TGH Pulseras
-- Ejecutar como usuario con permisos de administrador

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS tgh_pulseras 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE tgh_pulseras;

-- Mostrar mensaje de confirmación
SELECT 'Base de datos tgh_pulseras creada exitosamente' AS mensaje;
