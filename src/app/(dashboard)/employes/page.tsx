'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getRoleBadgeColor, getRoleLabel, formatDate, formatCurrency } from '@/lib/utils'
import { Users, Plus, Edit2, Trash2, Search, Loader2, Eye, EyeOff, Mail, CheckCircle } from 'lucide-react'

interface Employe {
  id: string; email: string; nom: string; prenom: string; role: string
  poste?: string; tauxHoraire: number; telephone?: string; dateEmbauche?: string
  actif: boolean; heuresContractuelles?: number
}

const ROLES_EMPLOYE = ['EMPLOYE']
const ROLES_DIRIGEANT = ['EMPLOYE', 'SECRETARIAT']

export default function EmployesPage() {
  const { data: session } = useSession()
  const [employes, setEmployes] = useState<Employe[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [createResult, setCreateResult] = useState<{ emailSent: boolean; email: string; password: string } | null>(null)
  const [form, setForm] = useState({
    email: '', password: '', nom: '', prenom: '', role: 'EMPLOYE',
    poste: '', tauxHoraire: 15, telephone: '',
    dateEmbauche: new Date().toISOString().split('T')[0],
    heuresContractuelles: '',
  })

  const role = session?.user?.role
  const isDirigeant = role === 'DIRIGEANT'
  const canEdit = role === 'DIRIGEANT' || role === 'SECRETARIAT'

  useEffect(() => {
    if (!canEdit) return
    fetchEmployes()
  }, [])

  const fetchEmployes = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/employes')
      const data = await res.json()
      setEmployes(data.employes ?? [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateResult(null)
    try {
      const url = editingId ? `/api/employes/${editingId}` : '/api/employes'
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId
        ? { ...form, password: form.password || undefined }
        : form

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const data = await res.json()
        if (!editingId && data.emailSent !== undefined) {
          setCreateResult({ emailSent: data.emailSent, email: form.email, password: form.password })
        }
        if (editingId) {
          setShowForm(false)
          setEditingId(null)
          resetForm()
        }
        fetchEmployes()
      }
    } catch (err) { console.error(err) }
  }

  const handleToggleActif = async (id: string, actif: boolean) => {
    try {
      await fetch(`/api/employes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !actif }),
      })
      fetchEmployes()
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer définitivement cet employé ?')) return
    try {
      await fetch(`/api/employes/${id}`, { method: 'DELETE' })
      fetchEmployes()
    } catch (err) { console.error(err) }
  }

  const resetForm = () => {
    setForm({
      email: '', password: '', nom: '', prenom: '', role: 'EMPLOYE',
      poste: '', tauxHoraire: 15, telephone: '',
      dateEmbauche: new Date().toISOString().split('T')[0],
      heuresContractuelles: '',
    })
  }

  const allowedRoles = isDirigeant ? ROLES_DIRIGEANT : ROLES_EMPLOYE
  const filteredEmployes = employes.filter(e =>
    `${e.prenom} ${e.nom} ${e.email} ${e.poste}`.toLowerCase().includes(search.toLowerCase())
  )

  if (!canEdit) {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Accès non autorisé</p></div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des employés</h1>
          <p className="text-gray-500 mt-1">{employes.filter(e => e.actif).length} employés actifs</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); resetForm(); setCreateResult(null) }}
          className="text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
          style={{ background: '#1e3a5f' }}>
          <Plus className="w-4 h-4" /> Nouvel employé
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" className="form-input pl-10" placeholder="Rechercher un employé..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1e3a5f' }} />
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Employé</th>
                  <th className="table-header">Rôle</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Taux horaire</th>
                  <th className="table-header">Contrat</th>
                  <th className="table-header">Date embauche</th>
                  <th className="table-header">Statut</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredEmployes.length === 0 ? (
                  <tr><td colSpan={8} className="table-cell text-center text-gray-500 py-8">Aucun employé trouvé</td></tr>
                ) : (
                  filteredEmployes.map((emp) => (
                    <tr key={emp.id} className={`hover:bg-gray-50 ${!emp.actif ? 'opacity-50' : ''}`}>
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                            style={{ background: '#1e3a5f' }}>
                            {emp.prenom.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{emp.prenom} {emp.nom}</p>
                            {emp.poste && <p className="text-xs text-gray-500">{emp.poste}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell"><span className={`badge ${getRoleBadgeColor(emp.role)}`}>{getRoleLabel(emp.role)}</span></td>
                      <td className="table-cell text-gray-600">{emp.email}</td>
                      <td className="table-cell font-medium">{formatCurrency(emp.tauxHoraire)}/h</td>
                      <td className="table-cell">{emp.heuresContractuelles ? `${emp.heuresContractuelles}h/sem` : <span className="text-gray-400">Défaut</span>}</td>
                      <td className="table-cell">{emp.dateEmbauche ? formatDate(emp.dateEmbauche) : '-'}</td>
                      <td className="table-cell">
                        <span className={`badge ${emp.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {emp.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <button onClick={() => {
                            setEditingId(emp.id)
                            setForm({ ...form, ...emp, password: '', heuresContractuelles: emp.heuresContractuelles?.toString() ?? '', dateEmbauche: emp.dateEmbauche?.split('T')[0] ?? '' })
                            setCreateResult(null)
                            setShowForm(true)
                          }} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleToggleActif(emp.id, emp.actif)}
                            className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                            title={emp.actif ? 'Désactiver' : 'Activer'}>
                            {emp.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          {isDirigeant && (
                            <button onClick={() => handleDelete(emp.id)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-screen overflow-y-auto">
            {createResult ? (
              <div className="text-center py-4">
                {createResult.emailSent ? (
                  <>
                    <Mail className="w-12 h-12 mx-auto mb-3" style={{ color: '#1e3a5f' }} />
                    <h2 className="text-lg font-bold text-gray-900 mb-2">Compte créé — Email envoyé !</h2>
                    <p className="text-gray-500 text-sm">Les identifiants ont été envoyés à <strong>{createResult.email}</strong></p>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <h2 className="text-lg font-bold text-gray-900 mb-2">Compte créé !</h2>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left mt-3">
                      <p className="text-sm font-semibold text-blue-900 mb-2">⚠️ Email non configuré — transmettez ces informations à l'employé :</p>
                      <p className="text-sm text-blue-800"><strong>Email :</strong> {createResult.email}</p>
                      <p className="text-sm text-blue-800"><strong>Mot de passe :</strong> {createResult.password}</p>
                    </div>
                  </>
                )}
                <button onClick={() => { setShowForm(false); setCreateResult(null); resetForm() }}
                  className="mt-5 text-white font-semibold py-2 px-6 rounded-lg"
                  style={{ background: '#1e3a5f' }}>
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-5">
                  {editingId ? 'Modifier l\'employé' : 'Créer un compte employé'}
                </h2>
                {!editingId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
                    Un email avec les identifiants sera envoyé automatiquement à l'employé.
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Prénom *</label>
                      <input type="text" required className="form-input" value={form.prenom}
                        onChange={e => setForm({ ...form, prenom: e.target.value })} />
                    </div>
                    <div>
                      <label className="form-label">Nom *</label>
                      <input type="text" required className="form-input" value={form.nom}
                        onChange={e => setForm({ ...form, nom: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Email *</label>
                    <input type="email" required className="form-input" value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">
                      Mot de passe {editingId ? '(laisser vide pour ne pas changer)' : '*'}
                      <span className="ml-2 text-xs font-normal text-gray-400">— défini par l'administration</span>
                    </label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} required={!editingId}
                        className="form-input pr-10" value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })} />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {isDirigeant && (
                      <div>
                        <label className="form-label">Rôle *</label>
                        <select className="form-input" value={form.role}
                          onChange={e => setForm({ ...form, role: e.target.value })}>
                          {allowedRoles.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="form-label">Poste</label>
                      <input type="text" className="form-input" value={form.poste}
                        onChange={e => setForm({ ...form, poste: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Taux horaire (€) *</label>
                      <input type="number" required min="0" step="0.01" className="form-input"
                        value={form.tauxHoraire}
                        onChange={e => setForm({ ...form, tauxHoraire: parseFloat(e.target.value) })} />
                    </div>
                    <div>
                      <label className="form-label">Heures contractuelles/sem</label>
                      <input type="number" min="1" max="60" className="form-input"
                        placeholder="Défaut entreprise" value={form.heuresContractuelles}
                        onChange={e => setForm({ ...form, heuresContractuelles: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Téléphone</label>
                      <input type="tel" className="form-input" value={form.telephone}
                        onChange={e => setForm({ ...form, telephone: e.target.value })} />
                    </div>
                    <div>
                      <label className="form-label">Date d'embauche</label>
                      <input type="date" className="form-input" value={form.dateEmbauche}
                        onChange={e => setForm({ ...form, dateEmbauche: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" className="btn-secondary flex-1"
                      onClick={() => { setShowForm(false); setEditingId(null) }}>Annuler</button>
                    <button type="submit" className="flex-1 text-white font-semibold py-2 px-4 rounded-lg"
                      style={{ background: '#1e3a5f' }}>
                      {editingId ? 'Enregistrer' : 'Créer le compte'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
