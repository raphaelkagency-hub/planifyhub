'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, Loader2, CheckCircle, Mail, ArrowRight } from 'lucide-react'

const COMPANY_TYPES = ['SARL', 'EURL', 'SAS', 'SASU', 'SA', 'SNC', 'Auto-entrepreneur', 'Association']

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [setupUrl, setSetupUrl] = useState<string | null>(null) // dev mode fallback
  const [emailSent, setEmailSent] = useState(false)
  const [form, setForm] = useState({
    entrepriseNom: '',
    entrepriseType: 'SARL',
    siret: '',
    prenom: '',
    nom: '',
    email: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de la création du compte')
      } else {
        setEmailSent(data.emailSent)
        setSetupUrl(data.setupUrl ?? null)
        setStep(3)
      }
    } catch {
      setError('Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)' }}>
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#1e3a5f' }}>
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">PlanifyHub</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-6">Créer votre espace</h1>
          <p className="text-gray-500 mt-1">Plateforme RH complète pour votre équipe</p>
        </div>

        {/* Progress */}
        {step < 3 && (
          <>
            <div className="flex items-center gap-2 mb-3">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step > s ? 'bg-green-500 text-white' : step === s ? 'text-white' : 'bg-gray-200 text-gray-500'
                  }`} style={step === s ? { background: '#1e3a5f' } : {}}>
                    {step > s ? '✓' : s}
                  </div>
                  {s < 2 && <div className={`h-0.5 flex-1 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mb-6">
              <span>Votre entreprise</span>
              <span>Vos coordonnées</span>
            </div>
          </>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {/* Step 1: Company info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Votre entreprise</h2>
              <div>
                <label className="form-label">Nom de l'entreprise *</label>
                <input type="text" required className="form-input" placeholder="Mon Entreprise SARL"
                  value={form.entrepriseNom} onChange={e => setForm({ ...form, entrepriseNom: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Forme juridique *</label>
                <select className="form-input" value={form.entrepriseType}
                  onChange={e => setForm({ ...form, entrepriseType: e.target.value })}>
                  {COMPANY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">SIRET <span className="text-gray-400 font-normal">(optionnel)</span></label>
                <input type="text" className="form-input" placeholder="12345678901234"
                  value={form.siret} onChange={e => setForm({ ...form, siret: e.target.value })} />
              </div>
              <button type="button" disabled={!form.entrepriseNom}
                className="w-full text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                style={{ background: '#1e3a5f' }}
                onClick={() => setStep(2)}>
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Personal info */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Vos coordonnées (Dirigeant)</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Prénom *</label>
                  <input type="text" required className="form-input"
                    value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Nom *</label>
                  <input type="text" required className="form-input"
                    value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="form-label">Adresse email *</label>
                <input type="email" required className="form-input" placeholder="vous@entreprise.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                <p className="text-xs text-gray-400 mt-1">Un lien de création de mot de passe vous sera envoyé</p>
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1 py-3" onClick={() => setStep(1)}>← Retour</button>
                <button type="submit" disabled={loading || !form.email || !form.prenom || !form.nom}
                  className="flex-1 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: '#1e3a5f' }}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Envoi...' : 'Créer mon espace'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="text-center py-4">
              {emailSent ? (
                <>
                  <Mail className="w-14 h-14 mx-auto mb-4" style={{ color: '#1e3a5f' }} />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Email envoyé !</h2>
                  <p className="text-gray-500 mb-2">
                    Un email a été envoyé à <strong>{form.email}</strong>.
                  </p>
                  <p className="text-gray-500 text-sm">Cliquez sur le lien dans l'email pour définir votre mot de passe. Le lien est valable 24h.</p>
                </>
              ) : (
                <>
                  <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Espace créé !</h2>
                  <p className="text-gray-500 mb-2">
                    Bienvenue <strong>{form.prenom}</strong> — <strong>{form.entrepriseNom}</strong>
                  </p>
                  {setupUrl && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left mt-4 mb-4">
                      <p className="text-sm font-semibold text-blue-900 mb-2">⚠️ Mode développement (email non configuré)</p>
                      <p className="text-xs text-blue-700 mb-3">Aucun serveur email n'est configuré. Utilisez ce lien pour définir votre mot de passe :</p>
                      <a href={setupUrl} className="text-xs text-blue-800 underline break-all font-mono">{setupUrl}</a>
                    </div>
                  )}
                  <a href={setupUrl ?? '/login'}
                    className="text-white font-semibold py-3 px-8 rounded-lg inline-block mt-2"
                    style={{ background: '#1e3a5f' }}>
                    {setupUrl ? 'Définir mon mot de passe →' : 'Se connecter'}
                  </a>
                </>
              )}
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Déjà un compte ?{' '}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: '#1e3a5f' }}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
