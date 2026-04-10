'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer, Trash2, Loader2, Plus, Save, X, CheckCircle, AlertCircle } from 'lucide-react'

const NAVY = '#1e3a5f'

type LigneFacture = {
  id?: string
  description: string
  quantite: number
  prixUnitaire: number
  montantHT: number
}

type Facture = {
  id: string
  numero: string
  statut: string
  objet?: string
  dateEmission: string
  dateEcheance?: string
  datePaiement?: string
  tauxTVA: number
  montantHT: number
  montantTVA: number
  montantTTC: number
  notes?: string
  conditionsPaiement?: string
  modePaiement?: string
  client?: {
    id: string
    nom: string
    email?: string
    adresse?: string
    ville?: string
    codePostal?: string
    siret?: string
    tvaNumero?: string
  }
  lignes: LigneFacture[]
}

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

const MODES_PAIEMENT_LABELS: Record<string, string> = {
  VIREMENT: 'Virement bancaire',
  CHEQUE: 'Chèque',
  CARTE: 'Carte bancaire',
  ESPECES: 'Espèces',
}

const TVA_TAUX = [
  { label: '0%', value: 0 },
  { label: '5.5%', value: 5.5 },
  { label: '10%', value: 10 },
  { label: '20%', value: 20 },
]

const MODES_PAIEMENT = [
  { label: 'Virement bancaire', value: 'VIREMENT' },
  { label: 'Chèque', value: 'CHEQUE' },
  { label: 'Carte bancaire', value: 'CARTE' },
  { label: 'Espèces', value: 'ESPECES' },
]

export default function FactureDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [facture, setFacture] = useState<Facture | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Edit mode
  const [editMode, setEditMode] = useState(false)
  const [editObjet, setEditObjet] = useState('')
  const [editDateEcheance, setEditDateEcheance] = useState('')
  const [editModePaiement, setEditModePaiement] = useState('VIREMENT')
  const [editTauxTVA, setEditTauxTVA] = useState(20)
  const [editLignes, setEditLignes] = useState<LigneFacture[]>([])
  const [editNotes, setEditNotes] = useState('')
  const [editConditions, setEditConditions] = useState('')
  const [saving, setSaving] = useState(false)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    fetchFacture()
  }, [id])

  const fetchFacture = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/factures/${id}`)
      if (!res.ok) { setError('Facture introuvable.'); return }
      const data = await res.json()
      setFacture(data.facture ?? data)
    } catch {
      setError('Erreur lors du chargement.')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = () => {
    if (!facture) return
    setEditObjet(facture.objet ?? '')
    setEditDateEcheance(facture.dateEcheance ? facture.dateEcheance.split('T')[0] : '')
    setEditModePaiement(facture.modePaiement ?? 'VIREMENT')
    setEditTauxTVA(facture.tauxTVA)
    setEditLignes(facture.lignes.map(l => ({ ...l })))
    setEditNotes(facture.notes ?? '')
    setEditConditions(facture.conditionsPaiement ?? '')
    setEditMode(true)
  }

  const updateLigne = (index: number, field: keyof LigneFacture, value: string | number) => {
    setEditLignes(prev => prev.map((l, i) => {
      if (i !== index) return l
      const updated = { ...l, [field]: value }
      updated.montantHT = Number(updated.quantite) * Number(updated.prixUnitaire)
      return updated
    }))
  }

  const addLigne = () => setEditLignes(prev => [...prev, { description: '', quantite: 1, prixUnitaire: 0, montantHT: 0 }])
  const removeLigne = (i: number) => { if (editLignes.length > 1) setEditLignes(prev => prev.filter((_, idx) => idx !== i)) }

  const totalHTEdit = editLignes.reduce((s, l) => s + (Number(l.quantite) * Number(l.prixUnitaire)), 0)
  const montantTVAEdit = totalHTEdit * editTauxTVA / 100
  const totalTTCEdit = totalHTEdit + montantTVAEdit

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/factures/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objet: editObjet,
          dateEcheance: editDateEcheance || undefined,
          modePaiement: editModePaiement,
          tauxTVA: editTauxTVA,
          lignes: editLignes.map(l => ({
            id: l.id,
            description: l.description,
            quantite: Number(l.quantite),
            prixUnitaire: Number(l.prixUnitaire),
            montantHT: Number(l.quantite) * Number(l.prixUnitaire),
          })),
          notes: editNotes,
          conditionsPaiement: editConditions,
        }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erreur.'); return }
      setEditMode(false)
      showToast('Facture mise à jour avec succès')
      fetchFacture()
    } catch { setError('Erreur réseau.') }
    finally { setSaving(false) }
  }

  const handleStatutAction = async (newStatut: string, extra?: Record<string, any>) => {
    setActionLoading(newStatut)
    setError('')
    try {
      const res = await fetch(`/api/factures/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut, ...extra }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erreur.'); return }
      const label = newStatut === 'PAYEE' ? 'Facture marquée comme payée' : newStatut === 'ANNULEE' ? 'Facture annulée' : 'Statut mis à jour'
      showToast(label)
      fetchFacture()
    } catch { setError('Erreur réseau.') }
    finally { setActionLoading('') }
  }

  const handleMarkPaid = () => {
    if (!window.confirm('Marquer cette facture comme payée ?')) return
    handleStatutAction('PAYEE', { datePaiement: new Date().toISOString() })
  }

  const handleCancel = () => {
    if (!window.confirm('Annuler cette facture ? Cette action est difficile à inverser.')) return
    handleStatutAction('ANNULEE')
  }

  const handleMarkSent = () => {
    handleStatutAction('ENVOYEE')
  }

  const handleDelete = async () => {
    if (!window.confirm('Supprimer définitivement cette facture ?')) return
    try {
      await fetch(`/api/factures/${id}`, { method: 'DELETE' })
      router.push('/facturation/factures')
    } catch { showToast('Erreur réseau.', 'error') }
  }

  const fmt = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR')

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  )

  if (!facture) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-gray-500">{error || 'Facture introuvable.'}</p>
      <Link href="/facturation/factures" className="text-sm font-medium" style={{ color: NAVY }}>← Retour aux factures</Link>
    </div>
  )

  return (
    <>
      <style>{`@media print { nav, aside, .no-print { display: none !important; } body { background: white; } }`}</style>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium flex items-center gap-2 no-print ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between no-print flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/facturation/factures" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{facture.numero}</h1>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${BADGE_CLASSES[facture.statut] ?? 'bg-gray-100 text-gray-600'}`}>
                  {BADGE_LABELS[facture.statut] ?? facture.statut}
                </span>
              </div>
              <p className="text-gray-500 mt-0.5 text-sm">Émise le {fmtDate(facture.dateEmission)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => window.print()} className="py-2 px-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5">
              <Printer className="w-4 h-4" /> Imprimer
            </button>
            {!editMode && facture.statut === 'BROUILLON' && (
              <button onClick={startEdit} className="py-2 px-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Modifier
              </button>
            )}
            <button onClick={handleDelete} className="py-2 px-3 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 no-print">{error}</div>
        )}

        {/* Status actions */}
        {!editMode && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 no-print">
            <p className="text-sm font-medium text-gray-700 mb-3">Actions disponibles</p>
            <div className="flex gap-2 flex-wrap">
              {facture.statut === 'BROUILLON' && (
                <button
                  onClick={handleMarkSent}
                  disabled={!!actionLoading}
                  className="py-2 px-4 rounded-lg text-sm font-semibold text-white disabled:opacity-60 flex items-center gap-2"
                  style={{ background: NAVY }}
                >
                  {actionLoading === 'ENVOYEE' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Marquer envoyée
                </button>
              )}
              {['ENVOYEE', 'EN_RETARD', 'BROUILLON'].includes(facture.statut) && facture.statut !== 'ANNULEE' && (
                <button
                  onClick={handleMarkPaid}
                  disabled={!!actionLoading}
                  className="py-2 px-4 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
                >
                  {actionLoading === 'PAYEE' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Marquer comme payée
                </button>
              )}
              {!['PAYEE', 'ANNULEE'].includes(facture.statut) && (
                <button
                  onClick={handleCancel}
                  disabled={!!actionLoading}
                  className="py-2 px-4 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 flex items-center gap-2"
                >
                  {actionLoading === 'ANNULEE' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Annuler la facture
                </button>
              )}
              {facture.statut === 'PAYEE' && (
                <p className="text-sm text-green-700 flex items-center gap-1.5 font-medium">
                  <CheckCircle className="w-4 h-4" /> Facture payée
                  {facture.datePaiement && <span className="text-gray-500 font-normal">le {fmtDate(facture.datePaiement)}</span>}
                </p>
              )}
              {facture.statut === 'ANNULEE' && (
                <p className="text-sm text-gray-500">Cette facture a été annulée.</p>
              )}
            </div>
          </div>
        )}

        {/* Facture content */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
          {/* Client & facture info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-gray-100">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Client</p>
              <p className="font-bold text-gray-900 text-lg">{facture.client?.nom ?? '—'}</p>
              {facture.client?.email && <p className="text-sm text-gray-600">{facture.client.email}</p>}
              {facture.client?.adresse && <p className="text-sm text-gray-600">{facture.client.adresse}</p>}
              {(facture.client?.codePostal || facture.client?.ville) && (
                <p className="text-sm text-gray-600">{[facture.client.codePostal, facture.client.ville].filter(Boolean).join(' ')}</p>
              )}
              {facture.client?.siret && <p className="text-xs text-gray-400 mt-1">SIRET : {facture.client.siret}</p>}
              {facture.client?.tvaNumero && <p className="text-xs text-gray-400">TVA : {facture.client.tvaNumero}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Facture</p>
              <p className="font-bold text-gray-900">{facture.numero}</p>
              <p className="text-sm text-gray-600">Émise le {fmtDate(facture.dateEmission)}</p>
              {facture.dateEcheance && (
                <p className={`text-sm ${facture.statut === 'EN_RETARD' ? 'text-orange-600 font-semibold' : 'text-gray-600'}`}>
                  Échéance : {fmtDate(facture.dateEcheance)}
                </p>
              )}
              {facture.datePaiement && (
                <p className="text-sm text-green-600 font-medium">Payée le {fmtDate(facture.datePaiement)}</p>
              )}
              {facture.modePaiement && (
                <p className="text-sm text-gray-600 mt-1">{MODES_PAIEMENT_LABELS[facture.modePaiement] ?? facture.modePaiement}</p>
              )}
              {facture.objet && <p className="text-sm text-gray-700 mt-2 font-medium">{facture.objet}</p>}
            </div>
          </div>

          {/* Edit mode */}
          {editMode ? (
            <div className="space-y-4 no-print">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Objet</label>
                  <input type="text" className="form-input" value={editObjet} onChange={e => setEditObjet(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Date d'échéance</label>
                  <input type="date" className="form-input" value={editDateEcheance} onChange={e => setEditDateEcheance(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Mode de paiement</label>
                  <select className="form-input" value={editModePaiement} onChange={e => setEditModePaiement(e.target.value)}>
                    {MODES_PAIEMENT.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Taux TVA</label>
                  <select className="form-input" value={editTauxTVA} onChange={e => setEditTauxTVA(Number(e.target.value))}>
                    {TVA_TAUX.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Lignes edit */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label mb-0">Lignes</label>
                  <button type="button" onClick={addLigne} className="text-xs font-medium flex items-center gap-1 py-1 px-2 rounded border border-gray-200 hover:bg-gray-50">
                    <Plus className="w-3.5 h-3.5" /> Ajouter
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 px-1 text-xs text-gray-500">Description</th>
                        <th className="text-right py-2 px-1 text-xs text-gray-500 w-20">Qté</th>
                        <th className="text-right py-2 px-1 text-xs text-gray-500 w-28">Prix HT</th>
                        <th className="text-right py-2 px-1 text-xs text-gray-500 w-28">Total HT</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {editLignes.map((l, i) => (
                        <tr key={i}>
                          <td className="py-1.5 px-1">
                            <input type="text" className="form-input text-sm" value={l.description} onChange={e => updateLigne(i, 'description', e.target.value)} />
                          </td>
                          <td className="py-1.5 px-1">
                            <input type="number" min="0.01" step="0.01" className="form-input text-sm text-right" value={l.quantite} onChange={e => updateLigne(i, 'quantite', parseFloat(e.target.value) || 0)} />
                          </td>
                          <td className="py-1.5 px-1">
                            <input type="number" min="0" step="0.01" className="form-input text-sm text-right" value={l.prixUnitaire} onChange={e => updateLigne(i, 'prixUnitaire', parseFloat(e.target.value) || 0)} />
                          </td>
                          <td className="py-1.5 px-1 text-right font-medium">{fmt(Number(l.quantite) * Number(l.prixUnitaire))}</td>
                          <td className="py-1.5 px-1">
                            <button type="button" onClick={() => removeLigne(i)} disabled={editLignes.length === 1} className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex justify-end">
                  <div className="w-56 space-y-1 text-sm">
                    <div className="flex justify-between text-gray-600"><span>Total HT</span><span>{fmt(totalHTEdit)}</span></div>
                    <div className="flex justify-between text-gray-600"><span>TVA ({editTauxTVA}%)</span><span>{fmt(montantTVAEdit)}</span></div>
                    <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1"><span>Total TTC</span><span>{fmt(totalTTCEdit)}</span></div>
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label">Notes</label>
                <textarea className="form-input min-h-[70px] resize-y" value={editNotes} onChange={e => setEditNotes(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Conditions de paiement</label>
                <textarea className="form-input min-h-[70px] resize-y" value={editConditions} onChange={e => setEditConditions(e.target.value)} />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditMode(false)} className="py-2 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5">
                  <X className="w-4 h-4" /> Annuler
                </button>
                <button type="button" onClick={handleSaveEdit} disabled={saving} className="py-2 px-4 rounded-lg text-sm font-semibold text-white flex items-center gap-1.5 disabled:opacity-60" style={{ background: NAVY }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Enregistrer
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Lignes read-only */}
              <div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Description</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase w-20">Qté</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase w-28">Prix HT</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase w-28">Total HT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {facture.lignes.map((l, i) => (
                      <tr key={l.id ?? i}>
                        <td className="py-2.5 text-gray-800">{l.description}</td>
                        <td className="py-2.5 text-right text-gray-600">{l.quantite}</td>
                        <td className="py-2.5 text-right text-gray-600">{fmt(l.prixUnitaire)}</td>
                        <td className="py-2.5 text-right font-medium text-gray-900">{fmt(l.montantHT)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totaux */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600"><span>Total HT</span><span className="font-medium">{fmt(facture.montantHT)}</span></div>
                  <div className="flex justify-between text-gray-600"><span>TVA ({facture.tauxTVA}%)</span><span className="font-medium">{fmt(facture.montantTVA)}</span></div>
                  <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2">
                    <span>Total TTC</span>
                    <span>{fmt(facture.montantTTC)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {facture.notes && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{facture.notes}</p>
                </div>
              )}
              {facture.conditionsPaiement && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Conditions de paiement</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{facture.conditionsPaiement}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
