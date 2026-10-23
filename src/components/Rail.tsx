import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { nextFlash, RAIL, ROWS, rowAt, type Flash } from '../lib/rail'
import { onRailLink } from './railLink'

// The waypoint rail (docs/experience.md, The rail; #59): act dots, the current act's sub-dots as ticks, a name flashing
// for about 2 s on entering an act or a sub-section, every name on hover or keyboard focus (desktop) or on a hold
// (phones). It fades as the footer's "Jump back" arrives (`landed`), and never opens on its own (decision 113).

const FLASH_MS = 2000
const HOLD_MS = 400

const phone = () => matchMedia('(max-width: 767px)').matches

type Ring = { x: number; y: number }

export function Rail({ now, sub, lit, landed }: { now: number; sub: number; lit: boolean; landed: boolean }) {
  const nav = useRef<HTMLElement>(null)
  const [flash, setFlash] = useState<Flash | null>(null)
  const [sheet, setSheet] = useState(false) // phones: the hold's rows over the scrim
  const [litRow, setLitRow] = useState(-1)
  const [ring, setRing] = useState<Ring | null>(null)

  // the flashes: nextFlash decides, a timer clears each one after about 2 s
  const spot = useRef({ act: now, sub })
  const shown = useRef<Flash | null>(null)
  const fade = useRef(0)
  useEffect(() => {
    const next = nextFlash(shown.current, spot.current, { act: now, sub })
    spot.current = { act: now, sub }
    if (next === shown.current) return
    shown.current = next
    setFlash(next)
    clearTimeout(fade.current)
    fade.current = window.setTimeout(() => {
      shown.current = null
      setFlash(null)
    }, FLASH_MS)
  }, [now, sub])
  useEffect(() => () => clearTimeout(fade.current), [])

  // the lit line runs to the current act's dot, wherever the ticks and the open rows have put it: after each render,
  // and whenever the rail changes size, since hover and focus open the rows in CSS alone
  const fill = () => {
    const dot = nav.current?.querySelector<HTMLElement>(':scope > a.now')
    const first = nav.current?.querySelector<HTMLElement>(':scope > a')
    nav.current?.style.setProperty('--fill', dot && first ? `${dot.offsetTop - first.offsetTop}px` : '0px')
  }
  useLayoutEffect(fill)
  useEffect(() => {
    const ro = new ResizeObserver(() => fill())
    if (nav.current) ro.observe(nav.current)
    return () => ro.disconnect()
  }, [])

  // the hold (phones): about 0.4 s on the rail, a ring filling under the finger, opens the rows. Slide and release on a
  // name, or lift and tap one. A plain tap is left alone, so its click jumps. Touch events, not pointer events: only a
  // cancelled touchmove keeps the page from scrolling under a slide.
  const pick = useRef(-1)
  useEffect(() => {
    const el = nav.current
    if (!el) return
    let timer = 0
    let start: Ring | null = null
    let held = false
    let slid = false
    const light = (y: number) => {
      // against the rows' own box: the screen's height can differ from innerHeight while iOS shows its URL bar
      const box = document.querySelector('.rail-sheet ol')?.getBoundingClientRect()
      pick.current = box ? rowAt(y - box.top, box.height) : rowAt(y, innerHeight)
      setLitRow(pick.current)
    }
    const reset = () => {
      clearTimeout(timer)
      start = null
      setRing(null)
    }
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || !phone()) return reset()
      const t = e.touches[0]
      start = { x: t.clientX, y: t.clientY }
      held = false
      slid = false
      setRing(start)
      timer = window.setTimeout(() => {
        held = true
        setRing(null)
        setSheet(true)
        if (start) light(start.y)
      }, HOLD_MS)
    }
    const onMove = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!start || !t) return
      if (!held) {
        // the finger moved off before the hold: a scroll, so let it be one
        if (Math.hypot(t.clientX - start.x, t.clientY - start.y) > 10) reset()
        return
      }
      e.preventDefault()
      if (Math.abs(t.clientY - start.y) > 8) slid = true
      light(t.clientY)
    }
    const onEnd = (e: TouchEvent) => {
      const wasHeld = held
      held = false
      reset()
      if (!wasHeld) return
      e.preventDefault() // no click on the dot under the finger: the rows are open now
      // after the touch ends everywhere: Lenis's own touchend (on window, after this one) would stop the jump's scroll
      const row = pick.current
      if (slid) setTimeout(() => document.querySelector<HTMLAnchorElement>(`.rail-sheet a[data-row="${row}"]`)?.click())
    }
    // no Android press menu on the rail's links; a mouse keeps its right-click menu (open in a new tab, copy the link)
    const noMenu = (e: Event) => phone() && e.preventDefault()
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: false })
    el.addEventListener('touchcancel', reset)
    el.addEventListener('contextmenu', noMenu)
    return () => {
      reset()
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', reset)
      el.removeEventListener('contextmenu', noMenu)
    }
  }, [])

  const close = () => {
    setSheet(false)
    setLitRow(-1)
  }
  // the rows close on a scroll (past a little drift, so Lenis settling doesn't close them)
  useEffect(() => {
    if (!sheet) return
    const y0 = scrollY
    const onScroll = () => Math.abs(scrollY - y0) > 40 && close()
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [sheet])

  const cutName = flash && flash.sub < 0 && flash.namesCut !== undefined ? RAIL[flash.act].subs[flash.namesCut].name : null

  return (
    <>
      <nav
        ref={nav}
        className={`rail ${lit ? 'lit' : ''} ${landed ? 'away' : ''}`}
        aria-label="Waypoints"
        inert={landed}
      >
        {RAIL.map((a, k) => {
          const flashing = flash?.act === k
          return (
            <Fragment key={a.id}>
              <a
                href={`#${a.id}`}
                className={`${k <= now ? 'on' : ''} ${k === now ? 'now' : ''} ${flashing && flash.sub < 0 ? 'flash' : ''}`}
                aria-current={k === now ? 'location' : undefined}
                draggable={false}
                onClick={() => setSheet(false)}
              >
                <i aria-hidden="true" />
                <span>
                  {a.name}
                  {flashing && cutName && <em aria-hidden="true"> · {cutName}</em>}
                </span>
              </a>
              {a.subs.length > 0 && (
                // sub-dots stay out of the tab order: the pickers and the footer list reach every sub-section (78)
                <div className={`rail-subs ${k === now ? 'cur' : ''}`}>
                  {a.subs.map((s, t) => {
                    const here = k === now
                    return (
                      <a
                        key={s.id}
                        href={`#${s.id}`}
                        tabIndex={-1}
                        draggable={false}
                        className={`${here && t <= sub ? 'on' : ''} ${here && t === sub ? 'now' : ''} ${flashing && flash.sub === t ? 'flash' : ''}`}
                        onClick={(e) => onRailLink(e, s.id)}
                      >
                        <b aria-hidden="true" />
                        <span>{s.name}</span>
                      </a>
                    )
                  })}
                </div>
              )}
            </Fragment>
          )
        })}
      </nav>
      {ring && <div className="rail-ring" aria-hidden="true" style={{ left: ring.x, top: ring.y } as CSSProperties} />}
      {sheet && (
        // the hold's rows: a touch view of the rail's own links, so it stays out of the reading order
        <div className="rail-sheet" aria-hidden="true" onContextMenu={(e) => e.preventDefault()}>
          <div className="rail-scrim" onClick={close} />
          <ol>
            {ROWS.map((r, i) => (
              <li key={r.id} style={{ flexGrow: r.share }} className={r.sub < 0 ? 'act' : 'sub'}>
                <a
                  href={`#${r.id}`}
                  data-row={i}
                  tabIndex={-1}
                  draggable={false}
                  className={`${i === litRow ? 'lit' : ''} ${r.act === now && (r.sub < 0 || r.sub === sub) ? 'here' : ''}`}
                  onClick={(e) => {
                    close()
                    onRailLink(e, r.id)
                  }}
                >
                  <i />
                  {r.name}
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  )
}
