'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import React from 'react'
import { useAuth } from '@/lib/auth-context'

interface NavbarProps {
  showLogin?: boolean
  showLogout?: boolean
}

/**
 * Navbar corporativa de TGH con logo y navegación
 */
export default function Navbar({ showLogin = true, showLogout = false }: NavbarProps) {
  const router = useRouter()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <nav className="">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Navegación izquierda */}
          <div className="flex items-center space-x-4">
            {showLogout && (
              <>
                <Link
                  href="/dashboard"
                  className="text-tgh-gray hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-tgh-orange hover:bg-tgh-gold text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Cerrar Sesión
                </button>
              </>
            )}
          </div>

          {/* Logo TGH a la derecha */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.jpeg"
              alt="TGH Logo"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </Link>
        </div>
      </div>
    </nav>
  )
}

/**
 * Logo TGH standalone para uso en otras páginas
 */
export function TGHLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: { width: 32, height: 32, text: 'text-base' },
    md: { width: 48, height: 48, text: 'text-xl' },
    lg: { width: 64, height: 64, text: 'text-2xl' },
  }

  const sizeConfig = sizeClasses[size]

  return (
    <div className={`flex items-center space-x-2 ${sizeConfig.text}`}>
      <Image
        src="/logo.jpeg"
        alt="TGH Logo"
        width={sizeConfig.width}
        height={sizeConfig.height}
        className="object-contain"
        priority
      />
      <div>
        <span className="text-tgh-teal font-bold">TGH</span>
        <div className="text-tgh-gray text-xs">The Golden Hour</div>
      </div>
    </div>
  )
}


