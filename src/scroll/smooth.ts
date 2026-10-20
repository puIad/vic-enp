import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { REDUCE } from '../lib/motion'
import { world } from '../world/store'

// Loaded after first paint (App), so GSAP and Lenis stay out of the first view's JS budget (docs/quality.md).
gsap.registerPlugin(ScrollTrigger)

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
  // the hero's hand-over (#11): 0.7 screen in which the copy lifts and fades while the camera dollies into the field.
  // The copy only moves once the world is on screen (.w-ready); tier 0 keeps the still composition.
  const hero = document.getElementById('top')
  if (hero) {
    const hand = (self: ScrollTrigger) => {
      world.hero = self.progress
      const f = gsap.utils.clamp(0, 1, (self.progress - 0.3) / 0.5)
      hero.style.setProperty('--hand', self.progress.toFixed(3))
      hero.style.setProperty('--fade', (f * f * (3 - 2 * f)).toFixed(3))
    }
    triggers.push(ScrollTrigger.create({ trigger: hero, start: 'top top', end: () => `+=${innerHeight * 0.7}`, invalidateOnRefresh: true, onUpdate: hand, onRefresh: hand }))
  }
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
