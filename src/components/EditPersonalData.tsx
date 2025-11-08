'use client'

import { useState } from 'react'

interface PersonalData {
  nombre: string
  apellido: string
  fecha_nacimiento: string
  telefono: string
  email: string
}

interface EditPersonalDataProps {
  initialData: PersonalData
  onSave: (data: PersonalData) => Promise<void>
  onCancel: () => void
}

export default function EditPersonalData({ initialData, onSave, onCancel }: EditPersonalDataProps) {
  const [formData, setFormData] = useState<PersonalData>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Asegurar que la fecha esté en formato YYYY-MM-DD para la base de datos
      const dataToSave = {
        ...formData,
        fecha_nacimiento: formData.fecha_nacimiento // Ya está en formato correcto del input
      }
      
      await onSave(dataToSave)
    } catch (error) {
      setError('Error al guardar los datos. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof PersonalData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre
          </label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Apellido
          </label>
          <input
            type="text"
            value={formData.apellido}
            onChange={(e) => handleChange('apellido', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Nacimiento
          </label>
          <input
            type="date"
            value={formData.fecha_nacimiento}
            onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono
          </label>
          <input
            type="tel"
            value={formData.telefono}
            onChange={(e) => handleChange('telefono', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="+1234567890"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="usuario@ejemplo.com"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
        
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
