'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { formatCurrency, formatHours, getPeriodeLabel, getCurrentPeriode } from '@/lib/utils'
import { FileText, Plus, Loader2, Printer, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import ExportButton from '@/components/ExportButton'

interface Paie {
  id: string
  periode: string
  heuresTravaillees: number
  heuresSupp: number
  tauxHoraire: number
  tauxHeuresSupp: number
  salaireBrut: number
  cotisationsSalariales: number
  cotisationsPatronales: number
  salaireNet: number
  congesPayes: number
  primes: number
  retenues: number
  notes?: string
  valide: boolean
  valideeAt?: string
  genereAt: string
  employe: { id: string; nom: string; prenom: string; poste?: string }
}

interface Employe {
  id: string
  nom: string
  prenom: string
  poste?: string
  tauxHoraire: number
}

export default function PaiePage() {
  const { data: session } = useSession()
  const [paies, setPaies] = useState<Paie[]>([])
  const [employes, setEmployes] = useState<Employe[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedPeriode, setSelectedPeriode] = useState(getCurrentPeriode())
  const [selectedPaie, setSelectedPaie] = useState<Paie | null>(null)
  const [showGenerateForm, setShowGenerateForm] = useState(false)
  const [genForm, setGenForm] = useState({ employeId: '', periode: getCurrentPeriode() })

  const role = session?.user?.role
  const canEdit = role === 'DIRIGEANT' || role === 'SECRETARIAT'
  const isAdmin = canEdit

  useEffect(() => {
    fetchData()
  }, [selectedPeriode])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [paieRes, empRes] = await Promise.all([
        fetch(`/api/paie?periode=${selectedPeriode}`),
        canEdit ? fetch('/api/employes') : Promise.resolve({ json: () => ({ employes: [] }) } as any),
      ])
      const [paieData, empData] = await Promise.all([paieRes.json(), empRes.json()])
      setPaies(paieData.paies ?? [])
      setEmployes(empData.employes ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)
    try {
      const res = await fetch('/api/paie/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(genForm),
      })
      if (res.ok) {
        setShowGenerateForm(false)
        fetchData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  const handleValidate = async (paie: Paie, valide: boolean) => {
    try {
      const res = await fetch(`/api/paie/${paie.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valide }),
      })
      if (res.ok) {
        const data = await res.json()
        setPaies(prev => prev.map(p => p.id === paie.id ? { ...p, ...data.paie } : p))
        setSelectedPaie(prev => prev?.id === paie.id ? { ...prev, ...data.paie } : prev)
      }
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette fiche de paie ?')) return
    try {
      const res = await fetch(`/api/paie/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setPaies(prev => prev.filter(p => p.id !== id))
        if (selectedPaie?.id === id) setSelectedPaie(null)
      }
    } catch (err) { console.error(err) }
  }

  const handlePrint = () => {
    window.print()
  }

  const periods = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const multiplierLabel = (taux: number) => {
    if (taux <= 0) return ''
    if (taux === 1) return '(×1.00 — sans majoration)'
    return `(×${taux.toFixed(2)})`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fiches de paie</h1>
          <p className="text-gray-500 mt-1">Bulletins de salaire et gestion de la paie</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && <ExportButton type="paie" />}
          {canEdit && (
            <button
              onClick={() => setShowGenerateForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Générer une fiche
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div>
          <label className="form-label">Période</label>
          <select
            className="form-input"
            value={selectedPeriode}
            onChange={e => setSelectedPeriode(e.target.value)}
          >
            {periods.map(p => (
              <option key={p} value={p}>{getPeriodeLabel(p)}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-1 space-y-3">
            {paies.length === 0 ? (
              <div className="card text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucune fiche de paie pour {getPeriodeLabel(selectedPeriode)}</p>
                {canEdit && (
                  <button onClick={() => setShowGenerateForm(true)} className="btn-primary mt-3 text-sm">
                    Générer des fiches
                  </button>
                )}
              </div>
            ) : (
              paies.map((paie) => (
                <div
                  key={paie.id}
                  onClick={() => setSelectedPaie(paie)}
                  className={`card cursor-pointer transition-all hover:shadow-md ${
                    selectedPaie?.id === paie.id ? 'border-2' : ''
                  }`}
                  style={selectedPaie?.id === paie.id ? { borderColor: '#1e3a5f' } : {}}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {paie.employe.prenom} {paie.employe.nom}
                      </p>
                      <p className="text-xs text-gray-500">{paie.employe.poste}</p>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p className="font-bold" style={{ color: '#1e3a5f' }}>{formatCurrency(paie.salaireNet)}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        paie.valide ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {paie.valide ? 'Validée' : 'En attente'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>{formatHours(paie.heuresTravaillees)} travaillées</span>
                    {isAdmin && <span>{formatCurrency(paie.salaireBrut)} brut</span>}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                      {paie.valide ? (
                        <button
                          onClick={() => handleValidate(paie, false)}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200"
                        >
                          <XCircle className="w-3 h-3" />
                          Annuler validation
                        </button>
                      ) : (
                        <button
                          onClick={() => handleValidate(paie, true)}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Accepter
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(paie.id)}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 ml-auto"
                      >
                        <Trash2 className="w-3 h-3" />
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Detail / Bulletin */}
          <div className="lg:col-span-2">
            {selectedPaie ? (
              <div className="card" id="bulletin-paie">
                <div className="flex items-center justify-between mb-6 no-print">
                  <h2 className="text-lg font-semibold text-gray-900">Bulletin de paie</h2>
                  <button onClick={handlePrint} className="btn-secondary flex items-center gap-2 text-sm">
                    <Printer className="w-4 h-4" />
                    Imprimer
                  </button>
                </div>

                {/* Header */}
                <div className="border-b border-gray-100 pb-4 mb-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Employé</p>
                      <p className="font-bold text-gray-900 text-lg">
                        {selectedPaie.employe.prenom} {selectedPaie.employe.nom}
                      </p>
                      <p className="text-sm text-gray-600">{selectedPaie.employe.poste}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Période</p>
                      <p className="font-bold text-gray-900">{getPeriodeLabel(selectedPaie.periode)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Généré le {new Date(selectedPaie.genereAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hours */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Heures de travail</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Total heures travaillées</p>
                      <p className="font-semibold">{formatHours(selectedPaie.heuresTravaillees)}</p>
                    </div>
                    {selectedPaie.heuresSupp > 0 && (
                      <div>
                        <p className="text-gray-500">Dont heures supp.</p>
                        <p className="font-semibold">{formatHours(selectedPaie.heuresSupp)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Salary — ADMIN full view */}
                {isAdmin ? (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                      <span className="text-gray-600">Taux horaire</span>
                      <span className="font-medium">{formatCurrency(selectedPaie.tauxHoraire)}/h</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                      <span className="text-gray-600">Salaire de base</span>
                      <span className="font-medium">
                        {formatCurrency((selectedPaie.heuresTravaillees - selectedPaie.heuresSupp) * selectedPaie.tauxHoraire)}
                      </span>
                    </div>
                    {selectedPaie.heuresSupp > 0 && selectedPaie.tauxHeuresSupp > 0 && (
                      <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                        <span className="text-gray-600">
                          Heures supplémentaires {multiplierLabel(selectedPaie.tauxHeuresSupp)}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(selectedPaie.heuresSupp * selectedPaie.tauxHoraire * selectedPaie.tauxHeuresSupp)}
                        </span>
                      </div>
                    )}
                    {selectedPaie.primes > 0 && (
                      <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                        <span className="text-gray-600">Primes</span>
                        <span className="font-medium text-green-600">+{formatCurrency(selectedPaie.primes)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm py-2 border-b border-gray-100 font-semibold">
                      <span>Salaire brut</span>
                      <span>{formatCurrency(selectedPaie.salaireBrut)}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                      <span className="text-gray-600">Cotisations salariales (~22%)</span>
                      <span className="text-red-600">-{formatCurrency(selectedPaie.cotisationsSalariales)}</span>
                    </div>
                    {selectedPaie.retenues > 0 && (
                      <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                        <span className="text-gray-600">Retenues</span>
                        <span className="text-red-600">-{formatCurrency(selectedPaie.retenues)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  // EMPLOYEE simplified view
                  <div className="space-y-2 mb-4">
                    {selectedPaie.heuresSupp > 0 && selectedPaie.tauxHeuresSupp > 0 && (
                      <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                        <span className="text-gray-600">Heures supplémentaires</span>
                        <span className="font-medium">{formatHours(selectedPaie.heuresSupp)}</span>
                      </div>
                    )}
                    {selectedPaie.primes > 0 && (
                      <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                        <span className="text-gray-600">Primes</span>
                        <span className="font-medium text-green-600">+{formatCurrency(selectedPaie.primes)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Net — same for everyone */}
                <div className="text-white rounded-lg p-4 flex justify-between items-center" style={{ background: '#1e3a5f' }}>
                  <span className="font-semibold">Salaire Net à payer</span>
                  <span className="text-2xl font-bold">{formatCurrency(selectedPaie.salaireNet)}</span>
                </div>

                {/* Validation status */}
                <div className={`mt-4 p-3 rounded-lg flex items-center justify-between ${
                  selectedPaie.valide ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {selectedPaie.valide
                      ? <CheckCircle className="w-4 h-4 text-green-600" />
                      : <XCircle className="w-4 h-4 text-yellow-600" />}
                    <span className={`text-sm font-medium ${selectedPaie.valide ? 'text-green-800' : 'text-yellow-800'}`}>
                      {selectedPaie.valide
                        ? `Fiche validée${selectedPaie.valideeAt ? ` le ${new Date(selectedPaie.valideeAt).toLocaleDateString('fr-FR')}` : ''}`
                        : 'En attente de validation'}
                    </span>
                  </div>
                  {isAdmin && (
                    selectedPaie.valide ? (
                      <button
                        onClick={() => handleValidate(selectedPaie, false)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 font-medium"
                      >
                        Annuler
                      </button>
                    ) : (
                      <button
                        onClick={() => handleValidate(selectedPaie, true)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 font-medium"
                      >
                        Accepter la fiche
                      </button>
                    )
                  )}
                </div>

                {/* Notes */}
                {selectedPaie.notes && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs font-semibold text-yellow-700 mb-1">Notes</p>
                    <p className="text-sm text-yellow-800">{selectedPaie.notes}</p>
                  </div>
                )}

                {/* Employer contribution — ADMIN only */}
                {isAdmin && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">
                      Charges patronales (~42%) : {formatCurrency(selectedPaie.cotisationsPatronales)}
                      {' '}· Coût total employeur : {formatCurrency(selectedPaie.salaireBrut + selectedPaie.cotisationsPatronales)}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="card flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>Sélectionnez une fiche de paie pour la visualiser</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generate Form Modal */}
      {showGenerateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Générer une fiche de paie</h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="form-label">Employé *</label>
                <select required className="form-input" value={genForm.employeId}
                  onChange={e => setGenForm({ ...genForm, employeId: e.target.value })}>
                  <option value="">Tous les employés</option>
                  {employes.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.prenom} {emp.nom} ({formatCurrency(emp.tauxHoraire)}/h)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Période *</label>
                <select className="form-input" value={genForm.periode}
                  onChange={e => setGenForm({ ...genForm, periode: e.target.value })}>
                  {periods.map(p => (
                    <option key={p} value={p}>{getPeriodeLabel(p)}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-500">
                Les fiches seront calculées automatiquement à partir des pointages de la période sélectionnée.
              </p>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-secondary flex-1"
                  onClick={() => setShowGenerateForm(false)}>
                  Annuler
                </button>
                <button type="submit" disabled={generating} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {generating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {generating ? 'Génération...' : 'Générer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
