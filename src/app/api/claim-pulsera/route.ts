import { NextRequest, NextResponse } from 'next/server'
import { registerUserSchema, validateData } from '@/lib/validations'
import { 
  checkUsernameExists, 
  createAuditLog,
  getPulseraLinkStatus
} from '@/lib/db-utils'
import { executeQuery, getClient } from '@/lib/database'
import { hashPassword, generateToken } from '@/lib/auth'
import { getClientIP } from '@/lib/security'
import { withCORS } from '@/lib/cors'

export const runtime = 'nodejs'

export const POST = withCORS(async (request: NextRequest) => {
  try {
    const body = await request.json()

    // Validar datos de entrada
    const validation = validateData(registerUserSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.errors },
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
        'claim_failed',
        `Intento de claim con username existente: ${username}`,
        null,
        ip,
        userAgent,
        { username, reason: 'username_exists' }
      )
      return NextResponse.json({ error: 'El nombre de usuario ya está en uso' }, { status: 409 })
    }

    // Obtener estado de pulsera
    const status = await getPulseraLinkStatus(serial)
    if (!status || !status.exists) {
      await createAuditLog(
        'claim_failed',
        `Intento de claim con serial inexistente: ${serial}`,
        null,
        ip,
        userAgent,
        { serial, reason: 'serial_not_found' }
      )
      return NextResponse.json({ error: 'Serial de pulsera no válido' }, { status: 404 })
    }

    if (status.hasUser) {
      await createAuditLog(
        'claim_failed',
        `Intento de claim con pulsera ya vinculada: ${serial}`,
        null,
        ip,
        userAgent,
        { serial, reason: 'serial_already_linked' }
      )
      return NextResponse.json({ error: 'Esta pulsera ya está vinculada a un usuario' }, { status: 409 })
    }

    // Hashear contraseña
    const passwordHash = await hashPassword(password)

    // Obtener id de la pulsera por serial
    const { rows: pulseraRows } = await executeQuery<{ id: number; id_cliente: number | null }>(
      'SELECT id, id_cliente FROM pulseras WHERE serial = $1',
      [serial]
    )
    if (!pulseraRows.length) {
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
    const pulseraId = pulseraRows[0].id
    const pulseraClientId = pulseraRows[0].id_cliente ?? null

    // Iniciar transacción
    const client = await getClient()
    try {
      await client.query('BEGIN')

      // Crear usuario y vincular pulsera; rol por defecto 'portador'
      const userInsert = await client.query<{ id: number }>(
        `
          INSERT INTO usuarios (username, password_hash, pulsera_id, id_cliente, is_active, rol)
          VALUES ($1, $2, $3, $4, TRUE, 'portador')
          RETURNING id
        `,
        [username, passwordHash, pulseraId, pulseraClientId]
      )
      const userId = userInsert.rows[0]?.id
      if (!userId) {
        throw new Error('No se pudo obtener el ID del usuario creado')
      }

      // Activar pulsera y setear URL pública (idempotente si ya estuviera activa)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const publicUrl = `${baseUrl}/nfc/${serial}`
      await client.query(
        `
          UPDATE pulseras 
          SET is_active = TRUE, public_url = $1, updated_at = NOW()
          WHERE id = $2
        `,
        [publicUrl, pulseraId]
      )

      // Generar token JWT con rol por defecto 'portador'
      const token = generateToken({
        userId,
        username,
        rol: 'portador',
        idCliente: pulseraClientId ?? null
      })

      // Guardar sesión
      await client.query(
        `
          INSERT INTO sesiones_usuarios (usuario_id, token_hash, expires_at, ip_address, user_agent, is_active)
          VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4, TRUE)
        `,
        [userId, await hashPassword(token), ip, userAgent]
      )

      await client.query('COMMIT')

      await createAuditLog(
        'claim_success',
        `Usuario creado y pulsera reclamada: ${username} -> ${serial}`,
        userId,
        ip,
        userAgent,
        { username, serial, pulseraId }
      )

      return NextResponse.json({
        success: true,
        message: 'Cuenta creada y pulsera vinculada',
        token,
        user: {
          id: userId,
          username,
          rol: 'portador',
          idCliente: pulseraClientId ?? null
        }
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error en claim-pulsera:', error)
    await createAuditLog(
      'claim_error',
      'Error interno durante claim',
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


