import { choice, cloze, dialogue, dictation, listen, match, note, order, truefalse, type, word, words, write } from '../helpers'
import type { Unit } from '../types'

/** A1 · Unité 2 — La famille, les articles, TENER et les possessifs, décrire quelqu'un. */
export const a1u2: Unit = {
  id: 'a1-u2',
  level: 'A1',
  number: 2,
  title: 'Ma famille',
  titleEs: 'Mi familia',
  goal: 'Présenter ta famille, dire combien de frères et sœurs tu as, décrire le physique et le caractère de quelqu’un.',

  words: [
    // la famille
    word('familia', 'la familia', 'la famille', { pos: 'nf' }),
    word('padre', 'el padre', 'le père', { pos: 'nm' }),
    word('madre', 'la madre', 'la mère', { pos: 'nf' }),
    word('padres', 'los padres', 'les parents', { pos: 'npl', note: 'Le père et la mère. Ce n’est pas « les pères ».' }),
    word('hermano', 'el hermano', 'le frère', { pos: 'nm' }),
    word('hermana', 'la hermana', 'la sœur', { pos: 'nf' }),
    word('hermanos', 'los hermanos', 'les frères et sœurs', { pos: 'npl', example: ['¿Tienes hermanos?', 'As-tu des frères et sœurs ?'] }),
    word('hijo', 'el hijo', 'le fils', { pos: 'nm' }),
    word('hija', 'la hija', 'la fille (l’enfant)', { pos: 'nf', note: 'La fille d’un parent. Une jeune fille, c’est una chica.' }),
    word('hijos', 'los hijos', 'les enfants (fils et filles)', { pos: 'npl' }),
    word('abuelo', 'el abuelo', 'le grand-père', { pos: 'nm' }),
    word('abuela', 'la abuela', 'la grand-mère', { pos: 'nf' }),
    word('abuelos', 'los abuelos', 'les grands-parents', { pos: 'npl' }),
    word('tio', 'el tío / la tía', 'l’oncle / la tante', { pos: 'nm' }),
    word('primo', 'el primo / la prima', 'le cousin / la cousine', { pos: 'nm' }),
    word('marido', 'el marido', 'le mari', { pos: 'nm', latam: 'Plutôt el esposo en Amérique latine.' }),
    word('mujer', 'la mujer', 'la femme ; l’épouse', { pos: 'nf', latam: 'Plutôt la esposa en Amérique latine.' }),
    word('novio', 'el novio / la novia', 'le petit ami / la petite amie', { pos: 'nm', note: 'Aussi : le fiancé, la fiancée, le marié, la mariée.' }),
    word('quien-es', '¿Quién es?', 'Qui est-ce ?', { pos: 'expr', example: ['¿Quién es? — Es mi hermana.', 'Qui est-ce ? — C’est ma sœur.'] }),
    word('este', 'este / esta', 'ce, celui-ci / cette, celle-ci', { pos: 'det', example: ['Este es mi padre.', 'Voici mon père (celui-ci est mon père).'] }),
    word('vive-con', 'vive con…', 'il / elle vit avec…', { pos: 'expr' }),

    // noms pour le genre et le nombre
    word('amigo', 'el amigo / la amiga', 'l’ami / l’amie', { pos: 'nm' }),
    word('chico', 'el chico / la chica', 'le garçon / la fille', { pos: 'nm' }),
    word('casa', 'la casa', 'la maison', { pos: 'nf' }),
    word('libro', 'el libro', 'le livre', { pos: 'nm' }),
    word('coche', 'el coche', 'la voiture', { pos: 'nm', latam: 'el carro, el auto' }),
    word('ciudad', 'la ciudad', 'la ville', { pos: 'nf' }),
    word('dia', 'el día', 'le jour', { pos: 'nm', note: 'Masculin malgré le -a.' }),
    word('problema', 'el problema', 'le problème', { pos: 'nm', note: 'Masculin malgré le -a.' }),
    word('mano', 'la mano', 'la main', { pos: 'nf', note: 'Féminin malgré le -o.' }),
    word('foto', 'la foto', 'la photo', { pos: 'nf', note: 'Abréviation de la fotografía, donc féminin.' }),

    // TENER et possessifs
    word('tener', 'tener', 'avoir (posséder)', { pos: 'v', example: ['Tengo dos hermanos.', 'J’ai deux frères (ou un frère et une sœur).'] }),
    word('hijo-unico', 'hijo único / hija única', 'fils unique / fille unique', { pos: 'expr' }),
    word('casado', 'casado / casada', 'marié / mariée', { pos: 'adj' }),
    word('soltero', 'soltero / soltera', 'célibataire', { pos: 'adj' }),
    word('perro', 'el perro', 'le chien', { pos: 'nm' }),
    word('gato', 'el gato', 'le chat', { pos: 'nm' }),
    word('tambien', 'también', 'aussi', { pos: 'adv' }),
    word('no', 'no', 'non ; ne… pas', { pos: 'adv', example: ['No tengo hermanos.', 'Je n’ai pas de frères et sœurs.'] }),

    // décrire
    word('como-es', '¿Cómo es…?', 'Comment est… ? (à quoi ressemble…)', { pos: 'expr', example: ['¿Cómo es tu hermano?', 'Comment est ton frère ?'] }),
    word('alto', 'alto / alta', 'grand / grande', { pos: 'adj' }),
    word('bajo', 'bajo / baja', 'petit / petite (de taille)', { pos: 'adj' }),
    word('guapo', 'guapo / guapa', 'beau / belle', { pos: 'adj' }),
    word('delgado', 'delgado / delgada', 'mince', { pos: 'adj' }),
    word('rubio', 'rubio / rubia', 'blond / blonde', { pos: 'adj' }),
    word('moreno', 'moreno / morena', 'brun / brune ; bronzé', { pos: 'adj' }),
    word('joven', 'joven', 'jeune', { pos: 'adj' }),
    word('mayor', 'mayor', 'âgé ; aîné', { pos: 'adj', example: ['Mi hermano mayor tiene veinte años.', 'Mon grand frère a vingt ans.'] }),
    word('simpatico', 'simpático / simpática', 'sympathique', { pos: 'adj' }),
    word('antipatico', 'antipático / antipática', 'antipathique', { pos: 'adj' }),
    word('divertido', 'divertido / divertida', 'drôle, amusant', { pos: 'adj' }),
    word('timido', 'tímido / tímida', 'timide', { pos: 'adj' }),
    word('inteligente', 'inteligente', 'intelligent / intelligente', { pos: 'adj' }),
    word('pelo', 'el pelo', 'les cheveux', { pos: 'nm', note: 'Singulier en espagnol : tiene el pelo largo.' }),
    word('ojos', 'los ojos', 'les yeux', { pos: 'npl' }),
    word('largo', 'largo / larga', 'long / longue', { pos: 'adj', note: 'Faux ami : « large » se dit ancho.' }),
    word('corto', 'corto / corta', 'court / courte', { pos: 'adj' }),
    word('azul', 'azul', 'bleu / bleue', { pos: 'adj' }),
    word('verde', 'verde', 'vert / verte', { pos: 'adj' }),
    word('marron', 'marrón', 'marron', { pos: 'adj', note: 'Pluriel : marrones.' }),
    word('muy', 'muy', 'très', { pos: 'adv' }),
    word('un-poco', 'un poco', 'un peu', { pos: 'expr' }),
  ],

  dialogues: [
    {
      id: 'a1-u2-d1',
      title: 'La photo de famille',
      context: 'Chez Lucía, Hugo regarde une photo posée sur l’étagère.',
      lines: [
        { who: 'Hugo', es: '¡Qué foto tan bonita! ¿Quién es?', fr: 'Quelle jolie photo ! Qui est-ce ?' },
        { who: 'Lucía', es: 'Es mi madre, y este es mi padre.', fr: 'C’est ma mère, et lui, c’est mon père.' },
        { who: 'Hugo', es: '¿Y los chicos?', fr: 'Et les jeunes ?' },
        { who: 'Lucía', es: 'Son mis hermanos, Javier y Clara. Javier es el mayor.', fr: 'Ce sont mes frère et sœur, Javier et Clara. Javier est l’aîné.' },
        { who: 'Hugo', es: '¿Y la señora del perro?', fr: 'Et la dame avec le chien ?' },
        { who: 'Lucía', es: 'Es mi abuela Carmen. Vive con nosotros.', fr: 'C’est ma grand-mère Carmen. Elle vit avec nous.' },
        { who: 'Hugo', es: 'Tienes una familia muy grande. Yo soy hijo único.', fr: 'Tu as une très grande famille. Moi, je suis fils unique.' },
      ],
    },
    {
      id: 'a1-u2-d2',
      title: 'Comment est ton frère ?',
      context: 'Hugo va rencontrer la famille de Lucía et pose des questions.',
      lines: [
        { who: 'Hugo', es: '¿Cómo es tu hermano Javier?', fr: 'Comment est ton frère Javier ?' },
        { who: 'Lucía', es: 'Es alto y moreno. Tiene los ojos verdes.', fr: 'Il est grand et brun. Il a les yeux verts.' },
        { who: 'Lucía', es: 'Es muy simpático, pero un poco tímido.', fr: 'Il est très sympa, mais un peu timide.' },
        { who: 'Hugo', es: '¿Y tu hermana Clara?', fr: 'Et ta sœur Clara ?' },
        { who: 'Lucía', es: 'Clara es baja y rubia. Tiene el pelo largo y es muy divertida.', fr: 'Clara est petite et blonde. Elle a les cheveux longs et elle est très drôle.' },
        { who: 'Hugo', es: '¿Y tu abuela?', fr: 'Et ta grand-mère ?' },
        { who: 'Lucía', es: 'Es mayor, pero es muy joven de espíritu.', fr: 'Elle est âgée, mais elle est très jeune d’esprit.' },
      ],
    },
  ],

  notes: [
    {
      id: 'a1-u2-familia',
      title: 'Parler de sa famille',
      summary: 'Le vocabulaire de la famille et le piège du masculin pluriel.',
      body: `
| Masculin | Féminin | Pluriel (les deux) |
| --- | --- | --- |
| el padre (le père) | la madre (la mère) | los padres (les parents) |
| el hermano (le frère) | la hermana (la sœur) | los hermanos (frères et sœurs) |
| el hijo (le fils) | la hija (la fille) | los hijos (les enfants) |
| el abuelo (le grand-père) | la abuela (la grand-mère) | los abuelos (les grands-parents) |
| el tío (l’oncle) | la tía (la tante) | los tíos (oncles et tantes) |
| el primo (le cousin) | la prima (la cousine) | los primos (les cousins) |

**Le masculin pluriel désigne un groupe mixte.** *Tengo tres hermanos* peut vouloir dire trois frères, ou deux frères et une sœur. Pour préciser : *dos hermanos y una hermana*.

**Présenter quelqu’un**

- *¿Quién es?* — Qui est-ce ?
- *Es mi madre.* — C’est ma mère.
- *Este es mi padre. Esta es mi abuela.* — Voici mon père. Voici ma grand-mère.
- *Son mis hermanos.* — Ce sont mes frères et sœurs.

> **Piège du francophone :** *los padres* = les parents, et *la hija* = la fille d’un parent. Une jeune fille, c’est *una chica*.
`,
    },
    {
      id: 'a1-u2-articulos',
      title: 'Articles, genre et pluriel',
      summary: 'Les articles définis et indéfinis, reconnaître le genre d’un nom, former le pluriel.',
      body: `
**Les articles**

| | Masculin | Féminin |
| --- | --- | --- |
| défini singulier (le, la) | el libro | la casa |
| défini pluriel (les) | los libros | las casas |
| indéfini singulier (un, une) | un libro | una casa |
| indéfini pluriel (des) | unos libros | unas casas |

**Le genre**

- Les noms en **-o** sont en général masculins (*el libro*), ceux en **-a** féminins (*la casa*).
- Ceux en **-ción** et **-dad** sont féminins : *la canción*, *la ciudad*.
- Ceux en **-e** ou en consonne : à apprendre avec l’article (*el coche*, *la noche*, *el profesor*).
- **Exceptions à retenir :** *el día*, *el problema*, *el idioma*, *el mapa* (masculins) ; *la mano*, *la foto*, *la moto*, *la radio* (féminins).

**Le pluriel**

| Le nom finit par… | On ajoute | Exemple |
| --- | --- | --- |
| une voyelle | -s | casa → casas |
| une consonne | -es | ciudad → ciudades, profesor → profesores |
| -z | -ces | lápiz → lápices |

> **Piège du francophone :** le genre ne correspond pas toujours au français : *el coche* (la voiture), *la leche* (le lait), *el color* (la couleur).
`,
    },
    {
      id: 'a1-u2-tener',
      title: 'TENER et les possessifs',
      summary: 'Conjuguer TENER (avoir) au présent et dire « mon, ton, son… ».',
      body: `
**TENER (avoir) au présent**

| Personne | TENER |
| --- | --- |
| yo | tengo |
| tú | tienes |
| él / ella / usted | tiene |
| nosotros / nosotras | tenemos |
| vosotros / vosotras | tenéis |
| ellos / ellas / ustedes | tienen |

Le **e** du radical devient **ie** quand il est accentué (*tienes, tiene, tienen*), et la 1re personne est irrégulière (*tengo*).

**Usages**

- posséder : *Tengo un perro.* (j’ai un chien)
- la famille : *¿Tienes hermanos? — Sí, tengo una hermana.* / *No, soy hijo único.*
- l’âge : *Tiene veinte años.*
- La négation se place devant le verbe : *No tengo hermanos.* (sans article : « je n’ai pas de frères et sœurs »).

**Les possessifs (devant le nom)**

| | Singulier | Pluriel |
| --- | --- | --- |
| mon, ma / mes | mi padre, mi madre | mis padres |
| ton, ta / tes | tu hermano | tus hermanos |
| son, sa / ses — votre, vos (usted) | su hijo | sus hijos |
| notre / nos | nuestro tío, nuestra tía | nuestros tíos, nuestras tías |
| votre / vos (vosotros) | vuestro primo, vuestra prima | vuestros primos, vuestras primas |
| leur / leurs — votre, vos (ustedes) | su abuela | sus abuelos |

- *mi, tu, su* ne changent qu’au pluriel ; *nuestro* et *vuestro* s’accordent aussi en genre.
- *su* veut dire son, sa, leur… et aussi votre (avec *usted*) : le contexte tranche.

> **Piège du francophone :** *tu* (ton) n’a pas d’accent, *tú* (toi, tu) en a un : *Tú tienes tu libro.*
`,
    },
    {
      id: 'a1-u2-describir',
      title: 'Décrire quelqu’un',
      summary: 'Accorder les adjectifs, décrire le physique et le caractère avec SER et TENER.',
      body: `
**L’accord des adjectifs**

| L’adjectif finit par… | Masculin | Féminin | Pluriel |
| --- | --- | --- | --- |
| -o | alto | alta | altos, altas |
| -e | inteligente | inteligente | inteligentes |
| une consonne | joven, azul | joven, azul | jóvenes, azules |

L’adjectif se place en général **après** le nom : *un chico simpático*, *los ojos azules*.

**Décrire**

- avec **SER** + adjectif, pour le physique et le caractère : *Es alta y morena. Son muy simpáticos.*
- avec **TENER** pour les cheveux et les yeux : *Tiene el pelo corto. Tiene los ojos marrones.*
- *muy* (très) et *un poco* (un peu) nuancent : *Es muy divertido, pero un poco tímido.*
- La question : *¿Cómo es tu hermana?* — Comment est ta sœur ?

> **Piège du francophone :** *el pelo* (les cheveux) est au singulier, et *largo* veut dire « long », pas « large » (*ancho*).
`,
    },
  ],

  lessons: [
    {
      id: 'a1-u2-l1',
      title: 'La famille',
      kind: 'vocab',
      goal: 'Nommer les membres de ta famille et présenter quelqu’un sur une photo.',
      steps: [
        words('familia', 'padre', 'madre', 'padres', 'hermano', 'hermana', 'hermanos', 'hijo', 'hija', 'hijos', 'abuelo', 'abuela', 'abuelos'),
        match([['el padre', 'le père'], ['la hermana', 'la sœur'], ['el hijo', 'le fils'], ['la abuela', 'la grand-mère'], ['los padres', 'les parents']], { words: ['padre', 'hermana', 'hijo', 'abuela', 'padres'] }),
        choice('Que veut dire « los padres » ?', ['les parents', 'les pères', 'les grands-parents', 'les frères'], { words: ['padres'], explain: 'Le masculin pluriel désigne le groupe : le père et la mère.' }),
        choice('« Tengo dos hermanos » peut vouloir dire…', ['deux frères, ou un frère et une sœur', 'seulement deux frères', 'deux sœurs', 'deux cousins'], { words: ['hermanos'] }),
        words('tio', 'primo', 'marido', 'mujer', 'novio', 'quien-es', 'este', 'vive-con'),
        dialogue('a1-u2-d1'),
        truefalse('Javier est le plus âgé des frère et sœur.', true, { dialogue: 'a1-u2-d1', explain: '« Javier es el mayor ».' }),
        truefalse('La grand-mère de Lucía habite seule.', false, { dialogue: 'a1-u2-d1', explain: '« Vive con nosotros » : elle vit avec eux.' }),
        truefalse('Hugo a des frères et sœurs.', false, { dialogue: 'a1-u2-d1', explain: '« Soy hijo único » : il est fils unique.' }),
        note('a1-u2-familia'),
        listen('la tía', ['la tante', 'l’oncle', 'la cousine', 'la grand-mère'], { words: ['tio'] }),
        cloze('— ¿___ es? — Es mi primo Daniel.', ['Quién'], { options: ['Quién', 'Cómo', 'Dónde'], translation: '— Qui est-ce ? — C’est mon cousin Daniel.', words: ['quien-es', 'primo'] }),
        type('Écris en espagnol : « la grand-mère »', ['la abuela', 'abuela'], { words: ['abuela'] }),
        dictation('Este es mi padre.', 'Voici mon père.', { words: ['este', 'padre'] }),
      ],
    },
    {
      id: 'a1-u2-l2',
      title: 'Articles, genre et pluriel',
      kind: 'grammar',
      goal: 'Choisir le bon article, reconnaître le genre d’un nom et former le pluriel.',
      steps: [
        note('a1-u2-articulos'),
        words('amigo', 'chico', 'casa', 'libro', 'coche', 'ciudad', 'dia', 'problema', 'mano', 'foto'),
        cloze('___ casa de mis abuelos es muy grande.', ['La'], { options: ['La', 'El', 'Los', 'Las'], translation: 'La maison de mes grands-parents est très grande.', words: ['casa'] }),
        cloze('Tengo ___ problema.', ['un'], { options: ['un', 'una', 'unos', 'el'], translation: 'J’ai un problème.', explain: 'Problema est masculin malgré le -a : un problema.', words: ['problema'] }),
        cloze('___ días de la semana.', ['Los'], { options: ['Los', 'Las', 'El', 'La'], translation: 'Les jours de la semaine.', words: ['dia'] }),
        cloze('Me duele ___ mano.', ['la'], { options: ['la', 'el', 'los', 'un'], translation: 'J’ai mal à la main.', explain: 'Mano est féminin malgré le -o.', words: ['mano'] }),
        choice('Quel nom est féminin ?', ['la ciudad', 'el día', 'el coche', 'el problema'], { explain: 'Les noms en -dad sont féminins.', words: ['ciudad'] }),
        choice('Quel nom est masculin ?', ['el día', 'la foto', 'la mano', 'la casa'], { words: ['dia'] }),
        type('Mets au pluriel : la ciudad', ['las ciudades'], { explain: 'Consonne → + es : ciudades.', words: ['ciudad'] }),
        type('Mets au pluriel : el profesor', ['los profesores'], { words: ['profesor'] }),
        type('Mets au pluriel : un amigo', ['unos amigos'], { words: ['amigo'] }),
        match([['el coche', 'los coches'], ['la foto', 'las fotos'], ['el lápiz', 'los lápices'], ['la mano', 'las manos'], ['el día', 'los días']], { prompt: 'Associe chaque nom à son pluriel.' }),
        order('Las fotos de mis amigos son muy bonitas.', 'Les photos de mes amis sont très jolies.', { words: ['foto', 'amigo'] }),
        dictation('Unas chicas y unos chicos.', 'Des filles et des garçons.', { words: ['chico'] }),
      ],
    },
    {
      id: 'a1-u2-l3',
      title: 'TENER et les possessifs',
      kind: 'grammar',
      goal: 'Dire ce que tu as, combien de frères et sœurs, et utiliser mi, tu, su, nuestro…',
      steps: [
        note('a1-u2-tener'),
        words('tener', 'hijo-unico', 'casado', 'soltero', 'perro', 'gato', 'tambien', 'no'),
        match([['yo', 'tengo'], ['tú', 'tienes'], ['ella', 'tiene'], ['nosotros', 'tenemos'], ['ellos', 'tienen']], { prompt: 'Associe chaque pronom à sa forme de TENER.' }),
        cloze('¿___ hermanos? — No, soy hija única.', ['Tienes'], { options: ['Tienes', 'Tengo', 'Tiene'], translation: 'As-tu des frères et sœurs ? — Non, je suis fille unique.', words: ['hijo-unico'] }),
        cloze('Mis abuelos ___ un perro y dos gatos.', ['tienen'], { translation: 'Mes grands-parents ont un chien et deux chats.', words: ['perro', 'gato'] }),
        cloze('Nosotros ___ una casa en la playa.', ['tenemos'], { translation: 'Nous avons une maison à la plage.' }),
        cloze('Vosotros ___ un coche muy bonito.', ['tenéis'], { options: ['tenéis', 'tienen', 'tenemos', 'tienes'], translation: 'Vous avez une très jolie voiture.' }),
        choice('« Je n’ai pas de chat » se dit :', ['No tengo gato.', 'Tengo no gato.', 'No tengo un gato no.', 'Tengo ningún gato.'], { explain: 'No se place devant le verbe, et l’article disparaît.', words: ['no', 'gato'] }),
        cloze('Ana y ___ hermanos viven en Toledo.', ['sus'], { options: ['sus', 'su', 'mis', 'tus'], translation: 'Ana et ses frères et sœurs habitent à Tolède.' }),
        cloze('Mi hermana y yo vivimos con ___ padres.', ['nuestros'], { options: ['nuestros', 'nuestras', 'mis', 'sus'], translation: 'Ma sœur et moi vivons avec nos parents.' }),
        cloze('¿Es ___ libro? — Sí, es mi libro.', ['tu'], { options: ['tu', 'tú', 'su'], translation: 'C’est ton livre ? — Oui, c’est mon livre.', explain: 'Tu (ton) sans accent ; tú (toi) avec accent.' }),
        type('Écris en espagnol : « J’ai deux chiens. »', ['Tengo dos perros.'], { words: ['tener', 'perro'] }),
        type('Écris en espagnol : « Mon frère est marié. »', ['Mi hermano está casado.', 'Mi hermano es casado.'], { words: ['hermano', 'casado'], explain: 'On dit plutôt está casado (l’état civil se dit souvent avec estar), mais es casado est aussi correct.' }),
        order('Mi tía también tiene tres hijos.', 'Ma tante a aussi trois enfants.', { words: ['tio', 'tambien', 'hijos'] }),
        dictation('No tengo hermanos, soy hijo único.', 'Je n’ai pas de frères et sœurs, je suis fils unique.', { words: ['no', 'hijo-unico'] }),
      ],
    },
    {
      id: 'a1-u2-l4',
      title: 'Décrire quelqu’un',
      kind: 'dialogue',
      goal: 'Décrire le physique et le caractère d’une personne.',
      steps: [
        words('como-es', 'alto', 'bajo', 'guapo', 'delgado', 'rubio', 'moreno', 'joven', 'mayor', 'muy', 'un-poco'),
        words('simpatico', 'antipatico', 'divertido', 'timido', 'inteligente', 'pelo', 'ojos', 'largo', 'corto', 'azul', 'verde', 'marron'),
        dialogue('a1-u2-d2'),
        truefalse('Javier a les yeux bleus.', false, { dialogue: 'a1-u2-d2', explain: '« Tiene los ojos verdes » : il a les yeux verts.' }),
        truefalse('Clara est petite et blonde.', true, { dialogue: 'a1-u2-d2' }),
        truefalse('Javier est un peu timide.', true, { dialogue: 'a1-u2-d2' }),
        note('a1-u2-describir'),
        match([['alto', 'grand'], ['bajo', 'petit'], ['rubio', 'blond'], ['delgado', 'mince'], ['divertido', 'drôle']], { words: ['alto', 'bajo', 'rubio', 'delgado', 'divertido'] }),
        choice('Le contraire de « simpático » est :', ['antipático', 'tímido', 'mayor', 'guapo'], { words: ['antipatico'] }),
        cloze('Mi hermana es muy ___.', ['simpática'], { options: ['simpática', 'simpático', 'simpáticas'], translation: 'Ma sœur est très sympathique.', words: ['simpatico'] }),
        cloze('Mis primos son ___ y ___.', ['altos', 'rubios'], { options: ['altos', 'rubios', 'alto', 'rubia'], translation: 'Mes cousins sont grands et blonds.', words: ['alto', 'rubio'] }),
        cloze('Mi madre tiene el pelo ___ y los ojos ___.', ['corto', 'azules'], { translation: 'Ma mère a les cheveux courts et les yeux bleus.', words: ['corto', 'azul'] }),
        choice('« Elle a les cheveux longs » se dit :', ['Tiene el pelo largo.', 'Tiene los pelos largos.', 'Es el pelo largo.', 'Tiene el pelo ancho.'], { explain: 'El pelo au singulier, et largo = long.', words: ['pelo', 'largo'] }),
        listen('¿Cómo es tu padre?', ['Comment est ton père ?', 'Où est ton père ?', 'Qui est ton père ?', 'Quel âge a ton père ?'], { words: ['como-es'] }),
        type('Écris en espagnol : « Il est très intelligent. »', ['Es muy inteligente.'], { words: ['muy', 'inteligente'] }),
        order('Es un chico muy guapo, pero un poco tímido.', 'C’est un garçon très beau, mais un peu timide.', { words: ['guapo', 'un-poco', 'timido'] }),
        dictation('Tiene los ojos marrones.', 'Il / elle a les yeux marron.', { words: ['ojos', 'marron'] }),
      ],
    },
    {
      id: 'a1-u2-l5',
      title: 'Bilan : ta famille',
      kind: 'review',
      goal: 'Tout réutiliser : présenter et décrire ta famille.',
      steps: [
        choice('« Mes grands-parents » se dit :', ['mis abuelos', 'mi abuelos', 'mis abuelas', 'mis padres'], { words: ['abuelos'] }),
        listen('Es mi hermana mayor.', ['C’est ma grande sœur.', 'C’est ma petite sœur.', 'C’est ma mère.', 'C’est ma cousine.'], { words: ['hermana', 'mayor'] }),
        cloze('¿Cuántos hermanos ___ tu novio?', ['tiene'], { options: ['tiene', 'tienes', 'es'], translation: 'Combien de frères et sœurs a ton petit ami ?', words: ['novio'] }),
        cloze('___ ciudad es bonita, pero ___ coches son caros.', ['La', 'los'], { options: ['La', 'los', 'El', 'las'], translation: 'La ville est jolie, mais les voitures sont chères.', words: ['ciudad', 'coche'] }),
        cloze('Mis tías son muy ___.', ['divertidas'], { translation: 'Mes tantes sont très drôles.', words: ['divertido'] }),
        type('Écris en espagnol : « Qui est-ce ? »', ['¿Quién es?'], { words: ['quien-es'] }),
        type('Écris en espagnol : « Nous avons un chat. »', ['Tenemos un gato.'], { words: ['gato'] }),
        order('Mi abuela es mayor, pero muy divertida.', 'Ma grand-mère est âgée, mais très drôle.', { words: ['abuela', 'mayor', 'divertido'] }),
        choice('Quelle phrase est correcte ?', ['Mis padres tienen una casa muy bonita.', 'Mis padres tiene una casa muy bonito.', 'Mi padres tienen un casa muy bonita.', 'Mis padres tienen una casa muy bonitas.'] ),
        dictation('Mi hermano es alto y tiene el pelo corto.', 'Mon frère est grand et il a les cheveux courts.', { words: ['alto', 'pelo', 'corto'] }),
        write(
          'Décris ta famille en quatre ou cinq phrases : qui en fait partie, leur âge, leur physique, leur caractère.',
          'Tengo una familia pequeña. Mi madre se llama Isabel; es profesora y es muy simpática. Mi padre es alto y moreno. Tengo una hermana, Léa: tiene quince años y es un poco tímida. También tenemos un perro, Max.',
          ['Tu présentes au moins trois personnes avec les possessifs (mi, mis…).', 'Tu donnes un âge avec « tiene … años ».', 'Tu décris le physique avec ser (es alto) ou tener (tiene el pelo…).', 'Les adjectifs s’accordent : mi madre es simpática, mis primos son altos.', 'Tu utilises au moins une fois muy ou un poco.'],
        ),
      ],
    },
  ],
}
