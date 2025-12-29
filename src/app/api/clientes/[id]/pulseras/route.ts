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
      `SELECT p.id, p.serial, p.is_active, p.public_url, p.created_at, p.updated_at,
              u.username AS usuario_username
       FROM pulseras p
       LEFT JOIN usuarios u ON u.pulsera_id = p.id
       WHERE p.id_cliente = $1
       ORDER BY p.created_at DESC`,
      [id]
    )

    return NextResponse.json({ items: rows })
  } catch (error) {
    console.error('Error listando pulseras del cliente:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
})

export const POST = withCORS(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const auth = requireAuth(request)
  if (!auth.user) {
    return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 })
  }
  if (auth.user.rol !== 'admin_sistema') {
    return NextResponse.json({ error: 'Permisos de administrador requeridos' }, { status: 403 })
  }

  const clienteId = Number(params.id)
  if (!clienteId || Number.isNaN(clienteId)) {
    return NextResponse.json({ error: 'ID de cliente inválido' }, { status: 400 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { pulsera_id } = body as { pulsera_id?: number }

    if (!pulsera_id || Number.isNaN(Number(pulsera_id))) {
      return NextResponse.json({ error: 'pulsera_id es requerido' }, { status: 400 })
    }

    // Verificar que la pulsera exista y no tenga cliente
    const { rows: pRows } = await executeQuery<{ id: number; id_cliente: number | null }>(
      `SELECT id, id_cliente FROM pulseras WHERE id = $1`,
      [pulsera_id]
    )
    const pulsera = pRows[0]
    if (!pulsera) {
      return NextResponse.json({ error: 'Pulsera no encontrada' }, { status: 404 })
    }
    if (pulsera.id_cliente && pulsera.id_cliente !== clienteId) {
      return NextResponse.json({ error: 'Pulsera ya asignada a otro cliente' }, { status: 409 })
    }
    if (pulsera.id_cliente === clienteId) {
      return NextResponse.json({ success: true, message: 'Pulsera ya asociada a este cliente' })
    }

    await executeQuery(
      `UPDATE pulseras SET id_cliente = $1, updated_at = NOW() WHERE id = $2`,
      [clienteId, pulsera_id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error asignando pulsera a cliente:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
})


