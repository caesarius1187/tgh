'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Card, { CardHeader, CardBody } from '@/components/Card'
import Button from '@/components/Button'
import Input from '@/components/Input'

type ClienteDetalle = {
  id: number
  nombre_publico: string
  nombre_legal: string
  slug: string
  id_fiscal: string | null
  contacto_email: string | null
  telefono: string | null
  direccion_linea1: string | null
  direccion_linea2: string | null
  direccion_ciudad: string | null
  direccion_provincia: string | null
  direccion_pais: string | null
  direccion_cp: string | null
  visibilidad: 'publico' | 'privado'
  estado: 'activo' | 'suspendido'
  creado_en: string
  actualizado_en: string
}

type UsuarioRow = {
  id: number
  username: string
  rol: 'admin_sistema' | 'portador' | 'lector'
  is_active: boolean
  last_login: string | null
  created_at: string
}

type PulseraRow = {
  id: number
  serial: string
  is_active: boolean
  public_url: string | null
  usuario_username?: string | null
  created_at: string
  updated_at: string
}

export default function ClienteDetallePage() {
  const { token } = useAuth()
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [activeTab, setActiveTab] = useState<'datos' | 'usuarios' | 'pulseras'>('datos')
  const [cliente, setCliente] = useState<ClienteDetalle | null>(null)
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([])
  const [pulseras, setPulseras] = useState<PulseraRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<ClienteDetalle>>({})
  const [linking, setLinking] = useState(false)
  const [available, setAvailable] = useState<PulseraRow[]>([])
  const [selectedPulsera, setSelectedPulsera] = useState<number | ''>('')
  const [linkingBusy, setLinkingBusy] = useState(false)

  useEffect(() => {
    const fetchAll = async () => {
      if (!token || !id) return
      setLoading(true)
      setError('')
      try {
        const [cRes, uRes, pRes] = await Promise.all([
          fetch(`/api/clientes/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/clientes/${id}/usuarios`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/clientes/${id}/pulseras`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (!cRes.ok) throw new Error((await cRes.json().catch(() => ({})))?.error || 'Error cargando cliente')
        if (!uRes.ok) throw new Error((await uRes.json().catch(() => ({})))?.error || 'Error cargando usuarios')
        if (!pRes.ok) throw new Error((await pRes.json().catch(() => ({})))?.error || 'Error cargando pulseras')
        const cData = await cRes.json()
        const uData = await uRes.json()
        const pData = await pRes.json()
        setCliente(cData.item)
        setUsuarios(uData.items || [])
        setPulseras(pData.items || [])
        setForm(cData.item)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error inesperado')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [token, id])

  const refreshPulseras = async () => {
    if (!token || !id) return
    try {
      const res = await fetch(`/api/clientes/${id}/pulseras`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setPulseras(data.items || [])
      }
    } catch {}
  }

  const loadAvailable = async () => {
    if (!token) return
    try {
      const res = await fetch(`/api/pulseras/disponibles`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'No se pudieron cargar pulseras disponibles')
      }
      const data = await res.json()
      setAvailable(data.items || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando pulseras disponibles')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Cliente #{id}</h1>
        <div className="space-x-2">
          {activeTab === 'datos' && (
            <Button variant={editing ? 'secondary' : 'primary'} onClick={() => {
              setEditing(v => !v)
              setForm(cliente || {})
            }}>
              {editing ? 'Cancelar' : 'Editar'}
            </Button>
          )}
          {activeTab === 'pulseras' && (
            <Button
              variant={linking ? 'secondary' : 'primary'}
              onClick={async () => {
                const next = !linking
                setLinking(next)
                if (next) {
                  await loadAvailable()
                } else {
                  setSelectedPulsera('')
                }
              }}
            >
              {linking ? 'Cancelar' : 'Relacionar pulsera'}
            </Button>
          )}
        </div>
      </div>

      <div className="bg-tgh-teal-dark border-b-2 border-tgh-orange">
        <nav className="-mb-px flex space-x-8 px-4">
          {[
            { id: 'datos', name: 'Datos' },
            { id: 'usuarios', name: 'Usuarios' },
            { id: 'pulseras', name: 'Pulseras' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-tgh-orange text-tgh-orange'
                  : 'border-transparent text-tgh-gray hover:text-tgh-gold hover:border-tgh-gold'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="text-white">Cargando...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : !cliente ? (
        <div className="text-white">Cliente no encontrado.</div>
      ) : (
        <>
          {activeTab === 'datos' && (
            <Card>
              <CardHeader title="Datos del cliente" />
              <CardBody>
                {!editing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
                    <div><span className="text-white">Nombre público:</span> {cliente.nombre_publico}</div>
                    <div><span className="text-white">Nombre legal:</span> {cliente.nombre_legal}</div>
                    <div><span className="text-white">Slug:</span> {cliente.slug}</div>
                    <div><span className="text-white">ID Fiscal:</span> {cliente.id_fiscal || '-'}</div>
                    <div><span className="text-white">Email:</span> {cliente.contacto_email || '-'}</div>
                    <div><span className="text-white">Teléfono:</span> {cliente.telefono || '-'}</div>
                    <div className="md:col-span-2">
                      <span className="text-white">Dirección:</span>{' '}
                      {[cliente.direccion_linea1, cliente.direccion_linea2].filter(Boolean).join(' ') || '-'}
                    </div>
                    <div><span className="text-white">Ciudad:</span> {cliente.direccion_ciudad || '-'}</div>
                    <div><span className="text-white">Provincia:</span> {cliente.direccion_provincia || '-'}</div>
                    <div><span className="text-white">País:</span> {cliente.direccion_pais || '-'}</div>
                    <div><span className="text-white">CP:</span> {cliente.direccion_cp || '-'}</div>
                    <div><span className="text-white">Visibilidad:</span> {cliente.visibilidad}</div>
                    <div><span className="text-white">Estado:</span> {cliente.estado}</div>
                    <div><span className="text-white">Creado:</span> {new Date(cliente.creado_en).toLocaleString()}</div>
                    <div><span className="text-white">Actualizado:</span> {new Date(cliente.actualizado_en).toLocaleString()}</div>
                  </div>
                ) : (
                  <form
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white"
                    onSubmit={async (e) => {
                      e.preventDefault()
                      if (!token || !id) return
                      setSaving(true)
                      setError('')
                      try {
                        const payload: Record<string, unknown> = {}
                        const keys: (keyof ClienteDetalle)[] = [
                          'nombre_publico','nombre_legal','slug','id_fiscal','contacto_email','telefono',
                          'direccion_linea1','direccion_linea2','direccion_ciudad','direccion_provincia','direccion_pais','direccion_cp',
                          'visibilidad','estado'
                        ]
                        keys.forEach(k => {
                          if (form[k] !== undefined && form[k] !== (cliente as any)[k]) {
                            payload[k] = form[k] as unknown
                          }
                        })
                        if (Object.keys(payload).length === 0) {
                          setEditing(false)
                          setSaving(false)
                          return
                        }
                        const res = await fetch(`/api/clientes/${id}`, {
                          method: 'PATCH',
                          headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(payload),
                        })
                        if (!res.ok) {
                          const data = await res.json().catch(() => ({}))
                          throw new Error(data?.error || 'No se pudo guardar')
                        }
                        // Refrescar datos
                        setCliente(prev => prev ? ({ ...prev, ...payload, actualizado_en: new Date().toISOString() }) as ClienteDetalle : prev)
                        setEditing(false)
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Error inesperado')
                      } finally {
                        setSaving(false)
                      }
                    }}
                  >
                    <div>
                      <label className="block text-white text-sm mb-1">Nombre público</label>
                      <Input
                        value={form.nombre_publico || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, nombre_publico: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm mb-1">Nombre legal</label>
                      <Input
                        value={form.nombre_legal || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, nombre_legal: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm mb-1">Slug</label>
                      <Input
                        value={form.slug || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, slug: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm mb-1">ID Fiscal</label>
                      <Input
                        value={form.id_fiscal || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, id_fiscal: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm mb-1">Email</label>
                      <Input
                        type="email"
                        value={form.contacto_email || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, contacto_email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm mb-1">Teléfono</label>
                      <Input
                        value={form.telefono || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, telefono: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-white text-sm mb-1">Dirección línea 1</label>
                      <Input
                        value={form.direccion_linea1 || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, direccion_linea1: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-white text-sm mb-1">Dirección línea 2</label>
                      <Input
                        value={form.direccion_linea2 || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, direccion_linea2: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm mb-1">Ciudad</label>
                      <Input
                        value={form.direccion_ciudad || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, direccion_ciudad: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm mb-1">Provincia</label>
                      <Input
                        value={form.direccion_provincia || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, direccion_provincia: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm mb-1">País</label>
                      <Input
                        value={form.direccion_pais || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, direccion_pais: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm mb-1">CP</label>
                      <Input
                        value={form.direccion_cp || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, direccion_cp: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm mb-1">Visibilidad</label>
                      <select
                        className="input-field"
                        value={form.visibilidad || ''}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setForm(f => ({ ...f, visibilidad: e.target.value as 'publico' | 'privado' }))
                        }
                      >
                        <option value="">Seleccionar</option>
                        <option value="publico">publico</option>
                        <option value="privado">privado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-white text-sm mb-1">Estado</label>
                      <select
                        className="input-field"
                        value={form.estado || ''}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setForm(f => ({ ...f, estado: e.target.value as 'activo' | 'suspendido' }))
                        }
                      >
                        <option value="">Seleccionar</option>
                        <option value="activo">activo</option>
                        <option value="suspendido">suspendido</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Button type="submit" isLoading={saving}>
                        {saving ? 'Guardando...' : 'Guardar cambios'}
                      </Button>
                    </div>
                  </form>
                )}
              </CardBody>
            </Card>
          )}

          {activeTab === 'usuarios' && (
            <Card>
              <CardHeader title="Usuarios del cliente" />
              <CardBody>
                {usuarios.length === 0 ? (
                  <div className="text-white">No hay usuarios relacionados.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-white">
                      <thead>
                        <tr className="text-tgh-orange border-b border-tgh-orange">
                          <th className="py-2 pr-4">Usuario</th>
                          <th className="py-2 pr-4">Rol</th>
                          <th className="py-2 pr-4">Activo</th>
                          <th className="py-2 pr-4">Último login</th>
                          <th className="py-2 pr-4">Creado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usuarios.map(u => (
                          <tr key={u.id} className="border-b border-gray-700">
                            <td className="py-2 pr-4">{u.username}</td>
                            <td className="py-2 pr-4">{u.rol}</td>
                            <td className="py-2 pr-4">{u.is_active ? 'Sí' : 'No'}</td>
                            <td className="py-2 pr-4">{u.last_login ? new Date(u.last_login).toLocaleString() : '-'}</td>
                            <td className="py-2 pr-4">{new Date(u.created_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {activeTab === 'pulseras' && (
            <Card>
              <CardHeader title="Pulseras del cliente" />
              <CardBody>
                {linking && (
                  <div className="mb-4">
                    <label className="block text-white text-sm mb-1">Seleccionar pulsera disponible</label>
                    <div className="flex items-center gap-2">
                      <select
                        className="input-field"
                        value={selectedPulsera}
                        onChange={(e) => setSelectedPulsera(Number(e.target.value) || '')}
                      >
                        <option value="">-- Selecciona serial --</option>
                        {available.map(a => (
                          <option key={a.id} value={a.id}>{a.serial}</option>
                        ))}
                      </select>
                      <Button
                        onClick={async () => {
                          if (!token || !id || !selectedPulsera) return
                          setLinkingBusy(true)
                          setError('')
                          try {
                            const res = await fetch(`/api/clientes/${id}/pulseras`, {
                              method: 'POST',
                              headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({ pulsera_id: selectedPulsera }),
                            })
                            if (!res.ok) {
                              const data = await res.json().catch(() => ({}))
                              throw new Error(data?.error || 'No se pudo relacionar la pulsera')
                            }
                            setSelectedPulsera('')
                            setLinking(false)
                            await refreshPulseras()
                          } catch (e) {
                            setError(e instanceof Error ? e.message : 'Error al relacionar pulsera')
                          } finally {
                            setLinkingBusy(false)
                          }
                        }}
                        disabled={!selectedPulsera || linkingBusy}
                        isLoading={linkingBusy}
                      >
                        {linkingBusy ? 'Relacionando...' : 'Relacionar'}
                      </Button>
                    </div>
                  </div>
                )}

                {pulseras.length === 0 ? (
                  <div className="text-white">No hay pulseras relacionadas.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-white">
                      <thead>
                        <tr className="text-tgh-orange border-b border-tgh-orange">
                          <th className="py-2 pr-4">Serial</th>
                          <th className="py-2 pr-4">Activa</th>
                          <th className="py-2 pr-4">Usuario</th>
                          <th className="py-2 pr-4">URL Pública</th>
                          <th className="py-2 pr-4">Creada</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pulseras.map(p => (
                          <tr key={p.id} className="border-b border-gray-700">
                            <td className="py-2 pr-4">{p.serial}</td>
                            <td className="py-2 pr-4">{p.is_active ? 'Sí' : 'No'}</td>
                            <td className="py-2 pr-4">{p.usuario_username || '-'}</td>
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
          )}
        </>
      )}
    </div>
  )
}


