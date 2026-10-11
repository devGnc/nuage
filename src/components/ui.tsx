import { useEffect, useState, type ReactNode } from 'react'
import { useT } from '../i18n'

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`toggle ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-knob" />
    </button>
  )
}

export function Row({ label, desc, children, badge }: { label: ReactNode; desc?: ReactNode; children?: ReactNode; badge?: ReactNode }) {
  return (
    <div className="row">
      <div className="row-text">
        <div className="row-label">
          {label}
          {badge}
        </div>
        {desc && <div className="row-desc">{desc}</div>}
      </div>
      {children && <div className="row-control">{children}</div>}
    </div>
  )
}

export function ToggleRow({ label, desc, checked, onChange, disabled }: { label: ReactNode; desc?: ReactNode; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <Row label={label} desc={desc}>
      <Toggle checked={checked} onChange={onChange} label={typeof label === 'string' ? label : undefined} disabled={disabled} />
    </Row>
  )
}

export function Segmented<T extends string>({ value, options, onChange, wrap }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; wrap?: boolean }) {
  return (
    <div className={`segmented ${wrap ? 'wrap' : ''}`} role="radiogroup">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={value === o.value ? 'active' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Slider({ value, onChange, min = 0, max = 1, step = 0.01, label }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label?: string }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <input
      type="range"
      className="slider"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={label}
      style={{ ['--pct' as string]: `${pct}%` }}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  )
}

export function Select<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label?: string }) {
  return (
    <select className="select" value={value} aria-label={label} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function NumberField({ value, onChange, min = 1, max = 600, suffix }: { value: number; onChange: (v: number) => void; min?: number; max?: number; suffix?: string }) {
  const t = useT()
  // Saisie libre (champ vide, valeur hors bornes) : seule une valeur valide est enregistrée.
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft((d) => (d.trim() !== '' && Number(d) === value ? d : String(value))), [value])
  const valid = (d: string) => d.trim() !== '' && Number.isInteger(Number(d)) && Number(d) >= min && Number(d) <= max
  const error = draft.trim() === '' ? t('common.numEmpty') : valid(draft) ? '' : t('common.numRange', { min, max })
  return (
    <div className="numfield-wrap">
      <label className="numfield">
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={draft}
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            setDraft(e.target.value)
            if (valid(e.target.value)) onChange(Number(e.target.value))
          }}
        />
        {suffix && <span>{suffix}</span>}
      </label>
      {error && (
        <span className="numfield-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

export function Section({ title, children, desc }: { title?: ReactNode; desc?: ReactNode; children: ReactNode }) {
  return (
    <section className="card">
      {title && <h3 className="card-title">{title}</h3>}
      {desc && <p className="card-desc">{desc}</p>}
      {children}
    </section>
  )
}

export function IconButton({ label, onClick, children, active, className = '', disabled }: { label: string; onClick?: () => void; children: ReactNode; active?: boolean; className?: string; disabled?: boolean }) {
  return (
    <button type="button" className={`icon-btn ${active ? 'active' : ''} ${className}`} aria-label={label} title={label} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}
