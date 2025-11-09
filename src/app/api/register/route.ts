import { NextRequest, NextResponse } from 'next/server'
import { registerUserSchema, validateData } from '@/lib/validations'
import { 
  checkSerialExists, 
  checkSerialActive, 
  checkUsernameExists,
  createAuditLog 
} from '@/lib/db-utils'
import { executeQuery, getClient } from '@/lib/database'
import { hashPassword, generateToken } from '@/lib/auth'
import { getClientIP } from '@/lib/security'
import { withCORS } from '@/lib/cors'

export const runtime = 'nodejs'

export const POST = withCORS(async (request: NextRequest) => {
  try {
    // Obtener datos del body
    const body = await request.json()
    
    // Validar datos de entrada
    const validation = validateData(registerUserSchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validation.errors 
        },
        { status: 400 }
      )
    }
    
    const { username, password, serial } = validation.data
    const ip = getClientIP(request)
    const userAgent = request.headers.get('user-agent')
    
    // Verificar si el username ya existe
    const usernameExists = await checkUsernameExists(username)
    
    if (usernameExists) {
      await createAuditLog(
        'registration_failed',
        `Intento de registro con username existente: ${username}`,
        null,
        ip,
        userAgent,
        { username, reason: 'username_exists' }
      )
      
      return NextResponse.json(
        { 
          error: 'El nombre de usuario ya está en uso'
        },
        { status: 409 }
      )
    }
    
    // Verificar si el serial existe
    const serialExists = await checkSerialExists(serial)
    
    if (!serialExists) {
      await createAuditLog(
        'registration_failed',
        `Intento de registro con serial inexistente: ${serial}`,
        null,
        ip,
        userAgent,
        { username, serial, reason: 'serial_not_found' }
      )
      
      return NextResponse.json(
        { 
          error: 'Serial de pulsera no válido'
        },
        { status: 400 }
      )
    }
    
    // Verificar si el serial ya está activado
    const isSerialActive = await checkSerialActive(serial)
    
    if (isSerialActive) {
      await createAuditLog(
        'registration_failed',
        `Intento de registro con serial ya activado: ${serial}`,
        null,
        ip,
        userAgent,
        { username, serial, reason: 'serial_already_active' }
      )
      
      return NextResponse.json(
        { 
          error: 'Esta pulsera ya ha sido activada'
        },
        { status: 409 }
      )
    }
    
    // Hashear contraseña
    const passwordHash = await hashPassword(password)
    
    // Obtener ID de la pulsera
    const { rows: pulseraRows } = await executeQuery<{ id: number }>(
      'SELECT id FROM pulseras WHERE serial = $1',
      [serial]
    )
    
    if (!pulseraRows.length) {
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
    
    const pulseraId = pulseraRows[0].id
    
    // Iniciar transacción
    const client = await getClient()
    
    try {
      await client.query('BEGIN')
      
      // Crear usuario
      const userInsert = await client.query<{ id: number }>(
        `
          INSERT INTO usuarios (username, password_hash, pulsera_id, is_active)
          VALUES ($1, $2, $3, TRUE)
          RETURNING id
        `,
        [username, passwordHash, pulseraId]
      )
      
      const userId = userInsert.rows[0]?.id
      
      if (!userId) {
        throw new Error('No se pudo obtener el ID del usuario creado')
      }
      
      // Activar pulsera
      const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/nfc/${serial}`
      
      await client.query(
        `
          UPDATE pulseras 
          SET is_active = TRUE, public_url = $1
          WHERE id = $2
        `,
        [publicUrl, pulseraId]
      )
      
      // Generar token JWT
      const token = generateToken({
        userId,
        username
      })
      
      // Guardar sesión
      await client.query(
        `
          INSERT INTO sesiones_usuarios (usuario_id, token_hash, expires_at, ip_address, user_agent, is_active)
          VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4, TRUE)
        `,
        [userId, await hashPassword(token), ip, userAgent]
      )
      
      // Confirmar transacción
      await client.query('COMMIT')
      
      // Log del registro exitoso
      await createAuditLog(
        'user_registered',
        `Usuario registrado exitosamente: ${username}`,
        userId,
        ip,
        userAgent,
        { username, serial, pulseraId }
      )
      
      return NextResponse.json({
        success: true,
        message: 'Usuario registrado exitosamente',
        token,
        user: {
          id: userId,
          username
        }
      })
      
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('Error en register:', error)
    
    // Log del error
    await createAuditLog(
      'registration_error',
      'Error interno durante registro',
      null,
      getClientIP(request),
      request.headers.get('user-agent'),
      { error: error instanceof Error ? error.message : 'Unknown error' }
    )
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

// Manejar otros métodos HTTP
export const GET = () => {
  return NextResponse.json(
    { error: 'Método no permitido' },
    { status: 405 }
  )
}

export const PUT = () => {
  return NextResponse.json(
    { error: 'Método no permitido' },
    { status: 405 }
  )
}

export const DELETE = () => {
  return NextResponse.json(
    { error: 'Método no permitido' },
    { status: 405 }
  )
}
