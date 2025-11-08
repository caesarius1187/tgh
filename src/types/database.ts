// Tipos para la base de datos

export interface Pulsera {
  id: number
  serial: string
  is_active: boolean
  public_url: string | null
  created_at: Date
  updated_at: Date
}

export interface Usuario {
  id: number
  username: string
  password_hash: string
  pulsera_id: number | null
  is_active: boolean
  last_login: Date | null
  created_at: Date
  updated_at: Date
}

export interface DatosPersonales {
  id: number
  usuario_id: number
  nombre: string
  apellido: string
  fecha_nacimiento: Date
  foto_url: string | null
  telefono: string | null
  email: string | null
  created_at: Date
  updated_at: Date
}

export interface DatosVitales {
  id: number
  usuario_id: number
  alergias: string | null
  medicacion: string | null
  enfermedades_cronicas: string | null
  grupo_sanguineo: string | null
  grupo_sanguineo_url: string | null
  peso: number | null
  altura: number | null
  observaciones_medicas: string | null
  created_at: Date
  updated_at: Date
}

export interface ContactoEmergencia {
  id: number
  usuario_id: number
  nombre: string
  telefono: string
  relacion: string | null
  es_principal: boolean
  orden: number
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface AuditoriaLog {
  id: number
  usuario_id: number | null
  evento: string
  descripcion: string | null
  ip_address: string | null
  user_agent: string | null
  datos_adicionales: any | null
  created_at: Date
}

export interface SesionUsuario {
  id: number
  usuario_id: number
  token_hash: string
  expires_at: Date
  ip_address: string | null
  user_agent: string | null
  is_active: boolean
  last_activity: Date
  created_at: Date
}

// Tipos para creación (sin campos auto-generados)
export interface CreatePulsera {
  serial: string
  is_active?: boolean
  public_url?: string | null
}

export interface CreateUsuario {
  username: string
  password_hash: string
  pulsera_id?: number | null
  is_active?: boolean
}

export interface CreateDatosPersonales {
  usuario_id: number
  nombre: string
  apellido: string
  fecha_nacimiento: Date
  foto_url?: string | null
  telefono?: string | null
  email?: string | null
}

export interface CreateDatosVitales {
  usuario_id: number
  alergias?: string | null
  medicacion?: string | null
  enfermedades_cronicas?: string | null
  grupo_sanguineo?: string | null
  grupo_sanguineo_url?: string | null
  peso?: number | null
  altura?: number | null
  observaciones_medicas?: string | null
}

export interface CreateContactoEmergencia {
  usuario_id: number
  nombre: string
  telefono: string
  relacion?: string | null
  es_principal?: boolean
  orden?: number
  is_active?: boolean
}

// Tipos para actualización (campos opcionales)
export interface UpdatePulsera {
  is_active?: boolean
  public_url?: string | null
}

export interface UpdateUsuario {
  username?: string
  password_hash?: string
  pulsera_id?: number | null
  is_active?: boolean
  last_login?: Date | null
}

export interface UpdateDatosPersonales {
  nombre?: string
  apellido?: string
  fecha_nacimiento?: Date
  foto_url?: string | null
  telefono?: string | null
  email?: string | null
}

export interface UpdateDatosVitales {
  alergias?: string | null
  medicacion?: string | null
  enfermedades_cronicas?: string | null
  grupo_sanguineo?: string | null
  grupo_sanguineo_url?: string | null
  peso?: number | null
  altura?: number | null
  observaciones_medicas?: string | null
}

export interface UpdateContactoEmergencia {
  nombre?: string
  telefono?: string
  relacion?: string | null
  es_principal?: boolean
  orden?: number
  is_active?: boolean
}
