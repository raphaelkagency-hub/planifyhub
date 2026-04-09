'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email ou mot de passe incorrect')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const loginAs = (role: 'dirigeant' | 'secretaire' | 'employe') => {
    const accounts = {
      dirigeant: { email: 'test.dirigeant@entreprise.com', password: 'Dirigeant123!' },
      secretaire: { email: 'test.secretaire@entreprise.com', password: 'Secretaire123!' },
      employe: { email: 'test.employe@entreprise.com', password: 'Employe123!' },
    }
    setForm(accounts[role])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">PlanifyHub</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-6">Connexion</h1>
          <p className="text-gray-600 mt-1">Accédez à votre espace de gestion</p>
        </div>

        <div className="card">
          {/* Quick login buttons */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Comptes de démonstration
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { role: 'dirigeant' as const, label: 'Dirigeant', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
                { role: 'secretaire' as const, label: 'Secrétariat', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                { role: 'employe' as const, label: 'Employé', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
              ].map(({ role, label, color }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => loginAs(role)}
                  className={`${color} text-xs font-medium py-2 px-3 rounded-lg transition-colors`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Cliquez sur un rôle pour remplir automatiquement
            </p>
          </div>

          <div className="border-t border-gray-100 my-6"></div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="form-label">Adresse email</label>
              <input
                type="email"
                required
                autoComplete="email"
                className="form-input"
                placeholder="vous@entreprise.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="form-input pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Pas encore de compte ?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Retour au site
          </Link>
        </div>
      </div>
    </div>
  )
}
