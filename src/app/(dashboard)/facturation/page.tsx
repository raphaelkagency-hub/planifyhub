'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Receipt, Users, FileText, TrendingUp, ArrowRight, Loader2, AlertCircle, Clock, CheckCircle } from 'lucide-react'

const NAVY = '#1e3a5f'

const STATUT_FACTURE_COLORS: Record<string, string> = {
  BROUILLON: 'bg-gray-100 text-gray-600',
  ENVOYEE: 'bg-blue-100 text-blue-700',
  PAYEE: 'bg-green-100 text-green-700',
  ANNULEE: 'bg-red-100 text-red-600',
  EN_RETARD: 'bg-orange-100 text-orange-700',
}

const STATUT_FACTURE_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon',
  ENVOYEE: 'Envoyée',
  PAYEE: 'Payée',
  ANNULEE: 'Annulée',
  EN_RETARD: 'En retard',
}

const STATUT_DEVIS_COLORS: Record<string, string> = {
  BROUILLON: 'bg-gray-100 text-gray-600',
  ENVOYE: 'bg-blue-100 text-blue-700',
  ACCEPTE: 'bg-green-100 text-green-700',
  REFUSE: 'bg-red-100 text-red-600',
  CONVERTI: 'bg-purple-100 text-purple-700',
}

const STATUT_DEVIS_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon',
  ENVOYE: 'Envoyé',
  ACCEPTE: 'Accepté',
  REFUSE: 'Refusé',
  CONVERTI: 'Converti',
}

export default function FacturationPage() {
  const [factures, setFactures] = useState<any[]>([])
  const [devis, setDevis] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [stats, setStats] = useState<{ totalCA: number; totalImpayes: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/factures').then(r => r.ok ? r.json() : null),
      fetch('/api/devis').then(r => r.ok ? r.json() : null),
      fetch('/api/clients').then(r => r.ok ? r.json() : null),
    ]).then(([fData, dData, cData]) => {
      if (fData) { setFactures(fData.factures ?? []); setStats(fData.stats ?? null) }
      if (dData) setDevis(dData.devis ?? [])
      if (cData) setClients(cData.clients ?? [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  )

  const totalCA = stats?.totalCA ?? factures.filter(f => f.statut === 'PAYEE').reduce((s: number, f: any) => s + f.montantTTC, 0)
  const totalImpayes = stats?.totalImpayes ?? factures.filter(f => ['ENVOYEE', 'EN_RETARD'].includes(f.statut)).reduce((s: number, f: any) => s + f.montantTTC, 0)
  const devisEnCours = devis.filter(d => ['BROUILLON', 'ENVOYE'].includes(d.statut)).length

  const fmt = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Receipt className="w-7 h-7" style={{ color: NAVY }} />
          Facturation
        </h1>
        <p className="text-gray-500 mt-1">Gérez vos clients, devis et factures</p>
      </div>

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'CA encaissé', value: fmt(totalCA), icon: TrendingUp, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Impayés', value: fmt(totalImpayes), icon: AlertCircle, color: '#ea580c', bg: '#fed7aa' },
          { label: 'Devis en cours', value: String(devisEnCours), icon: Clock, color: NAVY, bg: '#e8f0fe' },
          { label: 'Clients', value: String(clients.length), icon: Users, color: '#7c3aed', bg: '#ede9fe' },
        ].map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: kpi.bg }}>
                  <Icon className="w-5 h-5" style={{ color: kpi.color }} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
                  <p className="text-xs text-gray-500">{kpi.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { href: '/facturation/clients', icon: Users, label: 'Clients', desc: `${clients.length} clients actifs` },
          { href: '/facturation/devis', icon: FileText, label: 'Devis', desc: `${devis.length} devis au total` },
          { href: '/facturation/factures', icon: Receipt, label: 'Factures', desc: `${factures.length} factures au total` },
        ].map(action => {
          const Icon = action.icon
          return (
            <Link key={action.href} href={action.href}
              className="card hover:shadow-md transition-shadow flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#e8f0fe' }}>
                  <Icon className="w-5 h-5" style={{ color: NAVY }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{action.label}</p>
                  <p className="text-xs text-gray-500">{action.desc}</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </Link>
          )
        })}
      </div>

      {/* Recent factures & devis side by side */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Factures */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Dernières factures</h2>
            <Link href="/facturation/factures" className="text-sm font-medium hover:underline" style={{ color: NAVY }}>Voir tout →</Link>
          </div>
          {factures.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">Aucune facture</p>
          ) : (
            <div className="space-y-2">
              {factures.slice(0, 5).map((f: any) => (
                <Link key={f.id} href={`/facturation/factures/${f.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{f.numero}</p>
                    <p className="text-xs text-gray-500">{f.client?.nom} · {new Date(f.dateEmission).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{fmt(f.montantTTC)}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUT_FACTURE_COLORS[f.statut] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUT_FACTURE_LABELS[f.statut] ?? f.statut}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <Link href="/facturation/factures/nouveau"
              className="w-full py-2 rounded-lg text-sm font-medium text-center block border-2 hover:bg-gray-50 transition-colors"
              style={{ borderColor: NAVY, color: NAVY }}>
              + Nouvelle facture
            </Link>
          </div>
        </div>

        {/* Devis */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Derniers devis</h2>
            <Link href="/facturation/devis" className="text-sm font-medium hover:underline" style={{ color: NAVY }}>Voir tout →</Link>
          </div>
          {devis.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">Aucun devis</p>
          ) : (
            <div className="space-y-2">
              {devis.slice(0, 5).map((d: any) => (
                <Link key={d.id} href={`/facturation/devis/${d.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{d.numero}</p>
                    <p className="text-xs text-gray-500">{d.client?.nom} · {new Date(d.dateEmission).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{fmt(d.montantTTC)}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUT_DEVIS_COLORS[d.statut] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUT_DEVIS_LABELS[d.statut] ?? d.statut}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <Link href="/facturation/devis/nouveau"
              className="w-full py-2 rounded-lg text-sm font-medium text-center block border-2 hover:bg-gray-50 transition-colors"
              style={{ borderColor: NAVY, color: NAVY }}>
              + Nouveau devis
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
