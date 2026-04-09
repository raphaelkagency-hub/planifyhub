'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Loader2, CheckCircle, Eye, EyeOff, XCircle } from 'lucide-react'

export default function SetupPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'done'>('loading')
  const [tokenData, setTokenData] = useState<{ email: string; prenom: string; entrepriseNom: string; type: string } | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/setup?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setTokenData(data)
          setStatus('valid')
        } else {
          setStatus('invalid')
        }
      })
      .catch(() => setStatus('invalid'))
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    if (password.length < 8) {
      setError('Minimum 8 caractères')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erreur')
      } else {
        setStatus('done')
      }
    } catch {
      setError('Erreur serveur')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 to-blue-50 flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#1e3a5f' }}>
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">PlanifyHub</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {status === 'loading' && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: '#1e3a5f' }} />
              <p className="text-gray-500">Vérification du lien...</p>
            </div>
          )}

          {status === 'invalid' && (
            <div className="text-center py-8">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Lien invalide ou expiré</h2>
              <p className="text-gray-500 mb-6">Ce lien n'est plus valide. Demandez un nouveau lien depuis la page d'inscription.</p>
              <Link href="/register" className="text-white font-semibold py-3 px-6 rounded-lg inline-block" style={{ background: '#1e3a5f' }}>
                Retourner à l'inscription
              </Link>
            </div>
          )}

          {status === 'valid' && tokenData && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {tokenData.type === 'REGISTRATION' ? 'Créez votre mot de passe' : 'Définissez votre mot de passe'}
                </h2>
                <p className="text-gray-500 mt-1">
                  Bonjour {tokenData.prenom} — {tokenData.entrepriseNom}
                </p>
                <p className="text-sm text-gray-400 mt-1">{tokenData.email}</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Mot de passe *</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      required
                      className="form-input pr-10"
                      placeholder="Minimum 8 caractères"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      onClick={() => setShowPwd(!showPwd)}>
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="form-label">Confirmer le mot de passe *</label>
                  <input
                    type="password"
                    required
                    className="form-input"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  style={{ background: '#1e3a5f' }}
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Création...' : 'Activer mon compte'}
                </button>
              </form>
            </>
          )}

          {status === 'done' && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Compte activé !</h2>
              <p className="text-gray-500 mb-6">Votre mot de passe a été créé. Vous pouvez maintenant vous connecter.</p>
              <Link href="/login" className="text-white font-semibold py-3 px-8 rounded-lg inline-block" style={{ background: '#1e3a5f' }}>
                Se connecter
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
