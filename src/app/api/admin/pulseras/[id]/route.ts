import { NextRequest, NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'
import { executeQuery } from '@/lib/database'

export const runtime = 'nodejs'

const requireAdmin = (req: NextRequest): string | null => {
  const key = req.headers.get('x-admin-key')
  if (!process.env.ADMIN_API_KEY) return 'ADMIN_API_KEY no configurado'
  if (!key || key !== process.env.ADMIN_API_KEY) return 'Acceso restringido'
  return null
}

export const PATCH = withCORS(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const authError = requireAdmin(request)
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 })
  }

  const id = Number(params.id)
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { id_cliente = null } = body || {}

    if (id_cliente === null) {
      return NextResponse.json({ error: 'id_cliente requerido' }, { status: 400 })
    }

    // Verificar si la pulsera ya tiene cliente asignado
    const { rows } = await executeQuery<{ id_cliente: number | null }>(
      'SELECT id_cliente FROM pulseras WHERE id = $1',
      [id]
    )
    if (!rows.length) {
      return NextResponse.json({ error: 'Pulsera no encontrada' }, { status: 404 })
    }
    if (rows[0].id_cliente !== null) {
      return NextResponse.json({ error: 'La pulsera ya pertenece a un cliente y no puede transferirse' }, { status: 409 })
    }

    await executeQuery(
      'UPDATE pulseras SET id_cliente = $1, updated_at = NOW() WHERE id = $2',
      [id_cliente, id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error asignando cliente a pulsera:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
})

export const GET = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })
export const POST = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })
export const DELETE = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })





