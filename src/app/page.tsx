'use client'

import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Card, { CardHeader, CardBody } from '@/components/Card'
import Button from '@/components/Button'

export default function HomePage() {
  return (
    <>
      <Navbar showLogin={true} showLogout={false} />
      <main className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 relative z-10">
          <Card className="!shadow-none">
            <CardBody>
              <div className="text-center mb-8">
                {/* Logo TGH */}
                <div className="flex justify-center mb-6">
                  <Image
                    src="/logo.jpeg"
                    alt="TGH Logo"
                    width={120}
                    height={120}
                    className="object-contain"
                    priority
                  />
                </div>
                
                <h1 className="text-4xl font-bold text-tgh-orange mb-2">
                  TGH Pulseras
                </h1>
                <p className="text-white font-semibold mb-2">
                  The Golden Hour
                </p>
                <p className="text-sm text-white">
                  Sistema de gestión de pulseras con chips NFC para emergencias médicas
                </p>
              </div>
              
              <div className="space-y-4">
                <Link href="/activacion" className="block">
                  <Button variant="primary" size="lg" className="w-full">
                    Activar Dispositivo
                  </Button>
                </Link>
                
                <Link href="/login" className="block">
                  <Button variant="secondary" size="lg" className="w-full !bg-white !text-tgh-navy hover:!bg-gray-100">
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
              
              <div className="text-center text-sm text-white mt-6">
                <p>¿Necesitas ayuda? Contacta al administrador</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </main>
    </>
  )
}
