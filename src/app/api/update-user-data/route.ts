import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { executeQuery } from '@/lib/database'
import { createAuditLog } from '@/lib/db-utils'
import { getClientIP } from '@/lib/security'
import { withCORS } from '@/lib/cors'

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
    const { tipo, datos } = body
    
    if (!tipo || !datos) {
      return NextResponse.json(
        { error: 'Tipo y datos son requeridos' },
        { status: 400 }
      )
    }
    
    let updateResult
    let auditDescription = ''
    
    if (tipo === 'personal') {
      const { nombre, apellido, fecha_nacimiento, telefono, email } = datos
      
      // Verificar si ya existen datos personales
      const existingData = await executeQuery(
        'SELECT id FROM datos_personales WHERE usuario_id = ?',
        [user.userId]
      )
      
      if (existingData && (existingData as any[]).length > 0) {
        // Actualizar datos existentes
        updateResult = await executeQuery(
          'UPDATE datos_personales SET nombre = ?, apellido = ?, fecha_nacimiento = ?, telefono = ?, email = ? WHERE usuario_id = ?',
          [nombre, apellido, fecha_nacimiento, telefono, email, user.userId]
        )
      } else {
        // Crear nuevos datos personales
        updateResult = await executeQuery(
          'INSERT INTO datos_personales (usuario_id, nombre, apellido, fecha_nacimiento, telefono, email) VALUES (?, ?, ?, ?, ?, ?)',
          [user.userId, nombre, apellido, fecha_nacimiento, telefono, email]
        )
      }
      
      auditDescription = `Datos personales actualizados: ${nombre} ${apellido}`
      
    } else if (tipo === 'vitales') {
      const { grupo_sanguineo, alergias, medicacion, enfermedades_cronicas, peso, altura } = datos
      
      // Verificar si ya existen datos vitales
      const existingData = await executeQuery(
        'SELECT id FROM datos_vitales WHERE usuario_id = ?',
        [user.userId]
      )
      
      if (existingData && (existingData as any[]).length > 0) {
        // Actualizar datos existentes
        updateResult = await executeQuery(
          'UPDATE datos_vitales SET grupo_sanguineo = ?, alergias = ?, medicacion = ?, enfermedades_cronicas = ?, peso = ?, altura = ? WHERE usuario_id = ?',
          [grupo_sanguineo, alergias, medicacion, enfermedades_cronicas, peso, altura, user.userId]
        )
      } else {
        // Crear nuevos datos vitales
        updateResult = await executeQuery(
          'INSERT INTO datos_vitales (usuario_id, grupo_sanguineo, alergias, medicacion, enfermedades_cronicas, peso, altura) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [user.userId, grupo_sanguineo, alergias, medicacion, enfermedades_cronicas, peso, altura]
        )
      }
      
      auditDescription = `Datos vitales actualizados: grupo ${grupo_sanguineo}`
      
    } else if (tipo === 'contacto') {
      const { id, nombre, telefono, relacion, es_principal } = datos
      
      if (id) {
        // Actualizar contacto existente
        updateResult = await executeQuery(
          'UPDATE contactos_emergencia SET nombre = ?, telefono = ?, relacion = ?, es_principal = ? WHERE id = ? AND usuario_id = ?',
          [nombre, telefono, relacion, es_principal, id, user.userId]
        )
        auditDescription = `Contacto de emergencia actualizado: ${nombre}`
      } else {
        // Crear nuevo contacto
        const orden = await executeQuery(
          'SELECT COALESCE(MAX(orden), 0) + 1 as next_orden FROM contactos_emergencia WHERE usuario_id = ?',
          [user.userId]
        )
        
        updateResult = await executeQuery(
          'INSERT INTO contactos_emergencia (usuario_id, nombre, telefono, relacion, es_principal, orden) VALUES (?, ?, ?, ?, ?, ?)',
          [user.userId, nombre, telefono, relacion, es_principal, (orden as any)[0].next_orden]
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
