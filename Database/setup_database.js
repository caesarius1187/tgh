#!/usr/bin/env node

/**
 * Script de utilidad para configurar la base de datos TGH Pulseras
 * Ejecutar con: node Database/setup_database.js
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
};

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🚀 Iniciando configuración de la base de datos...');
    
    // Conectar sin especificar base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a MySQL');
    
    // Leer y ejecutar script de creación de base de datos
    console.log('📁 Creando base de datos...');
    const createDbScript = fs.readFileSync(
      path.join(__dirname, '01_create_database.sql'), 
      'utf8'
    );
    await connection.execute(createDbScript);
    console.log('✅ Base de datos creada');
    
    // Leer y ejecutar script de creación de tablas
    console.log('📋 Creando tablas...');
    const createTablesScript = fs.readFileSync(
      path.join(__dirname, '02_create_tables.sql'), 
      'utf8'
    );
    await connection.execute(createTablesScript);
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
      await connection.execute(sampleDataScript);
      console.log('✅ Datos de prueba insertados');
    }
    
    console.log('🎉 Configuración de base de datos completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Función para verificar la conexión
async function testConnection() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      ...dbConfig,
      database: process.env.DB_NAME || 'tgh_pulseras'
    });
    
    await connection.execute('SELECT 1');
    console.log('✅ Conexión a la base de datos exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
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
  DB_HOST     Host de MySQL (por defecto: localhost)
  DB_PORT     Puerto de MySQL (por defecto: 3306)
  DB_USER     Usuario de MySQL (por defecto: root)
  DB_PASSWORD Contraseña de MySQL
  DB_NAME     Nombre de la base de datos (por defecto: tgh_pulseras)

Ejemplo:
  DB_PASSWORD=mi_password node Database/setup_database.js
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
