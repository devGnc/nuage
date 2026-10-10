import { useT, type TKey } from '../../i18n'
import { Section } from '../ui'

const KEYS: [string, TKey][] = [
  ['Espace / Space', 'help.k.space'],
  ['R', 'help.k.r'],
  ['S', 'help.k.s'],
  ['1 · 2 · 3', 'help.k.modes'],
  ['T', 'help.k.t'],
  ['M', 'help.k.m'],
  ['N', 'help.k.n'],
  ['F', 'help.k.f'],
  ['P', 'help.k.p'],
  [',', 'help.k.comma'],
  ['Échap / Esc', 'help.k.esc'],
]

export function HelpSettings() {
  const t = useT()
  return (
    <div className="settings-page">
      <Section title={t('help.shortcuts')}>
        <ul className="keys">
          {KEYS.map(([k, label]) => (
            <li key={k}>
              <kbd>{k}</kbd>
              <span>{t(label)}</span>
            </li>
          ))}
        </ul>
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
