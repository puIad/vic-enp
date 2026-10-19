import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { REDUCE } from '../lib/motion'

// Loaded after first paint (App), so GSAP and Lenis stay out of the first view's JS budget (docs/quality.md).
gsap.registerPlugin(ScrollTrigger)

/** The page's scroll position as each act sees it (docs/architecture.md, Scroll to world). The world reads this in slice 3. */
export const world = { act: '', progress: 0 }

const ACTS = ['top', 'the-600', 'departments', 'club-life', 'events', 'join', 'apply']

// Lenis and ScrollTrigger on one clock: gsap's ticker drives Lenis, Lenis's scroll events update ScrollTrigger.
// Under reduced motion Lenis never starts and nothing scrubs; the acts render their still compositions instead.
// shortcut: a live switch of the OS setting swaps the acts to their stills but keeps Lenis as it started; a reload settles it.
export function startScroll() {
  document.documentElement.classList.add('sc-ready') // scroll-craft's shoot.mjs waits for this before it samples
  const triggers = ACTS.flatMap((id) => {
    const el = document.getElementById(id)
    if (!el) return []
    const set = (self: ScrollTrigger) => Object.assign(world, { act: id, progress: self.progress })
    // the act holding the viewport's centre line owns the world, so neighbours never overlap
    return [ScrollTrigger.create({ trigger: el, start: 'top center', end: 'bottom center', onUpdate: set, onToggle: (s) => s.isActive && set(s) })]
  })
  if (matchMedia(REDUCE).matches) return () => triggers.forEach((t) => t.kill())

  const lenis = new Lenis({ anchors: true }) // honours the page's scroll-padding-top on its own
  lenis.on('scroll', ScrollTrigger.update)
  const tick = (time: number) => lenis.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  return () => {
    gsap.ticker.remove(tick)
    lenis.destroy()
    triggers.forEach((t) => t.kill())
  }
}
