# Guide de déploiement — PlanifyHub

## Prérequis

- Un compte [Supabase](https://supabase.com) (gratuit)
- Un compte [Vercel](https://vercel.com) (gratuit)
- Un compte [GitHub](https://github.com) (gratuit)

---

## ÉTAPE 1 — Créer votre base de données Supabase

1. Allez sur [supabase.com](https://supabase.com) et cliquez **"Start your project"**
2. Connectez-vous avec Google ou GitHub
3. Cliquez **"New project"**
4. Remplissez :
   - **Name** : `planifyhub`
   - **Database Password** : choisissez un mot de passe fort (notez-le !)
   - **Region** : choisissez **West EU (Ireland)** pour la France
5. Cliquez **"Create new project"** → attendez 1-2 minutes

### Récupérer l'URL de connexion

1. Dans votre projet Supabase, allez dans **Settings** (icône engrenage) → **Database**
2. Descendez jusqu'à **"Connection string"** → onglet **"URI"**
3. Copiez l'URL (elle ressemble à : `postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres`)
4. Remplacez `[YOUR-PASSWORD]` par le mot de passe que vous avez choisi

---

## ÉTAPE 2 — Pousser votre code sur GitHub

1. Créez un nouveau dépôt sur [github.com](https://github.com/new)
   - **Repository name** : `planifyhub`
   - Laissez-le **Private**
   - Cliquez **"Create repository"**

2. Dans le terminal de votre projet, exécutez :
```bash
git init
git add .
git commit -m "Initial commit — PlanifyHub"
git branch -M main
git remote add origin https://github.com/VOTRE-USERNAME/planifyhub.git
git push -u origin main
```

---

## ÉTAPE 3 — Déployer sur Vercel

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous avec GitHub
2. Cliquez **"New Project"**
3. Sélectionnez votre dépôt `planifyhub` → **"Import"**
4. Dans la section **"Environment Variables"**, ajoutez ces variables :

| Nom | Valeur |
|-----|--------|
| `DATABASE_URL` | L'URL Supabase copiée à l'étape 1 |
| `NEXTAUTH_URL` | `https://votre-projet.vercel.app` (vous le saurez après le premier déploiement) |
| `NEXTAUTH_SECRET` | Une chaîne aléatoire longue (ex: `planifyhub-prod-secret-2025-abc123xyz`) |
| `SMTP_HOST` | *(optionnel)* Serveur email (ex: `smtp.gmail.com`) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | *(optionnel)* Votre email |
| `SMTP_PASS` | *(optionnel)* Mot de passe application |
| `SMTP_FROM` | *(optionnel)* Email expéditeur |

5. Cliquez **"Deploy"** → attendez 2-3 minutes

---

## ÉTAPE 4 — Initialiser la base de données

Après le premier déploiement réussi :

1. Dans Vercel, allez dans votre projet → **"Settings"** → **"Environment Variables"**
2. Vérifiez que `NEXTAUTH_URL` correspond bien à votre URL Vercel (ex: `https://planifyhub-abc123.vercel.app`)
3. Sur votre PC, dans le terminal du projet, exécutez :

```bash
# Mettre à jour .env.local avec votre URL Supabase
# Puis :
npx prisma db push
npx prisma db seed
```

> **Alternative via Vercel** : vous pouvez aussi exécuter ces commandes dans Vercel CLI
> ```bash
> npm install -g vercel
> vercel env pull .env.production.local
> npx prisma db push --schema=prisma/schema.prisma
> ```

---

## ÉTAPE 5 — Corriger NEXTAUTH_URL

Si votre URL Vercel est différente de celle configurée :

1. Dans Vercel → **Settings** → **Environment Variables**
2. Modifiez `NEXTAUTH_URL` avec la bonne URL
3. Allez dans **Deployments** → cliquez sur les `...` du dernier déploiement → **"Redeploy"**

---

## Comptes de test (après `db:seed`)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Dirigeant | test.dirigeant@entreprise.com | Dirigeant123! |
| Secrétariat | test.secretaire@entreprise.com | Secretaire123! |
| Employé | test.employe@entreprise.com | Employe123! |

---

## Configuration email (optionnel)

Pour envoyer de vrais emails d'invitation :

### Avec Gmail
1. Activez **"Authentification à 2 facteurs"** sur votre compte Google
2. Allez dans : Compte Google → Sécurité → **"Mots de passe des applications"**
3. Créez un mot de passe pour "Courrier"
4. Configurez dans Vercel :
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = votre@gmail.com
   - `SMTP_PASS` = le mot de passe d'application (16 caractères)
   - `SMTP_FROM` = votre@gmail.com

### Sans email configuré (mode développement)
L'application fonctionne sans email : les liens d'invitation s'affichent directement à l'écran pour être copiés-collés.

---

## Mise à jour de l'application

Pour déployer une mise à jour :
```bash
git add .
git commit -m "Description de vos changements"
git push
```
Vercel redéploie automatiquement.

---

## En cas de problème

- **Erreur "Invalid DATABASE_URL"** → vérifiez que l'URL Supabase est correcte dans les variables Vercel
- **Erreur "NEXTAUTH_URL"** → vérifiez que l'URL correspond exactement à votre domaine Vercel
- **Page blanche** → allez dans Vercel → **Functions** → regardez les logs d'erreur
- **Base de données vide** → réexécutez `npx prisma db push && npx prisma db seed`
