'use client'

import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import { HexagonalPatternCSS } from '@/components/HexagonalPattern'
import Card, { CardHeader, CardBody } from '@/components/Card'
import Button from '@/components/Button'

export default function HomePage() {
  return (
    <>
      <Navbar showLogin={true} showLogout={false} />
      <main className="min-h-screen flex items-center justify-center bg-tgh-teal relative overflow-hidden">
        {/* Patrón hexagonal de fondo */}
        <HexagonalPatternCSS />
        
        <div className="max-w-md w-full space-y-8 p-8 relative z-10">
          <Card className="bg-white/95 backdrop-blur-sm">
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
                <p className="text-tgh-teal font-semibold mb-2">
                  The Golden Hour
                </p>
                <p className="text-tgh-navy text-sm">
                  Sistema de gestión de pulseras con chips NFC para emergencias médicas
                </p>
              </div>
              
              <div className="space-y-4">
                <Link href="/activacion" className="block">
                  <Button variant="primary" size="lg" className="w-full">
                    Activar Pulsera
                  </Button>
                </Link>
                
                <Link href="/login" className="block">
                  <Button variant="secondary" size="lg" className="w-full">
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
              
              <div className="text-center text-sm text-tgh-navy mt-6 pt-6 border-t border-tgh-teal/30">
                <p>¿Necesitas ayuda? Contacta al administrador</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </main>
    </>
  )
}
