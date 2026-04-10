'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { CheckCircle, Users, Zap, CreditCard, Shield } from 'lucide-react'
import { PLANS } from '@/lib/subscription'

type AbonnementData = {
  plan?: string
  statut?: string
  dateDebut?: string
  dateFin?: string
}

const NAVY = '#1e3a5f'

export default function AbonnementPage() {
  const { data: session } = useSession()
  const [employeCount, setEmployeCount] = useState<number | null>(null)
  const [abonnement, setAbonnement] = useState<AbonnementData | null>(null)
  const [loading, setLoading] = useState(true)

  const planId = (session?.user as any)?.planId ?? 'STARTER'

  useEffect(() => {
    Promise.all([
      fetch('/api/employes').then(r => r.ok ? r.json() : null),
      fetch('/api/abonnement').then(r => r.ok ? r.json() : null),
    ]).then(([empData, abData]) => {
      if (empData?.employes) setEmployeCount(empData.employes.length)
      if (abData?.abonnement) setAbonnement(abData.abonnement)
      if (abData && !abData.abonnement) setAbonnement(abData)
    }).finally(() => setLoading(false))
  }, [])

  const currentPlan = PLANS.find(p => p.id === planId) ?? PLANS[0]

  const maxLabel = currentPlan.maxEmployes !== null
    ? `${employeCount ?? '—'} / ${currentPlan.maxEmployes} employés`
    : `${employeCount ?? '—'} employés (illimité)`

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Abonnement</h1>
        <p className="text-gray-500 mt-1">Gérez votre plan et vos fonctionnalités</p>
      </div>

      {/* Current plan card */}
      <div className="card mb-8 border-l-4" style={{ borderLeftColor: NAVY }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#e8f0fe' }}>
              <CreditCard className="w-6 h-6" style={{ color: NAVY }} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Plan actuel</p>
              <p className="text-xl font-bold text-gray-900">{currentPlan.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="badge bg-green-100 text-green-700">● Actif</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">{currentPlan.price}€</p>
              <p className="text-sm text-gray-500">par mois</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <Users className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-semibold text-gray-900">{maxLabel}</p>
              </div>
              {currentPlan.maxEmployes !== null && employeCount !== null && (
                <div className="w-32 bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (employeCount / currentPlan.maxEmployes) * 100)}%`,
                      background: employeCount >= currentPlan.maxEmployes ? '#ef4444' : NAVY,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Plan comparison */}
      <h2 className="text-lg font-semibold text-gray-900 mb-5">Comparer les plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {PLANS.map(plan => {
          const isCurrent = plan.id === planId
          return (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 relative border-2 transition-all ${
                isCurrent ? 'shadow-lg' : 'bg-white border-gray-100 shadow-sm'
              }`}
              style={isCurrent ? { borderColor: NAVY, background: '#f0f5ff' } : {}}
            >
              {plan.popular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  POPULAIRE
                </div>
              )}
              {isCurrent && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: NAVY }}
                >
                  PLAN ACTUEL
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: isCurrent ? '#dbeafe' : '#f3f4f6' }}
                >
                  {plan.id === 'STARTER' && <Zap className="w-5 h-5" style={{ color: isCurrent ? NAVY : '#6b7280' }} />}
                  {plan.id === 'BUSINESS' && <Shield className="w-5 h-5" style={{ color: isCurrent ? NAVY : '#6b7280' }} />}
                  {plan.id === 'ENTERPRISE' && <Users className="w-5 h-5" style={{ color: isCurrent ? NAVY : '#6b7280' }} />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-xs text-gray-500">{plan.description}</p>
                </div>
              </div>

              <div className="mb-5">
                <span className="text-4xl font-bold text-gray-900">{plan.price}€</span>
                <span className="text-sm text-gray-500 ml-1">/mois</span>
              </div>

              <div className="mb-4 text-sm text-gray-600">
                <span className="font-medium">
                  {plan.maxEmployes !== null ? `Jusqu'à ${plan.maxEmployes} employés` : 'Employés illimités'}
                </span>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: isCurrent ? NAVY : '#16a34a' }}
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div
                  className="w-full py-2.5 rounded-xl text-center text-sm font-semibold text-white"
                  style={{ background: NAVY }}
                >
                  Plan actuel
                </div>
              ) : (
                <button
                  onClick={() => alert('Contactez-nous à contact@planifyhub.fr pour changer de plan')}
                  className="w-full py-2.5 rounded-xl text-center text-sm font-semibold border-2 text-gray-700 hover:bg-gray-50 transition-colors"
                  style={{ borderColor: NAVY, color: NAVY }}
                >
                  Choisir ce plan
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Info box */}
      <div className="card bg-blue-50 border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-100 flex-shrink-0">
            <CreditCard className="w-4 h-4" style={{ color: NAVY }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Changer de plan</p>
            <p className="text-sm text-gray-600">
              Pour upgrader ou changer votre plan, contactez notre équipe à{' '}
              <a href="mailto:contact@planifyhub.fr" className="font-semibold hover:underline" style={{ color: NAVY }}>
                contact@planifyhub.fr
              </a>
              . Nous vous répondrons dans les 24 heures.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
