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

export const POST = withCORS(async (request: NextRequest) => {
  const authError = requireAdmin(request)
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 })
  }

  try {
    const body = await request.json()
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
      visibilidad = 'publico'
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
         direccion_linea1, direccion_linea2, direccion_ciudad, direccion_provincia, direccion_pais, direccion_cp, visibilidad)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id
      `,
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
        visibilidad
      ]
    )

    return NextResponse.json({ id: rows[0].id }, { status: 201 })
  } catch (error) {
    console.error('Error creando cliente:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
})

export const GET = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })
export const PUT = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })
export const DELETE = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })





