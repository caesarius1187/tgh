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
      `SELECT id, serial, is_active, public_url, id_cliente, created_at, updated_at
       FROM pulseras
       WHERE id_cliente IS NULL
       ORDER BY created_at DESC`
    )

    return NextResponse.json({ items: rows })
  } catch (error) {
    console.error('Error listando pulseras disponibles:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
})



