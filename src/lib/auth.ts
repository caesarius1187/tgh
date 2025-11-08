import jwt, { type Secret, type SignOptions } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'
import type { ResultSetHeader } from 'mysql2/promise'

// Configuración JWT
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
const TOKEN_ISSUER = 'tgh-pulseras' as const
const TOKEN_AUDIENCE = 'tgh-users' as const
const tokenExpiresIn = JWT_EXPIRES_IN as SignOptions['expiresIn']

const jwtSecret: Secret = JWT_SECRET
const accessTokenOptions: SignOptions = {
  issuer: TOKEN_ISSUER,
  audience: TOKEN_AUDIENCE,
  expiresIn: tokenExpiresIn
}

// Interfaces
export interface JWTPayload {
  userId: number
  username: string
  iat?: number
  exp?: number
}

export interface AuthResult {
  success: boolean
  token?: string
  user?: {
    id: number
    username: string
  }
  error?: string
}

/**
 * Hashear contraseña usando bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

/**
 * Verificar contraseña usando bcrypt
 */
export const verifyPassword = async (
  password: string, 
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword)
}

/**
 * Generar token JWT
 */
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, jwtSecret, accessTokenOptions)
}

/**
 * Verificar token JWT
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, jwtSecret, {
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE
    })
    
    if (typeof decoded === 'string') {
      return null
    }
    
    return decoded as JWTPayload
  } catch (error) {
    console.error('Error verificando token:', error)
    return null
  }
}

/**
 * Extraer token del header Authorization
 */
export const extractTokenFromRequest = (request: NextRequest): string | null => {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) return null
  
  // Formato: "Bearer <token>"
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }
  
  return parts[1]
}

/**
 * Obtener usuario autenticado desde el request
 */
export const getAuthenticatedUser = (request: NextRequest): JWTPayload | null => {
  const token = extractTokenFromRequest(request)
  
  if (!token) return null
  
  return verifyToken(token)
}

/**
 * Middleware para verificar autenticación
 */
export const requireAuth = (request: NextRequest): { 
  user: JWTPayload | null
  error?: string 
} => {
  const user = getAuthenticatedUser(request)
  
  if (!user) {
    return {
      user: null,
      error: 'Token de autenticación requerido'
    }
  }
  
  // Verificar que el token no esté expirado
  if (user.exp && user.exp < Math.floor(Date.now() / 1000)) {
    return {
      user: null,
      error: 'Token expirado'
    }
  }
  
  return { user }
}

/**
 * Validar fortaleza de contraseña
 */
export const validatePassword = (password: string): { 
  valid: boolean
  errors: string[] 
} => {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Generar refresh token (para futuras implementaciones)
 */
export const generateRefreshToken = (): string => {
  return jwt.sign({}, jwtSecret, {
    expiresIn: '30d',
    issuer: TOKEN_ISSUER,
    audience: 'tgh-refresh'
  })
}

/**
 * Limpiar tokens expirados de la base de datos
 */
export const cleanExpiredTokens = async (): Promise<number> => {
  try {
    const { executeQuery } = await import('./database')
    const result = await executeQuery<ResultSetHeader>(
      'DELETE FROM sesiones_usuarios WHERE expires_at < NOW()'
    )
    return result.affectedRows ?? 0
  } catch (error) {
    console.error('Error limpiando tokens expirados:', error)
    return 0
  }
}
