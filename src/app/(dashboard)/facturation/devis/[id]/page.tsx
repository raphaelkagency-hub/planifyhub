'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer, Trash2, Loader2, Plus, Save, X } from 'lucide-react'

type LigneDevis = {
  id?: string
  description: string
  quantite: number
  prixUnitaire: number
  montantHT: number
}

type Devis = {
  id: string
  numero: string
  statut: string
  objet?: string
  dateEmission: string
  dateValidite?: string
  tauxTVA: number
  montantHT: number
  montantTVA: number
  montantTTC: number
  notes?: string
  conditionsPaiement?: string
  createdAt: string
  client?: { id: string; nom: string; email?: string; adresse?: string; ville?: string; codePostal?: string; siret?: string; tvaNumero?: string }
  lignes: LigneDevis[]
}

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

const TVA_TAUX = [
  { label: '0%', value: 0 },
  { label: '5.5%', value: 5.5 },
  { label: '10%', value: 10 },
  { label: '20%', value: 20 },
]

export default function DevisDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [devis, setDevis] = useState<Devis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState('')

  // Edit mode
  const [editMode, setEditMode] = useState(false)
  const [editObjet, setEditObjet] = useState('')
  const [editDateValidite, setEditDateValidite] = useState('')
  const [editTauxTVA, setEditTauxTVA] = useState(20)
  const [editLignes, setEditLignes] = useState<LigneDevis[]>([])
  const [editNotes, setEditNotes] = useState('')
  const [editConditions, setEditConditions] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDevis()
  }, [id])

  const fetchDevis = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/devis/${id}`)
      if (!res.ok) { setError('Devis introuvable.'); return }
      const data = await res.json()
      setDevis(data.devis ?? data)
    } catch {
      setError('Erreur lors du chargement.')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = () => {
    if (!devis) return
    setEditObjet(devis.objet ?? '')
    setEditDateValidite(devis.dateValidite ? devis.dateValidite.split('T')[0] : '')
    setEditTauxTVA(devis.tauxTVA)
    setEditLignes(devis.lignes.map(l => ({ ...l })))
    setEditNotes(devis.notes ?? '')
    setEditConditions(devis.conditionsPaiement ?? '')
    setEditMode(true)
  }

  const updateLigne = (index: number, field: keyof LigneDevis, value: string | number) => {
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
      const res = await fetch(`/api/devis/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objet: editObjet,
          dateValidite: editDateValidite || undefined,
          tauxTVA: editTauxTVA,
          lignes: editLignes.map(l => ({
            id: l.id,
            description: l.description,
            quantite: Number(l.quantite),
            prixUnitaire: Number(l.prixUnitaire),
            montantHT: Number(l.quantite) * Number(l.prixUnitaire),
          })),
          montantHT: totalHTEdit,
          montantTVA: montantTVAEdit,
          montantTTC: totalTTCEdit,
          notes: editNotes,
          conditionsPaiement: editConditions,
        }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erreur.'); return }
      setEditMode(false)
      fetchDevis()
    } catch { setError('Erreur réseau.') }
    finally { setSaving(false) }
  }

  const handleStatutAction = async (newStatut: string) => {
    setActionLoading(newStatut)
    setError('')
    try {
      const res = await fetch(`/api/devis/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erreur.'); return }
      fetchDevis()
    } catch { setError('Erreur réseau.') }
    finally { setActionLoading('') }
  }

  const handleConvert = async () => {
    if (!confirm('Convertir ce devis en facture ?')) return
    setActionLoading('convert')
    try {
      const res = await fetch(`/api/devis/${id}/convert`, { method: 'POST' })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erreur.'); return }
      const data = await res.json()
      router.push(`/facturation/factures/${data.facture?.id ?? data.id}`)
    } catch { setError('Erreur réseau.') }
    finally { setActionLoading('') }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer définitivement ce devis ?')) return
    try {
      await fetch(`/api/devis/${id}`, { method: 'DELETE' })
      router.push('/facturation/devis')
    } catch { alert('Erreur réseau.') }
  }

  const formatMoney = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR')

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1e3a5f' }} />
    </div>
  )

  if (!devis) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-gray-500">{error || 'Devis introuvable.'}</p>
      <Link href="/facturation/devis" className="text-sm font-medium" style={{ color: '#1e3a5f' }}>← Retour aux devis</Link>
    </div>
  )

  return (
    <>
      <style>{`@media print { nav, aside, .no-print { display: none !important; } }`}</style>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between no-print">
          <div className="flex items-center gap-3">
            <Link href="/facturation/devis" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{devis.numero}</h1>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${BADGE_CLASSES[devis.statut] ?? 'bg-gray-100 text-gray-600'}`}>
                  {BADGE_LABELS[devis.statut] ?? devis.statut}
                </span>
              </div>
              <p className="text-gray-500 mt-0.5 text-sm">Émis le {formatDate(devis.dateEmission)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => window.print()} className="py-2 px-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5">
              <Printer className="w-4 h-4" /> Imprimer
            </button>
            {!editMode && (
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
              {devis.statut === 'BROUILLON' && (
                <button
                  onClick={() => handleStatutAction('ENVOYE')}
                  disabled={!!actionLoading}
                  className="py-2 px-4 rounded-lg text-sm font-semibold text-white disabled:opacity-60 flex items-center gap-2"
                  style={{ background: '#1e3a5f' }}
                >
                  {actionLoading === 'ENVOYE' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Marquer envoyé
                </button>
              )}
              {devis.statut === 'ENVOYE' && (
                <>
                  <button
                    onClick={() => handleStatutAction('ACCEPTE')}
                    disabled={!!actionLoading}
                    className="py-2 px-4 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
                  >
                    {actionLoading === 'ACCEPTE' && <Loader2 className="w-4 h-4 animate-spin" />}
                    Marquer accepté
                  </button>
                  <button
                    onClick={() => handleStatutAction('REFUSE')}
                    disabled={!!actionLoading}
                    className="py-2 px-4 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 flex items-center gap-2"
                  >
                    {actionLoading === 'REFUSE' && <Loader2 className="w-4 h-4 animate-spin" />}
                    Marquer refusé
                  </button>
                </>
              )}
              {devis.statut === 'ACCEPTE' && (
                <button
                  onClick={handleConvert}
                  disabled={!!actionLoading}
                  className="py-2 px-4 rounded-lg text-sm font-semibold text-white disabled:opacity-60 flex items-center gap-2"
                  style={{ background: '#7c3aed' }}
                >
                  {actionLoading === 'convert' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Convertir en facture
                </button>
              )}
              {['BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'CONVERTI'].includes(devis.statut) === false && (
                <p className="text-sm text-gray-500">Aucune action disponible pour ce statut.</p>
              )}
              {devis.statut === 'CONVERTI' && (
                <p className="text-sm text-gray-500">Ce devis a été converti en facture.</p>
              )}
              {devis.statut === 'REFUSE' && (
                <p className="text-sm text-gray-500">Ce devis a été refusé.</p>
              )}
            </div>
          </div>
        )}

        {/* Devis content */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
          {/* Client info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-gray-100">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Client</p>
              <p className="font-bold text-gray-900 text-lg">{devis.client?.nom ?? '—'}</p>
              {devis.client?.email && <p className="text-sm text-gray-600">{devis.client.email}</p>}
              {devis.client?.adresse && <p className="text-sm text-gray-600">{devis.client.adresse}</p>}
              {(devis.client?.codePostal || devis.client?.ville) && (
                <p className="text-sm text-gray-600">{[devis.client.codePostal, devis.client.ville].filter(Boolean).join(' ')}</p>
              )}
              {devis.client?.siret && <p className="text-xs text-gray-400 mt-1">SIRET : {devis.client.siret}</p>}
              {devis.client?.tvaNumero && <p className="text-xs text-gray-400">TVA : {devis.client.tvaNumero}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Devis</p>
              <p className="font-bold text-gray-900">{devis.numero}</p>
              <p className="text-sm text-gray-600">Émis le {formatDate(devis.dateEmission)}</p>
              {devis.dateValidite && <p className="text-sm text-gray-600">Valide jusqu'au {formatDate(devis.dateValidite)}</p>}
              {devis.objet && <p className="text-sm text-gray-700 mt-2 font-medium">{devis.objet}</p>}
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
                  <label className="form-label">Date de validité</label>
                  <input type="date" className="form-input" value={editDateValidite} onChange={e => setEditDateValidite(e.target.value)} />
                </div>
              </div>
              <div className="w-40">
                <label className="form-label">Taux TVA</label>
                <select className="form-input" value={editTauxTVA} onChange={e => setEditTauxTVA(Number(e.target.value))}>
                  {TVA_TAUX.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
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
                          <td className="py-1.5 px-1 text-right font-medium">{formatMoney(Number(l.quantite) * Number(l.prixUnitaire))}</td>
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
                    <div className="flex justify-between text-gray-600"><span>Total HT</span><span>{formatMoney(totalHTEdit)}</span></div>
                    <div className="flex justify-between text-gray-600"><span>TVA ({editTauxTVA}%)</span><span>{formatMoney(montantTVAEdit)}</span></div>
                    <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1"><span>Total TTC</span><span>{formatMoney(totalTTCEdit)}</span></div>
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
                <button type="button" onClick={handleSaveEdit} disabled={saving} className="py-2 px-4 rounded-lg text-sm font-semibold text-white flex items-center gap-1.5 disabled:opacity-60" style={{ background: '#1e3a5f' }}>
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
                    {devis.lignes.map((l, i) => (
                      <tr key={l.id ?? i}>
                        <td className="py-2.5 text-gray-800">{l.description}</td>
                        <td className="py-2.5 text-right text-gray-600">{l.quantite}</td>
                        <td className="py-2.5 text-right text-gray-600">{formatMoney(l.prixUnitaire)}</td>
                        <td className="py-2.5 text-right font-medium text-gray-900">{formatMoney(l.montantHT)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totaux */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600"><span>Total HT</span><span className="font-medium">{formatMoney(devis.montantHT)}</span></div>
                  <div className="flex justify-between text-gray-600"><span>TVA ({devis.tauxTVA}%)</span><span className="font-medium">{formatMoney(devis.montantTVA)}</span></div>
                  <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2">
                    <span>Total TTC</span>
                    <span>{formatMoney(devis.montantTTC)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {devis.notes && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{devis.notes}</p>
                </div>
              )}
              {devis.conditionsPaiement && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Conditions de paiement</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{devis.conditionsPaiement}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
