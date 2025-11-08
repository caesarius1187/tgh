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
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [success, setSuccess] = useState('')
  const [fileLink, setFileLink] = useState(currentUrl || '')
  const tempObjectUrlRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (tipo === 'foto') {
      setPreview(currentUrl || null)
    } else {
      setFileLink(currentUrl || '')
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
      // Crear preview
      if (tipo === 'foto') {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        if (tempObjectUrlRef.current) {
          URL.revokeObjectURL(tempObjectUrlRef.current)
        }
        const objectUrl = URL.createObjectURL(file)
        tempObjectUrlRef.current = objectUrl
        setFileLink(objectUrl)
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <p className="text-sm text-gray-500 mb-4">{description}</p>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
          {preview && tipo === 'foto' ? (
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
                {isUploading ? 'Subiendo...' : 'Cambiar imagen'}
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

        {tipo !== 'foto' && (fileLink || currentUrl) && (
          <div className="mt-4 text-sm">
            <a
              href={fileLink || currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Ver certificado cargado
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
