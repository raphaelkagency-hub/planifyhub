# GestioSaaS — Plateforme de gestion d'entreprise

SaaS complet pour la gestion intégrale d'entreprise : planning, pointage, fiches de paie, RH, chat interne et abonnements.

## Stack technique

- **Frontend & Backend** : Next.js 14 (App Router)
- **Base de données** : PostgreSQL via Prisma ORM
- **Authentification** : NextAuth.js (JWT)
- **Styling** : Tailwind CSS
- **Export** : xlsx (Excel)
- **Paiements** : Stripe (optionnel)

---

## Démarrage rapide

### 1. Prérequis

- Node.js 18+
- PostgreSQL (local ou cloud : [Neon](https://neon.tech), [Supabase](https://supabase.com), [Railway](https://railway.app))

### 2. Installation

```bash
npm install
```

### 3. Configuration

Copier `.env.example` vers `.env.local` et remplir les variables :

```bash
cp .env.example .env.local
```

Variables obligatoires :
```
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="votre-secret-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Base de données

```bash
# Générer le client Prisma
npm run db:generate

# Créer les tables
npm run db:push

# Initialiser avec les comptes de test
npm run db:seed
```

Ou via l'API (en développement) :
```bash
curl http://localhost:3000/api/init
```

### 5. Lancer en développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Dirigeant | test.dirigeant@entreprise.com | Dirigeant123! |
| Secrétariat | test.secretaire@entreprise.com | Secretaire123! |
| Employé | test.employe@entreprise.com | Employe123! |

---

## Structure du projet

```
src/
├── app/
│   ├── (dashboard)/          # Pages authentifiées
│   │   ├── dashboard/        # Tableau de bord
│   │   ├── planning/         # Gestion planning
│   │   ├── pointage/         # Pointage présences
│   │   ├── paie/             # Fiches de paie
│   │   ├── chat/             # Chat interne
│   │   ├── employes/         # Gestion employés
│   │   ├── rapports/         # Rapports RH (Premium)
│   │   ├── abonnement/       # Gestion abonnement
│   │   └── settings/         # Paramètres entreprise
│   ├── api/
│   │   ├── auth/             # NextAuth
│   │   ├── employes/         # CRUD employés
│   │   ├── planning/         # CRUD planning
│   │   ├── pointage/         # CRUD pointage
│   │   ├── paie/             # CRUD paie + génération
│   │   ├── chat/             # Messagerie
│   │   ├── exports/          # Export Excel
│   │   ├── rapports/         # Rapports avancés
│   │   ├── abonnement/       # Gestion abonnement
│   │   ├── entreprises/      # Paramètres entreprise
│   │   ├── register/         # Inscription
│   │   └── init/             # Initialisation BDD
│   ├── login/                # Page connexion
│   ├── register/             # Page inscription
│   └── page.tsx              # Site vitrine
├── components/
│   ├── Sidebar.tsx           # Navigation latérale
│   └── ExportButton.tsx      # Bouton export Excel
├── lib/
│   ├── auth.ts               # Config NextAuth
│   ├── prisma.ts             # Client Prisma
│   ├── session.ts            # Helpers session
│   ├── subscription.ts       # Logique abonnements
│   └── utils.ts              # Utilitaires
└── types/
    └── next-auth.d.ts        # Types session
prisma/
├── schema.prisma             # Schéma BDD
└── seed.ts                   # Données initiales
```

---

## Plans d'abonnement

| Fonctionnalité | Basique (75€) | Standard (150€) | Premium (200€) |
|----------------|:-:|:-:|:-:|
| Planning simple | ✅ | ✅ | ✅ |
| Pointage | ✅ | ✅ | ✅ |
| Fiches de paie | ✅ | ✅ | ✅ |
| Notes facultatives | ✅ | ✅ | ✅ |
| Export limité | ✅ | ✅ | ✅ |
| Export complet | ❌ | ✅ | ✅ |
| Chat lecture seule | ❌ | ✅ | ✅ |
| Dashboard dirigeant | ❌ | ✅ | ✅ |
| Gestion congés | ❌ | ✅ | ✅ |
| Notifications | ❌ | ✅ | ✅ |
| Rapports RH/financiers | ❌ | ❌ | ✅ |
| Site vitrine | ❌ | ❌ | ✅ |
| Support prioritaire | ❌ | ❌ | ✅ |

---

## Rôles et permissions

- **Dirigeant** : Accès total, modification entreprise, gestion abonnements
- **Secrétariat** : Création comptes, planning, pointage, exports, chat
- **Employé** : Pointage, consultation planning/paie, lecture chat

---

## Déploiement sur Vercel

1. Créer un projet sur [Vercel](https://vercel.com)
2. Connecter votre dépôt Git
3. Ajouter les variables d'environnement dans les Settings Vercel
4. Déployer — Vercel exécutera `prisma generate && prisma db push && next build`
5. Appeler `https://votre-app.vercel.app/api/init` pour initialiser les comptes de test

### Variables d'environnement Vercel

```
DATABASE_URL          = votre URL PostgreSQL (Neon recommandé)
NEXTAUTH_SECRET       = secret généré (openssl rand -base64 32)
NEXTAUTH_URL          = https://votre-app.vercel.app
STRIPE_SECRET_KEY     = sk_live_... (optionnel)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_... (optionnel)
```

---

## Configuration Stripe (optionnel)

Pour activer les paiements réels :

1. Créer des produits/prix dans le dashboard Stripe
2. Ajouter les Price IDs dans `.env.local` :
   ```
   STRIPE_PRICE_BASIQUE=price_xxx
   STRIPE_PRICE_STANDARD=price_xxx
   STRIPE_PRICE_PREMIUM=price_xxx
   ```
3. Configurer le webhook Stripe vers `/api/webhooks/stripe`

Sans Stripe configuré, la plateforme fonctionne en mode démo avec changement d'abonnement direct.
