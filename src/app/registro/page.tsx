'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Card, { CardHeader, CardBody, CardFooter } from '@/components/Card'
import Input from '@/components/Input'
import Button from '@/components/Button'
import { useAuth } from '@/lib/auth-context'

export default function RegistroLectorPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { registerReader } = useAuth()
  const router = useRouter()

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
      const result = await registerReader(username, password, confirmPassword)
      if (result.success) {
        router.push('/dashboard')
      } else {
        let errorMessage = result.error || 'Error en el registro'
        if (result.details && result.details.length > 0) {
          errorMessage += ':\n• ' + result.details.join('\n• ')
        }
        setError(errorMessage)
      }
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Navbar showLogin={true} showLogout={false} />
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 relative z-10">
          <Card>
            <CardHeader
              title="Crear Cuenta"
              subtitle="Regístrate como usuario lector"
              className="text-center [&_p]:text-white"
            />
            <CardBody>
              <form className="space-y-6" onSubmit={handleRegister}>
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

                {error && (
                  <div className="bg-red-50 border-2 border-red-500 text-red-600 px-4 py-3 rounded-lg text-sm whitespace-pre-line">
                    {error}
                  </div>
                )}

                <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
                  {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                </Button>
              </form>
            </CardBody>
            <CardFooter className="!border-t-0 !pt-0 !mt-0">
              <div className="text-center">
                <Link 
                  href="/" 
                  className="text-sm text-tgh-orange hover:text-tgh-gold transition-colors inline-flex items-center font-medium"
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



