'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { formatDate, getStatutBadgeColor } from '@/lib/utils'
import { hasFeature } from '@/lib/subscription'
import { Calendar, Plus, Trash2, Edit2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import ExportButton from '@/components/ExportButton'

interface Planning {
  id: string
  date: string
  heureDebut: string
  heureFin: string
  pauseDuree: number
  notes?: string
  statut: string
  employe?: { id: string; nom: string; prenom: string; poste?: string }
}

interface Employe {
  id: string
  nom: string
  prenom: string
  poste?: string
}

export default function PlanningPage() {
  const { data: session } = useSession()
  const [plannings, setPlannings] = useState<Planning[]>([])
  const [employes, setEmployes] = useState<Employe[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [form, setForm] = useState({
    employeId: '',
    date: new Date().toISOString().split('T')[0],
    heureDebut: '09:00',
    heureFin: '18:00',
    pauseDuree: 60,
    notes: '',
    statut: 'PLANIFIE',
  })

  const role = session?.user?.role
  const abonnement = session?.user?.abonnement as any
  const canEdit = role === 'DIRIGEANT' || role === 'SECRETARIAT'

  // Get week dates
  const getWeekDates = (refDate: Date) => {
    const dates = []
    const monday = new Date(refDate)
    const day = monday.getDay()
    const diff = day === 0 ? -6 : 1 - day
    monday.setDate(monday.getDate() + diff)

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      dates.push(d)
    }
    return dates
  }

  const weekDates = getWeekDates(currentWeek)

  useEffect(() => {
    fetchData()
  }, [currentWeek])

  const fetchData = async () => {
    setLoading(true)
    try {
      const startDate = weekDates[0].toISOString().split('T')[0]
      const endDate = weekDates[6].toISOString().split('T')[0]

      const [planRes, empRes] = await Promise.all([
        fetch(`/api/planning?start=${startDate}&end=${endDate}`),
        fetch('/api/employes'),
      ])

      const [planData, empData] = await Promise.all([planRes.json(), empRes.json()])
      setPlannings(planData.plannings ?? [])
      setEmployes(empData.employes ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingId ? `/api/planning/${editingId}` : '/api/planning'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setShowForm(false)
        setEditingId(null)
        fetchData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce créneau ?')) return
    try {
      await fetch(`/api/planning/${id}`, { method: 'DELETE' })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const getPlanningsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return plannings.filter(p => p.date.startsWith(dateStr))
  }

  const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planning</h1>
          <p className="text-gray-500 mt-1">Gestion des horaires et plannings</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton type="planning" />
          {canEdit && (
            <button
              onClick={() => { setShowForm(true); setEditingId(null) }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouveau créneau
            </button>
          )}
        </div>
      </div>

      {/* Week navigation */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              const prev = new Date(currentWeek)
              prev.setDate(prev.getDate() - 7)
              setCurrentWeek(prev)
            }}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="font-semibold text-gray-900">
              Semaine du {formatDate(weekDates[0])} au {formatDate(weekDates[4])}
            </p>
          </div>
          <button
            onClick={() => {
              const next = new Date(currentWeek)
              next.setDate(next.getDate() + 7)
              setCurrentWeek(next)
            }}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-3">
          {weekDates.map((date, index) => {
            const isToday = date.toDateString() === new Date().toDateString()
            const isWeekend = date.getDay() === 0 || date.getDay() === 6
            const dayPlannings = getPlanningsForDate(date)

            return (
              <div
                key={date.toISOString()}
                className={`rounded-xl border-2 p-3 min-h-32 ${
                  isToday ? 'border-blue-500 bg-blue-50' : isWeekend ? 'border-gray-100 bg-gray-50' : 'border-gray-100 bg-white'
                }`}
              >
                <div className="mb-2">
                  <p className={`text-xs font-semibold uppercase ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                    {JOURS[index]}
                  </p>
                  <p className={`text-lg font-bold ${isToday ? 'text-blue-700' : 'text-gray-800'}`}>
                    {date.getDate()}
                  </p>
                </div>
                <div className="space-y-1">
                  {dayPlannings.map((p) => (
                    <div
                      key={p.id}
                      className="bg-blue-100 text-blue-800 text-xs rounded p-1.5 group relative"
                    >
                      <p className="font-medium truncate">
                        {p.employe ? `${p.employe.prenom} ${p.employe.nom}` : 'Tous'}
                      </p>
                      <p>{p.heureDebut}-{p.heureFin}</p>
                      {canEdit && (
                        <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-0.5 bg-red-500 text-white rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {canEdit && !isWeekend && (
                  <button
                    onClick={() => {
                      setForm(prev => ({ ...prev, date: date.toISOString().split('T')[0] }))
                      setShowForm(true)
                    }}
                    className="mt-1 w-full text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded p-1 transition-colors"
                  >
                    + Ajouter
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">
              {editingId ? 'Modifier le créneau' : 'Nouveau créneau de planning'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Employé</label>
                <select
                  className="form-input"
                  value={form.employeId}
                  onChange={e => setForm({ ...form, employeId: e.target.value })}
                >
                  <option value="">Tous les employés</option>
                  {employes.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.prenom} {emp.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Heure début *</label>
                  <input
                    type="time"
                    required
                    className="form-input"
                    value={form.heureDebut}
                    onChange={e => setForm({ ...form, heureDebut: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Heure fin *</label>
                  <input
                    type="time"
                    required
                    className="form-input"
                    value={form.heureFin}
                    onChange={e => setForm({ ...form, heureFin: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Pause (minutes)</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  className="form-input"
                  value={form.pauseDuree}
                  onChange={e => setForm({ ...form, pauseDuree: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="form-label">Notes (optionnel)</label>
                <textarea
                  className="form-input resize-none"
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Statut</label>
                <select
                  className="form-input"
                  value={form.statut}
                  onChange={e => setForm({ ...form, statut: e.target.value })}
                >
                  <option value="PLANIFIE">Planifié</option>
                  <option value="CONFIRME">Confirmé</option>
                  <option value="ANNULE">Annulé</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null) }}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingId ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
