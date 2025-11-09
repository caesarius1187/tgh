import { executeQuery } from './database'
export { executeQuery } from './database'

import type {
  Usuario,
  DatosPersonales,
  DatosVitales,
  ContactoEmergencia,
  Pulsera
} from '@/types/database'

type CountRow = { count: number }
type SerialActiveRow = { is_active: boolean }
type UsuarioRow = Usuario
type DatosPersonalesRow = DatosPersonales
type DatosVitalesRow = DatosVitales
type ContactoEmergenciaRow = ContactoEmergencia
type PulseraRow = Pulsera

interface NFCPublicDataRow {
  nombre: string | null
  apellido: string | null
  fecha_nacimiento: string | null
  foto_url: string | null
  alergias: string | null
  medicacion: string | null
  enfermedades_cronicas: string | null
  grupo_sanguineo: string | null
  peso: number | null
  altura: number | null
  observaciones_medicas: string | null
  contacto_nombre: string | null
  contacto_telefono: string | null
  contacto_relacion: string | null
  es_principal: boolean | null
  grupo_sanguineo_url: string | null
}

interface DatabaseStatsRow {
  total_pulseras: number
  pulseras_activas: number
  total_usuarios: number
  usuarios_activos: number
  contactos_emergencia: number
  sesiones_activas: number
}

export interface UserCompleteData {
  usuario: Usuario
  datosPersonales: DatosPersonales | null
  datosVitales: DatosVitales | null
  contactosEmergencia: ContactoEmergencia[]
  pulsera: Pulsera | null
}

export interface NFCPublicData {
  datosPersonales: {
    nombre: string | null
    apellido: string | null
    fecha_nacimiento: string | null
    foto_url: string | null
    peso: number | null
    altura: number | null
  } | null
  datosVitales: {
    alergias: string | null
    medicacion: string | null
    enfermedades_cronicas: string | null
    grupo_sanguineo: string | null
    observaciones_medicas: string | null
    grupo_sanguineo_url: string | null
  } | null
  contactosEmergencia: Array<{
    nombre: string
    telefono: string
    relacion: string | null
    es_principal: boolean
  }>
}

const castCount = (row?: { count: unknown }): number =>
  typeof row?.count === 'number' ? row.count : Number(row?.count ?? 0)

/**
 * Verificar si un serial de pulsera existe
 */
export const checkSerialExists = async (serial: string): Promise<boolean> => {
  try {
    const { rows } = await executeQuery<CountRow>(
      'SELECT COUNT(*)::int AS count FROM pulseras WHERE serial = $1',
      [serial]
    )
    return castCount(rows[0]) > 0
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
    const { rows } = await executeQuery<SerialActiveRow>(
      'SELECT is_active FROM pulseras WHERE serial = $1',
      [serial]
    )
    return rows[0]?.is_active ?? false
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
    const { rows } = await executeQuery<CountRow>(
      'SELECT COUNT(*)::int AS count FROM usuarios WHERE username = $1',
      [username]
    )
    return castCount(rows[0]) > 0
  } catch (error) {
    console.error('Error verificando username:', error)
    return false
  }
}

/**
 * Obtener usuario por username
 */
export const getUserByUsername = async (username: string): Promise<Usuario | null> => {
  try {
    const { rows } = await executeQuery<UsuarioRow>(
      'SELECT * FROM usuarios WHERE username = $1 AND is_active = TRUE',
      [username]
    )
    return rows[0] ?? null
  } catch (error) {
    console.error('Error obteniendo usuario:', error)
    return null
  }
}

/**
 * Obtener datos completos de un usuario por ID
 */
export const getUserCompleteData = async (userId: number): Promise<UserCompleteData | null> => {
  try {
    const { rows: users } = await executeQuery<UsuarioRow>(
      'SELECT * FROM usuarios WHERE id = $1',
      [userId]
    )

    const user = users[0]

    if (!user) {
      return null
    }

    const { rows: personalData } = await executeQuery<DatosPersonalesRow>(
      'SELECT * FROM datos_personales WHERE usuario_id = $1',
      [userId]
    )

    const { rows: vitalData } = await executeQuery<DatosVitalesRow>(
      'SELECT * FROM datos_vitales WHERE usuario_id = $1',
      [userId]
    )

    const { rows: contactRows } = await executeQuery<ContactoEmergenciaRow>(
      'SELECT * FROM contactos_emergencia WHERE usuario_id = $1 AND is_active = TRUE ORDER BY orden',
      [userId]
    )

    const pulseraRows = user.pulsera_id
      ? await executeQuery<PulseraRow>(
          'SELECT * FROM pulseras WHERE id = $1',
          [user.pulsera_id]
        )
      : null

    return {
      usuario: user,
      datosPersonales: personalData[0] ?? null,
      datosVitales: vitalData[0] ?? null,
      contactosEmergencia: contactRows,
      pulsera: pulseraRows ? pulseraRows.rows[0] ?? null : null
    }
  } catch (error) {
    console.error('Error obteniendo datos completos del usuario:', error)
    return null
  }
}

/**
 * Obtener datos públicos para NFC por serial
 */
export const getNFCPublicData = async (serial: string): Promise<NFCPublicData | null> => {
  try {
    const { rows } = await executeQuery<NFCPublicDataRow>(
      `
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
        ce.nombre AS contacto_nombre,
        ce.telefono AS contacto_telefono,
        ce.relacion AS contacto_relacion,
        ce.es_principal,
        dv.grupo_sanguineo_url
      FROM pulseras p
      JOIN usuarios u ON p.id = u.pulsera_id
      LEFT JOIN datos_personales dp ON u.id = dp.usuario_id
      LEFT JOIN datos_vitales dv ON u.id = dv.usuario_id
      LEFT JOIN contactos_emergencia ce ON u.id = ce.usuario_id AND ce.is_active = TRUE
      WHERE p.serial = $1 AND p.is_active = TRUE AND u.is_active = TRUE
      ORDER BY ce.es_principal DESC NULLS LAST, ce.orden
    `,
      [serial]
    )

    if (!rows.length) {
      return null
    }

    const userData = rows[0]
    const contacts = rows
      .filter(row => Boolean(row.contacto_nombre))
      .map(row => ({
        nombre: row.contacto_nombre as string,
        telefono: row.contacto_telefono as string,
        relacion: row.contacto_relacion,
        es_principal: Boolean(row.es_principal)
      }))

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
        observaciones_medicas: userData.observaciones_medicas,
        grupo_sanguineo_url: userData.grupo_sanguineo_url
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
  datosAdicionales: unknown = null
) => {
  try {
    const serializedData =
      datosAdicionales === null || datosAdicionales === undefined
        ? null
        : JSON.stringify(datosAdicionales)

    await executeQuery(
      `
      INSERT INTO auditoria_logs 
      (usuario_id, evento, descripcion, ip_address, user_agent, datos_adicionales)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [usuarioId, evento, descripcion, ipAddress, userAgent, serializedData]
    )
  } catch (error) {
    console.error('Error creando log de auditoría:', error)
  }
}

/**
 * Limpiar sesiones expiradas
 */
export const cleanExpiredSessions = async () => {
  try {
    const { rowCount } = await executeQuery(
      'DELETE FROM sesiones_usuarios WHERE expires_at < NOW()'
    )
    return rowCount ?? 0
  } catch (error) {
    console.error('Error limpiando sesiones expiradas:', error)
    return 0
  }
}

/**
 * Obtener estadísticas de la base de datos
 */
export const getDatabaseStats = async (): Promise<DatabaseStatsRow | null> => {
  try {
    const { rows } = await executeQuery<DatabaseStatsRow>(
      `
      SELECT 
        (SELECT COUNT(*)::int FROM pulseras) AS total_pulseras,
        (SELECT COUNT(*)::int FROM pulseras WHERE is_active = TRUE) AS pulseras_activas,
        (SELECT COUNT(*)::int FROM usuarios) AS total_usuarios,
        (SELECT COUNT(*)::int FROM usuarios WHERE is_active = TRUE) AS usuarios_activos,
        (SELECT COUNT(*)::int FROM contactos_emergencia WHERE is_active = TRUE) AS contactos_emergencia,
        (SELECT COUNT(*)::int FROM sesiones_usuarios WHERE is_active = TRUE) AS sesiones_activas
    `
    );

    return rows[0] ?? null
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error)
    return null
  }
}

