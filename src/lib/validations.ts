import { z } from 'zod'

// Esquemas de validación para formularios y APIs

/**
 * Validación para activación de pulsera
 */
export const validateSerialSchema = z.object({
  serial: z.string()
    .min(1, 'El serial es requerido')
    .max(50, 'El serial no puede exceder 50 caracteres')
    .regex(/^[A-Za-z0-9]+$/, 'El serial solo puede contener letras y números')
})

/**
 * Validación para registro de usuario
 */
export const registerUserSchema = z.object({
  username: z.string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(50, 'El nombre de usuario no puede exceder 50 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'El nombre de usuario solo puede contener letras, números y guiones bajos'),
  
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'La contraseña debe contener al menos un carácter especial'),
  
  serial: z.string()
    .min(1, 'El serial de la pulsera es requerido')
    .max(50, 'El serial no puede exceder 50 caracteres'),
  
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

/**
 * Validación para login
 */
export const loginSchema = z.object({
  username: z.string()
    .min(1, 'El nombre de usuario es requerido'),
  
  password: z.string()
    .min(1, 'La contraseña es requerida')
})

/**
 * Validación para datos personales
 */
export const personalDataSchema = z.object({
  nombre: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  
  apellido: z.string()
    .min(1, 'El apellido es requerido')
    .max(100, 'El apellido no puede exceder 100 caracteres'),
  
  fecha_nacimiento: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
    .refine((date) => {
      const birthDate = new Date(date)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      return age >= 0 && age <= 150
    }, 'Fecha de nacimiento inválida'),
  
  telefono: z.string()
    .regex(/^[\+]?[0-9\s\-\(\)]{10,20}$/, 'Formato de teléfono inválido')
    .optional()
    .or(z.literal('')),
  
  email: z.string()
    .email('Formato de email inválido')
    .optional()
    .or(z.literal(''))
})

/**
 * Validación para datos vitales
 */
export const vitalDataSchema = z.object({
  alergias: z.string()
    .max(1000, 'Las alergias no pueden exceder 1000 caracteres')
    .optional()
    .or(z.literal('')),
  
  medicacion: z.string()
    .max(1000, 'La medicación no puede exceder 1000 caracteres')
    .optional()
    .or(z.literal('')),
  
  enfermedades_cronicas: z.string()
    .max(1000, 'Las enfermedades crónicas no pueden exceder 1000 caracteres')
    .optional()
    .or(z.literal('')),
  
  grupo_sanguineo: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], {
    errorMap: () => ({ message: 'Grupo sanguíneo inválido' })
  }).optional()
    .or(z.literal('')),
  
  peso: z.number()
    .min(20, 'El peso debe ser mayor a 20 kg')
    .max(300, 'El peso debe ser menor a 300 kg')
    .optional(),
  
  altura: z.number()
    .min(100, 'La altura debe ser mayor a 100 cm')
    .max(250, 'La altura debe ser menor a 250 cm')
    .optional(),
  
  observaciones_medicas: z.string()
    .max(2000, 'Las observaciones médicas no pueden exceder 2000 caracteres')
    .optional()
    .or(z.literal(''))
})

/**
 * Validación para contacto de emergencia
 */
export const emergencyContactSchema = z.object({
  nombre: z.string()
    .min(1, 'El nombre del contacto es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  
  telefono: z.string()
    .regex(/^[\+]?[0-9\s\-\(\)]{10,20}$/, 'Formato de teléfono inválido'),
  
  relacion: z.string()
    .max(50, 'La relación no puede exceder 50 caracteres')
    .optional()
    .or(z.literal('')),
  
  es_principal: z.boolean().default(false),
  
  orden: z.number()
    .min(0, 'El orden debe ser mayor o igual a 0')
    .max(10, 'El orden debe ser menor o igual a 10')
    .default(0)
})

/**
 * Validación para actualización de datos personales
 */
export const updatePersonalDataSchema = personalDataSchema.partial()

/**
 * Validación para actualización de datos vitales
 */
export const updateVitalDataSchema = vitalDataSchema.partial()

/**
 * Validación para actualización de contacto de emergencia
 */
export const updateEmergencyContactSchema = emergencyContactSchema.partial()

/**
 * Validación para subida de archivos
 */
export const fileUploadSchema = z.object({
  type: z.enum(['foto', 'certificado_grupo_sanguineo'], {
    errorMap: () => ({ message: 'Tipo de archivo inválido' })
  }),
  
  size: z.number()
    .max(5 * 1024 * 1024, 'El archivo no puede exceder 5MB'),
  
  mimetype: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], {
    errorMap: () => ({ message: 'Tipo de archivo no permitido' })
  })
})

/**
 * Función helper para validar datos
 */
export const validateData = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => err.message)
      }
    }
    return {
      success: false,
      errors: ['Error de validación desconocido']
    }
  }
}

/**
 * Función helper para validar datos de forma segura
 */
export const safeValidate = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T | null => {
  try {
    return schema.parse(data)
  } catch (error) {
    console.error('Error de validación:', error)
    return null
  }
}
