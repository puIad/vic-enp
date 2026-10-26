// /apply's scroll (owner, 26 Oct): the envelope that opens under the candidate's scroll, the night's three star layers,
// the road that inks itself down the stops, and each stop lifting in as it arrives. CSS 3D only, no WebGL: transforms
// and opacity, one frame loop while the page moves. Tier 0 and reduced motion never start it, and a returning
// candidate finds the letter already open: no envelope, nothing moving (apply.css). The pose maths is pure and tested
// (scroll.test.ts); the rest only writes it to the page.

/** 0 to 1: how far `x` is between `a` and `b` */
export const seg = (x: number, a: number, b: number) => Math.min(1, Math.max(0, (x - a) / (b - a)))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** ease in and out, cubic */
export const inOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
/** ease out, cubic */
export const easeOut = (t: number) => 1 - (1 - t) ** 3

/** The desk's measures in px: the letter's width and height, and the envelope's height and top. */
export type Desk = { w: number; h: number; envH: number; envTop: number }

/** The envelope's height for a letter folded in thirds: a letter's proportion, never shorter than a third plus a margin. */
export function deskOf(w: number, h: number): Desk {
  const envH = Math.round(Math.max(w * 0.62, h / 3 + 30))
  return { w, h, envH, envTop: Math.round(h / 3 + 34) }
}

/** Where every piece sits at progress `p`: 0 the envelope arrives address up, 1 the letter lies open and flat. */
export type Pose = {
  /** the envelope: offset, depth, tilt, size, the flip that turns it over (0 address up, 180 seal up), opacity */
  env: { y: number; z: number; rx: number; rz: number; scale: number; flip: number; opacity: number }
  /** the flap, in degrees about the envelope's top edge: 0 closed, 180 open */
  flap: number
  /** the seal's crack, 0 whole to 1 broken apart, and its opacity */
  crack: number
  seal: number
  /** the folded letter: its top's offset in the desk, and whether it has come out in front of the envelope */
  letter: { y: number; front: boolean }
  /** the letter's lower two thirds unfolding, in degrees: -178 folded up behind the third above, 0 flat */
  fold2: number
  fold3: number
  /** the letter lies open: the real article shows and the folded copy goes */
  open: boolean
}

export function pose(p: number, d: Desk): Pose {
  const flip = inOut(seg(p, 0, 0.2))
  const tilt = easeOut(seg(p, 0, 0.3))
  const crack = easeOut(seg(p, 0.2, 0.3))
  const flap = inOut(seg(p, 0.26, 0.44))
  const rise = inOut(seg(p, 0.42, 0.62))
  const sink = inOut(seg(p, 0.62, 0.76))
  const u2 = inOut(seg(p, 0.72, 0.86))
  const u3 = inOut(seg(p, 0.82, 0.97))

  // the envelope starts high on the desk, under the title, and slides down off the letter as it rises, then sinks away
  const centre = -(d.envTop - d.h * 0.12)
  const envY = lerp(centre, 0, rise) + sink * d.envH * 0.6
  // the folded letter's top, inside the pocket at first, then out above the envelope, then at the desk's top
  const inside = envY + d.envTop + 14
  const out = d.envTop - d.h / 3 - 14
  const risen = lerp(inside, out, rise)

  return {
    env: {
      y: envY,
      z: -sink * 200,
      rx: lerp(26, 0, tilt) + sink * 24,
      rz: lerp(-4, 0, tilt),
      // a touch smaller while it lies tilted, so its near corner stays inside a phone's edge
      scale: lerp(0.9, 1, tilt),
      flip: flip * 180,
      opacity: 1 - seg(sink, 0.35, 1),
    },
    flap: flap * 180,
    crack,
    seal: 1 - seg(p, 0.28, 0.36),
    letter: { y: lerp(risen, 0, sink), front: rise >= 1 },
    fold2: lerp(-178, 0, u2),
    fold3: lerp(-178, 0, u3),
    open: p >= 0.97,
  }
}

/** 0 to 1: how far the road is inked, the ink's tip at the viewport's middle */
export function inked(roadTop: number, roadHeight: number, viewport: number): number {
  return roadHeight > 0 ? Math.min(1, Math.max(0, (viewport * 0.55 - roadTop) / roadHeight)) : 0
}

/** each star layer's drift, in px, wrapped to its tile so the layer never runs out */
export const drift = (scrollY: number, rate: number, tile: number) => -((scrollY * rate) % tile)

const $ = <T extends HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as T

/**
 * The envelope on the desk: its pieces, the folded copy of the letter, and the measures they move by. `changed` asks
 * for a frame when the letter's size changes (a font arriving, a turned phone).
 */
function envelope(changed: () => void) {
  const open = $('#open')
  const desk = $('.ap-desk', open)
  const letter = $<HTMLElement>('.ap-letter', desk)
  const run = $('.ap-open-run', open)
  const face = $('.ap-env-face', desk)
  const back = [...desk.querySelectorAll<HTMLElement>('.ap-env-back, .ap-env-pocket')]
  const flap = $('.ap-env-flap', desk)
  const seal = $('.ap-env-seal', desk)
  const halves = [...seal.querySelectorAll<HTMLElement>('.ap-wax-half')]
  const fold = $('.ap-fold', desk)

  // the folded letter: three panels hinged top to bottom, each a window on a copy of the real letter
  const panels: HTMLElement[] = []
  let parent: HTMLElement = fold
  for (let i = 0; i < 3; i++) {
    const panel = document.createElement('div')
    panel.className = 'ap-fold-p'
    const faceEl = document.createElement('div')
    faceEl.className = 'ap-fold-face'
    const copy = letter.cloneNode(true) as HTMLElement
    copy.removeAttribute('aria-label')
    copy.classList.add('is-copy')
    faceEl.append(copy)
    const backEl = document.createElement('div')
    backEl.className = 'ap-fold-back'
    panel.append(faceEl, backEl)
    parent.append(panel)
    panels.push(panel)
    parent = panel
  }
  const copies = panels.map((p) => $<HTMLElement>('.is-copy', p))

  let d = deskOf(1, 1)
  let last = -1
  // from the first pixel of scroll to the end of the run, the stage held still for the run; measured here, not per frame
  let span = 1
  const measure = () => {
    d = deskOf(letter.offsetWidth, letter.offsetHeight)
    span = open.offsetTop + run.offsetHeight
    desk.style.setProperty('--lh', `${d.h}px`)
    desk.style.setProperty('--env-h', `${d.envH}px`)
    desk.style.setProperty('--env-top', `${d.envTop}px`)
    copies.forEach((c, i) => (c.style.transform = `translateY(${(-i * d.h) / 3}px)`))
    last = -1
    changed()
  }
  measure()
  new ResizeObserver(measure).observe(letter)
  addEventListener('resize', measure)

  return (scrollY: number) => {
    const p = Math.min(1, Math.max(0, scrollY / span))
    if (Math.abs(p - last) < 0.0005) return
    last = p
    const s = pose(p, d)
    const e = s.env
    const base = `translate3d(0,${e.y.toFixed(1)}px,${e.z.toFixed(1)}px) rotateX(${e.rx.toFixed(2)}deg) rotateZ(${e.rz.toFixed(2)}deg) scale(${e.scale.toFixed(3)})`
    const turned = e.flip >= 90
    face.style.transform = `${base} rotateY(${e.flip.toFixed(2)}deg)`
    const backT = `${base} rotateY(${(e.flip - 180).toFixed(2)}deg)`
    for (const b of back) b.style.transform = backT
    // the flap turns about the envelope's top edge (its box is the whole envelope, its origin the centre)
    const hinge = `${backT} translateY(${-d.envH / 2}px) rotateX(${s.flap.toFixed(2)}deg) translateY(${d.envH / 2}px)`
    flap.style.transform = hinge
    seal.style.transform = hinge
    halves.forEach((h, i) => {
      const side = i ? 1 : -1
      h.style.transform = `translate(${(side * s.crack * 9).toFixed(1)}px,${(s.crack * 8).toFixed(1)}px) rotate(${(side * s.crack * 16).toFixed(1)}deg)`
    })
    seal.style.opacity = String(s.seal)
    for (const el of [face, ...back, flap]) el.style.opacity = String(e.opacity)
    fold.style.transform = `translate3d(0,${s.letter.y.toFixed(1)}px,0)`
    panels[1].style.transform = `rotateX(${s.fold2.toFixed(2)}deg)`
    panels[2].style.transform = `rotateX(${s.fold3.toFixed(2)}deg)`
    desk.classList.toggle('is-turned', turned)
    desk.classList.toggle('is-flap-open', s.flap >= 90)
    desk.classList.toggle('is-out', s.letter.front)
    // the folded letter shows once the flap starts to lift: before, it is shut inside
    desk.classList.toggle('is-opening', s.flap > 0)
    desk.classList.toggle('is-unfold2', s.fold2 > -178)
    desk.classList.toggle('is-unfold3', s.fold3 > -178)
    desk.classList.toggle('is-open', s.open)
  }
}

/** The road down the stops: the ink's length, and each pin it has reached lights. */
function road() {
  const el = $('#letter')
  const pins = [...el.querySelectorAll<HTMLElement>('.ap-pin')]
  return () => {
    // every read before any write, so the frame costs one style pass
    const r = el.getBoundingClientRect()
    const tops = pins.map((pin) => (pin.offsetParent === null ? Infinity : pin.getBoundingClientRect().top))
    const v = inked(r.top, r.height, innerHeight)
    const tip = r.top + v * r.height
    el.style.setProperty('--ink', v.toFixed(4))
    pins.forEach((pin, i) => pin.classList.toggle('is-inked', tops[i] + 15 <= tip))
  }
}

/** Each stop lifts in from a slight tilt the first time it comes into view, and then never moves again. */
function lift() {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries)
        if (e.isIntersecting) {
          e.target.classList.remove('is-away')
          io.unobserve(e.target)
        }
    },
    { rootMargin: '0px 0px -12% 0px' },
  )
  const watch = () => {
    for (const stop of document.querySelectorAll<HTMLElement>('.ap-stop:not(.is-locked):not([data-lift])')) {
      stop.dataset.lift = ''
      if (stop.getBoundingClientRect().top > innerHeight * 0.88) {
        stop.classList.add('is-away')
        io.observe(stop)
      }
    }
  }
  return watch
}

/**
 * Starts the scroll. `envelope` false skips the envelope (a candidate coming back to a draft or a ticket on its way):
 * the letter lies open at once. Returns `unlocked`, for main.ts to call when the stops open after the ticket.
 */
export function startScroll({ envelope: withEnvelope }: { envelope: boolean }): { unlocked: () => void } {
  const root = document.documentElement
  root.dataset.scroll = withEnvelope ? 'envelope' : 'open'
  // each layer's rate, and its tile (apply.css --tile) so the drift wraps without a seam
  const stars = [...document.querySelectorAll<HTMLElement>('.ap-stars')].map((el, i) => ({
    el,
    rate: [0.03, 0.08, 0.16][i] ?? 0.1,
    tile: parseFloat(getComputedStyle(el).getPropertyValue('--tile')) || 400,
  }))
  let queued = false
  const queue = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(frame)
  }
  const env = withEnvelope ? envelope(queue) : null
  const ink = road()
  const watch = lift()

  function frame() {
    queued = false
    const y = scrollY
    // the road reads layout, so it goes before the writes; the envelope only writes
    ink()
    for (const s of stars) s.el.style.transform = `translate3d(0,${drift(y, s.rate, s.tile).toFixed(1)}px,0)`
    env?.(y)
  }
  addEventListener('scroll', queue, { passive: true })
  addEventListener('resize', queue)
  frame()
  watch()
  return {
    unlocked: () => {
      watch()
      queue()
    },
  }
}
