import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { executeQuery, createAuditLog } from '@/lib/db-utils'
import { getClientIP } from '@/lib/security'
import { withCORS } from '@/lib/cors'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Configuración de archivos
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = {
  foto: ['image/jpeg', 'image/png', 'image/webp'],
  certificado_grupo_sanguineo: ['image/jpeg', 'image/png', 'application/pdf']
}
const UPLOAD_DIR = './public/uploads'

export const POST = withCORS(async (request: NextRequest) => {
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
    
    // Obtener datos del FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const tipo = formData.get('tipo') as string
    
    if (!file || !tipo) {
      return NextResponse.json(
        { error: 'Archivo y tipo son requeridos' },
        { status: 400 }
      )
    }
    
    // Validar tipo de archivo
    if (!ALLOWED_TYPES[tipo as keyof typeof ALLOWED_TYPES]) {
      await createAuditLog(
        'file_upload_failed',
        `Intento de subida con tipo inválido: ${tipo}`,
        user.userId,
        ip,
        userAgent,
        { tipo, reason: 'invalid_type' }
      )
      
      return NextResponse.json(
        { error: 'Tipo de archivo no válido' },
        { status: 400 }
      )
    }
    
    // Validar tamaño del archivo
    if (file.size > MAX_FILE_SIZE) {
      await createAuditLog(
        'file_upload_failed',
        `Intento de subida con archivo muy grande: ${file.size} bytes`,
        user.userId,
        ip,
        userAgent,
        { tipo, size: file.size, maxSize: MAX_FILE_SIZE, reason: 'file_too_large' }
      )
      
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 5MB' },
        { status: 400 }
      )
    }
    
    // Validar tipo MIME
    const allowedMimes = ALLOWED_TYPES[tipo as keyof typeof ALLOWED_TYPES]
    if (!allowedMimes.includes(file.type)) {
      await createAuditLog(
        'file_upload_failed',
        `Intento de subida con MIME type inválido: ${file.type}`,
        user.userId,
        ip,
        userAgent,
        { tipo, mimeType: file.type, reason: 'invalid_mime_type' }
      )
      
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido' },
        { status: 400 }
      )
    }
    
    // Crear directorio de uploads si no existe
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }
    
    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const fileName = `${user.userId}_${tipo}_${timestamp}.${extension}`
    const filePath = join(UPLOAD_DIR, fileName)
    const fileUrl = `/uploads/${fileName}`
    
    // Convertir File a Buffer y guardar
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)
    
    // Actualizar base de datos según el tipo
    let updateResult
    
    if (tipo === 'foto') {
      updateResult = await executeQuery(
        'UPDATE datos_personales SET foto_url = ? WHERE usuario_id = ?',
        [fileUrl, user.userId]
      )
    } else if (tipo === 'certificado_grupo_sanguineo') {
      updateResult = await executeQuery(
        'UPDATE datos_vitales SET grupo_sanguineo_url = ? WHERE usuario_id = ?',
        [fileUrl, user.userId]
      )
    }
    
    // Verificar que la actualización fue exitosa
    if (updateResult && (updateResult as any).affectedRows === 0) {
      // Si no hay datos personales/vitales, crear el registro
      if (tipo === 'foto') {
        await executeQuery(
          'INSERT INTO datos_personales (usuario_id, nombre, apellido, fecha_nacimiento, foto_url) VALUES (?, ?, ?, ?, ?)',
          [user.userId, '', '', '1900-01-01', fileUrl]
        )
      } else if (tipo === 'certificado_grupo_sanguineo') {
        await executeQuery(
          'INSERT INTO datos_vitales (usuario_id, grupo_sanguineo_url) VALUES (?, ?)',
          [user.userId, fileUrl]
        )
      }
    }
    
    // Log del upload exitoso
    await createAuditLog(
      'file_upload_success',
      `Archivo ${tipo} subido exitosamente`,
      user.userId,
      ip,
      userAgent,
      { 
        tipo, 
        fileName, 
        fileSize: file.size, 
        mimeType: file.type,
        fileUrl 
      }
    )
    
    return NextResponse.json({
      success: true,
      message: `Archivo ${tipo} subido exitosamente`,
      file: {
        name: fileName,
        url: fileUrl,
        size: file.size,
        type: file.type
      }
    })
    
  } catch (error) {
    console.error('Error en upload-file:', error)
    
    // Log del error
    await createAuditLog(
      'file_upload_error',
      'Error interno durante subida de archivo',
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
