import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthenticatedUser } from './lib/auth'

// Rutas que requieren autenticación
const protectedRoutes = [
  '/dashboard',
  '/api/user-data',
  '/api/upload-file'
]

// Rutas que requieren autenticación de admin
const adminRoutes = [
  '/api/admin'
]

// Rutas públicas (no requieren autenticación)
const publicRoutes = [
  '/',
  '/activacion',
  '/registro',
  '/login',
  '/nfc',
  '/api/validate-serial',
  '/api/register',
  '/api/login',
  '/api/nfc-data'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Verificar si es una ruta protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // Si es una ruta pública, permitir acceso
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // Si es una ruta protegida, verificar autenticación
  if (isProtectedRoute || isAdminRoute) {
    const user = getAuthenticatedUser(request)
    
    if (!user) {
      // Redirigir a login si no está autenticado
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Token de autenticación requerido' },
          { status: 401 }
        )
      } else {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
    }
    
    // Verificar si es ruta de admin (futura implementación)
    if (isAdminRoute && user.username !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Permisos de administrador requeridos' },
          { status: 403 }
        )
      } else {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
    
    // Agregar información del usuario a los headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.userId.toString())
    requestHeaders.set('x-username', user.username)
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
  
  // Para otras rutas, permitir acceso
  return NextResponse.next()
}

// Configuración del matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
