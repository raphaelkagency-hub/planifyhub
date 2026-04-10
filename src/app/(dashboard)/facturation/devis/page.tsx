'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, Plus, Trash2, Eye, Loader2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

const NAVY = '#1e3a5f'

type Devis = {
  id: string
  numero: string
  objet?: string
  statut: string
  montantHT: number
  montantTTC: number
  tauxTVA: number
  dateEmission: string
  dateValidite?: string
  client?: { id: string; nom: string }
}

const STATUTS = [
  { key: 'TOUS', label: 'Tous' },
  { key: 'BROUILLON', label: 'Brouillon' },
  { key: 'ENVOYE', label: 'Envoyé' },
  { key: 'ACCEPTE', label: 'Accepté' },
  { key: 'REFUSE', label: 'Refusé' },
  { key: 'CONVERTI', label: 'Converti' },
]

const BADGE_CLASSES: Record<string, string> = {
  BROUILLON: 'bg-gray-100 text-gray-700',
  ENVOYE: 'bg-blue-100 text-blue-700',
  ACCEPTE: 'bg-green-100 text-green-700',
  REFUSE: 'bg-red-100 text-red-700',
  CONVERTI: 'bg-purple-100 text-purple-700',
}

const BADGE_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon',
  ENVOYE: 'Envoyé',
  ACCEPTE: 'Accepté',
  REFUSE: 'Refusé',
  CONVERTI: 'Converti',
}

export default function DevisPage() {
  const router = useRouter()
  const [devis, setDevis] = useState<Devis[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStatut, setActiveStatut] = useState('TOUS')
  const [error, setError] = useState('')
  const [converting, setConverting] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    fetchDevis()
  }, [])

  const fetchDevis = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/devis')
      const data = await res.json()
      setDevis(data.devis ?? [])
    } catch {
      setError('Erreur lors du chargement des devis.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, numero: string) => {
    if (!window.confirm(`Supprimer le devis ${numero} ? Cette action est irréversible.`)) return
    try {
      const res = await fetch(`/api/devis/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        showToast(data.error ?? 'Erreur lors de la suppression.', 'error')
        return
      }
      setDevis(prev => prev.filter(d => d.id !== id))
      showToast('Devis supprimé.')
    } catch {
      showToast('Erreur réseau.', 'error')
    }
  }

  const handleConvert = async (id: string, numero: string) => {
    if (!window.confirm(`Convertir le devis ${numero} en facture ?`)) return
    setConverting(id)
    try {
      const res = await fetch(`/api/devis/${id}/convert`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        showToast(data.error ?? 'Erreur lors de la conversion.', 'error')
        return
      }
      const data = await res.json()
      const factureId = data.factureId ?? data.facture?.id ?? data.id
      router.push(`/facturation/factures/${factureId}`)
    } catch {
      showToast('Erreur réseau.', 'error')
    } finally {
      setConverting(null)
    }
  }

  const fmt = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR')

  const filtered = activeStatut === 'TOUS' ? devis : devis.filter(d => d.statut === activeStatut)

  const counts: Record<string, number> = { TOUS: devis.length }
  devis.forEach(d => { counts[d.statut] = (counts[d.statut] ?? 0) + 1 })

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
            <FileText className="w-7 h-7" style={{ color: NAVY }} />
            Devis
          </h1>
          <p className="text-gray-500 mt-1">{devis.length} devis au total</p>
        </div>
        <Link
          href="/facturation/devis/nouveau"
          className="text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
          style={{ background: NAVY }}
        >
          <Plus className="w-4 h-4" /> Nouveau devis
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
                  <th className="table-header">TVA</th>
                  <th className="table-header">Statut</th>
                  <th className="table-header">Date émission</th>
                  <th className="table-header">Date validité</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                      <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      Aucun devis{activeStatut !== 'TOUS' ? ` avec le statut "${BADGE_LABELS[activeStatut] ?? activeStatut}"` : ''}.
                    </td>
                  </tr>
                ) : (
                  filtered.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium text-gray-900">{d.numero}</td>
                      <td className="table-cell text-gray-700">{d.client?.nom ?? '—'}</td>
                      <td className="table-cell text-gray-600 max-w-[180px] truncate">{d.objet ?? '—'}</td>
                      <td className="table-cell font-semibold text-gray-900">{fmt(d.montantTTC)}</td>
                      <td className="table-cell text-gray-600">{d.tauxTVA}%</td>
                      <td className="table-cell">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${BADGE_CLASSES[d.statut] ?? 'bg-gray-100 text-gray-600'}`}>
                          {BADGE_LABELS[d.statut] ?? d.statut}
                        </span>
                      </td>
                      <td className="table-cell text-gray-600">{fmtDate(d.dateEmission)}</td>
                      <td className="table-cell text-gray-600">{d.dateValidite ? fmtDate(d.dateValidite) : '—'}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/facturation/devis/${d.id}`}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Voir le devis"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {d.statut === 'ACCEPTE' && (
                            <button
                              onClick={() => handleConvert(d.id, d.numero)}
                              disabled={converting === d.id}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded disabled:opacity-50"
                              title="Convertir en facture"
                            >
                              {converting === d.id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <RefreshCw className="w-4 h-4" />
                              }
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(d.id, d.numero)}
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
