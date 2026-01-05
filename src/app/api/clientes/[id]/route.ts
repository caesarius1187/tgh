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
    return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  }

  try {
    const { rows } = await executeQuery(
      `SELECT id, nombre_legal, nombre_publico, slug, id_fiscal, contacto_email, telefono,
              direccion_linea1, direccion_linea2, direccion_ciudad, direccion_provincia, direccion_pais, direccion_cp,
              visibilidad, estado, creado_en, actualizado_en
         FROM clientes
        WHERE id = $1`,
      [id]
    )

    if (!rows.length) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('Error obteniendo cliente:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
})

export const POST = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })
export const PUT = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })
export const PATCH = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })
export const DELETE = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })

