# Déploiement Péyi sur Vercel

Guide étape par étape pour déployer l'application en production.

---

## Prérequis

- Compte GitHub avec le repo `peyi` pushé
- Compte Vercel (gratuit) : vercel.com
- Projet Supabase configuré avec les migrations exécutées

---

## Étape 1 — Préparer le repo GitHub

```bash
# Dans le dossier du projet
git init                          # si pas déjà fait
git add .
git commit -m "feat: initial Péyi release"
git remote add origin https://github.com/TON_USERNAME/peyi.git
git push -u origin main
```

---

## Étape 2 — Connecter Vercel à GitHub

1. Va sur **vercel.com** → Log in → Dashboard
2. Clique **"Add New Project"**
3. Sélectionne **"Import Git Repository"**
4. Autorise Vercel à accéder à ton GitHub si demandé
5. Cherche `peyi` dans la liste et clique **"Import"**

---

## Étape 3 — Configurer le projet

Dans la page de configuration Vercel :

| Champ | Valeur |
|-------|--------|
| **Framework Preset** | `Vite` (auto-détecté) |
| **Root Directory** | `.` (laisser vide) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

---

## Étape 4 — Variables d'environnement

Dans la section **"Environment Variables"** sur la même page :

| Nom | Valeur | Environnements |
|-----|--------|---------------|
| `VITE_SUPABASE_URL` | `https://ymkluspaykisnaqcqtke.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_ntZNPNfK3-JbYx6POlJmNw_V_5yqA1w` | Production, Preview, Development |

> ⚠️ Ces valeurs commencent par `VITE_` — obligatoire pour que Vite les expose côté client.

---

## Étape 5 — Premier déploiement

1. Clique **"Deploy"**
2. Vercel build l'app (environ 2 minutes)
3. Une URL de production est générée : `peyi.vercel.app` (ou personnalisée)
4. Clique sur l'URL pour vérifier que la carte s'affiche correctement

---

## Étape 6 — Domaine personnalisé (optionnel)

1. Vercel Dashboard → ton projet → **"Domains"**
2. Clique **"Add Domain"** → entre `peyi.fr` (ou ton domaine)
3. Ajoute les enregistrements DNS indiqués par Vercel chez ton registrar
4. Vercel génère automatiquement le certificat SSL Let's Encrypt

---

## Déploiements automatiques

Chaque `git push` sur `main` déclenche automatiquement un redéploiement production.  
Les Pull Requests génèrent des URL de preview isolées.

---

## Sous-app "Poids" (poids-pwa)

Le dossier `poids-pwa/` est une PWA indépendante (suivi de poids), qui peut être
servie de deux façons :

### Option A — Intégrée au déploiement Péyi existant, sous `/poids`

Rien à configurer côté Vercel : `npm run build` à la racine construit d'abord
l'app Péyi, puis build automatiquement `poids-pwa` (base path `/poids/`) et
copie son résultat dans `dist/poids/` (voir `scripts/build-poids.mjs`).
Le fichier `vercel.json` racine route `/poids/(.*)` vers `dist/poids/index.html`
avant le fallback SPA général. Chaque déploiement de `peyi.vercel.app` sert
donc aussi `peyi.vercel.app/poids`.

Pour vérifier en local avant de déployer (simule les rewrites Vercel) :

```bash
npm run build
npm run preview:merged   # http://localhost:4173  et  http://localhost:4173/poids
```

### Option B — Déploiement Vercel séparé, dédié

Pour une URL propre (`poids-peyi.vercel.app` ou domaine dédié), créer un
**second projet Vercel** pointant sur ce même repo GitHub :

1. Vercel Dashboard → **Add New Project** → importer `peyi` à nouveau
2. **Root Directory** : `poids-pwa` (au lieu de `.`)
3. **Framework Preset** : Vite (auto-détecté)
4. Build/Install/Output : valeurs par défaut (`npm run build`, `npm install`, `dist`)
5. Aucune variable d'environnement requise (données 100 % locales, pas de Supabase)
6. Déployer

`poids-pwa/vercel.json` gère déjà le rewrite SPA nécessaire pour ce projet
autonome (base path `/`, indépendant de l'option A).

---

## Seed Supabase (à faire une fois avant le premier lancement)

Avant d'ouvrir l'app au public, exécute dans le **SQL Editor** de ton dashboard Supabase :

1. Contenu de `supabase/seed/communes.sql` — insère les 32 communes
2. Contenu de `supabase/seed/surveys.sql` — insère les 3 sondages initiaux

> Pour accéder au SQL Editor : supabase.com → ton projet → **SQL Editor** → **New query**

---

## Checklist finale

- [ ] `npm run build` passe sans erreur en local
- [ ] Variables d'env configurées dans Vercel Dashboard
- [ ] communes.sql exécuté dans Supabase
- [ ] surveys.sql exécuté dans Supabase
- [ ] Auth par téléphone activée dans Supabase : **Authentication → Providers → Phone**
- [ ] URL de production testée sur mobile (carte + sondage complet)
