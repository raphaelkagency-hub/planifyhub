'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Receipt, Plus, Trash2, Eye, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

const NAVY = '#1e3a5f'

type Facture = {
  id: string
  numero: string
  objet?: string
  statut: string
  montantHT: number
  montantTTC: number
  dateEmission: string
  dateEcheance?: string
  datePaiement?: string
  client?: { id: string; nom: string }
}

const STATUTS = [
  { key: 'TOUS', label: 'Tous' },
  { key: 'BROUILLON', label: 'Brouillon' },
  { key: 'ENVOYEE', label: 'Envoyée' },
  { key: 'PAYEE', label: 'Payée' },
  { key: 'EN_RETARD', label: 'En retard' },
  { key: 'ANNULEE', label: 'Annulée' },
]

const BADGE_CLASSES: Record<string, string> = {
  BROUILLON: 'bg-gray-100 text-gray-700',
  ENVOYEE: 'bg-blue-100 text-blue-700',
  PAYEE: 'bg-green-100 text-green-700',
  ANNULEE: 'bg-red-100 text-red-700',
  EN_RETARD: 'bg-orange-100 text-orange-700',
}

const BADGE_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon',
  ENVOYEE: 'Envoyée',
  PAYEE: 'Payée',
  ANNULEE: 'Annulée',
  EN_RETARD: 'En retard',
}

export default function FacturesPage() {
  const [factures, setFactures] = useState<Facture[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStatut, setActiveStatut] = useState('TOUS')
  const [error, setError] = useState('')
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    fetchFactures()
  }, [])

  const fetchFactures = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/factures')
      const data = await res.json()
      setFactures(data.factures ?? [])
    } catch {
      setError('Erreur lors du chargement des factures.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, numero: string) => {
    if (!window.confirm(`Supprimer la facture ${numero} ? Cette action est irréversible.`)) return
    try {
      const res = await fetch(`/api/factures/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        showToast(data.error ?? 'Erreur lors de la suppression.', 'error')
        return
      }
      setFactures(prev => prev.filter(f => f.id !== id))
      showToast('Facture supprimée.')
    } catch {
      showToast('Erreur réseau.', 'error')
    }
  }

  const handleMarkPaid = async (id: string, numero: string) => {
    if (!window.confirm(`Marquer la facture ${numero} comme payée ?`)) return
    setMarkingPaid(id)
    try {
      const res = await fetch(`/api/factures/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'PAYEE', datePaiement: new Date().toISOString() }),
      })
      if (!res.ok) {
        const data = await res.json()
        showToast(data.error ?? 'Erreur lors de la mise à jour.', 'error')
        return
      }
      showToast(`Facture ${numero} marquée comme payée.`)
      fetchFactures()
    } catch {
      showToast('Erreur réseau.', 'error')
    } finally {
      setMarkingPaid(null)
    }
  }

  const fmt = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR')

  const filtered = activeStatut === 'TOUS' ? factures : factures.filter(f => f.statut === activeStatut)

  const counts: Record<string, number> = { TOUS: factures.length }
  factures.forEach(f => { counts[f.statut] = (counts[f.statut] ?? 0) + 1 })

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="w-7 h-7" style={{ color: NAVY }} />
            Factures
          </h1>
          <p className="text-gray-500 mt-1">{factures.length} facture{factures.length !== 1 ? 's' : ''} au total</p>
        </div>
        <Link
          href="/facturation/factures/nouveau"
          className="text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
          style={{ background: NAVY }}
        >
          <Plus className="w-4 h-4" /> Nouvelle facture
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit flex-wrap">
        {STATUTS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveStatut(key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeStatut === key
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            {counts[key] !== undefined && counts[key] > 0 && (
              <span className="ml-1.5 text-xs text-gray-400">({counts[key]})</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Numéro</th>
                  <th className="table-header">Client</th>
                  <th className="table-header">Objet</th>
                  <th className="table-header">Montant TTC</th>
                  <th className="table-header">Statut</th>
                  <th className="table-header">Date émission</th>
                  <th className="table-header">Échéance</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                      <Receipt className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      Aucune facture{activeStatut !== 'TOUS' ? ` avec le statut "${BADGE_LABELS[activeStatut] ?? activeStatut}"` : ''}.
                    </td>
                  </tr>
                ) : (
                  filtered.map(f => (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium text-gray-900">{f.numero}</td>
                      <td className="table-cell text-gray-700">{f.client?.nom ?? '—'}</td>
                      <td className="table-cell text-gray-600 max-w-[150px] truncate">{f.objet ?? '—'}</td>
                      <td className="table-cell font-semibold text-gray-900">{fmt(f.montantTTC)}</td>
                      <td className="table-cell">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${BADGE_CLASSES[f.statut] ?? 'bg-gray-100 text-gray-600'}`}>
                          {BADGE_LABELS[f.statut] ?? f.statut}
                        </span>
                      </td>
                      <td className="table-cell text-gray-600">{fmtDate(f.dateEmission)}</td>
                      <td className="table-cell text-gray-600">
                        {f.dateEcheance ? (
                          <span className={f.statut === 'EN_RETARD' ? 'text-orange-600 font-medium' : ''}>
                            {fmtDate(f.dateEcheance)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/facturation/factures/${f.id}`}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Voir la facture"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {['ENVOYEE', 'EN_RETARD', 'BROUILLON'].includes(f.statut) && (
                            <button
                              onClick={() => handleMarkPaid(f.id, f.numero)}
                              disabled={markingPaid === f.id}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                              title="Marquer comme payée"
                            >
                              {markingPaid === f.id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <CheckCircle className="w-4 h-4" />
                              }
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(f.id, f.numero)}
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
    </div>
  )
}
