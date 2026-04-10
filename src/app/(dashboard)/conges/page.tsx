'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  CalendarOff, Plus, Check, X, ChevronLeft, ChevronRight,
  Loader2, Clock, Calendar, AlertCircle, CheckCircle
} from 'lucide-react'

type Statut = 'EN_ATTENTE' | 'APPROUVE' | 'REFUSE'
type TypeConge = 'CONGE_PAYE' | 'RTT' | 'MALADIE' | 'ABSENCE' | 'SANS_SOLDE'

interface Conge {
  id: string
  type: TypeConge
  dateDebut: string
  dateFin: string
  nbJours: number
  motif?: string
  statut: Statut
  commentaireAdmin?: string
  employe?: { prenom: string; nom: string }
  createdAt: string
}

const TYPE_LABELS: Record<TypeConge, string> = {
  CONGE_PAYE: 'Congés payés',
  RTT: 'RTT',
  MALADIE: 'Maladie',
  ABSENCE: 'Absence',
  SANS_SOLDE: 'Congé sans solde',
}

const TYPE_COLORS: Record<TypeConge, string> = {
  CONGE_PAYE: 'bg-blue-100 text-blue-700',
  RTT: 'bg-purple-100 text-purple-700',
  MALADIE: 'bg-orange-100 text-orange-700',
  ABSENCE: 'bg-gray-100 text-gray-700',
  SANS_SOLDE: 'bg-pink-100 text-pink-700',
}

const STATUT_COLORS: Record<Statut, string> = {
  EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
  APPROUVE: 'bg-green-100 text-green-700',
  REFUSE: 'bg-red-100 text-red-700',
}

const STATUT_LABELS: Record<Statut, string> = {
  EN_ATTENTE: 'En attente',
  APPROUVE: 'Approuvé',
  REFUSE: 'Refusé',
}

// Color dots for calendar
const EMPLOYEE_COLORS = [
  '#1e3a5f', '#7c3aed', '#059669', '#dc2626', '#d97706',
  '#0891b2', '#be185d', '#65a30d',
]

export default function CongesPage() {
  const { data: session } = useSession()
  const role = session?.user?.role ?? ''
  const isAdmin = role === 'DIRIGEANT' || role === 'SECRETARIAT'

  const [conges, setConges] = useState<Conge[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'demandes' | 'calendrier'>('demandes')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [refusMotif, setRefusMotif] = useState<{ id: string; commentaire: string } | null>(null)

  // Calendar state
  const [calMonth, setCalMonth] = useState(new Date())
  const [calConges, setCalConges] = useState<Conge[]>([])
  const [calLoading, setCalLoading] = useState(false)

  // Form state
  const [form, setForm] = useState({
    type: 'CONGE_PAYE' as TypeConge,
    dateDebut: '',
    dateFin: '',
    motif: '',
  })

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchConges = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/conges')
      if (res.ok) {
        const data = await res.json()
        setConges(data)
      }
    } catch {
      showToast('Erreur lors du chargement', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCalConges = useCallback(async () => {
    setCalLoading(true)
    const y = calMonth.getFullYear()
    const m = String(calMonth.getMonth() + 1).padStart(2, '0')
    const lastDay = new Date(y, calMonth.getMonth() + 1, 0).getDate()
    try {
      const res = await fetch(`/api/conges?statut=APPROUVE&from=${y}-${m}-01&to=${y}-${m}-${lastDay}`)
      if (res.ok) {
        const data = await res.json()
        setCalConges(data)
      }
    } catch {
      // ignore
    } finally {
      setCalLoading(false)
    }
  }, [calMonth])

  useEffect(() => { fetchConges() }, [fetchConges])
  useEffect(() => { if (activeTab === 'calendrier') fetchCalConges() }, [activeTab, calMonth, fetchCalConges])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.dateDebut || !form.dateFin) {
      showToast('Dates requises', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/conges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        showToast('Demande envoyée avec succès')
        setForm({ type: 'CONGE_PAYE', dateDebut: '', dateFin: '', motif: '' })
        setShowForm(false)
        fetchConges()
      } else {
        const err = await res.json()
        showToast(err.error || 'Erreur lors de la soumission', 'error')
      }
    } catch {
      showToast('Erreur réseau', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatut = async (id: string, statut: 'APPROUVE' | 'REFUSE', commentaire?: string) => {
    try {
      const res = await fetch(`/api/conges/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut, ...(commentaire ? { commentaire } : {}) }),
      })
      if (res.ok) {
        showToast(statut === 'APPROUVE' ? 'Demande approuvée' : 'Demande refusée')
        setRefusMotif(null)
        fetchConges()
      } else {
        showToast('Erreur lors de la mise à jour', 'error')
      }
    } catch {
      showToast('Erreur réseau', 'error')
    }
  }

  // Calendar helpers
  const getDaysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  const getFirstDayOfMonth = (d: Date) => {
    const day = new Date(d.getFullYear(), d.getMonth(), 1).getDay()
    return day === 0 ? 6 : day - 1 // Monday = 0
  }

  const getCongesForDay = (day: number) => {
    const y = calMonth.getFullYear()
    const m = calMonth.getMonth()
    const date = new Date(y, m, day)
    return calConges.filter(c => {
      const start = new Date(c.dateDebut)
      const end = new Date(c.dateFin)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      return date >= start && date <= end
    })
  }

  // Build employee color map
  const empColorMap: Record<string, string> = {}
  calConges.forEach(c => {
    const key = c.employe ? `${c.employe.prenom} ${c.employe.nom}` : 'Moi'
    if (!empColorMap[key]) {
      empColorMap[key] = EMPLOYEE_COLORS[Object.keys(empColorMap).length % EMPLOYEE_COLORS.length]
    }
  })

  const enAttente = conges.filter(c => c.statut === 'EN_ATTENTE')
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const approuvesCeMois = conges.filter(c => c.statut === 'APPROUVE' && new Date(c.createdAt) >= startOfMonth)
  const joursAbsents = approuvesCeMois.reduce((s, c) => s + c.nbJours, 0)

  const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Refuse modal */}
      {refusMotif && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Motif de refus</h3>
            <textarea
              className="form-input w-full h-24 resize-none"
              placeholder="Commentaire (optionnel)..."
              value={refusMotif.commentaire}
              onChange={e => setRefusMotif({ ...refusMotif, commentaire: e.target.value })}
            />
            <div className="flex gap-3 mt-4">
              <button className="btn-secondary flex-1" onClick={() => setRefusMotif(null)}>Annuler</button>
              <button
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                onClick={() => handleStatut(refusMotif.id, 'REFUSE', refusMotif.commentaire)}
              >
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarOff className="w-7 h-7" style={{ color: '#1e3a5f' }} />
            Congés & Absences
          </h1>
          <p className="text-gray-500 mt-1">Gérez les demandes de congés et absences</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouvelle demande
        </button>
      </div>

      {/* Admin stats */}
      {isAdmin && (
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'En attente', value: enAttente.length, icon: Clock, color: '#ca8a04', bg: '#fef9c3' },
            { label: 'Approuvés ce mois', value: approuvesCeMois.length, icon: CheckCircle, color: '#16a34a', bg: '#dcfce7' },
            { label: 'Jours absents ce mois', value: joursAbsents, icon: CalendarOff, color: '#1e3a5f', bg: '#e8f0fe' },
          ].map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: stat.bg }}>
                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* New request form */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nouvelle demande</h2>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Type de congé *</label>
              <select
                className="form-input"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as TypeConge })}
              >
                {Object.entries(TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div />
            <div>
              <label className="form-label">Date de début *</label>
              <input
                type="date"
                className="form-input"
                value={form.dateDebut}
                onChange={e => setForm({ ...form, dateDebut: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="form-label">Date de fin *</label>
              <input
                type="date"
                className="form-input"
                value={form.dateFin}
                min={form.dateDebut}
                onChange={e => setForm({ ...form, dateFin: e.target.value })}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Motif (optionnel)</label>
              <textarea
                className="form-input resize-none h-20"
                placeholder="Précisez le motif de votre absence..."
                value={form.motif}
                onChange={e => setForm({ ...form, motif: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
              <button type="submit" className="btn-primary flex items-center gap-2" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Envoyer la demande
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admin tabs */}
      {isAdmin && (
        <div className="flex gap-1 mb-4 border-b border-gray-200">
          {(['demandes', 'calendrier'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'demandes' ? 'Demandes' : 'Calendrier équipe'}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (activeTab === 'calendrier' && isAdmin) ? (
        /* ── TEAM CALENDAR ── */
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {MONTH_NAMES[calMonth.getMonth()]} {calMonth.getFullYear()}
            </h2>
            <button
              onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {calLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: getFirstDayOfMonth(calMonth) }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: getDaysInMonth(calMonth) }).map((_, i) => {
                  const day = i + 1
                  const dayConges = getCongesForDay(day)
                  const isToday = new Date().toDateString() === new Date(calMonth.getFullYear(), calMonth.getMonth(), day).toDateString()
                  return (
                    <div
                      key={day}
                      className={`min-h-[60px] p-1 rounded-lg border text-xs ${isToday ? 'border-blue-400 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}
                    >
                      <div className={`font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{day}</div>
                      <div className="space-y-0.5">
                        {dayConges.slice(0, 3).map((c, idx) => {
                          const name = c.employe ? `${c.employe.prenom}` : 'Moi'
                          const fullName = c.employe ? `${c.employe.prenom} ${c.employe.nom}` : 'Moi'
                          const color = empColorMap[fullName] ?? '#1e3a5f'
                          return (
                            <div
                              key={c.id}
                              title={`${fullName} – ${TYPE_LABELS[c.type]}`}
                              className="rounded px-1 py-0.5 text-white truncate"
                              style={{ backgroundColor: color, fontSize: 10 }}
                            >
                              {name}
                            </div>
                          )
                        })}
                        {dayConges.length > 3 && (
                          <div className="text-gray-400 text-center" style={{ fontSize: 10 }}>+{dayConges.length - 3}</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Legend */}
              {Object.keys(empColorMap).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                  {Object.entries(empColorMap).map(([name, color]) => (
                    <div key={name} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      {name}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* ── REQUESTS LIST ── */
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {isAdmin ? 'Toutes les demandes' : 'Mes demandes'}
            </h2>
            {isAdmin && enAttente.length > 0 && (
              <span className="badge bg-yellow-100 text-yellow-800">{enAttente.length} en attente</span>
            )}
          </div>

          {conges.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CalendarOff className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Aucune demande de congé</p>
              <button className="btn-primary mt-4" onClick={() => setShowForm(true)}>
                Faire une demande
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {isAdmin && <th className="table-header">Employé</th>}
                    <th className="table-header">Type</th>
                    <th className="table-header">Dates</th>
                    <th className="table-header">Nb jours</th>
                    <th className="table-header">Statut</th>
                    {isAdmin && <th className="table-header">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {conges.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      {isAdmin && (
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#1e3a5f' }}>
                              {c.employe?.prenom?.charAt(0) ?? '?'}
                            </div>
                            <span className="text-sm font-medium">{c.employe?.prenom} {c.employe?.nom}</span>
                          </div>
                        </td>
                      )}
                      <td className="table-cell">
                        <span className={`badge text-xs ${TYPE_COLORS[c.type]}`}>{TYPE_LABELS[c.type]}</span>
                      </td>
                      <td className="table-cell text-sm">
                        <span>{new Date(c.dateDebut).toLocaleDateString('fr-FR')}</span>
                        <span className="text-gray-400 mx-1">→</span>
                        <span>{new Date(c.dateFin).toLocaleDateString('fr-FR')}</span>
                      </td>
                      <td className="table-cell text-sm font-semibold">{c.nbJours}j</td>
                      <td className="table-cell">
                        <span className={`badge text-xs ${STATUT_COLORS[c.statut]}`}>{STATUT_LABELS[c.statut]}</span>
                        {c.commentaireAdmin && (
                          <p className="text-xs text-gray-400 mt-1 max-w-xs truncate" title={c.commentaireAdmin}>
                            {c.commentaireAdmin}
                          </p>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="table-cell">
                          {c.statut === 'EN_ATTENTE' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleStatut(c.id, 'APPROUVE')}
                                className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                                title="Approuver"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setRefusMotif({ id: c.id, commentaire: '' })}
                                className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                title="Refuser"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {c.statut !== 'EN_ATTENTE' && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
