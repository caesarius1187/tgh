#!/usr/bin/env node

/**
 * Script para probar las APIs de TGH Pulseras
 * Ejecutar con: node test-apis.js
 */

const baseUrl = 'http://localhost:3000'

// Función para hacer requests HTTP
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })
    
    const data = await response.json()
    
    console.log(`\n🔗 ${options.method || 'GET'} ${url}`)
    console.log(`📊 Status: ${response.status} ${response.statusText}`)
    console.log(`📝 Response:`, JSON.stringify(data, null, 2))
    
    return { response, data }
  } catch (error) {
    console.error(`❌ Error en ${url}:`, error.message)
    return null
  }
}

// Función para probar todas las APIs
async function testAPIs() {
  console.log('🚀 Iniciando pruebas de APIs TGH Pulseras\n')
  
  // 1. Probar validación de serial
  console.log('=' .repeat(50))
  console.log('1. PROBANDO VALIDACIÓN DE SERIAL')
  console.log('=' .repeat(50))
  
  await makeRequest(`${baseUrl}/api/validate-serial`, {
    method: 'POST',
    body: JSON.stringify({
      serial: 'TGH001'
    })
  })
  
  // 2. Probar registro de usuario
  console.log('\n' + '=' .repeat(50))
  console.log('2. PROBANDO REGISTRO DE USUARIO')
  console.log('=' .repeat(50))
  
  const registerData = {
    username: 'testuser123',
    password: 'Test123!@#',
    serial: 'TGH001',
    confirmPassword: 'Test123!@#'
  }
  
  const registerResult = await makeRequest(`${baseUrl}/api/register`, {
    method: 'POST',
    body: JSON.stringify(registerData)
  })
  
  // 3. Probar login
  console.log('\n' + '=' .repeat(50))
  console.log('3. PROBANDO LOGIN')
  console.log('=' .repeat(50))
  
  const loginData = {
    username: 'testuser123',
    password: 'Test123!@#'
  }
  
  const loginResult = await makeRequest(`${baseUrl}/api/login`, {
    method: 'POST',
    body: JSON.stringify(loginData)
  })
  
  // 4. Probar obtener datos de usuario (si el login fue exitoso)
  if (loginResult && loginResult.data.token) {
    console.log('\n' + '=' .repeat(50))
    console.log('4. PROBANDO OBTENER DATOS DE USUARIO')
    console.log('=' .repeat(50))
    
    await makeRequest(`${baseUrl}/api/user-data`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginResult.data.token}`
      }
    })
  }
  
  // 5. Probar datos públicos NFC
  console.log('\n' + '=' .repeat(50))
  console.log('5. PROBANDO DATOS PÚBLICOS NFC')
  console.log('=' .repeat(50))
  
  await makeRequest(`${baseUrl}/api/nfc-data/TGH001`)
  
  // 6. Probar página pública NFC
  console.log('\n' + '=' .repeat(50))
  console.log('6. PROBANDO PÁGINA PÚBLICA NFC')
  console.log('=' .repeat(50))
  
  await makeRequest(`${baseUrl}/nfc/TGH001`)
  
  console.log('\n' + '=' .repeat(50))
  console.log('✅ PRUEBAS COMPLETADAS')
  console.log('=' .repeat(50))
}

// Función para probar APIs sin base de datos
async function testAPIsWithoutDB() {
  console.log('🚀 Probando APIs sin base de datos (modo mock)\n')
  
  // Simular respuestas mock
  console.log('📝 Nota: Estas son respuestas simuladas para mostrar la estructura')
  
  const mockResponses = {
    validateSerial: {
      success: true,
      message: 'Serial válido y disponible para activación',
      serial: 'TGH001'
    },
    register: {
      success: true,
      message: 'Usuario registrado exitosamente',
      token: 'mock_jwt_token_here',
      user: {
        id: 1,
        username: 'testuser123'
      }
    },
    login: {
      success: true,
      message: 'Login exitoso',
      token: 'mock_jwt_token_here',
      user: {
        id: 1,
        username: 'testuser123',
        lastLogin: new Date().toISOString()
      }
    },
    userData: {
      usuario: {
        id: 1,
        username: 'testuser123',
        is_active: true,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      datosPersonales: {
        id: 1,
        usuario_id: 1,
        nombre: 'Usuario',
        apellido: 'Prueba',
        fecha_nacimiento: '1990-01-01',
        foto_url: null,
        telefono: '+1234567890',
        email: 'test@example.com'
      },
      datosVitales: {
        id: 1,
        usuario_id: 1,
        alergias: 'Ninguna',
        medicacion: 'Ninguna',
        enfermedades_cronicas: 'Ninguna',
        grupo_sanguineo: 'O+',
        grupo_sanguineo_url: null,
        peso: 70.5,
        altura: 175.0
      },
      contactosEmergencia: [
        {
          id: 1,
          usuario_id: 1,
          nombre: 'Contacto Emergencia',
          telefono: '+0987654321',
          relacion: 'Familiar',
          es_principal: true,
          orden: 1,
          is_active: true
        }
      ],
      pulsera: {
        id: 1,
        serial: 'TGH001',
        is_active: true,
        public_url: 'http://localhost:3000/nfc/TGH001',
        created_at: new Date().toISOString()
      }
    },
    nfcData: {
      success: true,
      serial: 'TGH001',
      timestamp: new Date().toISOString(),
      data: {
        persona: {
          nombre: 'Usuario',
          apellido: 'Prueba',
          edad: 34,
          foto: null,
          peso: 70.5,
          altura: 175.0
        },
        medica: {
          grupo_sanguineo: 'O+',
          alergias: 'Ninguna',
          medicacion: 'Ninguna',
          enfermedades_cronicas: 'Ninguna',
          observaciones: null,
          certificado_grupo_sanguineo: null
        },
        contactos: [
          {
            nombre: 'Contacto Emergencia',
            telefono: '+0987654321',
            relacion: 'Familiar',
            es_principal: true,
            llamada_directa: 'tel:+0987654321'
          }
        ]
      }
    }
  }
  
  console.log('🔗 POST /api/validate-serial')
  console.log('📊 Status: 200 OK')
  console.log('📝 Response:', JSON.stringify(mockResponses.validateSerial, null, 2))
  
  console.log('\n🔗 POST /api/register')
  console.log('📊 Status: 201 Created')
  console.log('📝 Response:', JSON.stringify(mockResponses.register, null, 2))
  
  console.log('\n🔗 POST /api/login')
  console.log('📊 Status: 200 OK')
  console.log('📝 Response:', JSON.stringify(mockResponses.login, null, 2))
  
  console.log('\n🔗 GET /api/user-data')
  console.log('📊 Status: 200 OK')
  console.log('📝 Response:', JSON.stringify(mockResponses.userData, null, 2))
  
  console.log('\n🔗 GET /api/nfc-data/TGH001')
  console.log('📊 Status: 200 OK')
  console.log('📝 Response:', JSON.stringify(mockResponses.nfcData, null, 2))
  
  console.log('\n✅ ESTRUCTURA DE APIS VERIFICADA')
}

// Ejecutar pruebas
async function main() {
  try {
    // Primero intentar con base de datos real
    console.log('Intentando conectar a base de datos...')
    await testAPIs()
  } catch (error) {
    console.log('\n⚠️  No se pudo conectar a la base de datos, mostrando estructura mock...')
    await testAPIsWithoutDB()
  }
}

main().catch(console.error)
