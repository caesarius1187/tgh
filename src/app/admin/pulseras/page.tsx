'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import Card, { CardHeader, CardBody } from '@/components/Card'

type PulseraRow = {
  id: number
  serial: string
  is_active: boolean
  public_url: string | null
  id_cliente: number | null
  cliente_nombre?: string | null
  created_at: string
  updated_at: string
}

export default function AdminPulserasPage() {
  const { token } = useAuth()
  const [items, setItems] = useState<PulseraRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      if (!token) return
      setIsLoading(true)
      setError('')
      try {
        const res = await fetch('/api/pulseras', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data?.error || 'Error al obtener pulseras')
        }
        const data = await res.json()
        setItems(data.items || [])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error inesperado')
      } finally {
        setIsLoading(false)
      }
    }
    fetchAll()
  }, [token])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Pulseras</h1>

      <Card>
        <CardHeader title="Listado de pulseras" />
        <CardBody>
          {isLoading ? (
            <div className="text-white">Cargando...</div>
          ) : error ? (
            <div className="text-red-400">{error}</div>
          ) : items.length === 0 ? (
            <div className="text-white">No hay pulseras registradas.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-white">
                <thead>
                  <tr className="text-tgh-orange border-b border-tgh-orange">
                    <th className="py-2 pr-4">Serial</th>
                    <th className="py-2 pr-4">Activa</th>
                    <th className="py-2 pr-4">Cliente</th>
                    <th className="py-2 pr-4">URL pública</th>
                    <th className="py-2 pr-4">Creada</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(p => (
                    <tr key={p.id} className="border-b border-gray-700">
                      <td className="py-2 pr-4">{p.serial}</td>
                      <td className="py-2 pr-4">{p.is_active ? 'Sí' : 'No'}</td>
                      <td className="py-2 pr-4">{p.cliente_nombre || (p.id_cliente ?? '-')}</td>
                      <td className="py-2 pr-4">
                        {p.public_url ? (
                          <a className="text-tgh-gold underline" href={p.public_url} target="_blank" rel="noreferrer">
                            Abrir
                          </a>
                        ) : '-'}
                      </td>
                      <td className="py-2 pr-4">{new Date(p.created_at).toLocaleString()}</td>
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


