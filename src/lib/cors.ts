import { NextRequest, NextResponse } from 'next/server'

// Configuración de CORS
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
]

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Origin'
]

/**
 * Configurar CORS para las respuestas
 */
export const setCORSHeaders = (
  response: NextResponse,
  origin?: string
): NextResponse => {
  // Verificar si el origen está permitido
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin || '') ? origin : ALLOWED_ORIGINS[0]
  
  // Headers de CORS
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin || '*')
  response.headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '))
  response.headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '))
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Max-Age', '86400') // 24 horas
  
  return response
}

/**
 * Manejar preflight requests (OPTIONS)
 */
export const handlePreflightRequest = (request: NextRequest): NextResponse => {
  const origin = request.headers.get('origin')
  
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return new NextResponse(null, { status: 403 })
  }
  
  const response = new NextResponse(null, { status: 200 })
  return setCORSHeaders(response, origin || undefined)
}

/**
 * Middleware CORS para API routes
 */
export const withCORS = (
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse
) => {
  return async (request: NextRequest): Promise<NextResponse> => {
    const origin = request.headers.get('origin')
    
    // Manejar preflight requests
    if (request.method === 'OPTIONS') {
      return handlePreflightRequest(request)
    }
    
    // Verificar origen si no es una request del mismo origen
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return new NextResponse(
        JSON.stringify({ error: 'Origen no permitido' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    try {
      // Ejecutar el handler original
      const response = await handler(request)
      
      // Aplicar headers CORS
      return setCORSHeaders(response, origin || undefined)
    } catch (error) {
      console.error('Error en API route:', error)
      
      const errorResponse = new NextResponse(
        JSON.stringify({ error: 'Error interno del servidor' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
      
      return setCORSHeaders(errorResponse, origin || undefined)
    }
  }
}

/**
 * Verificar si la request es de un origen permitido
 */
export const isAllowedOrigin = (request: NextRequest): boolean => {
  const origin = request.headers.get('origin')
  
  if (!origin) {
    // Requests del mismo origen no tienen header origin
    return true
  }
  
  return ALLOWED_ORIGINS.includes(origin)
}

/**
 * Obtener configuración de CORS para el cliente
 */
export const getCORSConfig = () => {
  return {
    origin: ALLOWED_ORIGINS,
    methods: ALLOWED_METHODS,
    allowedHeaders: ALLOWED_HEADERS,
    credentials: true
  }
}
