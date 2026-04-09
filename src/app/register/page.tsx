'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Building2, Loader2, CheckCircle, ArrowRight, Eye, EyeOff } from 'lucide-react'

const COMPANY_TYPES = ['SARL', 'EURL', 'SAS', 'SASU', 'SA', 'SNC', 'Auto-entrepreneur', 'Association']

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    entrepriseNom: '',
    entrepriseType: 'SARL',
    siret: '',
    prenom: '',
    nom: '',
    email: '',
    password: '',
    passwordConfirm: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.passwordConfirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
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
        setDone(true)
        // Auto-login puis redirection vers la page de paiement
        const result = await signIn('credentials', {
          email: form.email,
          password: form.password,
          redirect: false,
        })
        if (result?.ok) {
          setTimeout(() => router.push('/paiement'), 1500)
        } else {
          setTimeout(() => router.push('/login'), 1500)
        }
      }
    } catch {
      setError('Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const STEPS = ['Votre entreprise', 'Vos coordonnées', 'Mot de passe']

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
          <p className="text-gray-500 mt-1">Plateforme RH complète — Accès immédiat</p>
        </div>

        {/* Progress */}
        {!done && (
          <div className="mb-6">
            <div className="flex items-center gap-1 mb-2">
              {STEPS.map((label, i) => {
                const s = i + 1
                const active = step === s
                const done_ = step > s
                return (
                  <div key={s} className="flex items-center gap-1 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                      done_ ? 'bg-green-500 text-white' : active ? 'text-white' : 'bg-gray-200 text-gray-500'
                    }`} style={active ? { background: '#1e3a5f' } : {}}>
                      {done_ ? '✓' : s}
                    </div>
                    {s < 3 && <div className={`h-0.5 flex-1 ${done_ ? 'bg-green-500' : 'bg-gray-200'}`} />}
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              {STEPS.map(l => <span key={l}>{l}</span>)}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-5">
              {error}
            </div>
          )}

          {/* Succès */}
          {done && (
            <div className="text-center py-4">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Compte créé !</h2>
              <p className="text-gray-500 mb-1">Bienvenue <strong>{form.prenom}</strong> 👋</p>
              <p className="text-sm text-gray-400">Redirection vers la page de paiement...</p>
            </div>
          )}

          {/* Step 1 : Entreprise */}
          {!done && step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Votre entreprise</h2>
              <div>
                <label className="form-label">Nom de l'entreprise *</label>
                <input type="text" required className="form-input" placeholder="Mon Entreprise SARL"
                  value={form.entrepriseNom} onChange={e => setForm({ ...form, entrepriseNom: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Forme juridique</label>
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
                className="w-full text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: '#1e3a5f' }}
                onClick={() => setStep(2)}>
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2 : Coordonnées */}
          {!done && step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Vos coordonnées</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Prénom *</label>
                  <input type="text" required className="form-input" placeholder="Jean"
                    value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Nom *</label>
                  <input type="text" required className="form-input" placeholder="Dupont"
                    value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="form-label">Email *</label>
                <input type="email" required className="form-input" placeholder="vous@entreprise.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1 py-3" onClick={() => setStep(1)}>← Retour</button>
                <button type="button"
                  disabled={!form.email || !form.prenom || !form.nom}
                  className="flex-1 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: '#1e3a5f' }}
                  onClick={() => setStep(3)}>
                  Continuer <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 : Mot de passe */}
          {!done && step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Choisissez un mot de passe</h2>
              <div>
                <label className="form-label">Mot de passe *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="form-input pr-10"
                    placeholder="8 caractères minimum"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="form-label">Confirmer le mot de passe *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="form-input"
                  placeholder="Répétez votre mot de passe"
                  value={form.passwordConfirm}
                  onChange={e => setForm({ ...form, passwordConfirm: e.target.value })}
                />
                {form.passwordConfirm && form.password !== form.passwordConfirm && (
                  <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                )}
              </div>

              {/* Récapitulatif */}
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1">
                <p>🏢 <strong>{form.entrepriseNom}</strong> ({form.entrepriseType})</p>
                <p>👤 {form.prenom} {form.nom} — {form.email}</p>
              </div>

              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1 py-3" onClick={() => setStep(2)}>← Retour</button>
                <button type="submit"
                  disabled={loading || !form.password || form.password !== form.passwordConfirm}
                  className="flex-1 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: '#1e3a5f' }}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Création...' : 'Créer mon espace'}
                </button>
              </div>
            </form>
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
