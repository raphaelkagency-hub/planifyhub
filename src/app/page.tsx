'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PLAN } from '@/lib/subscription'
import {
  Users, Clock, FileText, Mail, BarChart3, Shield,
  CheckCircle, ArrowRight, Menu, X, Building2,
  Settings, Download, Lock, ChevronRight
} from 'lucide-react'

const NAVY = '#1e3a5f'
const NAVY_DARK = '#162d4a'
const NAVY_LIGHT = '#2a4f7c'

export default function VitrinePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: NAVY }}>
              <Building2 style={{ width: 18, height: 18, color: 'white' }} />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">PlanifyHub</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#fonctionnalites" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">Fonctionnalités</a>
            <a href="#tarif" className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">Tarif</a>
            <Link href="/login" className="text-sm text-gray-700 font-semibold hover:text-gray-900 transition-colors">Connexion</Link>
            <Link
              href="/register"
              className="text-sm text-white font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
              style={{ backgroundColor: NAVY }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = NAVY_DARK)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = NAVY)}
            >
              Créer mon espace
            </Link>
          </div>

          <button className="md:hidden p-2 text-gray-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3">
            <a href="#fonctionnalites" className="block text-gray-700 py-2 font-medium" onClick={() => setMobileMenuOpen(false)}>Fonctionnalités</a>
            <a href="#tarif" className="block text-gray-700 py-2 font-medium" onClick={() => setMobileMenuOpen(false)}>Tarif</a>
            <Link href="/login" className="block text-center border border-gray-200 rounded-lg py-2 font-semibold text-gray-700">Connexion</Link>
            <Link href="/register" className="block text-center text-white rounded-lg py-2 font-semibold" style={{ backgroundColor: NAVY }}>
              Créer mon espace
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-28 pb-20 overflow-hidden" style={{ background: 'linear-gradient(160deg, #f0f4f9 0%, #ffffff 60%)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border"
                style={{ backgroundColor: '#eef2f8', color: NAVY, borderColor: '#c5d3e8' }}
              >
                <Shield style={{ width: 14, height: 14 }} />
                Plateforme RH professionnelle
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.15] tracking-tight mb-5" style={{ color: NAVY }}>
                La gestion RH pensée pour les petites équipes
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                PlanifyHub centralise pointage, salaires, contrats et communications dans une seule plateforme. Votre secrétaire gère les comptes, vous pilotez.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 text-white font-semibold px-6 py-3 rounded-lg shadow transition-colors"
                  style={{ backgroundColor: NAVY }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = NAVY_DARK)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = NAVY)}
                >
                  Créer mon espace <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#fonctionnalites"
                  className="inline-flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-lg border transition-colors text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                >
                  Voir les fonctionnalités
                </a>
              </div>
            </div>

            {/* Mini mockup dashboard JSX */}
            <div className="hidden lg:block">
              <div className="rounded-2xl shadow-2xl overflow-hidden border border-gray-200" style={{ backgroundColor: '#f8fafc' }}>
                {/* Barre de titre */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-white">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-3 text-xs text-gray-400 font-mono">dashboard.gestiosaaas.fr</span>
                </div>
                <div className="flex">
                  {/* Sidebar */}
                  <div className="w-36 min-h-[280px] border-r border-gray-200 bg-white p-3 space-y-1">
                    {['Dashboard', 'Employés', 'Pointage', 'Salaires', 'Contrats', 'Emails'].map((item, i) => (
                      <div
                        key={item}
                        className="text-xs px-2 py-1.5 rounded font-medium"
                        style={i === 0 ? { backgroundColor: NAVY, color: 'white' } : { color: '#6b7280' }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                  {/* Content */}
                  <div className="flex-1 p-4 space-y-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vue d&apos;ensemble</div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Employés', value: '12' },
                        { label: 'Heures ce mois', value: '1 840h' },
                        { label: 'Masse salariale', value: '24 600 €' },
                        { label: 'Heures supp.', value: '48h' },
                      ].map(stat => (
                        <div key={stat.label} className="bg-white rounded-lg p-2.5 border border-gray-100">
                          <div className="text-xs text-gray-400">{stat.label}</div>
                          <div className="text-sm font-bold mt-0.5" style={{ color: NAVY }}>{stat.value}</div>
                        </div>
                      ))}
                    </div>
                    {/* Mini bar chart */}
                    <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                      <div className="text-xs text-gray-400 mb-2">Heures / semaine</div>
                      <div className="flex items-end gap-1 h-10">
                        {[60, 80, 55, 90, 75, 85, 70].map((h, i) => (
                          <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, backgroundColor: i === 3 ? NAVY : '#c5d3e8' }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-14 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '350+', label: 'Entreprises actives' },
              { value: '4 200+', label: 'Employés gérés' },
              { value: '98 %', label: 'Taux de satisfaction' },
              { value: '< 5 min', label: 'Prise en main' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-3xl font-extrabold" style={{ color: NAVY }}>{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 RÔLES ── */}
      <section className="py-20" style={{ backgroundColor: '#f0f4f9' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: NAVY }}>3 rôles, une seule plateforme</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Chaque profil dispose des accès adaptés à sa fonction. Aucune confusion, aucun accès superflu.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                role: 'Dirigeant',
                icon: <BarChart3 style={{ width: 28, height: 28, color: 'white' }} />,
                color: NAVY,
                permissions: [
                  'Tableau de bord global (heures, salaires, performances)',
                  'Validation des fiches de paie',
                  'Configuration des heures supplémentaires',
                  'Accès aux rapports RH et financiers',
                  'Paramétrage des contrats et taux horaires',
                ],
              },
              {
                role: 'Secrétaire',
                icon: <Users style={{ width: 28, height: 28, color: 'white' }} />,
                color: NAVY_LIGHT,
                permissions: [
                  'Création et gestion des comptes employés',
                  'Envoi des invitations par email',
                  'Saisie et modification du pointage',
                  'Validation des fiches de paie',
                  'Gestion des absences et congés',
                  'Accès à la messagerie interne',
                ],
              },
              {
                role: 'Employé',
                icon: <Clock style={{ width: 28, height: 28, color: 'white' }} />,
                color: '#3a6ea5',
                permissions: [
                  'Saisie de ses heures (en temps réel ou après coup)',
                  'Consultation de ses fiches de paie',
                  'Téléchargement de ses fiches de pointage',
                  'Lecture des messages internes',
                  'Consultation de ses heures supplémentaires',
                ],
              },
            ].map(item => (
              <div key={item.role} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 flex items-center gap-3" style={{ backgroundColor: item.color }}>
                  <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-lg font-bold text-white">{item.role}</span>
                </div>
                <ul className="p-5 space-y-3">
                  {item.permissions.map(perm => (
                    <li key={perm} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: item.color }} />
                      {perm}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FONCTIONNALITÉS ── */}
      <section id="fonctionnalites" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: NAVY }}>7 modules pour tout gérer</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Pas de fonctionnalité superflue. Chaque module répond à un besoin réel de gestion d&apos;équipe.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

            {/* Module 1 — Gestion des employés */}
            <div className="rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#eef2f8' }}>
                <Users style={{ width: 24, height: 24, color: NAVY }} />
              </div>
              <h3 className="text-base font-bold mb-2" style={{ color: NAVY }}>Gestion des employés</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                Les comptes sont créés par la secrétaire — pas d&apos;auto-inscription. Chaque employé reçoit une invitation par email sécurisée. Trois rôles distincts : Dirigeant, Secrétaire, Employé.
              </p>
              {/* Mini illustration */}
              <div className="rounded-lg border border-gray-100 p-3 space-y-2" style={{ backgroundColor: '#f8fafc' }}>
                {['Sophie Martin · Secrétaire', 'Julien Blanc · Employé', 'Marie Leroy · Employé'].map((name, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ backgroundColor: i === 0 ? NAVY : '#6b8cae' }}>
                      {name[0]}
                    </div>
                    <span className="text-xs text-gray-600">{name}</span>
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#eef2f8', color: NAVY }}>
                      {i === 0 ? 'Actif' : 'Invité'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Module 2 — Pointage flexible */}
            <div className="rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#eef2f8' }}>
                <Clock style={{ width: 24, height: 24, color: NAVY }} />
              </div>
              <h3 className="text-base font-bold mb-2" style={{ color: NAVY }}>Pointage flexible</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                Les employés saisissent leurs heures quand ils veulent — même plusieurs jours après. Aucune contrainte de temps réel. Les heures supplémentaires sont calculées automatiquement selon les heures contractuelles.
              </p>
              {/* Mini illustration */}
              <div className="rounded-lg border border-gray-100 p-3" style={{ backgroundColor: '#f8fafc' }}>
                <div className="text-xs text-gray-400 mb-2">Semaine du 31 mars</div>
                <div className="space-y-1.5">
                  {[
                    { jour: 'Lundi', h: '8h00', fin: '17h00' },
                    { jour: 'Mardi', h: '9h30', fin: '18h30' },
                    { jour: 'Mercredi', h: '8h00', fin: '16h00' },
                  ].map(row => (
                    <div key={row.jour} className="flex items-center text-xs gap-2">
                      <span className="w-16 text-gray-500">{row.jour}</span>
                      <span className="text-gray-700">{row.h} → {row.fin}</span>
                      <span className="ml-auto font-semibold" style={{ color: NAVY }}>9h</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Module 3 — Gestion des contrats */}
            <div className="rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#eef2f8' }}>
                <FileText style={{ width: 24, height: 24, color: NAVY }} />
              </div>
              <h3 className="text-base font-bold mb-2" style={{ color: NAVY }}>Gestion des contrats</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                Définissez les heures contractuelles minimum par semaine (30h, 35h, 39h, 40h ou personnalisé). Les heures supplémentaires sont détectées automatiquement dès dépassement.
              </p>
              {/* Mini illustration */}
              <div className="rounded-lg border border-gray-100 p-3 space-y-2" style={{ backgroundColor: '#f8fafc' }}>
                {[
                  { label: '35h / semaine', active: true },
                  { label: '39h / semaine', active: false },
                  { label: 'Personnalisé', active: false },
                ].map(opt => (
                  <div key={opt.label} className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: opt.active ? NAVY : '#d1d5db' }}>
                      {opt.active && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: NAVY }} />}
                    </div>
                    <span className="text-xs text-gray-600">{opt.label}</span>
                  </div>
                ))}
                <div className="mt-1 text-xs pt-2 border-t border-gray-100" style={{ color: NAVY }}>
                  Seuil actuel : 35h &mdash; heures supp. détectées au-delà
                </div>
              </div>
            </div>

            {/* Module 4 — Calcul des salaires */}
            <div className="rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#eef2f8' }}>
                <BarChart3 style={{ width: 24, height: 24, color: NAVY }} />
              </div>
              <h3 className="text-base font-bold mb-2" style={{ color: NAVY }}>Calcul automatique des salaires</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                Formule appliquée automatiquement : heures travaillées × taux horaire + heures supp. × 1.25. Charges salariales calculées. Dashboard complet réservé au dirigeant.
              </p>
              {/* Mini illustration */}
              <div className="rounded-lg border border-gray-100 p-3" style={{ backgroundColor: '#f8fafc' }}>
                <div className="text-xs text-gray-400 mb-2">Fiche avril 2025</div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Heures normales (151h)</span><span className="text-gray-700">2 265,00 €</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Heures supp. ×1.25 (12h)</span><span style={{ color: NAVY }} className="font-semibold">225,00 €</span></div>
                  <div className="flex justify-between border-t border-gray-100 pt-1.5 mt-1"><span className="font-semibold text-gray-700">Brut</span><span className="font-bold" style={{ color: NAVY }}>2 490,00 €</span></div>
                </div>
              </div>
            </div>

            {/* Module 5 — Paramétrage heures supp */}
            <div className="rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#eef2f8' }}>
                <Settings style={{ width: 24, height: 24, color: NAVY }} />
              </div>
              <h3 className="text-base font-bold mb-2" style={{ color: NAVY }}>Paramétrage heures supplémentaires</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                Activez ou désactivez le paiement des heures supplémentaires selon votre politique. Si désactivé, elles restent calculées et visibles, mais ne sont pas intégrées au salaire.
              </p>
              {/* Mini illustration — toggle */}
              <div className="rounded-lg border border-gray-100 p-3 space-y-3" style={{ backgroundColor: '#f8fafc' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Paiement heures supp.</span>
                  <div className="w-9 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: NAVY }}>
                    <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Affichage dans le dashboard</span>
                  <div className="w-9 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: NAVY }}>
                    <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm" />
                  </div>
                </div>
                <div className="text-xs text-gray-400 italic">Les heures sont toujours comptabilisées.</div>
              </div>
            </div>

            {/* Module 6 — Documents et exports */}
            <div className="rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#eef2f8' }}>
                <Download style={{ width: 24, height: 24, color: NAVY }} />
              </div>
              <h3 className="text-base font-bold mb-2" style={{ color: NAVY }}>Documents et exports</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                Fiches de paie et fiches de pointage téléchargeables en quelques clics. Formats disponibles : <strong>Excel</strong> et <strong>Google Sheets</strong>. Compatible avec votre comptable.
              </p>
              {/* Mini illustration */}
              <div className="rounded-lg border border-gray-100 p-3 space-y-2" style={{ backgroundColor: '#f8fafc' }}>
                {[
                  { name: 'Fiche_paie_Mars_2025.xlsx', type: 'Excel' },
                  { name: 'Pointage_T1_2025.gsheet', type: 'Google Sheets' },
                  { name: 'Rapport_RH_Q1.xlsx', type: 'Excel' },
                ].map(file => (
                  <div key={file.name} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: file.type === 'Excel' ? '#1e6f3e' : '#1a73e8' }}>
                      {file.type === 'Excel' ? 'X' : 'G'}
                    </div>
                    <span className="text-xs text-gray-600 truncate">{file.name}</span>
                    <Download style={{ width: 12, height: 12, color: '#9ca3af', flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Module 7 — Email intégré — pleine largeur */}
            <div className="rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow md:col-span-2 lg:col-span-3">
              <div className="grid lg:grid-cols-2 gap-8 items-start">
                <div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#eef2f8' }}>
                    <Mail style={{ width: 24, height: 24, color: NAVY }} />
                  </div>
                  <h3 className="text-base font-bold mb-2" style={{ color: NAVY }}>Email professionnel intégré</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Connectez votre messagerie existante — Gmail ou toute autre adresse via IMAP/SMTP. Lisez vos emails et répondez directement depuis la plateforme, sans changer d&apos;outil. Parfait pour centraliser les échanges RH.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['Gmail', 'Outlook', 'IMAP/SMTP', 'OVH Mail', 'Infomaniak'].map(provider => (
                      <span key={provider} className="text-xs px-2.5 py-1 rounded-full border font-medium" style={{ borderColor: '#c5d3e8', color: NAVY, backgroundColor: '#f0f4f9' }}>
                        {provider}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Mini mailbox */}
                <div className="rounded-xl border border-gray-200 overflow-hidden" style={{ backgroundColor: '#f8fafc' }}>
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 bg-white">
                    <Mail style={{ width: 14, height: 14, color: NAVY }} />
                    <span className="text-xs font-semibold" style={{ color: NAVY }}>Boite de réception</span>
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: NAVY }}>3</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {[
                      { from: 'rh@acme.fr', subject: 'Contrat CDI — Marie Leroy', time: '09:14', unread: true },
                      { from: 'social@urssaf.fr', subject: 'Déclaration DSN — Mars', time: 'Hier', unread: true },
                      { from: 'contact@fournisseur.com', subject: 'Devis logiciels', time: 'Lun.', unread: false },
                    ].map(mail => (
                      <div key={mail.subject} className="px-4 py-2.5 bg-white flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: mail.unread ? NAVY : 'transparent' }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs truncate ${mail.unread ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>{mail.from}</span>
                            <span className="text-xs text-gray-400 flex-shrink-0">{mail.time}</span>
                          </div>
                          <div className="text-xs text-gray-500 truncate">{mail.subject}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SÉCURITÉ ── */}
      <section className="py-20" style={{ backgroundColor: '#f0f4f9' }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: NAVY }}>Sécurité par défaut</h2>
            <p className="text-gray-500 max-w-lg mx-auto">Vos données RH sont sensibles. PlanifyHub applique des standards de sécurité stricts, sans configuration de votre part.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Lock style={{ width: 22, height: 22, color: NAVY }} />,
                title: 'Mots de passe hashés',
                desc: 'Aucun mot de passe n\'est stocké en clair. Chiffrement bcrypt avec sel unique par utilisateur.',
              },
              {
                icon: <Shield style={{ width: 22, height: 22, color: NAVY }} />,
                title: 'Tokens sécurisés',
                desc: 'Sessions protégées par tokens JWT à durée limitée. Invalidation immédiate à la déconnexion.',
              },
              {
                icon: <Building2 style={{ width: 22, height: 22, color: NAVY }} />,
                title: 'Isolation par entreprise',
                desc: 'Les données de chaque entreprise sont strictement isolées. Aucune donnée croisée entre clients.',
              },
              {
                icon: <Mail style={{ width: 22, height: 22, color: NAVY }} />,
                title: 'Invitations contrôlées',
                desc: 'L\'accès ne s\'ouvre que sur invitation email. Impossible de rejoindre un espace sans autorisation.',
              },
              {
                icon: <Users style={{ width: 22, height: 22, color: NAVY }} />,
                title: 'Permissions par rôle',
                desc: 'Chaque rôle ne voit que ce qui le concerne. Les employés n\'ont pas accès aux données de paie des autres.',
              },
              {
                icon: <CheckCircle style={{ width: 22, height: 22, color: NAVY }} />,
                title: 'Journalisation des actions',
                desc: 'Les modifications importantes sont tracées : création de compte, modification de salaire, export de données.',
              },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: '#eef2f8' }}>
                  {item.icon}
                </div>
                <div className="text-sm font-semibold mb-1.5" style={{ color: NAVY }}>{item.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TARIF UNIQUE ── */}
      <section id="tarif" className="py-20 bg-white">
        <div className="max-w-lg mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold mb-3" style={{ color: NAVY }}>Un seul tarif, tout inclus</h2>
          <p className="text-gray-500 mb-10">Pas d&apos;option cachée, pas de palier. Toutes les fonctionnalités pour un prix fixe mensuel.</p>

          <div className="rounded-2xl border-2 shadow-xl overflow-hidden" style={{ borderColor: NAVY }}>
            <div className="py-6 px-8 text-white" style={{ backgroundColor: NAVY }}>
              <div className="text-lg font-bold mb-1">{PLAN.name}</div>
              <div className="text-5xl font-extrabold">{PLAN.price} €<span className="text-2xl font-normal opacity-80">/mois</span></div>
              <div className="text-sm opacity-70 mt-1">Par entreprise — utilisateurs illimités</div>
            </div>
            <div className="p-8">
              <ul className="space-y-3 mb-8 text-left">
                {PLAN.features.map(feature => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: NAVY }} />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="block w-full text-center text-white font-semibold py-3.5 rounded-xl transition-colors shadow"
                style={{ backgroundColor: NAVY }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = NAVY_DARK)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = NAVY)}
              >
                Créer mon espace <ChevronRight className="inline w-4 h-4" />
              </Link>
              <p className="text-xs text-gray-400 mt-3 text-center">Accès complet dès la souscription.</p>

              {/* Comment ça fonctionne */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Comment ça fonctionne</p>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center mt-0.5" style={{ backgroundColor: NAVY }}>1</span>
                    Vous créez votre espace entreprise
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center mt-0.5" style={{ backgroundColor: NAVY }}>2</span>
                    Vous réglez l'abonnement — <strong>c'est tout</strong>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center mt-0.5" style={{ backgroundColor: NAVY }}>3</span>
                    Votre plateforme est prête, vos employés peuvent se connecter
                  </li>
                </ol>
              </div>

              {/* Moyens de paiement */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  <Lock style={{ width: 13, height: 13, color: '#16a34a' }} />
                  <p className="text-xs font-semibold text-green-700">Paiement 100 % sécurisé via Stripe</p>
                </div>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {/* Visa */}
                  <div className="border border-gray-200 rounded-md px-2.5 py-1.5 bg-white shadow-sm flex items-center gap-1.5">
                    <svg width="38" height="14" viewBox="0 0 38 14" fill="none">
                      <text x="0" y="12" fontFamily="Arial" fontWeight="bold" fontSize="13" fill="#1a1f71">VISA</text>
                    </svg>
                  </div>
                  {/* Mastercard */}
                  <div className="border border-gray-200 rounded-md px-2 py-1.5 bg-white shadow-sm flex items-center gap-1">
                    <div className="w-5 h-5 rounded-full bg-red-500 opacity-90" />
                    <div className="w-5 h-5 rounded-full bg-yellow-400 opacity-90 -ml-2.5" />
                    <span className="text-xs font-bold text-gray-700 ml-1">MC</span>
                  </div>
                  {/* Amex */}
                  <div className="border border-gray-200 rounded-md px-2.5 py-1.5 bg-white shadow-sm flex items-center">
                    <span className="text-xs font-bold" style={{ color: '#007bc1' }}>AMEX</span>
                  </div>
                  {/* CB */}
                  <div className="border border-gray-200 rounded-md px-2.5 py-1.5 bg-white shadow-sm flex items-center">
                    <span className="text-xs font-bold text-gray-700">CB</span>
                  </div>
                  {/* Stripe badge */}
                  <div className="border border-gray-200 rounded-md px-2.5 py-1.5 bg-white shadow-sm flex items-center gap-1">
                    <svg width="40" height="16" viewBox="0 0 40 16" fill="none">
                      <rect width="40" height="16" rx="3" fill="#635bff"/>
                      <text x="5" y="12" fontFamily="Arial" fontWeight="bold" fontSize="9" fill="white">stripe</text>
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">Vos données bancaires sont chiffrées et jamais stockées sur nos serveurs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-20 text-white" style={{ backgroundColor: NAVY }}>
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Prêt à simplifier votre gestion RH ?</h2>
          <p className="text-blue-200 mb-8 text-lg">
            Déployé en moins de 10 minutes. Votre secrétaire crée les comptes, vos employés pointent dès le premier jour.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 font-semibold px-8 py-3.5 rounded-xl transition-colors shadow-lg text-gray-900 bg-white hover:bg-gray-100"
            >
              Créer mon espace <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 font-semibold px-8 py-3.5 rounded-xl border border-blue-300 hover:bg-white/10 transition-colors"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: NAVY }}>
                <Building2 style={{ width: 16, height: 16, color: 'white' }} />
              </div>
              <span className="font-bold text-gray-800">PlanifyHub</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <a href="#fonctionnalites" className="hover:text-gray-800 transition-colors">Fonctionnalités</a>
              <a href="#tarif" className="hover:text-gray-800 transition-colors">Tarif</a>
              <Link href="/login" className="hover:text-gray-800 transition-colors">Connexion</Link>
              <Link href="/register" className="hover:text-gray-800 transition-colors">Inscription</Link>
            </div>
            <div className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} PlanifyHub. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
