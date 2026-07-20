# Poids — Suivi & Recalcul Adaptatif de Poids

PWA de suivi de perte de poids qui recalcule en temps réel la date prévisionnelle
d'atteinte de l'objectif, en fonction des apports caloriques et de l'activité
physique réels enregistrés chaque jour.

Sous-projet isolé au sein du dépôt `peyi` — stack et données indépendantes de
l'application civic-tech Péyi (aucun code ni service partagé).

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4
- Recharts (courbe théorique vs réelle)
- Dexie (IndexedDB) — toutes les données restent en local, sur l'appareil
- vite-plugin-pwa — installable (manifest + service worker)

## Développement

```bash
cd poids-pwa
npm install
npm run dev       # serveur de dev
npm run build     # build de production (tsc -b && vite build)
npm run preview   # prévisualiser le build
```

## Modèle

- **Profil** (unique, local) : taille, poids de départ/cible, âge, sexe, niveau
  d'activité, déficit calorique quotidien visé. Métabolisme de base calculé via
  Mifflin-St Jeor.
- **Journal quotidien** : poids du matin (optionnel), apports (repas ou total
  direct), activités sportives (calories brûlées).
- **Moteur adaptatif** (`src/lib/calculations.ts`) : compare le déficit
  calorique réel cumulé au déficit théorique et recalcule la date
  prévisionnelle d'atteinte de l'objectif à chaque saisie.

Export des données au format JSON disponible dans Réglages.
