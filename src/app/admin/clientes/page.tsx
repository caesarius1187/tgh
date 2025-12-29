'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import Card, { CardHeader, CardBody } from '@/components/Card'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Link from 'next/link'

type ClienteItem = {
  id: number
  nombre_legal: string
  nombre_publico: string
  slug: string
  visibilidad: 'publico' | 'privado'
  estado: 'activo' | 'suspendido'
  creado_en: string
}

export default function AdminClientesPage() {
  const { token } = useAuth()
  const [clientes, setClientes] = useState<ClienteItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    nombre_publico: '',
    nombre_legal: '',
    slug: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchClientes = async () => {
    if (!token) return
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/clientes', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Error al obtener clientes')
      }
      const data = await res.json()
      setClientes(data.items || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClientes()
  }, [token])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (!form.nombre_publico || !form.nombre_legal || !form.slug) {
      setError('Completa nombre público, nombre legal y slug.')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'No se pudo crear el cliente')
      }
      setForm({ nombre_publico: '', nombre_legal: '', slug: '' })
      setCreating(false)
      await fetchClientes()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Clientes</h1>

      <Card>
        <CardHeader
          title="Crear cliente"
          action={(
            <Button
              variant={creating ? 'secondary' : 'primary'}
              onClick={() => setCreating(v => !v)}
            >
              {creating ? 'Cancelar' : 'Nuevo Cliente'}
            </Button>
          )}
        />
        {creating && (
          <CardBody>
            <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={onSubmit}>
              <div>
                <label className="block text-white text-sm mb-1">Nombre público</label>
                <Input
                  value={form.nombre_publico}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm(f => ({ ...f, nombre_publico: e.target.value }))
                  }
                  placeholder="Ej: Clínica Central"
                />
              </div>
              <div>
                <label className="block text-white text-sm mb-1">Nombre legal</label>
                <Input
                  value={form.nombre_legal}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm(f => ({ ...f, nombre_legal: e.target.value }))
                  }
                  placeholder="Ej: Clínica Central S.A."
                />
              </div>
              <div>
                <label className="block text-white text-sm mb-1">Slug</label>
                <Input
                  value={form.slug}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm(f => ({ ...f, slug: e.target.value }))
                  }
                  placeholder="ej: clinica-central"
                />
              </div>
              <div className="md:col-span-3">
                <Button type="submit" isLoading={isSubmitting}>
                  {isSubmitting ? 'Creando...' : 'Crear'}
                </Button>
              </div>
            </form>
          </CardBody>
        )}
      </Card>
      <Card>
        <CardHeader title="Listado de clientes" />
        <CardBody>
          {isLoading ? (
            <div className="text-white">Cargando...</div>
          ) : error ? (
            <div className="text-red-400">{error}</div>
          ) : clientes.length === 0 ? (
            <div className="text-white">No hay clientes registrados.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-white">
                <thead>
                  <tr className="text-tgh-orange border-b border-tgh-orange">
                    <th className="py-2 pr-4">Nombre público</th>
                    <th className="py-2 pr-4">Nombre legal</th>
                    <th className="py-2 pr-4">Slug</th>
                    <th className="py-2 pr-4">Visibilidad</th>
                    <th className="py-2 pr-4">Estado</th>
                    <th className="py-2 pr-4">Creado</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((c) => (
                    <tr key={c.id} className="border-b border-gray-700">
                      <td className="py-2 pr-4">{c.nombre_publico}</td>
                      <td className="py-2 pr-4">{c.nombre_legal}</td>
                      <td className="py-2 pr-4">{c.slug}</td>
                      <td className="py-2 pr-4 capitalize">{c.visibilidad}</td>
                      <td className="py-2 pr-4 capitalize">{c.estado}</td>
                      <td className="py-2 pr-4">{new Date(c.creado_en).toLocaleString()}</td>
                      <td className="py-2 pr-4">
                        <Link href={`/admin/clientes/${c.id}`}>
                          <Button variant="outline" size="sm">Ver</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}


