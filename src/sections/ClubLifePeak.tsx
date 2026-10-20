import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import { LogoSymbol } from '../components/LogoSymbol'
import { Photo } from '../components/Photo'
import { LEAD, LEDGER, PEAK_ONE, STACK, TITLE } from '../content/clubLife'
import { photo } from '../content/photos'
import { world } from '../world/store'

// Act 4, the peak (#14), with motion: six screens pinned, photo 1 then a depth stack of ten, the ledger over it.
// Its own chunk with GSAP, loaded after first paint; ClubLife shows the still grid until it arrives.
// With the world's resolve on (html.w-resolve), the points rush into photo 1 and the real photo fades in under them
// (--formed); without it, photo 1 comes in from far on its own, the cut line's fallback (build-plan.md).
gsap.registerPlugin(ScrollTrigger)

// ---------- the sequence ----------

// the act's progress p runs 0..1 over 6 screens; photo i lives from START + i * STEP for LIFE. Ten photos share the
// window seven had (decisions.md, 65): LIFE stays under 2 * STEP, so at most two stack photos are on screen at once.
const START = 0.42
const STEP = 0.05
const LIFE = 0.093

function slot(s: (typeof STACK)[number], i: number): CSSProperties {
  const p = photo(s.id)
  const size = (v: number) => (s.tall ? `calc(${v} * 100lvh * ${p.w / p.h})` : `${v * 100}vw`)
  return {
    '--x': s.d[0],
    '--y': s.d[1],
    '--w': size(s.d[2]),
    '--mx': s.m[0],
    '--my': s.m[1],
    '--mw': size(s.m[2]),
    '--k': 1 + (i % 3),
    aspectRatio: `${p.w} / ${p.h}`,
  } as CSSProperties
}

const sizes = (s: (typeof STACK)[number]) => {
  const v = (n: number) => (s.tall ? `${Math.round(n * 67)}vh` : `${Math.round(n * 100)}vw`)
  return `(max-width: 767px) ${v(s.m[2])}, ${v(s.d[2])}`
}

export default function ClubLifePeak() {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = ref.current!
    const rows = [...root.querySelectorAll('.peak-ledger li')]
    const ticks = [...root.querySelectorAll('.peak-ticks i')]
    let lit = -1
    const ledger = (p: number) => {
      const n = gsap.utils.clamp(0, rows.length - 1, Math.floor((p - 0.44) / (0.53 / rows.length)))
      if (n === lit) return
      lit = n
      rows.forEach((r, i) => r.classList.toggle('on', i === n))
      ticks.forEach((t, i) => t.classList.toggle('on', i <= n))
    }
    ledger(0)

    // shoot.mjs (scroll-craft) compares this between samples to find dead scroll; the hold at .31 to .40 is still on purpose
    const moving = [...root.querySelectorAll<HTMLElement>('.peak-one, .peak-enter, .peak-card, .peak-title, .peak-ledger')]
    const verify = (p: number) => {
      if (!navigator.webdriver) return
      root.dataset.scVerifyState = moving.map((el) => el.style.cssText).join('|')
      root.dataset.scVerifyHold = String(p > 0.31 && p < 0.4)
    }

    // the points resolve into photo 1 where it is laid out, before any transform: its centre and size in the stage
    const one = root.querySelector<HTMLElement>('.peak-one')!
    const measure = () => (world.photo = { cx: one.offsetLeft, cy: one.offsetTop, w: one.offsetWidth, h: one.offsetHeight })
    const ro = new ResizeObserver(measure)
    ro.observe(one)
    measure()

    // the stack leans with the pointer, deeper photos more (bonus only; CSS smooths it)
    const lean = (e: PointerEvent) => {
      root.style.setProperty('--px', `${(e.clientX / innerWidth - 0.5) * 26}px`)
      root.style.setProperty('--py', `${(e.clientY / innerHeight - 0.5) * 16}px`)
    }
    addEventListener('pointermove', lean, { passive: true })

    const mm = gsap.matchMedia(root)
    // matchMedia runs this when any condition matches, and again with the new values when the breakpoint flips
    mm.add({ phone: '(max-width: 767px)', desk: '(min-width: 768px)' }, ({ conditions }) => {
      const phone = !!conditions?.phone
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true, onUpdate: (s) => (ledger(s.progress), verify(s.progress)) },
      })
      tl.set({}, {}, 1) // the timeline is the act's progress, 0..1

      // photo 1: comes in from far and dim (the camera's approach, so the title reads over the night first), rounds
      // its corners once it has formed, holds still, steps aside for the stack, returns
      tl.fromTo('.peak-enter', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, ease: 'power2.inOut', duration: 0.26 }, 0.02)
        .fromTo(root, { '--formed': 0 }, { '--formed': 1, duration: 0.07 }, 0.24)
        .fromTo('.peak-one .peak-dim', { opacity: 0.6 }, { opacity: 0, ease: 'power1.in', duration: 0.27 }, 0.02)
        .fromTo('.peak-one', { '--round': 0 }, { '--round': 1, duration: 0.07 }, 0.24)
        .to('.peak-one', { scale: phone ? 0.92 : 0.78, x: phone ? 0 : () => innerWidth * 0.15, ease: 'power1.inOut', duration: 0.06 }, 0.4)
        .to('.peak-one .peak-dim', { opacity: 0.62, duration: 0.06 }, 0.4)
        .to('.peak-one', { scale: 1, x: 0, ease: 'power1.inOut', duration: 0.06 }, 0.93)
        .to('.peak-one .peak-dim', { opacity: 0, duration: 0.06 }, 0.93)

      // words: the title over the opening, the ledger over the stack. Everything here fades by opacity only: hidden
      // (visibility or display) text and photos would drop out of what screen readers read.
      tl.fromTo('.peak-title', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.05 }, 0.01)
        .to('.peak-title', { opacity: 0, y: -14, duration: 0.06 }, 0.2)
        .fromTo('.peak-ledger', { opacity: 0 }, { opacity: 1, duration: 0.06 }, 0.44)
        .to('.peak-ledger', { opacity: 0, duration: 0.03 }, 0.95)

      // the stack: no two neighbours enter the same way; every photo leaves toward the camera
      root.querySelectorAll<HTMLElement>('.peak-card').forEach((card, i) => {
        const s = START + i * STEP
        const d = LIFE * 0.45
        const img = card.querySelectorAll('img')
        const fade = (dur: number) => tl.fromTo(card, { opacity: 0 }, { opacity: 1, duration: dur }, s)
        tl.set(card, { opacity: 1 }, s) // on from s; the fading entrances below restart it at 0, the exit ends it at 0
        switch (STACK[i].mode) {
          case 'slit':
            tl.fromTo(card.querySelector('.peak-frame'), { clipPath: 'inset(50% 0% 50% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power3.out', duration: d }, s)
            tl.fromTo(img, { scale: 1.2 }, { scale: 1, ease: 'power3.out', duration: d }, s)
            break
          case 'tilt': // swings open on its left edge, like a door toward the viewer
            tl.fromTo(card, { rotationY: 78, transformOrigin: '0% 50%' }, { rotationY: 0, ease: 'power3.out', duration: d }, s)
            tl.set(card, { transformOrigin: '50% 50%' }, s + d) // flat again, so the exit grows from the centre like the rest
            fade(d * 0.3)
            break
          case 'iris': // a circle opens from the middle of the group
            tl.fromTo(card.querySelector('.peak-frame'), { clipPath: 'circle(0% at 50% 52%)' }, { clipPath: 'circle(75% at 50% 52%)', ease: 'power2.inOut', duration: d }, s)
            break
          case 'wipe': // a diagonal edge sweeps across from the right while the photo drifts the other way
            tl.fromTo(
              card.querySelector('.peak-frame'),
              { clipPath: 'polygon(100% 0%, 130% 0%, 130% 100%, 130% 100%)' },
              { clipPath: 'polygon(-30% 0%, 130% 0%, 130% 100%, 0% 100%)', ease: 'power3.out', duration: d },
              s,
            )
            tl.fromTo(img, { xPercent: -8, scale: 1.1 }, { xPercent: 0, scale: 1, ease: 'power3.out', duration: d }, s)
            break
          case 'pan': // opens on the left 60% of the hall and pulls out to the whole room
            tl.fromTo(img, { scale: 1 / 0.6, xPercent: 33.3 }, { scale: 1, xPercent: 0, ease: 'power3.out', duration: d }, s)
            break
          case 'rise':
            tl.fromTo(card, { y: () => innerHeight * 0.6, rotation: -10 }, { y: 0, rotation: 0, ease: 'power3.out', duration: d }, s)
            fade(d / 2)
            break
          case 'lens': // starts at 2x on the faces and pulls back
            tl.fromTo(img, { scale: 2, xPercent: -36 }, { scale: 1, xPercent: 0, ease: 'power3.out', duration: d }, s)
            tl.fromTo(card, { scale: 1.08 }, { scale: 1, ease: 'power3.out', duration: d }, s)
            fade(d * 0.3)
            break
          case 'split': // two halves close in from the sides, then the whole photo takes over (the halves leave a seam)
            tl.fromTo(card.querySelector('.half-l'), { xPercent: -50 }, { xPercent: 0, ease: 'power3.out', duration: d }, s)
            tl.fromTo(card.querySelector('.half-r'), { xPercent: 50 }, { xPercent: 0, ease: 'power3.out', duration: d }, s)
            tl.fromTo(card.querySelector('.whole'), { opacity: 0 }, { opacity: 1, duration: 0.001 }, s + d)
            break
          case 'deal': // swings in from the lower right, off the pile
            tl.fromTo(
              card,
              { x: () => innerWidth * 0.35, y: () => innerHeight * 0.45, rotation: -31, scale: 0.75 },
              { x: 0, y: 0, rotation: 0, scale: 1, ease: 'power3.out', duration: d },
              s,
            )
            fade(d * 0.4)
            break
          case 'fly': // from far back
            tl.fromTo(card, { z: -3800 }, { z: 0, ease: 'power4.out', duration: d }, s)
            fade(d * 0.4)
            break
        }
        tl.to(card, { z: 550, scale: 1.25, opacity: 0, ease: 'power1.in', duration: LIFE * 0.28 }, s + LIFE * 0.72)
      })
    })

    ScrollTrigger.refresh() // this act just replaced its still fallback, so every trigger below it moved
    return () => {
      mm.revert()
      ro.disconnect()
      world.photo = null
      removeEventListener('pointermove', lean)
    }
  }, [])

  return (
    <div ref={ref} className="peak" data-pin data-sc-act="pin">
      <div className="peak-stage" data-sc-stage>
        <div className="peak-one">
          <div className="peak-enter">
            <div className="peak-frame">
              <Photo id={PEAK_ONE} sizes="(max-width: 767px) 100vw, min(96vw, 120vh)" className="peak-img" first />
              <div className="peak-dim" />
            </div>
          </div>
        </div>
        <div className="peak-stack">
          {STACK.map((s, i) => (
            <div key={s.id} className="peak-slot" style={slot(s, i)}>
              <div className="peak-card">
                {s.mode === 'split' ? (
                  <>
                    <div className="peak-frame half-l">
                      <Photo id={s.id} sizes={sizes(s)} className="peak-img" decorative />
                    </div>
                    <div className="peak-frame half-r">
                      <Photo id={s.id} sizes={sizes(s)} className="peak-img" decorative />
                    </div>
                    <div className="peak-frame whole">
                      <Photo id={s.id} sizes={sizes(s)} className="peak-img" />
                    </div>
                  </>
                ) : (
                  <div className="peak-frame">
                    <Photo id={s.id} sizes={sizes(s)} className="peak-img" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="peak-words">
        <div className="peak-title">
          <h2 id="h-life" className="t-act">
            {TITLE}
          </h2>
          <p className="t-lead mt-4 text-gray">{LEAD}</p>
        </div>
        <div className="peak-ledger">
          <ol>
            {LEDGER.map(([name, text, logo]) => (
              <li key={name}>
                <h3>
                  {logo && <LogoSymbol id={logo} />}
                  {name}
                </h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
          <div className="peak-ticks" aria-hidden="true">
            {LEDGER.map(([name]) => (
              <i key={name} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
