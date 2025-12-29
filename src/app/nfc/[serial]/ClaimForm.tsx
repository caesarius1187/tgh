'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/Input'
import Button from '@/components/Button'
import { useAuth } from '@/lib/auth-context'

export default function ClaimForm({ serial }: { serial: string }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const { claim, user } = useAuth()
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setBusy(true)
    try {
      const result = await claim(username, password, serial, confirmPassword)
      if (result.success) {
        // Redirección según rol
        const stored = localStorage.getItem('tgh_user')
        const currentUser = stored ? JSON.parse(stored) as { rol: string } : user
        const rol = currentUser?.rol
        if (rol === 'admin_sistema') {
          router.push('/admin/clientes')
        } else {
          router.push('/dashboard')
        }
      } else {
        let errorMessage = result.error || 'Error en el registro'
        if (result.details && result.details.length > 0) {
          errorMessage += ':\n• ' + result.details.join('\n• ')
        }
        setError(errorMessage)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 bg-white rounded-lg shadow-sm p-4 border">
      <div>
        <label className="label">Serial validado</label>
        <div className="px-3 py-2 bg-green-50 border-2 border-green-500 text-green-800 rounded-lg text-sm font-medium inline-block">
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

      {error && (
        <div className="bg-red-50 border-2 border-red-500 text-red-600 px-4 py-3 rounded-lg text-sm whitespace-pre-line">
          {error}
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" isLoading={busy} className="w-full">
        {busy ? 'Creando cuenta...' : 'Crear mi cuenta'}
      </Button>
    </form>
  )
}


