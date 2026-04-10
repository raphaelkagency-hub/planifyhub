import Link from 'next/link'
import {
  Users, Clock, FileText, CalendarOff, Receipt, FolderOpen,
  MessageSquare, BarChart3, CheckCircle, ArrowRight, Shield,
  Zap, Building2, Star
} from 'lucide-react'

const NAVY = '#1e3a5f'
const NAVY_LIGHT = '#2d5a8e'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: NAVY }}>
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl" style={{ color: NAVY }}>PlanifyHub</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#fonctionnalites" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">Fonctionnalités</a>
            <a href="#tarifs" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">Tarifs</a>
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">Connexion</Link>
            <Link href="/register"
              className="text-sm font-semibold px-5 py-2.5 rounded-lg text-white transition-all hover:opacity-90 hover:scale-105"
              style={{ background: NAVY }}>
              Démarrer gratuitement
            </Link>
          </div>
          <Link href="/register"
            className="md:hidden text-xs font-semibold px-3 py-2 rounded-lg text-white"
            style={{ background: NAVY }}>
            Commencer
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-28 pb-24 px-6" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)' }}>
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full mb-8 border"
            style={{ background: '#fff', color: NAVY, borderColor: '#c7d8f0' }}>
            🚀 Nouveau · Facturation &amp; Documents inclus
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight" style={{ color: NAVY }}>
            La plateforme RH complète<br />
            <span style={{ color: '#3b82f6' }}>pour les PME</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Gérez vos employés, votre paie, vos congés, votre facturation et vos documents depuis un seul outil. Prêt en 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link href="/register"
              className="inline-flex items-center gap-2 justify-center font-semibold px-8 py-4 rounded-xl text-lg text-white transition-all hover:opacity-90 hover:scale-105 shadow-lg"
              style={{ background: NAVY }}>
              Créer mon espace gratuit <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#fonctionnalites"
              className="inline-flex items-center gap-2 justify-center font-semibold px-8 py-4 rounded-xl text-lg border-2 transition-all hover:bg-white/60"
              style={{ borderColor: NAVY, color: NAVY }}>
              Voir les fonctionnalités
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium" style={{ color: NAVY }}>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Sans engagement</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Configuration en 5 min</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Support inclus</span>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '500+', label: 'Entreprises' },
            { value: '8 000+', label: 'Employés gérés' },
            { value: '98%', label: 'De satisfaction' },
            { value: '< 5 min', label: "D'installation" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-bold" style={{ color: NAVY }}>{value}</p>
              <p className="text-gray-500 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MODULES ── */}
      <section id="fonctionnalites" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tout ce dont votre entreprise a besoin
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              8 modules intégrés pour couvrir 100 % de vos besoins administratifs et RH
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users,        title: 'Gestion des employés',  desc: 'Profils complets, contrats, taux horaire, historique',           color: '#3b82f6' },
              { icon: Clock,        title: 'Pointage & Planning',   desc: 'Suivi intelligent des heures, plannings et absences',             color: '#8b5cf6' },
              { icon: FileText,     title: 'Fiches de paie',        desc: 'Génération automatique avec heures sup et exports',               color: '#10b981' },
              { icon: CalendarOff,  title: 'Congés & Absences',     desc: 'Demandes en ligne, validation, calendrier d\'équipe',             color: '#f59e0b' },
              { icon: Receipt,      title: 'Facturation & Devis',   desc: 'Créez et envoyez factures et devis professionnels',               color: '#ef4444' },
              { icon: FolderOpen,   title: 'Gestion Documents',     desc: 'Stockage sécurisé, contrats et documents RH',                    color: '#06b6d4' },
              { icon: MessageSquare,title: 'Chat Interne',          desc: 'Messagerie d\'équipe centralisée',                                color: '#6366f1' },
              { icon: BarChart3,    title: 'Rapports & Stats',      desc: 'Tableaux de bord, analyses et exports Excel',                     color: '#0ea5e9' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: color + '18' }}>
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Un outil adapté à chaque rôle</h2>
            <p className="text-gray-500 text-lg">Chaque collaborateur accède uniquement à ce dont il a besoin</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                role: 'Dirigeant', color: NAVY, icon: Shield,
                features: ['Accès complet à tous les modules', 'Gestion des abonnements', 'Statistiques et rapports avancés', 'Validation des fiches de paie', 'Configuration des paramètres', 'Gestion des employés et rôles'],
              },
              {
                role: 'Secrétaire', color: '#7c3aed', icon: Zap,
                features: ['Gestion des employés', 'Validation des pointages', 'Validation des congés', 'Génération fiches de paie', 'Gestion des factures et devis', 'Gestion des documents RH'],
              },
              {
                role: 'Employé', color: '#059669', icon: Users,
                features: ['Saisie du pointage', 'Demandes de congés en ligne', 'Consultation fiches de paie', 'Téléchargement de documents', 'Chat interne', 'Historique personnel'],
              },
            ].map(({ role, color, icon: Icon, features }) => (
              <div key={role} className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '18' }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{role}</h3>
                </div>
                <ul className="space-y-3">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="tarifs" className="py-20 px-6" style={{ background: NAVY }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Des tarifs simples et transparents</h2>
            <p className="text-blue-200 text-lg max-w-2xl mx-auto">
              Toutes les fonctionnalités sont incluses dans chaque plan. Seul le nombre d&apos;employés change.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter', price: 49, employees: '10 employés max', popular: false,
                features: ['Gestion des employés', 'Pointage & planning', 'Fiches de paie', 'Congés & absences', 'Chat interne', 'Export Excel'],
              },
              {
                name: 'Business', price: 99, employees: '25 employés max', popular: true,
                features: ['Tout Starter inclus', 'Facturation & devis', 'Gestion documents', 'Rapports avancés', 'Export PDF', 'Support prioritaire'],
              },
              {
                name: 'Enterprise', price: 199, employees: 'Employés illimités', popular: false,
                features: ['Tout Business inclus', 'Employés illimités', 'Onboarding personnalisé', 'SLA 99.9 %', 'Support dédié', 'Formation incluse'],
              },
            ].map(({ name, price, employees, popular, features }) => (
              <div key={name} className={`rounded-2xl p-8 relative ${popular ? 'bg-white shadow-2xl scale-105' : 'bg-white/10 border border-white/20'}`}>
                {popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1"
                    style={{ background: '#3b82f6' }}>
                    <Star className="w-3 h-3" /> LE PLUS POPULAIRE
                  </div>
                )}
                <h3 className={`text-xl font-bold mb-1 ${popular ? 'text-gray-900' : 'text-white'}`}>{name}</h3>
                <p className={`text-sm mb-6 ${popular ? 'text-gray-500' : 'text-blue-200'}`}>{employees}</p>
                <div className="mb-6">
                  <span className={`text-5xl font-bold ${popular ? 'text-gray-900' : 'text-white'}`}>{price}€</span>
                  <span className={`text-sm ml-1 ${popular ? 'text-gray-500' : 'text-blue-200'}`}>/mois</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {features.map(f => (
                    <li key={f} className={`flex items-center gap-3 text-sm ${popular ? 'text-gray-600' : 'text-blue-100'}`}>
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${popular ? 'text-green-500' : 'text-blue-300'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register"
                  className={`w-full py-3 rounded-xl font-semibold text-center block transition-all hover:scale-105 ${popular ? 'text-white' : 'bg-white/15 text-white hover:bg-white/25 border border-white/30'}`}
                  style={popular ? { background: NAVY } : {}}>
                  Démarrer →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full mb-6 border"
            style={{ background: '#fff', color: NAVY, borderColor: '#c7d8f0' }}>
            🌟 Rejoignez 500+ entreprises qui font confiance à PlanifyHub
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: NAVY }}>
            Créer mon espace maintenant
          </h2>
          <p className="text-gray-500 text-lg mb-8">
            Sans carte bancaire · Accès immédiat
          </p>
          <Link href="/register"
            className="inline-flex items-center gap-2 font-bold px-10 py-4 rounded-xl text-lg text-white hover:opacity-90 transition-all hover:scale-105 shadow-lg"
            style={{ background: NAVY }}>
            Créer mon espace gratuitement <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-6 bg-gray-900">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-white font-bold">PlanifyHub</span>
              <p className="text-gray-500 text-xs">La plateforme RH des PME</p>
            </div>
          </div>
          <div className="flex gap-6 text-gray-400 text-sm">
            <a href="#fonctionnalites" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#tarifs" className="hover:text-white transition-colors">Tarifs</a>
            <Link href="/login" className="hover:text-white transition-colors">Connexion</Link>
            <Link href="/register" className="hover:text-white transition-colors">Créer un compte</Link>
          </div>
          <p className="text-gray-500 text-sm">© 2025 PlanifyHub — Tous droits réservés</p>
        </div>
      </footer>

    </div>
  )
}
