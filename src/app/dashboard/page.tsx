'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import ProtectedRoute from '@/components/ProtectedRoute'
import FileUpload from '@/components/FileUpload'
import EditPersonalData from '@/components/EditPersonalData'
import EditVitalData from '@/components/EditVitalData'

interface EmergencyContactForm {
  nombre: string
  telefono: string
  relacion: string
  es_principal: boolean
}

interface UserData {
  personal: {
    nombre: string
    apellido: string
    fecha_nacimiento: string
    fecha_nacimiento_display?: string
    telefono?: string
    email?: string
    foto_url?: string
  }
  vitales: {
    grupo_sanguineo: string
    alergias: string
    medicamentos: string
    condiciones_medicas: string
    peso?: number
    altura?: number
    grupo_sanguineo_url?: string
  }
  contactos: Array<{
    id: number
    nombre: string
    telefono: string
    relacion: string
    es_principal: boolean
  }>
}

export default function DashboardPage() {
  const { user, token, logout } = useAuth()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('personal')
  const [editingPersonal, setEditingPersonal] = useState(false)
  const [editingVital, setEditingVital] = useState(false)
  const [isAddingContact, setIsAddingContact] = useState(false)
  const [contactForm, setContactForm] = useState<EmergencyContactForm>({
    nombre: '',
    telefono: '',
    relacion: '',
    es_principal: false
  })
  const [contactError, setContactError] = useState('')
  const [isSavingContact, setIsSavingContact] = useState(false)

  useEffect(() => {
    if (token) {
      fetchUserData()
    }
  }, [token])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user-data', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        // Función para extraer solo la fecha (YYYY-MM-DD) de cualquier formato
        const extractDateOnly = (dateString: string) => {
          if (!dateString) return ''
          
          // Si es un objeto Date o string con timestamp, extraer solo la fecha
          if (dateString.includes('T') || dateString.includes('Z')) {
            const date = new Date(dateString)
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0] // YYYY-MM-DD
            }
          }
          
          // Si ya está en formato YYYY-MM-DD, devolverlo tal como está
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString
          }
          
          // Si está en formato DD/MM/YYYY, convertir a YYYY-MM-DD
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
            const [day, month, year] = dateString.split('/')
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
          }
          
          return dateString
        }

        // Función para convertir fecha de YYYY-MM-DD a formato de input HTML
        const formatDateForInput = (dateString: string) => {
          return extractDateOnly(dateString)
        }

        // Función para convertir fecha de YYYY-MM-DD a formato DD/MM/YYYY para mostrar
        const formatDateForDisplay = (dateString: string) => {
          const cleanDate = extractDateOnly(dateString)
          if (!cleanDate) return ''
          
          // Si está en formato YYYY-MM-DD, convertir a DD/MM/YYYY
          if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
            const [year, month, day] = cleanDate.split('-')
            return `${day}/${month}/${year}`
          }
          
          return cleanDate
        }
        
        // Debug: Log de los datos recibidos
        console.log('Datos recibidos de la API:', data)
        console.log('Datos personales:', data.datosPersonales)
        console.log('Fecha de nacimiento original:', data.datosPersonales?.fecha_nacimiento)
        console.log('Fecha extraída:', extractDateOnly(data.datosPersonales?.fecha_nacimiento || ''))
        console.log('Fecha para mostrar:', formatDateForDisplay(data.datosPersonales?.fecha_nacimiento || ''))

        // Mapear los datos de la API al formato esperado por el frontend
        const mappedData: UserData = {
          personal: {
            nombre: data.datosPersonales?.nombre || '',
            apellido: data.datosPersonales?.apellido || '',
            fecha_nacimiento: formatDateForInput(data.datosPersonales?.fecha_nacimiento || ''),
            fecha_nacimiento_display: formatDateForDisplay(data.datosPersonales?.fecha_nacimiento || ''),
            telefono: data.datosPersonales?.telefono || '',
            email: data.datosPersonales?.email || '',
            foto_url: data.datosPersonales?.foto_url || ''
          },
          vitales: {
            grupo_sanguineo: data.datosVitales?.grupo_sanguineo || '',
            alergias: data.datosVitales?.alergias || '',
            medicamentos: data.datosVitales?.medicacion || '',
            condiciones_medicas: data.datosVitales?.enfermedades_cronicas || '',
            peso: data.datosVitales?.peso || null,
            altura: data.datosVitales?.altura || null,
            grupo_sanguineo_url: data.datosVitales?.grupo_sanguineo_url || ''
          },
          contactos: (data.contactosEmergencia || []).map((contacto: any) => ({
            id: contacto.id,
            nombre: contacto.nombre,
            telefono: contacto.telefono,
            relacion: contacto.relacion || '',
            es_principal: Boolean(contacto.es_principal)
          }))
        }
        
        console.log('Datos mapeados:', mappedData)
        setUserData(mappedData)
      } else {
        setError('Error al cargar los datos del usuario')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (tipo: 'foto' | 'certificado_grupo_sanguineo', file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('tipo', tipo)

    try {
      const response = await fetch('/api/upload-file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        // Actualizar los datos del usuario
        fetchUserData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al subir archivo')
      }
    } catch (error) {
      throw error
    }
  }

  const handleUpdatePersonalData = async (data: any) => {
    try {
      const response = await fetch('/api/update-user-data', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipo: 'personal',
          datos: data
        })
      })

      if (response.ok) {
        setEditingPersonal(false)
        fetchUserData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar datos')
      }
    } catch (error) {
      throw error
    }
  }

  const handleUpdateVitalData = async (data: any) => {
    try {
      const response = await fetch('/api/update-user-data', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipo: 'vitales',
          datos: data
        })
      })

      if (response.ok) {
        setEditingVital(false)
        fetchUserData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar datos')
      }
    } catch (error) {
      throw error
    }
  }

  const resetContactForm = (makePrincipal = false) => {
    setContactForm({
      nombre: '',
      telefono: '',
      relacion: '',
      es_principal: makePrincipal
    })
  }

  const handleAddEmergencyContact = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!contactForm.nombre.trim()) {
      setContactError('El nombre del contacto es obligatorio.')
      return
    }

    if (!contactForm.telefono.trim()) {
      setContactError('El teléfono del contacto es obligatorio.')
      return
    }

    setContactError('')
    setIsSavingContact(true)

    try {
      const response = await fetch('/api/update-user-data', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipo: 'contacto',
          datos: {
            nombre: contactForm.nombre.trim(),
            telefono: contactForm.telefono.trim(),
            relacion: contactForm.relacion.trim(),
            es_principal: contactForm.es_principal
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'No se pudo guardar el contacto')
      }

      setIsAddingContact(false)
      resetContactForm()
      fetchUserData()
    } catch (error) {
      setContactError(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al guardar el contacto'
      )
    } finally {
      setIsSavingContact(false)
    }
  }

  const handleContactFieldChange = (field: keyof EmergencyContactForm, value: string | boolean) => {
    setContactForm((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const tabs = [
    { id: 'personal', name: 'Datos Personales', icon: '👤' },
    { id: 'vitales', name: 'Datos Vitales', icon: '❤️' },
    { id: 'contactos', name: 'Contactos de Emergencia', icon: '📞' },
    { id: 'nfc', name: 'Vista Pública NFC', icon: '📱' }
  ]

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Dashboard Personal
                </h1>
                <p className="text-gray-600">
                  Bienvenido, {user?.username}
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={logout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {activeTab === 'personal' && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Datos Personales
                  </h2>
                  {!editingPersonal && (
                    <button
                      onClick={() => setEditingPersonal(true)}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      ✏️ Editar
                    </button>
                  )}
                </div>
                
                {editingPersonal ? (
                  <EditPersonalData
                    initialData={{
                      nombre: userData?.personal?.nombre || '',
                      apellido: userData?.personal?.apellido || '',
                      fecha_nacimiento: userData?.personal?.fecha_nacimiento || '',
                      telefono: userData?.personal?.telefono || '',
                      email: userData?.personal?.email || ''
                    }}
                    onSave={handleUpdatePersonalData}
                    onCancel={() => setEditingPersonal(false)}
                  />
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre
                        </label>
                        <input
                          type="text"
                          value={userData?.personal?.nombre || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                          readOnly
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Apellido
                        </label>
                        <input
                          type="text"
                          value={userData?.personal?.apellido || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                          readOnly
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha de Nacimiento
                        </label>
                        <input
                          type="text"
                          value={userData?.personal?.fecha_nacimiento_display || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                          readOnly
                          placeholder="DD/MM/YYYY"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          value={userData?.personal?.telefono || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                          readOnly
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={userData?.personal?.email || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <FileUpload
                        tipo="foto"
                        onUpload={(file) => handleFileUpload('foto', file)}
                        currentUrl={userData?.personal?.foto_url}
                        label="Foto Personal"
                        description="Sube una foto clara de tu rostro para identificación en emergencias"
                        acceptedTypes="JPG, PNG, WebP (máx. 5MB)"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'vitales' && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Datos Vitales
                  </h2>
                  {!editingVital && (
                    <button
                      onClick={() => setEditingVital(true)}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      ✏️ Editar
                    </button>
                  )}
                </div>
                
                {editingVital ? (
                  <EditVitalData
                    initialData={{
                      grupo_sanguineo: userData?.vitales?.grupo_sanguineo || '',
                      alergias: userData?.vitales?.alergias || '',
                      medicacion: userData?.vitales?.medicamentos || '',
                      enfermedades_cronicas: userData?.vitales?.condiciones_medicas || '',
                      peso: userData?.vitales?.peso || null,
                      altura: userData?.vitales?.altura || null
                    }}
                    onSave={handleUpdateVitalData}
                    onCancel={() => setEditingVital(false)}
                  />
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Grupo Sanguíneo
                        </label>
                        <input
                          type="text"
                          value={userData?.vitales?.grupo_sanguineo || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                          readOnly
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Peso (kg)
                        </label>
                        <input
                          type="text"
                          value={userData?.vitales?.peso ? `${userData.vitales.peso} kg` : ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                          readOnly
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Altura (cm)
                        </label>
                        <input
                          type="text"
                          value={userData?.vitales?.altura ? `${userData.vitales.altura} cm` : ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                          readOnly
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Alergias
                        </label>
                        <textarea
                          value={userData?.vitales?.alergias || ''}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                          readOnly
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Medicamentos
                        </label>
                        <textarea
                          value={userData?.vitales?.medicamentos || ''}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                          readOnly
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Condiciones Médicas
                        </label>
                        <textarea
                          value={userData?.vitales?.condiciones_medicas || ''}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <FileUpload
                        tipo="certificado_grupo_sanguineo"
                        onUpload={(file) => handleFileUpload('certificado_grupo_sanguineo', file)}
                        currentUrl={userData?.vitales?.grupo_sanguineo_url}
                        label="Certificado de Grupo Sanguíneo"
                        description="Sube tu certificado médico del grupo sanguíneo"
                        acceptedTypes="JPG, PNG, PDF (máx. 5MB)"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'contactos' && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Contactos de Emergencia
                  </h2>
                  {!isAddingContact && (
                    <button
                      onClick={() => {
                        const shouldBePrincipal = (userData?.contactos?.length || 0) === 0
                        resetContactForm(shouldBePrincipal)
                        setContactError('')
                        setIsAddingContact(true)
                      }}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      ➕ Agregar contacto
                    </button>
                  )}
                </div>

                {isAddingContact && (
                  <form
                    onSubmit={handleAddEmergencyContact}
                    className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre completo *
                        </label>
                        <input
                          type="text"
                          value={contactForm.nombre}
                          onChange={(e) => handleContactFieldChange('nombre', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Ej: Juan Pérez"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Teléfono *
                        </label>
                        <input
                          type="tel"
                          value={contactForm.telefono}
                          onChange={(e) => handleContactFieldChange('telefono', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Ej: +54 9 11 5555 5555"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Relación
                        </label>
                        <input
                          type="text"
                          value={contactForm.relacion}
                          onChange={(e) => handleContactFieldChange('relacion', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Ej: Esposo/a, Padre, Amigo"
                        />
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <input
                          id="es_principal"
                          type="checkbox"
                          checked={contactForm.es_principal}
                          onChange={(e) => handleContactFieldChange('es_principal', e.target.checked)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor="es_principal"
                          className="text-sm text-gray-700"
                        >
                          Marcar como contacto principal
                        </label>
                      </div>
                    </div>

                    {contactError && (
                      <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                        {contactError}
                      </div>
                    )}

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        disabled={isSavingContact}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSavingContact ? 'Guardando...' : 'Guardar contacto'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingContact(false)
                          resetContactForm()
                          setContactError('')
                        }}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
                
                {userData?.contactos && userData.contactos.length > 0 ? (
                  <div className="space-y-4">
                    {userData.contactos.map((contacto) => (
                      <div key={contacto.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-gray-900">{contacto.nombre}</h3>
                              {contacto.es_principal && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                                  Principal
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{contacto.relacion}</p>
                            <a 
                              href={`tel:${contacto.telefono}`}
                              className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                            >
                              📞 {contacto.telefono}
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No hay contactos de emergencia registrados
                  </p>
                )}
              </div>
            )}

            {activeTab === 'nfc' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Vista Pública NFC
                </h2>
                
                <div className="text-center space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-blue-900 mb-2">
                      Tu Pulsera NFC está Activa
                    </h3>
                    <p className="text-blue-700 mb-4">
                      Los datos de emergencia están disponibles públicamente a través de NFC
                    </p>
                    <a
                      href={`/nfc/${user?.serial}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Ver Vista Pública
                    </a>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    <p>Serial: <span className="font-mono font-medium">{user?.serial}</span></p>
                    <p className="mt-2">
                      Esta información es accesible públicamente para emergencias médicas
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
