# Espace Espagnol — plan

**Statut : en préparation.** Rien n'est encore codé dans l'app. Ce document sert à valider le plan avant d'écrire le code ; la base de données, elle, est déjà prête dans [`supabase/schema.sql`](../supabase/schema.sql).

## L'idée

Un quatrième espace dans Nuage, à côté d'Ambiance, Accueil et Focus, pour réviser l'espagnol. Même app, même compte, même projet Supabase. Il garde les thèmes, les sons et le timer de Nuage, et les révisions comptent dans les stats et la série de jours.

## Choix techniques

- **Chargé à la demande**, comme le bloc-notes : l'espace n'alourdit pas Nuage tant qu'on ne l'ouvre pas.
- **Hors ligne d'abord** : tout est enregistré sur l'appareil (IndexedDB). La synchro envoie et récupère les changements dès qu'on est connecté.
- **Répétition espacée avec FSRS**, l'algorithme disponible dans Anki depuis la version 23.10, via la bibliothèque open source [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs). Chaque jour, l'app propose ce que tu es sur le point d'oublier.
- **Prononciation par la voix espagnole du système** (API Web Speech) : intégrée à l'iPhone et au Mac, gratuite, sans fichier audio.
- **Réglages** (objectif du jour, tolérance aux accents, voix…) rangés avec ceux de Nuage, donc synchronisés comme eux.

## Les données

Trois tables, toutes protégées par Row Level Security : chaque compte ne voit que ses lignes.

| Table | Contenu | Une ligne = |
| --- | --- | --- |
| `es_items` | Le contenu : espagnol, français, exemple, thème, type (`vocab`, `verb`, `phrase`, `grammar`) et des infos propres au type dans `extra` | un mot, un verbe, une expression ou un point de grammaire |
| `es_progress` | La mémorisation : état FSRS (`srs`) et prochaine révision (`due_at`) | un élément × une compétence |
| `es_reviews` | L'historique, jamais modifié : note de 1 à 4, réponse tapée, temps passé | une réponse |

**Pourquoi un suivi par compétence ?** Reconnaître « la playa » à l'écrit ne veut pas dire savoir l'écrire, ni le comprendre à l'oral. Chaque compétence a donc son propre calendrier de révision :

| Compétence (`skill`) | Exercice |
| --- | --- |
| `recognize` | carte espagnol → français |
| `produce` | réponse tapée français → espagnol |
| `listen` | écoute et dictée |
| `conj:<temps>` | conjugaison d'un verbe à un temps donné, par ex. `conj:preterito` |
| `cloze` | phrase à trous de grammaire |

La liste reste ouverte : une nouvelle compétence ne demande aucun changement de base.

**Synchro**, ligne par ligne (contrairement aux réglages de Nuage, envoyés en un seul bloc) :

- l'app envoie les lignes modifiées sur l'appareil depuis le dernier envoi ;
- elle récupère les lignes arrivées sur le serveur depuis la dernière synchro (`synced_at`, posé par le serveur, avec quelques secondes de recouvrement) ;
- en cas de conflit, la modification la plus récente gagne (`updated_at`). Le serveur ignore de lui-même une écriture plus ancienne : un téléphone resté hors ligne n'écrase pas une révision faite entre-temps sur l'ordi ;
- une suppression est enregistrée (`deleted_at`) au lieu d'effacer la ligne, pour qu'elle se propage aux autres appareils.

## Importer ton vocabulaire

Le plus simple : un tableur exporté en CSV, sur le modèle de [`espagnol-modele.csv`](espagnol-modele.csv).

- Colonnes : `espagnol ; français ; exemple ; thème`. Seules les deux premières sont obligatoires.
- Séparateur `;`, `,` ou tabulation, encodage UTF-8.
- Un paquet Anki exporté en texte (« Notes in Plain Text ») marche aussi.
- Les doublons (même espagnol et même français) sont ignorés : réimporter le même fichier ne crée rien en double.

## Étapes proposées (à valider)

Chaque étape donne une version utilisable au quotidien.

1. **Fondations** : l'espace dans la barre d'outils (raccourci `4`), stockage local, synchro des trois tables, import CSV et Anki, liste des mots avec recherche, modification et suppression.
2. **Révision du jour** : cartes espagnol → français avec FSRS, quatre boutons (Raté, Difficile, Correct, Facile), nombre de nouveaux mots par jour réglable.
3. **Réponse tapée** français → espagnol : boutons á é í ó ú ü ñ ¿ ¡, tolérance aux accents réglable, correction lettre par lettre.
4. **Écoute** : bouton de prononciation sur chaque carte, exercice de dictée.
5. **Conjugaison** : un verbe, un temps et une personne, tu tapes la forme. Les verbes réguliers sont générés automatiquement ; les irréguliers demandent une liste de référence (source à choisir).
6. **Grammaire** : fiches et phrases à trous (ser/estar, por/para, subjonctif…).
7. **Stats** : temps d'espagnol et révisions dans les stats de Nuage, révisions comptées pour la série de jours, objectif du jour.
8. **Plus tard, facultatif : IA** pour générer des phrases d'exemple ou corriger des réponses libres. Une clé API ne doit jamais se trouver dans le site lui-même (tout le monde pourrait la lire) : elle passerait par une fonction serveur Supabase (Edge Function). Coût : quelques centimes par usage.

## Questions ouvertes

Tes réponses décident de l'ordre des étapes et de ce qui passe à la trappe.

- **Niveau et objectif** : débutant, intermédiaire ? Voyage, travail, conversation, examen (DELE) ?
- **Espagnol d'Espagne ou d'Amérique latine** : ça change la voix, l'usage de *vosotros* et une partie du vocabulaire.
- **Contenu existant** : listes de vocabulaire, Anki, Quizlet, manuel, verbes à travailler ?
- **Exercices** : lesquels de la liste ci-dessus, et dans quel ordre ?
- **Sens des cartes** : espagnol → français, l'inverse, ou les deux ?
- **Rythme** : combien de nouveaux mots par jour, combien de minutes ?
- **Ce qui te déplaît** dans ce que tu as déjà essayé (Duolingo, Anki…).
