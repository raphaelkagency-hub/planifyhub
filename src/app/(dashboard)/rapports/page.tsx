'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { hasFeature } from '@/lib/subscription'
import { formatCurrency, formatHours, getPeriodeLabel, getCurrentPeriode } from '@/lib/utils'
import { BarChart3, TrendingUp, Users, Clock, Lock, Loader2, Download } from 'lucide-react'
import ExportButton from '@/components/ExportButton'

interface RapportData {
  totalEmployes: number
  totalHeures: number
  totalSalaires: number
  moyenneHeures: number
  tauxPresence: number
  tauxAbsence: number
  topEmployes: { nom: string; prenom: string; heures: number }[]
  repartitionStatuts: { statut: string; count: number }[]
}

export default function RapportsPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<RapportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [periode, setPeriode] = useState(getCurrentPeriode())

  const role = session?.user?.role
  const abonnement = session?.user?.abonnement as any
  const hasAccess = hasFeature(abonnement, 'rapportsRHFinanciers') && (role === 'DIRIGEANT' || role === 'SECRETARIAT')

  useEffect(() => {
    if (hasAccess) fetchRapport()
  }, [periode])

  const fetchRapport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/rapports?periode=${periode}`)
      const result = await res.json()
      setData(result)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const periods = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="card max-w-md text-center py-12">
          <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Rapports avancés</h2>
          <p className="text-gray-600 mb-4">
            Les rapports RH et financiers avancés sont disponibles avec le plan <strong>Premium</strong>.
          </p>
          <a href="/abonnement" className="btn-primary inline-block">
            Passer au Premium
          </a>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports RH & Financiers</h1>
          <p className="text-gray-500 mt-1">Analyses et statistiques avancées</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton type="pointage" start={`${periode}-01`} end={`${periode}-31`} />
          <ExportButton type="paie" periode={periode} />
        </div>
      </div>

      {/* Period selector */}
      <div className="mb-6">
        <label className="form-label">Période d'analyse</label>
        <select className="form-input max-w-xs" value={periode} onChange={e => setPeriode(e.target.value)}>
          {periods.map(p => (
            <option key={p} value={p}>{getPeriodeLabel(p)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">Employés actifs</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{data.totalEmployes}</div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm text-gray-500">Total heures</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{formatHours(data.totalHeures)}</div>
              <div className="text-xs text-gray-500 mt-1">
                Moy: {formatHours(data.moyenneHeures)}/employé
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm text-gray-500">Masse salariale</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{formatCurrency(data.totalSalaires)}</div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                </div>
                <span className="text-sm text-gray-500">Taux de présence</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{data.tauxPresence.toFixed(1)}%</div>
              <div className="text-xs text-gray-500 mt-1">
                Absence: {data.tauxAbsence.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top performers */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top employés par heures</h2>
              {data.topEmployes.length > 0 ? (
                <div className="space-y-3">
                  {data.topEmployes.map((emp, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-yellow-100 text-yellow-700' :
                        i === 1 ? 'bg-gray-100 text-gray-700' :
                        i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'
                      }`}>
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-900">{emp.prenom} {emp.nom}</span>
                          <span className="text-sm text-gray-600">{formatHours(emp.heures)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full">
                          <div
                            className="h-1.5 bg-blue-500 rounded-full"
                            style={{ width: `${data.topEmployes[0]?.heures ? (emp.heures / data.topEmployes[0].heures) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Aucune donnée pour cette période</p>
              )}
            </div>

            {/* Statuts repartition */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Répartition des statuts</h2>
              {data.repartitionStatuts.length > 0 ? (
                <div className="space-y-3">
                  {data.repartitionStatuts.map((s) => {
                    const colors: Record<string, string> = {
                      PRESENT: 'bg-green-500',
                      ABSENT: 'bg-red-500',
                      CONGE: 'bg-blue-500',
                      MALADIE: 'bg-yellow-500',
                      FERIE: 'bg-gray-400',
                    }
                    const total = data.repartitionStatuts.reduce((sum, r) => sum + r.count, 0)
                    const pct = total > 0 ? (s.count / total) * 100 : 0
                    return (
                      <div key={s.statut}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{s.statut}</span>
                          <span className="font-medium">{s.count} jours ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full">
                          <div
                            className={`h-2 ${colors[s.statut] ?? 'bg-gray-400'} rounded-full`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Aucune donnée pour cette période</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500">Aucune donnée disponible pour cette période</p>
        </div>
      )}
    </div>
  )
}
