import { NextRequest, NextResponse } from 'next/server'
import { getNFCPublicData, createAuditLog } from '@/lib/db-utils'
import { getClientIP } from '@/lib/security'
import { withCORS } from '@/lib/cors'

export const GET = withCORS(async (
  request: NextRequest,
  { params }: { params: { serial: string } }
) => {
  try {
    const { serial } = params
    const ip = getClientIP(request)
    const userAgent = request.headers.get('user-agent')
    
    // Validar que el serial no esté vacío
    if (!serial || serial.trim() === '') {
      await createAuditLog(
        'nfc_access_failed',
        'Intento de acceso NFC con serial vacío',
        null,
        ip,
        userAgent,
        { serial: serial || 'empty', reason: 'empty_serial' }
      )
      
      return NextResponse.json(
        { error: 'Serial de pulsera requerido' },
        { status: 400 }
      )
    }
    
    // Obtener datos públicos para NFC
    const nfcData = await getNFCPublicData(serial.trim())
    
    if (!nfcData) {
      await createAuditLog(
        'nfc_access_failed',
        `Intento de acceso NFC con serial inexistente o inactivo: ${serial}`,
        null,
        ip,
        userAgent,
        { serial, reason: 'serial_not_found_or_inactive' }
      )
      
      return NextResponse.json(
        { 
          error: 'Pulsera no encontrada o no activada',
          message: 'Esta pulsera no está registrada en el sistema o no ha sido activada'
        },
        { status: 404 }
      )
    }
    
    // Log del acceso exitoso
    await createAuditLog(
      'nfc_access_success',
      `Acceso público NFC exitoso: ${serial}`,
      null,
      ip,
      userAgent,
      { 
        serial,
        hasPersonalData: !!nfcData.datosPersonales,
        hasVitalData: !!nfcData.datosVitales,
        contactsCount: nfcData.contactosEmergencia?.length || 0
      }
    )
    
    // Preparar respuesta optimizada para móviles
    const response = {
      success: true,
      serial,
      timestamp: new Date().toISOString(),
      data: {
        // Datos personales básicos
        persona: nfcData.datosPersonales ? {
          nombre: nfcData.datosPersonales.nombre,
          apellido: nfcData.datosPersonales.apellido,
          edad: nfcData.datosPersonales.fecha_nacimiento ? 
            calcularEdad(nfcData.datosPersonales.fecha_nacimiento) : null,
          foto: nfcData.datosPersonales.foto_url,
          peso: nfcData.datosPersonales.peso,
          altura: nfcData.datosPersonales.altura
        } : null,
        
        // Información médica vital
        medica: nfcData.datosVitales ? {
          grupo_sanguineo: nfcData.datosVitales.grupo_sanguineo,
          alergias: nfcData.datosVitales.alergias,
          medicacion: nfcData.datosVitales.medicacion,
          enfermedades_cronicas: nfcData.datosVitales.enfermedades_cronicas,
          observaciones: nfcData.datosVitales.observaciones_medicas,
          certificado_grupo_sanguineo: nfcData.datosVitales.grupo_sanguineo_url
        } : null,
        
        // Contactos de emergencia
        contactos: nfcData.contactosEmergencia?.map(contacto => ({
          nombre: contacto.nombre,
          telefono: contacto.telefono,
          relacion: contacto.relacion,
          es_principal: contacto.es_principal,
          llamada_directa: `tel:${contacto.telefono.replace(/[^0-9+]/g, '')}`
        })) || []
      }
    }
    
    // Headers para cache (5 minutos)
    const headers = new Headers()
    headers.set('Cache-Control', 'public, max-age=300, s-maxage=300')
    headers.set('Content-Type', 'application/json')
    
    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers
    })
    
  } catch (error) {
    console.error('Error en nfc-data:', error)
    
    // Log del error
    await createAuditLog(
      'nfc_access_error',
      'Error interno durante acceso NFC',
      null,
      getClientIP(request),
      request.headers.get('user-agent'),
      { 
        serial: params?.serial,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    )
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los datos de la pulsera'
      },
      { status: 500 }
    )
  }
})

// Función helper para calcular edad
function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date()
  const nacimiento = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mes = hoy.getMonth() - nacimiento.getMonth()
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--
  }
  
  return edad
}

// Manejar otros métodos HTTP
export const POST = () => {
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
