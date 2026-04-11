# Péyi — Plateforme Civic Tech Guadeloupe

## Vision
Application citoyenne hyperlocale pour la Guadeloupe. Trois piliers :
1. **Actualités** — news filtrées par commune et thème
2. **Signalements** — carte interactive des problèmes citoyens
3. **Sondages** — enquêtes démographiques segmentées par commune, âge, catégorie

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Vue 3 (Composition API + `<script setup>`) |
| Langage | TypeScript strict |
| Style | Tailwind CSS v4 |
| État | Pinia |
| Routing | Vue Router 4 |
| Backend / DB | Supabase (Postgres + RLS + Realtime) |
| Auth | Supabase Auth (magic link + OAuth Google) |
| Carte | Leaflet + vue-leaflet |
| Déploiement | Vercel (SSG/SPA) |
| Tests | Vitest + Vue Test Utils |

---

## Architecture des dossiers

```
peyi/
├── src/
│   ├── main.ts                 # Point d'entrée, plugins
│   ├── App.vue                 # Shell racine
│   ├── router/
│   │   └── index.ts            # Routes + guards auth
│   ├── stores/                 # Pinia stores
│   │   ├── auth.ts             # Session utilisateur
│   │   ├── news.ts             # Articles + filtres commune
│   │   ├── reports.ts          # Signalements citoyens
│   │   └── surveys.ts          # Sondages + résultats
│   ├── services/               # Appels Supabase (une fonction = un use-case)
│   │   ├── supabase.ts         # Client singleton
│   │   ├── newsService.ts
│   │   ├── reportsService.ts
│   │   └── surveysService.ts
│   ├── composables/            # Logique réutilisable Vue
│   │   ├── useAuth.ts
│   │   ├── useGeolocation.ts
│   │   └── useCommune.ts
│   ├── types/                  # Types TypeScript partagés
│   │   ├── database.types.ts   # Généré par Supabase CLI
│   │   └── index.ts            # Re-exports + types métier
│   ├── components/
│   │   ├── common/             # UI générique (boutons, badges, modals)
│   │   ├── news/               # NewsCard, NewsFeed, CommuneFilter
│   │   ├── reports/            # ReportMap, ReportForm, ReportCard
│   │   └── surveys/            # SurveyCard, SurveyForm, ResultChart
│   ├── views/
│   │   ├── HomeView.vue
│   │   ├── news/
│   │   │   ├── NewsListView.vue
│   │   │   └── NewsDetailView.vue
│   │   ├── reports/
│   │   │   ├── ReportsMapView.vue
│   │   │   └── ReportDetailView.vue
│   │   └── surveys/
│   │       ├── SurveysListView.vue
│   │       └── SurveyDetailView.vue
│   ├── assets/
│   │   ├── icons/
│   │   └── images/
│   └── lib/
│       └── utils.ts            # Helpers purs (dates, slugs, formatage)
├── supabase/
│   ├── migrations/             # SQL versionné (une migration = un changement)
│   ├── functions/              # Edge Functions Deno
│   └── seed/                   # Données de test Guadeloupe
├── public/                     # Fichiers statiques
├── docs/                       # ADR + notes d'architecture
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD Vercel preview + prod
├── .env.example
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

---

## Modèle de données Supabase

### Table `communes`
```sql
id          uuid PK
name        text NOT NULL          -- "Pointe-à-Pitre", "Basse-Terre"...
code_insee  text UNIQUE NOT NULL   -- Code officiel INSEE
department  text                   -- "971"
lat         float8
lng         float8
```

### Table `news_articles`
```sql
id           uuid PK
commune_id   uuid FK communes
title        text NOT NULL
slug         text UNIQUE NOT NULL
body         text
category     text  -- 'politique' | 'environnement' | 'culture' | 'sport' | 'économie'
author       text
published_at timestamptz
image_url    text
source_url   text
created_at   timestamptz DEFAULT now()
```

### Table `reports`
```sql
id           uuid PK
user_id      uuid FK auth.users (nullable si anonyme)
commune_id   uuid FK communes
title        text NOT NULL
description  text
category     text  -- 'voirie' | 'eau' | 'déchets' | 'éclairage' | 'autre'
status       text  -- 'ouvert' | 'en_cours' | 'résolu' | 'rejeté'
lat          float8 NOT NULL
lng          float8 NOT NULL
photos       text[]
upvotes      int DEFAULT 0
created_at   timestamptz DEFAULT now()
updated_at   timestamptz DEFAULT now()
```

### Table `surveys`
```sql
id           uuid PK
title        text NOT NULL
description  text
commune_id   uuid FK communes (nullable = toute la Guadeloupe)
questions    jsonb NOT NULL   -- [{id, type, label, options?}]
is_active    boolean DEFAULT true
ends_at      timestamptz
created_at   timestamptz DEFAULT now()
```

### Table `survey_responses`
```sql
id           uuid PK
survey_id    uuid FK surveys
respondent_id uuid   -- fingerprint anonyme ou user_id
answers      jsonb NOT NULL   -- {questionId: value}
demographics jsonb            -- {age_group, commune, gender?}
created_at   timestamptz DEFAULT now()
```

---

## Conventions de code

- **Composants** : PascalCase, `<script setup lang="ts">`
- **Composables** : `useXxx.ts`, retournent toujours des `ref`/`computed` réactifs
- **Services** : fonctions async pures, jamais d'état interne, gèrent les erreurs Supabase
- **Stores Pinia** : `defineStore('name', () => {...})` (setup syntax)
- **Routes** : nommées avec `name:`, lazy-loaded avec `() => import(...)`
- **Types** : préférer les types Supabase générés, étendre dans `types/index.ts`
- **Tailwind** : mobile-first, pas de classes inline >3 tokens → extraire en composant

---

## Règles RLS Supabase

- `communes`, `news_articles`, `surveys` : lecture publique
- `reports` : lecture publique, écriture authentifiée OU anonyme avec rate-limit (Edge Function)
- `survey_responses` : insert seul (pas de lecture individuelle), un seul vote par fingerprint
- Admins : rôle `peyi_admin` via `auth.users.raw_app_meta_data`

---

## Communes de Guadeloupe (32 communes)
Basse-Terre, Baillif, Bouillante, Capesterre-Belle-Eau, Gourbeyre, Pointe-Noire,
Saint-Claude, Trois-Rivières, Vieux-Fort, Vieux-Habitants,
Pointe-à-Pitre, Abymes (Les), Baie-Mahault, Gosier (Le), Morne-à-l'Eau,
Petit-Bourg, Sainte-Anne, Sainte-Rose, Saint-François,
Anse-Bertrand, Désirade (La), Lamentin (Le), Moule (Le), Port-Louis,
Saint-Louis (Marie-Galante), Capesterre-de-Marie-Galante, Grand-Bourg,
Saint-Barthélemy (collectivité), Saint-Martin (collectivité),
Terre-de-Bas, Terre-de-Haut, Vieux-Fort (Les Saintes)

---

## Variables d'environnement

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_MAPBOX_TOKEN=          # optionnel, Leaflet + OSM suffit
```

---

## Commandes utiles

```bash
npm run dev              # Dev server Vite
npm run build            # Build prod
npm run typecheck        # tsc --noEmit
npm run lint             # ESLint
npx supabase start       # DB locale
npx supabase db push     # Appliquer migrations
npx supabase gen types   # Régénérer database.types.ts
```
