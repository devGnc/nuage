# ☁️ Nuage

Suite d'outils de travail gratuite qui tourne dans le navigateur : un Pomodoro complet (timer, tâches, ambiances sonores, musique, thèmes, statistiques, bloc-notes) et des outils de révision, à commencer par l'espagnol (voir le [plan](docs/espagnol.md)). Aucun compte requis, aucune pub, aucun traçage.

**App en ligne : https://devgnc.github.io/nuage/**

## Fonctionnalités

**Une suite d'outils**
- Le bouton grille en haut à gauche (ou la touche G) ouvre le lanceur : Pomodoro, Espagnol, et les prochains outils.
- Chaque outil a son adresse (`#/pomodoro`, `#/espagnol`) : favoris, bouton retour et raccourcis de l'app installée ouvrent directement le bon outil.
- Changer d'outil ne recharge rien : le timer, les ambiances et la musique continuent, et le timer reste visible en haut à droite.
- Paramètres communs (apparence, préférences, compte, données, aide) et paramètres propres à chaque outil. La couleur d'accent et les fonds sont les mêmes partout.

**Espagnol : un cours en leçons, de A1 à B1+**
- Tout le contenu est dans l'app, écrit pour Nuage : rien à importer. Pour l'instant, les deux premières unités du niveau A1 (saluer et se présenter, la famille) ; les suivantes arrivent au fil des mises à jour.
- Chaque leçon enchaîne les mots nouveaux (avec prononciation, exemple et variante d'Amérique latine), un dialogue à écouter, une fiche de grammaire, puis des exercices : choix, associations, phrases à trous, mots à remettre dans l'ordre, réponse écrite, dictée, vrai ou faux, petite production guidée.
- Toutes les leçons sont ouvertes ; le cours en conseille une. Un exercice raté revient en fin de leçon, et le bilan montre les mots à revoir.
- Révision : les mots vus en leçon reviennent au moment où on allait les oublier (FSRS), d'abord à reconnaître, puis à l'oreille, puis à retrouver, puis à écrire.
- Cahier : toutes les fiches de grammaire, le lexique par unité et les dialogues, avec une recherche.
- Accents tolérés (et signalés) si tu le souhaites, touches á é í ó ú ü ñ ¿ ¡ sous chaque champ, voix espagnole de l'appareil.
- Progression synchronisée entre appareils avec Supabase et incluse dans la sauvegarde JSON.

**Pomodoro : trois modes**, chacun avec son propre fond :
- **Accueil** : horloge, salutations qui changent selon l'heure et le jour, citation.
- **Focus** : tâche en cours, timer, compteur de sessions, contrôles.
- **Ambiance** : fond plein écran avec un mini-timer.

**Timer**
- 5 modes : Pomodoro, compte à rebours, chronomètre, Animedoro, 52/17. Toutes les durées sont réglables.
- Mode « durée des tâches » : le focus dure le temps estimé restant de la tâche en cours.
- 6 styles d'affichage (classique, flip clock, barre, jauge, matrice de points, camembert), 12 polices, 3 tailles.
- Enchaînement automatique, 8 sons d'alerte, notifications, temps affiché dans l'onglet, confettis.
- Fenêtre flottante (Picture-in-Picture) dans Chrome et Edge, avec un repli vidéo pour Safari.
- Fonctionne même onglet en arrière-plan : le timer est cadencé par un Web Worker.

**Tâches**
- Illimitées, réordonnables par glisser-déposer. La première s'affiche au-dessus du timer.
- Sous-tâches, emoji, couleur, durée estimée, temps de focus cumulé, heure de fin estimée.

**Sons et musique**
- 36 ambiances (pluie, orage, océan, café, bibliothèque, feu de bois, train, bruits blanc/rose/brun, sons binauraux…), à superposer sans limite avec un volume par son.
- Mixes suggérés et mixes enregistrés.
- Tous les sons sont **synthétisés en direct** par le navigateur (Web Audio) : aucun fichier, aucun droit d'auteur, ça marche hors ligne.
- Musique : radios et playlists prêtes à l'emploi, ou n'importe quel lien YouTube, Spotify, SoundCloud, Apple Music ou Deezer, avec favoris.

**Thèmes**
- 77 fonds : dégradés, couleurs unies, motifs abstraits, 11 fonds animés (nuages, ciel étoilé, aurore boréale, neige, pluie, lucioles…) et 27 photos de paysages.
- Image importée, lien d'image ou vidéo YouTube en fond. Réglages d'assombrissement et de flou par mode. Thème aléatoire.

**Statistiques**
- Temps de focus, sessions, tâches terminées, pauses, série de jours (les week-ends peuvent être épargnés), Focus Score sur 100.
- Périodes : aujourd'hui, 7 jours, 30 jours, 3 mois, 6 mois, 1 an, tout. Graphique et calendrier des 12 derniers mois.

**Et aussi**
- Bloc-notes riche (titres, listes, cases à cocher, citations…) avec plusieurs notes et export Markdown.
- 60 citations (FR/EN) et tes propres citations.
- Mode épuré, anti-veille de l'écran, plein écran, raccourcis clavier, couleur d'accent, interface en français ou en anglais.
- Installable comme une app (PWA) et utilisable hors ligne.
- Sauvegarde et restauration en JSON, intégration possible dans Notion.
- Synchronisation entre appareils avec ton propre projet Supabase gratuit (facultatif).

### Raccourcis clavier

| Touche | Action | Où |
| --- | --- | --- |
| G | Changer d'outil | partout |
| M | Sons et musique | partout |
| P | Fenêtre flottante du timer | partout |
| F | Plein écran | partout |
| , | Paramètres | partout |
| Échap | Fermer | partout |
| Espace | Démarrer / pause | Pomodoro |
| R | Réinitialiser | Pomodoro |
| S | Segment suivant | Pomodoro |
| 1 · 2 · 3 | Accueil / Focus / Ambiance | Pomodoro |
| T · N | Tâches / Bloc-notes | Pomodoro |
| Entrée | Vérifier, puis continuer | Espagnol |
| 1 · 2 · 3 · 4 | Choisir une réponse | Espagnol |

## Développement

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # vérifie les types et le contenu du cours, puis génère dist/
npm run check:course   # vérifie seulement le contenu du cours
```

Stack : Vite, React, TypeScript, Zustand (état persistant dans localStorage et IndexedDB), Tiptap (bloc-notes), dnd-kit (glisser-déposer), Supabase (synchro facultative), ts-fsrs (répétition espacée), marked (fiches du cahier).

## Déploiement sur GitHub Pages

Le workflow `.github/workflows/deploy.yml` construit et publie l'app à chaque push sur `main`.

À faire une seule fois : **Settings → Pages → Build and deployment → Source : GitHub Actions**.

## Synchronisation avec Supabase (facultatif)

Sans Supabase, tout est enregistré dans le navigateur. Pour retrouver tes réglages, tâches, notes et stats sur plusieurs appareils :

1. Crée un projet gratuit sur [supabase.com](https://supabase.com). Le même projet peut servir à d'autres outils : son nom n'a pas besoin d'être « Nuage ».
2. Dans **SQL Editor**, colle le contenu de [`supabase/schema.sql`](supabase/schema.sql) et exécute-le. Il crée les tables du Pomodoro et celles des futurs outils de révision ([plan](docs/espagnol.md)), toutes protégées par Row Level Security : chaque utilisateur ne voit que ses propres données. Le script peut être relancé sans risque.
3. Dans **Authentication → URL Configuration**, mets `https://devgnc.github.io/nuage/` comme **Site URL** et ajoute-la aux **Redirect URLs**.
4. Récupère l'URL du projet et la clé publique (**publishable** ou **anon**) via le bouton **Connect** du projet, ou dans **Settings → API Keys**. Cette clé est faite pour être exposée dans une app web : ce sont les règles RLS qui protègent les données. N'utilise jamais la clé secrète.
5. Deux options :
   - **Dans l'app** : Paramètres → Compte & synchro → colle l'URL et la clé.
   - **Au déploiement** : dans le repo, **Settings → Secrets and variables → Actions → Variables**, crée `SUPABASE_URL` et `SUPABASE_ANON_KEY`, puis relance le workflow.

Pour la connexion Google, active le fournisseur Google dans **Authentication → Providers** (il faut un identifiant OAuth Google Cloud). L'email + mot de passe et le lien magique marchent sans configuration supplémentaire.

Bon à savoir : sur l'offre gratuite, Supabase met en pause les projets inactifs pendant une semaine.

## Crédits

- Photos : [Unsplash](https://unsplash.com), servies par [Lorem Picsum](https://picsum.photos). Auteurs : Allyson Souza, Paul Jarvis, Jerry Adney, Go Wild, Jeffrey Kam, Margaret Barley, Nicholas Swanson, Daniel Genser, Isaak Dury, May Pamintuan, Vadim Sherbakov, Matteo Minelli, Dillon McIntosh, Linh Nguyen, Tim de Groot, Kelly Sikkema, Orlova Maria, Paul E. Harrer, Anders Jildén, Aleksandra Boguslawska, Jennifer Langley, Greg Shield, Billy Lam.
- Icônes : [Lucide](https://lucide.dev).
- Sons : synthèse procédurale maison, aucun enregistrement.
