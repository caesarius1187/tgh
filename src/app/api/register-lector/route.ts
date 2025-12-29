import { NextRequest, NextResponse } from 'next/server'
import { registerReaderSchema, validateData } from '@/lib/validations'
import { checkUsernameExists, createAuditLog } from '@/lib/db-utils'
import { getClient } from '@/lib/database'
import { hashPassword, generateToken } from '@/lib/auth'
import { getClientIP } from '@/lib/security'
import { withCORS } from '@/lib/cors'

export const runtime = 'nodejs'

export const POST = withCORS(async (request: NextRequest) => {
  try {
    const body = await request.json()

    // Validación de entrada
    const validation = validateData(registerReaderSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.errors },
        { status: 400 }
      )
    }

    const { username, password } = validation.data
    const ip = getClientIP(request)
    const userAgent = request.headers.get('user-agent')

    // Username único
    const usernameExists = await checkUsernameExists(username)
    if (usernameExists) {
      await createAuditLog(
        'registration_failed',
        `Intento de registro lector con username existente: ${username}`,
        null,
        ip,
        userAgent,
        { username, reason: 'username_exists' }
      )
      return NextResponse.json({ error: 'El nombre de usuario ya está en uso' }, { status: 409 })
    }

    // Hash de contraseña
    const passwordHash = await hashPassword(password)

    // Crear usuario lector y sesión
    const client = await getClient()
    try {
      await client.query('BEGIN')

      const userInsert = await client.query<{ id: number }>(
        `
          INSERT INTO usuarios (username, password_hash, rol, is_active)
          VALUES ($1, $2, 'lector', TRUE)
          RETURNING id
        `,
        [username, passwordHash]
      )
      const userId = userInsert.rows[0]?.id
      if (!userId) {
        throw new Error('No se pudo obtener el ID del usuario creado')
      }

      const token = generateToken({
        userId,
        username,
        rol: 'lector',
        idCliente: null
      })

      await client.query(
        `
          INSERT INTO sesiones_usuarios (usuario_id, token_hash, expires_at, ip_address, user_agent, is_active)
          VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4, TRUE)
        `,
        [userId, await hashPassword(token), ip, userAgent]
      )

      await client.query('COMMIT')

      await createAuditLog(
        'user_registered',
        `Usuario lector registrado: ${username}`,
        userId,
        ip,
        userAgent,
        { username, rol: 'lector' }
      )

      return NextResponse.json({
        success: true,
        message: 'Usuario lector registrado exitosamente',
        token,
        user: {
          id: userId,
          username,
          rol: 'lector',
          idCliente: null
        }
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error en register-lector:', error)
    await createAuditLog(
      'registration_error',
      'Error interno durante registro lector',
      null,
      getClientIP(request),
      request.headers.get('user-agent'),
      { error: error instanceof Error ? error.message : 'Unknown error' }
    )
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
})

export const GET = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })
export const PUT = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })
export const DELETE = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })


