import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Cta } from '../lib/opening'
import { ApplyPill } from './ApplyPill'

// The fixed chrome of #10: logo on its night plate, "Distance to the 600", the waypoint rail, the sticky Apply pill.
// shortcut: the sound toggle waits for its loop asset (docs/assets.md, Missing); a toggle with no sound would be a placeholder.

const WAYPOINTS = [
  { id: 'top', name: 'Start' },
  { id: 'the-600', name: 'The 600' },
  { id: 'departments', name: 'Departments' },
  { id: 'club-life', name: 'Club life' },
  { id: 'events', name: 'Events' },
  { id: 'join', name: 'How to join' },
  { id: 'apply', name: 'Your place' },
]

const START = 48 // the readout's distance at the top of the page, as in the hero comp

/** The light band: the light act plus the lighter half of each horizon around it. */
const overLight = (y: number) => {
  const el = document.getElementById('lightact')
  if (!el) return false
  const r = el.getBoundingClientRect()
  const h = (el.previousElementSibling as HTMLElement | null)?.offsetHeight ?? 0
  return r.top - h / 2 <= y && r.bottom + h / 2 >= y
}

export function Chrome({ cta }: { cta: Cta }) {
  const [now, setNow] = useState(0)
  const [lit, setLit] = useState({ rail: false, readout: false, logo: false })
  const [pillHidden, setPillHidden] = useState(true)
  const dist = useRef<HTMLElement>(null)

  useEffect(() => {
    const sections = WAYPOINTS.map((w) => document.getElementById(w.id))
    const footer = document.getElementById('footer')
    const ctas = ['hero-cta', 'close-cta'].map((id) => document.getElementById(id))
    let raf = 0
    const update = () => {
      raf = 0
      const vh = innerHeight
      // the current waypoint: the last act whose top has reached 45% of the screen (#16)
      let i = 0
      sections.forEach((s, k) => {
        if (s && s.getBoundingClientRect().top <= vh * 0.45) i = k
      })
      setNow(i)

      const close = sections[sections.length - 1]
      const end = close ? close.getBoundingClientRect().top + scrollY : 1
      const p = Math.min(1, Math.max(0, scrollY / Math.max(1, end)))
      if (dist.current) dist.current.textContent = (START * (1 - p)).toFixed(1)

      const footerIn = footer ? footer.getBoundingClientRect().top < vh * 0.9 : false
      const next = { rail: overLight(vh / 2), readout: overLight(40), logo: overLight(90) || footerIn }
      // keep the same object when nothing changed, so React skips the re-render on most scroll frames
      setLit((l) => (l.rail === next.rail && l.readout === next.readout && l.logo === next.logo ? l : next))
      setPillHidden(ctas.some((c) => c && c.getBoundingClientRect().bottom > 0 && c.getBoundingClientRect().top < vh))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    return () => {
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <header>
      <a className="skip" href="#apply">
        Skip to Apply
      </a>
      <div className={`logoplate ${lit.logo ? 'away' : ''}`} aria-hidden="true" />
      <a className={`logo ${lit.logo ? 'away' : ''}`} href="#top" tabIndex={lit.logo ? -1 : undefined}>
        <img src="/brand/vic-logo-white.svg" alt="Vision & Innovation Club, back to top" width="85" height="34" />
      </a>
      <div className={`readout ${lit.readout ? 'lit' : ''}`} aria-hidden="true">
        Distance to the 600
        <b ref={dist}>{START.toFixed(1)}</b>
      </div>
      <nav className={`rail ${lit.rail ? 'lit' : ''}`} aria-label="Waypoints" style={{ '--fill': `${(now / (WAYPOINTS.length - 1)) * 100}%` } as CSSProperties}>
        {WAYPOINTS.map((w, k) => (
          <a key={w.id} href={`#${w.id}`} className={`${k <= now ? 'on' : ''} ${k === now ? 'now' : ''}`} aria-current={k === now ? 'location' : undefined}>
            <i aria-hidden="true" />
            <span>{w.name}</span>
          </a>
        ))}
      </nav>
      <ApplyPill cta={cta} className={`corner ${pillHidden ? 'hide' : ''}`} inert={pillHidden} />
    </header>
  )
}
