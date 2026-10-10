import { useEffect, useRef } from 'react'
import type { AnimKind } from './catalog'

type Scene = { draw: (c: CanvasRenderingContext2D, t: number, w: number, h: number) => void; filter?: string; dpr?: number }

const R = Math.random
const TAU = Math.PI * 2

function clouds(evening: boolean): Scene {
  type Puff = { dx: number; dy: number; r: number }
  type Cloud = { x: number; y: number; s: number; v: number; a: number; puffs: Puff[] }
  const make = (x: number): Cloud => {
    const s = 0.5 + R() * 1.1
    const puffs: Puff[] = []
    const count = 12 + Math.floor(R() * 10)
    const width = 160 + R() * 160
    for (let i = 0; i < count; i++) {
      const u = (R() - 0.5) * 2
      // les bouffées sont plus hautes au centre : silhouette de cumulus
      puffs.push({ dx: u * width, dy: -Math.pow(1 - Math.abs(u), 1.4) * (30 + R() * 45) + R() * 12, r: 26 + R() * 46 * (1 - Math.abs(u) * 0.5) })
    }
    return { x, y: 0.1 + R() * 0.55, s, v: 5 + s * 9, a: 0.55 + R() * 0.35, puffs }
  }
  const list: Cloud[] = Array.from({ length: 9 }, () => make(R() * 1.3 - 0.15))
  list.sort((a, b) => a.s - b.s)
  let last = 0
  const tint = evening ? '255,226,214' : '255,255,255'
  return {
    draw(c, t, w, h) {
      const dt = last ? Math.min(0.1, t - last) : 0
      last = t
      c.clearRect(0, 0, w, h)
      for (const cl of list) {
        cl.x += (cl.v * dt) / w
        if (cl.x > 1.25) Object.assign(cl, make(-0.25))
        const cx = cl.x * w
        const cy = cl.y * h
        for (const p of cl.puffs) {
          const r = p.r * cl.s
          const x = cx + p.dx * cl.s
          const y = cy + p.dy * cl.s
          const g = c.createRadialGradient(x, y, 0, x, y, r)
          g.addColorStop(0, `rgba(${tint},${cl.a})`)
          g.addColorStop(0.6, `rgba(${tint},${cl.a * 0.75})`)
          g.addColorStop(0.85, `rgba(${tint},${cl.a * 0.25})`)
          g.addColorStop(1, `rgba(${tint},0)`)
          c.fillStyle = g
          c.beginPath()
          c.arc(x, y, r, 0, TAU)
          c.fill()
        }
      }
    },
  }
}

function stars(): Scene {
  const list = Array.from({ length: 260 }, () => ({ x: R(), y: R() * 0.92, r: 0.4 + Math.pow(R(), 3) * 1.6, p: R() * TAU, s: 0.5 + R() * 2 }))
  let shoot: { x: number; y: number; vx: number; vy: number; life: number } | null = null
  let nextShoot = 4
  return {
    dpr: Math.min(2, window.devicePixelRatio || 1),
    draw(c, t, w, h) {
      c.clearRect(0, 0, w, h)
      for (const s of list) {
        const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.s + s.p))
        c.fillStyle = `rgba(255,255,255,${a})`
        c.beginPath()
        c.arc(s.x * w, s.y * h, s.r, 0, TAU)
        c.fill()
      }
      if (!shoot && t > nextShoot) {
        shoot = { x: 0.2 + R() * 0.6, y: R() * 0.35, vx: 0.35 + R() * 0.2, vy: 0.18 + R() * 0.1, life: 0 }
        nextShoot = t + 6 + R() * 9
      }
      if (shoot) {
        shoot.life += 1 / 30
        const x = (shoot.x + shoot.vx * shoot.life) * w
        const y = (shoot.y + shoot.vy * shoot.life) * h
        const g = c.createLinearGradient(x, y, x - shoot.vx * 260, y - shoot.vy * 260)
        const fade = Math.max(0, 1 - shoot.life / 1.1)
        g.addColorStop(0, `rgba(255,255,255,${0.9 * fade})`)
        g.addColorStop(1, 'rgba(255,255,255,0)')
        c.strokeStyle = g
        c.lineWidth = 1.6
        c.beginPath()
        c.moveTo(x, y)
        c.lineTo(x - shoot.vx * 260, y - shoot.vy * 260)
        c.stroke()
        if (shoot.life > 1.1) shoot = null
      }
    },
  }
}

function aurora(): Scene {
  const bands = [
    { y: 0.32, amp: 0.06, f: 1.6, s: 0.12, col: [80, 255, 170], h: 0.28 },
    { y: 0.42, amp: 0.05, f: 2.3, s: -0.09, col: [120, 200, 255], h: 0.22 },
    { y: 0.28, amp: 0.07, f: 1.1, s: 0.07, col: [190, 110, 255], h: 0.2 },
  ]
  return {
    filter: 'blur(14px)',
    dpr: 0.5,
    draw(c, t, w, h) {
      c.clearRect(0, 0, w, h)
      c.globalCompositeOperation = 'lighter'
      for (const b of bands) {
        for (let x = 0; x <= w; x += 6) {
          const u = x / w
          const y = (b.y + b.amp * Math.sin(u * TAU * b.f + t * b.s * TAU) + 0.03 * Math.sin(u * 17 + t * 0.7)) * h
          const len = b.h * h * (0.6 + 0.4 * Math.sin(u * 9 + t * 0.5))
          const a = 0.25 * (0.6 + 0.4 * Math.sin(u * 13 - t * 0.9 + b.f))
          const g = c.createLinearGradient(0, y, 0, y + len)
          g.addColorStop(0, `rgba(${b.col.join(',')},0)`)
          g.addColorStop(0.2, `rgba(${b.col.join(',')},${a})`)
          g.addColorStop(1, `rgba(${b.col.join(',')},0)`)
          c.fillStyle = g
          c.fillRect(x, y, 6, len)
        }
      }
      c.globalCompositeOperation = 'source-over'
    },
  }
}

function lava(): Scene {
  const cols = ['#ff4f8b', '#ff9f43', '#a855f7', '#f43f5e', '#fb7185', '#c084fc', '#f97316']
  const blobs = cols.map((col, i) => ({ col, x: R(), y: R(), r: 0.12 + R() * 0.12, sx: 0.03 + R() * 0.05, sy: 0.04 + R() * 0.06, p: i * 1.7 }))
  return {
    filter: 'blur(40px) saturate(1.2)',
    dpr: 0.5,
    draw(c, t, w, h) {
      c.clearRect(0, 0, w, h)
      const m = Math.min(w, h)
      for (const b of blobs) {
        const x = (0.5 + 0.42 * Math.sin(t * b.sx * TAU + b.p)) * w
        const y = (0.5 + 0.45 * Math.sin(t * b.sy * TAU + b.p * 1.3)) * h
        c.fillStyle = b.col
        c.globalAlpha = 0.8
        c.beginPath()
        c.arc(x, y, b.r * m * (1 + 0.15 * Math.sin(t + b.p)), 0, TAU)
        c.fill()
      }
      c.globalAlpha = 1
    },
  }
}

function snow(): Scene {
  const flakes = Array.from({ length: 200 }, () => ({ x: R(), y: R(), r: 0.6 + Math.pow(R(), 2) * 2.8, p: R() * TAU }))
  let last = 0
  return {
    draw(c, t, w, h) {
      const dt = last ? Math.min(0.1, t - last) : 0
      last = t
      c.clearRect(0, 0, w, h)
      for (const f of flakes) {
        f.y += (dt * (12 + f.r * 14)) / h
        f.x += (dt * Math.sin(t * 0.6 + f.p) * 10) / w
        if (f.y > 1.02) {
          f.y = -0.02
          f.x = R()
        }
        c.fillStyle = `rgba(255,255,255,${0.35 + f.r / 5})`
        c.beginPath()
        c.arc(f.x * w, f.y * h, f.r, 0, TAU)
        c.fill()
      }
    },
  }
}

function fireflies(): Scene {
  const list = Array.from({ length: 46 }, () => ({ x: R(), y: 0.35 + R() * 0.65, vx: 0, vy: 0, p: R() * TAU, s: 0.4 + R() * 0.8 }))
  let last = 0
  return {
    draw(c, t, w, h) {
      const dt = last ? Math.min(0.1, t - last) : 0
      last = t
      c.clearRect(0, 0, w, h)
      for (const f of list) {
        f.vx += (R() - 0.5) * 0.02 * dt * 30
        f.vy += (R() - 0.5) * 0.02 * dt * 30
        f.vx *= 0.96
        f.vy *= 0.96
        f.x = (f.x + f.vx * dt * 0.6 + 1) % 1
        f.y = Math.min(1, Math.max(0.25, f.y + f.vy * dt * 0.6))
        const a = Math.max(0, Math.sin(t * f.s + f.p))
        const x = f.x * w
        const y = f.y * h
        const g = c.createRadialGradient(x, y, 0, x, y, 14)
        g.addColorStop(0, `rgba(230,255,150,${0.9 * a})`)
        g.addColorStop(0.25, `rgba(200,255,120,${0.35 * a})`)
        g.addColorStop(1, 'rgba(200,255,120,0)')
        c.fillStyle = g
        c.beginPath()
        c.arc(x, y, 14, 0, TAU)
        c.fill()
      }
    },
  }
}

function rain(): Scene {
  const drops = Array.from({ length: 220 }, () => ({ x: R(), y: R(), z: 0.3 + R() * 0.7 }))
  const splashes: { x: number; life: number }[] = []
  let last = 0
  return {
    draw(c, t, w, h) {
      const dt = last ? Math.min(0.1, t - last) : 0
      last = t
      c.clearRect(0, 0, w, h)
      c.lineCap = 'round'
      for (const d of drops) {
        d.y += (dt * (900 * d.z)) / h
        d.x += (dt * 60 * d.z) / w
        if (d.y > 1) {
          if (d.z > 0.8 && splashes.length < 40) splashes.push({ x: d.x, life: 0 })
          d.y = -0.05
          d.x = R()
        }
        c.strokeStyle = `rgba(190,215,255,${0.12 + d.z * 0.3})`
        c.lineWidth = d.z * 1.4
        c.beginPath()
        c.moveTo(d.x * w, d.y * h)
        c.lineTo(d.x * w - 3 * d.z, d.y * h - 22 * d.z)
        c.stroke()
      }
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i]
        s.life += dt
        const r = 2 + s.life * 30
        c.strokeStyle = `rgba(190,215,255,${Math.max(0, 0.4 - s.life)})`
        c.beginPath()
        c.ellipse(s.x * w, h - 4, r, r * 0.25, 0, 0, TAU)
        c.stroke()
        if (s.life > 0.4) splashes.splice(i, 1)
      }
    },
  }
}

function waves(): Scene {
  const layers = [
    { y: 0.62, a: 0.018, f: 2.2, s: 0.05, col: 'rgba(90,70,140,0.55)' },
    { y: 0.68, a: 0.022, f: 3.1, s: -0.07, col: 'rgba(60,55,120,0.65)' },
    { y: 0.75, a: 0.026, f: 2.6, s: 0.09, col: 'rgba(40,45,100,0.75)' },
    { y: 0.83, a: 0.03, f: 1.8, s: -0.11, col: 'rgba(25,32,78,0.85)' },
    { y: 0.91, a: 0.034, f: 2.9, s: 0.13, col: 'rgba(14,20,52,0.95)' },
  ]
  return {
    draw(c, t, w, h) {
      c.clearRect(0, 0, w, h)
      const sx = w * 0.5
      const sy = h * 0.58
      const g = c.createRadialGradient(sx, sy, 0, sx, sy, h * 0.35)
      g.addColorStop(0, 'rgba(255,236,190,0.95)')
      g.addColorStop(0.15, 'rgba(255,200,150,0.6)')
      g.addColorStop(1, 'rgba(255,160,130,0)')
      c.fillStyle = g
      c.fillRect(0, 0, w, h)
      for (const l of layers) {
        c.fillStyle = l.col
        c.beginPath()
        c.moveTo(0, h)
        for (let x = 0; x <= w; x += 8) {
          const u = x / w
          c.lineTo(x, (l.y + l.a * Math.sin(u * TAU * l.f + t * l.s * TAU) + l.a * 0.5 * Math.sin(u * TAU * l.f * 2.3 - t * l.s * 4)) * h)
        }
        c.lineTo(w, h)
        c.closePath()
        c.fill()
      }
    },
  }
}

function bokeh(): Scene {
  const cols = ['255,170,200', '170,200,255', '255,220,170', '200,170,255', '170,255,230']
  const list = Array.from({ length: 30 }, () => ({ x: R(), y: R(), r: 20 + R() * 80, c: cols[Math.floor(R() * cols.length)], vx: (R() - 0.5) * 0.01, vy: (R() - 0.5) * 0.008, p: R() * TAU }))
  let last = 0
  return {
    filter: 'blur(6px)',
    draw(c, t, w, h) {
      const dt = last ? Math.min(0.1, t - last) : 0
      last = t
      c.clearRect(0, 0, w, h)
      for (const b of list) {
        b.x = (b.x + b.vx * dt + 1.2) % 1.2
        b.y = (b.y + b.vy * dt + 1.2) % 1.2
        const a = 0.12 + 0.1 * Math.sin(t * 0.5 + b.p)
        const x = b.x * w - 0.1 * w
        const y = b.y * h - 0.1 * h
        c.fillStyle = `rgba(${b.c},${a})`
        c.beginPath()
        c.arc(x, y, b.r, 0, TAU)
        c.fill()
        c.strokeStyle = `rgba(${b.c},${a * 1.5})`
        c.lineWidth = 1.5
        c.stroke()
      }
    },
  }
}

function makeScene(kind: AnimKind, themeId: string): Scene | null {
  switch (kind) {
    case 'clouds': return clouds(themeId.includes('soir'))
    case 'stars': return stars()
    case 'aurora': return aurora()
    case 'lava': return lava()
    case 'snow': return snow()
    case 'fireflies': return fireflies()
    case 'rain': return rain()
    case 'waves': return waves()
    case 'bokeh': return bokeh()
    default: return null
  }
}

export function AnimatedLayer({ kind, themeId, still }: { kind: AnimKind; themeId: string; still: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const scene = makeScene(kind, themeId)
    if (!scene) return
    const c = canvas.getContext('2d')
    if (!c) return
    canvas.style.filter = scene.filter || ''
    const dpr = scene.dpr ?? 1
    let w = 0
    let h = 0
    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)
    let raf = 0
    let lastFrame = 0
    const t0 = performance.now()
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (now - lastFrame < 33) return // ~30 i/s suffisent pour un fond
      lastFrame = now
      scene.draw(c, (now - t0) / 1000, w, h)
    }
    if (still || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      // une image fixe, en avançant un peu le temps pour que la scène soit « installée »
      for (let i = 0; i < 40; i++) scene.draw(c, 8 + i / 30, w, h)
    } else raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [kind, themeId, still])

  return <canvas ref={ref} className="bg-canvas" aria-hidden="true" />
}
