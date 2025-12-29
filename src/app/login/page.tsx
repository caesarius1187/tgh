'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import Navbar from '@/components/Navbar'
import Card, { CardHeader, CardBody, CardFooter } from '@/components/Card'
import Input from '@/components/Input'
import Button from '@/components/Button'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const success = await login(username, password)
      
      if (success) {
        try {
          const stored = localStorage.getItem('tgh_user')
          const parsed = stored ? JSON.parse(stored) : null
          const rol = parsed?.rol as string | undefined
          if (rol === 'admin_sistema') {
            router.push('/admin/clientes')
          } else {
            router.push('/dashboard')
          }
        } catch {
          router.push('/dashboard')
        }
      } else {
        setError('Credenciales incorrectas. Intenta nuevamente.')
      }
    } catch (error) {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Navbar showLogin={false} showLogout={false} />
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 relative z-10">
          <Card className="!shadow-none">
            <CardHeader
              title="Iniciar Sesión"
              subtitle="Accede a tu cuenta de TGH Pulseras"
              className="text-center [&_p]:text-white"
            />
            
            <CardBody>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="[&_.label]:!text-white">
                  <Input
                    id="username"
                    label="Usuario"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ingresa tu usuario"
                  />
                </div>
                
                <div className="[&_.label]:!text-white">
                  <Input
                    id="password"
                    label="Contraseña"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border-2 border-red-500 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="secondary"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full !bg-white !text-tgh-navy hover:!bg-gray-100"
                >
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </form>
            </CardBody>
            
            <CardFooter className="!border-t-0 !pt-0 !mt-0">
              <div className="space-y-4">
                <p className="text-center text-sm text-white">
                  ¿No tienes cuenta?{' '}
                  <Link href="/activacion" className="text-tgh-orange hover:text-tgh-gold font-medium transition-colors">
                    Activa tu pulsera aquí
                  </Link>
                </p>
                
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
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  )
}
