import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { executeQuery, createAuditLog } from '@/lib/db-utils'
import { getClientIP } from '@/lib/security'
import { withCORS } from '@/lib/cors'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = {
  foto: ['image/jpeg', 'image/png', 'image/webp'],
  certificado_grupo_sanguineo: ['image/jpeg', 'image/png', 'application/pdf']
}
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'uploads'

let bucketEnsured = false

async function ensureBucketExists() {
  if (bucketEnsured) return

  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()
  if (listError) {
    throw new Error(`No se pudo listar buckets de Supabase: ${listError.message}`)
  }

  const existingBucket = buckets?.find((bucket) => bucket.name === STORAGE_BUCKET)
  
  if (!existingBucket) {
    // Crear el bucket si no existe
    const { error: createError } = await supabaseAdmin.storage.createBucket(STORAGE_BUCKET, {
      public: true
    })

    if (createError) {
      throw new Error(`No se pudo crear el bucket ${STORAGE_BUCKET}: ${createError.message}`)
    }
  } else if (!existingBucket.public) {
    // Si el bucket existe pero no es público, intentar actualizarlo
    // Nota: Supabase puede no permitir cambiar esto después de crear el bucket
    // En ese caso, el bucket debe recrearse manualmente
    console.warn(`El bucket ${STORAGE_BUCKET} existe pero no está configurado como público. Asegúrate de que el bucket sea público en la configuración de Supabase.`)
  }

  bucketEnsured = true
}

function buildStoragePath(userId: number, tipo: string, originalName: string) {
  const timestamp = Date.now()
  const extension = originalName.includes('.') ? originalName.split('.').pop() : 'dat'
  const sanitizedExtension = extension?.replace(/[^a-zA-Z0-9]/g, '') || 'dat'
  const normalizedTipo = tipo.replace(/[^a-zA-Z0-9_-]/g, '')
  return `usuarios/${userId}/${normalizedTipo}/${timestamp}.${sanitizedExtension}`
}

export const POST = withCORS(async (request: NextRequest) => {
  try {
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

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const tipo = formData.get('tipo') as string | null

    if (!file || !tipo) {
      return NextResponse.json(
        { error: 'Archivo y tipo son requeridos' },
        { status: 400 }
      )
    }

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

    await ensureBucketExists()

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const storagePath = buildStoragePath(user.userId, tipo, file.name)

    const {
      data: uploadData,
      error: uploadError
    } = await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true
    })

    if (uploadError) {
      throw new Error(`Error subiendo archivo a Supabase Storage: ${uploadError.message}`)
    }

    if (!uploadData?.path) {
      throw new Error('No se obtuvo la ruta del archivo subido')
    }

    // Construir la URL pública manualmente para asegurar el formato correcto
    // Formato: {SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{PATH}
    const supabaseUrl = process.env.SUPABASE_URL
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL no está configurada')
    }
    
    // Asegurar que la URL base no termine con /
    const baseUrl = supabaseUrl.replace(/\/$/, '')
    
    // uploadData.path puede incluir o no el nombre del bucket
    // Si incluye el nombre del bucket, lo removemos
    let filePath = uploadData.path
    if (filePath.startsWith(`${STORAGE_BUCKET}/`)) {
      filePath = filePath.substring(STORAGE_BUCKET.length + 1)
    }
    
    // Construir la URL pública
    const fileUrl = `${baseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${filePath}`

    let updateRowCount = 0

    if (tipo === 'foto') {
      const { rowCount } = await executeQuery(
        'UPDATE datos_personales SET foto_url = $1 WHERE usuario_id = $2',
        [fileUrl, user.userId]
      )
      updateRowCount = rowCount ?? 0
    } else if (tipo === 'certificado_grupo_sanguineo') {
      const { rowCount } = await executeQuery(
        'UPDATE datos_vitales SET grupo_sanguineo_url = $1 WHERE usuario_id = $2',
        [fileUrl, user.userId]
      )
      updateRowCount = rowCount ?? 0
    }

    if (updateRowCount === 0) {
      if (tipo === 'foto') {
        await executeQuery(
          'INSERT INTO datos_personales (usuario_id, nombre, apellido, fecha_nacimiento, foto_url) VALUES ($1, $2, $3, $4, $5)',
          [user.userId, '', '', '1900-01-01', fileUrl]
        )
      } else if (tipo === 'certificado_grupo_sanguineo') {
        await executeQuery(
          'INSERT INTO datos_vitales (usuario_id, grupo_sanguineo_url) VALUES ($1, $2)',
          [user.userId, fileUrl]
        )
      }
    }

    await createAuditLog(
      'file_upload_success',
      `Archivo ${tipo} subido exitosamente`,
      user.userId,
      ip,
      userAgent,
      {
        tipo,
        storagePath,
        fileSize: file.size,
        mimeType: file.type,
        fileUrl
      }
    )

    return NextResponse.json({
      success: true,
      message: `Archivo ${tipo} subido exitosamente`,
      file: {
        path: storagePath,
        url: fileUrl,
        size: file.size,
        type: file.type
      }
    })
  } catch (error) {
    console.error('Error en upload-file:', error)

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
