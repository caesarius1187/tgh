import { NextRequest, NextResponse } from 'next/server'
import { loginSchema, validateData } from '@/lib/validations'
import { getUserByUsername, createAuditLog } from '@/lib/db-utils'
import { executeQuery } from '@/lib/database'
import { verifyPassword, generateToken } from '@/lib/auth'
import { 
  getClientIP, 
  checkLoginAttempts, 
  recordFailedLogin, 
  clearLoginAttempts 
} from '@/lib/security'
import { withCORS } from '@/lib/cors'

export const POST = withCORS(async (request: NextRequest) => {
  try {
    // Obtener datos del body
    const body = await request.json()
    
    // Validar datos de entrada
    const validation = validateData(loginSchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validation.errors 
        },
        { status: 400 }
      )
    }
    
    const { username, password } = validation.data
    const ip = getClientIP(request)
    const userAgent = request.headers.get('user-agent')
    
    // Verificar intentos de login
    const loginCheck = checkLoginAttempts(ip, username)
    
    if (!loginCheck.allowed) {
      await createAuditLog(
        'login_blocked',
        `Login bloqueado por demasiados intentos: ${username}`,
        null,
        ip,
        userAgent,
        { 
          username, 
          reason: 'too_many_attempts',
          lockoutUntil: loginCheck.lockoutUntil 
        }
      )
      
      return NextResponse.json(
        { 
          error: 'Demasiados intentos de login. Intenta más tarde.',
          lockoutUntil: loginCheck.lockoutUntil
        },
        { status: 429 }
      )
    }
    
    // Obtener usuario de la base de datos
    const user = await getUserByUsername(username)
    
    if (!user) {
      recordFailedLogin(ip, username)
      
      await createAuditLog(
        'login_failed',
        `Intento de login con usuario inexistente: ${username}`,
        null,
        ip,
        userAgent,
        { username, reason: 'user_not_found' }
      )
      
      return NextResponse.json(
        { 
          error: 'Credenciales inválidas'
        },
        { status: 401 }
      )
    }
    
    // Verificar si el usuario está activo
    if (!user.is_active) {
      recordFailedLogin(ip, username)
      
      await createAuditLog(
        'login_failed',
        `Intento de login con usuario inactivo: ${username}`,
        user.id,
        ip,
        userAgent,
        { username, reason: 'user_inactive' }
      )
      
      return NextResponse.json(
        { 
          error: 'Usuario inactivo. Contacta al administrador.'
        },
        { status: 403 }
      )
    }
    
    // Verificar contraseña
    const passwordValid = await verifyPassword(password, user.password_hash)
    
    if (!passwordValid) {
      recordFailedLogin(ip, username)
      
      await createAuditLog(
        'login_failed',
        `Intento de login con contraseña incorrecta: ${username}`,
        user.id,
        ip,
        userAgent,
        { username, reason: 'invalid_password' }
      )
      
      return NextResponse.json(
        { 
          error: 'Credenciales inválidas'
        },
        { status: 401 }
      )
    }
    
    // Login exitoso
    clearLoginAttempts(ip, username)
    
    // Generar token JWT
    const token = generateToken({
      userId: user.id,
      username: user.username
    })
    
    // Actualizar último login
    await executeQuery(
      'UPDATE usuarios SET last_login = NOW() WHERE id = ?',
      [user.id]
    )
    
    // Guardar sesión
    await executeQuery(`
      INSERT INTO sesiones_usuarios (usuario_id, token_hash, expires_at, ip_address, user_agent, is_active)
      VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), ?, ?, TRUE)
    `, [user.id, await (await import('@/lib/auth')).hashPassword(token), ip, userAgent])
    
    // Log del login exitoso
    await createAuditLog(
      'login_success',
      `Login exitoso: ${username}`,
      user.id,
      ip,
      userAgent,
      { username, userId: user.id }
    )
    
    return NextResponse.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        username: user.username,
        lastLogin: user.last_login
      }
    })
    
  } catch (error) {
    console.error('Error en login:', error)
    
    // Log del error
    await createAuditLog(
      'login_error',
      'Error interno durante login',
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
