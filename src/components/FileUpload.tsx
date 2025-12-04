'use client'

import { useEffect, useRef, useState } from 'react'

interface FileUploadProps {
  tipo: 'foto' | 'certificado_grupo_sanguineo'
  onUpload: (file: File) => Promise<void>
  currentUrl?: string
  label: string
  description: string
  acceptedTypes: string
}

export default function FileUpload({ 
  tipo, 
  onUpload, 
  currentUrl, 
  label, 
  description, 
  acceptedTypes 
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [success, setSuccess] = useState('')
  const [fileLink, setFileLink] = useState(currentUrl || '')
  const [isImage, setIsImage] = useState(false)
  const tempObjectUrlRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Función para verificar si una URL es una imagen
  const checkIfImage = (url: string): boolean => {
    if (!url) return false
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp']
    const lowerUrl = url.toLowerCase()
    return imageExtensions.some(ext => lowerUrl.includes(ext))
  }

  useEffect(() => {
    if (tipo === 'foto') {
      setPreview(currentUrl || null)
      setIsImage(true)
    } else if (tipo === 'certificado_grupo_sanguineo') {
      if (currentUrl) {
        const urlIsImage = checkIfImage(currentUrl)
        setIsImage(urlIsImage)
        if (urlIsImage) {
          setPreview(currentUrl)
        } else {
          setFileLink(currentUrl)
        }
      } else {
        setIsImage(false)
        setFileLink('')
      }
    }
  }, [currentUrl, tipo])

  useEffect(() => {
    return () => {
      if (tempObjectUrlRef.current) {
        URL.revokeObjectURL(tempObjectUrlRef.current)
      }
    }
  }, [])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')
    setSuccess('')
    setIsUploading(true)

    try {
      // Verificar si el archivo es una imagen
      const fileIsImage = file.type.startsWith('image/')
      
      if (tipo === 'foto' || (tipo === 'certificado_grupo_sanguineo' && fileIsImage)) {
        // Crear preview para imágenes
        setIsImage(true)
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        // Para PDFs, solo guardar el enlace
        setIsImage(false)
        if (tempObjectUrlRef.current) {
          URL.revokeObjectURL(tempObjectUrlRef.current)
        }
        const objectUrl = URL.createObjectURL(file)
        tempObjectUrlRef.current = objectUrl
        setFileLink(objectUrl)
        setPreview(null)
      }

      await onUpload(file)
      setSuccess('Archivo subido correctamente.')
    } catch (error) {
      setError('Error al subir el archivo. Intenta nuevamente.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium !text-white mb-2" style={{ color: 'white' }}>
          {label}
        </label>
        <p className="text-sm !text-white mb-4" style={{ color: 'white' }}>{description}</p>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
          {preview && (tipo === 'foto' || (tipo === 'certificado_grupo_sanguineo' && isImage)) ? (
            <div className="space-y-4">
              <img 
                src={preview} 
                alt="Preview" 
                className="mx-auto h-32 w-32 object-cover rounded-lg"
              />
              <button
                onClick={handleClick}
                disabled={isUploading}
                className="text-sm text-primary-600 hover:text-primary-500 disabled:opacity-50"
              >
                {isUploading ? 'Subiendo...' : 'Cambiar archivo'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-gray-400">
                <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <button
                  onClick={handleClick}
                  disabled={isUploading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isUploading ? 'Subiendo...' : 'Seleccionar archivo'}
                </button>
                <p className="mt-2 text-xs text-gray-500">
                  {acceptedTypes}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={tipo === 'foto' ? 'image/*' : 'image/*,.pdf'}
          onChange={handleFileSelect}
          className="hidden"
        />

        {tipo === 'certificado_grupo_sanguineo' && !isImage && (fileLink || currentUrl) && (
          <div className="mt-4 text-sm">
            <a
              href={fileLink || currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Ver certificado cargado (PDF)
            </a>
            <p className="text-xs text-gray-500 mt-1">
              Se abrirá en una nueva pestaña.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-2 text-sm text-red-600">{error}</div>
        )}

        {success && !error && (
          <div className="mt-2 text-sm text-green-600">{success}</div>
        )}
      </div>
    </div>
  )
}
