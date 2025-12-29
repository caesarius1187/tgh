import { NextRequest, NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'
import { executeQuery } from '@/lib/database'

type QueryValueLocal = string | number | boolean | Date | Buffer | null | undefined

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
    const allowedFields = [
      'nombre_legal','nombre_publico','slug','id_fiscal','contacto_email','telefono',
      'direccion_linea1','direccion_linea2','direccion_ciudad','direccion_provincia','direccion_pais','direccion_cp',
      'visibilidad','estado'
    ]

    const entries = Object.entries(body || {}).filter(([k]) => allowedFields.includes(k))
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
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
})

export const GET = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })
export const POST = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })
export const DELETE = () => NextResponse.json({ error: 'Método no permitido' }, { status: 405 })




