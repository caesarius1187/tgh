'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {step === 1 ? 'Activar Pulsera' : 'Crear Cuenta'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1 
              ? 'Ingresa el serial de tu pulsera NFC para comenzar'
              : 'Completa tus datos para activar tu pulsera'
            }
          </p>
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            <div>
              <label htmlFor="serial" className="block text-sm font-medium text-gray-700">
                Serial de la Pulsera
              </label>
              <input
                id="serial"
                name="serial"
                type="text"
                required
                value={serial}
                onChange={(e) => setSerial(e.target.value.toUpperCase())}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Ej: TGH001"
              />
              <p className="mt-1 text-xs text-gray-500">
                El serial se encuentra en la etiqueta de tu pulsera
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm whitespace-pre-line">
                {error}
              </div>
            )}

            <button
              onClick={validateSerial}
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Validando...' : 'Validar Serial'}
            </button>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleRegister}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Serial Validado
                </label>
                <div className="mt-1 px-3 py-2 bg-green-50 border border-green-200 text-green-800 rounded-md text-sm font-medium">
                  ✅ {serial}
                </div>
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Usuario
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Elige un nombre de usuario"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Mínimo 8 caracteres"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Debe contener: mayúscula, minúscula, número y carácter especial
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar Contraseña
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Repite tu contraseña"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm whitespace-pre-line">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creando cuenta...' : 'Activar Pulsera'}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                ← Cambiar serial
              </button>
            </div>
          </form>
        )}

        <div className="text-center">
          <Link 
            href="/" 
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
