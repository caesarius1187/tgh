import { NextRequest, NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'
import { requireAuth } from '@/lib/auth'
import { executeQuery } from '@/lib/database'

export const runtime = 'nodejs'

export const GET = withCORS(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const auth = requireAuth(request)
  if (!auth.user) {
    return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 })
  }
  if (auth.user.rol !== 'admin_sistema') {
    return NextResponse.json({ error: 'Permisos de administrador requeridos' }, { status: 403 })
  }

  const id = Number(params.id)
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  try {
    const { rows } = await executeQuery(
      `SELECT id, username, rol, is_active, last_login, created_at
       FROM usuarios
       WHERE id_cliente = $1
       ORDER BY created_at DESC`,
      [id]
    )

    return NextResponse.json({ items: rows })
  } catch (error) {
    console.error('Error listando usuarios del cliente:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
})



