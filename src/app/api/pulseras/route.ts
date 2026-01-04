import { NextRequest, NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'
import { requireAuth } from '@/lib/auth'
import { executeQuery } from '@/lib/database'

export const runtime = 'nodejs'

export const GET = withCORS(async (request: NextRequest) => {
  const auth = requireAuth(request)
  if (!auth.user) {
    return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 })
  }
  if (auth.user.rol !== 'admin_sistema') {
    return NextResponse.json({ error: 'Permisos de administrador requeridos' }, { status: 403 })
  }

  try {
    const { rows } = await executeQuery(
      `SELECT p.id, p.serial, p.is_active, p.public_url, p.id_cliente, p.created_at, p.updated_at,
              c.nombre_publico as cliente_nombre
       FROM pulseras p
       LEFT JOIN clientes c ON c.id = p.id_cliente
       ORDER BY p.created_at DESC`
    )

    return NextResponse.json({ items: rows })
  } catch (error) {
    console.error('Error listando pulseras:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
})

export const POST = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })
export const PUT = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })
export const DELETE = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })



