import { useId, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { INSTAGRAM } from '../config'
import { FAQ, RUNGS, STEPS } from '../content/join'

// Act 6, the light act (#16): how to join, then grow, then the questions, on Bright Gray between two horizons.
// Tier 0: every block visible, every step node filled, no walking point.

function Steps() {
  return (
    <ol id="steps" className="relative mt-12 grid gap-10 max-md:border-l max-md:border-night/30 max-md:pl-7 md:mt-16 md:grid-cols-2 md:gap-x-8 md:gap-y-14 xl:grid-cols-4 xl:border-t xl:border-night/70 xl:pt-0">
      {STEPS.map((s, i) => (
        <li key={s.title} className="relative xl:pt-12">
          {/* the node on the hairline: left edge on a phone, top edge on a wide screen */}
          <span aria-hidden="true" className="absolute top-2 -left-[33px] size-[11px] rounded-full bg-night md:hidden xl:-top-[6px] xl:left-0 xl:block" />
          <span aria-hidden="true" className="block text-[76px] leading-[.9] ghost font-black tracking-[-0.03em] md:text-[clamp(84px,7.5vw,112px)]">
            {String(i + 1).padStart(2, '0')}
          </span>
          <h3 className="mt-4 text-[clamp(22px,1.9vw,27px)] leading-tight font-black tracking-[-0.015em]">{s.title}</h3>
          <p className="mt-2.5 max-w-[30ch] text-[15px] leading-normal text-ink">{s.text}</p>
        </li>
      ))}
    </ol>
  )
}

function Grow() {
  return (
    <ol className="mt-12 grid gap-8 max-md:border-l max-md:border-night/30 max-md:pl-7 md:mt-20 md:grid-cols-3 md:gap-x-6 md:gap-y-12 xl:grid-cols-6 xl:items-end xl:gap-x-5">
      {RUNGS.map((r, i) => (
        <li
          key={r.title}
          // a staircase rising to the right, 34 px a rung (desktop only)
          className="relative xl:mb-(--lift)"
          style={{ '--lift': `${i * 34}px` } as CSSProperties}
        >
          <span aria-hidden="true" className="absolute top-1.5 -left-[33px] size-[11px] rounded-full bg-night md:hidden" />
          <span aria-hidden="true" className="relative hidden h-0.5 bg-night md:block">
            <span
              className={`absolute -top-[4.5px] -left-0.5 size-[11px] rounded-full ${i === RUNGS.length - 1 ? 'bg-aqua ring-2 ring-night' : 'bg-night'}`}
            />
          </span>
          <h3 className="text-[19px] leading-tight font-black md:mt-4">{r.title}</h3>
          <p className="mt-2 max-w-[24ch] text-[15px] leading-normal text-ink">{r.text}</p>
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

export function Join() {
  return (
    <>
      <div className="horizon" aria-hidden="true" />
      <div id="lightact" className="lightact">
        <section id="join" aria-labelledby="h-join" className="wrap pt-10 pb-20 md:pt-14 md:pr-[150px] md:pb-24">
          <h2 id="h-join" className="t-act text-night">
            How to join.
          </h2>
          <p className="t-lead mt-5 text-ink">Every ENP student can apply, in any year and any specialty. Applications open 25 October 2026.</p>
          <Steps />
        </section>

        <section id="grow" aria-labelledby="h-grow" className="wrap border-t border-(--line-dark) py-20 md:mr-[150px] md:ml-(--gut) md:px-0 md:py-28">
          <h2 id="h-grow" className="t-act text-night">
            Then grow.
          </h2>
          <p className="t-lead mt-5 text-ink">Joining is the start. Here is where members go next.</p>
          <Grow />
        </section>

        <section id="faq" aria-labelledby="h-faq" className="wrap border-t border-(--line-dark) pt-20 pb-28 md:mr-[150px] md:ml-(--gut) md:px-0 md:pt-28 md:pb-36">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
              <h2 id="h-faq" className="t-act text-night">
                Questions.
              </h2>
              <p className="t-lead mt-5 text-ink">
                Still unsure? Message us on Instagram, <a href={INSTAGRAM}>@vic.enp</a>.
              </p>
            </div>
            <div className="lg:col-span-8">
              <Faq />
            </div>
          </div>
        </section>
      </div>
      <div className="horizon down" aria-hidden="true" />
    </>
  )
}
