import { NextRequest, NextResponse } from 'next/server'

type OriginList = readonly string[]

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] as const
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Origin'
] as const

const buildAllowedOrigins = (): OriginList => {
  const origins = new Set<string>()

  const defaults = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://localhost:3000',
    'https://127.0.0.1:3000'
  ]

  defaults.forEach(origin => origins.add(origin))

  const addIfPresent = (value?: string | null) => {
    if (value) {
      origins.add(value.trim())
    }
  }

  const parseCommaSeparated = (value?: string | null) => {
    if (!value) return
    value
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean)
      .forEach(origin => origins.add(origin))
  }

  addIfPresent(process.env.NEXT_PUBLIC_APP_URL)
  addIfPresent(process.env.APP_URL)
  addIfPresent(process.env.PUBLIC_APP_URL)

  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) {
    const normalized = vercelUrl.startsWith('http')
      ? vercelUrl
      : `https://${vercelUrl}`
    addIfPresent(normalized)
  }

  parseCommaSeparated(process.env.CORS_ALLOWED_ORIGINS)

  return Array.from(origins)
}

const ALLOWED_ORIGINS = buildAllowedOrigins()

const getSelfOrigin = (request: NextRequest): string => {
  const { protocol, host } = request.nextUrl
  return `${protocol}//${host}`
}

const isOriginAllowed = (origin: string | null | undefined, request?: NextRequest): boolean => {
  if (!origin) return true
  if (ALLOWED_ORIGINS.includes(origin)) return true

  if (request) {
    const selfOrigin = getSelfOrigin(request)
    if (origin === selfOrigin) {
      return true
    }
  }

  return false
}

export const setCORSHeaders = (
  response: NextResponse,
  origin?: string | null,
  request?: NextRequest
): NextResponse => {
  const selfOrigin = request ? getSelfOrigin(request) : undefined
  const fallbackOrigin = selfOrigin ?? ALLOWED_ORIGINS[0] ?? '*'

  const isExplicitlyAllowed = origin && ALLOWED_ORIGINS.includes(origin)
  const matchesSelf = origin && origin === selfOrigin

  const allowedOrigin = isExplicitlyAllowed || matchesSelf ? origin : fallbackOrigin

  response.headers.set(
    'Access-Control-Allow-Origin',
    allowedOrigin ?? '*'
  )
  response.headers.set(
    'Access-Control-Allow-Methods',
    ALLOWED_METHODS.join(', ')
  )
  response.headers.set(
    'Access-Control-Allow-Headers',
    ALLOWED_HEADERS.join(', ')
  )
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Max-Age', '86400')

  return response
}

export const handlePreflightRequest = (request: NextRequest): NextResponse => {
  const origin = request.headers.get('origin')

  if (!isOriginAllowed(origin, request)) {
    return new NextResponse(null, { status: 403 })
  }

  const response = new NextResponse(null, { status: 200 })
  return setCORSHeaders(response, origin, request)
}

export const withCORS = <TArgs extends unknown[]>(
  handler: (request: NextRequest, ...args: TArgs) => Promise<NextResponse> | NextResponse
) => {
  return async (
    request: NextRequest,
    ...args: TArgs
  ): Promise<NextResponse> => {
    const origin = request.headers.get('origin')

    if (request.method === 'OPTIONS') {
      return handlePreflightRequest(request)
    }

    if (!isOriginAllowed(origin, request)) {
      return new NextResponse(
        JSON.stringify({ error: 'Origen no permitido' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    try {
      const response = await handler(request, ...args)
      return setCORSHeaders(response, origin, request)
    } catch (error) {
      console.error('Error en API route:', error)

      const errorResponse = new NextResponse(
        JSON.stringify({ error: 'Error interno del servidor' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )

      return setCORSHeaders(errorResponse, origin, request)
    }
  }
}

export const isAllowedOrigin = (request: NextRequest): boolean => {
  const origin = request.headers.get('origin')
  return isOriginAllowed(origin, request)
}

export const getCORSConfig = () => ({
  origin: ALLOWED_ORIGINS,
  methods: ALLOWED_METHODS,
  allowedHeaders: ALLOWED_HEADERS,
  credentials: true
})
