'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import Navbar from '@/components/Navbar'
import { HexagonalPatternCSS } from '@/components/HexagonalPattern'
import Card, { CardHeader, CardBody, CardFooter } from '@/components/Card'
import Input from '@/components/Input'
import Button from '@/components/Button'

export default function ActivacionPage() {
  const [serial, setSerial] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Validar serial, 2: Registro
  
  const { register } = useAuth()
  const router = useRouter()

  const validateSerial = async () => {
    if (!serial.trim()) {
      setError('Por favor ingresa el serial de tu pulsera')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/validate-serial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serial: serial.trim() }),
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        setStep(2)
      } else {
        setError(data.message || 'Serial inválido o ya activado')
      }
    } catch (error) {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      setIsLoading(false)
      return
    }

    try {
      const result = await register(username, password, serial, confirmPassword)
      
      if (result.success) {
        router.push('/dashboard')
      } else {
        // Mostrar error principal
        let errorMessage = result.error || 'Error en el registro'
        
        // Agregar detalles si existen
        if (result.details && result.details.length > 0) {
          errorMessage += ':\n• ' + result.details.join('\n• ')
        }
        
        setError(errorMessage)
      }
    } catch (error) {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Navbar showLogin={true} showLogout={false} />
      <div className="min-h-screen flex items-center justify-center bg-tgh-teal relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
        {/* Patrón hexagonal de fondo */}
        <HexagonalPatternCSS />
        
        <div className="max-w-md w-full space-y-8 relative z-10">
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardHeader
              title={step === 1 ? 'Activar Pulsera' : 'Crear Cuenta'}
              subtitle={
                step === 1 
                  ? 'Ingresa el serial de tu pulsera NFC para comenzar'
                  : 'Completa tus datos para activar tu pulsera'
              }
            />

            {step === 1 ? (
              <CardBody>
                <div className="space-y-6">
                  <Input
                    id="serial"
                    label="Serial de la Pulsera"
                    type="text"
                    required
                    value={serial}
                    onChange={(e) => setSerial(e.target.value.toUpperCase())}
                    placeholder="Ej: TGH001"
                    helperText="El serial se encuentra en la etiqueta de tu pulsera"
                  />

                  {error && (
                    <div className="bg-red-50 border-2 border-red-500 text-red-600 px-4 py-3 rounded-lg text-sm whitespace-pre-line">
                      {error}
                    </div>
                  )}

                  <Button
                    onClick={validateSerial}
                    variant="primary"
                    size="lg"
                    isLoading={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Validando...' : 'Validar Serial'}
                  </Button>
                </div>
              </CardBody>
            ) : (
              <CardBody>
                <form className="space-y-6" onSubmit={handleRegister}>
                  <div className="space-y-4">
                    <div>
                      <label className="label">
                        Serial Validado
                      </label>
                      <div className="px-4 py-3 bg-green-50 border-2 border-green-500 text-green-800 rounded-lg text-sm font-medium flex items-center">
                        <svg 
                          className="w-5 h-5 mr-2" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                          />
                        </svg>
                        {serial}
                      </div>
                    </div>

                    <Input
                      id="username"
                      label="Usuario"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Elige un nombre de usuario"
                    />

                    <Input
                      id="password"
                      label="Contraseña"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      helperText="Debe contener: mayúscula, minúscula, número y carácter especial"
                    />

                    <Input
                      id="confirmPassword"
                      label="Confirmar Contraseña"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite tu contraseña"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border-2 border-red-500 text-red-600 px-4 py-3 rounded-lg text-sm whitespace-pre-line">
                      {error}
                    </div>
                  )}

                  <div className="space-y-3">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      isLoading={isLoading}
                      className="w-full"
                    >
                      {isLoading ? 'Creando cuenta...' : 'Activar Pulsera'}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => setStep(1)}
                      className="w-full"
                    >
                      <svg 
                        className="w-4 h-4 mr-2 inline" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                        />
                      </svg>
                      Cambiar serial
                    </Button>
                  </div>
                </form>
              </CardBody>
            )}

            <CardFooter>
              <div className="text-center">
                <Link 
                  href="/" 
                  className="text-sm text-tgh-teal hover:text-tgh-orange transition-colors inline-flex items-center"
                >
                  <svg 
                    className="w-4 h-4 mr-1" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                    />
                  </svg>
                  Volver al inicio
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  )
}
