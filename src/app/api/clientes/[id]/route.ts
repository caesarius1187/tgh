import { NextRequest, NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'
import { requireAuth } from '@/lib/auth'
import { executeQuery } from '@/lib/database'

type QueryValueLocal = string | number | boolean | Date | Buffer | null | undefined

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
      `SELECT id, nombre_legal, nombre_publico, slug, id_fiscal, contacto_email, telefono,
              direccion_linea1, direccion_linea2, direccion_ciudad, direccion_provincia, direccion_pais, direccion_cp,
              visibilidad, estado, creado_en, actualizado_en
       FROM clientes
       WHERE id = $1
       LIMIT 1`,
      [id]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ item: rows[0] })
  } catch (error) {
    console.error('Error obteniendo cliente:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
})

export const PATCH = withCORS(async (request: NextRequest, { params }: { params: { id: string } }) => {
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
    const body = await request.json().catch(() => ({}))
    const allowedFields = [
      'nombre_legal',
      'nombre_publico',
      'slug',
      'id_fiscal',
      'contacto_email',
      'telefono',
      'direccion_linea1',
      'direccion_linea2',
      'direccion_ciudad',
      'direccion_provincia',
      'direccion_pais',
      'direccion_cp',
      'visibilidad',
      'estado',
    ] as const

    const entries = Object.entries(body || {}).filter(([k]) => (allowedFields as readonly string[]).includes(k))
    if (entries.length === 0) {
      return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
    }

    const setClause = entries.map(([k], idx) => `${k} = $${idx + 1}`).join(', ')
    const values = entries.map(([, v]) => v) as QueryValueLocal[]

    await executeQuery(
      `UPDATE clientes SET ${setClause}, actualizado_en = NOW() WHERE id = $${values.length + 1}`,
      [...values, id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error actualizando cliente:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
})


