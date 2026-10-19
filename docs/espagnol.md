# Plateforme de révisions — plan

**Statut : en préparation.** Rien n'est encore codé dans l'app. Ce document rassemble les décisions prises avant d'écrire le code ; la base de données, elle, est prête dans [`supabase/schema.sql`](../supabase/schema.sql).

## Décisions prises

- **Nuage devient une suite d'outils.** Un bouton grille (comme sur Office ou Infomaniak) ouvre un lanceur pour passer du Pomodoro à l'Espagnol, puis aux futurs outils de révision. En bas du lanceur : les Paramètres.
- **Une adresse par outil** (`#/pomodoro`, `#/espagnol`) : favoris, bouton retour et app installée ouvrent directement le bon outil.
- **Changer d'outil ne recharge rien** : le timer, les ambiances et la musique continuent, un mini-timer reste visible. Chaque outil n'est chargé qu'à sa première ouverture.
- **Paramètres généraux** : Apparence, Langue, Compte & synchro, Données (la sauvegarde couvre tous les outils), Raccourcis, Aide. Puis une section par outil (Pomodoro : timer, horloge, citations ; Espagnol : révisions, exercices, voix, objectifs). Le panneau s'ouvre sur la section de l'outil en cours.
- **Un seul thème pour toute la suite**, réglé dans Apparence et appliqué par la suite elle-même : les outils n'ont aucune couleur à eux, ils ne peuvent donc pas diverger. Le Pomodoro garde un fond par mode (Accueil, Focus, Ambiance). Les outils chargés de texte posent leur contenu sur des panneaux translucides lisibles sur n'importe quel fond.
- **Pas de calendrier imposé** : un plan de révisions par objectifs que tu personnalises (ci-dessous).
- **Espagnol d'Espagne**, avec le mot d'Amérique latine indiqué quand il diffère.

## Le plan de révisions par objectifs

L'app ne fixe ni date ni programme du jour. Tu choisis des objectifs, un rythme, et elle compose chaque séance à partir de là.

**Un objectif** = un ensemble de contenus + ce que « réussi » veut dire. Exemples :

| Objectif | Contenu | Réussi quand |
| --- | --- | --- |
| B1+ grammaire et conjugaison | toutes les notions du référentiel A1 → B1, plus les notions B2 choisies | chaque notion est maîtrisée |
| Vocabulaire fréquent | les 3 000 premiers mots du deck Top 5000 (plage réglable) | 90 % des mots maîtrisés |
| Espagnol des affaires (EDHEC) | ton kit de vocabulaire business | tout maîtrisé |

« Maîtrisé » = réussi à une révision espacée d'au moins 21 jours (le seuil qu'Anki appelle « carte mature »). Une date cible est facultative.

**Le rythme**, réglable : un temps par jour (par exemple 45 min) ou un nombre de nouveautés par jour. Chaque séance commence par les révisions dues, puis ajoute des nouveautés tirées des objectifs actifs, dans l'ordre de priorité que tu fixes.

**Projection, pas planning.** L'écran Objectifs montre la progression de chacun (maîtrisé, en cours, pas encore vu) et une estimation : « au rythme des deux dernières semaines, objectif atteint vers mi-mai ». Si tu as mis une date cible, l'app indique le rythme qu'il faudrait pour la tenir, sans jamais l'imposer.

**Les imprévus sont prévus :**
- Après des jours sans réviser, les révisions en retard sont étalées (plafond par jour) et les nouveautés suspendues jusqu'au retour à la normale, au lieu d'un mur de cartes.
- Un mode pause (vacances, partiels) coupe les nouveautés ; la projection se recalcule toute seule.
- L'algorithme FSRS tient compte du temps réellement écoulé : une carte revue en retard est simplement replanifiée.

**Mesurer le niveau.** L'app ne certifie rien. Quand un bloc d'objectifs est terminé, elle propose un test de niveau (questions mélangées sur tout ce qui a été vu), que tu fais quand tu veux.

## Un moteur commun, plusieurs matières

Le moteur (cartes, répétition espacée, exercices, import, objectifs, stats) est construit une seule fois. L'espagnol est une matière qui y ajoute ses spécificités : conjugaison, touches á é í ó ú ü ñ ¿ ¡, voix espagnole du système. Un futur outil de révision réutilise tout le reste.

## Les contenus

**Contenu de base, dans ce dépôt (public).** Uniquement du contenu écrit pour Nuage : le référentiel A1 → B1+ construit sur le Plan curricular de l'Instituto Cervantes (la description officielle des niveaux), les fiches de grammaire avec phrases à trous, les phrases d'exemple, le moteur de conjugaison. Identifiants stables (`nuage:…`) pour que les mises à jour se propagent sans doublon.

**Contenus personnels, importés dans ton compte (privés).** Ils ne vont jamais dans le dépôt public :
- le deck Anki *Essential Spanish Vocabulary Top 5000* : 5 000 mots classés par fréquence, avec catégorie grammaticale, traduction anglaise, image et audio, mais sans français ni phrase d'exemple, et de licence inconnue ;
- le kit d'espagnol des affaires du cours EDHEC (tiré du fascicule du cours, avec des informations personnelles) ;
- les notes de grammaire élémentaire.

**Format d'import.** Paquet Anki (`.apkg`), CSV sur le modèle de [`espagnol-modele.csv`](espagnol-modele.csv) (colonnes `espagnol ; français ; exemple ; thème`, séparateur `;`, `,` ou tabulation, UTF-8) ou Markdown. Réimporter le même fichier ne crée pas de doublon.

## Les données

Trois tables communes à toutes les matières (colonne `subject`, `es` pour l'espagnol), protégées par Row Level Security : chaque compte ne voit que ses lignes.

| Table | Une ligne = |
| --- | --- |
| `study_items` | un élément : mot, verbe, expression, fiche de grammaire… (`front` / `back`, exemple, thème, origine, infos propres au type dans `extra`) |
| `study_progress` | un élément × une compétence, avec l'état FSRS et la prochaine révision |
| `study_reviews` | une réponse : note de 1 à 4, réponse tapée, temps passé ; jamais modifiée |

Les compétences (`skill`) : `recognize` (espagnol → français), `produce` (réponse tapée), `listen` (écoute, dictée), `conj:<temps>` (conjugaison), `cloze` (phrase à trous). La liste reste ouverte.

Les objectifs et le rythme sont des réglages : ils sont rangés avec les paramètres et synchronisés comme eux.

**Synchro**, ligne par ligne et hors ligne d'abord : l'app envoie ce qui a changé sur l'appareil et récupère ce qui est arrivé sur le serveur depuis la dernière fois (`synced_at`, posé par le serveur). En cas de conflit, la modification la plus récente gagne ; le serveur ignore de lui-même une écriture plus ancienne. Une suppression est enregistrée (`deleted_at`) pour se propager aux autres appareils.

## Étapes

1. **La suite** : lanceur, adresse par outil, paramètres généraux, thème commun. Le Pomodoro est réorganisé sans rien perdre.
2. **Le moteur de révision et l'outil Espagnol** : import (Anki, CSV, Markdown), liste des éléments, séance du jour avec FSRS.
3. **Les objectifs** : création, priorités, projection, mode pause.
4. **Les exercices** : réponse tapée, écoute et dictée, conjugaison, phrases à trous.
5. **Les stats communes** : temps par outil, révisions, progression des objectifs.
6. **Plus tard, facultatif** : correction de l'écrit et de l'oral libres par IA, via une fonction serveur Supabase (une clé API ne doit jamais être dans le site).

En parallèle : le référentiel et le contenu de base, bloc par bloc.

## Questions ouvertes

- Fond de l'outil Espagnol : celui du mode Focus du Pomodoro, ou un fond à lui dans Apparence ?
- Deck Top 5000 : ajouter une traduction française et une phrase d'exemple par mot (l'anglais reste en complément) ? Garder les images ?
- Série de jours : la garder avec des jours de repos autorisés, ou afficher plutôt les jours actifs par semaine ?
