import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth'
import { executeQuery } from '@/lib/database'
import { createAuditLog } from '@/lib/db-utils'
import { getClientIP } from '@/lib/security'
import { withCORS } from '@/lib/cors'

export const runtime = 'nodejs'

type IdRow = { id: number }
type NextOrderRow = { next_orden: number }

type PersonalDataPayload = {
  nombre: string
  apellido: string
  fecha_nacimiento: string
  telefono: string
  email: string
}

type VitalDataPayload = {
  grupo_sanguineo?: string
  alergias?: string
  medicacion?: string
  enfermedades_cronicas?: string
  peso?: number | null
  altura?: number | null
  observaciones_medicas?: string
}

type ContactDataPayload = {
  id?: number
  nombre: string
  telefono: string
  relacion?: string
  es_principal?: boolean
}

type UpdateRequestPayload =
  | { tipo: 'personal'; datos: PersonalDataPayload }
  | { tipo: 'vitales'; datos: VitalDataPayload }
  | { tipo: 'contacto'; datos: ContactDataPayload }

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isPersonalDataPayload = (value: unknown): value is PersonalDataPayload => {
  if (!isObject(value)) return false
  const { nombre, apellido, fecha_nacimiento, telefono, email } = value
  return [nombre, apellido, fecha_nacimiento, telefono, email].every(field => typeof field === 'string')
}

const isVitalDataPayload = (value: unknown): value is VitalDataPayload => {
  if (!isObject(value)) return false
  const allowedKeys = [
    'grupo_sanguineo',
    'alergias',
    'medicacion',
    'enfermedades_cronicas',
    'peso',
    'altura',
    'observaciones_medicas'
  ]
  return Object.keys(value).every(key => allowedKeys.includes(key))
}

const isContactDataPayload = (value: unknown): value is ContactDataPayload => {
  if (!isObject(value)) return false
  const { nombre, telefono } = value
  return typeof nombre === 'string' && typeof telefono === 'string'
}

const isUpdateRequestPayload = (value: unknown): value is UpdateRequestPayload => {
  if (!isObject(value)) return false
  const { tipo, datos } = value as { tipo?: unknown; datos?: unknown }

  switch (tipo) {
    case 'personal':
      return isPersonalDataPayload(datos)
    case 'vitales':
      return isVitalDataPayload(datos)
    case 'contacto':
      return isContactDataPayload(datos)
    default:
      return false
  }
}

export const PUT = withCORS(async (request: NextRequest) => {
  try {
    // Verificar autenticación
    const authResult = requireAuth(request)
    
    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'No autorizado' },
        { status: 401 }
      )
    }
    
    const { user } = authResult
    const ip = getClientIP(request)
    const userAgent = request.headers.get('user-agent')
    
    // Obtener datos del cuerpo de la petición
    const body = await request.json()
    
    if (!isUpdateRequestPayload(body)) {
      return NextResponse.json(
        { error: 'Tipo y datos son requeridos' },
        { status: 400 }
      )
    }
    
    const { tipo, datos } = body
    
    let auditDescription = ''
    
    if (tipo === 'personal') {
      const { nombre, apellido, fecha_nacimiento, telefono, email } = datos
      
      // Verificar si ya existen datos personales
      const { rows: existingData } = await executeQuery<IdRow>(
        'SELECT id FROM datos_personales WHERE usuario_id = $1',
        [user.userId]
      )
      
      if (existingData.length > 0) {
        // Actualizar datos existentes
        await executeQuery(
          'UPDATE datos_personales SET nombre = $1, apellido = $2, fecha_nacimiento = $3, telefono = $4, email = $5 WHERE usuario_id = $6',
          [nombre, apellido, fecha_nacimiento, telefono, email, user.userId]
        )
      } else {
        // Crear nuevos datos personales
        await executeQuery(
          'INSERT INTO datos_personales (usuario_id, nombre, apellido, fecha_nacimiento, telefono, email) VALUES ($1, $2, $3, $4, $5, $6)',
          [user.userId, nombre, apellido, fecha_nacimiento, telefono, email]
        )
      }
      
      auditDescription = `Datos personales actualizados: ${nombre} ${apellido}`
      
    } else if (tipo === 'vitales') {
      const { grupo_sanguineo, alergias, medicacion, enfermedades_cronicas, peso, altura } = datos
      
      // Verificar si ya existen datos vitales
      const { rows: existingData } = await executeQuery<IdRow>(
        'SELECT id FROM datos_vitales WHERE usuario_id = $1',
        [user.userId]
      )
      
      if (existingData.length > 0) {
        // Actualizar datos existentes
        await executeQuery(
          'UPDATE datos_vitales SET grupo_sanguineo = $1, alergias = $2, medicacion = $3, enfermedades_cronicas = $4, peso = $5, altura = $6 WHERE usuario_id = $7',
          [grupo_sanguineo, alergias, medicacion, enfermedades_cronicas, peso, altura, user.userId]
        )
      } else {
        // Crear nuevos datos vitales
        await executeQuery(
          'INSERT INTO datos_vitales (usuario_id, grupo_sanguineo, alergias, medicacion, enfermedades_cronicas, peso, altura) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [user.userId, grupo_sanguineo, alergias, medicacion, enfermedades_cronicas, peso, altura]
        )
      }
      
      auditDescription = `Datos vitales actualizados: grupo ${grupo_sanguineo}`
      
    } else if (tipo === 'contacto') {
      const { id, nombre, telefono, relacion, es_principal } = datos
      
      if (id) {
        // Actualizar contacto existente
        await executeQuery(
          'UPDATE contactos_emergencia SET nombre = $1, telefono = $2, relacion = $3, es_principal = $4 WHERE id = $5 AND usuario_id = $6',
          [nombre, telefono, relacion, es_principal, id, user.userId]
        )
        auditDescription = `Contacto de emergencia actualizado: ${nombre}`
      } else {
        // Crear nuevo contacto
        const { rows: orden } = await executeQuery<NextOrderRow>(
          'SELECT COALESCE(MAX(orden), 0) + 1 as next_orden FROM contactos_emergencia WHERE usuario_id = $1',
          [user.userId]
        )
        
        await executeQuery(
          'INSERT INTO contactos_emergencia (usuario_id, nombre, telefono, relacion, es_principal, orden) VALUES ($1, $2, $3, $4, $5, $6)',
          [user.userId, nombre, telefono, relacion, es_principal ?? false, orden[0]?.next_orden ?? 1]
        )
        auditDescription = `Nuevo contacto de emergencia agregado: ${nombre}`
      }
      
    } else {
      return NextResponse.json(
        { error: 'Tipo de datos no válido' },
        { status: 400 }
      )
    }
    
    // Log de la actualización
    await createAuditLog(
      'user_data_updated',
      auditDescription,
      user.userId,
      ip,
      userAgent,
      { tipo, datos }
    )
    
    return NextResponse.json({
      success: true,
      message: 'Datos actualizados exitosamente'
    })
    
  } catch (error) {
    console.error('Error en update-user-data:', error)
    
    // Log del error
    await createAuditLog(
      'user_data_update_error',
      'Error interno durante actualización de datos',
      null,
      getClientIP(request),
      request.headers.get('user-agent'),
      { error: error instanceof Error ? error.message : 'Unknown error' }
    )
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

// Manejar otros métodos HTTP
export const GET = () => {
  return NextResponse.json(
    { error: 'Método no permitido' },
    { status: 405 }
  )
}

export const POST = () => {
  return NextResponse.json(
    { error: 'Método no permitido' },
    { status: 405 }
  )
}

export const DELETE = () => {
  return NextResponse.json(
    { error: 'Método no permitido' },
    { status: 405 }
  )
}
