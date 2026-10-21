import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { Arrow } from '../components/ApplyPill'
import { Plain, Words } from '../components/Scrub'
import { ClosePoster, usePhone } from '../components/Poster'
import { ADDRESS, EMAIL, SOCIAL } from '../config'
import type { Cta } from '../lib/opening'
import { mottoProgress, startsByBlock, type Part } from '../lib/scrub'
import { useScrub } from '../lib/useScrub'
import { world } from '../world/store'

// Act 7 (#17). Tier 0 and reduced motion: one still composition, the 600 around a soft clearing (the SVG poster), the
// headline, and the pill with your point already landed in its slot. With the world: a 230svh section pinned on one
// stage; the headline wipes up, the field makes room and rings the slot (World), the pill rises, your point flies in,
// and pressing Apply after the opening sends a wave through the 600 before the link opens.

const sm = (x: number) => {
  const t = Math.min(1, Math.max(0, x))
  return t * t * (3 - 2 * t)
}

/** An element's place inside an ancestor, as laid out: transforms (the pill's rise) don't count. */
function offsetIn(el: HTMLElement, root: HTMLElement) {
  let x = 0
  let y = 0
  for (let e: HTMLElement | null = el; e && e !== root; e = e.offsetParent as HTMLElement | null) {
    x += e.offsetLeft
    y += e.offsetTop
  }
  return { x, y }
}

export function Close({ cta, staged }: { cta: Cta; staged: boolean }) {
  const section = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const pill = useRef<HTMLAnchorElement>(null)
  const slot = useRef<HTMLSpanElement>(null)
  const phone = usePhone()
  const [size, setSize] = useState({ w: 420, h: 64 })
  useLayoutEffect(() => {
    const el = pill.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.offsetWidth, h: el.offsetHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // the clearing is about 36 px wider than the pill on each side on desktop, 10 px on a phone (owner: "smaller and tighter")
  const pad = phone ? 10 : 36

  // the travel: the act's progress into CSS (the wipe, the sub line, the rise), and the slot's place into the world
  useEffect(() => {
    const sec = section.current
    const st = stage.current
    const pl = pill.current
    const sl = slot.current
    if (!staged || !sec || !st || !pl || !sl) return
    const measure = () => {
      const p = offsetIn(pl, st)
      const s = offsetIn(sl, st)
      world.slot = {
        pill: { cx: p.x + pl.offsetWidth / 2, cy: p.y + pl.offsetHeight / 2, w: pl.offsetWidth, h: pl.offsetHeight },
        x: s.x + sl.offsetWidth / 2,
        y: s.y + sl.offsetHeight / 2,
      }
    }
    let last = ''
    const travel = () => {
      const P = world.act === 'apply' ? world.progress : 0
      const v = [sm((P - 0.02) / 0.18), sm((P - 0.1) / 0.18), sm((P - 0.24) / 0.16), sm((P - 0.3) / 0.16)].map((x) => x.toFixed(3))
      const key = v.join()
      if (key === last) return
      last = key
      ;['--l1', '--l2', '--sub', '--rise'].forEach((n, i) => sec.style.setProperty(n, v[i]))
    }
    const ro = new ResizeObserver(measure)
    ro.observe(st)
    ro.observe(pl)
    measure()
    travel()
    world.listeners.add(travel)
    return () => {
      ro.disconnect()
      world.listeners.delete(travel)
      world.slot = null
    }
  }, [staged, cta.open])

  // the Apply moment (after opening, with the world): your point flares, the 600 answer in a wave, then the link opens.
  // Modified clicks open as links do; before opening the pill is a plain link to @vic.enp.
  const apply = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!cta.open || !staged || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return
    e.preventDefault()
    world.wave = performance.now()
    e.currentTarget.classList.add('sent')
    const href = e.currentTarget.href
    setTimeout(() => location.assign(href), 700)
  }

  const body = (
    <>
      <h2 id="h-close" className="close-head text-[clamp(44px,5vw,72px)] leading-[.98] font-black tracking-[-0.02em] text-white">
        <span className="close-l1 block">
          <span>Your point</span>
        </span>{' '}
        <span className="close-l2 block">
          <span>is on its way.</span>
        </span>
      </h2>
      {cta.open && <p className="close-sub t-lead mt-5 text-gray">Every ENP student can apply, any year, any specialty.</p>}

      <div id="close-cta" className="close-cta relative mt-[clamp(72px,18svh,200px)] flex justify-center">
        {!staged && <ClosePoster clearW={size.w + pad * 2 + 40} clearH={size.h + pad * 2 + 30} />}
        <a
          ref={pill}
          href={cta.href}
          onClick={apply}
          className={`pill close-pill relative min-h-16 gap-3.5 py-2.5 pr-3 pl-3 text-[17px] whitespace-normal md:text-[19px] ${cta.open ? '' : 'max-md:max-w-[320px]'}`}
        >
          {/* the slot where your point lands: an empty 40 px place with no ring of its own (the 600 ring it) */}
          <span ref={slot} aria-hidden="true" className="close-slot relative grid size-10 flex-none place-items-center">
            <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgb(105_196_175/.55)_0,rgb(105_196_175/.18)_45%,transparent_70%)]" />
            <span className="relative size-[7px] rounded-full bg-white shadow-[0_0_10px_2px_#69c4af]" />
          </span>
          <span className="text-left">{cta.label}</span>
          {cta.open ? (
            <span className="go ml-2 !size-10">
              <Arrow />
            </span>
          ) : (
            <span className="chip ml-1">
              <span className="sr-only">in </span>
              {cta.chip}
            </span>
          )}
        </a>
      </div>
    </>
  )

  if (!staged)
    return (
      <section ref={section} id="apply" aria-labelledby="h-close" className="relative z-[2] flex min-h-svh flex-col items-center overflow-hidden px-(--edge) pt-[15svh] pb-[16svh] text-center md:pl-(--gut)">
        {body}
      </section>
    )
  return (
    <section ref={section} id="apply" aria-labelledby="h-close" className="close staged relative z-[2]" data-pin data-sc-act="pin">
      <div ref={stage} className="close-stage flex flex-col items-center px-(--edge) pt-[15svh] text-center md:pl-(--gut)" data-sc-stage>
        {body}
      </div>
    </section>
  )
}

function Links({ title, links }: { title: string; links: readonly { label: string; note?: string; href: string }[] }) {
  return (
    <div>
      <h3 className="text-[13px] font-bold text-mute">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <a href={l.href} className="inline-flex min-h-7 flex-col items-start gap-x-2 text-[17px] sm:flex-row sm:items-baseline text-white no-underline decoration-aqua underline-offset-4 hover:underline">
              {l.label}
              {l.note && <span className="text-[13px] text-mute">{l.note}</span>}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

// The closing motto (#36, decisions.md, 62): the same word scrub as act 2's title, so the page opens and closes on one device.
// Each word lights over a quarter of the motto's progress, the last one whole as the page ends.
const MOTTO: Part[][] = [['Once a VICer,'], ['Always a VICer.']]
const MOTTO_AT = startsByBlock(MOTTO, 0, 0.75)
const mottoAt = (el: HTMLElement) =>
  mottoProgress(scrollY, el.getBoundingClientRect().top + scrollY, el.offsetHeight, innerHeight, document.documentElement.scrollHeight - innerHeight)
const mottoState = (k: number) => `motto ${MOTTO_AT.flat().filter((a) => k > a).length} of ${MOTTO_AT.flat().length}, whole ${k >= 1}`

export function Footer({ staged = false }: { staged?: boolean }) {
  const motto = useRef<HTMLParagraphElement>(null)
  useScrub(motto, staged, mottoAt, mottoState)
  return (
    <footer id="footer" data-sc-act="flow" className="relative z-[2] border-t border-(--line) bg-night pt-20 pr-(--edge) pb-[88px] pl-(--gut) md:pt-28 md:pb-24">
      <div className="grid gap-12 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-4 lg:col-span-3">
          {/* no description line: act 2 says it (decisions.md, 58) */}
          <img src="/brand/vic-logo-white.svg" alt="Vision & Innovation Club" width="110" height="44" className="h-11 w-auto" />
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:col-span-8 md:grid-cols-3 lg:col-span-8 lg:col-start-5">
          <div className="space-y-10">
            <Links title="Instagram" links={SOCIAL.instagram} />
            <div>
              <h3 className="text-[13px] font-bold text-mute">Contact</h3>
              <address className="mt-4 space-y-2.5 text-[17px] not-italic">
                <a href={`mailto:${EMAIL}`} className="block text-white decoration-aqua underline-offset-4 hover:underline">
                  {EMAIL}
                </a>
                <p className="max-w-[24ch] text-balance text-gray">{ADDRESS}</p>
              </address>
            </div>
          </div>
          <Links title="Facebook" links={SOCIAL.facebook} />
          <Links title="More" links={SOCIAL.more} />
        </div>
      </div>
      <p ref={motto} className={`motto t-display mt-20 border-t border-(--line) pt-14 md:mt-24 md:pt-20 ${staged ? 'staged' : ''}`}>
        {staged ? (
          <>
            <span className="sr-only">{MOTTO.flat().join(' ')}</span>
            <span aria-hidden="true">
              {MOTTO.map((line, i) => (
                <span key={i} className="block">
                  <Words parts={line} starts={MOTTO_AT[i]} read={false} />
                </span>
              ))}
            </span>
          </>
        ) : (
          <>
            <span className="block">
              <Plain parts={MOTTO[0]} />
            </span>{' '}
            <Plain parts={MOTTO[1]} />
          </>
        )}
      </p>
    </footer>
  )
}
