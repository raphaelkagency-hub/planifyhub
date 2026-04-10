'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2, Loader2, ArrowLeft } from 'lucide-react'

type Client = { id: string; nom: string }

type LigneDevis = {
  description: string
  quantite: number
  prixUnitaire: number
}

const TVA_TAUX = [
  { label: '0%', value: 0 },
  { label: '5.5%', value: 5.5 },
  { label: '10%', value: 10 },
  { label: '20%', value: 20 },
]

const emptyLigne = (): LigneDevis => ({ description: '', quantite: 1, prixUnitaire: 0 })

export default function NouveauDevisPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [clientId, setClientId] = useState('')
  const [objet, setObjet] = useState('')
  const [dateValidite, setDateValidite] = useState('')
  const [tauxTVA, setTauxTVA] = useState(20)
  const [lignes, setLignes] = useState<LigneDevis[]>([emptyLigne()])
  const [notes, setNotes] = useState('')
  const [conditionsPaiement, setConditionsPaiement] = useState('')

  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.json())
      .then(data => setClients(data.clients ?? []))
      .finally(() => setLoadingClients(false))
  }, [])

  const updateLigne = (index: number, field: keyof LigneDevis, value: string | number) => {
    setLignes(prev => prev.map((l, i) => i === index ? { ...l, [field]: value } : l))
  }

  const addLigne = () => setLignes(prev => [...prev, emptyLigne()])

  const removeLigne = (index: number) => {
    if (lignes.length === 1) return
    setLignes(prev => prev.filter((_, i) => i !== index))
  }

  const montantHTLigne = (l: LigneDevis) => l.quantite * l.prixUnitaire
  const totalHT = lignes.reduce((sum, l) => sum + montantHTLigne(l), 0)
  const montantTVA = totalHT * tauxTVA / 100
  const totalTTC = totalHT + montantTVA

  const formatMoney = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId) { setError('Veuillez sélectionner un client.'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          objet,
          dateValidite: dateValidite || undefined,
          tauxTVA,
          lignes: lignes.map(l => ({
            description: l.description,
            quantite: Number(l.quantite),
            prixUnitaire: Number(l.prixUnitaire),
            montantHT: montantHTLigne(l),
          })),
          montantHT: totalHT,
          montantTVA,
          montantTTC: totalTTC,
          notes,
          conditionsPaiement,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Erreur lors de la création du devis.')
        return
      }
      const data = await res.json()
      router.push(`/facturation/devis/${data.devis?.id ?? data.id}`)
    } catch (err) {
      setError('Erreur réseau.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/facturation/devis" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau devis</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Remplissez les informations pour créer un devis</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client & infos générales */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 mb-4">Informations générales</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Client *</label>
              {loadingClients ? (
                <div className="form-input flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
                </div>
              ) : (
                <select
                  required
                  className="form-input"
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="form-label">Date de validité</label>
              <input
                type="date"
                className="form-input"
                value={dateValidite}
                onChange={e => setDateValidite(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Objet du devis</label>
            <input
              type="text"
              className="form-input"
              placeholder="Prestation de conseil, développement web..."
              value={objet}
              onChange={e => setObjet(e.target.value)}
            />
          </div>

          <div className="w-40">
            <label className="form-label">Taux de TVA</label>
            <select
              className="form-input"
              value={tauxTVA}
              onChange={e => setTauxTVA(Number(e.target.value))}
            >
              {TVA_TAUX.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {/* Lignes de devis */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Lignes du devis</h2>
            <button
              type="button"
              onClick={addLigne}
              className="text-sm font-medium flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
            >
              <Plus className="w-4 h-4" /> Ajouter une ligne
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-gray-500 uppercase w-24">Qté</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-gray-500 uppercase w-32">Prix unitaire</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-gray-500 uppercase w-32">Total HT</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lignes.map((ligne, i) => (
                  <tr key={i}>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        className="form-input text-sm"
                        placeholder="Description de la prestation"
                        value={ligne.description}
                        onChange={e => updateLigne(i, 'description', e.target.value)}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className="form-input text-sm text-right"
                        value={ligne.quantite}
                        onChange={e => updateLigne(i, 'quantite', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-input text-sm text-right"
                        placeholder="0.00"
                        value={ligne.prixUnitaire}
                        onChange={e => updateLigne(i, 'prixUnitaire', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="py-2 px-2 text-right text-sm font-medium text-gray-900">
                      {formatMoney(montantHTLigne(ligne))}
                    </td>
                    <td className="py-2 px-2">
                      <button
                        type="button"
                        onClick={() => removeLigne(i)}
                        disabled={lignes.length === 1}
                        className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totaux */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Total HT</span>
                <span className="font-medium">{formatMoney(totalHT)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>TVA ({tauxTVA}%)</span>
                <span className="font-medium">{formatMoney(montantTVA)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2">
                <span>Total TTC</span>
                <span>{formatMoney(totalTTC)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes et conditions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 mb-4">Notes et conditions</h2>
          <div>
            <label className="form-label">Notes</label>
            <textarea
              className="form-input min-h-[80px] resize-y"
              placeholder="Notes internes ou à destination du client..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Conditions de paiement</label>
            <textarea
              className="form-input min-h-[80px] resize-y"
              placeholder="Paiement à 30 jours, acompte de 30%..."
              value={conditionsPaiement}
              onChange={e => setConditionsPaiement(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/facturation/devis"
            className="flex-1 text-center py-2.5 px-4 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: '#1e3a5f' }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Enregistrement...' : 'Enregistrer comme brouillon'}
          </button>
        </div>
      </form>
    </div>
  )
}
