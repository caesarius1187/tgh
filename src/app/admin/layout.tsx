'use client'

import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user && user.rol !== 'admin_sistema') {
      router.replace('/dashboard')
    }
  }, [user, isLoading, router])

  return (
    <ProtectedRoute>
      <Navbar showLogin={false} showLogout={true} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </ProtectedRoute>
  )
}


