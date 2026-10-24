import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type RefObject } from 'react'
import { INSTAGRAM } from '../config'
import { FAQ, RUNGS, STEPS } from '../content/join'
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

function Faq() {
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

export function Join({ staged }: { staged: boolean }) {
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
          <p data-rv={rv} className="t-lead mt-5 text-ink">Every ENP student can apply, in any year and any specialty. Applications open 26 October 2026 at 18:00 and close 5 November at 18:00.</p>
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
              <Faq />
            </div>
          </div>
        </section>
      </div>
      <div className="horizon down" aria-hidden="true" />
    </>
  )
}
