import { useT, type TKey } from '../../i18n'
import { Section } from '../ui'

const EVERYWHERE: [string, TKey][] = [
  ['G', 'help.k.g'],
  ['M', 'help.k.m'],
  ['P', 'help.k.p'],
  ['F', 'help.k.f'],
  [',', 'help.k.comma'],
  ['Échap / Esc', 'help.k.esc'],
]

const POMODORO: [string, TKey][] = [
  ['Espace / Space', 'help.k.space'],
  ['R', 'help.k.r'],
  ['S', 'help.k.s'],
  ['1 · 2 · 3', 'help.k.modes'],
  ['T', 'help.k.t'],
  ['N', 'help.k.n'],
]

const ESPAGNOL: [string, TKey][] = [
  ['Entrée / Enter', 'help.k.esEnter'],
  ['1 · 2 · 3 · 4', 'help.k.esPick'],
]

function Keys({ list }: { list: [string, TKey][] }) {
  const t = useT()
  return (
    <ul className="keys">
      {list.map(([k, label]) => (
        <li key={k}>
          <kbd>{k}</kbd>
          <span>{t(label)}</span>
        </li>
      ))}
    </ul>
  )
}

export function HelpSettings() {
  const t = useT()
  return (
    <div className="settings-page">
      <Section title={t('help.everywhere')}>
        <Keys list={EVERYWHERE} />
      </Section>
      <Section title={t('help.inPomodoro')}>
        <Keys list={POMODORO} />
      </Section>
      <Section title={t('help.inEspagnol')}>
        <Keys list={ESPAGNOL} />
      </Section>
      <Section>
        <p>{t('help.about')}</p>
        <p>
          <a href="https://github.com/devGnc/nuage" target="_blank" rel="noreferrer">
            {t('help.source')} ↗
          </a>
        </p>
      </Section>
    </div>
  )
}
