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
      `SELECT id, nombre_legal, nombre_publico, slug, visibilidad, estado, creado_en, actualizado_en
       FROM clientes
       ORDER BY creado_en DESC`
    )

    return NextResponse.json({ items: rows })
  } catch (error) {
    console.error('Error listando clientes:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
})

export const POST = withCORS(async (request: NextRequest) => {
  const auth = requireAuth(request)
  if (!auth.user) {
    return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: 401 })
  }

  if (auth.user.rol !== 'admin_sistema') {
    return NextResponse.json({ error: 'Permisos de administrador requeridos' }, { status: 403 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const {
      nombre_legal,
      nombre_publico,
      slug,
      id_fiscal = null,
      contacto_email = null,
      telefono = null,
      direccion_linea1 = null,
      direccion_linea2 = null,
      direccion_ciudad = null,
      direccion_provincia = null,
      direccion_pais = null,
      direccion_cp = null,
      visibilidad = 'publico',
    } = body || {}

    if (!nombre_legal || !nombre_publico || !slug) {
      return NextResponse.json(
        { error: 'nombre_legal, nombre_publico y slug son obligatorios' },
        { status: 400 }
      )
    }

    const { rows } = await executeQuery<{ id: number }>(
      `INSERT INTO clientes
        (nombre_legal, nombre_publico, slug, id_fiscal, contacto_email, telefono,
         direccion_linea1, direccion_linea2, direccion_ciudad, direccion_provincia, direccion_pais, direccion_cp, visibilidad, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'activo')
       RETURNING id`,
      [
        nombre_legal,
        nombre_publico,
        slug,
        id_fiscal,
        contacto_email,
        telefono,
        direccion_linea1,
        direccion_linea2,
        direccion_ciudad,
        direccion_provincia,
        direccion_pais,
        direccion_cp,
        visibilidad,
      ]
    )

    return NextResponse.json({ id: rows[0].id }, { status: 201 })
  } catch (error) {
    console.error('Error creando cliente:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
})
export const PUT = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })
export const DELETE = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })


