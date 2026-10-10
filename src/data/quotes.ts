import type { QuoteCategory } from '../types'

export interface Quote {
  id: string
  cat: Exclude<QuoteCategory, 'all' | 'mine'>
  fr: string
  en: string
  author?: { fr: string; en: string }
}

const a = (fr: string, en = fr) => ({ fr, en })

/** Citations dont l'attribution est vérifiable, et phrases courtes sans auteur. */
export const QUOTES: Quote[] = [
  { id: 'q1', cat: 'motivation', fr: "Ce n'est pas parce que les choses sont difficiles que nous n'osons pas, c'est parce que nous n'osons pas qu'elles sont difficiles.", en: 'It is not because things are difficult that we do not dare; it is because we do not dare that they are difficult.', author: a('Sénèque', 'Seneca') },
  { id: 'q2', cat: 'calm', fr: 'Nous souffrons plus souvent en imagination que dans la réalité.', en: 'We suffer more often in imagination than in reality.', author: a('Sénèque', 'Seneca') },
  { id: 'q3', cat: 'discipline', fr: "Ce n'est pas que nous ayons peu de temps, c'est que nous en perdons beaucoup.", en: 'It is not that we have a short time to live, but that we waste a lot of it.', author: a('Sénèque', 'Seneca') },
  { id: 'q4', cat: 'motivation', fr: "Il n'y a pas de vent favorable pour celui qui ne sait pas où il va.", en: 'If one does not know to which port one is sailing, no wind is favorable.', author: a('Sénèque', 'Seneca') },
  { id: 'q5', cat: 'discipline', fr: "Pendant qu'on la remet à plus tard, la vie passe.", en: 'While we are postponing, life speeds by.', author: a('Sénèque', 'Seneca') },
  { id: 'q6', cat: 'wisdom', fr: 'Tout le reste nous est étranger ; seul le temps nous appartient.', en: 'Nothing is ours, except time.', author: a('Sénèque', 'Seneca') },
  { id: 'q7', cat: 'calm', fr: 'Il y a ce qui dépend de nous, et ce qui ne dépend pas de nous.', en: 'Some things are within our power, while others are not.', author: a('Épictète', 'Epictetus') },
  { id: 'q8', cat: 'calm', fr: "Ce qui trouble les hommes, ce ne sont pas les choses, mais les jugements qu'ils portent sur les choses.", en: 'Men are disturbed not by things, but by the views which they take of things.', author: a('Épictète', 'Epictetus') },
  { id: 'q9', cat: 'wisdom', fr: "Si ce n'est pas convenable, ne le fais pas ; si ce n'est pas vrai, ne le dis pas.", en: 'If it is not right, do not do it; if it is not true, do not say it.', author: a('Marc Aurèle', 'Marcus Aurelius') },
  { id: 'q10', cat: 'discipline', fr: "Accomplis chaque action comme si c'était la dernière de ta vie.", en: 'Do every act of your life as though it were the very last act of your life.', author: a('Marc Aurèle', 'Marcus Aurelius') },
  { id: 'q11', cat: 'calm', fr: 'Quand je danse, je danse ; quand je dors, je dors.', en: 'When I dance, I dance; when I sleep, I sleep.', author: a('Montaigne') },
  { id: 'q12', cat: 'wisdom', fr: "L'attention est la forme la plus rare et la plus pure de la générosité.", en: 'Attention is the rarest and purest form of generosity.', author: a('Simone Weil') },
  { id: 'q13', cat: 'calm', fr: "Tout le malheur des hommes vient d'une seule chose, qui est de ne savoir pas demeurer en repos dans une chambre.", en: 'All the unhappiness of men arises from one single fact, that they cannot stay quietly in their own chamber.', author: a('Pascal') },
  { id: 'q14', cat: 'wisdom', fr: "Je n'ai fait celle-ci plus longue que parce que je n'ai pas eu le loisir de la faire plus courte.", en: 'I have made this longer than usual because I have not had time to make it shorter.', author: a('Pascal') },
  { id: 'q15', cat: 'discipline', fr: "Diviser chacune des difficultés que j'examinerais en autant de parcelles qu'il se pourrait.", en: 'Divide each of the difficulties under examination into as many parts as possible.', author: a('Descartes') },
  { id: 'q16', cat: 'wisdom', fr: "Ce que l'on conçoit bien s'énonce clairement.", en: 'What is well conceived is clearly expressed.', author: a('Boileau') },
  { id: 'q17', cat: 'discipline', fr: 'Vingt fois sur le métier remettez votre ouvrage.', en: 'Twenty times upon the loom, put back your work.', author: a('Boileau') },
  { id: 'q18', cat: 'discipline', fr: 'Patience et longueur de temps font plus que force ni que rage.', en: 'Patience and time do more than strength or passion.', author: a('La Fontaine') },
  { id: 'q19', cat: 'motivation', fr: 'Rien ne sert de courir ; il faut partir à point.', en: 'There is no point in running; one must set out on time.', author: a('La Fontaine') },
  { id: 'q20', cat: 'wisdom', fr: 'Il faut cultiver notre jardin.', en: 'We must cultivate our garden.', author: a('Voltaire') },
  { id: 'q21', cat: 'discipline', fr: "Le travail éloigne de nous trois grands maux : l'ennui, le vice et le besoin.", en: 'Work keeps at bay three great evils: boredom, vice, and need.', author: a('Voltaire') },
  { id: 'q22', cat: 'motivation', fr: "Le mieux est l'ennemi du bien.", en: 'The best is the enemy of the good.', author: a('Voltaire') },
  { id: 'q23', cat: 'motivation', fr: 'Un voyage de mille lieues commence par un premier pas.', en: 'A journey of a thousand miles begins with a single step.', author: a('Laozi') },
  { id: 'q24', cat: 'motivation', fr: "Qui a commencé a fait la moitié de l'ouvrage.", en: 'He who has begun has half done.', author: a('Horace') },
  { id: 'q25', cat: 'calm', fr: 'Cueille le jour présent.', en: 'Seize the day.', author: a('Horace') },
  { id: 'q26', cat: 'discipline', fr: "Nous sommes ce que nous faisons de manière répétée. L'excellence n'est donc pas un acte, mais une habitude.", en: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: a('Will Durant') },
  { id: 'q27', cat: 'discipline', fr: 'Le temps est ce que nous désirons le plus, et ce que nous employons le plus mal.', en: 'Time is what we want most, but what we use worst.', author: a('William Penn') },
  { id: 'q28', cat: 'wisdom', fr: "La perfection est atteinte non quand il n'y a plus rien à ajouter, mais quand il n'y a plus rien à retrancher.", en: 'Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.', author: a('Saint-Exupéry') },
  { id: 'q29', cat: 'wisdom', fr: 'Il faut imaginer Sisyphe heureux.', en: 'One must imagine Sisyphus happy.', author: a('Albert Camus') },
  { id: 'q30', cat: 'calm', fr: 'Hâte-toi lentement.', en: 'Make haste slowly.', author: a('Auguste, selon Suétone', 'Augustus, per Suetonius') },
  { id: 'q31', cat: 'wisdom', fr: 'Connais-toi toi-même.', en: 'Know thyself.', author: a('Temple de Delphes', 'Temple of Delphi') },
  { id: 'q32', cat: 'motivation', fr: "Le génie, c'est 1 % d'inspiration et 99 % de transpiration.", en: 'Genius is one percent inspiration and ninety-nine percent perspiration.', author: a('Thomas Edison') },
  { id: 'q33', cat: 'discipline', fr: "C'est en forgeant qu'on devient forgeron.", en: 'Practice makes perfect.', author: a('Proverbe', 'Proverb') },
  { id: 'q34', cat: 'motivation', fr: "Petit à petit, l'oiseau fait son nid.", en: 'Little by little, the bird builds its nest.', author: a('Proverbe', 'Proverb') },

  { id: 'm1', cat: 'motivation', fr: 'Commence petit, mais commence.', en: 'Start small, but start.' },
  { id: 'm2', cat: 'motivation', fr: "Le plus dur, c'est de s'y mettre. Tu y es.", en: "The hardest part is starting. You're here." },
  { id: 'm3', cat: 'motivation', fr: 'Fait vaut mieux que parfait.', en: 'Done is better than perfect.' },
  { id: 'm4', cat: 'motivation', fr: "Un pas aujourd'hui vaut mieux qu'un plan pour demain.", en: 'One step today beats a plan for tomorrow.' },
  { id: 'm5', cat: 'motivation', fr: "Les petits progrès s'additionnent.", en: 'Small progress adds up.' },
  { id: 'm6', cat: 'motivation', fr: 'Avance, même lentement.', en: 'Keep moving, even slowly.' },
  { id: 'm7', cat: 'motivation', fr: 'Ton toi de demain te remerciera.', en: 'Your future self will thank you.' },
  { id: 'm8', cat: 'discipline', fr: 'Une chose à la fois.', en: 'One thing at a time.' },
  { id: 'm9', cat: 'discipline', fr: "Concentre-toi sur la prochaine marche, pas sur tout l'escalier.", en: 'Focus on the next step, not the whole staircase.' },
  { id: 'm10', cat: 'discipline', fr: 'Le téléphone peut attendre.', en: 'Your phone can wait.' },
  { id: 'm11', cat: 'discipline', fr: 'Vingt-cinq minutes. Juste vingt-cinq minutes.', en: 'Twenty-five minutes. Just twenty-five minutes.' },
  { id: 'm12', cat: 'discipline', fr: "La régularité bat l'intensité.", en: 'Consistency beats intensity.' },
  { id: 'm13', cat: 'discipline', fr: 'Pas de multitâche. Juste cette tâche.', en: 'No multitasking. Just this task.' },
  { id: 'm14', cat: 'discipline', fr: 'Ferme les onglets dont tu n’as pas besoin.', en: "Close the tabs you don't need." },
  { id: 'm15', cat: 'discipline', fr: 'Fais-le maintenant, pas parfaitement.', en: 'Do it now, not perfectly.' },
  { id: 'm16', cat: 'calm', fr: 'Respire. Tu as le temps.', en: 'Breathe. You have time.' },
  { id: 'm17', cat: 'calm', fr: 'Lentement, mais sûrement.', en: 'Slowly, but surely.' },
  { id: 'm18', cat: 'calm', fr: "Une pause n'est pas du temps perdu.", en: 'A break is not time wasted.' },
  { id: 'm19', cat: 'calm', fr: 'Le calme est une force.', en: 'Calm is a strength.' },
  { id: 'm20', cat: 'calm', fr: 'Ici et maintenant.', en: 'Here and now.' },
  { id: 'm21', cat: 'calm', fr: "Pense à boire un verre d'eau.", en: 'Remember to drink some water.' },
  { id: 'm22', cat: 'calm', fr: 'Laisse passer les distractions comme des nuages.', en: 'Let distractions drift by like clouds.' },
  { id: 'm23', cat: 'wisdom', fr: 'Ce que tu fais chaque jour compte plus que ce que tu fais de temps en temps.', en: 'What you do every day matters more than what you do once in a while.' },
  { id: 'm24', cat: 'wisdom', fr: "Apprendre, c'est accepter de ne pas encore savoir.", en: "Learning means accepting that you don't know yet." },
  { id: 'm25', cat: 'wisdom', fr: 'La clarté vient en faisant.', en: 'Clarity comes from doing.' },
  { id: 'm26', cat: 'wisdom', fr: 'Simplifie.', en: 'Simplify.' },
]
