# Notre Carnet

PWA privée à deux : roue des dates, question du jour, watchlist films/séries, compteur de jours + stats perso. React + Vite, données sur Supabase (sync en temps réel), installable comme une app.

## Démarrage local

```bash
npm install
cp .env.example .env      # puis renseigne VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm run dev
```

## Base de données

Le fichier `supabase.sql` contient la migration à coller dans Supabase (SQL Editor). Elle crée une seule table `couple_data` en clé/valeur (une ligne par section de l'app) avec le realtime activé.

## Build

```bash
npm run build
npm run preview   # pour tester le build en local
```

Voir les instructions complètes de déploiement (Supabase + Vercel) fournies par Claude.
