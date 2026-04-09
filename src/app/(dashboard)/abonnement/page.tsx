'use client'

import { useSession } from 'next-auth/react'
import { PLAN } from '@/lib/subscription'
import { CheckCircle, CreditCard, Zap } from 'lucide-react'

export default function AbonnementPage() {
  const { data: session } = useSession()
  const role = session?.user?.role

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Abonnement</h1>
        <p className="text-gray-500 mt-1">Votre plan et vos fonctionnalités</p>
      </div>

      {/* Statut */}
      <div className="card mb-8 border-l-4 border-blue-500">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Votre abonnement</p>
              <p className="text-xl font-bold text-gray-900">Tout inclus</p>
              <span className="badge bg-green-100 text-green-700 mt-1">● Actif</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-gray-900">{PLAN.price}€</p>
            <p className="text-sm text-gray-500">par mois</p>
          </div>
        </div>
      </div>

      {/* Liste des fonctionnalités */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Tout ce qui est inclus
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          {PLAN.features.map((feature) => (
            <div key={feature} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-800">{feature}</span>
            </div>
          ))}
        </div>

        {role === 'DIRIGEANT' && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Facturation :</strong> Pour activer les paiements en ligne, configurez vos clés Stripe dans les variables d'environnement Vercel.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
