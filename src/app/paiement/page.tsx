'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Building2, CheckCircle, Loader2, Shield, Users, FileText, BarChart3, Clock, Star } from 'lucide-react'
import Link from 'next/link'

function PaiementContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const canceled = searchParams.get('canceled')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDemo, setIsDemo] = useState(false)

  const handlePay = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/paiement/checkout', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Une erreur est survenue')
        setLoading(false)
        return
      }

      if (data.demo) {
        setIsDemo(true)
        setLoading(false)
        setTimeout(() => router.push('/dashboard'), 2000)
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Une erreur est survenue. Réessayez.')
      setLoading(false)
    }
  }

  if (isDemo) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 text-center max-w-md w-full mx-auto">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Mode démo activé</h2>
        <p className="text-gray-500 mb-1">Accès complet à la plateforme</p>
        <p className="text-sm text-gray-400">Redirection vers le tableau de bord...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {canceled && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm mb-5 text-center">
          Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-5 text-center">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header plan */}
        <div className="p-8 text-center text-white" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%)' }}>
          <div className="inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-sm font-medium mb-4">
            <Star className="w-3.5 h-3.5" />
            Plan Tout Inclus
          </div>
          <div className="text-5xl font-bold mb-1">200€</div>
          <div className="text-white/70 text-sm">par mois · Sans engagement</div>
        </div>

        {/* Features */}
        <div className="p-8">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">Tout ce qui est inclus</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {[
              { icon: Users, text: 'Gestion illimitée des employés' },
              { icon: FileText, text: 'Fiches de paie automatiques' },
              { icon: Clock, text: 'Planning & pointage' },
              { icon: BarChart3, text: 'Exports Excel & rapports' },
              { icon: Shield, text: '3 rôles (Dirigeant, Secrétariat, Employé)' },
              { icon: CheckCircle, text: 'Support prioritaire' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#f0f4ff' }}>
                  <Icon className="w-4 h-4" style={{ color: '#1e3a5f' }} />
                </div>
                <span className="text-sm text-gray-700">{text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handlePay}
            disabled={loading}
            className="w-full text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 text-lg transition-opacity hover:opacity-90"
            style={{ background: '#1e3a5f' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Chargement...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Payer maintenant — 200€/mois
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center mt-4">
            Paiement sécurisé par Stripe · Annulable à tout moment
          </p>
        </div>
      </div>

      <div className="text-center mt-6">
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 underline">
          Ignorer pour l&apos;instant →
        </Link>
      </div>
    </div>
  )
}

export default function PaiementPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)' }}>
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#1e3a5f' }}>
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">PlanifyHub</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-6">Activez votre abonnement</h1>
          <p className="text-gray-500 mt-1">Accès immédiat à toutes les fonctionnalités</p>
        </div>

        <Suspense fallback={
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        }>
          <PaiementContent />
        </Suspense>
      </div>
    </div>
  )
}
