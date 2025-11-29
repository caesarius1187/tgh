import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TGH Pulseras - Sistema de Gestión',
  description: 'Sistema de gestión de pulseras con chips NFC para emergencias médicas',
  keywords: 'pulseras, NFC, emergencias, médicas, TGH',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          {/* Imagen de fondo fija arriba a la izquierda - por encima del fondo pero detrás del contenido */}
          <div 
            id="background-image"
          />
          {/* Imagen de fondo fija abajo a la derecha - por encima del fondo pero detrás del contenido */}
          <div 
            id="background-image-bottom"
          />
          <div className="min-h-screen relative" style={{ zIndex: 0 }}>
            <div className="relative" style={{ zIndex: 200 }}>
              {children}
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
