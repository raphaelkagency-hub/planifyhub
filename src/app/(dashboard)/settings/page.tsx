'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Building2, Clock, Save, Loader2, Mail, Users, AlertCircle, CheckCircle, Copy } from 'lucide-react'

const COMPANY_TYPES = ['SARL', 'EURL', 'SAS', 'SASU', 'SA', 'SNC', 'Auto-entrepreneur', 'Association']
const HEURES_OPTIONS = [25, 30, 35, 39, 40, 42, 44]
const JOURS_MAP = [
  { value: '1', label: 'Lundi' }, { value: '2', label: 'Mardi' },
  { value: '3', label: 'Mercredi' }, { value: '4', label: 'Jeudi' },
  { value: '5', label: 'Vendredi' }, { value: '6', label: 'Samedi' },
  { value: '0', label: 'Dimanche' },
]

interface Settings {
  nom: string; type: string; siret: string; adresse: string; codePostal: string
  ville: string; telephone: string; email: string; siteWeb: string
  heureDebut: string; heureFin: string; pauseDuree: number; joursOuvres: string
  horairesDebutConfig: string; heuresContractuelles: number; heuresSupPayees: boolean
  tauxHeuresSuppMultiplier: number
  emailProvider: string; emailSmtpHost: string; emailSmtpPort: string
  emailSmtpUser: string; emailSmtpSecure: boolean
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<Settings>({
    nom: '', type: 'SARL', siret: '', adresse: '', codePostal: '', ville: '',
    telephone: '', email: '', siteWeb: '',
    heureDebut: '09:00', heureFin: '18:00', pauseDuree: 60, joursOuvres: '1,2,3,4,5',
    horairesDebutConfig: '08:00,08:30,09:00,09:30,10:00',
    heuresContractuelles: 35, heuresSupPayees: true, tauxHeuresSuppMultiplier: 1.25,
    emailProvider: '', emailSmtpHost: '', emailSmtpPort: '587',
    emailSmtpUser: '', emailSmtpSecure: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'entreprise' | 'horaires' | 'contrats' | 'invitation' | 'email'>('entreprise')

  // Invitation state
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePrenom, setInvitePrenom] = useState('')
  const [inviteNom, setInviteNom] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ emailSent: boolean; setupUrl?: string } | null>(null)

  const role = session?.user?.role
  const isDirigeant = role === 'DIRIGEANT'
  const canEdit = role === 'DIRIGEANT' || role === 'SECRETARIAT'

  useEffect(() => {
    fetch('/api/entreprises/settings')
      .then(r => r.json())
      .then(data => { if (data.entreprise) setSettings(s => ({ ...s, ...data.entreprise })) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canEdit) return
    setSaving(true)
    try {
      const res = await fetch('/api/entreprises/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)
    setInviteResult(null)
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, prenom: invitePrenom, nom: inviteNom }),
      })
      const data = await res.json()
      if (res.ok) {
        setInviteResult({ emailSent: data.emailSent, setupUrl: data.setupUrl })
        setInviteEmail(''); setInvitePrenom(''); setInviteNom('')
      }
    } catch (err) { console.error(err) }
    finally { setInviteLoading(false) }
  }

  const selectedJours = settings.joursOuvres.split(',').filter(Boolean)
  const toggleJour = (jour: string) => {
    const updated = selectedJours.includes(jour)
      ? selectedJours.filter(j => j !== jour)
      : [...selectedJours, jour].sort()
    setSettings({ ...settings, joursOuvres: updated.join(',') })
  }

  // Horaires de début possibles
  const horairesDebut = settings.horairesDebutConfig.split(',').filter(Boolean)
  const toggleHoraire = (h: string) => {
    const updated = horairesDebut.includes(h)
      ? horairesDebut.filter(x => x !== h)
      : [...horairesDebut, h].sort()
    setSettings({ ...settings, horairesDebutConfig: updated.join(',') })
  }
  const allSlots = (() => {
    const slots: string[] = []
    for (let h = 6; h <= 12; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`)
      slots.push(`${String(h).padStart(2, '0')}:30`)
    }
    return slots
  })()

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1e3a5f' }} /></div>

  const TABS = [
    { id: 'entreprise', label: 'Entreprise', show: isDirigeant },
    { id: 'horaires', label: 'Horaires', show: canEdit },
    { id: 'contrats', label: 'Contrats & Heures supp.', show: canEdit },
    { id: 'invitation', label: 'Inviter une secrétaire', show: isDirigeant },
    { id: 'email', label: 'Email professionnel', show: isDirigeant },
  ] as const

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-500 mt-1">Configuration de votre entreprise</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {TABS.filter(t => t.show).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave}>
        {/* Tab: Entreprise */}
        {activeTab === 'entreprise' && (
          <div className="card space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#e8f0fe' }}>
                <Building2 className="w-5 h-5" style={{ color: '#1e3a5f' }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Informations légales</h2>
                <p className="text-sm text-gray-500">Données de votre entreprise</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="form-label">Nom de l'entreprise *</label>
                <input type="text" required className="form-input" disabled={!isDirigeant}
                  value={settings.nom} onChange={e => setSettings({ ...settings, nom: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Forme juridique</label>
                <select className="form-input" disabled={!isDirigeant} value={settings.type}
                  onChange={e => setSettings({ ...settings, type: e.target.value })}>
                  {COMPANY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">SIRET</label>
                <input type="text" className="form-input" disabled={!isDirigeant}
                  value={settings.siret} onChange={e => setSettings({ ...settings, siret: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input type="email" className="form-input" disabled={!isDirigeant}
                  value={settings.email} onChange={e => setSettings({ ...settings, email: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Téléphone</label>
                <input type="tel" className="form-input" disabled={!isDirigeant}
                  value={settings.telephone} onChange={e => setSettings({ ...settings, telephone: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Site web</label>
                <input type="url" className="form-input" disabled={!isDirigeant} placeholder="https://"
                  value={settings.siteWeb} onChange={e => setSettings({ ...settings, siteWeb: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Adresse</label>
                <input type="text" className="form-input" disabled={!isDirigeant}
                  value={settings.adresse} onChange={e => setSettings({ ...settings, adresse: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Code postal</label>
                <input type="text" className="form-input" disabled={!isDirigeant}
                  value={settings.codePostal} onChange={e => setSettings({ ...settings, codePostal: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Ville</label>
                <input type="text" className="form-input" disabled={!isDirigeant}
                  value={settings.ville} onChange={e => setSettings({ ...settings, ville: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Horaires */}
        {activeTab === 'horaires' && (
          <div className="card space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#e8f0fe' }}>
                <Clock className="w-5 h-5" style={{ color: '#1e3a5f' }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Horaires de travail</h2>
                <p className="text-sm text-gray-500">Définissez les créneaux disponibles pour les employés</p>
              </div>
            </div>

            <div>
              <label className="form-label mb-3 block">Horaires de début possibles (sélectionnez ceux disponibles)</label>
              <div className="flex flex-wrap gap-2">
                {allSlots.map(slot => (
                  <button key={slot} type="button" disabled={!canEdit}
                    onClick={() => toggleHoraire(slot)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      horairesDebut.includes(slot)
                        ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    } disabled:cursor-not-allowed`}
                    style={horairesDebut.includes(slot) ? { background: '#1e3a5f' } : {}}>
                    {slot}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Les employés choisiront leur heure d'arrivée parmi ces créneaux. Les heures de départ sont libres (intervalles 30 min).</p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              <div>
                <label className="form-label">Heure de début par défaut</label>
                <input type="time" className="form-input" disabled={!canEdit}
                  value={settings.heureDebut} onChange={e => setSettings({ ...settings, heureDebut: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Heure de fin par défaut</label>
                <input type="time" className="form-input" disabled={!canEdit}
                  value={settings.heureFin} onChange={e => setSettings({ ...settings, heureFin: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Pause par défaut (min)</label>
                <input type="number" min="0" max="120" className="form-input" disabled={!canEdit}
                  value={settings.pauseDuree}
                  onChange={e => setSettings({ ...settings, pauseDuree: parseInt(e.target.value) })} />
              </div>
            </div>

            <div>
              <label className="form-label mb-2 block">Jours ouvrés</label>
              <div className="flex flex-wrap gap-2">
                {JOURS_MAP.map(jour => (
                  <button key={jour.value} type="button" disabled={!canEdit}
                    onClick={() => toggleJour(jour.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedJours.includes(jour.value) ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } disabled:cursor-not-allowed`}
                    style={selectedJours.includes(jour.value) ? { background: '#1e3a5f' } : {}}>
                    {jour.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Contrats */}
        {activeTab === 'contrats' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Heures contractuelles par défaut</h2>
              <p className="text-sm text-gray-500 mb-5">Définit la base de calcul des heures supplémentaires pour tous les employés (modifiable par employé)</p>

              <div className="flex flex-wrap gap-3 mb-4">
                {HEURES_OPTIONS.map(h => (
                  <button key={h} type="button" disabled={!canEdit}
                    onClick={() => setSettings({ ...settings, heuresContractuelles: h })}
                    className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                      settings.heuresContractuelles === h ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={settings.heuresContractuelles === h ? { background: '#1e3a5f' } : {}}>
                    {h}h
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <label className="form-label mb-0 flex-shrink-0">Valeur personnalisée :</label>
                <input type="number" min="1" max="60" className="form-input w-24" disabled={!canEdit}
                  value={settings.heuresContractuelles}
                  onChange={e => setSettings({ ...settings, heuresContractuelles: parseInt(e.target.value) })} />
                <span className="text-gray-500 text-sm">heures / semaine</span>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                <strong>Exemple :</strong> Contrat 35h — si un employé travaille 42h dans la semaine → 35h normales + 7h supplémentaires
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Paiement des heures supplémentaires</h2>
              <p className="text-sm text-gray-500 mb-5">Choisissez si les heures supplémentaires sont incluses dans le salaire</p>

              <div className="flex gap-4">
                <button type="button" disabled={!isDirigeant}
                  onClick={() => setSettings({ ...settings, heuresSupPayees: true })}
                  className={`flex-1 p-4 rounded-xl border-2 text-left transition-colors ${
                    settings.heuresSupPayees ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                  } disabled:cursor-not-allowed`}>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className={`w-5 h-5 ${settings.heuresSupPayees ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="font-semibold text-gray-900">Paiement activé</span>
                  </div>
                  <p className="text-sm text-gray-500">Les heures supp sont calculées et <strong>ajoutées au salaire</strong></p>
                </button>
                <button type="button" disabled={!isDirigeant}
                  onClick={() => setSettings({ ...settings, heuresSupPayees: false })}
                  className={`flex-1 p-4 rounded-xl border-2 text-left transition-colors ${
                    !settings.heuresSupPayees ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'
                  } disabled:cursor-not-allowed`}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className={`w-5 h-5 ${!settings.heuresSupPayees ? 'text-yellow-600' : 'text-gray-400'}`} />
                    <span className="font-semibold text-gray-900">Paiement désactivé</span>
                  </div>
                  <p className="text-sm text-gray-500">Les heures supp sont <strong>visibles mais non payées</strong></p>
                </button>
              </div>
            </div>

            {settings.heuresSupPayees && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Majoration des heures supplémentaires</h2>
                <p className="text-sm text-gray-500 mb-5">Taux de majoration appliqué au calcul du salaire</p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: 1.00, label: '×1.00', desc: 'Pas de majoration' },
                    { value: 1.25, label: '×1.25', desc: '+25%' },
                    { value: 1.50, label: '×1.50', desc: '+50%' },
                    { value: 2.00, label: '×2.00', desc: '+100%' },
                  ].map(opt => (
                    <button key={opt.value} type="button" disabled={!isDirigeant}
                      onClick={() => setSettings({ ...settings, tauxHeuresSuppMultiplier: opt.value })}
                      className={`px-5 py-3 rounded-xl border-2 text-center transition-colors disabled:cursor-not-allowed ${
                        settings.tauxHeuresSuppMultiplier === opt.value
                          ? 'text-white border-transparent'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                      }`}
                      style={settings.tauxHeuresSuppMultiplier === opt.value ? { background: '#1e3a5f' } : {}}>
                      <div className="font-bold text-lg">{opt.label}</div>
                      <div className="text-xs opacity-75">{opt.desc}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Exemple avec ×1.25 : 1h supp à 17€/h = 17 × 1.25 = <strong>21,25€</strong>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Invitation secrétaire */}
        {activeTab === 'invitation' && isDirigeant && (
          <div className="card max-w-lg">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#e8f0fe' }}>
                <Users className="w-5 h-5" style={{ color: '#1e3a5f' }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Inviter une secrétaire</h2>
                <p className="text-sm text-gray-500">Un lien d'accès sécurisé sera envoyé par email</p>
              </div>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Prénom</label>
                  <input type="text" className="form-input" value={invitePrenom}
                    onChange={e => setInvitePrenom(e.target.value)} placeholder="Marie" />
                </div>
                <div>
                  <label className="form-label">Nom</label>
                  <input type="text" className="form-input" value={inviteNom}
                    onChange={e => setInviteNom(e.target.value)} placeholder="Dupont" />
                </div>
              </div>
              <div>
                <label className="form-label">Email de la secrétaire *</label>
                <input type="email" required className="form-input" value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)} placeholder="secretaire@entreprise.com" />
              </div>
              <button type="submit" disabled={inviteLoading || !inviteEmail}
                className="w-full text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: '#1e3a5f' }}>
                {inviteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {inviteLoading ? 'Envoi...' : 'Envoyer l\'invitation'}
              </button>
            </form>

            {inviteResult && (
              <div className={`mt-4 p-4 rounded-xl border ${inviteResult.emailSent ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                {inviteResult.emailSent ? (
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-4 h-4" />
                    <p className="text-sm font-medium">Invitation envoyée par email !</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-blue-900 mb-2">⚠️ Email non configuré — lien à transmettre manuellement :</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-blue-700 font-mono break-all flex-1">{inviteResult.setupUrl}</p>
                      <button type="button" onClick={() => navigator.clipboard.writeText(inviteResult.setupUrl!)}
                        className="p-1.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 flex-shrink-0">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab: Email professionnel */}
        {activeTab === 'email' && isDirigeant && (
          <div className="card">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#e8f0fe' }}>
                <Mail className="w-5 h-5" style={{ color: '#1e3a5f' }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Email professionnel</h2>
                <p className="text-sm text-gray-500">Connectez l'email de votre entreprise à la plateforme</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { id: 'gmail', label: 'Gmail', icon: '📧', desc: 'Via OAuth Google' },
                { id: 'smtp', label: 'IMAP / SMTP', icon: '🔧', desc: 'Tout fournisseur' },
              ].map(p => (
                <button key={p.id} type="button"
                  onClick={() => setSettings({ ...settings, emailProvider: p.id })}
                  className={`p-4 rounded-xl border-2 text-left transition-colors ${
                    settings.emailProvider === p.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <div className="text-2xl mb-1">{p.icon}</div>
                  <div className="font-semibold text-gray-900">{p.label}</div>
                  <div className="text-xs text-gray-500">{p.desc}</div>
                </button>
              ))}
            </div>

            {settings.emailProvider === 'gmail' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
                <p className="font-semibold mb-1">⚙️ Configuration requise</p>
                <p>Pour connecter Gmail, vous devez configurer OAuth dans Google Cloud Console et ajouter les variables <code>GOOGLE_CLIENT_ID</code> et <code>GOOGLE_CLIENT_SECRET</code> dans vos variables d'environnement Vercel.</p>
                <p className="mt-2">Contactez votre développeur ou consultant pour cette configuration.</p>
              </div>
            )}

            {settings.emailProvider === 'smtp' && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Serveur SMTP</label>
                    <input type="text" className="form-input" placeholder="smtp.gmail.com"
                      value={settings.emailSmtpHost}
                      onChange={e => setSettings({ ...settings, emailSmtpHost: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Port</label>
                    <select className="form-input" value={settings.emailSmtpPort}
                      onChange={e => setSettings({ ...settings, emailSmtpPort: e.target.value })}>
                      <option value="587">587 (TLS)</option>
                      <option value="465">465 (SSL)</option>
                      <option value="25">25</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Adresse email</label>
                    <input type="email" className="form-input" placeholder="contact@entreprise.com"
                      value={settings.emailSmtpUser}
                      onChange={e => setSettings({ ...settings, emailSmtpUser: e.target.value })} />
                  </div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                  Le mot de passe SMTP se configure dans les variables d'environnement (<code>SMTP_PASS</code>) pour des raisons de sécurité.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Save button for form tabs */}
        {(activeTab === 'entreprise' || activeTab === 'horaires' || activeTab === 'contrats' || activeTab === 'email') && canEdit && (
          <div className="flex justify-end mt-6">
            <button type="submit" disabled={saving}
              className={`flex items-center gap-2 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50 ${saved ? 'bg-green-600' : ''}`}
              style={!saved ? { background: '#1e3a5f' } : {}}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
                : saved ? '✓ Enregistré'
                : <><Save className="w-4 h-4" /> Enregistrer</>}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
