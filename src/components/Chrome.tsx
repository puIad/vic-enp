import { useEffect, useRef, useState } from 'react'
import type { Cta } from '../lib/opening'
import { RAIL, subAt } from '../lib/rail'
import { ApplyPill } from './ApplyPill'
import { Rail } from './Rail'

// The fixed chrome of #10: logo on its night plate, "Distance to the 600", the waypoint rail (Rail), the sticky Apply pill.

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
  const [sub, setSub] = useState(-1)
  const [landed, setLanded] = useState(false)
  const [lit, setLit] = useState({ rail: false, readout: false, logo: false })
  const [pillHidden, setPillHidden] = useState(true)
  const dist = useRef<HTMLElement>(null)

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      // looked up each time: the staged acts replace their tier 0 sections after first paint
      const sections = RAIL.map((w) => document.getElementById(w.id))
      const footer = document.getElementById('footer')
      const ctas = ['hero-cta', 'close-cta'].map((id) => document.getElementById(id))
      const vh = innerHeight
      // the current waypoint: the last act whose top has reached 45% of the screen (#16)
      let i = 0
      sections.forEach((s, k) => {
        if (s && s.getBoundingClientRect().top <= vh * 0.45) i = k
      })
      setNow(i)
      // the act's sub-section: a staged run's cut from its pin, otherwise the blocks' tops (tier 0's cards, the light act)
      const act = RAIL[i]
      const sec = sections[i]
      if (!act.subs.length || !sec) setSub(-1)
      else if (act.run && sec.matches('[data-pin]'))
        setSub(subAt(act, { progress: Math.min(1, Math.max(0, -sec.getBoundingClientRect().top / Math.max(1, sec.offsetHeight - vh))) }))
      else setSub(subAt(act, { tops: act.subs.map((s) => document.getElementById(s.id)?.getBoundingClientRect().top ?? Infinity), vh }))
      // the rail lands in the footer's "Jump back to": the fixed one fades as the list arrives
      const list = document.getElementById('jump-back')
      setLanded(list ? list.getBoundingClientRect().top < vh : false)

      const close = sections[sections.length - 1]
      const end = close ? close.getBoundingClientRect().top + scrollY : 1
      const p = Math.min(1, Math.max(0, scrollY / Math.max(1, end)))
      if (dist.current) dist.current.textContent = (START * (1 - p)).toFixed(1)

      const footerIn = footer ? footer.getBoundingClientRect().top < vh * 0.9 : false
      const next = { rail: overLight(vh / 2), readout: overLight(40), logo: overLight(90) || footerIn }
      // keep the same object when nothing changed, so React skips the re-render on most scroll frames
      setLit((l) => (l.rail === next.rail && l.readout === next.readout && l.logo === next.logo ? l : next))
      // a CTA counts while it is on screen and visible: the hero's fades out over the world's hand-over (#11)
      setPillHidden(ctas.some((c) => c && c.getBoundingClientRect().bottom > 0 && c.getBoundingClientRect().top < vh && +getComputedStyle(c).opacity > 0.5))
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
      <Rail now={now} sub={sub} lit={lit.rail} landed={landed} />
      <ApplyPill cta={cta} className={`corner ${pillHidden ? 'hide' : ''}`} inert={pillHidden} />
    </header>
  )
}
