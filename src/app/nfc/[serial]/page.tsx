import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Phone, User, Heart, FileText, AlertTriangle } from 'lucide-react'

interface NFCPageProps {
  params: {
    serial: string
  }
}

interface NFCData {
  success: boolean
  serial: string
  timestamp: string
  data: {
    persona: {
      nombre: string
      apellido: string
      edad: number | null
      foto: string | null
      peso: number | null
      altura: number | null
    } | null
    medica: {
      grupo_sanguineo: string | null
      alergias: string | null
      medicacion: string | null
      enfermedades_cronicas: string | null
      observaciones: string | null
      certificado_grupo_sanguineo: string | null
    } | null
    contactos: Array<{
      nombre: string
      telefono: string
      relacion: string | null
      es_principal: boolean
      llamada_directa: string
    }>
  }
}

async function getNFCData(serial: string): Promise<NFCData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/nfc-data/${serial}`, {
      cache: 'no-store' // Siempre obtener datos frescos
    })
    
    if (!response.ok) {
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error obteniendo datos NFC:', error)
    return null
  }
}

export async function generateMetadata({ params }: NFCPageProps): Promise<Metadata> {
  const { serial } = params
  
  return {
    title: `Pulsera TGH - ${serial}`,
    description: 'Información de emergencia médica',
    robots: 'noindex, nofollow', // No indexar páginas NFC
    viewport: 'width=device-width, initial-scale=1.0'
  }
}

export default async function NFCPage({ params }: NFCPageProps) {
  const { serial } = params
  
  const nfcData = await getNFCData(serial)
  
  if (!nfcData || !nfcData.success) {
    notFound()
  }
  
  const { persona, medica, contactos } = nfcData.data
  
  return (
    <div className="min-h-screen bg-red-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header de emergencia */}
        <div className="bg-red-600 text-white p-4 rounded-lg mb-4 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <h1 className="text-xl font-bold">INFORMACIÓN DE EMERGENCIA</h1>
          <p className="text-sm opacity-90">Pulsera TGH - {serial}</p>
        </div>
        
        {/* Información personal */}
        {persona && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-center mb-3">
              <User className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">Información Personal</h2>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Nombre:</span>
                <span>{persona.nombre} {persona.apellido}</span>
              </div>
              
              {persona.edad && (
                <div className="flex justify-between">
                  <span className="font-medium">Edad:</span>
                  <span>{persona.edad} años</span>
                </div>
              )}
              
              {persona.peso && (
                <div className="flex justify-between">
                  <span className="font-medium">Peso:</span>
                  <span>{persona.peso} kg</span>
                </div>
              )}
              
              {persona.altura && (
                <div className="flex justify-between">
                  <span className="font-medium">Altura:</span>
                  <span>{persona.altura} cm</span>
                </div>
              )}
            </div>
            
            {persona.foto && (
              <div className="mt-4 text-center">
                <img 
                  src={persona.foto} 
                  alt="Foto" 
                  className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-gray-200"
                />
              </div>
            )}
          </div>
        )}
        
        {/* Información médica */}
        {medica && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-center mb-3">
              <Heart className="w-5 h-5 text-red-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">Información Médica</h2>
            </div>
            
            <div className="space-y-3">
              {medica.grupo_sanguineo && (
                <div className="bg-red-100 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-red-800">Grupo Sanguíneo:</span>
                    <span className="text-xl font-bold text-red-600">{medica.grupo_sanguineo}</span>
                  </div>
                </div>
              )}
              
              {medica.alergias && (
                <div>
                  <span className="font-medium text-red-600">⚠️ Alergias:</span>
                  <p className="text-sm mt-1 bg-red-50 p-2 rounded">{medica.alergias}</p>
                </div>
              )}
              
              {medica.medicacion && (
                <div>
                  <span className="font-medium">Medicación:</span>
                  <p className="text-sm mt-1 bg-yellow-50 p-2 rounded">{medica.medicacion}</p>
                </div>
              )}
              
              {medica.enfermedades_cronicas && (
                <div>
                  <span className="font-medium">Enfermedades Crónicas:</span>
                  <p className="text-sm mt-1 bg-orange-50 p-2 rounded">{medica.enfermedades_cronicas}</p>
                </div>
              )}
              
              {medica.observaciones && (
                <div>
                  <span className="font-medium">Observaciones:</span>
                  <p className="text-sm mt-1 bg-blue-50 p-2 rounded">{medica.observaciones}</p>
                </div>
              )}
              
              {medica.certificado_grupo_sanguineo && (
                <div className="mt-3">
                  <FileText className="w-4 h-4 inline mr-1" />
                  <a 
                    href={medica.certificado_grupo_sanguineo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Ver Certificado de Grupo Sanguíneo
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Contactos de emergencia */}
        {contactos.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-center mb-3">
              <Phone className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">Contactos de Emergencia</h2>
            </div>
            
            <div className="space-y-3">
              {contactos.map((contacto, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border-2 ${
                    contacto.es_principal 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">
                        {contacto.nombre}
                        {contacto.es_principal && (
                          <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">
                            PRINCIPAL
                          </span>
                        )}
                      </div>
                      {contacto.relacion && (
                        <div className="text-sm text-gray-600">{contacto.relacion}</div>
                      )}
                    </div>
                    
                    <a 
                      href={contacto.llamada_directa}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center"
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      Llamar
                    </a>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    {contacto.telefono}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-6">
          <p>Sistema TGH Pulseras</p>
          <p>Última actualización: {new Date(nfcData.timestamp).toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
