#!/usr/bin/env node

/**
 * Script de utilidad para configurar la base de datos TGH Pulseras
 * Ejecutar con: node Database/setup_database.js
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Configuración de la base de datos
const toBool = (value) =>
  typeof value === 'string' && ['true', '1', 'yes', 'y'].includes(value.toLowerCase());

const baseConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || ''
};

if (process.env.POSTGRES_SSL) {
  baseConfig.ssl = {
    rejectUnauthorized: toBool(process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED) ?? false
  };
}

const targetDatabase = process.env.POSTGRES_DATABASE || 'postgres';

async function setupDatabase() {
  let client;
  
  try {
    console.log('🚀 Iniciando configuración de la base de datos...');
    
    // Conectar a la base de datos destino
    client = new Client({
      ...baseConfig,
      database: targetDatabase
    });
    await client.connect();
    console.log('✅ Conectado a PostgreSQL');
    
    // Leer y ejecutar script de creación de base de datos
    console.log('📁 Creando base de datos...');
    const createDbScript = fs.readFileSync(
      path.join(__dirname, '01_create_database.sql'), 
      'utf8'
    );
    await client.query(createDbScript);
    console.log('✅ Base de datos creada');
    
    // Leer y ejecutar script de creación de tablas
    console.log('📋 Creando tablas...');
    const createTablesScript = fs.readFileSync(
      path.join(__dirname, '02_create_tables.sql'), 
      'utf8'
    );
    await client.query(createTablesScript);
    console.log('✅ Tablas creadas');
    
    // Preguntar si insertar datos de prueba
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve) => {
      rl.question('¿Insertar datos de prueba? (y/N): ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      console.log('📊 Insertando datos de prueba...');
      const sampleDataScript = fs.readFileSync(
        path.join(__dirname, '03_insert_sample_data.sql'), 
        'utf8'
      );
      await client.query(sampleDataScript);
      console.log('✅ Datos de prueba insertados');
    }
    
    console.log('🎉 Configuración de base de datos completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Función para verificar la conexión
async function testConnection() {
  let client;
  
  try {
    client = new Client({
      ...baseConfig,
      database: targetDatabase
    });
    await client.connect();
    
    await client.query('SELECT 1');
    console.log('✅ Conexión a la base de datos exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return false;
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Función para mostrar ayuda
function showHelp() {
  console.log(`
🔧 Script de configuración de base de datos TGH Pulseras

Uso:
  node Database/setup_database.js [comando]

Comandos:
  setup     Configurar la base de datos completa (por defecto)
  test      Probar la conexión a la base de datos
  help      Mostrar esta ayuda

Variables de entorno:
  POSTGRES_HOST     Host de PostgreSQL (por defecto: localhost)
  POSTGRES_PORT     Puerto de PostgreSQL (por defecto: 5432)
  POSTGRES_USER     Usuario de PostgreSQL (por defecto: postgres)
  POSTGRES_PASSWORD Contraseña de PostgreSQL
  POSTGRES_DATABASE Nombre de la base de datos (por defecto: postgres)
  POSTGRES_SSL      true/false si se requiere SSL
  POSTGRES_SSL_REJECT_UNAUTHORIZED  true/false para validar certificados

Ejemplo:
  POSTGRES_PASSWORD=mi_password node Database/setup_database.js
`);
}

// Función principal
async function main() {
  const command = process.argv[2] || 'setup';
  
  switch (command) {
    case 'setup':
      await setupDatabase();
      break;
    case 'test':
      await testConnection();
      break;
    case 'help':
      showHelp();
      break;
    default:
      console.log(`❌ Comando desconocido: ${command}`);
      showHelp();
      process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { setupDatabase, testConnection };
