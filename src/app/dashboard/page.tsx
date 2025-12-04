'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import ProtectedRoute from '@/components/ProtectedRoute'
import FileUpload from '@/components/FileUpload'
import EditPersonalData from '@/components/EditPersonalData'
import EditVitalData from '@/components/EditVitalData'
import Navbar from '@/components/Navbar'
import Card, { CardHeader, CardBody } from '@/components/Card'
import Button from '@/components/Button'
import Input from '@/components/Input'

interface EmergencyContactForm {
  id?: number
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
    peso: number | null
    altura: number | null
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

interface ApiEmergencyContact {
  id: number
  nombre: string
  telefono: string
  relacion: string | null
  es_principal: boolean | null
}

interface ApiUserDataResponse {
  datosPersonales?: {
    nombre?: string | null
    apellido?: string | null
    fecha_nacimiento?: string | null
    telefono?: string | null
    email?: string | null
    foto_url?: string | null
  } | null
  datosVitales?: {
    grupo_sanguineo?: string | null
    alergias?: string | null
    medicacion?: string | null
    enfermedades_cronicas?: string | null
    peso?: number | null
    altura?: number | null
    grupo_sanguineo_url?: string | null
  } | null
  contactosEmergencia?: ApiEmergencyContact[] | null
  pulsera?: {
    id?: number
    serial?: string
    is_active?: boolean
    public_url?: string | null
  } | null
}

type PersonalFormData = {
  nombre: string
  apellido: string
  fecha_nacimiento: string
  telefono: string
  email: string
}

type VitalFormData = {
  grupo_sanguineo: string
  alergias: string
  medicacion: string
  enfermedades_cronicas: string
  peso: number | null
  altura: number | null
}

export default function DashboardPage() {
  const { user, token, logout } = useAuth()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [serial, setSerial] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('personal')
  const [editingPersonal, setEditingPersonal] = useState(false)
  const [editingVital, setEditingVital] = useState(false)
  const [isAddingContact, setIsAddingContact] = useState(false)
  const [editingContactId, setEditingContactId] = useState<number | null>(null)
  const [contactForm, setContactForm] = useState<EmergencyContactForm>({
    nombre: '',
    telefono: '',
    relacion: '',
    es_principal: false
  })
  const [contactError, setContactError] = useState('')
  const [isSavingContact, setIsSavingContact] = useState(false)
  const [isDeletingContact, setIsDeletingContact] = useState<number | null>(null)

  const fetchUserData = useCallback(async () => {
    if (!token) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/user-data', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data: ApiUserDataResponse = await response.json()
        
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
            nombre: data.datosPersonales?.nombre ?? '',
            apellido: data.datosPersonales?.apellido ?? '',
            fecha_nacimiento: formatDateForInput(data.datosPersonales?.fecha_nacimiento ?? ''),
            fecha_nacimiento_display: formatDateForDisplay(data.datosPersonales?.fecha_nacimiento ?? ''),
            telefono: data.datosPersonales?.telefono ?? '',
            email: data.datosPersonales?.email ?? '',
            foto_url: data.datosPersonales?.foto_url ?? ''
          },
          vitales: {
            grupo_sanguineo: data.datosVitales?.grupo_sanguineo ?? '',
            alergias: data.datosVitales?.alergias ?? '',
            medicamentos: data.datosVitales?.medicacion ?? '',
            condiciones_medicas: data.datosVitales?.enfermedades_cronicas ?? '',
            peso: data.datosVitales?.peso ?? null,
            altura: data.datosVitales?.altura ?? null,
            grupo_sanguineo_url: data.datosVitales?.grupo_sanguineo_url ?? ''
          },
          contactos: (data.contactosEmergencia ?? []).map((contacto: ApiEmergencyContact) => ({
            id: contacto.id,
            nombre: contacto.nombre,
            telefono: contacto.telefono,
            relacion: contacto.relacion ?? '',
            es_principal: Boolean(contacto.es_principal)
          }))
        }
        
        console.log('Datos mapeados:', mappedData)
        setUserData(mappedData)
        
        // Obtener serial de la pulsera si está disponible
        if (data.pulsera?.serial) {
          setSerial(data.pulsera.serial)
        } else if (user?.serial) {
          setSerial(user.serial)
        }
      } else {
        const errorData = (await response.json()) as { error?: string }
        throw new Error(errorData.error || 'Error al cargar los datos del usuario')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    void fetchUserData()
  }, [fetchUserData])

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
        await fetchUserData()
      } else {
        const errorData = (await response.json()) as { error?: string }
        throw new Error(errorData.error || 'Error al subir archivo')
      }
    } catch (error) {
      throw error
    }
  }

  const handleUpdatePersonalData = async (data: PersonalFormData) => {
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
        await fetchUserData()
      } else {
        const errorData = (await response.json()) as { error?: string }
        throw new Error(errorData.error || 'Error al actualizar datos')
      }
    } catch (error) {
      throw error
    }
  }

  const handleUpdateVitalData = async (data: VitalFormData) => {
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
        await fetchUserData()
      } else {
        const errorData = (await response.json()) as { error?: string }
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
    setEditingContactId(null)
  }

  const startEditingContact = (contacto: { id: number; nombre: string; telefono: string; relacion: string; es_principal: boolean }) => {
    setContactForm({
      id: contacto.id,
      nombre: contacto.nombre,
      telefono: contacto.telefono,
      relacion: contacto.relacion || '',
      es_principal: contacto.es_principal
    })
    setEditingContactId(contacto.id)
    setIsAddingContact(false)
    setContactError('')
  }

  const cancelEditingContact = () => {
    resetContactForm()
    setIsAddingContact(false)
    setContactError('')
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
            id: contactForm.id || undefined,
            nombre: contactForm.nombre.trim(),
            telefono: contactForm.telefono.trim(),
            relacion: contactForm.relacion.trim(),
            es_principal: contactForm.es_principal
          }
        })
      })

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string }
        throw new Error(errorData.error || 'No se pudo guardar el contacto')
      }

      setIsAddingContact(false)
      resetContactForm()
      await fetchUserData()
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

  const handleDeleteContact = async (contactId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este contacto de emergencia?')) {
      return
    }

    setIsDeletingContact(contactId)

    try {
      const response = await fetch('/api/update-user-data', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipo: 'contacto',
          id: contactId
        })
      })

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string }
        throw new Error(errorData.error || 'No se pudo eliminar el contacto')
      }

      await fetchUserData()
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al eliminar el contacto'
      )
    } finally {
      setIsDeletingContact(null)
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
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-tgh-orange"></div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen relative overflow-hidden">
        {/* Patrón hexagonal de fondo */}
        
        {/* Navbar */}
        <Navbar showLogin={false} showLogout={true} />
        
        <div className="relative z-10">

          {/* Navigation Tabs */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-tgh-teal-dark">
            <div className="border-b-2 border-tgh-orange">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-tgh-orange text-tgh-orange'
                        : 'border-transparent text-tgh-gray hover:text-tgh-gold hover:border-tgh-gold'
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
                <div className="mb-6 bg-red-50 border-2 border-red-500 text-red-600 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {activeTab === 'personal' && (
                <Card>
                  <CardHeader
                    title="Datos Personales"
                    action={
                      !editingPersonal && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setEditingPersonal(true)}
                        >
                          ✏️ Editar
                        </Button>
                      )
                    }
                  />
                
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
                    <CardBody>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium !text-white mb-2">
                            Nombre
                          </label>
                          <input
                            type="text"
                            value={userData?.personal?.nombre || ''}
                            className="w-full px-3 py-2 border-2 border-tgh-teal rounded-lg bg-tgh-gray/30 !text-white"
                            readOnly
                            style={{ color: 'white' }}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium !text-white mb-2">
                            Apellido
                          </label>
                          <input
                            type="text"
                            value={userData?.personal?.apellido || ''}
                            className="w-full px-3 py-2 border-2 border-tgh-teal rounded-lg bg-tgh-gray/30 !text-white"
                            readOnly
                            style={{ color: 'white' }}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium !text-white mb-2">
                            Fecha de Nacimiento
                          </label>
                          <input
                            type="text"
                            value={userData?.personal?.fecha_nacimiento_display || ''}
                            className="w-full px-3 py-2 border-2 border-tgh-teal rounded-lg bg-tgh-gray/30 !text-white"
                            readOnly
                            placeholder="DD/MM/YYYY"
                            style={{ color: 'white' }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium !text-white mb-2">
                            Teléfono
                          </label>
                          <input
                            type="tel"
                            value={userData?.personal?.telefono || ''}
                            className="w-full px-3 py-2 border-2 border-tgh-teal rounded-lg bg-tgh-gray/30 !text-white"
                            readOnly
                            style={{ color: 'white' }}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium !text-white mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={userData?.personal?.email || ''}
                            className="w-full px-3 py-2 border-2 border-tgh-teal rounded-lg bg-tgh-gray/30 !text-white"
                            readOnly
                            style={{ color: 'white' }}
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
                    </CardBody>
                  </>
                )}
                </Card>
              )}

              {activeTab === 'vitales' && (
                <Card>
                  <CardHeader
                    title="Datos Vitales"
                    action={
                      !editingVital && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setEditingVital(true)}
                        >
                          ✏️ Editar
                        </Button>
                      )
                    }
                  />
                
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
                    <CardBody>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium !text-white mb-2">
                            Grupo Sanguíneo
                          </label>
                          <input
                            type="text"
                            value={userData?.vitales?.grupo_sanguineo || ''}
                            className="w-full px-3 py-2 border-2 border-tgh-teal rounded-lg bg-tgh-gray/30 !text-white"
                            readOnly
                            style={{ color: 'white' }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium !text-white mb-2">
                            Peso (kg)
                          </label>
                          <input
                            type="text"
                            value={userData?.vitales?.peso ? `${userData.vitales.peso} kg` : ''}
                            className="w-full px-3 py-2 border-2 border-tgh-teal rounded-lg bg-tgh-gray/30 !text-white"
                            readOnly
                            style={{ color: 'white' }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium !text-white mb-2">
                            Altura (cm)
                          </label>
                          <input
                            type="text"
                            value={userData?.vitales?.altura ? `${userData.vitales.altura} cm` : ''}
                            className="w-full px-3 py-2 border-2 border-tgh-teal rounded-lg bg-tgh-gray/30 !text-white"
                            readOnly
                            style={{ color: 'white' }}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium !text-white mb-2">
                            Alergias
                          </label>
                          <textarea
                            value={userData?.vitales?.alergias || ''}
                            rows={3}
                            className="w-full px-3 py-2 border-2 border-tgh-teal rounded-lg bg-tgh-gray/30 !text-white resize-none"
                            readOnly
                            style={{ color: 'white' }}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium !text-white mb-2">
                            Medicamentos
                          </label>
                          <textarea
                            value={userData?.vitales?.medicamentos || ''}
                            rows={3}
                            className="w-full px-3 py-2 border-2 border-tgh-teal rounded-lg bg-tgh-gray/30 !text-white resize-none"
                            readOnly
                            style={{ color: 'white' }}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium !text-white mb-2">
                            Condiciones Médicas
                          </label>
                          <textarea
                            value={userData?.vitales?.condiciones_medicas || ''}
                            rows={3}
                            className="w-full px-3 py-2 border-2 border-tgh-teal rounded-lg bg-tgh-gray/30 !text-white resize-none"
                            readOnly
                            style={{ color: 'white' }}
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
                    </CardBody>
                  )}
                </Card>
              )}

              {activeTab === 'contactos' && (
                <Card>
                  <CardHeader
                    title="Contactos de Emergencia"
                    action={
                      !isAddingContact && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            const shouldBePrincipal = (userData?.contactos?.length || 0) === 0
                            resetContactForm(shouldBePrincipal)
                            setContactError('')
                            setIsAddingContact(true)
                          }}
                        >
                          ➕ Agregar contacto
                        </Button>
                      )
                    }
                  />

                  {(isAddingContact || editingContactId !== null) && (
                    <CardBody>
                      <form
                        onSubmit={handleAddEmergencyContact}
                        className="border-2 border-tgh-teal rounded-lg p-6 bg-tgh-gray/20"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="form-group">
                            <label className="block text-sm font-medium !text-white mb-2" style={{ color: 'white' }}>
                              Nombre completo *
                            </label>
                            <input
                              type="text"
                              value={contactForm.nombre}
                              onChange={(e) => handleContactFieldChange('nombre', e.target.value)}
                              placeholder="Ej: Juan Pérez"
                              required
                              className="w-full px-3 py-2 border-2 border-tgh-teal rounded-lg focus:outline-none focus:ring-2 focus:ring-tgh-orange focus:border-tgh-orange bg-tgh-gray/30 !text-white placeholder:text-gray-300"
                              style={{ color: 'white' }}
                            />
                          </div>

                          <div className="form-group">
                            <label className="block text-sm font-medium !text-white mb-2" style={{ color: 'white' }}>
                              Teléfono *
                            </label>
                            <input
                              type="tel"
                              value={contactForm.telefono}
                              onChange={(e) => handleContactFieldChange('telefono', e.target.value)}
                              placeholder="Ej: +54 9 11 5555 5555"
                              required
                              className="w-full px-3 py-2 border-2 border-tgh-teal rounded-lg focus:outline-none focus:ring-2 focus:ring-tgh-orange focus:border-tgh-orange bg-tgh-gray/30 !text-white placeholder:text-gray-300"
                              style={{ color: 'white' }}
                            />
                          </div>

                          <div className="form-group">
                            <label className="block text-sm font-medium !text-white mb-2" style={{ color: 'white' }}>
                              Relación
                            </label>
                            <input
                              type="text"
                              value={contactForm.relacion}
                              onChange={(e) => handleContactFieldChange('relacion', e.target.value)}
                              placeholder="Ej: Esposo/a, Padre, Amigo"
                              className="w-full px-3 py-2 border-2 border-tgh-teal rounded-lg focus:outline-none focus:ring-2 focus:ring-tgh-orange focus:border-tgh-orange bg-tgh-gray/30 !text-white placeholder:text-gray-300"
                              style={{ color: 'white' }}
                            />
                          </div>

                          <div className="flex items-center space-x-2 pt-6">
                            <input
                              id="es_principal"
                              type="checkbox"
                              checked={contactForm.es_principal}
                              onChange={(e) => handleContactFieldChange('es_principal', e.target.checked)}
                              className="h-5 w-5 text-tgh-orange focus:ring-tgh-orange border-tgh-teal rounded"
                            />
                            <label
                              htmlFor="es_principal"
                              className="block text-sm font-medium !text-white mb-0 cursor-pointer"
                              style={{ color: 'white' }}
                            >
                              Marcar como contacto principal
                            </label>
                          </div>
                        </div>

                        {contactError && (
                          <div className="mt-4 bg-red-50 border-2 border-red-500 !text-white px-4 py-3 rounded-lg text-sm">
                            {contactError}
                          </div>
                        )}

                        <div className="flex space-x-3 pt-4">
                          <Button
                            type="submit"
                            variant="primary"
                            isLoading={isSavingContact}
                            disabled={isSavingContact}
                          >
                            {isSavingContact ? 'Guardando...' : editingContactId !== null ? 'Actualizar contacto' : 'Guardar contacto'}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={cancelEditingContact}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </CardBody>
                  )}
                  
                  {!isAddingContact && editingContactId === null && (
                    <>
                      {userData?.contactos && userData.contactos.length > 0 ? (
                        <CardBody>
                          <div className="space-y-4">
                            {userData.contactos.map((contacto) => (
                              <div key={contacto.id} className="border-2 border-tgh-teal rounded-lg p-4 bg-tgh-gray/20">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <h3 className="font-medium !text-white" style={{ color: 'white' }}>{contacto.nombre}</h3>
                                      {contacto.es_principal && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-500">
                                          Principal
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm !text-white mb-2" style={{ color: 'white' }}>{contacto.relacion}</p>
                                    <a 
                                      href={`tel:${contacto.telefono}`}
                                      className="link text-sm font-medium"
                                    >
                                      📞 {contacto.telefono}
                                    </a>
                                  </div>
                                  <div className="flex space-x-2 ml-4">
                                    <Button
                                      type="button"
                                      variant="primary"
                                      size="sm"
                                      onClick={() => startEditingContact(contacto)}
                                      disabled={isDeletingContact === contacto.id}
                                    >
                                      ✏️ Editar
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleDeleteContact(contacto.id)}
                                      disabled={isDeletingContact === contacto.id}
                                      isLoading={isDeletingContact === contacto.id}
                                    >
                                      🗑️ Eliminar
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardBody>
                      ) : (
                        <CardBody>
                          <p className="!text-white text-center py-8" style={{ color: 'white' }}>
                            No hay contactos de emergencia registrados
                          </p>
                        </CardBody>
                      )}
                    </>
                  )}
                </Card>
              )}

              {activeTab === 'nfc' && (
                <Card>
                  <CardHeader
                    title="Vista Pública NFC"
                  />
                  <CardBody>
                    <div className="text-center space-y-4">
                      <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-blue-900 mb-2">
                          Tu Pulsera NFC está Activa
                        </h3>
                        <p className="text-blue-700 mb-4">
                          Los datos de emergencia están disponibles públicamente a través de NFC
                        </p>
                        {serial ? (
                          <a
                            href={`/nfc/${serial}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="primary">
                              Ver Vista Pública
                            </Button>
                          </a>
                        ) : (
                          <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4">
                            <p className="text-yellow-800 text-sm">
                              No tienes una pulsera asignada. Contacta al administrador para activar tu pulsera NFC.
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm !text-white">
                        {serial ? (
                          <p className="!text-white" style={{ color: 'white' }}>Serial: <span className="font-mono font-medium text-tgh-teal">{serial}</span></p>
                        ) : (
                          <p className="!text-white" style={{ color: 'white' }}>No hay serial disponible</p>
                        )}
                        <p className="mt-2 !text-white" style={{ color: 'white' }}>
                          Esta información es accesible públicamente para emergencias médicas
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
