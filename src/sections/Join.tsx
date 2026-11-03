import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import type { SiteState } from '../calendar'
import { INSTAGRAM } from '../config'
import { faq, RUNGS, STEPS } from '../content/join'
import { closing, useNow } from '../lib/opening'
import { reached, walkAt } from '../lib/walk'
import { world } from '../world/store'

// Act 6, the light act (#16): how to join, then grow, then the questions, on Bright Gray between two horizons.
// Tier 0 and reduced motion: every block visible, every step node filled, no walking point. With the world (#39): your
// point walks the steps' hairline and the blocks reveal once as they come in (index.css, the light act with the world).

const WIDE = '(min-width: 1280px)'
const PHONE = '(max-width: 767px)'

/** Moves your point along the steps' hairline (--k) and fills the nodes it has reached (data-on), after every scroll
 *  update. Between a phone and a wide screen the steps sit in two columns with no hairline, so nothing walks. */
function useWalk(ref: RefObject<HTMLDivElement | null>, on: boolean) {
  useEffect(() => {
    const box = ref.current
    if (!on || !box) return
    const wideQ = matchMedia(WIDE)
    const phoneQ = matchMedia(PHONE)
    const items = [...box.querySelectorAll('li')]
    const nodes = [...box.querySelectorAll<HTMLElement>('.node')]
    let last = ''
    const update = () => {
      const wide = wideQ.matches
      const r = box.getBoundingClientRect()
      const k = walkAt(r.top, r.height, innerHeight).toFixed(3)
      // each node's middle, measured along the hairline from its start
      const stops = nodes.map((n) => {
        const b = n.getBoundingClientRect()
        return wide ? b.left + b.width / 2 - r.left : b.top + b.height / 2 - r.top
      })
      const lit = wide || phoneQ.matches ? reached(+k, wide ? r.width : r.height, stops) : items.length
      const now = `walk ${k}, steps ${lit}`
      if (now === last) return
      last = now
      box.style.setProperty('--k', k)
      items.forEach((li, i) => li.toggleAttribute('data-on', i < lit))
      // for scroll-craft's shoot.mjs, under automation only (docs/quality.md)
      if (navigator.webdriver) box.dataset.scVerifyState = now
    }
    update()
    world.listeners.add(update)
    addEventListener('resize', update)
    return () => {
      world.listeners.delete(update)
      removeEventListener('resize', update)
    }
  }, [ref, on])
}

/** Shows each block marked data-rv once, as it comes up past the bottom 8% of the screen, and never hides it again.
 *  Blocks already above the screen (a reload partway down) show at once, without travelling. */
function useReveal(ref: RefObject<HTMLDivElement | null>, on: boolean) {
  useEffect(() => {
    const root = ref.current
    if (!on || !root) return
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          if (!e.isIntersecting && e.boundingClientRect.top > 0) continue
          if (!e.isIntersecting) e.target.setAttribute('data-still', '')
          e.target.setAttribute('data-in', '')
          io.unobserve(e.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    root.querySelectorAll('[data-rv]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [ref, on])
}

const UNITS = [
  ['d', 'day', 'days'],
  ['h', 'hour', 'hours'],
  ['m', 'minute', 'minutes'],
  ['s', 'second', 'seconds'],
] as const

/** `shown` with `held` under it in one grid cell, so the block is as tall as the taller of the two whichever shows: the
 *  open phase and the off-season hold each other's height, and the page doesn't move at the flip (docs/site-states.md,
 *  The page). The held one is neither seen nor read. */
function Hold({ shown, held, className = '' }: { shown: ReactNode; held: ReactNode; className?: string }) {
  return (
    <div className={`grid ${className}`}>
      <div className="[grid-area:1/1]">{shown}</div>
      <div aria-hidden="true" className="invisible [grid-area:1/1]">
        {held}
      </div>
    </div>
  )
}

const OPEN_LEAD = 'Every ENP student can apply, in any year and any specialty. Applications open 26 October 2026 at 18:00 and close 4 November at 23:59.'
const OFF_LEAD = 'Every ENP student can apply, in any year and any specialty. The steps below are how it works once applications open.'

/** The act's lead: the dates while recruiting, the off-season's words from the close, each holding the other's lines.
 *  Before opening it stands alone, as it always has. */
function Lead({ state }: { state: SiteState }) {
  const lead = (words: string) => <p className="t-lead text-ink">{words}</p>
  if (state === 'before') return <div className="mt-5">{lead(OPEN_LEAD)}</div>
  const off = state === 'off'
  return <Hold className="mt-5" shown={lead(off ? OFF_LEAD : OPEN_LEAD)} held={lead(off ? OPEN_LEAD : OFF_LEAD)} />
}

const CLOSED_LINE = (
  <p className="t-lead font-bold text-night">
    Applications are closed. The next recruitment is announced on <a href={INSTAGRAM}>@vic.enp</a>.
  </p>
)

/** The countdown to CLOSES_AT under the act's lead, ticking each second; from the close, the line that applications are
 *  closed, holding the countdown's height; before opening, nothing. */
function Closing() {
  const c = closing(useNow(1000))
  if (c.state === 'soon') return null
  if (c.state === 'closed') return <Hold className="mt-8 md:mt-10" shown={CLOSED_LINE} held={<Countdown d={0} h={0} m={0} s={0} />} />
  return <Hold className="mt-8 md:mt-10" shown={<Countdown {...c} />} held={CLOSED_LINE} />
}

/** Screen readers get one sentence to the minute, not a number changing each second. */
function Countdown(c: { d: number; h: number; m: number; s: number }) {
  const said = (['d', 'h', 'm'] as const).filter((k) => c[k] || k === 'm').map((k) => {
    const [, one, many] = UNITS.find((u) => u[0] === k)!
    return `${c[k]} ${c[k] === 1 ? one : many}`
  })
  return (
    <div>
      <p className="flex items-center gap-2.5 text-[13px] font-bold text-ink">
        <span aria-hidden="true" className="closing-dot" />
        Applications close in<span className="sr-only"> {said.join(', ')}</span>
      </p>
      <p aria-hidden="true" className="mt-3 flex gap-[clamp(18px,3vw,40px)]">
        {UNITS.map(([k, one, many]) => (
          <span key={k} className="flex flex-col">
            <span className="tab text-[clamp(44px,5vw,72px)] leading-[.9] font-black tracking-[-0.03em]">
              {k === 'd' ? c[k] : String(c[k]).padStart(2, '0')}
            </span>
            <span className="mt-2 text-[13px] font-bold text-ink">{c[k] === 1 ? one : many}</span>
          </span>
        ))}
      </p>
    </div>
  )
}

function Steps({ staged }: { staged: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useWalk(ref, staged)
  return (
    <div ref={ref} className={`relative mt-12 md:mt-16 ${staged ? 'walking' : ''}`}>
      <ol
        id="steps"
        className={`grid gap-10 max-md:border-l max-md:border-night/30 max-md:pl-7 md:grid-cols-2 md:gap-x-8 md:gap-y-14 xl:grid-cols-4 xl:border-t xl:pt-0 ${staged ? 'xl:border-night/30' : 'xl:border-night/70'}`}
      >
        {STEPS.map((s, i) => (
          <li key={s.title} data-rv={staged || undefined} className="relative xl:pt-12">
            {/* the node on the hairline: left edge on a phone, top edge on a wide screen; with the world it fills once
                your point reaches it (index.css) */}
            <span
              aria-hidden="true"
              className={`node absolute top-2 -left-[33px] size-[11px] rounded-full md:hidden xl:-top-[6px] xl:left-0 xl:block ${staged ? '' : 'bg-night'}`}
            />
            <span aria-hidden="true" className="block text-[76px] leading-[.9] ghost font-black tracking-[-0.03em] md:text-[clamp(84px,7.5vw,112px)]">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="mt-4 text-[clamp(22px,1.9vw,27px)] leading-tight font-black tracking-[-0.015em]">{s.title}</h3>
            <p className="mt-2.5 max-w-[30ch] text-[15px] leading-normal text-ink">{s.text}</p>
          </li>
        ))}
      </ol>
      {staged && (
        <>
          {/* the trail behind your point, and your point */}
          <span aria-hidden="true" className="walk" />
          <span aria-hidden="true" className="me" />
        </>
      )}
    </div>
  )
}

function Grow({ staged }: { staged: boolean }) {
  return (
    <ol className="mt-12 grid gap-8 max-md:border-l max-md:border-night/30 max-md:pl-7 md:mt-20 md:grid-cols-3 md:gap-x-6 md:gap-y-12 xl:grid-cols-6 xl:items-start xl:gap-x-0">
      {RUNGS.map((r, i) => (
        <li
          key={r.title}
          data-rv={staged || undefined}
          // a staircase rising to the right (desktop only): each tread one step above the last, joined by a riser
          className="relative xl:mt-(--drop)"
          style={{ '--drop': `${(RUNGS.length - 1 - i) * 52}px` } as CSSProperties}
        >
          <span aria-hidden="true" className="absolute top-1.5 -left-[33px] size-[11px] rounded-full bg-night md:hidden" />
          <span aria-hidden="true" className="relative hidden h-0.5 bg-night md:block">
            {i < RUNGS.length - 1 && <span className="absolute right-0 bottom-0 hidden h-[54px] w-0.5 bg-night xl:block" />}
            <span
              className={`absolute -top-[4.5px] -left-0.5 size-[11px] rounded-full ${i === RUNGS.length - 1 ? 'bg-aqua ring-2 ring-night' : 'bg-night'}`}
            />
          </span>
          <h3 className="text-[19px] leading-tight font-black md:mt-4 xl:pr-4 xl:pl-4">{r.title}</h3>
          <p className="mt-2 max-w-[24ch] text-[15px] leading-normal text-ink xl:pr-4 xl:pl-4">{r.text}</p>
        </li>
      ))}
    </ol>
  )
}

function Faq({ state }: { state: SiteState }) {
  const FAQ = faq(state)
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]))
  const base = useId()
  const toggle = (i: number) =>
    setOpen((o) => {
      const n = new Set(o)
      if (n.has(i)) n.delete(i)
      else n.add(i)
      return n
    })
  // ArrowUp, ArrowDown, Home and End move between questions (#16)
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const last = FAQ.length - 1
    const to = { ArrowDown: i === last ? 0 : i + 1, ArrowUp: i === 0 ? last : i - 1, Home: 0, End: last }[e.key]
    if (to === undefined) return
    e.preventDefault()
    document.getElementById(`${base}-q${to}`)?.focus()
  }
  return (
    <ul className="border-b border-(--line-dark)">
      {FAQ.map((f, i) => {
        const isOpen = open.has(i)
        return (
          <li key={f.q} className="border-t border-(--line-dark)">
            <h3>
              <button
                id={`${base}-q${i}`}
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${base}-a${i}`}
                onClick={() => toggle(i)}
                onKeyDown={(e) => onKey(e, i)}
                className="group flex w-full cursor-pointer items-start justify-between gap-5 py-5 text-left text-[17px] leading-snug font-bold md:text-[19px]"
              >
                {f.q}
                <span
                  aria-hidden="true"
                  className={`mt-1.5 size-2.5 flex-none border-r-[1.5px] border-b-[1.5px] border-night transition-transform duration-300 ${isOpen ? '-rotate-135' : 'rotate-45 group-hover:translate-y-0.5'}`}
                />
              </button>
            </h3>
            <div id={`${base}-a${i}`} role="region" aria-labelledby={`${base}-q${i}`} hidden={!isOpen} className="pb-6">
              <p className="max-w-[62ch] text-base text-ink">
                {f.a}
                {f.link && (
                  <>
                    {' '}
                    <a href={f.link.href}>{f.link.label}</a>.
                  </>
                )}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** `state` is the CTA's, repainted every 15 s: the lead and the FAQ follow it; the countdown keeps its own 1 s clock. */
export function Join({ staged, state }: { staged: boolean; state: SiteState }) {
  const ref = useRef<HTMLDivElement>(null)
  useReveal(ref, staged)
  const rv = staged || undefined
  return (
    <>
      <div className="horizon" aria-hidden="true" />
      <div ref={ref} id="lightact" className="lightact">
        <section id="join" aria-labelledby="h-join" className="wrap pt-10 pb-20 md:pt-14 md:pr-[150px] md:pb-24">
          <h2 id="h-join" data-rv={rv} className="t-act text-night">
            How to join.
          </h2>
          <div data-rv={rv}>
            <Lead state={state} />
          </div>
          {/* a wrapper always on the page, so the reveal finds it whatever the countdown shows */}
          <div data-rv={rv}>
            <Closing />
          </div>
          <Steps staged={staged} />
        </section>

        <section id="grow" aria-labelledby="h-grow" className="wrap border-t border-(--line-dark) py-20 md:mr-[150px] md:ml-(--gut) md:px-0 md:py-28">
          <h2 id="h-grow" data-rv={rv} className="t-act text-night">
            Then grow.
          </h2>
          <p data-rv={rv} className="t-lead mt-5 text-ink">Joining is the start. Here is where members go next.</p>
          <Grow staged={staged} />
        </section>

        <section id="faq" aria-labelledby="h-faq" className="wrap border-t border-(--line-dark) pt-20 pb-28 md:mr-[150px] md:ml-(--gut) md:px-0 md:pt-28 md:pb-36">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
              <h2 id="h-faq" data-rv={rv} className="t-act text-night">
                Questions.
              </h2>
              <p data-rv={rv} className="t-lead mt-5 text-ink">
                Still unsure? Message us on Instagram, <a href={INSTAGRAM}>@vic.enp</a>.
              </p>
            </div>
            <div data-rv={rv} className="lg:col-span-8">
              <Faq state={state} />
            </div>
          </div>
        </section>
      </div>
      <div className="horizon down" aria-hidden="true" />
    </>
  )
}
