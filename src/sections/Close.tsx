import { useLayoutEffect, useRef, useState } from 'react'
import { Arrow } from '../components/ApplyPill'
import { ClosePoster, usePhone } from '../components/Poster'
import { ADDRESS, EMAIL, SOCIAL } from '../config'
import type { Cta } from '../lib/opening'

// Act 7 (#17), tier 0: one still composition. The 600 around a soft clearing, the headline, and the pill with
// your point already landed in its slot. No wipe, flight, lean or wave.

export function Close({ cta }: { cta: Cta }) {
  const pill = useRef<HTMLAnchorElement>(null)
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

  return (
    <section id="apply" aria-labelledby="h-close" className="relative z-[2] flex min-h-svh flex-col items-center overflow-hidden px-(--edge) pt-[15svh] pb-[16svh] text-center md:pl-(--gut)">
      <h2 id="h-close" className="text-[clamp(44px,5vw,72px)] leading-[.98] font-black tracking-[-0.02em] text-white">
        <span className="block">Your point</span> is on its way.
      </h2>
      {cta.open && <p className="t-lead mt-5 text-gray">Every ENP student can apply, any year, any specialty.</p>}

      <div id="close-cta" className="relative mt-[clamp(72px,18svh,200px)] flex justify-center">
        <ClosePoster clearW={size.w + pad * 2 + 40} clearH={size.h + pad * 2 + 30} />
        <a
          ref={pill}
          href={cta.href}
          className={`pill relative min-h-16 gap-3.5 py-2.5 pr-3 pl-3 text-[17px] whitespace-normal md:text-[19px] ${cta.open ? '' : 'max-md:max-w-[320px]'}`}
        >
          {/* the slot where your point lands: an empty 40 px place with no ring around it */}
          <span aria-hidden="true" className="relative grid size-10 flex-none place-items-center">
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

export function Footer() {
  return (
    <footer id="footer" className="relative z-[2] border-t border-(--line) bg-night pt-20 pr-(--edge) pb-[88px] pl-(--gut) md:pt-28 md:pb-24">
      <div className="grid gap-12 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-4 lg:col-span-3">
          <img src="/brand/vic-logo-white.svg" alt="Vision & Innovation Club" width="110" height="44" className="h-11 w-auto" />
          <p className="t-cap mt-5 max-w-[34ch] text-[14px]">
            A nonprofit, English-speaking scientific club at ENP, since 2014. A branch of the El-Maarifa Scientific Association.
          </p>
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
                <p className="max-w-[24ch] text-gray">{ADDRESS}</p>
              </address>
            </div>
          </div>
          <Links title="Facebook" links={SOCIAL.facebook} />
          <Links title="More" links={SOCIAL.more} />
        </div>
      </div>
      <p className="t-display mt-20 border-t border-(--line) pt-14 md:mt-24 md:pt-20">
        <span className="block">Once a VICer,</span> Always a VICer.
      </p>
    </footer>
  )
}
