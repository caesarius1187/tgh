'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: number
  username: string
  serial?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  register: (username: string, password: string, serial: string, confirmPassword: string) => Promise<{ success: boolean; error?: string; details?: string[] }>
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Verificar si hay token guardado al cargar la app
  useEffect(() => {
    const savedToken = localStorage.getItem('tgh_token')
    const savedUser = localStorage.getItem('tgh_user')
    
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const data = await response.json()
        setToken(data.token)
        setUser(data.user)
        
        // Guardar en localStorage
        localStorage.setItem('tgh_token', data.token)
        localStorage.setItem('tgh_user', JSON.stringify(data.user))
        
        return true
      }
      return false
    } catch (error) {
      console.error('Error en login:', error)
      return false
    }
  }

  const register = async (username: string, password: string, serial: string, confirmPassword: string): Promise<{ success: boolean; error?: string; details?: string[] }> => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, serial, confirmPassword }),
      })

      if (response.ok) {
        const data = await response.json()
        setToken(data.token)
        setUser(data.user)
        
        // Guardar en localStorage
        localStorage.setItem('tgh_token', data.token)
        localStorage.setItem('tgh_user', JSON.stringify(data.user))
        
        return { success: true }
      } else {
        const errorData = await response.json()
        return { 
          success: false, 
          error: errorData.error || 'Error en el registro',
          details: errorData.details || []
        }
      }
    } catch (error) {
      console.error('Error en registro:', error)
      return { 
        success: false, 
        error: 'Error de conexión. Intenta nuevamente.',
        details: []
      }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('tgh_token')
    localStorage.removeItem('tgh_user')
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    register,
    isLoading,
    isAuthenticated: !!user && !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}
