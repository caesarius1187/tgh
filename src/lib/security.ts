import { NextRequest } from 'next/server'
import { createAuditLog } from './db-utils'

// Configuración de seguridad
const MAX_REQUESTS_PER_MINUTE = 60
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutos

// Store para rate limiting (en producción usar Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>()
const loginAttempts = new Map<string, { attempts: number; lockoutUntil: number }>()

/**
 * Limpiar datos de entrada para prevenir inyecciones
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remover caracteres HTML básicos
    .replace(/['"]/g, '') // Remover comillas
    .substring(0, 1000) // Limitar longitud
}

/**
 * Validar y limpiar datos de entrada
 */
export const sanitizeObject = (obj: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value)
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

/**
 * Obtener IP del cliente
 */
export const getClientIP = (request: NextRequest): string => {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return request.ip || '127.0.0.1'
}

/**
 * Rate limiting básico
 */
export const checkRateLimit = (request: NextRequest): {
  allowed: boolean
  remaining: number
  resetTime: number
} => {
  const ip = getClientIP(request)
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minuto
  
  const current = requestCounts.get(ip)
  
  if (!current || now > current.resetTime) {
    // Nueva ventana de tiempo
    requestCounts.set(ip, {
      count: 1,
      resetTime: now + windowMs
    })
    
    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_MINUTE - 1,
      resetTime: now + windowMs
    }
  }
  
  if (current.count >= MAX_REQUESTS_PER_MINUTE) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime
    }
  }
  
  // Incrementar contador
  current.count++
  requestCounts.set(ip, current)
  
  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_MINUTE - current.count,
    resetTime: current.resetTime
  }
}

/**
 * Verificar intentos de login
 */
export const checkLoginAttempts = (ip: string, username: string): {
  allowed: boolean
  remainingAttempts: number
  lockoutUntil?: number
} => {
  const key = `${ip}:${username}`
  const now = Date.now()
  
  const current = loginAttempts.get(key)
  
  if (current && now < current.lockoutUntil) {
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutUntil: current.lockoutUntil
    }
  }
  
  if (!current || now > current.lockoutUntil) {
    // Reset intentos
    loginAttempts.set(key, {
      attempts: 0,
      lockoutUntil: 0
    })
    
    return {
      allowed: true,
      remainingAttempts: MAX_LOGIN_ATTEMPTS
    }
  }
  
  if (current.attempts >= MAX_LOGIN_ATTEMPTS) {
    // Aplicar lockout
    current.lockoutUntil = now + LOCKOUT_DURATION
    loginAttempts.set(key, current)
    
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutUntil: current.lockoutUntil
    }
  }
  
  return {
    allowed: true,
    remainingAttempts: MAX_LOGIN_ATTEMPTS - current.attempts
  }
}

/**
 * Registrar intento de login fallido
 */
export const recordFailedLogin = (ip: string, username: string): void => {
  const key = `${ip}:${username}`
  const now = Date.now()
  
  const current = loginAttempts.get(key) || {
    attempts: 0,
    lockoutUntil: 0
  }
  
  current.attempts++
  loginAttempts.set(key, current)
  
  // Log del intento fallido
  createAuditLog(
    'login_failed',
    `Intento de login fallido para usuario: ${username}`,
    null,
    ip,
    null,
    { username, attempts: current.attempts }
  )
}

/**
 * Limpiar intentos de login exitoso
 */
export const clearLoginAttempts = (ip: string, username: string): void => {
  const key = `${ip}:${username}`
  loginAttempts.delete(key)
}

/**
 * Validar headers de seguridad
 */
export const validateSecurityHeaders = (request: NextRequest): boolean => {
  const userAgent = request.headers.get('user-agent')
  
  if (!userAgent) {
    return false
  }
  
  // Verificar que no sea un bot malicioso conocido
  const maliciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
  ]
  
  // Permitir algunos bots legítimos
  const allowedBots = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i
  ]
  
  if (allowedBots.some(pattern => pattern.test(userAgent))) {
    return true
  }
  
  return !maliciousPatterns.some(pattern => pattern.test(userAgent))
}

/**
 * Configurar headers de seguridad para respuestas
 */
export const getSecurityHeaders = (): Record<string, string> => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self';",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  }
}

/**
 * Limpiar datos sensibles de logs
 */
export const sanitizeLogData = (data: any): any => {
  const sensitiveFields = ['password', 'password_hash', 'token', 'secret', 'key']
  
  if (typeof data !== 'object' || data === null) {
    return data
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogData(item))
  }
  
  const sanitized: any = {}
  
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeLogData(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

/**
 * Verificar si una URL es segura
 */
export const isSecureURL = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    
    // Solo permitir HTTPS en producción
    if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
      return false
    }
    
    // Verificar que sea del mismo dominio o dominios permitidos
    const allowedDomains = [
      'localhost',
      '127.0.0.1',
      process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || ''
    ]
    
    return allowedDomains.some(domain => 
      parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    )
  } catch {
    return false
  }
}

/**
 * Limpiar store de rate limiting periódicamente
 */
export const cleanupRateLimitStore = (): void => {
  const now = Date.now()
  
  // Limpiar request counts expirados
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key)
    }
  }
  
  // Limpiar login attempts expirados
  for (const [key, value] of loginAttempts.entries()) {
    if (now > value.lockoutUntil && value.lockoutUntil > 0) {
      loginAttempts.delete(key)
    }
  }
}

// Ejecutar limpieza cada 5 minutos
setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
