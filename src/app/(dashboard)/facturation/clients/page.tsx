'use client'
import { useEffect, useState } from 'react'
import { Users, Plus, Pencil, Trash2, X, Save, Loader2, Building2, Search } from 'lucide-react'

type Client = {
  id: string
  nom: string
  email?: string
  telephone?: string
  adresse?: string
  codePostal?: string
  ville?: string
  siret?: string
  tvaNumero?: string
  notes?: string
  actif: boolean
}

const emptyForm = {
  nom: '',
  email: '',
  telephone: '',
  adresse: '',
  codePostal: '',
  ville: '',
  siret: '',
  tvaNumero: '',
  notes: '',
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/clients')
      const data = await res.json()
      setClients(data.clients ?? [])
    } catch (err) {
      console.error(err)
      setError('Erreur lors du chargement des clients.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const url = editingId ? `/api/clients/${editingId}` : '/api/clients'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Une erreur est survenue.')
        return
      }
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      fetchClients()
    } catch (err) {
      setError('Erreur réseau.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (client: Client) => {
    setEditingId(client.id)
    setForm({
      nom: client.nom,
      email: client.email ?? '',
      telephone: client.telephone ?? '',
      adresse: client.adresse ?? '',
      codePostal: client.codePostal ?? '',
      ville: client.ville ?? '',
      siret: client.siret ?? '',
      tvaNumero: client.tvaNumero ?? '',
      notes: client.notes ?? '',
    })
    setError('')
    setShowForm(true)
  }

  const handleDelete = async (id: string, nom: string) => {
    if (!confirm(`Supprimer le client "${nom}" ? Cette action est irréversible.`)) return
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? 'Erreur lors de la suppression.')
        return
      }
      setClients(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      alert('Erreur réseau.')
    }
  }

  const filteredClients = clients.filter(c =>
    `${c.nom} ${c.email ?? ''} ${c.ville ?? ''} ${c.telephone ?? ''}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 mt-1">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); setError('') }}
          className="text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
          style={{ background: '#1e3a5f' }}
        >
          <Plus className="w-4 h-4" /> Nouveau client
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          className="form-input pl-10"
          placeholder="Rechercher un client..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1e3a5f' }} />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Téléphone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ville</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">SIRET</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                      <Building2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      {search ? 'Aucun client trouvé pour cette recherche.' : 'Aucun client. Créez votre premier client.'}
                    </td>
                  </tr>
                ) : (
                  filteredClients.map(client => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                            style={{ background: '#1e3a5f' }}>
                            {client.nom.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{client.nom}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{client.email ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{client.telephone ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {client.ville ? `${client.codePostal ? client.codePostal + ' ' : ''}${client.ville}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{client.siret ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(client)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(client.id, client.nom)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Modifier le client' : 'Nouveau client'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null) }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Nom / Raison sociale *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="ACME Sarl"
                  value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="contact@client.fr"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Téléphone</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="01 23 45 67 89"
                    value={form.telephone}
                    onChange={e => setForm({ ...form, telephone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Adresse</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="12 rue de la Paix"
                  value={form.adresse}
                  onChange={e => setForm({ ...form, adresse: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Code postal</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="75001"
                    value={form.codePostal}
                    onChange={e => setForm({ ...form, codePostal: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Ville</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Paris"
                    value={form.ville}
                    onChange={e => setForm({ ...form, ville: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">SIRET</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="123 456 789 00012"
                    value={form.siret}
                    onChange={e => setForm({ ...form, siret: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Numéro TVA intracommunautaire</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="FR12345678901"
                    value={form.tvaNumero}
                    onChange={e => setForm({ ...form, tvaNumero: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Notes</label>
                <textarea
                  className="form-input min-h-[80px] resize-y"
                  placeholder="Informations complémentaires..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null) }}
                  className="flex-1 py-2 px-4 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: '#1e3a5f' }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingId ? 'Enregistrer' : 'Créer le client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
