import { executeQuery } from './database'
export { executeQuery } from './database'

// Utilidades para operaciones comunes de base de datos

/**
 * Verificar si un serial de pulsera existe
 */
export const checkSerialExists = async (serial: string): Promise<boolean> => {
  try {
    const result = await executeQuery<Array<{ count: number }>>(
      'SELECT COUNT(*) as count FROM pulseras WHERE serial = ?',
      [serial]
    )
    return result[0]?.count > 0
  } catch (error) {
    console.error('Error verificando serial:', error)
    return false
  }
}

/**
 * Verificar si un serial está activado
 */
export const checkSerialActive = async (serial: string): Promise<boolean> => {
  try {
    const result = await executeQuery<Array<{ is_active: boolean }>>(
      'SELECT is_active FROM pulseras WHERE serial = ?',
      [serial]
    )
    return result[0]?.is_active || false
  } catch (error) {
    console.error('Error verificando estado de activación:', error)
    return false
  }
}

/**
 * Verificar si un username existe
 */
export const checkUsernameExists = async (username: string): Promise<boolean> => {
  try {
    const result = await executeQuery<Array<{ count: number }>>(
      'SELECT COUNT(*) as count FROM usuarios WHERE username = ?',
      [username]
    )
    return result[0]?.count > 0
  } catch (error) {
    console.error('Error verificando username:', error)
    return false
  }
}

/**
 * Obtener usuario por username
 */
export const getUserByUsername = async (username: string) => {
  try {
    const result = await executeQuery(
      'SELECT * FROM usuarios WHERE username = ? AND is_active = TRUE',
      [username]
    )
    return result[0] || null
  } catch (error) {
    console.error('Error obteniendo usuario:', error)
    return null
  }
}

/**
 * Obtener datos completos de un usuario por ID
 */
export const getUserCompleteData = async (userId: number) => {
  try {
    const user = await executeQuery(
      'SELECT * FROM usuarios WHERE id = ?',
      [userId]
    )
    
    if (!user[0]) return null
    
    const personalData = await executeQuery(
      'SELECT * FROM datos_personales WHERE usuario_id = ?',
      [userId]
    )
    
    const vitalData = await executeQuery(
      'SELECT * FROM datos_vitales WHERE usuario_id = ?',
      [userId]
    )
    
    const emergencyContacts = await executeQuery(
      'SELECT * FROM contactos_emergencia WHERE usuario_id = ? AND is_active = TRUE ORDER BY orden',
      [userId]
    )
    
    const pulsera = user[0].pulsera_id ? await executeQuery(
      'SELECT * FROM pulseras WHERE id = ?',
      [user[0].pulsera_id]
    ) : null
    
    return {
      usuario: user[0],
      datosPersonales: personalData[0] || null,
      datosVitales: vitalData[0] || null,
      contactosEmergencia: emergencyContacts || [],
      pulsera: pulsera ? pulsera[0] : null
    }
  } catch (error) {
    console.error('Error obteniendo datos completos del usuario:', error)
    return null
  }
}

/**
 * Obtener datos públicos para NFC por serial
 */
export const getNFCPublicData = async (serial: string) => {
  try {
    const result = await executeQuery(`
      SELECT 
        dp.nombre,
        dp.apellido,
        dp.fecha_nacimiento,
        dp.foto_url,
        dv.alergias,
        dv.medicacion,
        dv.enfermedades_cronicas,
        dv.grupo_sanguineo,
        dv.peso,
        dv.altura,
        dv.observaciones_medicas,
        ce.nombre as contacto_nombre,
        ce.telefono as contacto_telefono,
        ce.relacion as contacto_relacion,
        ce.es_principal
      FROM pulseras p
      JOIN usuarios u ON p.id = u.pulsera_id
      LEFT JOIN datos_personales dp ON u.id = dp.usuario_id
      LEFT JOIN datos_vitales dv ON u.id = dv.usuario_id
      LEFT JOIN contactos_emergencia ce ON u.id = ce.usuario_id AND ce.is_active = TRUE
      WHERE p.serial = ? AND p.is_active = TRUE AND u.is_active = TRUE
      ORDER BY ce.es_principal DESC, ce.orden
    `, [serial])
    
    if (!result.length) return null
    
    // Organizar los datos
    const userData = result[0]
    const contacts = result.map(row => ({
      nombre: row.contacto_nombre,
      telefono: row.contacto_telefono,
      relacion: row.contacto_relacion,
      es_principal: row.es_principal
    })).filter(contact => contact.nombre) // Filtrar contactos válidos
    
    return {
      datosPersonales: {
        nombre: userData.nombre,
        apellido: userData.apellido,
        fecha_nacimiento: userData.fecha_nacimiento,
        foto_url: userData.foto_url,
        peso: userData.peso,
        altura: userData.altura
      },
      datosVitales: {
        alergias: userData.alergias,
        medicacion: userData.medicacion,
        enfermedades_cronicas: userData.enfermedades_cronicas,
        grupo_sanguineo: userData.grupo_sanguineo,
        observaciones_medicas: userData.observaciones_medicas
      },
      contactosEmergencia: contacts
    }
  } catch (error) {
    console.error('Error obteniendo datos públicos NFC:', error)
    return null
  }
}

/**
 * Crear log de auditoría
 */
export const createAuditLog = async (
  evento: string,
  descripcion: string | null = null,
  usuarioId: number | null = null,
  ipAddress: string | null = null,
  userAgent: string | null = null,
  datosAdicionales: any = null
) => {
  try {
    await executeQuery(`
      INSERT INTO auditoria_logs 
      (usuario_id, evento, descripcion, ip_address, user_agent, datos_adicionales)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [usuarioId, evento, descripcion, ipAddress, userAgent, JSON.stringify(datosAdicionales)])
  } catch (error) {
    console.error('Error creando log de auditoría:', error)
  }
}

/**
 * Limpiar sesiones expiradas
 */
export const cleanExpiredSessions = async () => {
  try {
    const result = await executeQuery(
      'DELETE FROM sesiones_usuarios WHERE expires_at < NOW()'
    )
    return result.affectedRows || 0
  } catch (error) {
    console.error('Error limpiando sesiones expiradas:', error)
    return 0
  }
}

/**
 * Obtener estadísticas de la base de datos
 */
export const getDatabaseStats = async () => {
  try {
    const stats = await executeQuery(`
      SELECT 
        (SELECT COUNT(*) FROM pulseras) as total_pulseras,
        (SELECT COUNT(*) FROM pulseras WHERE is_active = TRUE) as pulseras_activas,
        (SELECT COUNT(*) FROM usuarios) as total_usuarios,
        (SELECT COUNT(*) FROM usuarios WHERE is_active = TRUE) as usuarios_activos,
        (SELECT COUNT(*) FROM contactos_emergencia WHERE is_active = TRUE) as contactos_emergencia,
        (SELECT COUNT(*) FROM sesiones_usuarios WHERE is_active = TRUE) as sesiones_activas
    `)
    
    return stats[0] || {}
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error)
    return {}
  }
}
