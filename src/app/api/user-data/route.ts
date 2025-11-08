import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getUserCompleteData, createAuditLog } from '@/lib/db-utils'
import { getClientIP } from '@/lib/security'
import { withCORS } from '@/lib/cors'

export const GET = withCORS(async (request: NextRequest) => {
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
    
    // Obtener datos completos del usuario
    const userData = await getUserCompleteData(user.userId)
    
    if (!userData) {
      await createAuditLog(
        'user_data_not_found',
        `Datos de usuario no encontrados: ${user.username}`,
        user.userId,
        ip,
        userAgent,
        { username: user.username, userId: user.userId }
      )
      
      return NextResponse.json(
        { error: 'Datos de usuario no encontrados' },
        { status: 404 }
      )
    }
    
    // Log del acceso a datos
    await createAuditLog(
      'user_data_accessed',
      `Acceso a datos personales: ${user.username}`,
      user.userId,
      ip,
      userAgent,
      { username: user.username }
    )
    
    // Retornar datos sin información sensible
    const response = {
      usuario: {
        id: userData.usuario.id,
        username: userData.usuario.username,
        is_active: userData.usuario.is_active,
        last_login: userData.usuario.last_login,
        created_at: userData.usuario.created_at,
        updated_at: userData.usuario.updated_at
      },
      datosPersonales: userData.datosPersonales,
      datosVitales: userData.datosVitales,
      contactosEmergencia: userData.contactosEmergencia,
      pulsera: userData.pulsera ? {
        id: userData.pulsera.id,
        serial: userData.pulsera.serial,
        is_active: userData.pulsera.is_active,
        public_url: userData.pulsera.public_url,
        created_at: userData.pulsera.created_at
      } : null
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Error en user-data GET:', error)
    
    // Log del error
    await createAuditLog(
      'user_data_error',
      'Error interno al obtener datos de usuario',
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
    
    // Obtener datos del body
    const body = await request.json()
    const { tipo, datos } = body
    
    if (!tipo || !datos) {
      return NextResponse.json(
        { error: 'Tipo y datos son requeridos' },
        { status: 400 }
      )
    }
    
    let updateResult
    
    switch (tipo) {
      case 'personales':
        updateResult = await updatePersonalData(user.userId, datos)
        break
      case 'vitales':
        updateResult = await updateVitalData(user.userId, datos)
        break
      case 'contactos':
        updateResult = await updateEmergencyContacts(user.userId, datos)
        break
      default:
        return NextResponse.json(
          { error: 'Tipo de datos no válido' },
          { status: 400 }
        )
    }
    
    if (!updateResult.success) {
      return NextResponse.json(
        { error: updateResult.error },
        { status: 400 }
      )
    }
    
    // Log de la actualización
    await createAuditLog(
      'user_data_updated',
      `Datos ${tipo} actualizados: ${user.username}`,
      user.userId,
      ip,
      userAgent,
      { username: user.username, tipo, datos: Object.keys(datos) }
    )
    
    return NextResponse.json({
      success: true,
      message: `Datos ${tipo} actualizados exitosamente`,
      data: updateResult.data
    })
    
  } catch (error) {
    console.error('Error en user-data PUT:', error)
    
    // Log del error
    await createAuditLog(
      'user_data_update_error',
      'Error interno al actualizar datos de usuario',
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

// Funciones helper para actualizar datos
async function updatePersonalData(userId: number, datos: any) {
  try {
    const { executeQuery } = await import('@/lib/database')
    
    const campos = Object.keys(datos).filter(key => 
      ['nombre', 'apellido', 'fecha_nacimiento', 'telefono', 'email'].includes(key)
    )
    
    if (campos.length === 0) {
      return { success: false, error: 'No hay campos válidos para actualizar' }
    }
    
    const setClause = campos.map(campo => `${campo} = ?`).join(', ')
    const values = campos.map(campo => datos[campo])
    values.push(userId)
    
    await executeQuery(
      `UPDATE datos_personales SET ${setClause} WHERE usuario_id = ?`,
      values
    )
    
    return { success: true, data: datos }
  } catch (error) {
    return { success: false, error: 'Error actualizando datos personales' }
  }
}

async function updateVitalData(userId: number, datos: any) {
  try {
    const { executeQuery } = await import('@/lib/database')
    
    const campos = Object.keys(datos).filter(key => 
      ['alergias', 'medicacion', 'enfermedades_cronicas', 'grupo_sanguineo', 'peso', 'altura', 'observaciones_medicas'].includes(key)
    )
    
    if (campos.length === 0) {
      return { success: false, error: 'No hay campos válidos para actualizar' }
    }
    
    const setClause = campos.map(campo => `${campo} = ?`).join(', ')
    const values = campos.map(campo => datos[campo])
    values.push(userId)
    
    await executeQuery(
      `UPDATE datos_vitales SET ${setClause} WHERE usuario_id = ?`,
      values
    )
    
    return { success: true, data: datos }
  } catch (error) {
    return { success: false, error: 'Error actualizando datos vitales' }
  }
}

async function updateEmergencyContacts(userId: number, contactos: any[]) {
  try {
    const { executeQuery } = await import('@/lib/database')
    
    // Eliminar contactos existentes
    await executeQuery(
      'DELETE FROM contactos_emergencia WHERE usuario_id = ?',
      [userId]
    )
    
    // Insertar nuevos contactos
    for (let i = 0; i < contactos.length; i++) {
      const contacto = contactos[i]
      await executeQuery(
        `INSERT INTO contactos_emergencia 
         (usuario_id, nombre, telefono, relacion, es_principal, orden, is_active)
         VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
        [
          userId,
          contacto.nombre,
          contacto.telefono,
          contacto.relacion || '',
          contacto.es_principal || false,
          i + 1
        ]
      )
    }
    
    return { success: true, data: contactos }
  } catch (error) {
    return { success: false, error: 'Error actualizando contactos de emergencia' }
  }
}

// Manejar otros métodos HTTP
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
