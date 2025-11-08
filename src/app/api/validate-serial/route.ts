import { NextRequest, NextResponse } from 'next/server'
import { validateSerialSchema, validateData } from '@/lib/validations'
import { checkSerialExists, checkSerialActive, createAuditLog } from '@/lib/db-utils'
import { getClientIP } from '@/lib/security'
import { withCORS } from '@/lib/cors'

export const POST = withCORS(async (request: NextRequest) => {
  try {
    // Obtener datos del body
    const body = await request.json()
    
    // Validar datos de entrada
    const validation = validateData(validateSerialSchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validation.errors 
        },
        { status: 400 }
      )
    }
    
    const { serial } = validation.data
    const ip = getClientIP(request)
    const userAgent = request.headers.get('user-agent')
    
    // Verificar si el serial existe
    const serialExists = await checkSerialExists(serial)
    
    if (!serialExists) {
      // Log del intento con serial inexistente
      await createAuditLog(
        'serial_validation_failed',
        `Intento de validación con serial inexistente: ${serial}`,
        null,
        ip,
        userAgent,
        { serial, reason: 'serial_not_found' }
      )
      
      return NextResponse.json(
        { 
          valid: false,
          message: 'Serial no encontrado en el sistema'
        },
        { status: 404 }
      )
    }
    
    // Verificar si el serial ya está activado
    const isActive = await checkSerialActive(serial)
    
    if (isActive) {
      // Log del intento con serial ya activado
      await createAuditLog(
        'serial_validation_failed',
        `Intento de validación con serial ya activado: ${serial}`,
        null,
        ip,
        userAgent,
        { serial, reason: 'serial_already_active' }
      )
      
      return NextResponse.json(
        { 
          valid: false,
          message: 'Esta pulsera ya ha sido activada'
        },
        { status: 409 }
      )
    }
    
    // Serial válido y disponible
    await createAuditLog(
      'serial_validation_success',
      `Validación exitosa de serial: ${serial}`,
      null,
      ip,
      userAgent,
      { serial }
    )
    
    return NextResponse.json({
      valid: true,
      message: 'Serial válido y disponible para activación',
      serial
    })
    
  } catch (error) {
    console.error('Error en validate-serial:', error)
    
    // Log del error
    await createAuditLog(
      'serial_validation_error',
      'Error interno durante validación de serial',
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

export const PUT = () => {
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
