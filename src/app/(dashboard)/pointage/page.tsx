'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { formatDate, formatHours, getStatutBadgeColor } from '@/lib/utils'
import { Clock, Plus, Edit2, Loader2, Check, TrendingUp } from 'lucide-react'
import ExportButton from '@/components/ExportButton'

interface Pointage {
  id: string
  date: string
  heureArrivee?: string
  heureDepart?: string
  pauseDuree: number
  statut: string
  notes?: string
  heuresTravaillees?: number
  heuresSupp?: number
  valide: boolean
  employe: { id: string; nom: string; prenom: string; poste?: string }
}

interface Employe {
  id: string; nom: string; prenom: string; poste?: string
}

function generateTimeSlots(from = '06:00', to = '22:00', step = 30): string[] {
  const slots: string[] = []
  const [fh, fm] = from.split(':').map(Number)
  const [th, tm] = to.split(':').map(Number)
  let current = fh * 60 + fm
  const end = th * 60 + tm
  while (current <= end) {
    slots.push(`${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`)
    current += step
  }
  return slots
}

export default function PointagePage() {
  const { data: session } = useSession()
  const [pointages, setPointages] = useState<Pointage[]>([])
  const [employes, setEmployes] = useState<Employe[]>([])
  const [horairesDebut, setHorairesDebut] = useState<string[]>(['08:00', '08:30', '09:00', '09:30', '10:00'])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [form, setForm] = useState({
    employeId: '',
    date: new Date().toISOString().split('T')[0],
    heureArrivee: '',
    heureDepart: '',
    pauseDuree: 0,
    statut: 'PRESENT',
    notes: '',
  })

  const role = session?.user?.role
  const userId = session?.user?.id
  const canEdit = role === 'DIRIGEANT' || role === 'SECRETARIAT'
  const isEmploye = role === 'EMPLOYE'
  const allTimeSlots = generateTimeSlots()

  useEffect(() => { fetchData() }, [selectedDate])
  useEffect(() => {
    // Load schedule config
    fetch('/api/entreprises/settings')
      .then(r => r.json())
      .then(data => {
        if (data.entreprise?.horairesDebutConfig) {
          setHorairesDebut(data.entreprise.horairesDebutConfig.split(',').filter(Boolean))
        }
      })
      .catch(console.error)
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ date: selectedDate })
      const [ptRes, empRes] = await Promise.all([
        fetch(`/api/pointage?${params}`),
        canEdit ? fetch('/api/employes') : Promise.resolve({ json: () => ({ employes: [] }) } as any),
      ])
      const [ptData, empData] = await Promise.all([ptRes.json(), empRes.json()])
      setPointages(ptData.pointages ?? [])
      setEmployes(empData.employes ?? [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingId ? `/api/pointage/${editingId}` : '/api/pointage'
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
    } catch (err) { console.error(err) }
  }

  const handleValidate = async (id: string) => {
    try {
      await fetch(`/api/pointage/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valide: true }),
      })
      fetchData()
    } catch (err) { console.error(err) }
  }

  const myPointages = isEmploye ? pointages.filter(p => p.employe.id === userId) : []
  const myTodayPointage = myPointages.find(p => p.date.startsWith(new Date().toISOString().split('T')[0]))

  // Total heures supp for employee this week
  const totalHeuressSupSemaine = myPointages.reduce((sum, p) => sum + (p.heuresSupp ?? 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pointage</h1>
          <p className="text-gray-500 mt-1">Suivi des heures de présence</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton type="pointage" />
          <button onClick={() => { setEditingId(null); setForm({ employeId: '', date: new Date().toISOString().split('T')[0], heureArrivee: '', heureDepart: '', pauseDuree: 0, statut: 'PRESENT', notes: '' }); setShowForm(true) }}
            className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {isEmploye ? 'Saisir mes heures' : 'Ajouter'}
          </button>
        </div>
      </div>

      {/* Employee: quick view today */}
      {isEmploye && myTodayPointage && (
        <div className="card mb-6 border-l-4" style={{ borderColor: '#1e3a5f' }}>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Mon pointage d'aujourd'hui</h2>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Arrivée</p>
              <p className="text-xl font-bold text-gray-900">{myTodayPointage.heureArrivee ?? '--:--'}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Départ</p>
              <p className="text-xl font-bold text-gray-900">{myTodayPointage.heureDepart ?? '--:--'}</p>
            </div>
            {myTodayPointage.heuresTravaillees != null && (
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Heures travaillées</p>
                <p className="text-xl font-bold text-green-600">{formatHours(myTodayPointage.heuresTravaillees)}</p>
              </div>
            )}
            {(myTodayPointage.heuresSupp ?? 0) > 0 && (
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Heures supp.</p>
                <p className="text-xl font-bold text-orange-500">{formatHours(myTodayPointage.heuresSupp!)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Employee: overtime counter */}
      {isEmploye && totalHeuressSupSemaine > 0 && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-orange-900">Heures supplémentaires cette semaine</p>
            <p className="text-sm text-orange-700">{formatHours(totalHeuressSupSemaine)} au-dessus de votre contrat</p>
          </div>
        </div>
      )}

      {/* Date filter */}
      <div className="flex items-center gap-4 mb-6">
        <div>
          <label className="form-label">Filtrer par date</label>
          <input type="date" className="form-input" value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)} />
        </div>
        {isEmploye && (
          <div className="pt-5">
            <p className="text-xs text-gray-500">Vous pouvez saisir vos heures pour n'importe quel jour passé</p>
          </div>
        )}
      </div>

      {/* Table */}
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
                  <th className="table-header">Date</th>
                  <th className="table-header">Arrivée</th>
                  <th className="table-header">Départ</th>
                  <th className="table-header">Pause</th>
                  <th className="table-header">Heures</th>
                  <th className="table-header">H. supp.</th>
                  <th className="table-header">Statut</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pointages.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="table-cell text-center text-gray-500 py-8">
                      Aucun pointage pour cette date
                    </td>
                  </tr>
                ) : (
                  pointages.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div>
                          <p className="font-medium">{p.employe.prenom} {p.employe.nom}</p>
                          {p.employe.poste && <p className="text-xs text-gray-500">{p.employe.poste}</p>}
                        </div>
                      </td>
                      <td className="table-cell">{formatDate(p.date)}</td>
                      <td className="table-cell">{p.heureArrivee ?? <span className="text-gray-400">-</span>}</td>
                      <td className="table-cell">{p.heureDepart ?? <span className="text-gray-400">-</span>}</td>
                      <td className="table-cell">{p.pauseDuree}min</td>
                      <td className="table-cell">
                        {p.heuresTravaillees != null ? (
                          <span className="font-medium text-green-700">{formatHours(p.heuresTravaillees)}</span>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="table-cell">
                        {(p.heuresSupp ?? 0) > 0 ? (
                          <span className="font-medium text-orange-600">{formatHours(p.heuresSupp!)}</span>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${getStatutBadgeColor(p.statut)}`}>{p.statut}</span>
                        {p.valide && <span className="ml-1 badge bg-green-100 text-green-700">✓</span>}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <button onClick={() => {
                            setEditingId(p.id)
                            setForm({
                              employeId: p.employe.id,
                              date: p.date.split('T')[0],
                              heureArrivee: p.heureArrivee ?? '',
                              heureDepart: p.heureDepart ?? '',
                              pauseDuree: p.pauseDuree,
                              statut: p.statut,
                              notes: p.notes ?? '',
                            })
                            setShowForm(true)
                          }} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {canEdit && !p.valide && (
                            <button onClick={() => handleValidate(p.id)}
                              className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded" title="Valider">
                              <Check className="w-4 h-4" />
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
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">
              {editingId ? 'Modifier le pointage' : isEmploye ? 'Saisir mes heures' : 'Nouveau pointage'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {canEdit && (
                <div>
                  <label className="form-label">Employé *</label>
                  <select required className="form-input" value={form.employeId}
                    onChange={e => setForm({ ...form, employeId: e.target.value })}>
                    <option value="">Sélectionner un employé</option>
                    {employes.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.prenom} {emp.nom}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="form-label">Date *</label>
                <input type="date" required className="form-input" value={form.date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm({ ...form, date: e.target.value })} />
                {isEmploye && <p className="text-xs text-gray-400 mt-1">Vous pouvez saisir une journée passée</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Heure d'arrivée</label>
                  {isEmploye ? (
                    <select className="form-input" value={form.heureArrivee}
                      onChange={e => setForm({ ...form, heureArrivee: e.target.value })}>
                      <option value="">-- Choisir --</option>
                      {horairesDebut.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  ) : (
                    <input type="time" className="form-input" value={form.heureArrivee}
                      onChange={e => setForm({ ...form, heureArrivee: e.target.value })} />
                  )}
                </div>
                <div>
                  <label className="form-label">Heure de départ</label>
                  <select className="form-input" value={form.heureDepart}
                    onChange={e => setForm({ ...form, heureDepart: e.target.value })}>
                    <option value="">-- Choisir --</option>
                    {allTimeSlots.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Pause (minutes)</label>
                <input type="number" min="0" className="form-input" value={form.pauseDuree}
                  onChange={e => setForm({ ...form, pauseDuree: parseInt(e.target.value) })} />
              </div>
              <div>
                <label className="form-label">Statut</label>
                <select className="form-input" value={form.statut}
                  onChange={e => setForm({ ...form, statut: e.target.value })}>
                  <option value="PRESENT">Présent</option>
                  <option value="ABSENT">Absent</option>
                  <option value="CONGE">Congé</option>
                  <option value="MALADIE">Maladie</option>
                  <option value="FERIE">Férié</option>
                </select>
              </div>
              <div>
                <label className="form-label">Notes (optionnel)</label>
                <textarea className="form-input resize-none" rows={2} value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-secondary flex-1"
                  onClick={() => { setShowForm(false); setEditingId(null) }}>Annuler</button>
                <button type="submit" className="flex-1 text-white font-semibold py-2 px-4 rounded-lg"
                  style={{ background: '#1e3a5f' }}>
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
