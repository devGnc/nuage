# Plateforme de révisions — plan

**Statut : en cours.** La suite (lanceur, paramètres généraux, thème commun) est en place. L'outil Espagnol est devenu un cours en leçons, à la manière de Busuu, avec un cahier de cours : le moteur de leçons, la révision et le cahier fonctionnent, et le pilote couvre les deux premières unités du niveau A1. Viennent ensuite le reste de l'A1, puis les objectifs. La base de données est prête dans [`supabase/schema.sql`](../supabase/schema.sql), sans changement pour le cours.

## Décisions prises

- **Nuage devient une suite d'outils.** Un bouton grille (comme sur Office ou Infomaniak) ouvre un lanceur pour passer du Pomodoro à l'Espagnol, puis aux futurs outils de révision. En bas du lanceur : les Paramètres.
- **Une adresse par écran** (`#/pomodoro`, `#/espagnol`, `#/espagnol/lecon/a1-u1-l3`, `#/espagnol/cahier`…) : favoris, bouton retour et app installée ouvrent directement le bon endroit.
- **Changer d'outil ne recharge rien** : le timer, les ambiances et la musique continuent, un mini-timer reste visible. Chaque outil n'est chargé qu'à sa première ouverture.
- **Paramètres généraux** : Apparence, Langue, Compte & synchro, Données (la sauvegarde couvre tous les outils), Raccourcis, Aide. Puis une section par outil. Le panneau s'ouvre sur la section de l'outil en cours.
- **Un seul thème pour toute la suite**, réglé dans Apparence et appliqué par la suite elle-même : les outils n'ont aucune couleur à eux, ils ne peuvent donc pas diverger. Le Pomodoro garde un fond par mode (Accueil, Focus, Ambiance). Les outils chargés de texte posent leur contenu sur des panneaux translucides lisibles sur n'importe quel fond.
- **Un cours, pas des flashcards.** Tout le contenu est écrit pour Nuage et livré avec l'app : rien à importer. Les imports (Anki, CSV, Markdown) de la première version ont été retirés.
- **Accès libre, ordre conseillé** : toutes les leçons sont ouvertes, le cours met en avant la prochaine leçon dans l'ordre.
- **Écoute seulement, pour l'instant** : la voix espagnole de l'appareil lit les mots, les dialogues et les dictées. Pas de micro.
- **Espagnol d'Espagne**, avec le mot ou l'usage d'Amérique latine indiqué quand il diffère.
- **Pas de calendrier imposé** : un plan par objectifs que tu personnalises (plus bas), avec de la marge pour les jours sans révision.
- **Programme complet** : toutes les notions du Plan curricular de l'Instituto Cervantes de A1 à B1, plus une sélection B2 pour le B1+, sans en écarter selon leur fréquence aux examens.

## Le cours

**Niveau → unité → leçon → étapes.** Une unité a un thème et un objectif de communication (« saluer et se présenter »), son lexique, ses dialogues et ses fiches de grammaire. Elle compte cinq ou six leçons d'une dizaine de minutes : vocabulaire, dialogue, grammaire, pratique, et un bilan qui fait tout réutiliser.

**Une leçon** enchaîne des écrans :
- **Mot nouveau** : l'espagnol (avec l'article pour les noms), la prononciation, la traduction, une phrase d'exemple, une remarque d'usage et la variante d'Amérique latine.
- **Dialogue** : des bulles par personnage, chaque réplique se lit d'un clic, « Tout écouter » enchaîne deux voix, traduction à la demande.
- **Fiche de cours** : la règle, avec tableaux et pièges du francophone. On la retrouve ensuite dans le cahier.
- **Exercices** : choix multiple, écoute puis choix, associer, texte à trous (avec ou sans mots proposés), mots à remettre dans l'ordre, réponse écrite, dictée, vrai ou faux sur un dialogue, et une production guidée comparée à un modèle avec une liste de points à vérifier.

**Correction.** Majuscules, ponctuation et espaces sont ignorés. Un accent oublié ou une lettre de travers sur un mot long compte comme juste mais l'orthographe exacte s'affiche (réglable). Le ñ n'est pas un accent : *ano* n'est pas *año*. Les touches á é í ó ú ü ñ ¿ ¡ sont sous chaque champ.

**Erreurs.** Un exercice raté revient une fois en fin de leçon. Le score de la leçon ne compte que le premier essai ; le bilan affiche le score, la durée et les mots à revoir. Pour associer, une seule erreur reste une réussite.

## La révision

À la fin d'une leçon, ses mots entrent en révision (FSRS, 90 % de réussite visée, planifié en jours) : un mot raté revient le lendemain, un mot su dans trois jours, puis de plus en plus loin. Chaque mot revient sous une forme de plus en plus exigeante : le reconnaître, l'entendre, le retrouver parmi d'autres, puis l'écrire. Un oubli le fait redescendre de deux crans. Une séance compte 10 à 30 mots (réglable) ; un mot raté revient une deuxième fois dans la séance, mais seule la première réponse compte pour le calendrier. Quand rien n'est dû, on peut réviser les mots les plus fragiles.

## Le cahier

Tout ce que le cours explique, à relire quand on veut : les fiches de grammaire par unité (avec les leçons où elles apparaissent), le lexique par unité (une coche marque les mots déjà vus en leçon) et les dialogues. Une recherche couvre les trois, sans tenir compte des accents.

## Le programme

Bâti sur le Plan curricular de l'Instituto Cervantes. Le découpage de l'A1 ci-dessous est provisoire ; A2, B1 et B1+ seront détaillés au moment de les écrire.

| Unité A1 | Communication | Grammaire |
| --- | --- | --- |
| 1. ¡Hola! ✅ | saluer, se présenter, nationalité, âge, numéro | pronoms sujets, SER, nombres 0–20, tú et usted |
| 2. Mi familia ✅ | présenter sa famille, décrire quelqu'un | articles, genre et pluriel, TENER, possessifs, accord des adjectifs |
| 3. Mi casa, mi barrio | décrire son logement et son quartier | HAY et ESTAR, prépositions de lieu, nombres jusqu'à 100 |
| 4. Mi día | raconter sa journée, dire l'heure | présent régulier, verbes pronominaux, fréquence |
| 5. ¿Qué te gusta? | goûts, loisirs, commander au café | GUSTAR et ENCANTAR, *también* / *tampoco* |
| 6. De compras | acheter, demander un prix, vêtements et couleurs | démonstratifs, QUERER et PREFERIR, nombres au-delà de 100 |
| 7. Por la ciudad | demander et indiquer un chemin, transports | IR, impératif de politesse, *a* / *en* |
| 8. Planes | proposer, accepter, refuser, dates, météo | IR A + infinitif, verbes à diphtongue |
| 9. Bilan A1 | tout réutiliser | révision des notions A1 |

## Les objectifs (à venir)

L'app ne fixe ni date ni programme du jour. Tu choisis des objectifs, un rythme, et elle propose quoi faire à partir de là.

**Un objectif** = une partie du cours + ce que « réussi » veut dire, par exemple « terminer l'A2 » (toutes les leçons faites) ou « vocabulaire A1 solide » (90 % des mots maîtrisés). « Maîtrisé » = réussi à une révision espacée d'au moins 21 jours. Une date cible est facultative.

**Le rythme**, réglable : un temps par jour ou un nombre de leçons par semaine. L'accueil du cours propose alors les révisions dues puis la leçon suivante.

**Projection, pas planning.** Chaque objectif montre sa progression et une estimation : « au rythme des deux dernières semaines, objectif atteint vers mi-mai ». Avec une date cible, l'app indique le rythme qu'il faudrait pour la tenir, sans jamais l'imposer.

**Les imprévus sont prévus :**
- Après des jours sans réviser, les révisions en retard sont réparties sur plusieurs séances au lieu d'un mur de mots.
- Un mode pause (vacances, partiels) suspend les nouvelles leçons ; la projection se recalcule toute seule.
- FSRS tient compte du temps réellement écoulé : un mot revu en retard est simplement replanifié.

**Mesurer le niveau.** L'app ne certifie rien. À la fin d'un niveau, un test mélange des questions sur tout ce qui a été vu, à faire quand tu veux.

## Un moteur commun, plusieurs matières

Le moteur (répétition espacée, réponses, synchro, stats) est construit une seule fois ; le format de cours (unités, leçons, exercices, cahier) est réutilisable. L'espagnol y ajoute ses spécificités : touches spéciales, voix espagnole, variantes d'Amérique latine. Un futur outil de révision réutilise tout le reste.

## Écrire le contenu

Le cours vit dans [`src/course/es`](../src/course/es), une unité par fichier (`a1-u1.ts`, `a1-u2.ts`…), écrit avec les petites aides de [`src/course/helpers.ts`](../src/course/helpers.ts). Règles :
- **Identifiants stables** : un mot, une leçon, une fiche gardent leur identifiant pour toujours, la progression y est attachée. Un nouveau contenu prend un nouvel identifiant.
- **La bonne réponse en premier** dans les choix : l'ordre est mélangé à l'affichage.
- Chaque exercice indique les mots qu'il travaille : une erreur les fait revenir plus tôt en révision.
- Uniquement du contenu écrit pour Nuage, sans information personnelle : le dépôt est public.

`npm run check:course` (lancé aussi par `npm run build`) vérifie le contenu : identifiants uniques, renvois vers des mots, fiches et dialogues existants, réponses présentes parmi les options, trous et réponses en même nombre, ¿ ? et ¡ ! appariés, mots jamais présentés. Le build échoue s'il trouve une erreur.

## Les données

Trois tables communes à toutes les matières (colonne `subject`, `es` pour l'espagnol), protégées par Row Level Security : chaque compte ne voit que ses lignes.

| Table | Une ligne = |
| --- | --- |
| `study_items` | un élément : un mot du cours (`nuage:es:w:<mot>`) ou une leçon (`nuage:es:l:<leçon>`), créé quand la leçon est terminée |
| `study_progress` | un élément × une compétence (`recognize` pour les mots, `lesson` pour les leçons), avec l'état FSRS et la prochaine révision |
| `study_reviews` | une réponse : note de 1 à 4, réponse donnée, temps passé ; pour une leçon, le score ; jamais modifiée |

Le contenu lui-même n'est pas dans la base : il est livré avec l'app, la base ne garde que ta progression.

**Synchro**, ligne par ligne et hors ligne d'abord : l'app envoie ce qui a changé sur l'appareil et récupère ce qui est arrivé sur le serveur depuis la dernière fois (`synced_at`, posé par le serveur). En cas de conflit, la modification la plus récente gagne ; le serveur ignore de lui-même une écriture plus ancienne.

## Étapes

1. **La suite** ✅ : lanceur, adresse par outil, paramètres généraux, thème commun.
2. **Le moteur de révision et la synchro** ✅.
3. **Le cours pilote** ✅ : moteur de leçons, révision, cahier, unités 1 et 2 de l'A1.
4. **Le reste de l'A1**, unité par unité.
5. **Les objectifs** : création, rythme, projection, mode pause.
6. **A2, puis B1 et B1+.**
7. **Les stats communes** : temps par outil, leçons, révisions, progression des objectifs.
8. **Plus tard, facultatif** : l'oral au micro ; la correction de l'écrit libre par IA, via une fonction serveur Supabase (une clé API ne doit jamais être dans le site).

## Questions ouvertes

- Fond de l'outil Espagnol : pour l'instant celui du mode Focus du Pomodoro. Le garder, ou lui donner un fond à lui dans Apparence ?
- Série de jours : la garder avec des jours de repos autorisés, ou afficher plutôt les jours actifs par semaine ?
