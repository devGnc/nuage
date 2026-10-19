import { choice, cloze, dialogue, dictation, listen, match, note, order, truefalse, type, word, words, write } from '../helpers'
import type { Unit } from '../types'

/** A1 · Unité 1 — Saluer, se présenter, dire son âge. */
export const a1u1: Unit = {
  id: 'a1-u1',
  level: 'A1',
  number: 1,
  title: 'Saluer et se présenter',
  titleEs: '¡Hola!',
  goal: 'Saluer quelqu’un, te présenter (nom, origine, ville, âge, études) et poser les mêmes questions.',

  words: [
    // saluer
    word('hola', '¡Hola!', 'Salut ! / Bonjour !', { pos: 'expr', example: ['¡Hola, Ana! ¿Qué tal?', 'Salut, Ana ! Ça va ?'] }),
    word('buenos-dias', 'Buenos días', 'Bonjour (le matin)', { pos: 'expr', example: ['Buenos días, señora García.', 'Bonjour, madame García.'] }),
    word('buenas-tardes', 'Buenas tardes', 'Bonjour (l’après-midi)', { pos: 'expr', note: 'De midi jusqu’à la tombée de la nuit, vers 20 h en Espagne.' }),
    word('buenas-noches', 'Buenas noches', 'Bonsoir / Bonne nuit', { pos: 'expr', note: 'Le soir, en arrivant comme en partant.' }),
    word('que-tal', '¿Qué tal?', 'Ça va ?', { pos: 'expr', example: ['Hola, Pablo, ¿qué tal?', 'Salut, Pablo, ça va ?'] }),
    word('como-estas', '¿Cómo estás?', 'Comment vas-tu ?', { pos: 'expr' }),
    word('como-esta-usted', '¿Cómo está usted?', 'Comment allez-vous ?', { pos: 'expr', note: 'Avec usted, le vouvoiement : le verbe est à la 3e personne.' }),
    word('bien', 'bien', 'bien', { pos: 'adv', example: ['Estoy bien, gracias.', 'Je vais bien, merci.'] }),
    word('muy-bien', 'muy bien', 'très bien', { pos: 'expr' }),
    word('mal', 'mal', 'mal', { pos: 'adv' }),
    word('regular', 'regular', 'comme ci, comme ça', { pos: 'adv', note: 'Mot à mot « moyen ».' }),
    word('y-tu', '¿Y tú?', 'Et toi ?', { pos: 'expr' }),
    word('y-usted', '¿Y usted?', 'Et vous ?', { pos: 'expr' }),
    word('gracias', 'gracias', 'merci', { pos: 'expr', example: ['Muchas gracias.', 'Merci beaucoup.'] }),
    word('adios', 'adiós', 'au revoir', { pos: 'expr' }),
    word('hasta-luego', 'hasta luego', 'à plus tard, à tout à l’heure', { pos: 'expr' }),
    word('hasta-manana', 'hasta mañana', 'à demain', { pos: 'expr' }),
    word('senor', 'el señor', 'monsieur', { pos: 'nm', note: 'Devant un nom de famille : el señor García (« monsieur García »).' }),
    word('senora', 'la señora', 'madame', { pos: 'nf' }),

    // se présenter
    word('me-llamo', 'me llamo…', 'je m’appelle…', { pos: 'expr', example: ['Me llamo Lucía.', 'Je m’appelle Lucía.'] }),
    word('como-te-llamas', '¿Cómo te llamas?', 'Comment t’appelles-tu ?', { pos: 'expr' }),
    word('como-se-llama', '¿Cómo se llama usted?', 'Comment vous appelez-vous ?', { pos: 'expr' }),
    word('encantado', 'encantado / encantada', 'enchanté / enchantée', { pos: 'adj', note: 'Un homme dit encantado, une femme encantada.' }),
    word('mucho-gusto', 'mucho gusto', 'enchanté (ravi de te connaître)', { pos: 'expr', note: 'Invariable : homme ou femme.' }),
    word('soy', 'soy…', 'je suis…', { pos: 'v', example: ['Soy estudiante.', 'Je suis étudiant.'] }),
    word('de-donde-eres', '¿De dónde eres?', 'D’où es-tu ?', { pos: 'expr' }),
    word('soy-de', 'soy de…', 'je viens de…, je suis de…', { pos: 'expr', example: ['Soy de Lyon.', 'Je viens de Lyon.'] }),
    word('vivo-en', 'vivo en…', 'j’habite à…', { pos: 'expr', example: ['Vivo en Lille.', 'J’habite à Lille.'] }),
    word('donde-vives', '¿Dónde vives?', 'Où habites-tu ?', { pos: 'expr' }),
    word('pero', 'pero', 'mais', { pos: 'conj', example: ['Soy de Sevilla, pero vivo en Madrid.', 'Je viens de Séville, mais j’habite à Madrid.'] }),
    word('y', 'y', 'et', { pos: 'conj' }),
    word('bienvenido', 'bienvenido / bienvenida', 'bienvenu / bienvenue', { pos: 'adj' }),
    word('estudiante', 'el / la estudiante', 'l’étudiant / l’étudiante', { pos: 'nmf' }),
    word('profesor', 'el profesor / la profesora', 'le professeur / la professeure', { pos: 'nm' }),
    word('medico', 'el médico / la médica', 'le médecin / la médecin', { pos: 'nm' }),

    // nationalités
    word('frances', 'francés / francesa', 'français / française', { pos: 'adj', note: 'L’accent disparaît au féminin : francés → francesa.' }),
    word('espanol', 'español / española', 'espagnol / espagnole', { pos: 'adj' }),
    word('ingles', 'inglés / inglesa', 'anglais / anglaise', { pos: 'adj' }),
    word('aleman', 'alemán / alemana', 'allemand / allemande', { pos: 'adj' }),
    word('italiano', 'italiano / italiana', 'italien / italienne', { pos: 'adj' }),
    word('mexicano', 'mexicano / mexicana', 'mexicain / mexicaine', { pos: 'adj' }),

    // nombres et âge
    word('n0', 'cero', 'zéro', { pos: 'num' }),
    word('n1', 'uno', 'un', { pos: 'num', note: 'Devant un nom : un chico (un garçon), una chica (une fille).' }),
    word('n2', 'dos', 'deux', { pos: 'num' }),
    word('n3', 'tres', 'trois', { pos: 'num' }),
    word('n4', 'cuatro', 'quatre', { pos: 'num' }),
    word('n5', 'cinco', 'cinq', { pos: 'num' }),
    word('n6', 'seis', 'six', { pos: 'num' }),
    word('n7', 'siete', 'sept', { pos: 'num' }),
    word('n8', 'ocho', 'huit', { pos: 'num' }),
    word('n9', 'nueve', 'neuf', { pos: 'num' }),
    word('n10', 'diez', 'dix', { pos: 'num' }),
    word('n11', 'once', 'onze', { pos: 'num' }),
    word('n12', 'doce', 'douze', { pos: 'num' }),
    word('n13', 'trece', 'treize', { pos: 'num' }),
    word('n14', 'catorce', 'quatorze', { pos: 'num' }),
    word('n15', 'quince', 'quinze', { pos: 'num' }),
    word('n16', 'dieciséis', 'seize', { pos: 'num', note: 'En un seul mot, avec un accent sur le é.' }),
    word('n17', 'diecisiete', 'dix-sept', { pos: 'num' }),
    word('n18', 'dieciocho', 'dix-huit', { pos: 'num' }),
    word('n19', 'diecinueve', 'dix-neuf', { pos: 'num' }),
    word('n20', 'veinte', 'vingt', { pos: 'num' }),
    word('cuantos-anos', '¿Cuántos años tienes?', 'Quel âge as-tu ?', { pos: 'expr', note: 'Mot à mot : « combien d’années as-tu ? ».' }),
    word('tengo-anos', 'Tengo … años.', 'J’ai … ans.', { pos: 'expr', example: ['Tengo diecinueve años.', 'J’ai dix-neuf ans.'] }),
    word('numero-telefono', 'el número de teléfono', 'le numéro de téléphone', { pos: 'nm' }),
  ],

  dialogues: [
    {
      id: 'a1-u1-d1',
      title: 'Dans le couloir de la fac',
      context: 'Ana croise Pablo, puis Juan salue sa professeure, la señora García.',
      lines: [
        { who: 'Ana', es: '¡Hola, Pablo! ¿Qué tal?', fr: 'Salut, Pablo ! Ça va ?' },
        { who: 'Pablo', es: '¡Hola, Ana! Muy bien, ¿y tú?', fr: 'Salut, Ana ! Très bien, et toi ?' },
        { who: 'Ana', es: 'Bien, gracias.', fr: 'Bien, merci.' },
        { who: 'Pablo', es: 'Bueno, hasta luego.', fr: 'Bon, à plus tard.' },
        { who: 'Ana', es: '¡Adiós! Hasta mañana.', fr: 'Au revoir ! À demain.' },
        { who: 'Juan', es: 'Buenos días, señora García. ¿Cómo está usted?', fr: 'Bonjour, madame García. Comment allez-vous ?' },
        { who: 'Sra. García', es: 'Muy bien, gracias, Juan. ¿Y usted?', fr: 'Très bien, merci, Juan. Et vous ?' },
        { who: 'Juan', es: 'Regular… Hoy tengo un examen.', fr: 'Comme ci, comme ça… Aujourd’hui, j’ai un examen.' },
      ],
    },
    {
      id: 'a1-u1-d2',
      title: 'Un nouveau camarade',
      context: 'Premier jour de cours à Madrid : Lucía fait la connaissance de Hugo, étudiant Erasmus.',
      lines: [
        { who: 'Lucía', es: 'Hola, ¿cómo te llamas?', fr: 'Salut, comment tu t’appelles ?' },
        { who: 'Hugo', es: 'Me llamo Hugo. ¿Y tú?', fr: 'Je m’appelle Hugo. Et toi ?' },
        { who: 'Lucía', es: 'Yo soy Lucía. Encantada.', fr: 'Moi, c’est Lucía. Enchantée.' },
        { who: 'Hugo', es: 'Encantado. ¿De dónde eres?', fr: 'Enchanté. D’où es-tu ?' },
        { who: 'Lucía', es: 'Soy de Sevilla, pero vivo en Madrid. ¿Y tú?', fr: 'Je viens de Séville, mais j’habite à Madrid. Et toi ?' },
        { who: 'Hugo', es: 'Soy francés, de Lyon. Soy estudiante de Erasmus.', fr: 'Je suis français, de Lyon. Je suis étudiant Erasmus.' },
        { who: 'Lucía', es: '¡Qué bien! Bienvenido a Madrid.', fr: 'Super ! Bienvenue à Madrid.' },
      ],
    },
    {
      id: 'a1-u1-d3',
      title: 'Âges et numéros',
      context: 'Après le cours, Marta et Hugo échangent leurs numéros.',
      lines: [
        { who: 'Marta', es: '¿Cuántos años tienes, Hugo?', fr: 'Quel âge as-tu, Hugo ?' },
        { who: 'Hugo', es: 'Tengo diecinueve años. ¿Y tú?', fr: 'J’ai dix-neuf ans. Et toi ?' },
        { who: 'Marta', es: 'Yo tengo veinte. ¿Cuál es tu número de teléfono?', fr: 'Moi, j’en ai vingt. Quel est ton numéro de téléphone ?' },
        { who: 'Hugo', es: 'Es el seis, uno, cuatro, dos, cero, ocho, tres, uno, nueve.', fr: 'C’est le 6 1 4 2 0 8 3 1 9.' },
        { who: 'Marta', es: 'Gracias. ¡Hasta mañana!', fr: 'Merci. À demain !' },
      ],
    },
  ],

  notes: [
    {
      id: 'a1-u1-saludos',
      title: 'Saluer et prendre congé',
      summary: 'Quelle salutation selon le moment de la journée, et comment répondre.',
      body: `
**Selon le moment de la journée**

| Moment | Pour saluer | Pour partir |
| --- | --- | --- |
| Le matin (jusqu’à midi environ) | Buenos días | Adiós / Hasta luego |
| L’après-midi (jusqu’à la tombée de la nuit) | Buenas tardes | Adiós / Hasta luego |
| Le soir et la nuit | Buenas noches | Buenas noches / Hasta mañana |

*¡Hola!* marche à tout moment et s’ajoute souvent devant : *¡Hola, buenos días!*

**Demander et répondre**

- *¿Qué tal?* (ça va ?) et *¿Cómo estás?* (comment vas-tu ?) entre amis.
- *¿Cómo está usted?* (comment allez-vous ?) avec quelqu’un que tu vouvoies.
- Réponses, du mieux au pire : *muy bien* → *bien* → *regular* → *mal*. On renvoie la question avec *¿y tú?* ou *¿y usted?*

**Le point d’interrogation à l’envers**

En espagnol, une question s’ouvre par **¿** et se ferme par **?** ; une exclamation s’ouvre par **¡** et se ferme par **!** : *¿Qué tal?*, *¡Hola!*

> **Piège du francophone :** *buenas tardes* se dit dès le début de l’après-midi, pas seulement le soir.
`,
    },
    {
      id: 'a1-u1-ser',
      title: 'Les pronoms sujets et le verbe SER',
      summary: 'Conjuguer SER (être) au présent, tutoyer ou vouvoyer, dire sa nationalité et sa profession.',
      body: `
**SER (être) au présent**

| Personne | SER |
| --- | --- |
| yo (je) | soy |
| tú (tu) | eres |
| él / ella / usted (il / elle / vous) | es |
| nosotros / nosotras (nous) | somos |
| vosotros / vosotras (vous, plusieurs) | sois |
| ellos / ellas / ustedes (ils / elles / vous, plusieurs) | son |

**On omet le pronom sujet.** La terminaison du verbe suffit : *Soy francés* (je suis français). On garde le pronom pour insister : *Yo soy Lucía, ¿y tú?*

**Tutoyer ou vouvoyer**

- *tú* : un ami, un camarade, quelqu’un de ton âge. L’Espagne tutoie beaucoup.
- *usted* : une personne âgée, un professeur dans un cadre formel, un client. **Le verbe se met à la 3e personne** : *¿Usted es española?*
- Au pluriel, *vosotros* (Espagne) et *ustedes* (poli, et la seule forme en Amérique latine) : *¿Ustedes son de aquí?*

**À quoi sert SER ici**

- l’origine et la nationalité : *Soy de Lyon. Soy francés.*
- la profession ou les études : *Soy estudiante.* — **sans article** (pas *un estudiante*) ;
- l’identité : *Es Lucía.* (c’est Lucía).

**Les nationalités au féminin**

| Masculin | Féminin | Règle |
| --- | --- | --- |
| italiano | italiana | -o → -a |
| francés | francesa | consonne → + a (l’accent disparaît) |
| español | española | consonne → + a |
| alemán | alemana | consonne → + a (l’accent disparaît) |
| estadounidense | estadounidense | -e : invariable |

> **Piège du francophone :** les nationalités et les langues ne prennent **pas de majuscule** : *Soy francés*, *Hablo español*.
`,
    },
    {
      id: 'a1-u1-numeros',
      title: 'Les nombres de 0 à 20 et l’âge',
      summary: 'Compter jusqu’à 20, donner un numéro de téléphone, dire son âge avec TENER.',
      body: `
| 0 à 4 | 5 à 9 | 10 à 14 | 15 à 20 |
| --- | --- | --- | --- |
| 0 cero | 5 cinco | 10 diez | 15 quince |
| 1 uno | 6 seis | 11 once | 16 dieciséis |
| 2 dos | 7 siete | 12 doce | 17 diecisiete |
| 3 tres | 8 ocho | 13 trece | 18 dieciocho |
| 4 cuatro | 9 nueve | 14 catorce | 19 diecinueve |
| | | | 20 veinte |

- De 16 à 19 : **un seul mot** (*dieci-* + chiffre). Seul *dieciséis* porte un accent.
- *uno* devient **un** devant un nom masculin et **una** devant un nom féminin : *un año*, *una hermana*.
- Un numéro de téléphone se dit souvent chiffre par chiffre : *seis, uno, cuatro…*

**Dire son âge : avec TENER, pas avec SER**

- *¿Cuántos años tienes?* — Quel âge as-tu ?
- *Tengo diecinueve años.* — J’ai dix-neuf ans.
- *¿Cuántos años tiene usted?* — Quel âge avez-vous ?

> **Piège du francophone :** comme en français, l’âge se dit avec « avoir » (*tener*) : jamais *soy diecinueve*.
`,
    },
  ],

  lessons: [
    {
      id: 'a1-u1-l1',
      title: 'Bonjour, ça va ?',
      kind: 'vocab',
      goal: 'Saluer selon le moment de la journée, demander comment ça va et répondre.',
      steps: [
        words('hola', 'buenos-dias', 'buenas-tardes', 'buenas-noches', 'que-tal', 'como-estas', 'bien', 'muy-bien', 'regular', 'mal', 'y-tu', 'gracias'),
        match([['¡Hola!', 'Salut !'], ['gracias', 'merci'], ['muy bien', 'très bien'], ['mal', 'mal'], ['¿Y tú?', 'Et toi ?']], { words: ['hola', 'gracias', 'muy-bien', 'mal', 'y-tu'] }),
        choice('Que veut dire « Buenas noches » ?', ['Bonsoir / Bonne nuit', 'Bonjour (le matin)', 'Bonjour (l’après-midi)', 'Au revoir'], { words: ['buenas-noches'] }),
        choice('Il est 16 h et tu croises ta voisine. Que dis-tu ?', ['Buenas tardes', 'Buenos días', 'Buenas noches', 'Hasta mañana'], { words: ['buenas-tardes'], explain: 'Buenas tardes s’emploie dès midi, jusqu’à la tombée de la nuit.' }),
        listen('¿Qué tal?', ['Ça va ?', 'Et toi ?', 'Très bien', 'Merci'], { words: ['que-tal'] }),
        cloze('— ¿Qué tal? — Muy ___, gracias.', ['bien'], { options: ['bien', 'buenos', 'tal'], translation: '— Ça va ? — Très bien, merci.', words: ['muy-bien'] }),
        type('Écris en espagnol : « Comment vas-tu ? »', ['¿Cómo estás?', 'Cómo estás'], { words: ['como-estas'] }),
        order('Muy bien, gracias, ¿y tú?', 'Très bien, merci, et toi ?', { words: ['muy-bien', 'gracias', 'y-tu'] }),
        choice('Tu vas « comme ci, comme ça ». Tu réponds :', ['Regular', 'Muy bien', 'Gracias', 'Hola'], { words: ['regular'] }),
        dictation('Buenos días', 'Bonjour (le matin)', { words: ['buenos-dias'] }),
      ],
    },
    {
      id: 'a1-u1-l2',
      title: 'Au revoir et vouvoiement',
      kind: 'dialogue',
      goal: 'Prendre congé, et choisir entre tú et usted.',
      steps: [
        words('adios', 'hasta-luego', 'hasta-manana', 'senor', 'senora', 'como-esta-usted', 'y-usted'),
        dialogue('a1-u1-d1'),
        truefalse('Pablo va très bien.', true, { dialogue: 'a1-u1-d1', explain: 'Il répond « Muy bien ».' }),
        truefalse('Ana dit « à demain » en partant.', true, { dialogue: 'a1-u1-d1', explain: '« Hasta mañana » : à demain.' }),
        truefalse('Juan tutoie la señora García.', false, { dialogue: 'a1-u1-d1', explain: 'Il dit « ¿Cómo está usted? » : c’est du vouvoiement.' }),
        truefalse('Juan va très bien.', false, { dialogue: 'a1-u1-d1', explain: '« Regular » : comme ci, comme ça. Il a un examen.' }),
        note('a1-u1-saludos'),
        choice('Comment demander « Comment allez-vous ? » à ton professeur ?', ['¿Cómo está usted?', '¿Cómo estás?', '¿Qué tal, tío?', '¿Y tú?'], { words: ['como-esta-usted'] }),
        match([['adiós', 'au revoir'], ['hasta luego', 'à plus tard'], ['hasta mañana', 'à demain'], ['la señora', 'madame'], ['el señor', 'monsieur']], { words: ['adios', 'hasta-luego', 'hasta-manana', 'senora', 'senor'] }),
        listen('Hasta mañana', ['À demain', 'À plus tard', 'Au revoir', 'Bonne nuit'], { words: ['hasta-manana'] }),
        type('Écris en espagnol : « Et vous ? »', ['¿Y usted?', 'Y usted'], { words: ['y-usted'] }),
        cloze('Buenos días, ___ García. ¿Cómo está usted?', ['señora'], { options: ['señora', 'tú', 'hola'], translation: 'Bonjour, madame García. Comment allez-vous ?', words: ['senora'] }),
        dictation('Hasta luego', 'À plus tard', { words: ['hasta-luego'] }),
      ],
    },
    {
      id: 'a1-u1-l3',
      title: 'Je m’appelle…',
      kind: 'dialogue',
      goal: 'Te présenter : nom, origine, ville, études.',
      steps: [
        words('me-llamo', 'como-te-llamas', 'como-se-llama', 'encantado', 'mucho-gusto', 'soy', 'soy-de', 'de-donde-eres', 'vivo-en', 'donde-vives', 'y', 'pero', 'estudiante', 'bienvenido'),
        dialogue('a1-u1-d2'),
        truefalse('Lucía habite à Séville.', false, { dialogue: 'a1-u1-d2', explain: 'Elle vient de Séville, mais elle habite à Madrid : « Soy de Sevilla, pero vivo en Madrid ».' }),
        truefalse('Hugo est français.', true, { dialogue: 'a1-u1-d2' }),
        choice('Lucía dit « Encantada » et non « Encantado » parce que…', ['c’est une femme', 'elle tutoie Hugo', 'c’est une question', 'elle est espagnole'], { words: ['encantado'] }),
        match([['me llamo', 'je m’appelle'], ['soy de', 'je viens de'], ['vivo en', 'j’habite à'], ['pero', 'mais'], ['mucho gusto', 'enchanté']], { words: ['me-llamo', 'soy-de', 'vivo-en', 'pero', 'mucho-gusto'] }),
        cloze('— ¿Cómo te ___? — Me llamo Hugo.', ['llamas'], { options: ['llamas', 'llamo', 'llama'], translation: '— Comment tu t’appelles ? — Je m’appelle Hugo.', words: ['como-te-llamas'] }),
        cloze('Soy ___ Lyon, pero vivo ___ Lille.', ['de', 'en'], { translation: 'Je viens de Lyon, mais j’habite à Lille.', words: ['soy-de', 'vivo-en'] }),
        order('Me llamo Hugo y soy de Lyon.', 'Je m’appelle Hugo et je viens de Lyon.', { words: ['me-llamo', 'soy-de'] }),
        type('Écris en espagnol : « D’où es-tu ? »', ['¿De dónde eres?', 'De dónde eres'], { words: ['de-donde-eres'] }),
        listen('¿Dónde vives?', ['Où habites-tu ?', 'D’où es-tu ?', 'Comment t’appelles-tu ?', 'Quel âge as-tu ?'], { words: ['donde-vives'] }),
        dictation('Soy estudiante.', 'Je suis étudiant(e).', { words: ['soy', 'estudiante'] }),
      ],
    },
    {
      id: 'a1-u1-l4',
      title: 'Le verbe SER',
      kind: 'grammar',
      goal: 'Conjuguer SER au présent, vouvoyer avec usted, accorder les nationalités.',
      steps: [
        note('a1-u1-ser'),
        words('frances', 'espanol', 'ingles', 'aleman', 'italiano', 'mexicano', 'profesor', 'medico'),
        match([['yo', 'soy'], ['tú', 'eres'], ['nosotros', 'somos'], ['vosotros', 'sois'], ['ellos', 'son']], { prompt: 'Associe chaque pronom à sa forme de SER.' }),
        cloze('Tú ___ de Madrid, ¿no?', ['eres'], { options: ['eres', 'es', 'soy', 'sois'], translation: 'Tu es de Madrid, non ?' }),
        cloze('Nosotros ___ estudiantes.', ['somos'], { options: ['somos', 'son', 'sois', 'soy'], translation: 'Nous sommes étudiants.' }),
        cloze('Señora García, ¿usted ___ española?', ['es'], { options: ['es', 'eres', 'sois', 'son'], translation: 'Madame García, vous êtes espagnole ?', explain: 'Avec usted, le verbe se met à la 3e personne : usted es.' }),
        cloze('Pablo y Ana ___ de Sevilla.', ['son'], { translation: 'Pablo et Ana sont de Séville.' }),
        cloze('Yo ___ francés y tú ___ italiana.', ['soy', 'eres'], { translation: 'Je suis français et toi, tu es italienne.' }),
        choice('« Je suis étudiant » se dit :', ['Soy estudiante.', 'Soy un estudiante.', 'Estoy estudiante.', 'Es estudiante.'], { explain: 'Pas d’article devant la profession : Soy estudiante, soy médico.', words: ['estudiante'] }),
        choice('Le féminin de « francés » est :', ['francesa', 'francésa', 'francés', 'franceso'], { explain: 'Consonne → + a, et l’accent disparaît : francesa.', words: ['frances'] }),
        type('Écris au féminin : alemán', ['alemana'], { explain: 'alemán → alemana : l’accent disparaît.', words: ['aleman'] }),
        type('Écris en espagnol : « Elle est mexicaine. »', ['Es mexicana.', 'Ella es mexicana.'], { words: ['mexicano'] }),
        order('Vosotros sois de Italia, ¿verdad?', 'Vous êtes d’Italie, n’est-ce pas ?', { prompt: 'Remets les mots dans l’ordre.' }),
        choice('Dans quel pays dit-on « ustedes » à des amis, à la place de « vosotros » ?', ['Au Mexique', 'En Espagne', 'En France', 'Nulle part'], { explain: 'En Amérique latine, ustedes remplace vosotros, même entre amis.' }),
      ],
    },
    {
      id: 'a1-u1-l5',
      title: 'Les nombres et l’âge',
      kind: 'vocab',
      goal: 'Compter jusqu’à 20, donner ton âge et ton numéro de téléphone.',
      steps: [
        words('n0', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'n10'),
        match([['tres', '3'], ['siete', '7'], ['cuatro', '4'], ['nueve', '9'], ['seis', '6']], { words: ['n3', 'n7', 'n4', 'n9', 'n6'] }),
        words('n11', 'n12', 'n13', 'n14', 'n15', 'n16', 'n17', 'n18', 'n19', 'n20'),
        match([['once', '11'], ['quince', '15'], ['doce', '12'], ['catorce', '14'], ['trece', '13']], { words: ['n11', 'n15', 'n12', 'n14', 'n13'] }),
        listen('dieciséis', ['16', '6', '17', '60'], { words: ['n16'] }),
        listen('diecinueve', ['19', '9', '18', '17'], { words: ['n19'] }),
        type('Écris en lettres : 17', ['diecisiete'], { words: ['n17'] }),
        type('Écris en lettres : 20', ['veinte'], { words: ['n20'] }),
        note('a1-u1-numeros'),
        words('cuantos-anos', 'tengo-anos', 'numero-telefono'),
        dialogue('a1-u1-d3'),
        truefalse('Marta a 20 ans.', true, { dialogue: 'a1-u1-d3' }),
        choice('« J’ai dix-huit ans » se dit :', ['Tengo dieciocho años.', 'Soy dieciocho años.', 'Tengo dieciocho.', 'Estoy dieciocho años.'], { explain: 'L’âge se dit avec tener, suivi de años.', words: ['tengo-anos', 'n18'] }),
        cloze('— ¿Cuántos años ___? — Tengo quince años.', ['tienes'], { options: ['tienes', 'eres', 'tengo'], translation: '— Quel âge as-tu ? — J’ai quinze ans.', words: ['cuantos-anos'] }),
        dictation('Tengo diecinueve años.', 'J’ai dix-neuf ans.', { words: ['tengo-anos', 'n19'] }),
        dictation('seis, uno, cuatro, dos, cero', '6, 1, 4, 2, 0', { words: ['n6', 'n1', 'n4', 'n2', 'n0'] }),
      ],
    },
    {
      id: 'a1-u1-l6',
      title: 'Bilan : présente-toi',
      kind: 'review',
      goal: 'Tout réutiliser : saluer, se présenter, dire son âge.',
      steps: [
        choice('Le matin, à la boulangerie, tu dis :', ['Buenos días.', 'Buenas noches.', 'Hasta mañana.', 'Encantado.'], { words: ['buenos-dias'] }),
        listen('¿De dónde eres?', ['D’où es-tu ?', 'Où habites-tu ?', 'Comment vas-tu ?', 'Comment t’appelles-tu ?'], { words: ['de-donde-eres'] }),
        cloze('— ¿Cómo se ___ usted? — Me llamo Carmen Ruiz.', ['llama'], { options: ['llama', 'llamas', 'llamo'], translation: '— Comment vous appelez-vous ? — Je m’appelle Carmen Ruiz.', words: ['como-se-llama'] }),
        cloze('Ellas ___ inglesas y yo ___ francés.', ['son', 'soy'], { options: ['son', 'soy', 'es', 'eres'], translation: 'Elles sont anglaises et moi, je suis français.' }),
        type('Écris en espagnol : « Enchantée » (une femme parle).', ['Encantada', 'Encantada.', 'Mucho gusto'], { words: ['encantado'] }),
        type('Écris en espagnol : « Quel âge as-tu ? »', ['¿Cuántos años tienes?', 'Cuántos años tienes'], { words: ['cuantos-anos'] }),
        order('Soy de Sevilla, pero vivo en Madrid.', 'Je viens de Séville, mais j’habite à Madrid.', { words: ['soy-de', 'pero', 'vivo-en'] }),
        order('¿Cómo está usted, señor García?', 'Comment allez-vous, monsieur García ?', { words: ['como-esta-usted', 'senor'] }),
        choice('Quelle phrase est correcte ?', ['Soy francesa y tengo veinte años.', 'Soy Francesa y soy veinte años.', 'Soy una francesa y tengo veinte.', 'Es francesa y tengo veinte años, yo.'], { explain: 'Pas de majuscule aux nationalités, et l’âge se dit avec tener.' }),
        dictation('Me llamo Lucía y soy española.', 'Je m’appelle Lucía et je suis espagnole.', { words: ['me-llamo', 'espanol'] }),
        write(
          'Présente-toi en trois ou quatre phrases : ton nom, d’où tu viens, où tu habites, ton âge et ce que tu fais.',
          '¡Hola! Me llamo Hugo. Soy francés, de Lyon, pero vivo en Lille. Tengo diecinueve años y soy estudiante. ¡Encantado!',
          ['Tu salues (¡Hola! ou Buenos días).', 'Tu dis ton nom avec « Me llamo… ».', 'Tu dis d’où tu viens avec « Soy de… » et où tu habites avec « Vivo en… ».', 'Tu donnes ton âge avec « Tengo … años ».', 'La nationalité n’a pas de majuscule et la profession pas d’article.'],
        ),
      ],
    },
  ],
}
