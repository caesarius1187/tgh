'use client'

import { useState } from 'react'

interface VitalData {
  grupo_sanguineo: string
  alergias: string
  medicacion: string
  enfermedades_cronicas: string
  peso: number | null
  altura: number | null
}

interface EditVitalDataProps {
  initialData: VitalData
  onSave: (data: VitalData) => Promise<void>
  onCancel: () => void
}

export default function EditVitalData({ initialData, onSave, onCancel }: EditVitalDataProps) {
  const [formData, setFormData] = useState<VitalData>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await onSave(formData)
    } catch (error) {
      setError('Error al guardar los datos. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof VitalData, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const gruposSanguineos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grupo Sanguíneo
          </label>
          <select
            value={formData.grupo_sanguineo || ''}
            onChange={(e) => handleChange('grupo_sanguineo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Seleccionar grupo sanguíneo</option>
            {gruposSanguineos.map(grupo => (
              <option key={grupo} value={grupo}>{grupo}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Peso (kg)
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.peso || ''}
            onChange={(e) => handleChange('peso', e.target.value ? parseFloat(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="70.5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Altura (cm)
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.altura || ''}
            onChange={(e) => handleChange('altura', e.target.value ? parseFloat(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="175.0"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alergias
          </label>
          <textarea
            value={formData.alergias || ''}
            onChange={(e) => handleChange('alergias', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="Ej: Penicilina, Mariscos, Polen..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Medicación Actual
          </label>
          <textarea
            value={formData.medicacion || ''}
            onChange={(e) => handleChange('medicacion', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="Ej: Metformina 500mg, Losartán 50mg..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enfermedades Crónicas
          </label>
          <textarea
            value={formData.enfermedades_cronicas || ''}
            onChange={(e) => handleChange('enfermedades_cronicas', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="Ej: Diabetes tipo 2, Hipertensión arterial..."
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
