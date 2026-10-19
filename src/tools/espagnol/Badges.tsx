import { useT, type TKey } from '../../i18n'
import type { StudyItem } from '../../study/types'

const POS_KEY: Record<string, TKey> = {
  adj: 'es.pos.adj', adv: 'es.pos.adv', art: 'es.pos.art', conj: 'es.pos.conj', interj: 'es.pos.interj',
  num: 'es.pos.num', prep: 'es.pos.prep', pron: 'es.pos.pron', aux: 'es.pos.verb',
  v: 'es.pos.verb', vi: 'es.pos.verb', vt: 'es.pos.verb', vr: 'es.pos.verb',
}

/** Catégorie grammaticale lisible : « adjectif », « nom féminin », « verbe »… */
export function PosBadge({ item }: { item: StudyItem }) {
  const t = useT()
  const pos = item.extra.pos
  if (!pos) return null
  let label: string
  if (pos.startsWith('n')) {
    label = item.extra.gender === 'm' ? t('es.pos.nm') : item.extra.gender === 'f' ? t('es.pos.nf') : item.extra.gender === 'mf' ? t('es.pos.nmf') : t('es.pos.n')
  } else label = POS_KEY[pos] ? t(POS_KEY[pos]) : pos
  return <span className={`es-pos ${pos.startsWith('n') ? `g-${item.extra.gender ?? 'n'}` : ''}`}>{label}</span>
}
